/*
 * Copyright 2011 Future Systems
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.araqne.webconsole.servlet;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Queue;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ConcurrentMap;

import javax.servlet.AsyncContext;
import javax.servlet.AsyncEvent;
import javax.servlet.AsyncListener;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Invalidate;
import org.apache.felix.ipojo.annotations.Provides;
import org.apache.felix.ipojo.annotations.Requires;
import org.apache.felix.ipojo.annotations.Validate;
import org.araqne.httpd.HttpContext;
import org.araqne.httpd.HttpService;
import org.araqne.msgbus.AbstractSession;
import org.araqne.msgbus.Message;
import org.araqne.msgbus.Message.Type;
import org.araqne.msgbus.MessageBus;
import org.araqne.msgbus.Session;
import org.araqne.webconsole.CometMonitor;
import org.araqne.webconsole.impl.AraqneMessageDecoder;
import org.araqne.webconsole.impl.AraqneMessageEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(name = "webconsole-msgbus-servlet")
@Provides(specifications = { CometMonitor.class })
public class MsgbusServlet extends HttpServlet implements Runnable, CometMonitor {
	private static final long serialVersionUID = 1L;
	private final Logger logger = LoggerFactory.getLogger(MsgbusServlet.class);

	/**
	 * msgbus session id to waiting async context mappings
	 */
	private ConcurrentMap<String, AsyncContext> contexts;

	/**
	 * msgbus session id to pending messages mappings
	 */
	private ConcurrentMap<String, Queue<String>> pendingQueues;

	/**
	 * pending msgbus requests
	 */
	private ConcurrentMap<String, HttpServletResponse> pendingRequests;

	@Requires
	private MessageBus msgbus;

	@Requires
	private HttpService httpd;

	/**
	 * periodic blocking checker
	 */
	private Thread t;

	private boolean doStop;

	public MsgbusServlet() {
		contexts = new ConcurrentHashMap<String, AsyncContext>();
		pendingQueues = new ConcurrentHashMap<String, Queue<String>>();
		pendingRequests = new ConcurrentHashMap<String, HttpServletResponse>();
	}

	public void setMessageBus(MessageBus msgbus) {
		this.msgbus = msgbus;
	}

	public void setHttpService(HttpService httpd) {
		this.httpd = httpd;
	}

	@Validate
	public void start() {
		doStop = false;
		HttpContext ctx = httpd.ensureContext("webconsole");
		ctx.addServlet("msgbus", this, "/msgbus/*");

		t = new Thread(this, "Msgbus Push");
		t.start();
	}

	@Invalidate
	public void stop() {
		if (httpd != null) {
			HttpContext ctx = httpd.ensureContext("webconsole");
			ctx.removeServlet("msgbus");
		}
		doStop = true;
		t.interrupt();
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		Session session = ensureSession(req);

		if (req.getPathInfo().equals("/trap")) {
			Queue<String> q = pendingQueues.get(session.getGuid());
			if (q != null && !q.isEmpty()) {
				logger.trace("araqne webconsole: flush queued traps [session={}]", session.getGuid());
				flushTraps(q, resp.getOutputStream());
			} else {
				if (contexts.containsKey(session.getGuid())) {
					logger.trace("araqne webconsole: other trap is waiting. ignore this request.");
					return;
				}

				logger.trace("araqne webconsole: waiting msgbus trap [session={}]", session.getGuid());
				AsyncContext aCtx = req.startAsync();
				AsyncContext old = contexts.putIfAbsent(session.getGuid(), aCtx);
				if (old != null) {
					aCtx.complete();
					logger.trace("araqne webconsole: other trap is waiting. ignore this request.");
				} else {
					aCtx.addListener(new AsyncFinalizer(session.getGuid()));
				}
			}
		}
	}

	@Override
	protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String sessionId = req.getSession().getId();
		logger.debug("araqne webconsole: msgbus post from http session [{}], data [{}]", sessionId,
				formatSessionData(req.getSession()));

		if (req.getPathInfo().equals("/request")) {
			Session session = ensureSession(req);

			ByteArrayOutputStream os = new ByteArrayOutputStream();
			byte[] b = new byte[4096];

			while (true) {
				int readBytes = req.getInputStream().read(b);
				if (readBytes < 0)
					break;

				os.write(b, 0, readBytes);
			}

			String text = os.toString("utf-8");
			if (text != null && text.trim().isEmpty()) {
				logger.debug("araqne webconsole: empty text from [{}], request [{}]", req.getRemoteAddr(), req.getRequestURI());
				resp.sendError(500);
				return;
			}

			Message msg = AraqneMessageDecoder.decode(session, text);
			pendingRequests.putIfAbsent(msg.getGuid(), resp);

			msgbus.execute(session, msg);
		}
	}

	private Session ensureSession(HttpServletRequest req) throws UnknownHostException {
		String sessionId = req.getSession().getId();
		logger.trace("araqne webconsole: using http session [{}]", sessionId);

		Session session = msgbus.getSession(sessionId);
		if (session == null) {
			session = new HttpMsgbusSession(sessionId, InetAddress.getByName(req.getRemoteAddr()), InetAddress.getByName(req
					.getLocalAddr()));
			msgbus.openSession(session);
		}
		return session;
	}

	@Override
	public void run() {
		try {
			logger.info("araqne webconsole: msgbus push thread started");
			while (!doStop) {
				try {
					runOnce();
					Thread.sleep(100);
				} catch (InterruptedException e) {
					logger.info("araqne webconsole: msgbus push thread interrupted");
				}
			}
		} finally {
			logger.info("araqne webconsole: msgbus push thread stopped");
		}
	}

	private void runOnce() throws InterruptedException {
		for (String sessionId : contexts.keySet()) {
			Queue<String> frames = pendingQueues.get(sessionId);
			if (frames == null || frames.size() == 0)
				continue;

			flushAsyncTraps(sessionId, frames);
		}
	}

	private void flushAsyncTraps(String sessionId, Queue<String> frames) {
		AsyncContext ctx = contexts.get(sessionId);
		if (ctx == null)
			return;

		try {
			synchronized (ctx) {
				OutputStream os = ctx.getResponse().getOutputStream();
				flushTraps(frames, os);
			}
		} catch (IOException e) {
			logger.error("araqne webconsole: cannot send pending msg", e);
		} finally {
			logger.debug("araqne webconsole: waiting complete session={}", sessionId);
			ctx.complete();
			contexts.remove(sessionId);
		}
	}

	private void flushTraps(Queue<String> frames, OutputStream os) throws IOException, UnsupportedEncodingException {
		os.write("[".getBytes());
		int i = 0;
		while (true) {
			String frame = frames.poll();
			if (frame == null)
				break;

			if (i != 0)
				os.write(",".getBytes());

			logger.trace("araqne webconsole: trying to send pending frame [{}]", frame);
			os.write(frame.getBytes("utf-8"));
			i++;
		}
		os.write("]".getBytes());
	}

	private class HttpMsgbusSession extends AbstractSession {
		private String sessionId;
		private InetAddress remoteAddr;
		private InetAddress localAddr;

		public HttpMsgbusSession(String sessionId, InetAddress remoteAddr, InetAddress localAddr) {
			this.sessionId = sessionId;
			this.remoteAddr = remoteAddr;
			this.localAddr = localAddr;
		}

		@Override
		public String getGuid() {
			return sessionId;
		}

		@Override
		public InetAddress getLocalAddress() {
			return localAddr;
		}

		@Override
		public InetAddress getRemoteAddress() {
			return remoteAddr;
		}

		@Override
		public void send(Message msg) {
			if (msg.getType() == Type.Trap) {

				pendingQueues.putIfAbsent(msg.getSession(), new ConcurrentLinkedQueue<String>());
				Queue<String> frames = pendingQueues.get(msg.getSession());
				String payload = AraqneMessageEncoder.encode(this, msg);
				frames.add(payload);

				if (contexts.containsKey(msg.getSession())) {
					logger.debug("araqne webconsole: sending trap immediately [session={}, payload={}]", msg.getSession(),
							payload);
					flushAsyncTraps(msg.getSession(), frames);
				} else
					logger.debug("araqne webconsole: queueing trap [session={}, payload={}]", msg.getSession(), payload);
			} else if (msg.getType() == Type.Response) {
				HttpServletResponse resp = pendingRequests.remove(msg.getRequestId());
				if (resp != null) {
					Session session = msgbus.getSession(sessionId);
					if (session != null) {
						String payload = AraqneMessageEncoder.encode(session, msg);
						try {
							logger.trace("araqne webconsole: trying to send response [{}]", payload);
							resp.getOutputStream().write(payload.getBytes("utf-8"));
						} catch (IOException e) {
							logger.error("araqne webconsole: cannot send response [{}]", payload);
						} finally {
							try {
								resp.getOutputStream().close();
							} catch (IOException e) {
								logger.error("araqne webconsole: cannot close http response stream", e);
							}
						}
					} else {
						logger.error("araqne webconsole: msgbus session [{}] not found", sessionId);
					}
				} else {
					logger.error("araqne webconsole: http response lost for msgbus req [{}]", msg.getRequestId());
				}

			}
		}

		@Override
		public String toString() {
			SimpleDateFormat f = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
			return "msgbus session=" + sessionId + ", admin=" + getAdminLoginName() + ", remote=" + getRemoteAddress()
					+ ", created=" + f.format(getCreatedTime()) + ", last access=" + f.format(getLastAccessTime());
		}
	}

	private static String formatSessionData(HttpSession session) {
		String sessiondata = "";
		if (session != null) {
			SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
			Date since = new Date(session.getCreationTime());
			Date lastAccess = new Date(session.getLastAccessedTime());
			sessiondata = String.format("jsession=%s, since=%s, lastaccess=%s", session.getId(), dateFormat.format(since),
					dateFormat.format(lastAccess));
		}
		return sessiondata;
	}

	@Override
	public Set<String> getSessionKeys() {
		return contexts.keySet();
	}

	@Override
	public AsyncContext getAsyncContext(String sessionKey) {
		return contexts.get(sessionKey);
	}

	@Override
	public String toString() {
		return "async contexts=" + contexts;
	}

	private class AsyncFinalizer implements AsyncListener {
		private String sessionKey;

		public AsyncFinalizer(String sessionKey) {
			this.sessionKey = sessionKey;
		}

		@Override
		public void onStartAsync(AsyncEvent event) throws IOException {
		}

		@Override
		public void onComplete(AsyncEvent event) throws IOException {
			logger.debug("araqne webconsole: removed async session [{}] on complete", sessionKey);
			contexts.remove(sessionKey);
		}

		@Override
		public void onTimeout(AsyncEvent event) throws IOException {
			logger.debug("araqne webconsole: removed async session [{}] on timeout", sessionKey);
			contexts.remove(sessionKey);
		}

		@Override
		public void onError(AsyncEvent event) throws IOException {
			logger.debug("araqne webconsole: removed async session [{}] on error", sessionKey);
			contexts.remove(sessionKey);
		}
	}
}

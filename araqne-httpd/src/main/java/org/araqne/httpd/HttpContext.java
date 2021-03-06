/*
 * Copyright 2012 Future Systems
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
package org.araqne.httpd;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

import javax.servlet.AsyncContext;
import javax.servlet.AsyncEvent;
import javax.servlet.AsyncListener;
import javax.servlet.Servlet;
import javax.servlet.ServletContext;
import javax.servlet.ServletRegistration;
import javax.servlet.ServletRequest;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.araqne.httpd.impl.Request;
import org.araqne.httpd.impl.Response;
import org.araqne.httpd.impl.ServletContextImpl;
import org.araqne.httpd.impl.ServletMatchResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HttpContext {
	private final Logger logger = LoggerFactory.getLogger(HttpContext.class.getName());

	private String name;
	private ServletContextImpl servletContext;
	private WebSocketManager webSocketManager;
	private ConcurrentMap<String, HttpSession> httpSessions;

	// remote addr:port to async contexts
	private ConcurrentMap<String, AsyncContext> asyncContexts;

	public HttpContext(String name) {
		this.name = name;
		this.servletContext = new ServletContextImpl(name, "/", "");
		this.webSocketManager = new WebSocketManager();
		this.httpSessions = new ConcurrentHashMap<String, HttpSession>();
		this.asyncContexts = new ConcurrentHashMap<String, AsyncContext>();
	}

	public HttpContext(String name, String contextPath) {
		this.name = name;
		this.servletContext = new ServletContextImpl(name, contextPath, "");
		this.webSocketManager = new WebSocketManager();
		this.httpSessions = new ConcurrentHashMap<String, HttpSession>();
		this.asyncContexts = new ConcurrentHashMap<String, AsyncContext>();
	}

	public void handle(Request request, Response response) throws IOException {
		request.setHttpContext(this);
		HttpServlet servlet = null;
		String pathInfo = null;

		String uri = request.getRequestURI();
		logger.trace("araqne httpd: request [{} {}]", request.getMethod(), uri);

		boolean isWebSocket = webSocketManager.getPath().equals(uri);
		try {
			String servletPath = null;
			ServletMatchResult r = servletContext.matches(uri);
			if (isWebSocket) {
				servlet = webSocketManager.getServlet();
				servletPath = webSocketManager.getPath();
				pathInfo = uri.substring(uri.indexOf(servletPath) + servletPath.length());
			} else if (r != null) {
				servlet = (HttpServlet) r.getServlet();
				pathInfo = r.getPathInfo();
				servletPath = r.getServletPath();
			} else {
				String contextPath = request.getContextPath();
				if (!contextPath.equals("")) {
					request.setPathInfo(uri.substring(uri.indexOf(contextPath) + contextPath.length()));
				} else {
					request.setPathInfo(uri);
				}

				response.sendError(HttpServletResponse.SC_NOT_FOUND);
				return;
			}

			logger.trace("araqne httpd: servlet path is [{}]", servletPath);
			request.setServletPath(servletPath);
			request.setPathInfo(pathInfo);

			servlet.service(request, response);
		} catch (FileNotFoundException e) {
			response.sendError(HttpServletResponse.SC_NOT_FOUND);
		} catch (Throwable t) {
			logger.error("araqne httpd: servlet error", t);
			response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
		} finally {
			if (request.isAsyncStarted()) {
				AsyncContext aCtx = request.getAsyncContext();
				aCtx.addListener(new AsyncContextCloser());
				String remote = getRemoteAddress(request);
				asyncContexts.put(remote, aCtx);

				if (logger.isDebugEnabled())
					logger.debug("araqne httpd: put http context's async context, remote addr={}", remote);
			}

			if (response != null && !request.isAsyncStarted() && !isWebSocket)
				response.close();
		}
	}

	public String getName() {
		return name;
	}

	public ServletContext getServletContext() {
		return servletContext;
	}

	public WebSocketManager getWebSocketManager() {
		return webSocketManager;
	}

	public ConcurrentMap<String, HttpSession> getHttpSessions() {
		return httpSessions;
	}

	public void addServlet(String name, Servlet servlet, String... urlPatterns) {
		servletContext.addServlet(name, servlet);
		ServletRegistration reg = servletContext.getServletRegistration(name);
		reg.addMapping(urlPatterns);
	}

	public boolean removeServlet(String name) {
		return servletContext.removeServlet(name);
	}

	public void onConnectionClosed(InetSocketAddress remote) {
		logger.trace("araqne httpd: client connection closed, remote addr={}", remote);
		String remoteAddr = remote.getAddress().getHostAddress() + ":" + remote.getPort();
		AsyncContext ctx = asyncContexts.remove(remoteAddr);
		if (ctx != null)
			ctx.complete();

		webSocketManager.unregister(remote);
	}

	@Override
	public String toString() {
		return "HTTP Context [" + name + ", sessions=" + httpSessions.size() + "]\n>>\n" + servletContext + webSocketManager;
	}

	private String getRemoteAddress(ServletRequest req) {
		return req.getRemoteAddr() + ":" + req.getRemotePort();

	}

	private class AsyncContextCloser implements AsyncListener {
		@Override
		public void onComplete(AsyncEvent event) throws IOException {
			if (logger.isDebugEnabled()) {
				ServletRequest req = event.getAsyncContext().getRequest();
				logger.debug("araqne httpd: remove http context's async context, remote addr={}", getRemoteAddress(req));
			}

			asyncContexts.remove(event.getAsyncContext());
		}

		@Override
		public void onTimeout(AsyncEvent event) throws IOException {
		}

		@Override
		public void onError(AsyncEvent event) throws IOException {
		}

		@Override
		public void onStartAsync(AsyncEvent event) throws IOException {
		}
	}
}

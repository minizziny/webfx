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

import java.io.IOException;
import java.util.Enumeration;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.araqne.httpd.impl.WebSocketChannel;
import org.jboss.netty.channel.Channel;
import org.jboss.netty.handler.codec.http.DefaultHttpRequest;
import org.jboss.netty.handler.codec.http.HttpHeaders;
import org.jboss.netty.handler.codec.http.HttpHeaders.Names;
import org.jboss.netty.handler.codec.http.HttpMethod;
import org.jboss.netty.handler.codec.http.HttpRequest;
import org.jboss.netty.handler.codec.http.HttpResponseStatus;
import org.jboss.netty.handler.codec.http.HttpVersion;
import org.jboss.netty.handler.codec.http.websocketx.WebSocketServerHandshaker;
import org.jboss.netty.handler.codec.http.websocketx.WebSocketServerHandshakerFactory;
import org.jboss.netty.handler.codec.http.websocketx.WebSocketVersion;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class WebSocketServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static final int MAX_WEBSOCKET_FRAME_SIZE = 8 * 1024 * 1024;
	private final Logger logger = LoggerFactory.getLogger(WebSocketServlet.class.getName());

	private WebSocketManager manager;

	public WebSocketServlet(WebSocketManager manager) {
		this.manager = manager;
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		if (!HttpHeaders.Values.UPGRADE.equalsIgnoreCase(req.getHeader(HttpHeaders.Names.CONNECTION))
				|| !HttpHeaders.Values.WEBSOCKET.equalsIgnoreCase(req.getHeader(HttpHeaders.Names.UPGRADE)))
			return;

		try {
			WebSocketServerHandshakerFactory wsFactory = new WebSocketServerHandshakerFactory(getWebSocketLocation(req), null,
					false, MAX_WEBSOCKET_FRAME_SIZE);

			HttpMethod method = HttpMethod.valueOf(req.getMethod());
			HttpRequest nettyReq = new DefaultHttpRequest(HttpVersion.HTTP_1_1, method, req.getRequestURI());
			Enumeration<String> it = req.getHeaderNames();
			while (it.hasMoreElements()) {
				String header = it.nextElement();
				nettyReq.addHeader(header, req.getHeader(header));
			}

			WebSocketServerHandshaker handshaker = wsFactory.newHandshaker(nettyReq);
			if (handshaker == null) {
				resp.setStatus(HttpResponseStatus.UPGRADE_REQUIRED.getCode());
				resp.setHeader(Names.SEC_WEBSOCKET_VERSION, WebSocketVersion.V13.toHttpHeaderValue());
				return;
			}

			String host = req.getHeader(HttpHeaders.Names.HOST);
			Channel channel = (Channel) req.getAttribute("netty.channel");
			channel.setAttachment(host);
			handshaker.handshake(channel, nettyReq).addListener(WebSocketServerHandshaker.HANDSHAKE_LISTENER);

			// open session
			WebSocket socket = new WebSocketChannel(channel);
			manager.register(socket);
		} catch (Throwable t) {
			logger.error("araqne httpd: websocket handshake failed", t);
		}
	}

	private String getWebSocketLocation(HttpServletRequest req) {
		return "ws://" + req.getHeader(HttpHeaders.Names.HOST) + manager.getPath();
	}
}

/*
 * Copyright 2013 Eediom Inc.
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
import java.net.URLEncoder;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @since 1.2.0
 * @author xeraph
 * 
 */
public class FileDownloadServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private final Logger logger = LoggerFactory.getLogger(FileDownloadServlet.class);

	private FileDownloadService downloadService;

	public FileDownloadServlet(FileDownloadService downloadService) {
		this.downloadService = downloadService;
	}

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
		String token = req.getParameter("token");
		logger.trace("araqne httpd: trying to download file using token [{}]", token);

		FileDownloadHandler handler = downloadService.findHandler(token);
		if (handler == null) {
			logger.trace("araqne httpd: download token [{}] not found", token);
			resp.sendError(HttpServletResponse.SC_FORBIDDEN);
			return;
		}

		try {
			logger.trace("araqne httpd: starting file download using token [{}]", token);

			String mimeType = MimeTypes.instance().getByFile(handler.getFileName());
			resp.setHeader("Content-Type", mimeType);

			String dispositionType = null;
			if (req.getParameter("force_download") != null)
				dispositionType = "attachment";
			else
				dispositionType = "inline";

			String encodedFilename = URLEncoder.encode(handler.getFileName(), "UTF-8").replaceAll("\\+", "%20");
			resp.setHeader("Content-Disposition", dispositionType + "; filename*=UTF-8''" + encodedFilename);
			resp.setStatus(200);

			handler.startDownload(resp.getOutputStream());
			downloadService.removeHandler(handler);
		} finally {
			resp.getOutputStream().close();
		}
	}

}

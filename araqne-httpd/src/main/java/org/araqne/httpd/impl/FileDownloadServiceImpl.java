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
package org.araqne.httpd.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Provides;
import org.araqne.cron.MinutelyJob;
import org.araqne.httpd.FileDownloadHandler;
import org.araqne.httpd.FileDownloadService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @since 1.2.0
 * @author xeraph
 *
 */
@MinutelyJob
@Component(name = "httpd-file-downloader")
@Provides
public class FileDownloadServiceImpl implements FileDownloadService, Runnable {
	private final Logger logger = LoggerFactory.getLogger(FileDownloadServiceImpl.class);
	private ConcurrentHashMap<String, FileDownloadHandler> handlers;

	public FileDownloadServiceImpl() {
		handlers = new ConcurrentHashMap<String, FileDownloadHandler>();
	}

	@Override
	public List<FileDownloadHandler> getHandlers() {
		return new ArrayList<FileDownloadHandler>(handlers.values());
	}

	@Override
	public FileDownloadHandler findHandler(String token) {
		return handlers.get(token);
	}

	@Override
	public void addHandler(FileDownloadHandler handler) {
		FileDownloadHandler old = handlers.putIfAbsent(handler.getToken(), handler);
		if (old != null)
			throw new IllegalStateException("download token already exists: " + handler.getToken());
	}

	@Override
	public void removeHandler(FileDownloadHandler handler) {
		handlers.remove(handler.getToken(), handler);
	}

	@Override
	public void run() {
		long now = System.currentTimeMillis();
		for (String token : new ArrayList<String>(handlers.keySet())) {
			FileDownloadHandler handler = handlers.get(token);
			if (handler == null)
				continue;

			long elapsed = now - handler.getCreated().getTime();

			if (!handler.isDownloading() && elapsed > 30 * 60 * 1000) {
				handlers.remove(token);

				if (logger.isTraceEnabled())
					logger.trace("araqne httpd: file download handler timeout, token [{}], handler [{}]", token, handler);
			}
		}
	}
}

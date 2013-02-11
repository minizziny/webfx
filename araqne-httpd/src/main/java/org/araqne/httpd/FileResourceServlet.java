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
package org.araqne.httpd;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.InputStream;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class FileResourceServlet extends ResourceServlet {
	private final Logger logger = LoggerFactory.getLogger(FileResourceServlet.class.getName());
	private static final long serialVersionUID = 1L;
	private File basePath;

	public FileResourceServlet(File basePath) {
		this.basePath = basePath;
	}

	@Override
	protected InputStream getInputStream(HttpServletRequest req) {
		try {
			logger.trace("araqne httpd: file servlet base path [{}], path [{}]", basePath, req.getPathInfo());
			return new FileInputStream(new File(basePath, req.getPathInfo()));
		} catch (FileNotFoundException e) {
			logger.trace("araqne httpd: file not found", e);
			return null;
		}
	}

	@Override
	public String toString() {
		return String.format("filesystem resource: %s", basePath);
	}
}

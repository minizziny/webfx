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
import java.io.InputStream;
import java.net.URL;

import javax.servlet.http.HttpServletRequest;

import org.osgi.framework.Bundle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class BundleResourceServlet extends ResourceServlet {
	private static final long serialVersionUID = 1L;
	private final Logger logger = LoggerFactory.getLogger(BundleResourceServlet.class.getName());
	private Bundle bundle;
	private String basePath;
	private final File overridePath;

	public BundleResourceServlet(Bundle bundle, String basePath) {
		this(bundle, basePath, null);
	}

	public BundleResourceServlet(Bundle bundle, String basePath, File overridePath) {
		this.bundle = bundle;
		this.basePath = basePath;
		this.overridePath = overridePath;
	}

	@Override
	protected InputStream getInputStream(HttpServletRequest req) {
		try {
			if (logger.isTraceEnabled())
				logger.trace("araqne httpd: override path [{}], req path [{}]", overridePath, req.getPathInfo());

			File f = new File(overridePath, req.getPathInfo());
			if (f.exists() && f.isFile() && f.canRead())
				return new FileInputStream(f);

			if (logger.isTraceEnabled())
				logger.trace("araqne httpd: trying to open bundle [{}] resource, base path [{}], path info [{}]", new Object[] {
						bundle.getBundleId(), req.getRequestURI(), req.getPathInfo() });

			URL url = bundle.getResource(basePath + req.getPathInfo());
			if (url == null)
				return null;

			return url.openStream();
		} catch (Exception e) {
			logger.trace("araqne httpd: cannot open bundle [{}] resource [{}]", bundle.getBundleId(), req.getRequestURI());
			return null;
		}
	}

	@Override
	public String toString() {
		return bundle.getEntry("/").toString();
	}

}

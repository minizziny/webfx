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
package org.araqne.webconsole.impl;

import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.util.Locale;
import java.util.Properties;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.HttpServlet;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Invalidate;
import org.apache.felix.ipojo.annotations.Requires;
import org.apache.felix.ipojo.annotations.Validate;
import org.araqne.httpd.BundleResourceServlet;
import org.araqne.httpd.HttpContext;
import org.araqne.httpd.HttpService;
import org.araqne.webconsole.PackageApi;
import org.araqne.webconsole.ProgramApi;
import org.osgi.framework.Bundle;
import org.osgi.framework.BundleContext;
import org.osgi.framework.BundleEvent;
import org.osgi.framework.BundleListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(name = "webconsole-bundle-monitor")
public class BundleMetadataMonitor implements BundleListener {
	private static String PROGRAM_METADATA = "/OSGI-INF/araqne-webconsole/program.properties";
	private final Logger logger = LoggerFactory.getLogger(BundleMetadataMonitor.class.getName());

	private BundleContext bc;

	@Requires
	private PackageApi packageApi;
	@Requires
	private ProgramApi programApi;
	@Requires
	private HttpService httpd;

	private ConcurrentHashMap<String, HttpServlet> servlets = new ConcurrentHashMap<String, HttpServlet>();

	public BundleMetadataMonitor(BundleContext bc) {
		this.bc = bc;
	}

	@Validate
	public void start() {
		bc.addBundleListener(this);

		// inspect existing bundles
		for (Bundle bundle : bc.getBundles())
			bundleChanged(new BundleEvent(BundleEvent.STARTED, bundle));
	}

	@Invalidate
	public void stop() {
		HttpService capturedHttpd = httpd;
		if (capturedHttpd != null) {
			HttpContext ctx = capturedHttpd.ensureContext("webconsole");
			for (String servletName : servlets.keySet())
				ctx.removeServlet(servletName);

			servlets.clear();
		}

		if (bc != null)
			bc.removeBundleListener(this);
	}

	@Override
	public void bundleChanged(BundleEvent ev) {
		Bundle bundle = ev.getBundle();
		int type = ev.getType();

		try {
			if (ev.getType() == BundleEvent.STARTED) {
				loadProgramMetadata(bundle);
			} else if (type == BundleEvent.STOPPED) {
				unloadProgramMetadata(bundle);
			}
		} catch (IllegalStateException e) {
			if (e.getMessage() != null && e.getMessage().contains("bundle is uninstalled"))
				return;

			logger.error("araqne webconsole: cannot handle program metadata", e);
		} catch (Exception e) {
			logger.error("araqne webconsole: cannot handle program metadata", e);
		}
	}

	private void loadProgramMetadata(Bundle bundle) {
		Properties p = loadProperties(bundle);
		if (p != null)
			registerMetadata(bundle.getBundleId(), p, Locale.ENGLISH);
	}

	private void unloadProgramMetadata(Bundle bundle) {
		Properties p = loadProperties(bundle);
		if (p == null)
			return;

		unregisterStaticResource(bundle, p.getProperty("prefix"));

		logger.info("araqne webconsole: unloading program metadata for bundle " + bundle.getSymbolicName());
		programApi.unregister(bundle.getBundleId());
	}

	private Properties loadProperties(Bundle bundle) {
		URL url = bundle.getEntry(PROGRAM_METADATA);
		if (url == null) {
			logger.trace("araqne webconsole: program metadata not found for {}", bundle.getSymbolicName());
			return null;
		}

		InputStream is = null;
		try {
			is = url.openStream();
			Properties p = new Properties();
			p.load(is);
			return p;
		} catch (Exception e) {
			logger.error("araqne webconsole: cannot load program metadata", e);
			return null;
		} finally {
			if (is != null)
				try {
					is.close();
				} catch (IOException e) {
				}
		}
	}

	private void registerMetadata(long bundleId, Properties p, Locale locale) {
		String packageId = null;
		String packageLabel = null;

		for (Object k : p.keySet()) {
			String key = k.toString();
			if (key.startsWith("package.")) {
				packageId = key.split("\\.")[1];
				packageLabel = p.getProperty(key);
				break;
			}
		}

		registerStaticResource(bundleId, p);

		packageApi.register(packageId);
		packageApi.localize(packageId, locale, packageLabel);

		String prefix = p.getProperty("prefix");
		if (prefix == null)
			prefix = "";
		else if (!prefix.endsWith("/"))
			prefix += "/";

		for (Object k : p.keySet()) {
			String key = k.toString();
			if (key.startsWith("program.") && !key.endsWith(".label")) {
				String programId = key.substring("program.".length());
				String path = prefix + (String) p.get(key);
				String label = (String) p.get(key + ".label");

				programApi.register(bundleId, packageId, programId, path);
				programApi.localize(bundleId, packageId, programId, locale, label);
			}
		}
	}

	private void registerStaticResource(long bundleId, Properties p) {
		Bundle bundle = bc.getBundle(bundleId);
		String prefix = p.getProperty("prefix");
		if (prefix != null) {
			URL url = bundle.getEntry("/WEB-INF");
			if (url != null) {
				HttpContext ctx = httpd.ensureContext("webconsole");
				String servletName = "bundle" + bundle.getBundleId();
				BundleResourceServlet servlet = new BundleResourceServlet(bundle, "/WEB-INF");
				ctx.addServlet(servletName, servlet, prefix);
				servlets.put(servletName, servlet);
				logger.info("araqne webconsole: prefix [{}] is mapped to bundle {}/WEB-INF", prefix, bundleId);
			} else {
				logger.warn("araqne webconsole: WEB-INF directory not found in bundle {}", bundleId);
			}
		} else {
			logger.warn("araqne webconsole: prefix property not found in bundle {}", bundleId);
		}
	}

	private void unregisterStaticResource(Bundle bundle, String prefix) {
		String servletName = "bundle" + bundle.getBundleId();
		servlets.remove(servletName);

		HttpContext ctx = httpd.ensureContext("webconsole");
		ctx.removeServlet(servletName);
	}
}

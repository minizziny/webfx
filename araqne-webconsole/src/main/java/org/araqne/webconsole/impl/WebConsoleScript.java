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

import java.util.HashMap;
import java.util.Map;

import org.araqne.api.Script;
import org.araqne.api.ScriptArgument;
import org.araqne.api.ScriptContext;
import org.araqne.api.ScriptUsage;
import org.araqne.confdb.Config;
import org.araqne.confdb.ConfigCollection;
import org.araqne.confdb.ConfigDatabase;
import org.araqne.confdb.ConfigService;
import org.araqne.webconsole.CometMonitor;
import org.araqne.webconsole.Program;
import org.araqne.webconsole.ProgramApi;

public class WebConsoleScript implements Script {
	private ConfigService conf;
	private ScriptContext context;
	private ProgramApi programApi;
	private CometMonitor cometMonitor;

	public WebConsoleScript(ConfigService conf, ProgramApi programApi, CometMonitor cometMonitor) {
		this.conf = conf;
		this.programApi = programApi;
		this.cometMonitor = cometMonitor;
	}

	@Override
	public void setScriptContext(ScriptContext context) {
		this.context = context;
	}

	public void programs(String[] args) {
		for (Program p : programApi.getPrograms()) {
			context.println(p.toString());
		}
	}

	/**
	 * @since 2.7.2
	 */
	public void cometSessions(String[] args) {
		context.println("Long polling sessions");
		context.println("-----------------------");
		for (String sessionKey : cometMonitor.getSessionKeys()) {
			context.println(sessionKey + ": " + cometMonitor.getAsyncContext(sessionKey));
		}
	}

	/**
	 * override default static resource files
	 * 
	 * @since 2.8.3
	 */

	@SuppressWarnings("unchecked")
	@ScriptUsage(description = "override default static files", arguments = {
			@ScriptArgument(name = "ui path", type = "string", description = "ui path for override default files", optional = true) })
	public void uipath(String[] args) {
		ConfigDatabase db = conf.ensureDatabase("araqne-webconsole");
		ConfigCollection col = db.ensureCollection("global_configs");
		Config c = col.findOne(null);

		if (c != null) {
			Map<String, Object> m = (Map<String, Object>) c.getDocument();
			if (args.length == 0) {
				Object uiPath = m.get("ui_path");
				context.println(uiPath == null ? "null" : uiPath);
				return;
			}

			String uiPath = args[0];
			m.put("ui_path", uiPath.isEmpty() ? null : uiPath);
			c.setDocument(m);
			c.update();
		} else {
			if (args.length == 0) {
				context.println("not set");
				return;
			}

			String uiPath = args[0];
			Map<String, Object> m = new HashMap<String, Object>();
			m.put("ui_path", uiPath);
			col.add(m);
		}

		context.println("set");
	}
}

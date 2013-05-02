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

import org.araqne.api.Script;
import org.araqne.api.ScriptContext;
import org.araqne.webconsole.CometMonitor;
import org.araqne.webconsole.Program;
import org.araqne.webconsole.ProgramApi;

public class WebConsoleScript implements Script {
	private ScriptContext context;
	private ProgramApi programApi;
	private CometMonitor cometMonitor;

	public WebConsoleScript(ProgramApi programApi, CometMonitor cometMonitor) {
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
}

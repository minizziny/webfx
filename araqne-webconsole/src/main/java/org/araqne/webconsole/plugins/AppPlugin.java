/**
 * Copyright 2014 Eediom Inc.
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
package org.araqne.webconsole.plugins;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Requires;
import org.araqne.msgbus.Request;
import org.araqne.msgbus.Response;
import org.araqne.msgbus.handler.MsgbusMethod;
import org.araqne.msgbus.handler.MsgbusPlugin;
import org.araqne.webconsole.AppRegistry;

@MsgbusPlugin
@Component(name = "webconsole-app-plugin")
public class AppPlugin {

	@Requires
	private AppRegistry appRegistry;

	@MsgbusMethod
	public void getApps(Request req, Response resp) {
		resp.put("apps", appRegistry.getAppKeys());
	}
}

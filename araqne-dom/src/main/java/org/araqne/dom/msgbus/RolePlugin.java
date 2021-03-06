/*
 * Copyright 2011 Future Systems, Inc.
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
package org.araqne.dom.msgbus;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Requires;
import org.araqne.api.PrimitiveConverter;
import org.araqne.dom.api.RoleApi;
import org.araqne.msgbus.Request;
import org.araqne.msgbus.Response;
import org.araqne.msgbus.handler.MsgbusMethod;
import org.araqne.msgbus.handler.MsgbusPlugin;

@Component(name = "dom-role-plugin")
@MsgbusPlugin
public class RolePlugin {
	@Requires
	private RoleApi roleApi;

	@MsgbusMethod
	public void getRoles(Request req, Response resp) {
		resp.put("roles", PrimitiveConverter.serialize(roleApi.getRoles(req.getOrgDomain())));
	}

	@MsgbusMethod
	public void hasPermission(Request req, Response resp) {
		String group = req.getString("group");
		String permission = req.getString("permission");
		resp.put("result", roleApi.hasPermission(req.getOrgDomain(), req.getAdminLoginName(), group, permission));
	}
}

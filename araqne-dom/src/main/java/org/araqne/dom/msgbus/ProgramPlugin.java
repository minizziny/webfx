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

import java.util.ArrayList;
import java.util.Collection;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Requires;
import org.araqne.api.PrimitiveConverter;
import org.araqne.dom.api.AdminApi;
import org.araqne.dom.api.ProgramApi;
import org.araqne.dom.model.Program;
import org.araqne.dom.model.ProgramPack;
import org.araqne.dom.model.ProgramProfile;
import org.araqne.msgbus.Request;
import org.araqne.msgbus.Response;
import org.araqne.msgbus.handler.MsgbusMethod;
import org.araqne.msgbus.handler.MsgbusPlugin;

@Component(name = "dom-program-plugin")
@MsgbusPlugin
public class ProgramPlugin {
	@Requires
	private ProgramApi programApi;

	@Requires
	private AdminApi adminApi;

	@MsgbusMethod
	public void getProgramProfiles(Request req, Response resp) {
		resp.put("profiles", PrimitiveConverter.serialize(programApi.getProgramProfiles(req.getOrgDomain())));
	}

	@MsgbusMethod
	public void getProgramPacks(Request req, Response resp) {
		Collection<ProgramPack> packs = programApi.getProgramPacks(req.getOrgDomain());
		resp.put("packs", PrimitiveConverter.serialize(packs));
	}

	@MsgbusMethod
	public void getAvailablePrograms(Request req, Response resp) {
		Collection<ProgramPack> packs = programApi.getProgramPacks(req.getOrgDomain());
		resp.put("packs", PrimitiveConverter.serialize(packs, PrimitiveConverter.SerializeOption.INCLUDE_SKIP_FIELD));

		ProgramProfile profile = adminApi.getAdmin(req.getOrgDomain(), req.getAdminLoginName()).getProfile();
		Collection<Program> programs = new ArrayList<Program>();
		if (profile != null)
			programs = profile.getPrograms();
		resp.put("programs", PrimitiveConverter.serialize(programs));
	}
}

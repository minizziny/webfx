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
package org.araqne.dom.script;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Provides;
import org.apache.felix.ipojo.annotations.Requires;
import org.apache.felix.ipojo.annotations.ServiceProperty;
import org.araqne.api.Script;
import org.araqne.api.ScriptFactory;
import org.araqne.confdb.ConfigService;
import org.araqne.dom.api.ApplicationApi;
import org.araqne.dom.api.AreaApi;
import org.araqne.dom.api.ConfigManager;
import org.araqne.dom.api.GlobalConfigApi;
import org.araqne.dom.api.HostApi;
import org.araqne.dom.api.HostUpdateApi;
import org.araqne.dom.api.OrganizationApi;
import org.araqne.dom.api.OrganizationUnitApi;
import org.araqne.dom.api.ProgramApi;
import org.araqne.dom.api.RoleApi;
import org.araqne.dom.api.UserApi;

@Component(name = "dom-script-factory")
@Provides
public class DomScriptFactory implements ScriptFactory {
	@SuppressWarnings("unused")
	@ServiceProperty(name = "alias", value = "dom")
	private String alias;

	@Requires
	private GlobalConfigApi globalConfigApi;

	@Requires
	private OrganizationApi orgApi;

	@Requires
	private OrganizationUnitApi orgUnitApi;

	@Requires
	private UserApi userApi;

	@Requires
	private RoleApi roleApi;

	@Requires
	private ProgramApi programApi;

	@Requires
	private AreaApi areaApi;

	@Requires
	private HostApi hostApi;

	@Requires
	private ApplicationApi appApi;

	@Requires
	private HostUpdateApi updateApi;

	@Requires
	private ConfigService conf;

	@Override
	public Script createScript() {
		return new DomScript(globalConfigApi, orgApi, orgUnitApi, userApi, roleApi, programApi, areaApi, hostApi, appApi,
				updateApi, conf);
	}
}

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

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.araqne.api.ScriptContext;
import org.araqne.dom.api.AreaApi;
import org.araqne.dom.api.GlobalConfigApi;
import org.araqne.dom.api.OrganizationApi;
import org.araqne.dom.api.ProgramApi;
import org.araqne.dom.api.RoleApi;
import org.araqne.dom.api.UserApi;
import org.araqne.dom.model.Admin;
import org.araqne.dom.model.Area;
import org.araqne.dom.model.Organization;
import org.araqne.dom.model.Permission;
import org.araqne.dom.model.Program;
import org.araqne.dom.model.ProgramPack;
import org.araqne.dom.model.ProgramProfile;
import org.araqne.dom.model.Role;
import org.araqne.dom.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class InitialSchema {
	private static final Logger logger = LoggerFactory.getLogger(InitialSchema.class);

	private static final String SCHEMA_VERSION = "1";
	private static final String DEFAULT_DOMAIN = "localhost";

	public static void generate(ScriptContext context, GlobalConfigApi globalConfigApi, OrganizationApi orgApi, RoleApi roleApi,
			ProgramApi programApi, AreaApi areaApi, UserApi userApi) {
		// TODO: check schema version, add vendor & applications
		Object schemaVersion = globalConfigApi.getConfig("initial_schema_version");
		if (!SCHEMA_VERSION.equals(schemaVersion)) {
			logger.info("araqne dom: begin initialize schema");
			createOrganization(context, orgApi);
			createArea(context, areaApi);
			createPrograms(context, orgApi, programApi);
			createRoles(context, roleApi);
			createAdmin(context, userApi, roleApi, programApi);
			try {
				globalConfigApi.setConfig("initial_schema_version", SCHEMA_VERSION, true);
			} catch (Exception e) {
				logger.error("araqne dom: initial schema version setting failed", e);
				context.println("initial schema version setting failed");
			}
		}
	}

	public static void createOrganization(ScriptContext context, OrganizationApi orgApi) {
		if (orgApi.findOrganization(DEFAULT_DOMAIN) != null)
			return;

		Organization organization = new Organization();
		organization.setDomain(DEFAULT_DOMAIN);
		organization.setName(DEFAULT_DOMAIN);
		organization.setEnabled(true);
		try {
			orgApi.createOrganization(organization);
		} catch (Exception e) {
			logger.error("araqne dom: organization initialize failed", e);
			context.println("organization initialize failed");
		}
	}

	public static void createArea(ScriptContext context, AreaApi areaApi) {
		if (areaApi.findArea(DEFAULT_DOMAIN, "abb0de7a-eccb-4b51-a2e1-68d193e5e391") != null)
			return;

		Area area = new Area();
		area.setGuid("abb0de7a-eccb-4b51-a2e1-68d193e5e391");
		area.setName("/");
		try {
			areaApi.createArea(DEFAULT_DOMAIN, area);
		} catch (Exception e) {
			logger.error("araqne dom: area initialize failed", e);
			context.println("area initialize failed");
		}
	}

	public static void createPrograms(ScriptContext context, OrganizationApi orgApi, ProgramApi programApi) {

		boolean updated = false;
		if (programApi.findProgramPack(DEFAULT_DOMAIN, "System") == null) {
			Map<String, String> displayNames = new HashMap<String, String>();
			displayNames.put("en", "System");
			displayNames.put("jp", "システム");
			displayNames.put("ko", "시스템");

			ProgramPack pack = new ProgramPack();
			pack.setName("System");
			pack.setDisplayNames(displayNames);
			pack.setDll("system");
			pack.setSeq(1);
			try {
				programApi.createProgramPack(DEFAULT_DOMAIN, pack);
			} catch (Exception e) {
				logger.error("araqne dom: program pack initialize failed", e);
				context.println("program pack initialize failed");
			}
		} else {
			updated = true;
		}

		// remove old programs
		List<Program> deletePrograms = new ArrayList<Program>();
		List<String> deleteProgramNames = new ArrayList<String>();
		for (Program p : programApi.getPrograms(DEFAULT_DOMAIN)) {
			if (p.getPack().equals("System")) {
				deletePrograms.add(p);
				deleteProgramNames.add(p.getName());
			}
		}

		for (ProgramProfile pp : programApi.getProgramProfiles(DEFAULT_DOMAIN)) {
			pp.getPrograms().removeAll(deletePrograms);
			programApi.updateProgramProfile(DEFAULT_DOMAIN, pp);
		}

		programApi.removePrograms(DEFAULT_DOMAIN, deleteProgramNames);

		Program home = createProgram(context, programApi, "Home", "Home", "홈", "ホーム", "首页", "starter", 1);
		Program dashBoard = createProgram(context, programApi, "Dashboard", "Dashboard", "대시보드", "ダッシュボード", "仪表板", "dashboard", 2);
		Program account = createProgram(context, programApi, "Account", "Accounts", "계정관리", "アカウント管理", "账户管理", "orgchart", 3);
		Program auditLog = createProgram(context, programApi, "Audit Log", "Audit Log", "감사로그", "監査ログ", "审计日志", "auditlog", 4);

		List<Program> allPrograms = new ArrayList<Program>();
		allPrograms.add(home);
		allPrograms.add(dashBoard);
		allPrograms.add(account);
		allPrograms.add(auditLog);

		List<Program> memberPrograms = new ArrayList<Program>();
		memberPrograms.add(home);
		memberPrograms.add(dashBoard);
		memberPrograms.add(account);

		updated = createOrUpdateProfile(programApi, "all", allPrograms, updated);
		updated = createOrUpdateProfile(programApi, "admin", allPrograms, updated);
		updated = createOrUpdateProfile(programApi, "member", memberPrograms, updated);

		if (updated)
			logger.info("araqne dom: program profiles updated");
		else
			logger.info("araqne dom: program profiles installed");
	}

	private static boolean createOrUpdateProfile(ProgramApi programApi, String profileName, List<Program> programs,
			boolean updated) {
		ProgramProfile profile = programApi.findProgramProfile(DEFAULT_DOMAIN, profileName);
		if (profile == null) {
			profile = new ProgramProfile();
			profile.setName(profileName);
			profile.setPrograms(programs);
			programApi.createProgramProfile(DEFAULT_DOMAIN, profile);
		} else {
			updated = true;
			profile.getPrograms().addAll(programs);
			programApi.updateProgramProfile(DEFAULT_DOMAIN, profile);
		}

		return updated;
	}

	private static Program createProgram(ScriptContext context, ProgramApi programApi, String name, String enName, String koName,
			String jpName, String cnName, String type, int seq) {
		if (programApi.findProgram(DEFAULT_DOMAIN, "System", name) != null)
			return programApi.findProgram(DEFAULT_DOMAIN, "System", name);

		Map<String, String> displayNames = new HashMap<String, String>();
		displayNames.put("en", enName);
		displayNames.put("jp", jpName);
		displayNames.put("ko", koName);
		displayNames.put("zh", cnName);

		Program program = new Program();
		program.setPack("System");
		program.setName(name);
		program.setDisplayNames(displayNames);
		program.setPath(type);
		program.setSeq(seq);
		program.setVisible(true);
		try {
			programApi.createProgram(DEFAULT_DOMAIN, program);
		} catch (Exception e) {
			logger.error("araqne dom: program initialize failed", e);
			context.println("program initialize failed");
		}
		return program;
	}

	public static void createRoles(ScriptContext context, RoleApi roleApi) {
		Role master = createRole(context, roleApi, "master", 4);
		addPermission(master, "dom", "admin_grant");
		addPermission(master, "dom", "user_edit");
		addPermission(master, "dom", "config_edit");
		addPermission(master, "dom", "config_view");
		updateRole(context, roleApi, master);

		Role admin = createRole(context, roleApi, "admin", 3);
		addPermission(admin, "dom", "user_edit");
		updateRole(context, roleApi, admin);

		createRole(context, roleApi, "member", 2);
	}

	private static void updateRole(ScriptContext context, RoleApi roleApi, Role master) {
		try {
			roleApi.updateRole(DEFAULT_DOMAIN, master);
		} catch (Exception e) {
			logger.error("araqne dom: master role initialize failed", e);
			context.println("master role initialize failed");
		}
	}

	private static void addPermission(Role master, String group, String name) {
		Permission permission = new Permission();
		permission.setGroup(group);
		permission.setPermission(name);
		master.getPermissions().add(permission);
	}

	private static Role createRole(ScriptContext context, RoleApi roleApi, String name, int level) {
		if (roleApi.findRole(DEFAULT_DOMAIN, name) != null)
			return roleApi.findRole(DEFAULT_DOMAIN, name);

		Role role = new Role();
		role.setName(name);
		role.setLevel(level);
		try {
			roleApi.createRole(DEFAULT_DOMAIN, role);
		} catch (Exception e) {
			logger.error("araqne dom: role initialize failed", e);
			context.println("role initialize failed");
		}
		return role;
	}

	public static void createAdmin(ScriptContext context, UserApi userApi, RoleApi roleApi, ProgramApi programApi) {
		if (userApi.findUser(DEFAULT_DOMAIN, "root") != null)
			return;

		User user = new User();
		user.setLoginName("root");
		user.setName("root");
		user.setPassword("araqne");

		Admin admin = new Admin();
		admin.setRole(roleApi.getRole(DEFAULT_DOMAIN, "master"));
		admin.setProfile(programApi.getProgramProfile(DEFAULT_DOMAIN, "all"));
		admin.setLang(null);
		admin.setEnabled(true);
		user.getExt().put("admin", admin);

		try {
			userApi.setSaltLength("localhost", 0);
			userApi.createUser(DEFAULT_DOMAIN, user);
		} catch (Exception e) {
			logger.error("araqne dom: admin initialize failed", e);
			context.println("admin initialize failed");
		}
	}
}

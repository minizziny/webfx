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
package org.araqne.dom.api;

import org.araqne.dom.model.Admin;
import org.araqne.msgbus.Session;

public interface LoginCallback {
	void onLoginSuccess(Admin admin, Session session);

	void onLoginFailed(Admin admin, Session session, DOMException e);

	void onLoginLocked(Admin admin, Session session);

	void onLogout(Admin admin, Session session);
}

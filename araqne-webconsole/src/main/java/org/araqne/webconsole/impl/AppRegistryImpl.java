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
package org.araqne.webconsole.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Provides;
import org.araqne.webconsole.AppProvider;
import org.araqne.webconsole.AppRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component(name = "webconsole-app-registry")
@Provides
public class AppRegistryImpl implements AppRegistry {

	private ConcurrentHashMap<String, AppProvider> providers = new ConcurrentHashMap<String, AppProvider>();

	@Override
	public List<String> getAppKeys() {
		return new ArrayList<String>(providers.keySet());
	}

	@Override
	public List<AppProvider> getAppProviders() {
		return new ArrayList<AppProvider>(providers.values());
	}

	@SuppressWarnings("unchecked")
	@Override
	public Map<String, Object> getApps(String feature) {
		Map<String, Object> m = new HashMap<String, Object>();

		if (feature == null || feature == "") {
			// return all type id
			for (AppProvider p : providers.values()) {
				Map<String, Object> manifest = (Map<String, Object>) p.getManifest();
				Map<String, Object> features = (Map<String, Object>) manifest.get("feature");
				String appId = (String) manifest.get("id");

				List<String> typeIdList = new ArrayList<String>();
				for (String key : features.keySet()) {
					List<Map<String, Object>> category = (List<Map<String, Object>>) features.get(key);
					for (Map<String, Object> c : category) {
						String typeId = (String) c.get("id");
						typeIdList.add(typeId);
					}
				}
				m.put(appId, typeIdList);
			}
		} else {
			// return type id by type
			for (AppProvider p : providers.values()) {
				Map<String, Object> manifest = (Map<String, Object>) p.getManifest();
				Map<String, Object> features = (Map<String, Object>) manifest.get("feature");
				String appId = (String) manifest.get("id");

				List<Map<String, Object>> typeList = (List<Map<String, Object>>) features.get(feature);
				List<String> typeIdList = new ArrayList<String>();
				for (Map<String, Object> t : typeList) {
					String typeId = (String) t.get("id");
					typeIdList.add(typeId);
				}
				m.put(appId, typeIdList);
			}
		}

		return m;
	}

	@SuppressWarnings("unchecked")
	@Override
	public Map<String, Object> getApp(String id) {
		Map<String, Object> m = (Map<String, Object>) providers.get(id);
		return m;
	}

	@Override
	public void register(AppProvider provider) {
		AppProvider old = providers.putIfAbsent(provider.getId(), provider);
		if (old != null)
			throw new IllegalStateException("duplicated app provider: " + provider.getId());
	}

	@Override
	public void unregister(AppProvider provider) {
		if (!providers.remove(provider.getId(), provider))
			throw new IllegalStateException("app provider not found: " + provider.getId());
	}

}

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

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Provides;
import org.araqne.webconsole.AppProvider;
import org.araqne.webconsole.AppRegistry;
import org.json.JSONConverter;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

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

		// return all type id
		if (feature == null || feature == "") {
			for (AppProvider p : providers.values()) {
				Map<String, Object> manifest = (Map<String, Object>) p.getManifest();
				Map<String, Object> features = (Map<String, Object>) manifest.get("feature");
				String appId = (String) manifest.get("id");

				List<String> typeIdList = new ArrayList<String>();
				for (String key : features.keySet()) {
					Map<String, Object> t = (Map<String, Object>) features.get(key);
					String typeId = (String) t.get("id");
					typeIdList.add(typeId);
				}
				m.put(appId, typeIdList);
			}
		}

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

	@Override
	public Map<String, Object> getManifest(File file) {
		Map<String, Object> m = null;

		try {
			InputStream is = new FileInputStream(file);
			JSONTokener tokenizer = new JSONTokener(new InputStreamReader(is, Charset.forName("utf-8")));
			Object value = tokenizer.nextValue();
			m = JSONConverter.parse((JSONObject) value);
		} catch (FileNotFoundException e) {
		} catch (JSONException e) {
		} catch (IOException e) {
		}

		return m;
	}

}

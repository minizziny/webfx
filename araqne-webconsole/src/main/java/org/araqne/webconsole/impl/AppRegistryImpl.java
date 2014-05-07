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
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

import org.apache.felix.ipojo.annotations.Component;
import org.apache.felix.ipojo.annotations.Provides;
import org.araqne.webconsole.AppProvider;
import org.araqne.webconsole.AppRegistry;

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

	@Override
	public void register(AppProvider provider) {
		AppProvider old = providers.putIfAbsent(provider.getKey(), provider);
		if (old != null)
			throw new IllegalStateException("duplicated app provider: " + provider.getKey());
	}

	@Override
	public void unregister(AppProvider provider) {
		if (!providers.remove(provider.getKey(), provider))
			throw new IllegalStateException("app provider not found: " + provider.getKey());
	}

}

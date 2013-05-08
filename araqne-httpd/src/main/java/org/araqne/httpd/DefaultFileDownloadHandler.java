/*
 * Copyright 2013 Eediom Inc.
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
package org.araqne.httpd;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

/**
 * @since 1.2.0
 * @author xeraph
 * 
 */
public abstract class DefaultFileDownloadHandler implements FileDownloadHandler {
	protected String token;
	protected Date created;
	protected boolean downloading;

	public DefaultFileDownloadHandler() {
		this.token = UUID.randomUUID().toString();
		this.created = new Date();
	}

	@Override
	public String getToken() {
		return token;
	}

	@Override
	public Date getCreated() {
		return created;
	}

	@Override
	public String toString() {
		SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
		return String.format("token=%s, filename=%s, downloading=%s, created=%s", token, getFileName(), downloading,
				df.format(created));
	}
}

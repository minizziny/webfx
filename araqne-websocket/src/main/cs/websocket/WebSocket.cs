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
using System;
using System.IO;
using System.Text;
using System.Net;
using System.Net.Sockets;
using System.Threading;
using System.Collections;
using System.Text.RegularExpressions;
using System.Security.Cryptography;

namespace Araqne.Web
{
	public class WebSocket
	{
		public delegate void MessageHandler(WebSocketMessage msg);
		public delegate void ErrorHandler(Exception e);

		private const string WEBSOCKET_KEY_TRAILER = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
		private Uri uri;
		private TcpClient client;
		private bool closed;

		public event MessageHandler OnMessage;
		public event ErrorHandler OnError;

		public WebSocket(Uri uri)
		{
			this.uri = uri;
			Connect();
		}

		public bool IsClosed { get { return closed; } }

		private void Connect()
		{
			int port = uri.Port;
			if (port == -1)
				port = 80;

			client = new TcpClient(uri.Host, port);

			try 
			{
				string webSocketKey = NewWebSocketKey();
				string handshake = NewHandshakeRequest(webSocketKey);

				Stream stream = client.GetStream();
				byte[] handshakeBytes = Encoding.UTF8.GetBytes(handshake);
				stream.Write(handshakeBytes, 0, handshakeBytes.Length);
				stream.Flush();

				byte[] b = new byte[8096];

				string response = "";
				while (true)
				{
					int readBytes = stream.Read(b, 0, b.Length);
					if (readBytes <= 0)
						break;

					response += Encoding.UTF8.GetString(b, 0, readBytes);
					if (response.EndsWith("\r\n\r\n"))
						break;
				}

				if (!response.StartsWith("HTTP/1.1 101 "))
					throw new IOException("websocket is not supported");

				IDictionary headers = new Hashtable();
				string[] lines = Regex.Split(response, "\r\n");
				foreach (string line in lines)
				{
					int p = line.IndexOf(':');
					if (p < 0)
						continue;

					string key = line.Substring(0, p).Trim().ToLower();
					string val = line.Substring(p + 1).Trim();
					headers[key] = val;
				}

				string upgrade = GetHeader(headers, "upgrade");
				string connection = GetHeader(headers, "connection");
				string accept = GetHeader(headers, "sec-websocket-accept");

				if (upgrade != "websocket")
					throw new IOException("Unexpected Upgrade value: " + upgrade);

				if (connection != "Upgrade")
					throw new IOException("Unexpected Connection value: " + connection);

				SHA1 sha1 = new SHA1Managed();
				string input = webSocketKey + WEBSOCKET_KEY_TRAILER;
				byte[] hash = sha1.ComputeHash(Encoding.UTF8.GetBytes(input));
				string expected = Convert.ToBase64String(hash);

				if (expected != accept)
					throw new IOException("invalid websocket accept: key " + webSocketKey + ", expected " + expected + ", actual " + accept);


				ReadContext ctx = new ReadContext();
				ctx.expected = 2;
				client.GetStream().BeginRead(ctx.headerBuffer, 0, ctx.expected, new AsyncCallback(ReadCallback), ctx);
			}
			catch (Exception)
			{
				client.Close();
				throw;
			}
		}

		private string GetHeader(IDictionary headers, string name)
		{
			if (!headers.Contains(name))
				throw new IOException(name + " header not found");
			return (string)headers[name];
		}

		private string NewWebSocketKey()
		{
			Random r = new Random();
			byte[] b = new byte[16];
			r.NextBytes(b);
			return Convert.ToBase64String(b);
		}

		private string NewHandshakeRequest(string webSocketKey)
		{
			return "GET /websocket HTTP/1.1\r\n" +
				"Host: " + uri.Host + "\r\n" +
				"Upgrade: websocket\r\n" +
				"Connection: Upgrade\r\n" +
				"Sec-WebSocket-Key: " + webSocketKey + "\r\n" +
				"Sec-WebSocket-Version: 13\r\n" +
				"Content-Length: 0\r\n\r\n";
		}

		public void Send(string text)
		{
			if (closed)
				throw new IOException("websocket is closed");

			WebSocketFrame frame = new WebSocketFrame(text);
			byte[] encoded = frame.Encode();
			client.GetStream().Write(encoded, 0, encoded.Length);
			client.GetStream().Flush();
		}

		public void Close()
		{
			if (closed)
				return;

			closed = true;

			if (client != null)
				client.Close();
		}

		private void ReadCallback(IAsyncResult result)
		{
			if (closed)
				return;

			int readBytes = client.GetStream().EndRead(result);
	
			ReadContext ctx = result.AsyncState as ReadContext;

			if (ctx.stage == ReadStage.Header)
			{
				int payloadLen = ctx.headerBuffer[1] & 0x7f;
				ctx.headerReadBytes += readBytes;
				if (ctx.headerReadBytes >= 2)
				{
					if (payloadLen < 126)
					{
						ctx.stage = ReadStage.Payload;
						ctx.payloadReadBytes = 0;
						ctx.expected = 2 + payloadLen;
					} 
					else
					{
						ctx.stage = ReadStage.ExtendedHeader;
						ctx.expected = payloadLen == 126 ? 4 : 10;
					}
				}
			}
			else if (ctx.stage == ReadStage.ExtendedHeader)
			{
				int payloadLen = ctx.headerBuffer[1] & 0x7f;
				ctx.headerReadBytes += readBytes;
				byte[] h = ctx.headerBuffer;
				if (payloadLen == 126 && ctx.headerReadBytes == 4)
				{
					int l = (h[2] << 8 | h[3]) & 0xffff;
					ctx.payloadReadBytes = 0;
					ctx.payloadBuffer = new byte[l];
					ctx.expected = l;
					ctx.stage = ReadStage.Payload;
				}
				else if (payloadLen == 127 && ctx.headerReadBytes == 10)
				{
					byte[] b = new byte[8];
					Array.Copy(h, 2, b, 0, 8);
					Array.Reverse(b);
					long l = BitConverter.ToInt64(b, 0);
					ctx.payloadBuffer = new byte[l];
					ctx.expected = (int)l;
					ctx.stage = ReadStage.Payload;
				}
			}
			else if (ctx.stage == ReadStage.Payload)
			{
				ctx.payloadReadBytes += readBytes;
				if (ctx.payloadReadBytes == ctx.expected)
				{
					byte[] h = ctx.headerBuffer;
					byte[] p = ctx.payloadBuffer;

					bool fin = (h[0] & 0x80) == 0x80;
					Opcode opcode = (Opcode)(h[0] & 0xf);

					if (opcode == Opcode.Text)
					{
						ctx.fragments.Add(p);

						if (fin)
						{
							string json = BuildText(ctx);
							if (OnMessage != null)
								OnMessage(new WebSocketMessage((int)opcode, json));
						}
					}

					// clear and ready for next frame
					ctx.headerReadBytes = 0;
					ctx.payloadReadBytes = 0;
					ctx.payloadBuffer = null;
					ctx.expected = 2;
					ctx.fragments.Clear();
					ctx.stage = ReadStage.Header;
				}
			}

			if (ctx.stage == ReadStage.Payload)
			{
				int next = (ctx.expected - ctx.payloadReadBytes);
				if (next == 0)
				{
					int i = 0;
				}
				client.GetStream().BeginRead(ctx.payloadBuffer, ctx.payloadReadBytes, ctx.expected - ctx.payloadReadBytes, new AsyncCallback(ReadCallback), ctx);
			}
			else
			{
				int next = (ctx.expected - ctx.headerReadBytes);
				if (next == 0)
				{
					int i = 0;
				}

				client.GetStream().BeginRead(ctx.headerBuffer, ctx.headerReadBytes, ctx.expected - ctx.headerReadBytes, new AsyncCallback(ReadCallback), ctx);
			}
		}

		private string BuildText(ReadContext ctx)
		{
			int total = 0;

			foreach (byte[] p in ctx.fragments)
			{
				total += p.Length;
			}

			int offset = 0;
			byte[] buf = new byte[total];
			foreach (byte[] p in ctx.fragments)
			{
				Array.Copy(p, 0, buf, offset, p.Length);
				offset += p.Length;
			}

			return Encoding.UTF8.GetString(buf, 0, buf.Length);
		}

		enum Opcode
		{
			Continuation = 0,
			Text = 1,
			Binary = 2,
			Close = 8,
			Ping = 9,
			Pong = 10
		}

		enum ReadStage
		{
			Header, ExtendedHeader, Payload
		}

		class ReadContext
		{
			public ReadStage stage = ReadStage.Header;
			public byte[] headerBuffer = new byte[10];
			public byte[] payloadBuffer;
			public int expected;
			public int headerReadBytes;
			public int payloadReadBytes;
			public IList fragments = new ArrayList();
		}
	}
}

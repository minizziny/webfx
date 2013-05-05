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
using System.Text;
using System.IO;

namespace Araqne.Web
{
	public enum Opcode
	{
		Continuation = 0,
		Text = 1,
		Binary = 2,
		Close = 8,
		Ping = 9,
		Pong = 10
	}

	public class WebSocketFrame
	{
		private bool fin;
		private Opcode opcode;
		private bool mask;
		private byte[] maskingKey;
		private byte[] payload;

		public WebSocketFrame(string payload) : this(Encoding.UTF8.GetBytes(payload))
		{
		}

		public WebSocketFrame(byte[] payload)
		{
			this.fin = true;
			this.mask = true;
			this.opcode = Opcode.Text;
			this.maskingKey = new byte[4];
			new Random().NextBytes(this.maskingKey);
			this.payload = payload;
		}

		public bool Fin { get { return fin; } set { fin = value; } }
		public Opcode Opcode { get { return opcode; } set { opcode = value; } }
		public bool Mask { get { return mask; } set { mask = value; } }
		public byte[] MaskingKey { get { return maskingKey; } set { maskingKey = value; } }
		public byte[] Payload { get { return payload; } set { payload = value; } }

		public byte[] Encode()
		{
			int len = payload.Length;
			int capacity = 2 + len;

			if (len <= 125)
				capacity += 0;
			else if (len <= 65535)
				capacity += 2;
			else
				capacity += 8;

			if (mask)
				capacity += 4;

			MemoryStream stream = new MemoryStream(new byte[capacity], 0, capacity, true, true);

			// fin(1) | reserved(3) | opcode(4)
			int b1 = (int)opcode;
			if (fin)
				b1 |= 0x80;

			stream.WriteByte((byte)b1);

			// mask(1) | payload len(7) | extended payload len (16 or 64)

			if (len <= 125)
			{
				stream.WriteByte((byte)maskBit(len));
			}
			else if (len <= 65535)
			{
				stream.WriteByte((byte)maskBit(126));
				stream.WriteByte((byte)(len >> 8));
				stream.WriteByte((byte)len);
			}
			else 
			{
				stream.WriteByte((byte)maskBit(127));
				for (int i = 7; i >= 0; i--)
					stream.WriteByte((byte)(len >> (i * 8)));
			}

			if (mask)
			{
				stream.Write(maskingKey, 0, maskingKey.Length);

				// encode payload
				byte[] masked = new byte[payload.Length];
				for (int i = 0; i < payload.Length; i++)
					masked[i] = (byte)(payload[i] ^ maskingKey[i % 4]);
				stream.Write(masked, 0, masked.Length);
			}
			else
			{
				stream.Write(payload, 0, payload.Length);
			}

			return stream.GetBuffer();
		}

		private int maskBit(int b) 
		{
			return mask ? b | 0x80 : b;
		}
	}
}

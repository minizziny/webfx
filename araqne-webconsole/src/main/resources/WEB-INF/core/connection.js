define(["/lib/jquery.js"], function(_$) {


function ConnectionManager() {
	var self = this;
	var connWs;
	var msgmap = {};

	function msgobj(single) {
		var response = { 
			body: single[1]
		};
		if(single[0].hasOwnProperty('errorCode')) {
			response['isError'] = (single[0].errorCode) ? true : false;	
		}

		return response;
	}

	function guidGenerator() {
		var s4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
	}

	this.send = function(method, options, callback, request_option) {

		var defaultoptions = {};
		options = $.extend(defaultoptions, options);

		function getSource() {
			var sid = (request_option) ? request_option.source : window.__pid;
			if(sid == undefined) return "0";
			else return sid.toString();
		}

		var request = [
			{
				"guid": guidGenerator(),
				"type": "Request",
				"source": getSource(),
				"target": "",
				"method": method
			}, options
		];

		msgmap[request[0].guid] = callback;

		if(connWs == undefined) {
			$.post("/msgbus/request", JSON.stringify(request), function(raw, status, jqxhr) {
				onMessageReceived(raw);
			});
		}
		else {
			//console.log(connWs.readyState)
			if(connWs.readyState == 1) {
				connWs.send(JSON.stringify(request));
			}
			else {
				console.log('websocket connection delayed')
				connWs.onopen = function() {
					connWs.send(JSON.stringify(request));
					setTimeout(function() {
						connWs.onopen = null;
					}, 500);
				}
			}
		}

	}

	function onMessageReceived(resp) {
		var full;
		try { full = JSON.parse(resp); }
		catch(e) {
			console.log("received message is not JSON", resp);
		}
		
		if(full == undefined) return;

		if(full[0].type == "Response") {
			var response = msgobj(full);

			var callback = msgmap[full[0].requestId];
			delete msgmap[full[0].requestId];
			//console.log( msgmap, callback)

			if(response.isError) {
				if(full[0].errorCode === "security" && full[0].errorMessage === "Security Violation") {
					self.send("org.araqne.dom.msgbus.LoginPlugin.getPrincipal", {}, function(resp, raw1) {

						if(resp.body.admin_login_name == null && resp.body.org_domain == null) {
							alert("로그인이 필요합니다.")
							parent.location.href = "/index.html";
							//$("#login").show();
						}
						else {
							callback(response, full);
						}
					})
					return;
				}
			}
			callback(response, full);
		}
		else if (full[0].type == "Trap") {
			onTrap(full, resp);
		}
		
	}

	function onTrap(obj, resp) {
		var response = msgobj(obj);
		var method_name = obj[0].method;

		if(!msgmap.hasOwnProperty(method_name)) {
			return;
		}
		else {
			msgmap[method_name]([response], resp);
		}

	}

	var doPoll = function() {
		console.log('doPoll')

		$.ajax({
			url: "/msgbus/trap",
			success: function(resp, status, jqxhr) {
				var full;
				try { full = JSON.parse(resp); }
				catch(e) {
					console.log("received message is not JSON", raw);
				}
				
				if(full == undefined) return;

				$.each(full, function(i, obj) {
					onTrap(obj, resp);
				});
			},
			timeout: 30000,
			complete: function() {
				doPoll();
			}
		});
	}

	this.register = function(name, ontrap, callback) {
		if(name == null) return;

		console.log("register " + name);

		self.send("org.araqne.msgbus.PushPlugin.subscribe", {
			callback: name
		}, function(m) {
			msgmap[name] = ontrap;

			if(connWs == undefined && !window.WebSocket) {
				doPoll();
			}

			if(callback != null) {
				callback(m);
			}

		}, {
			source: "0"
		})
	};

	this.unregister = function(name, ontrap, callback) {
		if(name == null) return;

		console.log("unregister " + name);

		msgmap[name] = null;
		delete msgmap[name];

		self.send("org.araqne.msgbus.PushPlugin.unsubscribe", {
			callback: name
		}, function(resp) {
			console.log('unregistered');
			if(callback != null) {
				callback(resp);
			}
		});
	};

	this.debugMessageMap = function() { 
		console.log(msgmap);
	}

	//doPoll();
	//return;

	if(!window.WebSocket) {
		doPoll();
	}
	else {
		connWs = new WebSocket('ws://' + location.host + '/websocket');
		connWs.onmessage = function(e) {
			//console.log(e)
			onMessageReceived(e.data);
		}
		connWs.onerror = function(e) {
			console.log(e);
		}
	}


}

var Core = parent.Core;
if(!Core) {
	Core = parent.Core = {};
}

if(!Core.Connection) {
	console.log("register Connection manager globally");
	parent.Core.Connection = new ConnectionManager();
}

return {
	"registerTrap": parent.Core.Connection.register,
	"unregisterTrap": parent.Core.Connection.unregister,
	"send": parent.Core.Connection.send,
	"msgmap": parent.Core.Connection.debugMessageMap
}

});
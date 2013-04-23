define([], function() {

function msgobj(single) {
	//console.log(single);
	var response = { 
		body: single[1],
		isError: (single[0].errorCode) ? true : false
	};
	return response;
}

function guidGenerator() {
	var s4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};
	return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
}

function send(method, options, callback, request_option) {

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

	//console.log(request[0].source)

	$.post("/msgbus/request", JSON.stringify(request), function(raw, status, jqxhr) {
		var full;
		if($.browser.mozilla) {
			full = JSON.parse(jqxhr.responseText);
		}
		else {
			full = JSON.parse(raw);
		}
		
		var response = msgobj(full);

		if(response.isError) {
			if(full[0].errorCode === "security" && full[0].errorMessage === "Security Violation") {
				send("org.araqne.dom.msgbus.LoginPlugin.getPrincipal", {}, function(resp, raw1) {

					if(resp.body.admin_login_name == null && resp.body.org_domain == null) {
						alert("로그인이 필요합니다.")
						parent.location.href = "/index.html";
					}
					else {
						callback(response, full);
					}
				})
				return;
			}
		}

		callback(response, full);
	});
}

function Trap() {
	var isDebug = false;
	var map = {};
	var nowPolling = false;

	var doPoll = function() {
		nowPolling = true;

		if(isDebug) {
			console.log((new Date()).getISODateString() + " doPoll");
		}

		$.ajax({
			url: "/msgbus/trap",
			success: function(resp, status, jqxhr) {
				var full;
				if($.browser.mozilla) {
					full = JSON.parse(jqxhr.responseText);
				}
				else {
					full = JSON.parse(resp);
				}
				//console.log(full)

				$.each(full, function(i, obj) {
					var response = msgobj(obj);
					var method_name = obj[0].method

					if(!map.hasOwnProperty(method_name)) {
						//console.log(method_name + " passed!!!");
						return;
					}
					else {
						//console.log(method_name + " dododo!!!");
						map[method_name]([response], resp, status, jqxhr);
					}

					//console.log(response)
					//if(name === response.method) {
					//callback(arr, resp, status, jqxhr);
					//}
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


		if(isDebug) {
			console.log("register " + name);
		}


		send("org.araqne.msgbus.PushPlugin.subscribe", {
			callback: name
		}, function(m) {
			map[name] = ontrap;

			if(!nowPolling) {
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

		if(isDebug) {
			console.log("unregister " + name);
		}

		map[name] = null;
		delete map[name];

		send("org.araqne.msgbus.PushPlugin.unsubscribe", {
			callback: name
		}, function(resp) {
			console.log('unregistered');
			if(callback != null) {
				callback(resp);
			}
		});
	};

	this.items = function() { 
		console.log("------------items--------------");
		console.log(map);
	}
}

var trap = new Trap();

return {
	"registerTrap": trap.register,
	"unregisterTrap": trap.unregister,
	"send": send,
	"debugTrap": trap.items
}

});
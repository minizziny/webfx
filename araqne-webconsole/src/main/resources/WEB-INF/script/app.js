var app = angular.module('App', [
	'App.Service',
	'App.Service.Logdb',
	'App.Service.Logdb.Management',
	'App.Service.Dom',
	'App.Service.Chart',
	'App.Filter',
	'App.Directive.Logdb',
	'App.Directive',
	'ui.sortable'
]);

var dateFormat = d3.time.format('%Y-%m-%d %H:%M:%S');

function checkDate(member, i) {
	if(member == undefined) return false;
	var rxTimezone = new RegExp('\\+\\d{4}');
	return myApp.isDate(dateFormat.parse(member.toString().substring(0,19))) && rxTimezone.test(member.substring(19, 24));
}

function throttle(fn, threshhold, scope) {
	threshhold || (threshhold = 250);
	var last,
	deferTimer;
	return function () {
		var context = scope || this;

		var now = +new Date,
		args = arguments;
		if (last && now < last + threshhold) {
			// hold on to it
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function () {
				last = now;
				fn.apply(context, args);
			}, threshhold);
		} else {
			last = now;
			fn.apply(context, args);
		}
	};
}

function Async(fn) {
	var guid =  Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
	var callback = {};
	var name = fn.name;
	this.success = function(fn) {
		callback.success = fn;
		return this;
	}

	this.failed = function(fn) {
		callback.failed = fn;
		return this;
	}

	this.created = function(fn) {
		callback.created = fn;
		return this;
	}

	this.started = function(fn){
		callback.started = fn;
		return this;
	}

	this.pageLoaded = function(fn) {
		callback.pageLoaded = fn;
		return this;
	}

	this.loaded = function(fn) {
		callback.loaded = fn;
		return this;
	}

	this.onTimeline = function(fn) {
		callback.onTimeline = fn;
		return this;
	}

	this.onStatusChange = function(fn) {
		callback.onStatusChange = fn;
		return this;
	}

	this.done = function(fname) {
		var args = Array.prototype.slice.call(arguments);
		args.shift();
		if(callback.hasOwnProperty(fname)) {

			//if(fname == "onTrap") console.log(guid);

			callback[fname].apply(this, args);	
		}
		else {
			if(fname != 'created' && fname != 'onTimeline' && fname != 'onStatusChange' && fname != 'started') {
				console.warn(name + '.' + fname + ', but do nothing')
			}
			//console.trace();
		}
		
		return this;
	}

	this.debug = function(fname) {
		console.log(callback[fname]);
	}

	var args = Array.prototype.slice.call(arguments);
	args.shift();
	fn.apply(this, args);
	return this;
}

function msgbusFailed(m, raw) {
	console.warn('msgbus ' + raw[0].method + ' failed');
	console.log(raw);
}

app.factory('socket', function() {
	function msgobj(single) {
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

	function send(method, options, pid) {
		var self = this, defaultoptions = {};
		options = $.extend(defaultoptions, options);

		var request = [
			{
				"guid": guidGenerator(),
				"type": "Request",
				"source": pid.toString(),
				"target": "",
				"method": method
			}, options
		];

		if(!!parent.Core) {////.Connection) {
			//console.log(parent.Core.Connection);

			parent.Core.Connection.send(method, options, function(resp, full) {
				if(resp.isError) {
					self.done('failed', resp, full);
				}
				else {
					self.done('success', resp, full);
				}
			}, { 'source': pid.toString() });
		}
		else {
			$.ajax({
				'type': 'POST',
				'url': '/msgbus/request',
				'data': JSON.stringify(request),
				'success': function(raw, status, jqxhr) {
					var full = JSON.parse(raw);
					var resp = msgobj(full);

					if(resp.isError) {
						self.done('failed', resp, full);
					}
					else {
						self.done('success', resp, full);
					}
				}
			});
		}
	}

	return {
		send: function(method, options, pid) {
			return new Async(send, method, options, pid);
		},
	}
})

app.factory('serviceSession', function(socket) {
	function login(nick, password, pid) {
		var self = this;

		function afterHello(m) {
			var nonce = m.body.nonce;
			var hashedpwd = CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex);
			var hash = CryptoJS.SHA1(hashedpwd + nonce).toString(CryptoJS.enc.Hex);

			socket.send("org.araqne.dom.msgbus.LoginPlugin.login", {
				"nick": nick,
				"hash": hash,
				"force": false
			}, pid)
			.success(function(m, raw) {
				if(m.body.result === "success") {
					socket.send("org.araqne.logdb.msgbus.ManagementPlugin.login", {
						"login_name": "araqne",
						"password": ""
					}, pid)
					.success(function() {
						self.done('success');
					})
					.failed(function(m, raw) {
						self.done('failed', m, raw);
					})
				}
				else {
					self.done('failed', m, raw);
				}
			})
			.failed(function(m, raw) {
				self.done('failed', m, raw);
			});
		}

		socket.send("org.araqne.dom.msgbus.LoginPlugin.hello", {}, pid).success(afterHello);
	}

	function logout() {
		var logout1 = "org.araqne.logdb.msgbus.ManagementPlugin.logout";
		var logout2 = "org.araqne.dom.msgbus.LoginPlugin.logout";
		socket.send(logout1, {}, 0)
		.success(function(m, raw) {
			console.log("logdb session closed")
			socket.send(logout2, {}, 0)
			.success(function(m2, raw2) {
				location.href = "index.html";
			})
			.failed(function() {
				console.log('logout2 failed');
			});
		})
		.failed(function() {
			console.log('logout1 failed');
		})
	}

	function getSessions() {
		return socket.send("org.araqne.dom.msgbus.LoginPlugin.getPrincipal", {}, proc.pid)
	}

	var ret = {
		login: function(id, pw) {
			return new Async(login, id, pw, window.proc.pid);
		},
		logout: logout,
		getSessions: getSessions
	};

	return ret;
});

app.factory('servicePush', function(socket) {
	var msgmap = {};

	function msgobj(single) {
		var response = { 
			body: single[1],
			isError: (single[0].errorCode) ? true : false
		};
		return response;
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
		//console.log('doPoll')

		$.ajax({
			url: "/msgbus/trap",
			success: function(resp, status, jqxhr) {
				var full;
				try { full = JSON.parse(resp); }
				catch(e) {
					console.log("received message is not JSON", resp);
				}
				
				if(full == undefined) return;

				$.each(full, function(i, obj) {
					onTrap(obj, resp);
				});

				doPoll();
			},
			timeout: 30000,
			error: function(jqxhr) {
				console.log(jqxhr);
				setTimeout(doPoll, 5000);
			}
		});
	}

	function register(name, pid, ontrap, callback) {
		if(!!parent.Core) {
			parent.Core.Connection.register(name, ontrap, callback, pid);
			return;
		}

		if(name == null) return;

		socket.send("org.araqne.msgbus.PushPlugin.subscribe", {
			callback: name
		}, pid)
		.success(function(m) {
			msgmap[name] = ontrap;

			//if(connWs == undefined && !window.WebSocket) {
				doPoll();
			//}

			if(callback != null) {
				callback(m);
			}

		});
	};

	function unregister(name, pid, callback) {
		if(!!parent.Core) {
			parent.Core.Connection.unregister(name, null, callback, pid);
			return;
		}

		if(name == null) return;

		msgmap[name] = null;
		delete msgmap[name];

		socket.send("org.araqne.msgbus.PushPlugin.unsubscribe", {
			callback: name
		}, pid)
		.success(function(resp) {
			console.log('unregistered');
			if(callback != null) {
				callback(resp);
			}
		});
	};

	//doPoll();

	return {
		register: register,
		unregister: unregister
	};
});

app.factory('serviceProgram', function(socket) {
	var programTree = [

	];

	function getProgramTree() {
		return programTree;
	}

	return {
		getProgramTree: getProgramTree
	};
});

app.factory('serviceTask', function($http) {

	//console.log($http);

	var tasks = [],
		key = 'users',
		cache;

	var events = {
		taskChanged: undefined
	};

	tasks.push = function() {		
		return set(arguments);
	}

	function get() {
		return localStorage.getItem(key);
	}

	function set(val) {
		var ret = Array.prototype.push.apply(tasks, val);
		
		localStorage.setItem(key, JSON.stringify(tasks));
		//console.log(get());
		return ret;
	}

	function polling() {
		var newer = get();
		if(cache != newer && events.taskChanged != undefined) {
			cache = newer;
			events.taskChanged.call(this);
		}
		else {
			//console.log("polling");
		}

		setTimeout(arguments.callee, 500);
	}

	function init() {
		//polling();
	}

	function Process(name, pid) {
		this.name = name;

		this.pid = pid;

		this.windows = [];

		this.serialize = function() {
			return {
				name: this.name,
				pid: this.pid
			}
		}
	}

	function newPid() {
		return Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
	}
	
	function newProcess(name) {
		var proc = new Process(name, newPid());
		var serialize = proc.serialize();
		tasks.push(serialize);
		return serialize;
		//tasks.push(proc);
	}

	return {
		get: get,
		set: set,
		events: events,
		tasks: tasks,
		init: init,
		newProcess: newProcess
	};

});

function TaskController($scope, $document, serviceTask) {
	$scope.tasks = serviceTask.tasks;

	serviceTask.events.taskChanged = function() {
		//console.log('taskChanged');
	}

	$scope.changeSomething = function() {
		var obj = [{"name":"dashboard"},{"name":"devconsole"},{"name":"logquery"}];
		serviceTask.set(obj);
	}

	$scope.add = function() {
		var proc = new Process();
		$scope.tasks.push(proc.serialize());
	}

	var offsetY = 0;

	function visibleFn(event) {
	}
	
	var initTasks = [{"foo":"bar"},{"hello":"world"},{"name":"logquery"}];
	serviceTask.set(initTasks);
	
	$document.bind('scroll', visibleFn);
}

function ProgramController($scope) {

}


function computerFormatPrefix(val) {
	var computerFormatPrefixes = [ "", "K", "M", "G", "T", "P", "E", "Z", "Y" ];
	function log1024(val) { return Math.log(val) / Math.log(1024); }

	var pow = Math.floor( log1024(val) );
	if(pow == -Infinity) {
		return { symbol: '', value: 0 };
	}
	else {
		return {
			symbol: computerFormatPrefixes[pow],
			value: val/Math.pow(1024, pow)
		};
	}
}

app.controller('TaskController', TaskController);
app.controller('ProgramController', ProgramController);

var myApp = {
	disposeAll: function disposeAll() {
		localStorage.removeItem('users');
	}
}

Array.prototype.forEach.call(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name, i) {
	myApp['is' + name] = function(obj) {
		return toString.call(obj) == '[object ' + name + ']';
	};
});

String.prototype.blank = function() {
	return /^\s*$/.test(this);
}

String.prototype.isJSON = function() {
	var str = this;
	if (str.blank()) return false;
	str = str.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@');
	str = str.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']');
	str = str.replace(/(?:^|:|,)(?:\s*\[)+/g, '');
	return (/^[\],:{}\s]*$/).test(str);
}

/*
$(parent.window).on('beforeunload', myApp.disposeAll);
$(parent.window).on('unload', myApp.disposeAll);
$(window).on('beforeunload', myApp.disposeAll);
$(window).on('unload', myApp.disposeAll);
*/
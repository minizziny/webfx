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

	this.getResult = function(fn) {
		callback.getResult = fn;
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

function CustomEvent(obj) {
	var events = {};

	function fire() {
		var eventArr = this;
		var args = arguments;
		this.forEach(function(obj) {
			obj.apply(eventArr, args);
		});
	}

	function on(eventName, fn) {
		if( events[eventName] == undefined ){
			events[eventName] = [];
			events[eventName].fire = fire;
		}
		events[eventName].push(fn);

		obj[eventName] = function() {
			events[eventName].fire();
		}
	}

	function off(eventName, fn) {
		if(!(eventName in events)) return;

		var eventArr = events[eventName];
		if(eventArr.indexOf(fn) != -1) {
			eventArr.splice(eventArr.indexOf(fn), 1);
		}
	}

	function clear(eventName) {
		delete events[eventName];
	}

	this.dispatchEvent = function(eventName) {
		console.log('dispatchEvent', events)
		if(events.hasOwnProperty(eventName)) {
			events[eventName].fire();
		}
	}

	this.on = on;
	this.off = off;
	this.clear = clear;
}

angular.module('app.connection', ['app.utility'])
.factory('socket', function($q, $filter, serviceUtility) {
	var ws = initialize();
	var wse = new CustomEvent(ws);
	var msgmap = {}

	function initialize() {
		var ws = new WebSocket('ws://' + location.host + '/websocket');
		ws.onmessage = function(e) {
			onMessageReceived(e.data);
		}
		ws.onerror = function(e) {
			console.log(e);
		}
		ws.onclose = function(e) {
			alert($filter('translate')('$S_msg_SessionExpired'));
			location.reload();
		}

		function ping() {
			ws.send('ping');
		}

		setInterval(ping, 10000);
		return ws;
	}

	function send(method, options, pid) {
		var self = this;

		var request = [{
			'guid': serviceUtility.generateType1(),
			'type': 'Request',
			'source': pid.toString(),
			'target': '',
			'method': method
		}, options];

		msgmap[request[0].guid] = {
			time: new Date(),
			promise: self
		};

		if(ws.readyState == 1) {
			ws.send(JSON.stringify(request));
		}
		else if(ws.readyState == 2 || ws.readyState == 3) {
			alert($filter('translate')('$S_msg_SessionExpired'))
		}
		else if(ws.readyState == 0) {
			console.log('websocket connection delayed', request[0].method);
			var fnOnopen = function() {
				console.log('send', request[0].method);
				ws.send(JSON.stringify(request));
				wse.clear('onopen');
			};
			wse.on('onopen', fnOnopen);
		}
		else {
			console.error('websocket error', ws);
		}
	}

	function onMessageReceived(resp) {
		try { resp = JSON.parse(resp); }
		catch(e) {
			console.log("received message is not JSON", resp);
		}

		if(resp[0].type == 'Response') {
			var defer = msgmap[resp[0].requestId];
			if(resp[0].hasOwnProperty('errorCode')) {
				defer.promise.done('failed', resp[1], resp);
			}
			else {
				defer.promise.done('success', { 'body': resp[1] }, resp);
			}
		}
		else if(resp[0].type == 'Trap') {
			//console.log(resp)
			onTrap(resp, resp);
		}		
	}

	function onTrap(obj, resp) {
		var method_name = obj[0].method;

		if(!msgmap.hasOwnProperty(method_name)) {
			return;
		}
		else {
			msgmap[method_name]([{'body': obj[1]}], resp);
		}

	}

	function register(name, pid, ontrap, callback) {
		if(name == null) return;

		(new Async(send, 'org.araqne.msgbus.PushPlugin.subscribe', {
			callback: name
		}, pid))
		.success(function(m) {
			msgmap[name] = ontrap;

			if(callback != null) {
				callback(m);
			}

		});
	};

	function unregister(name, pid, callback) {
		if(name == null) return;

		msgmap[name] = null;
		delete msgmap[name];

		(new Async(send, 'org.araqne.msgbus.PushPlugin.unsubscribe', {
			callback: name
		}, pid))
		.success(function(resp) {
			if(callback != null) {
				callback(resp);
			}
		});
	};

	return {
		send: function(method, options, pid) {
			return new Async(send, method, options, pid);
		},
		register: register,
		unregister: unregister
	}
})
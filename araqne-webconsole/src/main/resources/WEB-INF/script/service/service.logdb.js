
var logdb;
if(logdb == null) {
	logdb = {
		disposeAll: function disposeAll() {
			for (var i = logdb.queries.length - 1; i >= 0; i--) {
				if(logdb.queries[i].getBg()) continue;
				logdb.queries[i].dispose();
			}
		},
		queries: [],
		queriesEls: [],
		$apply: function() {
			for (var i = logdb.queriesEls.length - 1; i >= 0; i--) {
				logdb.queriesEls[i].$apply();
			};
		}
	};
}


angular.module('app.logdb', [])
.factory('serviceLogdb', function(socket) {

	function QueryClass(pid, applyFn, options) {
		var clazz = this;
		var props = $.extend({
			id: -1,
			query: '',
			status: 'Idle',
			bg: false
		}, options);

		this.id = props.id;
		this.query = props.query;
		this.status = props.status;
		this.bg = props.bg;
		this.pid = pid;

		var isDisposed = false;

		var asyncQuery;
		/* Start QueryClass */

		function onTrap(resp) {
			var m = resp[0];
			/*
			callback.pageLoading(m);

			if(m.isError) {
				clearQuery();
				return;
			}
			*/
			//console.log(m)
			
			var id = m.body.id;
			if(id != clazz.id) {
				console.log("not same: " + id);
				return;	
			}

			if(m.body.type == "page_loaded") {
				asyncQuery.done('pageLoaded', m);
				applyFn();
			}
			else if(m.body.type == "eof" && m.body.hasOwnProperty('total_count')) {
				//console.log("eof unregistered")
				unregisterTrap();

				if(m.body.total_count < defaultLimit) {
					getResult(id, 0)
				}

				clazz.status = 'End';
				asyncQuery.done('loaded', m);
				applyFn();
				/*******
				that.totalCount(m.body.total_count);

				callback.loaded(m);
				*****/
			}
			else if(m.body.type == "eof" && m.body.hasOwnProperty('span_field')) {
				console.log('timeline eof', m);
			}
			else if(m.body.type == "periodic") {
				console.log('periodic', m);
			}
			else if(m.body.type == "status_change") {
				//console.log('status change', m.body);
				asyncQuery.done('onStatusChange', m);
				applyFn();
			}
			else {
				console.log("error");
				console.log(resp)
			}
		}

		function onTimeline(resp) {
			asyncQuery.done('onTimeline', resp[0]);
		}

		var defaultLimit = 15;

		function createQuery(string, limit) {
			if(isDisposed) {
				throw new TypeError('do not reuse this instance!');
				return;
			}

			clazz.query = string;

			if(limit != undefined) {
				defaultLimit = limit;
			}
			else {
				defaultLimit = 15;
			}
			//console.log(string, limit);
			
			asyncQuery = this;

			dispose();

			socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.createQuery', {
				'query': string
			}, pid)
			.success(function(m) {
				
				clazz.id = m.body.id;
				clazz.status = 'Waiting';
				registerTrap(function() {
					asyncQuery.done('created', m);
					applyFn();
					startQuery();
				});
			})
			.failed(function(m, raw) {
				clazz.status = 'Failed';

				asyncQuery.done('failed', m, raw);
				applyFn();
				console.log(raw, 'cannot create query');
			})

		}

		function registerTrap(callback) {
			if(asyncQuery == undefined) {
				asyncQuery = this;	
			}
			
			var name = 'logstorage-query-' + clazz.id;
			var tname = 'logstorage-query-timeline-' + clazz.id;

			socket.register(name, pid, onTrap, function(resp) {

				socket.register(tname, pid, onTimeline, function(resp) {
					if(callback != undefined) {
						callback();	
					}
				});
				
			});
		}

		function unregisterTrap(callback) {
			var name = 'logstorage-query-' + clazz.id;
			var tname = 'logstorage-query-timeline-' + clazz.id;

			socket.unregister(name, pid, function(resp) {

				socket.unregister(tname, pid, function(resp) {
					if(callback != undefined) {
						callback();	
					}
				});
			});
		}

		function startQuery() {
			socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.startQuery',
			{
				'id': clazz.id,
				'offset': 0,
				'limit': defaultLimit,
				'timeline_limit': 10
			}, pid)
			.success(function(m) {
				clazz.status = 'Running';
				asyncQuery.done('started', m);
				applyFn();
			})
			.failed(function(m) {
				asyncQuery.done('failed', m);
				applyFn();
			});
		}

		function getResult(id, offset, limit, callback) {
			socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.getResult',
			{
				id: id,
				offset: offset,
				limit: ((limit == undefined) ? defaultLimit : limit),
			}, pid)
			.success(function(m) {
				asyncQuery.done('getResult', m);
				applyFn();

				if(!!callback) {
					callback(m);
				}
			})
			.failed(function(m, resp) {
				console.log('getResult failed', resp, id)
			});
		}

		function stopQuery() {
			return socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.stopQuery', { id: clazz.id }, pid)
				.success(function() {
					//console.log('stopQuery success')
				})
				.failed(function() {
					console.log('stopQuery error')
				});
		}

		function removeQuery() {
			return socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.removeQuery', { id: clazz.id }, pid)
				.success(function() {

				})
				.failed(function() {
					console.log('removeQuery error')
				});
		}

		function dispose() {
			if(isDisposed) {
				try {
					console.log('dispose failed isDisposed', clazz.id);
				} catch(e) {}
				return;
			}
			if(clazz.id == -1) {
				return;
			}

			removeQuery();
			unregisterTrap();

			isDisposed = true;
			try {
				console.log('dispose', clazz.id);
			} catch(e) {}
		}

		return {
			query: function(string, limit) {
				return new Async(createQuery, string, limit);
			},
			dispose: function() {
				return new Async(dispose);
			},
			stop: function() {
				return new Async(stopQuery);
			},
			registerTrap: function(callback) {
				return new Async(registerTrap, callback)
			},
			unregisterTrap: function(callback) {
				return new Async(unregisterTrap, callback)
			},
			getResult: function() {
				var args = Array.prototype.slice.call(arguments);
				args.splice(0, 0, clazz.id);
				//console.log(args)
				getResult.apply(this, args);
			},
			id: function() {
				return clazz.id;
			},
			getId: function() {
				return clazz.id;
			},
			getQueryString: function() {
				return clazz.query;
			},
			getStatus: function() {
				return clazz.status;
			},
			getPid: function() {
				return clazz.pid;
			},
			getBg: function() {
				return clazz.bg;
			},
			setBg: function(value) {
				clazz.bg = value;
			},
			getQueryStatus: function() {
				return socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.queryStatus', { id: clazz.id }, pid);
			}
		}

		/* End QueryClass */
	}

	function create(pid) {

		var instance = new QueryClass(pid, function() {
			logdb.$apply();
		});
		logdb.queries.push(instance);
		return instance;
	}

	function remove(instance) {
		instance.dispose();
		var idx = logdb.queries.indexOf(instance);
		logdb.queries.splice(idx, 1);
		logdb.$apply();
	}

	function createFromBg(pid, id, str, status) {
		var instance = new QueryClass(pid, function() {
			logdb.$apply();
		}, {
			'id': id,
			'query': str,
			'status': status,
			'bg': false
		});
		logdb.queries.push(instance);
		logdb.$apply();
		return instance;
	}

	function createBg(id, str, status) {
		var instance = new QueryClass(0, function() {
			logdb.$apply();
		}, {
			'id': id,
			'query': str,
			'status': status,
			'bg': true
		});
		logdb.queries.push(instance);
		logdb.$apply();
		return instance;
	}

	function getQueries(callback) {
		socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.queries', {}, 0)
		.success(function(m) {
			var queries = m.body.queries;
			console.log('getQueries', m.body)
			for (var i = 0; i < queries.length; i++) {
				var has = logdb.queries.some(function(queryInst) {
					return queryInst.getId() == queries[i].id;
				});
				if(has) {
					//console.log('call twice', has)
					continue;
				}

				var query = queries[i];
				createBg(query.id, query.query_string, query.commands[query.commands.length - 1].status);
			};
			if(callback != undefined) {
				callback(m);
			}

		})
		.failed(function(m) {
			console.log('get queries failed', m)
		});	
	}

	function setRunMode(id, background, callback) {
		socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.setRunMode', { 'id': id, 'background': background }, proc.pid)
		.success(function(m) {
			var found = logdb.queries.filter(function(query) {
				return query.getId() == id;
			});
			console.log('setRunMode', found, background);
			found[0].setBg(background);
			logdb.$apply();

			if(callback != undefined){
				callback(m, found[0]);
			}
		})
		.failed(msgbusFailed);
	}

	getQueries();

	console.log('serviceLogdb init');
	

	return {
		create: create,
		createFromBg: createFromBg,
		remove: remove,
		getQueries: getQueries,
		setForeground: function(id, callback) {
			return setRunMode(id, false, function(m, qinst) {
				logdb.queries.splice(logdb.queries.indexOf(qinst), 1);
				if(!!callback) {
					callback(m, qinst);
				}
			});
		},
		setBackground: function(id, callback) {
			return setRunMode(id, true, callback);
		}
	}
});


window.addEventListener('unload', logdb.disposeAll);
window.addEventListener('beforeunload', logdb.disposeAll);


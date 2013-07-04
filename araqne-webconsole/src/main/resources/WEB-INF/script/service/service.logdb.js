angular.module('App.Service.Logdb', [])
.factory('serviceLogdb', function(servicePush, socket) {

	function QueryClass(pid) {
		var clazz = this;
		this.id = -1;
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
			}
			else if(m.body.type == "eof" && m.body.hasOwnProperty('total_count')) {
				//console.log("eof unregistered")
				unregisterTrap();

				if(m.body.total_count < 15) {
					getResult(id, 0)
				}

				asyncQuery.done('loaded', m);
				/*******
				that.totalCount(m.body.total_count);

				callback.loaded(m);
				*****/
			}
			else if(m.body.type == "eof" && m.body.hasOwnProperty('span_field')) {
				//console.log('timeline eof', m)
			}
			else if(m.body.type == "periodic") {
				//console.log('periodic', m);
			}
			else if(m.body.type == "status_change") {
				//console.log('status change', m);
			}
			else {
				console.log("error");
				console.log(resp)
			}
		}

		function onTimeline() {
			//console.log('onTimeline')
		}

		function createQuery(string) {
			asyncQuery = this;

			dispose();

			socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.createQuery', {
				'query': string
			}, pid)
			.success(function(m) {
				
				clazz.id = m.body.id;
				registerTrap(m);
			})
			.failed(function(m, raw) {
				asyncQuery.done('failed', m, raw);
				console.log(raw, 'cannot create query');
			})

		}

		function registerTrap(m) {
			var name = 'logstorage-query-' + clazz.id;
			var tname = 'logstorage-query-timeline-' + clazz.id;

			servicePush.register(name, pid, onTrap, function(resp) {

				servicePush.register(tname, pid, onTimeline, function(resp) {
					asyncQuery.done('created', m);
					startQuery();
				});
				
			});
		}

		function unregisterTrap() {
			var name = 'logstorage-query-' + clazz.id;
			var tname = 'logstorage-query-timeline-' + clazz.id;

			servicePush.unregister(name, pid, function(resp) {
				//console.log('unregistered query', pid);

				servicePush.unregister(tname, pid, function(resp) {
					//console.log('unregistered timeline', pid);
				});
			});
		}

		function startQuery() {
			socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.startQuery',
			{
				'id': clazz.id,
				'offset': 0,
				'limit': 15,
				'timeline_limit': 10
			}, pid)
			.success(function(m) {
				
			})
			.failed(function(m) {
				asyncQuery.done('failed', m);
			});
		}

		function getResult(id, offset, limit, callback) {
			socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.getResult',
			{
				id: id,
				offset: offset,
				limit: ((limit == undefined) ? 15 : limit),
			}, pid)
			.success(function(m) {
				asyncQuery.done('pageLoaded', m);

				if(!!callback) {
					callback();
				}
			})
			.failed(function(m, resp) {
				console.log('getResult failed', resp)
			});
		}

		function stopQuery() {
			return socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.stopQuery', { id: clazz.id }, pid)
				.failed(function() {
					console.log('stopQuery error')
				});
		}

		function removeQuery() {
			return socket.send('org.araqne.logdb.msgbus.LogQueryPlugin.removeQuery', { id: clazz.id }, pid)
				.success(function() {
					//console.log('removeQuery success')
				})
				.failed(function() {
					console.log('removeQuery error')
				});
		}

		function dispose() {
			if(clazz.id == -1) return;

			stopQuery().success(function(m) {
				removeQuery();
			}).failed(function(m) {
				removeQuery();
			});
			unregisterTrap();
		}

		return {
			query: function(string) {
				return new Async(createQuery, string);
			},
			dispose: function() {
				return new Async(dispose);
			},
			getResult: function() {
				var args = Array.prototype.slice.call(arguments);
				args.splice(0, 0, clazz.id);
				getResult.apply(this, args);
			},
			id: function() {
				return clazz.id;
			}
		}

		/* End QueryClass */
	}

	function create(pid) {

		var instance = new QueryClass(pid);
		logdb.queries.push(instance);
		return instance;
	}

	function remove(instance) {
		instance.dispose();
		var idx = logdb.queries.indexOf(instance);
		logdb.queries.splice(idx, 1);
	}

	return {
		create: create,
		remove: remove
	}
});

var logdb = {
	disposeAll: function disposeAll() {
		for (var i = logdb.queries.length - 1; i >= 0; i--) {
			logdb.queries[i].dispose();
		};
		console.log('disposeAll')
	},
	queries: []
}

window.addEventListener('unload', logdb.disposeAll);
window.addEventListener('beforeunload', logdb.disposeAll);

parent._logdb = logdb;
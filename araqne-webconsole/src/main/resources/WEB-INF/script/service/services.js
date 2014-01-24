angular.module('app.services', [])
.factory('serviceLocalLogger', function(socket, eventSender, $translate, $filter) {
	var e = {
		listLoggers: function(callback) {
			socket.send("org.logpresso.core.msgbus.ArchivePlugin.listLoggers", {'locale':$translate.uses()}, eventSender.logsource.pid)
			.success(function(m) {
				var locals = m.body.loggers.filter(function(obj, i) {
					return obj.type == 'local';
				});

				callback(locals, m.body.loggers)
			})
			.failed(function(m, raw) {
				openError($filter, m, raw, eventSender);
			});
		},
		startLocalLogger: function(currentLogger, callback) {
			var obj = {
				'logger_name': currentLogger.name,
				'interval': currentLogger.interval
			}

			socket.send('org.logpresso.core.msgbus.ArchivePlugin.startLocalLogger', obj, eventSender.logsource.pid)
			.success(function(m) {
				currentLogger.is_running = true;
				callback();
			}).failed(function(m, raw) {
				openError($filter, m, raw, eventSender);
			});
		},
		stopLocalLogger: function(currentLogger, callback) {
			socket.send('org.logpresso.core.msgbus.ArchivePlugin.stopLocalLogger', {'logger_name': currentLogger.name}, eventSender.logsource.pid)
			.success(function(m) {
				currentLogger.is_running = false;
				callback();

			}).failed(function(m, raw) {
				openError($filter, m, raw, eventSender);
			});
		}
	}
	return e;
});

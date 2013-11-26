angular.module('app.logdb.management', [])
.factory('serviceLogdbManagement', function(socket) {
	function listTable() {
		return socket.send('org.araqne.logdb.msgbus.ManagementPlugin.listTables', {}, 0).failed(openError);
	}

	function grantPrivileges(login_name, table_names) {
		return socket.send('org.araqne.logdb.msgbus.ManagementPlugin.grantPrivileges', {
			'login_name': login_name,
			'table_names': table_names
		}, 0).failed(openError);
	}

	function setPrivileges(login_name, table_names) {
		return socket.send('org.araqne.logdb.msgbus.ManagementPlugin.setPrivileges', {
			'login_name': login_name,
			'table_names': table_names
		}, 0).failed(openError);
	}

	function getPrivileges(login_name) {
		return socket.send('org.araqne.logdb.msgbus.ManagementPlugin.getPrivileges', {
			'login_name': login_name
		}, 0).failed(openError);
	}

	return {
		listTable: listTable,
		grantPrivileges: grantPrivileges,
		setPrivileges: setPrivileges,
		getPrivileges: getPrivileges
	}
});
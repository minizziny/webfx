angular.module('app.dom', [])
.factory('serviceDom', function(socket) {
	
	function hasPermission(group, permission) {
		return socket.send('org.araqne.dom.msgbus.AdminPlugin.hasPermission', { 'group': group, 'permission': permission }, 0)
		.failed(openError);	
	}

	return {
		hasPermission: hasPermission
	}
});
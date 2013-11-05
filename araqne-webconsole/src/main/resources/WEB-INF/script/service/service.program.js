angular.module('app.program', [])
.factory('serviceProgram', function(socket) {

	function getAvailablePrograms() {
		return socket.send('org.araqne.dom.msgbus.ProgramPlugin.getAvailablePrograms', {}, 0);
	}

	return {
		getAvailablePrograms: getAvailablePrograms
	}
});
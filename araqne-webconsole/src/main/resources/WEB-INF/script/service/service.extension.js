angular.module('app.extension', [])
.factory('serviceExtension', function() {
	
	function getManifest(appid) {
		return $.getJSON('apps/' + appid + '/manifest.json');
	} 

	function load(appid) {
		return getManifest(appid);
	}

	function register(id, program, manifest) {
		extension.apps[program].push($.extend(manifest, {'id': id}));
	}

	function list(program) {
		return extension.apps[program];
	}

	return {
		load: load,
		getManifest: getManifest,
		register: register,
		list: list
	}
});
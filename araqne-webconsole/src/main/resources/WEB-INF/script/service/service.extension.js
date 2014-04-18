angular.module('app.extension', [])
.factory('serviceExtension', function() {
	
	function getManifest(appid) {
		return $.getJSON('apps/' + appid + '/manifest.json');
	} 

	function load(appid) {
		return getManifest(appid);
	}

	return {
		load: load,
		getManifest: getManifest
	}
});
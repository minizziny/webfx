angular.module('app.extension', [])
.factory('serviceExtension', function() {
	
	function getManifest(appid) {
		return $.getJSON('apps/' + appid + '/manifest.json');
	} 

	function load(appid) {
		return getManifest(appid);
	}

	function register(id, program, manifest) {
		// extension.apps[program].push($.extend(manifest, {'id': id}));
		extension.apps[program].push(manifest);
	}

	function list(program) {
		return extension.apps[program];
	}

	function getScripts(prefix, manifest) {
		var arr;
		if( angular.isArray(manifest.script) ) {
			arr = manifest.script.map(function(path) {
				return $.getScript(prefix + path);
			});
		}
		else if( angular.isString(manifest.script) ) {
			arr = [ $.getScript(prefix + manifest.script) ];
		}

		arr.push($.Deferred(function(deferred) {
			$(deferred.resolve);
		}));
		
		return $.when.apply(this, arr);
	}

	return {
		load: load,
		getManifest: getManifest,
		register: register,
		list: list,
		getScripts: getScripts
	}
});
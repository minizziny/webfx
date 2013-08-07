var app = angular.module('license', ['App']);
var proc;

app.directive('file', function() {
	return {
		scope: {
			file: '=',
			license: '='
		},
		link: function($scope, el, attrs) {
			el.bind('change', function(event) {

				var file = event.target.files[0];

				if (file) {
			      var fr = new FileReader();
			      fr.onload = function(e) { 
				      var contents = e.target.result;

			        //console.log(contents); 
			        $scope.license = contents;
			        $scope.$apply();
			      }
			      fr.readAsText(file);
			    } else { 
			      alert("Failed to load file");
			    }
				$scope.file = file ? file.name : undefined;
				$scope.$apply();
			});
		}
	};
});

function Controller($scope, serviceTask, socket) {
	serviceTask.init();
	proc = serviceTask.newProcess('license');

	$scope.hardwareKey;
	$scope.licenseInfo;
	$scope.queryAllowed;
	$scope.license;
	$scope.force = false;

	function hardwareKey() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.getHardwareKey', {
		}, proc.pid)
		.success(function(m) {
			$scope.hardwareKey = m.body.hardwareKey;

			if(m.isError) {
				console.log(m);
				return;
			}

			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
	}

	function isQueryAllowed() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.isQueryAllowed', {
		}, proc.pid)
		.success(function(m) {

			if(m.body.isQueryAllowed == true)
				$scope.queryAllowed = false;
			else
				$scope.queryAllowed = true;

			$scope.queryAllowed = m.body.isQueryAllowed;

			if(m.isError) {
				console.log(m);
				return;
			}

			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
	}

	function getLicenseInfos() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.getLicenseInfos', {
		}, proc.pid)
		.success(function(m) {

			console.log(m.body.licenses);

			$scope.licenseInfo = m.body.licenses;

			if(m.isError) {
				console.log(m);
				return;
			}

			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
	}

	$scope.setLicense = function() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.setLicense', { 
			license: $scope.license, force: $scope.force }, proc.pid)
		.success(function(m) {
			console.log("setLicense load");
			console.log(m);
			if(m.isError) {
				console.log(m);
				return;
			}

			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
	}

	isQueryAllowed();
	hardwareKey();
	getLicenseInfos();

}
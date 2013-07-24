var app = angular.module('regextester', ['App']);
var proc;

function Controller($scope, serviceTask, socket) {
	serviceTask.init();
	proc = serviceTask.newProcess('regextester');

	$scope.txtRegex = '';
	$scope.txtLine = '';

	$scope.raw;
	$scope.formatted;
	$scope.isWrongRegex = false;

	function format(group) {
		if($scope.raw == null) return "";
		if(!angular.isString($scope.raw.group)) {
			return $scope.txtLine;
		}
		else {
			var string = $scope.txtLine;
			var rx = new RegExp(group, 'gi');
			string = string.replace(rx, '<b>' + group + '</b>');

			return string;
		}
	}
	
	$scope.change = function() {
		$scope.test();
	}

	$scope.test = function() {
		socket.send('org.logpresso.core.msgbus.RegexTesterPlugin.match', { regex: $scope.txtRegex, line: $scope.txtLine }, proc.pid)
		.success(function(m) {
			$scope.isWrongRegex = false;
			$scope.raw = m.body;

			if(m.isError) {
				console.log(m);
				return;
			}

			$scope.formatted = format(m.body.group);
			$scope.$apply();
		})
		.failed(function(m) {
			$scope.isWrongRegex = true;
			$scope.$apply();
		});
	}
}
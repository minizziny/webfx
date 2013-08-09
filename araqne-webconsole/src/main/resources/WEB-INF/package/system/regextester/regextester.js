var app = angular.module('regextester', ['App']);
var proc;

function Controller($scope, serviceTask, socket) {
	serviceTask.init();
	proc = serviceTask.newProcess('regextester');

	$scope.txtRegex = '';
	$scope.txtLine = '';
	$scope.txtFormat = '';
	$scope.txtLocales = [
		{name:'한글', value:'ko'},
		{name:'영어', value:'en'}
	];

	$scope.txtLocale = $scope.txtLocales[1];

	$scope.raw;
	$scope.formatted;
	$scope.parsed;
	$scope.isWrongRegex = false;
	$scope.isWrongParse = false;

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

	$scope.changeFormat = function() {
		$scope.parse();
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

	$scope.parse = function() {
		socket.send('org.logpresso.core.msgbus.RegexTesterPlugin.parse', {
			result: $scope.raw.groups.join(""), format: $scope.txtFormat, locale: $scope.txtLocale.value }, proc.pid)
		.success(function(m) {
			$scope.isWrongParse = false;
			$scope.parsed = m.body.parsedResult;

			if(m.isError) {
				console.log(m);
				return;
			}

			$scope.$apply();
		})
		.failed(function(m){
			$scope.isWrongParse = true;
			$scope.$apply();
		});
	}
}
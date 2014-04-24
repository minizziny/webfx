// space 말고 tab 써주세요

function LogQuerySampleController($scope, socket, serviceLogdb) {

	console.log('-------------- LogQuerySampleController -----------------')
	var instance = serviceLogdb.create(535);

	console.log(instance);

	var q = instance.query('table logpresso_query_logs', 100)

	console.log(q);

	q.created(function(m) {
		console.log('created', m);
	})
	.started(function(m) {
		console.log('started', m);
	})
	.onStatusChange(function(m) {
		console.log('onStatusChange', m);
	})
	.onHead(function(helper) {
		console.log('onHead', helper);
	})
	.onTail(function(helper) {
		console.log('onTail', helper);

		helper.getResult(function(m) {
			console.log('getResult', m);
		});


	})
	.loaded(function(m) {
		console.log('loaded', m);
	})
	.failed(function(m, raw) {
		console.log('failed', m, raw);
	});


}

function LogQuery2SampleController($scope, socket, serviceLogdb) {
	$scope.queryString = '';
	$scope.queryResult;
	$scope.numPageSize = 20;

	$scope.numPid = 123;

	$scope.onHead = function(helper) {
		console.log('onHead', helper)
		helper.getResult(function(m) {
			console.log(m);

			if($scope.optionResultCursor === 'head') {
				$scope.modelTable = m.body.result;
				$scope.$apply();
			}
		});
	}

	$scope.onTail = function(helper) {
		console.log('onTail', helper)
		helper.getResult(function(m) {
			console.log(m);

			if($scope.optionResultCursor === 'tail') {
				$scope.modelTable = m.body.result;
				$scope.$apply();
			}
		});
	}

	$scope.optionResultCursor = 'head';

	$scope.modelTable = [];

}

function PlaygroundController($scope, socket) {
	$scope.hello = 'world';

}



function MyFtpProfileConfigController($scope, $filter, socket, $translate, eventSender) {
	$scope.dataFtpProfiles = [];
	$scope.dropFtpProfileName;
	$scope.checkAll = false;

	eventSender.playground.getFtpProfiles = function() {
		$scope.dataFtpProfiles = [];
		socket.send('org.logpresso.ftp.msgbus.FtpProfilePlugin.getProfiles', {}, eventSender.playground.pid)
		.success(function(m) {
			var ftpProfiles = m.body.profiles;
				
			ftpProfiles.forEach(function(obj) {
				obj.is_checked = false;
				$scope.dataFtpProfiles.push(obj);
			});

			$scope.$apply();

			angular.element('.playground-container .paneFtpConfig .btn-reload').removeAttr('disabled');
		})
		.failed(msgbusFailed);
	}

	$scope.ftpProfileDeletable = function() {
		return !$scope.dataFtpProfiles.some(function(obj) { 
			return obj.is_checked;
		});
	}

	$scope.dropFtpProfile = function() {
		var checked = $filter('isSelected')($scope.dataFtpProfiles, 'is_checked');
		$scope.dropFtpProfileName = $filter('namemap')(checked, 'name');

		checked.forEach(function(obj) {
			socket.send('org.logpresso.ftp.msgbus.FtpProfilePlugin.removeProfile', { 'name': obj.name }, eventSender.playground.pid)
			.success(function(m) {
				var idx = $scope.dataFtpProfiles.indexOf(obj);
				$scope.dataFtpProfiles.splice(idx, 1);
				$scope.$apply();
			})
			.failed(msgbusFailed);
		});

		$('.playground-container .dropFtpProfile')[0].hideDialog();
	}

	$scope.openCreateFtpProfileModal = function() {		
		$('.playground-container .createFtpProfile')[0].showDialog();
		eventSender.playground.initFtpProfileOptions();
	}

	$scope.cancelCreateFtpProfile = function() {
		$('.playground-container .createFtpProfile')[0].hideDialog();
	}	

	$scope.openDropFtpProfileModal = function() {
		$('.playground-container .dropFtpProfile')[0].showDialog();
	}

	$scope.cancelDropFtpProfile = function() {
		$('.playground-container .dropFtpProfile')[0].hideDialog();
	}

	$scope.init = function(e) {
		if(e && (!!e.target) ) {
			angular.element(e.target).attr('disabled', 'disabled');
		}
		eventSender.playground.getFtpProfiles();
		$scope.checkAll = false;
	}

	$scope.init();
}

function MyFtpProfileWizardController($scope, $filter, socket, $translate, eventSender) {
	$scope.count = 0;
	$scope.dataFtpProfile = {};
	$scope.isOnSubmit = false;

	$scope.dataNamePattern = /^([\u00c0-\u01ffa-zA-Z\-\_0-9])+$/;

	eventSender.playground.setPristine = function() {
		$scope.FormFtpProfile.$setPristine();
	}

	eventSender.playground.initFtpProfileOptions = function() {
		$scope.dataFtpProfile = {};
		$scope.dataFtpProfile.active = false;
		$scope.dataFtpProfile.extend_passive = false;		
		$scope.dataFtpProfile.port = 21;
		$scope.dataFtpProfile.timeout = 5;
		$scope.isOnSubmit = false;		
	}

	$scope.validCreatingFtpProfile = function() {
		if( $scope.FormFtpProfile.$invalid ) {
			$scope.isOnSubmit = true;
		}
		else {
			createFtpProfile();
		}
	}

	function createFtpProfile() {
		var active = $scope.dataFtpProfile.active;
		var epsv = $scope.dataFtpProfile.extend_passive;

		console.log(active);
		console.log(epsv);

		if(active)
			epsv = false;

		console.log(epsv);

		socket.send('org.logpresso.ftp.msgbus.FtpProfilePlugin.createProfile', {
			'name': $scope.dataFtpProfile.name, 
			'host': $scope.dataFtpProfile.host, 
			'port': parseInt($scope.dataFtpProfile.port),
			'timeout': parseInt($scope.dataFtpProfile.timeout), 
			'username': $scope.dataFtpProfile.user, 
			'password': $scope.dataFtpProfile.password, 
			'active_mode': active,
			'use_epsv': epsv
		}, eventSender.playground.pid)
		.success(function(m) {
			eventSender.playground.getFtpProfiles();
			$scope.$apply();
			$('.playground-container .createFtpProfile')[0].hideDialog();
		});
	}
}
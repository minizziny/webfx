

// space 말고 tab 써주세요
console.log("playground")
function PlaygroundController($scope, $element, socket) {
	$scope.hello = 'MyWorld';
console.log($scope.hello)
console.log($scope)
console.log($element)
}

function LogQuerySampleController($scope, socket, serviceLogdb) {

	console.log('-------------- LogQuerySampleController -----------------')
	var instance = serviceLogdb.create(500);

	console.log(instance);

	var q = instance.query('table limit=100 wc | stats count', 1);

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

		helper.getResult(function(m) {
			console.log('onHead getResult', m);
			console.log('m.body.result[0].count', m.body.result[0].count);
		});
	})
	.onTail(function(helper) {
		console.log('onTail', helper);

		helper.getResult(function(m) {
			console.log('onTail getResult', m);
			serviceLogdb.remove(instance);
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




function MyFtpProfileConfigController($scope, $filter, socket, $translate, eventSender) {
	$scope.dataFtpProfiles = [];
	$scope.dropFtpProfileName;
	$scope.checkAll = false;

	eventSender.playground.getFtpProfiles = function() {
		$scope.dataFtpProfiles = [];
		socket.send('org.logpresso.ftp.msgbus.FtpProfilePlugin.getProfiles', {}, eventSender.playground.pid)
		.success(function(m) {
			var ftpProfiles = m.body.profiles;
			
			console.log("ftpProfiles", ftpProfiles);

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

function MyFDSController($scope, $filter, socket, $translate, eventSender, serviceLogdb) {
	$scope.fdsrules			= [];
	$scope.boundary			= 0;
	$scope.operatorlists	= {};
	$scope.colorlists		= {};
	$scope.isOnSubmit		= false;
	$scope.setcolor			= "";
	$scope.fdsLabel			= "";

	console.log('MyFDSController=', serviceLogdb);

	function getFdsCount($scope, socket, serviceLogdb) {
		console.log('-------------- LogQuerySampleController -----------------')
		var instance = serviceLogdb.create(500);

		console.log(instance);

		var q = instance.query('table wc | stats count', 1);

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

			helper.getResult(function(m) {
				console.log('onHead getResult', m);
				console.log('m.body.result[0].count', m.body.result[0].count);
				$scope.fdsCount = m.body.result[0].count;
				$scope.$apply();
			});
		})
		.onTail(function(helper) {
			console.log('onTail', helper);

			helper.getResult(function(m) {
				console.log('onTail getResult', m);
				serviceLogdb.remove(instance);
			});
		})
		.loaded(function(m) {
			console.log('loaded', m);
		})
		.failed(function(m, raw) {
			console.log('failed', m, raw);
		});	
	}

	function getDataOpList() {
		$scope.operatorlists = [{
			text : "=",
			value : "="
		},{
			text : "!=",
			value : "!="
		},{
			text : ">",
			value : ">"
		},{
			text : "<",
			value : "<"
		}];
	}

	function getDatacolorlist() {
		$scope.colorlists = [ {
			text : "빨강",
			value : "red"
		},{
			text : "주황",
			value : "orange"
		},{
			text : "노랑",
			value : "yellow"
		},{
			text : "초록",
			value : "green"
		},{
			text : "파랑",
			value : "blue"
		}];
	}

	$scope.init = function(e) {
		//getFdsCount($scope, socket, serviceLogdb);
		getDataOpList();	//연산자 리스트 가져오기
		getDatacolorlist();	//색상 리스트 가져오기
		$scope.fdsrules.push({operator:'', boundary:'', color:''});
		
	}

	$scope.init();

	$scope.setFdsSquare = function() {

		$scope.setcolor = "";
		for (var i = 0, len = $scope.fdsrules.length; i<len; i++) {
			console.log("$scope.fdsrule.operator", $scope.fdsrules[i].operator,'fdsCount:', $scope.fdsCount,"$scope.fdsrules[i].boundary",$scope.fdsrules[i].boundary);
			console.log('$scope.fdsrules[i].color',$scope.fdsrules[i].color);
			switch ( $scope.fdsrules[i].operator ) {
				case "=":
					if( $scope.fdsCount == $scope.fdsrules[i].boundary ){
						$scope.setcolor	=	$scope.fdsrules[i].color;
					}
					break;
				case "!=":
					if( $scope.fdsCount != $scope.fdsrules[i].boundary ){
						$scope.setcolor	=	$scope.fdsrules[i].color;
					}
					break;
				case ">":
					if( $scope.fdsCount > $scope.fdsrules[i].boundary ){
						$scope.setcolor	=	$scope.fdsrules[i].color;
					}
					break;
				case "<":
					if( $scope.fdsCount < $scope.fdsrules[i].boundary ){
						$scope.setcolor	=	$scope.fdsrules[i].color;
					}
					break;
				default : 
					$scope.setcolor = "white";
			};

		};


		console.log("$scope.setcolor",$scope.setcolor);
	};

	$scope.addScope = function () {

		$scope.fdsrules.push({operator:'', boundary:'', color:''});
	};

	$scope.removeRule = function (index) {

		$scope.fdsrules.splice(index, 1);

	};

};


function MyFdsAlertBoxController($scope, $filter, socket, $translate, eventSender, serviceLogdb){
	$scope.fdsSquareShow	= true;
	$scope.fdsCount			= 0;
	$scope.fdsRules			= [];
	$scope.setcolor			= "";
	$scope.fdsLabel			= "";
	
	console.log('MyFdsAlertBoxController');

	function getFdsCount($scope, socket, serviceLogdb) {
		console.log('-------------- MyFdsAlertBoxController.getFdsCount -----------------')
		var instance = serviceLogdb.create(520);

		console.log(instance);

		var q = instance.query('table wc | stats count', 1);

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

			helper.getResult(function(m) {
				console.log('onHead getResult', m);
				console.log('m.body.result[0].count', m.body.result[0].count);
				$scope.fdsCount = m.body.result[0].count;

				//FDS AlertBox View!!
				viewAlertBox();
				
				$scope.$apply();
			});
		})
		.onTail(function(helper) {
			console.log('onTail', helper);

			helper.getResult(function(m) {
				console.log('onTail getResult', m);
				serviceLogdb.remove(instance);
			});
		})
		.loaded(function(m) {
			console.log('loaded', m);
		})
		.failed(function(m, raw) {
			console.log('failed', m, raw);
		});	
	}

	//FDS Rule 가져오기
	function getFdsRules($scope, socket, serviceLogdb){
		$scope.fdsRules = [{operator:">", boundary:"100000", color:"#0000ff"}
							,{operator:'>', boundary:'10000000', color:'#00ff00'}
							,{operator:'>', boundary:'1000000000', color:'#ff0000'}];


	}

	function getLabel(){
		$scope.fdsLabel = "FDS 총 건수";
	}

	$scope.init = function(e) {
		//label 가져오기
		getLabel();
		//건수 조회
		//getFdsCount($scope, socket, serviceLogdb);
		//Rule 가져오기
		getFdsRules($scope, socket, serviceLogdb);
	
	}

	$scope.init();

	function viewAlertBox(){
		console.log('viewAlertBox!!');
		$scope.setcolor = "";
		for (var i = 0, len = $scope.fdsRules.length; i<len; i++) {
			console.log("$scope.fdsrule.operator", $scope.fdsRules[i].operator,'fdsCount:', $scope.fdsCount,"$scope.fdsRules[i].boundary",$scope.fdsRules[i].boundary);
			console.log('$scope.fdsRules[i].color',$scope.fdsRules[i].color);
			switch ( $scope.fdsRules[i].operator ) {
				case "=":
					if( $scope.fdsCount == $scope.fdsRules[i].boundary ){
						$scope.setcolor	=	$scope.fdsRules[i].color;
					}
					break;
				case "!=":
					if( $scope.fdsCount != $scope.fdsRules[i].boundary ){
						$scope.setcolor	=	$scope.fdsRules[i].color;
					}
					break;
				case ">":
					if( $scope.fdsCount > $scope.fdsRules[i].boundary ){
						$scope.setcolor	=	$scope.fdsRules[i].color;
					}
					break;
				case "<":
					if( $scope.fdsCount < $scope.fdsRules[i].boundary ){
						$scope.setcolor	=	$scope.fdsRules[i].color;
					}
					break;
				default : 
					$scope.setcolor = "white";
			};

		};
		console.log("$scope.setcolor",$scope.setcolor);		
	}


	var ctx = 
	{
		'data': {
			'query': 'table wc | stats count',
			'column': 'count',
			'label': 'FDS총건수',
			'rules': [
					{
							color: 'green',
							operator: '>',
							boundary: '10000'
					},
					{
							color: 'yellow',
							operator: '>',
							boundary: '1000000'
					},
					{
							color: 'orange',
							operator: '>',
							boundary: '100000000'
					},
					{
							color: 'red',
							operator: '>',
							boundary: '1000000000'
					}
			]
		},
		'guid': 'asdf',
		'interval': 15,
		'name': 'test',
		'type': 'alertbox'
	}
				



	$('fds-alert-box')[0].setContext(ctx);
}

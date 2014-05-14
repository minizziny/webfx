(function() {

	var injectorDashboard = angular.injector(['logpresso.extension.dashboard']);
	var serviceDashboard = injectorDashboard.get('serviceDashboard');

	serviceDashboard.addAssetType({
		name: 'Alert Box',
		id: 'alertbox',
		visible: true,
		event: {
			onNextStep: function() {
				serviceDashboard.closeWizard();
				$('.mdlAlertBoxController')[0].showDialog();
				// var ctx = {"data": {"series": [{"color": "#AFD8F8", "key": "count", "name": "count"}], "label": "table", "type": "pie", "interval": 23, "query": "logdb count | stats c by table", "labelType": "string"}, "guid": 'w' + serviceUtility.generateType2(), "type": "chart", "interval": 23, "name": "count pie"};
				// serviceDashboard.onCreateNewWidgetAndSavePreset(ctx);
			}
		},
		validator: function() {
			return true;
		},
		template: '<asset data-guid="{{guid}}"><div>alertbox Here</div></asset>'
	});

	function AlertBoxRuleBindingController($scope, $filter, $translate, eventSender, serviceLogdb) {
		$scope.fdsrules			= [];
		$scope.boundary			= 0;
		$scope.operaterlists	= {};
		$scope.colorlists		= {};
		$scope.isOnSubmit		= false;
		$scope.setcolor			= "";
		$scope.fdsLabel			= "";
		$scope.fdsPrefix		= "";
		$scope.fdsSuffix		= "";
		$scope.fdsComma			= "";
		$scope.fdsPointlen		= 0;
		$scope.fdsdefault_color	= "#eeeee";
		$scope.pointLenChecked	= false;

		function getDataOpList() {
			$scope.operaterlists = [
			{
				text : "다음보다 크면 (>)",
				value : ">"
			},{
				text : "다음보다 작으면 (<)",
				value : "<"
			},{
				text : "다음보다 같으면 (=)",
				value : "="
			},{
				text : "다음과 다르면 (!=)",
				value : "!="
			}];
		}

		$scope.init = function(e) {
			getDataOpList();	//연산자 리스트 가져오기
			$scope.fdsrules.push({operator:'', boundary:'', color:''});
		}

		$scope.init();

		$scope.addRule = function () {
			$scope.fdsrules.push({operator:'', boundary:'', color:''});
		};

		$scope.removeRule = function (index) {
			$scope.fdsrules.splice(index, 1);
		};

		eventSender.dashboard.onSendAlertBoxDataWizard = function() {
			console.log('onSendAlertBoxDataWizard');
			console.log($scope.fdsPrefix,$scope.fdsSuffix,$scope.fdsComma,$scope.fdsPointLen,$scope.fdsdefault_color);
			var formatting = '';
			if ( $scope.fdsComma ){
				formatting = ","
			}

			if ( $scope.fdsPointLen != undefined && $scope.fdsPointLen > 0){
				formatting = formatting + '.' + $scope.fdsPointLen + 'f';
			}

			var ctx = {
				'rules': $scope.fdsrules,
				'label' : $scope.fdsLabel,
				'prefix' : $scope.fdsPrefix,
				'suffix' : $scope.fdsSuffix,
				'formatting' : formatting,
				'default_color' : $scope.fdsdefault_color
			}

			console.log(ctx)

			return ctx;
		}

	};

	extension.global.addController(AlertBoxRuleBindingController);
		
})();
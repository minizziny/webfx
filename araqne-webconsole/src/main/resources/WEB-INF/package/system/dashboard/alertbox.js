(function() {

	var injectorDashboard = angular.injector(['logpresso.extension.dashboard']);
	var serviceDashboard = injectorDashboard.get('serviceDashboard');

	serviceDashboard.addAssetType({
		name: 'Alert Box',
		id: 'alertbox',
		visible: true,
		event: {
			onNextStep: function(p) {

				console.log(p);
				setDataSource(p);

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

	var setDataSource;

	function AlertBoxRuleBindingController($scope, $filter, $translate, eventSender, serviceLogdb) {


		$scope.dataColumns = [];
		$scope.selectedColumn;

		var dataSourceFirstRow;

		setDataSource = function(src) {
			$scope.formAlertBox.$setPristine();

			dataSourceFirstRow = src.model[0];
			$scope.dataColumns = src.columns;
			$scope.selectedColumn = $scope.dataColumns[0];
			$scope.context.query = src.query;
		}

		$scope.$watch('selectedColumn', function(val) {
			$scope.context.column = val.name;
			$scope.numSample = dataSourceFirstRow[val.name];
		});

		$scope.numSample = 0;


		$scope.boundary			= 0;
		$scope.operaterlists	= {};
		$scope.colorlists		= {};
		$scope.isOnSubmit		= false;
		$scope.setcolor			= "";


		$scope.context = {
			column: undefined,
			label: '',
			rules: [],
			prefix: '',
			suffix: '',
			query: '',
			formatting: undefined,
			default_color: '#EEEEEE'	
		};

		$scope.hasComma = false;
		$scope.hasPoint	= false;
		$scope.lenPoint = 2;
		

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

		function getDefaultRule() {
			return {
				operator: '>',
				boundary: 0,
				color: '#CC0000'
			}
		}

		$scope.init = function(e) {
			getDataOpList();	//연산자 리스트 가져오기
			$scope.context.rules.push(getDefaultRule());
		}

		$scope.init();

		$scope.addRule = function () {
			$scope.context.rules.push(getDefaultRule());
		};

		$scope.removeRule = function (index) {
			$scope.context.rules.splice(index, 1);
		};

		$scope.sendContext = function() {

			var formatting = '';
			if ( $scope.hasComma ){
				formatting = ","
			}

			if ( $scope.hasPoint ){
				formatting = formatting + '.' + $scope.lenPoint + 'f';
			}

			$scope.context.formatting = formatting;
			console.log($scope.context);

			$('.mdlAlertBoxController')[0].hideDialog();
			serviceDashboard.onCreateNewWidgetData($scope.context);
		}

	};

	extension.global.addController(AlertBoxRuleBindingController);
		
})();
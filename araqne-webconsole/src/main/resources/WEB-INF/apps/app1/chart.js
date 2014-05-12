(function() {

	var $injector = angular.injector(['logpresso.extension.dashboard']);
	var sender = $injector.get('serviceDashboard');
	
	sender.addAssetType({
		name: 'Basic Charts',
		event: {
			onNextStep: function() {
				sender.closeWizard();
				$('.mdlChartWizard query-input')[0].setPristine();
				$('.mdlChartWizard')[0].showDialog();
			}
		}
	});

	var shared = {};

	function ChartWizardController($scope) {
		$scope.queryString = '';
		$scope.queryResult;
		$scope.numPageSize = 20;

		$scope.getPid = 123;

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

		$scope.onNextQuery = function() {
			$('.mdlChartWizard')[0].hideDialog();
			$('.mdlChartManipulateWizard')[0].showDialog();
			shared.setModelTable($scope.modelTable);
		}
	}

	function ChartManipulateController($scope) {
		$scope.modelTable = [];

		function isNumber(field) {
			return this.every(function(o) {
				return Object.prototype.toString.call(o[field]) === "[object Number]";
			});
		}

		function isDateTime(field) {
			return this.every(function(o) {
				return /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\+\d{4}/.test(o[field]);
			});
		}

		function isString(field) {
			return this.every(function(o) {
				return Object.prototype.toString.call(o[field]) === "[object String]";
			});
		}

		$scope.cols = [];

		$scope.colsNumber = [];
		$scope.colsDateTime = [];
		$scope.colsString = [];

		$scope.selectedNumberColumn;
		$scope.selectedDateTimeColumn;
		$scope.selectedStringColumn;

		shared.setModelTable = function(modelTable) {
			$scope.modelTable = modelTable;

			$scope.colsNumber = modelTable.cols.filter(function(col) {
				return isNumber.call(modelTable, col);
			});

			$scope.colsDateTime = modelTable.cols.filter(function(col) {
				return isDateTime.call(modelTable, col);
			});

			$scope.colsString = modelTable.cols.filter(function(col) {
				return isString.call(modelTable, col);
			});

			$scope.cols = modelTable.cols.map(function(col) {
				return  {
					'is_checked': false,
					'name': col
				}
			});
		}

		$scope.getVVV = function() {
			console.log(vvv);
		}
	}

	extension.global.addController(ChartWizardController);
	extension.global.addController(ChartManipulateController);
})();

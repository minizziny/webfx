(function() {

	var $injector = angular.injector(['logpresso.extension.dashboard']);
	var sender = $injector.get('eventSender');

	sender.addAssetType({
		name: 'Time Series',
		event: {
			onNextStep: function() {
				sender.closeWizard();
				$('.mdlTimeSeriesWizard')[0].showDialog();
			}
		}
	});


	// sender.event.on('step', function() {
	// 	sender.closeWizard();
	// 	console.log('step111')
	// });

})();

function TimeSeriesWizardController($scope) {
	var $injector = angular.injector(['logpresso.extension.dashboard']);
	var sender = $injector.get('eventSender');
	
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
		console.log(sender)
	}
}

function DataManipulateController($scope) {

}
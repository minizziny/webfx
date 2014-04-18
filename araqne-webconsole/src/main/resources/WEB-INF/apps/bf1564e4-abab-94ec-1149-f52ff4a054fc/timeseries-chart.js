(function() {

	var $injector = angular.injector(['logpresso.extension.dashboard']);
	var sender = $injector.get('eventSender');
	sender.addAssetType({
		name: 'Time Series'
	});

	// sender.event.on('step', function() {
	// 	sender.loadPage('step-query.html')
	// 	.success(function() {
	// 		console.log('hellos!!!');
	// 	})
	// })
	
})();

function QueryStepController($scope, serviceUtility) {
	$scope.world = 'hellow!';
	console.log(serviceUtility)
}
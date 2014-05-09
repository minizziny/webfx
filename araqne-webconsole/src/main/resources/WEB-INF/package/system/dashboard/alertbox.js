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
				// var ctx = {"data": {"series": [{"color": "#AFD8F8", "key": "count", "name": "count"}], "label": "table", "type": "pie", "interval": 23, "query": "logdb count | stats c by table", "labelType": "string"}, "guid": 'w' + serviceUtility.generateType2(), "type": "chart", "interval": 23, "name": "count pie"};
				// serviceDashboard.onCreateNewWidgetAndSavePreset(ctx);
			}
		},
		validator: function() {
			return true;
		},
		template: '<asset data-guid="{{guid}}"><div>alertbox Here</div></asset>'
	});

	function AlertBoxManipulateController($scope) {
		$scope.hello = 'hello';
	}

	extension.global.addController(AlertBoxManipulateController);
		
})();
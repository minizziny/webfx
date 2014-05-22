angular.module('app.directive.chart', ['app.chart'])
.directive('pie', function(serviceChart, $timeout) {
	return {
		restrict: 'E',
		require: 'ngModel',
		scope: {
			'model': '=ngModel'
		},
		template: '<div style="border:1px solid red"><ul><li ng-repeat="data in model">{{data}}</li></ul></div>',
		link: function(scope, elm, attrs, ctrl) {
			scope.$watch(function() { return ctrl.$modelValue; }, function(val) {
				console.log('----')

				console.log(val);

			}, true);

			scope.$apply();
		}
	}
});
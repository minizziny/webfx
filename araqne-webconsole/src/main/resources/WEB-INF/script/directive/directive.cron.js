angular.module('app.directive.cron', ['app.connection', 'app.filter'])
.directive('uiCronizer', function(socket, $filter) {
	return {
		restrict: 'E',
		scope: {
		},
		require: 'ngModel',
		templateUrl: '/script/directive/directive.cron.html',
		replace: true,
		controller: function() {

		},
		link: function(scope, element, attrs, ctrl) {
			scope.valMinute = 0;
			scope.valHour = 0;
			scope.valDayofMonth = 1;
			scope.valMonth = 1;
			scope.valDayofWeek = Array.apply(null, new Array(7)).map(Boolean.prototype.valueOf,false);
			
			scope.everyMinute = false;
			scope.everyHour = false;
			scope.everyDayofMonth = false;
			scope.everyMonth = false;
			scope.everyDayofWeek = false;

			scope.setRange = function(val, model, min, max) {
				scope.cron[model] = val;
				var val = parseInt(val);

				if(!isNaN(val)) {
					if(val > max) {
						scope[model] = max;
						scope.cron[model] = max;
					}
					else if(val < min) {
						scope[model] = min;
						scope.cron[model] = min;
					}
					else {
						scope[model] = val;
						scope.cron[model] = val;
					}
				}
			}

			scope.cron = {}

			function setEvery(default_value, model) {
				return function(v) {
					if(v) {
						scope[model] = '*';
					} else {
						scope[model] = default_value;
					}
				}
			}

			scope.$watch('everyMinute', setEvery(0, 'valMinute'));
			scope.$watch('everyHour', setEvery(0, 'valHour'));
			scope.$watch('everyDayofMonth', setEvery(1, 'valDayofMonth'));
			scope.$watch('everyMonth', setEvery(1, 'valMonth'));
			scope.$watch('everyDayofWeek', function(v) {
				for (var i = 6; i >= 0; i--) {
					scope.valDayofWeek[i] = v;
				}
			});

			scope.$watch('valDayofWeek', function(newval) {
				if(newval.every(function(v) { return v })) {
					scope.cron.valDayofWeek = '*';
				}
				else {
					scope.cron.valDayofWeek = newval
						.map(function(v, i) { return v ? i+1 : '' })
						.filter(function(v) { return !!v })
						.join(',');
				}
			}, true);

			scope.$watch('cron', function(val) {
				ctrl.$setViewValue(val.valMinute + ' ' + val.valHour + ' ' + val.valDayofMonth + ' ' + val.valMonth + ' ' + val.valDayofWeek);
			}, true);
		}
	}
});
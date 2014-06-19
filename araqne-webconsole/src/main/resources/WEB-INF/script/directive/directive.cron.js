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
			// console.log('---------------------')
			var setModelByForce = false
			var mode = 'basic';
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

			function setEvery(default_value, model) {
				return function(newval) {
					if(newval) {
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

			scope.$watch(function () {
				return ctrl.$modelValue;
			}, function(newval, oldval) {
				if (!setModelByForce) { // model change by binding
					// console.log('model change!', newval);
					if(angular.isUndefined(newval) || newval == '') {
						newval = '0 0 1 1 ';
					}
					var ss = newval.split(' ');

					var hasOneMoreExpertSet = ss.some(function(s) {
						return /\//.test(s);
					});

					if(hasOneMoreExpertSet) {
						scope.toggle('expert');
					}

					ss.forEach(function(s, i) {
						if(s === '*') {
							switch(i) {
								case 0:
									scope.everyMinute = true;
									break;
								case 1:
									scope.everyHour = true;
									break;
								case 2:
									scope.everyDayofMonth = true;
									break;
								case 3:
									scope.everyMonth = true;
									break;
							}
						}
						else if(!/\//.test(s)) { // just number
							switch(i) {
								case 0:
									scope.valMinute = parseInt(s);
									scope.cron.valMinute = s;
									break;
								case 1:
									scope.valHour = parseInt(s);
									scope.cron.valHour = s;
									break;
								case 2:
									scope.valDayofMonth = parseInt(s);
									scope.cron.valDayofMonth = s;
									break;
								case 3:
									scope.valMonth = parseInt(s);
									scope.cron.valMonth = s;
									break;
							}
						}
						else { // value contains slash character
							switch(i) {
								case 0:
									scope.cron.valMinute = s;
									break;
								case 1:
									scope.cron.valHour = s;
									break;
								case 2:
									scope.cron.valDayofMonth = s;
									break;
								case 3:
									scope.cron.valMonth = s;
									break;
							}
						}
					})
					
					if(ss[4] === '*') {
						scope.everyDayofWeek = true;
						scope.changeDayofWeek();
					}
					else {
						var dows = ss[4].split(',');
						scope.everyDayofWeek = false;
						scope.changeDayofWeek();
						dows.forEach(function(dow) {
							scope.valDayofWeek[dow - 1] = true;
						});
					}
					parseValDayofWeek(scope.valDayofWeek);
				}
				else {
					// model change by inner code
					setModelByForce = false;
				}
			});

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

					scope.clearCheck(model);
				}
			}

			scope.clearCheck = function(model) {
				scope['every' + model.substring(3)] = false;
			}

			scope.cron = {}

			scope.changeDayofWeek = function() {
				for (var i = 6; i >= 0; i--) {
					scope.valDayofWeek[i] = scope.everyDayofWeek;
				}
			};

			function parseValDayofWeek(newval) {
				if(newval.every(function(v) { return v })) {
					scope.cron.valDayofWeek = '*';
				}else if( newval.every(function(v) { return !v })) {
					scope.cron.valDayofWeek = '*';
				}
				else {
					scope.cron.valDayofWeek = newval
						.map(function(v, i) { return v ? i+1 : '' })
						.filter(function(v) { return !!v })
						.join(',');
					scope.everyDayofWeek = false;
				}
				return scope.cron.valDayofWeek;
			}

			scope.$watch('valDayofWeek', parseValDayofWeek, true);

			scope.$watch('cron', function(val) {
				setModelByForce = true;
				ctrl.$setViewValue(val.valMinute + ' ' + val.valHour + ' ' + val.valDayofMonth + ' ' + val.valMonth + ' ' + val.valDayofWeek);
			}, true);

			scope.isExpert = false;
			scope.toggle = function(val) {
				scope.isExpert = val === 'expert';
				mode = val;
				if(mode === 'expert') {
					element.find('col.expert')[0].style.cssText = '';
					element.find('col.basic').each(function(i, el) {
						el.style.cssText = 'width: 0px !important';
					});

					setModelByForce = true;
					ctrl.$setViewValue(scope.cron.valMinute + ' ' + scope.cron.valHour + ' ' + scope.cron.valDayofMonth + ' ' + scope.cron.valMonth + ' ' + scope.cron.valDayofWeek);
				}
				else if (mode === 'basic') {
					element.find('col.expert')[0].style.cssText = 'width: 0px !important';
					element.find('col.basic').each(function(i, el) {
						el.style.cssText = '';
					});

					setModelByForce = true;
					ctrl.$setViewValue(scope.valMinute + ' ' + scope.valHour + ' ' + scope.valDayofMonth + ' ' + scope.valMonth + ' ' + parseValDayofWeek(scope.valDayofWeek));
				}
			}
		}
	}
});
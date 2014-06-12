angular.module('app.directive.validation', [])
.directive('validateName', function() {
	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			var VALIDATE_NAME_REGEXP = /^([\u00c0-\u01ffa-zA-Z\_0-9])+$/;
			ctrl.$parsers.unshift(function(viewValue) {
				if (VALIDATE_NAME_REGEXP.test(viewValue)) {
					// it is valid
					ctrl.$setValidity('validateName', true);
					return viewValue;
				}
				else {
					// it is invalid, return undefined (no model update)
					ctrl.$setValidity('validateName', false);
					return undefined;
				}
			});
		}
	}
})
.directive('ngModelGetter', function () {
	return {
		require: "ngModel",
		link:  function(scope, element, attrs, ngModelCtrl)
		{
			var getExpression = attrs.ngModelGetter;
			function updateViewValue(newValue, oldValue)
			{
				if (newValue != ngModelCtrl.$viewValue) {
					ngModelCtrl.$setViewValue(newValue);
					ngModelCtrl.$render();
				}
				
				var updateExpression = attrs.ngModel + "=" + getExpression;
				scope.$eval(updateExpression);
			}

			updateViewValue();
			
			scope.$watch(getExpression, updateViewValue);
		}
	}
})
.directive('ngModelSetter', function () {
	return {
		require: "ngModel",
		link:  function(scope, element, attrs, ngModelCtrl)
		{
			var setExpression = attrs.ngModelSetter;
			function updateModelValue(e) {
				scope.$value = ngModelCtrl.$viewValue;
				scope.$model = attrs.ngModel;
				scope.$eval(setExpression);
				delete scope.$value;
				delete scope.$model;
			}

			scope.$watch(attrs.ngModel, updateModelValue);
		}
	}
})
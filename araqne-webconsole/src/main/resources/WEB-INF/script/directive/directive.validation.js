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
});
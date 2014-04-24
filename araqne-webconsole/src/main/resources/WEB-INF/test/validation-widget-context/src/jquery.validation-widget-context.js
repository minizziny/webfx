/*
 * validation-widget-context
 * https://github.com/araqne/webfx
 *
 * Copyright (c) 2014 gotoweb
 * Licensed under the MIT license.
 */

(function() {

var angular = {};
angular.isArray = function isArray(value) {
	return Object.prototype.toString.call(value) === '[object Array]';
};
angular.isUndefined = function isUndefined(value) {
	return typeof value === 'undefined';
};
angular.isNumber = function isNumber(value) {
	return typeof value === 'number';
};
angular.isString = function isString(value){
	return typeof value === 'string';
};
angular.isDefined = function isDefined(value){
	return typeof value !== 'undefined';
};

window.angular = angular;

function ValidateWidgetContext(ctx) {
	if(angular.isUndefined(ctx)) {
		return false;
	}

	if(!angular.isString(ctx.guid)) {
		return false;
	}

	if(!angular.isString(ctx.name)) {
		return false;
	}

	if(!/^(grid|chart|wordcloud|tabs)$/.test(ctx.type)) {
		return false;
	}

	if(/^(grid|chart|wordcloud)$/.test(ctx.type)) {
		if(!angular.isNumber(ctx.interval)) {
			throw new TypeError('interval is not number');
		}

		if(angular.isUndefined(ctx.data))	{
			return false;
		}

		if(!angular.isString(ctx.data.query)) {
			return false;
		}
	}

	if(/^grid$/.test(ctx.type)) {
		if(!angular.isArray(ctx.data.order)) {
			return false;
		}
	}

	if(/^chart$/.test(ctx.type)) {
		if(!/^(line|pie|bar)$/.test(ctx.data.type)) {
			return false;
		}

		if(!angular.isArray(ctx.data.series)) {
			return false;
		}
	}
	
	return true;
}

window.ValidateWidgetContext = ValidateWidgetContext;

}());

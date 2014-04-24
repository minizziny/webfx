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
angular.isFunction = function isFunction(value){return typeof value === 'function';};

window.angular = angular;

window.dataAssetTypes = [];

function isValidContext(ctx) {
	var f = window.dataAssetTypes.filter(function(assetDefinition) {
		return assetDefinition.id === ctx.type;
	});
	if(f.length === 1) {
		if(angular.isFunction(f[0].validator)) {
			return f[0].validator(ctx);
		}
		else {
			return false;
		}
	}
	else {
		throw new window.CustomError('no-definition');
	}
}

function onCreateNewWidgetAndSavePreset(ctx) {
	if(!validateWidgetContext(ctx)) {
		return 'canceled';
	}
	if(!isValidContext(ctx)) {
		return 'canceled';
	}
	return 'added';
}

function addAssetType(obj) {
	window.dataAssetTypes.push(obj);	
}

function validateWidgetContext(ctx) {
	if(angular.isUndefined(ctx)) {
		return false;
	}

	if(!angular.isString(ctx.guid)) {
		return false;
	}

	if(!angular.isString(ctx.name)) {
		return false;
	}

	if(!~window.dataAssetTypes.map(function(d) { return d.id; }).indexOf(ctx.type)) {
		return false;
	}

	return true;
}

window.addAssetType = addAssetType;
window.onCreateNewWidgetAndSavePreset = onCreateNewWidgetAndSavePreset;

}());

/*! Validation Widget Context - v0.1.0 - 2014-04-25
* https://github.com/araqne/webfx
* Copyright (c) 2014 gotoweb; Licensed MIT */
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
var $scope = {
	dataAssetTypes: []
};

function isValidContext(ctx) {
	var f = $scope.dataAssetTypes.filter(function(assetDefinition) {
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
		throw new TypeError('no-definition');
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
	$scope.dataAssetTypes.push(obj);	
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

	if(!~$scope.dataAssetTypes.map(function(d) { return d.id; }).indexOf(ctx.type)) {
		return false;
	}

	return true;
}

window.addAssetType = addAssetType;
window._clearAssetType = function() {
	$scope.dataAssetTypes = [];
};
window.onCreateNewWidgetAndSavePreset = onCreateNewWidgetAndSavePreset;

}());

angular.module('app.filter', ['pascalprecht.translate'])
.filter('isSelected', function() {
	return function(arr, prop) {
		return arr.filter(function(obj) {
			return obj[prop];
		});
	}
})
.filter('namemap', function() {
	return function(arr, prop) {
		return arr.map(function(obj) {
			return obj[prop];
		}).join(', ');
	}
})
.filter('disksize', function() {
	return function(val) {
		var pfx = computerFormatPrefix(val);
		return pfx.value.toFixed(2) + pfx.symbol + "B";
	}
})
.filter('suffix', function() {
	return function(val, suffix) {
		return val + suffix;
	}
})
.filter('prefix', function() {
	return function(val, prefix) {
		return prefix + val;
	}
})
.filter('crlf', function($sce) { 
	return function(val) {
		if(val === 0) {	return '0'; }
		if(val === false) {	return 'false'; }
		if(val === null) return val;
		
		if(Object.prototype.toString.call(val) == '[object String]') {
			// return val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/gi, '<br>');
			return $sce.trustAsHtml(val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/gi, '<br>'));
		}
		else if(Object.prototype.toString.call(val) == '[object Object]') {
			return $sce.trustAsHtml('');
		}
		else return $sce.trustAsHtml(val.toString());
	}
})
.filter('numformat', function() { 
	return function(val) {
		return d3.format(',')(val);
	}
})
.filter('truncate', function () {
	return function (text, length, end) {
		if (isNaN(length))
			length = 10;

		if (end === undefined)
			end = "...";

		if (text.length <= length || text.length - end.length <= length) {
			return text;
		}
		else {
			return String(text).substring(0, length-end.length) + end;
		}
	};
})
.filter('translateMsgbus', function($translate) {
	return function(value) {
		var locale = $translate.uses();
		if(value.hasOwnProperty(locale)) {
			return value[locale];
		}
		else {
			return value.en;
		}
	}
})
.filter('unsafe', function($sce) {
	return function(val) {
		if(val == null || val == undefined) return $sce.trustAsHtml('');
		else return $sce.trustAsHtml(val.toString());
	}
})

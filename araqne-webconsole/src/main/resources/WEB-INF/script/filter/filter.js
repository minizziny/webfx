angular.module('app.filter', ['pascalprecht.translate'])
.filter('isSelected', function() {
	return function(arr, prop, unselect) {
		var isUnselect = unselect === false;
		return arr.filter(function(obj) {
			if(isUnselect) {
				return !obj[prop];
			} else {
				return obj[prop];	
			}
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
		if(val === 0) {	return $sce.trustAsHtml('0'); }
		if(val === false) {	return $sce.trustAsHtml('false'); }
		if(val === null) return val;
		if(val === undefined) return val;

		var urlRegex = /(https?:\/\/[^\s]+)/g;
		
		if(Object.prototype.toString.call(val) == '[object String]') {
			return $sce.trustAsHtml(val.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/gi, '<br>').replace(urlRegex, '<a href="$1" target="_blank">$1</a>'));
		}
		else if(Object.prototype.toString.call(val) == '[object Object]' || Object.prototype.toString.call(val) == '[object Array]') {
			return $sce.trustAsHtml(JSON.stringify(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/gi, '<br>').replace(urlRegex, '<a href="$1" target="_blank">$1</a>'));
		}
		else return $sce.trustAsHtml(val.toString().replace(urlRegex, '<a href="$1" target="_blank">$1</a>'));
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
.filter('suppressTimezone', function() {
	return function(t) {
		var regex = /\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/;
		return regex.test(t) ? t.match(regex)[0] : t;
	}
})
.filter('capitalizeFirstLetter', function() {
	return function(t) {
		return t.charAt(0).toUpperCase() + t.slice(1);
	}
})
.filter('d3TimeFormat', function() {
	return function(val, inputformat, outputformat) {
		var date = d3.time.format(inputformat).parse(val);
		return d3.time.format(outputformat)(date);
	}
})
.filter('stringifyCron', function(serviceUtility) {
	return function(val) {
		return serviceUtility.cronStringify(val);
	}
});
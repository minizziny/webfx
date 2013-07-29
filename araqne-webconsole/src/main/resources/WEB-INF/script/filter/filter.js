angular.module('App.Filter', [])
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
.filter('crlf', function() { 
	return function(val) {
		if(toString.call(val) == '[object String]') {
			return val.replace(/\n/gi, '<br>');
		}
		else return val;
	}
})

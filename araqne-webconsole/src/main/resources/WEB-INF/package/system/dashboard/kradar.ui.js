define(["/lib/jquery.js"], function(_$) {

Array.prototype.insert = function(item, idx) {
	this.splice(idx, 0, item);
}

Array.prototype.removeAt = function(idx) {
	this.splice(idx, 1);
}

Object.prototype.getName = function() { 
	var funcNameRegex = /function (.{1,})\(/;
	var results = (funcNameRegex).exec((this).constructor.toString());
	return (results && results.length > 1) ? results[1] : "";
};

});
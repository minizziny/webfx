angular.module('App.Service', [])
.factory('serviceGuid', function() {
	var s4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};

	return {
		generateType1: function() {
			return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
		},
		generateType2: function() {
			return ('w'+s4()+s4()+s4()+s4());
		},
		generateType3: function() {
			return ('w'+s4());
		}
	}
});

var app = angular.module('license', ['App']);
var proc;

app.directive('file', function() {
	return {
		scope: {
			file: '=',
			license: '='
		},
		link: function($scope, el, attrs) {
			el.bind('change', function(event) {

				var file = event.target.files[0];

				if (file) {
			      var fr = new FileReader();
			      fr.onload = function(e) { 
				      var contents = e.target.result;

			        //console.log(contents); 
			        $scope.license = contents;
			        $scope.$apply();
			      }
			      fr.readAsText(file);
			    } else { 
			      alert("Failed to load file");
			    }
				$scope.file = file ? file.name : undefined;
				$scope.$apply();
			});
		}
	};
});

function Controller($scope, serviceTask, socket) {
	serviceTask.init();
	proc = serviceTask.newProcess('license');

	$scope.hardwareKey;
	$scope.licenseInfo;
	$scope.queryAllowed;
	$scope.license;
	$scope.force = false;
	$scope.alerts;
	$scope.alert;

	function hardwareKey() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.getHardwareKey', {
		}, proc.pid)
		.success(function(m) {
			$scope.hardwareKey = m.body.hardwareKey;

			if(m.isError) {
				console.log(m);
				return;
			}

			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
	}

	function isQueryAllowed() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.isQueryAllowed', {
		}, proc.pid)
		.success(function(m) {
			$scope.queryAllowed = m.body.isQueryAllowed;
			
			if(m.isError) {
				console.log(m);
				return;
			}

			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
	}

	function getLicenseInfos() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.getLicenseInfos', {
		}, proc.pid)
		.success(function(m) {
			$scope.licenseInfo = m.body.licenses;
			if(m.isError) {
				console.log(m);
				return;
			}
			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
	}

	$scope.setLicense = function() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.setLicense', { 
			license: $scope.license, force: $scope.force }, proc.pid)
		.success(function(m) {
			getLicenseInfos();
			$scope.licenseInfo.push($scope.license);
			if(m.isError) {
				console.log(m); 
				return;
			}
			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
	}

	$scope.unsetLicense = function(val, comment) {
		if(!confirm(comment)) {
			return;
		} else {
			socket.send('org.logpresso.core.msgbus.LicensePlugin.unsetLicense', { 
				hardware_key: val.hardware_key }, proc.pid)
			.success(function(m) {
				getLicenseInfos();
				if(m.isError) {
					console.log(m);
					return;
				}
				$scope.$apply();
			})
			.failed(function(m) {
				$scope.$apply();
			});
		}
	}

	function getLogScale(val) {
		var result = computerFormatPrefix(val);
		return parseInt(result.value) + result.symbol;
	}

	function makeBarChart(el, query, width, height) {
		var margin = {top: 10, right: 20, bottom: 30, left: 40},
	    width = width - margin.left - margin.right,
	    height = height - margin.top - margin.bottom,
	    barPadding = 4;

	    var svg = d3.select(el).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		socket.send(query, {}, proc.pid)
		.success(function(m) {
			//console.log(m.body.stats);

			// var data = m.body.stats;	
			var data = [				
				{"day": "2013-07-31 00:00:00", "count" : 145766000, "volume": 145766000000},
				{"day": "2013-08-01 00:00:00", "count" : 265766000, "volume": 265766000000},
				{"day": "2013-08-02 00:00:00", "count" : 185766000, "volume": 185766000000},
				{"day": "2013-08-03 00:00:00", "count" : 265766000, "volume": 265766000000},
				{"day": "2013-08-04 00:00:00", "count" : 205766000, "volume": 205766000000},
				{"day": "2013-08-05 00:00:00", "count" : 195766000, "volume": 195766000000},
				{"day": "2013-08-06 00:00:00", "count" : 145766000, "volume": 145766000000},
				{"day": "2013-08-07 00:00:00", "count" : 245766000, "volume": 245766000000},
				{"day": "2013-08-08 00:00:00", "count" : 345766000, "volume": 345766000000},
				{"day": "2013-08-09 00:00:00", "count" : 285766000, "volume": 285766000000},
				{"day": "2013-08-10 00:00:00", "count" : 215766000, "volume": 215766000000},
				{"day": "2013-08-11 00:00:00", "count" : 445766000, "volume": 445766000000},
				{"day": "2013-08-12 00:00:00", "count" : 545766000, "volume": 545766000000},
				{"day": "2013-08-13 00:00:00", "count" : 245766000, "volume": 245766000000}
			];

			var x = d3.scale.linear()
				.domain([0, data.length])
				.range([0, width]);

	        var y = d3.scale.linear()
	            .domain([0, d3.max(data, function(d) { return d.volume; })])
	            .range([0, height]);

	        var y2 = d3.scale.linear()
	            .domain([0, d3.max(data, function(d) { return d.volume / 400; })])
	            .range([0, height]);

			// text volume
			svg.selectAll("text.bar-text-volume")
				.data(data)
				.enter()
				.append("text")
				.attr("class","bar-text-volume")
				.text(function(d) {
	        		return getLogScale(d.volume);
	   			})
	   			.attr("x", function(d, i) {
	        		return i * (width / data.length) + (width / data.length - barPadding) / 2;
	   			})
	   			.attr("y", function(d) {
	   				return height - y(d.volume) -2;
	   			})
	   			.attr("text-anchor", "middle");	 	            

			// data volume
	   		svg.selectAll("rect.bar-volume")
			   .data(data)
			   .enter()
			   .append("rect")
			   .attr("class","bar-volume")
			   .attr("x", function(d, i) {
			   		return i * (width / data.length);
			   	})
			   .attr("y", function(d) { 
			   		return height - y(d.volume);		   		
			   	})
			   .attr("width", width / data.length - barPadding)
			   .attr("height", function(d) {
			   		return y(d.volume);
			   	});

			// data count
			svg.selectAll("rect.bar-count")
			   .data(data)
			   .enter()
			   .append("rect")
			   .attr("class","bar-count")
			   .attr("x", function(d, i) { 
			   		return i * (width / data.length);
			   	})
			   .attr("y", function(d) {
			   		return height - y2(d.count);
			   	})
			   .attr("width", width / data.length - barPadding)
			   .attr("height", function(d) {
			   		return y2(d.count);
			   	});


			// text count
			svg.selectAll("text.bar-text-count")
				.data(data)
				.enter()
				.append("text")
				.attr("class","bar-text-count")
				.text(function(d) {
	        		return getLogScale(d.count);
	   			})
	   			.attr("x", function(d, i) {
	        		return i * (width / data.length) + (width / data.length - barPadding) / 2;
	   			})
	   			.attr("y", function(d) {
	   				return height - y2(d.count) - 2;
	   			})
	   			.attr("text-anchor", "middle");

			var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

			data.forEach(function(d) {
				d.day = parseDate(d.day.substring(0, 19));
			});

			// fix xScale range add 1 Date
			var maxDate = d3.max(data, function(d) {
				return d.day;
			});
			
			maxDate.setDate(maxDate.getDate()+1);

			var xScale = d3.time.scale()
	        	.domain([
	        		d3.min(data, function(d) { return d.day; }),
	        		d3.max(data, function(d) { return d.day; })
	        	])
	            .range([0, width]);

	        
	        var yScale = d3.scale.linear()
	            .domain([0, d3.max(data, function(d) { return d.volume; })])
	            .range([height, 0]);

			var xAxis = d3.svg.axis()
		    	.scale(xScale)
		    	.orient("bottom")
		    	.tickFormat(d3.time.format("%m/%d"));

		    var yAxis = d3.svg.axis()
		    	.scale(yScale)
		    	.orient("left")
		    	.ticks(5)
		    	.tickFormat(d3.format("s"));

		    svg.append("g")
				.call(xAxis)
				.attr("class","axis")
				.attr("transform", "translate(0," + (height) + ")");

			svg.append("g")
				.call(yAxis)
				.attr("class","axis");


		});
	}

	function getAlerts() {
		socket.send('org.logpresso.core.msgbus.LicensePlugin.getAlerts', {}, proc.pid)
		.success(function(m) {

			var data = [
				{"day": "2013-08-03 00:00:00", "count" : 130, "volume": "100"},
				{"day": "2013-08-07 00:00:00", "count" : 110, "volume": "100"},
				{"day": "2013-08-08 00:00:00", "count" : 180, "volume": "100"},
				{"day": "2013-08-09 00:00:00", "count" : 320, "volume": "100"},
				{"day": "2013-08-10 00:00:00", "count" : 480, "volume": "100"},
				{"day": "2013-08-11 00:00:00", "count" : 140, "volume": "100"},
				{"day": "2013-08-12 00:00:00", "count" : 1110, "volume": "100"}
			];

			//$scope.alerts = m.body.alerts;
			$scope.alerts = data;
			console.log($scope.alerts);

			if(m.isError) {
				console.log(m);
				return;
			}
			$scope.$apply();
		})
		.failed(function(m) {
			$scope.$apply();
		});
			
	}
	

	isQueryAllowed();
	hardwareKey();
	getLicenseInfos();
	getAlerts();
	makeBarChart("div.chart1", "org.logpresso.core.msgbus.LicensePlugin.getDailyStats", 700, 300);

}

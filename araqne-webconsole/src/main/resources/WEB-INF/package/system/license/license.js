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

	$scope.unsetLicense = function(val) {
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

	function getLogScale(val) {
		var result = computerFormatPrefix(val);
		return parseInt(result.value) + result.symbol;
	}

	function makeBarChart(el, query, width, height) {
		var margin = {top: 10, right: 20, bottom: 30, left: 30},
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
				{"day": "2013-07-31 00:00:00", "count" : 10, "volume": "100"},
				{"day": "2013-08-01 00:00:00", "count" : 50, "volume": "100"},
				{"day": "2013-08-02 00:00:00", "count" : 60, "volume": "100"},
				{"day": "2013-08-03 00:00:00", "count" : 130, "volume": "100"},
				{"day": "2013-08-04 00:00:00", "count" : 40, "volume": "100"},
				{"day": "2013-08-05 00:00:00", "count" : 20, "volume": "100"},
				{"day": "2013-08-06 00:00:00", "count" : 70, "volume": "100"},
				{"day": "2013-08-07 00:00:00", "count" : 110, "volume": "100"},
				{"day": "2013-08-08 00:00:00", "count" : 180, "volume": "100"},
				{"day": "2013-08-09 00:00:00", "count" : 320, "volume": "100"},
				{"day": "2013-08-10 00:00:00", "count" : 480, "volume": "100"},
				{"day": "2013-08-11 00:00:00", "count" : 140, "volume": "100"},
				{"day": "2013-08-12 00:00:00", "count" : 1110, "volume": "100"},
				{"day": "2013-08-13 00:00:00", "count" : 80, "volume": "100"}
			];

			var x = d3.scale.linear()
				.domain([0, data.length])
				.range([0, width]);

	        var y = d3.scale.linear()
	            .domain([0, d3.max(data, function(d) { return d.count; })])
	            .range([0, height]);

			// data bar
			svg.selectAll("rect.bar-count")
			   .data(data)
			   .enter()
			   .append("rect")
			   .attr("class","bar-count")
			   .attr("x", function(d, i) { 
			   		return i * (width / data.length);
			   	})
			   .attr("y", function(d) {
			   		return height - y(d.count);
			   	})
			   .attr("width", width / data.length - barPadding)
			   .attr("height", function(d) {
			   		return y(d.count);
			   	});

			// overflow bar
	   		svg.selectAll("rect.bar-oveflow")
			   .data(data)
			   .enter()
			   .append("rect")
			   .attr("class","bar-overflow")
			   .attr("x", function(d, i) {
			   		return i * (width / data.length);
			   	})
			   .attr("y", function(d) { 
			   		return height - y(d.count);		   		
			   	})
			   .attr("width", width / data.length - barPadding)
			   .attr("height", function(d) {
			   		var overflow = d.count - d.volume;
			   		return overflow > 0 ? y(overflow) : 0; 
			   	});

			// overflow text
			svg.selectAll("text.bar-text")
				.data(data)
				.enter()
				.append("text")
				.attr("class","bar-text")
				.text(function(d) {
	        		return getLogScale(d.count);
	   			})
	   			.attr("x", function(d, i) {
	        		return i * (width / data.length) + (width / data.length - barPadding) / 2;
	   			})
	   			.attr("y", function(d) {
	   				return height - y(d.count);
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
	            .domain([0, d3.max(data, function(d) { return d.count; })])
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

	isQueryAllowed();
	hardwareKey();
	getLicenseInfos();
	makeBarChart("div.chart1", "org.logpresso.core.msgbus.LicensePlugin.getDailyStats", 700, 300, "stats");
	makeBarChart("div.chart2", "org.logpresso.core.msgbus.LicensePlugin.getAlerts", 600, 300, "alerts");
}

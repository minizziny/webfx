function StarterController($scope, socket, eventSender, $rootScope, serviceExtension) {

	var apps = ['app0'];
	apps.forEach(function(appid) {

		serviceExtension.load(appid)
		.done(function(manifest) {
			var prefix = 'apps/' + appid + '/';
			if(!manifest['starter']) return;

			serviceExtension.register(appid, 'starter', manifest);

			$.getScript(prefix + manifest['starter'].script)
			.done(function(script) {
				console.log('loaded')
			})
			.fail(function(a,b,c) {
				console.log(a,b,c);
			});

		});

	});

	function setGrayBackground(b, apply) {
		return function() {
			$rootScope.grayBackground = b;
			if(apply) {
				$rootScope.$apply();
			}
		}
	}
	eventSender.starter.$event.on('load', setGrayBackground(true, true));
	eventSender.starter.$event.on('resume', setGrayBackground(true));
	eventSender.starter.$event.on('unload', setGrayBackground(false));
	eventSender.starter.$event.on('suspend', setGrayBackground(false));
	
	$scope.getPid = eventSender.starter.pid;
	$scope.partitions = [];

	function makeChart(el, query, elupdate) {
		var margin = {top: 10, right: 20, bottom: 30, left: 80},
		    width = 820 - margin.left - margin.right,
		    height = 120 - margin.top - margin.bottom;

		var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

		var x = d3.time.scale()
		    .range([0, width]);

		var y = d3.scale.linear()
			.range([height, 0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom")
		    .tickFormat(d3.time.format("%H:%M"))

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left")
		    .ticks(5)
		    .tickFormat(d3.format("d"))
		    .tickSubdivide(0);

		var line = d3.svg.line()
		    .x(function(d) { return x(d.date); })
		    .y(function(d) { return y(d.count); });

		var svg = d3.select(el).append("svg")
		    .attr("width", width + margin.left + margin.right)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		socket.send(query, {}, eventSender.starter.pid)
		.success(function(m) {
			//console.log(m.body.graph);
			var data = m.body.graph;

		  data.forEach(function(d) {
		    d.date = parseDate(d.date.substring(0, 19));
		  });

		  var ydom = d3.extent(data, function(d) { return d.count; });
		  ydom[0] = 0;

		  x.domain(d3.extent(data, function(d) { return d.date; }));
		  y.domain(ydom);

		  svg.append("g")
		      .attr("class", "x axis")
		      .attr("transform", "translate(0," + height + ")")
		      .call(xAxis);

		  svg.append("g")
		      .attr("class", "y axis")
		      .call(yAxis)

		  svg.append("path")
		      .datum(data)
		      .attr("class", "line")
		      .attr("d", line);

			//updateTimer(elupdate);
		})

	}

	function computerFormatPrefix(val) {
		var computerFormatPrefixes = [ "", "K", "M", "G", "T", "P", "E", "Z", "Y" ];
		function log1024(val) { return Math.log(val) / Math.log(1024); }

		var pow = Math.floor( log1024(val) );
		if(pow == -Infinity) {
			return { symbol: '', value: 0 };
		}
		else {
			return {
				symbol: computerFormatPrefixes[pow],
				value: val/Math.pow(1024, pow)
			};
		}
	}

	function diskSize(val) {
		var pfx = computerFormatPrefix(val);
		return  pfx.value.toFixed(2) + pfx.symbol + "B";
	}

	function getDiskUsages() {
		$scope.partitions.splice(0, $scope.partitions.length);

		socket.send('com.logpresso.core.msgbus.LauncherPlugin.getDiskUsages', {}, eventSender.starter.pid)
		.success(function(m) {
			$.each(m.body.usages, function(i, obj) {

				obj.totalSi = diskSize(obj.total);
				obj.usedSi = diskSize(obj.used);
				var widthPercent = 100;
				var used = (obj.used / obj.total * widthPercent).toFixed(2);
				obj.usedPercent = { 'width': used + '%' };
				obj.freePercent = { 'width': (widthPercent - used) + '%' };

				$scope.partitions.push(obj);
			});

			$scope.$apply();
			//updateTimer("#ltPartition");
		});
	}

	getDiskUsages();
	makeChart("div.chart1", "com.logpresso.core.msgbus.LauncherPlugin.getLogTrendGraph", "#ltLogTrend");
	makeChart("div.chart2", "com.logpresso.core.msgbus.LauncherPlugin.getAlertTrendGraph", "#ltAlertTrend");
}
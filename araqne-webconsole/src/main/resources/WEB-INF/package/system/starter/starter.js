require(["/lib/jquery.js", "/lib/knockout.js", "/lib/d3.v3.js", "/core/connection.js"], 
	function(_$, ko, d3, Socket) {


function makeChart(el, query) {
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
	    .ticks(5);

	var line = d3.svg.line()
	    .x(function(d) { return x(d.date); })
	    .y(function(d) { return y(d.count); });

	var svg = d3.select(el).append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	Socket.send(query, {}, function(m) {
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
	})

/*
	d3.csv("/package/system/starter/data.csv", function(error, data) {
	  data.forEach(function(d) {
	    d.date = parseDate(d.date);
	    d.close = +d.close;
	  });

	  var ydom = d3.extent(data, function(d) { return d.close; });
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
	});
*/
}

makeChart("div.chart1", "org.logpresso.core.msgbus.LauncherPlugin.getLogTrendGraph");
makeChart("div.chart2", "org.logpresso.core.msgbus.LauncherPlugin.getAlertTrendGraph");

Socket.send('org.logpresso.core.msgbus.LauncherPlugin.getDiskUsages', {}, function(m) {
	$.each(m.body.usages, function(i, obj) {
		/*
		obj.total_c = 
		obj.used_c = 
		obj.total_w = 
		obj.used_w = 
		*/
	});
	ko.applyBindings(m.body, document.getElementById("tbPartition"));
});

Socket.send('org.logpresso.core.msgbus.LauncherPlugin.getArchiveStatus', {}, function(m) {
	ko.applyBindings(m.body, document.getElementById("tbArchiveStatus"))
})


});
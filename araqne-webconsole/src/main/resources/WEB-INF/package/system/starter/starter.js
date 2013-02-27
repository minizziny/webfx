require(["/lib/jquery.js", "/lib/knockout.js", "/lib/d3.v3.js", "/core/connection.js", "/lib/jquery.timeago.js"], 
	function(_$, ko, d3, Socket, timeago) {


jQuery.timeago.settings.strings = {
	suffixAgo: "전",
	suffixFromNow: "후",
	seconds: "1분 이내",
	minute: "1분",
	minutes: "%d분",
	hour: "1시간",
	hours: "%d시간",
	day: "하루",
	days: "%d일",
	month: "한 달",
	months: "%d달",
	year: "1년",
	years: "%d년",
	wordSeparator: " "
};

var iso8610 = d3.time.format.iso;


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



	   $(elupdate).attr("title", iso8610( new Date() )).timeago();
	   $(elupdate).data("timeago", { datetime: new Date() });
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

makeChart("div.chart1", "org.logpresso.core.msgbus.LauncherPlugin.getLogTrendGraph", "#ltLogTrend");
makeChart("div.chart2", "org.logpresso.core.msgbus.LauncherPlugin.getAlertTrendGraph", "#ltAlertTrend");

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

function getArchiveStatus() {
	Socket.send('org.logpresso.core.msgbus.LauncherPlugin.getArchiveStatus', {}, function(m) {
		console.log(m);
		ko.applyBindings(m.body, document.getElementById("tbArchiveStatus"))
	});
	
	$("#ltStatus").attr("title", iso8610( new Date() )).timeago();
	$("#ltStatus").data("timeago", { datetime: new Date() });

}

getArchiveStatus();

$("#rfStatus").on("click", function() {
	console.log("refresh Status");
	getArchiveStatus();

});

$("#rfAlertTrend").on("click", function() {
	console.log("refresh Alert Trend");
	$("div.chart2").empty();
	makeChart("div.chart2", "org.logpresso.core.msgbus.LauncherPlugin.getAlertTrendGraph", "#ltAlertTrend");
});

$("#rfLogTrend").on("click", function() {
	console.log("refresh Log Trend");
	$("div.chart1").empty();
	makeChart("div.chart1", "org.logpresso.core.msgbus.LauncherPlugin.getLogTrendGraph",  "#ltLogTrend");
});

});
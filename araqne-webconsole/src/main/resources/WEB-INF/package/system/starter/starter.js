require(["/lib/jquery.js", "/lib/knockout.js", "/lib/d3.v3.js", "/core/connection.js", "/core/program.js", "moment"], 
	function(_$, ko, d3, Socket, programManager, moment) {

var iso8610 = d3.time.format.iso;

moment.lang('ko', {
    months : "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),
    monthsShort : "1월_2월_3월_4월_5월_6월_7월_8월_9월_10월_11월_12월".split("_"),
    weekdays : "일요일_월요일_화요일_수요일_목요일_금요일_토요일".split("_"),
    weekdaysShort : "일_월_화_수_목_금_토".split("_"),
    weekdaysMin : "일_월_화_수_목_금_토".split("_"),
    longDateFormat : {
        LT : "A h시 mm분",
        L : "YYYY.MM.DD",
        LL : "YYYY년 MMMM D일",
        LLL : "YYYY년 MMMM D일 LT",
        LLLL : "YYYY년 MMMM D일 dddd LT"
    },
    meridiem : function (hour, minute, isUpper) {
        return hour < 12 ? '오전' : '오후';
    },
    calendar : {
        sameDay : '오늘 LT',
        nextDay : '내일 LT',
        nextWeek : 'dddd LT',
        lastDay : '어제 LT',
        lastWeek : '지난주 dddd LT',
        sameElse : 'L'
    },
    relativeTime : {
        future : "%s 후",
        past : "%s 전",
        s : "몇초",
        ss : "%d초",
        m : "일분",
        mm : "%d분",
        h : "한시간",
        hh : "%d시간",
        d : "하루",
        dd : "%d일",
        M : "한달",
        MM : "%d달",
        y : "일년",
        yy : "%d년"
    },
    ordinal : '%d일'
});

var timer = {};

function updateTimer(el) {
	var mm = moment();
	var from = mm.fromNow();
	$(el).text(from);

	console.log(el, 'changed');
	clearInterval(timer[el])
	timer[el] = null;

	timer[el] = setInterval(function() {
		if(from != mm.fromNow()) {
			console.log(el, 'changed');
			from = mm.fromNow();
			$(el).text(from);
		}
	}, 60000);
}

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

		updateTimer(elupdate);
	})

}

makeChart("div.chart1", "org.logpresso.core.msgbus.LauncherPlugin.getLogTrendGraph", "#ltLogTrend");
makeChart("div.chart2", "org.logpresso.core.msgbus.LauncherPlugin.getAlertTrendGraph", "#ltAlertTrend");


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
	Socket.send('org.logpresso.core.msgbus.LauncherPlugin.getDiskUsages', {}, function(m) {
		//console.log(m.body)

		$.each(m.body.usages, function(i, obj) {
			obj.totalSi = diskSize(obj.total);
			obj.usedSi = diskSize(obj.used);
			var widthPercent = 100;
			var used = (obj.used / obj.total * widthPercent).toFixed(2);
			obj.usedPercent = used + "%";
			obj.freePercent = (widthPercent - used) + "%";
			
		});
		ko.applyBindings(m.body, document.getElementById("tbPartition"));

		updateTimer("#ltPartition");
	});
}

getDiskUsages();

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

$("#rfPartition").on("click", getDiskUsages);


$("#btnManageLogSource").on("click", function() {
	var programLogSource = {
		"visible": true,
		"created": "2013-02-12 15:18:03+0900",
		"updated": "2013-02-12 15:18:03+0900",
		"description": null,
		"name": "로그 수집 설정",
		"path": "logsource",
		"seq": 2,
		"pack": "Logpresso"
	};
	parent.vmPrograms.run(programLogSource);
})

});
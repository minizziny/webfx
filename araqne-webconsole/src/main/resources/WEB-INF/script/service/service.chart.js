angular.module('app.chart', [])
.factory('serviceChart', function(serviceUtility) {
	var tooltip = angular.element('#tooltip')

	var z = true;

	Highcharts.setOptions({
		global: {
			useUTC: false
		}
	});

	function ParseTimeWithTimezone(timeStr) {
		// FORMAT
		// 2014-01-06 14:00:00+0900

		var timezoneStr = timeStr.substring(19,24); // "+0900"
		timezoneStr = timezoneStr.replace(timezoneStr[0], (timezoneStr[0] == '-' ? '+' : '-')); // "-0900"
		var timezone = parseInt(timezoneStr) / 100 * 60; // -9000 / 100 * 60 = -540
		var parsableStr = timeStr.substring(0, 19).replace(' ', 'T');

		var datetimeMil = Date.parse(parsableStr);
		var spanHour = timezone / 60;
		return datetimeMil + (spanHour * 3600 * 1000);

	}

	function getDataMetadata(data) {
		var noData = data.length == 0 || data.some(function(s) {
			return s.values[0] == undefined
		});
		if(noData) return null;

		var isDateTime = data[0].labelType == 'datetime';
		var isString = data[0].labelType == 'string';
		var isNumber = data[0].labelType == 'number'
		var type = (function() {
			if(isDateTime) return 'datetime';
			if(isString) return 'category';
			if(isNumber) return 'linear';
		})();
		return {
			isDateTime: isDateTime,
			isString: isString,
			isNumber: isNumber,
			type: type
		};
	}

	function multiBarHorizontalChart(selector, data) {
		

		if(z) {
			var m = getDataMetadata(data);
			if(m == null) return;

			$(selector).empty();

			var series = [];
			var categories = [];

			data.forEach(function(s) {
				var dataMap = s.values.filter(function(o) {
					return o.value != undefined;
				})
				.map(function(o) {
					if(m.isDateTime) {
						return [ ParseTimeWithTimezone(o.label), o.value ];	
					}
					
					if(m.isString || m.isNumber) {
						return [ o.label, o.value ];
					}
				});
				
				var objSeries = {
					name: s.name,
					data: dataMap
				}

				series.push(objSeries);
			});

			console.log(data, series)

			$(selector).highcharts({
				chart: {
					type: 'column',
					animation: false
				},
				colors: color_map,
				title: {
					text: null
				},
				credits: {
					enabled: false
				},
				xAxis: {
					type: m.type
				},
				yAxis: {
					title: {
						text: null
					}
				},
				series: series,
				plotOptions: {
					column: {
						animation: false
					}
				}
			});

		}
		if(z) return;


		$(selector).empty();
		if(data.length == 0) return;

		var margin = {top: 30, right: 20, bottom: 90, left: 40},
		width = 400 - margin.left - margin.right,
		height = 300 - margin.top - margin.bottom;

		if(data[0].labelType == 'datetime') {
			var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

			data.forEach(function(d) {
				d.values.forEach(function(v) {
					v.label = v.label.substring(0, 19);
				});
			});
		}

		var x0 = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);

		var x1 = d3.scale.ordinal();

		var y = d3.scale.linear()
		.range([height, 0]);

		var color = d3.scale.ordinal()
		.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

		var xAxis = d3.svg.axis()
		.scale(x0)
		.orient("bottom");

		var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.tickFormat(d3.format(".2s"));

		var svg = d3.select(selector).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var xDom0 = data[0].values.map(function(d) { return d.label; });
		var xDom1 = data.map(function(d) { return d.key; });
		x0.domain(xDom0);
		x1.domain(xDom1).rangeRoundBands([0, x0.rangeBand()]);
		y.domain([0, d3.max(data, function(d) { return d3.max(d.values, function(d) { return d.value; }); })]);

		//console.log(xDom1, xDom2);

		var xGroup = svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

		if(true) {// xtype == 'datetime') {
			xGroup.selectAll('text')
				.attr('transform', "rotate(-45) translate(-55 0)")
		}

		svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)
		/*
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text("Population");
		*/

		/* rules */
		svg.append('g')
		.selectAll("line.rule.y")
		.data(y.ticks(yAxis.ticks()[0]))
		.enter().append('line')
		.attr('class', 'rule y')
		.attr('x2', width)
		.attr("transform", function(d) { return "translate(0," + y(d) + ")"; })
		.style('stroke', '#ccc')
		.style('stroke-width', '0.5');

		var state = svg.selectAll(".state")
		.data(data)
		.enter().append("g")
		.attr("class", "g");

		state.selectAll("rect")
		.data(function(d) {
			return d.values;
		})
		.enter().append("rect")
			.attr("width", x1.rangeBand())
			.attr("x", function(d, i, j) { return x0(d.label) + x1.rangeBand() * j; })
			.attr("y", function(d) { return (d.value == undefined) ? y(0) : y(d.value); })
			.attr("height", function(d) { return (d.value == undefined) ? (height - y(0)) : (height - y(d.value)); })
			.style("fill", function(d, i, j) {
				if(data.length == 1) {
					return color_map[i];
				}
				else {
					return data[j].color;
				}
			})
			.on('mouseenter', function(d, i, j) {
				this.isEnter = true;
				
				d3.select(this).style('fill', function() {
					if(data.length == 1) {
						return d3.rgb(color_map[i]).darker(1);
					}
					else {
						return d3.rgb(data[j].color).darker(1);
					}
				});
				tooltip.find('.tooltip-inner').html(d.value + '/' + d.label);
				var mpos = d3.mouse($('body')[0]);
				tooltip.css('top', mpos[1] - 60).css('left',mpos[0] - tooltip.width() / 2).addClass('in').show();
			})
			.on('mousemove', function(d, i, j) {
				var mpos = d3.mouse($('body')[0]);
				tooltip.css('top', mpos[1] - 60).css('left',mpos[0] - tooltip.width() / 2).addClass('in');
			})
			.on('mouseout', function(d, i, j) {
				d3.select(this).style('fill', function() {
					if(data.length == 1) {
						return color_map[i];
					}
					else {
						return data[j].color;
					}
				});
				tooltip.removeClass('in').hide();

				this.isEnter = false;
			});

		var legend = d3.select(selector).select('svg').selectAll(".legend")
		.data(data.slice().reverse())
		.enter().append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) { return "translate(" + (width - i * 60 - margin.right) + ", 0)"; });

		legend.append("rect")
		.attr("x", 30)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", function(d, i) { 
			if(data.length == 1) {
				return 'transparent';
			}
			else {
				return d.color;
			}
		});

		legend.append("text")
		.attr("x", function() {
			if(data.length == 1) {
				return 48;
			}
			else { return 24; }
		})
		.attr("y", 9)
		.attr("dy", ".35em")
		.style("text-anchor", "end")
		.text(function(d) { return (d.name == undefined) ? d.key : d.name; });
	}

	function lineChart(selector, data, options) {

		if(z) {
			var m = getDataMetadata(data);
			if(m == null) return;

			$(selector).empty();

			var series = [];
			var categories = [];

			data.forEach(function(s) {
				var dataMap = s.values.filter(function(o) {
					return o.value != undefined;
				})
				.map(function(o) {
					if(m.isDateTime) {
						return [ ParseTimeWithTimezone(o.label), o.value ];	
					}
					
					if(m.isString || m.isNumber) {
						return [ o.label, o.value ];
					}
				});
				
				var objSeries = {
					name: s.name,
					data: dataMap
				}

				series.push(objSeries);
			});

			console.log(data, series)
			var chartOption = {
				type: 'line',
				animation: false
			}

			if(!!options) {
				chartOption.width = options.width;
				chartOption.height = options.height;
			}

			$(selector).highcharts({
				chart: chartOption,
				colors: color_map,
				title: {
					text: null
				},
				credits: {
					enabled: false
				},
				xAxis: {
					type: m.type
				},
				yAxis: {
					title: {
						text: null
					}
				},
				series: series,
				plotOptions: {
					line: {
						animation: false
					}
				}
			});

		}

		if(z) return;


		$(selector).empty();
		if(data[0].values.length == 0) return;

		var xtype = data[0].labelType;
		var defaults = {
			'margin': (function() {
				if(xtype == 'number') {
					//var margin = {top: 30, right: 20, bottom: 90, left: 40},
					return {top: 30, right: 20, bottom: 90, left: 80};
				}
				else if(xtype == 'datetime') {
					//var margin = {top: 30, right: 20, bottom: 90, left: 40},
					return {top: 30, right: 20, bottom: 90, left: 80};
				}
			}()),
			'width': 400,
			'height': 300
		}
		/* merge defaults and options, without modifying defaults */
		var settings = $.extend({}, defaults, options);
		
		var width = settings.width - settings.margin.left - settings.margin.right
		var height = settings.height - settings.margin.top - settings.margin.bottom;
		var margin = settings.margin;

		if(xtype == 'datetime') {
			var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

			data.forEach(function(d) {
				d.values.forEach(function(v) {
					v.label = parseDate(v.label.substring(0, 19));
				});
			});
		}

		var x = d3.time.scale()
		.range([0, width]);

		var y = d3.scale.linear()
		.range([height, 0]);

		var xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom")

		var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");

		var line = d3.svg.line()
		.x(function(d) { return x(d.label); })
		.y(function(d) { return y(d.value); });

		var svg = d3.select(selector).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		// data depends
		var xDom = d3.extent(data[0].values, function(d) { return d.label; })
		x.domain(xDom);

		if(xtype == 'datetime') {
			xAxis.tickFormat(d3.time.format("%Y-%m-%d %H:%M:%S"));
		}
		else if(xtype == 'number') {
			xAxis.tickFormat(d3.format(',d'))
			//.tickValues(d3.range(xDom[0], xDom[1], data[0].values.length / 5));
		}


		var isSameValue = false;
		var first;
		if(data.length == 1) {
			var isSameValue = data[0].values.every(function(v) { 
				if(first == undefined) {
					first = v.value;
				}
				return first == v.value;
			});
		}
		
		if(isSameValue) {
			y.domain([0, first * 2]);
		}
		else {
			y.domain([
				d3.min(data, function(c) { return d3.min(c.values, function(v) { return v.value; }); }),
				d3.max(data, function(c) { return d3.max(c.values, function(v) { return v.value; }); })
			]);
		}
		
		var xGroup = svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis)

		if(true) {
			xGroup.selectAll('text')
				.attr('transform', "rotate(-45) translate(-55 0)")
		}

		/* rules */
		svg.append('g')
		.selectAll("line.rule.y")
		.data(y.ticks(yAxis.ticks()[0]))
		.enter().append('line')
		.attr('class', 'rule y')
		.attr('x2', width)
		.attr("transform", function(d) { return "translate(0," + y(d) + ")"; })
		.style('stroke', '#ccc')
		.style('stroke-width', '0.5');

		var xRuleData;
		if(xAxis.tickValues() != null) {
			xRuleData = xAxis.tickValues();
		}
		else {
			xRuleData = x.ticks(xAxis.ticks()[0]);
		}

		svg.append('g')
		.selectAll("line.rule.x")
		.data(xRuleData)
		.enter().append('line')
		.attr('class', 'rule x')
		.attr('y2', height)
		.attr("transform", function(d) { return "translate(" + x(d) + ",0)"; })
		.style('stroke', '#ccc')
		.style('stroke-width', '0.5');


		svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);

		var city = svg.selectAll(".city")
		.data(data)
		.enter().append("g")
		.attr("class", "city");

		var dots = svg.selectAll('.dots')
		.data(data)
		.enter().append('g')
		.attr('class', 'dots');

		var dot = dots.selectAll('.dot')
		.data(function(d) { return d.values; })
		.enter().append('circle')
		.attr('class', 'dot')
		.attr("r", 3)
		.attr("cx", function(d) { return x(d.label); })
		.attr("cy", function(d) { return y(d.value); })
		.style("stroke", function(d, i, j) { return 'transparent' })// return data[j].color; })
		.style('stroke-width', 2)
		.style("fill", function(d, i, j) { return 'transparent'; })
		.on('mouseover', function(d, i, j) {
			var mpos = d3.mouse($('body')[0]);
			d3.select(this)
			.attr('r', 5)
			.style("stroke", function() { return data[j].color; })
			.style("fill", function() { return '#fff'; });

			tooltip.find('.tooltip-inner').html(d.value + '/' + d.label);
			tooltip.css('top', mpos[1] - 60).css('left',mpos[0] - tooltip.width() / 2).addClass('in').show();
		})
		.on('mouseout', function() {
			d3.select(this).attr('r', 3)
			.style("stroke", function() { return 'transparent'; })
			.style("fill", function() { return 'transparent'; });

			tooltip.removeClass('in').hide();;
		});

		city.append("path")
		.attr("class", "line")
		.attr("d", function(d) { 
			return line(d.values);
		})
		.style("stroke", function(d) { return d.color; });

		city.append("text")
		.datum(function(d) { return {name: d.key, value: d.values[d.values.length - 1]}; })
		.attr("transform", function(d) { return "translate(" + x(d.value.label) + "," + y(d.value.value) + ")"; })
		.attr("x", 3)
		.attr("dy", ".35em")
		.text(function(d) { return d.key; });


		// legend
		var legend = d3.select(selector).select('svg').selectAll(".legend")
		.data(data.slice().reverse())
		.enter().append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) { return "translate(" + (settings.width - i * 80 - margin.left) + ", 0)"; });

		legend.append("rect")
		.attr("x", 30)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", function(d, i) { 
			if(data.length == 1) {
				return 'transparent';
			}
			else {
				return d.color;
			}
		});

		legend.append("text")
		.attr("x", function() {
			if(data.length == 1) {
				return 48;
			}
			else { return 24; }
		})
		.attr("y", 9)
		.attr("dy", ".35em")
		.style("text-anchor", "end")
		.text(function(d) { return (d.name == undefined) ? d.key : d.name; });

	}

	function pie(selector, data) {

		if(false) {
			var m = getDataMetadata(data);
			if(m == null) return;

			$(selector).empty();

			var series = [];
			var categories = [];

			data.forEach(function(s) {
				var dataMap = s.values.filter(function(o) {
					return o.value != undefined;
				})
				.map(function(o) {
					if(m.isDateTime) {
						return [ ParseTimeWithTimezone(o.label), o.value ];	
					}
					
					if(m.isString || m.isNumber) {
						return [ o.label, o.value ];
					}
				});
				
				var objSeries = {
					name: s.name,
					data: dataMap
				}

				series.push(objSeries);
			});

			console.log(data, series)

			$(selector).highcharts({
				chart: {
					type: 'pie',
					animation: false
				},
				colors: color_map,
				title: {
					text: null
				},
				credits: {
					enabled: false
				},
				xAxis: {
					type: m.type
				},
				yAxis: {
					title: {
						text: null
					}
				},
				series: series,
				plotOptions: {
					pie: {
						animation: false
					}
				}
			});

		}

		if(false) return;

		$(selector).empty();
		if(data.length == 0) return;
		data = data[0];
		
		var width = 400,
		height = 300,
		radius = Math.min(width, height) / 3;

		//var color = d3.scale.ordinal().range(color_map);

		var arc = d3.svg.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);

		var arcl = d3.svg.arc()
		.outerRadius(radius - 10)
		.innerRadius(radius - 60);

		var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) { return d.value; });

		var svg = d3.select(selector).append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + (width / 2 - 80) + "," + height / 2 + ")");

		var g = svg.selectAll(".arc")
		.data(pie(data.values))
		.enter().append("g")
		.attr("class", "arc");

		g.append("path")
		.attr("d", arc)
		.style("fill", function(d, i) { return color_map[i]; }); //color(d.data.value); });

		var g2 = svg.selectAll(".arcl")
		.data(pie(data.values))
		.enter().append("g")
		.attr("class", "arcl");

		g2.append("text")
		.attr("transform", function(d) { return "translate(" + arcl.centroid(d) + ")"; })
		.attr("dy", ".35em")
		.style("text-anchor", "middle")
		.text(function(d) { return d.data.value; });

		var legend = svg.append('g')
		.attr('transform', 'translate(-130, ' + -radius + ')')
		.selectAll(".legend")
		.data(data.values)
		.enter().append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

		legend.append("rect")
		.attr("x", width - 18)
		.attr("width", 18)
		.attr("height", 18)
		.style("fill", function(d, i) { return color_map[i]; });

		legend.append("text")
		.attr("x", width - 24)
		.attr("y", 9)
		.attr("dy", ".35em")
		.style("text-anchor", "end")
		.text(function(d) { return d.label; });
	}

	function buildJSONStructure(dataSeries, dataResult, dataLabel) {

		var st = [];

		for (var i = 0; i < dataSeries.length; i++) {
			var s = dataSeries[i];
			var series = {
				'key': s.key,
				'name': s.name,
				'color': s.color,
				'values': undefined,
				'labelType': dataLabel.type
			};

			series.values = dataResult.map(function(obj) {
				if(!!s.value) {
					return {
						'value': obj[s.value.key],
						'label': obj[dataLabel.name]
					}
				}
				else {
					return {
						'value': obj[s.key],
						'label': obj[dataLabel.name]
					}
				}
			});
			st.push(series);
		};

		// assign guid
		if(dataResult != undefined) {
			for (var i = dataResult.length - 1; i >= 0; i--) {
				var guid = serviceUtility.generateType3();
				for (var j = st.length - 1; j >= 0; j--) {
					st[j].values[i].guid = guid;
				};
			};	
		}

		return st;
	}

	function getDataSeries(metadata) {
		var metadataSeries = JSON.parse(decodeURIComponent(metadata));

		var dataSeries = metadataSeries.map(function(obj) {
			var value = { name: obj.key }
			delete obj.key;
			obj.value = value;
			return obj;
		});
		return dataSeries;
	}

	return {
		multiBarHorizontalChart: multiBarHorizontalChart,
		lineChart: lineChart,
		pie: pie,
		buildJSONStructure: buildJSONStructure,
		getDataSeries: getDataSeries
	}
});
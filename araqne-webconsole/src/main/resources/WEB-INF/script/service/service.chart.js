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

	function multiBarHorizontalChart(selector, data, options) {
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
					return {x: ParseTimeWithTimezone(o.label), y: o.value };
				}

				if(m.isNumber) {
					return {x: o.label, y: o.value };
				}

				if(m.isString) {
					return {name: o.label, y: o.value };
				}
			});
			
			var objSeries = {
				name: s.name,
				data: dataMap
			}

			series.push(objSeries);
		});

		var chartOption = {
			type: 'column',
			animation: false,
			reflow: false
		}

		if(!!options) {
			chartOption.width = options.width;
			chartOption.height = options.height;
		}

		var op1 = {
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
				column: {
					animation: false
				}
			}
		}
		
		$(selector).highcharts(op1);
	}

	function lineChart(selector, data, options) {
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
					return {x: ParseTimeWithTimezone(o.label), y: o.value };
				}

				if(m.isNumber) {
					return {x: o.label, y: o.value };
				}

				if(m.isString) {
					if(categories.indexOf(o.label) == -1) {
						categories.push(o.label);
					}
					return {name: o.label, y: o.value };
				}
			})
			// .sort(function(a,b) {
			// 	if(m.isNumber || m.isDateTime) {
			// 		return a.x - b.x;
			// 	}
			// 	if(m.isString) {
			// 		return a.name - b.name;
			// 	}
			// });
			
			var objSeries = {
				name: s.name,
				data: dataMap
			}
			// console.log(objSeries)

			series.push(objSeries);
		});

		var underZero = series.some(function(s) {
			var min = Math.min.apply(null, s.data.map(function (obj) {
				return obj.y;
			}));
			return min < 0;
		});

		var chartOption = {
			type: 'line',
			animation: false,
			reflow: false
		}

		if(!!options) {
			chartOption.width = options.width;
			chartOption.height = options.height;
		}

		var c1 = {
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
		}

		if(m.isString) {
			console.log(categories, m.type)
			c1.xAxis.categories = categories;
		}
		if(m.isDateTime) {
			c1.xAxis.minTickInterval = 1000;
		}

		if(!underZero) {
			c1.yAxis.min = 0;
		}

		$(selector).highcharts(c1);
	}

	function pie(selector, data, options) {

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
					return {x: ParseTimeWithTimezone(o.label), y: o.value };
				}

				if(m.isNumber) {
					return {x: o.label, y: o.value };
				}

				if(m.isString) {
					return {name: o.label, y: o.value };
				}
			});
			
			var objSeries = {
				name: s.name,
				data: dataMap
			}

			series.push(objSeries);
		});

		var chartOption = {
			type: 'pie',
			animation: false,
			reflow: false
		}

		if(!!options) {
			chartOption.width = options.width;
			chartOption.height = options.height;
		}

		var c1 = {
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
				pie: {
					animation: false,
					allowPointSelect: true,
					cursor: 'pointer',
					dataLabels: {
						enabled: false
					},
					showInLegend: true
				}
			}
		};

		$(selector).highcharts(c1);
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
				'labelType': dataLabel.type,
				'nullToZero': s.nullToZero
			};

			series.values = dataResult.map(function(obj) {
				if(!!s.value) {
					return {
						'value': (series.nullToZero) ? (obj[s.value.key] == null ? 0 : obj[s.value.key] ) : obj[s.value.key],
						'label': obj[dataLabel.name]
					}
				}
				else {
					return {
						'value': (series.nullToZero) ? (obj[s.key] == null ? 0 : obj[s.key] ) : obj[s.key],
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

	function getWordCloud(result, colNameNumber, colNameString, el) {

		var w = 800, h = 600;
		
		var maxValue = Math.max.apply(this, result.map(function(item) { return item[colNameNumber]} ));
		var fill = d3.scale.category20();
		var fontSize = d3.scale.linear().range([14, 100]);
		fontSize.domain([1, maxValue]);

		el = $(el);
		el.empty();

		var layout = d3.layout.cloud()
			.size([w,h])
			.spiral("archimedean")
			.font("Impact")
			.text(function(d) { return d[colNameString]; })
			.fontSize(function(d) { 
				return fontSize(d[colNameNumber]);
			})
			.on("end", draw);

		var svg = d3.select(el[0]).append("svg")
			.attr("width", w)
			.attr("height", h);

		var background = svg.append("g");

		var vis = svg.append("g")
			.attr("transform", "translate(" + [w >> 1, h >> 1] +")");

		function draw(words, bounds) {
			scale = bounds ? Math.min(
				w / Math.abs(bounds[1].x - w / 2),
				w / Math.abs(bounds[0].x - w / 2),
				h / Math.abs(bounds[1].y - h / 2),
				h / Math.abs(bounds[0].y - h / 2)) / 2 : 1;

			var text = vis.selectAll("text")
				.data(words, function(d) { return d[colNameString]; });

			text.transition()
				.duration(1000)
				.attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
				.style("font-size", function(d) { return d.size + "px"; });

			text.enter().append("text")
				.attr("text-anchor", "middle")
				.attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
				.style("font-size", function(d) { return d.size + "px"; })

			text.style("font-family", 'Impact')
				.style("fill", function(d) { return fill(d[colNameString]); })
				.text(function(d) { return d.text; });

			var exitGroup = background.append("g")
				.attr("transform", vis.attr("transform"));
			
			var exitGroupNode = exitGroup.node();
			text.exit().each(function() {
				exitGroupNode.appendChild(this);
			});

		}

		layout.stop().words(result).start();
	}

	return {
		multiBarHorizontalChart: multiBarHorizontalChart,
		lineChart: lineChart,
		pie: pie,
		buildJSONStructure: buildJSONStructure,
		getDataSeries: getDataSeries,
		getWordCloud: getWordCloud
	}
});
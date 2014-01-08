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

		setTimeout(function() {
			options = {}
			options.width = $(selector).width();
			options.height = $(selector).parents('.contentbox').height() - 10;				

			var chartOption = {
				type: 'column',
				animation: false,
				renderTo: selector,
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

			$(selector)[0].highchart = new Highcharts.Chart(op1);
		}, 250);

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

			// console.log(objSeries)

			series.push(objSeries);
		});

		// console.log(data, series)
		setTimeout(function() {
			options = {}
			options.width = $(selector).width();
			options.height = $(selector).parents('.contentbox').height() - 10;

			var chartOption = {
				type: 'line',
				animation: false,
				renderTo: selector,
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

			$(selector)[0].highchart = new Highcharts.Chart(c1);


		}, 250)

	}

	function pie(selector, data) {

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

		setTimeout(function() {
			options = {}
			options.width = $(selector).width();
			options.height = $(selector).parents('.contentbox').height() - 10;

			var chartOption = {
				type: 'pie',
				animation: false,
				renderTo: selector,
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

			$(selector)[0].highchart = new Highcharts.Chart(c1);
		}, 250);
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
(function() {

	// var injectorExtension = angular.injector(['app.extension']);
	// var serviceExtension = injectorExtension.get('serviceExtension');

	var injectorDashboard = angular.injector(['logpresso.extension.dashboard']);
	var serviceDashboard = injectorDashboard.get('serviceDashboard');

	serviceDashboard.addAssetType({
		name: 'Time Series',
		id: 'timeseries',
		event: {
			onNextStep: function() {
				serviceDashboard.closeWizard();
				$('.mdlTimeSeriesWizard query-input')[0].setPristine();
				$('.mdlTimeSeriesWizard')[0].showDialog();
			}
		},
		validator: function(ctx) {
			
			return true;
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

	var HcLine = (function($, Hz) {

		var initiative = {
				chart: {
					type: 'bar'
				},
				xAxis: {
					title: {}
				},
				yAxis: {
					title: {}
				}
		};

		function LineChart(options) {
			this.options = $.extend({
				el: 'body',
				series: [{
					data: []
				}]
			}, options);

			if(this.options.timeSeries) {
				initiative.series = this.options.series;

				initiative.xAxis.type = 'datetime';
				initiative.yAxis.type = 'linear';

				initiative.xAxis.title.text = '시간';
			}
			else {

				this.options = $.extend({
					xAxis: {
						'type': 'linear'
					},
					yAxis: {
						'type': 'linear'
					}
				}, this.options);

				initiative.series = this.options.series;
				initiative.xAxis.type = this.options.xAxis.type;
				initiative.yAxis.type = this.options.yAxis.type;

				initiative.xAxis.title.text = this.options.xAxis.key;
				initiative.yAxis.title.text = this.options.yAxis.key;
			}
		}

		LineChart.prototype.render = function() {
			$(this.options.el).highcharts(initiative);
			this.hc = $(this.options.el).highcharts();
			this.hc.series.getSeriesByName = function(name) {
				return this.filter(function(s) {
					return s.name === name;
				});
			}
		}

		LineChart.prototype.manipulate = function(seriesData) {
			var self = this;
			if(this.options.xAxis.type === 'datetime') {
				return seriesData.map(function(o) { 
					return {
						x: ParseTimeWithTimezone(o[self.options.xAxis.key]),
						y: o[self.options.yAxis.key]
					}
				});	
			}
			else if(this.options.xAxis.type === 'number') {
				return seriesData.map(function(o) { 
					return {
						x: o[self.options.xAxis.key],
						y: o[self.options.yAxis.key]
					}
				});	
			}
			else if(this.options.xAxis.type === 'string') {
				return seriesData.map(function(o) { 
					return {
						name: o[self.options.xAxis.key],
						y: o[self.options.yAxis.key]
					}
				});	
			}
		}

		LineChart.prototype.manipulateForTimeSeries = function(seriesData) {
			var series = {};
			seriesData.forEach(function(data) {

				Object.keys(data).forEach(function(key) {
					if(!series.hasOwnProperty(key)) {
						if(key === '_time') return;
						series[key] = [{
							x: ParseTimeWithTimezone(data['_time']),
							y: data[key]
						}];
					}
					else {
						series[key].push({
							x: ParseTimeWithTimezone(data['_time']),
							y: data[key]
						});
					}
				});
			});

			for(var s in series) {
				var found = this.hc.series.getSeriesByName(s);
				if( !found.length ) {
					this.hc.addSeries({
						name: s,
						data: series[s]
					});	
				} else {
					found[0].setData(series[s], true, true);
				}
			}
			// console.log(this.hc.series)
		}

		LineChart.prototype.isAcceptable = function(seriesData) {
			if(this.options.timeSeries) {
				if((Object.prototype.toString.call(seriesData) === '[object Array]') && Object.prototype.toString.call(seriesData[0]) === '[object Object]') {
					return !!~Object.keys(seriesData[0]).indexOf('_time');
				}
			}
			return false;
		}

		LineChart.prototype.updateSeries = function(seriesData, idx) {
			if(this.options.timeSeries) {
				var s = this.manipulateForTimeSeries(seriesData);
			}
			else {
				if(idx === undefined) idx = 0;
				var s = this.manipulate(seriesData);
				this.hc.series[idx].setData(s, true, true);
			}
			
		}

		return LineChart;

	})(jQuery, Highcharts);


	var HcBar = (function($, Hz) {

	})(jQuery, Highcharts);

	var shared = {};

	function TimeSeriesWizardController($scope) {
		$scope.queryString = '';
		$scope.queryResult;
		$scope.numPageSize = 20;

		$scope.getPid = 123;

		$scope.onHead = function(helper) {
			console.log('onHead', helper)
			helper.getResult(function(m) {
				console.log(m);

				if($scope.optionResultCursor === 'head') {
					$scope.modelTable = m.body.result;
					$scope.$apply();
				}
			});
		}

		$scope.onTail = function(helper) {
			console.log('onTail', helper)
			helper.getResult(function(m) {
				console.log(m);

				if($scope.optionResultCursor === 'tail') {
					$scope.modelTable = m.body.result;
					$scope.$apply();
				}
			});
		}

		$scope.optionResultCursor = 'head';

		$scope.modelTable = [];

		$scope.onNextQuery = function() {
			if( !~$scope.modelTable.cols.indexOf('_time') ) {
				notify('danger', '시간 단위 컬럼이 하나도 없는데요?' , true)
			}
			else {
				$('.mdlTimeSeriesWizard')[0].hideDialog();
				$('.mdlTimeSeriesManipulateWizard')[0].showDialog();
				shared.setModelTable($scope.modelTable);	
			}
		}
	}

	function TimeSeriesManipulateController($scope, serviceChart, serviceUtility) {
		$scope.modelTable = [];

		function isNumber(field) {
			return this.every(function(o) {
				return Object.prototype.toString.call(o[field]) === "[object Number]";
			});
		}

		function isDateTime(field) {
			return this.every(function(o) {
				return /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}\+\d{4}/.test(o[field]);
			});
		}

		function isString(field) {
			return this.every(function(o) {
				return Object.prototype.toString.call(o[field]) === "[object String]";
			});
		}

		$scope.cols = [];

		$scope.colsNumber = [];
		$scope.colsDateTime = [];
		$scope.colsString = [];

		$scope.selectedNumberColumn;
		$scope.selectedDateTimeColumn;
		$scope.selectedStringColumn;

		shared.setModelTable = function(modelTable) {
			$scope.modelTable = modelTable;

			$scope.colsNumber = modelTable.cols.filter(function(col) {
				return isNumber.call(modelTable, col);
			});

			$scope.colsDateTime = modelTable.cols.filter(function(col) {
				return isDateTime.call(modelTable, col);
			});

			$scope.colsString = modelTable.cols.filter(function(col) {
				return isString.call(modelTable, col);
			});

			$scope.cols = modelTable.cols.map(function(col) {
				return  {
					'is_checked': false,
					'name': col
				}
			});

			var hc = new HcLine({
				el: $('.mdlTimeSeriesManipulateWizard .chart-container'),
				timeSeries: true
			});

			hc.render();
			hc.updateSeries(modelTable);

		}

		$scope.getVVV = function() {

			$('.mdlTimeSeriesManipulateWizard')[0].hideDialog();
			var ctx = {"data": {"series": [{"color": "#AFD8F8", "key": "count", "name": "count"}], "label": "table", "type": "pie", "interval": 23, "query": "logdb count | stats c by table", "labelType": "string"}, "guid": 'w' + serviceUtility.generateType2(), "type": "chart", "interval": 23, "name": "count pie"};
			serviceDashboard.onCreateNewWidgetAndSavePreset(ctx);
		}
	}

	extension.global.addController(TimeSeriesWizardController);
	extension.global.addController(TimeSeriesManipulateController);

})();

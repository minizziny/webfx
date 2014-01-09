function DashboardController($scope, $filter, $element, $translate, eventSender) {
	$scope.getPid = eventSender.dashboard.pid;
	eventSender.dashboard.$event.on('unload', function() {
		console.log('--- unload 2 dashboard!');
		var widgets = angular.element($element.find('widget'));
		for(var i = 0; i < widgets.length; i++) {
			console.log( angular.element( widgets[i] ).scope() );

			angular.element( widgets[i] )[0].$dispose();

		}
		
	})

	$scope.openNewWidget = function() {
		eventSender.dashboard.onOpenNewWidget();
	}

	$scope.formSecond = {
		'0': $translate('$S_str_Seconds'),
		'one': $translate('$S_str_Second'),
		'other': $translate('$S_str_Seconds')
	}

	$scope.numCurrentPage = 0;
	$scope.numPagerPagesize = 100;

	$scope.onRemoveWidget = function(guid) {
		eventSender.dashboard.onRemoveSingleWidget(guid);
	}
}

function PresetController($scope, $compile, $filter, $translate, socket, eventSender, serviceUtility) {
	eventSender.dashboard.onCurrentPresetChanged = function() {
		console.log('currentPreset changed')

		console.log($scope.currentPreset);
		return SavePreset($scope.currentPreset.guid, $scope.currentPreset.name, $scope.currentPreset.state);
	}

	eventSender.dashboard.onRemoveSingleWidget = function(guid) {
		console.log('onRemoveSingleWidget', guid);
		var el = angular.element('.k-d-col[dock-id=' + guid + ']');
		el[0].obj.close();

		var widgets = $scope.currentPreset.state.widgets;
		for (var i = widgets.length - 1; i >= 0; i--) {
			if(widgets[i].guid == guid) {
				widgets.splice(i, 1);
				break;
			}
		};

		// eventSender.dashboard.onCurrentPresetChanged(); // save state
	}

	eventSender.dashboard.onCreateNewWidgetAndSavePreset = function(ctx) {
		// no exist widgets array
		if(!$scope.currentPreset.state.widgets) {
			$scope.currentPreset.state["widgets"] = [];
		}

		$scope.currentPreset.state.widgets.push(ctx);

		
		var newbie = layoutEngine.ui.layout.box.create({
			'w': 100,
			'guid': ctx.guid
		});

		var newdiv = $('<div class="newbie"></div>').appendTo('body');
		
		newbie.on('splitInsert', function() {
			newdiv.remove();
		});
		newbie.resizerH.hide();

		newbie.appendTo(newdiv, true);

		eventSender.dashboard.onCreateNewWidget(ctx);

		// eventSender.dashboard.onCurrentPresetChanged(); // save state
	}

	eventSender.dashboard.onCreateNewWidget = function(ctx) {
		var el = angular.element('.k-d-col[dock-id=' + ctx.guid + ']');

		var widget = angular.element('<widget ng-pid="getPid" guid="' + ctx.guid + '" on-remove="onRemoveWidget(\'' + ctx.guid + '\')"></widget>');
		$compile(widget)($scope);
		widget[0].setContext(ctx);

		widget.appendTo(el.find('.contentbox'));
	}

	$scope.dataPresetList = [];
	$scope.currentPreset;

	function GetPresetList(callback) {
		socket.send('org.logpresso.core.msgbus.WallPlugin.getPresetNames', {}, eventSender.dashboard.pid)
		.success(function(m) {
			console.log(m.body)

			var presets = m.body.presets;
			$scope.dataPresetList.splice(0, $scope.dataPresetList.length);

			for (var i = 0; i < presets.length; i++) {
				$scope.dataPresetList.push(presets[i]);
			};

			if(!!callback) {
				callback();
			}
		})
		.failed(msgbusFailed);
	}

	function SavePreset(guid, name, state) {
		var isExist = false;
		for (var i = $scope.dataPresetList.length - 1; i >= 0; i--) {
			if($scope.dataPresetList[i].guid == guid) {
				isExist = true;
				break;
			}
		};

		if(!isExist) {
			$scope.dataPresetList.push({
				'guid': guid,
				'name': name
			});
		}

		delete state.layout; // <-----------------

		return socket.send("org.logpresso.core.msgbus.WallPlugin.setPreset", 
			{ 'guid': guid, 'name': name, 'state': state }
		, eventSender.dashboard.pid);
	}

	function InitAutosave() {
		return socket.send("org.logpresso.core.msgbus.WallPlugin.setPreset", 
			{ "guid": "autosave", "name": $translate('$S_str_Autosave'), "state": { "widgets": [] } }
		, eventSender.dashboard.pid);
	}

	function ClearPreset() {
		$('div.board > widget').each(function(i, obj) {

			obj.$dispose();

		});

		$('.dockpanel').empty();
	}

	function LoadPreset(guid) {

		socket.send('org.logpresso.core.msgbus.WallPlugin.getPreset',
			{ 'guid': guid }
		, eventSender.dashboard.pid)
		.success(function(m) {
			console.log(m.body.preset)
			if(!m.body.preset.state.layout) {
				var widgets = m.body.preset.state.widgets;
				m.body.preset.state.layout = layoutEngine.ui.layout.autoLayout(widgets);
			}
			
			
			$scope.currentPreset = m.body.preset;

			ClearPreset();

			var layout = m.body.preset.state.layout;
			function getRoot(resizable) {
				// console.warn('getRoot')
				// console.log(resizable);
				// console.trace()

				
				if(!!layoutEngine.ui.layout.box.root) {
					console.log( layoutEngine.ui.layout.box.root.getObject() ) ;
				}
				if(typeof resizable == 'object') {

					var curr = resizable.el;
					var effsp;
					if(curr.hasClass('k-d-col')) {
						effsp = curr.prevAll('.k-d-col:first');
						effsn = curr.nextAll('.k-d-col:first');
					}
					else {
						effsp = curr.prevAll('.k-d-row:first');
						effsn = curr.nextAll('.k-d-row:first');
					}
					// console.log(curr.hasClass('k-d-col'), curr.hasClass('k-d-row')) //  이거에 따라서 .nextAll('.k-d-row:first') 할거냐 .nextAll('.k-d-col:first') 할거냐 정하면 될듯!!
					// var effsp = curr.prev();
					// var effsn = curr.next();

					function resizeCharts(i, widget) {
						if(!!$(widget).highcharts) {
							if(!!$(widget).highcharts()) {
								var parent = $(widget).parents('.contentbox');
								$(widget).highcharts().setSize(parent.width(), parent.height() - 10, false);
							}
						}
					}

					curr.find('.widget').each(resizeCharts);
					effsn.find('.widget').each(resizeCharts);
					effsp.find('.widget').each(resizeCharts);
				}
			}

			var boxe = new CustomEvent(layoutEngine.ui.layout.box.event);
			boxe.on('modify', debounce(getRoot, 200));
			boxe.on('resize', getRoot);

			var box = layoutEngine.ui.layout.box.create(layout, true);
			box.appendTo(".dockpanel");


			var widgets = m.body.preset.state.widgets;
			for (var i = 0; i < widgets.length; i++) {
				
				eventSender.dashboard.onCreateNewWidget(widgets[i]);

			};


			$scope.$apply();
		})
		.failed(msgbusFailed);
	}

	function RemovePresets() {
		var args = Array.prototype.slice.call(arguments, 0);

		for (var i = $scope.dataPresetList.length - 1; i >= 0; i--) {
			for (var j = args.length - 1; j >= 0; j--) {
				if($scope.dataPresetList[i].guid == args[j]) {
					$scope.dataPresetList.splice(i, 1);
				}
			};
		};

		return socket.send("org.logpresso.core.msgbus.WallPlugin.removePresets", 
			{ "guids": args }
		, eventSender.dashboard.pid);
	}

	$scope.SaveAs = function() {
		var newname = prompt($translate('$S_msg_SavePresetAs'));
		if(newname == undefined) return;

		var newguid = serviceUtility.generateType2();
		SavePreset(newguid, newname, $scope.currentPreset.state).success(function() {
			LoadPreset(newguid);
		})
	}

	$scope.New = function() {
		var newname = prompt($translate('$S_msg_NewPresetName'));
		if(newname == undefined) return;

		var newguid = serviceUtility.generateType2();
		SavePreset(newguid, newname, { "widgets": [] }).success(function() {
			LoadPreset(newguid);
		})
	}

	$scope.AlertRemove = function() {
		$('.removePreset')[0].showDialog();
	}

	$scope.CancelRemove = function() {
		$('.removePreset')[0].hideDialog();
	}

	$scope.Remove = function() {
		RemovePresets($scope.currentPreset.guid).success(function() {
			LoadPreset('autosave');
			$('.removePreset')[0].hideDialog();
		});
	}

	$scope.AlertClear = function() {
		$('.clearWidgets')[0].showDialog();
	}

	$scope.CancelClear = function() {
		$('.clearWidgets')[0].hideDialog();
	}

	$scope.Clear = function() {
		ClearPreset();
		SavePreset($scope.currentPreset.guid, $scope.currentPreset.name, { "widgets": [] }).success(function() {
			$('.clearWidgets')[0].hideDialog();
		})
	}

	$scope.Load = function(preset) {
		console.log(preset)
		LoadPreset(preset.guid);
	}

	function Init() {

		GetPresetList(function() {
			for (var i = $scope.dataPresetList.length - 1; i >= 0; i--) {
				if($scope.dataPresetList[i].guid == "autosave") {
					$scope.currentPreset = $scope.dataPresetList[i];
					LoadPreset($scope.dataPresetList[i].guid);
					break;
				}
			};

			if($scope.currentPreset == undefined) {
				console.log("InitAutosave");
				InitAutosave().success(Init);
			}

			$scope.$apply();
		});

	}

	Init();
	//RemovePresets('autosave')
}


function SelectColumnController($scope, $filter, $translate, eventSender) {
	$scope.dataCustomColumn;
	$scope.dataCustomColumnTypes = [
		{
			name: 'number',
			displayName: $translate('$S_str_Number')
		},
		{
			name: 'datetime',
			displayName: $translate('$S_str_DateTime')
		},
		{
			name: 'string',
			displayName: $translate('$S_str_String')
		}
	];
	$scope.selectedCustomColumnType = $scope.dataCustomColumnTypes[0];
	$scope.addCustomColumn = function() {
		$('.qr2.qr-selectable')[0].addColumn($scope.dataCustomColumn, $scope.selectedCustomColumnType.name);	
		$scope.dataCustomColumn = '';
	}

	eventSender.dashboard.onSelectColumnFinishing = function() {

		// 바인딩하기 전, 선택한 컬럼이 차트 타입에 대하여 유효한지 검증합니다.

		var required = $scope.chartType.required;
		var one = $scope.chartType.one;
		var selected = $('.qr2.qr-selectable')[0].getSelectedItems();

		var satisfy_one = true, satisfy_requirement = true;

		if(angular.isArray(required)) {
			satisfy_requirement = required.every(function(cond) {
				return selected.some(function(item) {
					return item.type == cond;
				})
			});
		}

		if(angular.isArray(one)) {
			satisfy_one = one.every(function(cond) {
				return selected.filter(function(item) {
					return item.type == cond;
				}).length == 1;
			});
		}
		
		if(!(satisfy_requirement && satisfy_one)) {
			$('.check-col-info').fadeIn();
			$('.check-col-info span').text($scope.chartType.invalid_msg);
		}
		else {
			$('.check-col-info').hide();
		}

		return satisfy_requirement && satisfy_one;
	}

	eventSender.dashboard.onSelectColumnFinished = function(fn) {
		// 바인딩 화면에 컬럼 정보를 넘겨줍니다.
		$('.qr2.qr-selectable')[0].getColumns(function(cols) {
			fn.call($scope, {
				'cols': cols,
				'result': $scope.qresult
			});
		});
	}
}

function ChartBindingController($scope, $filter, $translate, eventSender, serviceUtility, serviceChart) {
	var number_of_index = 0;

	function getDefaultSeries() {
		number_of_index++;
		return {
			'name': $translate('$S_str_Series') + number_of_index,
			'guid': serviceUtility.generateType2(),
			'value': undefined,
			'color': color_map[number_of_index-1]
		}
	}

	// $scope.qrTmpl = '<table ng-class="{ selectable: isSelectable }" class="cmpqr table table-striped table-condensed-custom">' +
	// 		'<thead><tr><th ng-class="{ selected: col.is_checked }" ng-style="{ backgroundColor: col.color }" ng-hide="!col.is_visible" ng-repeat="col in qrCols" after-iterate="columnChanged" ng-click="toggleCheck(col)">' +
	// 		'<input id="{{col.guid}}" ng-show="isSelectable" type="checkbox" ng-model="col.is_checked" style="margin-right: 5px">' +
	// 		'<span class="qr-th-type" ng-show="col.type == \'number\'">1</span><span class="qr-th-type" ng-show="col.type == \'string\'">A</span><span class="qr-th-type" ng-show="col.type == \'datetime\'"><i class="icon-white icon-time"></i></span>' + 
	// 		' {{col.name}} </th></tr></thead>' + 
	// 		'<tbody><tr ng-repeat="d in qrData"><td ng-class="{ selected: col.is_checked }" ng-style="{ backgroundColor: col.color }"" ng-hide="!col.is_visible" ng-repeat="col in qrCols" ng-click="toggleCheck(col)">{{d[col.name]}}</td></tr></tbody></table>',

	$scope.dataSeries = [];
	$scope.dataLabel;
	$scope.selectedSeriesIdx = 0;
	$scope.dataNumberTypeCols = [];
	$scope.dataNumberDatetimeTypeCols = [];

	$scope.$watch('dataLabel', function() {
		console.log('dataLabel changed');
		var series = [];
		$scope.dataSeries.forEach(function(obj, i) {
			series.push({
				'key': obj.value.name,
				'color': obj.color,
				'name': obj.name
			})
		});
		var st = serviceChart.buildJSONStructure(series, $scope.qresult, $scope.dataLabel);
		render(st);
	});

	$scope.$watch('dataSeries', function() {
		var ignore_render = false;
		
		// for (var i = $scope.qrCols.length - 1; i >= 0; i--) {
		// 	$scope.qrCols[i].color = undefined;
		// 	$scope.qrCols[i].is_checked = false;
		// };
		for (var i = $scope.dataSeries.length - 1; i >= 0; i--) {
			var rgb = d3.rgb($scope.dataSeries[i].color);
			if($scope.dataSeries[i].value == undefined) {
				ignore_render = true;
			}
			else {
				$scope.dataSeries[i].value.color = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',' + '.3)';	
			}
			
		};

		if(!ignore_render) {

			console.log('dataSeries changed', $scope.dataSeries);
			var series = [];
			$scope.dataSeries.forEach(function(obj, i) {
				series.push({
					'key': obj.value.name,
					'color': obj.color,
					'name': obj.name
				})
			});
			var st = serviceChart.buildJSONStructure(series, $scope.qresult, $scope.dataLabel);
			render(st);

		}
	}, true);

	$scope.$watch('chartType', function() {

	});

	function render(st) {
		//console.log($scope.chartType)

		if($scope.chartType.name == 'bar') {
			serviceChart.multiBarHorizontalChart('div.charthere', st);	
		}
		else if($scope.chartType.name == 'line') {
			serviceChart.lineChart('div.charthere', st);
		}
		else if($scope.chartType.name == 'pie') {
			serviceChart.pie('div.charthere', st);
		}
		
	}

	$scope.qrCols;
	eventSender.dashboard.onChartBindingStarting = function() {
		console.log('onChartBindingStarting')
		// 이전 단계에서 선택된 항목의 정보를 전달해준다
		eventSender.dashboard.onSelectColumnFinished(function(sender) {

			$scope.qresult = null;
			$scope.qresult = sender.result;

			var qrOrder = sender.cols;
			$(".qr2.qr-selected")[0].getColumns(function(cols) {
				$scope.qrCols = cols;

				console.log('zzz', qrOrder, $scope.qrCols, sender)

				// qrOrder가 더 많을 경우 $scope.qrCols 에 추가한다 (사용자 정의 컬럼)
				if(qrOrder.length > $scope.qrCols.length) {
					var qrOrderTargetName = $scope.qrCols.map(function(o) { return o.name; });

					var newOrders = qrOrder.filter(function(o) {
						return !(qrOrderTargetName.indexOf(o.name) > -1);
					});

					for (var i = 0; i < newOrders.length; i++) {
						$scope.qrCols.push(newOrders[i]);
					};
				}

				// $scope.qrCols 똑같이 체크 표시
				for (var i = qrOrder.length - 1; i >= 0; i--) {
					if(qrOrder[i].is_checked) {
						$scope.qrCols[i].is_checked = true;
					}
				};
				init();

			});

		});
		
	}

	function init() {
		// 초기화
		$scope.dataSeries.splice(0, $scope.dataSeries.length);
		$scope.dataNumberTypeCols.splice(0, $scope.dataNumberTypeCols.length);
		$scope.dataNumberDatetimeTypeCols.splice(0, $scope.dataNumberDatetimeTypeCols.length);
		$scope.dataLabel = undefined;
		$scope.selectedSeriesIdx = 0;	
		number_of_index = 0;

		var cols = $scope.qrCols;
		for (var i = 0; i < cols.length; i++) {
			// number type 만 따로 뽑아냄
			if(cols[i]['type'] == "number") {
				$scope.dataNumberTypeCols.push(cols[i]);
				$scope.dataNumberDatetimeTypeCols.push(cols[i]);
			}

			if(cols[i]['type'] == "datetime") {
				$scope.dataNumberDatetimeTypeCols.push(cols[i]);
			}
		}

		// 선택한 컬럼만 뽑아냄
		var selectedCols = cols.filter(function(obj) {
			if(obj.is_checked) return obj;
		});

		var types = [];
		for (var i = 0; i < selectedCols.length; i++) {

			// 선택한 컬럼의 타입 추가
			var type = selectedCols[i].type;
			types.push(type);

			// [ name ] selectedCols 의 number type 컬럼 수대로 series 추가
			if(type == "number") {
				var series = $scope.addSeries();
				series.name = selectedCols[i].name;
				series.value = selectedCols[i];
				/*
				var color = d3.rgb(series.color);
				selectedCols[i].color = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',.5)';
				*/
			}
		};

		var idxDatetime = types.indexOf('datetime');
		var idxString = types.indexOf('string');
		var idxNumber = types.indexOf('number');


		if($scope.chartType.name == "bar" || $scope.chartType.name == "pie") {
			// [ datetime ] 첫번째 datetime type 컬럼을 dataLabel로 지정
			if(idxDatetime != -1) {
				$scope.dataLabel = selectedCols[idxDatetime];
			}
			
			// [ string ] dataLabel 미지정시 첫번째 string type 컬럼을 dataLabel로 지정
			if(idxString != -1 && $scope.dataLabel == undefined) {
				$scope.dataLabel = selectedCols[idxString];
			}

			// 다 돌아봤는데 Label로 쓸만한게 없으면...
			if($scope.dataLabel == undefined) {
				$scope.dataLabel = selectedCols[idxNumber];
			}
		}
		else if($scope.chartType.name == "line") {
			// [ datetime ] 첫번째 datetime type 컬럼을 dataLabel로 지정
			if(idxDatetime != -1) {
				$scope.dataLabel = selectedCols[idxDatetime];
			}

			if($scope.dataLabel == undefined) {
				$scope.dataLabel = selectedCols[idxNumber];
			}
		}

	}

	$scope.addSeries = function() {
		var series = getDefaultSeries('grid')
		$scope.dataSeries.push(series);
		$scope.selectSeries($scope.dataSeries.indexOf(series));
		return series;
	}

	$scope.selectSeries = function(i) {
		$scope.selectedSeriesIdx = i;
	}

	$scope.removeSeries = function(i) {
		if($scope.dataSeries.length == 1) return;

		$scope.dataSeries.splice(i, 1);
		if(i - 1 < 0) {
			$scope.selectedSeriesIdx = i + 1;
		}
		else {
			$scope.selectedSeriesIdx = i - 1;
		}
		
	}

	function checkArrayMemberType(array) {
		var types = ['number', 'datetime', 'string'];
		if(array.every(angular.isNumber)) return types[0];
		if(array.every(checkDate)) return types[1];

		return types[2];
	}

	eventSender.dashboard.onSendChartDataWizard = function() {
		console.log('onSendChartDataWizard');

		return {
			'series': $scope.dataSeries,
			'label': $scope.dataLabel,
			'type': $scope.chartType.name
		}
	}

}

function NewWidgetWizardController($scope, $filter, $translate, eventSender, serviceUtility) {
	var dataChart;
	
	function getDefaultContext(type) {
		if(type == "grid") {
			return {
				'name': '',
				'guid': serviceUtility.generateType2(),
				'interval': 15,
				'type': 'grid',
				'data': {
					'order': undefined,
					'query': ''
				}
			}
		}
		else if(type == "chart") {
			return {
				'name': '',
				'guid': serviceUtility.generateType2(),
				'interval': 15,
				'type': 'chart',
				'data': {
					'label': undefined,
					'series': undefined,
					'query': ''
				}
			}
		}
	}

	function makeRemoveClassHandler(regex) {
		return function (index, classes) {
			return classes.split(/\s+/).filter(function (el) {return regex.test(el);}).join(' ');
		}
	}

	eventSender.dashboard.onOpenNewWidget = function() {
		var newWidgetWin = $('.newWidget').removeClass(makeRemoveClassHandler(/^step/));
		newWidgetWin[0].showDialog();
			
		$scope.go(0);
		$('.wiz-next.btn:first').focus();
		//$scope.ctxWidget = getDefaultContext('grid');
		$scope.qresult = null;
	}

	$scope.qresult;
	$scope.qrCols;

	$scope.inputOnloading = function() {
		$('.qr1')[0].hideTable();
		$('.qr1')[0].newSearch();
	}

	$scope.inputOnpageloaded = function(m) {
		$('.qr2.qr-select-table')[0].getColumns(function(cols) {
			$scope.qrCols = cols;
			$('.qr1')[0].showTable();
		});
		
	}

	$scope.inputOnloaded = function() {
		$('.wiz-next.btn:eq(1)').focus();
	}

	var wtypes = [
		{
			'name': 'table',
			's0next': 1,
			's0nextCallback': function() {
				$scope.ctxWidget = getDefaultContext('grid');
				$('.qr1')[0].hideTable();
				setTimeout(function() {
					$('query-input textarea').focus();	
				}, 250);
				
			},
			's1next': 2,
			's3prev': 2
		},
		{
			'name': 'graph',
			's0next': 1,
			's0nextCallback': function() {
				$scope.ctxWidget = getDefaultContext('chart');
				$('.qr1')[0].hideTable();
				setTimeout(function() {
					$('query-input textarea').focus();	
				}, 250);
			},
			's1next': 4,
			's4nextEvent': function() {
				return eventSender.dashboard.onSelectColumnFinishing;
			},
			's4nextCallback': function() {
				return eventSender.dashboard.onChartBindingStarting;
			},
			's5nextCallback': function() {
				dataChart = eventSender.dashboard.onSendChartDataWizard();
				return;
			},
			's3prev': 5
		}
	];
	$scope.widgetType = wtypes[1];
	$scope.widgetTypeName = "graph";
	
	$scope.selectType = function(i) {
		$scope.widgetType = wtypes[i];
	}

	$scope.ctxWidget;

	$scope.go = function(page, callback, event) {
		window.scrollTo(0, 0);

		if(event !== undefined) {
			if(!event()) {
				return;
			}
		}

		//console.log('go' + page);
		var el = $('.wizard li.wiz-step').removeClass('active')[page];
		$(el).addClass('active');
		$('.newWidget')
			.removeClass(makeRemoveClassHandler(/^step/))
			.addClass('step' + page);

		if(!!callback) {
			callback($scope);
		}
	}

	$scope.submit = function() {

		if($scope.widgetType.name == 'table') {
			submitTable();
		}
		else if ($scope.widgetType.name == 'graph') {
			submitGraph();
		}

	}

	function submitTable() {
		var order = $scope.qrCols.filter(function(obj) {
			if(obj.is_visible) return true;
		})
		.map(function(obj) {
			return obj.name;
		});
		$scope.ctxWidget.data.order = order;

		console.log($scope.ctxWidget);

		eventSender.dashboard.onCreateNewWidgetAndSavePreset($scope.ctxWidget);
		$('.newWidget')[0].hideDialog();	
	}

	// chart options
	$scope.ctypes = [
		{
			'name': 'bar',
			'required': ['number'],
			'invalid_msg': $translate('$S_msg_SelectOneMoreNumberType')
		},
		{
			'name': 'line',
			'required': ['number'],
			'invalid_msg': $translate('$S_msg_SelectOneMoreNumberType')
		},
		{
			'name': 'pie',
			'required': ['number'],
			'invalid_msg': $translate('$S_msg_SelectOneMoreNumberType')
		}
	];
	$scope.chartType = $scope.ctypes[0];
	$scope.selectChartType = function(idx) {
		$scope.chartType = $scope.ctypes[idx];
	}

	$scope.moreCol = false;
	$scope.showMoreColOption = function($event) {
		$event.preventDefault();
		$scope.moreCol = true;
	}

	function submitGraph() {

		$scope.ctxWidget.data.label = dataChart.label.name;
		$scope.ctxWidget.data.labelType = dataChart.label.type;
		$scope.ctxWidget.data.series = dataChart.series.map(function(obj) {
			return {
				'color': obj.color,
				'name': obj.name,
				'key': obj.value.name
			}
		});

		$scope.ctxWidget.data.type = dataChart.type;
		console.log($scope.ctxWidget)
		eventSender.dashboard.onCreateNewWidgetAndSavePreset($scope.ctxWidget);
		$('.newWidget')[0].hideDialog();
	}
}
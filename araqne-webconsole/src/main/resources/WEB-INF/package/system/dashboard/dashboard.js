var app = angular.module('dashboard', ['myApp', 'logdb', 'ui.sortable', 'logdb.input', 'util', 'chart']);
var proc;
console.log('dashboard init');

var timer = {};
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
        s : "%d초",
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

var reltimeTable = {};

setInterval(function() {
	for(var prop in reltimeTable) {
		var obj = reltimeTable[prop];
		obj.el.text(obj.lastUpdated.fromNow());
	}
}, 1000);

parent.d3 = d3;

var dateFormat = d3.time.format('%Y-%m-%d %H:%M:%S');
var tooltip = $('<div class="tooltip fade top"><div class="tooltip-arrow"></div><div class="tooltip-inner">...</div></div>').appendTo($('body'));
var color_map = ["#AFD8F8","#F6BD0F","#8BBA00","#FF8E46","#008E8E","#D64646","#8E468E","#588526","#B3AA00","#008ED6","#9D080D","#A186BE","#CC6600","#FDC689","#ABA000","#F26D7D","#FFF200","#0054A6","#F7941C","#CC3300","#006600","#663300","#6DCFF6"];

function checkDate(member, i) {
	if(member == undefined) return false;
	return myApp.isDate(dateFormat.parse(member.toString().substring(0,19)))
}

app.directive('widget', function($compile, serviceLogdb, eventSender, serviceChart) {
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			scope[attrs.guid] = {
				data: [],
				interval: parseInt(attrs.interval)
			};

			function updateTimer(guid, elTimeStamp) {
				reltimeTable[guid] = {
					'el': elTimeStamp,
					'lastUpdated': moment()
				};
			}

			function disposeTimer(guid) {
				delete reltimeTable[guid];
			}

			function getData(qString, onDataLoaded, elRefresh, elPause, elResume) {
				var timer, qInst, isLoaded = false;

				function created(m) {
					isLoaded = false;
					console.log(attrs.type + ' ------------- ', qInst.id());
					scope[attrs.guid].data = [];
				}

				function pageLoaded(m) {
					console.log(attrs.type + ' pageloaded', qInst.id());
					for (var i = 0; i < m.body.result.length; i++) {
						scope[attrs.guid].data.push(m.body.result[i]);
					};

					if(isLoaded) {
						dataLoaded(false);
					}
				}

				function loaded(m) {
					console.log(attrs.type + ' loaded', qInst.id());
					var first_load_length = scope[attrs.guid].data.length;
					
					var amount = Math.max(m.body.total_count, first_load_length);
					if(amount > 15) {
						var total_count = Math.min(m.body.total_count, 1000);

						// load more
						qInst.getResult(first_load_length, total_count - first_load_length, function() {
							dataLoaded(true);
							isLoaded = true;
						});
					}
					else {
						dataLoaded(true);
						isLoaded = true;
					}
				}

				function dataLoaded(removeQuery) {
					if(removeQuery == true) {
						console.log(attrs.type + ' onDataLoaded', qInst.id(), Date.now())	
					}
					else {
						console.warn(attrs.type + ' onDataLoaded', qInst.id(), Date.now());
					}
					
					onDataLoaded({
						dispose: function() {
							disposeTimer(attrs.guid);
							clearTimeout(timer);
							timer = null;
						}
					});

					if(removeQuery) {
						serviceLogdb.remove(qInst);	
						clearTimeout(timer);
						timer = null;
						timer = setTimeout(query, Math.max(5000, scope[attrs.guid].interval * 1000) );
					}
				}

				function failed(m, raw) {
					element.find('.alert-error').show();
					element.find('.alert-error span').text(raw[0].errorCode);
					clearTimeout(timer);
					timer = null;
					timer = setTimeout(query, Math.max(5000, scope[attrs.guid].interval * 1000) );
				}

				function query() {
					qInst = serviceLogdb.create(proc.pid);
					qInst.query(qString)
					.created(created)
					.pageLoaded(pageLoaded)
					.loaded(loaded)
					.failed(failed);
				}

				query();

				elRefresh.on('click', function() {
					clearTimeout(timer);
					timer = null;
					query();
				});

				elPause.on('click', function() {
					console.log('pause')
					clearTimeout(timer);
					timer = null;
					elRefresh.hide();
					elPause.hide();
					elResume.show();
				});

				elResume.on('click', function() {
					console.log('resume')
					query();
					elRefresh.show();
					elPause.show();
					elResume.hide();
				})
			}

			var elWidget = angular.element('<div class="widget"></div>');
			var elCard = angular.element('<div class="card unflipped"></div>');
			var elFront = angular.element('<figure class="front"></figure>');
			var elBack = angular.element('<figure class="back"><button class="close">back</button></figure>');
			var titlebar = angular.element('<div><h5>' + attrs.name + '</h5>' +
				'<h5 class="timestamp"></h5>' +
				'<button style="margin-left: 10px" class="close widget-close">&times;</button>' +
				'<button class="close widget-refresh-pause"><i style="margin-top: 6px; margin-left:10px;" class="icon-pause pull-right"></i></button>' +
				'<button class="close widget-refresh-resume" style="display:none"><i style="margin-top: 6px; margin-left:10px;" class="icon-play pull-right"></i></button>' +
				'<button class="close widget-refresh"><i style="margin-top: 6px; margin-left:10px;" class="icon-refresh pull-right"></i></button>' + 
				'<button class="close widget-property"><i style="margin-top: 6px; margin-left:10px;" class="icon-info-sign pull-right"></i></button></div>' +
				'<div class="alert alert-error clearboth" style="display:none"><b>쿼리를 실행하는데 문제가 있습니다!</b><br><span></span></div>');

			var info = angular.element('<span class="ninput" style="float:left"></span>');
			var ninput = angular.element('<input type="number" min="5" ng-model="' + attrs.guid + '.interval" />');
			var elQueryStr = $('<div class="clearboth">').append($('<pre>').text(decodeURIComponent(attrs.query)));

			elFront.append(titlebar);
			
			elBack.append(info);
			elBack.append(elQueryStr);

			var elTimeStamp = titlebar.find('.timestamp');

			if(attrs.type == 'grid') {

				var table = angular.element('<table class="cmpqr table table-striped table-condensed"><thead><tr><th ng-repeat="col in ' + attrs.fields + '">{{col}}</th></tr></thead>' +
					'<tbody><tr ng-repeat="d in ' + attrs.guid + '.data"><td ng-repeat="col in ' + attrs.fields + '">{{d[col]}}</td></tr></tbody></table>');
				$compile(table)(scope);
				$compile(ninput)(scope);
				elBack.find('span.ninput').append(ninput).append(angular.element('<small style="vertical-align:2px"> 초</small>'));
				elFront.append(angular.element('<div class="cmpqr-cont">').append(table));
				elCard.append(elFront);


				getData(decodeURIComponent(attrs.query), function(self) {

					scope.$apply();

					updateTimer(attrs.guid, elTimeStamp);
					
					elFront.find('button.widget-close').off('click').on('click', function() {
						eventSender.onRemoveSingleWidget(attrs.guid);
						self.dispose();
						element.remove();
					});

					element[0].$dispose = function() {
						self.dispose();
						element.remove();
					}; 

				}, 
				elFront.find('button.widget-refresh'),
				elFront.find('button.widget-refresh-pause'),
				elFront.find('button.widget-refresh-resume'));
			}
			else if (attrs.type == 'chart.bar' || attrs.type == 'chart.line' || attrs.type == 'chart.pie') { 

				var svg = angular.element('<svg class="widget">');
				$compile(ninput)(scope);
				elBack.find('span.ninput').append(ninput).append(angular.element('<small style="vertical-align:2px"> 초</small>'));
				elFront.append(svg);
				elCard.append(elFront);


				getData(decodeURIComponent(attrs.query), function(self) {

					var dataResult = scope[attrs.guid].data;
					var dataSeries = serviceChart.getDataSeries(attrs.series);
					var dataLabel = {name: attrs.label, type: attrs.labeltype};

					var json = serviceChart.buildJSONStructure(dataSeries, dataResult, dataLabel);
					if(attrs.type == 'chart.line') {
						serviceChart.lineChart(svg[0], json);
					}
					else if(attrs.type == 'chart.bar') {
						serviceChart.multiBarHorizontalChart(svg[0], json);
					}
					else if(attrs.type == 'chart.pie') {
						serviceChart.pie(svg[0], json);
					}

					updateTimer(attrs.guid, elTimeStamp);

					elFront.find('button.widget-close').off('click').on('click', function() {
						eventSender.onRemoveSingleWidget(attrs.guid);
						self.dispose();
						element.remove();
					});

					element[0].$dispose = function() {
						self.dispose();
						element.remove();
					};

				},
				elFront.find('button.widget-refresh'),
				elFront.find('button.widget-refresh-pause'),
				elFront.find('button.widget-refresh-resume'));
			}

			elCard.append(elBack);
			elWidget.append(elCard);
			element.append(elWidget);

			elFront.find('button.widget-close').off('click').on('click', function() {
				eventSender.onRemoveSingleWidget(attrs.guid);
				element.remove();
			});

			element[0].$dispose = function() {
				element.remove();
			};

			elFront.find('button.widget-property').on('click', function() {
				elCard.addClass('flipped').removeClass('unflipped');
			});

			elBack.find('button.close').on('click', function() {
				elCard.removeClass('flipped')
				setTimeout(function() {
					elCard.addClass('unflipped');
				}, 500);
			});

			scope.$watch(attrs.guid + '.interval', function() {
				console.log('interval updated')
			})
			
		}
	}
})

app.factory('eventSender', function() {
	var e = {
		onCreateNewWidget: null,
		onCreateNewWidgetAndSavePreset: null,
		onOpenNewWidget: null,
		onCurrentPresetChanged: null,
		onRemoveSingleWidget: null,
		onLabelLayoutUpdate: null,
		onSendChartDataWizard: null,
		onSelectColumnFinished: null,
		onSelectColumnFinishing: null,
		onChartBindingStarting: null
	}
	return e;
});

function Controller($scope, serviceSession, serviceTask, eventSender) {

	$scope.logout = serviceSession.logout;
	proc = serviceTask.newProcess('dashboard');

	$scope.openNewWidget = function() {
		eventSender.onOpenNewWidget();
	}

}

function PresetController($scope, $compile, socket, eventSender, serviceGuid) {
	eventSender.onCurrentPresetChanged = function() {
		console.log('currentPreset changed')

		console.log($scope.currentPreset);
		return SavePreset($scope.currentPreset.guid, $scope.currentPreset.name, $scope.currentPreset.state);
	}

	eventSender.onRemoveSingleWidget = function(guid) {
		console.log('onRemoveSingleWidget', guid);

		var widgets = $scope.currentPreset.state.widgets;
		for (var i = widgets.length - 1; i >= 0; i--) {
			if(widgets[i].guid == guid) {
				widgets.splice(i, 1);
				break;
			}
		};

		eventSender.onCurrentPresetChanged(); // save state
	}

	eventSender.onCreateNewWidgetAndSavePreset = function(ctx) {
		// no exist widgets array
		if(!$scope.currentPreset.state.widgets) {
			$scope.currentPreset.state["widgets"] = [];
		}

		$scope.currentPreset.state.widgets.push(ctx);
		eventSender.onCreateNewWidget(ctx);

		eventSender.onCurrentPresetChanged(); // save state
	}

	eventSender.onCreateNewWidget = function(ctx) {
		if(ctx.type == 'grid') {
			var orderstr = "['" + ctx.data.order.join("','") + "']";
			var query = encodeURIComponent(ctx.data.query);
			var widget = angular.element('<widget guid="' + ctx.guid + '" name="' + ctx.name + '" type="' + ctx.type + '" interval="' + ctx.interval + '" query="' + query + '" fields="' + orderstr + '" >');
			$compile(widget)($scope);
			$('.board').append(widget);
		}
		else if(ctx.type == 'chart') {
			if(ctx.data.type == 'bar' || ctx.data.type == 'line' || ctx.data.type == 'pie') {
				var query = encodeURIComponent(ctx.data.query);
				var series = encodeURIComponent(JSON.stringify(ctx.data.series));
				var widget = angular.element('<widget guid="' + ctx.guid + '" name="' + ctx.name + '" type="' + ctx.type + '.' + ctx.data.type + '" interval="' + ctx.interval + '" query="' + query + '" series="' + series + '" label="' + ctx.data.label + '" labeltype="' + ctx.data.labelType + '">');
				$compile(widget)($scope);
				$('.board').append(widget);
			}
		}

	}

	$scope.dataPresetList = [];
	$scope.currentPreset;

	function GetPresetList(callback) {
		socket.send('org.logpresso.core.msgbus.WallPlugin.getPresetNames', {}, proc.pid)
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

		return socket.send("org.logpresso.core.msgbus.WallPlugin.setPreset", 
			{ 'guid': guid, 'name': name, 'state': state }
		, proc.pid);
	}

	function InitAutosave() {
		return socket.send("org.logpresso.core.msgbus.WallPlugin.setPreset", 
			{ "guid": "autosave", "name": "자동 저장", "state": { "widgets": [] } }
		, proc.pid);
	}

	function ClearPreset() {
		$('div.board > widget').each(function(i, obj) {

			obj.$dispose();

		})
	}

	function LoadPreset(guid) {

		socket.send('org.logpresso.core.msgbus.WallPlugin.getPreset',
			{ 'guid': guid }
		, proc.pid)
		.success(function(m) {
			console.log(m.body.preset.state)
			$scope.currentPreset = m.body.preset;

			ClearPreset();


			var widgets = m.body.preset.state.widgets;
			for (var i = 0; i < widgets.length; i++) {
				
				eventSender.onCreateNewWidget(widgets[i]);

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
		, proc.pid);
	}

	$scope.SaveAs = function() {
		var newname = prompt('저장할 새 프리셋 이름을 입력하세요');
		if(newname == undefined) return;

		var newguid = serviceGuid.generateType2();
		SavePreset(newguid, newname, $scope.currentPreset.state).success(function() {
			LoadPreset(newguid);
		})
	}

	$scope.New = function() {
		var newname = prompt('새 프리셋 이름을 입력하세요');
		if(newname == undefined) return;

		var newguid = serviceGuid.generateType2();
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

function SelectColumnController($scope, eventSender) {
	$scope.dataCustomColumn;
	$scope.dataCustomColumnTypes = [
		{
			name: 'number',
			displayName: '숫자'
		},
		{
			name: 'datetime',
			displayName: '날짜'
		},
		{
			name: 'string',
			displayName: '문자열'
		}
	];
	$scope.selectedCustomColumnType = $scope.dataCustomColumnTypes[0];
	$scope.addCustomColumn = function() {

		$scope.qrCols.push({
			'name': $scope.dataCustomColumn,
			'is_visible': true,
			'is_checked': true,
			'type': $scope.selectedCustomColumnType.name
		});
		
		for (var i = $scope.qresult.length - 1; i >= 0; i--) {
			$scope.qresult[i][$scope.dataCustomColumn] = '';
		};

		var tmp = $scope.qresult;
		$scope.qresult = null;
		$scope.qresult = tmp;
		
		$scope.dataCustomColumn = '';
	}

	eventSender.onSelectColumnFinishing = function() {

		// 바인딩하기 전, 선택한 컬럼이 차트 타입에 대하여 유효한지 검증합니다.

		var required = $scope.chartType.required;
		var one = $scope.chartType.one;
		var selected = $scope.qrCols.getSelectedItems();

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

	eventSender.onSelectColumnFinished = function() {
		console.log($scope.qresult)
		console.log($scope.qrCols)
		// 바인딩 화면에 컬럼 정보를 넘겨줍니다.
		return {
			'cols': $scope.qrCols,
			'result': $scope.qresult
		}
	}
}

function ChartBindingController($scope, eventSender, serviceGuid, serviceChart) {
	var number_of_index = 0;

	function getDefaultSeries() {
		number_of_index++;
		return {
			'name': '시리즈' + number_of_index,
			'guid': serviceGuid.generateType2(),
			'value': undefined,
			'color': color_map[number_of_index-1]
		}
	}

	$scope.qrTmpl = '<table ng-class="{ selectable: isSelectable }" class="cmpqr table table-striped table-condensed-custom">' +
			'<thead><tr><th ng-class="{ selected: col.is_checked }" ng-style="{ backgroundColor: col.color }" ng-hide="!col.is_visible" ng-repeat="col in qrCols" after-iterate="columnChanged" ng-click="toggleCheck(col)">' +
			'<input id="{{col.guid}}" ng-show="isSelectable" type="checkbox" ng-model="col.is_checked" style="margin-right: 5px">' +
			'<span class="qr-th-type" ng-show="col.type == \'number\'">1</span><span class="qr-th-type" ng-show="col.type == \'string\'">A</span><span class="qr-th-type" ng-show="col.type == \'datetime\'"><i class="icon-white icon-time"></i></span>' + 
			' {{col.name}} </th></tr></thead>' + 
			'<tbody><tr ng-repeat="d in qrData"><td ng-class="{ selected: col.is_checked }" ng-style="{ backgroundColor: col.color }"" ng-hide="!col.is_visible" ng-repeat="col in qrCols" ng-click="toggleCheck(col)">{{d[col.name]}}</td></tr></tbody></table>',

	$scope.dataSeries = [];
	$scope.dataLabel;
	$scope.selectedSeriesIdx = 0;
	$scope.dataNumberTypeCols = [];
	$scope.dataNumberDatetimeTypeCols = [];

	$scope.$watch('dataLabel', function() {
		console.log('dataLabel changed');
		var st = serviceChart.buildJSONStructure($scope.dataSeries, $scope.qresult, $scope.dataLabel);
		render(st);
	});

	$scope.$watch('dataSeries', function() {
		var ignore_render = false;
		for (var i = $scope.qrCols.length - 1; i >= 0; i--) {
			$scope.qrCols[i].color = undefined;
			$scope.qrCols[i].is_checked = false;
		};
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
			var st = serviceChart.buildJSONStructure($scope.dataSeries, $scope.qresult, $scope.dataLabel);
			render(st);

		}
	}, true);

	$scope.$watch('chartType', function() {

	});

	function render(st) {
		//console.log($scope.chartType)

		if($scope.chartType.name == 'bar') {
			serviceChart.multiBarHorizontalChart('.charthere svg', st);	
		}
		else if($scope.chartType.name == 'line') {
			serviceChart.lineChart('.charthere svg', st);
		}
		else if($scope.chartType.name == 'pie') {
			serviceChart.pie('.charthere svg', st);
		}
		
	}

	eventSender.onChartBindingStarting = function() {
		// 이전 단계에서 선택된 항목의 정보를 전달해준다
		var sender = eventSender.onSelectColumnFinished();

		$scope.qresult = null;
		$scope.qresult = sender.result;

		var qrOrder = sender.cols;
		var qrOrderTarget = $scope.qrCols;

		// qrOrder가 더 많을 경우 qrOrderTarget 에 추가한다 (사용자 정의 컬럼)
		if(qrOrder.length > qrOrderTarget.length) {
			var qrOrderTargetName = qrOrderTarget.map(function(o) { return o.name; });

			var newOrders = qrOrder.filter(function(o) {
				return !(qrOrderTargetName.indexOf(o.name) > -1);
			});

			for (var i = 0; i < newOrders.length; i++) {
				qrOrderTarget.push(newOrders[i]);
			};
		}

		// qrOrderTarget에 똑같이 체크 표시
		for (var i = qrOrder.length - 1; i >= 0; i--) {
			if(qrOrder[i].is_checked) {
				qrOrderTarget[i].is_checked = true;
			}
		};
		init();
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
		if(array.every(myApp.isNumber)) return types[0];
		if(array.every(checkDate)) return types[1];

		return types[2];
	}

	eventSender.onSendChartDataWizard = function() {
		console.log('onSendChartDataWizard');

		return {
			'series': $scope.dataSeries,
			'label': $scope.dataLabel,
			'type': $scope.chartType.name
		}
	}

}

function WizardController($scope, eventSender, serviceGuid) {
	var dataChart;
	
	function getDefaultContext(type) {
		if(type == "grid") {
			return {
				'name': '',
				'guid': serviceGuid.generateType2(),
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
				'guid': serviceGuid.generateType2(),
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

	eventSender.onOpenNewWidget = function() {
		var newWidgetWin = $('.newWidget').removeClass(makeRemoveClassHandler(/^step/));
		newWidgetWin[0].showDialog();
			
		$scope.go(0);
		$('.wiz-next.btn:first').focus();
		//$scope.ctxWidget = getDefaultContext('grid');
		$scope.qresult = null;
	}

	$scope.qresult;

	$scope.inputOnloading = function() {
		$('.qr1')[0].showLoadingIndicator();
	}

	$scope.inputOnpageloaded = function() {
		$('.qr1')[0].showTable();
	}

	$scope.inputOnloaded = function() {
		$('.qr1')[0].hideLoadingIndicator();
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
				return eventSender.onSelectColumnFinishing;
			},
			's4nextCallback': function() {
				return eventSender.onChartBindingStarting;
			},
			's5nextCallback': function() {
				dataChart = eventSender.onSendChartDataWizard();
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

		eventSender.onCreateNewWidgetAndSavePreset($scope.ctxWidget);
		$('.newWidget')[0].hideDialog();	
	}

	// chart options
	$scope.ctypes = [
		{
			'name': 'bar',
			'required': ['number'],
			'invalid_msg': '하나 이상의 숫자 타입의 컬럼을 선택하십시오.'
		},
		{
			'name': 'line',
			'required': ['number'],
			'invalid_msg': '하나 이상의 숫자 타입의 컬럼을 선택하십시오.'
		},
		{
			'name': 'pie',
			'required': ['number'],
			'invalid_msg': '하나 이상의 숫자 타입의 컬럼을 선택하십시오.'
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
		eventSender.onCreateNewWidgetAndSavePreset($scope.ctxWidget);
		$('.newWidget')[0].hideDialog();
	}
}
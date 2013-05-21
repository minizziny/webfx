var app = angular.module('dashboard', ['myApp', 'logdb']);
var proc;

parent.d3 = d3;

var dateFormat = d3.time.format('%Y-%m-%d %H:%M:%S');
function checkDate(member, i) {
	if(member == undefined) return false;
	return myApp.isDate(dateFormat.parse(member.toString().substring(0,19)))
}

app.factory('serviceChart', function(serviceGuid) {
	function multiBarHorizontalChart(selector, data) {
		nv.addGraph(function() {
			var chart = nv.models.multiBarHorizontalChart()
			.x(function(d) { return { 'obj': d, 'label': d.label, 'toString': function() {return d.guid;} } }) // xlabel이 동일할 경우에 대책
			.y(function(d) { return d.value })
			//.margin({top: 40, right: 40, bottom: 40, left: 170})
			.margin({top: 0, right: 20, bottom: 20, left: 120})
			.showValues(true)
			.tooltips(false)
			.showControls(false);

			chart.xAxis.tickFormat(function(d) {
				if(checkDate(d.label)) {
					//return d.label.substring(0, 19);
					return d3.time.format('%x %X')(new Date(d.label));
				}
				else {
					return d.label;
				}
			});
			chart.yAxis.tickFormat(d3.format('d'));

			d3.select(selector)
			.datum(data)
			.transition().duration(500)
			.call(chart);

			nv.utils.windowResize(chart.update);

			return chart;
		});	
	}

	function lineChart(selector, data, xtype) {
		nv.addGraph(function() {
			var isXtype = (xtype == 'datetime');
			var chart = nv.models.lineChart()
			.x(function(d) {
				if(isXtype) {
					return new Date(d.label)
				}
				else {
					return d.label;
				}
			})
			.y(function(d) { return d.value })
			.margin({right: 30})
			.color(d3.scale.category10().range());

			if(isXtype) {
				chart.xAxis.tickFormat(function(d) {
					return d3.time.format('%x %X')(new Date(d));
				});
			}
			chart.yAxis.tickFormat(d3.format('d'));

			d3.select(selector)
			.datum(data)
			.transition().duration(500)
			.call(chart);

			nv.utils.windowResize(chart.update);

			return chart;
		});
	}

	function buildJSONStructure(dataSeries, dataResult, dataLabel) {

		var st = [];

		for (var i = 0; i < dataSeries.length; i++) {
			var s = dataSeries[i];
			var series = {
				'key': s.name,
				'color': s.color,
				'values': undefined
			};

			series.values = dataResult.map(function(obj) {
				return {
					'value': obj[s.value.name],
					'label': obj[dataLabel.name]
				}
			});
			st.push(series);
		};

		// assign guid
		if(dataResult != undefined) {
			for (var i = dataResult.length - 1; i >= 0; i--) {
				var guid = serviceGuid.generateType3();
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
			return obj
		});

		return dataSeries;
	}

	return {
		multiBarHorizontalChart: multiBarHorizontalChart,
		lineChart: lineChart,
		buildJSONStructure: buildJSONStructure,
		getDataSeries: getDataSeries
	}
})

app.factory('serviceGuid', function() {
	var s4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};

	return {
		generateType1: function() {
			return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
		},
		generateType2: function() {
			return ('w'+s4()+s4()+s4()+s4());
		},
		generateType3: function() {
			return ('w'+s4());
		}
	}
});

app.directive('autosize', function() {
	return {
		restrict: 'A',
		link: function(scope, $self, attrs) {
			var shadow, minHeight, noFlickerPad;
			$self.on('keydown', update).on('keyup', update);

			function update(e) {

				if(shadow == undefined) {
					minHeight    = $self.height();
					noFlickerPad = $self.hasClass('autogrow-short') ? 0 : parseInt($self.css('lineHeight')) || 0;

					shadow = $('<div></div>').css({
						position:    'absolute',
						top:         -10000,
						left:        -10000,
						width:       $self.width(),
						fontSize:    $self.css('fontSize'),
						fontFamily:  $self.css('fontFamily'),
						fontWeight:  $self.css('fontWeight'),
						lineHeight:  $self.css('lineHeight'),
						resize:      'none',
						'word-wrap': 'break-word'
					}).appendTo(document.body);
				}

				var times = function(string, number)
				{
					for (var i=0, r=''; i<number; i++) r += string;
						return r;
				};

				var val = $self[0].value.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;')
					.replace(/&/g, '&amp;')
					.replace(/\n$/, '<br/>&nbsp;')
					.replace(/\n/g, '<br/>')
					.replace(/ {2,}/g, function(space){ return times('&nbsp;', space.length - 1) + ' ' });

				shadow.css('width', $self.width());
				shadow.html(val + (noFlickerPad === 0 ? '...' : '')); // Append '...' to resize pre-emptively.
				$self.height(Math.max(shadow.height() + noFlickerPad, minHeight));

				return true;
			}
		}
	}
});

app.directive('queryInput', function($compile, serviceLogdb) {
	return {
		restrict: 'E',
		template: '<textarea autosize></textarea> <button class="search btn btn-primary">검색</button>',
		link: function(scope, element, attrs) {
			var textarea = element.find('textarea');
			textarea.attr('ng-model', attrs.queryModel);
			$compile(textarea)(scope);

			var pid = proc.pid;
			
			textarea.on('keydown', function(e) {
				if (e.type === 'keydown' && e.keyCode === 13) {
					e.preventDefault();
					search();
				}
			});
			
			element.find('.search').on('click', search);

			function search() {
				var z = serviceLogdb.create(pid);
				
				var queryValue = textarea.data('$ngModelController').$modelValue;

				z.query(queryValue)
				.pageLoaded(function(m) {
					scope[attrs.ngModel] = m.body.result;
					scope.$apply();
				})
				.loaded(function(m) {
					serviceLogdb.remove(z);
				})
				.failed(function(m) {
					alert('쿼리를 시작할 수 없습니다. 잘못된 쿼리입니다.')
				})
			}

		}
	}
});

app.directive('afterIterate', function() {
	return {
		link: function(scope, element, attrs) {
			if(scope.$last) {
				var fn = scope.$parent[attrs.afterIterate];
				if(!!fn) {
					fn.call(scope, scope);
				}
			}
		}
	}
})

app.directive('queryResult', function($compile) {
	return {
		restrict: 'E',
		template: '<table class="cmpqr table table-striped table-condensed"><thead><tr><th ng-hide="col.name==\'$$hashKey\' || !col.is_visible" ng-repeat="col in qrDataColumnsOrder" after-iterate="columnChanged">{{col.name}}</th></tr></thead>' + 
			'<tbody><tr ng-repeat="d in qrData"><td ng-hide="col.name==\'$$hashKey\' || !col.is_visible" ng-repeat="col in qrDataColumnsOrder">{{d[col.name]}}</td></tr></tbody></table>',
		link: function(scope, element, attrs) {
			scope.qrDataColumns = [];
			scope.qrDataColumnsOrder = [];
			scope.qrDataColumnsOrder.exceptedHashKey = function() {
				return this.filter(function(el) {
					return (el.name != '$$hashKey');
				});
			}
			scope.qrData = [];

			scope.$watch(attrs.ngModel, function() {
				//console.log('model updated')
				var raw = scope[attrs.ngModel];

				scope.qrDataColumns.splice(0, scope.qrDataColumns.length);
				scope.qrDataColumnsOrder.splice(0, scope.qrDataColumnsOrder.length);
				scope.qrData.splice(0, scope.qrData.length);

				if(!angular.isArray(raw)) {
					return;
				}

				for (var i = 0; i < raw.length; i++) {
					for (var col in raw[i]) {
						if(scope.qrDataColumns.indexOf(col) == -1) {
							scope.qrDataColumns.push(col);
						}
					}
					scope.qrData.push(raw[i]);
				};

				scope.qrDataColumns.sort(function(a,b) {
					if(a.indexOf('_') == 0) {
						return -1;
					}
					else {
						return 1;
					}
					return 0;
				});

				for (var i = 0; i < scope.qrDataColumns.length; i++) {
					scope.qrDataColumnsOrder.push({
						'name': scope.qrDataColumns[i],
						'is_visible': true,
						'is_checked': undefined
					});
				}
			});
		}
	}
});

app.directive('qrSelectable', function($compile, serviceGuid, eventSender) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {

			element.parent().css('position', 'relative').css('overflow-y', 'hidden');
			var container = angular.element('<div style="min-width:100%; height:100%; top:0; background-color: transparent; opacity: .5; position: absolute"></div>');

			eventSender.onLabelLayoutUpdate = function() {
				setTimeout(function() {
					var ths = element.find('th:visible');
					var labels = container.find('label');
					for (var i = labels.length - 1; i >= 0; i--) {
						$(labels[i]).width($(ths[i]).width());
					};

					var total_col_len = 0;
					for (var i = ths.length - 1; i >= 0; i--) {
						total_col_len = total_col_len + $(ths[i]).width() + 16;
					};
					container.width(total_col_len);
					
				}, 200)
				
			}

			scope.columnChanged = function() {
				//console.log('columnChanged')
				container.empty().remove();	
				element.after(container);

				var ths = element.find('th');
				var qrOrder = scope.qrDataColumnsOrder;
				for (var i = 0; i < qrOrder.length; i++) {
					//if(qrOrder[i].is_checked == undefined) { qrOrder[i].is_checked = (i % 2) ? true: false; }

					if(qrOrder[i].name == "$$hashKey") continue;

					$(ths[i]).find('input[type=checkbox]').remove();

					var guid = serviceGuid.generateType2();
					var check = angular.element('<input type="checkbox" id="' + guid + '" ng-model="qrDataColumnsOrder[' + i + '].is_checked">');
					var label = angular.element('<label class="qr-sel-label" ng-class="{ selected: qrDataColumnsOrder[' + i + '].is_checked, unselected: !qrDataColumnsOrder[' + i + '].is_checked }" for="' + guid + '" style="float: left; padding: 7px; height: 220px">');
					angular.element(ths[i]).prepend(check);
					container.append(label);

					$compile(check)(scope);
					$compile(label)(scope);
				};

				scope.checkAtLeast2cols = function() {
					var tmp = [];
					for (var i = qrOrder.length - 1; i >= 0; i--) {
						if(qrOrder[i].is_checked) tmp.push(true);
					};
					return (tmp.length >= 2) ? false: true;
				}

			}

			eventSender.updateVisible = function(targetScope) {
				var qrOrder = scope.qrDataColumnsOrder.exceptedHashKey();
				var qrOrderTarget = targetScope.qrDataColumnsOrder;

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

				for (var i = 0; i < qrOrder.length; i++) {
					qrOrderTarget[i].is_visible = qrOrder[i].is_checked;
				}
			}
			
		}
	}
});

app.directive('widget', function($compile, serviceLogdb, eventSender, serviceChart) {
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			scope[attrs.guid] = {
				data: [],
				interval: parseInt(attrs.interval)
			};

			var timer, pageLoaded;

			function query() {
				console.log('--------------------')
				var z = serviceLogdb.create(proc.pid);
				var q = z.query(decodeURIComponent(attrs.query));
				q.pageLoaded(pageLoaded)
				.loaded(function(m) {
					serviceLogdb.remove(z);
				})
				.failed(function(m) {
					clearTimeout(timer);
					timer = null;
					timer = setTimeout(query, Math.max(5000, scope[attrs.guid].interval * 1000) );
				});

				return q;
			}

			function dispose() {
				clearTimeout(timer);
				timer = null;
				element.remove();
			}

			var template = angular.element('<div class="widget"><h5>' + attrs.name + '</h5>' +
				'<button style="margin-left: 10px" class="close widget-close">&times;</button>' +
				'<button class="close widget-refresh"><i style="margin-top: 6px; margin-left:10px;" class="icon-refresh pull-right"></i></button>' + 
				'<span class="ninput" style="float:right"></span>' + 
				'</div>');
			var ninput = angular.element('<input type="number" min="5" ng-model="' + attrs.guid + '.interval" />');

			if(attrs.type == 'grid') {
				var table = angular.element('<table class="cmpqr table table-striped table-condensed"><thead><tr><th ng-repeat="col in ' + attrs.fields + '">{{col}}</th></tr></thead>' +
					'<tbody><tr ng-repeat="d in ' + attrs.guid + '.data"><td ng-repeat="col in ' + attrs.fields + '">{{d[col]}}</td></tr></tbody></table>');
				$compile(table)(scope);
				$compile(ninput)(scope);
				template.find('span.ninput').append(ninput).append(angular.element('<small style="vertical-align:2px"> 초</small>'));
				template.append(table);

				element.append(template);
				
				pageLoaded = function(m) {
					scope[attrs.guid].data = m.body.result;
					scope.$apply();

					clearTimeout(timer);
					timer = null;
					timer = setTimeout(query, Math.max(5000, scope[attrs.guid].interval * 1000) );
				};

				query().pageLoaded(pageLoaded);

				template.find('button.widget-close').on('click', function() {
					eventSender.onRemoveSingleWidget(attrs.guid);
					dispose();
				});

				template.find('button.widget-refresh').on('click', function() {
					clearTimeout(timer);
					timer = null;
					query();
				});

				element[0].$dispose = dispose; 
				
			}
			else if(attrs.type == 'chart.bar' || attrs.type == 'chart.line') {
				element.append(template);
				var svg = angular.element('<svg class="widget">');
				$compile(ninput)(scope);
				template.find('span.ninput').append(ninput).append(angular.element('<small style="vertical-align:2px"> 초</small>'));
				template.append(svg);

				pageLoaded = function(m) {
					console.log(attrs.type + ' reloaded');
					var dataResult = m.body.result;
					var dataSeries = serviceChart.getDataSeries(attrs.series);
					var dataLabel = {name: attrs.label, type: attrs.labeltype};

					var json = serviceChart.buildJSONStructure(dataSeries, dataResult, dataLabel);
					if(attrs.type == 'chart.line') {
						serviceChart.lineChart(svg[0], json, dataLabel.type);
					}
					else if(attrs.type == 'chart.bar') {
						serviceChart.multiBarHorizontalChart(svg[0], json);
					}

					clearTimeout(timer);
					timer = null;
					timer = setTimeout(query, Math.max(5000, scope[attrs.guid].interval * 1000) );
				}

				query().pageLoaded(pageLoaded);

				template.find('button.widget-close').on('click', function() {
					eventSender.onRemoveSingleWidget(attrs.guid);
					dispose();
				});

				template.find('button.widget-refresh').on('click', function() {
					clearTimeout(timer);
					timer = null;
					query();
				});

				element[0].$dispose = dispose;

			}

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
		updateVisible: null,
		onUpdateVisible: null,
		onSendChartDataWizard: null
	}
	return e;
});

function Controller($scope, serviceSession, serviceTask, eventSender) {

	$scope.logout = serviceSession.logout;

	serviceTask.init();
	proc = serviceTask.newProcess('dashboard');

	//serviceSession.login("root", "araqne", proc.pid);

	$scope.openNewWidget = function() {
		eventSender.onOpenNewWidget();
	}

}

function WallController($scope) {

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
			if(ctx.data.type == 'bar' || ctx.data.type == 'line') {
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

	$scope.Remove = function() {
		RemovePresets($scope.currentPreset.guid).success(function() {
			LoadPreset('autosave');
		});
	}

	$scope.Clear = function() {
		ClearPreset();
		SavePreset($scope.currentPreset.guid, $scope.currentPreset.name, { "widgets": [] });
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

function ChartBindingController($scope, eventSender, serviceGuid, serviceChart) {
	var color_map = ["#AFD8F8","#F6BD0F","#8BBA00","#FF8E46","#008E8E","#D64646","#8E468E","#588526","#B3AA00","#008ED6","#9D080D","#A186BE","#CC6600","#FDC689","#ABA000","#F26D7D","#FFF200","#0054A6","#F7941C","#CC3300","#006600","#663300","#6DCFF6"];
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

	$scope.dataSeries = [];
	$scope.dataLabel;
	$scope.selectedSeriesIdx = 0;
	$scope.dataNumberTypeCols = [];
	$scope.dataNumberDatetimeTypeCols = [];

	$scope.$watch('dataLabel', function() {
		console.log('dataLabel changed');
		var st = serviceChart.buildJSONStructure($scope.dataSeries, $scope.qresult, $scope.dataLabel);
		render(st, $scope.dataLabel);
	});

	$scope.$watch('dataSeries', function() {
		console.log('dataSeries changed');
		var st = serviceChart.buildJSONStructure($scope.dataSeries, $scope.qresult, $scope.dataLabel);
		render(st, $scope.dataLabel);
	}, true);

	$scope.$watch('chartType', function() {

	});

	function render(st, dataLabel) {
		$('.charthere svg').empty();
		console.log($scope.chartType)

		if($scope.chartType.name == 'bar') {
			serviceChart.multiBarHorizontalChart('.charthere svg', st);	
		}
		else if($scope.chartType.name == 'line') {
			serviceChart.lineChart('.charthere svg', st, dataLabel.type);
		}
		
	}

	eventSender.onUpdateVisible = function() {
		eventSender.updateVisible($scope);
		init();
	}

	function init() {
		//console.log($scope.chartType)

		// 초기화
		$scope.dataSeries.splice(0, $scope.dataSeries.length);
		$scope.dataNumberTypeCols.splice(0, $scope.dataNumberTypeCols.length);
		$scope.dataNumberDatetimeTypeCols.splice(0, $scope.dataNumberDatetimeTypeCols.length);
		$scope.dataLabel = undefined;
		$scope.selectedSeriesIdx = 0;	
		number_of_index = 0;

		// 모든 컬럼의 타입 체크
		var cols = $scope.qrDataColumnsOrder;
		for (var i = 0; i < cols.length; i++) {
			if(cols[i].type == undefined) {
				var mapAll = $scope.qresult.map(function(obj, j) {
					return obj[cols[i].name];
				});
				var type = checkArrayMemberType(mapAll);
				cols[i]['type'] = type;
			}

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
			if(obj.is_visible) return obj;
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
			}
		};

		var idxDatetime = types.indexOf('datetime');
		var idxString = types.indexOf('string');
		var idxNumber = types.indexOf('number');


		if($scope.chartType.name == "bar") {
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
		$('.newWidget')
			.removeClass(makeRemoveClassHandler(/^step/))
			.show();
		$scope.go(0);
		//$scope.ctxWidget = getDefaultContext('grid');
		$scope.qresult = null;
	}

	$scope.qresult;

	var wtypes = [
		{
			'name': 'table',
			's0next': 1,
			's0nextCallback': function() {
				$scope.ctxWidget = getDefaultContext('grid');
				return;
			},
			's1next': 2,
			's3prev': 2
		},
		{
			'name': 'graph',
			's0next': 1,
			's0nextCallback': function() {
				$scope.ctxWidget = getDefaultContext('chart');
				return;
			},
			's1next': 4,
			's1nextCallback': function() {
				return eventSender.onLabelLayoutUpdate;
			},
			's4nextCallback': function() {
				return eventSender.onUpdateVisible;
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

	$scope.shift = function(i, item) {
		$scope.qrDataColumnsOrder.splice(i, 1);
		$scope.qrDataColumnsOrder.splice(i + 1, 0, item);
	}

	$scope.unshift = function(i, item) {
		$scope.qrDataColumnsOrder.splice(i, 1);
		$scope.qrDataColumnsOrder.splice(i - 1, 0, item);
	}

	$scope.go = function(page, callback) {
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
		var order = $scope.qrDataColumnsOrder.filter(function(obj) {
			if(obj.name == '$$hashKey') return false;
			if(obj.is_visible) return true;
		})
		.map(function(obj) {
			return obj.name;
		});
		$scope.ctxWidget.data.order = order;

		console.log($scope.ctxWidget);

		eventSender.onCreateNewWidgetAndSavePreset($scope.ctxWidget);
		$('.newWidget').hide();	
	}

	// chart options
	$scope.ctypes = [
		{
			'name': 'bar'
		},
		{
			'name': 'line'
		},
		{
			'name': 'pie'
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
		
		var obj = {};
		obj[$scope.dataCustomColumn] = 123;

		$scope.qrDataColumnsOrder.push({
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
		//$scope.$apply();
		$scope.qresult = tmp;
		

		$scope.dataCustomColumn = '';
		eventSender.onLabelLayoutUpdate();
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
		$('.newWidget').hide();
	}
}
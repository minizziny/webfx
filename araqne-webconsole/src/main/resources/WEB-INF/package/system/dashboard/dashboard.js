
function DashboardController($scope, $http, $compile, $translate, $timeout, eventSender, $filter, socket, serviceUtility, serviceSession, serviceWidget) {
	$scope.getPid = eventSender.dashboard.pid;
	eventSender.dashboard.$event.on('unload', function() {
		console.log('--- unload 2 dashboard!');
	});

	$scope.formSecond = {
		'0': $translate('$S_str_Seconds'),
		'one': $translate('$S_str_Second'),
		'other': $translate('$S_str_Seconds')
	}

	$scope.ctxPreset = {};
	$scope.dataPresetList = [];
	$scope.currentPreset;
	$scope.isLoadedCurrentPreset = false;

	window._recovery = {
		resetCurrentLayout: function() {
			OnPresetChanged($scope.currentPreset.guid, true);
		},
		resetSpecificLayout: function(guid) {
			OnPresetChanged(guid, true);
		}
	};

	function OnPresetChanged(guid, reset_layout) {
		var specific = $scope.dataPresetList.filter(function(p) {
			return p.guid === guid;
		}).first();

		var stateLayoutObject = angular.element('dockpanel#' + guid + ' > .k-d-col')[0].obj.getObject();
		// console.log(specific, stateLayoutObject);

		var widgets = [];
		for(wguid in $scope.ctxPreset[guid].ctxWidget) {
			widgets.push($scope.ctxPreset[guid].ctxWidget[wguid]);
		}

		var stateObject = {
			'layout': [stateLayoutObject],
			'widgets': widgets
		}

		console.log(stateObject)
		return SavePreset(guid, specific.name, stateObject, reset_layout);
	}

	$scope.onCloseWidget = function(id, target, presetId) {
		if(id in $scope.ctxPreset[presetId].ctxWidget) {
			$scope.ctxPreset[presetId].ctxWidget[id] = undefined;
			delete $scope.ctxPreset[presetId].ctxWidget[id];
			target[0].obj.close();

			$timeout(function() {
				OnPresetChanged(presetId); // save state
			}, 200);
		}
	}

	$scope.onChangeWidget = function(id, presetId, field, oldval, newval) {
		if(id in $scope.ctxPreset[presetId].ctxWidget) {
			$scope.ctxPreset[presetId].ctxWidget[id][field] = newval;
			OnPresetChanged(presetId); // save state
		}
	}

	eventSender.dashboard.updateWidgetProperty = function(options) {
		// console.log(options.presetId, options.widgetId, options.widgetId in $scope.ctxPreset[options.presetId].ctxWidget )
		if(options.widgetId in $scope.ctxPreset[options.presetId].ctxWidget) {
			$scope.ctxPreset[options.presetId].ctxWidget[options.widgetId].interval = options.interval;
			OnPresetChanged(options.presetId); // save state
		}
		
		if(!!options.callback) {
			options.callback();
		}
	}

	$scope.openNewWidget = function() {
		eventSender.dashboard.onOpenNewWidget();
	}

	$scope.addTabWidget = function() {
		// var newguid = 'b' + serviceUtility.generateType2();
		// var newbie = layoutEngine.ui.layout.box.create({
		// 	'w': 100,
		// 	"droppable": false,
		// 	'guid': newguid
		// });

		// var newdiv = $('<div class="newbie"></div>').appendTo('.dashboard-container');
		// var isSplitInsert = false;
		// newbie.on('splitInsert', function() {
		// 	newbie.el.find('.handler').off('mousedown.help');
		// 	isSplitInsert = true;
		// });

		// newbie.el.find('.handler').on('mousedown.help', function() {

		// 	$(document).on('mouseup.help', function() {
		// 		if(isSplitInsert) {
		// 			newdiv.remove();
		// 		}
				
		// 		$(document).off('mouseup.help');
		// 	})
		// });

		// newbie.resizerH.hide();
		// newbie.appendTo(newdiv, true);


		// var ctxTabWidget = {
		// 	"guid": newguid,
		// 	"name": "Tab" + (z++).toString(),
		// 	"data": {
		// 		"tabs": [
		// 			{
		// 				"name": "헬로",
		// 				"is_active": true,
		// 				"guid": 't' + serviceUtility.generateType2(),
		// 				"type": "dockpanel",
		// 				"contents": 'p' + serviceUtility.generateType2()
		// 			}
		// 		]
		// 	},
		// 	"type": "tabs"
		// }

		// ---------------- need to fix
		// var elWidget = angular.element(serviceWidget.buildWidget($scope.currentPreset.guid, ctxTabWidget));
		
		// $scope.ctxPreset[$scope.currentPreset.guid].ctxWidget[ctxTabWidget.guid] = ctxTabWidget;
		// $scope.currentPreset.state.widgets.push(ctxTabWidget);
		
		// elWidget.appendTo(angular.element('[dock-id=' + newguid + '] .contentbox'));
		// $compile(elWidget)($scope);
	}


	function makeGlobalTimer(freq) {
		freq = freq || 1000;

		// array of callback functions
		var callbacks = {};

		// register the global timer
		var id = setInterval(
			function() {
				var obj;

				for (obj in callbacks) {
					if(Date.now() >= callbacks[obj].timestamp) {
						callbacks[obj].callback();
						delete callbacks[obj];
					}
				}

				if(!!~window._logger.current.indexOf('dashboard-widget-timer')) {
					console.log(callbacks);
				}
			}, freq);

		// return a Global Timer object
		return {
			"id": function() { return id; },
			"registerCallback": function(guid, cb, itv) {
				var d = Date.now();
				d += itv;
				if(guid in callbacks) {
					if(!!~window._logger.current.indexOf('dashboard-widget-timer')) {
						console.log(guid, 'duplicated');
					}
				}
				else {
					callbacks[guid] = {
						'timestamp': d,
						'callback': cb
					}
				}
			},
			"unregisterCallback": function(guid) {
				delete callbacks[guid];
				if(!!~window._logger.current.indexOf('dashboard-widget-timer')) {
					console.log(guid, 'unregistered');
				}
			},
			"cancel": function() {
				if (id !== null) {
					clearInterval(id);
					id = null;
				}
			}
		};
	}

	var gt = makeGlobalTimer(1000);
	var ONE_SECOND = 1000;

	function refresh(w) {
		return function() {
			if(angular.element(w).scope() != undefined) {
				if( angular.element(w).scope().isRunning ) {
					w.query(function() {
						gt.registerCallback(w.id, refresh(w), w.getInterval() * ONE_SECOND);
					});
				}
			}
		}
	}

	$scope.activeTab = function(tab, tabs, e) {
		
		tabs.forEach(function(t) {
			if(t === tab) {
				t.is_active = true;
			} else {
				t.is_active = false;
			}
		});

		if(e.activateByDroppable) {
			return;
		}

		// 실행중인건 suspend
		var elRunning = angular.element('widget.w-running');
		elRunning.each(function(i, w) {
			w.suspend();
			gt.unregisterCallback(w.id);
		});

		// 활성탭인건 렌더
		var elWidget = angular.element('.tab-pane.' + tab.guid + ' widget');
		elWidget.each(function(i, w) {
			w.render();
			gt.registerCallback(w.id, refresh(w), w.getInterval() * ONE_SECOND);
		});

		$timeout(function() {
			resizeWidgets();
		}, 200);
	}

	$scope.pauseWidget = function(e) {
		var w = $(e.target).parents('widget:first')[0];
		w.suspend();
		gt.unregisterCallback(w.id);
	}

	$scope.runWidget = function(e) {
		var w = $(e.target).parents('widget:first')[0];
		w.render();
		gt.registerCallback(w.id, refresh(w), w.getInterval() * ONE_SECOND);
	}

	$scope.displayWidgetProperty = function(e) {
		var w = $(e.target).parents('widget:first')[0];
		var dockpanel = $(e.target).parents('dockpanel:first')[0];

		eventSender.dashboard.setWidgetProperty(w, dockpanel.id);
		$('.propertyWidget')[0].showDialog();
	}

	$scope.refreshWidget = function(e) {
		var w = $(e.target).parents('widget:first')[0];
		gt.unregisterCallback(w.id);
		w.query(function() {
			gt.registerCallback(w.id, refresh(w), w.getInterval() * ONE_SECOND);
		});
	}

	$(window).on('resize', debounce(function() {
		resizeWidgets();
	}, 200));

	function resizeWidgets(selector) {
		if(selector == undefined) {
			selector = '.tab-pane.active';
		}

		if(!(selector instanceof jQuery)) {
			selector = angular.element(selector)
		}

		resizeChartWidgets(selector);
		resizeWordCloudWidgets(selector);
	}

	function resizeChartWidgets(el) {
		var elChart = el.find('widget[chart] .widget-chart');
		elChart.each(function(i, c) {
			if(!!$(c).highcharts) {
				if(!!$(c).highcharts()) {
					var parent = $(c).parents('.contentbox');
					$(c).highcharts().setSize(parent.width(), parent.height() - 10, false);
				}
			}
		});
	}

	function resizeWordCloudWidgets(el) {
		var elWordCloud = el.find('widget[wcloud] .widget-wordcloud');
		elWordCloud.each(function(i, c) {
			if(!!c.onResize) {
				c.onResize();
			}
		});
	}

	$scope.addTab = function(tabdata, e, preset) {
		var newTabName = prompt('Enter tab Name', 'Tab ' + (tabdata.length + 1));
		if(newTabName == null) return;

		var tabctx = {
			'name': newTabName,
			'guid': 't' + serviceUtility.generateType2(),
			'type': 'dockpanel',
			"contents": 'p' + serviceUtility.generateType2()
		}
		
		tabdata.push(tabctx);
		$timeout(function() {
			var pane = angular.element(e.target).parents('.tab-comp').find('.tab-pane.' + tabctx.guid);
			NewInnerPreset(tabctx.contents, pane, preset);
			angular.element(e.target).parents('li').prev().children('a').click();
			
			var presetId = angular.element(e.target).parents('dockpanel:first').attr('id');
			OnPresetChanged(presetId); // save state
		});
	}

	$scope.closeTab = function(tab, preset, widget, e) {
		var sure = confirm('이 탭을 삭제하면 탭 안의 위젯도 삭제됩니다. 계속하시겠습니까?');
		if(!sure) return;

		var tabs = $scope.ctxPreset[preset].ctxWidget[widget].data.tabs;

		var idx = tabs.indexOf(tab);
		tabs.splice(idx, 1);

		if(idx == 0) idx = 1;
		tabs[--idx].is_active = true;
		RemovePresets(tab.contents);
		OnPresetChanged(preset); // save state

	}

	$scope.onTabTitleChange = function(oldval, newval) {
		OnPresetChanged($scope.currentPreset.guid); // save state
	}

	// 위젯 드래그 & 탭 드롭 위한 변수
	var isEnter = false, timer, a;

	function onEnterDroppableTab(a, box, e, ed) {
		if($('.k-d-col.virtual').length == 0) {
			var w = box.el.width(), h = box.el.height();
			box.el.clone()
				.addClass('virtual')
				.width(w)
				.height(h)
				.css('top', e.pageY - ed.offsetY - 40)
				.css('left', e.pageX - ed.offsetX)
				.appendTo('#view-dashboard');
		}
		else {
			
		}
		var event = jQuery.Event("click");
		event.activateByDroppable = true;
		a.trigger(event).removeClass('over');

		if($('.k-d-col.virtual').length != 0 && box.el.parents('.tab-pane').length > 0) {
			var owntab = hasClassIndexOf(box.el.parents('.tab-pane')[0].className, a.attr('tab-id'));
			if(owntab) {
				$('.k-d-col.virtual').remove();
			}
		}
	}

	$scope.onDragInnerbox = function(box, e, ed) {
		console.log('onDragInnerbox')
		var found = findElementsByCoordinate(["droppable", "widget-drop-zone"], e);
		if(found.length) {
			if(!!a) {
				// console.log(a.attr('tab-id'), $(found[0]).parent().attr('tab-id'))	
			}
			
			if((a == undefined) || a.attr('tab-id') != $(found[0]).parent().attr('tab-id')) {
				$('[widget-droppable].over').removeClass('over');
				isEnter = false;
				a = $(found[0]).parent();
				a.addClass('over');
			}

			if(a.attr('tab-id') === $(found[0]).parent().attr('tab-id')) {
				a.addClass('over');
			}

			if(!isEnter) {
				isEnter = true;
				timer = setTimeout(function() {
					return onEnterDroppableTab(a,box,e,ed);
				}, 600);
			}

		}
		else {
			isEnter = false;
			clearTimeout(timer);
			timer = undefined;
			if(!!a) {
				a.removeClass('over')
			}

			$('[widget-droppable].over').removeClass('over');
		}

		$('.k-d-col.virtual').css('top', e.pageY - ed.offsetY - 40).css('left', e.pageX - ed.offsetX)
	}

	$scope.onDropbox = function(box, e, id) {
		$('.k-d-col.virtual').remove();
	}

	$scope.onAppendbox = function(box, e, id) {
		var dropPanelId = $(e.target).parents('dockpanel').attr('id');
		if(id === dropPanelId) return;

		

		var ctx = angular.extend({}, $scope.ctxPreset[id].ctxWidget[box.guid]);
		delete $scope.ctxPreset[id].ctxWidget[box.guid];
		$scope.ctxPreset[dropPanelId].ctxWidget[box.guid] = ctx;
		
		console.log('append!', id, dropPanelId);
	}

	eventSender.dashboard.onCreateNewWidgetAndSavePreset = function(ctx) {
		
		var newbie = layoutEngine.ui.layout.box.create({
			'w': 100,
			'guid': ctx.guid
		});

		var newdiv = $('<div class="newbie" ng-controller="NewWidgetController"></div>').appendTo('.dashboard-container');
		var isSplitInsert = false;
		newbie.on('splitInsert', function() {
			newbie.el.find('.handler').off('mousedown.help');
			isSplitInsert = true;
		});

		newbie.el.find('.handler').on('mousedown.help', function() {
			$('.arrangeWidget')[0].hideDialog();

			$(document).on('mouseup.help', function(eu) {
				if(isSplitInsert) {
					$('.arrangeWidget')[0].hideDialog();
					newdiv.remove();

					
					var target = document.elementFromPoint(eu.clientX, eu.clientY);
					var presetId = angular.element(target).parents('dockpanel:first').attr('id');
					$scope.ctxPreset[presetId].ctxWidget[ctx.guid] = ctx;
					OnPresetChanged(presetId); // save state

					widget.find('.widget-toolbox').show();
				}
				else {
					$('.arrangeWidget')[0].showDialog();
				}
				$(document).off('mouseup.help');
			})
		});

		newbie.resizerH.hide();
		newbie.appendTo(newdiv, true);

		$('.arrangeWidget')[0].showDialog();

		var widget = eventSender.dashboard.onCreateNewWidget(ctx);
		widget.find('.widget-toolbox').hide();
	}

	eventSender.dashboard.onCreateNewWidget = function(ctx) {
		var el = angular.element('.k-d-col[dock-id=' + ctx.guid + ']');

		// var widget = angular.element('<widget ng-pid="getPid" guid="' + ctx.guid + '" on-change="onChangeWidgetProperty($new, $old, \'' + ctx.guid + '\', $key)" on-remove="onRemoveWidget(\'' + ctx.guid + '\')"></widget>');
		var widget = angular.element('<widget id="' + ctx.guid + '"  on-close="onCloseWidget($id, $target)"><div>{{hello}} {{1+1}}</div></widget>');
		// $compile(widget)($scope);
		// widget[0].setContext(ctx);

		widget.appendTo(el.find('.contentbox'));
		return widget;
	}


	function GetPresetList(callback) {
		socket.send('com.logpresso.core.msgbus.WallPlugin.getPresetNames', {}, eventSender.dashboard.pid)
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

	function SavePreset(guid, name, state, reset_layout, parent) {
		var found = $scope.dataPresetList.filter(function(preset) {
			return preset.guid === guid;
		});

		var sendContext = { 'guid': guid, 'name': name, 'state': state };

		if(found.length > 0) {
			console.log('update preset');
			if( !!found.first().parent ) {
				sendContext['parent'] = found.first().parent;
			}
		}
		else {
			console.log('new preset');
			var listContext = {
				'guid': guid,
				'name': name,
				'parent': null
			};
			if(!!parent) {
				listContext['parent'] = parent;
				sendContext['parent'] = parent;
			}
			$scope.dataPresetList.push(listContext);
		}
		
		if(reset_layout === true) {
			console.warn('reset layout!');
			delete state.layout; // <-----------------
		}

		console.log(sendContext)

		return socket.send("com.logpresso.core.msgbus.WallPlugin.setPreset", sendContext, eventSender.dashboard.pid);
	}

	function InitAutosave() {
		var amIRoot = serviceSession.whoAmI() === 'root';
		return socket.send("com.logpresso.core.msgbus.WallPlugin.setPreset", 
			{ "guid": "autosave" + (amIRoot ? '' : ('_' + serviceSession.whoAmI())), "name": $translate('$S_str_Autosave'), "state": { "widgets": [] } }
		, eventSender.dashboard.pid);
	}

	function ClearPreset() {
		layoutEngine.ui.layout.box.allboxes = [];
		layoutEngine.ui.layout.box.root = undefined;
		$scope.ctxPreset = {};
		$('.dockpanel').empty();
	}

	$scope.onChangePreset = function(id, box, row) {
		if(!!box) {
			var el = $(box.rows.map(function(row) { return row.el[0]; }));
			resizeWidgets(el);
		}
		if(!!row) {
			var el = $(row.boxes.map(function(box) { return box.el[0]; }));
			resizeWidgets(el);
		}

		if($scope.isLoadedCurrentPreset) {
			console.log('onChangePreset')
			OnPresetChanged(id); // save state	
		}
	}

	function getPresetWidgets(name, data, target, no_root) {

		$scope.ctxPreset[name] = {
			ctxWidget: {},
			dataLayout: data.layout[0]
		}
		var el = angular.element(
			'<dockpanel id="' + name + '" ' + 
			  'on-drag="onDragInnerbox($box, $moveevent, $downevent)" ' +
				'on-drop="onDropbox($box, $event, $id)" ' +
				'on-append="onAppendbox($box, $event, $id)" ' +
				'on-change="onChangePreset($id)" ' +
				'on-resize="onChangePreset($id, $box, $row)" ' +
				'ng-model="ctxPreset.' + name + '.dataLayout" ' +
				(no_root ? '' : 'root="true"') + '></dockpanel>');

		var widgets = data.widgets;

		widgets.forEach(function(widget) {
			var elWidget = angular.element(serviceWidget.buildWidget(name, widget));
			$scope.ctxPreset[name].ctxWidget[widget.guid] = widget;
			elWidget.appendTo(el);
		});

		$compile(el)($scope);

		$timeout(function() {
			widgets.forEach(function(widget) {
				if(widget.type === 'tabs') {
					widget.data.tabs.forEach(function(tab) {
						var has = $scope.dataPresetList.map(function(p) { return p.guid }).indexOf(tab.contents);
						var pane = el.find('.tab-pane.' + tab.guid);
						if(!~has) {
							console.log('innerDockpanel', tab.contents, 'created')
							NewInnerPreset(tab.contents, pane, name);
						}
						else {
							console.log('innerDockpanel', tab.contents, 'load')
							LoadPreset(tab.contents, pane);
						}
					});
				}
			});
			el.appendTo(target);
		});
	}

	function MigrationPreset(preset) {	
		console.log('===== Migration this preset =====')

		var newguid = 'p' + serviceUtility.generateType2();

		SavePreset(newguid, newguid, preset.state, false, preset.guid).success(function() {
			var dockId = serviceUtility.generateType2();

			var newstate = {
				'layout': [{
					'rows': [{
						'cols': [{
							'droppable': false,
							'dragHandler': false,
							'guid': dockId,
							'w': 100
						}],
						'h': 100
					}],
					'w': 100,
					'droppable': false,
					'dragHandler': false
				}],
				'widgets': [{
					'data': {
						'tabs': [
							{
								'name': preset.name,
								'guid': serviceUtility.generateType2(),
								'is_active': true,
								'type': 'dockpanel',
								'contents': newguid
							}
						]
					},
					'guid': dockId,
					'name': preset.name,
					'type': 'tabs'
				}]
			};
			SavePreset(preset.guid, preset.name, newstate).success(function() {
				LoadPreset(preset.guid);

				console.log('===== Migration ended =====')
			});
		});
	}

	function LoadPreset(guid, el) {

		socket.send('com.logpresso.core.msgbus.WallPlugin.getPreset',
			{ 'guid': guid }
		, eventSender.dashboard.pid)
		.success(function(m) {
			if(!m.body.preset.state.layout) {
				var widgets = m.body.preset.state.widgets;
				m.body.preset.state.layout = [ layoutEngine.ui.layout.autoLayout(widgets) ];
			}

			console.log(m.body.preset.state)

			// root preset
			//////////////// FOR MIGRATION /////////////
			if(el == undefined) {
				console.log('---- Loading Preset',m.body.preset.name, '----');
				var hasWidget = m.body.preset.state.widgets.some(function(widget) {
					return widget.type === 'tabs';
				});
				if(!hasWidget) {
					MigrationPreset(m.body.preset);
					return;
				}
				else {
					m.body.preset.state.layout[0].dragHandler = false;
					m.body.preset.state.layout[0].droppable = false;
					m.body.preset.state.layout[0].rows[0].cols[0].dragHandler = false;
					m.body.preset.state.layout[0].rows[0].cols[0].droppable = false;
				}
			}
			//////////////// END MIGRATION //////////////
			

			// root preset
			if(el == undefined) {
				$scope.isLoadedCurrentPreset = false;
				$scope.currentPreset = m.body.preset;
				ClearPreset();
				el = angular.element('.dockpanel');
				getPresetWidgets(guid, m.body.preset.state, el);

				$timeout(function() {
					$scope.isLoadedCurrentPreset = true;
					$('.nav.nav-tabs li.active > a').click();
				}, 1000);
			}
			// inner preset
			else {
				getPresetWidgets(guid, m.body.preset.state, el, true);
			}

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

		return socket.send("com.logpresso.core.msgbus.WallPlugin.removePresets", 
			{ "guids": args }
		, eventSender.dashboard.pid);
	}

	$scope.SaveAs = function() {
		var newname = prompt($translate('$S_msg_SavePresetAs'));
		if(newname == undefined || newname === '') return;

		var newguid = 'p' + serviceUtility.generateType2();
		SavePreset(newguid, newname, $scope.currentPreset.state).success(function() {
			LoadPreset(newguid);
		});
	}

	$scope.RenamePreset = function(newval) {
		console.log(newval)
		SavePreset($scope.currentPreset.guid, newval, $scope.currentPreset.state).success(function() {
			$scope.dataPresetList.filter(function(preset) {
				return preset.guid == $scope.currentPreset.guid;
			}).first().name = newval;
		});
	}

	$scope.New = function() {
		var name = prompt($translate('$S_msg_NewPresetName'));
		if(name == undefined || name === '') return;
		
		var newguid = serviceUtility.generateType2();
		SavePreset(newguid, name, { 
			'layout': [{
				'blank': true,
				'guid': undefined,
				'w': 100
			}],
			'widgets': []
		}).success(function() {
			LoadPreset(newguid);
		})
	}

	function NewInnerPreset(newguid, el, parent) {
		SavePreset(newguid, newguid, { 
			'layout': [{
				'guid': undefined,
				'w': 100,
				'blank': true
			}],
			'widgets': []
		}, false, parent).success(function() {
			LoadPreset(newguid, el);
		})
	}

	$scope.AlertRemove = function() {
		$('.removePreset')[0].showDialog();
	}

	$scope.CancelRemove = function() {
		$('.removePreset')[0].hideDialog();
	}

	$scope.Remove = function() {
		var amIRoot = serviceSession.whoAmI() === 'root';
		RemovePresets($scope.currentPreset.guid).success(function() {
			LoadPreset( ( amIRoot ? 'autosave' : ('autosave_' + serviceSession.whoAmI()) ) );
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

		// $scope.$apply();
	}

	$scope.Load = function(preset) {
		LoadPreset(preset.guid);
	}

	function Init() {
		var hasAutosave = false;

		GetPresetList(function() {
			for (var i = $scope.dataPresetList.length - 1; i >= 0; i--) {
				if($scope.dataPresetList[i].guid.indexOf("autosave") === 0) {
					hasAutosave = true;
					LoadPreset($scope.dataPresetList[i].guid);
					break;
				}
			};

			if(!hasAutosave) {
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
		if($scope.chartType.name === 'wordcloud') {
			$('.qr2.qr-selectable')[0].getColumns(function(cols) {
				eventSender.dashboard.initWordCloud(cols, $scope.qresult);
				fn.call($scope, {
					'cols': cols
				});
			});
		}
		else {
			// 바인딩 화면에 컬럼 정보를 넘겨줍니다.
			$('.qr2.qr-selectable')[0].getColumns(function(cols) {
				fn.call($scope, {
					'cols': cols,
					'result': $scope.qresult
				});
			});			
		}

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
				'name': obj.name,
				'nullToZero': obj.nullToZero
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
					'name': obj.name,
					'nullToZero': obj.nullToZero
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

function NewWidgetWizardController($scope, $filter, $translate, eventSender, serviceUtility, $translate) {
	$scope.numCurrentPage = 0;
	$scope.numPagerPagesize = 100;
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
		$scope.isPageLoaded = false;
		$scope.moreCol = false;
		var newWidgetWin = $('.newWidget').removeClass(makeRemoveClassHandler(/^step/));
		newWidgetWin[0].showDialog();
			
		$scope.go(0);
		$('.wiz-next.btn:first').focus();
		//$scope.ctxWidget = getDefaultContext('grid');
		$scope.qresult = null;
		$scope.qrCols = null;
	}

	$scope.qresult;
	$scope.qrCols;
	$scope.isPageLoaded = false;

	var isStopped = false;

	$scope.isOnError = false;
	$scope.errorType;
	$scope.errorNote;
	$scope.inputOnError = function(type, note) {
		$('.qr1')[0].hideTable();
		$scope.errorType = type;
		$scope.errorNote = note;
		$scope.isOnError = true;
		$scope.isPageLoaded = false;
	}

	$scope.inputOnloading = function() {
		$('.qr1')[0].hideTable();
		$('.qr1')[0].newSearch();
		isStopped = false;
		$scope.isOnError = false;
		$scope.errorType = undefined;
		$scope.errorNote = undefined;
	}
	
	$scope.inputOnStatusChange = function(m, instance) {
		console.log(m)
		if( (m.body.type === 'eof') || ((m.body.type === 'status_change') && m.body.count > $scope.numPagerPagesize) ) {
			if(isStopped) return;
			instance.stop(); // instant search
			isStopped = true;

			$('.qi1')[0].offset(0, $scope.numPagerPagesize, function() {

				$('.qr2.qr-select-table')[0].getColumns(function(cols) {
					// console.log('getColumns')
					$scope.qrCols = cols;
					$('.qr1')[0].showTable();
					$scope.isPageLoaded = true;

					$('.wiz-next.btn:eq(1)').focus();
				});

				$scope.$apply();
			});
		}
	}

	var wtypes = [
		{
			'name': 'table',
			's0next': 1,
			's0prevCallback': function() {
				$scope.isPageLoaded = false;
			},
			's0nextCallback': function() {
				$scope.ctxWidget = getDefaultContext('grid');
				$('.qr1')[0].hideTable();
				setTimeout(function() {
					$('query-input textarea').focus();	
				}, 250);
				
			},
			's1next': 2,
			's1nextEvent': function() {
				return function() {
					return $scope.isPageLoaded;
				}
			},
			's3prev': 2
		},
		{
			'name': 'graph',
			's0next': 1,
			's0prevCallback': function() {
				$scope.isPageLoaded = false;
			},
			's0nextCallback': function() {
				$scope.ctxWidget = getDefaultContext('chart');
				$('.qr1')[0].hideTable();
				setTimeout(function() {
					$('query-input textarea').focus();	
				}, 250);
			},
			's1next': 4,
			's1nextEvent': function() {
				return function() {
					return $scope.isPageLoaded;
				}
			},
			's4next': function() {
				return $scope.chartType.nextType;
			},
			's4nextEvent': function() {
				return eventSender.dashboard.onSelectColumnFinishing;
			},
			's4nextCallback': function() {
				if($scope.chartType.name === 'wordcloud') {
					$scope.ctxWidget.type = 'wordcloud';
					delete $scope.ctxWidget.data.label;
					delete $scope.ctxWidget.data.series;
					console.log('s4nextCallback wordcloud')
					return function() {
						eventSender.dashboard.onSelectColumnFinished(function(sender) {
							$scope.ctxWidget.data.text = sender.cols.filter(function(col) { return col.type === 'string' }).first().name;
							$scope.ctxWidget.data.size = sender.cols.filter(function(col) { return col.type === 'number' }).first().name;
						});
					};
				}
				else {
					return eventSender.dashboard.onChartBindingStarting;
				}
			},
			's5nextCallback': function() {
				dataChart = eventSender.dashboard.onSendChartDataWizard();
				return;
			},
			's3prev': function() {
				return $scope.chartType.nextType;
			}
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
		var el = $('.dashboard-container .wizard li.wiz-step').removeClass('active')[page];
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
			if($scope.chartType.name === 'wordcloud') {
				submitWordCloud();
			}
			else {
				submitGraph();	
			}
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
			'invalid_msg': $translate('$S_msg_SelectOneMoreNumberType'),
			'nextType': 5
		},
		{
			'name': 'line',
			'required': ['number'],
			'invalid_msg': $translate('$S_msg_SelectOneMoreNumberType'),
			'nextType': 5
		},
		{
			'name': 'pie',
			'required': ['number'],
			'invalid_msg': $translate('$S_msg_SelectOneMoreNumberType'),
			'nextType': 5
		},
		{
			'name': 'wordcloud',
			'required': ['number', 'string'],
			'one': ['number', 'string'],
			'invalid_msg': '하나의 문자열, 하나의 숫자 컬럼이 필요합니다.',
			'nextType': 6
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
			var s = {
				'color': obj.color,
				'name': obj.name,
				'key': obj.value.name
			}

			if( !obj.nullToZero ) {
				return s;
			}
			else {
				s['nullToZero'] = obj.nullToZero;
				return s;
			}
		});

		$scope.ctxWidget.data.type = dataChart.type;
		console.log($scope.ctxWidget)
		eventSender.dashboard.onCreateNewWidgetAndSavePreset($scope.ctxWidget);
		$('.newWidget')[0].hideDialog();
	}

	function submitWordCloud() {
		console.log($scope.ctxWidget);
		eventSender.dashboard.onCreateNewWidgetAndSavePreset($scope.ctxWidget);
		$('.newWidget')[0].hideDialog();
	}

}
function WordCloudController($scope, socket, eventSender, serviceChart) {
	eventSender.dashboard.initWordCloud = function(cols, result) {
		var colNameString = cols.filter(function(col) { return col.type === 'string' }).first().name;
		var colNameNumber = cols.filter(function(col) { return col.type === 'number' }).first().name;

		serviceChart.getWordCloud(result, colNameNumber, colNameString, '.cloud-preview');
	}
}

function WidgetPropertyController($scope, eventSender) {
	var presetId, widgetId;
	var w;

	eventSender.dashboard.setWidgetProperty = function(_w, _presetId) {
		w = _w;
		$scope.query = w.getQuery();
		$scope.interval = w.getInterval();
		$scope.name = w.getName();

		presetId = _presetId;
		widgetId = w.id;
	}

	$scope.updateWidgetProperty = function() {
		w.setInterval($scope.interval);
		eventSender.dashboard.updateWidgetProperty({
			'presetId': presetId,
			'widgetId': widgetId,
			'interval': $scope.interval,
			'callback': function() {
				$('.propertyWidget')[0].hideDialog();		
			}
		});
	}

	$scope.cancelUpdateWidgetProperty = function() {
		$('.propertyWidget')[0].hideDialog();
	}
}
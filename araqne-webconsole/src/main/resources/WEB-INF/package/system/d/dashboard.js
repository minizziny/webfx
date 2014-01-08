
function debounce(fn, delay) {
	var timer = null;
	return function () {
		var context = this, args = arguments;
		clearTimeout(timer);
		timer = setTimeout(function () {
			fn.apply(context, args);
		}, delay);
	};
}

$(document).on("selectstart", function() { return false; });

function DashboardController($scope, $filter, $element, $translate, eventSender) {
	$scope.getPid = eventSender.d.pid;
	eventSender.d.$event.on('unload', function() {
		console.log('--- unload 2 dashboard!');
		var widgets = angular.element($element.find('widget'));
		for(var i = 0; i < widgets.length; i++) {
			console.log( angular.element( widgets[i] ).scope() );

			angular.element( widgets[i] )[0].$dispose();

		}
		
	})

	$scope.openNewWidget = function() {
		eventSender.d.onOpenNewWidget();
	}

	$scope.formSecond = {
		'0': $translate('$S_str_Seconds'),
		'one': $translate('$S_str_Second'),
		'other': $translate('$S_str_Seconds')
	}

	$scope.numCurrentPage = 0;
	$scope.numPagerPagesize = 100;

	$scope.onRemoveWidget = function(guid) {
		// eventSender.dashboard.onRemoveSingleWidget(guid);
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

		var widgets = $scope.currentPreset.state.widgets;
		for (var i = widgets.length - 1; i >= 0; i--) {
			if(widgets[i].guid == guid) {
				widgets.splice(i, 1);
				break;
			}
		};

		eventSender.dashboard.onCurrentPresetChanged(); // save state
	}

	eventSender.dashboard.onCreateNewWidgetAndSavePreset = function(ctx) {
		// no exist widgets array
		if(!$scope.currentPreset.state.widgets) {
			$scope.currentPreset.state["widgets"] = [];
		}

		$scope.currentPreset.state.widgets.push(ctx);
		eventSender.dashboard.onCreateNewWidget(ctx);

		eventSender.dashboard.onCurrentPresetChanged(); // save state
	}

	eventSender.dashboard.onCreateNewWidget = function(ctx) {
		var el = angular.element('.k-d-col[dock-id=' + ctx.guid + '] .contentbox');

		// $('<button class="btn">+_+</button>').on('click', function() {
		// 	alert('clicke!!!' + ctx.guid);
		// }).appendTo(el);
		var widget = angular.element('<widget ng-pid="getPid" guid="' + ctx.guid + '" on-remove="onRemoveWidget(\'' + ctx.guid + '\')"></widget>');
		$compile(widget)($scope);
		widget[0].setContext(ctx);

		widget.appendTo(el)
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
			if(!m.body.preset.state.layout) {
				var widgets = m.body.preset.state.widgets;
				m.body.preset.state.layout = layoutEngine.ui.layout.autoLayout(widgets);
			}
			
			$scope.currentPreset = m.body.preset;

			ClearPreset();

			var layout = m.body.preset.state.layout;
			function getRoot(resizable) {
				console.warn('getRoot')
				console.log(resizable);
				console.trace()

				
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
						if(!!widget.highchart) {
							var parent = $(widget).parents('.contentbox');
							widget.highchart.setSize(parent.width(), parent.height() - 10, false);
						}
					}

					curr.find('.widget').each(resizeCharts);
					effsn.find('.widget').each(resizeCharts);
					effsp.find('.widget').each(resizeCharts);
					
					console.log(effsn[0])
					// console.log(resizable.el.next()[0])
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
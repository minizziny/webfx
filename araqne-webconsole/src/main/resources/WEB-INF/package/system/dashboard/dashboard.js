var app = angular.module('dashboard', ['myApp', 'logdb']);
var proc;

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
			var z = serviceLogdb.create(pid);
			
			textarea.on('keydown', function(e) {
				if (e.type === 'keydown' && e.keyCode === 13) {
					e.preventDefault();
					search();
				}
			});
			
			element.find('.search').on('click', search);

			function search() {
				
				var queryValue = textarea.data('$ngModelController').$modelValue;

				z.query(queryValue)
				.pageLoaded(function(m) {
					//console.log(z.id(), 'pageLoaded', m)
					scope[attrs.ngModel] = m.body.result;
					scope.$apply();
				})
				.loaded(function(m) {
					//console.log(z.id(), 'loaded', m)

					z.dispose();
				})
				.failed(function(m) {
					alert('쿼리를 시작할 수 없습니다. 잘못된 쿼리입니다.')
				})
			}

		}
	}
});

app.directive('queryResult', function($compile) {
	return {
		restrict: 'E',
		template: '<table class="cmpqr table table-striped table-condensed"><thead><tr><th ng-hide="col.name==\'$$hashKey\' || !col.is_visible" ng-repeat="col in qrDataColumnsOrder">{{col.name}}</th></tr></thead>' + 
			'<tbody><tr ng-repeat="d in qrData"><td ng-hide="col.name==\'$$hashKey\' || !col.is_visible" ng-repeat="col in qrDataColumnsOrder">{{d[col.name]}}</td></tr></tbody></table>',
		link: function(scope, element, attrs) {
			scope.qrDataColumns = [];
			scope.qrDataColumnsOrder = [];
			scope.qrData = [];

			scope.$watch(attrs.ngModel, function() {
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
						'is_visible': true
					});
				}
			});
		}
	}
});

app.directive('widget', function($compile, serviceLogdb, eventSender) {
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			scope[attrs.guid] = {
				data: [],
				interval: parseInt(attrs.interval)
			};

			if(attrs.type == 'grid') {
				var template = angular.element('<div class="widget"><h5 style="float:left">' + attrs.name + '</h5>' +
					'<button style="margin-left: 10px" class="close">&times;</button>' +
					'<span style="float:right"><input type="number" min="5" style="width:80px" ng-model="' + attrs.guid + '.interval" /></span>' + 
					'<table class="cmpqr table table-striped table-condensed"><thead><tr><th ng-repeat="col in ' + attrs.fields + '">{{col}}</th></tr></thead>' +
					'<tbody><tr ng-repeat="d in ' + attrs.guid + '.data"><td ng-repeat="col in ' + attrs.fields + '">{{d[col]}}</td></tr></tbody></table></div>');
				$compile(template)(scope);
				element.append(template);
				
				var z = serviceLogdb.create(proc.pid);
				var timer;

				function query() {
					console.log('--------------------')
					z.query(attrs.query)
					.pageLoaded(function(m) {
						//console.log(z.id(), 'pageloaded', m)
						scope[attrs.guid].data = m.body.result;
						scope.$apply();

						clearTimeout(timer);
						timer = null;
						timer = setTimeout(query, Math.max(5000, scope[attrs.guid].interval * 1000) );
					})
					.loaded(function(m) {
						z.dispose();
					});
				}

				query();

				function dispose() {
					z.dispose();
					clearTimeout(timer);
					timer = null;
					element.remove();
				}

				template.find('button.close').on('click', function() {
					eventSender.onRemoveSingleWidget(attrs.guid);
					dispose();
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
		onRemoveSingleWidget: null
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

function PresetController($scope, $compile, socket, eventSender) {
	eventSender.onCurrentPresetChanged = function() {
		console.log('currentPreset changed')

		console.log($scope.currentPreset);
		return SavePreset($scope.selectedPreset.guid, $scope.selectedPreset.name, $scope.currentPreset.state);
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
		var orderstr = "['" + ctx.data.order.join("','") + "']";
		var query = ctx.data.query;
		var widget = angular.element('<widget guid="' + ctx.guid + '" name="' + ctx.name + '" type="' + ctx.type + '" interval="' + ctx.interval + '" query="' + query + '" fields="' + orderstr + '" >');
		$compile(widget)($scope);
		$('.board').append(widget)
	}

	$scope.dataPresetList = [];
	$scope.selectedPreset;
	$scope.currentPreset;

	$scope.$watch('selectedPreset', function(preset) {
		if(preset == undefined) return;
		LoadPreset(preset.guid);
	});


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
		return socket.send("org.logpresso.core.msgbus.WallPlugin.setPreset", 
			{ "guid": guid, "name": name, "state": state }
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

	function NewPreset(name) {
		return socket.send("org.logpresso.core.msgbus.WallPlugin.setPreset", 
			{ "guid": name, "name": name, "state": { "widgets": [] } }
		, proc.pid);
	}

	function RemovePresets() {
		var args = Array.prototype.slice.call(arguments, 0);
		return socket.send("org.logpresso.core.msgbus.WallPlugin.removePresets", 
			{ "guids": args }
		, proc.pid);
	}

	function Init() {

		GetPresetList(function() {
			for (var i = $scope.dataPresetList.length - 1; i >= 0; i--) {
				if($scope.dataPresetList[i].guid == "autosave") {
					$scope.selectedPreset = $scope.dataPresetList[i];
					break;
				}
			};

			if($scope.selectedPreset == undefined) {
				console.log("InitAutosave");
				InitAutosave().success(Init);
			}

			$scope.$apply();
		});

	}

	Init();
	//RemovePresets('autosave')
}

function WizardController($scope, eventSender) {

	function guidGenerator() {
		var s4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		return ('w'+s4()+s4()+s4()+s4());
	}
	
	function getDefaultContext() {
		return {
			'name': '',
			'guid': guidGenerator(),
			'interval': 15,
			'type': 'grid',
			'data': {
				'order': undefined,
				'query': ''
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
		$scope.ctxWidget = getDefaultContext();
		$scope.qresult = null;
	}

	$scope.qresult;
	$scope.widgetType = 'table';

	$scope.ctxWidget = getDefaultContext();

	$scope.shift = function(i, item) {
		$scope.qrDataColumnsOrder.splice(i, 1);
		$scope.qrDataColumnsOrder.splice(i + 1, 0, item);
	}

	$scope.unshift = function(i, item) {
		$scope.qrDataColumnsOrder.splice(i, 1);
		$scope.qrDataColumnsOrder.splice(i - 1, 0, item);
	}

	$scope.go = function(page) {
		var el = $('.wizard li.wiz-step').removeClass('active')[page];
		$(el).addClass('active');
		$('.newWidget')
			.removeClass(makeRemoveClassHandler(/^step/))
			.addClass('step' + page);
	}

	$scope.submit = function() {
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
}
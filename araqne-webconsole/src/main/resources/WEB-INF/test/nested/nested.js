var logpresso = angular.module('app', [
	'ngRoute',
	'app.directive',
	'app.directive.logdb',
	'app.directive.tree',
	'app.directive.validation',
	'app.filter',
	'app.connection',
	'app.connection.session',
	'app.chart',
	'app.dom',
	'app.program',
	'app.logdb',
	'app.logdb.management',
	'pascalprecht.translate',
	'ui.sortable',
	'resettableForm',

	'app.directive.widget'
], function($routeProvider) {
});


angular.module('app.directive.widget', [])
.directive('widgetTarget', function() {
	return {
		restrict: 'A',
		require: ['ngModel'],
		link: function(scope, el, attrs, ctrl) {
			
		}
	}
})
.directive('dockpanel', function() {
	return {
		restrict: 'E',
		require: 'ngModel',
		scope: {
			'ngModel': '=',
			'onDragbox': '&',
			'onDropbox': '&'
		},
		controller: function($scope, $element) {
			this.append = function(model, detached) {
				var contentbox = $element.find('[dock-id=' + model.guid + '] > .mybox > .contentbox');
				// 이때 append되지 않은건 버려짐.
				if(contentbox.length) {
					console.log('append widget', detached[0].id, model.guid);
					contentbox.append(detached);	
				}
			}
		},
		link: function(scope, el, attrs, ctrl) {
			console.log('linking dockpanel');
			var cached;

			function cache() {
				// 이 시점에선 dockpanel 아래의 link된 widget을 캐시하는 것이 아니고,
				// 이미 append된 widget들을 캐시한다. link됐으나 append되지 않은건 이미 아까 사라짐.
				cached = el.find('widget').detach();
				console.log('cache', cached.length, 'item cached');
			}

			function restore() {
				if(!cached.length) return;
				console.log('restore');

				cached.each(function(i, widget) {
					var guid = angular.element(widget).attr('guid');

					var contentbox = el.find('[dock-id=' + guid + '] > .mybox > .contentbox');
					if(contentbox.length) {
						// 이때 append되지 않은건 버려짐.
						console.log('restore widget', widget.id, guid);
						contentbox.append(widget);
					}
				});

				cached = undefined;
			}

			function render(layout) {
				cache();
				el.empty();
				console.log('---render---')
				
				var _box = layoutEngine.ui.layout.box.create(layout, false, {
					'onDragbox': function(box, em, ed) {
						return scope.onDragbox({
							'$box': box,
							'$moveevent': em,
							'$downevent': ed
						});
					},
					'onDropbox': function(box, event) {
						return scope.onDropbox({
							'$box': box,
							'$event': event
						});
					}
				});
				_box.appendTo(el);
				restore();
			}

			scope.$watch('ngModel', function(val) {
				console.log('ngModel changed', attrs.id);
				render(val);
			});
		}
	}
})
.directive('widget', function($timeout) {
	return {
		restrict: 'E',
		scope: {
		},
		transclude: 'element',
		replace: true,
		require: ['?^dockpanel', '?ngModel'],
		template: '<div ng-transclude></div>',
		link: function(scope, el, attrs, ctrl, transclude) {
			transclude(scope, function(elc, scopec) {
				console.log('linking widget', attrs.id);
				var ctlrDockpanel = ctrl[0];
				var ctlrModel = ctrl[1];

				if(!!ctlrDockpanel) {
					// DockPanel 밑에 있는 widget들은 append 보류
					var detached = el.detach();
				}

				scope.hello = 'world';
				// console.log(ctlrModel.$modelValue); // 여기엔 모델이 없다.

				if(!!ctlrDockpanel) {

					$timeout(function() {
						// ngModel이 활성화되는 시점
						
						// console.log(ctlrModel.$modelValue);
						angular.extend(scope, ctlrModel.$modelValue);
						scope.hello = ctlrModel.$modelValue.type + '/' + ctlrModel.$modelValue.guid;

						el.attr('guid', ctlrModel.$modelValue.guid);
						ctlrDockpanel.append(ctlrModel.$modelValue, detached);
					});

				}

				el.children('widget').replaceWith(elc);
			});
		}
	}
})
.directive('widgetDroppable', function($compile) {
	return {
		restrict: 'A',
		link: function(scope, el, attrs) {
			// el.css('border', '1px solid red');
			el.addClass('drop-tab');

			var padding = el.css('padding');
			var dropzone = angular.element('<div class="widget-drop-zone">' + el[0].innerHTML + '</div>');
			dropzone.css('padding', padding);
			$compile(dropzone)(scope);
			el.append(dropzone);

		}
	}
})
.factory('serviceWidget', function() {
	var widgets = [];
	
	function buildWidget(json) {
		if(json.type === 'tabs') {
			return '<widget id="' + json.guid + '" ng-model="ctxz.' + json.guid + '">' + 
				'<div class="tab-comp" style="height: 100%">' +
					'<ul class="nav nav-tabs" style="margin-bottom: 0">' +
						'<li ng-repeat="tab in data.tabs" ng-class="{\'active\': tab.is_active}"><a tab-id="{{tab.guid}}" href=".tab-content .{{tab.guid}}" data-toggle="tab" widget-droppable>{{tab.name}}</a></li>' +
					'</ul>' +
					'<div class="tab-content" style="height: calc(100% - 4px)">' +
						'<div ng-repeat="tab in data.tabs"  style="height:100%" ng-class="{\'active\': tab.is_active}" class="tab-pane {{tab.guid}}">' + 
							'<div ng-switch on="tab.type" style="height:100%" class="content-switch-container">' +
								'<div ng-switch-when="dockpanel" style="height:100%"><dockpanel on-dragbox="$parent.$parent.$parent.onDragInnerbox($box, $moveevent, $downevent)" on-dropbox="$parent.$parent.$parent.onDropbox($box, $event)"  ng-model="tab.contents.layout[0]"></dockpanel></div>' + 
								'<div ng-switch-when="html" style="height:100%">{{tab.contents}}</div>' + 
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</widget>';
		}
		else {
			return '<widget id="' + json.guid + '" ng-model="ctxz.' + json.guid + '"><div>{{hello}} {{1+1}}</div></widget>';	
		}
	}
	
	return {
		buildWidget: buildWidget
	}
})
;

logpresso.config(['$translateProvider', function ($translateProvider) {
	$translateProvider.useStaticFilesLoader({
		prefix: '/locales/system.',
		suffix: '.json'
	});

	$translateProvider.preferredLanguage('ko');
	$translateProvider.fallbackLanguage('en');
}]);

logpresso.factory('eventSender', function() {
	var e = {};
	return e;
});



function DashboardController($scope, $http, $compile, $timeout, serviceWidget) {

	$http.get('../dashboard/getPreset1.json')
	.success(function(data) {
		var m = data[1];

		$scope.ctxz = {};
		$scope.dataLayout = m.preset.state.layout[0];
		var el = angular.element('<dockpanel id="dp" on-dragbox="onDragbox($box, $moveevent, $downevent)" on-dropbox="onDropbox($box, $event)" ng-model="dataLayout"></dockpanel>');

		var widgets = m.preset.state.widgets;

		widgets.forEach(function(widget) {
			var elWidget = angular.element(serviceWidget.buildWidget(widget));
			$scope.ctxz[widget.guid] = widget;
			elWidget.appendTo(el);
		});

		console.log(el[0]);

		$compile(el)($scope);
		el.appendTo('.dashboard-container');

		$timeout(function() { console.clear(); }, 400);

		// setTimeout(function() {
		// 	$scope.dataLayout = dataLayout2;
		// 	$scope.$apply();
		// }, 4000)
		
	});

	var isEnter = false;
	var timer;
	var a;

	$scope.onDragbox = function(box, e, ed) {
		
		var found = findElementsByCoordinate(["droppable", "widget-drop-zone"], e);
		$('#lelen').text(found.length);
		if(found.length) {
			console.log('onDragbox');

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
					a.click().removeClass('over');
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
	}

	function onEnterDroppableTab(a, box, e, ed) {
		if($('.k-d-col.virtual').length == 0) {
			var w = box.el.width(), h = box.el.height();
			box.el.clone()
				.addClass('virtual')
				.width(w)
				.height(h)
				.css('top', e.pageY - ed.offsetY)
				.css('left', e.pageX - ed.offsetX)
				.appendTo('body');
		}
		else {
			
		}
		a.click().removeClass('over');

		if($('.k-d-col.virtual').length != 0) {
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
			
			// debugger;
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

		$('.k-d-col.virtual').css('top', e.pageY - ed.offsetY).css('left', e.pageX - ed.offsetX)
	}

	$scope.onDropbox = function(box, e) {
		// console.log('dropped!')
		$('.k-d-col.virtual').remove();
	}

	
	$scope.blank = { 'hellob': 'w81606f23386b1aaf' }
	$scope.blank2 = { 'hellob': 'w09ab1248d623c426' }
	$scope.blank3 = { 'hellob': 'w722fdd559a83334azzz' }
	$scope.blank4 = { 'hellob': 'zzz' }

	$scope.dataLayout = { 'rows': [ 
		{ 
			'cols': [
				{
					'w': 100,
					'guid': 'w09ab1248d623c426'
				}
			],
			'h': 100
		}
	], 'w': 100 };

	var dataLayout2 = {
		"rows": [
			{
				"cols": [
					{
						"w": 100,
						"guid": "wbdd7a61cb7186f0a"
					}
				],
				"h": 50
			},
			{
				"cols": [
					{
						"w": 100,
						"guid": "w722fdd559a83334a"
					}
				],
				"h": 30
			},
			{
				"cols": [
					{
						"w": 100,
						"guid": "w09ab1248d623c426"
					}
				],
				"h": 20
			}
		],
		"w": 100,
		"guid": "y"
	}

	$scope.dataLayoutFull = {
		"rows": [
			{
				"cols": [
					{
						"w": 25,
						"rows": [
							{
								"cols": [
									{
										"w": 100,
										"guid": "wd4324f3da4e9c967"
									}
								],
								"h": 50
							},
							{
								"cols": [
									{
										"w": 100,
										"guid": "kkk"
									}
								],
								"h": 30
							},
							{
								"cols": [
									{
										"w": 100,
										"guid": "xxx"
									}
								],
								"h": 20
							}
						],
						"guid": "a"
					},
					{
						"w": 50,
						"guid": "w722fdd559a83334a"
					},
					{
						"w": 25,
						"guid": "wbdd7a61cb7186f0a"
					}
				],
				"h": 50
			},
			{
				"cols": [
					{
						"w": 50,
						"guid": "w0b624b9e068264d0"
					},
					{
						"w": 50,
						"guid": "zzz"
					}
				],
				"h": 50
			}
		],
		"w": 100,
		"guid": "root"
	}

	
}

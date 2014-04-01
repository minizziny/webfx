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

	$scope.ctxPreset = {};

	$http.get('../dashboard/getPreset1.json').success(getPresetWidgets(
		'getPreset1',
		angular.element('.dashboard-container'),
		function() {
			// $timeout(function() { console.clear(); }, 400);

			// setTimeout(function() {
			// 	$scope.dataLayout = dataLayout2;
			// 	$scope.$apply();
			// }, 4000)
		}
	));

	function getPresetWidgets(name, target, callback) {
		return function(data) {
			var m = data[1];

			$scope.ctxPreset[name] = {
				ctxWidget: {},
				dataLayout: m.preset.state.layout[0]
			}
			var el = angular.element('<dockpanel id="' + name + '" on-dragbox="onDragbox($box, $moveevent, $downevent)" on-dropbox="onDropbox($box, $event)" ng-model="ctxPreset.' + name + '.dataLayout"></dockpanel>');

			var widgets = m.preset.state.widgets;

			widgets.forEach(function(widget) {
				var elWidget = angular.element(serviceWidget.buildWidget(name, widget));
				$scope.ctxPreset[name].ctxWidget[widget.guid] = widget;
				elWidget.appendTo(el);
			});

			console.log(el[0]);

			$compile(el)($scope);

			$timeout(function() {
				el.appendTo(target);

				if(!!callback) {
					callback();
				}
			});
			
		}
	}

	$scope.activeTab = function(tab, e) {
		var pane = angular.element(e.target).parents('.tab-comp').find('.tab-pane.' + tab.guid);
		if(tab.type === 'dockpanel') {
			if( angular.isString(tab.contents) ) {
				if(!pane.data('isLoaded')) {
					$http.get('../dashboard/' + tab.contents + '.json').success(getPresetWidgets(
						tab.contents,
						pane,
						function() {
							pane.data('isLoaded', true)
						}
					));
				}
			}
		}
	}

	var z = 0;

	$scope.addTab = function(tabdata, e) {
		tabdata.push({
			'name': 'hello',
			'guid': 'world' + (z++).toString(),
			'type': 'dockpanel',
			"contents": {
				"layout": [
					{
						'guid': undefined,
						'w': 100,
						'blank': true
					}
				]
			}
		});
		$timeout(function() {
			$(e.target).parents('li').prev().children('a').click();
		});
	}

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

	$scope.dataLayout = {
		'layout': [
			{ 'rows': [ 
				{ 
					'cols': [
						{
							'w': 100,
							'guid': 'w09ab1248d623c426'
						}
					],
					'h': 100
				}
			], 'w': 100 }
		]
	}

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

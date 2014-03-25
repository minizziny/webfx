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
.provider('widgetRegistry', function($interpolateProvider) {
	var widgets = [];
	
	function WidgetRegistry() {
		var self = this;
		this.add = function(widget) {
			widgets.push(widget);
			// console.log(widgets);
		}

		this.getScope = function(id) {
			return self.getWidget(id).scope();
		}

		this.getWidget = function(id) {
			var ret = widgets.filter(function(widget) {
				return widget.attrs.id === id
			}).first();
			console.log(id, ret)
			return ret.attrs.$$element;
		}
	}

	this.$get = function() {
		return new WidgetRegistry();
	}
})
.factory('serviceWidget', function($interpolate) {
	var widgets = [];
	
	function buildWidget(json) {
		if(json.type === 'tabs') {
			return '<widget id="' + json.guid + '" ng-model="ctxz.' + json.guid + '">' + 
				'<div class="tab-comp" style="height: 100%">' +
					'<ul class="nav nav-tabs" style="margin-bottom: 0">' +
						'<li ng-repeat="tab in data.tabs" ng-class="{\'active\': tab.is_active}"><a href=".tab-content .{{tab.guid}}" data-toggle="tab">{{tab.name}}</a></li>' +
					'</ul>' +
					'<div class="tab-content" style="height: 85%">' +
						'<div ng-repeat="tab in data.tabs"  style="height:100%" ng-class="{\'active\': tab.is_active}" class="tab-pane {{tab.guid}}">' + 
							'<div ng-switch on="tab.type" style="height:100%" class="content-switch-container">' +
								'<div ng-switch-when="dockpanel" style="height:100%"><dockpanel ng-model="tab.contents.layout[0]"></dockpanel></div>' + 
								'<div ng-switch-when="html" style="height:100%">{{tab.contents}}</div>' + 
							'</div>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</widget>';
		}
		else {
			return '<widget id="' + json.guid + '" ng-model="ctxz.' + json.guid + '"><div>{{guid}} {{1+1}}</div></widget>';	
		}
	}
	
	function registerWidget(widget) {
		widgets.push(widget[0])
	}

	function getWidget(id) {
		return widgets.filter(function(w) {
			return w.id === id;
		}).first();
	}

	return {
		buildWidget: buildWidget,
		registerWidget: registerWidget,
		getWidget: getWidget
	}
})
.directive('widgetTarget', function(widgetRegistry, $parse) {
	return {
		restrict: 'A',
		require: ['ngModel'],
		link: function(scope, el, attrs, ctrl) {
			var target = attrs.widgetTarget.match(/^([\u00c0-\u01ffa-zA-Z\_\-0-9])+/);
			var lhs = attrs.widgetTarget.split(target[0] + '.')[1];

			scope.$watch(attrs.ngModel, function(val) {
				if(val != undefined) {
					var targetScope = widgetRegistry.getScope(target[0]);
					console.log(targetScope)

					var model = $parse(lhs);
					// console.log(model(targetScope));
					try {
						model.assign(targetScope, val);	
					}
					catch(e) {
						console.log(e)
					}
				}
			});
			
		}
	}
})
.directive('widget', function(widgetRegistry, $timeout, $compile, serviceWidget) {
	return {
		restrict: 'E',
		scope: true,
		require: 'ngModel',
		compile: function(tel, tattrs) {
			return {
				pre: function(scope, el, attrs, ctrl) {
					widgetRegistry.add({
						'attrs': attrs
					});
				},
				post: function(scope, el, attrs, ctrl) {
					$timeout(function() {
						var elModel = angular.element('<div>{{guid}} / {{name}}</div>').prependTo(el);
						$compile(elModel)(scope);

						if(el.has('dockpanel')) {
							el.css('width', '100%').css('height', 'calc(100% - 20px)');
						}

						scope.$apply(function() {
							// console.log(ctrl.$modelValue);
							angular.extend(scope, ctrl.$modelValue);

							var w = serviceWidget.getWidget(scope.guid);
							var kdcol = $('[dock-id=' + scope.guid + '] .contentbox:last');
							angular.element(w).appendTo(kdcol);
							// console.log('make widget', w)
						});
					})

				}
			}
		}
	}
})
.directive('dockpanel', function($timeout) {
	return {
		restrict: 'E',
		require: 'ngModel',
		scope: {
			'model': '=ngModel'
		},
		link: function(scope, el, attrs, ctrl) {
			scope.widgets = [];
			
			scope.$watch('model', function(mdl) {
				el.find('widget').each(function(i, widget) {
					scope.widgets.push(widget);
					$(widget).detach();
				});
				console.log(scope.widgets)
				el.empty();

				console.warn(attrs.id, ctrl.$modelValue, scope.model)
				var box = layoutEngine.ui.layout.box.create(scope.model, false);
				var $el = $('<div class="dp" style="width:100%; height:100%"></div>');
				$el.appendTo(el);
				box.appendTo($el);

				$timeout(function() {
					scope.widgets.forEach(function(widget) {
						var kdcol = $('[dock-id=' + widget.id + '] .contentbox:last');
						$(widget).appendTo(kdcol);
					});
				});
			})
			
		}
	}
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



function WidgetController($scope, $http, serviceWidget, $compile) {

	$http.get('getPreset1.json')
	.success(function(data) {
		var m = data[1];
		console.log(m.preset)

		$scope.dataLayout = m.preset.state.layout[0];

		var widgets = m.preset.state.widgets;


		$scope.ctxz = {};
		
		var appendWidgetString = '';
		widgets.forEach(function(widget) {
			// appendWidgetString = appendWidgetString + serviceWidget.buildWidget(widget);
			serviceWidget.registerWidget( $compile(angular.element(serviceWidget.buildWidget(widget)))($scope) );
			// console.log(widget)
			$scope.ctxz[widget.guid] = widget;
		});

		// console.log(appendWidgetString)

		// var wz = $compile( angular.element(appendWidgetString) )($scope);
		// console.log('append widget')
		// wz.appendTo('#dp');
		



	})

	$scope.blank = {}

	$scope.sampleObject = {zzzz:[{
		hello: {
			world: 'sdfsfsdf'
		}
	}]};

	$scope.dataLayout = { 'rows': [ 
		{ 
			'cols': [
				{
					'w': 100
				}
			],
			'h': 100
		}
	], 'w': 100 };

	$scope.ddataLayout = {
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
										"guid": "a-b"
									}
								],
								"h": 30
							},
							{
								"cols": [
									{
										"w": 100,
										"guid": "a-c"
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
						"guid": "c"
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
						"guid": "w31c2319acaee45dd"
					}
				],
				"h": 50
			}
		],
		"w": 100,
		"guid": "root"
	}

	$scope.myLayout = {
		"rows": [
			{
				"cols": [
					{
						"w": 100,
						"guid": "y-a"
					}
				],
				"h": 50
			},
			{
				"cols": [
					{
						"w": 100,
						"guid": "y-b"
					}
				],
				"h": 30
			},
			{
				"cols": [
					{
						"w": 100,
						"guid": "y-c"
					}
				],
				"h": 20
			}
		],
		"w": 100,
		"guid": "y"
	}
}
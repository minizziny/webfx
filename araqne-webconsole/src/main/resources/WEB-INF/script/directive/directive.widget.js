console.widgetLog = function() {};

angular.module('app.directive.widget', [])
.directive('ngModelOnBlur', function() {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			'onChange': '&',
			'onCancel': '&ngCancel',
			'ngModelOnBlur': '&',
			'val': '=ngModel'
		},
		link: function(scope, element, attrs, ngModelCtrl) {
			if (attrs.type === 'radio' || attrs.type === 'checkbox') return;
			var cancel = false;
			var oldval;

			element.unbind('input').unbind('keydown.onBlur').unbind('change').unbind('focus.onFocus');
			element.bind('focus.onFocus', function(e) {
				oldval = element.val();
			})
			.bind('blur.onBlur', function(e) {
				var newval = ngModelCtrl.$viewValue;

				if(!cancel) {
					if(newval != oldval) {
						scope.onChange({
							'$event': e,
							'$new': newval,
							'$old': oldval
						});
						oldval = newval;
					}
				}
				
				scope.ngModelOnBlur({

				});
				cancel = false;
			})
			.bind('keydown.onBlur', function(e) {
				if(e.keyCode == 13) {
					this.blur();
				}
				else if(e.keyCode == 27) {
					cancel = true;

					ngModelCtrl.$setViewValue(oldval);
					element.val(oldval);
					scope.$apply();

					scope.onCancel({

					});
					this.blur();
				}
			});
		}
	}
})
.directive('clickToEdit', function() {
	return {
		restrict: 'A',
		scope: {
			'val': '=ngModel',
			'onCancel': '&ngCancel',
			'onChange': '&ngChange',
			'onToggle': '&ngToggle',
			'type': '='
		},
		template: '<input type="text" ng-model="val" style="display:none" ng-model-on-blur="onBlur()" on-change="onValueChange($event, $new, $old)" ng-cancel="onCancel()"></input><a ng-click="toggle()">{{val}}</a>',
		link: function(scope, element, attrs) {
			var elInput = element.find('input');
			var elA = element.find('a');

			if(attrs.type == 'number') {
				elInput.attr('type', 'number').attr('step', 'any')
			}

			scope.onBlur = function() {
				scope.toggle();
			}

			scope.onValueChange = function(e, newval, oldval) {
				if(newval === '' || newval == null) {
					scope.val = oldval;
					scope.$apply();
					return;
				}

				scope.onChange({
					'$event': e,
					'$new': newval,
					'$old': oldval
				});
			}

			scope.toggle = function() {
				elInput.toggle();
				elA.toggle();
				if(elA.is(':hidden')) {
					elInput.focus();
				}
				else {
					elA.css('display','');
				}

				scope.onToggle({});
			}
		}
	}
})
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
			'onDrag': '&',
			'onDrop': '&',
			'onAppend': '&',
			'onChange': '&',
			'onResize': '&'
		},
		controller: function($scope, $element) {
			this.append = function(model, detached) {
				var contentbox = $element.find('[dock-id=' + model.guid + '] > .mybox > .contentbox');
				// 이때 append되지 않은건 버려짐.
				if(contentbox.length) {
					console.widgetLog('append widget', detached[0].id, model.guid);
					contentbox.append(detached);	
				}
			}
		},
		link: function(scope, el, attrs, ctrl) {
			console.widgetLog('linking dockpanel');
			var cached;
			var cachedAsset;

			function cache() {
				// 이 시점에선 dockpanel 아래의 link된 widget을 캐시하는 것이 아니고,
				// 이미 append된 widget들을 캐시한다. link됐으나 append되지 않은건 이미 아까 사라짐.
				cached = el.find('widget').detach();
				cachedAsset = el.find('asset').detach();
				console.widgetLog('cache', cached.length, 'item cached');
				console.widgetLog('cache', cachedAsset.length, 'asset item cached');
			}

			function restore() {
				// if(!cached.length) return;
				console.widgetLog('restore', cachedAsset);

				cached.each(function(i, widget) {
					var guid = angular.element(widget).attr('guid');

					var contentbox = el.find('[dock-id=' + guid + '] > .mybox > .contentbox');
					if(contentbox.length) {
						// 이때 append되지 않은건 버려짐.
						console.widgetLog('restore widget', widget.id, guid);
						contentbox.append(widget);
					}
				});

				cachedAsset.each(function(i, asset) {
					var guid = angular.element(asset).data('guid');

					var contentbox = el.find('[dock-id=' + guid + '] > .mybox > .contentbox');
					if(contentbox.length) {
						// 이때 append되지 않은건 버려짐.
						console.widgetLog('restore asset', asset.id, guid);
						contentbox.append(asset);
					}
				})

				cached = undefined;
				cachedAsset = undefined;
			}

			function render(layout) {
				cache();
				el.empty();
				console.widgetLog('---render start---')

				var _box = layoutEngine.ui.layout.box.create(layout, false, {
					'onDrag': function(box, em, ed) {
						return scope.onDrag({
							'$box': box,
							'$moveevent': em,
							'$downevent': ed
						});
					},
					'onDrop': function(box, event, targetDockId) {
						return scope.onDrop({
							'$box': box,
							'$event': event,
							'$id': attrs.id,
							'$targetId': targetDockId
						});
					},
					'onAppend': function(box, event, targetDockId) {
						return scope.onAppend({
							'$box': box,
							'$event': event,
							'$id': attrs.id,
							'$targetId': targetDockId
						});
					},
					'onModify': debounce(function(box) {
						return scope.onChange({
							'$id': attrs.id,
							'$box': box
						});	
					}, 200),
					'onResize': function(row, box) {
						return scope.onResize({
							'$id': attrs.id,
							'$row': row,
							'$box': box
						});
					}
				});

				if(attrs.root === 'true') {
					_box.appendTo(el);
				}
				else {
					_box.appendTo(el, true);
				}
				
				restore();
			}

			var ew = scope.$watch('ngModel', function(val) {
				console.widgetLog('ngModel changed', attrs.id);
				if(angular.isObject(val)) {
					render(val);
					ew();
				}
			});
		}
	}
})
.directive('asset', function() {
	return {
		restrict: 'E',
		scope: {

		},
		transclude: true,
		template: '<div ng-transclude></div>',
		link: function(scope, el) {

		}
	}
})
.directive('widget', function($timeout, $compile) {
	return {
		restrict: 'E',
		scope: {
			'onClose': '&',
			'onChange': '&'
		},
		transclude: 'element',
		replace: true,
		require: ['?^dockpanel', '?ngModel'],
		template: '<div ng-transclude></div>',
		controller: function($scope, $element) {
			var self = this;
			this.isLoaded = false;

			$scope.$watch('isRunning', function(val) {
				var $el = $element.children('widget');
				if(val) {
					$el.addClass('w-running');
				}
				else {
					$el.removeClass('w-running');
				}
				console.widgetLog($el[0])
			})
			$scope.isRunning = false;

			this.load = function() {
				$element.removeClass('w-before-loading');
				$element.children('widget').removeClass('w-before-loading');
				self.isLoaded = true;
				$scope.isRunning = true;
				console.log($scope)
			}

			this.suspend = function() {
				$scope.isRunning = false;
			}

			this.resume = function() {
				$scope.isRunning = true;
			}
		},
		link: function(scope, el, attrs, ctrls, transclude) {
			transclude(scope, function(elc, scopec) {
				console.widgetLog('linking widget', attrs.id);
				var ctlrDockpanel = ctrls[0];
				var ctlrModel = ctrls[1];

				if(!!ctlrDockpanel) {
					// DockPanel 밑에 있는 widget들은 append 보류
					var detached = el.detach();
				}

				
				scope.closebox = function() {
					scope.onClose({
						'$id': attrs.id,
						'$target': el.parents('.k-d-col:first')
					});
				}

				scope.onWidgetTitleChange = function(newval, oldval, e) {
					scope.onChange({
						'$id': attrs.id,
						'$field': 'name',
						'$old': oldval,
						'$new': newval
					});
				}


				// console.widgetLog(ctlrModel.$modelValue); // 여기엔 모델이 없다.
				$timeout(function() {

					if(typeof ctlrModel === 'undefined') {
						if(!!ctlrDockpanel) {
							console.log(ctlrDockpanel)
							ctlrDockpanel.append({
								guid: 'w42d4238c5eae2bd7'
							}, detached);
						}
						return;
					}
					// ngModel이 활성화되는 시점
					angular.extend(scope, ctlrModel.$modelValue);

					if(scope.type != 'tabs') {
						var template = angular.element([
						'<span click-to-edit ng-model="name" ng-change="onWidgetTitleChange($new, $old, $event)" class="pull-left widget-title"></span>',
						'<span class="pull-right widget-toolbox">',
							'<button class="btn btn-extra-mini b-pause" ng-show="isRunning" ng-click="$parent.$parent.pauseWidget($event)">',
								'<i class="icon-pause"></i>',
							'</button><button class="btn btn-extra-mini b-play" ng-hide="isRunning" ng-click="$parent.$parent.runWidget($event)">',
								'<i class="icon-play"></i>',
							'</button><button class="btn btn-extra-mini b-refresh" ng-click="$parent.$parent.refreshWidget($event)">',
								'<i class="icon-refresh"></i>',
							'</button><button class="btn btn-extra-mini b-p" ng-click="$parent.$parent.displayWidgetProperty($event)">',
								'<i class="icon-info-sign"></i>',
							'</button><button class="btn btn-extra-mini b-x" ng-click="closebox()">',
								'<i class="icon-remove"></i>',
							'</button>',
						'</span>'].join(''));

						$compile(template)(scope);
						elc.append(template);	
					}
					
					// console.widgetLog(ctlrModel.$modelValue);

					el.attr('guid', ctlrModel.$modelValue.guid);
					if(!!ctlrDockpanel) {
						ctlrDockpanel.append(ctlrModel.$modelValue, detached);
					}
				});

				el.children('widget').replaceWith(elc);

				///////
				elc[0].render = function() {
					var ctrl = elc.controller('widget');
					if(!ctrl.isLoaded) {
						elc.controller('widget').load();
					}
					else {
						ctrl.resume();
					}
				}

				elc[0].suspend = function() {
					var ctrl = elc.controller('widget');
					ctrl.suspend();
				}

				elc[0].getName = function() {
					return scope.name;
				}
			});
		}
	}
})
.directive('wcloud', function($compile, $timeout, serviceLogdb, serviceChart, $translate) {
	return {
		restrict: 'A',
		require: 'widget',
		scope: true,
		link: function(scope, el, attrs, ctrl) {
			var elc = el.children('widget');
			var superRender = elc[0].render;
			var superSuspend = elc[0].suspend;

			scope.progress = { 'width': '0%' };
			scope.isLoaded = true;

			var ctx = { 'data': null };
			var queryInst, interval = 0, datasrc;

			function resultCallback(callback) {
				return function(m) {
					datasrc = m.body.result;
					var divcont = angular.element('<div class="widget-wordcloud">');

					function render() {
						serviceChart.getWordCloud(datasrc, ctx.data.size, ctx.data.text, divcont);
						divcont[0].onResize();
					}

					divcont[0].onResize = function() {
						var w = el.parent().width(), h = el.parent().height(), scale;
						if(w > h) {
							scale = h / 560;
						}
						else {
							scale = w / 560;
						}
						divcont.css('zoom', scale);
					}

					elc.find('.widget-wordcloud').remove();
					elc.append(divcont);
					render();
					serviceLogdb.remove(queryInst);
					
					if(!!callback){
						callback();	
					}

					// $timeout(function(){
						scope.progress = { 'width': '100%' };
					// }, 300);
					// $timeout(function(){
						scope.isLoaded = true;
					// }, 1000)
					scope.$apply();
				}
			}


			function onStatusChange(callback) {
				return function(m) {
					if(m.body.type === 'eof') {
						queryInst.getResult(0, 100, resultCallback(callback));
					}	
				}
			}

			elc[0].getInterval = function() {
				return interval;
			}

			elc[0].setInterval = function(itv) {
				elc.scope().data.interval = itv;
				interval = itv;
			}

			elc[0].getQuery = function() {
				return ctx.data.query;
			}

			elc[0].suspend = function() {
				serviceLogdb.remove(queryInst);
				ctrl.suspend();
			}
			
			elc[0].render = function(callback) {
				var scopec = elc.scope()
				ctx.data = scopec.data;
				interval = scopec.interval;

				query(callback);

				if(ctrl.isLoaded) {
					superRender();
					return;
				}

				var progress = angular.element('<div class="progress"><div class="bar" ng-hide="isLoaded" ng-style="progress"></div></div>');
				$compile(progress)(scope);
				elc.append(progress);

				superRender();
			}

			function query(callback) {
				
				ctrl.resume();
				scope.isLoaded = false;
				scope.progress = { 'width': '0%' };	
				var scopec = elc.scope();
				
				queryInst = serviceLogdb.create(2020);
				queryInst.query(scopec.data.query, 100)
				.created(function(m) {
					scope.progress = { 'width': '20%' };
					scope.$apply();
				})
				.onStatusChange(onStatusChange(callback))
				.loaded(onStatusChange(callback))
				.failed(function(m, raw) {
					console.widgetLog('failed');
					serviceLogdb.remove(queryInst);
				});
			}

			elc[0].query = query;

		}
	}
})
.directive('grid', function($compile, $timeout, serviceLogdb, $translate) {
	return {
		restrict: 'A',
		require: 'widget',
		scope: true,
		link: function(scope, el, attrs, ctrl) {
			var elc = el.children('widget');
			var superRender = elc[0].render;
			var superSuspend = elc[0].suspend;
			var superResume = elc[0].resume;
			var t;

			var ctx = { 'data': null };
			var queryInst, interval = 0, widthInit = true;

			scope.gridWidths = {};
			scope.getStore = function() {
				return {
					get: function(key) {
						return scope.gridWidths[key.substring(1)];
					},
					set: function(key, val) {
						scope.gridWidths[key.substring(1)] = val;
						scope.$apply();
					}
				}
			}

			scope.$watch('gridWidths', debounce(function(val) {
				if(!widthInit) {
					elc.scope().onChange({
						'$id': elc.attr('id'),
						'$field': 'data.width',
						'$new': val
					});
				}
			}, 100), true);

			scope.progress = { 'width': '0%' };
			scope.isLoaded = true;
			scope.dataQueryResult = [];
			function resultCallback(callback) {
				return function(m) {
					scope.dataQueryResult = m.body.result;
					serviceLogdb.remove(queryInst);
					if(!!callback){
						callback();	
					}
					
					// $timeout(function(){
						scope.progress = { 'width': '100%' };
					// }, 300);
					// $timeout(function(){
						scope.isLoaded = true;
					// }, 1000)
					scope.$apply();

					if(t != undefined) {
						t.data('resizableColumns').syncHandleWidths();	
					}
				}
			}

			function onStatusChange(callback) {
				return function(m) {
					if(m.body.type === 'eof') {
						queryInst.getResult(0, 100, resultCallback(callback));
					}	
				}
			}

			elc[0].getInterval = function() {
				return interval;
			}

			elc[0].setInterval = function(itv) {
				elc.scope().data.interval = itv;
				interval = itv;
			}

			elc[0].getQuery = function() {
				return ctx.data.query;
			}

			elc[0].suspend = function() {
				serviceLogdb.remove(queryInst);
				ctrl.suspend();
			}

			elc[0].render = function(callback) {
				var scopec = elc.scope()
				ctx.data = scopec.data;
				if(angular.isObject(ctx.data.width)) {
					scope.gridWidths = ctx.data.width;
				}
				scope.order = scopec.data.order;
				interval = scopec.interval;

				query(callback);

				if(ctrl.isLoaded) {
					superRender();
					return;
				}

				var progress = angular.element('<div class="progress"><div class="bar" ng-hide="isLoaded" ng-style="progress"></div></div>');

				var table = angular.element('<div class="widget-grid-container"><table class="table table-bordered table-condensed widget-grid" data-resizable-columns-id="">\
					<thead>\
						<tr><th data-resizable-column-id="{{field}}" ng-repeat="field in order" title="{{field}}">{{field}}</th></tr>\
					</thead>\
					<tbody>\
						<tr ng-repeat="row in dataQueryResult">\
							<td ng-repeat="field in order" title="{{row[field]}}" ng-bind-html="row[field] | crlf"></td>\
						</tr>\
					</tbody>\
				</table></div>');

				$compile(progress)(scope);
				$compile(table)(scope);

				elc.append(progress);
				elc.append(table);

				$timeout(function() {
					t = $(table).find('table');
					t.resizableColumns({
						store: scope.getStore()
					});

					$timeout(function() {
						if(t != undefined) {
							t.data('resizableColumns').syncHandleWidths();
						}
					},500)
					widthInit = false;
				}, 500);

				superRender();
			}

			function query(callback) {
				
				ctrl.resume();
				scope.isLoaded = false;
				scope.progress = { 'width': '0%' };	
				var scopec = elc.scope();
				
				queryInst = serviceLogdb.create(2020);
				queryInst.query(scopec.data.query, 100)
				.created(function(m) {
					scope.progress = { 'width': '20%' };
					scope.$apply();
				})
				.onStatusChange(onStatusChange(callback))
				.loaded(onStatusChange(callback))
				.failed(function(m, raw) {
					console.widgetLog('failed');
					serviceLogdb.remove(queryInst);
				});
			}

			elc[0].query = query;
		}
	}
})
.directive('chart', function($compile, $timeout, serviceLogdb, serviceChart, $translate) {
	return {
		restrict: 'A',
		require: 'widget',
		scope: true,
		link: function(scope, el, attrs, ctrl) {
			var elc = el.children('widget');
			var superRender = elc[0].render;

			scope.isLoaded = true;
			scope.progress = { 'width': '0%' };

			var ctx = { 'data': null };
			var queryInst, interval = 0, datasrc;

			function resultCallback(callback) {
				return function(m) {
					datasrc = m.body.result;
					var svg = angular.element('<div class="widget-chart">');
					var dataLabel = {name: ctx.data.label, type: ctx.data.labelType};
					// console.log(ctx.data)

					function render() {
						var json = serviceChart.buildJSONStructure(angular.copy(ctx.data.series), datasrc, dataLabel);
						// setTimeout(function() {
							var renderOptions = {
								width: $(svg[0]).width(),
								height: $(svg[0]).parents('.contentbox').height() - 10
							}
							if(ctx.data.type == 'line') {
								serviceChart.lineChart(svg[0], json, renderOptions);
							}
							else if(ctx.data.type == 'bar') {
								serviceChart.multiBarHorizontalChart(svg[0], json, renderOptions);
							}
							else if(ctx.data.type == 'pie') {
								serviceChart.pie(svg[0], json, renderOptions);
							}	
						// }, 500);
					}

					elc.find('.widget-chart').remove();
					elc.append(svg);
					render();
					serviceLogdb.remove(queryInst);
					
					if(!!callback){
						callback();	
					}

					// $timeout(function(){
						scope.progress = { 'width': '100%' };
					// }, 300);
					// $timeout(function(){
						scope.isLoaded = true;
					// }, 1000)
					scope.$apply();
				}
			}


			function onStatusChange(callback) {
				return function(m) {
					if(m.body.type === 'eof') {
						queryInst.getResult(0, 100, resultCallback(callback));
					}	
				}
			}

			elc[0].getInterval = function() {
				return interval;
			}

			elc[0].setInterval = function(itv) {
				elc.scope().data.interval = itv;
				interval = itv;
			}

			elc[0].getQuery = function() {
				return ctx.data.query;
			}

			elc[0].suspend = function() {
				serviceLogdb.remove(queryInst);
				ctrl.suspend();
			}
			
			elc[0].render = function(callback) {
				var scopec = elc.scope()
				ctx.data = scopec.data;
				interval = scopec.interval;

				query(callback);

				if(ctrl.isLoaded) {
					superRender();
					return;
				}

				var progress = angular.element('<div class="progress"><div class="bar" ng-hide="isLoaded" ng-style="progress"></div></div>');
				$compile(progress)(scope);
				elc.append(progress);

				superRender();
			}

			function query(callback) {
				
				ctrl.resume();
				scope.isLoaded = false;
				scope.progress = { 'width': '0%' };	
				var scopec = elc.scope();
				
				queryInst = serviceLogdb.create(2020);
				queryInst.query(scopec.data.query, 100)
				.created(function(m) {
					scope.progress = { 'width': '20%' };
					scope.$apply();
				})
				.onStatusChange(onStatusChange(callback))
				.loaded(onStatusChange(callback))
				.failed(function(m, raw) {
					console.widgetLog('failed');
					serviceLogdb.remove(queryInst);
				});
			}

			elc[0].query = query;

		}
	}
})
.directive('widgetDroppable', function($compile) {
	return {
		restrict: 'A',
		link: function(scope, el, attrs) {
			el.addClass('drop-tab');

			var dropzone = angular.element('<div class="widget-drop-zone" click-to-edit ng-model="tab.name" ng-change="$parent.$parent.onTabTitleChange($new, $old)">' + el[0].innerText + '</div>');
			$compile(dropzone)(scope);
			el.append(dropzone);

		}
	}
})
.factory('serviceWidget', function() {
	var widgets = [];
	
	function buildWidget(preset, json) {
		if(json.type === 'tabs') {
			return '<widget id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '">' + 
				'<div class="tab-comp" style="height: 100%">' +
					'<ul class="nav nav-tabs" style="margin-bottom: 0">' +
						'<li ng-repeat="(i, tab) in data.tabs" ng-class="{\'active\': tab.is_active}">' +
							'<a tab-id="{{tab.guid}}" href=".tab-content .{{tab.guid}}" data-toggle="tab" ng-click="$parent.$parent.activeTab(tab, data.tabs, $event)" widget-droppable>{{tab.name}}</a>' +
							'<button ng-show="tab.is_active" class="close tab-home" ng-click="$parent.$parent.setTabToHome(tab, \'' + preset + '\' ,\'' + json.guid + '\', $event)"><i class="icon-home"></i></button>' +
							'<button ng-show="tab.is_active && (data.tabs.length > 1)" class="close tab-close" ng-click="$parent.$parent.closeTab(tab, \'' + preset + '\' ,\'' + json.guid + '\', $event)">&times;</button>' +
						'</li>' +
						'<button class="btn btn-mini" ng-click="$parent.addTab(data.tabs, $event, \'' + preset + '\')"><i class="icon-plus"></i></button>' +
					'</ul>' +
					'<div class="tab-content">' +
						'<div ng-repeat="tab in data.tabs"  style="height:100%" ng-class="{\'active\': tab.is_active}" class="tab-pane {{tab.guid}}" tab-id="{{tab.guid}}">' + 
						'</div>' +
					'</div>' +
				'</div>' +
			'</widget>';
		}
		else if(json.type === 'grid') {
			return '<widget grid class="w-before-loading" id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')" on-change="onChangeWidget($id, \'' + preset + '\', $field, $old, $new)">' +
				'</widget>';
		}
		else if(json.type === 'chart') {
			return '<widget chart class="w-before-loading" id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')" on-change="onChangeWidget($id, \'' + preset + '\', $field, $old, $new)">' +
				'</widget>';
		}
		else if(json.type === 'wordcloud') {
			return '<widget wcloud class="w-before-loading" id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')" on-change="onChangeWidget($id, \'' + preset + '\', $field, $old, $new)">' +
				'</widget>';
		}
		else {
			return '<widget id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')" on-change="onChangeWidget($id, \'' + preset + '\', $field, $old, $new)">' +
				'' + 
				'<div>{{hello}} {{1+1}}</div></widget>';
		}
	}
	
	return {
		buildWidget: buildWidget
	}
})
;

console.widgetLog = function() {}

angular.module('app.directive.widget', [])
.directive('ngModelOnBlur', function() {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			'onChange': '&ngChange',
			'onCancel': '&ngCancel',
			'ngModelOnBlur': '&',
			'val': '=ngModel'
		},
		link: function(scope, element, attrs, ngModelCtrl) {
			if (attrs.type === 'radio' || attrs.type === 'checkbox') return;
			var cancel = false;

			element.unbind('input').unbind('keydown.onBlur').unbind('change');
			element.bind('blur.onBlur', function(e) {
				if(!cancel) {
					var oldval = ngModelCtrl.$modelValue;
					if(element.attr('type') == 'number') {
						if((element[0].validity) && (!element[0].validity.valid)) {
							// not number
							element.val(oldval)
						}
						else {
							var newval = element.val();
							ngModelCtrl.$setViewValue(newval);
							scope.onChange({
								'$event': e,
								'$new': newval,
								'$old': oldval
							});
						}
					}
					else {
						var newval = element.val();
						if(newval != oldval) {
							ngModelCtrl.$setViewValue(newval);
							scope.onChange({
								'$event': e,
								'$new': newval,
								'$old': oldval
							});
						}	
					}
				}

				scope.ngModelOnBlur({

				});

				setTimeout(function() {
					scope.$apply();
					cancel = false;
				}, 100);
			}).bind('keydown.onBlur', function(e) {
				if(e.keyCode == 13) {
					this.blur();
				}
				else if(e.keyCode == 27) {
					cancel = true;
					element.val(scope.val)

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
		template: '<input type="text" ng-model="val" style="display:none" ng-model-on-blur="onBlur()" ng-change="onValueChange($event, $new, $old)" ng-cancel="onCancel()"></input><a ng-click="toggle()">{{val}}</a>',
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
			'onDragbox': '&',
			'onDropbox': '&',
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

			function cache() {
				// 이 시점에선 dockpanel 아래의 link된 widget을 캐시하는 것이 아니고,
				// 이미 append된 widget들을 캐시한다. link됐으나 append되지 않은건 이미 아까 사라짐.
				cached = el.find('widget').detach();
				console.widgetLog('cache', cached.length, 'item cached');
			}

			function restore() {
				if(!cached.length) return;
				console.widgetLog('restore');

				cached.each(function(i, widget) {
					var guid = angular.element(widget).attr('guid');

					var contentbox = el.find('[dock-id=' + guid + '] > .mybox > .contentbox');
					if(contentbox.length) {
						// 이때 append되지 않은건 버려짐.
						console.widgetLog('restore widget', widget.id, guid);
						contentbox.append(widget);
					}
				});

				cached = undefined;
			}

			function render(layout) {
				cache();
				el.empty();
				console.widgetLog('---render start---')

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
.directive('widget', function($timeout, $compile) {
	return {
		restrict: 'E',
		scope: {
			'onClose': '&'
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
				self.isLoaded = true;
				$scope.isRunning = true;
			}

			this.suspend = function() {
				$scope.isRunning = false;
			}

			this.resume = function() {
				$scope.isRunning = true;
				console.log('resume', $element[0].id)
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

				// console.widgetLog(ctlrModel.$modelValue); // 여기엔 모델이 없다.
				$timeout(function() {
					// ngModel이 활성화되는 시점
					angular.extend(scope, ctlrModel.$modelValue);

					if(scope.type != 'tabs') {
						var template = angular.element([
						'<span click-to-edit ng-model="name" ng-change="onTitleChange($new, $old)" ng-cancel="onCancel()" ng-toggle="onToggle()" class="pull-left widget-title"></span>',
						'<span class="pull-right widget-toolbox">',
							'</button><button class="btn btn-extra-mini b-x" ng-click="closebox()">',
								'<i class="icon-remove"></i>',
							'</button>',
						'</span>'].join(''));

						$compile(template)(scope);
						elc.append(template);	
					}
					
					// console.widgetLog(ctlrModel.$modelValue);
					scope.hello = ctlrModel.$modelValue.type + '/' + ctlrModel.$modelValue.guid;

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
			
			elc[0].render = function() {
				var scopec = elc.scope()
				ctx.data = scopec.data;
				interval = scopec.interval * 500;

				if(ctrl.isLoaded) {
					superRender();
					return;
				}

				query();
				superRender();
			}

			function query(callback) {
				var scopec = elc.scope();

				queryInst = serviceLogdb.create(2020);
				queryInst.query(scopec.data.query, 100)
				.created(function(m) {
					// scope.progress = { 'width': '20%' };
					// scope.$apply();
				})
				.onStatusChange(onStatusChange(callback))
				.loaded(onStatusChange(callback))
				.failed(function(m, raw) {
					console.widgetLog('failed');
					serviceLogdb.remove(queryInst);

					scope.errorMessage = $translate('$S_msg_OccurError') + raw[0].errorCode;
					scope.isShowError = true;

					scope.$apply();
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

			var queryInst, interval = 0;

			scope.dataQueryResult = [];
			function resultCallback(callback) {
				return function(m) {
					scope.dataQueryResult = m.body.result;
					
					serviceLogdb.remove(queryInst);
					if(!!callback){
						callback();	
					}
					
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

			elc[0].render = function() {
				var scopec = elc.scope()
				scope.order = scopec.data.order;
				interval = scopec.interval * 500;

				if(ctrl.isLoaded) {
					superRender();
					return;
				}

				query();

				var table = angular.element('<div class="widget-grid-container"><table class="table table-bordered table-condensed widget-grid" data-resizable-columns-id="">\
					<thead>\
						<tr><th data-resizable-column-id="{{field}}" ng-repeat="field in order" title="{{field}}">{{field}}</th></tr>\
					</thead>\
					<tbody>\
						<tr ng-repeat="row in dataQueryResult">\
							<td ng-repeat="field in order" title="{{row[field]}}">\
								{{row[field]}}\
							</td>\
						</tr>\
					</tbody>\
				</table></div>');

				$compile(table)(scope);
				elc.append(table);

				superRender();
			}

			function query(callback) {
				var scopec = elc.scope();
				
				queryInst = serviceLogdb.create(2020);
				queryInst.query(scopec.data.query, 100)
				.created(function(m) {
					// scope.progress = { 'width': '20%' };
					// scope.$apply();
				})
				.onStatusChange(onStatusChange(callback))
				.loaded(onStatusChange(callback))
				.failed(function(m, raw) {
					console.widgetLog('failed');
					serviceLogdb.remove(queryInst);

					scope.errorMessage = $translate('$S_msg_OccurError') + raw[0].errorCode;
					scope.isShowError = true;

					scope.$apply();
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
			
			elc[0].render = function() {
				var scopec = elc.scope()
				ctx.data = scopec.data;
				interval = scopec.interval * 500;

				if(ctrl.isLoaded) {
					superRender();
					return;
				}

				query();
				superRender();
			}

			function query(callback) {
				var scopec = elc.scope();

				queryInst = serviceLogdb.create(2020);
				queryInst.query(scopec.data.query, 100)
				.created(function(m) {
					// scope.progress = { 'width': '20%' };
					// scope.$apply();
				})
				.onStatusChange(onStatusChange(callback))
				.loaded(onStatusChange(callback))
				.failed(function(m, raw) {
					console.widgetLog('failed');
					serviceLogdb.remove(queryInst);

					scope.errorMessage = $translate('$S_msg_OccurError') + raw[0].errorCode;
					scope.isShowError = true;

					scope.$apply();
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
	
	function buildWidget(preset, json) {
		if(json.type === 'tabs') {
			return '<widget id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')">' + 
				'<div class="tab-comp" style="height: 100%">' +
					'<ul class="nav nav-tabs" style="margin-bottom: 0">' +
						'<li ng-repeat="tab in data.tabs" ng-class="{\'active\': tab.is_active}"><a tab-id="{{tab.guid}}" href=".tab-content .{{tab.guid}}" data-toggle="tab" ng-click="$parent.$parent.activeTab(tab, $event)" widget-droppable>{{tab.name}}</a></li>' +
						'<li class="plus"><button class="btn btn-mini" ng-click="$parent.addTab(data.tabs, $event)"><i class="icon-plus"></i></button></li>' +
					'</ul>' +
					'<div class="tab-content">' +
						'<div ng-repeat="tab in data.tabs"  style="height:100%" ng-class="{\'active\': tab.is_active}" class="tab-pane {{tab.guid}}">' + 
						'</div>' +
					'</div>' +
				'</div>' +
			'</widget>';
		}
		else if(json.type === 'grid') {
			return '<widget grid id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')">' +
				'</widget>';
		}
		else if(json.type === 'chart') {
			return '<widget chart id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')">' +
				'</widget>';
		}
		else if(json.type === 'wordcloud') {
			return '<widget wcloud id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')">' +
				'</widget>';
		}
		else {
			return '<widget id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')">' +
				'' + 
				'<div>{{hello}} {{1+1}}</div></widget>';
		}
	}
	
	return {
		buildWidget: buildWidget
	}
})
;

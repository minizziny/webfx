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
					console.logdash('append widget', detached[0].id, model.guid);
					contentbox.append(detached);	
				}
			}
		},
		link: function(scope, el, attrs, ctrl) {
			console.logdash('linking dockpanel');
			var cached;

			function cache() {
				// 이 시점에선 dockpanel 아래의 link된 widget을 캐시하는 것이 아니고,
				// 이미 append된 widget들을 캐시한다. link됐으나 append되지 않은건 이미 아까 사라짐.
				cached = el.find('widget').detach();
				console.logdash('cache', cached.length, 'item cached');
			}

			function restore() {
				if(!cached.length) return;
				console.logdash('restore');

				cached.each(function(i, widget) {
					var guid = angular.element(widget).attr('guid');

					var contentbox = el.find('[dock-id=' + guid + '] > .mybox > .contentbox');
					if(contentbox.length) {
						// 이때 append되지 않은건 버려짐.
						console.logdash('restore widget', widget.id, guid);
						contentbox.append(widget);
					}
				});

				cached = undefined;
			}

			function render(layout) {
				cache();
				el.empty();
				console.logdash('---render---')
				
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
					'onResize': function() {
						return scope.onResize({
							'$id': attrs.id
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
				console.logdash('ngModel changed', attrs.id);
				if(angular.isObject(val)) {
					render(val);
					ew();
				}
			});
		}
	}
})
.directive('widget', function($timeout) {
	return {
		restrict: 'E',
		scope: {
			'onClose': '&'
		},
		transclude: 'element',
		replace: true,
		require: ['?^dockpanel', '?ngModel'],
		template: '<div ng-transclude></div>',
		link: function(scope, el, attrs, ctrl, transclude) {
			transclude(scope, function(elc, scopec) {
				console.logdash('linking widget', attrs.id);
				var ctlrDockpanel = ctrl[0];
				var ctlrModel = ctrl[1];

				if(!!ctlrDockpanel) {
					// DockPanel 밑에 있는 widget들은 append 보류
					var detached = el.detach();
				}

				scope.hello = 'world';
				// console.logdash(ctlrModel.$modelValue); // 여기엔 모델이 없다.

				$timeout(function() {
					// ngModel이 활성화되는 시점
					
					// console.logdash(ctlrModel.$modelValue);
					angular.extend(scope, ctlrModel.$modelValue);
					scope.hello = ctlrModel.$modelValue.type + '/' + ctlrModel.$modelValue.guid;

					el.attr('guid', ctlrModel.$modelValue.guid);
					if(!!ctlrDockpanel) {
						ctlrDockpanel.append(ctlrModel.$modelValue, detached);
					}
				});

				el.children('widget').replaceWith(elc);

				var btnX = angular.element('<button style="float:right">x</button>').on('click', function() {
					scope.onClose({
						'$id': attrs.id,
						'$target': el.parents('.k-d-col:first')
					});
					// el.parents('.k-d-col:first')[0].obj.close();
				});
				btnX.prependTo(el);
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
		else {
			return '<widget id="' + json.guid + '" ng-model="ctxPreset.' + preset + '.ctxWidget.' + json.guid + '" on-close="onCloseWidget($id, $target, \'' + preset + '\')"><div>{{hello}} {{1+1}}</div></widget>';	
		}
	}
	
	return {
		buildWidget: buildWidget
	}
})
;

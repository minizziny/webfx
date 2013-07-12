angular.module('App.Directive', [])
.directive('autosize', function() {
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
})
.directive('trSelectable', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var parentTbody = element.parent();
			element.on('click', function() {
				parentTbody.find('tr.tr-selected').removeClass('tr-selected');
				element.addClass('tr-selected');
				var radio = element.find('input[type=radio]');
				radio.prop('checked', true);
				if(scope.$parent.hasOwnProperty(attrs.trSelectable)) {
					scope.$parent[attrs.trSelectable] = radio.val();
				}
				else {
					if(scope.$parent.$parent.hasOwnProperty(attrs.trSelectable)) {
						scope.$parent.$parent[attrs.trSelectable] = radio.val();
					}
					else {
						alert('not binding')
					}
				}
				scope.$apply();
			});
		}
	}
})
.directive('trMultiSelectable', function($parse) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {

			if($parse(attrs.trMultiSelectable)() == undefined) {
				// data string only
				var model = scope[attrs.trMultiSelectable];
				bindingMultiEvent();
			}
			else {
				// option object
				attrs = scope.$eval(attrs.trMultiSelectable);
				//console.log(attrs, scope);

				var parentTbody = element.parent();
				var model = attrs.data;

				if(attrs.condition != undefined) {
					scope.$parent.$watch(attrs.condition, function(vnew, vold) {
						if(vnew) {
							bindingMultiEvent();
						}
						else {
							element.off('click.tr-multi').removeClass('tr-selected');
							model.is_checked = false;
						}
					});
				}
				else {
					bindingMultiEvent();
				}	
			}

			function bindingMultiEvent() {
				element.on('click.tr-multi', function(e) {
					if(e.target.type != 'checkbox') {
						model.is_checked = !model.is_checked;
					}
					
					if(model.is_checked) {
						element.addClass('tr-selected');
					}
					else {
						element.removeClass('tr-selected');
					}

					scope.$apply();
				});
			}
		}
	}
})
.directive('treeElement', function($compile)
{
	return {
		restrict: 'E', //Element
		link: function (scope, element, attrs)
		{
			scope.tree = scope.node;
			
			var visibility = ( attrs.nodeState != "collapse" ) || 'style="display: none;"';
			
			if(!!scope.tree.children) {
				for(var i in scope.tree.children) {
					if(typeof scope.tree.children[i] == 'function') {
						continue;
					}
					if(!!scope.tree.children[i].children) {
						scope.tree.children[i].className = "eu_" + attrs.nodeState + " eu_deselected";
					}
					else {
						scope.tree.children[i].className = "eu_child" + " eu_deselected";
					}
				}

				var template = angular.element(
					'<ul class="nav nav-list" ' + visibility + '>' + 
						'<li ng-repeat="node in tree.children" node-tree-type="{{node.' + attrs.nodeTreeType + '}}" node-id="{{node.' + attrs.nodeId + '}}" ng-class="node.className">' +
							'<a href="#" el-type="item">' +
								'<input type="checkbox" ng-show="node.is_edit_mode">' +
								'<tree-toggle></tree-toggle>' +
								'<i class="tree-node-icon {{node.' + attrs.nodeIconClass + '}}"></i>' +  // src="{{node.' + attrs.nodeIcon + '}}">' +
								'{{node.' + attrs.nodeName + '}}' +
							'</a>' +
							'<tree-element tree="node" node-tree-type="' + attrs.nodeTreeType + '" node-id="' + attrs.nodeId + '" node-icon="' + attrs.nodeIcon + '" node-icon-class="' + attrs.nodeIconClass + '" node-name="' + attrs.nodeName + '" node-state="' + attrs.nodeState + '"></tree-element>' +
						'</li>' +
					'</ul>');
				
				var linkFunction = $compile(template);
				linkFunction(scope);
				element.replaceWith( template );
			}
			else {
				element.remove();
			}
		}
	};
})
.directive('treeToggle', function($compile) {
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			scope.tree = scope.node;
			
			if(!!scope.tree.children) {
				var template = angular.element('<i class="icon-chevron-down tree-node-icon" el-type="toggle"></i>');
				
				var linkFunction = $compile(template);
				linkFunction(scope);
				element.replaceWith(template);
			}
			else {
				element.remove();
			}
		}
	}
})
.directive('euTree', function($compile)
{
	return {
		restrict: 'E', //Element
		link: function (scope, element, attrs) {
			scope.selectedNode = null;
			scope.$watch(attrs.treeData, function(val) {
				for(var i in scope[attrs.treeData]) {
					if(!!scope[attrs.treeData][i].children) {
						scope[attrs.treeData][i].className = "eu_" + attrs.nodeState + " eu_deselected";
					}
					else {
						scope[attrs.treeData][i].className = "eu_child" + " eu_deselected";
					}

					if(scope[attrs.treeData][i][attrs.nodeId] == attrs.nodeSelected) {
						scope[attrs.treeData][i].className = "eu_" + attrs.nodeState + " active";	
					}
				}
				
				var template = angular.element(
					'<ul id="euTreeBrowser" class="nav nav-list tree-top">' +
						'<li ng-repeat="node in ' + attrs.treeData + '" node-tree-type="{{node.' + attrs.nodeTreeType + '}}" node-id="{{node.' + attrs.nodeId + '}}" ng-class="node.className">' +
							'<a href="#" el-type="item">' +
								'<tree-toggle></tree-toggle>' +
								//'<span ng-show="!!node.template" ng-bind-html-unsafe="node.template"></span>' +
								//'<span ng-hide="!!node.template">{{node.' + attrs.nodeName + '}}</span>' + 
								'{{node.' + attrs.nodeName + '}}' +
							'</a>' +
							'<tree-element tree="node" node-tree-type="' + attrs.nodeTreeType + '" node-id="' + attrs.nodeId + '" node-icon="' + attrs.nodeIcon + '" node-icon-class="' + attrs.nodeIconClass + '" node-name="' + attrs.nodeName + '" node-state="' + attrs.nodeState + '"></tree-element>' +
						'</li>' +
					'</ul>');
				
				var linkFunction = $compile(template);
				linkFunction(scope);
				element.html(null).append( template );

				setTimeout(function() {
					scope.currentElement = template.find('li.active');
				}, 250)
				
				// Click Event
				angular.element(document.getElementById('euTreeBrowser')).unbind().bind('click', function(e) {
					e.preventDefault();
					e.stopPropagation();

					if(angular.element(e.target).length) {
						if($(e.target).attr('el-type') == 'item') {
							scope.previousElement = scope.currentElement;
							scope.currentElement = angular.element(e.target).parent();
							
							scope.$broadcast('nodeSelected', { selectedNode: scope.currentElement.attr('node-id'), selectedNodeType: scope.currentElement.attr('node-tree-type'), selectedNodeRaw: scope.currentElement, selectedNodeScope: scope });
							
							if(scope.previousElement) {
								scope.previousElement.addClass("eu_deselected").removeClass("active");
							}
							scope.currentElement.addClass("active").removeClass("eu_deselected");
						}
						
						if($(e.target).attr('el-type') == 'toggle') {
							var currentElement = angular.element(e.target).parent().parent();
							if(currentElement.children().length) {
								currentElement.children().toggleClass("hide");
								
								currentElement.toggleClass("eu_collapse");
								currentElement.toggleClass("eu_expand");
							}
						}
					}
				});
			}, true);
		}
	}
})
.directive('hoverinput', function($compile) {
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			var a = $('<a href="#">');
			var textarea = angular.element('<textarea>');
			var placeholder = angular.element('<span style="color: silver; font-style:italic">');

			function textarea_enter(e) {
				if( e.which == 13 ) { // submit enter
					e.preventDefault();

					e.target = null;
					outhover(e);
				}
			}

			function textarea_esc(e) {
				if( e.which == 27 ) { // cancel esc
					
					e.target = null;
					outhover(e, true);
				}
			}

			function outhover(e, onEsc) {
				if(e.target === textarea[0]) {
					return;
				}
				var required = attrs.hvRequired == 'true';

				$(document).off('click.outhover', outhover);

				var newval = textarea.val();
				var oldval = element.text();
				//console.log(newval + "\t\t\t\t" + oldval);

				if(required && newval == '') {
					textarea.addClass('invalid');
					return;
				}
				else {
					textarea.removeClass('invalid');
				}

				if(onEsc == true || newval == oldval) {
					// no save
				}
				else {
					// save
					element.text(newval);
					//console.log('now saving...');

					var fnchange = scope[attrs.onchange];
					fnchange.call(scope, oldval, newval, attrs.prop, parseInt(attrs.i));
				}

				textarea.after(element).remove();
				element.wrap(a);

				if(newval == "") {
					element.after(placeholder);
				}
			}

			a.on('click', function(e) {
				e.preventDefault();
				element.unwrap(a);

				var txt = element.text();

				textarea.val(txt);
				
				/*
				var linkFunction = $compile(textarea);
				linkFunction(scope);
				*/
				textarea.on('keypress', textarea_enter).on('keyup', textarea_esc);;
				
				element.replaceWith(textarea);
				placeholder.remove();
				textarea.focus();

				setTimeout(function() {
					$(document).on('click.outhover', outhover);
				}, 250);
			});

			element.wrap(a);
			if(element.text() != ""){
				element.after(placeholder);
			}

			function afterBinding() {
				if(attrs.hasOwnProperty('placeholder')) {
					placeholder.text(attrs.placeholder);
				}
			}

			setTimeout(afterBinding, 200);
			//afterBinding();
		}
	}
})
.directive('modal', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var backdrop = angular.element('<div class="modal-backdrop"><div class="modal-wrapper"></div></div>');
			element.wrap(backdrop);
			backdrop = element.parents('.modal-backdrop');
			backdrop.hide();

			element[0].showDialog = function() {
				$('body').css('overflow-y', 'hidden');
				backdrop.show();
			};

			function hideDialog() {
				$('body').css('overflow-y', '');
				backdrop.hide();
			}

			element[0].hideDialog = hideDialog;
			element.find(".modal-close").on('click', hideDialog);
		}
	}
})
.directive('myHidden', function() {
	return {
		restrict: 'C',
		link: function(scope, element, attrs) {
			if($('#myHidden').length == 0) {
				var sheet = document.createElement('style');
				$(sheet).attr('id','myHidden');
				sheet.innerHTML = '.my-hidden { display: none }';
					
				document.body.appendChild(sheet);
			}
			
			element.addClass('my-hidden');
		}
	}
})
.directive('ngModelOnblur', function() {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, element, attrs, ngModelCtrl) {
			if (attrs.type === 'radio' || attrs.type === 'checkbox') return;
			var cancel = false;

			element.unbind('input').unbind('keydown').unbind('change');
			element.bind('blur', function() {
				if(!cancel) {
					ngModelCtrl.$setViewValue(element.val());
				}

				scope[attrs.ngModelOnblur].is_edit_mode = false;
				setTimeout(function() {
					scope.$apply();
					cancel = false;
				}, 100);
			}).bind('keydown', function(e) {
				if(e.keyCode == 13) {
					this.blur();
				}
				else if(e.keyCode == 27) {
					cancel = true;
					this.blur();
				}
			})
		}
	}
})
.directive('draggable', function() {
	return {
		restrict: 'A',
		link: function ($scope, $element, $attrs) {

			if($attrs.draggable === 'true') {
				init($scope, $element, $attrs);
				return;
			}

			function init(scope, element, attrs) {

				if(element[0].nodeName == 'TR' && attrs.hasOwnProperty('trMultiSelectable')) {
					function getDataSourceString() {
						var expr = attrs.ngRepeat;
						return expr.substring(expr.indexOf('in') + 3, expr.length);
					}
					
					var dataSrc = scope.$parent[getDataSourceString()];

					element.draggable({
						cursorAt: { top: 20, left: 20 },
						helper: function(event) {
							var selected = dataSrc.filter(function(obj) {
								return obj.is_checked;
							});

							if(selected.length == 0) {
								element.click();
								return $('<span class="badge badge-important">1</span>' );
							}
							else {
								return $('<span class="badge badge-important">' + selected.length + '</span>' );
							}
						}
					});
				}
				else {
					element.draggable({ opacity: 0.7, helper: "clone" });
				}
				element.draggable('enable');

				element[0].dragContext = {
					scope: scope,
					element: element,
					attrs: attrs
				};
			}

			$scope.$parent.$watch($attrs.draggable, function() {
				if($scope.$parent == null) return;
				//console.log($attrs.draggable, $scope)
				if(!$scope.$parent[$attrs.draggable]) {
					$element.draggable();
					$element.draggable('disable');	
					return;
				}

				init($scope, $element, $attrs)

			}, false);
		}
	}
})
.directive('droppable', function() {
	return {
		restrict: 'A',
		link: function (scope, element, attrs) {
			element.droppable({
				accept: attrs.droppableAccept,
				activeClass: attrs.droppableActiveClass,
				hoverClass: attrs.droppableHoverClass,
				drop: function(e, ui) {
					scope[attrs.droppableDrop].call(scope, ui.draggable[0].dragContext.scope, scope, ui.draggable[0], this, ui.draggable[0].dragContext, e);
				}
			});
		}
	}
})
.directive('match', function($parse) {
	return {
		require: 'ngModel',
		link: function(scope, elem, attrs, ctrl) {
			scope.$watch(function() {
				return $parse(attrs.match)(scope) === ctrl.$modelValue;
			}, function(currentValue) {
				ctrl.$setValidity('mismatch', currentValue);
			});
		}
	};
});

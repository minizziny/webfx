angular.module('app.directive', ['pascalprecht.translate'])
.directive('autosize', function() {
	return {
		restrict: 'A',
		link: function(scope, $self, attrs) {
			var shadow, minHeight, noFlickerPad, maxHeight;
			$self.on('keydown.autosize', throttle(update, 300)).on('keyup.autosize', throttle(update, 300)).on('focus', update).on('click', update);
			maxHeight = parseInt(attrs.autosizeMaxHeight);

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
				shadow[0].innerHTML = (val + (noFlickerPad === 0 ? '...' : '')); // Append '...' to resize pre-emptively.
				$self.height( Math.min( Math.max(shadow.height() + noFlickerPad, minHeight), maxHeight ) );

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
							element.off('click.tr-multi');
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

					scope.$apply();
				});
			}
		}
	}
})
.directive('treeElement', function($compile) {
	return {
		restrict: 'E',
		link: function (scope, element, attrs)
		{	
			var iconRefresh = '<button ng-click="childRefresh($event)" el-type="refresh" class="icon pull-right" style="display:none">\
				<i class="icon-refresh" style="margin-top:0"></i>\
			</button>';

			var indiRefresh = '<span class="pull-right indi" style="display: none; color: silver; font-style: italic; font-size: 8pt; letter-spacing: -1px">새로고침 중...</span>';

			if(!!scope.node.children) {
				
				var template = angular.element(
					'<ul class="nav nav-list" ng-show="!node.isCollapsed">\
						<li ng-repeat="node in node.children | filter: filterItem"\
							ng-class="{\'active\': node.isSelected}"\
							node-tree-type="{{node.' + attrs.nodeTreeType + '}}"\
							node-id="{{node.' + attrs.nodeId + '}}"\
							node-parent="{{node.' + attrs.nodeParent + '}}">\
							<a el-type="item" ng-mouseover="showIcon($event)" ng-mouseout="hideIcon($event)">\
								<input type="checkbox" ng-show="node.is_edit_mode">\
								<tree-toggle is-collapsed="node.isCollapsed"></tree-toggle>\
								<i class="tree-node-icon {{node.' + attrs.nodeIconClass + '}}"></i>\
								<span el-type="item">{{node.' + attrs.nodeName + '}}</span>' +
								indiRefresh +
								iconRefresh +
							'</a>\
							<tree-element tree="node"\
								node-tree-type="' + attrs.nodeTreeType + '"\
								node-id="' + attrs.nodeId + '"\
								node-icon="' + attrs.nodeIcon + '"\
								node-icon-class="' + attrs.nodeIconClass + '"\
								node-name="' + attrs.nodeName + '"\
								node-parent="' + attrs.nodeParent + '">\
							</tree-element>\
						</li>\
					</ul>');
				
				var linkFunction = $compile(template);
				linkFunction(scope);
				// element.replaceWith( template );
				element.append(template);
			}
			else {
				element.remove();
			}
		}
	};
})
.directive('treeToggle', function($compile, $parse) {
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			var isCollapsed = $parse(attrs.isCollapsed)(scope);
			if(!!scope.node.children) {
				var template = angular.element('<i class="icon-minus tree-node-icon" el-type="toggle"></i>');
			}
			else {
				var template = angular.element('<i class="icon-null tree-node-icon" el-type="toggle"></i>');	
			}

			if(isCollapsed) {
				var template = angular.element('<i class="icon-plus tree-node-icon" el-type="toggle"></i>');
			}

			scope.$watch('node.isCollapsed', function() {
				if(!scope.node.isCollapsed) {
					template.removeClass('icon-plus').addClass('icon-minus');
				}
				else {
					template.addClass('icon-plus').removeClass('icon-minus');
				}
			})

			template.on('click', function() {
				scope.node.isCollapsed = !scope.node.isCollapsed;
				scope.$apply();
			})
				
			var linkFunction = $compile(template);
			linkFunction(scope);
			element.replaceWith(template);
		}
	}
})
.directive('treeRoot', function($compile, $parse, $timeout) {
	return {
		restrict: 'E',
		link: function (scope, element, attrs) {
			var iconRefresh = '<button ng-click="childRefresh($event)" el-type="refresh" class="icon pull-right" style="display:none">\
				<i class="icon-refresh" style="margin-top:0"></i>\
			</button>';

			var indiRefresh = '<span class="pull-right indi" style="display: none; color: silver; font-style: italic; font-size: 8pt; letter-spacing: -1px">새로고침 중...</span>';

			scope.$watch(attrs.treeData, function(val) {				
				var template = angular.element(
					'<div class="tree-container"><input type="search" placeholder="' + attrs.treeSearchPlaceholder + '" ng-model="filterValue"/>' + 
					'<ul class="nav nav-list tree-root">\
						<li ng-repeat="node in ' + attrs.treeData + ' | filter: filterItem"\
							ng-class="{\'active\': node.isSelected}"\
							node-tree-type="{{node.' + attrs.nodeTreeType + '}}"\
							node-id="{{node.' + attrs.nodeId + '}}"\
							node-parent="{{node.' + attrs.nodeParent + '}}">\
							<a el-type="item" ng-mouseover="showIcon($event)" ng-mouseout="hideIcon($event)">\
								<tree-toggle></tree-toggle>\
								<span el-type="item">{{node.' + attrs.nodeName + '}}</span>' +
								indiRefresh +
								iconRefresh +
							'</a>\
							<tree-element tree="node"\
								node-tree-type="' + attrs.nodeTreeType + '"\
								node-id="' + attrs.nodeId + '"\
								node-icon="' + attrs.nodeIcon + '"\
								node-icon-class="' + attrs.nodeIconClass + '"\
								node-name="' + attrs.nodeName + '"\
								node-parent="' + attrs.nodeParent + '">\
							</tree-element>\
						</li>\
					</ul></div>');
				
				var linkFunction = $compile(template);
				linkFunction(scope);
				element.html(null).append( template );

				scope.showIcon = function(e) {
					var id = angular.element(e.currentTarget).parent().attr('node-id');
					if( $parse(attrs.nodeMouseover)(scope, {$event:e, $id: id}) ) {
						angular.element(e.currentTarget).find('button.icon').show();
					}
				}

				scope.hideIcon = function(e) {
					$(e.currentTarget).find('button.icon').hide();
				}

				scope.childRefresh = function(e) {
					var elA = angular.element(e.currentTarget).parent();
					var id = elA.parent().attr('node-id'),
						elIcon = $(e.currentTarget).find('i'),
						elLoading = $(e.currentTarget).prev();

					elIcon.hide();
					elLoading.show();

					var currScope = elA.scope();
					currScope.node.isCollapsed = false;

					var promise = $parse(attrs.nodeClickRefresh)(scope, {$event:e, $id: id});
					promise.success(function() {
						console.log('refreshed!');
						elIcon.show();
						elLoading.hide();
						currScope.$apply();
					})
					.failed(function(error) {
						console.log('failed', error)
					});
				}

				scope.$watch('filterValue', function() {
					scope.$broadcast('nodeOnFiltering', { 
						'hello': 'world'
					});
				});

				scope.filterItem = function(item) {
					if (!scope.filterValue) return true;

					var found = item.name.toLowerCase().indexOf(scope.filterValue.toLowerCase()) != -1;

					if (!found) {
						angular.forEach(item.children, function(item) {
							var match = scope.filterItem(item);
							if (match) {
								found = true;
							}
						});
					}

					return found;
				}

				$timeout(function() {
					scope.currentNode = template.find('.active');
				})

				function UnselectAll(arr) {
					if(angular.isArray(arr)) {
						arr.forEach(function(obj) {
							obj.isSelected = false;
							UnselectAll(obj.children);
						});
					}
				}

				template.unbind().bind('click', function(e) {
					e.preventDefault();
					e.stopPropagation();

					if(angular.element(e.target).length) {
						if($(e.target).attr('el-type') == 'item') {
							
							if(e.target.tagName == 'SPAN') {
								var target = e.target.parentNode;
							}
							else if(e.target.tagName == 'A') {
								var target = e.target;
							}

							UnselectAll(scope[attrs.treeData]);

							scope.currentNode = $(target).parent();
							scope.currentNode.scope().node.isSelected = true;

							scope.$broadcast('nodeSelected', {
								selectedNode: scope.currentNode.attr('node-id'),
								selectedNodeType: scope.currentNode.attr('node-tree-type'),
								selectedNodeRaw: scope.currentNode,
								selectedNodeScope: scope,
								selectedNodeParent: scope.currentNode.attr('node-parent')
							});

							scope.$apply();
						}
						
						if($(e.target).attr('el-type') == 'toggle') {
							var parentElement = angular.element(e.target).parent().parent();
							
							if(parentElement.children().length) {
								var isHidden = !parentElement.find('ul:first').is(':hidden');

								scope.$broadcast('nodeToggled', { 
									isHidden: isHidden,
									selectedNode: parentElement.attr('node-id'),
									selectedNodeType: parentElement.attr('node-tree-type'),
									selectedNodeRaw: parentElement,
									selectedNodeScope: scope,
									selectedNodeParent: parentElement.attr('node-parent')
								});
							}
						}
					}
				});
			}, false);
		}
	}
})
.directive('hoverinput', function($compile) {
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			var a = $('<a >');
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

			element.unbind('input').unbind('keydown.onblur').unbind('change');
			element.bind('blur.onblur', function() {
				if(!cancel) {
					ngModelCtrl.$setViewValue(element.val());
				}

				if(scope[attrs.ngModelOnblur] != undefined) {
					if(scope[attrs.ngModelOnblur].hasOwnProperty('is_edit_mode')) {
						scope[attrs.ngModelOnblur].is_edit_mode = false;	
					}
				}
				
				setTimeout(function() {
					scope.$apply();
					cancel = false;
				}, 100);
			}).bind('keydown.onblur', function(e) {
				if(element[0].tagName == 'INPUT' && e.keyCode == 13) {
					this.blur();
				}
				else if(e.keyCode == 27) {
					cancel = true;
					if(!!attrs.ngCancel) {
						scope[attrs.ngCancel].call(scope, this);
					}
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
						return expr.substring(expr.indexOf('in') + 3, expr.length).split('|')[0].trim();
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
					scope[attrs.droppableDrop].call(scope, ui.draggable[0].dragContext.scope, scope, ui.draggable[0]
						, this, ui.draggable[0].dragContext, e);
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
})
.directive('ngUnique', function($parse) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attrs, ctrl) {
			
			scope.$watch(attrs.ngModel, function(value) {
				var option = scope.$eval(attrs.ngUnique);
				if(option.condition) {
					var has = option.source.some(function(obj) {
						return obj[option.property] == value;
					});

					ctrl.$setValidity('unique', !has);
				}
			});
		}
	}
})
.directive('passwordValidate', function($parse) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attrs, ctrl) {
			var mdlTree = attrs.ngModel.split('.');
			
			var getLastParent = function(obj, arr) {
				if (arr.length > 0) {
					if (arr.length == 1) {
						return obj;
					}
					else {
						//console.log( obj, arr, obj[arr[0]] );
						if(obj[arr[0]] == null) {
							return obj;
						}
						else return getLastParent(obj[arr[0]], (function() { 
							arr.shift();
							return arr;
						})());
					}
				}
				else {
					return obj;
				}
			}

			var scp = getLastParent(scope, mdlTree);
			scp.$watch(mdlTree[0], function(value) {
				var realValue = scp.$eval(mdlTree.join('.'));

				var option = scope.$eval(attrs.passwordValidate);
				if(option == null) {
					option = { condition: true };
				}

				if(realValue == null || !option.condition) {
					ctrl.$setValidity('inadequacy', true);
				}
				else {
					var cond = /[0-9]+/.test(realValue);
					cond = cond & (/[a-zA-Z]+/.test(realValue));
					cond = cond & (/[^0-9a-zA-Z]+/.test(realValue));
					cond = cond & (realValue.length >= 9);
					ctrl.$setValidity('inadequacy', cond);
				}
			}, true);
		}
	};
})
.directive('pager', function() {
	return {
		restrict: 'E',
		scope: {
			onPageChange: '&',
			onItemsPerPageChange: '&',
			ngTotalCount: '=',
			ngItemsPerPage: '=',
			ngPageSize: '=',
			currentPage: '@',
			currentIndex: '@'
		},
		require: 'ngModel',
		template: '<div class="pagination" ng-hide="ngTotalCount == 0">\
					<ul>\
						<li>\
							<a  ng-click="firstPage()">{{"$S_str_First" | translate}}</a>\
						</li>\
					</ul>\
					<ul>\
						<li>\
							<a ng-click="prevPage()">&lt;&lt;</a>\
						</li>\
						<li>\
							<a ng-click="prevOnePage()">&lt;</a>\
						</li>\
						<li ng-class="{\'active\': currentIndex % ngPageSize == i}" ng-repeat="(i,z) in arrPageSize">\
							<a  ng-click="changePage($index + (currentPage * ngPageSize), $event)">\
								{{ 1 + i + (currentPage * ngPageSize) }}\
							</a>\
						</li>\
						<li>\
							<a ng-click="nextOnePage()">&gt;</a>\
						</li>\
						<li>\
							<a ng-click="nextPage()">&gt;&gt;</a>\
						</li>\
					</ul>\
					<ul>\
						<li>\
							<a  ng-click="lastPage()">{{"$S_str_Last" | translate}}(<span>{{totalIndexCount}}</span>)</a>\
						</li>\
					</ul>\
					<button class="btn btn-mini" style="vertical-align: top; margin: 2px 5px 0px 0px" ng-click="openJumpPopup($event)"><i class="icon-share-alt"></i></button>\
					<div style="position: relative; float: right">\
						<div class="popover top" style="display:block; left: -235px; top: -130px" ng-show="isShowJumpPopup" ng-click="stopPropagation($event)">\
							<div class="arrow" style="left:94%"></div>\
							<h3 class="popover-title">{{"$S_str_MovePage" | translate}}</h3>\
							<div class="popover-content"><form>\
								<input type="number" min="1" max="{{totalIndexCount}}" ng-model="targetIndex" style="float:left; width:120px">\
								<button class="btn btn-primary" ng-click="goPage(targetIndex - 1)" style="margin-left: 10px">{{"$S_str_Go" | translate}}</button>\
							</form></div>\
						</div>\
					</div>\
					<div style="display:none"><br>\
					ngTotalCount: {{ngTotalCount}}<br>\
					ngItemsPerPage: {{ngItemsPerPage}}<br>\
					ngPageSize: {{ngPageSize}}<br>\
					currentPage: {{currentPage}}<br>\
					currentIndex: {{currentIndex}}<br></div>\
				</div>',
		link: function(scope, elem, attr, ctrl) {
			scope.currentIndex = 0;
			scope.currentPage = 0;
			scope.arrPageSize = [];
			scope.totalIndexCount;
			scope.targetIndex = 1;

			elem[0].getCurrentIndex = function() {
				return scope.currentIndex;
			}

			function getTotalPageCount() {
				return Math.ceil(scope.ngTotalCount / scope.ngItemsPerPage);
			}

			function getLastPage() {
				var totalPageCount = getTotalPageCount();
				return Math.ceil(totalPageCount / scope.ngPageSize) - 1;
			}

			scope.nextPage = function() {
				if(scope.currentPage == getLastPage()) return;
				scope.currentPage = scope.currentPage + 1;
				render();
				if(scope.currentIndex + scope.ngPageSize > getTotalPageCount() - 1) {
					scope.currentIndex = getTotalPageCount() - 1;
				}
				else {
					scope.currentIndex = scope.currentIndex + scope.ngPageSize;	
				}
				
				changePage(scope.currentIndex);
			}

			scope.nextOnePage = function () {
				if(scope.currentIndex == getTotalPageCount() - 1) return;	

				if(scope.currentIndex % scope.ngPageSize == 9)
					scope.currentPage = scope.currentPage + 1;

				render();
				scope.currentIndex = scope.currentIndex + 1;	
				changePage(scope.currentIndex);
			}
			
			scope.prevPage = function() {
				if(scope.currentPage == 0) return;
				scope.currentPage = scope.currentPage - 1;
				render();
				scope.currentIndex = scope.currentIndex - scope.ngPageSize;
				changePage(scope.currentIndex);
			}

			scope.prevOnePage = function() {
				if(scope.currentIndex == 0) return;

				if(scope.currentIndex % scope.ngPageSize == 0)
					scope.currentPage = scope.currentPage - 1;

				render();
				scope.currentIndex = scope.currentIndex - 1;
				changePage(scope.currentIndex);
			}

			scope.firstPage = function() {
				scope.currentPage = 0;
				scope.currentIndex = 0;
				render();
				changePage(scope.currentIndex);
			}

			scope.lastPage = function() {
				scope.currentPage = getLastPage();
				scope.currentIndex = getTotalPageCount() - 1;
				render();
				changePage(scope.currentIndex);
			}

			scope.changePage = function(idx, e) {
				if(e != null) {
					e.preventDefault();
				}
				scope.currentIndex = idx;
				changePage(idx);
			}

			scope.goPage = function(idx) {
				var totalPageCount = getTotalPageCount();
				if(idx < 0 || idx > totalPageCount-1) return;
				if(idx == -1) return;
				scope.currentIndex = idx;
				scope.currentPage = Math.floor(scope.currentIndex / scope.ngPageSize);
				render();
				changePage(idx);
				scope.isShowJumpPopup = false;
			}

			elem[0].changePage = scope.goPage;

			function changePage(idx) {
				if(idx < 0) idx = 0;
				var expr = attr.onPageChange.replace('()', '(' + idx + ')')
				scope.$parent.$eval(expr);
			}

			function render() {
				// console.warn('render');
				var totalPageCount = getTotalPageCount();
				scope.totalIndexCount = totalPageCount;

				if(getLastPage() == scope.currentPage) {
					// console.log(totalPageCount % scope.ngPageSize, scope.ngPageSize);
					if(totalPageCount % scope.ngPageSize == 0) {
						scope.arrPageSize = new Array(scope.ngPageSize);
					}
					else if(totalPageCount % scope.ngPageSize < scope.ngPageSize) {
						scope.arrPageSize = new Array(totalPageCount % scope.ngPageSize);
					}
				}
				else {
					if(totalPageCount > scope.ngPageSize) {
						scope.arrPageSize = new Array(scope.ngPageSize);
					}
					else {
						scope.arrPageSize = new Array(totalPageCount);
					}	
				}
				
			}

			function setTotalCount(count) {
				scope.ngTotalCount = count;
			}

			elem[0].setTotalCount = setTotalCount;

			elem[0].reset = function() {
				scope.currentPage = 0;
				scope.currentIndex = 0;
			}

			scope.$watch('ngTotalCount', function() {
				if(scope.currentIndex == undefined) {
					scope.currentIndex = 0;	
				}
				if(scope.currentPage == undefined) {
					scope.currentPage = 0;	
				}
				
				render();
			});

			scope.$watch('ngItemsPerPage', function(val) {

				var totalPageCount = getTotalPageCount();
				if(scope.currentIndex > totalPageCount - 1) {
					scope.currentIndex = totalPageCount - 1;
					changePage(scope.currentIndex);
				}

				// console.log(getTotalPageCount(), scope.ngPageSize, scope.currentPage, getLastPage())

				if(getLastPage() < scope.currentPage) {
					scope.currentPage = getLastPage();
				}

				render();
				scope.$parent.$eval(attr.onItemsPerPageChange);
			});

			scope.isShowJumpPopup = false;

			scope.openJumpPopup = function(e) {
				e.stopPropagation();
				if(scope.isShowJumpPopup) {
					scope.isShowJumpPopup = false;
					return;
				}

				scope.isShowJumpPopup = true;
				$(document).on('click.pagerJumpPop', function(ee) {
					scope.isShowJumpPopup = false;
					$(document).off('click.pagerJumpPop');
					scope.$apply();
				});
				//scope.$apply();

				setTimeout(function() {
					$('.popover input[type=number]').focus();
				},250);
			}

			scope.stopPropagation = function(e) {
				e.stopPropagation();
			}
		}
	}
})
.directive('pagerAudit', function() {
	return {
		restrict: 'E',
		scope: {
			onPageChange: '&',
			onItemsPerPageChange: '&',
			ngTotalCount: '=',
			ngItemsPerPage: '=',
			ngPageSize: '=',
			currentPage: '@',
			currentIndex: '@'
		},
		require: 'ngModel',
		template: '<div class="pagination" ng-hide="ngTotalCount == 0">\
					<ul>\
						<li>\
							<a  ng-click="firstPage()">{{"$S_str_First" | translate}}</a>\
						</li>\
					</ul>\
					<ul>\
						<li>\
							<a ng-click="prevPage()">&lt;&lt;</a>\
						</li>\
						<li>\
							<a ng-click="prevOnePage()">&lt;</a>\
						</li>\
						<li ng-class="{\'active\': currentIndex % ngPageSize == i}" ng-repeat="(i,z) in arrPageSize">\
							<a  ng-click="changePage($index + (currentPage * ngPageSize), $event)">\
								{{ 1 + i + (currentPage * ngPageSize) }}\
							</a>\
						</li>\
						<li>\
							<a ng-click="nextOnePage()">&gt;</a>\
						</li>\
						<li>\
							<a ng-click="nextPage()">&gt;&gt;</a>\
						</li>\
					</ul>\
					<ul>\
						<li>\
							<a  ng-click="lastPage()">{{"$S_str_Last" | translate}}(<span>{{totalIndexCount}}</span>)</a>\
						</li>\
					</ul>\
					<div style="display:none"><br>\
					ngTotalCount: {{ngTotalCount}}<br>\
					ngItemsPerPage: {{ngItemsPerPage}}<br>\
					ngPageSize: {{ngPageSize}}<br>\
					currentPage: {{currentPage}}<br>\
					currentIndex: {{currentIndex}}<br></div>\
				</div>',
		link: function(scope, elem, attr, ctrl) {
			scope.currentIndex = 0;
			scope.currentPage = 0;
			scope.arrPageSize = [];
			scope.totalIndexCount;
			scope.targetIndex = 1;

			elem[0].getCurrentIndex = function() {
				return scope.currentIndex;
			}

			function getTotalPageCount() {
				return Math.ceil(scope.ngTotalCount / scope.ngItemsPerPage);
			}

			function getLastPage() {
				var totalPageCount = getTotalPageCount();
				return Math.ceil(totalPageCount / scope.ngPageSize) - 1;
			}

			scope.nextPage = function() {
				if(scope.currentPage == getLastPage()) return;
				scope.currentPage = scope.currentPage + 1;
				render();
				if(scope.currentIndex + scope.ngPageSize > getTotalPageCount() - 1) {
					scope.currentIndex = getTotalPageCount() - 1;
				}
				else {
					scope.currentIndex = scope.currentIndex + scope.ngPageSize;	
				}
				
				changePage(scope.currentIndex);
			}

			scope.nextOnePage = function () {
				if(scope.currentIndex == getTotalPageCount() - 1) return;	

				if(scope.currentIndex % scope.ngPageSize == 9) {
					scope.currentPage = scope.currentPage + 1;
				}

				render();

				scope.currentIndex = scope.currentIndex + 1;
				changePage(scope.currentIndex);
			}
			
			scope.prevPage = function() {
				if(scope.currentPage == 0) return;
				scope.currentPage = scope.currentPage - 1;
				render();
				scope.currentIndex = scope.currentIndex - scope.ngPageSize;
				changePage(scope.currentIndex);
			}

			scope.prevOnePage = function() {
				if(scope.currentIndex == 0) return;

				if(scope.currentIndex % scope.ngPageSize == 0)
					scope.currentPage = scope.currentPage - 1;

				render();
				scope.currentIndex = scope.currentIndex - 1;
				changePage(scope.currentIndex);
			}

			scope.firstPage = function() {
				scope.currentPage = 0;
				scope.currentIndex = 0;
				render();
				changePage(scope.currentIndex);
			}

			scope.lastPage = function() {
				scope.currentPage = getLastPage();
				scope.currentIndex = getTotalPageCount() - 1;
				render();
				changePage(scope.currentIndex);
			}

			scope.changePage = function(idx, e) {
				if(e != null) {
					e.preventDefault();
				}
				scope.currentIndex = idx;
				changePage(idx);
			}

			scope.goPage = function(idx) {
				var totalPageCount = getTotalPageCount();
				if(idx < 0 || idx > totalPageCount-1) return;
				if(idx == -1) return;
				scope.currentIndex = idx;
				scope.currentPage = Math.floor(scope.currentIndex / scope.ngPageSize);
				render();
				changePage(idx);
				scope.isShowJumpPopup = false;
			}

			elem[0].changePage = scope.goPage;

			function changePage(idx) {
				if(idx < 0) idx = 0;
				var expr = attr.onPageChange.replace('()', '(' + idx + ')')
				scope.$parent.$eval(expr);
			}

			function render() {
				// console.warn('render');
				var totalPageCount = getTotalPageCount();
				scope.totalIndexCount = totalPageCount;

				if(getLastPage() == scope.currentPage) {
					if(totalPageCount % scope.ngPageSize == 0) {
						scope.arrPageSize = new Array(scope.ngPageSize);
					}
					else if(totalPageCount % scope.ngPageSize < scope.ngPageSize) {
						scope.arrPageSize = new Array(totalPageCount % scope.ngPageSize);
					}
				}
				else {
					if(totalPageCount > scope.ngPageSize) {
						scope.arrPageSize = new Array(scope.ngPageSize);
					}
					else {
						scope.arrPageSize = new Array(totalPageCount);
					}
				}
				
			}

			function setTotalCount(count) {
				scope.ngTotalCount = count;
			}

			elem[0].setTotalCount = setTotalCount;

			elem[0].reset = function() {
				scope.currentPage = 0;
				scope.currentIndex = 0;
			}

			scope.$watch('ngTotalCount', function() {
				if(scope.currentIndex == undefined) {
					scope.currentIndex = 0;	
				}
				if(scope.currentPage == undefined) {
					scope.currentPage = 0;	
				}				
				render();
			});

			// scope.$watch('ngItemsPerPage', function(val) {

			// 	var totalPageCount = getTotalPageCount();
			// 	if((scope.currentIndex > totalPageCount - 1)) {
			// 		scope.currentIndex = totalPageCount - 1;
			// 		changePage(scope.currentIndex);
			// 	}

			// 	// console.log(getTotalPageCount(), scope.ngPageSize, scope.currentPage, getLastPage())

			// 	if(getLastPage() < scope.currentPage) {
			// 		scope.currentPage = getLastPage();
			// 	}

			// 	render();
			// 	scope.$parent.$eval(attr.onItemsPerPageChange);

				
			// });

			scope.isShowJumpPopup = false;

			scope.openJumpPopup = function(e) {
				e.stopPropagation();
				if(scope.isShowJumpPopup) {
					scope.isShowJumpPopup = false;
					return;
				}

				scope.isShowJumpPopup = true;
				$(document).on('click.pagerJumpPop', function(ee) {
					scope.isShowJumpPopup = false;
					$(document).off('click.pagerJumpPop');
					scope.$apply();
				});
				//scope.$apply();

				setTimeout(function() {
					$('.popover input[type=number]').focus();
				},250);
			}

			scope.stopPropagation = function(e) {
				e.stopPropagation();
			}
		}
	}
})
.directive('inputFile', function($compile) {
	return {
		restrict: 'E',
		scope: {
			'onChange': '&',
			'fileName': '@'
		},
		template: '<input type="text" ng-model="fileName" class="file_input_textbox" readonly="readonly">\
			<div class="file_input_div">\
				<input type="button" value="{{\'$S_str_Browser\' | translate}}" class="file_input_button btn" ng-class="{\'hover\': isHover}" />\
				<input type="file" class="file_input_hidden" ng-mouseover="isHover = true" ng-mouseout="isHover = false" />\
			</div>',
		link: function(scope, el, attrs) {
			var elInput = el.find('input[type=file]');
			elInput.on('change', function(event) {
				scope.fileName = this.value.split('\\').pop();
				var file = event.target.files[0];

				if (file) {
					var fr = new FileReader();
					fr.onload = function(e) { 
						var contents = e.target.result;
						scope.onChange({
							'$file': contents,
							'$filename': scope.fileName
						});
					}
					fr.readAsText(file);
				}
				else {
					scope.onChange({
						'$file': null,
						'$filename': null
					});
				}

				scope.$apply();
			});
		}
	}
})
.directive('datepicker', function() {
    return {
        restrict: 'A',
        require : 'ngModel',
        link : function (scope, element, attrs, ngModelCtrl) {
            $(function(){
                element.datepicker({
                    dateFormat:'yymmdd',
                    inline: true,  
          			showOtherMonths: true,
                    onSelect:function (date) {
                        ngModelCtrl.$setViewValue(date);
                        scope.$apply();
                    }
                });
            });
        }
    }
})
.directive('onlyNumber', function() {
	return {
		restrict: 'A',
		link: function(scope, element, attrs, ngModelCtrl) {
			element.on('keydown', function(e) {
				if (e.type === 'keydown') {
					if((e.keyCode < 48) || (e.keyCode > 57)){
						if(e.keyCode != 8)
							e.preventDefault();
					}
				}
			});
		}
	}
});

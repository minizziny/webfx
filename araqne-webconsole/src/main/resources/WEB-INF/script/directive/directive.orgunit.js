angular.module('App.Directive.Tree', [])
.directive('hierachyView', function($compile) {
	return {
		restrict: 'E',
		link: function (scope, element, attrs)
		{
			scope.tree = scope.node;
			
			if(!!scope.tree.children) {
				for(var i in scope.tree.children) {
					if(typeof scope.tree.children[i] == 'function') {
						continue;
					}
					if(!!scope.tree.children[i].children) {
						scope.tree.children[i].className = "deselected";
					}
					else {
						scope.tree.children[i].className = "child deselected";
					}
				}

				var template = angular.element(
					'<ul class="nav nav-list">' + 
						'<li ng-class="{ \'active\': node.is_selected }" ng-repeat="node in tree.children" node-tree-type="{{node.' + attrs.nodeTreeType + '}}" node-id="{{node.' + attrs.nodeId + '}}" ng-class="node.className">' +
							'<a ng-hide="node.is_edit_mode" style="position:relative" href="#" ng-mouseover="showIcon($event)" ng-mouseout="hideIcon($event)" ng-click="eventClickListAnchor($event)" el-type="group" draggable="true" droppable droppable-accept="[el-type=group],[el-type=user]" droppable-active-class="ui-state-active" droppable-hover-class="ui-state-hover" droppable-drop="onDrop">' +
								'<tree-toggle></tree-toggle>' +
								'<i class="tree-node-icon {{node.' + attrs.nodeIconClass + '}}"></i>' +
								'{{node.' + attrs.nodeName + '}}' +
								'<button ng-click="showMenu($event)" el-type="dropdown" href="#" class="menu pull-right" style="display:none"><span class="caret"></span></button>' +
							'</a>' +
							'<div class="li-edit" ng-show="node.is_edit_mode">' +
								'<tree-toggle></tree-toggle>' +
								'<i class="tree-node-icon {{node.' + attrs.nodeIconClass + '}}"></i>' +
								'<input ng-model="node.' + attrs.nodeName + '" ng-model-onblur="node" ng-change="changeName()" type="text" >' +   /* value="{{node.' + attrs.nodeName + '}}">' + */
							'</div>' +
							'<hierachy-view tree="node" node-tree-type="' + attrs.nodeTreeType + '" node-id="' + attrs.nodeId + '" node-icon="' + attrs.nodeIcon + '" node-icon-class="' + attrs.nodeIconClass + '" node-name="' + attrs.nodeName + '"></hierachy-view>' +
						'</li>' +
					'</ul>');

				var dd = angular.element(
					'<ul ng-mousedown="supressEvent($event)" class="dropdown-menu" style="display:none; left:auto; right: 0px; top: 22px">' +
						'<li><a ng-click="addChildNode()" tabindex="-1" href="#">새 그룹</a></li>' +
						'<li><a ng-click="renameNode()" tabindex="-1" href="#">이름 바꾸기</a></li>' +
						'<li class="divider"></li>' +
						'<li><a ng-click="removeNode()" tabindex="-1" href="#">삭제</a></li>' +
					'</ul>');

				template.find('button[el-type="dropdown"]').after(dd);

				var linkFunction = $compile(template);
				linkFunction(scope);
				element.replaceWith(template);
			}
			else {
				element.remove();
			}
		}
	};
})
.directive('tree', function($compile) {
	return {
		restrict: 'E',
		link: function (scope, element, attrs) {

			scope.previousElement = null;
			scope.currentElement = null;
			scope.$watch(attrs.treeData, function(val) {
				for(var i in scope[attrs.treeData]) {
					if(!!scope[attrs.treeData][i].children) {
						scope[attrs.treeData][i].className = "deselected";
					}
					else {
						scope[attrs.treeData][i].className = "child deselected";
					}

					if(scope[attrs.treeData][i][attrs.nodeId] == attrs.nodeSelected) {
						scope[attrs.treeData][i].className = "active";	
					}
				}
				
				var template = angular.element(
					'<ul class="nav nav-list tree-root">' + 
						'<li ng-class="{ \'active\': node.is_selected }" ng-repeat="node in ' + attrs.treeData + '" node-tree-type="{{node.' + attrs.nodeTreeType + '}}" node-id="{{node.' + attrs.nodeId + '}}" ng-class="node.className">' +
							'<a ng-hide="node.is_edit_mode" style="position:relative" href="#" ng-mouseover="showIcon($event)" ng-mouseout="hideIcon($event)" ng-click="eventClickListAnchor($event)" el-type="group" draggable="true" droppable droppable-accept="[el-type=group],[el-type=user]" droppable-active-class="ui-state-active" droppable-hover-class="ui-state-hover" droppable-drop="onDrop">' +
								'<tree-toggle></tree-toggle>' +
								'<i class="tree-node-icon {{node.' + attrs.nodeIconClass + '}}"></i>' +
								'{{node.' + attrs.nodeName + '}}' +
								'<button ng-click="showMenu($event)" el-type="dropdown" href="#" class="menu pull-right" style="display:none"><span class="caret"></span></button>' +
							'</a>' +
							'<div class="li-edit" ng-show="node.is_edit_mode">' +
								'<tree-toggle></tree-toggle>' +
								'<i class="tree-node-icon {{node.' + attrs.nodeIconClass + '}}"></i>' +
								'<input ng-model="node.' + attrs.nodeName + '" ng-model-onblur="node" ng-change="changeName()" type="text" >' +   /* value="{{node.' + attrs.nodeName + '}}">' + */
							'</div>' +
							'<hierachy-view tree="node" node-tree-type="' + attrs.nodeTreeType + '" node-id="' + attrs.nodeId + '" node-icon="' + attrs.nodeIcon + '" node-icon-class="' + attrs.nodeIconClass + '" node-name="' + attrs.nodeName + '"></hierachy-view>' +
						'</li>' +
					'</ul>');

				var dd = angular.element(
					'<ul ng-mousedown="supressEvent($event)" class="dropdown-menu" style="display:none; left:auto; right: 0px; top: 22px">' +
						'<li><a ng-click="addChildNode()" tabindex="-1" href="#">새 그룹</a></li>' +
						'<li><a ng-click="renameNode()" tabindex="-1" href="#">이름 바꾸기</a></li>' +
						'<li class="divider"></li>' +
						'<li><a ng-click="removeNode()" tabindex="-1" href="#">삭제</a></li>' +
					'</ul>');
				
				scope.supressEvent = function(e) {
					e.stopPropagation();
				}

				scope.changeName = function() {
					console.log('changed!!!')
				}

				scope.showIcon = function(e) {
					$(e.currentTarget).find('button.menu').show();
				}

				scope.hideIcon = function(e) {
					$(e.currentTarget).find('button.menu').hide();
				}

				scope.showMenu = function(e) {
					//console.log(e.pageY, $(document).height(), $(document).height() - e.pageY - 110)
					var upper = $(document).height() - e.pageY - 110 < 0;
					$('ul.dropdown-menu').hide();
					$('li.check').removeClass('check');

					e.stopPropagation();

					var elmenu = $(e.currentTarget).next();
					var elli = $(e.currentTarget).parent().parent();
					elmenu.show();

					if(upper) {
						elmenu.addClass('upper');
					}
					elli.addClass('check');

					$(document).on('mousedown.hideMenu', function() {
						elmenu.hide().removeClass('upper');
						elli.removeClass('check');
						$(document).off('mousedown.hideMenu');
					});

					$(document).on('click.hideMenu', function() {
						elmenu.hide().removeClass('upper');
						elli.removeClass('check');
						$(document).off('click.hideMenu');
					});
				}
				
				scope.eventClickListAnchor = function(e) {
					
				}

				scope.addChildNode = function() {
					$('.li-edit input[type=text]').blur();

					this.node.children.push( {
						children: [],
						//guid: "newguid",
						is_selected: undefined,
						is_edit_mode: true,
						name: "새그룹",
						parent: this.node.guid
					});

					setTimeout(function() {
						$('.li-edit input[type=text]').focus().select();
					}, 100);
				}

				scope.renameNode = function() {
					$('.li-edit input[type=text]').blur();

					this.node.is_edit_mode = true;

					setTimeout(function() {
						$('.li-edit input[type=text]').focus().select();
					}, 100);
				}

				function removeScope(s) {
					if(s.$parent.node == undefined) {
						s.$parent[attrs.treeData].splice(s.$parent[attrs.treeData].indexOf(s.node), 1);
					}
					else {
						s.$parent.node.children.splice(s.$parent.node.children.indexOf(s.node), 1);
					}
				}

				scope.removeNode = function() {
					removeScope(this);
				}

				function checkMoveChildren(scopeSource, scopeTarget) {

					if(scopeTarget.$parent == null) return false;

					if(scopeTarget.$parent == scopeSource) {
						return true;
					}
					else {
						return checkMoveChildren(scopeSource, scopeTarget.$parent);
					}
				}

				scope.onDrop = function(scopeSource, scopeTarget, elSource, elTarget, dragContext, e) {
					console.log($(elSource).attr('el-type'));
					if($(elSource).attr('el-type') == 'group') {
						if(checkMoveChildren(scopeSource, scopeTarget)) return;
						

						removeScope(scopeSource);
						scopeTarget.node.children.push(scopeSource.node);

						setTimeout(function() {
							scope.$apply();
						},100);
					}
					else if($(elSource).attr('el-type') == 'user') {

					}
					else {
						console.log(scopeSource, scopeTarget, elSource, elTarget, dragContext, e);
					}
					
				}

				template.find('button[el-type="dropdown"]').after(dd);
	
				var linkFunction = $compile(template);
				linkFunction(scope);
				element.html(null).append(template);
				
				setTimeout(function() {
					//console.log(scope.currentElement, scope.previousElement)
					if(scope.previousElement) {
						scope.previousElement.addClass('active');// = template.find('li.active');
					}
				}, 250)
				
				// Event
				template.unbind().bind('click', function(e) {
					//e.stopPropagation();

					if(angular.element(e.target).length) {
						if($(e.target).attr('el-type') == 'group') {
							e.preventDefault();
							$(e.target).focus();

							scope.previousElement = scope.currentElement;
							scope.currentElement = angular.element(e.target).parent();
							
							scope.$broadcast('nodeSelected', {
								selectedNode: (scope.currentElement.attr('node-id') == '') ? undefined : scope.currentElement.attr('node-id'),
								selectedNodeType: (scope.currentElement.attr('node-tree-type') == '') ? undefined : scope.currentElement.attr('node-tree-type'),
								selectedNodeRaw: scope.currentElement,
								selectedNodeScope: scope,
								delegateElement: element
							});
							
							if(scope.previousElement) {
								scope.previousElement.addClass('deselected').removeClass('active');
							}
							scope.currentElement.addClass('active').removeClass('deselected');
						}
						
						if($(e.target).attr('el-type') == 'toggle') {
							e.preventDefault();
							var currentElement = angular.element(e.target).parent().parent();
							if(currentElement.children().length) {
								currentElement.children().toggleClass("hide");
							}
						}

						if($(e.target).attr('el-type') == 'dropdown') {
							e.preventDefault();
							
						}
					}
				});
			}, false);
		}
	}
});
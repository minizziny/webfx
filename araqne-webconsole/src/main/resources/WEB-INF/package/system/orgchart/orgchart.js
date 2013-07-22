var app = angular.module('orgchart', ['App', 'App.Directive.Tree']);
var proc;

app.factory('eventSender', function() {
	var e = {
		onTreeSelectOrgUnit: null,
		onDropUsersToOrgUnit: null,
		onOpenDialogChangePassword: null
	}
	return e;
});

function getOrgUnit(guid, orgunits) {
	var found = null;
	orgunits.forEach(function(obj, i) {
		if(obj.guid == guid) {
			found = obj;
		}
		else {
			if(obj.children.length) {
				found = getOrgUnit(guid, obj.children);
			}
		}
	});

	return found;
}

app.directive('ngUnique', function($parse) {
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

app.directive('passwordValidate', function($parse) {
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
});

app.factory('serviceDom', function() {
	return {

	};
});

function Controller($scope, serviceTask, socket, eventSender) {
	serviceTask.init();
	proc = serviceTask.newProcess('logquery');

	$scope.testAlert = function() {
		var types = ['info', 'success', 'error'];
		var random = Math.floor(Math.random() * (2 - 0 + 1)) + 0;
		notify(types[random], '안녕하세요', Math.random() < 0.5 ? true : false);
	}

	$scope.treeDataSourceWithRoot = [];
	$scope.treeDataSource = [];

	$scope.dataAllUsers = [];
	$scope.isUserEditMode = false;

	eventSender.onGetAllUsers = function(body) {
		$scope.dataAllUsers = body;
		$scope.$apply();
	}

	$scope.closeExtraPane = function() {
		$('.extraPane').removeClass('in');
		$('.leftPane').removeClass('out');
		$('.rightPane').removeClass('out');
		$('.btnShowTree').hide();
	}

	$scope.glimpseLeftPane = function() {
		if(!$('.leftPane').hasClass('glimpse')) {
			$('.leftPane').addClass('glimpse');
		}
	}

	$scope.outLeftPane = function() {
		$('.leftPane').removeClass('glimpse');
	}

}

function RemoveUsersController($scope, socket, eventSender) {
	$scope.selectedUsers = [];
	eventSender.onRemoveUsers = function(selected) {
		$scope.selectedUsers = selected;
		$('.mdlRemoveUsers')[0].showDialog();
	}

	$scope.removeUsers = function() {
		var login_names = {
			'login_names': $scope.selectedUsers.map(function(obj) {
				return obj.login_name;
			})
		}
		
		socket.send('org.araqne.dom.msgbus.UserPlugin.removeUsers', login_names, proc.pid)
		.success(function(m) {

			if(m.body.failed_login_names.length > 0) {
				eventSender.onPartiallySuccessRemoveUsers($scope.selectedUsers, m.body.failed_login_names);
			}
			else {
				eventSender.onSuccessRemoveUsers($scope.selectedUsers);
			}

			$scope.$parent.isUserEditMode = false;
			$('body').css('overflow','');
			$scope.$parent.closeExtraPane();
			$('.mdlRemoveUsers')[0].hideDialog();

			$scope.selectedUsers = [];
		})
		.failed(openError);
	}

	$scope.cancelRemoveUsers = function() {
		$('.mdlRemoveUsers')[0].hideDialog();
	}
}

function UserController($scope, socket, eventSender) {
	$scope.selectedUser = null;
	$scope.selectedUserCopy = null;

	eventSender.onShowUser = function(user) {
		console.log('----', user.login_name, '----');
		console.log('::: onShowUser:\t', user);
		$scope.selectedUser = user;

		if(user._isNew) {
			$scope.enterUserEditMode();
		}
	}

	$scope.enterUserEditMode = function() {
		$scope.$parent.isUserEditMode = true;
		$('body').css('overflow','hidden');

		$scope.selectedUserCopy = angular.copy($scope.selectedUser);
		//console.log('enterUserEditMode', $scope.selectedUserCopy, $scope.selectedUser)

		$scope.selectedUserCopy.password = '';
		$scope.selectedUserCopy.passwordConfirm = '';

		eventSender.onEditUserAdmin($scope.selectedUser);
		eventSender.onEditUserPrivilege($scope.selectedUser);

	}

	$scope.saveUserInfo = function() {
		var method;
		if($scope.selectedUserCopy._isNew) {
			method = 'org.araqne.dom.msgbus.UserPlugin.createUser';
		}
		else {
			method = 'org.araqne.dom.msgbus.UserPlugin.updateUser';

			// 저장할땐 아래 정보는 넣으면 안된다.
			delete $scope.selectedUserCopy.created;
			delete $scope.selectedUserCopy.updated;
			delete $scope.selectedUserCopy.ext;
			delete $scope.selectedUserCopy.last_password_change;
			delete $scope.selectedUserCopy.password;
			delete $scope.selectedUserCopy.passwordConfirm;
		}

		// 저장할땐, org_unit의 guid 정보만 넘겨야 한다.
		if($scope.selectedUserCopy.org_unit != null) {
			var org_unit_obj = {
				'guid': $scope.selectedUserCopy.org_unit.guid
			}
			$scope.selectedUserCopy.org_unit = org_unit_obj;
		}

		socket.send(method, $scope.selectedUserCopy, proc.pid)
		.success(function(m) {
			$scope.exitUserEditMode();

			delete $scope.selectedUserCopy._isNew;
			// selectedUserCopy 의 정보를 selectedUser에 덮어씌운다. 
			// created 와 updated 의 정보를 남기기 위해 통째로 바꾸진 않는다.
			for (var prop in $scope.selectedUserCopy) {
				$scope.selectedUser[prop] = $scope.selectedUserCopy[prop];
			};

			// createUser시에는 목록을 갱신해줄 필요가 있음
			if(method == 'org.araqne.dom.msgbus.UserPlugin.createUser') {
				eventSender.refreshUserList();
			}

			// admin 정보 저장
			eventSender.onSaveUserAdmin($scope.selectedUserCopy);
			eventSender.onSaveUserPrivilage($scope.selectedUserCopy);

			console.log(':::'
				, ((method == 'org.araqne.dom.msgbus.UserPlugin.createUser') ? 'createUser:\t' : 'updateUser:\t')
				, $scope.selectedUserCopy.login_name);
			$scope.$apply();
		})
		.failed(openError);
	}

	$scope.discardUserInfo = function() {
		$scope.exitUserEditMode();

		eventSender.onDiscardUserAdmin();
		eventSender.onDiscardUserPrivileage();

		if($scope.selectedUser._isNew) {
			$scope.$parent.closeExtraPane();
		}
	}

	$scope.exitUserEditMode = function() {
		$scope.$parent.isUserEditMode = false;
		$('body').css('overflow','');
	}


	$scope.openDialogChangePassword = function() {
		eventSender.onOpenDialogChangePassword();
	}

	$scope.$on('nodeSelected', function(e, obj) {
		if(obj.delegateElement[0].id == 'treeToChangeOrgUnit') {
			var found = getOrgUnit(obj.selectedNode, $scope.$parent.treeDataSourceWithRoot);
			if(found == null) return;

			$scope.selectedUserCopy['org_unit'] = found;
			$('[data-toggle="dropdown"]').parent().removeClass('open');	
		}

		setTimeout(function() {
			$scope.currentElement.addClass('deselected').removeClass('active');	
		},250);
	});

	$scope.deallocateGroup = function() {
		$scope.selectedUserCopy.org_unit = null;
	}

	$scope.removeThisUser = function() {
		eventSender.onRemoveUsers([$scope.selectedUser]);
	}

	$scope.$watch('selectedUser', function(valnew, valold) {
		if(valnew == null) {
			return;
		}

		if(valold == null) {
			eventSender.onSelectUserAdmin(valnew);
			eventSender.onSelectUserPrivilege(valnew);
			return;
		}

		if(valnew.login_name != valold.login_name) {
			eventSender.onSelectUserAdmin(valnew);
			eventSender.onSelectUserPrivilege(valnew);
			return;
		}

		// updateUser 를 통해 org_unit 변경시 불리는 코드
		var isDefinedOld = valold.org_unit != null;
		var isDefinedNew = valnew.org_unit != null;
		if(isDefinedOld | isDefinedNew) {
			if(isDefinedOld && isDefinedNew) {
				//console.log(valnew.org_unit.guid, valold.org_unit.guid)
				if(valnew.org_unit.guid != valold.org_unit.guid) {
					// 둘 다 defined 되어있는데 org_unit이 바뀌는 경우
					console.log('aaa')
					eventSender.onUpdateUserOrgUnit(valnew);
				}	
			}
			else {
				//console.log(valnew.org_unit, valold.org_unit)
				console.log('ccc')
				// 둘 중 하나라도 undefined -> defined 로 바뀌는 경우
				eventSender.onUpdateUserOrgUnit(valnew);
			}
		}
	}, true);


}

function AdminController($scope, socket, eventSender) {
	$scope.listRoles = [];
	$scope.currentUser;
	$scope.currentRole;
	$scope.currentRoleCopy;
	$scope.canAdminGrant = false;

	function getRoles() {
		socket.send('org.araqne.dom.msgbus.RolePlugin.getRoles', {}, proc.pid)
		.success(function(m) {
			$scope.listRoles = m.body.roles;
			console.log(m.body);

			resetRole();
			$scope.$apply();
		})
		.failed(openError)
	}

	function getAdmin() {
		socket.send('org.araqne.dom.msgbus.AdminPlugin.getAdmin', { 'login_name': $scope.currentUser.login_name }, proc.pid)
		.success(function(m) {
			console.log('::: getAdmin:\t', m.body);
			if(m.body.admin == null) {
				resetRole();
			}
			else {
				var r = getRoleByName(m.body.admin.role.name);
				$scope.currentRole = r;
			}
			$scope.$apply();
		})
		.failed(openError);
	}

	function getRoleByName(name) {
		var found = $scope.listRoles.filter(function(obj) {
			return obj.name == name;
		});
		return found[0];
	}

	function setAdmin() {
		var rolename = $scope.currentRoleCopy.name;
		var option = {
			'login_name': $scope.currentUser.login_name,
			'role': {
				'name': rolename
			},
			'use_login_lock': false,
			'is_enabled': true
		}

		socket.send('org.araqne.dom.msgbus.AdminPlugin.setAdmin', option, proc.pid)
		.success(function(m) {
			$scope.currentRole = getRoleByName(rolename);
			console.log('::: setAdmin:\t', option, rolename);
			$scope.$apply();
		})
		.failed(openError);

		resetRoleCopy();
	}	

	function checkAdminGrant() {
		socket.send('org.araqne.dom.msgbus.AdminPlugin.hasPermission', { 'group': 'dom', 'permission': 'admin_grant' }, proc.pid)
		.success(function(m) {
			$scope.canAdminGrant = m.body.result;
			$scope.$apply();
		})
		.failed(openError);
	}

	function resetRoleCopy() {
		$scope.currentRoleCopy = $scope.listRoles[2]; // 기본값으로 돌려줌
	}

	function resetRole() {
		$scope.currentRole = $scope.listRoles[2]; // 기본값으로 돌려줌
	}

	eventSender.onSelectUserAdmin = function(user) {
		if(user._isNew) {
			resetRoleCopy();
			return;
		}

		if(user.login_name == null) return;
		$scope.currentUser = user;
		getAdmin();
	}

	eventSender.onEditUserAdmin = function(user) {
		if(user._isNew) {
			resetRole();
		}
		$scope.currentRoleCopy = getRoleByName($scope.currentRole.name);
	}

	eventSender.onDiscardUserAdmin = function() {
		resetRoleCopy();
	}

	eventSender.onSaveUserAdmin = function(user) {
		if(user.login_name == null) return;
		$scope.currentUser = user;
		setAdmin();
	}
	
	getRoles();
	checkAdminGrant();
}

function TablePrivilegeController($scope, socket, eventSender, serviceLogdbManagement) {
	$scope.currentUser;

	eventSender.onSelectUserPrivilege = function(user) {
		//console.log('::: onSelectUserPrivilege\t');
		$scope.limitDataPrivileges = $scope.limitDataPrivilegesDefault;
		if(user._isNew) {
			return;
		}

		$scope.currentUser = user;
		getPrivilege(user.login_name);
	}

	eventSender.onEditUserPrivilege = function(user) {
		//console.log('::: onEditUserPrivilege\t');
		resetPrivilegeSetting();
		if(user._isNew) {
			return;
		}

		$scope.dataPrivileges.forEach(function(prv) {
			var idx = -1;
			if( $scope.dataTables.some(function(obj, i) {
				idx = i;
				return obj.table == prv.table;
			})) {
				$scope.dataTables[idx]['can_read'] = true;
			}
		});

	}

	eventSender.onDiscardUserPrivileage = function() {
		resetPrivilegeSetting();
	}

	eventSender.onSaveUserPrivilage = function(user) {
		var privilegeWillBeGranted = $scope.dataTables.filter(function(obj) {
			return obj.can_read;
		}).map(function(obj) {
			return obj.table;
		});
		serviceLogdbManagement.setPrivileges(user.login_name, privilegeWillBeGranted).success(function(m) {
			$scope.dataPrivileges.splice(0, $scope.dataPrivileges.length);

			privilegeWillBeGranted.forEach(function(table) {
				$scope.dataPrivileges.push({
					'table': table,
					'can_read': true
				})
			});
			
			$scope.$apply();
			console.log('::: setPrivilege:\t', user.login_name, privilegeWillBeGranted);
			resetPrivilegeSetting();
		});	
	}

	function resetPrivilegeSetting(bool) {
		if(bool == undefined) bool = false;
		$scope.dataTables.forEach(function(obj) {
			obj['can_read'] = bool;
		});
	}

	$scope.dataTables = [];
	$scope.dataPrivileges = [];
	$scope.limitDataPrivilegesDefault = 10;
	$scope.limitDataPrivileges = $scope.limitDataPrivilegesDefault;

	$scope.toggleMorePrivileges = function() {
		$scope.limitDataPrivileges = $scope.dataPrivileges.length;
	}

	function getPrivilege(login_name) {
		serviceLogdbManagement.getPrivileges(login_name).success(function(m) {
			$scope.dataPrivileges.splice(0, $scope.dataPrivileges.length);

			for(var prop in m.body) {
				$scope.dataPrivileges.push({
					'table': prop,
					'can_read': m.body[prop][0] == 'READ' ? true : false
				})
			}

			$scope.$apply();
			var tables = Object.keys(m.body);
			console.log('::: getPrivilege:\t');
		});	
	}

	$scope.toggleSelectAll = function() {
		resetPrivilegeSetting($scope.dataTables.some(function(obj) {
			return !obj.can_read;
		}));
	}

	function deselectAll() {
		$scope.dataUsers.forEach(function(obj) {
			obj.is_checked = false;
		});
		$('tr.tr-selected').removeClass('tr-selected');
	}
	
	serviceLogdbManagement.listTable().success(function(m) {
		$scope.dataTables = Object.keys(m.body.tables).map(function(key) {
			return {
				'table': key,
				'can_read': false
			}
		});
		$scope.$apply();
	});
}

function UserListController($scope, $compile, socket, eventSender) {
	eventSender.onDropUsersToOrgUnit = function(scopeTarget) {
		var login_names = $scope.dataUsers.filter(function(user) {
			return user.is_checked;
		}).map(function(user) {
			return user.login_name;
		});

		moveUsers(scopeTarget.node, login_names);
	}

	function refresh() {
		getUsers($scope.currentOrgUnit.guid);
	}

	eventSender.refreshUserList = function() {
		refresh();
	}

	eventSender.onUpdateUserOrgUnit = function(user) {
		refresh();
	}

	eventSender.onPartiallySuccessRemoveUsers = function(selected, failed_login_names) {
		function hasFailedList(login_name) {
			return !failed_login_names.some(function(obj) {
				return obj == login_name;
			});
		}

		var names = selected.filter(function(obj) {
			return hasFailedList(obj.login_name);
		}).map(function(obj) {
			return obj.login_name;
		});

		selected.forEach(function(obj) {
			if(hasFailedList(obj.login_name)) {
				$scope.dataUsers.splice($scope.dataUsers.indexOf(obj), 1);
			}
		});

		$scope.$apply();

		notify('info', '사용자 ' + names + '을 성공적으로 삭제했습니다.<br>사용자 ' + failed_login_names + '는 삭제하지 못했습니다. 더 높은 권한이 필요합니다.' , false);
	}

	eventSender.onSuccessRemoveUsers = function(selected) {
		var names = selected.map(function(obj) {
			return obj.login_name;
		});

		selected.forEach(function(obj) {
			$scope.dataUsers.splice($scope.dataUsers.indexOf(obj), 1);
		});
		$scope.$apply();

		notify('success', '사용자 ' + names + '을 성공적으로 삭제했습니다.' , true);
	}

	$scope.currentOrgUnit;

	eventSender.onTreeSelectOrgUnit = function(guid, orgunit) {
		$scope.currentOrgUnit = orgunit;
		getUsers(guid);
	}

	$scope.dataUsers = [];
	$scope.isEditMode = false;

	$scope.canMoveOrRemove = function() {
		return !$scope.dataUsers.some(function(obj) {
			return obj.is_checked;
		});
	}

	$scope.removeUsers = function() {
		var selected = $scope.dataUsers.filter(function(obj) {
			return obj.is_checked;
		});

		eventSender.onRemoveUsers(selected);
	}

	$scope.toggleSelectAll = function() {
		if($scope.dataUsers.some(function(obj) {
			return !obj.is_checked;
		})) {
			selectAll();
		}
		else {
			deselectAll();
		}
	}

	function deselectAll() {
		$scope.dataUsers.forEach(function(obj) {
			obj.is_checked = false;
		});
		$('tr.tr-selected').removeClass('tr-selected');
	}

	function selectAll() {
		$scope.dataUsers.forEach(function(obj) {
			obj.is_checked = true;
		});
		$('tr').addClass('tr-selected');
	}

	$scope.enterEditMode = function() {
		$scope.isEditMode = true;
		$('tr.tr-single-selected').removeClass('tr-single-selected');
	}

	$scope.endEditMode = function() {
		$scope.isEditMode = false;
		
	}

	$scope.supressEvent = function(e) {
		e.stopPropagation();
	}

	$scope.showUser = function(e) {
		if(!$scope.isEditMode) {
			eventSender.onShowUser(this.user);

			$('tr.tr-single-selected').removeClass('tr-single-selected');
			$(e.currentTarget).addClass('tr-single-selected');
			openExtraPane();
		}
	}

	function openExtraPane() {
		$('.extraPane').addClass('in');
		$('.leftPane').addClass('out');
		$('.rightPane').addClass('out');
		$('.btnShowTree').fadeIn();
	}

	function getUsers(guid) {
		var option = {};
		if(guid != undefined) {
			option["ou_guid"] = guid;
		}

		socket.send('org.araqne.dom.msgbus.UserPlugin.getUsers', option, proc.pid)
		.success(function(m) {
			$scope.dataUsers = m.body.users;

			if(guid == undefined) {
				eventSender.onGetAllUsers(m.body.users);
			}

			$scope.$apply();
		})
		.failed(msgbusFailed);
	}

	function moveUsers(target, users) {
		var option = {
			'org_unit_guid': target.guid, 
			'login_names': users
		}
		socket.send('org.araqne.dom.msgbus.UserPlugin.moveUsers', option, proc.pid)
		.success(function(m) {
			console.log(m.body)

			refresh();
			notify('success', '사용자 ' + users.join() + '을 ' + target.name + '로 이동했습니다.' , true);
		})
		.failed(msgbusFailed);
	}

	$scope.addUser = function() {
		$scope.endEditMode();

		var targetOrgUnit = angular.copy($scope.currentOrgUnit);
		delete targetOrgUnit.children;
		delete targetOrgUnit.className;

		eventSender.onShowUser({
			'_isNew': true,
			'org_unit': targetOrgUnit
		});

		//console.log($scope.$parent.selectedUser)

		$('tr.tr-single-selected').removeClass('tr-single-selected');
		openExtraPane();

		setTimeout(function() {
			$('.txtNewLoginName').focus();
		}, 250);
	}
	
}

function ChangePasswordController($scope, socket, eventSender) {
	eventSender.onOpenDialogChangePassword = function() {
		$('[modal].mdlChangePassword')[0].showDialog();
		$scope.valPassword = '';
		$scope.valPasswordConfirm = '';
		$('[modal].mdlChangePassword input#password').focus();
	}

	$scope.valPassword = '';
	$scope.valPasswordConfirm = '';

	$scope.changePassword = function() {
		console.log('ssd')
	}
}

function TreeController($scope, $compile, socket, eventSender) {
	$scope.toggleLogTrendType = function(type) {
		$('.treetype').hide();
		$('.treetype.' + type).show();
	}

	$scope.dropUsers = function(scopeSource, scopeTarget, elSource, elTarget, dragContext, e) {
		eventSender.onDropUsersToOrgUnit(scopeTarget);
		//console.log(scopeSource, scopeTarget, elSource, elTarget, dragContext, e, this)
	}

	$scope.treeEvent = {
		'onDrop': $scope.dropUsers,
		'onCreateChildNode': function(srcScope) {
			var self = this;

			socket.send('org.araqne.dom.msgbus.OrganizationUnitPlugin.createOrganizationUnit', {
				'name': this.node.name,
				'parent': this.node.parent
			}, proc.pid)
			.success(function(m) {
				self.node.guid = m.body.guid;
			})
			.failed(openError);
		},
		'onRenameNode': function(srcScope) {
			socket.send('org.araqne.dom.msgbus.OrganizationUnitPlugin.updateOrganizationUnit', {
				'guid': this.node.guid,
				'name': this.node.name,
				'parent': this.node.parent
			}, proc.pid)
			.success(function(m) {
				console.log(m.body)
			})
			.failed(openError);
		},
		'onRemoveNode': function(async, srcScope) {
			socket.send('org.araqne.dom.msgbus.OrganizationUnitPlugin.removeOrganizationUnit', {
				'guid': this.node.guid
			}, proc.pid)
			.success(function(m) {
				async.success();
			})
			.failed(openError);
		},
		'onMoveNode': function(async, sourceScope, targetScope) {
			var obj = {
				'guid': sourceScope.node.guid,
				'name': sourceScope.node.name,
				'parent': targetScope.node.guid
			};
			
			socket.send('org.araqne.dom.msgbus.OrganizationUnitPlugin.updateOrganizationUnit', obj, proc.pid)
			.success(function(m) {
				async.success();
			})
			.failed(openError);
		}

	}

	function buildTree(orgunits, parent) {
		return orgunits.filter(function(obj, i) {
			if(obj.parent == parent) {
				obj.children = buildTree(orgunits, obj.guid);
				return true;
			}
			else return false;
		})
	}

	function bindTreeEvent() {
		$scope.$on('nodeSelected', function(e, obj) {
			var found = getOrgUnit(obj.selectedNode, $scope.$parent.treeDataSourceWithRoot);
			if(found == null) return;

			if(obj.delegateElement[0].id == 'treeOrgUnit') {
				eventSender.onTreeSelectOrgUnit(obj.selectedNode, found);	
			}
		});

		$('#treeOrgUnit a:first').click();
	}

	socket.send('org.araqne.dom.msgbus.OrganizationUnitPlugin.getOrganizationUnits', {}, proc.pid)
	.success(function(m) {
		console.log(m.body);

		m.body.org_units.forEach(function(obj) {
			obj.is_selected = undefined;
		});

		var tree = buildTree(m.body.org_units, null);
		$scope.$parent.treeDataSourceWithRoot = [{
			'name': '모든 사용자',
			'guid': null,
			'children': tree
		}];
		$scope.$parent.treeDataSource = tree;
		$scope.$apply();

		bindTreeEvent();
	})
	.failed(openError);

}

function notify(type, msg, autohide) {
	function makeRemoveClassHandler(regex) {
		return function (index, classes) {
			return classes.split(/\s+/).filter(function (el) { return regex.test(el);}).join(' ');
		}
	}

	var btnClose = $('.alert-fix-side > .close');
	if(autohide == true) btnClose.hide();
	else btnClose.off('click').show();

	if($('.alert-fix-side').hasClass('show')) {
		$('.alert-fix-side.show').removeClass('show');
	}
	else {
		$('.alert-fix-side').removeClass(makeRemoveClassHandler(/(alert-success|alert-info|alert-error)/))
			.show()
			.addClass('alert-' + type)
			.addClass('show')
			.find('span.msg')
			.html(msg);
	}

	if(autohide == true) {
		setTimeout(function() {
			$('.alert-fix-side.show').removeClass('show');
		}, 3000);
		setTimeout(function() {
			$('.alert-fix-side').hide();
		}, 3200)
	}
	else {
		btnClose.on('click', function() {
			$('.alert-fix-side.show').hide().removeClass('show');
			setTimeout(function() {
				$('.alert-fix-side').hide();
			}, 200);
		});
	}
}

function openError(m, raw) {
	$('.errorWin')[0].showDialog();
	$('.errorWin .raw').text(JSON.stringify(raw[0]));
}

function makeid() {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for( var i=0; i < 5; i++ )
	text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

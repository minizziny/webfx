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

function Controller($scope, serviceTask, socket, eventSender, serviceDom) {
	serviceTask.init();
	proc = serviceTask.newProcess('orgchart');

	$scope.testAlert = function() {
		var types = ['info', 'success', 'error'];
		var random = Math.floor(Math.random() * (2 - 0 + 1)) + 0;
		notify(types[random], '안녕하세요', Math.random() < 0.5 ? true : false);
	}

	$scope.treeDataSourceWithRoot = [];
	$scope.treeDataSource = [];

	$scope.dataAllUsers = [];
	$scope.isUserEditMode = false;

	// 권한 관련 
	$scope.canAdminGrant = false;
	$scope.canUserEdit = false;
	$scope.canConfigEdit = false;
	$scope.amI = false;

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

	function checkUserEdit() {
		serviceDom.hasPermission('dom', 'user_edit')
		.success(function(m) {
			console.log(m.body)
			$scope.canUserEdit = m.body.result;
			$scope.$apply();
		});
	}

	function checkAdminGrant() {
		serviceDom.hasPermission('dom', 'admin_grant')
		.success(function(m) {
			$scope.canAdminGrant = m.body.result;
			if(!$scope.canAdminGrant) {
				$('#treeOrgUnit')[0].setNodeEditable(false);
			}
			$scope.$apply();
		});
	}

	function checkConfigEdit() {
		serviceDom.hasPermission('dom', 'config_edit')
		.success(function(m) {
			$scope.canConfigEdit = m.body.result;
			$scope.$apply();
		});
	}

	checkAdminGrant();
	checkUserEdit();
	checkConfigEdit();

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

function UserController($scope, socket, eventSender, serviceDom) {
	$scope.selectedUser = null;
	$scope.selectedUserCopy = null;

	$scope.isLowerLevel = false;

	eventSender.onShowUser = function(user) {
		console.log('----', user.login_name, '----');
		console.log('::: onShowUser:\t', user);
		$scope.selectedUser = user;
		console.log(user)
		if(serviceDom.whoAmI() == user.login_name) {
			$scope.$parent.amI = true;
		}
		else {
			$scope.$parent.amI = false;
		}

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
				'guid': $scope.selectedUserCopy.org_unit.guid,
				'name': $scope.selectedUserCopy.org_unit.name
			}
			$scope.selectedUserCopy.org_unit = org_unit_obj;
		}

		socket.send(method, $scope.selectedUserCopy, proc.pid)
		.success(function(m) {
			$scope.exitUserEditMode();

			delete $scope.selectedUserCopy._isNew;
			delete $scope.selectedUser._isNew;
			// selectedUserCopy 의 정보를 selectedUser에 덮어씌운다. 
			// created 와 updated 의 정보를 남기기 위해 통째로 바꾸진 않는다.
			for (var prop in $scope.selectedUserCopy) {
				$scope.selectedUser[prop] = $scope.selectedUserCopy[prop];
			};

			// createUser시에는 목록을 갱신해줄 필요가 있음
			if(method == 'org.araqne.dom.msgbus.UserPlugin.createUser') {
				eventSender.refreshUserList();
			}

			if($scope.$parent.canAdminGrant) {
				// admin 정보 저장
				eventSender.onSaveUserAdmin($scope.selectedUserCopy);
				eventSender.onSaveUserPrivilage($scope.selectedUserCopy);	
			}

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
		eventSender.onOpenDialogChangePassword($scope.selectedUser);
	}

	$scope.$on('nodeSelected', function(e, obj) {
		if(obj.delegateElement[0].id == 'treeToChangeOrgUnit') {
			var found = getOrgUnit(obj.selectedNode, $scope.$parent.treeDataSourceWithRoot);
			if(found == null) return;

			if($scope.selectedUserCopy != null) {
				$scope.selectedUserCopy['org_unit'] = found;
			}
			
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

		var canPrivilege = (serviceDom.whoAmI() == valnew.login_name) || $scope.$parent.canAdminGrant;

		if(valold == null) {
			eventSender.onSelectUserAdmin(valnew);
			if(canPrivilege) {
				eventSender.onSelectUserPrivilege(valnew);
			}
			return;
		}

		if(valnew.login_name != valold.login_name) {
			eventSender.onSelectUserAdmin(valnew);
			if(canPrivilege) {
				eventSender.onSelectUserPrivilege(valnew);
			}
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

function AdminController($scope, socket, eventSender, serviceDom) {
	$scope.listRoles = [];
	$scope.currentUser;
	$scope.currentRole;
	$scope.currentRoleCopy;
	var myRole;

	function getRoles() {
		socket.send('org.araqne.dom.msgbus.RolePlugin.getRoles', {}, proc.pid)
		.success(function(m) {
			$scope.listRoles = m.body.roles;
			console.log(m.body);

			resetRole();
			getMyRole();
			$scope.$apply();
		})
		.failed(openError)
	}

	function getMyRole() {
		getAdminMsgbus(serviceDom.whoAmI()).success(function(m) {
			if(m.body.admin != null) {
				console.log('::: getMyRole:\t', m.body);
				var r = getRoleByName(m.body.admin.role.name);
				myRole = r;

				if(myRole.name === 'master') {
					$scope.$parent.isLowerLevel = true;
				}
			}
		});
	}

	function getAdminMsgbus(login_name) {
		return socket.send('org.araqne.dom.msgbus.AdminPlugin.getAdmin', { 'login_name': login_name }, proc.pid)
		.failed(openError);
	}

	function getAdmin(login_name) {
		getAdminMsgbus(login_name).success(function(m) {
			console.log('::: getAdmin:\t', m.body);
			if(m.body.admin == null) {
				resetRole();
			}
			else {
				//console.log(m.body.admin.role.ad)
				var r = getRoleByName(m.body.admin.role.name);
				$scope.currentRole = r;

				if($scope.currentRole.level < myRole.level) {
					$scope.$parent.isLowerLevel = true;
				}
				else {
					$scope.$parent.isLowerLevel = false;
				}
			}
			$scope.$apply();
		});
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
		getAdmin($scope.currentUser.login_name);
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
		console.log(Object.keys(m.body.tables))
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

		if(names.length == 0) {
			notify('danger', '사용자 ' + failed_login_names + '를 삭제할 수 없습니다. 더 높은 권한이 필요합니다.' , false)
		}
		else {
			notify('info', '사용자 ' + names + '을 성공적으로 삭제했습니다.<br>사용자 ' + failed_login_names + '는 삭제하지 못했습니다. 더 높은 권한이 필요합니다.' , false);
		}
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
			checkAll();
		}
		else {
			uncheckAll();
		}
	}

	function uncheckAll() {
		$scope.dataUsers.forEach(function(obj) {
			obj.is_checked = false;
		});
		$('tr.tr-selected').removeClass('tr-selected');
	}

	function checkAll() {
		$scope.dataUsers.forEach(function(obj) {
			obj.is_checked = true;
		});
		$('tr').addClass('tr-selected');
	}

	function deselectAll() {
		$scope.dataUsers.forEach(function(obj) {
			obj.is_selected = false;
		});
	}

	$scope.enterEditMode = function() {
		$scope.isEditMode = true;
		deselectAll();
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

			deselectAll();
			this.user.is_selected = true;
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
			var failed_login_names = m.body.failed_login_names;

			refresh();

			if(users.length - failed_login_names.length == 0) {
				notify('danger', '사용자 ' + failed_login_names.join() + '를 ' + target.name + '로 이동할 수 없습니다. 더 높은 권한이 필요합니다.' , false)
			}
			else if(failed_login_names.length == 0) {
				notify('success', '사용자 ' + users.join() + '을 ' + target.name + '로 이동했습니다.' , true);
			}
			else {

				function hasFailedList(login_name) {
					return !failed_login_names.some(function(obj) {
						return obj == login_name;
					});
				}

				var names = users.filter(function(obj) {
					return hasFailedList(obj);
				});

				notify('info', '사용자 ' + names + '을 ' + target.name + '로 이동했습니다.<br>사용자 ' + failed_login_names.join() + '는 이동하지 못했습니다. 더 높은 권한이 필요합니다.' , false);
			}
			
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
		deselectAll();

		openExtraPane();

		setTimeout(function() {
			$('.txtNewLoginName').focus();
		}, 250);
	}
	
}

function ChangePasswordController($scope, socket, eventSender) {
	var currentUser;
	eventSender.onOpenDialogChangePassword = function(user) {
		currentUser = angular.copy(user);
		$('[modal].mdlChangePassword')[0].showDialog();
		$scope.valPassword = '';
		$scope.valPasswordConfirm = '';
		$('[modal].mdlChangePassword input#password').focus();
	}

	$scope.valPassword = '';
	$scope.valPasswordConfirm = '';

	$scope.changePassword = function() {

		// 저장할땐 아래 정보는 넣으면 안된다.
		delete currentUser.created;
		delete currentUser.updated;
		delete currentUser.ext;
		delete currentUser.last_password_change;
		delete currentUser.password;

		// 저장할땐, org_unit의 guid 정보만 넘겨야 한다.
		if(currentUser.org_unit != null) {
			var org_unit_obj = {
				'guid': currentUser.org_unit.guid
			}
			currentUser.org_unit = org_unit_obj;
		}

		currentUser.password = $scope.valPassword;

		// console.log(currentUser);
		socket.send('org.araqne.dom.msgbus.UserPlugin.updateUser', currentUser, proc.pid)
		.success(function(m) {
			console.log(m.body);
			notify('success', '사용자 ' + currentUser.login_name + '의 비밀번호를 변경했습니다.' , true);
			$('[modal].mdlChangePassword')[0].hideDialog();
		})
		.failed(openError);
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

	$scope.cancelRemoveOrgUnit = function() {
		$('.mdlRemoveOrgUnit')[0].hideDialog();
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
			var self = this;
			$('.mdlRemoveOrgUnit')[0].showDialog();

			$scope.selectedOrgUnitName = self.node.name;

			$scope.removeOrgUnit = function() {
				socket.send('org.araqne.dom.msgbus.OrganizationUnitPlugin.removeOrganizationUnit', {
					'guid': self.node.guid
				}, proc.pid)
				.success(function(m) {
					async.success();
					$('.mdlRemoveOrgUnit')[0].hideDialog();

					if($('li[node-id=' +  self.node.guid + ']').hasClass('active')) {
						setTimeout(function() {
							$('li[node-id=' +  self.node.parent + '] a[el-type=group]').click();
						}, 250);
					}
				})
				.failed(openError);
			}
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
		$('#treeOrgUnit a:first .dropdown-menu li:not(:first)').remove();
	}

	socket.send('org.araqne.dom.msgbus.OrganizationUnitPlugin.getOrganizationUnits', {}, proc.pid)
	.success(function(m) {
		console.log(m.body);

		m.body.org_units.forEach(function(obj) {
			obj.is_selected = undefined;
			obj.is_visible = true;
		});

		var tree = buildTree(m.body.org_units, null);
		$scope.$parent.treeDataSourceWithRoot = [{
			'name': '모든 사용자',
			'guid': null,
			'children': tree,
			'is_visible': true
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

	function display() {
		var btnClose = $('.alert-fix-side > .close');
		if(autohide == true) btnClose.hide();
		else btnClose.off('click').show();

		$('.alert-fix-side').removeClass(makeRemoveClassHandler(/(alert-success|alert-info|alert-error|alert-danger)/))
			.addClass('alert-' + type)
			.addClass('show')
			.find('span.msg')
			.html(msg);

		if(autohide == true) {
			setTimeout(function() {
				$('.alert-fix-side.show').removeClass('show');
			}, 3000);
		}
		else {
			btnClose.on('click', function() {
				$('.alert-fix-side.show').removeClass('show');
			});
		}
	}

	if($('.alert-fix-side').hasClass('show')) {
		$('.alert-fix-side.show').removeClass('show');
		setTimeout(display, 200);
	}
	else {
		display();
	}
}

function openError(m, raw) {
	$('.errorWin')[0].showDialog();
	$('.errorWin .raw').text(JSON.stringify(raw[0]));
}
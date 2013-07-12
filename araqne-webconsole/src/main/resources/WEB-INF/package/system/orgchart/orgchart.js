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

app.directive('passwordValidate', function($parse) {
	return {
		restrict: 'A',
		require: 'ngModel',
		link: function(scope, elem, attrs, ctrl) {
			scope.$watch(attrs.ngModel, function(value) {
				var cond = /[0-9]+/.test(value);
				cond = cond & (/[a-zA-Z]+/.test(value));
				cond = cond & (/[^0-9a-zA-Z]+/.test(value));
				cond = cond & value.length >= 9;
				ctrl.$setValidity('inadequacy', cond);
			})
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

	$scope.treeDataSource = [];

	$scope.selectedUser = null;
	$scope.selectedUserCopy = null;
	$scope.isUserEditMode = false;

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

	$scope.enterUserEditMode = function() {
		$scope.isUserEditMode = true;
		$scope.selectedUserCopy = angular.copy($scope.selectedUser);
	}

	$scope.saveUserInfo = function() {
		var method = 'org.araqne.dom.msgbus.UserPlugin.updateUser';
		if($scope.selectedUser._isNew) {
			method = 'org.araqne.dom.msgbus.UserPlugin.createUser';
		}

		var serializedUser = {};
		
		socket.send(method, serializedUser, proc.pid)
		.success(function(m) {
			$scope.exitUserEditMode();
		})
		.failed(openError);
	}

	$scope.discardUserInfo = function() {
		$scope.exitUserEditMode();

		if($scope.selectedUser._isNew) {
			$scope.closeExtraPane();
		}
	}

	$scope.exitUserEditMode = function() {
		$scope.isUserEditMode = false;
	}

	$scope.openDialogChangePassword = function() {
		eventSender.onOpenDialogChangePassword();
	}

	$scope.dropUsers = function(scopeSource, scopeTarget, elSource, elTarget, dragContext, e) {
		eventSender.onDropUsersToOrgUnit(scopeTarget);
		//console.log(scopeSource, scopeTarget, elSource, elTarget, dragContext, e, this)
	}

}

function UserController($scope, $compile, socket, eventSender) {
	eventSender.onDropUsersToOrgUnit = function(scopeTarget) {
		var login_names = $scope.dataUsers.filter(function(user) {
			return user.is_checked;
		}).map(function(user) {
			return user.login_name;
		});

		moveUsers(scopeTarget.node.guid, login_names);
	}

	$scope.currentOrgUnit;

	eventSender.onTreeSelectOrgUnit = function(guid, orgunit) {
		$scope.currentOrgUnit = orgunit;
		getUsers(guid);
	}

	$scope.dataUsers = [];
	$scope.isEditMode = false;

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
			$scope.$parent.selectedUser = this.user;

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
			console.log(m.body)
			$scope.dataUsers = m.body.users;
			$scope.$apply();
		})
		.failed(msgbusFailed);
	}

	function moveUsers(target, users) {
		var option = {
			'org_unit_guid': target, 
			'login_names': users
		}
		socket.send('org.araqne.dom.msgbus.UserPlugin.moveUsers', option, proc.pid)
		.success(function(m) {
			console.log(m.body)



			// $scope.dataUsers = m.body.users;
			// $scope.$apply();
		})
		.failed(msgbusFailed);
	}

	$scope.addUser = function() {
		var targetOrgUnit = angular.copy($scope.currentOrgUnit);
		delete targetOrgUnit.children;
		delete targetOrgUnit.className;

		$scope.$parent.selectedUser = {
			'_isNew': true,
			'org_unit': targetOrgUnit
		};

		console.log($scope.$parent.selectedUser)

		$('tr.tr-single-selected').removeClass('tr-single-selected');
		openExtraPane();

		$scope.$parent.enterUserEditMode();

		setTimeout(function() {
			$('.txtNewLoginName').focus();
		}, 250);
	}
	
}

function ChangePasswordController($scope, socket, eventSender) {
	eventSender.onOpenDialogChangePassword = function() {
		$('[modal].changePassword')[0].showDialog();
		$scope.valPassword = '';
		$scope.valPasswordConfirm = '';
		$('[modal].changePassword input#password').focus();
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

	var json =
	[
	{
		"name" : "테이블",
		"guid" : "_tables",
		"children" : [{
			"name" : "g1",
			"guid" : "g1",
			"children" : [{
				"name" : "g11",
				"guid" : "g11",
				"tree-type" : "tree-top-header"
			},{
				"name" : "g12",
				"guid" : "g12",
				"tree-type" : "tree-top-header"
			}],
			"tree-type" : "tree-top-header"
		},{
			"name" : "g2",
			"guid" : "g2",
			"children" : [{
				"name" : "g21",
				"guid" : "g21",
				"tree-type" : "tree-top-header"
			},{
				"name" : "g22",
				"guid" : "g22",
				"tree-type" : "tree-top-header"
			}],
			"tree-type" : "tree-top-header"
		},{
			"name" : "g3",
			"guid" : "g3",
			"tree-type" : "tree-top-header"
		}
		],
		"tree-type" : "tree-top-header"
	}
	];

	
	$scope.treeOtherSource = json;

	function buildTree(orgunits, parent) {
		return orgunits.filter(function(obj, i) {
			if(obj.parent == parent) {
				obj.children = buildTree(orgunits, obj.guid);
				return true;
			}
			else return false;
		})
	}

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

	function bindTreeEvent() {
		$scope.$on('nodeSelected', function(e, obj) {
			var found = getOrgUnit(obj.selectedNode, $scope.$parent.treeDataSource);
			if(found == null) return;

			if(obj.delegateElement[0].id == 'treeOrgUnit') {
				eventSender.onTreeSelectOrgUnit(obj.selectedNode, found);	
			}
			else if(obj.delegateElement[0].id == 'treeToChangeOrgUnit') {
				console.log('asdfsdfadf')
			}
		});
	}

	socket.send('org.araqne.dom.msgbus.OrganizationUnitPlugin.getOrganizationUnits', {}, proc.pid)
	.success(function(m) {
		console.log(m.body);

		m.body.org_units.forEach(function(obj) {
			obj.is_selected = undefined;
		});

		var tree = buildTree(m.body.org_units, null);
		$scope.$parent.treeDataSource = [{
			'name': '모든 사용자',
			'guid': null,
			'children': tree
		}];
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
			.addClass('alert-' + type)
			.addClass('show')
			.find('span.msg')
			.html(msg);
	}

	if(autohide == true) {
		setTimeout(function() {
			$('.alert-fix-side.show').removeClass('show');
		}, 3000)
	}
	else {
		btnClose.on('click', function() {
			$('.alert-fix-side.show').hide().removeClass('show');
			setTimeout(function() {
				$('.alert-fix-side').css('display','block');
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

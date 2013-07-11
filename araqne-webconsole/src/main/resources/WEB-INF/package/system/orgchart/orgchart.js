var app = angular.module('orgchart', ['App', 'App.Directive.Tree']);
var proc;

app.factory('eventSender', function() {
	var e = {
		onTreeSelectOrgUnit: null
	}
	return e;
});

app.factory('serviceDom', function() {
	return {

	};
});

function Controller($scope, serviceTask, socket) {
	serviceTask.init();
	proc = serviceTask.newProcess('logquery');


	$scope.treeDataSource = [];

	$scope.selectedUser = null;
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
}

function UserController($scope, $compile, socket, eventSender) {

	$scope.currentOrgUnit;

	eventSender.onTreeSelectOrgUnit = function(guid, orgunit) {
		$scope.currentOrgUnit = orgunit;
		$scope.getUsers(guid);
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

	$scope.getUsers = function(guid) {
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

	$scope.addUser = function() {
		$scope.$parent.selectedUser = {
			'_isNew': true
		};

		$('tr.tr-single-selected').removeClass('tr-single-selected');
		openExtraPane();

		$scope.$parent.isUserEditMode = true;

		setTimeout(function() {
			$('.txtNewLoginName').focus();
		}, 250);
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

// space 말고 tab 써주세요
console.log("playground")
function PlaygroundController($scope, $element, socket) {
	$scope.hello = 'MyWorld';
console.log($scope.hello)
console.log($scope)
console.log($element)
}


function RuleTemplateConfigController($scope, $filter, socket, $translate, eventSender) {
	$scope.dataRuleTemplates = [];
	$scope.dropRuleTemplateName;
	$scope.dropRuleTemplateId;
	$scope.canRuleTemplateEdit = false;
	$scope.checkAll = false;
	$scope.isEditMode = false;

	eventSender.getRuleTemplates = function() {
		$scope.dataRuleTemplates = [];
		socket.send('com.logpresso.fds.msgbus.RuleTemplatePlugin.getRuleTemplates', {}, eventSender.playground.pid)
		.success(function(m) {
			var ruleTemplates = m.body.templates;

			ruleTemplates.forEach(function(obj) {
				console.log('ruleTemplates.forEach', obj);
				obj.is_checked = false;
				$scope.dataRuleTemplates.push(obj);
			});

			console.log("$scope.dataRuleTemplates", $scope.dataRuleTemplates);

			$scope.$apply();

			angular.element('.playground-container .paneRuleTemplateConfig .btn-reload').removeAttr('disabled');
		})
		.failed(msgbusFailed);
	}

	$scope.ruleTemplateDeletable = function() {
		return !$scope.dataRuleTemplates.some(function(obj) { 
			return obj.is_checked;
		});
	}

	$scope.dropRuleTemplate = function() {
		var checked = $filter('isSelected')($scope.dataRuleTemplates, 'is_checked');
		$scope.dropRuleTemplateId = [];
		
		checked.forEach( function (obj) {
			$scope.dropRuleTemplateId.push(obj.id);
		});

		console.log("dropRuleTemplate.checked", $scope.dropRuleTemplateId);

		socket.send('com.logpresso.fds.msgbus.RuleTemplatePlugin.removeRuleTemplates', { 'templates': $scope.dropRuleTemplateId }, eventSender.playground.pid)
			.success(function(m) {
				for ( var i=0; i < $scope.dropRuleTemplateId.length; i++ ){
					var idx = $scope.dataRuleTemplates.indexOf($scope.dropRuleTemplateId[i]);
					console.log("idx",idx);
					$scope.dataRuleTemplates.splice(idx, 1);
					$scope.$apply();
				};
			})
			.failed(msgbusFailed);
	
		$('.playground-container .dropRuleTemplate')[0].hideDialog();
	}

	$scope.openCreateRuleTemplateModal = function() {		
		$('.playground-container .createRuleTemplate')[0].showDialog();
		eventSender.initRuleTemplateOptions('C');
	}

	$scope.openEditRuleTemplateModal = function() {		
		console.log("openEditRuleTemplateModal.this", this);
		$('.playground-container .createRuleTemplate')[0].showDialog();
		console.log("openEditRuleTemplateModal", this.dataRuleTemplates);
		eventSender.initRuleTemplateOptions('E', this.dataRuleTemplates);
	}

	$scope.cancelCreateRuleTemplate = function() {
		$('.playground-container .createRuleTemplate')[0].hideDialog();
	}	

	$scope.openDropRuleTemplateModal = function() {
		var checked = $filter('isSelected')($scope.dataRuleTemplates, 'is_checked');
		$scope.dropRuleTemplateName = $filter('namemap')(checked, 'name');	
		$('.playground-container .dropRuleTemplate')[0].showDialog();
	}

	$scope.cancelDropRuleTemplate = function() {
		$('.playground-container .dropRuleTemplate')[0].hideDialog();
	}

	$scope.toggleSelectAll = function() {
		if($scope.dataRuleTemplates.some(function(obj) {
			return !obj.is_checked;
		})) {
			checkAll();
		}
		else {
			uncheckAll();
		}
	}

	function uncheckAll() {
		$scope.dataRuleTemplates.forEach(function(obj) {
			obj.is_checked = false;
		});
		$('tr.tr-selected').removeClass('tr-selected');
	}

	function checkAll() {
		$scope.dataRuleTemplates.forEach(function(obj) {
			obj.is_checked = true;
		});
		$('tr').addClass('tr-selected');
	}

	function deselectAll() {
		$scope.dataRuleTemplates.forEach(function(obj) {
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

	$scope.init = function(e) {
		if(e && (!!e.target) ) {
			angular.element(e.target).attr('disabled', 'disabled');
		}
		eventSender.getRuleTemplates();
		$scope.checkAll = false;
	}
	$scope.init();
}

function RuleTemplateWizardController($scope, $filter, socket, $translate, eventSender) {
	$scope.count = 0;
	$scope.dataRuleTemplate = {};
	$scope.isOnSubmit = false;
	$scope.spec_types	=	[];		
	$scope.param_alarm	= false;
	$scope.modal_title	= "";
	$scope.form_readOnly = false;

	$scope.dataNamePattern = /^\s*\w*\s*$/;

	eventSender.setPristine = function() {
		$scope.FormRuleTemplate.$setPristine();
	}

	eventSender.initRuleTemplateOptions = function(mode, ruleTemplate) {

		console.log("mode", mode, "ruleTemplate", ruleTemplate);
		$scope.spec_types	=	[{'text': '숫자', 'value':'INT'},
								{'text': '문자열', 'value':'STRING'}];

		if ( mode == 'E' ) {

			$scope.modal_title	= "조회";
			$scope.form_readOnly = true;
			$(".btn-primary-modal").hide();
			
			$scope.dataRuleTemplate = ruleTemplate;
			$scope.dataRuleTemplate.specs = $scope.dataRuleTemplate.param_specs;

			$scope.dataRuleTemplate.specs.default = $scope.dataRuleTemplate.specs.default_value;
		}
		else if ( mode == 'C' ){

			$scope.modal_title	= "생성";
			$scope.form_readOnly = false;
			$(".btn-primary-modal").show();

			$scope.dataRuleTemplate = {};
			$scope.dataRuleTemplate.type 	= "SCHEDULE";
			$scope.dataRuleTemplate.name 	= "";
			$scope.dataRuleTemplate.query_template 	= "";
			$scope.dataRuleTemplate.description		= "";
			
			$scope.dataRuleTemplate.specs = [];

		}
	
		$scope.isOnSubmit = false;		
		console.log('eventSender.initRuleTemplateOptions', $scope.dataRuleTemplate);
		console.log('spec_types', $scope.spec_types);

	}

	$scope.validCreatingRuleTemplate = function() {
		console.log('validCreatingRuleTemplate', $scope.FormRuleTemplate.$invalid);
		if( $scope.FormRuleTemplate.$invalid ) {
			$scope.isOnSubmit = true;
		}
		else if ( $scope.dataRuleTemplate.query_template.trim().length == 0 ) {
			$scope.isOnSubmit = true;
		}
		else {
			createRuleTemplate();
		}
	}

	function createRuleTemplate() {
		console.log('createRuleTemplate', $scope.dataRuleTemplate);
		
		socket.send('com.logpresso.fds.msgbus.RuleTemplatePlugin.createRuleTemplate', {
			'type': $scope.dataRuleTemplate.type, 
			'name': $scope.dataRuleTemplate.name, 
			'query_template': $scope.dataRuleTemplate.query_template,
			'specs': $scope.dataRuleTemplate.specs, 
			'description': $scope.dataRuleTemplate.description
		}, eventSender.playground.pid)
		.success(function(m) {
			eventSender.getRuleTemplates();
			$scope.$apply();
			$('.playground-container .createRuleTemplate')[0].hideDialog();
		});
	}

	$scope.removeSpec = function (index) {
		$scope.dataRuleTemplate.specs.splice(index, 1);
	};

	$scope.addSpec = function () {

		var tmp = $scope.dataRuleTemplate.query_template.split("$");

		if( $scope.dataRuleTemplate.query_template.trim().length == 0 || tmp.length <= 1 ) {
			$scope.param_alarm	=	true;
			return;
		}
		else{
			$scope.param_alarm	=	false;
			$scope.dataRuleTemplate.specs = [];
		};

		var cnt = 0;
		tmp.forEach ( function(obj) {
			cnt++;
			if ( cnt == 1 ){
				return;
			}

			var column = obj.split(/[ ,]+/);
			var default_spec = {
						'type':'',
						'key':column[0],
						'name':column[0],
						'description':column[0],
						'default':undefined
						};
			$scope.dataRuleTemplate.specs.push(default_spec);
		} );
	};

	$scope.setDefaultType = function (index) {
		if ( $scope.dataRuleTemplate.specs[index].type == 'INT' ) {
			$('.default').eq(index).attr("type", "number");
			$('.default').eq(index).val("0");
		}
		else if ( $scope.dataRuleTemplate.specs[index].type == 'STRING' ) {
			$('.default').eq(index).attr("type", "text");
			$('.default').eq(index).val("");
		}

	}


}

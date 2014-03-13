var logpresso = angular.module('app', [
	'app.directive',
	'app.directive.logdb',
	'app.directive.tree',
	'app.directive.widget',
	'app.directive.validation',
	'app.filter',
	'app.connection',
	'app.connection.session',
	'app.chart',
	'app.dom',
	'app.program',
	'app.logdb',
	'app.logdb.management',
	'pascalprecht.translate',
	'ui.sortable',
	'resettableForm'
], function($routeProvider) {
});

angular.module('app.directive.custom', []).directive('tabs', function() {
	return {
		restrict: 'A',
		link: function(scope, el, attrs) {
			
		}
	}
});

logpresso.config(['$translateProvider', function ($translateProvider) {
	$translateProvider.useStaticFilesLoader({
		prefix: '/locales/system.',
		suffix: '.json'
	});

	$translateProvider.preferredLanguage('ko');
	$translateProvider.fallbackLanguage('en');
}]);

logpresso.factory('eventSender', function() {
	var e = {};
	return e;
});

function debounce(fn, delay) {
	var timer = null;
	return function () {
		var context = this, args = arguments;
		clearTimeout(timer);
		timer = setTimeout(function () {
			fn.apply(context, args);
		}, delay);
	};
}

function DashboardController($scope) {
	
	var layoutdata = {
		"rows": [
			{
				"cols": [
					{
						"w": 25,
						"rows": [
							{
								"cols": [
									{
										"w": 100,
										"guid": "a-a"
									}
								],
								"h": 50
							},
							{
								"cols": [
									{
										"w": 100,
										"guid": "a-b"
									}
								],
								"h": 30
							},
							{
								"cols": [
									{
										"w": 100,
										"guid": "a-c"
									}
								],
								"h": 20
							}
						],
						"guid": "a"
					},
					{
						"w": 50,
						"guid": "b"
					},
					{
						"w": 25,
						"guid": "c"
					}
				],
				"h": 50
			},
			{
				"cols": [
					{
						"w": 50,
						"guid": "d"
					},
					{
						"w": 50,
						"guid": "e"
					}
				],
				"h": 50
			}
		],
		"w": 100,
		"guid": "root"
	}

	var ld = {
		"w": 100,
		"rows": [
			{
				"cols": [
					{
						"w": 100,
						"guid": "y-a"
					}
				],
				"h": 50
			},
			{
				"cols": [
					{
						"w": 100,
						"guid": "y-b"
					}
				],
				"h": 30
			},
			{
				"cols": [
					{
						"w": 100,
						"guid": "y-c"
					}
				],
				"h": 20
			}
		],
		"guid": "y"
	}

	$scope.addWidget = function() {
		// console.log(box)

		var newbie = layoutEngine.ui.layout.box.create({
			'w': 100,
			'guid': 'newbie'
		});
		console.log(newbie)

		var newdiv = $('<div class="newbie"></div>').appendTo('body');
		
		newbie.on('splitInsert', function() {
			newdiv.remove();
			// newbie.off(ev); 
			// 실제로 할 필요 없음. splitInsert 이후 box 는 삭제되고 새로 생성되는 것이므로, 이전 box 의 이벤트가 따라다니지 않는다.
		});
		newbie.resizerH.hide();

		newbie.appendTo(newdiv, true)
	}

	// dummies for prototype chaining
	layoutEngine.ui.layout.box.create({'w': 100,'guid': 'zz'}); // Box
	layoutEngine.ui.layout.box.create({'w': 100,'guid': 'yy'}); // Box - Resizable
	//

	function getRoot() {
		if(!!layoutEngine.ui.layout.box.root) {
			console.log( layoutEngine.ui.layout.box.root.getObject() ) ;
		}
	}

	var boxe = new CustomEvent(layoutEngine.ui.layout.box.event);
	boxe.on('modify', debounce(getRoot, 200));
	boxe.on('resize', getRoot);

	var box = layoutEngine.ui.layout.box.create(layoutdata, true); // Box - Resizable - CustomEvent	
	box.appendTo(".dockpanel");


	

var tabel = '<div class="tab-comp">\
	<ul class="nav nav-tabs">\
		<li><a href=".tab-content .home" data-toggle="tab">Home</a></li>\
		<li><a href=".tab-content .profile" data-toggle="tab">Profile</a></li>\
		<li class="active"><a href=".tab-content .messages" data-toggle="tab">Messages</a></li>\
		<li><a href=".tab-content .settings" data-toggle="tab">Settings</a></li>\
	</ul>\
\
	<div class="tab-content">\
		<div class="tab-pane home">..home.</div>\
		<div class="tab-pane profile">profile</div>\
		<div class="tab-pane active messages">meeee.</div>\
		<div class="tab-pane settings">..ssssss<br>\
			asdfasdf<br>asdfasdf.</div>\
	</div>\
</div>';

	var cbox = angular.element('div[dock-id=b] .contentbox');
	cbox.css('position','relative');
	angular.element(tabel).appendTo(cbox);


	var zbox = layoutEngine.ui.layout.box.create(ld); // Box - Resizable - CustomEvent
	zbox.appendTo('.tab-content div.tab-pane.messages');
}

function PresetController($scope) {

}
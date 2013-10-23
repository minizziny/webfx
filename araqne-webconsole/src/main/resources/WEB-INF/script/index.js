var $lang = 'ko'// navigator.language;

var logpresso = angular.module('app', [
	'app.directive',
	'app.directive.logdb',
	'app.directive.tree',
	'app.directive.widget',
	'app.filter',
	'app.connection',
	'app.connection.session',
	'app.chart',
	'app.dom',
	'app.program',
	'app.logdb',
	'app.logdb.management',
	'pascalprecht.translate'
], function($routeProvider) {

});

logpresso.run(function($rootScope, $location, $anchorScroll, $routeParams, $compile, eventSender, serviceSession) {

	$rootScope.$on('$routeChangeStart', function() {
		console.log('routeChangeStart')

	});

	$rootScope.$on('$locationChangeSuccess', function() {
		function route() {
			var path = location.hash.replace('#/', '');
			eventSender.root.go(path);

			if(!!eventSender.menu.onOpen) {
				eventSender.menu.onOpen(path);	
			}
		}

		if( serviceSession.whoAmI() != null ) {
			route();
		}
		else {
			serviceSession.getPrincipal({
				'not_logged_in': eventSender.root.initialize,
				'logged_in': route
			});
		}
	});

});

logpresso.config(['$translateProvider', function ($translateProvider) {
	$translateProvider.useStaticFilesLoader({
		prefix: 'locales/system.',
		suffix: '.json'
	});

	$translateProvider.preferredLanguage($lang);
	$translateProvider.fallbackLanguage('en');
}]);

logpresso.factory('eventSender', function() {
	var e = {
		'root': {},
		'menu': {},
		'orgchart': {}
	}
	return e;
});


function Controller($scope, $rootScope, socket, eventSender, serviceSession) {
	console.log('Controller init');
	$scope.src = {};

	eventSender.root.go = function(path) {
		if(path == '') {
			return;
		}

		for(key in $scope.src) {
			if(key == 'menu' || key == path) {
				continue;
			}
			//$scope.src[key] = '';
		}

		angular.element('.view').hide();
		angular.element('.view#view-' + path).show();

		$scope.src[path] = 'partials/' + path + '.html';
	}

	eventSender.root.loggedIn = function() {
		$scope.src.login = '';
		$scope.src.menu = 'partials/menu.html';
		$scope.$apply();
	}

	eventSender.root.initialize = function() {
		$scope.src.login = 'partials/login.html';
		$scope.$apply();
	}

}

var color_map = ["#AFD8F8","#F6BD0F","#8BBA00","#FF8E46","#008E8E","#D64646","#8E468E","#588526","#B3AA00","#008ED6","#9D080D","#A186BE","#CC6600","#FDC689","#ABA000","#F26D7D","#FFF200","#0054A6","#F7941C","#CC3300","#006600","#663300","#6DCFF6"];

function msgbusFailed(m, raw) {
	console.warn('msgbus ' + raw[0].method + ' failed');
	console.log(raw);
}

function checkDate(member, i) {
	if(member == undefined) return false;
	var rxTimezone = new RegExp('\\+\\d{4}');
	var dateFormat = d3.time.format('%Y-%m-%d %H:%M:%S');

	return angular.isDate(dateFormat.parse(member.toString().substring(0,19))) && rxTimezone.test(member.substring(19, 24));
}

function MenuController($scope, socket, serviceSession, serviceProgram, eventSender) {
	console.log('MenuController');
	$scope.packs = [];
	$scope.tasks = [];
	$scope.isOpenMenu = false;

	$(document).on('click.for-hide-menu', function(e) {
		if($(e.target).parents('#divMenu').length == 1) {
			return;
		}
		else {
			$scope.isOpenMenu = false;	
			$scope.$apply();
		}
	});

	eventSender.menu.onOpen = function(path) {
		$scope.tasks.push(path);

		console.log($scope.$parent)
		$scope.isOpenMenu = false;
	}

	$scope.logout = function() {
		serviceSession.logout(function() {
			console.log('logout');
			location.href = '/';
		});
	}

	function initialize() {
		serviceProgram.getAvailablePrograms()
		.success(function(m) {
			$scope.packs.splice(0, $scope.packs.length);

			m.body.packs.forEach(function(pack) {
				$scope.packs.push(pack);
			});
			$scope.$apply();
		});
	}

	initialize();
}

function LoginController($scope, socket, serviceSession, eventSender) {
	console.log('LoginController init');
	$scope.txtLoginName = 'root'
	$scope.txtPassword = 'araqne'

	$scope.login = function() {
		socket.send('org.araqne.dom.msgbus.LoginPlugin.hello', {}, 0)
		.success(function(m) {

			serviceSession.login($scope.txtLoginName, $scope.txtPassword, m.body.nonce, function(m) {
				location.href='/#/starter';
				eventSender.root.loggedIn();

			});

		})
		.failed(function(m, raw) {
			console.log(m, raw, 'error')
		});
	}
}
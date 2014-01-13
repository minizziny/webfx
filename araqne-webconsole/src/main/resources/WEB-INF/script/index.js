var $lang = navigator.language;

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
	'pascalprecht.translate',
	'ui.sortable'
], function() {
});

logpresso.run(function($rootScope, $location, $anchorScroll, $compile, eventSender, serviceSession, $templateCache, $location, $translate) {

	$rootScope.$on('$locationChangeSuccess', function() {
		function route() {
			
			var hash = $location.path();
			var hashSplit = hash.split('/');
			if(hash == '/') {
				$location.path('/system/starter');
			}

			if(hashSplit.length > 2) {
				eventSender.root.go(hashSplit[1], hashSplit[2]);
				if(!!eventSender.menu.onOpen) {
					eventSender.menu.onOpen(hashSplit[2]);
				}
			}
			else {
				console.log($location.path(), $location.search());
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
	var str = location.hash.match( /(\?|\&)locale=\w{2}/g );
	if(str != null) {
		$lang = str[0].split('=')[1];
	}

	var z = $translateProvider.useStaticFilesLoader({
		prefix: 'locales/system.',
		suffix: '.json'
	});
	setTimeout(function() {
		console.log(z.translations());
	}, 1000)
	

	$translateProvider.preferredLanguage($lang);
	$translateProvider.fallbackLanguage('en');
	$translateProvider.uses('en');
}]);

logpresso.factory('eventSender', function() {
	var e = {
		'root': {},
		'menu': {},
		'starter': { pid: 11 },
		'dashboard': { pid: 22 },
		'orgchart': { pid: 33 },
		'auditlog': {},
		'logquery': { pid: 44 },
		'logsource': {},
		'table': {},
		'license': {},
		'regextester': {},
		'querymanager': {},
		'config': {}
	};

	for(var program in e) {
		e[program].events = {};
	}
	return e;
});


function Controller($scope, $rootScope, $filter, socket, eventSender, serviceSession, serviceDom, $location, $translate) {
	console.log('Controller init');

	$location.path('/');

	$scope.isShowStarter = false;
	$scope.isShowDashboard = false;
	$scope.timeout = 1000 * 60 * 1;

	$scope.src = {};
	$scope.recentPrograms = [];

	eventSender.root.onClose = function(pack, program) {
		console.log('root.close');
		$scope.src[program] = '';

		var idxProgram = $scope.recentPrograms.indexOf(program + '@' + pack);
		$scope.recentPrograms.splice(idxProgram, 1);

		eventSender[program].events.unload();
		eventSender[program].events = {};

		if($scope.recentPrograms.length == 0) {
			if( $location.path() == '/system/starter' ) {
				$location.path('/system/starter/');
			}
			else {
				$location.path('/system/starter');
			}
		}
		else {
			var arr = $scope.recentPrograms[$scope.recentPrograms.length - 1].split('@');
			$location.path('/' + arr[1] + '/' + arr[0]);
		}
	}

	eventSender.root.go = function(pack, program) {
		if(program == '') {
			return;
		}

		for(key in $scope.src) {
			if(key == 'menu' || key == program) {
				continue;
			}
			//$scope.src[key] = '';
		}

		if(!eventSender[program]) {
			return;
		}

		angular.element('.view').hide();
		angular.element('.view#view-' + program).show();

		$scope.src[program] = 'package/' + pack + '/' + program + '/index.html';

		var idxProgram = $scope.recentPrograms.indexOf(program + '@' + pack);
		if(idxProgram != -1) {
			$scope.recentPrograms.splice(idxProgram, 1);
		}
		$scope.recentPrograms.push(program + '@' + pack);

		if($scope.recentPrograms.length > 1) {
			var lastest = $scope.recentPrograms[$scope.recentPrograms.length - 2].split('@')[0];
			eventSender[lastest].events.suspend();	
		}

		if(!eventSender[program].events.unload) {
			console.log('--- load!', program);
			var pe = eventSender[program].$event = new CustomEvent(eventSender[program].events);
			pe.on('unload', function() {
				console.log('--- unload', program);
			});

			pe.on('suspend', function() {
				console.log('--- suspend', program);
			});

			pe.on('resume', function() {
				console.log('--- resume', program);
			})
		}
		else {
			eventSender[program].events.resume();
		}
		

		if($('#view-starter').css('display') == "block") {
			$scope.isShowStarter = true;
		} else {
			$scope.isShowStarter = false;
		}

		if($('#view-dashboard').css('display') == "block") {
			$scope.isShowDashboard = true;
		} else {
			$scope.isShowDashboard = false;
		}
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

	eventSender.root.startTimeout = function() {
		socket.send('org.araqne.dom.msgbus.OrganizationPlugin.getOrganizationParameter', {'key': 'admin_timeout'}, 0)
		.success(function(m) {
			var timeout = m.body.result;
			$scope.timeout = timeout * 1000;

			console.log('loaded: ' + $scope.timeout);

			if(timeout == null || timeout == '') {
				$scope.LogOutTimer().stop();
			} else {
				$scope.LogOutTimer().start();
			}			
		})
		.failed(function(m, raw) {
			console.log(m, raw, 'error')
		});

		$scope.$apply();
	}

	$scope.LogOutTimer = function(){
		var S = {
			timer : null,
			limit : $scope.timeout,
			fnc   : function() {
				serviceSession.logout(function() {
					var alertMsg = $filter('translate')('$S_str_TimeoutAlert');
					console.log('idle time out [' + S.limit / 1000 + 'sec] log out.');
					alert(alertMsg);					
					location.href = '/';
				});
				S.stop();
				
			},
			start : function() {
				S.timer = window.setTimeout(S.fnc, S.limit);
				console.log('start timeout function');
			},
			reset : function() {
				console.log('reset timeout ['+ S.limit +']');
				window.clearTimeout(S.timer);
				S.start();
			},
			stop : function() {
				console.log('stop timeout function');
				window.clearInterval(S.timer);
			}
		};

		S.limit = $scope.timeout;
		console.log('saved: '+S.limit);

		if(S.timer != null) {
			document.onmousemove = function() {
				S.reset(); 
			};
		}

		return S;
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

function MenuController($scope, socket, serviceSession, serviceProgram, eventSender, $location) {
	console.log('MenuController');
	$scope.packs = [];
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

	function getProgram(path) {
		var found = null;
		$scope.packs.forEach(function(pack) {
			pack.programs.forEach(function(program) {
				program.isCurrent = false;
				if(program.path == path) {
					found = program;
				}
			});
		});
		return found;
	}

	function activeProgram(program) {
		if(program != null) {
			program.isActive = true;
			program.isCurrent = true;
		}
	}

	eventSender.menu.onOpen = function(path) {
		activeProgram(getProgram(path));
		
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
				pack.isOpen = false;

				pack.programs.forEach(function(program) {
					program.halt = function(e) {
						console.log('halt');
						e.stopPropagation();
						var el = angular.element('#view-' + program.path);
						program.isActive = false;
						program.isCurrent = false;

						eventSender.root.onClose(pack.dll, program.path);
					}
				})
			});

			activeProgram(getProgram('starter'));

			$scope.$apply();
		});
	}

	$scope.toggleDropdown = function(pack) {
		// pack.isOpen = true;
		// return;
		$scope.packs.forEach(function(p) {
			if(pack == p) {
				pack.isOpen = !pack.isOpen;
			}
			else {
				p.isOpen = false;	
			}
		});

		$(document).on('click.for-hide-top-menu', function(e) {
			// if($(e.target) == 1) {
			// 	return;
			// }
			pack.isOpen = false;

			$(document).off('click.for-hide-top-menu')
		});
		
	}

	initialize();
}

function LoginController($scope, socket, serviceSession, eventSender, $location) {
	console.log('LoginController init');
	$scope.txtLoginName = '';
	$scope.txtPassword = '';

	$scope.login = function() {
		socket.send('org.araqne.dom.msgbus.LoginPlugin.hello', {}, 0)
		.success(function(m) {

			serviceSession.login($scope.txtLoginName, $scope.txtPassword, m.body.nonce, function(m) {
				$location.path('/system/starter');

				eventSender.root.loggedIn();
				eventSender.root.startTimeout();
			});
		})
		.failed(function(m, raw) {
			console.log(m, raw, 'error')
		});
	}

	angular.element('#inputId').focus();
}

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

function throttle(fn, threshhold, scope) {
	threshhold || (threshhold = 250);
	var last, deferTimer;
	return function () {
		var context = scope || this;

		var now = +new Date,
		args = arguments;
		if (last && now < last + threshhold) {
			// hold on to it
			clearTimeout(deferTimer);
			deferTimer = setTimeout(function () {
				last = now;
				fn.apply(context, args);
			}, threshhold);
		} else {
			last = now;
			fn.apply(context, args);
		}
	};
}

function computerFormatPrefix(val) {
	var computerFormatPrefixes = [ "", "K", "M", "G", "T", "P", "E", "Z", "Y" ];
	function log1024(val) { return Math.log(val) / Math.log(1024); }

	var pow = Math.floor( log1024(val) );
	if(pow == -Infinity) {
		return { symbol: '', value: 0 };
	}
	else {
		return {
			symbol: computerFormatPrefixes[pow],
			value: val/Math.pow(1024, pow)
		};
	}
}
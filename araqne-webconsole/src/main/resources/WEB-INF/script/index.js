var $lang = navigator.language;
var proc = { pid: 0 };

var logpresso = angular.module('app', [
	'app.directive',
	'app.directive.logdb',
	'app.directive.tree',
	'app.directive.widget',
	'app.directive.validation',
	'app.filter',
	'app.services',
	'app.connection',
	'app.connection.session',
	'app.chart',
	'app.dom',
	'app.program',
	'app.logdb',
	'app.logdb.management',
	'pascalprecht.translate',
	'ui.sortable',
	'ajoslin.promise-tracker',
	'ngAnimate'
], function() {
});

var pageCache = [];

logpresso.config(['$translateProvider', function ($translateProvider) {
	var str = location.hash.match( /(\?|\&)locale=\w{2}/g );
	if(str != null) {
		$lang = str[0].split('=')[1];
	}

	var z = $translateProvider.useStaticFilesLoader({
		prefix: 'locales/system.',
		suffix: '.json'
	});

	$translateProvider.preferredLanguage($lang);
	$translateProvider.fallbackLanguage('en');
}]);

logpresso.run(function($rootScope, $location, socket, eventSender, serviceSession, $location, $translate, $q, promiseTracker, $filter) {
	$location.path('/');
	$rootScope.loadingTracker = promiseTracker('loadingTracker');

	$rootScope.$on('$translateLoadingEnd', function(a) {
		console.log('$translateLoadingEnd', $translate.preferredLanguage(), $translate.proposedLanguage(), $translate.fallbackLanguage(), $translate.storage() )
	});

	$rootScope.$on('$translateLoadingError', function() {
		$translate.uses($translate.fallbackLanguage());
	});
	
	
	$rootScope.src = 'partials/login.html';

	function route() {
		console.log('route');
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

	$rootScope.$on('$locationChangeSuccess', function() {
		var deferred = $q.defer();
		$rootScope.loadingTracker.addPromise(deferred.promise);
		var contentResolve = $rootScope.$on('$includeContentLoaded', debounce(function() {
			console.log('$includeContentLoaded');
			deferred.resolve();
			contentResolve();
		}, 1000));

		if( serviceSession.whoAmI() != null ) {
			route();
		}
		else {
			serviceSession.getPrincipal({
				'not_logged_in': function() {
					$rootScope.src = 'partials/login.html';
					$rootScope.$apply();
				},
				'logged_in': route
			});
		}
	});

	$rootScope.timeout = 1000 * 60 * 1;

	function LogOutTimer() {
		var S = {
			timer : null,
			limit : $rootScope.timeout,
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

		console.log('saved: '+S.limit);

		if(S.timer != null) {
			document.onmousemove = function() {
				S.reset(); 
			};
		}

		return S;
	}

	eventSender.root.startTimeout = function() {
		socket.send('org.araqne.dom.msgbus.OrganizationPlugin.getOrganizationParameter', {'key': 'admin_timeout'}, 0)
		.success(function(m) {
			console.log('startTimeout')
			var timeout = m.body.result;
			$rootScope.timeout = timeout * 1000;

			console.log('loaded: ' + $rootScope.timeout);

			if(timeout == null || timeout == '') {
				LogOutTimer().stop();
			} else {
				LogOutTimer().start();
			}			
		})
		.failed(function(m, raw) {
			console.log(m, raw, 'error')
		});

		$rootScope.$apply();
	}

});

logpresso.factory('serviceResource', function() {
	return {

	}
})

logpresso.factory('eventSender', function($rootScope) {
	var e = {
		'root': {
			'go': function(pack, program) {

				function programStatusChangeEvent() {
					if(!e[program].events.unload) {
						console.log('--- load!', program);
						var pe = e[program].$event = new CustomEvent(e[program].events);
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
						e[program].events.resume();
					}
				}

				var idxProgram = e.menu.recentPrograms.indexOf(pack + '@' + program);
				if(idxProgram != -1) {
					e.menu.recentPrograms.splice(idxProgram, 1);
				}

				if(e.menu.recentPrograms.length > 0) {
					console.log('recentPrograms', e.menu.recentPrograms)
					var lastest = e.menu.recentPrograms[e.menu.recentPrograms.length - 1];
					var lastestP = lastest.split('@')[1];
					e[lastestP].events.suspend();
					console.log(e.menu.index[lastest], lastest, e.menu.index)
					pageCache[e.menu.index[lastest]] = document.querySelector('.view');
					document.querySelector('.view').parentNode.removeChild(pageCache[e.menu.index[lastest]])

					// pageCache[e.menu.index[lastest]] = $('.view').detach();
				}

				e.menu.recentPrograms.push(pack + '@' + program);

				if(!!e.menu.index) {
					var idx = e.menu.index[pack + '@' + program];
					if(pageCache[idx] != undefined) {
						// have cached

						console.log('pageCache')

						$('body').append(pageCache[idx]);

						delete pageCache[idx];

						// programStatusChangeEvent();

						return;
					}
				}



				var deps = ['package/' + pack + '/' + program + '/' + program + '.js']
				$script(deps, function() {
					console.log('script loaded');
					$rootScope.src = 'package/' + pack + '/' + program + '/index.html';
					$rootScope.$apply();

					programStatusChangeEvent();
				});
				// console.log(arguments)
			}
		},
		'menu': {
			'recentPrograms': []
		},
		'starter': { pid: 11 },
		'dashboard': { pid: 22 },
		'orgchart': { pid: 33 },
		'auditlog': { pid: 88 },
		'logquery': { pid: 44 },
		'logsource': { pid: 55 },
		'table': { pid: 66 },
		'license': { pid: 77 },
		'regextester': {},
		'querymanager': {},
		'config': { pid: 99 }
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
	$scope.programs = [];

	function getProgram(path) {
		var found = null;
		$scope.programs.forEach(function(program) {
			program.isCurrent = false;
			if(program.path == path) {
				found = program;
			}
		});
		return found;
	}

	function activeProgram(program) {
		if(program != null) {
			program.isActive = true;
			program.isCurrent = true;
		}
	}

	$scope.locate = function(program) {
		location.href = '/#/' + program.packdll + '/' + program.path;
	}

	eventSender.menu.onOpen = function(path) {
		activeProgram(getProgram(path));
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
			$scope.programs.splice(0, $scope.programs.length);

			pageCache = new Array(m.body.programs.length);
			eventSender.menu.index = {};

			m.body.programs.forEach(function(p, index) {
				p.packdll = (function() {
					var found = m.body.packs.filter(function(pack) {
						return pack.name == p.pack;
					});
					if(found.length > 0) {
						return found[0].dll;
					}
					return undefined;
				}());
				p.isActive = false;
				p.isCurrent = false;
				p.halt = function(e) {
					console.log('halt');
					e.stopPropagation();
					var el = angular.element('#view-' + p.path);
					p.isActive = false;
					p.isCurrent = false;

					eventSender.root.onClose(p.packdll, p.path);
				}
				eventSender.menu.index[p.packdll + '@' + p.path] = index;
				$scope.programs.push(p);
			});

			activeProgram(getProgram('starter'));

			$scope.$apply();

			var elProgram = $('.tm-program');
			var styleTextAll = '';
			elProgram.each(function(i, obj) {
				var mw = $(obj).offset().left + $(obj).outerWidth();
				var styleText = ' @media screen and (max-width: ' + (mw + 200).toString() + 'px) {\
					.tm .tm-program:nth-child(' + (i + 1).toString() + ') { display: none; }\
					.tm-more .dropdown-menu li:nth-child(' + (i + 1).toString() + ') { display: block; }\
				} ';
				styleTextAll = styleTextAll + styleText;

				if(i + 1 == elProgram.length) {
					styleTextAll = styleTextAll + ' @media screen and (max-width: ' + (mw + 200).toString() + 'px) { .tm .tm-more { display: inline; } } ';
				}
			});

			$('<style>'+ styleTextAll + '</style>').appendTo('body');
		});
	}

	initialize();
}

function LoginController($scope, socket, serviceSession, eventSender, $location, $rootScope) {
	console.log('LoginController init');
	$scope.txtLoginName = '';
	$scope.txtPassword = '';

	$scope.login = function() {
		socket.send('org.araqne.dom.msgbus.LoginPlugin.hello', {}, 0)
		.success(function(m) {
			serviceSession.login($scope.txtLoginName, $scope.txtPassword, m.body.nonce, function(m) {
				
				$location.path('/system/starter');
				console.log('logged in')

				$rootScope.srcmenu = 'partials/menu.html';
				eventSender.root.startTimeout();
				$scope.$apply();
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

function dashToCamel(str) {
	str = str.replace(/\W+(.)/g, function (x, chr) {
		return chr.toUpperCase();
	})
	return str.charAt(0).toUpperCase() + str.slice(1);
}

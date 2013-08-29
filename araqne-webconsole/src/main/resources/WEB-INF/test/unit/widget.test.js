'use strict';

/* jasmine specs for directives go here */

describe('directives.widget', function() {
	
	var $compile, $rootScope;
	var serviceTask, serviceSession;
	//var password = prompt('enter root password');

	beforeEach(module('App'));
	beforeEach(module('Widget'));

	it('로그인', inject(function(_$compile_, _$rootScope_, _serviceSession_, _serviceTask_) {
		var spy = jasmine.createSpy();

		runs(function() {
			$compile = _$compile_;
			$rootScope = _$rootScope_;
			serviceTask = _serviceTask_;
			serviceSession = _serviceSession_;

			window.proc = serviceTask.newProcess('widget.test');

			function checkLogin(m) {
				if( m.body.admin_login_name == null && m.body.org_domain == null ) {
					serviceSession.login('root', 'araqne')
					.success(function() {
						console.log('login succeed');
						spy();
					})
					.failed(function(m, raw) {
						console.log('login failed, continue anyway', raw);
						spy();
					});
				}
				else {
					spy();
				}
			}

			serviceSession.getSessions()
			.success(function(m) {
				checkLogin(m);
			})
			.failed(function(m) {
				checkLogin(m)
			});
		});

		waitsFor(function() {
			return spy.callCount == 1;
		}, "The Ajax call timed out.", 10000);
	}));

	it('setContext 함수 존재 여부', function() {
		var element = $compile("<widget></widget>")($rootScope);
		expect(typeof element[0].setContext).toBe('function');
	});

	it('grid 컨텍스트 iis 200개', function() {
		var spy = jasmine.createSpy();
		var ctx = {
			data: {
				order: ['line', '_time'],
				query: 'table limit=10000 iis'
			},
			guid: "w4cfe84c0c900b7ez",
			interval: 15,
			name: "iis 200개",
			type: "grid",
		}

		var element = $compile("<widget></widget>")($rootScope);

		runs(function() {

			element[0].setContext(ctx, {
				loaded: function() {
					console.log('111 loaded');
					spy();
				}
			});

		});

		waitsFor(function() {
			return spy.callCount == 1;
		}, "The Ajax call timed out.", 10000);

		runs(function() {
			expect(element.scope().dataQueryResult.length).toEqual(200);
		});
	});

	it('grid 컨텍스트 넘기기', function() {
		var spy = jasmine.createSpy();

		var ctx = {
			data: {
				order: ['agent', 'count'],
				query: 'table limit=10000 iis | rex field=line ".* (?<agent>[^ ]*)[^ ]* [^ ]* [^ ]* [^ ]*$" | eval agent = case(agent == "*MSIE*", "IE", agent == "*Firefox*", "Firefox", agent == "*Google*", "Google bot", agent == "*Yahoo*", "Yahoo bot", agent == "*Avant*", "Avant", "기타")  | stats count by agent | sort -count'
			},
			guid: "w4cfe84c0c900b7e3",
			interval: 15,
			name: "브라우저 현황",
			type: "grid",
		}

		var element = $compile("<widget></widget>")($rootScope);

		runs(function() {

			element[0].setContext(ctx, {
				pageLoaded: function() {
					spy();
				}
			});
		});

		waitsFor(function() {
			return spy.callCount == 1;
		}, "The Ajax call timed out.", 5000);

		runs(function() {
			expect(element.scope().dataQueryResult.length).toEqual(6);
		});
	});

	it('잘못된 쿼리', function() {
		var spy = jasmine.createSpy();
		var ctx = {
			data: {
				order: ['agent', 'count'],
				query: 'wrong query'
			},
			guid: "w4cfe84c0c900b7e3",
			interval: 15,
			name: "브라우저 현황",
			type: "grid",
		}

		var element = $compile("<widget></widget>")($rootScope);

		runs(function() {
			
			element[0].setContext(ctx, {
				failed: function() {
					spy();
				}
			});
		});

		waitsFor(function() {
			return spy.callCount == 1;
		}, "The Ajax call timed out.", 5000);

		runs(function() {
			$('#canvas').append(element);
			element.find('button.b-p').click();
			element[0].$dispose();
		})
	});


	it('위젯 지우기', function() {
		var spy = jasmine.createSpy();
		var ctx = {
			data: {
				order: ['agent', 'count'],
				query: 'table limit=10000 iis | rex field=line ".* (?<agent>[^ ]*)[^ ]* [^ ]* [^ ]* [^ ]*$" | eval agent = case(agent == "*MSIE*", "IE", agent == "*Firefox*", "Firefox", agent == "*Google*", "Google bot", agent == "*Yahoo*", "Yahoo bot", agent == "*Avant*", "Avant", "기타")  | stats count by agent | sort -count'
			},
			guid: "w4cfe84c0c900b7e3",
			interval: 15,
			name: "브라우저 현황",
			type: "grid",
		}


		$rootScope.onRemove = function(arg) {
			alert('onRemove ' + arg);
		}

		var element = $compile('<widget on-remove="onRemove(\'test\')"></widget>')($rootScope);

		runs(function() {
			
			element[0].setContext(ctx, {
				loaded: function() {
					spy();
				}
			});
		});

		waitsFor(function() {
			return spy.callCount == 1;
		}, "The Ajax call timed out.", 5000);

		runs(function() {
			$('#canvas').append(element);
			element.find('button.b-x').click();
		});

	});
});
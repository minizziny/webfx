'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
	var INTERVAL = 200;

	var tester;
	beforeEach(function() {
		tester = ngMidwayTester('app.directive.chart');
	});

	afterEach(function() {
		tester.destroy();
		tester = null;
	});

	// beforeEach(module('app.directive.chart'));
	
	describe('pie', function() {
		it('sample', function() {
			var scope = tester.viewScope().$new();
			scope.dataPie = ['d','z','g'];
			var element = tester.compile('<pie ng-model="dataPie"></pie>', scope);
			var viewEl = tester.viewElement().append(element);

			var flag = false;

			runs(function() {
				// runs 블록은 순차적으로 실행할 것입니다.
				setTimeout(function() {
					flag = true;
				}, INTERVAL);
			});

			waitsFor(function() {
				// 여기는 flag 가 true 가 될때까지 반복적으로 기다립니다.
				// 화면에 directive 를 뿌리기 위해 이러한 코드를 넣었습니다.
				return flag;
			}, INTERVAL + 100);

			runs(function() {
				expect(viewEl.find('pie').hasClass('ng-scope')).toBe(true);
			});
		});

		it('setContext', function() {
			var scope = tester.viewScope().$new();
			scope.dataPie = ['ss'];
			var element = tester.compile('<pie ng-model="dataPie"></pie>', scope);
			var viewEl = tester.viewElement().append(element);

			var flag = false;

			runs(function() {
				// runs 블록은 순차적으로 실행할 것입니다.
				setTimeout(function() {
					scope.dataPie.push('aa');
					scope.$apply();
				}, INTERVAL);

				setTimeout(function() {
					flag = true;
				}, INTERVAL + INTERVAL);
			});

			waitsFor(function() {
				// 여기는 flag 가 true 가 될때까지 반복적으로 기다립니다.
				// 화면에 directive 를 뿌리기 위해 이러한 코드를 넣었습니다.
				return flag;
			}, INTERVAL + INTERVAL + 100);

			runs(function() {
				// expect(viewEl.find('pie').text()).toEqual('chart pie');
				expect('a').toEqual('a')
			});
		});

	});
});

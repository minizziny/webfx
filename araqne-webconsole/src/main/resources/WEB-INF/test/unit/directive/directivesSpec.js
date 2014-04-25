'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
	beforeEach(module('myApp.directives'));

	describe('app-version', function() {
		it('should print current version', function() {
			module(function($provide) {
				$provide.value('version', 'TEST_VER');
			});
			inject(function($compile, $rootScope) {
				var element = $compile('<span app-version></span>')($rootScope);
				expect(element.text()).toEqual('TEST_VER');
			});
		});
	});



	describe('asset', function() {
		it('is defined', function() {
			inject(function($compile, $rootScope) {
				var element = $compile('<asset><div>transclude here!</div></asset>')($rootScope);
				expect(element.children().length).toEqual(1);
			});
		});

		it('bind context function', function() {
			inject(function($compile, $rootScope) {
				var element = $compile('<asset><div>transclude here!</div></asset>')($rootScope);
				expect(typeof element[0].bind).toEqual('function');
			});
		});
	});
});

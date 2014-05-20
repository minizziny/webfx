'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
	beforeEach(module('app.directive.widget'));

	describe('asset', function() {
		it('is defined', function() {
			inject(function($compile, $rootScope) {
				var element = $compile('<asset><div>transclude here!</div></asset>')($rootScope);
				expect(element.children().length).toEqual(3);
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

describe('controller', function() {
	var $httpBackend, $rootScope, createController;

	beforeEach(module('app.directive.widget'));
	beforeEach(inject(function($injector) {
		$httpBackend = $injector.get('$httpBackend');
	}));

	describe('hello', function() {

		it('', function(d) {
			$httpBackend.expectGET('/auth.py').respond('hellozz');
			inject(function($compile, $rootScope) {
				var element = $compile('<asset><div>transclude here!</div></asset>')($rootScope);

				var promise = element[0].getHello();
				var hello;

				promise.then(function (_hello) {
					hello = _hello;
				});
				$httpBackend.flush();
				expect(hello).toEqual('hellozz');
			});

		});
	});
});

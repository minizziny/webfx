'use strict';

/* jasmine specs for directives go here */

describe('services', function() {
	var INTERVAL = 100;

	var tester;
	beforeEach(function() {
		tester = ngMidwayTester('app.chart');
	});

	afterEach(function() {
		tester.destroy();
		tester = null;
	});
	
	describe('wordcloud', function() {
		it('sample data 1', function() {
			var scope = tester.viewScope().$new();
			var serviceChart = tester.inject('serviceChart');
			var viewEl = tester.viewElement();

			var data = [{"count":1362,"domain":"www.facebook.com"},{"count":861,"domain":"syndication.twitter.com"},{"count":701,"domain":"www.google.com"},{"count":615,"domain":"gms.ahnlab.com"},{"count":553,"domain":"www.rescuetime.com"},{"count":525,"domain":"twitter.com"}];

			serviceChart.getWordCloud(data, 'count', 'domain', viewEl);

			var flag = false;

			runs(function() {
				// runs 블록은 순차적으로 실행할 것입니다.
				setTimeout(function() {
					flag = true;
				}, INTERVAL);
			});

			waitsFor(function() {
				
				return flag;
			}, INTERVAL + 100);

			runs(function() {
				expect(viewEl.find('svg > g > text:first').text()).toEqual('www.facebook.com');
			});
		});

		it('sample data 2', function() {
			var scope = tester.viewScope().$new();
			var serviceChart = tester.inject('serviceChart');
			var viewEl = tester.viewElement();

			var data = [{"count":100000,"domain":"www.facebook.com"},{"count":861,"domain":"syndication.twitter.com"},{"count":701,"domain":"www.google.com"},{"count":615,"domain":"gms.ahnlab.com"},{"count":553,"domain":"www.rescuetime.com"},{"count":1,"domain":"twitter.com"}];

			serviceChart.getWordCloud(data, 'count', 'domain', viewEl);

			var flag = false;

			runs(function() {
				// runs 블록은 순차적으로 실행할 것입니다.
				setTimeout(function() {
					flag = true;
				}, INTERVAL);
			});

			waitsFor(function() {
				
				return flag;
			}, INTERVAL + 100);

			runs(function() {
				expect(viewEl.find('svg > g > text:first').text()).toEqual('www.facebook.com');
			});
		});

	});
});

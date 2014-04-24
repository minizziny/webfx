(function($) {
	/*
		======== A Handy Little QUnit Reference ========
		http://api.qunitjs.com/

		Test methods:
			module(name, {[setup][ ,teardown]})
			test(name, callback)
			expect(numberOfAssertions)
			stop(increment)
			start(decrement)
		Test assertions:
			ok(value, [message])
			equal(actual, expected, [message])
			notEqual(actual, expected, [message])
			deepEqual(actual, expected, [message])
			notDeepEqual(actual, expected, [message])
			strictEqual(actual, expected, [message])
			notStrictEqual(actual, expected, [message])
			throws(block, [expected], [message])
	*/

	module('basic', {
	});

	test('has function', function() {
		expect(1);
		strictEqual(typeof window.ValidateWidgetContext, 'function', 'function exist');
	});

	module('grid type', {
		setup: function() {
			var self = this;
			$.getJSON('type-grid.json', function(resp) {
				self.json = resp;
				QUnit.start();
			});
			QUnit.stop();
		}
	});

	test('passed?', function() {
		expect(1);
		ok(window.ValidateWidgetContext(this.json[0]), 'passed');
	});

	module('chart line type', {
		setup: function() {
			var self = this;
			$.getJSON('type-chart-line.json', function(resp) {
				self.json = resp;
				QUnit.start();
			});
			QUnit.stop();
		}
	});

	test('passed?', function() {
		expect(1);
		ok(window.ValidateWidgetContext(this.json[0]), 'passed');
	});

	module('chart pie type', {
		setup: function() {
			var self = this;
			$.getJSON('type-chart-pie.json', function(resp) {
				self.json = resp;
				QUnit.start();
			});
			QUnit.stop();
		}
	});

	test('throw error?', function() {
		expect(1);

		throws(function() {
			window.ValidateWidgetContext(this.json[0]);
		}, TypeError, 'TypeError: interval is not number');
	});

	module('tabs type', {
		setup: function() {
			var self = this;
			$.getJSON('type-tabs.json', function(resp) {
				self.json = resp;
				QUnit.start();
			});
			QUnit.stop();
		}
	});

	test('passed?', function() {
		expect(1);
		ok(window.ValidateWidgetContext(this.json[0]), 'passed');
	});

	module('wordcloud type', {
		setup: function() {
			var self = this;
			$.getJSON('type-wordcloud.json', function(resp) {
				self.json = resp;
				QUnit.start();
			});
			QUnit.stop();
		}
	});

	test('passed?', function() {
		expect(1);
		ok(window.ValidateWidgetContext(this.json[0]), 'passed');
	});

}(jQuery));

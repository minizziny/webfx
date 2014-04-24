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
		strictEqual(typeof window.onCreateNewWidgetAndSavePreset, 'function', 'function exist');
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
		var angular = window.angular;
		window.dataAssetTypes = [];
		window.addAssetType({
			name: 'Grid',
			id: 'grid',
			event: {
				onNextStep: function() {
					throw new TypeError('not implement');
				}
			},
			validator: function(ctx) {
				if(!angular.isNumber(ctx.interval)) {
					throw new TypeError('interval-is-not-number');
				}

				if(angular.isUndefined(ctx.data))	{
					return false;
				}

				if(!angular.isString(ctx.data.query)) {
					return false;
				}

				// grid only
				if(!angular.isArray(ctx.data.order)) {
					return false;
				}
				return true;
			}	
		});
		deepEqual(window.onCreateNewWidgetAndSavePreset(this.json[0]), 'added');
	});

	module('grid2 type', {
		setup: function() {
			var self = this;
			$.getJSON('type-grid2.json', function(resp) {
				self.json = resp;
				QUnit.start();
			});
			QUnit.stop();
		}
	});

	test('passed?', function() {
		expect(1);
		var angular = window.angular;
		window.dataAssetTypes = [];
		window.addAssetType({
			name: 'Grid',
			id: 'grid',
			event: {
				onNextStep: function() {
					throw new TypeError('not implement');
				}
			},
			validator: function(ctx) {
				if(!angular.isNumber(ctx.interval)) {
					throw new TypeError('interval-is-not-number');
				}

				if(angular.isUndefined(ctx.data))	{
					return false;
				}

				if(!angular.isString(ctx.data.query)) {
					return false;
				}

				// grid only
				if(!angular.isArray(ctx.data.order)) {
					return false;
				}
				return true;
			}	
		});
		deepEqual(window.onCreateNewWidgetAndSavePreset(this.json[0]), 'added');
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
		var angular = window.angular;
		window.addAssetType({
			name: 'Chart',
			id: 'chart',
			event: {
				onNextStep: function() {
					throw new TypeError('not implement');
				}
			},
			validator: function(ctx) {
				if(!angular.isNumber(ctx.interval)) {
					throw new TypeError('interval-is-not-number');
				}

				if(angular.isUndefined(ctx.data))	{
					return false;
				}

				if(!angular.isString(ctx.data.query)) {
					return false;
				}

				// chart only
				if(!/^(line|pie|bar)$/.test(ctx.data.type)) {
					return false;
				}

				if(!angular.isArray(ctx.data.series)) {
					return false;
				}
				return true;
			}	
		});
		deepEqual(window.onCreateNewWidgetAndSavePreset(this.json[0]), 'added');
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
			window.onCreateNewWidgetAndSavePreset(this.json[0]);
		}, new RegExp('interval-is-not-number'), 'CustomError: interval-is-not-number');
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
		window.addAssetType({
			name: 'Tabs',
			id: 'tabs',
			event: {
				onNextStep: function() {
					throw new TypeError('not implement');
				}
			},
			validator: function() {
				return true;
			}	
		});
		
		deepEqual(window.onCreateNewWidgetAndSavePreset(this.json[0]), 'added');
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
		var angular = window.angular;
		window.addAssetType({
			name: 'Wordcloud',
			id: 'wordcloud',
			event: {
				onNextStep: function() {
					throw new TypeError('not implement');
				}
			},
			validator: function(ctx) {
				if(!angular.isNumber(ctx.interval)) {
					throw new TypeError('interval-is-not-number');
				}

				if(angular.isUndefined(ctx.data))	{
					return false;
				}

				if(!angular.isString(ctx.data.query)) {
					return false;
				}
				return true;
			}	
		});
		deepEqual(window.onCreateNewWidgetAndSavePreset(this.json[0]), 'added');
	});

}(jQuery));

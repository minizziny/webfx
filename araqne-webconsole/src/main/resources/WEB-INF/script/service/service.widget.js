angular.module('app.widget', [])
.service('WidgetService', ['serviceUtility', function(serviceUtility){
	var dataAssetTypes = [
		{
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
			},
			template: '<asset data-guid="{{guid}}"><div class="e-grid">GridDDD!!</div></asset>',
			link: function() {

			}
		},
		{
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
			},
			template: '<asset data-guid="{{guid}}"><div>Chart Here</div></asset>',
		},
		{
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
			},
			template: '<asset data-guid="{{guid}}"><div>Wordcloud Here</div></asset>',
		},
		{
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
		}
	];

	this.addAssetType = function(obj) {
		dataAssetTypes.push(obj);
		return obj;
	}

	this.validateWidgetContext = function(ctx) {
		if(angular.isUndefined(ctx)) {
			return false;
		}

		if(!angular.isString(ctx.guid)) {
			return false;
		}

		if(!angular.isString(ctx.name)) {
			return false;
		}

		if(!~dataAssetTypes.map(function(d) { return d.id; }).indexOf(ctx.type)) {
			return false;
		}

		return true;
	}

	this.isValidContext = function(ctx) {
		var f = dataAssetTypes.filter(function(assetDefinition) {
			return assetDefinition.id === ctx.type;
		});
		if(f.length === 1) {
			if(angular.isFunction(f[0].validator)) {
				return f[0].validator(ctx);
			}
			else {
				return false;
			}
		}
		else {
			throw new TypeError('no-definition');
		}
	}

	this.list = function() {
		return dataAssetTypes;
	}
}]);
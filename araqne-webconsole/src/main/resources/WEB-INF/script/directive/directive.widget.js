angular.module('app.directive.widget', [])
.directive('ngModelOnBlur', function() {
	return {
		restrict: 'A',
		require: 'ngModel',
		scope: {
			'onChange': '&ngChange',
			'onCancel': '&ngCancel',
			'ngModelOnBlur': '&',
			'val': '=ngModel'
		},
		link: function(scope, element, attrs, ngModelCtrl) {
			if (attrs.type === 'radio' || attrs.type === 'checkbox') return;
			var cancel = false;

			element.unbind('input').unbind('keydown').unbind('change');
			element.bind('blur', function() {
				if(!cancel) {
					ngModelCtrl.$setViewValue(element.val());
					scope.onChange({

					});
				}

				scope.ngModelOnBlur({

				});

				setTimeout(function() {
					scope.$apply();
					cancel = false;
				}, 100);
			}).bind('keydown', function(e) {
				if(e.keyCode == 13) {
					this.blur();
				}
				else if(e.keyCode == 27) {
					cancel = true;
					element.val(scope.val)

					scope.onCancel({

					});
					this.blur();
				}
			});
		}
	}
})
.directive('clickToEdit', function() {
	return {
		restrict: 'A',
		scope: {
			'val': '=ngModel',
			'onCancel': '&ngCancel',
			'onChange': '&ngChange',
			'type': '='
		},
		template: '<input type="text" ng-model="val" style="display:none" ng-model-on-blur="onBlur()" ng-change="onChange()" ng-cancel="onCancel()"></input><a ng-click="toggle()">{{val}}</a>',
		link: function(scope, element, attrs) {
			var elInput = element.find('input');
			var elA = element.find('a');

			if(attrs.type == 'number') {
				elInput.attr('type', 'number')
			}

			scope.onBlur = function() {
				scope.toggle();
			}

			scope.toggle = function() {
				elInput.toggle();
				elA.toggle();
				if(elA.is(':hidden')) {
					elInput.focus();
				}
			}
		}
	}
})
.directive('widget', function($compile, $timeout, $parse, $translate, serviceLogdb, serviceChart) {
	return {
		restrict: 'E',
		scope: {
			'onRemove': '&',
			'ngPid': '='
		},
		template: 
			'<span click-to-edit ng-model="name" ng-change="onChange()" ng-cancel="onCancel()" class="pull-left" style="margin-top: -26px; margin-left: 4px"></span>\
			<span class="pull-right" style="margin-top: -22px">\
				<button class="btn btn-mini b-pause" ng-hide="isPaused" ng-click="isPaused = true">\
					<i class="icon-pause"></i>\
				</button>\
				<button class="btn btn-mini b-play" ng-show="isPaused" ng-click="isPaused = false">\
					<i class="icon-play"></i>\
				</button>\
				<button class="btn btn-mini b-refresh" ng-click="refresh();">\
					<i class="icon-refresh"></i>\
				</button>\
				<button class="btn btn-mini b-p" ng-click="isShowProperty = !isShowProperty">\
					<i class="icon-info-sign"></i>\
				</button>\
				<button class="btn btn-mini b-x" ng-click="removeWidget()">\
					<i class="icon-remove"></i>\
				</button>\
			</span>\
			<div class="progress" style="height: 2px; margin-bottom: 0">\
				<div class="bar" ng-hide="isLoaded" ng-style="progress"></div>\
			</div>\
			<div class="content" ng-hide="isShowError" style="height: calc(100% - 2px); overflow: auto"></div>',
			
			// 	<span ng-show="isPaused" style="font-size:.8em; color: silver; float: left">일시 정지됨</span>\
			// 	<span class="clearfix" style="font-size:.8em; color: silver; float: right">{{lastUpdate}}</span>\
			// 	<br>\


		// 	<div class="property" ng-show="isShowProperty" ng-click="isShowProperty = !isShowProperty">\
		// 			<div class="property-inner" ng-click="stopPropagation($event)">\
		// 				<code>{{query}}</code><br/>\
		// 				{{"$S_msg_QueryRunCount" | translate:paramQueryRunCount()}}<br/>\
		// 				<span click-to-edit type="number" ng-model="interval" ng-change="onChange()" ng-cancel="onCancel()"></span>\
		// 				{{"$S_msg_QueryRunInterval" | translate}}\
		// 			</div>\
		// 		</div>\
		// 		<div class="alert alert-error" ng-show="isShowError">{{errorMessage}}</div>\
		// 	</figure>\
		// </div>'
		link: function(scope, el, attrs) {
			var timer;
			scope.isShowProperty = false;
			scope.isShowError = false;
			scope.isPaused = false;
			scope.errorMessage = $translate('$S_msg_UnknownError');
			scope.guid;

			// el.draggable({
			// 	'handle': 'h4',
			// 	'revert': 'invalid',
			// 	'revertDuration': 100
			// });

			scope.onCancel = function() {
				console.log('onCancel');
			}

			scope.onChange = function() {
				console.log('onChange')
			}

			var init = true;
			scope.$watch('isPaused', function(val) {
				if(!val) {
					if(!init) {
						$timeout(run, 250);
					}
					else {
						init = false;
					}
				}
				else {
					console.log(timer);
					$timeout.cancel(timer);
				}
			});

			scope.stopPropagation = function(e) {
				e.stopPropagation();
			}

			scope.removeWidget = function() {
				scope.onRemove();
				el[0].$dispose();
			}

			scope.refresh = function() {
				console.log(timer);
				$timeout.cancel(timer);

				scope.isPaused = false;

				$timeout(run, 250);
			}

			var options;
			scope.dataQueryResult = [];
			scope.count = 0;
			scope.paramQueryRunCount = function() { return {'p0': scope.count} };
			scope.isLoaded = false;

			scope.progress = { 'width': '0%' };

			var elContent = el.find('.content');

			function htmlEscape(str) {
				return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			}

			el[0].setContext = function(ctx, _options) {
				scope.guid = ctx.guid;
				scope.name = htmlEscape(ctx.name);
				scope.type = ctx.type;
				scope.query = ctx.data.query;
				scope.interval = ctx.interval;
				scope.paramQueryRunInterval = function() { return {'p0': scope.interval} };
				
				options = $.extend({
					pageLoaded: null,
					loaded: null,
					failed: null,
				}, _options);

				initFn[ctx.type](ctx);
				scope.$apply();
			}

			var initFn = {
				'grid': function(ctx) {
					scope.order = ctx.data.order;
					run();

					var table = angular.element('<table class="table table-bordered table-condensed">\
						<thead>\
							<tr><th ng-repeat="field in order" title="{{field}}">{{field}}</th></tr>\
						</thead>\
						<tbody>\
							<tr ng-repeat="row in dataQueryResult">\
								<td ng-repeat="field in order" title="{{row[field]}}">\
									{{row[field]}}\
								</td>\
							</tr>\
						</tbody>\
					</table>');

					$compile(table)(scope);
					elContent.append(table);
					console.log('table init')
					elContent.css('opacity', '0');
					setTimeout(function() {
						$(table).fixheadertable({
							// minWidth: scope.order.length * 210,
							// width: 400,
							// height: 267
						});
						elContent.css('opacity','');
					}, 300);
					

				},
				'chart': function(ctx) {

					run();
					var svg = angular.element('<div class="widget">');

					var dataLabel = {name: ctx.data.label, type: ctx.data.labelType};

					function render() {
						var json = serviceChart.buildJSONStructure(angular.copy(ctx.data.series), scope.dataQueryResult, dataLabel);
						if(ctx.data.type == 'line') {
							serviceChart.lineChart(svg[0], json);
						}
						else if(ctx.data.type == 'bar') {
							serviceChart.multiBarHorizontalChart(svg[0], json);
						}
						else if(ctx.data.type == 'pie') {
							serviceChart.pie(svg[0], json);
						}
					}

					options.pageLoaded = function() {
						render();
					}
					options.loaded = function() {
						render();
					}

					elContent.append(svg);

					
				}
			}

			var elProgressBar = el.find('.progress .bar');
			var timeFormat = d3.time.format('%Y-%m-%d %H:%M:%S.%L');

			function run() {
				scope.isLoaded = false;
				// elProgressBar.removeClass('ani');
				scope.progress = { 'width': '0%' };
				//scope.$apply();

				var queryInst = serviceLogdb.create(scope.ngPid);

				function getResult(m) {
					var result = m.body.result;
					scope.dataQueryResult.splice(0, scope.dataQueryResult.length); // array 비워주기
		
					for (var i = 0; i < result.length; i++) {
						scope.dataQueryResult.push(result[i]);
					};
					
					scope.$apply();

					if(!!options.pageLoaded) {
						options.pageLoaded(m);
					}

					console.logdb('loaded', queryInst.getId(), scope.guid, scope.query);
					serviceLogdb.remove(queryInst);

					scope.progress = { 'width': '100%' };
					var time = timeFormat(new Date());
					$timeout(function() {
						scope.isLoaded = true;
						scope.lastUpdate = time;
						scope.count++;
					}, 600);

					if(!scope.isPaused) {
						timer = $timeout(run, scope.interval * 1000);// 3000);
					}
				}
		
				queryInst.query(scope.query, 200)
				.created(function(m) {
					//console.log('created')
					// elProgressBar.addClass('ani');
					scope.progress = { 'width': '20%' };
					scope.$apply();
				})
				.pageLoaded(getResult)
				.getResult(getResult)
				.loaded(function(m) {
					if(!!options.loaded) {
						options.loaded(m);
					}
				})
				.failed(function(m, raw) {
					console.log('failed');
					serviceLogdb.remove(queryInst);

					scope.errorMessage = $translate('$S_msg_OccurError') + raw[0].errorCode;
					scope.isShowError = true;

					scope.$apply();

					if(!!options.failed) {
						options.failed(m);
					}
				});

				el[0].$dispose = function() {
					console.log('$dispose', queryInst.getId(), scope.guid, scope.query);
					$timeout.cancel(timer);
					scope.isPaused = true;
					serviceLogdb.remove(queryInst);
					el.remove();
				}
			}
		}
	}
})

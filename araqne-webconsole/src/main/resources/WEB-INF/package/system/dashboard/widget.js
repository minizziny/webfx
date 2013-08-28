angular.module('Widget', [])
.directive('widget', function($compile, $timeout, $parse, serviceLogdb, serviceChart) {
	return {
		restrict: 'E',
		scope: {
			'onRemove': '&'
		},
		template: '<div class="widget">\
			<figure class="front">\
				<h4 style="font-size:1em; margin: 0px 0px 5px;">{{name}}\
					<span class="pull-right">\
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
				</h4>\
				<div class="progress">\
					<div class="bar" ng-hide="isLoaded" ng-style="progress"></div>\
				</div>\
				<span ng-show="isPaused" style="font-size:.8em; color: silver; float: left">일시 정지됨</span>\
				<span class="clearfix" style="font-size:.8em; color: silver; float: right">{{lastUpdate}}</span>\
				<div class="content" style="max-width: 1024px" ng-hide="isShowError">\
				</div>\
				<div class="property" ng-show="isShowProperty" ng-click="isShowProperty = !isShowProperty">\
					<div class="property-inner" ng-click="stopPropagation($event)">\
						<code>{{query}}</code><br/>\
						쿼리 <b>{{count}}</b>번 실행함<br/>\
						{{interval}}초마다 갱신\
					</div>\
				</div>\
				<div class="alert alert-error" ng-show="isShowError">{{errorMessage}}</div>\
			</figure>\
		</div>',
		link: function(scope, el, attrs) {
			var timer;
			scope.isShowProperty = false;
			scope.isShowError = false;
			scope.isPaused = false;
			scope.errorMessage = '알 수 없는 에러';
			scope.guid;

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
							<tr><td ng-repeat="field in order">{{field}}</td></tr>\
						</thead>\
						<tbody>\
							<tr ng-repeat="row in dataQueryResult">\
								<td ng-repeat="field in order">\
									{{row[field]}}\
								</td>\
							</tr>\
						</tbody>\
					</table>');

					$compile(table)(scope);

					elContent.append(table);

				},
				'chart': function(ctx) {

					run();
					var svg = angular.element('<svg class="widget">');

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
				elProgressBar.removeClass('ani');
				scope.progress = { 'width': '0%' };
				scope.$apply();

				var queryInst = serviceLogdb.create(proc.pid);
		
				queryInst.query(scope.query, 200)
				.created(function(m) {
					console.log('created')
					elProgressBar.addClass('ani');
					scope.progress = { 'width': '20%' };
					scope.$apply();
				})
				.pageLoaded(function(m) {

					console.log('pageLoaded')

					var result = m.body.result;
					scope.dataQueryResult.splice(0, scope.dataQueryResult.length); // array 비워주기
		
					for (var i = 0; i < result.length; i++) {
						scope.dataQueryResult.push(result[i]);
					};
					
					scope.$apply();

					if(!!options.pageLoaded) {
						options.pageLoaded(m);
					}
				})
				.loaded(function(m) {
					console.log('loaded')
					serviceLogdb.remove(queryInst);

					if(!!options.loaded) {
						options.loaded(m);
					}

					scope.progress = { 'width': '100%' };
					var time = timeFormat(new Date());
					$timeout(function() {
						scope.isLoaded = true;
						scope.lastUpdate = time;
						scope.count++;
					}, 600);

					if(!scope.isPaused) {
						timer = $timeout(run, scope.interval * 300);// 3000);
					}
				})
				.failed(function(m, raw) {
					console.log('failed');
					serviceLogdb.remove(queryInst);

					scope.errorMessage = '에러가 발생했습니다. ' + raw[0].errorCode;
					scope.isShowError = true;

					scope.$apply();

					if(!!options.failed) {
						options.failed(m);
					}
				});

				el[0].$dispose = function() {
					serviceLogdb.remove(queryInst);
					el.remove();
				}
			}
		}
	}
})

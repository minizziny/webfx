angular.module('app.directive.logdb', [])
.directive('queryInput', function($compile, $parse, $translate, serviceLogdb) {
	return {
		restrict: 'E',
		scope: {
			onLoading: '&',
			onPageLoaded: '&',
			onLoaded: '&',
			onStatusChange: '&',
			onTimeline: '&',
			ngTemplate: '=ngTemplate',
			ngPageSize: '=',
			ngChange: '&',
			ngQueryString: '='
		},
		template: '<textarea ng-model="ngQueryString" ng-change="ngChange()" placeholder="{{ \'$S_msg_QueryHere\' | translate }}" autosize></textarea>\
			<button class="search btn btn-primary">{{ "$S_str_Search" | translate}}</button>\
			<button class="stop btn btn-warning">{{ "$S_str_Stop" | translate}}</button>',
		link: function(scope, element, attrs) {
			var autoflush = attrs.isAutoFlush;

			$scope = scope;
			scope = scope.$parent;

			var textarea = element.find('textarea');

			var pid = proc.pid;
			
			textarea.on('keydown', function(e) {
				if (e.type === 'keydown' && e.keyCode === 13) {
					e.preventDefault();
					search();
				}
			});
			
			element.find('.search').on('click', function() {
				search();
			});

			element.find('.stop').on('click', stop);

			function createdFn(m) {
				element.removeClass('loaded').addClass('loading');
			}

			function startedFn(m) {
				evalEvent(attrs.onLoading, m);
			}

			function pageLoadedFn(m) {
				scope[attrs.ngModel] = m.body.result;
				scope.$apply();

				if(autoflush != 'false') {
					serviceLogdb.remove(z);	
					element.removeClass('loading').addClass('loaded');
				}

				evalEvent(attrs.onPageLoaded, m);
			}

			function loadedFn(m) {
				element.removeClass('loading').addClass('loaded');
				evalEvent(attrs.onLoaded, m);
			}

			function onTimelineFn(m) {
				evalEvent(attrs.onTimeline, m);
			}

			function onStatusChangeFn(m) {
				evalEvent(attrs.onStatusChange, m);
			}

			function failedFn(m) {
				alert($translate('$S_msg_WrongQuery'));
				scope.$apply();
			}

			var z;
			function search() {
				var limit = scope.$eval(attrs.ngPageSize);
				textarea.blur();
				if(z != undefined) {
					serviceLogdb.remove(z);
				}
				z = serviceLogdb.create(pid);
				
				var queryValue = textarea.data('$ngModelController').$modelValue;

				z.query(queryValue, limit)
				.created(createdFn)
				.started(startedFn)
				.pageLoaded(pageLoadedFn)
				.getResult(pageLoadedFn)
				.loaded(loadedFn)
				.onTimeline(onTimelineFn)
				.onStatusChange(onStatusChangeFn)
				.failed(failedFn)
			}

			function stop() {
				element.removeClass('loading').addClass('loaded');
				if(autoflush != 'false') {
					serviceLogdb.remove(z);	
				}

				z.stop()
				.success(function() {
					console.log('stopped')
				})

				evalEvent(attrs.onLoaded, null);
			}

			function evalEvent(expr, arg1) {
				if(!angular.isString(expr)) return;
				expr = expr.replace('()', '');
				scope[expr].call(scope, arg1);
			}

			element[0].offset = function(offset, limit) {
				if(z == undefined) return;
				z.getResult(offset, limit);
			}

			element[0].run = function() {
				search();
			}

			element[0].getInstance = function() {
				return z;
			}

			element[0].bindBackgroundQuery = function(id, str, status) {
				z = serviceLogdb.createFromBg(pid, id, str, status);
				z.registerTrap(function() {
					console.log('registerTrap')
				})
				.created(createdFn)
				.started(startedFn)
				.pageLoaded(pageLoadedFn)
				.getResult(pageLoadedFn)
				.loaded(loadedFn)
				.onTimeline(onTimelineFn)
				.onStatusChange(onStatusChangeFn)
				.failed(failedFn);

				if(status == 'Running') {
					element.removeClass('loaded').addClass('loading');	
				}
			}

		}
	}
})
.directive('afterIterate', function() {
	return {
		link: function(scope, element, attrs) {
			if(scope.$last) {
				var fn = scope.$parent[attrs.afterIterate];
				if(!!fn) {
					fn.call(scope, scope);
				}
			}
		}
	}
})
.directive('queryResult', function($compile, serviceUtility) {
	return {
		restrict: 'E',
		scope: {
			ngPage: '=',
			ngPageSize: '=',
			stopPropation: '@',
			ngCols: '@',
			ngModel: '=',
			isCheckType: '@',
			isSelectable: '@',
			ngQuery: '='			
		},
		template: '<div style="display: inline-block; position: relative">'+
		'<button ng-click="next()" class="btn" style="position: absolute; width: 160px; margin-right: -160px; top: 0; bottom: -5px; right: 0" ng-hide="numTotalColumn - numLimitColumn < 1">\
			<span ng-show="numTotalColumn - numLimitColumn > numLimitColumnInterval">\
				{{"$S_msg_MoreColumn" | translate:paramMoreColumn1()}}\
			</span>\
			<span ng-hide="numTotalColumn - numLimitColumn > numLimitColumnInterval">\
				{{"$S_msg_MoreColumn" | translate:paramMoreColumn2()}}\
			</span>\
		</button>\
		<table ng-class="{ selectable: isSelectable, expandable: (numTotalColumn - numLimitColumn > 0) }" class="cmpqr table table-bordered table-striped table-condensed">\
			<thead>\
				<tr>\
					<th>#</th>\
					<th ng-class="{ selected: col.is_checked }"\
						ng-hide="!col.is_visible"\
						ng-repeat="col in ngCols | limitTo: numLimitColumn"\
						ng-click="toggleCheck(col)">\
						<input id="{{col.guid}}" type="checkbox" style="margin-right: 5px"\
							ng-show="isSelectable"\
							ng-click="stopPropation($event)"\
							ng-model="col.is_checked">\
						<span class="qr-th-type" ng-show="col.type == \'number\'">1</span>\
						<span class="qr-th-type" ng-show="col.type == \'string\'">A</span>\
						<span class="qr-th-type" ng-show="col.type == \'datetime\'"><i class="icon-white icon-time"></i></span>\
						{{col.name}}\
					</th>\
				</tr>\
			</thead>\
			<tbody>\
				<tr ng-repeat="d in ngModel">\
					<td>{{ngPage * ngPageSize + ($index+1)}}</td>\
					<td ng-class="{ selected: col.is_checked }"\
						ng-hide="!col.is_visible"\
						ng-repeat="col in ngCols | limitTo: numLimitColumn"\
						ng-click="toggleCheck(col)"\
						ng-bind-html-unsafe="d[col.name] | crlf"></td>\
				</tr>\
			</tbody>\
		</table>\
		</div>',
		link: function(scope, element, attrs) {
			
			scope.stopPropation = function(event) {
				event.stopPropagation();
			}

			// 타입 체크 및 컬럼 정보에 타입 명시
			function checkArrayMemberType(array) {
				var types = ['number', 'datetime', 'string'];
				if(array.some(angular.isNumber)) return types[0];
				if(array.some(checkDate)) return types[1];

				return types[2];
			}

			if(attrs.ngCustomTemplate != undefined) {
				element.empty();
				var customEl = angular.element(scope[attrs.ngCustomTemplate]);
				element.append(customEl);

				$compile(customEl)(scope);
			}

			scope.toggleCheck = function(col) {
				col.is_checked = !col.is_checked;
			};

			scope.next = function() {
				scope.numLimitColumn = scope.numLimitColumn + scope.numLimitColumnInterval;
				console.log(scope.numLimitColumn)
			}

			scope.numLimitColumnInterval = 50;
			scope.numLimitColumn = 50;
			scope.numTotalColumn;
			scope.paramMoreColumn1 = function() {
				return {'p0': scope.numLimitColumnInterval}
			}
			scope.paramMoreColumn2 = function() {
				return {'p0': scope.numTotalColumn - scope.numLimitColumn}
			}

			function newSearch() {
				scope.numLimitColumnInterval = 50;
				scope.numLimitColumn = 50;
				scope.numTotalColumn = 0;
				scope.$apply();
			}

			scope.ngCols = []; // ngModel의 컬럼 정보
			scope.$watch('ngModel', function(val) {
				if(!angular.isArray(val)) { return; } // 데이터가 배열이 아니면 리턴
				if(scope.isCheckType == undefined) scope.isCheckType = false;

				// 컬럼 순서 추출
				var fieldsLine = scope.ngQuery.split("|");
				var fields = [];
				fieldsLine.forEach(function(obj) {
					if(obj.match(/fields/)) {
						//obj.trim();
						var replace = obj.replace("fields ", "");						
						var tmp = replace.split(",");
						tmp.forEach(function(f) {
							f = f.replace(" ", "");
							fields.push(f);					
						});
					}
				});

				// 컬럼 추출
				var cols = [];
				for (var i = 0; i < val.length; i++) {
					if(i == 0) {
						cols = Object.keys(val[i]);
					}
					else {
						var keys = Object.keys(val[i]);
						keys.forEach(function(k) {
							if( cols.indexOf(k) == -1 ) {
								cols.push(k);
							}
						});
					}
				}
				
				if(fields.length <= 0 || fields == null) {
					cols.sort(function(a, b) {
						if(a.indexOf('_') == 0) { return -1; }
						else { 
							if(a > b) {
								return 1;
							}
							if(b > a) {
								return -1;
							}
						}
						return 0;
					}).forEach(function(k, i) {
						if(k == '$$hashKey') {
							cols.splice(cols.indexOf(k), 1);
						}
					});
				} else {
					cols.forEach(function(a) {
						if(a == "$$hashKey") {
							fields.push("$$hashKey");
						}
					});

					// 정렬된 배열로 치환
					cols = fields;
					cols.forEach(function(k, i) {
						if(k == '$$hashKey') {
							cols.splice(cols.indexOf(k), 1);
						}
					});
				}
				
				//console.log(cols.length)
				if(cols.length > scope.numLimitColumn) {
					scope.numTotalColumn = cols.length;
				}
				
				scope.ngCols = cols.map(function(k) {
					return {
						guid: serviceUtility.generateType2(),
						name: k,
						is_visible: true,
						is_checked: undefined
					}
				});

				if(scope.isCheckType.toString() == 'true') {
					for (var i = 0; i < scope.ngCols.length; i++) {
						if(scope.ngCols[i].type == undefined) {
							var mapAll = val.map(function(obj, j) {
								return obj[scope.ngCols[i].name];
							});
							var type = checkArrayMemberType(mapAll);
							scope.ngCols[i]['type'] = type;
						}
					}
				}
			});

			element[0].addColumn = function(name, type) {
				obj = {
					guid: serviceUtility.generateType2(),
					name: name,
					is_visible: true,
					is_checked: true,
					type: type
				};
				scope.ngCols.push(obj);
				return obj;
			}

			element[0].getSelectedItems = function() {
				return scope.ngCols.filter(function(obj) {
					return obj.is_checked;
				});
			}

			element[0].getColumns = function() {
				return scope.ngCols;
			}

			// 로딩 인디케이터
			var loadingInd = angular.element('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>')
			element.prepend(loadingInd.hide());

			element[0].showLoadingIndicator = function() {
				element.find('table').hide();
				loadingInd.show();
			}

			element[0].showTable = function() {
				element.find('table').show();
			}

			element[0].hideTable = function() {
				element.find('table').hide();
			}

			element[0].hideLoadingIndicator = function() {
				loadingInd.fadeOut();
			}

			element[0].newSearch = newSearch;
		}
	}
});
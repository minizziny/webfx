angular.module('App.Directive.Logdb', ['App.Service.Logdb', 'App.Service'])
.directive('queryInput', function($compile, $parse, serviceLogdb) {
	return {
		restrict: 'E',
		scope: {
			onLoading: '&',
			onPageLoaded: '&',
			onLoaded: '&',
			ngTemplate: '=template',
			ngPageSize: '='
		},
		template: '<textarea autosize></textarea> <button class="search btn btn-primary">검색</button> <button class="stop btn btn-warning">중지</button>',
		link: function(scope, element, attrs) {
			var autoflush = attrs.isAutoFlush;

			

			$scope = scope;
			console.log(scope, attrs.onPageLoaded)
			scope = scope.$parent;

			if(attrs.hasOwnProperty('template')) {
				element.empty();
				var customEl = angular.element($scope.template);
				element.append(customEl);
			}

			element.addClass('loaded');
			var textarea = element.find('textarea');
			textarea.attr('ng-model', attrs.ngQueryString);
			$compile(textarea)(scope);

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
				.created(function(m) {
					element.removeClass('loaded').addClass('loading');

					evalEvent(attrs.onLoading, m);
				})
				.pageLoaded(function(m) {
					scope[attrs.ngModel] = m.body.result;
					scope._page = 1;
					scope.$apply();

					evalEvent(attrs.onPageLoaded, m);
				})
				.loaded(function(m) {
					element.removeClass('loading').addClass('loaded');

					if(autoflush != 'false') {
						serviceLogdb.remove(z);	
					}
					
					evalEvent(attrs.onLoaded, m);
				})
				.failed(function(m) {
					alert('쿼리를 시작할 수 없습니다. 잘못된 쿼리입니다.')
				})
			}

			function stop() {
				alert('쿼리를 중지합니다.')
				element.removeClass('loading').addClass('loaded');
				if(autoflush != 'false') {
					serviceLogdb.remove(z);	
				}

				evalEvent(attrs.onLoaded, m);
			}

			function evalEvent(expr, arg1) {
				if(!angular.isString(expr)) return;
				expr = expr.replace('()', '');
				scope[expr].call(scope, arg1);
			}

			element[0].offset = function(offset, limit) {
				z.getResult(offset, limit);
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
.directive('queryResult', function($compile, serviceGuid) {
	return {
		restrict: 'E',
		scope: {
			ngPage: '=',
			ngPageSize: '=',
			stopPropation: '@',
			ngCols: '@',
			ngModel: '=',
			isCheckType: '@',
			isSelectable: '@'
		},
		template: '<table ng-class="{ selectable: isSelectable }" class="cmpqr table table-striped table-condensed">' +
			'<thead>\
				<tr>\
					<th>#</th>\
					<th ng-class="{ selected: col.is_checked }"\
						ng-hide="!col.is_visible"\
						ng-repeat="col in ngCols"\
						ng-click="toggleCheck(col)"\
						after-iterate="columnChanged">\
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
				<tr ng-repeat="(i,d) in ngModel">\
					<td>{{ngPage * ngPageSize + (i+1)}}</td>\
					<td ng-class="{ selected: col.is_checked }"\
						ng-hide="!col.is_visible"\
						ng-repeat="col in ngCols"\
						ng-click="toggleCheck(col)"\
						ng-bind-html-unsafe="d[col.name] | crlf"></td>\
				</tr>\
			</tbody></table>',
		link: function(scope, element, attrs) {
			scope.stopPropation = function(event) {
				event.stopPropagation();
			}

			// 타입 체크 및 컬럼 정보에 타입 명시
			function checkArrayMemberType(array) {
				var types = ['number', 'datetime', 'string'];
				if(array.some(myApp.isNumber)) return types[0];
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

			scope.ngCols = []; // ngModel의 컬럼 정보
			scope.$watch('ngModel', function(val) {
				if(!angular.isArray(val)) { return; } // 데이터가 배열이 아니면 리턴
				if(scope.isCheckType == undefined) scope.isCheckType = false;

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
				
				cols.sort(function(a, b) {
					if(a.indexOf('_') == 0) { return -1; }
					else { return 1; }
					return 0;
				}).forEach(function(k, i) {
					if(k == '$$hashKey') {
						cols.splice(cols.indexOf(k), 1);
					}
				});
				
				scope.ngCols = cols.map(function(k) {
					return {
						guid: serviceGuid.generateType2(),
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
					guid: serviceGuid.generateType2(),
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
		}
	}
});
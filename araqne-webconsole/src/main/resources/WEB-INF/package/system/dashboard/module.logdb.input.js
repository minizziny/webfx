angular.module('logdb.input', ['logdb', 'util'])
.directive('queryInput', function($compile, serviceLogdb) {
	return {
		restrict: 'E',
		template: '<textarea autosize></textarea> <button class="search btn btn-primary">검색</button> <button class="stop btn btn-warning">중지</button>',
		link: function(scope, element, attrs) {
			element.addClass('loaded');
			var textarea = element.find('textarea');
			textarea.attr('ng-model', attrs.queryModel);
			$compile(textarea)(scope);

			var pid = proc.pid;
			
			textarea.on('keydown', function(e) {
				if (e.type === 'keydown' && e.keyCode === 13) {
					e.preventDefault();
					search();
				}
			});
			
			element.find('.search').on('click', search);

			element.find('.stop').on('click', stop);

			var z;
			function search() {
				textarea.blur();
				if(z != undefined) {
					serviceLogdb.remove(z);
				}
				z = serviceLogdb.create(pid);
				
				var queryValue = textarea.data('$ngModelController').$modelValue;

				z.query(queryValue)
				.created(function(m) {
					element.removeClass('loaded').addClass('loading');

					if(scope[attrs.queryOnloading] != undefined) {
						scope[attrs.queryOnloading].call(this);
					}
				})
				.pageLoaded(function(m) {
					scope[attrs.ngModel] = m.body.result;
					scope.$apply();

					if(scope[attrs.queryOnpageloaded] != undefined) {
						scope[attrs.queryOnpageloaded].call(this);	
					}
				})
				.loaded(function(m) {
					element.removeClass('loading').addClass('loaded');
					serviceLogdb.remove(z);

					if(scope[attrs.queryOnloaded] != undefined) {
						scope[attrs.queryOnloaded].call(this);	
					}
				})
				.failed(function(m) {
					alert('쿼리를 시작할 수 없습니다. 잘못된 쿼리입니다.')
				})
			}

			function stop() {
				alert('쿼리를 중지합니다.')
				element.removeClass('loading').addClass('loaded');
				serviceLogdb.remove(z);

				if(scope[attrs.queryOnloaded] != undefined) {
					scope[attrs.queryOnloaded].call(this);	
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
.directive('queryResult', function($compile, serviceGuid) {
	return {
		restrict: 'E',
		template: '<table ng-class="{ selectable: isSelectable }" class="cmpqr table table-striped table-condensed">' +
			'<thead><tr><th ng-class="{ selected: col.is_checked }" ng-hide="!col.is_visible" ng-repeat="col in qrCols" after-iterate="columnChanged" ng-click="toggleCheck(col)">' +
			'<input id="{{col.guid}}" ng-show="isSelectable" type="checkbox" ng-click="_stopPropation($event)" ng-model="col.is_checked" style="margin-right: 5px">' +
			'<span class="qr-th-type" ng-show="col.type == \'number\'">1</span><span class="qr-th-type" ng-show="col.type == \'string\'">A</span><span class="qr-th-type" ng-show="col.type == \'datetime\'"><i class="icon-white icon-time"></i></span>' + 
			' {{col.name}} </th></tr></thead>' + 
			'<tbody><tr ng-repeat="d in qrData"><td ng-class="{ selected: col.is_checked }" ng-hide="!col.is_visible" ng-repeat="col in qrCols" ng-click="toggleCheck(col)">{{d[col.name]}}</td></tr></tbody></table>',
		link: function(scope, element, attrs) {
			scope._stopPropation = function(event) {
				event.stopPropagation();
			}

			if(attrs.qrCustomTemplate != undefined) {
				element.empty();
				var customEl = angular.element(scope[attrs.qrCustomTemplate]);
				element.append(customEl);

				$compile(customEl)(scope);
			}

			// qrCols는 컬럼만
			// qrData는 데이타 전부 
			// 둘 다 queryResult의 ng-model이 바뀔때마다 업데이트 된다.

			scope.qrCols = [];
			scope.qrCols.getSelectedItems = function() {
				return this.filter(function(obj) {
					return obj.is_checked;
				});
			};

			scope.qrData = [];
			scope.isSelectable = false;

			scope.toggleCheck = function() {};

			scope.$watch(attrs.ngModel, function() {
				// ng-model이 업데이트될 때 불림
				var raw = scope[attrs.ngModel];
				if(!angular.isArray(raw)) { return; } // 데이터가 배열이 아니면 리턴

				// 클리어
				scope.qrCols.splice(0, scope.qrCols.length);
				scope.qrData.splice(0, scope.qrData.length);

				var cols = []; // 컬럼 이름만 임시 저장
				for (var i = 0; i < raw.length; i++) {
					for (var col in raw[i]) {
						if(cols.indexOf(col) == -1 && col != '$$hashKey') {
							cols.push(col);
						}
					}
					scope.qrData.push(raw[i]);
				};

				cols.sort(function(a,b) {
					if(a.indexOf('_') == 0) { return -1; }
					else { return 1; }
					return 0;
				});

				for (var i = 0; i < cols.length; i++) {
					scope.qrCols.push({
						'guid': serviceGuid.generateType2(),
						'name': cols[i],
						'is_visible': true,
						'is_checked': undefined
					});
				}

				// 타입 체크 및 컬럼 정보에 타입 명시
				function checkArrayMemberType(array) {
					var types = ['number', 'datetime', 'string'];
					if(array.every(myApp.isNumber)) return types[0];
					if(array.every(checkDate)) return types[1];

					return types[2];
				}

				if(attrs.qrCheckType === 'true') {
					for (var i = 0; i < scope.qrCols.length; i++) {
						if(scope.qrCols[i].type == undefined) {
							var mapAll = scope.qrData.map(function(obj, j) {
								return obj[scope.qrCols[i].name];
							});
							var type = checkArrayMemberType(mapAll);
							scope.qrCols[i]['type'] = type;
						}
					}
				}

				if(attrs.qrSelectable === 'true') {
					scope.isSelectable = true;
					scope.toggleCheck = function(col) {
						col.is_checked = !col.is_checked;
					};
				}

			});

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
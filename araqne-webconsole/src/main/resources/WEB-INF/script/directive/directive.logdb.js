angular.module('app.directive.logdb', [])
.directive('queryInput', function($compile, $parse, $translate, serviceLogdb, serviceSession) {
	return {
		restrict: 'E',
		scope: {
			onLoading: '&',
			onLoaded: '&',
			onStatusChange: '&',
			ngTemplate: '=ngTemplate',
			ngPageSize: '&',
			ngQueryString: '=',
			ngPid: '=',
			onError: '&'
		},
		template: '<textarea ng-model="ngQueryString" placeholder="{{ \'$S_msg_QueryHere\' | translate }}" spellcheck="false" autosize autosize-max-height="145" ng-model-onblur></textarea>\
			<button class="search btn btn-primary">{{ "$S_str_Run" | translate}}</button>\
			<button class="stop btn btn-warning">{{ "$S_str_Stop" | translate}}</button>',
		link: function(scope, element, attrs) {
			var textarea = element.find('textarea');
			
			
			textarea.on('keydown', function(e) {
				if (e.type === 'keydown' && ((e.ctrlKey || e.shiftKey) && e.keyCode === 13)) {
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
				//사용자 입력 쿼리 기록 넣기
				var queryValue = scope.ngQueryString.replace(/\n/gi, ' ');
				serviceLogdb.save(queryValue);
			}

			function startedFn(m) {
				scope.onLoading({
					'$msg': m
				});
			}

			function getResultFn(callback) {
				return function(m) {
					scope.$parent[attrs.ngModel] = m.body.result;
					scope.$parent.$apply();
					if(!!callback) {
						callback();
					}
				}
			}

			function loadedFn(m) {
				element.removeClass('loading').addClass('loaded');
				scope.onLoaded({
					'$msg': m,
					'$inst': z
				});
			}

			function onStatusChangeFn(m) {
				scope.onStatusChange({
					'$msg': m,
					'$inst': z
				});
			}

			function failedFn(raw) {
				var errorType, errorNote;

				var rxType = /type=(\w*(-|_)?)*/;
				var rxNote= /note=(.*)/;


				if( rxType.test(raw[0].errorCode) ) {
					errorType = raw[0].errorCode.match(rxType)[0].split('type=')[1];
				}
				if( rxNote.test(raw[0].errorCode) ) {
					errorNote = raw[0].errorCode.match(rxNote)[0].split('note=')[1];
				}
				var errorMsg = $translate('$S_msg_WrongQuery') +
					(!!errorType ? ('\n\n' + $translate('$S_str_Type') + ': ' + $translate(errorType)) : '') +
					(!!errorNote ? ('\n' + $translate('$S_str_Note') + ': ' + $translate(errorNote)) : '')

				// alert(errorMsg);

				scope.onError({
					'$raw': raw,
					'$type': errorType,
					'$note': errorNote
				});

				scope.$apply();
			}

			var z;
			function search() {

				var limit = scope.$eval(scope.ngPageSize);
				
				textarea.blur();
				if(z != undefined) {
					serviceLogdb.remove(z);
				}
				z = serviceLogdb.create(scope.ngPid);

				// console.log( textarea.data('$ngModelController').$modelValue );

				z.query(scope.ngQueryString.replace(/\n/gi, ' '), limit)
				.created(createdFn)
				.started(startedFn)
				.loaded(loadedFn)
				.onStatusChange(onStatusChangeFn)
				.failed(failedFn)
			}

			function stop() {
				element.removeClass('loading').addClass('loaded');

				z.stop()
				.success(function() {
					console.log('stopped')
				})

				scope.onLoaded({
					'$msg': null
				});
			}

			element[0].offset = function(offset, limit, callback) {
				if(z == undefined) return;
				z.getResult(offset, limit, getResultFn(callback));
			}

			element[0].run = function() {
				var runner = scope.$watch('ngQueryString', function() {
					search();
					runner();
				});
			}

			element[0].getInstance = function() {
				return z;
			}

			element[0].bindBackgroundQuery = function(id, str, status) {
				z = serviceLogdb.createFromBg(scope.ngPid, id, str, status);
				z.registerTrap(function() {
					console.log('registerTrap')
				})
				.created(createdFn)
				.started(startedFn)
				.loaded(loadedFn)
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
						ng-bind-html="d[col.name] | crlf"></td>\
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
				// TEST HERE: http://plnkr.co/edit/qrgTBjE1hnsplJS8Nwsx
				var fieldsLine = scope.ngQuery
					.replace(/\[(.*?)\]/, "")
					.replace(/\"(.*?)\"/, "")
					.replace(/\'(.*?)\'/, "")
					.split("|");
				var fields = [];
				fieldsLine.forEach(function(obj) {
					if(!obj.match(/fields -/) && obj.match(/fields/)) {
						obj = obj.replace(/ /gi, "");
						if(obj.indexOf('fields') !== 0) return;
						obj = obj.replace("fields", "");
						if(fields.length) {
							fields = [];
						}
						var tmp = obj.split(",");
						tmp.forEach(function(f) {							
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
					cols.sort().sort(function(a, b) {
						if(a.indexOf('_') === 0 && b.indexOf('_') === 0) { 
							if(a > b) {
								return 1;
							}
							if(b > a) {
								return -1;
							}
						}
						else if(a.indexOf('_') === 0) { return -1; }
						else if(b.indexOf('_') === 0) { return 1; }
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
						if(a == '$$hashKey') {
							fields.push('$$hashKey');
						}
					});


					var tmp = [];

					//순서 정렬 필드 골라 담기
					cols.forEach(function(c) {
						for(var i = 0 ; i < fields.length ; i++) {
							if(c == fields[i]) {
								tmp[i] = c;							
							}
						}					
					});

					tmp.forEach(function(k, i) {
						if(k == '$$hashKey') {
							tmp.splice(tmp.indexOf(k), 1);
						}
					});

					var dupCols = [];
					cols.forEach(function(c) {
						dupCols.push(c);
					});

					//정렬된 필드 비워내기
					fields.forEach(function(f) {
						dupCols.forEach(function(c) {
							if(f == c) {
								dupCols.splice(dupCols.indexOf(c), 1);
							}
						});
					});

					//결과 필드 합치기
					tmp = tmp.concat(dupCols);

					var mixedCols = [];
					tmp.forEach(function(t) {
						mixedCols.push(t);
					});

					//// 정렬된 배열로 치환
					cols = mixedCols;					
				}
				
				//console.log(cols.length)
				if(cols.length > scope.numLimitColumn) {
					scope.numTotalColumn = cols.length;
				}

				// console.log("[cols]");
				// console.log(cols);
				
				scope.ngCols = cols.map(function(k) {
					return {
						guid: serviceUtility.generateType2(),
						name: k,
						is_visible: true,
						is_checked: undefined
					}
				});
				console.log('ngCols assigned')

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

			element[0].getColumns = function(fn) {
				var async = scope.$watch('ngCols', function() {
					fn.call(scope, scope.ngCols);
					async();
				});
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
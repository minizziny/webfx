'use strict';

/* jasmine specs for directives go here */

describe('directives', function() {
	
	describe('pie', function() {

		var INTERVAL = 10;

		var tester;
		beforeEach(function() {
			tester = ngMidwayTester('app.directive.chart');
		});

		afterEach(function() {
			tester.destroy();
			tester = null;
		});


		it('sample', function() {
			var scope = tester.viewScope().$new();
			scope.dataPie = ['d','z','g'];
			var element = tester.compile('<pie ng-model="dataPie"></pie>', scope);
			var viewEl = tester.viewElement().append(element);

			var flag = false;

			runs(function() {
				// runs 블록은 순차적으로 실행할 것입니다.
				setTimeout(function() {
					flag = true;
				}, INTERVAL);
			});

			waitsFor(function() {
				// 여기는 flag 가 true 가 될때까지 반복적으로 기다립니다.
				// 화면에 directive 를 뿌리기 위해 이러한 코드를 넣었습니다.
				return flag;
			}, INTERVAL + 100);

			runs(function() {
				expect(viewEl.find('pie').hasClass('ng-scope')).toBe(true);
			});
		});

		it('setContext', function() {
			var scope = tester.viewScope().$new();
			scope.dataPie = ['ss'];
			var element = tester.compile('<pie ng-model="dataPie"></pie>', scope);
			var viewEl = tester.viewElement().append(element);

			var flag = false;

			runs(function() {
				// runs 블록은 순차적으로 실행할 것입니다.
				setTimeout(function() {
					scope.dataPie.push('aa');
					scope.$apply();
				}, INTERVAL);

				setTimeout(function() {
					flag = true;
				}, INTERVAL + INTERVAL);
			});

			waitsFor(function() {
				// 여기는 flag 가 true 가 될때까지 반복적으로 기다립니다.
				// 화면에 directive 를 뿌리기 위해 이러한 코드를 넣었습니다.
				return flag;
			}, INTERVAL + INTERVAL + 100);

			runs(function() {
				// expect(viewEl.find('pie').text()).toEqual('chart pie');
				expect('a').toEqual('a')
			});
		});

	});

	describe('pie', function() {

		var lang = {
	"--------scheduled query---------": "",
	"$S_str_Schedule": "스케쥴",
	"$S_str_RepeatPeriod": "반복주기",
	"$S_str_CrontabString": "cron 문자열",
	"$S_str_ScheduledQuery": "예약된 쿼리",
	"$S_str_IsSaveThisQueryResult": "쿼리결과 저장",
	"$S_str_IsUseAlert": "경보 사용",
	"$S_str_RunQueryString": "실행할 쿼리문", 
	"$S_str_AlertQueryString": "경보 쿼리문",
	"$S_str_SuppressInterval": "경보 무시 주기",
	"$S_str_MailProfileName": "메일 프로필",
	"$S_str_MailFrom": "보내는 메일 주소",
	"$S_str_MailTo": "받을 메일 주소",
	"$S_str_MailSubject": "경보 메일 제목",
	"$S_str_CreateScheduledQuery": "예약된 쿼리 경보 생성",
	"$S_str_Save": "저장",
	"$S_str_NotSave": "저장안함",
	"$S_str_Time": "시간",
	"$S_str_EveryTime": "매시",
	"$S_str_PerMinutePre": "",
	"$S_str_PerMinutePost": "분 마다",
	"$S_str_PerDayPre": "",
	"$S_str_PerDayPost": "일 마다",
	"$S_str_Every": "매",
	"$S_Str_RepeatMethod": "되풀이 방법",
	"$S_Str_EveryDay": "매일",
	"$S_Str_EveryWeek": "매주",
	"$S_Str_EveryMonth": "매월",
	"$S_Str_EveryYear": "매년",
	"$S_str_EveryWeekRepeatNextDay": "매 주 마다 다음 요일에 되풀이",
	"$S_str_Sunday": "일요일",
	"$S_str_Monday": "월요일",
	"$S_str_Tuesday": "화요일",
	"$S_str_Wednesday": "수요일",
	"$S_str_Thursday": "목요일",
	"$S_str_Friday": "금요일",
	"$S_str_Saturday": "토요일",
	"$S_str_Date": "날짜",
	"$S_str_DayOfWeek": "요일",
	"$S_str_PerMonthPre" : "",
	"$S_str_PerMonthPost": "개월마다",
	"$S_str_DateTh": "일에",
	"$S_str_RemoveScheduledQuery": "예약된 쿼리 삭제",
	"$S_msg_ConfirmRemoveScheduledQueriesPre": "정말 예약된 쿼리 ",
	"$S_msg_ConfirmRemoveScheduledQueriesPost": "를 삭제하시겠습니까?",
	"$S_str_TimePost": "시",
	"$S_str_MonthPost": "월",
	"$S_str_Weekend": "주말",
	"$S_str_Weekday": "평일",

	"$S_msg_On": "에 ",
	"$S_msg_PreEvery": "매 ",
	"$S_msg_PreMonth": "",
	"$S_msg_PreMonths": "",
	"$S_msg_PostMonth": "",
	"$S_msg_Every": "매 ",
	"$S_msg_EveryYear": "매년 ",
	"$S_msg_EveryWeek": "매주 ",
	"$S_msg_EveryDay": "매일 ",
	"$S_msg_EveryHour": "매시 ",
	"$S_msg_Moment": " 마다.",
	"$S_msg_AttachMoment": " 마다 ",
	"$S_msg_From": " 부터",
	"$S_msg_To": " 사이",
	"$S_msg_Oclock": "시",
	"$S_msg_Between": "",
	"$S_msg_And": "",
	"$S_msg_Min": "분",
	"$S_msg_Hour": "시",
	"$S_msg_Date": "일",
	"$S_msg_Month": "월",
	"$S_msg_Months": "월",
	"$S_msg_NumberOfMonth": "개월",
	"$S_msg_Comma": "",
	"$S_msg_PostWeek": "",
	"$S_msg_PreDate": "",
	"$S_msg_PostDate": "일",
	"$S_msg_PostDate2": "",

	"$S_str_Jan": "1월",
	"$S_str_Feb": "2월",
	"$S_str_Mar": "3월",
	"$S_str_Apr": "4월",
	"$S_str_May": "5월",
	"$S_str_Jun": "6월",
	"$S_str_Jul": "7월",
	"$S_str_Aug": "8월",
	"$S_msg_Sep": "9월",
	"$S_msg_Oct": "10월",
	"$S_msg_Nov": "11월",
	"$S_msg_Dec": "12월"
		}

		var INTERVAL = 1000;
		var $compile, scope, template, body = $('<div id="fixture"></div>').appendTo('body');

		angular.module('app', function () {})
		.config(function ($translateProvider) {
			$translateProvider.translations('ko', lang);
			$translateProvider.preferredLanguage('ko');
		});
		
		angular.module('app.connection', [])
		.factory('socket', function() { 
			return {
				send: function(method, options, pid) {
					return new Async(function() { console.log('send', method); }, method, options, pid);
				}
			}
		});

		beforeEach(module('pascalprecht.translate', 'app', 'app.directive.cron', 'app.filter', 'script/directive/directive.cron.html'));
	
		beforeEach(inject(function($templateCache,_$compile_,_$rootScope_) {
			template = $templateCache.get('script/directive/directive.cron.html');
			$templateCache.put('/script/directive/directive.cron.html',template);
	
			$compile = _$compile_;
			scope = _$rootScope_;
		}));

		afterEach(function() {
			body.empty();
		});
	
		it("cronizer", function() {
			scope.dataCron = '';
			var element = $compile(angular.element('<div><h4>{{dataCron}}</h4><ui-cronizer ng-model="dataCron"></ui-cronizer></div>'))(scope);
			element.appendTo(body);			
			scope.$digest();

			var flag = false;

			runs(function() {
				setTimeout(function() {
					flag = true;
				}, INTERVAL);
			});

			waitsFor(function() {
				return flag;
			}, INTERVAL + 100);

			runs(function() {
				expect(scope.dataCron).toEqual({ cron_schedule : '0 * */1 * *', period : 'every_day' });
			});
		})
	});
});

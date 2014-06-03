'use strict';

/* jasmine specs for directives go here */

describe('services', function() {

	describe('cronStringify', function() {

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

		var $compile, scope, serviceUtility, body = $('<div id="fixture"></div>').appendTo('body');

		angular.module('app', function () {})
		.config(function ($translateProvider) {
			$translateProvider.translations('ko', lang);
			$translateProvider.preferredLanguage('ko');
		});

		beforeEach(module('pascalprecht.translate', 'app', 'app.utility', 'app.filter'));
	
		beforeEach(inject(function(_$compile_,_$rootScope_, _serviceUtility_) {
			$compile = _$compile_;
			scope = _$rootScope_;
			serviceUtility = _serviceUtility_;
		}));

		afterEach(function() {
			body.empty();
		});
	
		it("has cronStringify", function() {
			expect(typeof serviceUtility.cronStringify).toEqual('function');
		});

		it("every_day", function() {
			expect(serviceUtility.cronStringify('0 * */1 * *')).toEqual('매 1일 매시 0분 마다.');
		});

		it('every_month', function() {
			expect(serviceUtility.cronStringify('20 20 * */1 2')).toEqual('1개월 마다 화요일에 매 20시 20분 마다.');
		})

		it("failed test", function() {
			expect(serviceUtility.cronStringify('1 1 2 */1 *')).toEqual('1개월 마다 2일에 매 1시 1분 마다.');
		});
	});
	
	describe('wordcloud', function() {

		var INTERVAL = 100;

		var tester;
		beforeEach(function() {
			tester = ngMidwayTester('app.chart');
		});

		afterEach(function() {
			tester.destroy();
			tester = null;
		});

		it('sample data 1', function() {
			var scope = tester.viewScope().$new();
			var serviceChart = tester.inject('serviceChart');
			var viewEl = tester.viewElement();

			var data = [{"count":1362,"domain":"www.facebook.com"},{"count":861,"domain":"syndication.twitter.com"},{"count":701,"domain":"www.google.com"},{"count":615,"domain":"gms.ahnlab.com"},{"count":553,"domain":"www.rescuetime.com"},{"count":525,"domain":"twitter.com"}];

			serviceChart.getWordCloud(data, 'count', 'domain', viewEl);

			var flag = false;

			runs(function() {
				// runs 블록은 순차적으로 실행할 것입니다.
				setTimeout(function() {
					flag = true;
				}, INTERVAL);
			});

			waitsFor(function() {
				
				return flag;
			}, INTERVAL + 100);

			runs(function() {
				expect(viewEl.find('svg > g > text:first').text()).toEqual('www.facebook.com');
			});
		});

		it('sample data 2', function() {
			var scope = tester.viewScope().$new();
			var serviceChart = tester.inject('serviceChart');
			var viewEl = tester.viewElement();

			var data = [{"count":100000,"domain":"www.facebook.com"},{"count":861,"domain":"syndication.twitter.com"},{"count":701,"domain":"www.google.com"},{"count":615,"domain":"gms.ahnlab.com"},{"count":553,"domain":"www.rescuetime.com"},{"count":1,"domain":"twitter.com"}];

			serviceChart.getWordCloud(data, 'count', 'domain', viewEl);

			var flag = false;

			runs(function() {
				// runs 블록은 순차적으로 실행할 것입니다.
				setTimeout(function() {
					flag = true;
				}, INTERVAL);
			});

			waitsFor(function() {
				
				return flag;
			}, INTERVAL + 100);

			runs(function() {
				expect(viewEl.find('svg > g > text:first').text()).toEqual('www.facebook.com');
			});
		});

	});
});

angular.module('app.directive.cron', ['app.connection', 'app.filter'])
.directive('uiCronizer', function(socket, $filter) {
	return {
		restrict: 'E',
		scope: {
		},
		templateUrl: '/script/directive/directive.cron.html',
		replace: true,
		controller: function() {

		},
		link: function(scope, element, attrs) {
			var $scope = scope;
			var pid = 77712;
				
			//$scope.filter = $filter;
			
			$scope.dataTime = [
				"0" + $filter('translate')('$S_str_TimePost'), 
				"1" + $filter('translate')('$S_str_TimePost'),  
				"2" + $filter('translate')('$S_str_TimePost'),  
				"3" + $filter('translate')('$S_str_TimePost'),  
				"4" + $filter('translate')('$S_str_TimePost'),  
				"5" + $filter('translate')('$S_str_TimePost'),  
				"6" + $filter('translate')('$S_str_TimePost'),  
				"7" + $filter('translate')('$S_str_TimePost'),  
				"8" + $filter('translate')('$S_str_TimePost'),  
				"9" + $filter('translate')('$S_str_TimePost'),  
				"10" + $filter('translate')('$S_str_TimePost'),  
				"11" + $filter('translate')('$S_str_TimePost'),  
				"12" + $filter('translate')('$S_str_TimePost'),  
				"13" + $filter('translate')('$S_str_TimePost'),  
				"14" + $filter('translate')('$S_str_TimePost'),  
				"15" + $filter('translate')('$S_str_TimePost'),  
				"16" + $filter('translate')('$S_str_TimePost'),  
				"17" + $filter('translate')('$S_str_TimePost'),  
				"18" + $filter('translate')('$S_str_TimePost'),  
				"19" + $filter('translate')('$S_str_TimePost'),  
				"20" + $filter('translate')('$S_str_TimePost'),  
				"21" + $filter('translate')('$S_str_TimePost'),  
				"22" + $filter('translate')('$S_str_TimePost'),  
				"23" + $filter('translate')('$S_str_TimePost')
			];

			$scope.dataMonth = [
				"1" + $filter('translate')('$S_str_MonthPost'),  
				"2" + $filter('translate')('$S_str_MonthPost'),  
				"3" + $filter('translate')('$S_str_MonthPost'),  
				"4" + $filter('translate')('$S_str_MonthPost'),  
				"5" + $filter('translate')('$S_str_MonthPost'),  
				"6" + $filter('translate')('$S_str_MonthPost'),  
				"7" + $filter('translate')('$S_str_MonthPost'),  
				"8" + $filter('translate')('$S_str_MonthPost'),  
				"9" + $filter('translate')('$S_str_MonthPost'),  
				"10" + $filter('translate')('$S_str_MonthPost'),  
				"11" + $filter('translate')('$S_str_MonthPost'),  
				"12" + $filter('translate')('$S_str_MonthPost')
			];

			$scope.dataStartTime = cloneArray($scope.dataTime);
			$scope.dataEndTime = cloneArray($scope.dataTime);
			$scope.dataDay = [
				$filter('translate')('$S_str_Weekend'),  
				$filter('translate')('$S_str_Weekday'), 
				$filter('translate')('$S_str_Sunday'), 
				$filter('translate')('$S_str_Monday'), 
				$filter('translate')('$S_str_Tuesday'), 
				$filter('translate')('$S_str_Wednesday'), 
				$filter('translate')('$S_str_Thursday'), 
				$filter('translate')('$S_str_Friday'), 
				$filter('translate')('$S_str_Saturday')
			];

			$scope.dataLogicDay = [
				$filter('translate')('$S_str_Sunday'), 
				$filter('translate')('$S_str_Monday'), 
				$filter('translate')('$S_str_Tuesday'), 
				$filter('translate')('$S_str_Wednesday'), 
				$filter('translate')('$S_str_Thursday'), 
				$filter('translate')('$S_str_Friday'), 
				$filter('translate')('$S_str_Saturday')
			];

			$scope.dataScheduleQuery = {};

			function initScheduleQueryOptions() {
				$scope.dataScheduleQuery = {};
				$scope.dataScheduleQuery.use_save_result = "false";
				$scope.dataScheduleQuery.use_alert = "false";
				$scope.dataScheduleQuery.use_alert_bool = false;
				$scope.dataScheduleQuery.suppress_interval = 600;
				$scope.dataScheduleQuery.mail_profiles;
				$scope.dataScheduleQuery.mail_from = '';
				$scope.dataScheduleQuery.mail_to = '';
				$scope.dataScheduleQuery.mail_subject = '';		
				$scope.dataScheduleQuery.mail_profile_name = '';
				$scope.dataScheduleQuery.mail_profile_names = [];

				$scope.dataScheduleQuery.period_time = "true";
				$scope.dataScheduleQuery.period = "every_day";
				$scope.dataScheduleQuery.startTime = getCurrentLogicHour();
				$scope.dataScheduleQuery.endTime = getCurrentLogicHour();
				$scope.dataScheduleQuery.minute = "0";

				$scope.dataScheduleQuery.day = {};
				$scope.dataScheduleQuery.day.every_day = "false";
				$scope.dataScheduleQuery.day.date = "1";

				$scope.dataScheduleQuery.week = {};
				$scope.dataScheduleQuery.week.every_week = "true";
				$scope.dataScheduleQuery.week.day = getCurrentDay();

				$scope.dataScheduleQuery.month = {};
				$scope.dataScheduleQuery.month.select_date = "true";
				$scope.dataScheduleQuery.month.date_month_count = "1";
				$scope.dataScheduleQuery.month.day_month_count = "1";
				$scope.dataScheduleQuery.month.date = getCurrentDate();
				$scope.dataScheduleQuery.month.day = getCurrentLogicDay();

				$scope.dataScheduleQuery.year = {};
				$scope.dataScheduleQuery.year.select_date = "true";
				$scope.dataScheduleQuery.year.date_month = getCurrentMonth();
				$scope.dataScheduleQuery.year.day_month = getCurrentMonth();
				$scope.dataScheduleQuery.year.date = getCurrentDate();
				$scope.dataScheduleQuery.year.day = getCurrentLogicDay();

				// $scope.frmCreateScheduleQuery.$setPristine();
				$scope.isOnSubmit = false;

				// getSmtpProfiles();
				$scope.period(0);
			}	

			$scope.calculateStartTime = function() {
				var hourPost = $filter('translate')('$S_str_TimePost');
				var start = $scope.dataScheduleQuery.startTime.replace(hourPost, "");
				var end =  $scope.dataScheduleQuery.endTime.replace(hourPost, "");

				if((end-start) < 0) {			
					$scope.dataScheduleQuery.endTime = $scope.dataScheduleQuery.startTime;
				}
			}

			$scope.calculateEndTime = function() {
				var start = $scope.dataScheduleQuery.startTime;

				var end = [];
				var startIdx;

				$scope.dataTime.forEach(function(obj, idx) {
					if(obj == start) {
						startIdx = idx;
					}
				});

				$scope.dataTime.forEach(function(obj, idx) {
					if(idx >= startIdx) {
						end.push(obj);
					}
				});

				$scope.dataEndTime = end;
				$scope.dataScheduleQuery.endTime = end[0];
			}

			function cloneArray(array) {
				var newArray = []

				array.forEach(function(obj) {
					newArray.push(obj);
				});

				return newArray;
			}

			$scope.isOnSubmit = false;

			$scope.validStep0 = function() {
				if($scope.frmCreateScheduleQuery.$invalid) {
					$scope.isOnSubmit = true;
				}
				else {
					$scope.isOnSubmit = false;
				}
			}

			$scope.convertToBoolean = function() {
				if($scope.dataScheduleQuery.use_alert == "true")
					$scope.dataScheduleQuery.use_alert_bool = true;
				else
					$scope.dataScheduleQuery.use_alert_bool = false;
			}

			$scope.selectMailProfile = function() {
				$scope.dataScheduleQuery.mail_profiles.forEach(function(obj) {
					if(obj.name == $scope.dataScheduleQuery.mail_profile)
						$scope.dataScheduleQuery.mail_from = obj.user;
				});
			}

			

			$scope.period = function(page) {
				var el = $('.logquery-container .wizard-scheduled-cron-detail li.cron-detail-step').removeClass('active')[page];
				$(el).addClass('active');
			}

			function cronize() {
				var period = $scope.dataScheduleQuery.period;
				var periodTime = $scope.dataScheduleQuery.period_time;
				var daySelectEveryDay = $scope.dataScheduleQuery.day.every_day;
				var monthSelectDate = $scope.dataScheduleQuery.month.select_date;
				var yearSelectDate= $scope.dataScheduleQuery.year.select_date;

				//init
				var min = "*";
				var hour = "*";
				var date = "*";
				var month = "*";
				var day = "*";

				var hourPost = $filter('translate')('$S_str_TimePost');

				var start = $scope.dataScheduleQuery.startTime.replace(hourPost, "");
				var end = $scope.dataScheduleQuery.endTime.replace(hourPost, "");

				min = $scope.dataScheduleQuery.minute;

				//시간반복 결정
				if(periodTime == "false") {
					if(start == end) {
						hour = start;
					} else {
						hour = start + "-" + end;
					}
				}

				if(period == "every_day") {
					if(daySelectEveryDay == "false") {
						date += "/" + $scope.dataScheduleQuery.day.date;
					}
				} else if(period == "every_week") {
					var week = $scope.dataScheduleQuery.week.day;

					day = "";
					jQuery.each(week, function(i, obj) {
						if(obj == true){
							day += getDayIndex(i) + ",";
						}
					});

					//마지막 , 삭제
					day = day.substring(0, day.length-1)

					if(day == "0,1,2,3,4,5,6")
						day = "*";

				} else if(period == "every_month") {
					if(monthSelectDate == "true") {
						var monthCount = $scope.dataScheduleQuery.month.date_month_count;
						var monthDate = $scope.dataScheduleQuery.month.date;

						month += "/" + monthCount;
						date = monthDate;

					} else {
						var monthCount = $scope.dataScheduleQuery.month.day_month_count;
						var selectDay = $scope.dataScheduleQuery.month.day;

						month += "/" + monthCount;
						day = getDayOfMonth(selectDay);
					}

				} else if(period == "every_year") {
					if(yearSelectDate == "true") {
						var month_count_string = $scope.dataScheduleQuery.year.date_month;
						var month_count = $scope.dataMonth.indexOf(month_count_string) + 1;
						var selectDate = $scope.dataScheduleQuery.year.date;

						month = month_count;
						date = selectDate;
					} else {
						var month_count_string = $scope.dataScheduleQuery.year.day_month;
						var month_count = $scope.dataMonth.indexOf(month_count_string) + 1;
						var selectDay = getDayOfMonth($scope.dataScheduleQuery.year.day);

						month = month_count;
						day = selectDay;
					}
				}


				var requestValue = {};
				requestValue.title = $scope.dataScheduleQuery.title;
				requestValue.query = $scope.dataScheduleQuery.query;
				requestValue.cron_schedule = min + " " + hour + " " + date + " " + month + " " + day;
				requestValue.period = period;
				requestValue.save_result = $scope.dataScheduleQuery.use_save_result == "true" ? true : false;
				requestValue.use_alert = $scope.dataScheduleQuery.use_alert == "true" ? true : false;
				requestValue.suppress_interval = $scope.dataScheduleQuery.suppress_interval;
				requestValue.alert_query = $scope.dataScheduleQuery.alert_query;
				requestValue.mail_profile = $scope.dataScheduleQuery.mail_profile;
				requestValue.mail_from = $scope.dataScheduleQuery.mail_from;
				requestValue.mail_to = $scope.dataScheduleQuery.mail_to;
				requestValue.mail_subject = $scope.dataScheduleQuery.mail_subject;

				return requestValue;
			}

			function getDayIndex(day) {
				if(day == "sun") {
					return 0;
				} else if(day == "mon") {
					return 1;
				} else if(day == "tue") {
					return 2;
				} else if(day == "wed") {
					return 3;
				} else if(day == "thu") {
					return 4;
				} else if(day == "fri") {
					return 5;
				} else if(day == "sat") {
					return 6;
				}
			}

			function getDayOfMonth(day) {
				if(day == $filter('translate')('$S_str_Weekday')) {
					return "1-5";
				} else if(day == $filter('translate')('$S_str_Weekend')) {
					return "0,6";
				} else if(day == $filter('translate')('$S_str_Sunday')) {
					return "0";
				} else if(day == $filter('translate')('$S_str_Monday')) {
					return "1";
				} else if(day == $filter('translate')('$S_str_Tuesday')) {
					return "2";
				} else if(day == $filter('translate')('$S_str_Wednesday')) {
					return "3";
				} else if(day == $filter('translate')('$S_str_Thursday')) {
					return "4";
				} else if(day == $filter('translate')('$S_str_Friday')) {
					return "5";
				} else if(day == $filter('translate')('$S_str_Saturday')) {
					return "6";
				}
			}

			function getCurrentLogicHour() {
				var d = new Date();
				return $scope.dataTime[d.getHours()];
			}

			function getCurrentDay() {
				week = {};
				week.sun = false;
				week.mon = false;
				week.tue = false;
				week.wed = false;
				week.thu = false;
				week.fri = false;
				week.sat = false;

				var d = new Date();

				if(d.getDay() == 0)
					week.sun = true;
				else if(d.getDay() == 1)
					week.mon = true;
				else if(d.getDay() == 2)
					week.tue = true;
				else if(d.getDay() == 3)
					week.wed = true;
				else if(d.getDay() == 4)
					week.thu = true;
				else if(d.getDay() == 5)
					week.fri = true;
				else if(d.getDay() == 6)
					week.sat = true;

				return week;
			}

			function getCurrentLogicDay() {
				var d = new Date();
				var day_count = d.getDay();

				return $scope.dataLogicDay[day_count];
			}

			function getCurrentDate() {
				var d = new Date();
				return d.getDate();
			}

			function getCurrentMonth() {
				var d = new Date();
				var month_count = d.getMonth();
				return $scope.dataMonth[month_count];
			}


			function msgbusFailed(m, raw) {
				console.log(m, raw)
			}
			initScheduleQueryOptions();

			element[0].getCron = function() {
				return cronize();
			}
		}
	}
});
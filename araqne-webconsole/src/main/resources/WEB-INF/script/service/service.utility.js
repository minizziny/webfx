angular.module('app.utility', ['app.filter'])
.factory('serviceUtility', function($filter) {

	var s4 = function() {
		return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
	};

	var getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function convertToCronObject(cron) {
		var dataCronArray = cron.split(" ");

		var object = {};
		object.min = dataCronArray[0];
		object.hour = dataCronArray[1];
		object.date = dataCronArray[2];
		object.month = dataCronArray[3];
		object.dayOfWeek = dataCronArray[4];

		object.period = '';

		if (object.date == "*" && object.month == "*" && object.dayOfWeek == "*")
			object.period = "every_day";
		else if (object.date.indexOf("/") > -1 && object.month == "*" && object.dayOfWeek == "*")
			object.period = "every_day";
		else if (object.date == "*" && object.month == "*" && object.dayOfWeek.indexOf(",") > -1)
			object.period = "every_week";
		else if (object.date == "*" && object.month == "*" && isNaN(object.dayOfWeek) == false)
			object.period = "every_week";
		else if (object.month == "*")
			object.period = "every_month";
		else if (object.month.indexOf("/") > -1)
			object.period = "every_month";
		else if (object.month.indexOf("-") > -1)
			object.period = "every_month";
		else if (object.month.indexOf(",") > -1)
			object.period = "every_month";
		else if (isNaN(object.month) == false)
			object.period = "every_year";

		return object;
	}

	function cronStringify(cron) {

		if(cron == null)
			return "";

		var conObject = convertToCronObject(cron);

		var dataCronArray = cron.split(" ");
		var min = conObject.min;
		var hour = conObject.hour;
		var date = conObject.date;
		var month = conObject.month;
		var dayOfWeek = conObject.dayOfWeek;

		var period = conObject.period;

		var result = "";

		console.log('period', period, conObject);

		if(period == "every_day") {
			if(date == "*") {
				if(hour == "*") {
					result += $filter('translate')('$S_msg_EveryDay');
					result += $filter('translate')('$S_msg_EveryHour');
					result += analysisUnit($filter, min, "minute");
				} else {
					result += $filter('translate')('$S_msg_EveryDay');
					result += analysisUnit($filter, hour, "hour");
					result += analysisUnit($filter, min, "minute");
				}
			} else {
				if(hour == "*") {
					result += analysisUnit($filter, date, "date");
					result += " " + $filter('translate')('$S_msg_EveryHour');
					result += analysisUnit($filter, min, "minute");
				} else {
					result += analysisUnit($filter, date, "date");
					result += analysisUnit($filter, hour, "hour");
					result += analysisUnit($filter, min, "minute");
				}
			}
		} else if(period == "every_week") {
			if(hour == "*") {
				result += $filter('translate')('$S_msg_EveryWeek');
				result += analysisUnit($filter, dayOfWeek, "day-of-week");
				result += " " + $filter('translate')('$S_msg_EveryHour');
				result += analysisUnit($filter, min, "minute");
			} else {
				result += $filter('translate')('$S_msg_EveryWeek');
				result += analysisUnit($filter, dayOfWeek, "day-of-week");

				if(analysisUnit($filter, dayOfWeek, "day-of-week") != "")
					result += " ";

				result += analysisUnit($filter, hour, "hour");
				result += " ";
				result += analysisUnit($filter, min, "minute");
			}
		} else if(period == "every_month") {
			if( month != "*" ){
				result += analysisUnit($filter, month, "month");
				result += " ";
			}

			if(dayOfWeek == "*"){
				if(hour == "*") {
					result += analysisUnit($filter, date, "date");
					result += $filter('translate')('$S_msg_EveryHour');
					result += analysisUnit($filter, min, "minute");
				} else {
					result += analysisUnit($filter, date, "date");
					result += analysisUnit($filter, hour, "hour");
					result += analysisUnit($filter, min, "minute");
				}				
			} else {
				if(hour == "*") {
					result += $filter('translate')('$S_msg_Every');
					result += analysisUnit($filter, dayOfWeek, "day-of-week");
					result += $filter('translate')('$S_msg_On');
					result += $filter('translate')('$S_msg_EveryHour');
					result += analysisUnit($filter, min, "minute");
				} else {
					result += $filter('translate')('$S_msg_Every');
					result += analysisUnit($filter, dayOfWeek, "day-of-week");
					result += $filter('translate')('$S_msg_On');
					result += analysisUnit($filter, hour, "hour");
					result += analysisUnit($filter, min, "minute");
				}
			}
		} else if(period == "every_year") {
			if(dayOfWeek == "*"){
				if(hour == "*") {
					result += $filter('translate')('$S_msg_EveryYear');
					result += analysisUnit($filter, month, "month");
					result += $filter('translate')('$S_msg_On');
					result += analysisUnit($filter, date, "date");
					result += $filter('translate')('$S_msg_EveryHour');
					result += analysisUnit($filter, min, "minute");
				} else {
					result += $filter('translate')('$S_msg_EveryYear');
					result += analysisUnit($filter, month, "month");
					result += $filter('translate')('$S_msg_On');
					result += analysisUnit($filter, date, "date");
					result += analysisUnit($filter, hour, "hour");
					result += " ";
					result += analysisUnit($filter, min, "minute");
				}
			} else {
				if(hour == "*") {
					result += $filter('translate')('$S_msg_EveryYear');
					result += analysisUnit($filter, month, "month");
					result += $filter('translate')('$S_msg_On');
					result += analysisUnit($filter, dayOfWeek, "day-of-week");
					result += $filter('translate')('$S_msg_On');
					result += $filter('translate')('$S_msg_EveryHour');
					result += analysisUnit($filter, min, "minute");
				} else {
					result += $filter('translate')('$S_msg_EveryYear');
					result += analysisUnit($filter, month, "month");
					result += $filter('translate')('$S_msg_On');
					result += analysisUnit($filter, dayOfWeek, "day-of-week");
					result += $filter('translate')('$S_msg_On');
					result += analysisUnit($filter, hour, "hour");
					result += " ";
					result += analysisUnit($filter, min, "minute");
				}
			}
		} else {
			if(hour == "*" && date == "*" && month == "*" && dayOfWeek == "*") {
				result += $filter('translate')('$S_msg_EveryDay');
				result += $filter('translate')('$S_msg_EveryHour');
				result += analysisUnit($filter, min, "minute");
			}
		}
		return result;
	}

	function analysisUnit($filter, cronUnit, type) {
		var dataDayOfWeek = [
			$filter('translate')('$S_str_Sunday'), 
			$filter('translate')('$S_str_Monday'), 
			$filter('translate')('$S_str_Tuesday'), 
			$filter('translate')('$S_str_Wednesday'), 
			$filter('translate')('$S_str_Thursday'), 
			$filter('translate')('$S_str_Friday'), 
			$filter('translate')('$S_str_Saturday'),
			$filter('translate')('$S_str_Weekend'),  
			$filter('translate')('$S_str_Weekday'), 
		];
		var dataMonth = [
			$filter('translate')('$S_str_Jan'),
			$filter('translate')('$S_str_Feb'),
			$filter('translate')('$S_str_Mar'),
			$filter('translate')('$S_str_Apr'),
			$filter('translate')('$S_str_May'),
			$filter('translate')('$S_str_Jun'),
			$filter('translate')('$S_str_Jul'),
			$filter('translate')('$S_str_Aug'),
			$filter('translate')('$S_msg_Sep'),
			$filter('translate')('$S_msg_Oct'),
			$filter('translate')('$S_msg_Nov'),
			$filter('translate')('$S_msg_Dec'),
		];

		var unit = "";
		var post = "";
		var fromPost = $filter('translate')('$S_msg_From');
		var toPost = $filter('translate')('$S_msg_To');
		var between = $filter('translate')('$S_msg_Between');
		var and = $filter('translate')('$S_msg_And');
		var postWeek = $filter('translate')('$S_msg_PostWeek');
		var oclock = $filter('translate')('$S_msg_Oclock');

		if(type == "minute")
			post = $filter('translate')('$S_msg_Min');
		else if(type == "hour")
			post = $filter('translate')('$S_msg_Hour');
		else if(type == "date")
			post = $filter('translate')('$S_msg_Date');
		else if(type == "month")
			post = $filter('translate')('$S_msg_Month');
		else if(type == "day-of-week")
			post = "";

		if(type == "day-of-week") {
			if(cronUnit.indexOf(",") > -1) {
				if(cronUnit == "1,2,3,4,5") {
					cronUnit = dataDayOfWeek[8];
				} else if(cronUnit == "0,6") {
					cronUnit = dataDayOfWeek[7];
				} else {
					var dayOfWeekArray = cronUnit.split(",");
					var convertToLocale = "";

					dayOfWeekArray.forEach(function(obj) {
					 	convertToLocale += dataDayOfWeek[obj] + ", "
					});

					//마지막 , 삭제
					convertToLocale = convertToLocale.substring(0, convertToLocale.length - 2);
					cronUnit = convertToLocale + $filter('translate')('$S_msg_On');
				}
			} else {
				if(cronUnit == "*") {
					cronUnit = "";
				} else if(cronUnit == "1-5") {
					cronUnit = dataDayOfWeek[8];
				} else {
					cronUnit = dataDayOfWeek[cronUnit];
				}
			}

			unit = cronUnit + post + postWeek;

		} else {
			if(cronUnit.indexOf("/") > -1) {				
				if(type == "month") {
					unit += $filter('translate')('$S_msg_PreMonth');
					unit += cronUnit.split("/")[1];
					unit += $filter('translate')('$S_msg_NumberOfMonth');
					if(cronUnit.split("/")[1] == 1)
						unit += $filter('translate')('$S_msg_PostMonth');
					else
						unit += $filter('translate')('$S_msg_PostMonths');
				} else if(type == "hour"){
					unit += cronUnit.split("/")[1] + $filter('translate')('$S_str_Time');
				} else {
					unit = cronUnit.split("/")[1] + post;
				}

				unit += $filter('translate')('$S_msg_Interval');
				unit += "으로 ";

			} else if(cronUnit.indexOf(",") > -1) {
				if(type == "hour")
					unit = cronUnit + oclock + $filter('translate')('$S_msg_On');
				else if(type == "minute")
					unit = cronUnit + post + $filter('translate')('$S_msg_Moment');
				else	
					unit = cronUnit + post + $filter('translate')('$S_msg_On');

			} else if(cronUnit.indexOf("-") > -1) {
				var from = 	cronUnit.split("-")[0];	
				var to = cronUnit.split("-")[1];
				unit = between + from + and + fromPost + " " + to;

				if( type == "hour")
					unit += oclock + toPost;
				else if( type == "month" )
					unit += $filter('translate')('$S_msg_Month') + toPost;
				else
					unit += post + toPost;

			} else if(cronUnit == "*") {
				if(type == "month") {
				}else if(type == "date"){
					unit = $filter('translate')('$S_msg_EveryDay') + $filter('translate')('$S_msg_PostDate2');
				}else if(type == "hour"){
					unit = $filter('translate')('$S_msg_EveryHour') + $filter('translate')('$S_msg_PostDate2');
				}else if(type == "minute"){
					unit = $filter('translate')('$S_msg_EveryMin') + $filter('translate')('$S_msg_PostDate2') + $filter('translate')('$S_msg_Moment');
				}
			} else {
				if(type == "month") {
					// console.log(cronUnit);
					parseInt
					var index = parseInt(cronUnit) - 1;
					unit = dataMonth[index] + $filter('translate')('$S_msg_Comma');
				} else if(type == "date") {
					unit = $filter('translate')('$S_msg_PreDate') + cronUnit + $filter('translate')('$S_msg_PostDate') + $filter('translate')('$S_msg_PostDate2') + $filter('translate')('$S_msg_On');
				} else if(type == "hour") {
					unit = cronUnit + oclock + $filter('translate')('$S_msg_On');
				} else {
					unit = cronUnit + post + $filter('translate')('$S_msg_Moment');					
				}
			}
		}

		return unit;
	}

	return {
		generateType1: function() {
			return (s4()+s4()+"-"+s4()+"-"+s4()+"-"+s4()+"-"+s4()+s4()+s4());
		},
		generateType2: function() {
			return ('w'+s4()+s4()+s4()+s4());
		},
		generateType3: function() {
			return ('w'+s4());
		},
		getRandomInt: getRandomInt,
		cronStringify: cronStringify
	}
});
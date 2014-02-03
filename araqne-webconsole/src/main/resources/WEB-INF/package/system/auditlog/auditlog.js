function AuditLogController($scope, $filter, $translate, socket, eventSender, serviceDom) {
	var current = new Date();
	var month = current.getMonth() + 1;
	var monthAgo = current.getMonth();
	var day = current.getDate();

	if (("" + month).length == 1) monthAgo = "0" + monthAgo;
	if (("" + month).length == 1) month = "0" + month;	
	if (("" + current.getDate()).length == 1) day = "0" + day;

	var currentDate = '' + current.getFullYear() + '' +  month + '' + day;
	var monthAgoDate = '' + current.getFullYear() + '' + monthAgo + '' + day;

	$scope.dataAuditlogs = [];
	$scope.numAuditlogsCount;

	$scope.numTotalCount = 0;
	$scope.numPageSize = 15;
	$scope.numPageSizeRough = 3;
	$scope.numCurrentPage = 0;
	$scope.numPagerPageSize = 10;

	$scope.dataDatePattern = /^([0-9][0-9]{3})(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[0-1])$/;

	$scope.formItemsCount = {
		'0': $filter('translate')('$S_str_Items'),
		'one': $filter('translate')('$S_str_Item'),
		'other': $filter('translate')('$S_str_Items')
	};
	
	$scope.from = monthAgoDate;
	$scope.to = currentDate;

	console.log($scope.from);
	console.log($scope.to);

	$scope.offset = null;
	$scope.limit = null;

	$scope.getAuditLogs = function(offset, limit) {
		
		//console.log("offset: " + offset + ", limit: " + limit);
		/*
		method : com.logpresso.core.msgbus.AuditLogPlugin.getAuditLogs
		argument : from, to, offset(nullable), limit(nullable)
		 */
		socket.send('com.logpresso.core.msgbus.AuditLogPlugin.getAuditLogs', {
			'from': $scope.from, 
			'to': $scope.to, 
			'offset': offset, 
			'limit': limit,
			'locale': $translate.uses() 
		}, eventSender.auditlog.pid)
		.success(function(m) {
			$scope.dataAuditlogs = m.body.result;
			$scope.numTotalCount = m.body.total;
			$scope.dataAuditlogs.forEach(function(obj) {
				if(obj.error == null){
					obj.result = $filter('translate')('$S_str_Success');
				} else {
					obj.result = $filter('translate')('$S_str_Failed');
				}
			});

			//console.table($scope.dataAuditlogs);

			$scope.$apply();
		})
		.failed(msgbusFailed);
	}

	$scope.changePage = function(idx) {
		$scope.numCurrentPage = idx;
		$scope.getAuditLogs(idx * $scope.numPageSize, $scope.numPageSize);
	}

	$scope.changePagesize = throttle(function() {
		$scope.getAuditLogs($scope.numCurrentPage * $scope.numPageSize, $scope.numPageSize);
	}, 300);

	$scope.changePagesizeRough = function() {
		function z(n) {
			var obj = {	'1': 5,'2': 10,'3': 15,'4': 20,'5': 25,'6': 50,'7': 75,'8': 100,'9': 150,'10': 200 };
			return obj[n];
		}

		$scope.numPageSize = z($scope.numPageSizeRough);
		if( parseInt($scope.numPageSizeRough) > 4) return;
		$scope.getAuditLogs($scope.numCurrentPage * $scope.numPageSize, $scope.numPageSize);
	}

	$scope.changePagesizeRoughMouseup = function() {
		if( parseInt($scope.numPageSizeRough) <= 4) return;
		$scope.getAuditLogs($scope.numCurrentPage * $scope.numPageSize, $scope.numPageSize);
	}

	$scope.getAuditLogs($scope.numCurrentPage * $scope.numPageSize, $scope.numPageSize);
}
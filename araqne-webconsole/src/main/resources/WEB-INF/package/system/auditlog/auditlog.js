var proc = {pid: 4}
function AuditLogController($scope, $filter, $translate, socket, eventSender, serviceDom) {
	var current = new Date();
	var currentDate = '' + current.getFullYear() + '' + (current.getMonth()+1) + '' + current.getDate();
	var monthAgoDate = '' + current.getFullYear() + '' + current.getMonth() + '' + current.getDate();

	$scope.dataAuditlogs = [];
	$scope.numAuditlogsCount;

	$scope.numTotalCount = 0;
	$scope.numPageSize = 15;
	$scope.numPageSizeRough = 3;
	$scope.numCurrentPage = 0;
	$scope.numPagerPageSize = 10;

	$scope.formItemsCount = {
		'0': $filter('translate')('$S_str_Items'),
		'one': $filter('translate')('$S_str_Item'),
		'other': $filter('translate')('$S_str_Items')
	};
	
	$scope.from = monthAgoDate;
	$scope.to = currentDate;

	$scope.offset = null;
	$scope.limit = null;

	$scope.getAuditLogs = function(offset, limit) {
		//console.log("offset: " + offset + ", limit: " + limit);
		/*
		method : org.logpresso.core.msgbus.AuditLogPlugin.getAuditLogs
		argument : from, to, offset(nullable), limit(nullable)
		 */
		socket.send('org.logpresso.core.msgbus.AuditLogPlugin.getAuditLogs', {
			'from': $scope.from, 
			'to': $scope.to, 
			'offset': offset, 
			'limit': limit,
			'locale': $translate.uses() 
		}, proc.pid)
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
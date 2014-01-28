function StreamQueryController($scope) {
	$scope.sqs = [
		{
		"name": "youtube_stats", 
		"interval": 600, 
		"query_string": "stats count by hour, v | import youtube_stats", 
		"streams": ["youtube"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:15:31", 
		"modified": "2014-01-26 21:15:31", 
		"description": null, 
		"input_count": 26059, 
		"last_refresh": "2014-01-27 16:27:36"
		},
		{
		"name": "youtube_stats2", 
		"interval": 600, 
		"query_string": "stats count by hour, v | import youtube_stats", 
		"streams": ["youtube"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:15:31", 
		"modified": "2014-01-26 21:15:31", 
		"description": null, 
		"input_count": 26059, 
		"last_refresh": "2014-01-27 16:27:36"
		},
		{
		"name": "youtube_stats_child", 
		"interval": 600, 
		"query_string": "stats count by hour, v | import youtube_stats", 
		"streams": ["youtube_stats"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:15:31", 
		"modified": "2014-01-26 21:15:31", 
		"description": null, 
		"input_count": 26059, 
		"last_refresh": "2014-01-27 16:27:36"
		},
		{
		"name": "youtube_stats_child2", 
		"interval": 600, 
		"query_string": "stats count by hour, v | import youtube_stats", 
		"streams": ["youtube_stats"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:15:31", 
		"modified": "2014-01-26 21:15:31", 
		"description": null, 
		"input_count": 26059, 
		"last_refresh": "2014-01-27 16:27:36"
		},
		{
		"name": "host_stats", 
		"interval": 600, 
		"query_string": "search len(host) > 0 | stats count by hour, host | import host_stats", 
		"streams": ["lqms"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:15:47", 
		"modified": "2014-01-26 21:15:47", 
		"description": null, 
		"input_count": 226825721, 
		"last_refresh": "2014-01-27 16:27:43"
		},
		{
		"name": "last_cell", 
		"interval": 600, 
		"query_string": "search isnotnull(cell_id) | stats last(cell_id) as cell_id by ctn | import last_cell", 
		"streams": ["lqms"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 19:54:08", 
		"modified": "2014-01-26 19:54:08", 
		"description": null, 
		"input_count": 226825721, 
		"last_refresh": "2014-01-27 16:34:18"
		},
		{
		"name": "llast_cell", 
		"interval": 600, 
		"query_string": "search isnotnull(cell_id) | stats last(cell_id) as cell_id by ctn | import last_cell", 
		"streams": ["lqms"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 19:54:08", 
		"modified": "2014-01-26 19:54:08", 
		"description": null, 
		"input_count": 226825721, 
		"last_refresh": "2014-01-27 16:34:18"
		},
		{
		"name": "mgoon_stats", 
		"interval": 600, 
		"query_string": "stats count by hour, v | import mgoon_stats", 
		"streams": ["mgoon"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:16:13", 
		"modified": "2014-01-26 21:16:13", 
		"description": null, 
		"input_count": 287, 
		"last_refresh": "2014-01-27 16:27:36"
		},
		{
		"name": "youtube", 
		"interval": 60, 
		"query_string": "search host == \"*youtube*\" and url == \"*/watch?*\" | rex field=url \"v=(?<v>\\w+)\" | search len(v) > 10 | import youtube", 
		"streams": ["video"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 19:57:08", 
		"modified": "2014-01-26 19:57:08", 
		"description": null, 
		"input_count": 1043221, 
		"last_refresh": "2014-01-27 16:35:36"
		},
		{
		"name": "lqms", 
		"interval": 60, 
		"query_string": "parse overlay=true lqms | eval hour = string(_time, \"yyyyMMddHH\")", 
		"loggers": ["local\\app2_1", "local\\app2_2", "local\\app2_3", "local\\app2_4", "local\\app3_1", "local\\app3_2", "local\\app3_3", "local\\app3_4"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:11:54", 
		"modified": "2014-01-26 21:11:54", 
		"description": null, 
		"input_count": 226825721, 
		"last_refresh": "2014-01-27 16:35:18"
		},
		{
		"name": "pandora_stats", 
		"interval": 600, 
		"query_string": "stats count by hour, userid, prgid | import pandora_stats", 
		"streams": ["pandora"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:16:51", 
		"modified": "2014-01-26 21:16:51", 
		"description": null, 
		"input_count": 831, 
		"last_refresh": "2014-01-27 16:27:36"
		},
		{
		"name": "keyword_stats", 
		"interval": 600, 
		"query_string": "stats count by hour, term | import keyword_stats", 
		"streams": ["ctn_keywords"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:17:54", 
		"modified": "2014-01-26 21:17:54", 
		"description": null, 
		"input_count": 790316, 
		"last_refresh": "2014-01-27 16:27:40"
		},
		{
		"name": "zzeyword_stats", 
		"interval": 600, 
		"query_string": "stats count by hour, term | import keyword_stats", 
		"streams": ["ctn_keywords"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:17:54", 
		"modified": "2014-01-26 21:17:54", 
		"description": null, 
		"input_count": 790316, 
		"last_refresh": "2014-01-27 16:27:40"
		},
		{
		"name": "video", 
		"interval": 60, 
		"query_string": "eval url = urldecode(url) | search in(host, \"*youtube*\", \"*pandora*\", \"*mgoon*\", \"*pann.nate*\") | fields _time, hour, ctn, host, url", 
		"streams": ["lqms"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:14:38", 
		"modified": "2014-01-26 21:14:38", 
		"description": null, 
		"input_count": 226825721, 
		"last_refresh": "2014-01-27 16:35:36"
		},
		{
		"name": "pann", 
		"interval": 60, 
		"query_string": "search host == \"*pann*\" and url == \"*video*\" | rex field=url \"/video/(?<video>\\d+)\" | search isnotnull(video) | import pann", 
		"streams": ["video"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 20:00:03", 
		"modified": "2014-01-26 20:00:03", 
		"description": null, 
		"input_count": 1043221, 
		"last_refresh": "2014-01-27 16:35:37"
		},
		{
		"name": "mgoon", 
		"interval": 60, 
		"query_string": "search host == \"*mgoon.com\" |  rex field=url \"(\\/view.htm\\?id=(?<v>\\d+)|\\/play\\/view\\/(?<v>\\d+))\" | search isnotnull(v) | import mgoon", 
		"streams": ["video"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 20:02:47", 
		"modified": "2014-01-26 20:02:47", 
		"description": null, 
		"input_count": 1043221, 
		"last_refresh": "2014-01-27 16:35:36"
		},
		{
		"name": "ctn_keywords", 
		"interval": 60, 
		"query_string": "parse keyword | search isnotnull(term) | fields hour, ctn, host, term | import ctn_keywords", 
		"streams": ["lqms"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:19:14", 
		"modified": "2014-01-26 21:19:14", 
		"description": null, 
		"input_count": 226825721, 
		"last_refresh": "2014-01-27 16:35:36"
		},
		{
		"name": "pann_stats", 
		"interval": 600, 
		"query_string": "stats count by hour, video | import pann_stats", 
		"streams": ["pann"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 21:18:33", 
		"modified": "2014-01-26 21:18:33", 
		"description": null, 
		"input_count": 345, 
		"last_refresh": "2014-01-27 16:27:36"
		},
		{
		"name": "pandora", 
		"interval": 60, 
		"query_string": "search host == \"*pandora.tv*\" and url == \"/channel/video.ptv*\" | rex field=url \"userid=(?<userid>[^&]*)&prgid=(?<prgid>[^&]*)\" | search isnotnull(userid) and isnotnull(prgid) | import pandora", 
		"streams": ["video"], 
		"enabled": true, 
		"owner": "root", 
		"created": "2014-01-26 19:58:38", 
		"modified": "2014-01-26 19:58:38", 
		"description": null, 
		"input_count": 1043221, 
		"last_refresh": "2014-01-27 16:35:37"
		}
	];

	/////////////// inital node hierachy, assign depth, append children

	function getInputIndex(src, name) {
		var found = src.filter(function(sq) {
			return sq.name == name;
		});
		if(found[0]._depth != undefined) return { 'depth': found[0]._depth + 1, 'raw': found[0] };
		else return undefined;
	}

	function getChildrenLength(src, sq) {
		var found = src.filter(function(sqsrc) {
			if(sqsrc.hasOwnProperty('streams')) {
				if(sqsrc.streams.indexOf(sq.name) != -1) {
					sq._children.push(sqsrc);
					return true;
				}
			}
		});
		return found.length;
	}

	$scope.sqs.forEach(function(sq) {
		sq._children = [];
		if(!sq.hasOwnProperty('streams')) {
			sq._depth = 1;
		}
		getChildrenLength($scope.sqs, sq);
		sq._children.sort(function(a,b) {
			return a.name > b.name;
		});
	});

	function assignDepth() {
		$scope.sqs.forEach(function(sq) {
			if(!sq.hasOwnProperty('streams')) return;
			sq._streams = [];
			sq.streams.forEach(function(stream) {
				var str = getInputIndex($scope.sqs, stream)
				if(str === undefined) sq._depth = undefined;
				else {
					sq._streams.push(str);
					var ii = str.depth;
					sq._depth = (sq._depth > ii) ? sq._depth : ii;
				}
			});
		});
	}

	while($scope.sqs.some(function(sq) {
		return sq._depth === undefined;
	})) {
		assignDepth();
	}

	//////////////// assign position

	console.log($scope.sqs);

	function getStyle() {
		return function() {
			var sq = this;
			return {
				left: (sq._depth) * 200 + 'px',
				top: sq._top * 20 + 'px'
			}
		}
	}

	$scope.reg = [];
	$scope.sqs.forEach(function(sq) {
		if( $scope.reg[sq._depth] == undefined ) {
			$scope.reg[sq._depth] = [];
		}
		$scope.reg[sq._depth].push(sq);

		$scope.reg[sq._depth].sort(function(a,b) {
			if(sq._depth > 0) {
				if(a.streams[0] == b.streams[0]) {
					return a.name > b.name;
				}
				else return a.streams[0] > b.streams[0];
			}
			else return false;
		});
		sq._getStyle = getStyle();
	});

	function getTotalChildrenLength(sq) {
		var t = 0;
		sq._children.forEach(function(child) {
			t = t + getTotalChildrenLength(child);
		});
		return (t == 0) ?
			(sq._children.length == 0 ? 1 : sq._children.length) :
			t;
	}

	$scope.reg.forEach(function(sqs) {
		var total_children_len = 0;
		var parent_top = 0;
		for (var i = 0; i < sqs.length; i++) {
			if(sqs[i].hasOwnProperty('_streams')) {
				if( sqs[i]._streams[0].raw._children.indexOf(sqs[i]) === 0 ) {
					parent_top = sqs[i]._streams[0].raw._top;
					total_children_len = 0;
				}
			}
			sqs[i]._top = total_children_len + parent_top;
			total_children_len = total_children_len + (sqs[i]._children.length == 0 ? 1 : getTotalChildrenLength(sqs[i]));
		};
	});

	console.log($scope.reg);

	///////////////// make arrow 
	var multiplePos = { 'x': 200, 'y': 20 };

	$scope.arrows = [];
	$scope.sqs.forEach(function(sq) {
		if(sq.hasOwnProperty('_streams')) {
			sq._streams.forEach(function(str) {
				// console.log(sq)
				$scope.arrows.push({
					source: str.raw,
					target: sq,
					pos_source: [str.raw._depth * multiplePos.x, str.raw._top * multiplePos.y],
					pos_target: [sq._depth * multiplePos.x, sq._top * multiplePos.y]
				});
			});
		}
	});

	var svg = d3.select('svg');
	svg.selectAll('path')
		.data($scope.arrows)
		.enter()
		.append('path')
			.attr('d', function(d) {
				// console.log(d)
				return 'M' + [
					d.pos_source,
					d.pos_target
				].join('L');
			})
			.attr('stroke', '#0099ff')
			.attr('stroke-width', '1')
			.attr('transform', 'translate(10, 10)');
}

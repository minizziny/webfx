require(["/lib/jquery.js", "dashboard.js","/component/window.js"], 
	function(_$, kradar,Win) {


var layoutdata = {
	"rows": [
		{
			"cols": [
				{
					"w": 20,
					"rows": [
						{
							"cols": [
								{
									"w": 100,
									"guid": "프로세스 다운 모니터링"
								}
							],
							"h": 50
						},
						{
							"cols": [
								{
									"w": 100,
									"guid": "포트 다운 모니터링"
								}
							],
							"h": 50
						}
					]
				},
				{
					"w": 80,
					"rows": [
						{
							"cols": [
								{
									"w": 25,
									"guid": "CPU 이상"
								},
								{
									"w": 25,
									"guid": "메모리 이상"
								},
								{
									"w": 25,
									"guid": "디스크 사용량 이상"
								},
								{
									"w": 25,
									"guid": "디스크 병목"
								}
							],
							"h": 50
						},
						{
							"cols": [
								{
									"w": 50,
									"guid": "패킷 통신 추이"
								},
								{
									"w": 50,
									"guid": "TCP 연결 추이"
								}
							],
							"h": 50
						}
					]
				}
			],
			"h": 100
		}
	],
	"w": 100,
	"guid": "root"
}

$(".btn").on("click", function() {
					Win.open("#modalSaveQuery");
				});

var Box = kradar.ui.layout.box;

function NewBox() {
	return Box.create(layoutdata, true);
}

var box = NewBox();
box.appendTo(".f-page");

var txt1 = "<table class='table table-bordered table-condensed st' >\
	<tr>\
		<th>시각</th>\
		<th>Host</th>\
		<th>Process</th>\
	</tr>\
	<tr>\
		<td>02:10:33</td>\
		<td>auth01.ntreev.com</td>\
		<td>java.exe</td>\
	</tr>\
	<tr>\
		<td>02:07:10</td>\
		<td>auth01.ntreev.com</td>\
		<td>process</td>\
	</tr>\
</table>"

$($(".mybox").get(0)).append(txt1);

var txt2 = "<table class='table table-bordered table-condensed st' >\
	<tr>\
		<th>시각</th>\
		<th>Host</th>\
		<th>Protocol</th>\
		<th>Port</th>\
	</tr>\
	<tr>\
		<td>02:10:33</td>\
		<td>auth01.ntreev.com</td>\
		<td>TCP</td>\
		<td>8574</td>\
	</tr>\
	<tr>\
		<td>02:07:10</td>\
		<td>auth01.ntreev.com</td>\
		<td>TCP</td>\
		<td>80</td>\
	</tr>\
	<tr>\
		<td>11:54:32</td>\
		<td>auth01.ntreev.com</td>\
		<td>UDP</td>\
		<td>3372</td>\
	</tr>\
</table>"

$($(".mybox").get(1)).append(txt2);

var txt3 = "<table class='table table-bordered table-condensed st' >\
	<tr>\
		<th>Host</th>\
		<th>From</th>\
		<th>To</th>\
		<th>Max</th>\
		<th>Span</th>\
	</tr>\
	<tr>\
		<td>auth01 .ntreev.com</td>\
		<td>01:50:03</td>\
		<td>01:54:33</td>\
		<td>91%</td>\
		<td>4m 30s</td>\
	</tr>\
	<tr>\
		<td>auth01 .ntreev.com</td>\
		<td>00:33:23</td>\
		<td>00:38:03</td>\
		<td>94%</td>\
		<td>4m 40s</td>\
	</tr>\
</table>"

$($(".mybox").get(2)).append(txt3);


var txtmem = "<table class='table table-bordered table-condensed st' >\
	<tr>\
		<th>Host</th>\
		<th>From</th>\
		<th>To</th>\
		<th>Max</th>\
		<th>Span</th>\
	</tr>\
	<tr>\
		<td>auth01 .ntreev.com</td>\
		<td>01:10:33</td>\
		<td>01:13:56</td>\
		<td>91%</td>\
		<td>3m 23s</td>\
	</tr>\
	<tr>\
		<td>auth02 .ntreev.com</td>\
		<td>09:30:33</td>\
		<td>09:35:53</td>\
		<td>97%</td>\
		<td>5m 20s</td>\
	</tr>\
</table>"

$($(".mybox").get(3)).append(txtmem);


var txtdisk = "<table class='table table-bordered table-condensed st' >\
	<tr>\
		<th>Host</th>\
		<th>From</th>\
		<th>To</th>\
		<th>Max</th>\
		<th>Span</th>\
	</tr>\
	<tr>\
		<td>auth01  .ntreev.com</td>\
		<td>02:00:33</td>\
		<td>02:10:33</td>\
		<td>91%</td>\
		<td>10m</td>\
	</tr>\
	<tr>\
		<td>auth04 .ntreev.com</td>\
		<td>23:10:33</td>\
		<td>23:40:45</td>\
		<td>93%</td>\
		<td>30m 12s</td>\
	</tr>\
	<tr>\
		<td>auth05 .ntreev.com</td>\
		<td>23:10:33</td>\
		<td>23:40:25</td>\
		<td>93%</td>\
		<td>29m 52s</td>\
	</tr>\
</table>"

$($(".mybox").get(4)).append(txtdisk);


var txtbm = "<table class='table table-bordered table-condensed st' >\
	<tr>\
		<th>Host</th>\
		<th>From</th>\
		<th>To</th>\
		<th>Max</th>\
		<th>Min</th>\
		<th>Span</th>\
	</tr>\
	<tr>\
		<td>auth01 .ntreev .com</td>\
		<td>02:10:33</td>\
		<td>02:14:21</td>\
		<td>5</td>\
		<td>61</td>\
		<td>4m 48s</td>\
	</tr>\
	<tr>\
		<td>auth01 .ntreev .com</td>\
		<td>01:22:09</td>\
		<td>01:39:44</td>\
		<td>8</td>\
		<td>52</td>\
		<td>17m 35s</td>\
	</tr>\
</table>"

$($(".mybox").get(5)).append(txtbm);

$($(".mybox").get(6)).find("div.box7").append("<img src='chart1.png' class='q'>")
$($(".mybox").get(7)).find("div.box8").append("<img src='chart2.png' class='q'>")


});
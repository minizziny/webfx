require(["/lib/jquery.js", "/lib/knockout.js", "/core/connection.js"], 
	function(_$, ko, socket) {

	console.log("---developer console---");


	var txtMsg, txtOpts, btnRun, areaResp, areaResult, areaRaw;

	txtMsg = $("#txtMsg");
	txtOpts = $("#txtOpts");
	btnRun = $("#btnRun");
	areaResp = $("#areaResp");
	areaResult = $("#areaResult");
	areaRaw = $("#areaRaw");


	btnRun.on("click", function() {
		areaResult.show().text("waiting for response...");

		socket.send(txtMsg.val(), {}, function(m, raw) {
			areaResult.text("").hide();
			
			console.log(m);
			console.log(raw);

			m = JSON.stringify(m, null, "    ");
			raw = JSON.stringify(raw, null, "    ");
			areaResp.html(m);
			areaRaw.html(raw);
		});

	});

});
require(["/lib/jquery.js", "/core/connection.js", "/core/login.js"], 
	function(_$, socket, loginManager) {

	$("#btnLogin").on("click", function(e) {
		e.preventDefault();
		e.stopPropagation();

		var id = $("#txtId").val();
		var pw = $("#txtPassword").val();

		loginManager.doLogin(id, pw, function(m, raw) {
			console.log(raw)
			
			if(m.isError) {
				if(raw[0].errorCode === "already-logon"){
					alert(raw[0].errorCode);
				}
				else {
					alert(raw[0].errorMessage);
					return;
				}
			}

			location.href = "home.html";

		});
	});


});
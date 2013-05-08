define(['/core/connection.js','/lib/sha1-amd.js'], function(socket, CryptoJS) {



function doLogin(login_name, password, loginCallback) {
	socket.send("org.araqne.dom.msgbus.LoginPlugin.hello", {}, function(m,b,c) {

		var nonce = m.body.nonce;
		var hashedpwd = CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex);
		var hash = CryptoJS.SHA1(hashedpwd + nonce).toString(CryptoJS.enc.Hex);

		socket.send("org.araqne.dom.msgbus.LoginPlugin.login", {
			"nick": login_name,
			"hash": hash,
			"force": false
		}, function(m, raw) {

			console.log(raw)
			
			if(m.isError) {
				alert('로그인에 실패했습니다.');
				return;
			}


			if(m.body.result === "success") {

				socket.send("org.araqne.logdb.msgbus.ManagementPlugin.login", {
					"login_name": "araqne",
					"password": ""
				}, loginCallback);

			}


		});
	});
}

function doLogout() {
	var logout1 = "org.araqne.logdb.msgbus.ManagementPlugin.logout";
	var logout2 = "org.araqne.dom.msgbus.LoginPlugin.logout";
	socket.send(logout1, {}, function(m, raw) {
		console.log(raw);

		if(m.isError) {
			alert(raw[0].errorMessage);
			return;
		}

		console.log("logdb session closed")

		socket.send(logout2, {}, function(m2, raw2) {

			console.log(raw2);

			if(m.isError) {
				alert(raw[0].errorMessage);
				return;
			}

			location.href = "index.html";

		});
	})
}

return {
	"doLogin": doLogin,
	"doLogout": doLogout
}

});
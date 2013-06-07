define(['/core/connection.js','/lib/sha1-amd.js'], function(socket, CryptoJS) {



function doLogin(login_name, password, loginCallback) {
	socket.send("org.araqne.dom.msgbus.LoginPlugin.hello", {}, function(m,b,c) {

		var nonce = m.body.nonce;
		var hashedpwd = CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex);
		var hash = CryptoJS.SHA1(hashedpwd + nonce).toString(CryptoJS.enc.Hex);

		sendLogin(login_name, hash, loginCallback, false);
	});
}

function sendLogin(login_name, hash, loginCallback, isForce) {
	socket.send("org.araqne.dom.msgbus.LoginPlugin.login", {
		"nick": login_name,
		"hash": hash,
		"force": isForce
	}, function(m, raw) {

		console.log(raw)
		
		if(m.isError) {
			var ec = raw[0].errorCode;
			if(ec == 'admin-not-found') {
				alert('로그인에 실패했습니다. 사용자를 찾을 수 없습니다.');
			}
			else if(ec == 'invalid-password') {
				alert('로그인에 실패했습니다. 암호가 틀립니다.');
			}
			else if(ec == 'invalid-otp-password'){
				alert('로그인에 실패했습니다. OTP 암호가 틀립니다.');
			}
			else if(ec == 'expired-password') {
				alert('로그인에 실패했습니다. 암호가 만료되었습니다.');
			}
			else if(ec == 'not-trust-host') {
				alert('로그인에 실패했습니다. 신뢰할 수 없는 호스트입니다.');
			}
			else if(ec == 'locked-admin') {
				alert('로그인에 실패했습니다. 사용자 계정이 잠겨있습니다.');
			}
			else if(ec == 'max_session') {
				console.log(m)

				var loginName = m.body.login_name;
				var ip = m.body.ip;
				var decision = confirm('최대 동시 접속자 수를 초과했습니다. 현재 ' + ip + '에서 사용자 ' + loginName + '이 접속중입니다.\n강제로 연결을 끊고 접속하시겠습니까?');
				if(decision) {
					sendLogin(login_name, hash, loginCallback, true);
				}
			}
			else {
				alert('로그인에 실패했습니다.\n코드: ' + ec);	
			}
			return;
		}


		if(m.body.result === "success") {

			socket.send("org.araqne.logdb.msgbus.ManagementPlugin.login", {
				"login_name": "araqne",
				"password": ""
			}, loginCallback);

		}
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

			location.href = "/";

		});
	})
}

return {
	"doLogin": doLogin,
	"doLogout": doLogout
}

});
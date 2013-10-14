define(['/core/connection.js','/lib/sha1-amd.js'], function(socket, CryptoJS) {

var $injector = angular.injector(['ng', 'localization']);
var filter;

$injector.invoke(function($filter){
	filter = $filter;
});

function doLogin(login_name, password, nonce, loginCallback) {
	var hashedpwd = CryptoJS.SHA1(password).toString(CryptoJS.enc.Hex);
	var hash = CryptoJS.SHA1(hashedpwd + nonce).toString(CryptoJS.enc.Hex);

	sendLogin(login_name, password, hash, loginCallback, false);
}

function sendLogin(login_name, plain_password, hash, loginCallback, isForce) {
	socket.send("org.araqne.dom.msgbus.LoginPlugin.login", {
		"nick": login_name,
		"hash": hash,
		"force": isForce
	}, function(m, raw) {

		console.log(raw)
		
		if(m.isError) {
			var ec = raw[0].errorCode;
			if(ec == 'admin-not-found') {
				alert(filter('i18n')('$S_msg_LoginErrorAdminNotFound'));
			}
			else if(ec == 'invalid-password') {
				alert(filter('i18n')('$S_msg_LoginErrorInvalidPassword'));
			}
			else if(ec == 'invalid-otp-password'){
				alert(filter('i18n')('$S_msg_LoginErrorInvalidOtpPassword'));
			}
			else if(ec == 'expired-password') {
				alert(filter('i18n')('$S_msg_LoginErrorExpiredPassword'));
			}
			else if(ec == 'not-trust-host') {
				alert(filter('i18n')('$S_msg_LoginErrorNotTrustHost'));
			}
			else if(ec == 'locked-admin') {
				alert(filter('i18n')('$S_msg_LoginErrorLockedAdmin'));
			}
			else if(ec == 'max_session') {
				console.log(m)

				var loginName = m.body.login_name;
				var ip = m.body.ip;
				var decision = confirm(filter('i18n')('$S_msg_LoginConfirmMaxSession', ip, loginName));
				if(decision) {
					sendLogin(login_name, hash, loginCallback, true);
				}
			}
			else {
				alert('Login Failed.\nCode: ' + ec);	
			}
			return;
		}


		if(m.body.result === "success") {

			socket.send("org.araqne.logdb.msgbus.ManagementPlugin.login", {
				"login_name": login_name,
				"password": plain_password
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
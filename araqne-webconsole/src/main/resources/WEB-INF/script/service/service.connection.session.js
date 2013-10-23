angular.module('app.connection.session', [])
.factory('serviceSession', function(socket, $translate, $rootScope) {
	function login(id, pw, nonce, successFn) {
		var hashedPw = CryptoJS.SHA1(pw).toString(CryptoJS.enc.Hex);
		var hash = CryptoJS.SHA1(hashedPw + nonce).toString(CryptoJS.enc.Hex);

		socket.send('org.araqne.dom.msgbus.LoginPlugin.login', {
			'nick': id,
			'hash': hash,
			'force': false
		}, 0)
		.success(function(m) {
			socket.send('org.araqne.logdb.msgbus.ManagementPlugin.login', {
				'login_name': id,
				'password': pw
			}, 0)
			.success(successFn);
		})
		.failed(function(m, raw) {
			var ec = raw[0].errorCode;
			
			if(ec == 'admin-not-found') {
				alert($translate('$S_msg_LoginErrorAdminNotFound'));
			}
			else if(ec == 'invalid-password') {
				alert($translate('$S_msg_LoginErrorInvalidPassword'));
			}
			else if(ec == 'invalid-otp-password'){
				alert($translate('$S_msg_LoginErrorInvalidOtpPassword'));
			}
			else if(ec == 'expired-password') {
				alert($translate('$S_msg_LoginErrorExpiredPassword'));
			}
			else if(ec == 'not-trust-host') {
				alert($translate('$S_msg_LoginErrorNotTrustHost'));
			}
			else if(ec == 'locked-admin') {
				alert($translate('$S_msg_LoginErrorLockedAdmin'));
			}
			else if(ec == 'max_session') {
				console.log(m)

				var loginName = m.body.login_name;
				var ip = m.body.ip;
				var decision = confirm($translate('$S_msg_LoginConfirmMaxSession', ip, loginName));
				if(decision) {
					sendLogin(login_name, hash, loginCallback, true);
				}
			}
			else {
				alert('Login Failed.\nCode: ' + ec);	
			}
		});
	}

	function logout(callback) {
		socket.send('org.araqne.logdb.msgbus.ManagementPlugin.logout', {}, 0)
		.success(function(m) {
			socket.send('org.araqne.dom.msgbus.LoginPlugin.logout', {}, 0)
			.success(function() {
				if(!!callback) {
					callback();
				}
			});
		});
	}

	function getPrincipal(options) {

		options = $.extend({}, options);

		socket.send("org.araqne.dom.msgbus.LoginPlugin.getPrincipal", {}, 0)
		.success(function(m) {
			if(m.body.admin_login_name == null && m.body.org_domain == null) {
				if(location.hash != '#/' && location.hash != '') {
					location.href = '/';
					location.hash = '';
				}
				else {
					if(!!options.not_logged_in) {
						options.not_logged_in();
					}
				}
			}
			else {
				setCurrentUser(m.body.admin_login_name);
				if(!!options.logged_in) {
					options.logged_in();
				}
			}
		});
	}

	var currentUser;

	function setCurrentUser(id) {
		currentUser = id;
	}

	function whoAmI() {
		return currentUser;
	}


	return {
		login: login,
		logout: logout,
		getPrincipal: getPrincipal,
		whoAmI: whoAmI
	}
});
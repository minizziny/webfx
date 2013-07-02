define(["/lib/jquery.js", "/core/locale.js", "/core/connection.js", "/component/list.js", "/lib/knockout.js"], function(_$, Locale, socket, List, ko) {

	var pids = [];

	function getPid() {
		var pid = Math.round(Math.random() * 1000);

		if(pids.indexOf(pid) === -1) {
			pids.push(pid);
			return pid.toString();
		}
		else {
			return getPid();
		}
	}

	var programManager = (function() {

		var programs;
		var packs;

		this.getPrograms = function(callback) {
			if(!programs || !packs) {
				socket.send("org.araqne.dom.msgbus.ProgramPlugin.getAvailablePrograms", {}, function(m) {
					console.log(m)
					programs = m.body.programs;
					packs = m.body.packs;

					function findProgramByPath(path) {
						var found = this.programs.filter(function(obj) {
							return obj.path == path;
						});
						if(found.length > 0) return found[0];
						else {
							var msg = 'Cannot find program.';
							alert(msg);
							throw new ReferenceError(msg);
						}
					}

					$.each(packs, function(i, pack) {
						$.each(pack.programs, function(j, program) {
							program.icon = ko.observable("/images/app.png");
							var appicon = "package/" + pack.dll + "/" + program.path + "/icon.png";
							$.get(appicon, function() {
								program.icon(appicon);
								//console.clear();
							});
						});

						pack.findProgramByPath = findProgramByPath;
					});

					callback(packs, programs);
				});
			}
			else {
				console.log("getAvailablePrograms cache");
				callback(packs, programs);
			}
		}

		this.findProgram = function(path, packName) {
			var pack = findPackByName(packName);
			if(!!pack) {
				return pack.findProgramByPath(path);
			}
			
			return;
		}

		this.go = function(program) {
			var iframes = $(".mainframe iframe");
			iframes.hide();

			var current = $(".mainframe iframe[data-program=" + program.path + "]")

			if(current.length == 1) {
				current.show();
				if(current.get(0).contentWindow.onArgumentSent != undefined) {
					current.get(0).contentWindow.onArgumentSent(program.args);
				}
			}
			else if(current.length == 0) {
				this.launch(program);
			}

			$("title").text(window.Global.Config.productName + " | " + program.name);
		}

		function findPackByName(name) {
			var found;
			$.each(packs, function(i, obj) {
				if(obj.name === name) {
					found = obj;
					return false;
				}
			});

			if(!!found) {
				return found;
			}
			else {
				var msg = 'Cannot find program pack.';
				alert(msg);
				throw new ReferenceError(msg);
			}
		}

		this.launch = function(program) {
			var packdll = findPackByName(program.pack).dll;
			var localedUrl = "package/" + packdll + "/" + program.path + "/index." + Locale.getCurrentLocale() + ".html";
			var defUrl = "package/" + packdll + "/" + program.path + "/index.html";
			if(Locale.getCurrentLocale() == "en") {
				localedUrl = defUrl;
			}

			var iframe = $("<iframe>").attr("data-program", program.path)
					.addClass("v-stretch")
					.addClass("h-stretch")
					.appendTo(".mainframe");

			var request = $.ajax({
				url: localedUrl,
				//type: 'POST',
				//data: {},
				success: function() {
					iframe.attr("src", localedUrl);
				},
				error: function() {
					iframe.attr("src", defUrl);
					//console.clear();
				},
				complete: function() {
					var loadingdiv = $("<div>").css("position", "absolute")
							.css("background-color", "#eee")
							.css("top", "0px")
							.css("left", "0px")
							.addClass("v-stretch")
							.addClass("h-stretch")
							.append("<img src='/images/ajax-loader.gif' class='ajax-loader'>")
							.appendTo(".mainframe")

					$(iframe.get(0).contentDocument).ready(function($) {
						setTimeout(function() {
							loadingdiv.fadeOut(function() {
								$(this).remove();
								if(iframe.get(0).contentWindow.onArgumentSent != undefined) {
									iframe.get(0).contentWindow.onArgumentSent(program.args);
								}
							});

							iframe.get(0).contentWindow.__pid = getPid();
						}, 300)
					});
				}
			})
		}

		this.exit = function(program) {
			var iframe = $(".mainframe iframe[data-program=" + program.path + "]");
			iframe.remove();
		}

		return {
			go: go,
			launch: launch,
			exit: exit,
			getPrograms: getPrograms,
			findProgram: findProgram
		}
	})();

	
	var Core = parent.Core;
	if(!Core) {
		Core = parent.Core = {};
	}

	if(!Core.Program) {
		console.log("register Program manager globally");
		parent.Core.Program = programManager;
	}

	return Core.Program;
});
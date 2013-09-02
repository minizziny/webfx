require([
	"/lib/jquery.js",
	"/lib/knockout.js",
	"/core/connection.js",
	"/core/program.js",
	"/core/locale.js",
	"/core/page.js",
	"/core/logdb.js",
	"/component/list.js",
	"/component/util.js",
	"/core/login.js"
], 

function(_$, ko, socket, programManager, Locale, pageManager, logdbManager, List, Util, loginManager) {

	var vmTasks;
	var nonce;

	(function() {
		var container = $(".navbar-fixed-bottom #task");
		vmTasks = new List.ViewModel([]);

		vmTasks.onSelect = function(program) {
			$("#div-launcher").hide();
			$("#start").removeClass("active");

			$(".mainframe").removeClass("blurry");
			
			Core.Program.go(program);
		}

		vmTasks.onBeforeRemove = function(program) {
			if(vmTasks.length() == 1) return false;
		}

		vmTasks.onAfterRemove = function(program) {
			var pid = parseInt($('iframe[data-program=' + program.path + ']').attr('pid'));

			if(!!window._logdb) {
				var qmap = _logdb.queries.map(function(qInst) {
					if(qInst.getPid() == pid) return qInst;
				});

				qmap.forEach(function(instance) {
					console.log(instance)
					instance.dispose();
					var idx = _logdb.queries.indexOf(instance);
					_logdb.queries.splice(idx, 1);
					_logdb.$apply();
				});
			}

			Core.Program.exit(program);
			setTimeout(function() {
				vmTasks.selectAt(vmTasks.length() - 1);
			}, 5);
			
		}

		ko.applyBindings(vmTasks, container.get(0));
	})();

	function runProgram(program, args) {
		$("#div-launcher").hide();
		$("#start").removeClass("active");

		$(".mainframe").removeClass("blurry");

		var found = false;
		var foundprogram;
		$.each(vmTasks.items(), function(i, obj){
			if(obj.path === program.path && obj.pack === program.pack) {
				found = true;
				foundprogram = obj;
				return false;
			}
		})
		
		if(!found) {
			program.args = args;
			vmTasks.add(program);
			vmTasks.select(program);
		}
		else {
			foundprogram.args = args;
			vmTasks.select(foundprogram);
		}
	}

	var getPrograms = function() {
		Core.Program.getPrograms(function(packs, programs) {
			
			$.each(packs, function(i, pack) {

				var vmPrograms = new List.ViewModel(pack.programs);
				vmPrograms.pack = pack;
				vmPrograms.run = runProgram;

				if(pack.name === "System") {
					ko.applyBindings(vmPrograms, document.getElementById("pack-system"));
				}
				else {
					var page = $('<div data-bind="Kuro.List: self, tmpl: launcher" class="box-pack"></div>').appendTo("#pack-all");
					ko.applyBindings(vmPrograms, page.get(0));
				}
			});
			afterworks();
		});

		$("#start").on("click", function() {
			if($("#div-launcher").is(":hidden")) {
				$("#start").addClass("active");
				$("#div-launcher").fadeIn('fast', function() {
					$(".mainframe").addClass("blurry");
				});
			}
			else {
				$("#start").removeClass("active");
				$("#div-launcher").hide();

				$(".mainframe").removeClass("blurry");
			}
		});

	};


	function afterworks() {
		var entry = pageManager.urlParam("program");
		var entrypack = pageManager.urlParam("pack");
		if(entry == null) {
			entry = "starter";
		}

		if(entrypack == null) {
			entrypack = 'System';
		}

		var program = Core.Program.findProgram(entry, entrypack);
		if(program == undefined) {
			program = {
				display_names: {
					ko: entry,
					en: entry
				},
				name: entry,
				path: entry,
				pack: entrypack
			}
		}
		runProgram(program);
	}

	window.Core.Program.run = function(programPath, packageName, args) {
		var program = Core.Program.findProgram(programPath, packageName);
		runProgram(program, args);

	}

	$("#logout").on('click', function() {
		loginManager.doLogout();
	});

	$("#txtId").focus();

	function Hello() {
		socket.send("org.araqne.dom.msgbus.LoginPlugin.hello", {}, function(m) {
			nonce = m.body.nonce;
			console.log('ok araqne');
			$('#btnLogin').removeAttr('disabled').on("click", function(e) {
				e.preventDefault();
				e.stopPropagation();

				var id = $("#txtId").val();
				var pw = $("#txtPassword").val();

				loginManager.doLogin(id, pw, nonce, function(m, raw) {
					
					if(m.isError) {
						console.log(raw)
						if(raw[0].errorCode === "already-logon"){
							alert(raw[0].errorCode);
						}
						else {
							alert(raw[0].errorMessage);
							return;
						}
					}
					$("#login").hide();
					Core.Dom = {
						'login_name': id
					};
					$('#lblLoginName').text(id);
					getPrograms();

					
				});
			});
		});
	}

	setTimeout(Hello, 10);
});
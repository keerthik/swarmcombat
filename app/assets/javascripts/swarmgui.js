// GUI systems for the swarm game

var myCode = "";
var theirCode = "";
// 'me' has to be assigned on joining the game, as 0 or 1. This is done by the rails game/show.html.erb
var me = 0;
var current_code = null;
var current_marked_code = null;
var opponentReady = false;
var readyFunc;
var server = "";
var gameserver = "";
var check_ready = setInterval(checkReady,5000);
var spectating = false;
var gui_mode = true;
var link_counter = 0;

function getServer() {
	server = (document.URL).split('/games')[0];
	if (server.indexOf("file:") !== -1) {
		console.log("Local testing");
		server = "";
		return;
	}
	gameserver = (!spectating)?document.URL:(document.URL).split('/watch')[0];
	//console.log(server);
}

function CreateGUI() {
	getServer();
	console.log("Making UI");
	$("#game_ui")
	.append('<input id="simulate" type="button" class="btn btn-large btn-success disabled" value="Simulate" disabled />');

	/*$("#game_ui")
	.append('<div class="pop-up code"><span class="value">drone</span>' +
				'<select>' +
					'<option>NearestEnemy</option>' +
					'<option>WeakestEnemy</option>' +
				'<select></div>');*/
	
	checkReady();
	if (!spectating) {
		$("#game_ui")
		.append('<br><br><input id="testMode" type="checkbox" value="TestMode">Test Mode<br><br>');

		if (gui_mode) {
			GuideGUI();
		}
		else
			GUIPassOne();

		$("#game_ui")
		.append('<input type="button" class="btn btn-primary ready" value="Send Instructions" />');
	}

	var simulating = false;
	$("#simulate")
		.click(function(){
			if (!simulating) {
				simulating = true;
				InitializeGame();
				$.get(gameserver+'/get_code', function(data) {
					if (spectating) {
						myCode = data['code0'];
						theirCode = data['code1'];
					}
					else {
						test = $('#testMode').attr('checked')=='checked';
						myCode = data['code' + me];
						theirCode = test?'Retreat();':data['code' + (1-me)];
					}
					AssignCode();
					PrepareExecution();
				});
			}
		});
	
	$(".ready")
		.click(function(){
			readyFunc();	
		});
}

function GUITest() {
	/* TEST GUI
	*/
	var defaultgreen = "Attack(NearestEnemy());";
	var defaultred = "Attack(NearestEnemy());";
	$("#game_ui")
	.append('Green: <input type="text" id="greenstruction" value="'+defaultgreen+'"><br>');
	$("#game_ui")
	.append('Red: <input type="text" id="redstruction" value="'+defaultred+'"><br>');
	$("#game_ui")
	.append('<input id="ready" type="button" class="btn btn-primary" value="Ready!" />');
	
	readyFunc = function () {
		test = $('#testMode').attr('checked')=='checked';
		myCode = (me == 0)?$('#greenstruction').val():($('#redstruction').val());
		theirCode = (me == 1)?$('#greenstruction').val():($('#redstruction').val());
		PrepareExecution();
	};
} 

var requesting_or_returned = false;
function GUIPassOne() {
/* Pass one
*/
	var condition_re = /\/\*cond\*\/(.+?)\/\*cond\*\//g;
	var conditions = [];
	var temp;
	while(temp = condition_re.exec(current_code)) {
		conditions.push(temp[1]);
	}

	var action_re = /\/\*act\*\/(.+?)\/\*act\*\//g;
	var actions = [];
	while(temp = action_re.exec(current_code)) {
		actions.push(temp[1]);
	}

	var defaultCondition = "self.hp > 0.5*self.maxhp";
	var defaultAction = "Attack(NearestEnemy())";
	$("#game_ui")
	.append('<div id="priority_queue"></div>');
	if (actions.length > 0) {
		for (var i = 0; i < actions.length; i++) {
			if (conditions[i])
				addGUIUnit(conditions[i], actions[i]);
			else
				addGUIUnit("", actions[i]);
		}

	}
	else
		addGUIUnit(defaultCondition, defaultAction);
	$(".add_row_up")
		.click(function() {
			$(this).closest($(".gui_unit")).before($(this).closest($(".gui_unit")).clone(true));
		});
	$(".add_row_down")
		.click(function() {
			$(this).closest($(".gui_unit")).after($(this).closest($(".gui_unit")).clone(true));
		});
	$(".move_row_up")
		.click(function() {
			$(this).closest($(".gui_unit")).insertBefore($(this).closest($(".gui_unit")).prev(".gui_unit"));
			$(this).focus();
		});
	$(".move_row_down")
		.click(function() {
			$(this).closest($(".gui_unit")).insertAfter($(this).closest($(".gui_unit")).next(".gui_unit"));
			$(this).focus();
		});
	
	readyFunc = function() {
		CompileCode();
		if (!verified) {
			console.log("Code unverified...Please verify code");
			return;
		}

		if (requesting_or_returned) {
			console.log("Already ")
			return;
		}
		if (server == "") {
			console.log("Not connected to server, no functionality");
			return;
		}
		// Use a timered loop to check for opponent ready
		// TODO: Determine actual game number (from the URL?)
		requesting_or_returned = true;
		var addr = [gameserver, 'ready'].join('/');
		// TODO: Post my ready state and code to the server
		$.get(addr, 
			{pid: me, format: 'json', mycode: myCode}, 
			function(data) {
				alert("Instructions Sent!");
				if (data['ready']) {
					$("#simulate").attr('class', 'btn btn-large btn-success');
					$("#simulate").removeAttr("disabled");
					clearInterval(check_ready);
				}
			})
		.error(function() {
			requesting_or_returned = false;
			alert("Unable to Connect to Server...Try Again");
		});

		/*function request_opponent_deployment () {
			test = $('#testMode').attr('checked')=='checked';
			console.log(test);
			requesting_or_returned = true;
			// Query the server for update after a second
			$.doTimeout(1000, function () {
				$.get(addr, 
					{pid: me, format: 'json', mycode: myCode}, 
					opponent_deployment)
				.error(function() {
					requesting_or_returned = false;
					alert("Unable to Connect to Server...Try Again");
				});
			});
		}

		var opponent_deployment = function (data) {
			test = $('#testMode').attr('checked')=='checked';
			opponentReady = test||data['ready'];
			// TODO: myCode should be cross-verified via the server to make sure no shenaniganry
			myCode = data['code' + me];
			theirCode = test?'Retreat();':data['code' + (1-me)];
			// Let the games begin!
			if (opponentReady) {
				// Assign code to all drones
				AssignCode();
				// Flip the flag to allow the game to run
				PrepareExecution();
				// Upload orders to database
				UploadOrders();
			// Or not...yet
			} else {
				request_opponent_deployment();
			}
		}
		// Get opponent code and ready state from the server
		request_opponent_deployment();*/
	};

}

function GuideGUI() {
/* Pass one
*/
	var condition_re = /\/\*cond\*\/(.+?)\/\*cond\*\//g;
	var conditions = [];
	var temp;
	while(temp = condition_re.exec(current_marked_code)) {
		conditions.push(temp[1]);
	}

	var action_re = /\/\*act\*\/(.+?)\/\*act\*\//g;
	var actions = [];
	while(temp = action_re.exec(current_marked_code)) {
		actions.push(temp[1]);
	}

	var defaultCondition = "<a href='javascript:void(0);' class='invalid' onClick='selectItem(this);'>(Boolean)</a>";
	var defaultAction = "<a href='javascript:void(0);' class='invalid' onClick='selectItem(this);'>(Action)</a>";
	$("#game_ui")
	.append('<div id="priority_queue"></div>');
	if (actions.length > 0) {
		for (var i = 0; i < actions.length; i++) {
			if (conditions[i])
				addGuideUnit(conditions[i], actions[i]);
			else
				addGuideUnit("", actions[i]);
		}

	}
	else
		addGuideUnit(defaultCondition, defaultAction);
	$(".add_row_up")
		.click(function() {
			$(this).closest($(".gui_unit")).before($(this).closest($(".gui_unit")).clone(true));
		});
	$(".add_row_down")
		.click(function() {
			$(this).closest($(".gui_unit")).after($(this).closest($(".gui_unit")).clone(true));
		});
	$(".move_row_up")
		.click(function() {
			$(this).closest($(".gui_unit")).insertBefore($(this).closest($(".gui_unit")).prev(".gui_unit"));
			$(this).focus();
		});
	$(".move_row_down")
		.click(function() {
			$(this).closest($(".gui_unit")).insertAfter($(this).closest($(".gui_unit")).next(".gui_unit"));
			$(this).focus();
		});
	
	readyFunc = function() {
		CompileGuideCode();
		if (!verified) {
			console.log("Code unverified...Please verify code");
			return;
		}

		if (requesting_or_returned) {
			console.log("Already ")
			return;
		}
		if (server == "") {
			console.log("Not connected to server, no functionality");
			return;
		}
		// Use a timered loop to check for opponent ready
		// TODO: Determine actual game number (from the URL?)
		var addr = [gameserver, 'ready'].join('/');
		// TODO: Post my ready state and code to the server
		/*$.get(addr, 
			{pid: me, format: 'json', mycode: myCode}, 
			function(data) {
				alert("Instructions Sent!");
				if (data['ready']) {
					$("#simulate").attr('class', 'btn btn-large btn-success');
					$("#simulate").removeAttr("disabled");
					clearInterval(check_ready);
				}
			})
		.error(function() {
			requesting_or_returned = false;
			alert("Unable to Connect to Server...Try Again");
		});*/

		/*function request_opponent_deployment () {
			test = $('#testMode').attr('checked')=='checked';
			console.log(test);
			requesting_or_returned = true;
			// Query the server for update after a second
			$.doTimeout(1000, function () {
				$.get(addr, 
					{pid: me, format: 'json', mycode: myCode}, 
					opponent_deployment)
				.error(function() {
					requesting_or_returned = false;
					alert("Unable to Connect to Server...Try Again");
				});
			});
		}

		var opponent_deployment = function (data) {
			test = $('#testMode').attr('checked')=='checked';
			opponentReady = test||data['ready'];
			// TODO: myCode should be cross-verified via the server to make sure no shenaniganry
			myCode = data['code' + me];
			theirCode = test?'Retreat();':data['code' + (1-me)];
			// Let the games begin!
			if (opponentReady) {
				// Assign code to all drones
				AssignCode();
				// Flip the flag to allow the game to run
				PrepareExecution();
				// Upload orders to database
				UploadOrders();
			// Or not...yet
			} else {
				request_opponent_deployment();
			}
		}
		// Get opponent code and ready state from the server
		request_opponent_deployment();*/
	};

}

function addGUIUnit(condition, action) {
	$("#priority_queue")
	.append(
		'<div id="gui_unit_0" class="gui_unit">' +
			'<input type="button" class="btn move_row_up" value="^" />' +
			'<input type="button" class="btn add_row_up" value="^ +" />' +
			'  <input type="text" class="condition" value="'+condition+'">  ' +
			'  <input type="text" class="action" value="'+action+'">  ' +
			'<input type="button" class="btn add_row_down" value="+ v" />' +
			'<input type="button" class="btn move_row_down" value="v" />' +
		'</div>');
}

function addGuideUnit(condition, action) {
	$("#priority_queue")
	.append(
		'<div id="gui_unit_0" class="gui_unit">' +
			'<input type="button" class="btn move_row_up" value="^" />' +
			'<input type="button" class="btn add_row_up" value="^ +" />' +
			'  <div class="gui_well"><div class="well well-small">'+condition+'</div></div>  ' +
			'  <div class="gui_well"><div class="well well-small">'+action+'</div></div>  ' +
			'<input type="button" class="btn add_row_down" value="+ v" />' +
			'<input type="button" class="btn move_row_down" value="v" />' +
		'</div>');
}

function selectItem(element) {
	var select_options = [];
	if (element.text == "(Boolean)") {
		select_options = ["==", ">", "<", ">=", "<="];
		for (var key in docs) {
			if (docs.hasOwnProperty(key) && docs[key]['type'] == "boolean")
				select_options.push(key);
		}
	}

	var options_string = "";
	for (var i = 0; i < select_options.length; i++) {
		options_string += "<option>" + select_options[i] + "</option>";
	}
	$(element).removeAttr("href");
	$(element).removeAttr("onClick");
	$(element).prepend('<div class="pop-up code"><span class="value">drone</span>' +
				'<select>' +
					options_string +
				'<select></div>');
}

function checkReady() {
	getServer();
	$.get(gameserver+'/is_ready', function(data) {
		if (data['ready']) {
			$("#simulate").attr('class', 'btn btn-large btn-success');
			$("#simulate").removeAttr("disabled");
			clearInterval(check_ready);
		}
	});
}

var verified = false;
function VerifyCode() {
	verified = true;
}
function CompileCode() {
	if (!verified) VerifyCode();
	var units = $("#priority_queue").children(".gui_unit");
	var tempCode = "";
	units.each( function (index) {
		tempCode += "if (/*cond*/" + $(this).children(".condition").val() + "/*cond*/) ";
		tempCode += "/*act*/" + $(this).children(".action").val() + "/*act*/; else ";
	});
	tempCode += "{ }";
	console.log(tempCode);
	myCode = tempCode;
}

function CompileGuideCode() {
	if (!verified) VerifyCode();
	var units = $("#priority_queue").children(".gui_unit");
	var tempCode = "";
	units.each( function (index) {
		console.log($(this).children(".condition"));
	});
}

function DecompileCode(code) {
	var stuff = code.split("if (");
	
	//var units = $("#priority_queue").children(".gui_unit");

}

function AssignCode() {
	Crafty("Trisim").each(function(){
		this.data.instructions = (this.data.owner == me)?myCode:theirCode;
	});
	Crafty("Diasim").each(function(){
		this.data.instructions = (this.data.owner == me)?myCode:theirCode;
	});
}

function UploadOrders() {
	if (server == "") return;
	var addr = [server, 'orders', 'create'].join('/');
	$.post(addr,
		{order:{'name': "Kickass Strat", 'content': myCode}},
		function(data) {
			// Proceed if verified
			//console.log(data);
			// Handle verification fail
		})
		.error(function() {
			alert("Unable to Connect to Server");
		});
}
// GUI systems for the swarm game

var myCode = "";
var theirCode = "";
// TODO: 'me' has to be assigned on joining the game, as 0 or 1
var me = 0;
var opponentReady = false;
var readyFunc;
var server = "";
var gameserver = "";

function getServer() {
	server = (document.URL).split('/games')[0];
	if (server.indexOf("file:") !== -1) {
		console.log("Local testing");
		server = "";
		return;
	}
	gameserver = document.URL;
	console.log(server);
}

function CreateGUI() {
	getServer();
	console.log("Making UI");
	$("#game_ui")
	.append('<input id="resimulate" type="button" class="btn btn-danger" value="Re-Simulate" />');

	$("#game_ui")
	.append('<br><br><input id="testMode" type="checkbox" value="TestMode">Test Mode<br><br>');
	
	$("#game_ui")
	.append('<input type="button" class="btn btn-primary ready" value="Ready!" />');

	GUIPassOne();

	$("#game_ui")
	.append('<input type="button" class="btn btn-primary ready" value="Ready!" />');
	
	$("#resimulate")
		.click(function(){
			InitializeGame();
			AssignCode();
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
	var defaultCondition = "self.hp > 0.5*self.maxhp";
	var defaultAction = "Attack(NearestEnemy())";
	$("#game_ui")
	.append('<div id="priority_queue"></div>');
	$("#priority_queue")
	.append(
		'<div id="gui_unit_0" class="gui_unit">' +
			'<input type="button" class="btn move_row_up" value="^" />' +
			'<input type="button" class="btn add_row_up" value="^ +" />' +
			'  <input type="text" class="condition" value="'+defaultCondition+'">  ' +
			'  <input type="text" class="action" value="'+defaultAction+'">  ' +
			'<input type="button" class="btn add_row_down" value="+ v" />' +
			'<input type="button" class="btn move_row_down" value="v" />' +
		'</div>');
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
		var addr = [gameserver, 'ready'].join('/');
		// TODO: Post my ready state and code to the server

		function request_opponent_deployment () {
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
		request_opponent_deployment();
	};

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
		tempCode += "if (" + $(this).children(".condition").val() + ")\n";
		tempCode += "\t" + $(this).children(".action").val() + ";\n else ";
	});
	tempCode += "{ }";
	console.log(tempCode);
	myCode = tempCode;
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
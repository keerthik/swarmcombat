// GUI systems for the swarm game

var myCode = "";
var theirCode = "";
// TODO: 'me' has to be assigned on joining the game, as 0 or 1
var me = 0;
var test = true;
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
	.append('<input type="button" class="btn btn-primary ready" value="Ready!" />');

	//GUIPassOne();
	GUIPassOne();

	$("#game_ui")
	.append('<input type="button" class="btn btn-primary ready" value="Ready!" />');
	
	$(".ready")
		.click(function(){
			readyFunc();	
		});
}

function GUITest() {
	/* TEST GUI
	*/
	var defaultgreen = "attack(NearestEnemy());";
	var defaultred = "attack(NearestEnemy());";
	$("#game_ui")
	.append('Green: <input type="text" id="greenstruction" value="'+defaultgreen+'"><br>');
	$("#game_ui")
	.append('Red: <input type="text" id="redstruction" value="'+defaultred+'"><br>');
	$("#game_ui")
	.append('<input type="button" class="btn btn-primary" id="ready" value="Ready!" />');
	
	readyFunc = function () {
		opponentReady = test;
		myCode = (me == 0)?$('#greenstruction').val():($('#redstruction').val());
		theirCode = (me == 1)?$('#greenstruction').val():($('#redstruction').val());
		PrepareExecution();
	};
} 

var requesting_or_returned = false;
function GUIPassOne() {
/* Pass one
*/
	var defaultCondition = "data.hp > 0.5*data.maxhp";
	var defaultAction = "attack(NearestEnemy())";
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
			$(this).closest($(".gui_unit")).before($("#gui_unit_0").clone(true));
		});
	$(".add_row_down")
		.click(function() {
			$(this).closest($(".gui_unit")).after($("#gui_unit_0").clone(true));
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
		var gid = 0;
		var addr = [gameserver, 'ready'].join('/');
		// TODO: Post my ready state and code to the server

		function request_opponent_deployment () {
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
			console.log(data);
			opponentReady = data['ready'];
			// TODO: myCode should be cross-verified via the server to make sure no shenaniganry
			myCode = data['code' + me];
			theirCode = data['code' + (1-me)];
			console.log(opponentReady);
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
		CompileCode();
		request_opponent_deployment();
	};

}

function CompileCode() {
	var units = $("#priority_queue").children(".gui_unit");
	var tempCode = "";
	units.each( function (index) {
		tempCode += "if(" + $(this).children(".condition").val() + ")\n";
		tempCode += "\t" + $(this).children(".action").val() + ";\nelse";
	});
	tempCode += "{}";
	//console.log(tempCode);
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
		{order:{'author': "kOrc", 'name': "Kickass Strat", 'content': myCode}},
		function(data) {
			// Proceed if verified
			//console.log(data);
			// Handle verification fail
		})
		.error(function() {
			alert("Unable to Connect to Server");
		});
}
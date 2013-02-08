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

	//GUIPassOne();
	GUITest();
	
	$("#ready")
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
	$("#game_ui")
	.append('<input type="button" class="btn btn-primary" id="ready" value="Ready!" />');
	
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
				$.get(addr, {pid: me, format: 'json'}, opponent_deployment)
				.error(function() {
					requesting_or_returned = false;
					alert("Unable to Connect to Server...Try Again");
				});
			});
		}

		var opponent_deployment = function (data) {
			opponentReady = data['ready'];
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
		request_opponent_deployment();
	};

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
	$.post(addr,{'order':{'author': "kOrc", 'name': "Kickass Strat", 'content': myCode}, 'Access-Control-Allow-Origin': '*'}, 
		function(data) {
			// Proceed if verified
			//console.log(data);
			// Handle verification fail
		})
		.error(function() {
			alert("Unable to Connect to Server");
		});
}
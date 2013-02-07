// GUI systems for the swarm game

var myCode = "";
var theirCode = "";
var me = 0;
var test = true;
var opponentReady = false;
var readyFunc;
var server = "";

function CreateGUI() {
	getServer();
	console.log("Making UI");
	GUIPassOne();
	$("#game_ui")
		.append('<input class="btn btn-primary" id="ready" value="Ready!" />')
		$("#ready")
		.click(function(){
			readyFunc();

			// Use a timered loop to check for opponent ready
			if (server == "" && !test) {
				console.log ("Server not found, terminating");
			}
			// TODO: Determine actual game number (from the URL?)
			var gid = 0;
			var addr = [server, 'games', gid, 'data'].join('/');
			// TODO: Post my ready state and code to the server

			function request_opponent_deployment () {
				// Query the server for update after a second
				$.doTimeout(1000, function () {
					$.get(addr, {g_id: gid, format: 'json'}, opponent_deployment);
				});
			};
			var opponent_deployment = function (data) {
				opponentReady = data['ready'];
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
	readyFunc = function () {
		opponentReady = test;
		myCode = (me == 0)?$('#greenstruction').val():($('#redstruction').val());
		theirCode = (me == 1)?$('#greenstruction').val():($('#redstruction').val());
	};
} 

function GUIPassOne() {
/* Pass one
*/
	
	readyFunc = function() {


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

function getServer() {
	server = (document.URL).split('/games')[0];
	if (server.indexOf("file:") !== -1) {
		console.log("Local testing");
		server = "";
		return;
	}
	console.log(server);

}

function UploadOrders() {
	if (server == "") return;
	var addr = [server, 'orders', 'create'].join('/');
	console.log(addr);
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
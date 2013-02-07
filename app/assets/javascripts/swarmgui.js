// GUI systems for the swarm game

var myCode = "";
var theirCode = "";
var me = 0;
var test = true;
var opponentReady = false;
var readyFunc;

function CreateGUI() {
	console.log("Making UI");
	GUIPassOne();
	$("#game_ui")
		.append('<input class="btn btn-primary" id="ready" value="Ready!" />')
		$("#ready")
		.click(function(){
			readyFunc();
			AssignCode();
			if (opponentReady || test) {
				PrepareExecution();
			}

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

function UpdateOrders() {
	var server = (document.URL).split('/games')[0];
	if (server.indexOf("file:") !== -1) {
		console.log("Local testing");
		return;
	}
	console.log(server);
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
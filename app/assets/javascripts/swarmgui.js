// GUI systems for the swarm game

function CreateGUI() {
	console.log("Making UI");
	
	/* TEST GUI
	*/
	var defaultgreen = "attack(NearestEnemy());";
	var defaultred = "attack(NearestEnemy());";
	$("#game_ui")
	.append('Green: <input type="text" id="greenstruction" value="'+defaultgreen+'"><br>');
	$("#game_ui")
	.append('Red: <input type="text" id="redstruction" value="'+defaultred+'"><br>');
	$("#game_ui")
	.append('<input class="btn btn-primary" id="ready" value="Ready!" />')
	$("#ready")
	.click(function(){
		Crafty("Trisim").each(function(){
			this.data.instructions = (this.data.owner > 0)?($('#redstruction').val()):($('#greenstruction').val());
		});
		Crafty("Diasim").each(function(){
			this.data.instructions = (this.data.owner > 0)?($('#redstruction').val()):($('#greenstruction').val());
		});
		PrepareExecution();
	});
	/* Pass one
	*/
}


function UpdateOrders() {
	var server = (document.URL).split('/games')[0];
	console.log(server);
	var addr = [server, 'orders', 'create'].join('/');
	console.log(addr);
	$.post(addr,{'order':{'author': "kOrc", 'name': "Kickass Strat", 'content': $('#greenstruction').val()}, 'Access-Control-Allow-Origin': '*'}, 
		function(data) {
			// Proceed if verified
			console.log(data);
			// Handle verification fail
		})
		.error(function() {
			alert("Unable to Connect to Server");
		});
}
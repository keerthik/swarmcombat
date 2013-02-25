// GUI systems for the swarm game

var myCode = "";
var theirCode = "";
var markedCode = "";
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
var testMode = false;
var invalid_link = "<a href='javascript:void(0);' class='gui_link invalid' onClick='selectItem(this);'>"
var valid_link = "<a href='javascript:void(0);' class='gui_link valid' onClick='selectItem(this);'>"

function getServer() {
	testMode = $('h1').html() == "Testing Grounds";
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
	.append('<input id="simulate" type="button" class="btn btn-large btn-success disabled" value="Simulate" disabled />'+
			'<p id="not_ready_warning">Both players must submit instructions before simulation can play.</p>');

	
	checkReady();
	if (!spectating) {
		$('#game_ui').append('<br/><br/>');

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
						myCode = data['code' + me];
						theirCode = testMode?data['testCode']:data['code' + (1-me)];
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
		requesting_or_returned = true;
		var addr = [gameserver, 'ready'].join('/');
		$.post(addr, 
			{pid: me, format: 'json', mycode: myCode}, 
			function(data) {
				alert("Instructions Sent!");
				if (data['ready']) {
					$("#simulate").attr('class', 'btn btn-large btn-success');
					$("#simulate").removeAttr("disabled");
					$("#not_ready_warning").remove();
					clearInterval(check_ready);
				}
			})
		.error(function() {
			requesting_or_returned = false;
			alert("Unable to Connect to Server...Try Again");
		});
	};

}

function GuideGUI() {
	if (testMode || (current_marked_code!= null && current_marked_code.indexOf("undefined") !== -1)) {
		console.log("Error retrieving last used code!");
		current_marked_code = null;
	}
	console.log(current_marked_code);
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

	var defaultCondition = "<div class='condition outer_link'>"+invalid_link+"(Condition)</a></div>";
	var defaultAction = "<div class='action outer_link'>"+invalid_link+"(Action)</a></div>";
	$("#game_ui")
	.append('<div id="priority_queue"></div>');
	$("#priority_queue").append('<p>Conditions and actions will be evaluated from top to bottom by each of your units.');
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
		if ($(".invalid").length > 0) {
			alert("Some instructions are invalid.");
			return;
		}
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
		$.post(addr, 
			{pid: me, format: 'json', mycode: myCode, markedcode: markedCode}, 
			function(data) {
				alert("Instructions Sent!");
				if (testMode || data['ready']) {
					$("#simulate").attr('class', 'btn btn-large btn-success');
					$("#simulate").removeAttr("disabled");
					$("#not_ready_warning").remove();
					clearInterval(check_ready);
				}
			})
		.error(function() {
			requesting_or_returned = false;
			alert("Unable to Connect to Server...Try Again");
		});

	};

}

function addGUIUnit(condition, action) {
	$("#priority_queue")
	.append(
		'<div id="gui_unit_0" class="gui_unit">' +
			'<a href="javascript:void(0);" class="btn move_row_up"><i class="icon-arrow-up"></i></a>&nbsp;' +
			'<a href="javascript:void(0);" class="btn move_row_down"><i class="icon-arrow-down"></i></a>' +
			'  <input type="text" class="condition" value="'+condition+'">  ' +
			'  <input type="text" class="action" value="'+action+'">  ' +
			'<a href="javascript:void(0);" class="btn add_row_down"><i class="icon-plus"></i></a>' +
		'</div>');
}

function addGuideUnit(condition, action) {
	$("#priority_queue")
	.append(
		'<div id="gui_unit_0" class="gui_unit">' +
			'<a href="javascript:void(0);" class="btn move_row_up"><i class="icon-arrow-up"></i></a>&nbsp;' +
			'<a href="javascript:void(0);" class="btn move_row_down"><i class="icon-arrow-down"></i></a>' +
			'  <div class="gui_well"><div class="well well-small">'+condition+'</div></div>  ' +
			'  <div class="gui_well"><div class="well well-small">'+action+'</div></div>  ' +
			'<a href="javascript:void(0);" class="btn add_row_down"><i class="icon-plus"></i></a>' +
		'</div>');
}

function selectItem(element) {
	var select_options = [];
	var type;
	var format;
	var comp_ops = ["==", ">", "<", ">=", "<="];
	var arith_ops = ["+", "-", "*", "/"];
	var num_field = "";

	// Hide any existing pop-ups
	hidePopup();
	if (element.text == "(Condition)" || comp_ops.indexOf(element.text) > -1 || 
		(docs[element.text] && docs[element.text]['type'] == "boolean")) {
		type = "boolean";
		select_options = comp_ops;
	}
	else if (element.text == "(Number)" || arith_ops.indexOf(element.text) > -1 || 
		(docs[element.text] && docs[element.text]['type'] == "number") || !isNaN(element.text) ||
		element.text == "self.hp" || element.text == "self.maxhp") {
		type = "number";
		select_options = arith_ops;
		num_field += "<div id='num_ctrl' class='control-group'><input id='num_field' " +
			"type='text' class='num_field' /></div>";
	}
	else if (element.text == "(Drone)" || (docs[element.text] && docs[element.text]['type'] == "drone")) {
		type = "drone";
	}
	else if (element.text == "(Action)" || (docs[element.text] && docs[element.text]['type'] == "action")) {
		type = "action";
	}

	for (var key in docs) {
		if (docs.hasOwnProperty(key) && docs[key]['type'] == type)
			select_options.push(key);
	}

	var options_string = "";
	for (var i = 0; i < select_options.length; i++) {
		options_string += "<option value='" + select_options[i] + "'>" + select_options[i] + "</option>";
	}
	$(element).removeAttr("href");
	$(element).removeAttr("onClick");
	$(element).prepend('<div id="guide_popup" class="pop-up code">'+
				'<span class="value">'+type+'</span>' +
				'<select onchange="insertItem(this);">' +
					'<option value=""></option>' +
					options_string +
				'<select>'+num_field+
				'<input type="button" class="btn dismiss" value="Cancel" />' +
				'</div>');
	$(".dismiss")
		.click(function() {
			hidePopup();
		});

	if (num_field)
		$("#num_field").keydown(processNumericalInput);
}

function insertItem(element) {
	var comp_ops = ["==", ">", "<", ">=", "<="];
	var arith_ops = ["+", "-", "*", "/"];
	var select_val = element.value;
	var curr_link = $(element).parents(".gui_link");
	var parent = curr_link.parent();
	$(element).parents(".pop-up").remove();
	if (comp_ops.indexOf(curr_link.text()) > -1) {
		parent = curr_link.parents(".comp_link");
		curr_link = null;
	}
	else if (arith_ops.indexOf(curr_link.text()) > -1) {
		parent = $(curr_link.parents(".arith_link")[0]);
		curr_link = null;
	}
	else if (parent.attr("class") == "arg_link")
		curr_link = null;

	if (comp_ops.indexOf(select_val) > -1) {
		if (curr_link)
			curr_link.replaceWith("<div class='gui_container comp_link'>"+invalid_link+"(Number)</a> "+
				valid_link+select_val+"</a> "+invalid_link+"(Number)</a></div>");
		else
			parent.replaceWith("<div class='gui_container comp_link'>"+invalid_link+"(Number)</a> "+
				valid_link+select_val+"</a> "+invalid_link+"(Number)</a></div>");
	}
	else if (arith_ops.indexOf(select_val) > -1) {
		if (curr_link)
			curr_link.replaceWith("<div class='gui_container arith_link'>("+invalid_link+"(Number)</a>"+
				valid_link+select_val+"</a>"+invalid_link+"(Number)</a>)</div>");
		else
			parent.replaceWith("<div class='gui_container arith_link'>("+invalid_link+"(Number)</a>"+
				valid_link+select_val+"</a>"+invalid_link+"(Number)</a>)</div>");
	}
	else if (!isNaN(select_val)) {
		if (curr_link)
			curr_link.replaceWith("<div class='arg_link'>"+valid_link+select_val+"</a></div>");
		else
			parent.replaceWith("<div class='arg_link'>"+valid_link+select_val+"</a></div>");
	}
	else if (/self/.test(select_val)) {
		select_val = select_val.replace('_','.');
		if (curr_link)
			curr_link.replaceWith("<div class='arg_link'>"+valid_link+select_val+"</a></div>");
		else
			parent.replaceWith("<div class='arg_link'>"+valid_link+select_val+"</a></div>");
	}
	else {
		var params = [];
		if (docs[select_val]['parametric']) {
			for (var i = 0; i < docs[select_val]['parameters'].length; i++) {
				var p = docs[select_val]['parameters'][i];
				if (p == "number")
					params.push("<div class='arg_link'>"+invalid_link+"(Number)</a></div>");
				else if (p == "drone")
					params.push("<div class='arg_link'>"+invalid_link+"(Drone)</a></div>");
				if (i < docs[select_val]['parameters'].length-1)
					params.push(",");
			}
		}
		var link_str = "<div class='arg_link'>"+valid_link+select_val+"</a>("
		for (var i = 0; i < params.length; i++)
			link_str += params[i];
		link_str += ")</div>";
		if (curr_link)
			curr_link.replaceWith(link_str);
		else
			parent.replaceWith(link_str);
	}
}

function processNumericalInput(event) {
	if (event.which == 13) {
		if (isNaN(event.target.value) || !event.target.value)
			$("#num_ctrl").attr("class","control-group error");
		else
			insertItem(event.target);
	}
}

function hidePopup() {
	var gui_link = $("#guide_popup").parents(".gui_link");
	$("#guide_popup").remove();
	setTimeout(function () {
		gui_link.attr("href","javascript:void(0);");
		gui_link.attr("onClick","selectItem(this);");
	}, 250);
}

function checkReady() {
	getServer();
	$.get(gameserver+'/is_ready', function(data) {
		if (data['ready']) {
			$("#simulate").attr('class', 'btn btn-large btn-success');
			$("#simulate").removeAttr("disabled");
			$("#not_ready_warning").remove();
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
	markedCode = "";
	units.each( function (index) {
		tempCode += "if (/*cond*/" + $(this).find(".condition").text() + "/*cond*/) ";
		tempCode += "/*act*/" + $(this).find(".action").text() + "/*act*/; else ";
		markedCode += "/*cond*/" + $(this).find(".condition").html() + "/*cond*/";
		markedCode += "/*act*/" + $(this).find(".action").html() + "/*act*/";
	});
	tempCode += "{ }";
	myCode = tempCode;
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
		{order:{'name': $("h1").html() + me==0?"_Green":"_Red", 'content': myCode}},
		function(data) {
			// Proceed if verified
			//console.log(data);
			// Handle verification fail
		})
		.error(function() {
			alert("Unable to Connect to Server");
		});
}
function RunGame() {
	Crafty.init(600, 300);
	Crafty.background('rgb(0,0,0)');
	CreateDrones();
	//CreateBall();
	//CreateScoreBoards();
}

//Paddles
function CreateDrones() {

	// Define the drone component
	
	Crafty.c("Drone_draw", {
		ready:true,
		facing:0, 
		hp:0,
		maxhp:100,
		instructions:"this.facing += 0.05;",
		color:'rgb(0,255,0)',
		init:function (){
			this.hp = this.maxhp;
			this.bind('Draw', function (e) {
				// Custom Vector art
				this._draw(e.ctx, e.pos);
			});
			this.bind('EnterFrame', function (e) {
				this._react();
			});
			this.bind('KeyUp', function(e) {
				this._keyup(e);
			});
		},
		_draw: function (ctx, po){
			// Center of the rendering square is actual position of the unit
			var pos = new Crafty.math.Vector2D( po._x + po._w/2, po._y + po._h/2);
			// Size of the unit is 70% of the rendering square to account for turn overflow
			var size = .7*po._w;
			// Color of the drone (used for render and hp bar) is based on the owner
			this.color = (this.owner > 0)?'rgb(255,0,0)':'rgb(0,255,0)';
			// Draw triangle facing angle from x-axis, of dimension size
			var point = drxnVector(this.facing, size);
			drawTriangle(ctx, pos, point, this.color);
			// Health bar
			drawHp(ctx, pos, size, this.hp, this.maxhp, this.color);
			// TODO: Attack animation
			// TODO: Hit animation
			// TODO: Death animation
		},
		// Hotkeys for deploying. Right now, different hotkey to deploy to different team
		_triggerKey:{13:0, 34:1},
		_keyup: function (e) {
			if (this._triggerKey[e.key] == this.owner) {
				this.instructions = (this.owner > 0)?($('#redstruction').val()):($('#greenstruction').val());
			}
		},
		_react: function () {
			// Apparently this is necessary to make the draw function work
			this.x += 0;
			eval(this.instructions);
		},
		// Public operations for game logic!
		die: function () {
			// TODO: Explode graphics, stats, data management, UI updates, etc
			console.log("I died!");
		},
		attackdmg: 7,
		attackcdmax: 1,
		attackcd: 0,
		attack: function (target) {
			if (attackcd <= 0) {
				// TODO: Attack trigger
				target.takeDamage(attackdmg);
				attackcd 
			}
		},
		takeDamage: function(damage) {
			// No negative damage
			damage = (damage<0)?-damage:damage;
			this.hp = Math.max(0, this.hp-damage);
			if (this.hp == 0) {
				this.die();
				return false;
			}
		},
	});
	
	Crafty.e("Thing") 
		.attr({facing:0, 
			hp:0,
			maxhp:100,
			instructions:"this.facing += 0.05;"});
	// Spawn them drones
	for (var i = 0; i < 3; i++) {
		Crafty.e("Trident, 2D, Canvas, Drone_draw")
			.attr({x: 50, y: 60*(i+1), w: 30, h: 30, owner: 0});
		Crafty.e("Diamondback, 2D, Canvas, Drone_draw")
			.attr({x: 520, y: 60*(i+1), w: 30, h: 30, owner: 1, facing: 3.14});
	}
	console.log(Crafty(1));
}

//Ball
function CreateBall() {
	Crafty.e("2D, Canvas")
		//.color('rgb(0,255,255)')
		.attr({ x: 300, y: 150, w: 10, h: 10, 
				dX: Crafty.math.randomInt(2, 5), 
				dY: Crafty.math.randomInt(2, 5) })
		.bind('EnterFrame', function () {
			//hit floor or roof
			if (this.y <= 0 || this.y >= 290)
				this.dY *= -1;

			if (this.x > 600) {
				this.x = 300;
				Crafty("LeftPoints").each(function () { 
					this.text(++this.points + " Points") });
			}
			if (this.x < 10) {
				this.x = 300;
				Crafty("RightPoints").each(function () { 
					this.text(++this.points + " Points") });
			}

			this.x += this.dX;
			this.y += this.dY;
		});
}
//Score boards
function CreateScoreBoards() {
	Crafty.e("LeftPoints, Canvas, 2D, Text")
		.attr({ x: 20, y: 20, w: 100, h: 20, points: 0 })
		.text("0 Points")
		.textColor('#FF0000');
	Crafty.e("RightPoints, Canvas, 2D, Text")
		.attr({ x: 515, y: 20, w: 100, h: 20, points: 0 })
		.text("0 Points")
		.textColor('#00FF00');
}


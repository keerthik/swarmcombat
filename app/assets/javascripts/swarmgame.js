function RunGame() {
	Crafty.init(600, 300);
	Crafty.background('rgb(0,0,0)');
	CreateDrones();
	//CreateGUI();
	//CreateBall();
	//CreateScoreBoards();
}


function CreateGUI() {
	var defaultgreen = "this.attack(this.NearestEnemy());";
	var defaultred = "this.attack(this.NearestEnemy());";
	$("#game_ui")
		.append('Green: <input type="text" id="greenstruction" value="'+defaultgreen+'"><br>');
	$("#game_ui")
		.append('Red: <input type="text" id="redstruction" value="'+defaultred+'"><br>');
	$("#game_ui")
		.append('<input type="button" id="ready" value="Ready!" />')
	$("#ready")
		.click(function(){
			executing = true;
		});
	console.log("Making UI");

}

// Test clients have servermode true
var servermode = true;
var clientmode = true;
var executing = false;
var timer;

// Drones and Components
function CreateDrones() {

	// Define the drone component
	
	Crafty.c("DroneDraw", {
		ready:true,
		color:'rgb(0,255,0)',
		deathTimer:1,
		init:function (){
			this.bind('EnterFrame', function (e) {
				this.x += 0;
				this.x = this.data.x;
				this.y = this.data.y;
			});
			this.bind('Draw', function (e) {
				// Custom Vector art
				this._draw(e.ctx, e.pos);
			});
		},
		_draw: function (ctx, po){
			// Center of the rendering square is actual position of the unit
			var pos = new Crafty.math.Vector2D( po._x + po._w/2, po._y + po._h/2);
			// Size of the unit is 70% of the rendering square to account for turn overflow
			var size = .7*po._w;
			// Color of the drone (used for render and hp bar) is based on the owner
			this.color = (this.data.owner > 0)?'rgb(255,0,0)':'rgb(0,255,0)';
			// Draw triangle facing angle from x-axis, of dimension size
			var point = drxnVector(this.data.facing, size);
			if (this.data.alive) {
				drawTriangle(ctx, pos, point, this.color);
				// Health bar
				drawHp(ctx, pos, size, this.data.hp, this.data.maxhp, this.color);
				// TODO: Moving animation
				if (this.data.moving) {
				
				}
				// TODO: Attack animation
				if (this.data.attacking) {
					//console.log("Attacking");
					drawBeam(ctx, pos, this.data.targetPos, this.color);
				}
				// TODO: Hit animation
				if (this.data.takingdamage) {
				
				}
			} else {
				// TODO: Death animation
				if (this.deathTimer > 0) {
					// Death animation stage
					this.deathTimer -= timer.dt;
				}
			}
		},
	});
	
	/* 	Entities created with just this component will reflect the data of that drone.
		Clients pull data from server into this entity, server pushes changes to the
		game state by modifying this entity and publishing.
	*/
	Crafty.c("DroneData", {
		init:function (){
			this.hp = this.maxhp;
			this.bind('EnterFrame', function(e) {
				if (clientmode && !servermode) {
				// TODO: Pull update
				}
			});
		},
		// Flags for animation/data
		alive: true,
		attacking: false,
		takingdamage: false,
		moving: false,
		targetPos: {x:0, y:0},
		// Game state data
		instructions:"this.attack(this.NearestEnemy());",
		facing: 0,
		hp: 0,
		// unit stats
		maxhp: 20,
		attackdmg: 3.5,
		attackrange: 200,
		attackcdmax: 1,
		movespeed: 40,
		turnspeed: 6,
	});
	
	/* 	This component should only really be active on the server, or test clients.
		Although using a crafty component, this is basically just a system that
		contains all the game logic. It only contains a reference to the DroneData
		entity that is mirrored on clients as well as server, and none of the actual
		data.
		Convention here: 
			_methodName -> Basic game system method - not even hackable
			methodName	-> Game operation, only available for hacking
			MethodName	-> Exposed operation, available for instruction set
	*/
	Crafty.c("DroneOps", {
		init:function (){
			this.bind('EnterFrame', function (e) {
				this._always();
				this._react();
				if (servermode && !clientmode) {
				// TODO: Push update
				}
			});
			this.bind('KeyUp', function(e) {
				this._keyup(e);
			});
		},
		attackcd: 0,
		NearestEnemy: function () {
			var i = 0;
			var enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
			while (i < 3 && !enemy.data.alive) {
				i++;
				enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
			}
			return (i<3)?enemy:false;
		},
		lookAt: function (targetPos) {
			var requiredFacing = Math.atan2(this.data.y - targetPos.y, targetPos.x - this.data.x);
			requiredFacing = requiredFacing.mod(2*Math.PI);
			var requiredturn = requiredFacing - this.data.facing;
			// Looking at target
			if (Math.abs(requiredturn) < 0.0001) return true;
			var direction = (requiredturn<0?-1:1);
			// Optimal (shortest) turning around 0
			if (Math.abs(requiredturn) > Math.PI) {
				requiredturn = direction*2*Math.PI - requiredturn;
				direction*=-1;
			}
			// Turn as fast as possible/needed
			this.data.facing += direction*Math.min( this.data.turnspeed*timer.dt, Math.abs(requiredturn));
			return false;
		},
		moveFd: function () {
			this.data.x += Math.cos(this.data.facing)*this.data.movespeed*timer.dt;
			this.data.y += -Math.sin(this.data.facing)*this.data.movespeed*timer.dt;
      this._reconcileBounds();
		},
		attack: function (target) {
			this.data.attacking = false;
			if (!target || !target.data.alive) {
				return false;
			}
			this.data.targetPos = {x:target.data.x + target.w/2, y:target.data.y + target.h/2};
			
			// Get in range of target
			this.data.attacking = new Crafty.math.Vector2D(this.data.x, this.data.y)
								.distance(new Crafty.math.Vector2D(target.data.x, target.data.y)) < this.data.attackrange;							
			if (!this.data.attacking) this.moveFd();

			// Turn to face target
			this.data.attacking &= this.lookAt(this.data.targetPos);
			if (!this.data.attacking) return false;

			// Attacking the target
			if (this.attackcd <= 0) {
				// TODO: Attack trigger
				target.takeDamage(this.data.attackdmg);
				this.attackcd = this.data.attackcdmax;
			}
			return true;
		},
		takeDamage: function(damage) {
			// No negative damage
			damage = (damage<0)?-damage:damage;
			this.data.hp = Math.max(0, this.data.hp-damage);
			if (this.data.hp <= 0) {
				this.die();
				return false;
			}
		},
		// Public operations for game logic!
		die: function () {
			// TODO: Explode graphics, stats, data management, UI updates, etc
			this.data.alive = false;
		},
		_always: function () {
			// Need to get us some deltatime
			if (!executing || !this.data.alive) return;
			if (this.attackcd > 0) this.attackcd -= timer.dt;
			this.data.facing = this.data.facing.mod(2*Math.PI);
		},
		_react: function () {
			if (!executing || !this.data.alive) return;
			eval(this.data.instructions);
		},
		// Hotkeys for deploying. Right now, different hotkey to deploy to different team
		_triggerKey:{13:0, 34:1},
		_keyup: function (e) {
			if (this._triggerKey[e.key] == this.owner) {
				this.data.instructions = (this.data.owner > 0)?($('#redstruction').val()):($('#greenstruction').val());
			}
		},
    // Ensure entity stays in bounds
    _reconcileBounds: function() {
      this.data.x = Math.max(Math.min(this.data.x,Crafty.viewport.width-this.w),0);
      this.data.y = Math.max(Math.min(this.data.y,Crafty.viewport.height-this.h),0);
    },    
	});
	
	// Game Timer
	timer = Crafty.e("timer, 2D, Canvas")
		.attr({dt:0, time:new Date().getTime()})
		.bind('EnterFrame', function () {
			this.dt = 0.001*(new Date().getTime() - this.time);
			this.time = new Date().getTime();
		});

	// Spawn them drones
	for (var i = 0; i < 3; i++) {
		// Container for the data that is expected to be piped away or piped in
		var thisData = Crafty.e("Tridata, DroneData")
			.attr({x: 50, y: 60*(i+1), owner: 0});
		var thatData = Crafty.e("Diadata, DroneData")
			.attr({x: 520, y: 60*(i+1), owner: 1});

		if (servermode) {
			var thisOps = Crafty.e("Trisim, DroneOps")
				.attr({x: 50, y: 60*(i+1), w: 30, h: 30, owner: 0, data: thisData});
			var thatOps = Crafty.e("Diasim, DroneOps")
				.attr({x: 50, y: 60*(i+1), w: 30, h: 30, owner: 1, data: thatData});
		}
		
		if (clientmode) {
			Crafty.e("Trident, 2D, Canvas, DroneDraw")
				.attr({x: 50, y: 60*(i+1), w: 30, h: 30, owner: 0, data: thisData});
			Crafty.e("Diamond, 2D, Canvas, DroneDraw")
				.attr({x: 50, y: 60*(i+1), w: 30, h: 30, owner: 1, data: thatData});
		}
	}
	if (servermode) {
		var redops = Crafty("Diasim");
		console.log(redops);
	}
}
function logic_unit() {
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


function RunGame() {
	Crafty.init(800, 400);
	Crafty.background('rgba(0,0,0,100)');
	CreateDrones();
	InitializeGame();	
	//CreateGUI();
	//CreateBall();
	//CreateScoreBoards();

	// Create grid
	Grid = new PathingGrid();
	use_pathing = true;

}

function PrepareExecution() {
	$("#winMessage").remove();
	timer.starttime = new Date().getTime();
	executing = true;
}

// Object representing the game grid used for A* pathing
function PathingGrid(drone_id) {
	this.grid_width = 60; // how many cells wide the grid is
	this.grid_height = Math.round((Crafty.viewport.height * this.grid_width) / Crafty.viewport.width);
	this.cell_width = Crafty.viewport.width / this.grid_width; // how many pixels wide a cell is
	this.cell_height = Crafty.viewport.height / this.grid_height;
	this.drone_id = drone_id;
	this.G_straight = 10; // cost of straight movement
	this.G_diagonal = 14; // cost of diagonal movement

	function Node(i,j) {
		this.i = i;
		this.j = j;
		this.passable = true;
		this.visited = false;
		this.closed = false;
		this.parent = null;
		this.f = 0;
		this.g = 0;
		this.h = 0;
		this.penalty = 1;
	}    

	// Converts pixel position to grid cell
	this.pxPos2GridPos = function(px_x, px_y) {
		var i = Math.max(Math.min(Math.floor(px_y/this.cell_height), this.grid_height-1), 0);
		var j = Math.max(Math.min(Math.floor(px_x/this.cell_width), this.grid_width-1), 0);
		return { 'i': i, 'j': j };
	};

	// Converts grid_cell position to pixel position (center of cell)
	this.gridPos2PxPos = function(cell) {
		var x = Math.round(cell.j * this.cell_width + this.cell_width / 2);
		var y = Math.round(cell.i * this.cell_height + this.cell_height / 2);
		return { 'x': x, 'y': y };
	};

	// Diagonal heuristic for H score
	this.getDiagonalDistance = function(curr_cell, target) {
		var diagonal_steps = Math.min(Math.abs(curr_cell.j - target.j), 
			Math.abs(curr_cell.i - target.i));
		var straight_steps = Math.abs(curr_cell.j - target.j) + Math.abs(curr_cell.i - target.i);
		return this.G_diagonal * diagonal_steps + this.G_straight * (straight_steps - 2*diagonal_steps);
	};

	if (drone_id) {
		this.nodes = new Array(this.grid_height);
		for (var i = 0; i < this.grid_height; i++) {
			this.nodes[i] = new Array(this.grid_width);
			for (var j = 0; j < this.grid_width; j++)
				this.nodes[i][j] = new Node(i,j);
		}

	    // Update state of grid by making cells occupied by drones impassable
	    this.updateState = function() {
	    	drones = Crafty('DroneOps');
	    	this.resetState();
	    	for (var iter = 0; iter < drones.length; iter++) {
	    		if (this.drone_id != drones[iter]) {
	    			drone = Crafty(drones[iter]);
	    			upper_left_cell = this.pxPos2GridPos(Math.max(drone.data.x, 0),
	    				Math.max(drone.data.y, 0));
	    			lower_right_cell = this.pxPos2GridPos(Math.min(drone.data.x + drone.w,
	    				Crafty.viewport.width-1), 
	    			Math.min(drone.data.y + drone.h,
	    				Crafty.viewport.height-1));
	    			for (var i = upper_left_cell.i; i <= lower_right_cell.i; i++) {
	    				for (var j = upper_left_cell.j; j <= lower_right_cell.j; j++) {
	    					this.nodes[i][j].passable = false;
	    				}
	    			}
	    			if (drone.data.path && drone.data.path.length > 0) {
	    				for (var idx = drone.data.path.length-1; idx >= Math.max(drone.data.path.length-3,0); idx--) {
	    					var used_node = drone.data.path[idx];
	    					for (var i = Math.max(used_node.i-1,0); i <= Math.min(used_node.i+1,this.grid_height-1); i++) {
	    						for (var j = Math.max(used_node.j-1,0); j <= Math.min(used_node.j+1,this.grid_width-1); j++)
	    							this.nodes[i][j].penalty += 1;				
	    					}
	    				}
	    			}
	    		}
	    	}
	    };  

	    // Resets state of grid
	    this.resetState = function() {
	    	for (var i = 0; i < this.grid_height; i++) {
	    		for (var j = 0; j < this.grid_width; j++) {
	    			this.nodes[i][j] = new Node(i,j);
	    		}
	    	}
	    };

	    // Find all neighbors of a given cell
	    this.findNeighbors = function(curr_cell) {
	    	var i = curr_cell.i;
	    	var j = curr_cell.j;
	    	var neighbors = [];

	    	for (var i_iter = -1; i_iter <= 1; i_iter++) {
	    		for (var j_iter = -1; j_iter <= 1; j_iter++) {
	    			if (this.nodes[i+i_iter] && this.nodes[i+i_iter][j+j_iter] &&
	    				(i_iter != 0 || j_iter != 0)) {
	    				neighbors.push(this.nodes[i+i_iter][j+j_iter]);
	    			}
	    		}
	    	} 

	    	return neighbors;   
		};

		this.findClosestPassableNode = function(cell) {
			if (this.nodes[cell.i][cell.j].passable)
				return this.nodes[cell.i][cell.j];
			var drone_grid_pos = Crafty(this.drone_id).getGridPosition();
			var a = [-1, 1]
			var b = [0, -1, 1];
			var passable_nodes = [];
			while (a[1] < this.grid_width) {
				for (var b_iter = 0; b_iter < b.length; b_iter++) {
					var b_val = b[b_iter];
					for (var a_iter = 0; a_iter < a.length; a_iter++) {
						var a_val = a[a_iter];
						if (this.nodes[cell.i+a_val] && this.nodes[cell.i+a_val][cell.j+b_val]) {
							var curr_node = this.nodes[cell.i+a_val][cell.j+b_val];
							if (curr_node.passable)
								passable_nodes.push(curr_node);
						}
						if (this.nodes[cell.i+b_val] && this.nodes[cell.i+b_val][cell.j+a_val]) {
							var curr_node = this.nodes[cell.i+b_val][cell.j+a_val];
							if (curr_node.passable)
								passable_nodes.push(curr_node);
						}			
					}
				}
				if (passable_nodes.length > 0) {
					var min = 1000;
					var res = null;
					for (var iter = 0; iter < passable_nodes.length; iter++) {
						var node = passable_nodes[iter];
						var dist = Math.abs(drone_grid_pos.i-node.i) + Math.abs(drone_grid_pos.j-node.j);
						if (dist < min) {
							min = dist;
							res = node;
						}
					}
					return res;
				}
				a[0] -= 1; a[1] += 1;
				b.push(a[0]); b.push(a[1]);
			}
			return false;
		};

	}
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
		hitTimerMax:.2,
		init:function (){
			this.deathParticles = new ParticleSystem(20, 50);
			this.gunParticles = new ParticleSystem(4, 0, true);
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
				if (!executing) return;
				// Health bar
				drawHp(ctx, pos, size, this.data.hp, this.data.maxhp, this.color);
				// TODO: Moving animation -- jets or some shit?
				if (this.data.moving) {

				}
				// Special shield animation
				if (this.shieldActive()) {
					drawShields(ctx, pos, size);
				}
				// Attack animation
				this.gunParticles.setParams(this.color, false, pos, this.data.targetPos, this.data.facing, this.data.attacking);
				this.gunParticles.draw(ctx, pos, timer.dt);
				// TODO: Hit animation
				if (this.data.takingdamage) {
					this.data.hitTimer -= timer.dt;
					this.data.takingdamage = false;
					if (this.data.hitTimer <= 0) {
						this.data.hitTimer = this.hitTimerMax;
						this.data.takingdamage = false;
					}
				}
			} else if (this.deathTimer > 0) {
				this.deathParticles.setParams(0, true);
				this.deathParticles.draw(ctx, pos, timer.dt);
				// Death animation stage
				this.deathTimer -= timer.dt;
			}
			
		},

		shieldActive: function() {
			return (!this.data.shieldAvailable && this.data.shieldTimer > 0);
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
		alive: 			true,
		attacking: 		false,
		takingdamage: 	false,
		moving: 		false,
		targetPos: 		{x:0, y:0},
		// Game state data
		instructions: 	"attack(NearestEnemy());",
		facing: 		0,
		hp: 			0,
		// unit stats
		maxhp: 			100,
		attackdmg: 		13,
		attackrange: 	200,
		attackcdmax: 	1,
		movespeed: 		55,
		turnspeed: 		12,
		// Special shield
		shieldAvailable: true,
		shieldTimer: 	3,
		// Graphics hack
		hitTimerkey: 	.2,
    	// Shortest path to current target
    	path: 			null,
    	grid: 			null,
    	time_since_update: 0,
    	current_move_target: null,
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

		// Data functions
		NearestEnemy: function () {
			var n = Crafty(this.owner>0?"Trisim":"Diasim").length;
			var closeDist = -1;
			var closeEnemy;
			for (var i = 0; i < n; i++ ) {
				var enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
				if (enemy.data.alive) {
					var thisDist = new Crafty.math.Vector2D(this.data.x, this.data.y)
									.distanceSq(new Crafty.math.Vector2D(enemy.data.x, enemy.data.y))
					closeEnemy = (closeDist==-1||thisDist<closeDist)?enemy:closeEnemy;
					closeDist = (closeDist==-1||thisDist<closeDist)?thisDist:closeDist;
				}
			}
			return (closeDist!=-1)?closeEnemy:false;
		},

		NearestAlly: function () {
			var n = Crafty(this.owner>0?"Diasim":"Trisim").length;
			var closeDist = -1;
			var closeAlly;
			for (var i = 0; i < n; i++ ) {
				var ally = Crafty(Crafty(this.owner>0?"Diasim":"Trisim")[i]);
				if (ally[0] == this[0]) continue;
				if (ally.data.alive) {
					var thisDist = new Crafty.math.Vector2D(this.data.x, this.data.y)
									.distanceSq(new Crafty.math.Vector2D(ally.data.x, ally.data.y))
					closeAlly = (closeDist==-1||thisDist<closeDist)?ally:closeAlly;
					closeDist = (closeDist==-1||thisDist<closeDist)?thisDist:closeDist;
				}
			}
			return (closeDist!=-1)?closeAlly:false;
		},

		FirstLiveEnemy: function () {
			var i = 0;
			var n = Crafty(this.owner>0?"Trisim":"Diasim").length;
			var enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
			while (i < n && !enemy.data.alive) {
				i++;
				enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
			}
			return (i<n)?enemy:false;
		},

		FirstLiveAlly: function () {
			var i = 0;
			var n = Crafty(this.owner>0?"Diasim":"Trisim").length;
			var ally = Crafty(Crafty(this.owner>0?"Diasim":"Trisim")[i]);
			while (i < n && (!ally.data.alive || ally[0] == this[0])) {
				i++;
				ally = Crafty(Crafty(this.owner>0?"Diasim":"Trisim")[i]);
			}
			return (i<n)?ally:false;
		},

		WeakestEnemy: function() {
			var n = Crafty(this.owner>0?"Trisim":"Diasim").length;
			var lowHp = this.data.maxhp * 1000; //arbitrarily high starting hp
			var weakEnemy = false;
			for (var i = 0; i < n; i++ ) {
				var enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
				if (enemy.data.alive) {
					if (enemy.data.hp < lowHp) {
						lowHp = enemy.data.hp
						weakEnemy = enemy;
					}
					else if (enemy.data.hp == lowHp) {
						// Choose closer enemy if HP is equal
						var curr_dist = new Crafty.math.Vector2D(this.data.x, this.data.y)
									.distanceSq(new Crafty.math.Vector2D(enemy.data.x, enemy.data.y));
						var prev_dist = new Crafty.math.Vector2D(this.data.x, this.data.y)
									.distanceSq(new Crafty.math.Vector2D(weakEnemy.data.x, weakEnemy.data.y));
						weakEnemy = (curr_dist < prev_dist)?enemy:weakEnemy;
					}
				}
			}
			return weakEnemy;
		},

		WeakestAlly: function() {
			var n = Crafty(this.owner>0?"Diasim":"Trisim").length;
			var lowHp = this.data.maxhp * 1000; //arbitrarily high starting hp
			var weakAlly = false;
			for (var i = 0; i < n; i++ ) {
				var ally = Crafty(Crafty(this.owner>0?"Diasim":"Trisim")[i]);
				if (ally.data.alive && ally[0] != this[0]) {
					if (ally.data.hp < lowHp) {
						lowHp = ally.data.hp
						weakAlly = ally;
					}
					else if (ally.data.hp == lowHp) {
						// Choose closer ally if HP is equal
						var curr_dist = new Crafty.math.Vector2D(this.data.x, this.data.y)
									.distanceSq(new Crafty.math.Vector2D(ally.data.x, ally.data.y));
						var prev_dist = new Crafty.math.Vector2D(this.data.x, this.data.y)
									.distanceSq(new Crafty.math.Vector2D(weakAlly.data.x, weakAlly.data.y));
						weakAlly = (curr_dist < prev_dist)?ally:weakAlly;
					}
				}
			}
			return weakAlly;
		},


		IsTakingDamage: function(drone) {
			return drone.data.takingdamage;
		},

		// Sensing functions
		EnemiesInRadius: function(r) {
			var nEnemies = 0;
			var n = Crafty(this.owner>0?"Trisim":"Diasim").length;
			var retreatVector = {x:0, y:0};
			for (var i = 0; i < n; i++ ) {
				var enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
				if (enemy.data.alive) {
					var eVector = new Crafty.math.Vector2D(enemy.data.x - this.data.x, enemy.data.y - this.data.y);
					if (eVector.magnitudeSq() < r*r) nEnemies++;
				}
			}
			return nEnemies;
		},

		AlliesInRadius: function (r) {
			var nAllies = 0;
			var n = Crafty(this.owner>0?"Diasim":"Trisim").length;
			var destination = {x:0, y:0};
			for (var i = 0; i < n; i++) {
				var ally = Crafty(Crafty(this.owner>0?"Diasim":"Trisim")[i]);
				if (ally.data != this.data && ally.data.alive) {
					var aVector = new Crafty.math.Vector2D(ally.data.x - this.data.x, ally.data.y - this.data.y);
					if (aVector.magnitudeSq() < r*r) nAllies++;
				}
			}
			return nAllies;
		},
		
		EnemiesLeft: function () {
			var nEnemies = 0;
			var n = Crafty(this.owner>0?"Trisim":"Diasim").length;
			var retreatVector = {x:0, y:0};
			for (var i = 0; i < n; i++ ) {
				var enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
				if (enemy.data.alive) nEnemies++;
			}
			return nEnemies;			
		},

		AlliesLeft: function () {
			var nAllies = 0;
			var n = Crafty(this.owner>0?"Diasim":"Trisim").length;
			var destination = {x:0, y:0};
			for (var i = 0; i < n; i++) {
				var ally = Crafty(Crafty(this.owner>0?"Diasim":"Trisim")[i]);
				if (ally.data != this.data && ally.data.alive) nAllies++;
			}
			return nAllies;
		},

		DistanceToUnit: function(unit) {
			if (!unit) return false;
			return (new Crafty.math.Vector2D(this.data.x, this.data.y)
					.distance(new Crafty.math.Vector2D(unit.data.x, unit.data.y)));
		},

		HasShield: function(drone) {
			return drone.data.shieldAvailable;
		},

		ShieldActive: function(drone) {
			return (!drone.data.shieldAvailable && drone.data.shieldTimer > 0);
		},

		GetHP: function(drone) {
			return drone.data.hp;
		},

		MaxHP: function() {
			return this.data.maxhp;
		},

		// Core actions
		LookAt: function (target_x, target_y) {
			return this.lookAt({x: target_x, y: target_y});
		},
		    	
		// Macro actions
		Retreat: function () {
			var n = Crafty(this.owner>0?"Trisim":"Diasim").length;
			var retreatVector = {x:0, y:0};
			for (var i = 0; i < n; i++ ) {
				var enemy = Crafty(Crafty(this.owner>0?"Trisim":"Diasim")[i]);
				if (enemy.data.alive) {
					var eVector = new Crafty.math.Vector2D(enemy.data.x - this.data.x, enemy.data.y - this.data.y);
					// Each enemy contributes inversely proportional to his distance from the unit
					var scaleFactor = 10000000/(1+eVector.magnitudeSq());
					eVector.scaleToMagnitude(scaleFactor);
					retreatVector.x += (eVector.x);
					retreatVector.y += (eVector.y);
				}
			}
			this.moveTo(this.data.x - retreatVector.x, this.data.y - retreatVector.y);
		},

		Regroup: function () {
			var n = Crafty(this.owner>0?"Diasim":"Trisim").length;
			var nAllies = 0;
			var destination = {x:0, y:0};
			for (var i = 0; i < n; i++) {
				var ally = Crafty(Crafty(this.owner>0?"Diasim":"Trisim")[i]);
				if (ally.data != this.data && ally.data.alive) {
					nAllies++;
					destination.x += ally.data.x;
					destination.y += ally.data.y;
				}
			}
			destination.x /= nAllies;
			destination.y /= nAllies;
			this.moveTo(destination.x, destination.y);
		},

		UseShield: function () {
			if (!this.data.shieldAvailable) return;
			// This basically triggers the shield
			this.data.shieldAvailable = false;
		},

		attackcd: 0,
    	Attack: function (target) {
    		this.data.attacking = false;
    		if (!target || !target.data.alive) {
    			return false;
    		}
    		this.data.targetPos = {x:target.data.x + target.w/2, y:target.data.y + target.h/2};

			// Get in range of target
			this.data.attacking = new Crafty.math.Vector2D(this.data.x, this.data.y)
			.distanceSq(new Crafty.math.Vector2D(target.data.x, target.data.y)) < this.data.attackrange*this.data.attackrange;	
			if (!this.data.attacking) this.moveTo(target.data.x, target.data.y);

			// Turn to face target once in range
			if (this.data.attacking)
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

		Not: function(bool) {
			return !bool;
		},

		NoCondition: function() {
			return true;
		},

		lookAt: function (targetPos) {
			var requiredFacing = Math.atan2((this.data.y + this.h/2) - targetPos.y, targetPos.x - (this.data.x + this.w/2));
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
			this.data.moving = true;
			this.data.x += Math.cos(this.data.facing)*this.data.movespeed*timer.dt;
			this.data.y += -Math.sin(this.data.facing)*this.data.movespeed*timer.dt;
			this._reconcileBounds();
		},

		moveTo: function(target_x, target_y) {
			target_x = Math.max(Math.min(target_x,Crafty.viewport.width-this.w),0);
			target_y = Math.max(Math.min(target_y,Crafty.viewport.height-this.w),0);
			if (use_pathing) {
				var target_grid_pos = Grid.pxPos2GridPos(target_x, target_y);
				if (this.data.current_move_target) {
					var prev_target_grid_pos = Grid.pxPos2GridPos(this.data.current_move_target.x, this.data.current_move_target.y);
					// Check for significant change in target position
					if (Math.abs(target_grid_pos.i-prev_target_grid_pos.i) > 1 || 
						Math.abs(target_grid_pos.j-prev_target_grid_pos.j) > 1) {
						this.data.path = this.getPath(target_x, target_y);
					}
				}

				this.data.time_since_update += timer.dt;
				var curr_cell = this.getGridPosition();

				// If null path, calculate one
				if (this.data.path === null)
					this.data.path = this.getPath(target_x, target_y);

				// Check if target has been reached
				if ((target_grid_pos.i == curr_cell.i && target_grid_pos.j == curr_cell.j) ||
					(this.data.current_move_target && this.data.current_move_target.reached) ||
					(this.data.path.length == 0)) {
					return true;
				}

				// Update path every second
				if (this.data.time_since_update > 1.0)
					this.data.path = this.getPath(target_x, target_y);

				// Move if there is a non-zero length path
				if (this.data.path && this.data.path.length > 0) {
					var temp_next_cell = this.data.path[this.data.path.length-1];
					//this.data.grid.updateState();
					// Recalculate path if there is a collision
					var next_cell = this.data.grid.nodes[temp_next_cell.i][temp_next_cell.j];
					if (!next_cell.passable) {
						this.data.path = this.getPath(target_x, target_y);
						return false;
					}
					if (curr_cell.i == next_cell.i && curr_cell.j == next_cell.j) {
						this.data.path.pop();
						next_cell = this.data.path[this.data.path.length-1];
						if (!next_cell) {
							this.data.current_move_target.reached = true;
				            return false; // Finished path
				        }
				    }
				    if (this.lookAt(Grid.gridPos2PxPos(next_cell))) {
				    	this.moveFd();
						return false; // Not at target yet
					}
				}	
				return false;
			}
			else {
				var ctr_x = this.data.x + this.w/2;
				var ctr_y = this.data.y + this.h/2;
				if (Math.abs(target_x-ctr_x) <= 5 && Math.abs(target_y-ctr_y) <= 5)
					return true;
				else if (this.lookAt({'x':target_x,'y':target_y}))
				    this.moveFd();
				return false;
			}
		},

		moveTowardsUnit: function(drone) {
			this.moveTo(drone.data.x+drone.w/2, drone.data.y+drone.h/2);
		},
		
		getPath: function(target_x, target_y) {
			this.data.current_move_target = {'x': target_x, 'y': target_y, 'reached': false};
			this.data.time_since_update = 0;
			var path_grid = new PathingGrid(this[0]);
			path_grid.updateState();
			this.data.grid = path_grid;
			var target_cell = path_grid.findClosestPassableNode(Grid.pxPos2GridPos(target_x, target_y));
			var open_nodes = new BinaryHeap(function(node) {
				return node.f;
			});
			var start_cell = this.getGridPosition();
			open_nodes.push(path_grid.nodes[start_cell.i][start_cell.j]);
			var end_node = path_grid.nodes[target_cell.i][target_cell.j];

			while (open_nodes.size() > 0) {
		        curr_node = open_nodes.pop(); // Get node with lowest f cost

		        // End of path
		        if (curr_node === end_node) {
		        	var curr = curr_node;
		        	var prev = null;
		        	var res = [];
		        	while (curr.parent) {
			            /*if (prev && !((prev.i == curr.i && curr.i == curr.parent.i) || 
			                (prev.j == curr.j && curr.j == curr.parent.j))) {
			              res.push(curr);
			            }
			            else if (!prev)
			            	res.push(curr); */
			            res.push(curr);
			            prev = curr;
			            curr = curr.parent;
			            prev.parent = null;
			        }
			        return res;  
			    }
			    curr_node.closed = true;

			    var neighbors = path_grid.findNeighbors(curr_node);
			    for (var iter = 0; iter < neighbors.length; iter++) {
			    	var neighbor = neighbors[iter];
			        // Skip neighbors that aren't valid for path
			        if (neighbor.closed || !neighbor.passable)
			        	continue;

			        var visited = neighbor.visited;
			        if (neighbor.i == curr_node.i || neighbor.j == curr_node.j)
			        	var g_score = curr_node.g + path_grid.G_straight;
			        else
			        	var g_score = curr_node.g + path_grid.G_diagonal;

			        if (!neighbor.visited || g_score < neighbor.g) {
			        	neighbor.visited = true;
			        	neighbor.parent = curr_node;
			        	neighbor.h = neighbor.h || path_grid.getDiagonalDistance(neighbor, end_node);
			        	neighbor.g = g_score;
			        	// Penalize nodes used in other paths
			        	neighbor.f = (neighbor.g + neighbor.h)*(neighbor.penalty);

			        	if (!visited)
			        		open_nodes.push(neighbor);
			        	else
			        		open_nodes.rescoreElement(neighbor);
			        }
			    }
			}
    		return false; // No path found
    	},

    	getGridPosition: function() {
    		return Grid.pxPos2GridPos(this.data.x + this.w/2, this.data.y + this.h/2);
    	},

		takeDamage: function(damage) {
			// Take no damage when shield is on
			if (this.ShieldActive(this)) {
				return;
			}
			// For animation purposes
			this.data.takingdamage = true;
			this.data.hitTimer = this.data.hitTimerMax;
			// Stats
			damage = (damage<0)?-damage:damage;
			this.data.hp = Math.max(0, this.data.hp-damage);
		},
		// Public operations for game logic!
		die: function () {
			// TODO: stats, data management, UI updates, etc
			this.data.alive = false;
			if (this.data.owner>0) {
				liveRed--;
			} else {
				liveGreen--;
			}
		},
		
		_always: function () {
			if (!executing || !this.data.alive) return;
			if (this.attackcd > 0) this.attackcd -= timer.dt;
			if (this.ShieldActive(this)) this.data.shieldTimer -= timer.dt;
			this.data.facing = this.data.facing.mod(2*Math.PI);
			this.data.moving = false;
			this.data.attacking = false;
		},

		_react: function () {
			if (!executing || !this.data.alive) return;
			
			// 'with' allows us to drop the 'this.' in the code here
			try {
				var self = jQuery.extend(true, {}, this);
				with (this) {
					eval(data.instructions);
				}
			} catch (err) {
				console.log(err.message);
				alert("Uh-oh, something broke! Drop us a bug report, and refresh the page to continue using the game!");
				executing = false;
			}
			// Death happens only at the end of a "frame", which is essentially a "turn"
			if (this.data.hp <= 0) {
				this.die();
				return false;
			}
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
	.attr({dt:0, time:new Date().getTime(), starttime: new Date().getTime()})
	.bind('EnterFrame', function () {
		if (!executing) return;
		this.dt = 0.001*(new Date().getTime() - this.time);
		this.time = new Date().getTime();
		// Pause execution of game to let go of CPU
		if (HasGameEnded()) {
			// TODO: Display some victory thang
			var winner = '';
			if (liveGreen > liveRed) {
				console.log("Green Wins!");
				winner = "<span style='color:#66ff33'>Green</span>";
			} else if (liveGreen == liveRed) {
				winner = "<span style='color:white'>Everybody</span>";
			} else {
				console.log("Red Wins!");
				winner = "<span style='color:red'>Red</span>";
			}
			$("#game_ui")
				.prepend('<div id="winMessage"><p>'+ winner +' wins!</p></div>');
			executing = false;
		}
	});

}

// Parameters for evaluating end of game. Data is cheaper than processing
var liveGreen;
var liveRed;
var maxGameLength = 45000; // 45 seconds
function HasGameEnded() {
	return (liveGreen == 0 || liveRed == 0 || (timer.time-timer.starttime) > maxGameLength)
}

function InitializeGame() {
	// Spawn them drones
	if (clientmode) console.log("Cleaning up");
	
	var gameObjects = Crafty("Tridata, Trisim, Trident, Diadata, Diasim, Diamond");
	gameObjects.each(function(){
		this.destroy();
	})
	if (servermode) console.log("Server mode detected...Creating simulators");
	if (clientmode) console.log("Client mode detected...Creating renderers");
	var n = 5;
	liveGreen = liveRed = n;
	var gap = (Crafty.viewport.height-20)/(n+1);
	for (var i = 0; i < n; i++) {
		// Container for the data that is expected to be piped away or piped in
		var thisData = Crafty.e("Tridata, DroneData")
		.attr({x: 50, y: gap*(i+1), owner: 0});
		var thatData = Crafty.e("Diadata, DroneData")
		.attr({x: Crafty.viewport.width-80, y: gap*(i+1), owner: 1, facing: Math.PI});

		if (servermode) {
			var thisOps = Crafty.e("Trisim, DroneOps")
			.attr({x: 50, y: gap*(i+1), w: 30, h: 30, owner: 0, data: thisData});
			var thatOps = Crafty.e("Diasim, DroneOps")
			.attr({x: 50, y: gap*(i+1), w: 30, h: 30, owner: 1, data: thatData});
		}
		
		if (clientmode) {
			Crafty.e("Trident, 2D, Canvas, DroneDraw")
			.attr({x: 50, y: gap*(i+1), w: 30, h: 30, owner: 0, data: thisData});
			Crafty.e("Diamond, 2D, Canvas, DroneDraw")
			.attr({x: 50, y: gap*(i+1), w: 30, h: 30, owner: 1, data: thatData});
		}
	}
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


function RunGame() {
	Crafty.init(600, 300);
	Crafty.background('rgba(0,0,0,100)');
	CreateDrones();
	//CreateGUI();
	//CreateBall();
	//CreateScoreBoards();

  // Create grid
  Grid = new PathingGrid();
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
  }    

  // Converts pixel position to grid cell
  this.pxPos2GridPos = function(px_x, px_y) {
    var i = Math.floor(px_y/this.cell_height);
    var j = Math.floor(px_x/this.cell_width);
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
          upper_left_cell = this.pxPos2GridPos(Math.max(drone.data.x - drone.w/2, 0),
                                               Math.max(drone.data.y - drone.h/2, 0));
          lower_right_cell = this.pxPos2GridPos(Math.min(drone.data.x + 1.5*drone.w,
                                                 Crafty.viewport.width-1), 
                                                Math.min(drone.data.y + 1.5*drone.h,
                                                 Crafty.viewport.height-1));
          for (var i = upper_left_cell.i; i <= lower_right_cell.i; i++) {
            for (var j = upper_left_cell.j; j <= lower_right_cell.j; j++) {
              this.nodes[i][j].passable = false;
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
  }
}

function CreateGUI() {
	var defaultgreen = "attack(NearestEnemy());";
	var defaultred = "attack(NearestEnemy());";
	$("#game_ui")
		.append('Green: <input type="text" id="greenstruction" value="'+defaultgreen+'"><br>');
	$("#game_ui")
		.append('Red: <input type="text" id="redstruction" value="'+defaultred+'"><br>');
	$("#game_ui")
		.append('<input type="button" id="ready" value="Ready!" />')
	$("#ready")
		.click(function(){
			Crafty("Trisim").each(function(){
				this.data.instructions = (this.data.owner > 0)?($('#redstruction').val()):($('#greenstruction').val());
			});
			Crafty("Diasim").each(function(){
				this.data.instructions = (this.data.owner > 0)?($('#redstruction').val()):($('#greenstruction').val());
			});

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
		deathTimer:.2,
		hitTimerMax:.2,
		init:function (){
			this.deathParticles = new ParticleSystem(20, 50);
			this.gunParticles = new ParticleSystem(4, 0, true);
			//console.log(this.particles);
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
					//drawBeams(ctx, pos, point, this.data.targetPos, this.color);
					this.gunParticles.setParams(this.color, false, pos, this.data.targetPos, this.data.facing);
					this.gunParticles.draw(ctx, pos);
				}
				// TODO: Hit animation
				if (this.data.takingdamage) {
					this.data.hitTimer -= timer.dt;
					if (this.data.hitTimer <= 0) {
						this.data.hitTimer = this.hitTimerMax;
						this.data.takingdamage = false;
					}
				}
			} else if (this.deathTimer > 0) {
				this.deathParticles.setParams(0, true);
				this.deathParticles.draw(ctx, pos);
				// Death animation stage
				this.deathTimer -= timer.dt;
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
		instructions:"attack(NearestEnemy());",
		facing: 0,
		hp: 0,
		// unit stats
		maxhp: 20,
		attackdmg: 3.5,
		attackrange: 200,
		attackcdmax: 1,
		movespeed: 55,
		turnspeed: 6,
		// Graphics hack
		hitTimer:.2,
    // Shortest path to current target
    path: null,
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
			this.data.moving = true;
			this.data.x += Math.cos(this.data.facing)*this.data.movespeed*timer.dt;
			this.data.y += -Math.sin(this.data.facing)*this.data.movespeed*timer.dt;
			this._reconcileBounds();
		},
    /* Currently broken. There appears to be a discrepancy between the pixel
       position that lookAt turns to and the pixel position of the center of 
       the next node in the path. */
    moveTo: function(target_x, target_y) {
      console.log(this.data.path);
      var target_grid_pos = Grid.pxPos2GridPos(target_x, target_y);
      var curr_cell = this.getGridPosition();
      if (this.data.path) {
        if (this.data.path.length == 0) {
          if (curr_cell == target_grid_pos)
            return true; // Already at target
          else {
            this.data.path = null;
            return false; // No path to target
          }
        }
        var next_cell = this.data.path[this.data.path.length-1];
        if (curr_cell.i == next_cell.i && curr_cell.j == next_cell.j) {
          this.data.path.pop();
          next_cell = this.data.path[this.data.path.length-1];
          if (!next_cell)
            return true; // Reached target
        }
        if (this.lookAt(Grid.gridPos2PxPos(next_cell))) {
          this.moveFd();
        }
      }
      else
        this.data.path = this.getPath(target_grid_pos);
    },
    getPath: function(target_cell) {
      var path_grid = new PathingGrid(this[0]);
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
            if (prev && !((prev.i == curr.i && curr.i == curr.parent.i) || 
                (prev.j == curr.j && curr.j == curr.parent.j))) {
              res.push(curr);
            }
            else if (!prev)
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
            neighbor.f = neighbor.g + neighbor.h;

            if (!visited)
              open_nodes.push(neighbor);
            else
              open_nodes.rescoreElement(neighbor);
          }
        }
      }
      return []; // No path found
    },
    getGridPosition: function() {
      return Grid.pxPos2GridPos(this.data.x + this.w/2, this.data.y + this.h/2);
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
			// For animation purposes
			this.data.takingdamage = true;
			this.data.hitTimer = 1;
			// Stats
			damage = (damage<0)?-damage:damage;
			this.data.hp = Math.max(0, this.data.hp-damage);
		},
		// Public operations for game logic!
		die: function () {
			// TODO: stats, data management, UI updates, etc
			this.data.alive = false;
		},
		_always: function () {
			if (!executing || !this.data.alive) return;
			if (this.attackcd > 0) this.attackcd -= timer.dt;
			this.data.facing = this.data.facing.mod(2*Math.PI);
			this.data.moving = false;
			this.data.attacking = false;
		},
		_react: function () {
			if (!executing || !this.data.alive) return;
			// 'with' allows us to drop the 'this.' in the code here
			with (this) {
				eval(this.data.instructions);
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
		.attr({dt:0, time:new Date().getTime()})
		.bind('EnterFrame', function () {
			this.dt = 0.001*(new Date().getTime() - this.time);
			this.time = new Date().getTime();
		});

	// Spawn them drones
	if (servermode) console.log("Server mode detected...Creating simulators");
	if (clientmode) console.log("Client mode detected...Creating renderers");
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


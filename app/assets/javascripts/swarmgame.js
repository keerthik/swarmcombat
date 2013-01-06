function RunGame() {
	Crafty.init(600, 300);
	Crafty.background('rgb(0,0,0)');
	CreateDrones();
	//CreateBall();
	//CreateScoreBoards();
}

//Paddles
function CreateDrones() {
	
	Crafty.c("Drone", {
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
			var pos = {	x: po._x, y: po._y};
			var size = po._w;
			// Draw triangle facing angle from x-axis, of dimension size
			var point = drxnVector(this.facing, size);
			this.color = (this.owner > 0)?'rgb(255,0,0)':'rgb(0,255,0)';
			drawTriangle(ctx, pos, point, this.color);
			drawHp(ctx, pos, size, this.hp, this.maxhp, this.color);
		},
		_triggerKey:{13:1},
		_keyup: function (e) {
			if (this._triggerKey[e.key]) {
				this.instructions = $('#greenstruction').val();
			}
		},
		_react: function () {
			// Apparently this is necessary to make the draw function work
			this.x += 0;
			eval(this.instructions);
		}
	});
	for (var i = 0; i < 5; i++) {
		Crafty.e("2D, Canvas, Drone")
			.attr({x: 20, y: 40*(i+1), w: 20, h: 20, owner: 0});
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


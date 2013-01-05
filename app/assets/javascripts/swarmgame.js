function RunGame() {
	Crafty.init(600, 300);
	Crafty.background('rgb(0,0,0)');
	CreateDrones();
	CreateBall();
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
		init:function (){
			this.hp = this.maxhp;
		},
		_draw: function (ctx, po){
			var pos = {	x: po._x,
						y: po._y,
						w: po._w,
						h: po._h
						};
			var size = 20;
			// Draw triangle facing angle from x-axis, of dimension size
			var point = drxnVector(this.facing, size);
			drawTriangle(ctx, pos, point, 'rgb(0,255,0)');
			drawHp(ctx, pos, size, this.hp, this.maxhp, 'rgb(255,0,0)');
		},
		_triggerKey:{13:1},
		_keyup: function (e) {
			if (this._triggerKey[e.key]) {
				this.instructions = $('#greenstruction').val();
			}
		},
		_react: function () {
			//console.log($('#greenstruction').val());
			eval(this.instructions);
		}
	});
	Crafty.e("Trident, 2D, Canvas, Drone")
		.bind('Draw', function (e) {
			// Custom Vector art
			this._draw(e.ctx, e.pos);
		})
		.bind('EnterFrame', function () {
			this._react();
		})
		.bind('KeyUp', function(e) {
			this._keyup(e);
		})
		.attr({x: 20, y: 20, w: 20, h: 20 });
	Crafty.e("Diamondback, 2D, Canvas, Color, Multiway")
		.color('rgb(0,255,0)')
		.attr({ x: 580, y: 100, w: 10, h: 100 })
		.multiway(4, { UP_ARROW: -90, DOWN_ARROW: 90 });
}
//Ball
function CreateBall() {
	Crafty.e("2D, Canvas, Color, Collision")
		.color('rgb(0,255,255)')
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
		})
		.onHit('Paddle', function () {
			this.dX *= -1;
		})
}
//Score boards
function CreateScoreBoards() {
	Crafty.e("LeftPoints, DOM, 2D, Text")
		.attr({ x: 20, y: 20, w: 100, h: 20, points: 0 })
		.text("0 Points")
		.textColor('#FF0000');
	Crafty.e("RightPoints, DOM, 2D, Text")
		.attr({ x: 515, y: 20, w: 100, h: 20, points: 0 })
		.text("0 Points")
		.textColor('#00FF00');
}


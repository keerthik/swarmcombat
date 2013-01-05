function RunGame() {
	Crafty.init(600, 300);
	Crafty.background('rgb(0,0,0)');
	CreatePaddles();
	CreateBall();
	//CreateScoreBoards();
}

//Paddles
function CreatePaddles() {
	Crafty.c("Triangle", {
		ready:true,
		init:function (){
		},
		_draw:function (ctx, po){
			var pos = {	x: po._x,
						y: po._y,
						w: po._w,
						h: po._h
						};
			var size = 20;
			// Draw triangle facing angle from x-axis, of dimension size
			var point = drxnVector(this.facing, size);
			drawTriangle(ctx, pos, point);
		},
	});
	Crafty.e("Trident, 2D, Canvas, Triangle, Multiway")
		.bind('Draw', function (e) {
			// Custom Vector art
			this.facing += 0.01;
			this._draw(e.ctx, e.pos);
		})
		//.color('rgb(255,0,0)')
		.attr({x: 20, y: 20, w: 20, h: 20, facing:0 })
		.multiway(4, { W: -90, S: 90 });
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


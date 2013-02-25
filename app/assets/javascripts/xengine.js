function drxnVector(angle, scale) {
	var point = new Crafty.math.Vector2D(	scale*Math.cos(angle),
											-scale*Math.sin(angle));
	return point;
}
// Motherflipping Javascript has a "buggy" modulo implementation - doesn't use Euclidean division
Number.prototype.mod = function(n) {
	return ((this%n)+n)%n;
}

function drawTriangle(ctx, pos, apex, color) {
	ctx.lineWidth = 2;
	ctx.strokeStyle = color;
	ctx.beginPath();
	// Draw Triangle
	ctx.moveTo(pos.x - apex.x/2 + apex.y/2, pos.y - apex.y/2 - apex.x/2);
	ctx.lineTo(pos.x - apex.x/2 - apex.y/2, pos.y - apex.y/2 + apex.x/2);
	ctx.lineTo(pos.x + apex.x/2, pos.y + apex.y/2);
	ctx.lineTo(pos.x - apex.x/2 + apex.y/2, pos.y - apex.y/2 - apex.x/2);
	ctx.stroke();
	
}

function drawHp(ctx, pos, size, hp, hpmax, color) {
	ctx.beginPath();
	ctx.rect(pos.x-size/2-5, pos.y-size/2-12, size+10, 8);
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fill();
	ctx.lineWidth = 1.5;
	ctx.strokeStyle = color;
	ctx.stroke();

	ctx.beginPath();
	ctx.rect(pos.x-size/2-3, pos.y-size/2-10, (hp/hpmax)*(size+6), 3);
	ctx.fillStyle = 'rgb(0,255,0)';
	ctx.fill();
}

function drawShields(ctx, pos, size) {
	ctx.globalCompositeOperation = "source-over";
	ctx.globalCompositeOperation = "lighter";
	//Random colors
	var r = Math.random()*55>>0;
	var g = Math.random()*55>>0;
	var b = Math.random()*255>>0;
	var coreColor = "rgba("+r+", "+g+", "+b+", 0.5)";
	
	var radius = 1.3*size;
	var gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
	gradient.addColorStop(0, "black");
	gradient.addColorStop(0.7, coreColor);
	gradient.addColorStop(0.75, "rgba(230, 230, 230, .9)");
	gradient.addColorStop(0.9, coreColor);
	gradient.addColorStop(1, "black");
	
	ctx.fillStyle = gradient;
	
	ctx.beginPath();
	ctx.arc(pos.x, pos.y, radius, 2*Math.PI, false);
	ctx.fill();

}

// Deprecated style of drawing lasers
function drawBeams(ctx, pos, apex, targetPos, color) {
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.moveTo(pos.x - apex.x/4 - apex.y/3, pos.y - apex.y/4 + apex.x/3);
	ctx.lineTo(targetPos.x, targetPos.y);
	ctx.moveTo(pos.x - apex.x/4 + apex.y/3, pos.y - apex.y/4 - apex.x/3);
	ctx.lineTo(targetPos.x, targetPos.y);
	ctx.stroke();
}

// Used for particle system
function particle()
{
	this.x = 0;
	this.y = 0;
	speed = 100;
	//Lets add random velocity to each particle
	this.vx = Math.random()*speed-.5*speed;
	this.vy = Math.random()*speed-.5*speed;
	
	//Random colors
	var r = Math.random()*255>>0;
	var g = Math.random()*255>>0;
	var b = Math.random()*255>>0;
	this.color = "rgba("+r+", "+g+", "+b+", 0.5)";

	//Random size
	this.radius = Math.random()*2+4;
}

// Used for particle system - has a direction
function sprayParticle()
{

	this.setDirection = function (facing, firing) {
		var speed = 250;
		var vector = drxnVector(facing, speed);
		//Lets add random velocity to each particle
		this.vx = firing?vector.x + Math.random()*.05*speed-.025*speed:0;
		this.vy = firing?vector.y + Math.random()*.05*speed-.025*speed:0;
	};

	this.x = 0;
	this.y = 0;
	
	this.vx = 30 + Math.random()*6-3;
	this.vy = 40 + Math.random()*6-3;
	
	//Random colors
	var r = Math.random()*255>>0;
	var g = Math.random()*255>>0;
	var b = Math.random()*255>>0;
	this.color = "rgba("+r+", "+g+", "+b+", 0.5)";

	//Random size
	this.radius = Math.random()*2+4;	
}

function ParticleSystem(count, bounds, spray) {
	if (arguments.length < 3) spray = false;
	
	this.color = 'rgb(255,0,0)';
	this.once = false;
	
	this.init = function (){
		this.particles = [];
		for(var i = 0; i < count; i++)
		{
			//This will add 50 particles to the array with random positions
			if (spray)
				this.particles.push(new sprayParticle());
			else
				this.particles.push(new particle());
			
		}
	};
	this.init();
	this.setParams = function (color, once, pos, target, facing, firing) {
		// Set custom color, 0 for randomized
		if (color != 0 && typeof color != "undefined") {
			for (var i = 0; i < this.particles.length; i++) {
				this.particles[i].color = color;
			}
		}
		this.once = once;
		if(arguments.length < 3) return;
		for (var i = 0; i < this.particles.length; i++) {
			var p = this.particles[i];
			var myPos = new Crafty.math.Vector2D(pos.x, pos.y);
			if (new Crafty.math.Vector2D(p.x, p.y).magnitudeSq() > myPos.distanceSq(new Crafty.math.Vector2D(target.x, target.y))) {
				p.x = 0;
				p.y = 0;
			}
			if (p.x == 0 && p.y == 0) {
				p.setDirection(facing, firing);
			}
		}
	};
	this.draw = function(ctx, pos, dt) {
		ctx.globalCompositeOperation = "source-over";
		ctx.globalCompositeOperation = "lighter";
		
		//console.log(dt);
		for(var t = 0; t < this.particles.length; t++)
		{
			var p = this.particles[t];
			
			ctx.beginPath();

			//Propel by velocity, taking time into account
			p.x += p.vx*dt;
			p.y += p.vy*dt;

			//Reset particle on leaving -- or stop drawing it
			if (!spray) {
				if(Math.abs(p.x) > bounds || Math.abs(p.y) > bounds) {
					if (this.once) continue;
					p.x = 0; 
					p.y = 0;
					p.vx = Math.random()*20-10;
					p.vy = Math.random()*20-10;
				}
			}
			
			//Time for some colors
			var gradient = ctx.createRadialGradient(p.x+pos.x, p.y+pos.y, 0, p.x+pos.x, p.y+pos.y, p.radius);
			gradient.addColorStop(0, "white");
			gradient.addColorStop(0.4, "white");
			gradient.addColorStop(0.4, p.color);
			gradient.addColorStop(1, "black");
			
			ctx.fillStyle = gradient;
			
			ctx.arc(p.x+pos.x, p.y+pos.y, p.radius, Math.PI*2, false);
			ctx.fill();
		}	
	};
}





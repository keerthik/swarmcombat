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
	// Drawing cannon holes
	ctx.arc(pos.x - apex.x/4 - apex.y/3, pos.y - apex.y/4 + apex.x/3, 2, Math.PI*2, false);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(pos.x - apex.x/4 + apex.y/3, pos.y - apex.y/4 - apex.x/3, 2, Math.PI*2, false);
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
	
	//Lets add random velocity to each particle
	this.vx = Math.random()*10-5;
	this.vy = Math.random()*10-5;
	
	//Random colors
	var r = Math.random()*255>>0;
	var g = Math.random()*255>>0;
	var b = Math.random()*255>>0;
	this.color = "rgba("+r+", "+g+", "+b+", 0.5)";

	//Random size
	this.radius = Math.random()*2+4;
}

function ParticleSystem(count, bounds) {
	this.color = 'rgb(255,0,0)'; 
	
	this.init = function (){
		this.particles = [];
		for(var i = 0; i < count; i++)
		{
			//This will add 50 particles to the array with random positions
			this.particles.push(new particle());
		}
	};
	this.init();
	this.draw = function(ctx, pos, once) {
		ctx.globalCompositeOperation = "source-over";
		ctx.globalCompositeOperation = "lighter";
		
		for(var t = 0; t < this.particles.length; t++)
		{
			var p = this.particles[t];
			
			ctx.beginPath();

			//Lets use the velocity now
			p.x += p.vx;
			p.y += p.vy;

			//Reset particle on leaving -- or stop drawing it
			if(p.x < -bounds || p.x > bounds || p.y < -bounds || p.y > bounds) {
				if (once) continue;
				p.x = 0; 
				p.y = 0;
				p.vx = Math.random()*20-10;
				p.vy = Math.random()*20-10;
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





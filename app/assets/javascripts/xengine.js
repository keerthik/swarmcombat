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
	ctx.beginPath();
	ctx.strokeStyle = color;
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

function drawBeam(ctx, pos, targetPos, color) {
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.moveTo(pos.x, pos.y);
	ctx.lineTo(targetPos.x, targetPos.y);
	ctx.stroke();
}
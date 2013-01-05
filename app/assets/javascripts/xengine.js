function drxnVector(angle, scale) {
	var point = new Crafty.math.Vector2D(	scale*Math.cos(angle),
											scale*Math.sin(angle));
	return point;
}

function drawTriangle(ctx, pos, apex) {
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.strokeStyle = 'rgb(255,0,0)';
	ctx.moveTo(pos.x - apex.x/2 + apex.y/2, pos.y - apex.y/2 - apex.x/2);
	ctx.lineTo(pos.x - apex.x/2 - apex.y/2, pos.y - apex.y/2 + apex.x/2);
	ctx.lineTo(pos.x + apex.x/2, pos.y + apex.y/2);
	ctx.lineTo(pos.x - apex.x/2 + apex.y/2, pos.y - apex.y/2 - apex.x/2);
	ctx.stroke();
}
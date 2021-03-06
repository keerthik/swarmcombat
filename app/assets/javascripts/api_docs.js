var docs = {
	// Macro actions
	Retreat: {
		format: 'action',
		type: 'action',
		docstring: 'The drone will try to maneuver away from all the enemy units, giving priority to evading the closest enemies',
		code: '',
	},

	Regroup: {
		format: 'action',
		type: 'action',
		docstring: 'The drone will try to maneuver towards the general location of its allies',
		code: '',
	},

	// Core actions
	Attack: {
		format: 'action',
		type: 'action',
		parametric: true,
		parameters: ['drone'],
		docstring: 'The drone will attempt to attack the target drone.\n If the target is not in range, the drone will try to maneauver into range first',
		code: 'Attack(%drone%)',
	},

	UseShield: {
		format: 'action',
		type: 'action',
		docstring: 'The drone will attempt to use its shield, briefly making it invulnerable. Each drone may only use their shield once per game.',
		code: '',
	},

	moveTowardsUnit: {
		format: 'action',
		type: 'action',
		parametric: true,
		parameters: ['drone'],
		docstring: 'The drone will maneuver towards the target drone',
		code: '',
	},

	moveTo: {
		format: 'action',
		type: 'action',
		parametric: true,
		parameters: ['number', 'number'],
		docstring: 'The drone will maneuver towards the target location',
		code: '',
	},

	self: {
		format: 'value',
		type: 'drone',
		docstring: 'The drone running this instruction',
		code: '',
	},

	GetHP: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['drone'],
		docstring: 'Current hit points of the drone',
		code: '',
	},

	MaxHP: {
		format: 'value',
		type: 'number',
		docstring: 'Max hitpoints of a drone. Use this with a fractional multiplier for detecting hitpoint thresholds',
		code: '',
	},

	Not:{
		format: 'value',
		type: 'boolean',
		parametric: true,
		parameters: ['boolean'],
		docstring: 'Negates the boolean argument',
		code: '',
	},

	HasShield: {
		format: 'value',
		type: 'boolean',
		parametric: true,
		parameters: ['drone'],
		docstring: 'True if this drone still has its one-time use shield available',
		code: '',
	},

	ShieldActive: {
		format: 'value',
		type: 'boolean',
		parametric: true,
		parameters: ['drone'],
		docstring: 'True if this drone is currently using its shield',
		code: '',
	},

	NearestAlly: {
		format: 'value',
		type: 'drone',
		docstring: 'The drone object of the nearest live allied unit',
		code: 'NearestAlly()',
	},

	NearestEnemy: {
		format: 'value',
		type: 'drone',
		docstring: 'The drone object of the nearest live enemy unit',
		code: 'NearestEnemy()',
	},


	FirstLiveEnemy: {
		format: 'value',
		type: 'drone',
		docstring: 'The drone object of a live enemy unit.\n All allied drones will have the same value for this expression.\n This value remains unchanged until the resultant drone dies',
		code: '',
	},

	FirstLiveAlly: {
		format: 'value',
		type: 'drone',
		docstring: 'The drone object of a live allied unit.\n All allied drones except one (itself) will have the same value for this expression.\n That one drone will see the value of the next live drone besides itself.\n This value remains unchanged until the resultant drone dies',
		code: '',
	},

	WeakestEnemy:{
		format: 'value',
		type: 'drone',
		docstring: 'The drone object of the live enemy unit with the lowest hitpoints remaining',
		code: '',
	},

	WeakestAlly:{
		format: 'value',
		type: 'drone',
		docstring: 'The drone object of the live allied unit with the lowest hitpoints remaining, thats not the drone itself.\n ',
		code: '',
	},

	IsTakingDamage:{
		format: 'value',
		type: 'boolean',
		parametric: true,
		parameters: ['drone'],
		docstring: 'True if this drone has taken damage from the enemy in the last 2 simulation frames',
		code: 'IsTakingDamage()',
	},

	NoCondition:{
		format: 'value',
		type: 'boolean',
		docstring: 'Always evaluates to true. Use as a catch-all in the bottom of your instruction set.',
		code: '',
	},

	EnemiesInRadius: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['number'],
		docstring: 'The number of live enemy units within the input radius units from itself.\n For reference, the size of the battlefield is %w by %h units',
		code: '',
	},

	AlliesInRadius: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['number'],
		docstring: 'The number of live allied units within the input radius units from itself.\n Does not include self.\n For reference, the size of the battlefield is %w by %h units',
		code: '',
	},
	
	EnemiesLeft: {
		format: 'value',
		type: 'number',
		docstring: 'The number of live enemy units remaining on the battle field.\n',
		code: '',
	},

	AlliesLeft: {
		format: 'value',
		type: 'number',
		docstring: 'The number of live enemy units remaining on the battle field.\n Does not include self',
		code: '',
	},

	DistanceToUnit: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['drone'],
		docstring: 'The number of units of distance to an input drone.\n May be ally or enemy.\n For reference, the size of the battlefield is %w by %h units',
		code: '',
	},

};

function buildAPIDocs() {
	var width = 800;
	var height = 400;
	for (var key in docs) {
		if (docs.hasOwnProperty(key)) {
			var docPiece = '';
			docPiece += '<h1>'+key+'</h1>';
			docPiece += docs[key]['format']=='action'?
					'<span class="action">Action</span>':
					'Type: <span class="value">'+docs[key]['type']+'</span>';
			docPiece += docs[key].hasOwnProperty('parameters')?
			'<br>Parameters: <span class="value">'+docs[key].parameters
			+'</span>':'';
			var docstring = docs[key].docstring
								.replace('%w', '<span class="value">'+ width + '</span>')
								.replace('%h', '<span class="value">'+ height + '</span>');
			docPiece += '<li>' + docstring + '\n</li>';
			$('#documentation').append(docPiece);
		}
	}
}
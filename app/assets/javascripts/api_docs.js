var docs = {
	self: {
		format: 'value',
		type: 'drone.data',
		docstring: 'Use this to access the data members of this drone',
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
		code: '',
	},


	FirstLiveEnemy: {
		format: 'value',
		type: 'drone',
		docstring: 'The drone object of a live enemy unit. All allied drones will have the same value for this expression. This value remains unchanged until the resultant drone dies.',
		code: '',
	},

	FirstLiveAlly: {
		format: 'value',
		type: 'drone',
		docstring: 'The drone object of a live allied unit. All allied drones except one (itself) will have the same value for this expression. That one drone will see the value of the next live drone besides itself. This value remains unchanged until the resultant drone dies.',
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
		docstring: 'The drone object of the live allied unit with the lowest hitpoints remaining, thats not the drone itself',
		code: '',
	},


	IsTakingDamage:{
		format: 'value',
		type: 'boolean',
		docstring: 'True if this drone has taken damage from the enemy in the last 2 simulation frames',
		code: '',
	},

	EnemiesInRadius: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['number']
		docstring: 'The number of live enemy units within the input radius units from itself. For reference, the size of the battlefield is %d by %d units',
		code: '',
	},

	AlliesInRadius: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['number']
		docstring: 'The number of live allied units within the input radius units from itself. Does not include self. For reference, the size of the battlefield is %d by %d units',
		code: '',
	},
	
	EnemiesLeft {
		format: 'value',
		type: 'number',
		docstring: 'The number of live enemy units remaining on the battle field.',
		code: '',
	},

	AlliesLeft {
		format: 'value',
		type: 'number',
		docstring: 'The number of live enemy units remaining on the battle field. Does not include self.',
		code: '',
	},

	DistanceToUnit: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['drone']
		docstring: 'The number of units of distance to an input drone. May be ally or enemy. For reference, the size of the battlefield is %d by %d units',
		code: '',
	},

	// Macro actions
	Retreat: {
		format: 'action',
		type: '',
		docstring: 'The drone will try to maneauver away from all the enemy units, giving priority to evading the closest enemies',
		code: '',
	},

	Regroup
		format: 'action',
		type: '',
		docstring: 'The drone will try to maneauver towards the general location of its allies',
		code: '',
	},

	// Core actions
	Attack: {
		format: 'action',
		type: '',
		parametric: true,
		parameters: ['drone']
		docstring: 'The drone will attempt to attack the target drone. If the target is not in range, the drone will try to maneauver into range first.',
		code: '',
	},

	moveTowardsUnit: {
		format: 'action',
		type: '',
		parametric: true,
		parameters: ['drone']
		docstring: 'The drone will maneauver towards the target drone.',
		code: '',
	},
	
	LookAt: {
		format: 'action',
		type: '',
		parametric: true,
		parameters: ['number', 'number'],
		docstring: 'The drone will rotate to face the target location.',
		code: '',
	},

	moveTo: {
		format: 'action',
		type: '',
		parametric: true,
		parameters: ['number', 'number']
		docstring: 'The drone will maneauver towards the target location',
		code: '',
	},

	moveFd: {
		format: 'action',
		type: '',
		docstring: 'The drone will advance in the direction it is facing, within pathing constraints',
		code: '',
	},


};
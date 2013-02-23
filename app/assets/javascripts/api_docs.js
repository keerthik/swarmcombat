var docs = {
	self: {
		format: 'value',
		type: 'drone.data',
		docstring: ''
	},

	NearestAlly: {
		format: 'value',
		type: 'drone',
		docstring: ''
	},

	NearestEnemy: {
		format: 'value',
		type: 'drone',
	
		docstring: ''
	},

	NearestAlly: {
		format: 'value',
		type: 'drone',
		docstring: ''
	},

	FirstLiveEnemy: {
		format: 'value',
		type: 'drone',
		docstring: ''
	},

	FirstLiveAlly: {
		format: 'value',
		type: 'drone',
		docstring: ''
	},

	WeakestEnemy:{
		format: 'value',
		type: 'drone',
		docstring: ''
	},

	WeakestAlly:{
		format: 'value',
		type: 'drone',
		docstring: ''
	},


	IsTakingDamage:{
		format: 'value',
		type: 'boolean',
		docstring: ''
	},


	// Macro actions
	Retreat: {
		format: 'action',
		type: '',
		docstring: ''
	},

	Regroup
		format: 'action',
		type: '',
		docstring: ''
	},

	EnemiesInRadius: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['number']
		docstring: ''
	},

	AlliesInRadius: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['number']
		docstring: ''
	},
	
	EnemiesLeft {
		format: 'value',
		type: 'number',
		docstring: ''
	},

	AlliesLeft {
		format: 'value',
		type: 'number',
		docstring: ''
	},

	DistanceToUnit: {
		format: 'value',
		type: 'number',
		parametric: true,
		parameters: ['drone']
		docstring: ''
	},

	// Core actions
	lookAt: {
		format: 'action',
		type: '',
		parametric: true,
		docstring: ''
	},

	moveFd: {
		format: 'action',
		type: '',
		docstring: ''
	},

	moveTo: {
		format: 'action',
		type: '',
		parametric: true,
		parameters: ['x', 'y']
		docstring: ''
	},

	moveTowardsUnit: {
		format: 'action',
		type: '',
		parametric: true,
		parameters: ['drone']
		docstring: ''
	},
	
	Attack: {
		format: 'action',
		type: '',
		parametric: true,
		parameters: ['drone']
		docstring: ''
	},

};
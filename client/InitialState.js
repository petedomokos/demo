export const InitialState = {
	//note - users could be in multiple arrays, including other (simplest not to filter)
	//so all of them will need to receive the update actions, not just adminUsers/adminGroups
	//but when creating a new user or group, they dont need to go into other.
	user:{
		settings:{},
		administeredUsers:[],
		administeredGroups:[],
		administeredDatasets:[],
		groupsMemberOf:[],
		datasetsMemberOf:[],
		loadedUsers:[],
		loadedGroups:[],
		loadedDatasets:[],
		loadsComplete:{
			users:'',
			groups:'',
			datasets:''
		},
		journeys:[],
		homeJourney:""
	},
	asyncProcesses:{
		error:{
			loading:{},
			updating:{},
			deleting:{},
			creating:{}
		},
		success:{
			loading:{},
			updating:{},
			deleting:{},
			creating:{}
		},
		loading:{
			user:false,
			users:false,
			group:false,
			groups:false
		},
		updating:{
			user:false,
			group:false,
		},
		deleting:{
			user:false,
			group:false,
		},
		creating:{
			user:false,
			group:false,
		}
	},
	dialogs:{
		createUser:false,
		deleteUser:false,
		createGroup:false,
		deleteGroup:false,
	},
	system:{
		screen:{
			size:"l",
			width:0,
			height:0
		},
		activeJourney:"",
		adhocJourney:{
			id:"adhoc",
			contracts:[],
			profiles:[],
			aims:[],
			goals:[],
			links:[],
			measures:[]
		},
	}
}
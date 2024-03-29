import C from '../Constants'
//import { filterUniqueByProperty } from '../util/helpers/ArrayManipulators'
import { status, parseResponse, logError, fetchStart, fetchEnd, fetchThenDispatch, resetStatus} from './CommonActions'
import auth from '../auth/auth-helper'
	
/*
const initState = {
      dataset:null,
      player: null,
      notes:"",
      surface:surface.default || "",
      fatigueLevel:fatigueLevel.default || "",
      date:Date.now(),
      isTarget:false,
      //location:"", //todo - location geography
      values:[],
  }
  */
function transformNewDatapointForServer(datapoint){
	return datapoint;
}

function transformDatapointForServer(datapoint){
	return datapoint;
}

function transformDatapointForClient(datapoint){
	return datapoint;
}

export const createDatapoint = (datasetId, datapoint) => dispatch => {
    fetchThenDispatch(dispatch, 
		'creating.datapoint',
		{
			url: '/api/datasets/' +datasetId +'/datapoints/create',
			method: 'PUT',
			body:JSON.stringify(datapoint),
			requireAuth:true,
			//this action will also set dialog.createUser = true
			nextAction: data => {
				return {type:C.CREATE_NEW_DATAPOINT, mesg:data.mesg, datasetId:datasetId, datapoint:data }
			}
		})
}

export const createDatapoints = (datasetId, datapoints) => dispatch => {
	//console.log("Action createDatapoints", datasetId, datapoints)
	const user = auth.isAuthenticated()?.user;
	//console.log("user", user)
	const enrichedDatapoints = datapoints.map(d => ({ 
		...d, 
		createdBy:user._id,
		created:new Date()
	}))
	//1. save datapoint to store

    fetchThenDispatch(dispatch, 
		'creating.datapoints',
		{
			url: `/api/users/${user._id}/datasets/${datasetId}/datapoints/create`,
			method: 'PUT',
			body:JSON.stringify(enrichedDatapoints),
			requireAuth:true,
			//this action will also set dialog.createUser = true
			nextAction: data => {
				console.log("next action.....", data)
				return {type:C.CREATE_NEW_DATAPOINTS, mesg:data.mesg, datasetId:datasetId, datapoints:data }
			}
		})
}

/*

NEW ONES CONVERTED FROM DATASET ACTIONS
//to fetch a datapoint in full
export const fetchDatapoint = id => dispatch => {
	console.log('fetchDatapoint', id)
	fetchThenDispatch(dispatch, 
		'loading.datapoint',
		{
			url: '/api/datapoints/' +id, 
			requireAuth:true,
			nextAction: data => {
				console.log('nextAction...load datapoint')
				return {type:C.LOAD_DATASET, datapoint:data}
			}
		})
}
export const fetchDatapoints = () => dispatch => {
    fetchThenDispatch(dispatch, 
        'loading.datapoints',
        {
            url: '/api/datapoints',
            requireAuth:true,
            nextAction: data => {return {type:C.LOAD_DATASETS, datapoints:data}}
        })
}

export const deleteDatapoint = (id, history) => dispatch => {
	fetchThenDispatch(dispatch, 
		'deleting.datapoint',
		{
			url: '/api/datapoints/'+id,
			method: 'DELETE',
			requireAuth:true,
			nextAction: data => {
				history.push("/")
				return {type:C.DELETE_ADMINISTERED_DATASETP, id:id}
			}
		})
}

export const updateDatapoint = (id, formData, history) => dispatch => {
	fetchThenDispatch(dispatch, 
		'updating.datapoint',
		{
			url: '/api/datapoints/'+id,
			method: 'PUT',
			headers:{
	        	'Accept': 'application/json'
	      	},
			body:formData, //not stringify as its a formidable object
			requireAuth:true,
			nextAction: data => {
				console.log('update_administered_datapoint', data)
				if(history){
					history.push("/datapoint/"+id)
				}
				return {type:C.UPDATE_ADMINISTERED_DATASET, datapoint:data}
			}
		})
}

OLD DATAPOINT ONES

export const deleteDatapoint = (datapointId, datapointId) => dispatch => {
	console.log('actions deleteDatapoint datapoint ', datapointId)
	//save to server first. if succ, then save to store
	//for now, whole datapoint is returned and updated in store
	fetchThenDispatch(dispatch, 'updating.datapoint.datapoints', 
		{
			url: '/api/datapoint/'+datapointId+'/datapoint/'+datapointId,
		 	method:'DELETE', 	
		 	requireAuth:true,
		 	processor: data => {
				return {
					type:C.SAVE_DATASET, datapoint:data
				}
			},
			errorHandler:error =>{
				logError(error)
			}
		})
}
export const updateDatapoint = (datapointId, datapoint) => dispatch => {
	fetchThenDispatch(dispatch, 
		'updating.datapoint',
		{
			url: '/api/datapoint/'+datapointId +'/datapoint/'+datapoint._id,
			method: 'PUT',
			body:JSON.stringify(datapoint), //not stringify as its a formidable object
			requireAuth:true,
			processor: data => {
				return {type:C.SAVE_DATASET, datapoint:data}
			}
		})
}
//todo - consider removing this and just use updateDatapoint to add a point ?
export const addDatapoint = (datapoint, datapointId, datapointId) => dispatch => {
	//save to server first. if succ, then save to store
	console.log('actions..addDatapoint datapoint', datapoint)
	fetchThenDispatch(dispatch, 'updating.datapoint.datapoints', 
		{
			url: '/api/datapoint/'+datapointId+'/datapoint/'+datapointId+'/datapoints/add',
		 	method:'PUT', 	
		 	requireAuth:true,
		 	processor: data => {
				return {
					type:C.SAVE_DATASET, datapoint:data
				}
			},
		 	body:JSON.stringify(datapoint),
			errorHandler:error =>{
				logError(error)
			}
		})
}
*/
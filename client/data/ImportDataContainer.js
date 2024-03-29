import { connect } from 'react-redux'
//import { createUser } from '../../actions/DataActions'
import { closeDialog } from '../actions/CommonActions'
import ImportData from './ImportData';
import { createDatapoints } from '../actions/DatapointActions'

const mapStateToProps = (state, ownProps) => {
	console.log("state user", state.user)
	return({
		datasets:state.user.administeredDatasets
	})
}
const mapDispatchToProps = dispatch => ({
	submit(data, importType, info={}){
		if(importType === "datapoints"){
			console.log("submitting datapoints.....",info.datasetId, data)
			dispatch(createDatapoints(info.datasetId, data));
		}
	},
	closeDialog(path){
		//console.log('closing dialog', path)
		dispatch(closeDialog(path))
	}
})

//wrap all 4 sections in the same container for now.
const ImportDataContainer = connect(
	mapStateToProps,
	mapDispatchToProps
	)(ImportData)

export default ImportDataContainer


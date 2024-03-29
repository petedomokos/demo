import mongoose from 'mongoose'
import ContractSchema from './contract.model';
import ProfileSchema from './profile.model';
import AimSchema from './aim.model';
import GoalSchema from './goal.model';
import LinkSchema from './link.model';
import SettingSchema from './setting.model';
import JourneyMeasureSchema from './journey-measure.model';
import MediaSchema from './media.model'

const JourneySchema = new mongoose.Schema({
  userId:{type:mongoose.Schema.ObjectId, ref:'User'},
  //each journey either has a player, coach or team id, ie who the journey is about
  playerId:{type:mongoose.Schema.ObjectId, ref:'User'},
  coachId:{type:mongoose.Schema.ObjectId, ref:'User'},
  groupId:{type:mongoose.Schema.ObjectId, ref:'Group'},
  //users who have admin rights over this journey
  admin:[{type:mongoose.Schema.ObjectId, ref:'User'}],
  //users who have read-only access
  readOnlyAccess:[{type:mongoose.Schema.ObjectId, ref:'User'}],
  /*id:{
    type: String,
    required: 'Journey id is required'
  },*/
  name: String,
  desc:String,
  media:[MediaSchema],
  //users who have admin rights over this journey
  contracts:[ContractSchema],
  profiles:[ProfileSchema],
  aims:[AimSchema],
  goals:[GoalSchema],
  links:[LinkSchema],
  measures:[JourneyMeasureSchema],
  tags:[String],
  settings:[SettingSchema],
  visibility:{type: String, default: "private"},
  updated: Date,
  created: {type: Date,default: Date.now}
})

//module.exports = {
export default mongoose.model('Journey', JourneySchema)

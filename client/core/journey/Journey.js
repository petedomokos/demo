import React, { useEffect, useState, useRef, useCallback } from 'react'
//import { useStateWithCallbackLazy } from 'use-state-with-callback';
import * as d3 from 'd3';
import { makeStyles } from '@material-ui/core/styles'
import Button from '@material-ui/core/Button'

import { withLoader } from '../../util/HOCs';

import { createId, createColour, findFirstFuturePlanet, updatedState } from './helpers';
import journeyComponent from "./journeyComponent"
import { addMonths, startOfMonth, idFromDates } from '../../util/TimeHelpers';
import NameForm from "./form/NameForm";
import MeasureForm from "./form/MeasureForm";
import TargetForm from './form/TargetForm';
import Form from "./form/Form";
import ImportMeasures from './ImportMeasures';
import MilestonesBar from './MilestonesBar';
import KpiView from './KpiView';
import { DIMNS, FONTSIZES, grey10 } from './constants';
//import { openFullScreen } from "./domHelpers"

const newJourney = { _id:"temp", contracts:[], profiles:[], aims:[], goals:[], links:[], measures:[]}

const useStyles = makeStyles((theme) => ({
  root: {
    width:"100%",
    height:"100%",
    position:"relative",
    //marginLeft:DIMNS.journey.margin.left, 
    //marginRight:DIMNS.journey.margin.right,
    //marginTop:DIMNS.journey.margin.top, 
    //marginBottom:DIMNS.journey.margin.bottom,
  },
  overlay:{
    border:"1px solid #C0C0C0",
    position:"absolute",
    background:grey10(9),
    width:"100%",
    height:"100%",
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center",
  },
  svg:{
    //position:"absolute"
  },
  btn:{
    width:DIMNS.ctrls.btnWidth,
    height:DIMNS.ctrls.btnHeight,
    marginRight:"5px",
    fontSize:FONTSIZES.ctrls.btn,
  },
  modal:{
      position:"absolute",
      left:props => props.modal?.left,
      top:props => props.modal?.top,
      width:props => props.modal?.width, 
      height:props => props.modal?.height
  },
  targModal:{
    position:"absolute",
    left:0,
    top:props => props.modal?.targTop,
    width:props => props.modal?.width, 
    height:props => props.modal?.height
  },
  ctrls:{
    display:"flex",
    justifyContent:"space-between"
  },
  leftCtrls:{
    display:"flex"
  },
  rightCtrls:{
    display:"flex",
    justifyContent:"flex-end"
  }
}))

const now = new Date();
const startOfCurrentMonth = startOfMonth(now)
const prevMonths = 12;
const futureMonths = 36;

const numberMonths = prevMonths + futureMonths;
const initChannels = d3.range(numberMonths)
  .map(n => n - prevMonths)
  .map(nr => {
    const startDate = addMonths(nr, startOfCurrentMonth);
    const endDate = addMonths(nr + 1, startOfCurrentMonth);
    return {
      nr,
      startDate,
      endDate,
      isOpen:false,
      id:idFromDates([startDate, endDate])
    }
  })

//width and height may be full screen, but may not be
const Journey = ({ user, data, datasets, availableJourneys, screen, width, height, save, saveDatapoint, setActive, closeDialog, takeOverScreen, releaseScreen, onUpdateProfile, savePhoto }) => {
  console.log("Journey.......", data)
  //bug - although only 6 profs are saved, we end up with 7 ie two currents
  const { _id, player, name, media, contracts, profiles, aims, goals, links, measures, settings, kpis } = data;
  const [journey, setJourney] = useState(null);
  const [channels, setChannels] = useState(initChannels);
  const [withCompletionPaths, setWithCompletionPath] = useState(false);
  const [aligned, setAligned] = useState(false);
  const [modalData, setModalData] = useState(undefined);
  //for now, displayedBar is always milestones
  const [displayedBar, setDisplayedBar] = useState("milestones");
  //const [displayedBar, setDisplayedBar] = useState("");
  const [kpiFormat, setKpiFormat] = useState("actual");
  const selectedKpi = typeof displayedBar === "object" && displayedBar.kpi ? displayedBar.kpi : null;
  //KpiView will display an entire kpiSet, keyed by milestoneId
  const selectedKpiSet = selectedKpi?.kpiSet;
  const shouldShowOverlay = displayedBar === "milestones" || selectedKpiSet;

  //kpiViewData is based on selectedKpiSet, profiles and 
  //todo - finish this - needs the datasetId and the measureId from the kpi. kaybe just grab it from the first profile
  /*
  const kpiSetName = useCallback(kpi => {
    const { datasetId, statId } = kpi;
    const dataset = datasets.find(dset => dset._id === datasetId);
    const stat = dataset?.measures.find(m => m._id === statId);
    return stat?.fullNameLong
  },[JSON.stringify(datasets)])
  */

  //const shouldD3UpdateRef = useRef(true);

  const ctrlsHeight = 0;//10;
  const journeyWidth = width - DIMNS.journey.margin.left - DIMNS.journey.margin.right
  const journeyHeight = height - DIMNS.journey.margin.top - DIMNS.journey.margin.bottom - ctrlsHeight;
  let styleProps = {}
  

  //console.log("styleProps", styleProps)
  const classes = useStyles(styleProps) 
  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  //const modalRef = useRef(null);
  const modalDimnsRef = useRef({ width:500, height:700 });

  //@todo - make a more robust id function - see my exp builder code
  //const nrGoalsCreated = useRef(goals.length);

  const stringifiedProfiles = JSON.stringify(profiles);
  const stringifiedContracts = JSON.stringify(contracts);
  const handleCreateProfile = useCallback((props) => {
    const profile = {
      //put in some default values in case not specified
      yPC:50,
      id:createId(profiles.map(p => p.id), "profile"),
      createdBy:user._id,
      //empty arrays needed before server returns the default ones
      customTargets:[],
      customExpected:[],
      ...props //will be just the date if from milestonesBar
    }
    const _profiles = [ ...profiles, profile];
    save({ ...data, profiles:_profiles });
  },[stringifiedProfiles, user._id])

  const handleCreateContract = useCallback((props) => {
    const contract = {
      //put in some default values in case not specified
      yPC:50,
      id:createId(contracts.map(c => c.id), "contract"),
      createdBy:user._id,
      ...props
    }
    const _contracts = [ ...contracts, contract];
    save({ ...data, contracts:_contracts });
    
  }, [stringifiedContracts, user._id]);

  const handleCreateMilestone = useCallback((dataType, date) => {
    if(dataType === "profile"){
      handleCreateProfile({ date });
    }else{
      handleCreateContract({ date });
    }
  }, [stringifiedProfiles, stringifiedContracts, user._id]);

  const handleDeleteProfile = useCallback((id) => {
    //todo - must delete link first, but when state is put together this wont matter
    const _profiles = profiles.filter(p => p.id !== id);
    save({ ...data, profiles:_profiles });
  }, [JSON.stringify(data)]);

  const handleDeleteMilestone = useCallback((dataType, id) => {
    if(dataType === "profile"){
      handleDeleteProfile(id);
    }else{
      //handleDeleteContract(id);
    }
  }, [stringifiedProfiles]);

  const onSaveValue = useCallback((valueObj, profileId, datasetKey, statKey, key) => {
    if(key === "current"){
      onSaveStatValue(valueObj, datasetKey, statKey);
      return;
    } 
    //trouble - the unsaved value gets removed, and tehn an update to tooltips occurs
    //before the saved value has been adjusted.
    //profile wont ever be current here, as that is dynamically created ratehr than stored
    const profile = profileId === "current" ? 
      profiles.find(p => p.isFuture)
      :
      profiles.find(p => p.id === profileId);

    let obj = {
      ...valueObj,
      datasetKey,
      statKey,
      created:`${new Date()}`,
      //createdBy
      //approvedBy is empty at first
    }
    const updatedProfile = {
      ...profile,
      //for now, we store every single time a new target or expected value is created eg on every drag - good for user analytics anyway
      customTargets:key === "target" ? [ ...profile.customTargets, obj ] : profile.customTargets,
      customExpected:key === "expected" ? [ ...profile.customExpected, obj ] : profile.customExpected,
    }
    //cant use profileId as it may be 'current' which is not updated
    const otherProfiles = profiles.filter(p => p.id !== updatedProfile.id);
    const _profiles = [ ...otherProfiles, updatedProfile]
    //console.log("saving targ or expected value", obj)
    save({ ...data, profiles:_profiles });
    
  }, [stringifiedProfiles, user._id]);

  const onSaveStatValue = useCallback((valueObj, datasetKey, statKey) => { 
    const datasetId = datasets.find(dset => dset.key === datasetKey)._id;
    
    //@todo - if valueObj has completion, then need to convert it to actual
    const datapoint = {
      player:player._id,
      date:valueObj.date,
      values:[{ key:statKey, value: valueObj.actual }],
    }
    saveDatapoint(datasetId, datapoint);
  }, [stringifiedProfiles, user._id]);

  const onSaveInfo = useCallback((profileId, key) => value => {
    console.log("saveinfo", profileId, key, value);
    //special case - date need formatting
    if(key === "date"){
      //@todo - remove creation of Date here - can just store as a string
      const newDate = new Date(value);
      newDate.setUTCHours(21);
      const _profiles = profiles.map(p => p.id === profileId ? ({ ...p, date: newDate }) : p);
      save({ ...data, profiles:_profiles });
      return;
    }else if(key === "photo"){
      //value will be the photo object
      if(profileId === "current"){
        const otherMedia = media.filter(m => m.locationKey !== value.locationKey)
        const newJ = { ...data, media:[ ...otherMedia, value]}
        console.log("newJ", newJ)
        save({ ...data, media:[ ...otherMedia, value]})
        return;
      }
      const _profiles = profiles.map(p => {
        if(p.id !== profileId) { return p; }
        const otherMedia = p.media.filter(m => m.locationKey !== value.locationKey);
        return { ...p, media: [ ...otherMedia, value] }
      });
      console.log("update media...updatedProfiles", _profiles)
      save({ ...data, profiles:_profiles });
      return;
    }
    
    //default case
    const _profiles = profiles.map(p => p.id === profileId ? ({ ...p, [key]: value }) : p);
    console.log("save profiles", _profiles)
    save({ ...data, profiles:_profiles });
    
  }, [stringifiedContracts, user._id]);

  const onSaveSetting = useCallback(newSetting => {
    //console.log("onSaveSetting", newSetting)
    const otherSettings = settings.filter(s => s.key !== newSetting.key);
    const _settings = [ ...otherSettings, newSetting]
    save({ ...data, settings:_settings });
  }, [settings]);

  const onSavePhoto = useCallback(photo => {
    console.log("onSavePhoto", photo)
    const photoData = new FormData();
    photoData.append("photo", photo)
    savePhoto(user._id, photoData);
  }, []);

  useEffect(() => {
    const width = d3.min([journeyWidth * 0.725, 500]);
    const height = d3.min([journeyHeight * 0.725, 700]);
    modalDimnsRef.current = { 
      width,
      height,
      left:((journeyWidth - width) / 2) + "px",
      top:((journeyHeight - height) / 2) + "px"
    }
  }, [journeyWidth, journeyHeight])
  
  //overlay
  useEffect(() => {
    if(!overlayRef.current){return; }
    d3.select(overlayRef.current)
      .style("display", shouldShowOverlay ? "flex" : "none");

    d3.select(containerRef.current)
      .attr("display", shouldShowOverlay ? "none" : "initial");

  }, [shouldShowOverlay])

  return (
    <div className={classes.root}>
        <div className={`${classes.overlay} overlay`} ref={overlayRef}>
          {displayedBar === "milestones" &&
            <MilestonesBar
              user={user}
              data={data}
              datasets={datasets}
              onSelectKpiSet={kpi => setDisplayedBar({kpi, prev:"milestones"})}
              kpiFormat={kpiFormat} 
              setKpiFormat={setKpiFormat}
              takeOverScreen={takeOverScreen}
              releaseScreen={releaseScreen}
              onCreateMilestone={handleCreateMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onSaveValue={onSaveValue}
              onSaveInfo={onSaveInfo}
              onSaveSetting={onSaveSetting}
              onSavePhoto={onSavePhoto}
              screen={screen}
              availWidth={width}
              availHeight={height}
              
            />
          }
          {/**selectedKpiSet && 
            <KpiView 
              name={kpiSetName(selectedKpi)} 
              data={kpiViewData} 
              initSelectedKey={selectedKpi.milestoneId} 
              datasets={datasets} 
              width={screen.width * 0.95} 
              height={screen.height} 
              format={kpiFormat} 
              onClose={() => setDisplayedBar(displayedBar.prev || "")} 
            />
          */}
        </div>
    </div>
  )
}

//export default Journey;
export default withLoader(Journey, ["allDatasetsFullyLoaded"] )

Journey.defaultProps = {
  user:{},
  datasets:[],
  availableJourneys:[],
  screen: {},
  width: 0,
  height: 0,
  save:() => {}
}

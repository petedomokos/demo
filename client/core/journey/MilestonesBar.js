import React, { useEffect, useState, useRef, useCallback } from 'react'
import * as d3 from 'd3';
import { makeStyles } from '@material-ui/core/styles'
import IconButton from '@material-ui/core/IconButton'
import HomeIcon from '@material-ui/icons/Home'
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import ArrowBackIosIcon from '@material-ui/icons/ArrowBackIos';
import Button from '@material-ui/core/Button'
import SelectDate from "../../util/SelectDate";
import Settings from "../../util/Settings";
import milestonesLayout from "./milestonesLayout";
import milestonesBarComponent from "./milestonesBarComponent";
import { DIMNS, FONTSIZES, grey10, JOURNEY_SETTINGS_INFO } from './constants';
import { sortAscending, sortDescending } from '../../util/ArrayHelpers';

const useStyles = makeStyles((theme) => ({
  root: {
    position:"relative",
    //couldnt the height just be the full journey height always for now?
    //until we allow a bar to be shown above the jorney canvas
    //border:"2px solid #C0C0C0",
    width:"100%",
    height:"100%",//props => props.height,
    display:"flex",
    flexDirection:"column",
    //marginLeft:DIMNS.profiles.margin.left, 
    //marginRight:DIMNS.profiles.margin.right,
    //marginTop:DIMNS.profiles.margin.top, 
    //marginBottom:DIMNS.profiles.margin.bottom
  },
  formOverlay:{
    background:"black", 
    opacity:0.5, 
    width:"100%", 
    height:"100%", 
    position:"absolute"
  },
  svg:{
    //position:"absolute"
  },
  ctrls:{
    width:"100%",//DIMNS.milestonesBar.ctrls.width,
    height:props => props.bottomCtrlsBarHeight,
    alignSelf:"center",
    display:props => props.sliderEnabled && props.bottomCtrlsBarHeight !== 0 ? "flex" : "none",
    justifyContent:"center",
    alignItems:"center",
  },
  iconBtn:{
    color:grey10(2),
    marginLeft:"10px",
    marginRight:"10px"
  },
  icon:{
    width:40,
    height:40,
  },
  formContainer:{
    position:"absolute",
    left:props => props.formContainer.left,
    top:props => props.formContainer.top
  },
  textField: {
    //marginLeft: theme.spacing(1),
    //marginRight: theme.spacing(1),
    width: "150px",
  },
  inputColor:{
    color:"black",
    fill:"white",
    backgroundColor: grey10(2),
  },
  dateContainer:{
  },
  formCtrls:{
    width:"150px",
    marginTop:"5px",
    display:"flex",
    justifyContent:"center"
  },
  submit:{
    width:"60px",
    margin:"5px",
    fontSize:"12px",
  },
  cancel:{
    width:"60px",
    margin:"5px",
    fontSize:"12px"
  }
}))

const MilestonesBar = ({ data, datasets, kpiFormat, setKpiFormat, onSelectKpiSet, onCreateMilestone, onDeleteMilestone, takeOverScreen, releaseScreen, screen, availWidth, availHeight, onSaveValue, onSaveInfo, onSaveSetting }) => {
  const { player={}, profiles=[], contracts=[], settings=[] } = data;
  const allMilestones = [ ...profiles, ...contracts ];
  //console.log("MBar datasets", datasets)
  //local state
  const [firstMilestoneInView, setFirstMilestoneInView] = useState(0);
  const [bgMenuLocation, setBgMenuLocation] = useState("");
  const [sliderEnabled, setSliderEnabled] = useState(true);
  const [selectedMilestone, setSelectedMilestone] = useState("");
  const [form, setForm] = useState(null);

  const moreSettings = sortAscending(settings
    .filter(s => s.key !== "currentValueDataMethod")
    .filter(s => s.positionInCurrentCardSettings), 
    d => d.positionInCurrentCardSettings
  )
  
  const shouldAutosaveForm = form?.formType === "date" ? false : true;

  const [layout, setLayout] = useState(() => milestonesLayout());
  const [milestonesBar, setMilestonesBar] = useState(() => milestonesBarComponent());

  const bottomCtrlsBarHeight = screen.isLarge ? DIMNS.milestonesBar.ctrls.height : 0;
  let styleProps = { 
    bottomCtrlsBarHeight, 
    sliderEnabled, 
    formContainer:{left: form?.left || 0, top: form?.top || 0 } 
  };
  const classes = useStyles(styleProps) ;
  const formContainerRef = useRef(null);
  const containerRef = useRef(null);

  const stringifiedProfiles = JSON.stringify(profiles);

  const handleDateChange = useCallback(e => {
    if(!e.target?.value){ return; }
    const value = e.target.value; //must declare it before the setform call as the cb messes the timing of updates up
    setForm(prevState => ({ ...prevState, hasChanged:true, value }))
  }, [form]);

  const handleClickSettingOption = useCallback((key, value) => {
    onSaveSetting({ key, value })
  }, [form]);

  const onClickMoreSettings = useCallback(() => {
    setForm(prevState => ({ ...prevState, shouldShowMoreSettings:true }))
  }, [form]);

  const handleSaveForm = useCallback(e => {
    //if current, it will have already saved when button pressed
    if(form.milestoneId === "current"){
      handleCancelForm();
      return; 
    }
    //new pos of milestone
    const now = new Date();
    const newDate = new Date(form.value);
    const newDateIsPast = newDate < now;
    let newPosition;
    if(newDateIsPast){
      const otherPastMilestones = allMilestones
        .filter(m => m.id !== form.milestoneId && m.id !== "current")
        .filter(m => m.isPast);
      //@todo - bring this numbering methid together with the way it is done in milestonesLayout
      const sorted = sortDescending([ ...otherPastMilestones, { id: form.milestoneId, date: newDate }], d => d.date)
      newPosition = -(sorted.map(m => m.id).indexOf(form.milestoneId) + 1)
    }else{
      const otherFutureMilestones = allMilestones
        .filter(m => m.id !== form.milestoneId && m.id !== "current")
        .filter(m => m.isFuture);
      
      const sorted = sortAscending([...otherFutureMilestones, { id: form.milestoneId, date: newDate }], d => d.date)
      newPosition = sorted.map(m => m.id).indexOf(form.milestoneId) + 1
    }
    
    milestonesBar
      .requiredSliderPosition(newPosition)
      .updateDatesShown(allMilestones);

    setForm(null);
    onSaveInfo("date", form.milestoneType, form.milestoneId, form.value)
  }, [form]);

  const handleCancelForm = useCallback(e => {
    milestonesBar.updateDatesShown(allMilestones);
    setForm(null);
  }, [form]);

  //init
  //decide what needs to update on setSelectedMilestone, and only have that inteh depArray 
  //or alternatively only have that processed in milestoneslayout/kpiLayout
  //so we are not doing teh epensive operations each time
  useEffect(() => {
    //console.log("data useEffect")
    layout
      .format(kpiFormat)
      .datasets(datasets)
      .info(player);

    //profiles go before contracts of same date
    const orderedData = sortAscending([ ...profiles, ...contracts], d => d.date);

    d3.select(containerRef.current).datum(layout(orderedData))

  }, [stringifiedProfiles])

  useEffect(() => {

    const totalAvailHeightStr = d3.select("div.milestone-bar-root").style("height");
    const totalAvailHeight = totalAvailHeightStr.slice(0, totalAvailHeightStr.length - 2);
    const height = d3.min([DIMNS.milestonesBar.maxHeight, totalAvailHeight - bottomCtrlsBarHeight])

    milestonesBar
      .width(availWidth)
      .height(height)
      .styles({
        phaseLabel:{

        },
        profile:{
          
        },
        contract:{

        }
      })
      //.height(kpiListHeight)
      //.profileCardDimns(profileCardDimns)
      //.contractDimns(contractDimns)
      .onTakeOverScreen(takeOverScreen)
      .onReleaseScreen(releaseScreen)
      .onSetSelectedMilestone(setSelectedMilestone)
      .onSetKpiFormat(setKpiFormat)
      .onSelectKpiSet((e,kpi) => { 
        onSelectKpiSet(kpi); 
      })
      .onToggleSliderEnabled(() => setSliderEnabled(prevState => !prevState))
      .onCreateMilestone(onCreateMilestone)
      .onDeleteMilestone(onDeleteMilestone)
      .onSaveValue(onSaveValue)
      //.onCreateMilestone(function(e,d){
        //if(!bgMenuLocation){
          // setBgMenuLocation(e.x);
        //}else{
          //get the two dates either side of it, and find middle
          //addProfile
        //}
      //})
      .setForm(newForm => {
        //todo - handle if current - value is not set, and also may need the key??
        if(!newForm){ milestonesBar.updateDatesShown(allMilestones); }
        //first, always reset to null so SelectDate unmounts and default value is ready to be reloaded
        //@todo - find a better wy of clearing the defaultValue within the SelectDate component instead
        setForm(null);
        setForm(newForm);
      })
      .onMouseover(function(e,d){
        //console.log("mover")
      })
      .onMouseout(function(e,d){
        //console.log("mout")
      })//)

  }, [stringifiedProfiles, screen])

  useEffect(() => {
    //it mustnt be swipable when we want it to be scrollable
    //on large screen, we always want it to be scrollable. 
    milestonesBar.swipable((selectedMilestone || screen.isLarge ? false : true))
  }, [selectedMilestone, screen.isLarge])

  //render
  //@todo - consider having a shouldRender state, and this could also contain info on transition requirements
  useEffect(() => {
    d3.select(containerRef.current).call(milestonesBar);
  }, [selectedMilestone, stringifiedProfiles, screen])

  return (
    <div className={`milestone-bar-root ${classes.root}`}>
      { form && <div className={classes.formOverlay} onClick={handleSaveForm}></div>}
      {form &&
        <div className={classes.formContainer} ref={formContainerRef}>
          {form.formType === "date" &&
            form.milestoneId === "current" ?
              <>
                <Settings
                    options={JOURNEY_SETTINGS_INFO.currentValueDataMethod.options}
                    selectedValue={settings.find(s => s.key === "currentValueDataMethod").value}
                    moreSettings={moreSettings}
                    shouldShowMoreSettings={form.shouldShowMoreSettings}
                    primaryText={item => item.label}
                    secondaryText={item => item.desc}
                    onClickOption={handleClickSettingOption}
                    onClickMoreSettings={onClickMoreSettings} />
                {form.more && <div>more.....</div>}
              </>
              :
              <>
                <SelectDate
                  classes={classes}
                  withLabel={false}
                  dateFormat="YYYY-MM-DD"
                  type="date"
                  defaultValue={form.value}
                  handleChange={handleDateChange}/>
                {form.hasChanged && !shouldAutosaveForm &&
                  <div className={classes.formCtrls}>
                    <Button color="primary" variant="contained" onClick={handleCancelForm} className={classes.cancel}>Cancel</Button>
                    <Button color="primary" variant="contained" onClick={handleSaveForm} className={classes.submit}>Save</Button>
                  </div>}
              </>
          }
        </div>}
        <svg className={classes.svg} ref={containerRef}>
          <defs>
            <filter id="filter1" x="0" y="0">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
            </filter>
            <filter id="filter2" x="0" y="0">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
            </filter>
          </defs>
        </svg>
        {!form && <div className={classes.ctrls}>
          <IconButton className={classes.iconBtn} onClick={milestonesBar.slideBack}
              aria-label="Home" >
              <ArrowBackIosIcon className={classes.icon}/>
          </IconButton>
          <IconButton className={classes.iconBtn} onClick={milestonesBar.slideForward}
              aria-label="Home" >
              <ArrowForwardIosIcon className={classes.icon}/>
          </IconButton>
        </div>}
    </div>
  )
}

MilestonesBar.defaultProps = {
  contracts:[],
  profiles:[],
  data: { },
  datasets: [], 
  kpiFormat: "actual", 
  setKpiFormat: () => {},
  onSelectKpiSet: () => {},
  onCreateMilestone: () => {},
  onDeleteMilestone: () => {}, 
  takeOverScreen: () => {}, 
  releaseScreen: () => {}, 
  screen: {},
  availWidth: 0, 
  availHeight: 0,
  onSaveValue: () => {},
  onSaveInfo: () => {}
}

export default MilestonesBar;
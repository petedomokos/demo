import React, { useEffect, useState, useRef } from 'react'
import { CSSTransition } from "react-transition-group";
import * as d3 from 'd3';
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import Button from '@material-ui/core/Button'
//children
import Strapline from "./Strapline";
import Keypoint from './Keypoint';
import heroImage from '../assets/images/hero-image.png'
import peterDomokos from '../assets/images/peter-domokos.png'
import { grey10 } from "./cards/constants"
import WelcomeMessage from './WelcomeMessage';
import storyAnimationComponent from './storyAnimationComponent';

/*const heroStatement = [
  "Brings together all information and data",
  "into a coherent whole",
  "with the player and their journey",
  "at the heart of it all."
]*/
const heroStatementHeading = "The Missing Link"
const heroStatement = [
  "A user-friendly and inspiring app, centred around the player,",
  "to turn your player development workflow and processes into a joy",
  //"player development data, info & admin meaningful"
]

const keypoints = [
  {
    id:"0",
    title:"Player-centred",
    //desc:"Football academies are complex inter-disciplinary environments. Information can easily get siloed, and key messages and goals can get lost amidst the noise."
    //desc:"The current tools available were designed for businesses with different priorities to football academies. They focus on productivity and efficiency, but at academies, the goal is player development. It is a human process and a learning process.",
  },
  {
    id:"1",
    title:"Easy to use",
    //desc:"jhd djkh jdkh dh dkh dskjhds h dskh dkshds  spiral curriculum, "
  },
  {
    id:"2",
    title:"Promotes MDT Collaboration",
    //desc:"Today’s young players are different. They tend to be more introverted, and spend a lot of time on their phones. This creates an opportunity that clubs are missing out on. For players, the app can be a mobile phone reinforcement of what has been agreed in meetings and informal reviews, and can engage and inform them regularly about their targets and KPIs.  It can support and enhance the face-to-face communication that is key to the relationships between coaches and players. For some players, it can help them to communicate with staff about their progress, especially when they are new to the club and relationships are still being formed."
  },
]

const secondaryPoints = [
  {
    id:"0",
    title:"Supports inter-disciplinary communication",
    //desc:"Football academies are complex inter-disciplinary environments. Information can easily get siloed, and key messages and goals can get lost amidst the noise."
    desc:"The current tools available were designed for businesses with different priorities to football academies. They focus on productivity and efficiency, but at academies, the goal is player development. It is a human process and a learning process.",
  },
  {
    id:"1",
    title:"Focuses on the details that get missed",
    desc:"jhd djkh jdkh dh dkh dskjhds h dskh dkshds  spiral curriculum, "
  },
  {
    id:"2",
    title:"Engages players by gamification, and encourages accountability",
    desc:"Today’s young players are different. They tend to be more introverted, and spend a lot of time on their phones. This creates an opportunity that clubs are missing out on. For players, the app can be a mobile phone reinforcement of what has been agreed in meetings and informal reviews, and can engage and inform them regularly about their targets and KPIs.  It can support and enhance the face-to-face communication that is key to the relationships between coaches and players. For some players, it can help them to communicate with staff about their progress, especially when they are new to the club and relationships are still being formed."
  },
  {
    id:"3",
    title:"Saves time and enables new insights",
    desc:"Switchplay will save time for the data team and help them to make cutting-edge insights because it merges data from all of the different sources that you use. Typically, data staff are having to choose between doing this manually, or losing out on insights."
  }
]
 
const useStyles = makeStyles(theme => ({
  homeRoot: {
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    overflow:"scroll",
    background:grey10(9.5),//"black",
    padding:"5px 2.5%",
    width:"95%",
    //border:"solid",
    borderColor:"red"
  },
  screen:{
    width:"100%",
    //border:"solid",
    borderColor:"pink",
    //height:props => props.screen.height,
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    zIndex:1
  },
  storyAnimationCont:{
    width:"100%",
    height:"300px",
    //border:"solid",
    //borderColor:"yellow",
    display:"flex",
    justifyContent:"center"
  },
  heroStatement:{
    marginTop:"40px",
    marginBottom:"15px",
    width:"100%",
    height:"90px",
    display:"flex",
    flexDirection:"column",
    justifyContent:"space-around",
    alignItems:"center",
    //border:"solid",
    //borderColor:"yellow",
    zIndex:1
  },
  heroStatementHeading:{
    fontSize:"24px",
    marginBottom:"10px",
    color:grey10(1),
    fontFamily: "Helvetica, Sans-Serif"
  },
  heroStatementText:{
    fontSize:"18px",
    //fontStyle: "italic",
    color:grey10(2),
    fontFamily: "Helvetica, Sans-Serif"
  },
  callToAction:{

  },
  layersDiagram:{
    width:"800px",
  },
  topLayer:{
    width:"100%",
    height:"120px",
    display:"flex",
    justifyContent:"space-around",
    alignItems:"center",
    background:"#90EE90",
  },
  bottomLayer:{
    width:"100%",
    height:"120px",
    display:"flex",
    justifyContent:"space-around",
    alignItems:"center",
    background:"#90EE90",
  },
  missingLayer:{
    width:"100%",
    height:"150px",
    display:"flex",
    justifyContent:"space-around",
    alignItems:"center",
    background:"aqua",
    fontSize:"24px"
  },
  savingsLayer:{
    width:"100%",
    height:"0px",
    marginBottom:"0px",
    display:"flex",
    justifyContent:"space-around",
    alignItems:"center",
    background:"aqua"
  },
  coachSaving:{
    marginTop:"-40px",
    marginLeft:"170px",
    fontSize:"14px"
  },
  playerSaving:{
    marginTop:"-40px",
    //marginLeft:"50px",
    fontSize:"14px"
  },
  analystSaving:{
    marginTop:"-40px",
    marginRight:"170px",
    fontSize:"14px"
  },
  layerItem:{
    fontSize:"18px"
  },
  keypoints:{
    width:"80%",
    display:"flex",
    justifyContent:"space-around",
    flexWrap:"wrap",
    border:"solid",
    borderColor:"red"
  },
  keypoint:{
    width:"30%",
    minWidth:"170px",
    maxWidth:"250px",
    height:"300px",
    margin:"10px",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    border:"solid",
    borderColor:"yellow"
  },
  keypointTitle:{
    color:grey10(3),
    width:"100%",
    height:"50px",
    display:"flex",
    flexDirection:"column",
    justifyContent:"center",
    alignItems:"center",
    border:"solid"
  },
  keypointImage:{
    width:"100%",
    height:"calc(100% - 50px)",
    background:"grey",
    border:"solid"
  },
  screenTop:{
    width:"100%", //needs to be responsive so reduces if narrower screen
    height:"210px",
    display:"flex",
    justifyContent:"space-between",
    //border:"solid",
    borderColor:"red"
  },
  screenTopLeft:{
    width:"500px",
    height:"100%",
    overflow:"visible",
    //border:"solid",
    borderColor:"white"

  },
  screenTopRight:{
    width:"calc(100% - 500px)",
    height:"100%",
    display:"flex",
    //justifyContent:"center",
    //border:"solid",
    borderColor:"white"

  },
  screenBottom:{
    marginLeft:"-70px",
    width:"100%",
    height:"250px",
    display:"flex",
    justifyContent:"space-between",
    //border:"solid",
    borderColor:"red"
  },
  screenBottomLeft:{
    width:"50%",
    height:"100%",
    //border:"solid",
    borderColor:"white",
  },
  screenBottomRight:{
    width:"50%",
    height:"100%",
    //border:"solid",
    borderColor:"white",
  },
  keypointContainer:{
    width:"100%",
    height:"50%",
    //border:"solid",
    borderColor:"blue"
  },
  welcome:{
    marginLeft:"-60px",
    height:"150px",
    display:"flex",
    overflow:"visible"
  },
  welcomePhoto:{
    width:"180px",
    height:"120px",
    //border:"solid",
    borderColor:"yellow",
    backgroundImage: `url(${peterDomokos})`,
    backgroundSize: "contain",
  },
  backgroundImage:{
    //position:"absolute",
    //bottom:"80px",
    width:"100%",
    height:"300px",
    //opacity:"0.5",
    backgroundImage: `url(${heroImage})`,
    backgroundSize: "contain",
    //backgroundSize: "cover",
    //border:"solid",
    borderColor:"yellow",
    //zIndex:0
  },
  bottomBorder:{
    display:"none",
    position:"absolute",
    bottom:"0px",
    width:"100%",
    height:"80px",
    background:"black"
  },
  callsToAction:{
    alignSelf:"flex-start"
  },
  demoBtn:{
    zIndex:1,
    height:"24px",
  },
  scrollSection1:{
    width:"100%",
    height:"250px"
  }
}))

/*

add a background image - pass in the window dimns so it can takeup full dimns -> probably use the css way to do it so we can iuse the 'cover' property?
-find the image or another image
 //@todo - if burger, then screen heihgt is less
- impl React tick animation https://www.sabhya.dev/animating-a-check-icon-in-react-with-framer-motion
- choose fonts
- change burger to coming in from top

- add other description stuff to home page for user to scroll to
- direct switchplay.co.uk and switchplay.org to the domain

*/

export default function NonUserHome({ screen }){
   //todo  -do this screen size properly -> may need a container to get it from store
  //const screen = { width: window.innerWidth, height:window.innerHeight }
  const styleProps = {
    screen
  };
  const classes = useStyles(styleProps)

  const [nrKeypointTicksShown, setNrKeypointTicksShown] = useState(0);
  const [nrKeypointTextsShown, setNrKeypointTextsShown ] = useState(0);
  const [storyAnimation, setStoryAnimationComponent] = useState(() => storyAnimationComponent());
  const [sceneNr, setSceneNr] = useState(1)

  const storyAnimationRef = useRef(null);
  

  useEffect(() => {
    const storyAnimationWidth = sceneNr >= 9 ? 600 : 800;// d3.min([screen.width * 0.8, d3.max([screen.width * 0.5, 600]) ]);
    const storyAnimationHeight = storyAnimationWidth * 0.6;
    d3.select(storyAnimationRef.current)
      .on("click", () => { 
        setSceneNr(prevState => (prevState % 10) + 1)
      })
      //.attr("width", storyAnimationWidth) done in the component itself
      //.attr("height", storyAnimationHeight)
      .datum({})
      .call(storyAnimation
        .width(storyAnimationWidth)
        .height(storyAnimationHeight)
        .sceneNr(sceneNr))
        
  }, [screen, sceneNr])

  /*
  useEffect(() => {
    //each keypoint has 2 stages - show tick, then show text
    let n = 1;
    const t = d3.interval(() => {
      if (n > keypoints.length) {
        t.stop();
        return;
      }
      setNrKeypointTicksShown(prevState => prevState + 1);
      setTimeout(() => { setNrKeypointTextsShown(prevState => prevState + 1) }, 500)

      n += 1;
    }, 2000);

  }, [])
  */

  //next- refactor structure so entire right side is one div, with all 4 keypoints
  //move the welcome message and sign up form to bottom left again
  return (
      <div className={classes.homeRoot}>
        <div className={classes.screen}>
          <div style={{ width:"100%", height:"40px" }}></div>
            <div className={classes.storyAnimationCont}>
              <svg className={classes.svg} id={`missing-link-viz-svg`} ref={storyAnimationRef}>
                <defs>
                </defs>
              </svg>
            </div>
            <div style={{ width:"100%", height:"40px" }}></div>

            {sceneNr === 10 && 
              <>
                <div className={classes.heroStatement}>
                  <div className={classes.heroStatementHeading}>{heroStatementHeading}</div>
                  {heroStatement.map(line => 
                    <Typography className={classes.heroStatementText} type="body1" component="p">
                    {line}
                    </Typography>
                  )}
                </div>
                <div className={classes.callToAction}>
                  <Button color="primary" variant="contained" className={classes.registerBtn}>Register Your Interest</Button>
                </div>
              </>
            }
          
          <div style={{ width:"100%", height:"300px" }}></div>
          <div className={classes.keypoints} >
            {keypoints.map(k => 
              <div className={classes.keypoint}>
                <div className={classes.keypointTitle}>{k.title}</div>
                <div className={classes.keypointImage}></div>
              </div>
            )}
          </div>
          {/**<div className={classes.callsToAction}>
            <CSSTransition
              in={true}
              timeout={200}
              classNames="demo-button-transition"
              unmountOnExit
              appear
              onEntered={() => {}}
              onExit={() => {}}
            >
              <Button color="primary" variant="contained" onClick={() => {}} className={classes.demoBtn}>Demo</Button>
            </CSSTransition>
          </div>*/}
          {/**<div className={classes.screenTopRight}>
              <div className={classes.welcome}>
                <WelcomeMessage/>
                <div className={classes.welcomePhoto}></div>
              </div>
              
          </div>*/}
          {/**<div style={{ width:"100%", height:"40px" }}></div>
          <div className={classes.screenBottom}>
            <div className={classes.screenBottomLeft}>
              <div className={classes.keypointContainer}>
                <Keypoint keypoint={keypoints[0]}/>
              </div>
              <div className={classes.keypointContainer}>
                <Keypoint keypoint={keypoints[1]}/>
              </div>
            </div>
            <div className={classes.screenBottomRight}>
              <div className={classes.keypointContainer}>
                <Keypoint keypoint={keypoints[2]}/>
              </div>
              <div className={classes.keypointContainer}>
                <Keypoint keypoint={keypoints[3]}/>
              </div>
            </div>
          </div>*/}
        </div>
        <div style={{ width:"100%", height:"100px" }}></div>
        {/**<div className={classes.scrollSection1}>
          <div className={classes.backgroundImage}></div>
        </div>*/}
        <div style={{ width:"100%", height:"100px" }}></div>
      </div>
  )
}

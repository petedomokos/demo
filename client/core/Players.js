import React, { Fragment, useEffect, useRef } from 'react';
import { withRouter } from 'react-router-dom'
import * as d3 from 'd3';
import SVGImage from "./SVGImage";
import { makeStyles } from '@material-ui/core/styles'
import { NAVBAR_HEIGHT } from "./websiteConstants";
import Services from '../templates/containers/AgencyModern/Services';
import { styles } from "./websiteHelpers";

const { mdUp, smDown } = styles;

const mainImageLarge = {
  url:"website/images/player-as-pro.png",
  rawImgWidth:816,//actual whole is 1100, 
  rawImgHeight:1456, 
  imgTransX:0, 
  imgTransY:0,
  aspectRatio:1.6
}

const mainImageSmall = {
  url:"website/images/player-as-pro.png",
  rawImgWidth:816,//actual whole is 1100, 
  rawImgHeight:1456, 
  imgTransX:0, 
  imgTransY:0,
  aspectRatio:1.6
}


const useStyles = makeStyles(theme => ({
  playersRoot:{
    width:"100%",
    padding:"15vh 0 10vh",
    background:"#1E1E1E",
  },
  topBanner:{
    //border:"solid",
    borderColor:"red",
    height:`calc(100vh - ${NAVBAR_HEIGHT}px)`,
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    [theme.breakpoints.down('sm')]: {
      width:"100vw",
      height:"auto",
      flexDirection:"column",
      justifyContent:"flex-start",
      padding:"30px 0 50px"
    },
  },
  heading:{
    //border:"solid",
    borderColor:"yellow",
    width:"20vw",
    marginRight:"4vw",
    display:"flex",
    flexDirection:"column",
    alignItems:"flex-end",
    [theme.breakpoints.down('sm')]: {
      width:"auto",
      alignItems:"flex-start",
      marginRight:0,
      margin:"40px 0 120px 0",
    },
  },
  mainImageSmall:{
    width:"100vw",
    //height:`${100 * mainImageSmall.aspectRatio}vw`,
    //border:"solid",
    borderColor:"yellow",
  },
  mainImageLarge:{
    width:"25vw",
    height:`${25 * mainImageLarge.aspectRatio}vw`,
    marginLeft:"4vw",
    //border:"solid",
    borderColor:"yellow",
  },
  headingSmallLine:{
    margin:"0 0 20px 0",
    lineHeight:1,
    fontSize:"24px",
    color:'white',
    [theme.breakpoints.only('lg')]: {
      fontSize:"22px",
    },
    [theme.breakpoints.down('md')]: {
      fontSize:"16px",
      margin:"0 0 10px 0",
    },
    [theme.breakpoints.down('xs')]: {
      margin:"0 0 20px 0",
      lineHeight:1,
      fontSize:"14px",
    },
  },
  headingLargeLine:{
    margin:"0 0 25px 0",
    lineHeight:1.2,
    fontSize:"72px",
    color:'white',
    [theme.breakpoints.only('lg')]: {
      fontSize:"66px",
    },
    [theme.breakpoints.down('md')]: {
      fontSize:"48px",
      margin:"0 0 15px 0",
    },
    [theme.breakpoints.down('xs')]: {
      margin:"0 0 15px 0",
      lineHeight:1.2,
      fontSize:"42px",
    },
  }
}))

const PlayersBanner = ({ screen }) =>{
  const mainImgRef = useRef(null);

  const styleProps = { 
    screen
  }
  const classes = useStyles(styleProps);

  useEffect(() => {
  },[]);

  return (
    <div className={classes.playersRoot} id="services" >
      <div className={classes.topBanner}>
        <div className={classes.heading}>
          <div className={classes.headingSmallLine}>GET YOUR PLAYERS</div>
          <div className={classes.headingLargeLine}>THINKING</div>
          <div className={classes.headingSmallLine}>AND</div>
          <div className={classes.headingLargeLine}>ACTING</div>
          <div className={classes.headingSmallLine}>LIKE PROS</div>
        </div>
        <div className={`${classes.mainImageLarge} md-up`} style={mdUp(screen)}>
          <SVGImage image={mainImageLarge} centreHoriz={true} centreVert={true} />
        </div>
        <div className={`${classes.mainImageSmall} sm-down`} style={smDown(screen)}>
          <SVGImage image={mainImageSmall} centreHoriz={true} centreVert={true} />
        </div>
      </div>
      <Services />
    </div>
  )
}
  
export default withRouter(PlayersBanner)

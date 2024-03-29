import React, { useState, useEffect } from 'react'
import * as d3 from 'd3';
import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import IconButton from '@material-ui/core/IconButton'
import HomeIcon from '@material-ui/icons/Home'
import Button from '@material-ui/core/Button'
import auth from '../auth/auth-helper'
import {Link, withRouter} from 'react-router-dom'
import { slide as ElasticMenu } from 'react-burger-menu'
import { show, hide } from './journey/domHelpers';

const activeStyles = { color: "#ff4081" }
const inactiveStyles = { color: "#ffffff" };
const getDynamicStyles = (history, path) => {
  if (history.location.pathname == path){
    return activeStyles;
  }else{
    return inactiveStyles;
  }
}


const useStyles = makeStyles(theme => ({
  root: {
  },
  items:{
    //flexDirection:props => ["s", "m"].includes(props.screenSize) ? "column" : "column"
  },
  logo:{
    [theme.breakpoints.down('sm')]: {
      fontSize:"12px",
    },
    [theme.breakpoints.up('lg')]: {
      //fontSize:"16px",
    },

  },
  homeIcon:{
    [theme.breakpoints.down('sm')]: {
      height:"20px",
      //width:"50px",
    },
    [theme.breakpoints.up('lg')]: {
    },

  },
  menuBtn: {
    [theme.breakpoints.down('md')]: {
      fontSize:"12px",
    },
    [theme.breakpoints.up('lg')]: {
      //fontSize:"16px",
    },
    
  }
}))

const Menu = withRouter(({ history, isHidden, signingOut, screenSize, onSignout }) => {
  const styleProps = { };
  const classes = useStyles(styleProps) 
  const user = auth.isAuthenticated() ? auth.isAuthenticated().user : null;
  const [isOpen, setIsOpen] = useState(false)

  const handleStateChange = state => {
    setIsOpen(state.isOpen);
  }

  //control the burger bar in a useEffect
  useEffect(() => { 
    d3.select(".bm-burger-button").call(isHidden ? hide : show)
  }, [isHidden])

  const menuWidth = 150;

  return (
    <>
      {["s", "m", "l", "xl"].includes(screenSize)  ?
        <>
          <ElasticMenu width={menuWidth} 
            isOpen={isOpen}
            onStateChange={(state) => handleStateChange(state)}
          >
            <div style={{ display:"flex", flexDirection:"column" }}  
                onClick={() => { setIsOpen(false)} }
            >
              <MenuItems 
                user={user} history={history} signingOut={signingOut} 
                screenSize={screenSize} onSignout={onSignout} classes={classes}/>
            </div>
          </ElasticMenu>
        </>
        :
        <MenuItemsWrapper classes={classes}>
          <MenuItems user={user} history={history} signingOut={signingOut} 
                      screenSize={screenSize} onSignout={onSignout} classes={classes} />
        </MenuItemsWrapper>
      }
    </>
  )
})

const MenuItemsWrapper = ({ children, classes }) =>
  <AppBar position="static" className={classes.root}>
      <Toolbar className={classes.items}>
          {children}
      </Toolbar>
  </AppBar>

const MenuItems = ({ user, history, signingOut, screenSize, onSignout, classes }) =>
    <>
       <Typography variant="h6" color="inherit" className={classes.logo}>
          Switchplay
        </Typography>
        <Link to="/">
          <IconButton 
              aria-label="Home" 
              style={getDynamicStyles(history, "/")}>
              <HomeIcon
                  className={classes.homeIcon}/>
          </IconButton>
        </Link>
        <Link to="/datasets/new">
            <Button 
              className={classes.menuBtn}
              style={getDynamicStyles(history, "/datasets/new")}>Dataset+
            </Button>
        </Link>
        {/**<Link to="/visuals">
            <Button 
              className={classes.menuBtn}
              style={getDynamicStyles(history, "/visuals")}>Visuals
            </Button>
        </Link>*/}
        {user && <Link to="/import">
            <Button 
              className={classes.menuBtn}
              style={getDynamicStyles(history, "/import")}>Import
            </Button>
        </Link>}
        {
          !user && (<span>
            <Link to="/signup">
              <Button
                className={classes.menuBtn}
                style={getDynamicStyles(history, "/signup")}>Sign up
              </Button>
          </Link>
          <Link to="/signin">
            <Button 
              className={classes.menuBtn}
              style={getDynamicStyles(history, "/signin")}>Sign In
            </Button>
          </Link>
          </span>)
        }
        {/**
          user && (<span>
            <Link to={"/user/" + auth.isAuthenticated().user._id}>
              <Button
                className={classes.menuBtn}
                style={getDynamicStyles(history, "/user/" + auth.isAuthenticated().user._id)}>My Profile
              </Button>
            </Link>
          </span>)
          */}
        {/**
          user && user.isPlayer && (<span>
            <Link to={"/user/" + auth.isAuthenticated().user._id+"/dashboard"}>
              <Button
                className={classes.menuBtn}
                style={getDynamicStyles(history, "/user/" + auth.isAuthenticated().user._id+"/dashboard")}>My Dashboard
              </Button>
            </Link>
          </span>)
          */}
        {
          user && (<span>
            <Button
              className={classes.menuBtn}
              style={inactiveStyles}
              onClick={() => onSignout(history)}>Sign out
            </Button>
          </span>)
        }
    </>

export default Menu

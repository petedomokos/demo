import React, { Fragment, useEffect, useState } from 'react'
import {Route, Switch, withRouter } from 'react-router-dom'
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { makeStyles } from '@material-ui/core/styles'
import NonUserHomeContainer from './core/containers/NonUserHomeContainer'
import UserHomeContainer from './core/containers/UserHomeContainer'
//import UsersContainer from './user/containers/UsersContainer'
import SigninContainer from './auth/containers/SigninContainer'
import EditUserProfileContainer from './user/containers/EditUserProfileContainer'
import EditDatasetProfileContainer from './dataset/containers/EditDatasetProfileContainer'
import UserContainer from './user/containers/UserContainer'
import GroupContainer from './group/containers/GroupContainer'
import DatasetContainer from './dataset/containers/DatasetContainer'
import CreateUserContainer from './user/containers/CreateUserContainer'
import CreateGroupContainer from './group/containers/CreateGroupContainer'
import CreateDatasetContainer from './dataset/containers/CreateDatasetContainer'
import CreateDatapointContainer from './dataset/datapoints/containers/CreateDatapointContainer'
import PrivateRoute from './auth/PrivateRoute'
import MenuContainer from './core/containers/MenuContainer'
import Profile from './core/profile/Profile'
import auth from './auth/auth-helper'
import ImportDataContainer from './data/ImportDataContainer'
import VisualsContainer from './visuals/VisualsContainer'
import AboutPageContainer from "./core/containers/AboutPageContainer";
import Contact from './core/Contact';
import RequestDemoForm from './core/RequestDemoForm';
import './assets/styles/main.css'

import Sticky from 'react-stickynode';
import { ThemeProvider } from 'styled-components';
import { theme } from './templates/common/theme/agencyModern';
import { DrawerProvider } from './templates/common/contexts/DrawerContext';
import Navbar from './templates/containers/AgencyModern/Navbar';
import data from './templates/common/data/AgencyModern';
import ResetCSS from './templates/common/assets/css/style';
import {
  GlobalStyle,
  ContentWrapper,
} from './templates/containers/AgencyModern/agencyModern.style';

import { COLOURS } from './core/websiteConstants';
import { showDemoForm } from './core/websiteHelpers';

const customiseItemsForUser = (items, user, onSignout) => {
  if(user){ 
    return items
      .filter(it => it.whenToShow.includes("all-users")) //later - allow specif customerId items
      .map(it => {
        if(it.id === "logout"){
          return { ...it, onClick: history => onSignout(history) }
        }
        return it;
      })
  }
  return items
    .filter(it => it.whenToShow.includes("visitor"))
    .map(it => {
      if(it.id === "demo"){
        return { ...it, onClick:showDemoForm }
      }
      return it;
    })
}

const getPathForPage = page => {
  if(page === "home"){ return "/"; }
  //@todo - add paths if anchor links on other pages eg about page
  return "";
}

const getPageFromPath = path => {
  if(path === "/"){ return "home"; }
  //@todo - add pages if needed
  return "other";
}

const updateItemsForPage = (items, currentPage="home") => {
  return items.map(item => {
      //if its an anchor link for a different page, we convert it to a page-link
      if(item.itemType === "anchor-link" && item.page !== currentPage){
        return { ...item, itemType: "page-link", path: getPathForPage(item.page) }
      }
      return item;
  })
}

const getNavBarItemsFromOtherPages = (user, onSignout, path) => {
  const page = getPageFromPath(path);
  return {
    ...data,
    leftMenuItems:updateItemsForPage(data.leftMenuItems, page),
    rightMenuItems:customiseItemsForUser(updateItemsForPage(data.rightMenuItems, page), user, onSignout),
    mobileMenuItems:customiseItemsForUser(updateItemsForPage(data.mobileMenuItems, page), user, onSignout)
  }
}

const getNavBarItemsFromHomePage = (user, onSignout) => {
  const page = "home"//getPageFromPath(path);
  return {
    ...data,
    rightMenuItems:customiseItemsForUser(updateItemsForPage(data.rightMenuItems, page), user, onSignout),
    mobileMenuItems:customiseItemsForUser(updateItemsForPage(data.mobileMenuItems, page), user, onSignout)
  }

}

const useStyles = makeStyles(theme => ({
  app:{
    width:"100%",
    height:"120vh",
    minHeight:"120vh",
    background:props => props.appBg,
  }
}))

const MainRouter = ({ userId, loadUser, loadingUser, screen, updateScreen, requestDemo, onSignout, history }) => {
  //BUG - onSignout leads to the Homepage re-rendering with store.screen reset to init ie 0,0
 
  const styleProps = { appBg: history.location.pathname === "/" ? COLOURS.banner.bg : "#f0ded5" }
  const classes = useStyles(styleProps);
  const jwt = auth.isAuthenticated();
  const user = jwt?.user;
  //480 - portrait phone, 768 - tablets,992 - laptop, 1200 - desktop or large laptop

  const q1 = useMediaQuery('(max-width:575px)');
  const q2 = useMediaQuery('(max-width:768px)');
  const q3 = useMediaQuery('(max-width:990px)');
  const q4 = useMediaQuery('(max-width:1440px)');
  let size;
  if(q1){ size = "xs"; }
  else if(q2){ size = "sm"; }
  else if(q3){ size = "md"; }
  else if(q4){ size = "lg"; }
  else { size = "xl";}

  useEffect(() => {
      const handleResize = () => {
        const orientation = window.innerWidth < window.innerHeight ? "portrait" : "landscape";
        const newScreen = { 
          width: window.innerWidth, 
          height: window.innerHeight, 
          orientation,
          size,
          isLarge:["lg", "xl"].includes(size),
          isSmall:["sm", "xs"].includes(size),
          isMedium:size === "md",
          isMediumDown:["md", "sm", "xs"].includes(size),
          isMediumUp:["md", "lg", "xl"].includes(size)
        }
        //legacy - store it on window too
        window._screen = newScreen;

        updateScreen(newScreen)
      };
      window.addEventListener("resize", handleResize);
      //init
      handleResize();
      return () => {
          window.removeEventListener("resize", handleResize);
      };
  }, [size]);

  useEffect(() => {
    if(jwt && !userId && !loadingUser){
      loadUser(jwt.user._id)
    }
  });

  /*
  add to issues - burger bar shows over the player trophy in mobile view
  for now, we remove entire navbar

  */
  
  return (
    <div className={classes.app}>
      <ThemeProvider theme={theme}>
        <Fragment>
          <ResetCSS />
          <GlobalStyle />
          <ContentWrapper>
            <div style={{ display: jwt ? "none" : null }}>
              <Sticky top={0} innerZ={9999} activeClass="sticky-nav-active">
                <DrawerProvider>
                  <Route path="/:any"><Navbar data={getNavBarItemsFromOtherPages(user, onSignout)} history={history} user={user} screen={screen} /></Route>
                  <Route exact path="/"><Navbar data={getNavBarItemsFromHomePage(user, onSignout)} history={history} user={user} screen={screen} /></Route>
                </DrawerProvider>
              </Sticky>
            </div>
            <Switch>
              <Route path="/about" component={AboutPageContainer}/>
              <Route path="/contact" component={Contact}/>
              <Route path="/signup" component={CreateUserContainer}/>
              <Route path="/signin" component={SigninContainer}/>
              <Route path="/profile" component={Profile}/>
              <Route path="/visuals" component={VisualsContainer} />
              <PrivateRoute path="/import" component={ImportDataContainer} />
              <PrivateRoute path="/datasets/new" component={CreateDatasetContainer}/>
              {jwt ?
                <Route path="/" component={UserHomeContainer} />
                :
                <Route exact path="/" component={NonUserHomeContainer}/>
              }
            </Switch>
            <RequestDemoForm submit={requestDemo} />
          </ContentWrapper>
        </Fragment>
      </ThemeProvider>
    </div>
  )
}

export default withRouter(MainRouter)
import React, { useState, useEffect } from 'react';
import { Input } from '@material-ui/core';
import Header from './components/header/Header';
import Stats from './components/stats/Stats';
import Steps from './components/steps/Steps';
import Attachments from './components/attachments/Attachments';

import './item-index.css';
import './style/components/item-app.css';

function ItemApp({ screen, item, cardTitle, save, close, logo }) {
  const [properties, setProperties] = useState(item);
  const { steps, stats, attachments, people, section } = properties;
  const updateSteps = steps => {
    console.log("updateSteps", steps)
    setProperties(prevState => ({ ...prevState, steps })) 
    save({ ...properties, steps }, false)
  }
  const [editing, setEditing] = useState(false);
  const [applyChangesToAllDecks, setApplyChangesToAllDecks] = useState(false);
  const handleChange = event => { 
    event.stopPropagation();
    const newTitle = event.target.value;
    setProperties(prevState => ({ ...prevState, title:newTitle })) 
    save({ ...properties, title: newTitle }, applyChangesToAllDecks, ["title"])
  }

  const onClickForm = e => {
    e.stopPropagation();
    if(!editing) { setEditing(true); }
  }

  const onClickBg = e => {
    e.stopPropagation();
    if(editing) { setEditing(false); }
  }

  return (
    <div className="item-container" onClick={onClickBg} >
      <div className="item-contents">
        <form className="item-form" onClick={onClickForm}>
          <Input
            id="desc" onChange={handleChange} margin="dense" autoFocus 
            className={`item-input ${editing ? "item-input-editing" : ""}`}
            disableUnderline defaultValue={properties.title} placeholder="Enter Title..."
          />
        </form>
        <div className='stats-steps-outer-wrapper'>
          <Stats stats={stats} screen={screen} />
          <Steps steps={steps} logo={logo} updateSteps={updateSteps} />
        </div>
        <div className='attachments-outer-wrapper'>
          <Attachments attachments={attachments} />
        </div>
      </div>
      <Header 
          screen={screen} 
          cardTitle={cardTitle} 
          sectionTitle={section.title || `Section ${section.nr}`} 
          people={people}
          close={close}
      />
    </div>
  );
}

export default ItemApp;

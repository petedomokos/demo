import React, { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3';
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Button from '@material-ui/core/Button'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import { Input } from '@material-ui/core';
import Icon from '@material-ui/core/Icon'
import { makeStyles } from '@material-ui/core/styles'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import { grey10, COLOURS } from '../constants';

const mockDesc = " ewiof efojjew fewfjew xxxx xccxx eiofj efj fewiof efojjew fewfjew xxxx xccxx eiofj efj fw fefjw efoe wfe fjf ewof oef hhhhhhhh kjdlkd dj uhd dhud dud d houh zzzz zz zz"

const useStyles = makeStyles(theme => ({
  root: {
    position:"absolute",
    left:props => props.left,
    top:props => props.top,
    width:props => props.width,
    height:props => props.height,
    pointerEvents:"all",
  },
  form:{
  },
  input:{
    width:props => props.width,
    height:props => props.height,
    margin:0,
    color:"white",
    fontSize:"20px",
    overflow:"hidden",
    //cursor:"pointer",
    pointerEvents:"all",
    background:COLOURS.DECK.HEADER.BG,
  },
  closeBtn:{
    width:"80px",
    height:"30px",
    margin:"20px"
  }
}))

export function splitMultilineString(str){
  return str.split("\n");
}

export default function DeckTitleForm({ deck, dimns, save, close }) {
//todo - impl code in this component
  const [value, setValue] = useState(deck)
  //console.log("DeckTitleForm", deck)
  const [editing, setEditing] = useState(false);
  //const descLines = desc ? splitMultilineString(desc) : ["No Desc"];
  const styleProps = {
    ...dimns
  }
  const classes = useStyles(styleProps);

  const onClickBg = e => {
    e.stopPropagation() 
    close();
  }

  const handleChange = event => { 
    const newTitle = event.target.value;
    setValue(prevState => ({ ...prevState, title:newTitle })) 
    //console.log("calling save", newTitle)
    save(newTitle)
  }

  //this is a fix to esure autoFocus is triggered
  useEffect(() => { d3.timeout(() => { setEditing(true); }, 1) }, [])

  return (
    <div className={classes.root} onClick={onClickBg}>
      <form className={classes.form}>
        {editing && 
          <Input
            id="desc" onChange={handleChange} margin="dense" autoFocus className={classes.input}
            disableUnderline defaultValue={value.title} placeholder="Enter Title..."
          />
        }
      </form>
    </div>
  )
}

DeckTitleForm.defaultProps = {
  dimns:{}
}
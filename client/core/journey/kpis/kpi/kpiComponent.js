import * as d3 from 'd3';
import { DIMNS, grey10, TRANSITIONS } from "../../constants";
import dragEnhancements from '../../enhancedDragHandler';
import { pcCompletion } from "../../../../util/NumberHelpers"
import { Oscillator, fadeIn, remove } from '../../domHelpers';
import { getTransformationFromTrans } from '../../helpers';
import titleComponent from './titleComponent';
import progressBarComponent from './progressBarComponent';
import listComponent from './listComponent';
import container from './container';
import background from './background';

const CONTENT_FADE_DURATION = TRANSITIONS.KPI.FADE.DURATION;
const AUTO_SCROLL_DURATION = TRANSITIONS.KPIS.AUTO_SCROLL.DURATION;

const MAX_PROGRESS_BAR_HEIGHT = 100;


const mockSteps = [
    { id:"1", desc:"Step 1", complete:false },
    { id:"2", desc:"Step 2", complete:false },
    { id:"3", desc:"Step 3", complete:false },
    { id:"4", desc:"Step 4", complete:false },
    { id:"5", desc:"Step 5", complete:false },
    { id:"6", desc:"Step 6", complete:false },
    { id:"7", desc:"Step 7", complete:false },
    { id:"8", desc:"Step 8", complete:false },
    { id:"9", desc:"Step 9", complete:false },
    { id:"10", desc:"Step 10", complete:false }
  ]


/*

*/
export default function kpiComponent() {
    //API SETTINGS
    // dimensions
    //general
    let DEFAULT_WIDTH = DIMNS.profile.width;
    let DEFAULT_HEIGHT = DIMNS.profile.height;
    let DEFAULT_MARGIN = { left: 0, right:0, top: 0, bottom: 0 };
    let DEFAULT_TITLE_DIMNS = { width: 0, height:0, margin:{ left:0, right:0, top:0, bottom:0 }, fontSize:9 }

    let _width = () => DEFAULT_WIDTH;
    let _height = () => DEFAULT_HEIGHT;
    let _margin = () => DEFAULT_MARGIN;
    let _titleDimns = () => DEFAULT_TITLE_DIMNS;

    let dimns = {};
    //components
    let closedProgressBars = {};
    let openProgressBars = {};

    //per datum
    function updateDimns(data){
        dimns = {};
        return data.forEach((d,i) => {
            const width = _width(d,i)
            const height = _height(d,i);
            const margin = _margin(d,i);
            const contentsWidth = width - margin.left - margin.right;
            const contentsHeight = height - margin.top - margin.bottom;

            const titleDimns = _titleDimns(d,i);

            const progressBarWidth = contentsWidth;

            /*
            I have added a max value for progBarheight. This is best way to deal with numbers not wantitng to be too
            large. but need to work thru the consequences to ensure things are still centred within kpi.

            the other factor is the margins of teh bar 
            */
            //this needs to change so it stays at top when open
            const progressBarHeight = d3.min([MAX_PROGRESS_BAR_HEIGHT, contentsHeight - titleDimns.height]);

            const kpiInfoWidth = contentsWidth;

            const historyWidth = 110;
            const historyHeight = 15;
            const kpiInfoHeight = contentsHeight - titleDimns.height - progressBarHeight - historyHeight;
            
            const progressBarMargin = { 
                //@todo - decide if we need a margin when closed
                left:status(d) === "open" ? 0 : progressBarWidth * 0, 
                right: 0, 
                top: 0, 
                bottom: 0 
            };
            //console.log("kpiH kpiCH titleH pbh", height, contentsHeight, titleDimns.height, progressBarHeight)
            dimns[d.key] = {
                width, height, margin, contentsWidth, contentsHeight,
                titleDimns,
                progressBarWidth, progressBarHeight, progressBarMargin,
                kpiInfoWidth, kpiInfoHeight,
                historyWidth, historyHeight
            }
        })
    }

    function updateComponents(data){
        data.forEach(d => {
            if(!closedProgressBars[d.key]){
                closedProgressBars[d.key] = progressBarComponent()
                    .status("closed")
                    .editable(false)
                
                openProgressBars[d.key] = progressBarComponent()
                    .status("open")
                    .editable(true)
            }
        })
    }

    const DEFAULT_STYLES = {};
    let _styles = () => DEFAULT_STYLES;

    let _name = d => d.name;
    let isEditable = () => false;
    let status = () => "closed";

    //API CALLBACKS
    let onClick = function(){};
    let onEditStep = function(){};
    let onDblClick = function(){};
    let onDragStart = function(){};
    let onDrag = function() {};
    let onDragEnd = function() {};
    let onLongpressStart = function(){};
    let onLongpressDragged = function(){};
    let onLongpressEnd = function(){};
    let onMouseover = function(){};
    let onMouseout = function(){};
    let onDelete = function(){};
    let onSaveValue = function(){};

    /*
    const enhancedDrag = dragEnhancements()
        .onClick((e,d) => {
            console.log("clicked", d)
            onClick.call(this, e, d, { progressBarHeight }); 
        }) //todo - why do i have to write it out like this?
        //.onClick(onClick) not working
        .onDblClick(onDblClick)
        .onLongpressStart(function(e, d){
            console.log("lp...........")
        });
    */

    //const contents = containerComponent();
    //const background = backgroundComponent();
    const title = titleComponent();
    const stepsList = listComponent();
    //const openProgressBar = progressBarComponent()
        //.editable(() => true);
   //const closedProgressBar = progressBarComponent()
        //.editable(() => false);

    function kpi(selection, options={}) {
        const { transitionEnter=true, transitionUpdate=true, log } = options;
        updateDimns(selection.data());
        updateComponents(selection.data());

        /*const drag = d3.drag()
            .on("start", enhancedDrag())
            .on("drag", enhancedDrag())
            .on("end", enhancedDrag());*/

        // expression elements
        selection
            .call(container()
                .className("kpi-contents")
                .transform((d, i) => `translate(${dimns[d.key].margin.left},${dimns[d.key].margin.top})`)
            )
        const kpiContentsG = selection.select("g.kpi-contents");
        kpiContentsG
            .call(background()
                .width((d,i) => dimns[d.key].contentsWidth)
                .height((d,i) => dimns[d.key].contentsHeight)
                .styles((d, i) => ({
                    stroke:"none",
                    fill:/*_styles(d).bg.fill || */"transparent"
                })))
            .call(container().className("name"))
            //.call(container().className("non-selected-progress-bar")
                //.transform((d, i) => `translate(0,${dimns[d.key].titleHeight})`))
            .on("click", onClick)
            //.call(drag)

        //console.log("marginTop titleMarginTop titleHeight", dimns[2].margin.top, dimns[2].titleMargin.top, dimns[2].titleHeight)
        kpiContentsG.select("g.name")
            .call(title
                .width((d,i) => dimns[d.key].titleDimns.width)
                .height((d,i) => dimns[d.key].titleDimns.height)
                .margin((d,i) => dimns[d.key].titleDimns.margin)
                .styles((d,i) => ({
                    primaryTitle:{ 
                        fontSize:dimns[d.key].titleDimns.fontSize,
                        strokeWidth:0.2,
                        ..._styles(d,i).name,
                        dominantBaseline:"central",
                        fontFamily:"helvetica, sans-serifa",
                        fill:grey10(4)
                    },
                    secondaryTitle:{

                    }
                }))
                .primaryTitle(d => d.name ? `${d.nr}. ${d.name}` : `${d.nr}. ${d.datasetName} (${d.statName})`)
                //@todo - make statName a sec title, and measure length of primaryTitle
                //.secondaryTitle(d => d.statName)
                .textDirection("horiz")
                .fontSizeTransition({ delay:CONTENT_FADE_DURATION, duration: AUTO_SCROLL_DURATION}))

    
        //open and closed contents
        kpiContentsG.each(function(data,i){
            //console.log("data-----------------------", data)
            const { contentsHeight, titleDimns, progressBarWidth, progressBarHeight, progressBarMargin, 
                kpiInfoWidth, kpiInfoHeight, historyWidth, historyHeight } = dimns[data.key];

            const closedData = status(data) === "closed" ? [data] : [];
            const openData = status(data) === "open" ? [data] : [];
            //components
            const kpiContentsG = d3.select(this);
            const closedContentsG = kpiContentsG.selectAll("g.closed-kpi-contents").data(closedData, d => d.key);
            closedContentsG.enter()
                .append("g")
                    .attr("class", "closed-kpi-contents")
                    .call(fadeIn)
                    .merge(closedContentsG)
                    //closedkpi doesnt show info so that space is just turned into an extra margin
                    .attr("transform", `translate(0,${titleDimns.height})`)
                    .each(function(d){
                        d3.select(this)
                            .call(closedProgressBars[d.key]
                                    .width(() => progressBarWidth)
                                    .height(() => progressBarHeight)
                                    .margin(() => progressBarMargin)
                                , { transitionEnter, transitionUpdate} )

                    })

            closedContentsG.exit().call(remove)
                
            const openContentsG = kpiContentsG.selectAll("g.open-kpi-contents").data(openData, d => d.key);
            openContentsG.enter()
                .append("g")
                    .attr("class", "open-kpi-contents")
                    .call(fadeIn)
                    .merge(openContentsG)
                    .attr("transform", `translate(0,${titleDimns.height})`)
                    .each(function(d, j){
                        console.log("d", d)
                        d3.select(this)
                            .call(openProgressBars[d.key]
                                .width((d) => progressBarWidth)
                                .height((d) => progressBarHeight)
                                .margin((d) => progressBarMargin)
                                .onSaveValue(onSaveValue))

                        const stepsData = d.steps;
                        const kpiStepsG = d3.select(this).selectAll("g.kpi-steps").data([stepsData]);
                        kpiStepsG.enter()
                            .append("g")
                                .attr("class", "kpi-steps")
                                .merge(kpiStepsG)
                                .attr("transform", `translate(0, ${progressBarHeight})`)
                                .call(stepsList
                                    .width(kpiInfoWidth)
                                    .height(kpiInfoHeight)
                                    .margin({ left:0, right: 0, top:kpiInfoHeight * 0.1, bottom:kpiInfoHeight * 0.1 })
                                    .newItemDesc("Add Step")
                                    .onCreateItem(() => {
                                        //console.log("create new step...")
                                    })
                                    .onEditItem(function(id, dimns){
                                        const { translateY } = getTransformationFromTrans(d3.select(this).attr("transform"));
                                        const _dimns = {
                                            widths:dimns.widths,
                                            margins:dimns.margins,
                                            heights:{
                                                ...dimns.heights,
                                                title:titleDimns.height,
                                                progressBar:progressBarHeight,
                                                stepsAbove:translateY,
                                            }
                                        }
                                        onEditStep(id, _dimns)
                                    })
                                    .onDeleteItem((id) => {
                                        //console.log("delete step...", id)
                                    })
                                    .onToggleItemCompletion(id => {
                                        //console.log("toggle compl", id)

                                    }))
                        
                        kpiStepsG.exit().call(remove);
                                 
                    })

            openContentsG.exit().call(remove, { transition:{ duration: CONTENT_FADE_DURATION }});

            //history
            const historyData = status(data) === "open" && data.lastDataUpdate ? [data] : [];
            const historyG = kpiContentsG.selectAll("g.history").data(historyData, d => d.key);
            historyG.enter()
                .append("g")
                    .attr("class", "history")
                    .call(fadeIn)
                    .each(function(){
                        d3.select(this).append("rect");
                        const mainRowG = d3.select(this).append("g").attr("class", "main-row")
                        mainRowG.append("text").attr("class", "label")
                        mainRowG.append("text").attr("class", "date")
                        mainRowG.selectAll("text")
                            .attr("dominant-baseline", "central")
                            .attr("stroke-width", 0.1)
                            .attr("stroke", grey10(2))
                            .attr("opacity", 0.5)
                    })
                    .merge(historyG)
                    .attr("transform", `translate(${0}, ${contentsHeight - historyHeight})`)
                    .each(function(d){
                        d3.select(this).select("rect")
                            .attr("width", historyWidth)
                            .attr("height", historyHeight)
                            .attr("fill", "none")

                        const mainRowG = d3.select(this).select("g.main-row")
                            .attr("transform", `translate(0, ${historyHeight/2})`)
                        
                        mainRowG.select("text.label")
                            .attr("font-size", 9)
                            .text("Last data:")

                        mainRowG.select("text.date")
                            .attr("x", 37.5)
                            .attr("font-size", 9)
                            .text(d3.timeFormat("%_d %b, %y")(d.lastDataUpdate))
                    })
            
            historyG.exit().call(remove, { transition:{ duration: CONTENT_FADE_DURATION }});
        })
        
        /*kpiContents.select("g.numbers")
            .data(selection.data().map(d => d.numbersData))
            .call(numbers
                .width((d,i) => dimns[d.key].numbersWidth)
                .height((d,i) => dimns[d.key].numbersHeight)
                .margin((d,i) => dimns[d.key].numbersMargin)
            )*/
            //.call(drag)


        return selection;
    }
    
    //api
    kpi.width = function (value) {
        if (!arguments.length) { return _width; }
        _width = value;
        return kpi;
    };
    kpi.height = function (value) {
        if (!arguments.length) { return _height; }
        _height = value;
        return kpi;
    };
    kpi.margin = function (func) {
        if (!arguments.length) { return _margin; }
        _margin = (d,i) => ({ ...DEFAULT_MARGIN, ...func(d,i) })
        return kpi;
    };
    kpi.titleDimns = function (func) {
        if (!arguments.length) { return _titleDimns; }
        _titleDimns = (d,i) => ({ ...DEFAULT_TITLE_DIMNS, ...func(d,i) });
        return kpi;
    };
    kpi.status = function (value) {
        if (!arguments.length) { return status; }
        status = value;
        return kpi;
    };
    kpi.fontSizes = function (values) {
        if (!arguments.length) { return fontSizes; }
        fontSizes = { ...fontSizes, ...values };
        return kpi;
    };
    kpi.styles = function (func) {
        if (!arguments.length) { return _styles; }
        _styles = (d,i) => ({ ...DEFAULT_STYLES, ...func(d,i) });
        return kpi;
    };
    kpi.isEditable = function (value) {
        if (!arguments.length) { return isEditable; }
        if(typeof value === "function"){
            isEditable = value;
        }else{
            isEditable = () => value;
        }
        return kpi;
    };
    kpi._name = function (value) {
        if (!arguments.length) { return _name; }
        if(typeof value === "function"){
            _name = value;
        }
        return kpi;
    };
    kpi.onClick = function (value) {
        if (!arguments.length) { return onClick; }
        onClick = value;
        return kpi;
    };
    kpi.onEditStep = function (value) {
        if (!arguments.length) { return onEditStep; }
        onEditStep = value;
        return kpi;
    };
    kpi.onDblClick = function (value) {
        if (!arguments.length) { return onDblClick; }
        onDblClick = value;
        return kpi;
    };
    kpi.onDragStart = function (value) {
        if (!arguments.length) { return onDragStart; }
        if(typeof value === "function"){
            onDragStart = value;
        }
        return kpi;
    };
    kpi.onDrag = function (value) {
        if (!arguments.length) { return onDrag; }
        if(typeof value === "function"){
            onDrag = value;
        }
        return kpi;
    };
    kpi.onDragEnd = function (value) {
        if (!arguments.length) { return onDragEnd; }
        if(typeof value === "function"){
            onDragEnd = value;
        }
        return kpi;
    };
    kpi.onLongpressStart = function (value) {
        if (!arguments.length) { return onLongpressStart; }
        if(typeof value === "function"){
            onLongpressStart = value;
        }
        return kpi;
    };
    kpi.onLongpressDragged = function (value) {
        if (!arguments.length) { return onLongpressDragged; }
        if(typeof value === "function"){
            onLongpressDragged = value;
        }
        return kpi;
    };
    kpi.onLongpressEnd = function (value) {
        if (!arguments.length) { return onLongpressEnd; }
        if(typeof value === "function"){
            onLongpressEnd = value;
        }
        return kpi;
    };
    kpi.onMouseover = function (value) {
        if (!arguments.length) { return onMouseover; }
        if(typeof value === "function"){
            onMouseover = value;
        }
        return kpi;
    };
    kpi.onMouseout = function (value) {
        if (!arguments.length) { return onMouseout; }
        if(typeof value === "function"){
            onMouseout = value;
        }
        return kpi;
    };
    kpi.onDelete = function (value) {
        if (!arguments.length) { return onDelete; }
        if(typeof value === "function"){
            onDelete = value;
        }
        return kpi;
    };
    kpi.onSaveValue = function (value) {
        if(typeof value === "function"){
            onSaveValue = value;
        }
        return kpi;
    };
    return kpi;
}

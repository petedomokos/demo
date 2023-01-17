import * as d3 from 'd3';
import { DIMNS, grey10 } from "../../constants";
import dragEnhancements from '../../enhancedDragHandler';
import { pcCompletion } from "../../../../util/NumberHelpers"
import { Oscillator } from '../../domHelpers';
import { getTransformationFromTrans } from '../../helpers';
import titleComponent from './titleComponent';
import progressBarComponent from './progressBarComponent';
import container from './container';
import background from './background';


/*

*/
export default function kpiComponent() {
    //API SETTINGS
    // dimensions
    //general
    let DEFAULT_WIDTH = DIMNS.profile.width;
    let DEFAULT_HEIGHT = DIMNS.profile.height;
    let DEFAULT_MARGIN = { left: 0, right:0, top: 0, bottom: 0 };

    let _width = () => DEFAULT_WIDTH;
    let _height = () => DEFAULT_HEIGHT;
    let _margin = () => DEFAULT_MARGIN;

    let dimns = [];

    //common
    function updateCommonDimns(data){
    }

    //per datum
    function updateDimns(data){
        dimns = [];
        return data.forEach((d,i) => {
            const width = _width(d,i)
            const height = _height(d,i);
            const margin = _margin(d,i);
            const contentsWidth = width - margin.left - margin.right;
            const contentsHeight = height - margin.top - margin.bottom;

            const titleWidth = contentsWidth * 0.5;
            //instead of min name font, its better just not to display name if very small
            const titleHeight = d3.min([contentsHeight * 0.3, 10]) 
            //instead of mins, its better just not to display name if very small
            const titleMargin = { top: titleHeight * 0.1, bottom: titleHeight * 0.1 };

            //progressBar is bar, handles and tooltips
            const progressBarWidth = contentsWidth;
            const progressBarHeight = contentsHeight - titleHeight;
            const progressBarMargin = { top: progressBarHeight * 0.1, bottom: progressBarHeight * 0.1 };

            dimns.push({
                width, height, margin, contentsWidth, contentsHeight,
                titleWidth, titleHeight, titleMargin,
                progressBarWidth, progressBarHeight, progressBarMargin
            })
        })
    }

    const DEFAULT_STYLES = {};
    let _styles = () => DEFAULT_STYLES;

    let _name = d => d.name;
    //let isOpen = d => false;
    let isEditable = () => false;
    let isOpen = () => false;
    let withTooltips = () => false;
    let status = () => "closed";


    //API CALLBACKS
    let onClick = function(){};
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

    const enhancedDrag = dragEnhancements()
        .onClick((e,d) => { 
            onClick.call(this, e, d); 
        }) //todo - why do i have to write it out like this?
        //.onClick(onClick) not working
        .onDblClick(onDblClick);

    //const contents = containerComponent();
    //const background = backgroundComponent();
    const title = titleComponent();
    const progressBar = progressBarComponent();

    function kpi(selection, options={}) {
        const { transitionEnter=true, transitionUpdate=true, log} = options;
        updateDimns(selection.data());

        const drag = d3.drag()
            .on("start", enhancedDrag())
            .on("drag", enhancedDrag())
            .on("end", enhancedDrag());

        // expression elements
        selection
            .call(container()
                .className("kpi-contents")
                .transform((d, i) => `translate(${dimns[i].margin.left},${dimns[i].margin.top})`)
            )
        const kpiContentsG = selection.select("g.kpi-contents");
        //console.log("first kpicontentsG", kpiContentsG.node())
        kpiContentsG
            .call(background()
                .width((d,i) => dimns[i].contentsWidth)
                .height((d,i) => dimns[i].contentsHeight)
                .styles((d, i) => ({
                    stroke:"none",
                    fill:"transparent"//_styles(d).bg.fill
                })))
            .call(container().className("name"))
            //.call(container().className("non-selected-progress-bar")
                //.transform((d, i) => `translate(0,${dimns[i].titleHeight})`))
            .on("click", onClick)
            //.call(drag)

        kpiContentsG.select("g.name")
            .call(title
                .width((d,i) => dimns[i].titleWidth)
                .height((d,i) => dimns[i].titleHeight)
                .margin((d,i) => dimns[i].titleMargin)
                .styles((d,i) => ({
                    primaryTitle:{ 
                        fontSize:dimns[i].titleHeight,
                        strokeWidth:0.2,
                        dominantBaseline:"central",
                    },
                    secondaryTitle:{

                    }
                }))
                .primaryTitle(d => `${d.datasetName} (${d.statName})`)
                //@todo - make statName a sec title, and measure length of primaryTitle
                //.secondaryTitle(d => d.statName)
                .textDirection("horiz"))

        kpiContentsG.each(function(d,i){
            //console.log("kpiContents i,d ...stat ", i, d.key, status(d))
            //console.log("isOpen????", isOpen(d))
            const kpiContentsG = d3.select(this);
            //why is this being removed event though no exit defined??????
            //console.log("gs", d3.select(this).selectAll("g").nodes())
            const closedContentsG = d3.select(this).selectAll("g.closed-kpi-contents").data(status(d) === "closed" ? [d] : []);
            closedContentsG.enter()
                .append("g")
                    .attr("class", "closed-kpi-contents")
                    .attr("opacity", 1)
                    .each(function(d, i){
                        //console.log("enter") //its entering each time
                        d3.select(this)//todo - fade in
                    })
                    .merge(closedContentsG)
                    .attr("transform", `translate(0,${dimns[i].titleHeight})`)
                    .call(progressBar
                        .width((d,i) => dimns[i].progressBarWidth)
                        .height((d,i) => dimns[i].progressBarHeight)
                        .margin((d,i) => dimns[i].progressBarMargin))

            closedContentsG.exit().each(function(){
                //will be multiple exits because of the delay in removing
                if(!d3.select(this).attr("class").includes("exiting")){
                    //console.log("removing............................")
                    d3.select(this)
                        .classed("exiting", true)
                        .transition()
                            .duration(400)
                            .attr("opacity", 0)
                            .on("end", function() { 
                                //console.log("removed")
                                d3.select(this).remove(); });
                }
            })
        })

        /*kpiContents.select("g.non-selected-progress-bar")
            .call(progressBar
                .width((d,i) => dimns[i].progressBarWidth)
                .height((d,i) => dimns[i].progressBarHeight)
                .margin((d,i) => dimns[i].progressBarMargin))*/
        
        //non-selected contents
        /*
        kpiContents.each(function(d,i){
            console.log("kpiContents i,d ... ", i, d)
            const kpiContentsG = d3.select(this);
            const nonData = [d];
            console.log("nonData", nonData)
            const closedContentsG = kpiContents.selectAll("g.closed-kpi-contents").data([1]);
            closedContentsG.enter()
                .append("g")
                    .attr("class", "closed-kpi-contents")
                    .each(function(d){
                        console.log("d...",i,  d)
                        d3.select(this)//todo - fade in
                    })
                    .merge(closedContentsG)
                    .call(progressBar
                        .width(() => dimns[i].progressBarWidth)
                        .height(() => dimns[i].progressBarHeight)
                        .margin(() => dimns[i].progressBarMargin))

            closedContentsG.exit().remove();
        })
        */
        
        /*kpiContents.select("g.numbers")
            .data(selection.data().map(d => d.numbersData))
            .call(numbers
                .width((d,i) => dimns[i].numbersWidth)
                .height((d,i) => dimns[i].numbersHeight)
                .margin((d,i) => dimns[i].numbersMargin)
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
    kpi.withTooltips = function (value) {
        if (!arguments.length) { return withTooltips; }
        withTooltips = value;
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
    kpi.isOpen = function (value) {
        if (!arguments.length) { return isOpen; }
        if(typeof value === "function"){
            isOpen = value;
        }else{
            isOpen = () => value;
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
    return kpi;
}

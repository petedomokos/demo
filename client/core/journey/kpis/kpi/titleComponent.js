import * as d3 from 'd3';
import { DIMNS, grey10 } from "../../constants";
import dragEnhancements from '../../enhancedDragHandler';
import container from './container';

/*

*/
export default function titleComponent() {
    //API SETTINGS
    let parentSelector = "";
    let parent = function(){ return d3.select(this); };
    // dimensions
    let DEFAULT_WIDTH = 100;
    let DEFAULT_HEIGHT = 30;
    let DEFAULT_MARGIN = { left: 0, right:0, top: 0, bottom: 0 };
    let contentsWidth;
    let contentsHeight;
    let _width = () => DEFAULT_WIDTH;
    let _height = () => DEFAULT_HEIGHT;
    let _margin = () => DEFAULT_MARGIN;

    function getDimns(d, i, data){
        const width = _width(d,i);
        const height = _height(d,i);
        const margin = _margin(d,i);
        const contentsWidth = width - margin.left - margin.right;
        const contentsHeight = height - margin.top - margin.bottom;

        return {
            width, height, margin, contentsWidth, contentsHeight,
        }
    }

    const defaultStyles = {
        bg:{
            fill:"none",
            stroke:"none"
        },
        name:{
            fontSize:9,
            stroke:grey10(8),
            fill:grey10(8),
            textAnchor:null,
            dominantBaseline:null
        }
    };
    let _styles = () => defaultStyles;
    let transform = () => null;

    let _primaryText = d => d.name;

    let withInteraction = false;


    //API CALLBACKS
    let onNameClick = function(){};
    let onNameDblClick = function(){};
    let onNameLongpressStart = function(){};
    let onNameLongpressEnd = function(){};
    let onNameMouseover = function(){};
    let onNameMouseout = function(){};

    let onDescClick = function(){};
    let onDescDblClick = function(){};

    const enhancedDrag = dragEnhancements();

    function title(selection, options={}) {
        const { transitionEnter=true, transitionUpdate=true, log} = options;

        // expression elements
        selection
            .style("cursor", "pointer")
            .call(container()
                .className("title-contents")
                .transform((d, i) => `translate(${_margin(d,i).left}, ${_margin(d,i).top})`)
                .enter(function(d,i){
                    const contentsG = d3.select(this);

                    contentsG
                        .append("rect")
                            .attr("class", "title-bg")
                            .attr("stroke", "black")
                            .attr("fill", "white");

                    //for now, just have one bg rect for the whole title
                    contentsG
                        .append("g")
                            .attr("class", "name")
                                .append("text");

                })
                .update(function(d,i){
                    const styles = _styles(d, i);
                    const { contentsWidth, contentsHeight }= getDimns(d, i);

                    enhancedDrag
                        .onClick(onNameClick)
                        .onDblClick(onNameDblClick);
                        
                    const d3Drag = d3.drag()
                        .on("start", enhancedDrag())
                        .on("drag", enhancedDrag())
                        .on("end", enhancedDrag());

                    //todo - need to actually remove drag too if necc - check out expBuilder how i did it there - for now, just dont use
                    const drag = withInteraction ? d3Drag : function(){};

                    const contentsG = d3.select(this);

                    contentsG.select("rect.title-bg")
                        .attr("width", contentsWidth)
                        .attr("height", contentsHeight)
                        .attr("fill", styles.bg.fill)
                        .attr("stroke", styles.bg.stroke)
                    
                    //nameG.select("rect")
                        //.attr("width", nameCharWidth * _primaryText(data).length)
                        //.attr("height", nameHeight);

                    const nameTextAnchor = styles.name.textAnchor;
                    const nameDomBaseline = styles.name.dominantBaseline;
                    const nameX = nameTextAnchor === "end" ? contentsWidth : (nameTextAnchor === "middle" ? contentsWidth/2 : 0);
                    const nameY = nameDomBaseline === "bottom" ? contentsHeight : (nameDomBaseline === "central" ? contentsHeight/2 : 0);
                    const nameG = contentsG.select("g.name")
                        .attr("transform", `translate(${nameX},${nameY})`);

                    nameG.select("text")
                        .attr("text-anchor", styles.name.textAnchor)
                        .attr("dominant-baseline", styles.name.dominantBaseline)
                        .attr("font-size", styles.name.fontSize)
                        .attr("stroke", styles.name.stroke)
                        .attr("fill", styles.name.fill)
                        .attr("stroke-width", styles.name.strokeWidth)
                        .text(_primaryText(d) +" " +i) //temp add i so they different 
    
                })
                .exit(function(){
                    //will be multiple exits because of the delay in removing
                    if(!d3.select(this).attr("class").includes("exiting")){
                        d3.select(this)
                            .classed("exiting", true)
                            .transition()
                                .duration(200)
                                .attr("opacity", 0)
                                .on("end", function() { d3.select(this).remove(); });
                    }
                }))
                //.call(drag)

        return selection;
    }
    
    //api
    title.parent = function (value) {
        if (!arguments.length) { return parent; }
        if(typeof value === "string"){
            parentSelector = value;
            parent = function(){ return d3.select(this).select(parentSelector); }
        }else {
            parent = value;
        }
        return title;
    };
    title.width = function (value) {
        if (!arguments.length) { return _width; }
        _width = value;
        return title;
    };
    title.height = function (value) {
        if (!arguments.length) { return _height; }
        _height = value;
        return title;
    };
    title.margin = function (func) {
        if (!arguments.length) { return _margin; }
        _margin = (d,i) => ({ ...DEFAULT_MARGIN, ...func(d,i) })
        return title;
    };
    title.transform = function (value) {
        if (!arguments.length) { return transform; }
        if(typeof value === "function"){
            transform = value;
        }
        return title;
    };
    title.styles = function (func) {
        if (!arguments.length) { return _styles; }
        _styles = (d,i) => {
            const requiredStyles = func(d,i);
            return {
                name:{ ...defaultStyles.name, ...requiredStyles.name },
                bg:{ ...defaultStyles.bg, ...requiredStyles.bg }
                //others here
            }
        };
        return title;
    };
    title.primaryText = function (value) {
        if (!arguments.length) { return _primaryText; }
        if(typeof value === "function"){
            _primaryText = value;
        }
        return title;
    };
    title.onNameClick = function (value) {
        if (!arguments.length) { return onNameClick; }
        onNameClick = value;
        return title;
    };
    title.onNameDblClick = function (value) {
        if (!arguments.length) { return onNameDblClick; }
        onNameDblClick = value;
        return title;
    };
    title.onNameLongpressStart = function (value) {
        if (!arguments.length) { return onNameLongpressStart; }
        if(typeof value === "function"){
            onNameLongpressStart = value;
        }
        return title;
    };
    title.onNameLongpressEnd = function (value) {
        if (!arguments.length) { return onNameLongpressEnd; }
        if(typeof value === "function"){
            onNameLongpressEnd = value;
        }
        return title;
    };
    title.onNameMouseover = function (value) {
        if (!arguments.length) { return onNameMouseover; }
        if(typeof value === "function"){
            onNameMouseover = value;
        }
        return title;
    };
    title.onNameMouseout = function (value) {
        if (!arguments.length) { return onNameMouseout; }
        if(typeof value === "function"){
            onNameMouseout = value;
        }
        return title;
    };
    return title;
}
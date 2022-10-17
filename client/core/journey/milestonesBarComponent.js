import * as d3 from 'd3';
import { initial } from 'lodash';
import { DIMNS, FONTSIZES } from "./constants";
import contractsComponent from './contractsComponent';
import profileCardsComponent from './profileCardsComponent';
/*

*/
export default function milestonesBarComponent() {
    //API SETTINGS
    // dimensions
    let width;
    let height = DIMNS.milestonesBar.height
    let margin = DIMNS.milestonesBar.margin;
    let contentsWidth;
    let contentsHeight;

    function updateDimns(){
        contentsWidth = width - margin.left - margin.right;
        contentsHeight = height - margin.top - margin.bottom;
    }
    const profileCardDimns = DIMNS.milestonesBar.profile;
    const contractDimns = DIMNS.milestonesBar.contract;
    const barHeight = DIMNS.milestonesBar.height;
    let milestoneWidth = (milestone) => 50;
    let milestoneHeight = (milestone) => 100;

    let xScale = x => 0;
    let selected;

    let kpiFormat;
    let onSetKpiFormat = function(){};
    let onClickKpi = function(){};

    let containerG;
    let contentsG;
    let milestonesG;
    let contractsG;
    let profilesG;

    //components
    const contracts = contractsComponent();
    const profiles = profileCardsComponent()
        .onCtrlClick((e,d) => { onSetKpiFormat(d.key) });

    let slidePosition = 0;
    let slideBack;
    let slideForward;
    let currentXOffset = 0;

    function milestonesBar(selection, options={}) {

        //todo 
        //make kpiHeight higher for milestones bar to allow easy adjusting
        //- horizontal scrollimg in div - not working for some reason -> 
           //soln is instead to use d3 drag - take up teh whole overlay size with teh svg, and put a d3 drag on teh svg
           //or on a rect above and below the milestoneBar. when this is dragged, 
           //simply update the transform x positon of the milestoneG.
           //OR... JUST ADD TWO ARROWS AT BOTTOM OR SIDES < AND >, AND MOVE IT ALONG BY 1 milestone EACH PRESS
        //- kpi bars bug - 2nd card doesnt seem to have all the bars

        const { transitionEnter=true, transitionUpdate=true } = options;
        // expression elements
        selection.each(function (data) {
            // console.log("milestones bar update", data)
            containerG = d3.select(this);
            //why not empty>??
            if(containerG.select("g").empty()){
                init();
            }

            update();
            function init(){
                contentsG = containerG.append("g").attr("class", "milestone-bar-contents");
                milestonesG = contentsG.append("g").attr("class", "milestones")
                    .attr("transform", `translate(0,0)`);
                contractsG = milestonesG.append("g").attr("class", "contracts");
                profilesG = milestonesG.append("g").attr("class", "profiles");
            }

            function update(){
                contentsG.attr("transform", `translate(${margin.left},${margin.right})`);
                const xOffset = -d3.sum(data.filter(m => m.nr < slidePosition), m => milestoneWidth(m));

                if(xOffset !== currentXOffset){
                    milestonesG
                        .transition()
                            .duration(500)
                            .attr("transform", `translate(${xOffset},0)`);

                    currentXOffset = xOffset;
                }
                
                //SCALES
                //normally, xScale domain is a date but here the children pass through i aswell
                const x = (nr) => {
                    const milestone = data[nr];
                    const previousMilestonesData = data.filter((m,i) => i < nr);
                    return d3.sum(previousMilestonesData, d => milestoneWidth(d)) + milestoneWidth(milestone)/2;
                }

                //y is just the middle of the bar for all
                const y = () => height/2;

                //call profileCsrds abd contarcts comps, passing in a yscale that centres each one
                contractsG
                    .datum(data.filter(m => m.dataType === "contract"))
                    .call(contracts
                        .width(DIMNS.milestonesBar.contract.width)
                        .height(DIMNS.milestonesBar.contract.height)
                        .margin(DIMNS.milestonesBar.contract.margin)
                        .fontSizes(FONTSIZES.contract(3))
                        .xScale(x, "nr")
                        .yScale(y), { log:true });

                profilesG
                    .datum(data.filter(m => m.dataType === "profile"))
                    .call(profiles
                        .width(DIMNS.milestonesBar.profile.width)
                        .height(DIMNS.milestonesBar.profile.height)
                        .margin(DIMNS.milestonesBar.profile.margin)
                        .fontSizes(FONTSIZES.profile(3))
                        .kpiHeight(30)
                        .editable(true)
                        .xScale(x, "nr")
                        .yScale(y)
                        .onClickKpi(onClickKpi), { log:true });

                //functions
                slideBack = function(){
                    if(slidePosition > 0){
                        slidePosition -= 1;
                        update();
                    }
                }

                slideForward = function(){
                    if(slidePosition < data.length - 1){
                        slidePosition += 1;
                        update();
                    }
                }

            }

        })

        return selection;
    }
    
    //api
    milestonesBar.width = function (value) {
        if (!arguments.length) { return width; }
        width = value;
        return milestonesBar;
    };
    milestonesBar.height = function (value) {
        if (!arguments.length) { return height; }
        height = value;
        return milestonesBar;
    };
    milestonesBar.selected = function (value) {
        if (!arguments.length) { return selected; }
        selected = value;
        return milestonesBar;
    };
    milestonesBar.xScale = function (value) {
        if (!arguments.length) { return xScale; }
        xScale = value;
        return milestonesBar;
    };
    milestonesBar.yScale = function (value) {
        if (!arguments.length) { return xScale; }
        xScale = value;
        return milestonesBar;
    };
    milestonesBar.milestoneWidth = function (value) {
        if (!arguments.length) { return milestoneWidth; }
        milestoneWidth = value;
        return milestonesBar;
    };
    milestonesBar.milestoneHeight = function (value) {
        if (!arguments.length) { return milestoneHeight; }
        milestoneHeight = value;
        return milestonesBar;
    };
    milestonesBar.kpiFormat = function (value) {
        if (!arguments.length) { return kpiFormat; }
        kpiFormat = value;
        return milestonesBar;
    };
    milestonesBar.onSetKpiFormat = function (value) {
        if (!arguments.length) { return onSetKpiFormat; }
        if(typeof value === "function"){
            onSetKpiFormat = value;
        }
        return milestonesBar;
    };
    milestonesBar.onClickKpi = function (value) {
        if (!arguments.length) { return onClickKpi; }
        if(typeof value === "function"){
            onClickKpi = value;
        }
        return milestonesBar;
    };

    milestonesBar.slideBack = function(){ slideBack() };
    milestonesBar.slideForward = function(){ slideForward() };
    return milestonesBar;
}

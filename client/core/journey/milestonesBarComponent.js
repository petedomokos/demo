import * as d3 from 'd3';
import { DIMNS, FONTSIZES, grey10 } from "./constants";
import contractsComponent from './contractsComponent';
import profileCardsComponent from './profileCardsComponent';
import dragEnhancements from './enhancedDragHandler';
/*

*/
export default function milestonesBarComponent() {
    //API SETTINGS
    // dimensions
    let width;
    let minWidth = 0;
    let height = DIMNS.milestonesBar.height
    let margin = DIMNS.milestonesBar.margin;
    let contentsWidth;
    let milestonesWrapperWidth;
    let contentsHeight;
    let phaseLabelsHeight;
    let milestonesHeight;
    //api to determine widths of milestones based on type
    let profileCardDimns = DIMNS.milestonesBar.profile;
    let contractDimns = DIMNS.milestonesBar.contract;
    let milestoneDimns = m => m.dataType === "profile" || m.dataType === "placeholder" ? profileCardDimns: contractDimns;

    let phaseGap;
    let hitSpace;
    let endHitSpace;
    let labelMarginHoz;

    function updateDimns(data){
        //base other spacings on the profile card width to keep proportions reasonable
        phaseGap = 0.075 * profileCardDimns.width;
        hitSpace = d3.max([40,profileCardDimns.width * 0.1]);
        endHitSpace = profileCardDimns.width;
        labelMarginHoz = profileCardDimns.width * 0.025;
        //first, calc width based on number of milestones and their widths
        //contentsWidth = d3.max([minWidth - margin.left - margin.right, d3.sum(data, m => m.width) + 2 * phaseGap ]);
        //contentsWidth = 2 * endHitSpace + d3.sum(data, m => m.width) + 2 * phaseGap;
        contentsWidth = width - margin.left - margin.right;
        milestonesWrapperWidth = 2 * endHitSpace + (data.length - 1) * hitSpace + d3.sum(data, m => m.width) + 2 * phaseGap;
        //height is passed in so calc contentsHeight in the usual way
        //milestonesHeight = profileCardDimns.height; //this is the largest type of milestone
        //phaseLabelsHeight = d3.min([20, milestonesHeight * 0.1]);
        //contentsHeight = milestonesHeight + phaseLabelsHeight;
        contentsHeight = height - margin.top - margin.bottom;
        milestonesHeight = profileCardDimns.height;
        phaseLabelsHeight = contentsHeight - milestonesHeight;

    }

    let fontSizes = {
        profile: FONTSIZES.profile(1),
        contract: FONTSIZES.contract(1)
    }
    //@todo - replace fontsizes with styles only
    let DEFAULT_STYLES = {
        profiles:{
            info:{
                date:{
                    fontSize:9
                }
            },
            kpis:{
    
            }
        },
        contracts:{

        }
    }
    let _styles = () => DEFAULT_STYLES;

    let xScale = x => 0;
    let selected;

    let kpiFormat;
    let onSetKpiFormat = function(){};
    let onSelectKpiSet = function(){};
    let onToggleSliderEnabled = function(){};

    let onCreateMilestone = () => {};
    let onDeleteMilestone = () => {};

    let enhancedBgDrag = dragEnhancements();

    let onClick = function(){};
    let onDblClick = function(){};
    let onLongpress = function(){};
    let onMouseover = function(){};
    let onMouseout = function(){};

    let containerG;
    let contentsG;
    let milestonesWrapperG;
    let phaseLabelsG;
    let milestonesG;
    let contractsG;
    let profilesG;

    //components
    const contracts = contractsComponent();
    const profiles = profileCardsComponent()
        .onCtrlClick((e,d) => { onSetKpiFormat(d.key) });

    let requiredSliderPosition = 0;
    let currentSliderPosition;
    let slideBack;
    let slideForward;
    let slideTo;
    let slideToBeforeStart;
    let slideToAfterEnd;
    let currentXOffset = 0;

    let datePhasesData;

    let transitionOn = true;

    //helper
    //data is passed in here, so we can call this function with other data too eg with placeholder
    const calcMilestoneX = data => nr => {
        const milestone = data.find(m => m.nr === nr);
        const { datePhase, i } = milestone;
        const previousMilestonesData = data.filter(m => m.nr < nr);
        const extraGaps = datePhase === "future" ? phaseGap * 2 : (datePhase === "current" ? phaseGap : 0)
        return endHitSpace + (i * hitSpace) + d3.sum(previousMilestonesData, d => d.width) + milestone.width/2 + extraGaps;
    }

    const calcSliderOffsetX = positionedData => sliderPosition => {
        if(Number.isInteger(sliderPosition)){
            return contentsWidth/2 - positionedData.find(m => m.nr === sliderPosition)?.x || 0;
        }
        //it halfway between
        const prev = positionedData.find(m => m.nr === Math.floor(sliderPosition));
        const next = positionedData.find(m => m.nr === Math.ceil(sliderPosition));
        if(prev && next){
            let extraGaps;
            if(prev.isPast && next.isPast){
                    extraGaps = 0;
            }else if(prev.isPast && next.isCurrent){
                extraGaps = phaseGap/2;
            }else if(prev.isCurrent){
                extraGaps = phaseGap * 3/2;
            }else{
                //both future
                extraGaps = 2 * phaseGap
            }
            return contentsWidth/2 - prev.x - prev.width/2 - hitSpace/2 - extraGaps;
        }
        if(prev){
            //show at end - prev.x may contain the extraGaps already
            //prev must be at least current because there is no next
            let extraGaps;
            if(prev.isFuture){
                //prev.x has the gaps
                    extraGaps = 0;
            }else {
                //prev is current...prev.x has one of the gaps
                extraGaps = phaseGap;
            }
            return contentsWidth/2 - prev.x - prev.width/2 - extraGaps - endHitSpace/2;
        }
        //show at start
        return contentsWidth/2 - endHitSpace/2;
    }

    const transformTransition = { update: { duration: 1000 } };

    function milestonesBar(selection, options={}) {
        const { transitionEnter=true, transitionUpdate=true } = options;
        // expression elements
        selection.each(function (_data) {
            containerG = d3.select(this);
            //dimns is needed for init too
            const dataWithDimns = _data.map(m => ({ ...m, ...milestoneDimns(m) }));
            updateDimns(dataWithDimns);
            if(containerG.select("g").empty()){
                init();
            }

            update(dataWithDimns);
            function init(){
                contentsG = containerG.append("g").attr("class", "milestone-bar-contents");
                contentsG.append("rect")
                    .attr("class", "milestones-bar-bg")
                    .attr("fill", "blue");

                milestonesWrapperG = contentsG.append("g").attr("class", "milestones-wrapper")
                    .attr("transform", `translate(0,0)`);

                phaseLabelsG = milestonesWrapperG.append("g").attr("class", "phase-labels")
                milestonesG = milestonesWrapperG
                    .append("g")
                    .attr("class", "milestones")
                    .style("cursor", "pointer")

                milestonesG.append("rect")
                    .attr("class", "milestones-bg")
                    .call(updateRectDimns, { 
                        width: () => milestonesWrapperWidth, 
                        height:() => milestonesHeight,
                        transition:transformTransition
                    })
                    .attr("fill", "pink")
                    .attr("stroke", "pink")
                    .attr("opacity", 0.7);

                contractsG = milestonesG.append("g").attr("class", "contracts");
                profilesG = milestonesG.append("g").attr("class", "profiles");
            }

            //data can be passed in from a general update (ie dataWithDimns above) or from a listener (eg dataWithPlaceholder)
            function update(data){
                //console.log("milestones bar update", data);

                //milestone positioning
                const calcX = calcMilestoneX(data);
                const positionedData = data.map(m => ({ 
                    ...m, 
                    x: calcX(m.nr), 
                    y: milestonesHeight/2
                }));

                // console.log("positionedData", positionedData)

                const calcOffsetX = calcSliderOffsetX(positionedData)

                slideTo = function(position, options={} ){
                    if(currentSliderPosition === position) { return; }
                    const { transition = { duration: 500 }, cb } = options;
                    //console.log("slideTo..... transitionON?", transitionOn, transition)

                    milestonesWrapperG.call(updateTransform, {
                        x: () => calcOffsetX(position),
                        y: () => 0,
                        transition : transitionOn ? transition : null,
                        cb
                    });
                    //set state before end of slide, to prevent another slide if an update is 
                    //called again before this slide has ended
                    currentSliderPosition = position
                }

                //console.log("positionedData", positionedData)

                contentsG
                    .attr("transform", `translate(${margin.left},${margin.top})`)
                    .select("rect.milestones-bar-bg")
                        .attr("width", contentsWidth)
                        .attr("height", contentsHeight);

                        
                //POSITIONING
                //offsetting due to slide
                slideTo(requiredSliderPosition);

                const prevCard = x => d3.greatest(positionedData.filter(m => m.x < x), m => m.x);
                const nextCard = x => d3.least(positionedData.filter(m => m.x > x), m => m.x);

                enhancedBgDrag.onLongpressStart(e => {
                    createMilestonePlaceholder(prevCard(e.x), nextCard(e.x))
                });

                const placeholderDimns = profileCardDimns;

                let placeholderG;
                const createMilestonePlaceholder = (prev, next) => {
                    //@todo - only slide if the space is not on screen, and only side a little so its on screen
                    const neighbourPhases = { prev: prev?.datePhase, next: next?.datePhase };
                    if(prev && next){
                        //todo
                        //instead of tempsliderpos, just slide all profiles from next onwards up
                        //and only adjust the slider if next is not on screen eg on mobile portrait
                        //or on far right hand side of larger screen
                        //or alternatively, in this case, we could slide all the prev cards to teh left

                        //OR MAYBE KEEP WITH TEH IDEA OF SLIDING IT INTO MIDDLE,
                        //BUT JUST DONT OFFSET TEH PROFILE CARDS IN BTH DIRECTIONS,
                        //JUST SLIDE TO NEXT.NR, AND OFFSET TEH NEXT AND ONWARDS CARS BY FULL WIDTH
                        const tempSliderPosition = prev.nr + 0.5;
                        //we dont set sliderPosition in state because this is a temp change 
                        //- we will go back to the position that is in state after if its cancelled
                        slideTo(tempSliderPosition, {cb:() => {
                            //todo next
                            //slide every profile itself, the ones before it to the left,
                            //and the ones after to the right
                            //do this but adding or subtract from there current x values

                            //then make placeholder appear
                            const calcOffsetForCardsBefore = () => {
                                if(neighbourPhases.prev === "past" && neighbourPhases.next === "current"){
                                    return -placeholderDimns.width/2 - hitSpace/2;
                                }
                                if(neighbourPhases.prev === "current" && neighbourPhases.next === "future"){
                                    return -placeholderDimns.width/2 - hitSpace/2// - phaseGap/2; //we are subtracting too much
                                }
                                if(neighbourPhases.prev === "past" && neighbourPhases.next === "past"){
                                    return -placeholderDimns.width/2 - hitSpace/2;
                                }
                                if(neighbourPhases.prev === "future" && neighbourPhases.next === "future"){
                                    //minus half the new hitspace plus all of the previous hitspace
                                    return -placeholderDimns.width/2 - hitSpace/2 + hitSpace;
                                }
                                return 0;
                            }
                            const calcOffsetForCardsAfter = () => {
                                if(neighbourPhases.prev === "past" && neighbourPhases.next === "current"){
                                    return placeholderDimns.width/2 + hitSpace/2 + phaseGap/2;
                                }
                                if(neighbourPhases.prev === "current" && neighbourPhases.next === "future"){
                                    return placeholderDimns.width/2 + hitSpace/2;// + phaseGap/2;
                                }
                                if(neighbourPhases.prev === "past" && neighbourPhases.next === "past"){
                                    return placeholderDimns.width/2 + hitSpace/2;
                                }
                                if(neighbourPhases.prev === "future" && neighbourPhases.next === "future"){
                                     //add half the new hitspace plus all of the previous hitspace
                                    return placeholderDimns.width/2 + hitSpace/2 + hitSpace;
                                }
                                return 0;
                            }
                            const calcPlaceholderX = () => {
                                if(neighbourPhases.prev === "past" && neighbourPhases.next === "current"){
                                    return next.x - next.width/2 - hitSpace/2 - phaseGap - placeholderDimns.width/2;
                                }
                                if(neighbourPhases.prev === "current" && neighbourPhases.next === "future"){
                                    return next.x - next.width/2 - hitSpace/2 - placeholderDimns.width/2 + phaseGap/2;
                                }
                                if(neighbourPhases.prev === "past" && neighbourPhases.next === "past"){
                                    return next.x - next.width/2 - hitSpace/2 - placeholderDimns.width/2;
                                }
                                if(neighbourPhases.prev === "future" && neighbourPhases.next === "future"){
                                    return next.x - next.width/2 + hitSpace/2 - placeholderDimns.width/2;
                                }
                                return 0;

                            }
                            const xOffsetForCardsBefore = calcOffsetForCardsBefore();
                            const xOffsetForCardsAfter = calcOffsetForCardsAfter();
                            milestonesG.selectAll("g.profile-card")
                                .call(updateTransform, { 
                                    //for those after, we add the phaseGap and the new hitspace that will be created from new milestone
                                    //x:d => d.x + (placeholderDimns.width/2 * (d.nr >= next.nr ? 1 : -1)) +(d.nr >= next.nr ? (phaseGap +hitSpace) : 0),
                                    x:d => d.x +(d.nr >= next.nr ? xOffsetForCardsAfter :  xOffsetForCardsBefore),
                                    y:d => d.y,
                                    transition:{ duration: 200 }
                                });
                            //subtract whole phaseGap as its to the right of new milestone
                            let placeholderX = calcPlaceholderX();

                            placeholderG = milestonesG.append("g")
                                .attr("class", "placeholder")
                                .attr("transform", `translate(${placeholderX}, 0)`)
                                .attr("opacity", 0);
                            
                            placeholderG
                                .append("rect")
                                    .attr("class", "placeholder-bg")
                                    .attr("width", placeholderDimns.width)
                                    .attr("height", placeholderDimns.height)
                                    .attr("fill", grey10(3))
                            
                            const placeholderMargin = { 
                                left: placeholderDimns.width * 0.1,
                                right: placeholderDimns.width * 0.1,
                                top: placeholderDimns.height * 0.2,
                                bottom: placeholderDimns.height * 0.2
                            }
                            const placeholderContentsWidth = placeholderDimns.width - placeholderMargin.left - placeholderMargin.right;
                            const placeholderContentsHeight = placeholderDimns.height - placeholderMargin.top - placeholderMargin.bottom;
                            const btnWidth = placeholderContentsWidth;
                            const btnHeight = placeholderContentsHeight * 0.25;
                            const btnGap = placeholderContentsHeight * 0.125;
                            
                            const btnData = [
                                { key:"profile", label: "PROFILE" },
                                { key:"contract", label: "CONTRACT" },
                                { key:"cancel", label: "CANCEL" }
                            ]

                            const placeholderContentsG = placeholderG
                                .append("g")
                                    .attr("transform", `translate(${placeholderMargin.left}, ${placeholderMargin.top})`)

                            const btnG = placeholderContentsG.selectAll("g.btn").data(btnData, d => d.key);
                            btnG.enter()
                                .append("g")
                                    .attr("class", "placeholder-btn")
                                    .each(function(){
                                        const btnG = d3.select(this);
                                        btnG
                                            .append("rect")
                                            .attr("rx", 5)
                                            .attr("ry", 5);
                                        btnG
                                            .append("text")
                                                .attr("text-anchor", "middle")
                                                .attr("dominant-baseline", "central")
                                                .attr("stroke", "white")
                                                .attr("fill", "white")
                                                .attr("stroke-width", 0.3)
                                    })
                                    .merge(btnG)
                                    .attr("transform",(d,i) => `translate(0, ${i * (btnHeight + btnGap)})`)
                                    .each(function(d){
                                        const btnG = d3.select(this);
                                        btnG.select("rect")
                                            .attr("width", btnWidth)
                                            .attr("height", btnHeight)
                                            .attr("fill", grey10(5))
                                            .attr("stroke", "none")

                                        btnG.select("text")
                                            .attr("x", btnWidth/2)
                                            .attr("y", btnHeight/2)
                                            .attr("font-size", btnHeight * 0.4)
                                            .text(d => d.label)
                                    })
                                    .on("mouseover", function(){ 
                                        d3.select(this).select("rect").attr("stroke", "white") 
                                    })
                                    .on("mouseout", function(){ 
                                        d3.select(this).select("rect").attr("stroke", "none") 
                                    })
                                    .on("click", (e,d) => {
                                        if(d.key === "cancel"){ 
                                            handleCancelMilestone(); 
                                        }else{
                                            //interpolate dates to get new date
                                            const interpolator = d3.interpolateDate(prev.date, next.date);
                                            handleCreateMilestone(d.key, interpolator(0.5), calcNewMilestoneNr(prev, next));
                                        }
                                    })

                            placeholderG
                                .transition()
                                //.delay(1000)
                                .duration(500)
                                        .attr("opacity", 1);
                            
                        }});
                        /*
                        const tempOffsetX = calcOffsetX(tempSlidePosition);
                        console.log("tempX", tempOffsetX, milestonesWrapperG.node())
                        milestonesWrapperG
                            .transition()
                                .duration(500)
                                .attr("transform", `translate(${tempOffsetX},0)`);
                                //on end, slide both sides out to make space*/

                        //slideTo(prev.nr + 0.5);
                    }else if(prev){
                        slideToAfterEnd();
                        //slideTo(d3.min(data, d => d.nr) - 0.5);
                    }else{
                        //next card but no previous
                        slideToBeforeStart();
                    }

                    //remove helper functions and create another for extraGaps calc
                    //can remove sliderPositon from state as it is passed through instead
                    //unless we use it to determine when we need to slide, in which case
                    //we dont need to store currentOffsetX

                    //apply transition

                    //fade-in placeholder with 3 opts: Profile, Contract, Cancel

                    //disable the slider
                    //onToggleSliderEnabled();
                }

                //this function is just for purposes of setting requiredSliderPos
                //the actual nrs are added to the milestones in layout
                function calcNewMilestoneNr(prev, next){
                    if(prev){
                        if(prev.isPast){ return prev.nr };
                        if(prev.isFuture){ return prev.nr + 1; }
                        //prev must be current so new is first future
                        return 1;
                    }else{
                        //if no prev, then next must be either past or current
                        return next.nr - 1;
                    }
                }
                function handleCreateMilestone(dataType, date, newMilestoneNr){
                    //assume profile for now

                    //immediately remove placeholder (no trans)
                    placeholderG.remove();
                    placeholderG = null;

                    milestonesG.selectAll("g.profile-card")
                        .attr("transform", d => `translate(${d.x},${d.y})`)
                        //.call(updateTransform, { x:d => d.x, y:d => d.y, transition:null });

                    //update will be auto-tiggered by react state update
                    //do the slide update manually so no transition
                    //slideTo(newMilestoneNr, { transition: null })
                    //ensure it doesnt try to slide on next update
                    requiredSliderPosition = newMilestoneNr;
                    //disable transition for next update
                    transitionOn = false;

                    //simplest soln to jerkiness is to have a fade out an din on th eplaceholder
                    //and the new milestone, until the position is sorted.
                    onCreateMilestone(dataType, date)
                
                    //set slider position
                    //requiredSliderPosition = newMilestoneNr

                }
                function handleCancelMilestone(){
                    placeholderG
                        .transition()
                        //.delay(1000)
                        .duration(500)
                                .attr("opacity", 0)
                                    .on("end", function(){ 
                                        d3.select(this).remove();
                                        placeholderG = null;
                                        milestonesG.selectAll("g.profile-card")
                                        .call(updateTransform, { 
                                            x:d => d.x,
                                            y:d => d.y,
                                            transition:{ duration: 200 },
                                            cb:() => { update(data); }
                                        });
                                    });
                    
                }
                function removeMilestonePlaceholder(wasCancelled){
                    //remove

                    //re-enabled slider
                    //onToggleSliderEnabled();

                    //make sliderPositon equal to new profile (if it wasnt cancelled)

                    //re-position if cancelled
                    if(wasCancelled){
                        slideTo(prevSliderPosition);
                        prevSliderPosition = null;
                    }
                }
                

                const bgDrag = d3.drag()
                    .on("start", enhancedBgDrag())
                    .on("drag", enhancedBgDrag())
                    .on("end", enhancedBgDrag())
                    
                milestonesG
                    .attr("transform", `translate(0,${phaseLabelsHeight})`)
                    .select("rect.milestones-bg")
                        .call(updateRectDimns, { 
                            width: () => milestonesWrapperWidth, 
                            height:() => milestonesHeight,
                            transition:transformTransition
                        })
                        .on("mouseover", onMouseover)
                        .on("mouseout", onMouseout)
                        .call(bgDrag)
                
            
                //phase labels
                const currentCard = positionedData.find(m => m.datePhase === "current")
                const endOfLastPastCard = currentCard.x - currentCard.width/2 - phaseGap - hitSpace - labelMarginHoz;
                const middleOfCurrentCard = currentCard.x;
                const startOfFirstFutureCard = currentCard.x + currentCard.width/2 + phaseGap + hitSpace + labelMarginHoz;
                
                datePhasesData = [
                    { label:"Past", x:endOfLastPastCard, textAnchor:"end" },
                    { label: "Current", x:middleOfCurrentCard, textAnchor:"middle" },
                    { label: "Future", x:startOfFirstFutureCard, textAnchor:"start" }
                ]
                phaseLabelsG.selectAll("text").data(datePhasesData, d => d.label)
                    .join("text")
                        .attr("x", d => d.x)
                        .attr("y", phaseLabelsHeight/2)
                        .attr("text-anchor", d => d.textAnchor)
                        .attr("dominant-baseline", "central")
                        .attr("stroke", "white")
                        .attr("fill", "white")
                        .attr("stroke-width", 0.3)
                        .attr("font-size", 12)
                        .text(d => d.label)

                //call profileCsrds abd contarcts comps, passing in a yscale that centres each one
                contractsG
                    .datum(positionedData.filter(m => m.dataType === "contract"))
                    .call(contracts
                        .width(contractDimns.width)
                        .height(contractDimns.height)
                        .fontSizes(fontSizes.contract)
                        .transformTransition(transformTransition));

                profilesG
                    .datum(positionedData.filter(m => m.dataType === "profile"))
                    .call(profiles
                        .width(profileCardDimns.width)
                        .height(profileCardDimns.height)
                        .fontSizes(fontSizes.profile)
                        .kpiHeight(50)
                        .editable(true)
                        .onClickKpi(onSelectKpiSet)
                        .onDblClickKpi((e,d) => {
                            onSelectKpiSet(d);
                        })
                        .onLongpressStart((e,d) => {
                            console.log("lp ", e, d)
                        })
                        .transformTransition(transitionOn ? transformTransition : { update:null }));

                //functions
                function updateTransform(selection, options={}){
                    const { x = d => d.x, y = d => d.y, transition, cb = () => {} } = options;
                    selection.each(function(d){
                        if(transition){
                            //console.log("transitioning update", transition)
                            d3.select(this)
                                .transition()
                                .duration(transition.duration || 200)
                                    .attr("transform", "translate("+x(d) +"," +y(d) +")")
                                    .on("end", cb);
                        }else{
                            //console.log("no transition update............")
                            d3.select(this)
                                .attr("transform", "translate("+x(d) +"," +y(d) +")");
                            
                            cb.call(this);
                        }
                    })
                }

                slideBack = function(){
                    if(currentSliderPosition > d3.min(data, d => d.nr)){
                        requiredSliderPosition -= 1;
                        update(data);
                    }
                }

                slideForward = function(){
                    if(currentSliderPosition < d3.max(data, d => d.nr)){
                        requiredSliderPosition += 1;
                        update(data);
                    }
                }
                /*
                slideTo = function(nr, onEnd=() => {}){
                    sliderPosition = nr;
                    update(data);
                }
                */
                slideToBeforeStart = function(){
                    slideTo(d3.min(data, d => d.nr) - 0.5);
                }
                slideToAfterEnd = function(){
                    slideTo(d3.max(data, d => d.nr) + 0.5);
                }
            }

            function updateRectDimns(selection, options={}){
                const { width = d => d.width, height = d => d.height, transition, cb = () => {} } = options;
                selection.each(function(d){
                    if(transition){
                        d3.select(this)
                            .transition()
                            .duration(200)
                                .attr("width", width(d))
                                .attr("height", height(d))
                                .on("end", cb);
                    }else{
                        d3.select(this)
                            .attr("width", width(d))
                            .attr("height", height(d));
                        
                        cb.call(this);
                    }
                })
            }

        })

        //reset once-only settings
        transitionOn = true;

        return selection;
    }
    
    //api
    milestonesBar.width = function (value) {
        if (!arguments.length) { return width; }
        width = value;
        return milestonesBar;
    };
    milestonesBar.minWidth = function (value) {
        if (!arguments.length) { return minWidth; }
        minWidth = value;
        return milestonesBar;
    };
    milestonesBar.height = function (value) {
        if (!arguments.length) { return height; }
        height = value;
        return milestonesBar;
    };
    milestonesBar.contractDimns = function (value) {
        if (!arguments.length) { return width; }
        contractDimns = value;
        //helper
        milestoneDimns = m => m.dataType === "profile" || m.dataType === "placeholder" ? profileCardDimns: contractDimns;
        return milestonesBar;
    };
    milestonesBar.profileCardDimns = function (value) {
        if (!arguments.length) { return width; }
        profileCardDimns = value;
        //helper
        milestoneDimns = m => m.dataType === "profile" || m.dataType === "placeholder" ? profileCardDimns: contractDimns;
        return milestonesBar;
    };
    milestonesBar.styles = function (value) {
        if (!arguments.length) { return _styles; }
        if(typeof value === "function"){
            _styles = (d,i) => ({ ...DEFAULT_STYLES, ...value(d,i) });
        }else{
            _styles = (d,i) => ({ ...DEFAULT_STYLES, ...value });
        }
        
        return milestonesBar;
    };
    milestonesBar.fontSizes = function (value) {
        if (!arguments.length) { return _styles; }
        fontSizes = { ...fontSizes, ...value };
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
    milestonesBar.onSelectKpiSet = function (value) {
        if (!arguments.length) { return onSelectKpiSet; }
        if(typeof value === "function"){
            onSelectKpiSet = value;
        }
        return milestonesBar;
    };
    milestonesBar.onCreateMilestone = function (value) {
        if (!arguments.length) { return onCreateMilestone; }
        if(typeof value === "function"){
            onCreateMilestone = value;
        }
        return milestonesBar;
    };
    milestonesBar.onDeleteMilestone = function (value) {
        if (!arguments.length) { return onDeleteMilestone; }
        if(typeof value === "function"){
            onDeleteMilestone = value;
        }
        return milestonesBar;
    };
    milestonesBar.onToggleSliderEnabled = function (value) {
        if (!arguments.length) { return onToggleSliderEnabled; }
        if(typeof value === "function"){
            onToggleSliderEnabled = value;
        }
        return milestonesBar;
    };
    milestonesBar.onClick = function (value) {
        if (!arguments.length) { return onClick; }
        onClick = value;
        return milestonesBar;
    };
    milestonesBar.onDblClick = function (value) {
        if (!arguments.length) { return onDblClick; }
        onDblClick = value;
        return milestonesBar;
    };
    milestonesBar.onLongpress = function (value) {
        if (!arguments.length) { return onLongpress; }
        onLongpress = value;
        return milestonesBar;
    };
    milestonesBar.onMouseover = function (value) {
        if (!arguments.length) { return onMouseover; }
        if(typeof value === "function"){
            onMouseover = value;
        }
        return milestonesBar;
    };
    milestonesBar.onMouseout = function (value) {
        if (!arguments.length) { return onMouseout; }
        if(typeof value === "function"){
            onMouseout = value;
        }
        return milestonesBar;
    };

    milestonesBar.slideBack = function(){ slideBack() };
    milestonesBar.slideForward = function(){ slideForward() };
    milestonesBar.slideTo = function(){ slideTo() };
    return milestonesBar;
}

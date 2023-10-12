import * as d3 from 'd3';
import { grey10, COLOURS, TRANSITIONS } from "./constants";
import { updateTransform } from '../journey/transitionHelpers';
import deckComponent from './deckComponent';

const transformTransition = { update: { duration: TRANSITIONS.MED } };

export default function decksComponent() {
    //API SETTINGS
    // dimensions
    let width = 300;
    let height = 600;
    let nrCols = 3;

    function updateDimns(){

    }
    let DEFAULT_STYLES = {
        decks:{ info:{ date:{ fontSize:9 } } },
    }
    let _styles = () => DEFAULT_STYLES;

    let selectedDeckId = "";
    let longpressedDeckId = "";
    let format;

    let onSelectItem = function(){};
    let onCreateDeck = function(){}
    let onClickDeck = function(){}
    let onSetLongpressedDeckId = function(){}
    let onSetSelectedCardNr = function(){}
    let onMoveDeck = function(){};
    let onDeleteDeck = function(){};
    let onArchiveDeck = function(){};
    let updateItemStatus = function(){};
    let updateFrontCardNr = function(){};
    let setForm = function(){};

    let zoom;
    let startLongpress;
    let endLongpress;
    let handleDrag;

    let x = (d,i) => d.x;
    let y = (d,i) => d.y;
    let _deckWidth = (d,i) => 50;
    let _deckHeight = (d,i) => 75;
    let getCell = position => [0,0];

    let containerG;

    //components
    const deckComponents = {};

    function decks(selection, options={}) {
        const { transitionEnter=true, transitionUpdate=true } = options;

        updateDimns();
        // expression elements
        selection.each(function (decksData) {
            containerG = d3.select(this);

            if(containerG.select("rect").empty()){
                init();
            }

            update(decksData);

            function init(){
                containerG
                    .append("rect")
                        .attr("class", "decks-bg")
                        .attr("fill", "transparent")
                        .attr("stroke", "none");
            }

            function update(decksData, options={}){
                containerG.select("rect.decks-bg")
                    .attr("width", width)
                    .attr("height", height)


                const deckG = containerG.selectAll("g.deck").data(decksData, d => d.id);
                deckG.enter()
                    .append("g")
                        .attr("class", d => `deck deck-${d.id}`)
                        .each(function(d,i){
                            deckComponents[d.id] = deckComponent();
                        })
                        .attr("transform", (d,i) => `translate(${x(d,i)}, ${y(d,i)})`)
                        .merge(deckG)
                        .call(updateTransform, { 
                            x, 
                            y, 
                            transition:transformTransition.update,
                            name:(d,i) => `deck-${d.id}`,
                            force:true
                        })
                        .each(function(d,i){
                            const deckWidth = _deckWidth(d,i);
                            const deckHeight = _deckHeight(d,i);

                            const deck = deckComponents[d.id];
                            deck
                                .width(deckWidth)
                                .height(deckHeight)
                                .deckIsSelected(selectedDeckId === d.id)
                                .getCell(getCell)
                                .onClickDeck(onClickDeck)
                                .onSetLongpressed(isLongpressed => { 
                                    onSetLongpressedDeckId( isLongpressed ? d.id : "") 
                                })
                                .onSetSelectedCardNr(onSetSelectedCardNr)
                                .onSelectItem(onSelectItem)
                                .onMoveDeck(onMoveDeck)
                                .onDeleteDeck(onDeleteDeck)
                                .onArchiveDeck(onArchiveDeck)
                                .updateItemStatus(updateItemStatus)
                                .updateFrontCardNr(updateFrontCardNr)
                                .transformTransition(transformTransition)
                                .setForm(setForm);

                            d3.select(this).call(deck)
                        })

                deckG.exit().remove();

                //new deck icon
                const deckWidth = _deckWidth();
                const deckHeight = _deckHeight();

                const newDeckIconData = [{
                    colNr: decksData.length % nrCols,
                    rowNr: Math.floor(decksData.length / nrCols),
                    withText:decksData.length === 0
                }]
                const newDeckIconG = containerG.selectAll("g.new-deck-icon").data(newDeckIconData)
                newDeckIconG.enter()
                    .append("g")
                        .attr("class", "new-deck-icon")
                        .attr("pointer-events", "all")
                        .each(function(d){
                            const newDeckIconG = d3.select(this);
                            const wordsG = newDeckIconG.append("g").attr("class", "words");
                            wordsG.append("text")
                                .attr("text-anchor", "middle")
                                .attr("dominant-baseline", "middle")
                                .attr("font-size", "16px")
                                .attr("stroke", "white")
                                .attr("fill", "white")
                                .attr("stroke-width", 0.2)

                            wordsG.append("rect")
                                .attr("fill", "transparent");

                            const iconG = newDeckIconG.append("g").attr("class", "icon")
                            iconG.append("circle")
                                .attr("transform", "translate(-1,0) scale(1.7)")
                                .attr("r", 10)
                                .attr("fill", "none")
                                .attr("stroke", grey10(4))
                                .attr("stroke-width", 1.5)
                                .attr("cx", 12)
                                .attr("cy", 12)

                            iconG.append("path")
                                .attr("transform", "translate(-1,0) scale(1.7)")
                                .attr("fill", "none")
                                .attr("stroke", grey10(4))
                                .attr("stroke-width", 1.5)
                                .attr("stroke-linecap", "round")
                                .attr("d", "M15 12L12 12M12 12L9 12M12 12L12 9M12 12L12 15")

                            iconG.append("rect")
                                .attr("fill", "transparent");

                        })
                        .merge(newDeckIconG)
                        .attr("transform", d => `translate(${x(d)},${y(d)})`)
                        .each(function(d){
                            const wordsWidth = 80;
                            const wordsHeight = 25;
                            const iconWidth = 40;
                            const iconHeight = 40;
                            const middleGap = 10;

                            const newDeckIconG = d3.select(this);
                            const wordsG = newDeckIconG.select("g.words")
                                .attr("display", d.withText ? null : "none")
                                .attr("transform", `translate(
                                    ${(deckWidth - wordsWidth)/2},
                                    ${(deckHeight - iconHeight)/2 - middleGap - wordsHeight})`)

                            const iconG = newDeckIconG.select("g.icon")
                                .attr("transform", `translate(
                                    ${(deckWidth - iconWidth)/2},
                                    ${(deckHeight - iconHeight)/2})`)

                            wordsG.select("rect")
                                .attr("width", wordsWidth)
                                .attr("height", wordsHeight)

                            iconG.select("rect")
                                .attr("width", iconWidth)
                                .attr("height", iconHeight)

                            wordsG.select("text")
                                .attr("x", wordsWidth/2)
                                .attr("y", wordsHeight/2)
                                .text("Add a deck")
                        })
                        .on("click", onCreateDeck)
                
                newDeckIconG.exit().remove();

                d3.select("g.zoom")
                    .style("display", selectedDeckId ? "none" : null)
                    .on("click", (e) => { 
                        if(selectedDeckId){ return; }
                        //@todo - use getDeck instead based on getCell -> if Math.abs(x - cellX(colNr)) < margin etc 
                        const cell = getCell([e.clientX, e.clientY], true);
                        if(cell?.deckId){
                            onClickDeck(e, { id: cell.deckId });
                            e.stopPropagation();
                        }
                    })
                    .call(zoom)

                startLongpress = function(deckId){ deckComponents[deckId].startLongpress() }
                endLongpress = function(deckId){ deckComponents[deckId].endLongpress() }
                handleDrag = function(e, deckId){ deckComponents[deckId].handleDrag(e) }

            }

        })

        return selection;
    }
    
    //api
    decks.width = function (value) {
        if (!arguments.length) { return width; }
        width = value;
        return decks;
    };
    decks.height = function (value) {
        if (!arguments.length) { return height; }
        height = value;
        return decks;
    };
    decks.nrCols = function (value) {
        if (!arguments.length) { return nrCols; }
        nrCols = value;
        return decks;
    };
    //each deck
    decks._deckWidth = function (func) {
        if (!arguments.length) { return _deckWidth; }
        _deckWidth = func;
        return decks;
    };
    decks._deckHeight = function (func) {
        if (!arguments.length) { return _deckHeight; }
        _deckHeight = func;
        return decks;
    };
    decks.x = function (func) {
        if (!arguments.length) { return x; }
        x = func;
        return decks;
    };
    decks.y = function (func) {
        if (!arguments.length) { return y; }
        y = func;
        return decks;
    };
    decks.getCell = function (func) {
        if (!arguments.length) { return getCell; }
        getCell = func;
        return decks;
    };
    decks.styles = function (value) {
        if (!arguments.length) { return _styles; }
        if(typeof value === "function"){
            _styles = (d,i) => ({ ...DEFAULT_STYLES, ...value(d,i) });
        }else{
            _styles = (d,i) => ({ ...DEFAULT_STYLES, ...value });
        }
        
        return decks;
    };
    decks.selectedDeckId = function (value) {
        if (!arguments.length) { return selectedDeckId; }
        selectedDeckId = value;
        return decks;
    };
    decks.selectedCardNr = function (value) {
        if (!arguments.length) { 
            return selectedDeckId ? deckComponents[selectedDeckId].selectedCardNr() : ""; 
        }
        Object.keys(deckComponents).forEach(deckId => {
            if(deckId === selectedDeckId){
                deckComponents[deckId].selectedCardNr(value);
            }else{
                deckComponents[deckId].selectedCardNr("");
            }
        })
        return decks;
    };
    decks.selectedItemNr = function (value) {
        if (!arguments.length) { 
            return selectedDeckId ? deckComponents[selectedDeckId].selectedItemNr() : ""; 
        }
        Object.keys(deckComponents).forEach(deckId => {
            if(deckId === selectedDeckId){
                deckComponents[deckId].selectedItemNr(value);
            }else{
                deckComponents[deckId].selectedItemNr("");
            }
        })
        return decks;
    };
    decks.longpressedDeckId = function (value) {
        if (!arguments.length) { return longpressedDeckId; }
        longpressedDeckId = value;
        //pass on to each deck
        Object.values(deckComponents).forEach(deck => deck.longpressedDeckId(value))
        return decks;
    };
    decks.format = function (value) {
        if (!arguments.length) { return format; }
        format = value;
        return decks;
    };
    decks.zoom = function (value) {
        if (!arguments.length) { return zoom; }
        zoom = value;
        return decks;
    };
    decks.updateItemStatus = function (value) {
        if (!arguments.length) { return updateItemStatus; }
        updateItemStatus = value;
        return decks;
    };
    decks.updateFrontCardNr = function (value) {
        if (!arguments.length) { return updateFrontCardNr; }
        updateFrontCardNr = value;
        return decks;
    };
    decks.onSelectItem = function (value) {
        if (!arguments.length) { return onSelectItem; }
        onSelectItem = value;
        return decks;
    };
    decks.setForm = function (value) {
        if (!arguments.length) { return setForm; }
        setForm = value;
        return decks;
    };
    decks.onCreateDeck = function (value) {
        if (!arguments.length) { return onCreateDeck; }
        onCreateDeck = value;
        return decks;
    };
    decks.onClickDeck = function (value) {
        if (!arguments.length) { return onClickDeck; }
        onClickDeck = value;
        return decks;
    };
    decks.onSetLongpressedDeckId = function (value) {
        if (!arguments.length) { return onSetLongpressedDeckId; }
        onSetLongpressedDeckId = value;
        return decks;
    };
    decks.onSetSelectedCardNr = function (value) {
        if (!arguments.length) { return onSetSelectedCardNr; }
        onSetSelectedCardNr = value;
        return decks;
    };
    decks.onMoveDeck = function (value) {
        if (!arguments.length) { return onMoveDeck; }
        onMoveDeck = value;
        return decks;
    };
    decks.onDeleteDeck = function (value) {
        if (!arguments.length) { return onDeleteDeck; }
        onDeleteDeck = value;
        return decks;
    };
    decks.onArchiveDeck = function (value) {
        if (!arguments.length) { return onArchiveDeck; }
        onArchiveDeck = value;
        return decks;
    };
    decks.startLongpress = function (deckId) { startLongpress(deckId); };
    decks.endLongpress = function (deckId) { endLongpress(deckId); };
    decks.handleDrag = function (e, deckId) { handleDrag(e, deckId); };
    return decks;
}

import * as d3 from 'd3';
import { grey10, COLOURS, DIMNS, FONTSIZES, STYLES, INFO_HEIGHT_PROPORTION_OF_CARDS_AREA, TRANSITIONS, DECK_PHOTO_POS } from "./constants";
import cardsComponent from './cardsComponent';
import deckHeaderComponent from './deckHeaderComponent';
import contextMenuComponent from "./contextMenuComponent";
import textComponent from './textComponent';
import dragEnhancements from '../journey/enhancedDragHandler';
import { updateRectDimns } from '../journey/transitionHelpers';
import { getTransformationFromTrans } from '../journey/helpers';
import { isNumber } from '../../data/dataHelpers';
import { maxDimns } from "../../util/geometryHelpers";
import { angleFromNorth } from '../journey/screenGeometryHelpers';
import { icons } from '../../util/icons';
import { fadeIn, remove, getPosition, fadeInOut } from '../journey/domHelpers';
import purposeComponent from './purposeComponent';

const { CARD:{ ITEM_FILL } } = COLOURS;

const CONTEXT_MENU_ITEM_WIDTH = DIMNS.CONTEXT_MENU.ITEM_WIDTH;
const CONTEXT_MENU_ITEM_HEIGHT = DIMNS.CONTEXT_MENU.ITEM_HEIGHT;
const CONTEXT_MENU_ITEM_GAP = DIMNS.CONTEXT_MENU.ITEM_GAP;



const contextMenuData = [ 
    { key:"delete", url:"/delete.png" }, 
    { key:"archive", url:"/archive.png" },
    { key:"copy", url:"/copy.png" }
]

export default function deckComponent() {
    //API SETTINGS
    // dimensions
    let width = 300;
    let height = 600
    let margin = { left: 0, right: 0, top: 0, bottom: 0 };
    //let margin = { left: 40, right: 40, top: 20, bottom: 20 };
    let extraMargin; //if deck dont take up full space

    let contentsWidth;
    let contentsHeight;

    let headerWidth;
    let headerHeight;

    let photoWidth;
    let photoHeight;
    let photoMargin;
    let photoContentsWidth;
    let photoContentsHeight;

    let cardsAreaWidth;
    let cardsAreaHeight;

    let cardsAreaAspectRatio;
    let botSpaceHeight;

    let heldCardsAreaHeight;
    let placedCardsAreaHeight;
    let cardHeaderHeight;

    let vertSpaceForIncs;

    let heldCardWidth;
    let heldCardHeight;

    let placedCardWidth;
    let placedCardHeight;
    let placedCardMarginVert;
    let placedCardHorizGap;

    let extraMarginLeftForCards;

    //increments
    let maxHorizSpaceForIncs;
    let vertCardInc;
    let horizCardInc;

    let selectedCardWidth;
    let selectedCardHeight;

    let sectionViewHeldCardWidth;
    let sectionViewHeldCardHeight;

    let cardX;
    let cardY;

    function updateDimns(data){
        //deck photo
        photoContentsWidth = data.photoURL ? 30 : 0;
        photoContentsHeight = photoContentsWidth / DIMNS.CARD.ASPECT_RATIO; //33.548
        photoMargin = { 
            left:photoContentsWidth * 0.1, right:photoContentsWidth * 0.1, 
            top:photoContentsHeight * 0.3, bottom:photoContentsHeight * 0.15
        }
        photoWidth = photoContentsWidth + photoMargin.left + photoMargin.right;
        photoHeight = photoContentsHeight + photoMargin.top + photoMargin.bottom

        const { frontCardNr } = data;
        contentsWidth = width - margin.left - margin.right;
        contentsHeight = height - margin.top - margin.bottom;

        headerWidth = contentsWidth;
        headerHeight = DIMNS.DECK.HEADER_HEIGHT;

        cardsAreaWidth = contentsWidth;
        cardsAreaHeight = contentsHeight - headerHeight;

        //this aspectRatio is only needed to aid with selecting a card to takeover entire area
        cardsAreaAspectRatio = cardsAreaWidth/cardsAreaHeight;

        cardHeaderHeight = contentsHeight * INFO_HEIGHT_PROPORTION_OF_CARDS_AREA;
        const minInc = cardHeaderHeight * 0.9;
        const nrHeldCards = data.cards.length - frontCardNr;
        const visibleVertCardInc = pos => {
            const incA = minInc * 0.4;// 16;
            const incB = minInc * 0.32;// 10;
            const incC = minInc * 0.24;// 4;
            const incD = minInc * 0.16;
            const incE = minInc * 0.1;
            if(pos === 0) { return 0; }
            if(pos === 1) { return minInc + incA }
            if(pos === 2) { return (minInc * 2) + incA + incB; }
            if(pos === 3) { return (minInc * 3) + incA + incB + incC; }
            const pos4 = (minInc * 4) + incA + incB + incC + incD; 
            if(pos === 4) { return pos4; }

            const nrHiddenHeldCards = nrHeldCards - 5;
            const posAmongstHiddenCards = pos - 4;
            const remainingSpace = incE;
            if(pos > 4){ 
                return pos4 + remainingSpace * (posAmongstHiddenCards/nrHiddenHeldCards) 
            }

        };

        //@todo - change the way horiz is done so its the other way round like vert
        //so horizSpaceForIncs can be calculated after in same way as vertSpaceForIncs
        maxHorizSpaceForIncs = 20;
        const horizSpaceForVisibleIncs = d3.min([cardsAreaWidth * 0.25, maxHorizSpaceForIncs]); 
        const horizSpaceForNonVisibleIncs = horizSpaceForVisibleIncs * 0.4;
        

        const visibleHorizCardInc = pos => {
            if(pos === 0) { return 0; }
            if(pos === 1) { return horizSpaceForVisibleIncs * 0.07; }
            if(pos === 2) { return horizSpaceForVisibleIncs * (0.07 + 0.12); }
            if(pos === 3) { return horizSpaceForVisibleIncs * (0.07 + 0.12 + 0.22); }
            const pos4 = horizSpaceForVisibleIncs * (0.07 + 0.12 + 0.22 + 0.3)
            if(pos === 4) { 
                return pos4; 
            }
            const remainingProp = 1 - (0.07 + 0.12 + 0.22 + 0.3)
            const remainingSpace = remainingProp * horizSpaceForNonVisibleIncs;
            const nrHiddenHeldCards = nrHeldCards - 5;
            const posAmongstHiddenCards = pos - 4;

            if(pos > 4){ 
                return pos4 + remainingSpace * (posAmongstHiddenCards/nrHiddenHeldCards) 
            }
        };

        //when deck is reduced in size, the cards behind are not visible exceot a tiny bit
        const nonVisibleVertInc = i => i * cardHeaderHeight * 0.2;
        const nonVisibleHorizInc = i => (i/5) * horizSpaceForNonVisibleIncs; //5 cards

        vertCardInc = deckIsSelected ? visibleVertCardInc : nonVisibleVertInc;
        horizCardInc = deckIsSelected ? visibleHorizCardInc : nonVisibleHorizInc;

        //NOTE: this max must also be same regardless of multideck view or single deck view
        const maxHeldCardWidth = cardsAreaWidth - (horizSpaceForVisibleIncs * 2); //need it to be symmetrical
        //NOTE: vertSpaceForIncs is the same regardless of whether the deck is selected 
        //(ie all card info sections visible) or not
        vertSpaceForIncs = visibleVertCardInc(4);
        //vertSpaceForIncs = vertCardInc(4);
        placedCardsAreaHeight = d3.min([80, cardsAreaHeight/7]); 
        heldCardsAreaHeight = cardsAreaHeight - placedCardsAreaHeight;

        //need to use visibleVertCardInc to calc the dimns...
        const maxHeldCardHeight = cardsAreaHeight - vertSpaceForIncs - placedCardsAreaHeight;
        const heldCardDimns = maxDimns(maxHeldCardWidth, maxHeldCardHeight, DIMNS.CARD.ASPECT_RATIO);
        heldCardWidth = heldCardDimns.width;
        heldCardHeight = heldCardDimns.height;

        //placed deck
        const maxPlacedCardHeight = placedCardsAreaHeight * 0.8;
        //ensure at least 0.1 for gaps
        const maxPlacedCardWidth = (heldCardWidth * 0.9)/5;
        const placedCardDimns = maxDimns(maxPlacedCardWidth, maxPlacedCardHeight, DIMNS.CARD.ASPECT_RATIO)
        placedCardWidth = placedCardDimns.width;
        placedCardHeight = placedCardDimns.height;

        placedCardHorizGap = (heldCardWidth - 5 * placedCardWidth) / 4;

        extraMarginLeftForCards = (cardsAreaWidth - heldCardWidth)/2;
        placedCardMarginVert = (placedCardsAreaHeight - placedCardHeight)/2;

        //section view changes
        //note - for now, its 1 item per card per section
        //@todo - put this space for teh hidden cards into the heldCardsAreaHeight instead,
        //and merge the way it is used with normal card view
        const nrHiddenPlacedCards = data.cardsData.filter(d => d.isPlaced && d.isHidden).length;
        const nrHiddenHeldCards = data.cardsData.filter(d => d.isHeld && d.isHidden).length;

        const sectionViewMarginHoz = heldCardWidth * 0.05;
        const sectionViewHorizSpaceForHiddenCards = d3.min([nrHiddenHeldCards * heldCardWidth * 0.02, heldCardWidth * 0.06]);
        const sectionViewVertSpaceForHiddenCards = d3.min([nrHiddenHeldCards * heldCardsAreaHeight * 0.0133, heldCardWidth * 0.04])
        const sectionViewHeldCardsAreaHeight = heldCardsAreaHeight - sectionViewVertSpaceForHiddenCards;
        sectionViewHeldCardWidth = heldCardWidth;
        sectionViewHeldCardHeight = sectionViewHeldCardsAreaHeight / 5; //we show 5 on screen

        //selected card dimns
        const selectedCardDimns = maxDimns(cardsAreaWidth, cardsAreaHeight, DIMNS.CARD.ASPECT_RATIO)
        selectedCardWidth = selectedCardDimns.width;
        selectedCardHeight = selectedCardDimns.height;

        //cardX and Y
        //erro now on pick up card, it goes to 0,0 so either cardX or cardY is NaN
        cardX = (d,i) => {
            //console.log("cardX",d.pos,  d)
            if(selectedSection?.key && d.isHeld){
                const gapForHorizIncs = contentsWidth - sectionViewHeldCardWidth - 2 * sectionViewMarginHoz - sectionViewHorizSpaceForHiddenCards;
                const horizInc = gapForHorizIncs / 4;
                if(d.isHidden){ 
                    const hiddenHeldPos = d.pos - 4; //hiddenHeldPos starts from 1, not 0
                    const hiddenHeldProportion = hiddenHeldPos/nrHiddenHeldCards;
                    const inc = hiddenHeldProportion * sectionViewHorizSpaceForHiddenCards;
                    const pos4 = sectionViewMarginHoz + (4 * horizInc);
                    return pos4 + inc;
                }
                return sectionViewMarginHoz + d.pos * horizInc;
            }
            if(d.isSelected){
                //keep it centred
                //console.log("returning", (cardsAreaWidth - selectedCardWidth)/2)
                return (cardsAreaWidth - selectedCardWidth)/2;
            }
            if(d.isHeld){
                //console.log("returning", extraMarginLeftForCards + horizCardInc(d.pos))
                const inc = d3.min([maxHorizSpaceForIncs, horizCardInc(d.pos)]);
                return extraMarginLeftForCards + inc;
            }

            const slot0 = extraMarginLeftForCards;
            if(d.slotPos >= 0){
                //console.log("returning", slot0 + d.slotPos * (placedCardWidth + placedCardHorizGap))
                return slot0 + d.slotPos * (placedCardWidth + placedCardHorizGap);
            }
            const spaceForHidden = placedCardWidth * 0.4;
            const hiddenPos = Math.abs(d.pos) - 5;
            const inc = (hiddenPos/nrHiddenPlacedCards) * spaceForHidden;
            return slot0 - inc;
        }

        cardY = (d,i) => {
            //console.log("cardY", d)
            //helpful values for hidden cards
            const hiddenHeldPos = d.pos - 4; //hiddenHeldPos starts from 1, not 0
            const hiddenHeldProportion = hiddenHeldPos/nrHiddenHeldCards;

            if(selectedSection?.key && d.isHeld){
                if(d.isHidden){ 
                    return (1 - hiddenHeldProportion) * sectionViewVertSpaceForHiddenCards;
                }
                return sectionViewVertSpaceForHiddenCards + (4 - d.pos) * sectionViewHeldCardHeight;
            }
            if(d.isSelected){
                return (cardsAreaHeight - selectedCardHeight)/2;
            }
            
            if(d.isHeld){
                if(deckIsSelected){
                    //extra shift up in multiview to create a pseudo margin between decks
                    //const vertShiftUpForMultiview = heldCardsAreaHeight * 0.25; 
                    //in multideck view, not all the incr space is taken up
                    const totalVertIncs = vertSpaceForIncs;// deckIsSelected ? vertSpaceForIncs : vertCardInc(4);
                    const extraMarginTop = (heldCardsAreaHeight - heldCardHeight - totalVertIncs)/2;
                    //return extraMarginTop + totalVertIncs - vertCardInc(d.pos) 
                    return extraMarginTop + totalVertIncs- vertCardInc(d.pos)
                    // - (deckIsSelected ? 0 : vertShiftUpForMultiview)
                }else{
                    //multideck view
                    const totalVertIncs = vertSpaceForIncs - photoHeight;// deckIsSelected ? vertSpaceForIncs : vertCardInc(4);
                    const extraMarginTop = (heldCardsAreaHeight - heldCardHeight - vertSpaceForIncs)/2;
                    //return extraMarginTop + totalVertIncs - vertCardInc(d.pos) 
                    const inc = d3.min([totalVertIncs, vertCardInc(d.pos)])
                    return extraMarginTop + photoHeight + totalVertIncs - inc;
                }
            }

            return heldCardsAreaHeight + placedCardMarginVert;
        }
    }
    let DEFAULT_STYLES = {
        deck:{ info:{ date:{ fontSize:9 } } },
    }
    let _styles = () => DEFAULT_STYLES;

    //settings
    let groupingTag;
    let timeframeKey = "singleDeck";
    let deckIsSelected;
    let selectedCardNr;
    let selectedItemNr;
    let selectedSection;
    let content = "cards"; //can be "purpose"
    let format;
    let cardsAreFlipped = false;
    let form;
    let transformTransition;
    let longpressedDeckId;

    //for dragging decks
    let getCell = position => [0,0];
    let cloneG;
    let newCell;

    //controlbtns
    const btnDrag = d3.drag();

    //data 
    let id;

    let onFlipCards = function(){};
    let onSelectItem = function(){};
    let onSelectSection = function(){};
    let onSetContent = function(){};
    let onSelectDeck = function(){};
    let onSetLongpressed = function(){};
    let onSetSelectedCardNr = function(){};
    let onMoveDeck = function(){};
    let onDeleteDeck = function(){};
    let onArchiveDeck = function(){};
    let onCopyDeck = function(){};
    let setForm = function(){};
    let updateItemStatus = function(){};
    let updateFrontCardNr = function(){};
    let onAddCard = function(){};
    let onDeleteCard = function(){};

    let deckIsLongpressed = false;
    let wasDragged = false;

    let handleDrag;
    let startLongpress;
    let endLongpress;

    let selectCard;
    let deselectCard;

    let containerG;
    let contentsG;
    let headerG;
    let cardsAreaG;
    let contextMenuG;
    let controlsG;

    const itemAreaDrag = d3.drag();

    //components
    const header = deckHeaderComponent();
    const cards = cardsComponent();
    const contextMenu = contextMenuComponent();
    const enhancedDrag = dragEnhancements();
    const purpose = purposeComponent();

    function deck(selection, options={}) {
        //console.log("deck--------------------------------------------")
        const { transitionEnter=true, transitionUpdate=true } = options;

        // expression elements
        selection.each(function (deckData) {
            updateDimns(deckData);
            id = deckData.id;
            containerG = d3.select(this);

            if(containerG.select("g").empty()){
                init();
            }

            update(deckData);

            function init(){
                //bg
                /*containerG
                    .append("rect")
                        .attr("class", "deck-bg")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("fill", grey10(9));*/

                contentsG = containerG.append("g").attr("class", "deck-contents");

                contentsG.append("rect")
                    .attr("class", "contents-bg")
                    //.attr("pointer-events", "none")
                    .attr("fill", "none")
                    .attr("stroke", COLOURS.DECK.STROKE)
                    .attr("rx", 3)
                    .attr("ry", 3);
                
                headerG = contentsG.append("g")
                    .attr("class", "header")
                    .attr("opacity", isNumber(selectedCardNr) ? 0 : 1);

                cardsAreaG = contentsG
                    .append("g")
                    .attr("class", "cards-area");

                cardsAreaG.append("rect").attr("class", "cards-area-bg");

                containerG
                    .append("rect")
                        .attr("class", "deck-overlay")
                        .attr("width", width)
                        .attr("height", height)
                        .attr("fill", "transparent")
                        .attr("opacity", 0.3);

                contextMenuG = containerG.append("g")
                    .attr("class", "context-menu")

                controlsG = contentsG.append("g").attr("class", "controls");
                controlsG.append("rect").attr("class", "controls-bg").attr("fill", COLOURS.DECK.CONTROLS)
            }

            function update(_deckData, options={}){
                const { } = options;
                const { id, frontCardNr, startDate, listPos, colNr, rowNr, purposeData, sections, photoURL } = _deckData;

                //PURPOSE
                const getPurposeFormDimns = (i, dimns) => {
                    const { paragraphHeight, paragraphMargin, paragraphContentsWidth, paragraphContentsHeight,
                        purposeMargin, paraFontSize } = dimns;
                    return {
                        //@todo - vert can calc this based ont he variable length of previous paragraphs
                        width:paragraphContentsWidth,
                        height:paragraphContentsHeight,
                        left:margin.left + purposeMargin.left - 2,
                        //extra added on end - not sure why it is needed
                        top:margin.top + headerHeight + purposeMargin.top 
                            + i * paragraphHeight + paragraphMargin.top - 1 /*- (4 + i * 1.5)*/,
                        fontSize:paraFontSize
                    }
                }
        
                const spaceForPhoto = deckIsSelected ? 0 : photoHeight;
                const purposeG = contentsG.selectAll("g.purpose").data(content === "purpose" ? [purposeData] : [])
                purposeG.enter()
                    .append("g")
                        .attr("class", "purpose")
                        .call(fadeIn, { transition:{ delay:400 }})
                        .merge(purposeG)
                        .attr("transform", () => `translate(0, ${headerHeight + spaceForPhoto})`)
                        .call(purpose
                            .width(contentsWidth)
                            .height(contentsHeight - headerHeight - spaceForPhoto)
                            .onClick((e, d, dimns) => {
                                const formDimns = getPurposeFormDimns(d.i, dimns);
                                setForm({ formType:"purpose", value:d, formDimns } )
                            }))

                purposeG.exit().call(remove)

                //contextMenu
                //note - hoz and vert margins are not the same proportion of total

                const menuMargin = {
                    left: CONTEXT_MENU_ITEM_WIDTH * 0.4, right:CONTEXT_MENU_ITEM_WIDTH * 0.4,
                    top:CONTEXT_MENU_ITEM_HEIGHT * 0.1, bottom: CONTEXT_MENU_ITEM_HEIGHT * 0.1
                }
    
                const nrItems = contextMenuData.length;
                const contextMenuWidth = nrItems * CONTEXT_MENU_ITEM_WIDTH + (nrItems - 1) * CONTEXT_MENU_ITEM_GAP + menuMargin.left + menuMargin.right;
                const contextMenuHeight = CONTEXT_MENU_ITEM_HEIGHT + menuMargin.top + menuMargin.bottom;
    
                const gapBetweenDeckAndMenu = rowNr === 0 ? -60 : 10;
                contextMenuG
                    .attr("transform", `translate(${(width - contextMenuWidth)/2},${-contextMenuHeight - gapBetweenDeckAndMenu})`)
                
                contextMenu
                    .itemWidth(CONTEXT_MENU_ITEM_WIDTH)
                    .itemHeight(CONTEXT_MENU_ITEM_HEIGHT)
                    .itemGap(CONTEXT_MENU_ITEM_GAP)
                    .menuMargin(menuMargin)
                    .onClick((e,d) => {
                        if(d.key === "delete"){ onDeleteDeck(id); }
                        if(d.key === "archive"){ onArchiveDeck(id); }
                        if(d.key === "copy"){ onCopyDeck(id); }
                        cleanupLongpress();
                        e.stopPropagation();
                    })

                //drag overlay
                enhancedDrag
                    .dragThreshold(100)
                    .onLongpressStart(function(){
                        onSetLongpressed(true); 
                    })
                    .onLongpressDragged(longpressDragged)
                    .onLongpressEnd(function(){
                        if(wasDragged){
                            onSetLongpressed(false);
                        }
                    });

                const drag = d3.drag()
                    .on("start", deckIsSelected ? null : enhancedDrag(dragStart))
                    .on("drag", deckIsSelected ? null : enhancedDrag(dragged))
                    .on("end", deckIsSelected ? null : enhancedDrag(dragEnd))

                function dragStart(e,d){
                }

                function dragged(e,d){
                    if(longpressedDeckId === id){ wasDragged = true; }
                    handleDrag(e);
                }

                function dragEnd(e,d){ 
                    if(longpressedDeckId === id && wasDragged){ 
                        onSetLongpressed(false); 
                    }
                }

                //issue - cloneG is a child of container, which moves, making the clone move too????
                startLongpress = function(e,d){
                    //console.log("startlp..................")
                    //d3.selectAll("g.deck").filter(d => d.id !== id).attr("pointer-events", "none");

                    //create a clone 
                    cloneG = containerG
                        .clone(true)
                        .attr("class", "cloned-deck")
                        .attr("pointer-events", "all") //override the pointerevents none for d3 when in multideck view
                        //.attr("pointer-events", "none") //this allows orig deck to be dragged
                        .attr("opacity", 1)
                        .call(drag)
                        .raise();
                    
                    cloneG.select("rect.deck-overlay").attr("fill", "green")
                    cloneG.select("g.context-menu")
                        .datum(contextMenuData)
                        .call(contextMenu)

                    //now we have cloned it, we hide the original
                    containerG.attr("opacity", 0)

                    //onSetLongpressed(true)
                }
                function longpressDragged(e,d){
                    wasDragged = true;
                    handleDrag(e);
                }

                handleDrag = function(e,d){
                    wasDragged = true;
                    if(!cloneG) { return; }
                    cloneG.select("g.context-menu").remove();

                    const { translateX, translateY } = getTransformationFromTrans(cloneG.attr("transform"));
                    const newX = translateX + e.dx;
                    const newY = translateY + e.dy;
                    const currentNewCell = getCell([newX, newY]);
                    const prevNewCell = newCell;
                    if(!prevNewCell || currentNewCell.key !== prevNewCell.key){
                        newCell = currentNewCell;
                        // add newCell stroke
                        d3.select(`g.deck-${newCell.deckId}`).select("rect.deck-overlay")
                            .attr("opacity", 0.8)
                            .attr("stroke", "green")
                            .attr("stroke-width", 3)
                    
                        //remove prev 
                        d3.select(`g.deck-${prevNewCell?.deckId}`).select("rect.deck-overlay")
                            .attr("opacity", 0.3)
                            .attr("stroke", null)
                            .attr("stroke-width", null)
                    }
                       
                    //drag the clone
                    cloneG.attr("transform", `translate(${newX},${newY})`);
                }

                endLongpress = function(){
                    if(newCell){
                        //@todo - handle grid format if layoutFormat is grid
                        onMoveDeck(listPos, newCell.listPos);

                        cloneG
                            .transition("clone")
                            .duration(TRANSITIONS.MED)
                            .attr("transform", `translate(${newCell.deckX},${newCell.deckY})`)
                            .on("end", function(){ cleanupLongpress(); })
                    }else{
                        cleanupLongpress();
                    }
                
                    //d3.selectAll("g.deck").filter(d => d.id !== id).attr("pointer-events", null);
                }

                function cleanupLongpress(){
                    cloneG.remove();
                    containerG.attr("opacity", 1);

                    //remove newCell stroke if it exists
                    d3.select(`g.deck-${newCell?.deckId}`).select("rect.deck-overlay")
                        .attr("opacity", 0.3)
                        .attr("stroke", null)
                        .attr("stroke-width", null)

                    onSetLongpressed(false);
                    newCell = null;

                }

                //containerG.call(drag);
                    
                containerG.select("rect.deck-overlay")
                    .attr("display", deckIsSelected ? "none" : null)
                    .attr("width", width)
                    .attr("height", height)
                    /*.on("click", e => {
                        //console.log("click deck overlay")
                        if(longpressedDeckId === id){ 
                            e.stopPropagation();
                            return;
                        }
                        //onSelectDeck(_deckData.id)
                    })*/
                    /*.call(updateRectDimns, { 
                        width: () => width, 
                        height:() => height,
                        transition:transformTransition,
                        name:d => `deck-dimns-${d.id}`
                    })*/

                //contents
                contentsG.attr("transform", `translate(${margin.left}, ${margin.top})`)

                contentsG
                    .select("rect.contents-bg")
                        .attr("width", contentsWidth)
                        .attr("height", contentsHeight)
                
                //helper
                const deckTitleIsBeingEdited = form?.formType === "deck-title" && form?.deckId === id;
                const deckSubtitleIsBeingEdited = form?.formType === "section" && form?.deckId === id;
                //header
                const subtitle = selectedSection?.title;
                headerG
                    .datum({ ..._deckData, title:_deckData.title || id, subtitle })
                    .call(header
                        .width(headerWidth)
                        .height(headerHeight)
                        .margin({ left: 7.5, right: 0, top: 0, bottom: 0 } )
                        .withTitle(!deckTitleIsBeingEdited)
                        .withSubtitle(!deckSubtitleIsBeingEdited)
                        .withSpaceForSubtitle(!!subtitle) //keep the space for subtitle, and just remove whilst being edited
                        .maxTitleFont(deckIsSelected ? 5 : 14)
                        .maxTitleChars(deckIsSelected ? 34 : 10)
                        .onClickTitle(function(e){
                            e.stopPropagation();
                            setForm({ formType: "deck-title", deckId:id }) 
                        })
                        .onClickSubtitle(function(e){
                            e.stopPropagation();
                            setForm({ formType: "section", sectionKey:selectedSection.key, deckId:id }) 
                        })
                        .onClickProgressIcon(() => onSetContent("purpose")))

                selectCard = function(cardNr){
                    //hide/show others
                    //@todo - this can be part of update process instead
                    containerG.selectAll("g.card").filter(cardD => cardD.cardNr !== cardNr)
                        //.attr("pointer-events", "none")
                        .transition("cards")
                        .duration(400)
                            .attr("opacity", 0)
                                .on("end", function(){ d3.select(this).attr("display", "none"); })
                
                    headerG
                        .transition("header")
                        .duration(400)
                           .attr("opacity", 0)
                           .on("end", function(){ d3.select(this).attr("display", "none"); })

                    //selectedCardNr = d.cardNr;
                    //onSetSelectedCardNr(d.cardNr);
                    //update(deckData);
                }

                //2 issues - clicking card backgrounddoes nothing, but it should still prevent 
                //propagation to the div bg to deslect deck.

                //2nd - swiping the placed cards is not being picked up - perhaps start with clicking
                //all cards, check that is picked up, it should just prevetn ptopagtion thats all

                deselectCard = function(){
                    //hide/show others
                    //@todo - this can be part of update process instead
                    containerG.selectAll("g.card")//.filter(d => d.cardNr !== cardD.cardNr)
                        .attr("display", null)
                            .transition("cards")
                            .delay(400)
                            .duration(600)
                                .attr("opacity", 1)
                
                    headerG
                        .attr("display", null)
                            .transition("header")
                            .delay(400)
                            .duration(600)
                            .attr("opacity", 1)

                    //selectedCardNr = null
                    //update(deckData);
                    //onSetSelectedCardNr("");
                }

                //PHOTO
                const photoData = deckIsSelected || !photoURL ? [] : [photoURL];
                const photoG = contentsG.selectAll("g.deck-photo").data(photoData)
                const photoX = selectedSection || DECK_PHOTO_POS === "left" ? 3 + photoMargin.left : (contentsWidth - photoWidth)/2 + photoMargin.left;

                photoG.enter()
                    .append("g")
                        .attr("class", "deck-photo")
                        .call(fadeIn, { transition:{ delay:TRANSITIONS.MED } })
                        .each(function(){
                            const photoG = d3.select(this);
                            photoG.append("rect")
                                .attr("fill", grey10(9));

                            photoG.append("image");

                            d3.select("svg#decks-svg").select("defs").append("clipPath")
                                .attr('id', `deck-photo-${id}`)
                                .append("rect")
                        })
                        .merge(photoG)
                        .attr("transform", `translate(${photoX}, ${headerHeight + photoMargin.top})`)
                        .each(function(d){
                            const photoG = d3.select(this);
                            photoG.select("rect")
                                .attr("width", photoContentsWidth)
                                .attr("height", photoContentsHeight)
                                //.attr("opacity", 0.2)

                                photoG.select("image") 
                                //.attr("width", width)
                                .attr("xlink:href", d)
                                //.attr("transform", 'scale(0.1)')
                                .attr("transform", `scale(${photoContentsWidth / 250})`) //based on reneeRegis photoSize 260 by 335.48 

                            d3.select(`clipPath#deck-photo-${id}`)
                                .select("rect")
                                    .attr("width", photoContentsWidth)
                                    .attr("height", photoContentsHeight)
                                    .attr("rx", 3)
                                    .attr("ry", 3)

                            photoG.attr('clip-path', `url(#deck-photo-${id})`)
                        })
                photoG.exit().remove()

                //CARDS
                const cardsData = _deckData.cardsData.map(c => ({ 
                    ...c,
                    isSelected:selectedCardNr === c.cardNr,
                    photoURL
                }))

                cardsAreaG.call(fadeInOut, content === "cards" /*{ transition:{ duration: 1000 } }*/);

                cardsAreaG
                    .attr("transform", `translate(0, ${headerHeight})`)
                    .datum(cardsData)
                    .call(cards
                        .width(cardsAreaWidth)
                        .height(cardsAreaHeight)
                        .heldCardWidth(heldCardWidth)
                        .heldCardHeight(heldCardHeight)
                        .headerHeight(cardHeaderHeight)
                        .placedCardWidth(placedCardWidth)
                        .placedCardHeight(placedCardHeight)
                        .selectedCardWidth(selectedCardWidth)
                        .selectedCardHeight(selectedCardHeight)
                        .sectionViewHeldCardWidth(sectionViewHeldCardWidth)
                        .sectionViewHeldCardHeight(sectionViewHeldCardHeight)
                        .groupingTag(groupingTag)
                        .timeframeKey(timeframeKey)
                        .deckIsSelected(deckIsSelected)
                        .cardsAreFlipped(cardsAreFlipped)
                        .form(form)
                        .transformTransition(transformTransition)
                        .x(cardX)
                        .y(cardY)
                        .onSelectItem(onSelectItem)
                        .onClickCardDate(function(cardD,i){
                            setForm({
                                formType: "card-date",
                                value:cardD,
                                startDate:cardD.cardNr === 0 ? startDate : null
                            })
                        })
                        .onClickCardTitle((cardD, i, cardDimns) => {
                            setForm({ 
                                formType: "card-title", 
                                value:cardD, 
                                formDimns:{
                                    ...cardDimns,
                                    left:margin.left + cardX(cardD, i) + cardDimns.left,
                                    top:margin.top + headerHeight + cardY(cardD, i) + cardDimns.top,
                                    //todo - scale for selected card

                                }
                            }) 
                        })
                        .onUpdateItemStatus(updateItemStatus)
                        .onClickCard(function(e, d){
                            if(!deckIsSelected){
                                onSelectDeck(_deckData.id);
                            } else if(selectedCardNr === d.cardNr){
                                onSetSelectedCardNr("")
                            } else{
                                onSetSelectedCardNr(d.cardNr)
                            }
                        })
                        .onAddCard(cardNr => { onAddCard(id, cardNr || frontCardNr) })
                        .onDeleteCard(cardD => { 
                            const { cardNr } = cardD;
                            const cardId = cardD.id;
                            const getNextCardId = () => {
                                const nextCard = cardsData.find(c => c.cardNr === cardNr + 1);
                                return nextCard?.id || "none"; //defaults to all cards placed
                            }
                            if(frontCardNr === cardD.cardNr){ 
                                onDeleteCard(id, cardId, getNextCardId());
                            }else{
                                onDeleteCard(id, cardId);
                            }
                        })
                        .onPickUp(function(d){
                            updateFrontCardNr(d.id)
                        })
                        .onPutDown(function(d){
                            const newFrontCard = cardsData.find(c => c.cardNr === d.cardNr + 1);
                            updateFrontCardNr(newFrontCard?.id || "none");
                        })
                        .setForm(setForm))


                //controls
                const controlsData = !sections || cardsAreFlipped || timeframeKey === "longTerm" ? [] : [
                    { i:0, key:"section-view", icon:icons.drill }
                ];

                const btnWidth = 10;
                const btnHeight = 18;
                const btnMargin = { left: 1, right: 1, top:5, bottom:5 }
                const btnContentsWidth = btnWidth - btnMargin.left - btnMargin.right;
                const btnContentsHeight = btnHeight - btnMargin.top - btnMargin.bottom;

                const controlsMarginVert = 0;
                const controlsContentsWidth = btnWidth;
                const controlsWidth = controlsContentsWidth;
                const controlsContentsHeight = controlsData.length * btnHeight;
                const controlsHeight = controlsContentsHeight + 2 * controlsMarginVert;
                
                const spaceAvailableOnLeftOfCards = (width - heldCardWidth)/2;
                const controlsOuterMarginLeft = (spaceAvailableOnLeftOfCards - controlsWidth)/2;
                const controlsOuterMarginBottom = controlsOuterMarginLeft;

                const xToCentre = -controlsOuterMarginLeft + (width - btnWidth)/2;//+ deckToCentrePos.x   // -controlsOuterMarginLeft + (width - btnWidth)/2;
                const cardItemsAreaHeight = heldCardHeight - cardHeaderHeight;
                const yToCentre = controlsOuterMarginBottom + controlsMarginVert - placedCardsAreaHeight - cardItemsAreaHeight/2 + btnHeight/2 + 1;

                const btnY = (d,i) => controlsMarginVert + i * btnHeight;
                const btnScaleWhenDragged = 1.8;

                //highlighting 
                let potentialSelectedSectionNr;
                const highlightSection = nr => {
                    const highlightColour = grey10(7);
                    //top-right header pentagon
                    const headerPentagonSectionG = containerG.selectAll("g.card-header").select("g.pentagon").select(`g.section-${nr}`);
                    headerPentagonSectionG.select("path.section-bg")
                        .transition("highlight-header-section")
                        .duration(TRANSITIONS.VERY_FAST)
                            .attr("opacity", 1)
                            .attr("fill", highlightColour)

                    //items-area stuff
                    const sectionG = containerG.selectAll("g.card").select("g.items-area").select(`g.section-${nr}`);

                    sectionG.select("path.section-bg")
                        .transition("highlight")
                        .duration(TRANSITIONS.VERY_FAST)
                            .attr("opacity", 1)
                            .attr("fill", highlightColour)

                    sectionG.selectAll("text.section-identifier")
                        .attr("transform", "scale(1)")
                            .transition("highlight")
                            .duration(TRANSITIONS.VERY_FAST)
                                .attr("fill", highlightColour)
                                .attr("font-size", FONTSIZES.SECTION_ID * 1.2)
                                .attr("opacity", 1)

                    
                }

                const unhighlightSection = nr => {
                     //top-right header pentagon
                     const headerPentagonSectionG = containerG.selectAll("g.card-header").select("g.pentagon").select(`g.section-${nr}`);
                     headerPentagonSectionG.select("path.section-bg")
                         .transition("unhighlight-header-section")
                         .duration(TRANSITIONS.VERY_FAST)
                             .attr("opacity", 0)
                             .attr("fill", 'blue')

                    //items-area stuff
                    const sectionG = containerG.selectAll("g.card").select("g.items-area").select(`g.section-${nr}`);
                    sectionG.select("path.section-bg")
                        .transition("unhighlight")
                        .duration(TRANSITIONS.VERY_FAST)
                            .attr("opacity", 1)
                            .attr("fill", ITEM_FILL)

                    sectionG.selectAll("text.section-identifier")
                        .transition("highlight")
                        .duration(TRANSITIONS.VERY_FAST)
                            .attr("fill", COLOURS.CARD.SECTION_ID)
                            .attr("font-size", FONTSIZES.SECTION_ID)
                            .attr("opacity", STYLES.SECTION_ID_OPACITY)
                }

                btnDrag
                    .on("start", function(e,d){
                    })
                    .on("drag", function(e, d){
                        const btnG = d3.select(this);
                        const { translateX, translateY } = getTransformationFromTrans(btnG.attr("transform"));
                        const newX = translateX + e.dx;
                        const newY = translateY + e.dy;
                        btnG.attr("transform", `translate(${newX}, ${newY}) scale(${btnScaleWhenDragged})`);

                        //Determine the section
                        //const _x = newX - centreX;
                        //const _y = newY - centreY;
                        const _x = newX - xToCentre;
                        const _y = newY - yToCentre;

                        //console.log("_x", _x)
                        const distFromCentre = Math.sqrt(_x ** 2 + _y ** 2);
                        //console.log("distFromCentre", distFromCentre)
                        const theta = angleFromNorth([[_x, _y]])
                        if(distFromCentre > cards.itemsOuterRadius()){ 
                            if(potentialSelectedSectionNr !== ""){ unhighlightSection(potentialSelectedSectionNr); }
                            potentialSelectedSectionNr = ""; 
                        }
                        else {
                            const newPotentialSelectedSectionNr = Math.floor(theta/(360/5)) + 1;
                        
                            if(potentialSelectedSectionNr === ""){ highlightSection(newPotentialSelectedSectionNr) }
                            else { 
                                unhighlightSection(potentialSelectedSectionNr);
                                highlightSection(newPotentialSelectedSectionNr);
                            }
                            potentialSelectedSectionNr = newPotentialSelectedSectionNr;
                        }
                    })
                    .on("end", function(e, d){
                        const cleanup = () => {
                            //get i from the datum
                            const { i } = d; 
                            controlsG.selectAll("g.deck-control-btn")
                                .transition()
                                .duration(TRANSITIONS.FAST)
                                    .attr("transform", `translate(0, ${btnY(d, i)})`)
                        }
                        if(!selectedSection && !potentialSelectedSectionNr){  cleanup(); }
                        //bug - this doesnt work sometimes
                        if(selectedSection?.nr !== potentialSelectedSectionNr){
                            const section = sections.find(s => s.nr === potentialSelectedSectionNr)
                            onSelectSection(section?.key || "")
                            potentialSelectedSectionNr = "";
                        }else{
                            cleanup();
                        }
                    })
    
                controlsG.call(fadeInOut, content === "cards" && deckIsSelected && !isNumber(selectedCardNr) && !selectedSection?.key)
                controlsG
                    .attr("transform", `translate(${controlsOuterMarginLeft},${height - controlsOuterMarginBottom - controlsHeight})`)


                controlsG.select("rect.controls-bg")
                    .attr("width", controlsWidth)
                    .attr("height", controlsHeight)
                    .attr("rx", 1.5)
                    .attr("ry", 1.5)
            
                const btnG = controlsG.selectAll("g.deck-control-btn").data(controlsData, d => d.key);
                btnG.enter()
                    .append("g")
                        .attr("class", "deck-control-btn btn")
                        .each(function(d){
                            const btnG = d3.select(this);
                            
                            const btnContentsG = btnG.append("g").attr("class", 'btn-contents');
                            if(d.key === "section-view"){
                                btnContentsG.append("circle").attr("class", "btn-bg")
                                    .attr("fill", COLOURS.DECK.CONTROLS)
                                    .attr("opacity", 0.6)

                                const iconG = btnContentsG.append("g").attr("class", "icon")
                                iconG.append("path").attr("class", "path1")
                                    .attr("fill", grey10(4));
                                iconG.append("path").attr("class", "path2")
                                    .attr("fill", grey10(4));
                            }else{
                                btnContentsG.append("rect").attr("class", "btn-bg")
                                    .attr("fill", COLOURS.DECK.CONTROLS)
                                    .attr("opacity", 0.6)
                                    .attr("rx", 1)
                                    .attr("ry", 1);

                                const iconG = btnContentsG.append("g").attr("class", "icon");
                                //@todo - impl icons for other controls as they are added
                            }

                            //hitbox
                            btnG.append("rect")
                                .attr("class", "hitbox")
                                .attr("fill", "transparent");

                        })
                        .merge(btnG)
                        .attr("transform-origin",(d,i) => `${btnWidth/2} ${btnY(d,i) + btnHeight/2}`)
                        //.attr("transform", (d,i) => `translate(0, ${btnY(d,i)})`)
                        .attr("transform", (d,i) => `translate(0, ${btnY(d,i)})`)
                        .each(function(d){
                            const btnG = d3.select(this);

                            btnG.select("rect.hitbox")
                                .attr("width", btnWidth)
                                .attr("height", btnHeight)

                            const btnContentsG = btnG.select("g.btn-contents")
                                .attr("transform", `translate(${btnMargin.left},${btnMargin.top})`);

                            if(d.key === "section-view"){
                                //bg
                                const r = btnContentsWidth/2;
                                btnContentsG.select("circle.btn-bg")
                                    .attr("cx", r)
                                    .attr("cy", r)
                                    .attr("r", r)
                                    .attr("stroke", "white")
                                    .attr("stroke-width", 0.05)

                                //icon
                                const iconG = btnContentsG.select("g.icon")
                                .attr("transform", `translate(-0.2,0) scale(0.26)`);

                                iconG.select("path.path1")
                                    .attr("d", d.icon.paths[0].d)
                                iconG.select("path.path2")
                                    .attr("d", d.icon.paths[1].d)
                            }else{
                                //bg
                                btnContentsG.select("rect.btn-bg")
                                    .attr("width", btnContentsWidth)
                                    .attr("height", btnContentsHeight)
                            }

                        })
                        .call(btnDrag)

                btnG.exit().remove();

                //deck botright btn
                const closeBtnDatum = { 
                    key:"close", 
                    onClick:e => { 
                        e.stopPropagation();
                        if(selectedSection?.key){
                            onSelectSection() 
                        }else{
                            onSetContent("cards");
                        }
                    },
                    fill:grey10(3),
                    icon:icons.close,
                }

                const flipBtnDatum = { 
                    key:"flip", 
                    onClick:e => { 
                        e.stopPropagation();
                        onFlipCards();
                    },
                    fill:grey10(5),
                    icon:icons.flip,
                }

                const inSectionOrPurposeView = selectedSection?.key || content === "purpose";
                let bottomRightBtnData = !deckIsSelected ? [] : (inSectionOrPurposeView ? [closeBtnDatum] : [flipBtnDatum]);
                const bottomRightBtnHeight = 22;
                const bottomRightBtnMarginHoz = bottomRightBtnHeight * 0.25;
                const bottomRightBtnMarginVert = bottomRightBtnHeight * 0.25;
                const bottomRightBtnWidth = bottomRightBtnHeight;
                const extraShiftDownForSelectedCard = isNumber(selectedCardNr) ? bottomRightBtnMarginVert * 0.5 : 0;
                //assumme all are square
                //note: 0.8 is a bodge coz iconsseems to be bigger than they state
                const botRightBtnScale = d => (0.8 * bottomRightBtnContentsHeight)/d.icon.height;

                const bottomRightBtnContentsWidth = bottomRightBtnWidth - 2 * bottomRightBtnMarginHoz;
                const bottomRightBtnContentsHeight = bottomRightBtnHeight - 2 * bottomRightBtnMarginVert;

                const bottomRightBtnG = contentsG.selectAll("g.deck-bottom-right-btn").data(bottomRightBtnData, d => d.key);
                bottomRightBtnG.enter()
                    .append("g")
                        .attr("class", "deck-bottom-right-btn")
                        .call(fadeIn)
                        .each(function(d){
                            const btnG = d3.select(this);
                            if(d.key === "close"){
                                btnG.append("path");
                            }else{
                                //flip button
                                btnG.append("path").attr("class", "path-0").style("fill-rule", "nonzero");
                                btnG.append("path").attr("class", "path-1").style("fill-rule", "nonzero");
                                btnG.append("line")
                            }
                            
                            btnG.append("rect").attr("class", "btn-hitbox")
                                .attr("fill", "transparent")
                                //.attr("stroke", "blue");
                        })
                        .attr("transform", `translate(
                            ${contentsWidth - bottomRightBtnWidth + bottomRightBtnMarginHoz},
                            ${contentsHeight - bottomRightBtnHeight + bottomRightBtnMarginVert + extraShiftDownForSelectedCard})`)
                        .merge(bottomRightBtnG)
                        .each(function(d,i){
                            const btnG = d3.select(this);

                            btnG.transition("deck-btn-position")
                                .duration(TRANSITIONS.FAST)
                                .attr("transform", `translate(
                                    ${contentsWidth - bottomRightBtnWidth + bottomRightBtnMarginHoz},
                                    ${contentsHeight - bottomRightBtnHeight + bottomRightBtnMarginVert + extraShiftDownForSelectedCard})`)

                            if(d.key === "close"){
                                btnG.select("path")
                                    .attr("transform", `scale(${botRightBtnScale(d)})`)
                                    .attr("d", d.icon.d)
                                    .attr("fill", d.fill)
                            }else{
                                //flip button
                                btnG.select("path.path-0")
                                    .attr("transform", `scale(${botRightBtnScale(d)}) translate(-1,-1)`)
                                    .attr("d", d.icon.paths[0].d)
                                    .attr("fill", d.fill)

                                btnG.select("path.path-1")
                                    .attr("transform", `scale(${botRightBtnScale(d)}) translate(-1,-1)`)
                                    .attr("d", d.icon.paths[1].d)
                                    .attr("fill", d.fill)

                                btnG.select("line")
                                    .attr("transform", `scale(${botRightBtnScale(d)}) translate(0.5,0.6)`)
                                    .attr("x1", d.icon.lines[0].x1)
                                    .attr("y1", d.icon.lines[0].y1)
                                    .attr("x2", d.icon.lines[0].x2)
                                    .attr("y2", d.icon.lines[0].y2)
                                    .attr("stroke-width", 0.2)
                                    .attr("stroke", d.fill)
                            }
                    
                            btnG.select("rect.btn-hitbox")
                                .attr("width", bottomRightBtnContentsWidth)
                                .attr("height", bottomRightBtnContentsHeight)

                        })
                        .on("click", (e,d) => { 
                            d.onClick(e, d) 
                        });

                bottomRightBtnG.exit().remove();


                //deck topLeft btn
                const backBtnDatum = { 
                    key:"back", 
                    onClick:e => { 
                        e.stopPropagation();
                        onSelectDeck("");
                    },
                    fill:grey10(5),
                    icon:icons.back,
                }
                const topLeftBtnScale = d => topLeftBtnHeight/d.icon.height;

                let topLeftBtnData = deckIsSelected && !isNumber(selectedCardNr) ? [backBtnDatum] : [];
                const topLeftBtnHeight = 24;
                const topLeftBtnWidth = topLeftBtnHeight;
                //assumme all are square
                //note: 0.8 is a bodge coz iconsseems to be bigger than they state
                const topLeftBtnMargin = controlsOuterMarginLeft;
                const topLeftBtnContentsWidth = topLeftBtnWidth - 2 * topLeftBtnMargin;
                const topLeftBtnContentsHeight = topLeftBtnHeight - 2 * topLeftBtnMargin;
                const topLeftBtnG = contentsG.selectAll("g.top-left-btn").data(topLeftBtnData, d => d.key);
                topLeftBtnG.enter()
                    .append("g")
                        .attr("class", "top-left-btn")
                        .call(fadeIn, { transition:{ delay: TRANSITIONS.MED }})
                        .each(function(d){
                            const btnG = d3.select(this);
                            btnG.append("path");

                            btnG.append("rect").attr("class", "btn-hitbox")
                                .attr("fill", "transparent")
                        })
                        .merge(topLeftBtnG)
                        .attr("transform", `translate(${topLeftBtnMargin},${headerHeight + topLeftBtnMargin})`)
                        .each(function(d){
                            const btnG = d3.select(this);
                            btnG.select("path")
                                .attr("transform", `scale(${topLeftBtnScale(d)})`)
                                .attr("d", d.icon.d)
                                .attr("fill", d.fill)
                    
                            btnG.select("rect.btn-hitbox")
                                .attr("width", topLeftBtnContentsWidth)
                                .attr("height", topLeftBtnContentsHeight)

                        })
                        .on("click", (e,d) => { 
                            d.onClick(e, d) 
                        });

                topLeftBtnG.exit().call(remove);
            }

        })

        return selection;
    }
    
    //api
    deck.width = function (value) {
        if (!arguments.length) { return width; }
        width = value;
        return deck;
    };
    deck.height = function (value) {
        if (!arguments.length) { return height; }
        height = value;
        return deck;
    };
    deck.styles = function (value) {
        if (!arguments.length) { return _styles; }
        if(typeof value === "function"){
            _styles = (d,i) => ({ ...DEFAULT_STYLES, ...value(d,i) });
        }else{
            _styles = (d,i) => ({ ...DEFAULT_STYLES, ...value });
        }
        
        return deck;
    };
    deck.groupingTag = function (value) {
        if (!arguments.length) { return groupingTag; }
        groupingTag = value;
        return deck;
    };
    deck.timeframeKey = function (value) {
        if (!arguments.length) { return timeframeKey; }
        timeframeKey = value;
        return deck;
    };
    deck.deckIsSelected = function (value) {
        if (!arguments.length) { return deckIsSelected; }
        deckIsSelected = value; 
        return deck;
    };
    deck.selectedCardNr = function (value) {
        if (!arguments.length) { return selectedCardNr; }
        if(isNumber(value) && selectedCardNr !== value){
            selectCard(value);
            //pass it on
            cards.selectedCardNr(value);
        }
        if(value === "" && selectedCardNr !== ""){
            deselectCard();
            //pass it on
            cards.selectedCardNr("");
        }
        selectedCardNr = value;
        return deck;
    };
    deck.selectedItemNr = function (value) {
        if (!arguments.length) { return selectedItemNr; }
            selectedItemNr = value;
            cards.selectedItemNr(value);
        return deck;
    };
    deck.selectedSection = function (value) {
        if (!arguments.length) { return selectedSection; }
        selectedSection = value;
        //cards dont need selected section info, just key
        cards.selectedSectionKey(value?.key || "");
        return deck;
    };
    deck.content = function (value) {
        if (!arguments.length) { return content; }
        content = value;
        return deck;
    };
    deck.cardsAreFlipped = function (value) {
        if (!arguments.length) { return cardsAreFlipped; }
        cardsAreFlipped = value;
        return deck;
    };
    deck.format = function (value) {
        if (!arguments.length) { return format; }
        format = value;
        return deck;
    };
    deck.form = function (value) {
        if (!arguments.length) { return form; }
        form = value;
        return deck;
    };
    deck.transformTransition = function (value) {
        if (!arguments.length) { return transformTransition; }
        transformTransition = value; 
        return deck;
    };
    deck.longpressedDeckId = function (value) {
        if (!arguments.length) { return longpressedDeckId; }
        if(longpressedDeckId === id && value !== id){
            endLongpress();
        }else if(longpressedDeckId !== id && value === id){
            startLongpress();
        }
        longpressedDeckId = value;
        return deck;
    };
    deck.getCell = function (func) {
        if (!arguments.length) { return getCell; }
        getCell = func;
        return deck;
    };
    //functions
    deck.onFlipCards = function (value) {
        if (!arguments.length) { return onFlipCards; }
        onFlipCards = value;
        return deck;
    };
    deck.onSetContent = function (value) {
        if (!arguments.length) { return onSetContent; }
        onSetContent = value;
        return deck;
    };
    deck.onSelectDeck = function (value) {
        if (!arguments.length) { return onSelectDeck; }
        onSelectDeck = value;
        return deck;
    };
    deck.onMoveDeck = function (value) {
        if (!arguments.length) { return onMoveDeck; }
        onMoveDeck = value;
        return deck;
    };
    deck.onDeleteDeck = function (value) {
        if (!arguments.length) { return onDeleteDeck; }
        onDeleteDeck = value;
        return deck;
    };
    deck.onArchiveDeck = function (value) {
        if (!arguments.length) { return onArchiveDeck; }
        onArchiveDeck = value;
        return deck;
    };
    deck.onCopyDeck = function (value) {
        if (!arguments.length) { return onCopyDeck; }
        onCopyDeck = value;
        return deck;
    };
    deck.onSetLongpressed = function (value) {
        if (!arguments.length) { return onSetLongpressed; }
        onSetLongpressed = value;
        return deck;
    };
    deck.onSetSelectedCardNr = function (value) {
        if (!arguments.length) { return onSetSelectedCardNr; }
        onSetSelectedCardNr = value;
        return deck;
    };
    deck.onAddCard = function (value) {
        if (!arguments.length) { return onAddCard; }
        onAddCard = value;
        return deck;
    };
    deck.onDeleteCard = function (value) {
        if (!arguments.length) { return onDeleteCard; }
        onDeleteCard = value;
        return deck;
    };
    deck.onSelectItem = function (value) {
        if (!arguments.length) { return onSelectItem; }
        onSelectItem = value;
        return deck;
    };
    deck.onSelectSection = function (value) {
        if (!arguments.length) { return onSelectSection; }
        onSelectSection = value;
        return deck;
    };
    deck.updateItemStatus = function (value) {
        if (!arguments.length) { return updateItemStatus; }
        updateItemStatus = value;
        return deck;
    };
    deck.updateFrontCardNr = function (value) {
        if (!arguments.length) { return updateFrontCardNr; }
        updateFrontCardNr = value;
        return deck;
    };
    deck.setForm = function (value) {
        if (!arguments.length) { return setForm; }
        setForm = value;
        return deck;
    };
    deck.startLongpress = function () { startLongpress(); };
    deck.endLongpress = function () { endLongpress(); };
    deck.handleDrag = function (e) { handleDrag(e); };
    return deck;
}

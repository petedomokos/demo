import * as d3 from 'd3';
import { grey10, COLOURS, DIMNS, FONTSIZES, STYLES, INFO_HEIGHT_PROPORTION_OF_CARDS_AREA, TRANSITIONS } from "./constants";
import textComponent from './textComponent';
import { fadeIn, remove, getPosition, fadeInOut } from '../journey/domHelpers';

export default function purposeComponent() {
    //API SETTINGS
    // dimensions
    let width = 300;
    let height = 600
    let margin;
    let contentsWidth;
    let contentsHeight;

    function updateDimns(data){
        if(!margin){ margin = { top:height * 0.1, bottom: height * 0.1, left: width * 0.1, right: width * 0.1  } }
        contentsWidth = width - margin.left - margin.right;
        contentsHeight = height - margin.top - margin.bottom;
    }

       
    let DEFAULT_STYLES = {
        fill:"white",
        placeholderFill:"white",
        placeholderOpacity:0.5
        
    }
    let _styles = () => DEFAULT_STYLES;

   
    let onClick = function(){};

    let containerG;
    let contentsG;

    const contentsTextComponents = {};

    function purpose(selection, options={}) {
        const { transitionEnter=true, transitionUpdate=true } = options;

        // expression elements
        selection.each(function (data) {
            updateDimns(data);
            containerG = d3.select(this);

            if(containerG.select("g").empty()){
                init();
            }

            update(data);

            function init(){
                //bg
                containerG
                    .append("rect")
                        .attr("class", "purpose-bg")
                        .attr("fill", "transparent")
                        //.attr("stroke-width", 0.3)
                        //.attr("stroke", "black");;

                contentsG = containerG.append("g").attr("class", "purpose-contents");
                contentsG.append("rect")
                    .attr("class", "purpose-contents-bg")
                    .attr("fill", "none")
                    //.attr("stroke-width", 0.3)
                    //.attr("stroke", "blue");
            }

            function update(data, options={}){
                const { } = options;
                const {  } = data;
                const styles = _styles(data)

                //bgs
                containerG.select("rect.purpose-bg")
                    .attr("width", width)
                    .attr("height", height);

                contentsG.attr("transform", `translate(${margin.left},${margin.top})`)

                contentsG.select("rect.purpose-contents-bg")
                    .attr("width", contentsWidth)
                    .attr("height", contentsHeight)

                //paragraphs
                const paragraphWidth = contentsWidth;
                const paragraphHeight = contentsHeight * 0.4;
                const paragraphMargin = { left:0, right:0, top:paragraphHeight * 0.1, bottom:paragraphHeight * 0.1 }
                const paragraphContentsWidth = paragraphWidth - paragraphMargin.left - paragraphMargin.right;
                const paragraphContentsHeight = paragraphHeight - paragraphMargin.top - paragraphMargin.bottom;

                const getPlaceholder = (d,i) => {
                    if(i === 0){ return "I will achieve..." }
                    if(i === 1){ return "I will do this by..." }
                    return "";
                }

                const paraFontSize = d3.max([paragraphHeight/8, 3]);

                const paragraphG = contentsG.selectAll("g.paragraph").data(data);
                paragraphG.enter()
                    .append("g")
                        .attr("class", "paragraph")
                        .each(function(d,i){
                            const paragraphG = d3.select(this);

                            paragraphG.append("rect").attr("class", "bg")
                                .attr("fill", "transparent");

                            contentsTextComponents[i] = textComponent()
                                .text(d => d.text);

                        })
                        .attr("transform", (d,i) => `translate(0, ${i * paragraphHeight})`)
                        .merge(paragraphG)
                        .each(function(d,i){
                            d3.select(this)
                                .transition(`para-${i}`)
                                .duration(TRANSITIONS.MED)
                                    .attr("transform", `translate(0, ${i * paragraphHeight})`);

                            const paragraphG = d3.select(this);

                            paragraphG.select("rect.bg")
                                .attr("width", paragraphWidth)
                                .attr("height", paragraphHeight)

                            paragraphG.call(contentsTextComponents[i]
                                    .width(paragraphWidth)
                                    .height(paragraphHeight)
                                    .margin(paragraphMargin)
                                    .withAttachments(false)
                                    .placeholder(getPlaceholder(d,i))
                                    .styles((d,i) => ({
                                        verticalAlign:"top",
                                        opacity:1,
                                        fontFamily: "Avant Garde",
                                        fontStyle:"italic",
                                        stroke:styles.fill,
                                        strokeWidth:0.05,
                                        fill:styles.fill,
                                        fontMin:paraFontSize * 0.8,
                                        fontMax:paraFontSize * 1.2,
                                        fontSize:paraFontSize,
                                        placeholderFill:styles.placeholderFill,
                                        placeholderStroke:styles.placeholderFill,
                                        placeholderOpacity:styles.placeholderOpacity
                                    }))
                                )
                        })
                        .on("click", function(e,d){
                            e.stopPropagation();
                            const dimnsForForm = {
                                paragraphWidth, paragraphHeight, paragraphMargin, paragraphContentsWidth, paragraphContentsHeight,
                                purposeMargin:margin, paraFontSize
                            }
                            onClick.call(this, e, d, dimnsForForm)
                        })

                paragraphG.exit().call(remove);

            }

            return selection;
        })
    }
    
    //api
    purpose.width = function (value) {
        if (!arguments.length) { return width; }
        width = value;
        return purpose;
    };
    purpose.height = function (value) {
        if (!arguments.length) { return height; }
        height = value;
        return purpose;
    };
    purpose.margin = function (value) {
        if (!arguments.length) { return margin; }
        margin = value;
        return purpose;
    };
    purpose.styles = function (value) {
        if (!arguments.length) { return _styles; }
        if(typeof value === "function"){
            _styles = (d,i) => ({ ...DEFAULT_STYLES, ...value(d,i) });
        }else{
            _styles = (d,i) => ({ ...DEFAULT_STYLES, ...value });
        }
        
        return purpose;
    };
    
    purpose.onClick = function (value) {
        if (!arguments.length) { return onClick; }
        onClick = value;
        return purpose;
    };

    return purpose;
}

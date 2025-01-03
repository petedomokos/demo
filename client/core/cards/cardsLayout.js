import * as d3 from 'd3';
import { calcDateCount } from '../../util/TimeHelpers';
import { mockCardFlags } from './mockCardFlags';
import { purposeLayout } from './purposeLayout';
import kpisLayout from "../journey/kpis/kpisLayout";
import { NOW } from "./constants"

export default function cardsLayout(){
    let sections;
    let info = {};
    let format = "profiles";
    let frontCardNr = 0;

    let prevData = [];

    const _kpisLayout = kpisLayout();

    function update(cards){
        //console.log("cardsLayout....", cards);

        //error in deck of decks - sections is not defined here
        const getSection = (it,i) => {
            if(it.sectionKey){ return sections.find(s => s.key === it.sectionKey) }
            return sections[i]
        }

        const _data = cards.map((c,i) => {
            const { deckId, cardNr, title="", date, items, purpose, kpis } = c;
            const pos = cardNr - frontCardNr;

            const mockFlags = mockCardFlags[i] || [];

            return {
                ...c,
                pos,
                isFront:cardNr === frontCardNr,
                isNext:cardNr - 1 === frontCardNr,
                isSecondNext:cardNr - 2 === frontCardNr,
                isThirdNext:cardNr - 3 === frontCardNr,
                isHeld:cardNr >= frontCardNr,
                isPlaced:cardNr < frontCardNr,
                purposeData:purposeLayout(purpose), //is defined when its a longTerm
                flagsData:mockFlags.map((flag,i) => ({ ...flag, key:`deck-${deckId}-card-${cardNr}-flag-${i}` })),
                items:c.items.map((it,i) => ({ 
                    ...it, 
                    deckId,
                    cardNr, 
                    cardId:c.id,
                    //sectioning defaults to by itemNr
                    section:getSection(it, i),
                    title:it.title || "" ,
                    key:`deck-${deckId}-card-${cardNr}-item-${it.itemNr}`
                })),
                info:{ 
                    ...info,
                    date,
                    dateCount:calcDateCount(NOW, date),
                    title
                },
                kpis:_kpisLayout(kpis)
    
            }
        })
        .map(c => { 
            const nrPlacedCards = cards.filter(card => card.cardNr < frontCardNr).length;
            const nrVisiblePlacedCards = d3.min([nrPlacedCards, 5]);
            const slotPos = nrVisiblePlacedCards + c.pos;
            return {
                ...c,
                slotPos,
                isHidden:c.cardNr > frontCardNr + 4 || c.cardNr < frontCardNr - 5,
                hasBeenPickedUp:c.isHeld && prevData?.find(card => card.cardNr === c.cardNr)?.isPlaced,
            }
        });

        let newData;
        if(_data[0] && _data[0].cardNr !== _data.length){
            //hasnt been reversed yet
            newData = _data.reverse();
        }else{
            newData = _data;
        }
        prevData = newData;
        return newData;
    }

    update.format = function (value) {
        if (!arguments.length) { return format; }
        if(value){ format = value; }
        return update;
    };
    update.frontCardNr = function (value) {
        if (!arguments.length) { return frontCardNr; }
        frontCardNr = value;
        return update;
    };
    update.sections = function (value) {
        if (!arguments.length) { return sections; }
        sections = value;
        return update;
    };
    update.info = function (value) {
        if (!arguments.length) { return info; }
        info = value;
        return update;
    };

    return update;
}
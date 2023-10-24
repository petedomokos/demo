import * as d3 from 'd3';
import cardsLayout from "./cardsLayout";

const calcDeckStatus = cards => {
    if(cards.filter(c => c.info.status !== 2).length === 0){ return 2; }
    if(cards.filter(c => c.info.status !== 2).length <= 2) { return 1; }
    return 0;
}

const calcCompletion = cards => {
    const allItems = cards
        .map(c => c.items)
        .reduce((a,b) => [...a, ...b], [])
        .filter(it => it.title);

    if(allItems.length === 0) { return 0; }

    const completedItems = allItems.filter(it => it.status === 2);
    return completedItems.length / allItems.length;
}

export default function decksLayout(){
    let datasets = [];
    let info = {};
    let format = "profiles";

    const _cardsLayout = cardsLayout();

    function update(deckData){
        const { cards, id, listPos } = deckData;
        const processedCards = _cardsLayout(cards.map(c => ({ ...c, deckId:id, deckListPos:listPos })));
        return {
            ...deckData,
            cards:processedCards,
            status:calcDeckStatus(processedCards),
            completion:calcCompletion(processedCards)
        }
    }

    update.format = function (value) {
        if (!arguments.length) { return format; }
        if(value){ format = value; }
        return update;
    };
    update.datasets = function (value) {
        if (!arguments.length) { return datasets; }
        datasets = value;
        return update;
    };
    update.info = function (value) {
        if (!arguments.length) { return info; }
        info = value;
        return update;
    };

    return update;
}
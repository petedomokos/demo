import * as d3 from 'd3';
export function moveElementPosition(data, origPos, newPos){
	//console.log("orig new", origPos, newPos)
	if(origPos === newPos) { return data; }
	const elementToMove = data[origPos];
	if(origPos > newPos){
		//move it back
		const beforeNewPos = data.slice(0, newPos);
		const fromNewPosUpToButNotIncludingOrig = data.slice(newPos, origPos);
		const afterOrigPos = data.slice(origPos+1, data.length);
		return [...beforeNewPos, elementToMove, ...fromNewPosUpToButNotIncludingOrig, ...afterOrigPos];
	}
	//move it forward
	const beforeOrigPos = data.slice(0, origPos);
	const afterOrigUpToAndIncludingNew = data.slice(origPos+1, newPos+1);
	const afterNewPos = data.slice(newPos+1, data.length);
	return [...beforeOrigPos, ...afterOrigUpToAndIncludingNew, elementToMove, ...afterNewPos];
}

export function compareAlpha(obj1, obj2){
	const getName = obj => obj.name || obj.surname || obj.username || ""
    if(getName(obj1) > getName(obj2)){
      return 1;
    }
    if(getName(obj2) > getName(obj1)){
      return -1;
    }
    return 0;
}

export const findIn = (arr, item) =>{
	const id = typeof item === "string" ? item : item._id;
	return arr.find(it => it._id === id)
}
export const isIn = (arr, item) =>{
	const id = typeof item === "string" ? item : item._id;
	if(arr.find(it => it._id === id)){
		return true;
	}
	return false;
}
export const isNotIn = (arr, item) =>{
	if(arr.find(it => it._id === item._id)){
		return false;
	}
	return true;
}
//doesnt test for properties stored on the array, just elements
export const isSame = (arr1, arr2) => {
	if(!Array.isArray(arr1) || !Array.isArray(arr1)){
	  return false;
	}
	const inArr1NotArr2 = arr1.filter(item => !arr2.includes(item));
	const inArr2NotArr1 = arr2.filter(item => !arr1.includes(item));
	return inArr1NotArr2.length === 0 && inArr2NotArr1.length === 0;
}

  //doesnt test for properties stored on the array, just elements
export const isSameById = (arr1, arr2) => {
	if(!Array.isArray(arr1) || !Array.isArray(arr1)){
	  return false;
	}
	const inArr1NotArr2 = arr1.filter(item => !arr2.find(it => it._id === item._id));
	const inArr2NotArr1 = arr2.filter(item => !arr1.find(it => it._id === item._id));
	return inArr1NotArr2.length === 0 && inArr2NotArr1.length === 0;
}

/**
*
**/
//indexOf returns the first index where the value occurs.
//if this is before index, then it be false and value will drop out
export const onlyUnique = (value, index, self) => {
    return self.indexOf(value) === index;
}

export const onlyUniqueByProperty = (key, array) => element =>
	array.find(other => other[key] === element[key])

export const onlyUniqueByProperties = (keys, array) => element => true //todo
	//array.find(other => other[key] === element[key])

export const filterUniqueByProperty = (key, array) =>{
	const uniqueValues = array
		.map(elem => elem[key])
		.filter(onlyUnique);
		
	return uniqueValues
		.map(val => array.find(elem => elem[key] === val))
}

export const filterUniqueById = items => filterUniqueByProperty('_id', items)

export const elementsMatching = (elem1, elem2, keys) =>{
	let matching = true;
	keys.forEach(key => {
		if(elem1[key] !== elem2[key])
			matching = false
	})
	return matching;
}

export const filterUniqueByProperties= (keys, array) =>{
	return array.filter((elem,i) =>{
		const previousElems = array.slice(0,i)
		if(previousElems.find(el => elementsMatching(el, elem, keys)))
			return false;
		return true;
	})
}


export const findById = (id, items) =>{
	return items.find(item => item._id === id)
}

//helpers
export function sortAscending(data, accessor =  d => d){
  const dataCopy = data.map(d => d);
  return dataCopy.sort((a, b) => d3.ascending(accessor(a), accessor(b)))
};

export function sortDescending(data, accessor =  d => d){
	const dataCopy = data.map(d => d);
	return dataCopy.sort((a, b) => d3.descending(accessor(a), accessor(b)))
  };

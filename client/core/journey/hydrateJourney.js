import * as d3 from 'd3';
import { addMonths } from '../../util/TimeHelpers';
import { sortAscending } from '../../util/ArrayHelpers';
import { getKpis } from "../../data/kpis"
import { getTargets, findDefaultTarget } from "../../data/targets";
import { roundDown, roundUp, getRangeFormat, dateIsInRange, getValueForStat, getGreatestValueForStat } from "../../data/dataHelpers";
import { linearProjValue } from "./helpers";
import { pcCompletion } from "../../util/NumberHelpers"
//import { } from '../constants';
import { getBandsAndStandards } from "../../data/bandsAndStandards";

export function hydrateJourneyData(data, user, datasets){
    const now = new Date();
    //console.log("hydrateJourneyData", datasets)
    const nonCurrentProfiles = data.profiles.filter(p => p.id !== "current");
    const player = user.player;

    const kpis = getKpis(player._id).map(kpi => {
        const { bands, standards } = getBandsAndStandards(kpi.datasetKey, kpi.statKey) || {};
        const min = bands[0] ? bands[0].min : null;
        const max = bands[0] ? bands[bands.length - 1].max : null;
        return { ...kpi, bands, standards, min, max }
    });
    const defaultTargets = getTargets(player._id, player.groupId);
    const rangeFormat = getRangeFormat("day");

    //STEP 1: HYDRATE PROFILES
    const options = { now, rangeFormat };
    //console.log("hydrateJourney", data)
    const hydratedProfiles = hydrateProfiles(nonCurrentProfiles, datasets, kpis, defaultTargets, options);
    //console.log("hydratedProfiles", hydratedProfiles.find(p => p.id === "profile-1"))

    //STEP 2: CREATE CURRENT PROFILE, including expected values
    const currentProfile = createCurrentProfile(hydratedProfiles, datasets, kpis, options );

    //console.log("currentProfile", currentProfile)
    //SEP 3: EMBELLISH PROFILES BASED ON CURRENT PROFILE INFO
    const pastProfiles = hydratedProfiles.filter(p => p.isPast);
    const futureProfiles = hydratedProfiles.filter(p => p.isFuture)
        //.map(p => addExpected(p, currentProfile));

    return {
        //for now, asume all users are players
        player,
        //kpis not needed at journey level I dont think so have removed
        //kpis,
        //later do user.players.find if user is a coach, and also journey may be bout a coach or group
        ...data,
        contracts:hydrateContracts(data.contracts),
        profiles:[ ...pastProfiles, currentProfile, ...futureProfiles]
    }
}

function hydrateContracts(contracts=[]){
    return contracts.map(c => {
        return {
            ...c,
            dataType:"contract"
        }
    })
}

function hydrateProfiles(profiles=[], datasets, kpis, defaultTargets, options={}){
    //console.log("hydrateProfiles----------------", profiles);
    const orderedProfiles = sortAscending(profiles, d => d.date);
    const hydrateNextProfile = (remaining, hydratedSoFar) => {
        const next = remaining[0];
        //base case
        if(!next){ return hydratedSoFar; }
        //hydration
        const prevHydrated = hydratedSoFar.length !== 0 ? hydratedSoFar[hydratedSoFar.length - 1] : null;
        const nextHydrated = hydrateProfile(next, prevHydrated, datasets, kpis, defaultTargets, options);
        //recursive call
        return hydrateNextProfile(remaining.slice(1, remaining.length), [ ...hydratedSoFar, nextHydrated])
    }
    //init call
    return hydrateNextProfile(orderedProfiles, []);
}

//@todo - proper calculation for expected, inc for 1st profile using a start value
//@todo - custom expected when user drags
function calcExpected(kpi, prevProfile, profile, startDate, target, now){
    //@todo - allow a manual startdate/value so we dont actually need to have a prevProfile
    if(!prevProfile || !profile) { return null; }
    const { datasetKey, statKey } = kpi;
    const key = `${datasetKey}-${statKey}`;
    const { date } = profile;
    const startValue = prevProfile?.kpis.find(kpi => kpi.key === key).values.achieved.actual;
    let expectedActual = 0;
    if(profile.id === "profile-6" && key === "pressUps-reps"){
        console.log("calcExpected profile", profile)
        console.log("calcExpected prev...", prevProfile)
        console.log("startdate", startDate)
        console.log("startValue", startValue)
        console.log("target", target)
        expectedActual = linearProjValue(startDate.getTime(), startValue, date.getTime(), target.actual, now.getTime())
        console.log("expectedActual", expectedActual)

    }
    //temp values for demo
    if(profile.id === "profile-1"){
        if(key === "shuttles-time"){
            expectedActual = 13.2;
        }
    }
    return { actual:expectedActual, completion:"" }
    /*
    
    const { datasetKey, statKey } = kpi;
    const customExpectedValuesForKpi = activeProfile.customExpected
                .filter(exp => exp.datasetKey === datasetKey && exp.statKey === statKey);
    //@todo - base any new expected on teh latest customExpected, increasing it from there to the target
    //in teh given time remaining
    return { actual:"", completion:"" }
    */
}

function calcCurrent(stat, datapoints, dateRange, log){
    //if dataset unavailable, stat will be undefined
    if(!stat){ return { actual:undefined, completion:"" } }
    //helper
    const getValue = getValueForStat(stat.key);
    const values = datapoints
        //if no date range, we want to include all as it will be the current card
        .filter(d => !dateRange || dateIsInRange(d.date, dateRange))
        .filter(d => !d.isTarget)
        .map(d => getValue(d))
    
    if(log){
        //console.log("calcCurr dateRange", dateRange)
        //console.log("calcCurr values", values)
    }

    return {
        //@todo - use min if order is 'lowest is best', use stat to determine order
        actual:d3.max(values),
        completion:""
    }

}

function createTargetFromDefault(datasetKey, statKey, date, defaultTargets){
    const defaultTarget = findDefaultTarget(defaultTargets, datasetKey, statKey, date);
    return {
        actual:defaultTarget?.value || "",
        completion:defaultTarget?.completion || "",
    }
}

function twentyYearsAgo(now){ return addMonths(-240, now); }
function oneMonthAgo(now){ return addMonths(-1, now); }
function calcDateRange(start, end, format){
    return [
        roundUp(start, "day", format), 
        roundUp(end, "day", format)
    ];
}


function hydrateProfile(profile, prevProfile, datasets, kpis, defaultTargets, options={}){
    console.log("hydrateProfile------------", profile.id, profile.date)
    const { now, rangeFormat } = options;
    const { id, date, customTargets=[], isCurrent } = profile;
    const milestoneId = id;
    //startDate
    //either manual startDate if set, or prev date, or otherwise 20 years ago
    const startDate = profile.startDate || prevProfile?.date || oneMonthAgo(date);
    const startsFromPrevProfile = !profile.startDate && !!prevProfile;
    const datePhase = date < now ? "past" : "future";
    const isPast = datePhase === "past";
    const isFuture = datePhase === "future";
    const isActive = isFuture && !prevProfile?.isFuture;
    const dateRange = calcDateRange(startDate, date);

    //RANGE
    //round both dates in range up, so any datapoint on teh day of a profile
    //will be counted in THAT profile, and NOT the next one.
    //note - we round date up,which goes to 00:00 of the next day, but because we check 
    //dateIsInRange with exclusiveEnd, a datapoint for next day 00:00 will not be counted
    
    

    return {
        ...profile,
        id:milestoneId,
        dataType:"profile",
        startDate,
        startsFromPrevProfile,
        dateRange,
        datePhase,
        isPast,
        isFuture,
        isActive,
        kpis:kpis.map((kpi,i) => {
            //console.log("kpi", kpi)
            //KEYS/ID
            const { datasetKey, statKey, min, max, values } = kpi;
            const key = `${datasetKey}-${statKey}`;
            //console.log("kpi key", key)
            
            //VALUES
            //helper
            //issue - surely we should also filter for datasetKey
            //need to take ll this into the calcCurrent func
            const dataset = datasets.find(dset => dset.key === datasetKey);
            const datapoints = dataset?.datapoints || [];
            const stat = dataset?.stats.find(s => s.key === statKey);
           
            //startvalues are only set if prevProfile isPast ie it has an achieved score
            //note - current profile is hydrated on its own so has no prevProfile
            //@todo - if user has given a fixed startTime for a profile, then get value at that point
            const prevAchieved = prevProfile?.kpis.find(kpi => kpi.key === key)?.achieved;
            const start = {
                actual:prevAchieved?.actual || min,
                completion:0 //this always starts at 0 
            }
            const end = {
                actual:max,
                completion:100
            }

            //note - for current profile, the range is last twenty years so all will be included anyway
            //this is also true for 1st profile, unless user specifies a startDate
            const current = calcCurrent(stat, datapoints, dateRange, id === "profile-3" && datasetKey === "pressUps");
            const achieved = isPast ? current : null;
            const customTargetsForStat = customTargets
                .filter(t => t.datasetKey === datasetKey && t.statKey === statKey)
                .filter(t => typeof Number(t.actual) === "number" && !Number.isNaN(Number(t.actual)));

            const customTarget = d3.greatest(customTargetsForStat, d => d.created);
            const k = customTarget ? Number(customTarget.actual) : null;
            const parsedCustomTarget = customTarget ? { actual: Number(customTarget.actual), completion:Number(customTarget.completion) } : null;
            
            //2 possible causes of new targ not getting picked up
            //date of new targ that hasnt gone thru server os a Date not a string
            //actual and pc are numbers not strings
            const target = parsedCustomTarget || createTargetFromDefault(datasetKey, statKey, date, defaultTargets);
            //note prevProfile has already been processed with a full key and values
            if(id === "profile-6" && key === "pressUps-reps"){
                console.log("key", key)
                console.log("prev", prevProfile)
            }

            //for now, we only do expected for the active profile, which ensures achived is defined on previous
            let expected = isActive && target ? calcExpected(kpi, prevProfile, profile, startDate, target, now) : null;

            if(i === 0 && id === "profile-7"){
                /*
                console.log("kpi",key,  kpi)
                console.log("datapoint dates", dataset?.datapoints.filter(d => !d.isTarget).map(d => d.date))
                console.log("dataset", dataset)
                console.log("customTargets", customTargetsForStat.map(t => t.created))
                console.log("customTarget", k, customTarget)
                console.log("defaultTargets", defaultTargets)
                console.log("current", current)*/
                console.log("expected", expected)
            }

            return {
                ...kpi, key, milestoneId,
                //dates
                date, startDate, startsFromPrevProfile, dateRange, datePhase,
                isPast, isCurrent, isFuture, isActive,
                //values
                values:{
                    //min/max are just values
                    min, max, start, end, current, expected, achieved, target, //proposedTarget,
                },
                //other info
                datasetName:dataset?.name || "",
                statName:stat?.name || "",
                unit:stat?.unit || ""
                
            }
        })
    }
}


//current profile is dynamically created, so it doesnt need hydrating
//note - this is nely created each time, so nothing must be stored on it
function createCurrentProfile(orderedProfiles, datasets, kpis, options={}){
    //console.log("createcurrentprofile")
    const { now, rangeFormat } = options;
    const activeProfile = d3.least(orderedProfiles.filter(p => p.isFuture), p => p.date);
    const activeProfileValues = kpi => activeProfile?.kpis
        ?.find(k => k.datasetKey === kpi.datasetKey && k.statKey === kpi.statKey)
        ?.values;

    const prevProfile = d3.greatest(orderedProfiles.filter(p => p.isPast), p => p.date);

    //10 was scored in 20th apr 2021 so not within 3 months and not since last card
    //it seems startdate is more than 3 months ago
    //note - current always only takes values from last 3 months
    //@todo - provide this as a setting that can be adjusted 
    const startDate = addMonths(-3, now);
    const startsFromPrevProfile = !!prevProfile;
    const datePhase = "current";
    const dateRange = calcDateRange(startDate, now);
    return {
        startDate, date:now, startsFromPrevProfile, dateRange, datePhase,
        id:"current", isCurrent:true, dataType:"profile",
        kpis:kpis.map((kpi,i) => {
            //console.log("kpi", kpi)
            const { datasetKey, statKey, min, max, values } = kpi;
            const key = `${datasetKey}-${statKey}`;
            const milestoneId = "current";
            
            const dataset = datasets.find(dset => dset.key === datasetKey);
            const datapoints = dataset?.datapoints || [];
            const stat = dataset?.stats.find(s => s.key === statKey);
            //START & END
            //@todo - if user has given a fixed startTime for a profile, then get value at that point
            const prevAchieved = prevProfile?.kpis.find(kpi => kpi.key === key)?.achieved;
            const start = {
                actual:prevAchieved?.actual || min,
                completion:0 //this always starts at 0 
            }
            const end = {
                actual:max,
                completion:100
            }

            return {
                ...kpi,
                key,
                milestoneId,
                //dates
                date:now, startDate, startsFromPrevProfile, dateRange, datePhase, isCurrent:true,
                values:{
                    //min/max just values
                    min, max, start, end,
                    expected:activeProfileValues(kpi)?.expected,
                    target:activeProfileValues(kpi)?.target,
                    current:calcCurrent(stat, datapoints, dateRange, false)
                },
                //other info
                datasetName:dataset?.name || "",
                statName:stat?.name || "",
                unit:stat?.unit || ""
            }
        })
    }

}
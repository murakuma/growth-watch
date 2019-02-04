
import {
    performance,
    PerformanceObserver,
} from "perf_hooks";

type EmptyFn = () => void;
type WithDoneFn = ( done: () => void ) => void;
type PerfFunction = EmptyFn | WithDoneFn;

interface PerfGroup {
    name: string;
    fn: () => void;
    entries: PerfEntry[];
}

interface PerfEntry {
    name: string;
    fn: PerfFunction;
}

const START = "_START";
const END = "_END";

const perfGroups: PerfGroup[] = [];
let currentPerfGroups: PerfGroup;

function hasNoArgs( fn: PerfFunction ): fn is EmptyFn {
    return fn.length === 0;
}

function _describe( name: string, fn: () => void ) {
    perfGroups.push( { name, fn, entries: [] } );
}

function _it( name: string, fn: PerfFunction ) {
    currentPerfGroups.entries.push( { name, fn } );
}

const _global = global as any;
_global.describe = _describe;
_global.it = _it;

function runPerfAsync( fn: PerfFunction ): Promise<void> {
    if ( hasNoArgs( fn ) ) {
        fn();
        return Promise.resolve();
    } else {
        return new Promise( resolve => {
            fn( resolve );
        } );
    }
}

async function runGroup( group: PerfGroup ) {
    currentPerfGroups = group;
    group.fn();

    for ( const entry of group.entries ) {
        const fullname = group.name + "/" + entry.name;

        // Run perf
        performance.mark( fullname + START );
        await runPerfAsync( entry.fn );
        performance.mark( fullname + END );
        performance.measure( fullname, fullname + START, fullname + END );
    }
}

export async function run() {
    // Prepare an observer
    const obs = new PerformanceObserver( items => {
        items.getEntries().forEach( entry => {
            console.log( `[PERF] ${entry.name}: ${entry.duration} ms` );
        } );

        performance.clearMarks();
    } );

    obs.observe({ entryTypes: ["measure"] });

    // Run perf tests
    console.log( `${perfGroups.length} groups found.` );

    for ( const group of perfGroups ) {
        await runGroup( group );
    }

    // Dispose the observer
    obs.disconnect();
}

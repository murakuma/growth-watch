
import { Emitter } from "event-kit";
import MappedDisposable from "mapped-disposable";

import { DirectoryWatcher } from "./DirectoryWatcher";
import { ThrottledBuffer } from "./ThrottledBuffer";

import {
    BufferedEvent,
    bufferedEventNames,
    directoryWatcherEventNames,
    TreeWatcherEventsWithBuffer,
} from "./events";
import {
    findChildren,
    toNative,
    toPosix,
} from "./utils";

const ROOT = ".";

export interface TreeWatcherOptions {
    /**
     * Represents the duration it takes to flush the buffered events, in
     * milliseconds.
     *
     * When zero or a negative number is specified, it will never emit any
     * buffered events.
     *
     * @default 50
     */
    throttleDelay?: number;
}

export class TreeWatcher extends Emitter<{}, TreeWatcherEventsWithBuffer> {

    private directories: Set<string> = new Set();
    private watchers: Map<string, DirectoryWatcher> = new Map();
    private readonly disposables = new MappedDisposable();

    private readonly throttledBuffer?: ThrottledBuffer<BufferedEvent>;

    constructor(
        readonly rootDir: string,
        options: TreeWatcherOptions = {}
    ) {
        super();

        // Create throttled buffer
        const delay = options.throttleDelay === undefined ? 50 : options.throttleDelay;
        if ( delay > 0 ) {
            this.throttledBuffer = new ThrottledBuffer( delay );
            const delegate = this.throttledBuffer.push.bind( this.throttledBuffer );

            // Register event listeners
            bufferedEventNames.forEach( eventName => {
                this.on( eventName, delegate );
            } );

            // Emit buffered events
            this.throttledBuffer.on( "data", events => {
                this.emit( "buffer", events );
            } );
        }

        this.expand( ROOT );
    }

    dispose() {
        // Dispose directory watchers
        this.disposables.dispose();
        this.watchers.clear();
        this.directories.clear();

        return super.dispose();
    }

    /**
     * Wait the watcher of the root directory for ready.
     *
     * This method comes handy when you want to get notified when initial scan
     * is completed.
     */
    waitRootForReady() {
        return this.watchers.get( ROOT )!.waitForReady();
    }

    /**
     * Expands the directory.
     * @param path 
     */
    expand( path: string ): Promise<void> {
        if ( !this.isExpandable( path ) ) {
            throw new Error( `The directory '${path}' is not expandable.` );
        }

        const pPath = toPosix( path );
        const nPath = toNative( path );

        // Create new watcher
        const watcher = new DirectoryWatcher( this.rootDir, nPath );
        this.watchers.set( pPath, watcher );
        this.disposables.set( pPath, watcher );

        // Register listeners
        watcher.on( "add", e => {
            if ( e.isDirectory ) {
                this.directories.add( toPosix( e.path ) );
            }
        } );
        watcher.on( "remove", e => {
            if ( e.isDirectory ) {
                this.directories.delete( toPosix( e.path ) );
            }
        } );
        watcher.on( "error", e => {
            // Force collapse the directory on error
            this.collapse( pPath );
        } );

        // Bubble up the event
        directoryWatcherEventNames.forEach( eventName => {
            watcher.on( eventName, e => {
                this.emit( eventName, e );
            } );
        } );

        this.emit( "expand", {
            type: "expand",
            path: nPath,
            isExpanded: true,
        } );

        return watcher.waitForReady();
    }

    /**
     * Collapse the directory.
     * @param path 
     */
    collapse( path: string ) {
        if ( !this.isCollapsable( path ) ) {
            throw new Error( `The directory '${path}' is not collapsable.` );
        }

        const pPath = toPosix( path );
        const nPath = toNative( path );

        // Recursively collapse children
        const children = this.getCollapsablesAt( nPath );
        children.forEach( child => {
            this.collapse( child );
        } );

        // Dispose the watcher
        this.watchers.delete( pPath );
        this.disposables.dispose( pPath );

        this.emit( "collapse", {
            type: "collapse",
            path: nPath,
            isExpanded: false,
        } );
    }

    toggleExpansion( path: string ) {
        if ( this.isCollapsable( path ) ) {
            this.collapse( path );
        } else if ( this.isExpandable( path ) ) {
            this.expand( path );
        }
    }

    /**
     * Expands all directories.
     */
    async expandAll() {
        while ( true ) {
            const expandables = this.getExpandables();
            if ( expandables.length === 0 ) {
                return;
            }

            const dir = expandables[0];
            await this.expand( dir );
        }
    }

    /**
     * Checks if the directory can be expanded.
     *
     * If the directory is already being watched, it returns false.
     * @param path 
     */
    isExpandable( path: string ) {
        const pPath = toPosix( path );

        const isExists = this.directories.has( pPath ) || pPath === ROOT;
        const alreadyExpanded = this.watchers.has( pPath );

        return isExists && !alreadyExpanded;
    }

    /**
     * Checks is the directory can be collapsed.
     * @param path 
     */
    isCollapsable( path: string ) {
        const pPath = toPosix( path );

        return this.watchers.has( pPath );
    }

    /**
     * Retrieves all expandable directories.
     * 
     * The array of the return value is alphabetically sorted.
     */
    getExpandables() {
        return [...this.directories.keys()]
            .filter( path => this.isExpandable( path ) )
            .map( toNative )
            .sort();
    }

    /**
     * Retrieves all collapsable directories.
     * 
     * The array of the return value is alphabetically sorted.
     */
    getCollapsables() {
        return [...this.watchers.keys()]
            .map( toNative )
            .sort();
    }

    /**
     * Returns collapsables that is children of the path.
     * @param path 
     */
    getCollapsablesAt( path: string ) {
        const nPath = toNative( path );
        return findChildren( nPath, this.getCollapsables() );
    }

}


import { Emitter } from "event-kit";
import MappedDisposable from "mapped-disposable";

import { DirectoryWatcher } from "./DirectoryWatcher";
import {
    DirectoryWatcherEvents,
    TreeWatcherEvents,
} from "./events";
import {
    findChildren,
    toNative,
    toPosix,
} from "./utils";

export interface TreeWactherOptions {

}

const ROOT = ".";

export class TreeWatcher extends Emitter<{}, TreeWatcherEvents> {

    private directories: Set<string> = new Set();
    private watchers: Map<string, DirectoryWatcher> = new Map();
    private readonly disposables = new MappedDisposable();

    constructor(
        readonly rootDir: string
    ) {
        super();

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
        const eventNames: (keyof DirectoryWatcherEvents)[] = [
            "add", "remove", "change",
            "ready", "close",
            "error", "childError",
        ];
        eventNames.forEach( eventName => {
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

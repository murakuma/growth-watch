
import fs from "fs";
import nodePath from "path";

import {
    CompositeDisposable,
    Disposable,
    Emitter,
} from "event-kit";

import { DirectoryWatcherEvents } from "./events";

/**
 * A wrapper of FSWatcher for observing the given directory.
 *
 * A DirectoryWatcher stores a list of items detected by the watcher.
 */
export class DirectoryWatcher extends Emitter<{}, DirectoryWatcherEvents> {

    readonly absPath: string;
    readonly items: Map<string, fs.Stats> = new Map();
    private readonly disposables = new CompositeDisposable();
    private _isReady: boolean = false;

    constructor(
        readonly rootDir: string,
        readonly path: string
    ) {
        super();

        this.absPath = nodePath.resolve( rootDir, path );

        // Create watcher
        const watcher = fs.watch( this.absPath, this._handleChange );
        watcher.on( "error", this._handleError );

        this.disposables.add( new Disposable( () => {
            watcher.close();
        } ) );

        // Read the list of items in the directory
        this._initialScan();
    }

    dispose() {
        if ( !this.disposed ) {
            this._endInitialScan();
            this._clearItems();

            this.emit( "close", { type: "close", path: this.path } );
        }
        this.disposables.dispose();
        return super.dispose();
    }

    get isReady() {
        return this._isReady;
    }

    /**
     * Returns the relative path from `rootDir` to the given path, and the
     * absolute path.
     * @param item 
     */
    private _getPathTo( item: string ): [string, string] {
        let relPath: string;
        if ( this.path === "." ) {
            relPath = item;
        } else {
            relPath = nodePath.join( this.path, item );
        }

        const absPath = nodePath.resolve( this.absPath, item );

        return [relPath, absPath];
    }

    private _loadStats( item: string, onFulfilled: ( stats: fs.Stats ) => void, onFinally?: () => void ) {
        const [relPath, absPath] = this._getPathTo( item );

        fs.stat( absPath, ( err, stats ) => {
            if ( err ) {
                this.emit( "childError", err );

            } else {
                // Update the item map
                this.items.set( item, stats );

                onFulfilled( stats );
            }

            if ( onFinally ) {
                onFinally();
            }
        } );
    }

    private _initialScan() {
        fs.readdir( this.absPath, ( err, items ) => {
            if ( err ) {
                this.emit( "error", err );
                return;
            }

            let itemsRemaining = items.length;
            items.forEach( item => {
                const [relPath] = this._getPathTo( item );

                this._loadStats( item, stats => {
                    if ( this.isReady ) {
                        // Initial scan is interrupted
                        return;
                    }

                    this.emit( "add", {
                        type: "add",
                        path: relPath,
                        stats,
                        isDirectory: stats.isDirectory(),
                        isInitial: true,
                    } );
                }, () => {
                    itemsRemaining--;
                    if ( itemsRemaining === 0 ) {
                        this._endInitialScan();
                    }
                } );
            } );
        } );
    }

    private _endInitialScan() {
        if ( this._isReady ) {
            return;
        }

        this._isReady = true;
        this.emit( "ready", { type: "ready", path: this.path } );
    }

    private _handleChange = ( eventName: string, item: string ) => {
        const [relPath, absPath] = this._getPathTo( item );

        if ( eventName === "rename" ) {

            const oldStats = this.items.get( item );
            if ( oldStats ) {
                // An item has been removed
                this.items.delete( item );
                this.emit( "remove", {
                    type: "remove",
                    path: relPath,
                    isDirectory: oldStats.isDirectory(),
                } );

            } else {
                // A new item has been added
                this._loadStats( item, stats => {
                    this.emit( "add", {
                        type: "add",
                        path: relPath,
                        stats,
                        isDirectory: stats.isDirectory(),
                        isInitial: false,
                    } );
                } );
            }

        } else {  // eventName === "change"
            // A file has been updated
            this._loadStats( item, stats => {
                this.emit( "change", {
                    type: "change",
                    path: relPath,
                    isDirectory: false,
                    stats,
                } );
            } );
        }
    }

    private _handleError = ( err: Error ) => {
        this._clearItems();
        this.emit( "error", err );
    }

    private _clearItems() {
        this.items.forEach( ( stats, item ) => {
            const [relPath] = this._getPathTo( item );

            this.emit( "remove", {
                type: "remove",
                path: relPath,
                isDirectory: stats.isDirectory(),
            } );
        } );

        this.items.clear();
    }

}

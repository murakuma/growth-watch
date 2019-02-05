
import { Stats } from "fs";
import nodePath from "path";

import chokidar, {
    FSWatcher,
    WatchOptions,
} from "chokidar";
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

    private readonly watcher: FSWatcher;
    private readonly disposables = new CompositeDisposable();

    constructor(
        rootDir: string,
        private readonly path: string,
        glob: string,
        watchOptions: WatchOptions
    ) {
        super();

        // Create watcher
        const cwd = nodePath.resolve( rootDir, path );

        this.watcher = chokidar
            .watch( glob, { ...watchOptions, cwd } )
            .on( "all", this._handleAll )
            .on( "ready", this._handleReady )
            .on( "error", this._handleError );

        this.disposables.add( new Disposable( () => {
            this.watcher.close();
        } ) );
    }

    dispose() {
        // Dispose watcher
        this.disposables.dispose();

        return super.dispose();
    }

    /**
     * Returns the relative path from `rootDir` to the given path.
     * @param childPath 
     */
    private _toRelative( childPath: string ) {
        if ( this.path === "." ) {
            return childPath;
        }
        return nodePath.join( this.path, childPath );
    }

    private _handleAll = ( eventName: string, childPath: string, _stats?: Stats ) => {
        const path = this._toRelative( childPath );
        const isDirectory = eventName.endsWith( "Dir" );
        const stats = _stats!;

        switch ( eventName ) {
            case "add":
            case "addDir":
                this.emit( "add", { type: "add", path, isDirectory, stats } );
                break;

            case "unlink":
            case "unlinkDir":
                this.emit( "remove", { type: "remove", path, isDirectory } );
                break;

            case "change":
                this.emit( "change", { type: "change", path, isDirectory, stats } );
                break;
        }
    }

    private _handleReady = () => {
        const { path } = this;
        this.emit( "ready", { type: "ready", path } );
    }

    private _handleError = ( err: Error ) => {
        this.emit( "error", err );
    }

}

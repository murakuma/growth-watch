
import fs from "fs";
import nodePath from "path";

import chokidar from "chokidar";

const FIXTURE_DIR = nodePath.resolve( __dirname, "../node_modules" );

describe( "scanDirectory", () => {

    it( "shallow scan", () => {
        const items = fs.readdirSync( FIXTURE_DIR );
        console.log( `shallow scan: ${items.length} items found.` );
    } );

    it( "deep scan", () => {
        const allItems: string[] = [];
        const scanDir = ( root: string, path: string = "." ) => {
            const absPath = nodePath.resolve( root, path );
            const items = fs.readdirSync( absPath );
            items.forEach( item => {
                const relPath = path === "." ? item : ( path + "/" + item );
                allItems.push( relPath );
                if ( fs.statSync( nodePath.resolve( root, relPath ) ).isDirectory() ) {
                    scanDir( root, relPath );
                }
            } );
        };

        scanDir( FIXTURE_DIR );

        console.log( `deep scane: ${allItems.length} items found.` );
    } );

    it( "shallow watch", done => {

        const items: string[] = [];

        const watcher = chokidar.watch( "**/?(.)*", {
            cwd: FIXTURE_DIR,
            persistent: false,
            depth: 0,
        } );

        watcher.on( "all", ( event, path ) => {
            switch ( event ) {
                case "add":
                case "addDir":
                    items.push( path );
                    break;
            }
        } );

        watcher.on( "ready", () => {
            watcher.close();

            console.log( `shallow watch ${items.length} items found.` );

            done();
        } );

    } );

    it( "deep watch", done => {

        const items: string[] = [];

        const watcher = chokidar.watch( "**/?(.)*", {
            cwd: FIXTURE_DIR,
            persistent: false,
        } );

        watcher.on( "all", ( event, path ) => {
            switch ( event ) {
                case "add":
                case "addDir":
                    items.push( path );
                    break;
            }
        } );

        watcher.on( "ready", () => {
            watcher.close();

            console.log( `deep watch ${items.length} items found.` );

            done();
        } );

    } );

} );

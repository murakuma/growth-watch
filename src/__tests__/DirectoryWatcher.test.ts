
import { resolve } from "path";

import { CompositeDisposable } from "event-kit";
import fs from "fs-extra";
import _ from "lodash";

import {
    FIXTURES,
    prepareFixtureDirs,
} from "./fixtures";
import {
    normalizePaths,
    unixify,
} from "./utils";

import { DirectoryWatcher } from "../DirectoryWatcher";

describe( "DirectoryWatcher", () => {

    beforeAll( () => {
        prepareFixtureDirs();
    } );

    let disposables: CompositeDisposable;
    beforeEach( () => {
        disposables = new CompositeDisposable();
    } );
    afterEach( () => {
        disposables.dispose();
    } );

    const createWatcher = (
        rootDir: string, path: string
    ): [DirectoryWatcher, () => string[]] => {

        const watcher = new DirectoryWatcher( rootDir, path );
        disposables.add( watcher );

        const paths: string[] = [];
        const getPaths = () => normalizePaths( paths );

        watcher.on( "add", event => paths.push( event.path ) );
        watcher.on( "remove", event => _.pull( paths, event.path ) );

        return [watcher, getPaths];
    };

    const ensureItems = ( rootDir: string, itemMap: { [key: string]: boolean } ) => {
        _.forOwn( itemMap, ( isDir, path ) => {
            const absPath = resolve( rootDir, path );
            if ( isDir ) {
                fs.ensureDirSync( absPath );
            } else {
                fs.ensureFileSync( absPath );
            }
        } );
    };

    it( "should emit add events on initialization", done => {
        const rootDir = resolve( FIXTURES.ROOT, "initial" );

        ensureItems( rootDir, {
            "foo/bar": true,
            "foo/baz": false,
        } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );

        watcher.on( "ready", e => {
            expect( e.path ).toBe( "foo" );
            expect( getPaths() ).toEqual( ["foo/bar", "foo/baz"] );

            const { items } = watcher;
            expect( items.get( "bar" )!.isDirectory() ).toBeTruthy();
            expect( items.get( "baz" )!.isDirectory() ).toBeFalsy();
            expect( [...items.keys()].sort() ).toEqual( ["bar", "baz"] );

            done();
        } );
    } );

    it( "should emit add events", done => {
        const rootDir = resolve( FIXTURES.ROOT, "addition" );

        ensureItems( rootDir, { "foo/bar": true } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );

        watcher.on( "ready", () => {
            ensureItems( rootDir, { "foo/baz": false } );
        } );

        watcher.on( "add", e => {
            const uPath = unixify( e.path );

            if ( uPath === "foo/baz" ) {
                expect( e.isDirectory ).toBeFalsy();

                ensureItems( rootDir, { "foo/qux": true } );

            } else if ( uPath === "foo/qux" ) {
                expect( e.isDirectory ).toBeTruthy();

                done();
            }
        } );
    } );

    it( "should emit change events", done => {
        const rootDir = resolve( FIXTURES.ROOT, "update" );

        ensureItems( rootDir, { "foo/bar": false } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );

        watcher.on( "ready", () => {
            fs.writeFileSync( resolve( rootDir, "foo/bar" ), "updated" );
        } );

        watcher.on( "change", e => {
            const uPath = unixify( e.path );

            expect( uPath ).toBe( "foo/bar" );
            done();
        } );
    } );

    it( "should emit remove and add event on renaming", done => {
        const rootDir = resolve( FIXTURES.ROOT, "renaming" );

        ensureItems( rootDir, {
            "foo/bar": true,
            "foo/qux": false,
        } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );
        const handleRemove = jest.fn();

        watcher.on( "ready", () => {
            fs.renameSync(
                resolve( rootDir, "foo/bar" ),
                resolve( rootDir, "foo/baz" )
            );
        } );

        watcher.on( "add", e => {
            const uPath = unixify( e.path );

            if ( uPath === "foo/baz" ) {
                fs.renameSync(
                    resolve( rootDir, "foo/qux" ),
                    resolve( rootDir, "foo/quux" )
                );

            } else if ( uPath === "foo/quux" ) {
                expect( getPaths() ).toEqual( ["foo/baz", "foo/quux"] );
                expect( [...watcher.items.keys()].sort() ).toEqual( ["baz", "quux"] );

                expect( handleRemove ).toHaveBeenCalledTimes( 2 );

                done();
            }
        } );

        watcher.on( "remove", handleRemove );
    } );

    it( "should emit an error event on deletion of the watched directory", done => {
        const rootDir = resolve( FIXTURES.ROOT, "deletion" );

        ensureItems( rootDir, {
            "foo/bar": true,
            "foo/baz": false,
        } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );
        const handleRemove = jest.fn();

        watcher.on( "ready", () => {
            fs.removeSync( rootDir );
        } );

        watcher.on( "error", () => {
            expect( getPaths() ).toHaveLength( 0 );
            expect( handleRemove ).toHaveBeenCalledTimes( 2 );

            done();
        } );

        watcher.on( "remove", handleRemove );
    } );

} );

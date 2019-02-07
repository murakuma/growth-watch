
import { resolve } from "path";

import { CompositeDisposable } from "event-kit";
import fs from "fs-extra";
import _ from "lodash";

import { DirectoryWatcher } from "../DirectoryWatcher";

import { toPosix } from "../utils";
import {
    ensureItems,
    normalizePaths,
    prepareFixtureDir,
    safeRemove,
} from "./utils";

describe( "DirectoryWatcher", () => {

    let fixtureDir: string;
    beforeAll( () => {
        fixtureDir = prepareFixtureDir( "DirectoryWatcher" );
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

    it( "should emit ready event even if it is an empty directory", done => {
        const rootDir = resolve( fixtureDir, "empty" );

        ensureItems( rootDir, { foo: true } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );

        expect( watcher.isReady ).toBeFalsy();

        watcher.on( "ready", e => {
            expect( watcher.isReady ).toBeTruthy();
            expect( e.path ).toBe( "foo" );

            expect( getPaths() ).toHaveLength( 0 );

            done();
        } );
    } );

    it( "should emit add events on initialization", done => {
        const rootDir = resolve( fixtureDir, "initial" );

        ensureItems( rootDir, {
            "foo/bar": true,
            "foo/baz": false,
        } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );

        expect( watcher.isReady ).toBeFalsy();

        watcher.on( "ready", e => {
            expect( watcher.isReady ).toBeTruthy();
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
        const rootDir = resolve( fixtureDir, "addition" );

        ensureItems( rootDir, { "foo/bar": true } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );

        watcher.on( "ready", () => {
            ensureItems( rootDir, { "foo/baz": false } );
        } );

        watcher.on( "add", e => {
            const pPath = toPosix( e.path );

            if ( pPath === "foo/bar" ) {
                expect( e.isInitial ).toBeTruthy();

            } else if ( pPath === "foo/baz" ) {
                expect( e.isDirectory ).toBeFalsy();
                expect( e.isInitial ).toBeFalsy();

                ensureItems( rootDir, { "foo/qux": true } );

            } else if ( pPath === "foo/qux" ) {
                expect( e.isDirectory ).toBeTruthy();
                expect( e.isInitial ).toBeFalsy();

                done();
            }
        } );
    } );

    it( "should emit change events", done => {
        const rootDir = resolve( fixtureDir, "update" );

        ensureItems( rootDir, { "foo/bar": false } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );

        watcher.on( "ready", () => {
            fs.writeFileSync( resolve( rootDir, "foo/bar" ), "updated" );
        } );

        watcher.on( "change", e => {
            const pPath = toPosix( e.path );

            expect( pPath ).toBe( "foo/bar" );
            done();
        } );
    } );

    it( "should emit remove and add event on renaming", done => {
        const rootDir = resolve( fixtureDir, "renaming" );

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
            const pPath = toPosix( e.path );

            if ( pPath === "foo/baz" ) {
                fs.renameSync(
                    resolve( rootDir, "foo/qux" ),
                    resolve( rootDir, "foo/quux" )
                );

            } else if ( pPath === "foo/quux" ) {
                expect( getPaths() ).toEqual( ["foo/baz", "foo/quux"] );
                expect( [...watcher.items.keys()].sort() ).toEqual( ["baz", "quux"] );

                expect( handleRemove ).toHaveBeenCalledTimes( 2 );

                done();
            }
        } );

        watcher.on( "remove", handleRemove );
    } );

    it( "should emit an error event on deletion of the watched directory", done => {
        const rootDir = resolve( fixtureDir, "deletion" );

        ensureItems( rootDir, {
            "foo/bar": true,
            "foo/baz": false,
        } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );
        const stubRemove = jest.fn();

        watcher.on( "ready", () => {
            safeRemove( rootDir );
        } );

        watcher.on( "error", () => {
            expect( getPaths() ).toHaveLength( 0 );
            expect( stubRemove ).toHaveBeenCalledTimes( 2 );

            done();
        } );

        watcher.on( "remove", stubRemove );
    } );

    it( "should interrupt initial scan", done => {
        const rootDir = resolve( fixtureDir, "interrupt-initial" );

        ensureItems( rootDir, { "foo/bar": false } );

        const [watcher] = createWatcher( rootDir, "foo" );

        const stubAdd = jest.fn();
        const stubReady = jest.fn();

        watcher.on( "add", stubAdd );
        watcher.on( "ready", stubReady );
        watcher.on( "close", e => {
            expect( stubAdd ).not.toHaveBeenCalled();
            expect( stubReady ).toHaveBeenCalledTimes( 1 );

            expect( watcher.isReady ).toBeTruthy();

            done();
        } );

        // Immediately dispose
        watcher.dispose();
    } );

    it( "should emit remove and close events on dispose", done => {
        const rootDir = resolve( fixtureDir, "dispose" );

        ensureItems( rootDir, {
            "foo/bar": true,
            "foo/baz": false,
        } );

        const [watcher, getPaths] = createWatcher( rootDir, "foo" );

        watcher.on( "ready", () => {
            expect( getPaths() ).toEqual( [
                "foo/bar",
                "foo/baz",
            ] );
            watcher.dispose();
        } );
        watcher.on( "close", () => {
            expect( getPaths() ).toHaveLength( 0 );
            expect( watcher.isReady ).toBeTruthy();

            // At this moment, `disposed` is still false.
            //
            // When watcher.dispose is completed, all event listeners registered
            // to `watcher` will be removed.
            expect( watcher.disposed ).toBeFalsy();

            done();
        } );
    } );

} );


import { resolve } from "path";

import { CompositeDisposable } from "event-kit";
import fs from "fs-extra";
import _ from "lodash";

import { TreeWatcher } from "../TreeWatcher";

import { toPosix } from "../utils";
import {
    ensureItems,
    normalizePaths,
    prepareFixtureDir,
    safeRemove,
} from "./utils";

describe( "TreeWatcher", () => {

    let fixtureDir: string;
    beforeAll( () => {
        fixtureDir = prepareFixtureDir( "TreeWatcher" );
    } );

    let disposables: CompositeDisposable;
    beforeEach( () => {
        disposables = new CompositeDisposable();
    } );
    afterEach( () => {
        disposables.dispose();
    } );

    let watcher: TreeWatcher;
    let getPaths: () => string[];
    let getExpandables: () => string[];
    let getCollapsables: () => string[];
    const createWatcher = ( rootDir: string ) => {
        watcher = new TreeWatcher( rootDir );
        disposables.add( watcher );

        const paths: string[] = [];
        getPaths = () => normalizePaths( paths );

        watcher.on( "add", event => paths.push( event.path ) );
        watcher.on( "remove", event => _.pull( paths, event.path ) );

        getExpandables  = () => normalizePaths( watcher.getExpandables() );
        getCollapsables = () => normalizePaths( watcher.getCollapsables() );
    };

    describe( "expand", () => {
        let rootDir: string;

        beforeAll( () => {
            rootDir = resolve( fixtureDir, "expand" );
            ensureItems( rootDir, {
                "foo/alpha": true,
                "foo/beta": true,
                "foo/foo.txt": false,
                "bar/charlie": true,
                "bar/delta": true,
                "bar/bar.txt": false,
                "root.txt": false,
            } );
        } );

        beforeEach( () => {
            createWatcher( rootDir );
        } );

        it( "should expand child directory", async () => {
            const stubExpand = jest.fn();
            const stubReady = jest.fn();
            watcher.on( "expand", stubExpand );
            watcher.on( "ready", stubReady );

            await watcher.waitRootForReady();

            expect( getExpandables() ).toEqual( ["bar", "foo"] );
            expect( getCollapsables() ).toEqual( ["."] );

            expect( stubExpand ).toHaveBeenCalledTimes( 0 );

            await watcher.expand( "foo" );

            expect( getExpandables() ).toEqual( [
                "bar",
                "foo/alpha",
                "foo/beta",
            ] );
            expect( getCollapsables() ).toEqual( [".", "foo"] );
            expect( getPaths() ).toEqual( [
                "bar",
                "foo",
                "foo/alpha",
                "foo/beta",
                "foo/foo.txt",
                "root.txt",
            ] );

            expect( stubExpand ).toHaveBeenCalledTimes( 1 );
            expect( toPosix( stubExpand.mock.calls[0][0].path ) ).toBe( "foo" );
            expect( toPosix( stubReady.mock.calls[0][0].path ) ).toBe( "." );
            expect( toPosix( stubReady.mock.calls[1][0].path ) ).toBe( "foo" );
        } );

        it( "should expand child and grandchild direcotry", async () => {
            const stubExpand = jest.fn();
            const stubReady = jest.fn();
            watcher.on( "expand", stubExpand );
            watcher.on( "ready", stubReady );

            await watcher.waitRootForReady();
            await watcher.expand( "foo" );

            expect( stubExpand ).toHaveBeenCalledTimes( 1 );

            await watcher.expand( "foo/alpha" );

            expect( getExpandables() ).toEqual( [
                "bar",
                "foo/beta",
            ] );
            expect( getCollapsables() ).toEqual( [
                ".",
                "foo",
                "foo/alpha",
            ] );

            expect( stubExpand ).toHaveBeenCalledTimes( 2 );
            expect( toPosix( stubExpand.mock.calls[0][0].path ) ).toBe( "foo" );
            expect( toPosix( stubExpand.mock.calls[1][0].path ) ).toBe( "foo/alpha" );
            expect( toPosix( stubReady.mock.calls[0][0].path ) ).toBe( "." );
            expect( toPosix( stubReady.mock.calls[1][0].path ) ).toBe( "foo" );
            expect( toPosix( stubReady.mock.calls[2][0].path ) ).toBe( "foo/alpha" );
        } );

        it( "should NOT be able to expand grandchild directory", () => {
            expect( () => {
                watcher.expand( "foo/alpha" );
            } ).toThrow();
        } );

        it( "should expand all directories", async () => {
            const stubExpand = jest.fn();
            const stubReady = jest.fn();
            watcher.on( "expand", stubExpand );
            watcher.on( "ready", stubReady );

            await watcher.waitRootForReady();
            await watcher.expandAll();

            expect( getExpandables() ).toHaveLength( 0 );
            expect( getCollapsables() ).toEqual( [
                ".",
                "bar",
                "bar/charlie",
                "bar/delta",
                "foo",
                "foo/alpha",
                "foo/beta",
            ] );

            expect( stubExpand ).toHaveBeenCalledTimes( 6 );
            expect( stubReady ).toHaveBeenCalledTimes( 7 );
        } );
    } );

    describe( "collapse", () => {
        let rootDir: string;

        beforeAll( () => {
            rootDir = resolve( fixtureDir, "collapse" );
            ensureItems( rootDir, {
                "foo/bar/baz": true,
            } );
        } );

        beforeEach( () => {
            createWatcher( rootDir );
        } );

        it( "should collapse a directory", async () => {
            const stubClose = jest.fn();
            const stubCollapse = jest.fn();
            watcher.on( "close", stubClose );
            watcher.on( "collapse", stubCollapse );

            await watcher.waitRootForReady();
            await watcher.expandAll();

            watcher.collapse( "foo/bar/baz" );

            expect( getExpandables() ).toEqual( [
                "foo/bar/baz",
            ] );
            expect( getCollapsables() ).toEqual( [
                ".",
                "foo",
                "foo/bar",
            ] );

            expect( stubClose ).toHaveBeenCalledTimes( 1 );
            expect( stubCollapse ).toHaveBeenCalledTimes( 1 );
        } );

        it( "should collapse directories recursively", async () => {
            const stubClose = jest.fn();
            const stubCollapse = jest.fn();
            watcher.on( "close", stubClose );
            watcher.on( "collapse", stubCollapse );

            await watcher.waitRootForReady();
            await watcher.expandAll();

            watcher.collapse( "foo" );

            expect( getExpandables() ).toEqual( ["foo"] );
            expect( getCollapsables() ).toEqual( ["."] );

            expect( stubClose ).toHaveBeenCalledTimes( 3 );
            expect( stubCollapse ).toHaveBeenCalledTimes( 3 );
            expect( toPosix( stubCollapse.mock.calls[0][0].path ) ).toBe( "foo/bar/baz" );
            expect( toPosix( stubCollapse.mock.calls[1][0].path ) ).toBe( "foo/bar" );
            expect( toPosix( stubCollapse.mock.calls[2][0].path ) ).toBe( "foo" );
        } );

        it( "should NOT be able to collapse a directory that is already collapsed", async () => {
            await watcher.waitRootForReady();
            await watcher.expandAll();

            watcher.collapse( "foo" );

            expect( () => {
                watcher.collapse( "foo" );
            } ).toThrow();
        } );
    } );

    describe( "delete", () => {
        let rootDir: string;

        beforeAll( () => {
            rootDir = resolve( fixtureDir, "delete" );
        } );

        beforeEach( () => {
            // some of following directories will be removed in our test
            ensureItems( rootDir, {
                "foo/bar/baz": true,
                "foo/bar/qux": true,
            } );

            createWatcher( rootDir );
        } );

        it( "should automatically collapse the removed directory", async done => {
            await watcher.waitRootForReady();
            await watcher.expandAll();

            watcher.on( "collapse", e => {
                expect( toPosix( e.path ) ).toBe( "foo/bar/baz" );
                done();
            } );

            await safeRemove( resolve( rootDir, "foo/bar/baz" ) );
        } );

        it( "should automatically collapse the removed directories", async done => {
            await watcher.waitRootForReady();
            await watcher.expandAll();

            const collapsedItems: string[] = [];
            watcher.on( "collapse", e => {
                const pPath = toPosix( e.path );
                if ( pPath === "foo" ) {
                    expect( collapsedItems.sort() ).toEqual( [
                        "foo/bar",
                        "foo/bar/baz",
                        "foo/bar/qux",
                    ] );
                    done();
                } else {
                    collapsedItems.push( pPath );
                }
            } );

            await safeRemove( resolve( rootDir, "foo" ) );
        } );
    } );

} );

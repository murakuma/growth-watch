
import { CompositeDisposable } from "event-kit";

import {
    ensureFixtureDirs,
    FIXTURES,
} from "./fixtures";
import { normalizePaths } from "./utils";

import { DirectoryWatcher } from "../DirectoryWatcher";

describe( "DirectoryWatcher", () => {

    beforeAll( () => {
        ensureFixtureDirs();
    } );

    let disposables: CompositeDisposable;
    beforeEach( () => {
        disposables = new CompositeDisposable();
    } );
    afterEach( () => {
        disposables.dispose();
    } );

    const createWatcher = ( path: string, glob: string, depth: number ): [DirectoryWatcher, () => string[]] => {
        const watcher = new DirectoryWatcher(
            FIXTURES.BIN_NESTED,
            path, glob, { depth }
        );
        disposables.add( watcher );

        const paths: string[] = [];
        const getPaths = () => normalizePaths( paths );

        watcher.on( "add", event => paths.push( event.path ) );

        return [watcher, getPaths];
    };

    describe( "initial items", () => {
        it( "should add initial items (root)", done => {
            const [watcher, getPaths] = createWatcher( ".", "*/", 0 );

            watcher.on( "ready", event => {
                expect( event.path ).toBe( "." );
                expect( getPaths() ).toEqual( ["0", "1"] );

                done();
            } );
        } );

        it( "should add initial items (non-root)", done => {
            const [watcher, getPaths] = createWatcher( "0", "*/", 0 );

            watcher.on( "ready", event => {
                expect( event.path ).toBe( "0" );
                expect( getPaths() ).toEqual( ["0/00", "0/01"] );

                done();
            } );
        } );

        it( "should add initial items recursively (root)", done => {
            const [watcher, getPaths] = createWatcher( ".", "**/*/", 2 );

            watcher.on( "ready", event => {
                expect( event.path ).toBe( "." );
                expect( getPaths() ).toEqual( [
                    "0",
                        "0/00",
                            "0/00/000",
                            "0/00/001",
                        "0/01",
                            "0/01/010",
                            "0/01/011",
                    "1",
                        "1/10",
                            "1/10/100",
                            "1/10/101",
                        "1/11",
                            "1/11/110",
                            "1/11/111",
                ] );

                done();
            } );
        } );

        it( "should add initial items recursively (non-root)", done => {
            const [watcher, getPaths] = createWatcher( "1", "**/*/", 2 );

            watcher.on( "ready", event => {
                expect( event.path ).toBe( "1" );
                expect( getPaths() ).toEqual( [
                    "1/10",
                        "1/10/100",
                            "1/10/100/1000",
                            "1/10/100/1001",
                        "1/10/101",
                            "1/10/101/1010",
                            "1/10/101/1011",
                    "1/11",
                        "1/11/110",
                            "1/11/110/1100",
                            "1/11/110/1101",
                        "1/11/111",
                            "1/11/111/1110",
                            "1/11/111/1111",
                ] );

                done();
            } );
        } );

        it( "should add initial items with overscan", done => {
            const [watcher, getPaths] = createWatcher( "1", "*/*/*/", 2 );

            watcher.on( "ready", event => {
                expect( getPaths() ).toEqual( [
                    "1/10/100/1000",
                    "1/10/100/1001",
                    "1/10/101/1010",
                    "1/10/101/1011",
                    "1/11/110/1100",
                    "1/11/110/1101",
                    "1/11/111/1110",
                    "1/11/111/1111",
                ] );

                done();
            } );
        } );
    } );

} );

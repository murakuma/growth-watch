
import {
    FakeTimer,
    genBinaryDirTree,
    normalizePaths,
} from "./utils";

describe( "Test utils", () => {

    describe( "FakeTimer", () => {
        it( "should mock 'Date.now' function", () => {
            const { advance } = FakeTimer;

            FakeTimer.setup();

            const start = Date.now();
            const stubW100 = jest.fn();
            const stubW200 = jest.fn();

            setTimeout( stubW100, 100 );
            setTimeout( stubW200, 200 );

            advance( 100 );

            expect( Date.now() ).toBeCloseTo( start + 100 );
            expect( stubW100 ).toHaveBeenCalled();
            expect( stubW200 ).not.toHaveBeenCalled();

            advance( 150 );

            expect( Date.now() ).toBeCloseTo( start + 250 );
            expect( stubW200 ).toHaveBeenCalled();

            FakeTimer.teardown();
        } );
    } );

    describe( "genDirTree", () => {
        it( "should generate binary dir tree", () => {
            expect( genBinaryDirTree( 1 ) ).toEqual(
                ["0", "1"]
            );
            expect( genBinaryDirTree( 2 ) ).toEqual(
                ["0/00", "0/01", "1/10", "1/11"]
            );
            expect( genBinaryDirTree( 3 ) ).toEqual(
                ["0/00/000", "0/00/001", "0/01/010", "0/01/011", "1/10/100", "1/10/101", "1/11/110", "1/11/111"]
            );
            expect( genBinaryDirTree( 4 ) ).toHaveLength( 16 );
        } );
    } );

    describe( "normalizePaths", () => {
        it( "should unixify paths", () => {
            expect( normalizePaths([
                "a/b\\c",
                "d\\e\\f",
            ]) ).toEqual( [
                "a/b/c",
                "d/e/f",
            ] );
        } );

        it( "should sort paths", () => {
            expect( normalizePaths([
                "foo", "bar", "baz",
            ]) ).toEqual( [
                "bar",
                "baz",
                "foo",
            ] );
        } );
    } );

} );

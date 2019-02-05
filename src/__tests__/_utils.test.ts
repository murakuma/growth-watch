
import { normalizePaths } from "./utils";

describe( "Test utils", () => {

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

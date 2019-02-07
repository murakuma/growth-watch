
import {
    findChildren,
    isChild,
} from "../children";

describe( "children", () => {

    it( "should determine if it is a child", () => {
        expect( isChild( "foo", "foo/bar" ) ).toBeTruthy();
        expect( isChild( "foo", "foo/bar/" ) ).toBeTruthy();
        expect( isChild( "foo/", "foo/bar" ) ).toBeTruthy();

        expect( isChild( "foo", "foo" ) ).toBeFalsy();
        expect( isChild( "foo", "foo/bar/baz" ) ).toBeFalsy();
        expect( isChild( "foo/bar", "foo" ) ).toBeFalsy();

        expect( isChild( ".", "foo" ) ).toBeTruthy();
        expect( isChild( ".", "bar/" ) ).toBeTruthy();

        expect( isChild( ".", "." ) ).toBeFalsy();
        expect( isChild( ".", "foo/bar" ) ).toBeFalsy();
    } );

    it( "should find direct children", () => {
        expect( findChildren( "foo", [
            ".",
            "foo",
            "foo/bar",
            "foo/bar/baz",
            "bar",
        ] ) ).toEqual( [
            "foo/bar",
        ] );

        expect( findChildren( ".", [
            ".",
            "foo",
            "foo/bar",
            "foo/bar/baz",
            "bar",
        ] ) ).toEqual( [
            "foo",
            "bar",
        ] );
    } );

} );

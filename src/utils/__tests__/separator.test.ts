
import { join } from "path";

import {
    toNative,
    toPosix,
    toWindows,
} from "../separator";

describe( "separator", () => {

    it( "should convert to POSIX-style path", () => {
        expect( toPosix( "foo/bar"  ) ).toBe( "foo/bar" );
        expect( toPosix( "foo\\bar" ) ).toBe( "foo/bar" );
        expect( toPosix( "foo\\bar\\baz" ) ).toBe( "foo/bar/baz" );
    } );

    it( "should convert to Windows-style path", () => {
        expect( toWindows( "foo\\bar" ) ).toBe( "foo\\bar" );
        expect( toWindows( "foo/bar"  ) ).toBe( "foo\\bar" );
        expect( toWindows( "foo/bar/baz" ) ).toBe( "foo\\bar\\baz" );
    } );

    it( "should convert to native path", () => {
        const fooBar = join( "foo", "bar" );
        const fooBarBaz = join( "foo", "bar", "baz" );

        expect( toNative( "foo/bar"  ) ).toBe( fooBar );
        expect( toNative( "foo\\bar" ) ).toBe( fooBar );
        expect( toNative( "foo/bar/baz"   ) ).toBe( fooBarBaz );
        expect( toNative( "foo\\bar\\baz" ) ).toBe( fooBarBaz );
        expect( toNative( "foo/bar\\baz"  ) ).toBe( fooBarBaz );
        expect( toNative( "foo\\bar/baz"  ) ).toBe( fooBarBaz );
    } );

} );

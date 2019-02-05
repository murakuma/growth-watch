
import { resolve } from "path";

import fs from "fs-extra";

import { genBinaryDirTree } from "./genDirTree";

const FIXTURE_ROOT = resolve( __dirname, "../../../__fixtures__" );

export const FIXTURES = {
    BIN_NESTED: resolve( FIXTURE_ROOT, "bin-nested" ),
    DELETION:   resolve( FIXTURE_ROOT, "deletion" ),
};

export function ensureFixtureDirs() {
    genBinaryDirTree( 5 ).forEach( dir => {
        const path = resolve( FIXTURES.BIN_NESTED, dir );
        fs.ensureDirSync( path );
    } );
}

export function prepareFixtureDeletion() {
    fs.ensureDirSync( resolve( FIXTURES.DELETION, "foo/bar" ) );

    return () => {
        fs.removeSync( FIXTURES.DELETION );
    };
}


import { resolve } from "path";

import fs from "fs-extra";

import { genBinaryDirTree } from "./genDirTree";

const FIXTURE_ROOT = resolve( __dirname, "../../../__fixtures__/generated" );

export const FIXTURES = {
    ROOT: FIXTURE_ROOT,
    BIN_NESTED: resolve( FIXTURE_ROOT, "bin-nested" ),
};

export function prepareFixtureDirs() {
    fs.removeSync( FIXTURE_ROOT );

    genBinaryDirTree( 5 ).forEach( dir => {
        const path = resolve( FIXTURES.BIN_NESTED, dir );
        fs.ensureDirSync( path );
    } );
}

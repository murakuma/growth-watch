
import { resolve } from "path";

import fs from "fs-extra";

const FIXTURE_ROOT = resolve( __dirname, "../../../__fixtures__/generated" );

export function prepareFixtureDir( suiteName: string ) {
    const fixtureDir = resolve( FIXTURE_ROOT, suiteName );
    fs.removeSync( fixtureDir );
    fs.ensureDirSync( fixtureDir );
    return fixtureDir;
}

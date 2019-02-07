
import { resolve } from "path";

import fs from "fs-extra";
import _ from "lodash";

export function ensureItems(
    rootDir: string,
    itemMap: { [key: string]: boolean }
) {
    _.forOwn( itemMap, ( isDir, path ) => {
        const absPath = resolve( rootDir, path );
        if ( isDir ) {
            fs.ensureDirSync( absPath );
        } else {
            fs.ensureFileSync( absPath );
        }
    } );
}

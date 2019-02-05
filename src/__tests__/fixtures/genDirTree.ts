
import _ from "lodash";
import R from "ramda";

/**
 * Generates binary directory tree.
 * @param depth 
 */
export function genBinaryDirTree( depth: number ) {
    let dirs = [
        { path: "0", name: "0" },
        { path: "1", name: "1" },
    ];
    _.times( depth - 1, () => {
        dirs = R.xprod( dirs, ["0", "1"] ).map( ([parent, suffix]) => {
            const name = parent.name + suffix;
            return {
                path: parent.path + "/" + name,
                name,
            };
        } );
    } );
    return R.pluck( "path", dirs );
}

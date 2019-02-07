
import fs from "fs-extra";

/**
 * Ensures that the given directory removed.
 *
 * Sometimes, `fs.remove` stops removing nested directories, one of which is
 * being watched by DirectoryWatcher. To reduce flakiness, this function
 * monitors the nested directories, and retry removal until all of them are
 * successfully removed.
 */
export function safeRemove( path: string ): Promise<void> {
    return new Promise( resolve => {
        const tryRemove = () => {
            fs.removeSync( path );

            if ( fs.existsSync( path ) ) {
                setTimeout( tryRemove, 50 );
            } else {
                resolve();
            }
        };

        tryRemove();
    } );
}


import { toPosix } from "./separator";

export function isChild( parent: string, child: string ) {
    // Format parent path
    parent = toPosix( parent );
    if ( parent === "." ) {
        // The root directory
        parent = "";
    } else if ( !parent.endsWith( "/" ) ) {
        // Append a slash
        parent += "/";
    }

    // Format child path
    child = toPosix( child );
    if ( child === "." ) {
        return false;
    }
    if ( child.endsWith( "/" ) ) {
        // Remove the slash at the end of the string
        child = child.substr( 0, child.length - 1 );
    }

    const isDescendant = child.startsWith( parent );
    if ( !isDescendant ) {
        return false;
    }

    const relPath = child.substr( parent.length );
    return !relPath.includes( "/" );
}

export function findChildren( parent: string, paths: string[] ) {
    return paths.filter( path => isChild( parent, path ) );
}

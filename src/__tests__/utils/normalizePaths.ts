
import { unixify } from "./unixify";

/**
 * Normalizes the list of paths by converting back-slashes to forward-slashes
 * and sorting.
 * @param paths 
 */
export function normalizePaths( paths: string[] ) {
    return paths.map( unixify ).sort();
}

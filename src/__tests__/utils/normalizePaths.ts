
import { toPosix } from "../../utils/separator";

/**
 * Normalizes the list of paths by converting back-slashes to forward-slashes
 * and sorting.
 * @param paths 
 */
export function normalizePaths( paths: string[] ) {
    return paths.map( toPosix ).sort();
}

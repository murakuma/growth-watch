
import nodePath from "path";

export function toPosix( path: string ) {
    return path.replace( /\\/g, "/" );
}

export function toWindows( path: string ) {
    return path.replace( /\//g, "\\" );
}

export function toNative( path: string ) {
    return path.replace( /[\/\\]/g, nodePath.sep );
}


import { Stats } from "fs";

import { ValueOf } from "./types";

export interface DirectoryWatcherEvents {
    // File/directory updates
    add: AddEvent;
    remove: RemoveEvent;
    change: ChangeEvent;

    // Watcher
    ready: WatcherEvent<"ready">;
    close: WatcherEvent<"close">;

    // Error
    error: Error;
    childError: Error;
}

interface TreeWatcherEvents extends DirectoryWatcherEvents {
    // Collapsibles
    expand: ExpandEvent;
    collapse: CollapseEvent;
}

type BufferedEvents = Pick<
    TreeWatcherEvents,
    // Picks event types that extend `WatcherEvent`
    {
        [ET in keyof TreeWatcherEvents]: TreeWatcherEvents[ET] extends WatcherEvent<ET> ? ET : never
    }[keyof TreeWatcherEvents]
>;

export interface TreeWatcherEventsWithBuffer extends TreeWatcherEvents {
    buffer: BufferedEvent[];
}

export const directoryWatcherEventNames: (keyof DirectoryWatcherEvents)[] = [
    "add",
    "remove",
    "change",
    "ready",
    "close",
    "error",
    "childError",
];

export const bufferedEventNames: (keyof BufferedEvents)[] = [
    "add",
    "remove",
    "change",
    "ready",
    "close",
    "expand",
    "collapse",
];

export type BufferedEvent = ValueOf<BufferedEvents>;

export interface WatcherEvent<EventType extends keyof TreeWatcherEvents> {
    type: EventType;
    path: string;
}

export interface AddEvent extends WatcherEvent<"add"> {
    stats: Stats;
    isDirectory: boolean;
    isInitial: boolean;
}

export interface ChangeEvent extends WatcherEvent<"change"> {
    stats: Stats;
    isDirectory: false;
}

export interface RemoveEvent extends WatcherEvent<"remove"> {
    isDirectory: boolean;
}

export interface ExpandEvent extends WatcherEvent<"expand"> {
    isExpanded: true;
}

export interface CollapseEvent extends WatcherEvent<"collapse"> {
    isExpanded: false;
}

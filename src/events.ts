
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

interface WatcherEvent<EventType extends keyof TreeWatcherEvents> {
    type: EventType;
    path: string;
}

interface AddEvent extends WatcherEvent<"add"> {
    stats: Stats;
    isDirectory: boolean;
    isInitial: boolean;
}

interface ChangeEvent extends WatcherEvent<"change"> {
    stats: Stats;
    isDirectory: false;
}

interface RemoveEvent extends WatcherEvent<"remove"> {
    isDirectory: boolean;
}

interface ExpandEvent extends WatcherEvent<"expand"> {
    isExpanded: true;
}

interface CollapseEvent extends WatcherEvent<"collapse"> {
    isExpanded: false;
}

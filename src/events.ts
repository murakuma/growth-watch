
import { Stats } from "fs";

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

export interface TreeWatcherEvents extends DirectoryWatcherEvents {
    // Collapsibles
    expand: ExpandEvent;
    collapse: CollapseEvent;
}

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

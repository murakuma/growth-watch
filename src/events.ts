
import { Stats } from "fs";

export interface DirectoryWatcherEvents {
    // File/directory updates
    add: UpsertEvent;
    remove: RemoveEvent;
    change: UpsertEvent;

    // Ready
    ready: ReadyEvent;

    // Error
    error: Error;
    childError: Error;
}

export interface TreeWatcherEvents extends DirectoryWatcherEvents {
    // Collapsibles
    expand: ExpansionEvent;
    collapse: ExpansionEvent;
}

interface ItemEvent<EventType extends keyof TreeWatcherEvents> {
    type: EventType;
    path: string;
}

interface FSItemEvent<EventType extends keyof TreeWatcherEvents> extends ItemEvent<EventType> {
    isDirectory: boolean;
}

interface UpsertEvent extends FSItemEvent<"add" | "change"> {
    stats: Stats;
}

interface RemoveEvent extends FSItemEvent<"remove"> {
}

interface ReadyEvent extends ItemEvent<"ready"> {
}

interface ExpansionEvent extends ItemEvent<"expand" | "collapse"> {
    isExpanded: boolean;
    reason: "user";
}

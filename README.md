
# growth-watch

> A file tree watcher that progressively adds directories to watch.

- **Expanding/collapsing** directories to watch
- It automatically collapses expanded directories on unlink/deletion
- Events are **buffered** so you can apply batch updates to the UI

## Motivation

Reflecting realtime status of the filesystem is crucial when you want to make  a tree-like file explorer UI in a desktop application. Filesystem watchers can be used to detect any changes on the client's filesystem. By using them, you can apply the changes to the UI on the fly in addition to showing the initial files. The easiest way to implement this functionality is creating a watcher that observes the target directory *and its all descendant directories recursively*.

However, sometimes it may take a significant amount of time to perform this operation due to too many files and directories underneath the target directory. So, it is a good idea to avoid watching those directories that aren't displayed on the file tree UI yet. And as the user opens the directory, it should start watching it.

**growth-watch** is a wrapper of `fs.watch` and aims to provide an API to *gradually create filesystem watchers on demand*. It stores the list of files and directories on the watched (expanded) directories and emits update events further on.

This package aims for running on GUI platform with node.js, Electron for example, and the requirement to deal with many items under the root directory in order to avoid watching all of sub-directories unnecessarily.

## Installation

```
$ npm install growth-watch --save
```

## Usage

In growth-watch, there are two ways of listening to the events: subscribing the individual events, and using **buffered events**, which is a group of events occured recently. Basically, you may want to use rather buffered events so you can do batch changes on the UI.

```js
import { TreeWatcher } from "growth-watch";

// Create a watcher instance
const watcher = new TreeWatcher(targetDir);

watcher.on("buffer", events => {
    events.forEach( event => {

        switch ( event.type ) {
            case "add":
                // ...
                break;

            case "change":
                // ...
                break;

            case "remove":
                // ...
                break;

            case "expand":
                // ...
                break;

            case "collapse":
                // ...
                break;
        }

    } );
});

// When the user clicks a directory on the UI
watcher.toggleExpansion(dir);

// Teardown the watcher
watcher.dispose();
```

By default, buffered events are collected during 50 milliseconds and after that they will be emitted as a group of events.

## API

### class: TreeWatcher

```js
import { TreeWatcher } from "growth-watch";
```

#### Methods

- **Create/Destroy**
  - [constructor](#constructor)
  - [dispose](#dispose)
- **Core**
  - [waitRootForReady](#waitrootforready)
  - [expand](#expand)
  - [collapse](#collapse)
  - [toggleExpansion](#toggleexpansion)
  - [expandAll](#expandall)
- **Checking directory status**
  - [isExpandable](#isexpandable)
  - [isCollapsable](#iscollapsable)
  - [getExpandables](#getexpandables)
  - [getCollapsables](#getcollapsables)
  - [getCollapsablesAt](#getcollapsablesat)
- **Events**
  - [on](#on)
  - [once](#once)

> **NOTE**:
>
> The **path** argument passed into TreeWatcher method other than constructor must be **the relative path from the root directory**. Although, both posix-style (`/`) and windows-style (`\`) path separator are acceptable, we recommend you to stick with the platform-specific style all across your code base.


##### constructor

```ts
new TreeWatcher(rootDir: string, options?: TreeWatcherOptions);
```

Creates a TreeWatcher instance.

- `rootDir`: The root directory on which the TreeWatcher watches.
- `options` (optional)
  - `options.throttleDelay` (optional)
    - The duration it takes to flush the buffered events, in ms.
    - **Default**: `50` ms

```js
const watcher = new TreeWatcher(targetDir, {
    throttleDelay: 50,
});
```

##### dispose

```ts
dispose(): void;
```

Disposes the watcher instance. A disposed watcher is no longer usable.

##### waitRootForReady

```ts
waitRootForReady(): Promise<void>;
```

Returns a promise that resolves when the initial scan of the root directory has been completed.

##### expand

```ts
expand(path: string): Promise<void>;
```

- `path`: The relative path of the directory to expand.

Expands the directory. The directory must be represented in any directories that already expanded. Otherwise it throws an error.

Returns a promise that resolves when the initial scan of the directory has been completed.

Calling this method results in an `"expand"` event and subsequently a `"ready"` event to be emitted.

##### collapse

```ts
collapse(path: string): void;
```

- `path`: The relative path of the directory to collapse.

Collapse the directory. The directory must be already expanded. Otherwire it throws an error.

Calling this method results in a `"close"` event and then `"collapse"` event to be emitted immediately.

##### toggleExpansion

```ts
toggleExpansion(path: string): Promise<void>;
```

Expands the directory if it is appeared in any directories that already expanded, or collapses it if already expanded.

Returns a promise that resolves when the initial scan of the directory has been completed if it's being expanded. Otherwise it immediately resolves.

##### expandAll

```ts
expandAll(): Promise<void>;
```

Expands all directories recursively. Calling this method results no effects when the initial scan of the root directory is not completed yet.

Returns a promise that resolves when the all of initial scan has been completed.

```js
// Let the watcher to grab the child directories of the root first
await watcher.waitRootForReady();

// Then call to expand all
watcher.expandAll();
```

##### isExpandable

```ts
isExpandable(path: string): boolean;
```

Returns whether the directory is currently expandable.

##### isCollapsable

```ts
isCollapsable(path: string): boolean;
```

Returns whether the directory is currently collapsable.

##### getExpandables

```ts
getExpandables(): string[];
```

Returns a list of expandable directories.

##### getCollapsables

```ts
getCollapsables(): string[];
```

Returns a list of collapsable directories.

##### getCollapsablesAt

```ts
getCollapsablesAt(path: string): string[];
```

Returns a list of collapsable directories that are also direct children of the given directory.

##### on

```ts
on(eventType: string, callbackFn: (event: any) => void): Disposable;
```

Registers the event handler for the event type. You can unregister it by calling `dispose()` method of the returned object.

```js
const handleError = () => { /* ... */ };
const subscription = watcher.on("error", handleError);

// Unregistring the event handler
subscription.dispose();
```

##### once

```ts
once(eventType: string, callbackFn: (event: any) => void): Disposable;
```

Registers the event handler for the event type. The event handler registered via this method will be unregistered once it is invoked.

#### Events

- **File/directory changes**
  - [add](#add)
  - [change](#change)
  - [remove](#remove)
- **Per-directory lifecycle**
  - [expand](#expand-1)
  - [collapse](#collapse-1)
  - [ready](#ready)
  - [close](#close)
- **Errors**
  - [error](#error)
  - [childError](#childerror)
- **Buffered event**
  - [buffer](#buffer)

> **NOTE**:
>
> The `path` property in event object is described in platform-specific style (forward-slash in Linux/Max or backward-slash in Windows)

##### add

```js
watcher.on("add", (event) => { /* ... */ });
```

- `event`
  - `type: "add"`
  - `path: string`
  - `stats: fs.Stats`
  - `isDirectory: boolean`
  - `isInitial: boolean`

Emitted when:

- Initial scan finds a file or a directory existing in the expanded directory
- A file or a directory has been created on a watched directory

##### change

```js
watcher.on("change", (event) => { /* ... */ });
```

- `event`
  - `type: "change"`
  - `path: string`
  - `stats: fs.Stats`
  - `isDirectory: false`

Emitted when a file has been updated.

##### remove

```js
watcher.on("remove", (event) => { /* ... */ });
```

- `event`
  - `type: "remove"`
  - `path: string`
  - `isDirectory: boolean`

Emitted when:

- A file or a directory has been deleted
- A watched directory that contains some files and directories has been collapsed

##### expand

```js
watcher.on("expand", (event) => { /* ... */ });
```

- `event`
  - `type: "expand"`
  - `path: string`
  - `isExpanded: true`

Emitted when a directory has been expanded.

##### collapse

```js
watcher.on("collapse", (event) => { /* ... */ });
```

- `event`
  - `type: "collapsed"`
  - `path: string`
  - `isExpanded: false`

Emitted when a directory has been collapsed.

##### ready

```js
watcher.on("ready", (event) => { /* ... */ });
```

- `event`
  - `type: "ready"`
  - `path: string`

Emitted when the initial scan of the expanded directory has been completed. Once this event occurs, any `"add"` event with `isInitial: true` will never be emitted unless it gets collapsed and then re-expanded.

##### close

```js
watcher.on("close", (event) => { /* ... */ });
```

- `event`
  - `type: "close"`
  - `path: string`

Emitted when a single filesystem watcher has been closed manually (via `collapse()` method) or by the filesystem, that is the watched directory has been deleted.

##### error

```js
watcher.on("error", (err) => { /* ... */ });
```

- `error: Error`

Emitted when a filesystem watcher has been failed. It also will be emitted when one of the watched directories has been deleted, along with `"close"` and `"collapse"` event.

##### childError

```js
watcher.on("childError", (event) => { /* ... */ });
```

- `error: Error`

Emitted when a filesystem watcher failed to retrieve a `fs.Stats` for a file or a directory.

##### buffer

```js
watcher.on("buffer", (events) => { /* ... */ });
```

- `events: Array<Event>`

Emitted with buffered events. All event types except **error** and **childError** will be buffered, and flushed when certain period of time (`throttleDelay`) has been elapsed after the first event in the buffer window was emitted.

## Related projects

growth-watch is more forcused on the UI interactions rather than watching filesystem. If you want to just observe directories, we recommend you to use other filesystem watcher libraries because of reliability and customizability.

- [chokidar](https://github.com/paulmillr/chokidar)
- [nsfw](https://github.com/Axosoft/nsfw)
- [sane](https://github.com/amasad/sane)

And if you want to filter contents received in your event handler, consider to use [anymatch](https://github.com/micromatch/anymatch), which accepts glob patterns, regular expressions, and predicate functions to determine certain path should be ignored or not.

```js
watcher.on("add", event => {
    if (anymatch(ignoreMatchers, event.path)) {
        return;
    }

    // for example
    myApp.addFileOnUI(event.path, event.isDirectory);
});
```

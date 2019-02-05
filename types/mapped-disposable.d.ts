
declare module "mapped-disposable" {

    import {
        CompositeDisposable,
        DisposableLike,
    } from "event-kit";

    type Key = string | Number;

    class MappedDisposable<T extends DisposableLike = DisposableLike> {
        constructor( iterable?: [Key, T][] );
        dispose( ...keys: Key[] ): void;
        add( key: Key, ...disposables: T[] ): void;
        remove( key: Key, ...disposables: T[] ): void;
        delete( key: Key, ...disposables: T[] ): void;
        clear(): void;
        has( key: Key ): boolean;
        get( key: Key ): CompositeDisposable | undefined;
        set( key: Key, value: T ): void;
        readonly disposed: boolean;
        readonly size: number;
    }

    export = MappedDisposable;

}

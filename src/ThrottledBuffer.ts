
import { Emitter } from "event-kit";
import throttle from "lodash.throttle";

/**
 * ThrottledBuffer collects a series of items pushed into this buffer and emit
 * them as an array periodically.
 *
 * It comes handy when you want to batch multiple events at the same time.
 */
export class ThrottledBuffer<T> extends Emitter<{}, { data: T[] }> {

    private _buffer: T[] = [];
    private readonly  _throttledFlush: () => void;

    constructor( readonly delay: number ) {
        super();

        this._throttledFlush = throttle( this._flush, delay, {
            leading: false,
            trailing: true,
        } );
    }

    push( item: T ) {
        this._buffer.push( item );
        this._throttledFlush();
    }

    private _flush = () => {
        this.emit( "data", this._buffer );
        this._buffer = [];
    }
}

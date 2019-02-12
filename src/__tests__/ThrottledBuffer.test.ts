
import { ThrottledBuffer } from "../ThrottledBuffer";

import {
    FakeTimer,
} from "./utils";

describe( "ThrottledBuffer", () => {

    const { advance } = FakeTimer;

    beforeEach( () => {
        // Since `lodash.throttle` uses `Date.now()` to determine whether the given
        // time is elapsed, we need to mock the return value of `Date.now()` in
        // addition to `setTimeout`.
        FakeTimer.setup();
    } );

    afterEach( () => {
        FakeTimer.teardown();
    } );

    it( "should flush items after the delay", () => {
        const buffer = new ThrottledBuffer<number>( 100 );

        const stubData = jest.fn();
        buffer.on( "data", stubData );

        buffer.push( 0 );
        buffer.push( 1 );

        advance( 100 );

        expect( stubData ).toHaveBeenCalledTimes( 1 );
        expect( stubData.mock.calls[0][0] ).toEqual( [0, 1] );

        advance( 150 );
        expect( stubData ).toHaveBeenCalledTimes( 1 );

        buffer.push( 2 );
        advance( 30 );
        buffer.push( 3 );
        advance( 30 );
        buffer.push( 4 );
        advance( 40 );

        expect( stubData ).toHaveBeenCalledTimes( 2 );
        expect( stubData.mock.calls[1][0] ).toEqual( [2, 3, 4] );

        advance( 40 );
        buffer.push( 5 );
        advance( 60 );

        expect( stubData ).toHaveBeenCalledTimes( 2 );

        advance( 40 );
        expect( stubData ).toHaveBeenCalledTimes( 3 );
        expect( stubData.mock.calls[2][0] ).toEqual( [5] );
    } );

} );

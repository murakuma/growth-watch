
export namespace FakeTimer {

    let mockDateNow: jest.SpyInstance<typeof Date.now>;
    let currentNow: number;

    export function setup() {
        jest.useFakeTimers();
        currentNow = Date.now();
        mockDateNow = jest.spyOn( Date, "now" )
            .mockImplementation( () => currentNow );
    }

    export function teardown() {
        mockDateNow.mockRestore();
    }

    export function advance( ms: number ) {
        currentNow += ms;
        jest.advanceTimersByTime( ms );
    }
}

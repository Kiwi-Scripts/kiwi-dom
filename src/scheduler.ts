export interface Scheduler {
    /** Runs the callback once after the interval; further requests while one is pending are absorbed. */
    request(): void;
    cancel(): void;
}

/**
 * Throttles a refresh: change notifications can come very often, the work only needs to run a few times a second.
 * @param runOutside lets a host framework start the timer outside of its change detection (e.g. `NgZone.runOutsideAngular`).
 */
export function createScheduler( run: () => void, interval: number, runOutside: <T>( fn: () => T ) => T = fn => fn() ): Scheduler {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return {
        request() {
            if ( timer === undefined ) {
                timer = runOutside( () => setTimeout( () => {
                    timer = undefined;
                    run();
                }, interval ) );
            }
        },
        cancel() {
            clearTimeout( timer );
            timer = undefined;
        }
    };
}

/** A tiny typed emitter. `Events` maps event names to their payloads. */
export interface Emitter<Events extends Record<string, unknown>> {
    /** Returns the function that removes the listener again. */
    on<K extends keyof Events>( type: K, listener: ( payload: Events[K] ) => void ): () => void;
    emit<K extends keyof Events>( type: K, payload: Events[K] ): void;
    clear(): void;
}

/** @param onError receives what a listener threw; the other listeners are still called. Default: `console.error`. */
export function createEmitter<Events extends Record<string, unknown>>(
    onError: ( error: unknown, type: keyof Events ) => void = ( error, type ) => console.error( `Listener of "${String( type )}" failed:`, error )
): Emitter<Events> {
    const listeners = new Map<keyof Events, Set<( payload: any ) => void>>();
    return {
        on( type, listener ) {
            let set = listeners.get( type );
            if ( !set ) {
                listeners.set( type, set = new Set() );
            }
            const own = set;
            own.add( listener );
            return () => void own.delete( listener );
        },
        emit( type, payload ) {
            // Copied, so that listeners may unsubscribe while being called.
            for ( const listener of Array.from( listeners.get( type ) ?? [] ) ) {
                try {
                    listener( payload );
                } catch ( error ) {
                    onError( error, type );
                }
            }
        },
        clear: () => listeners.clear()
    };
}

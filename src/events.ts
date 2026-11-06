/** Whether the event comes from a text field, where plain keys must reach the page. Sees through shadow roots. */
export function isEditing( ev: Event ): boolean {
    const target = ev.composedPath()[0];
    return target instanceof HTMLElement && ( target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes( target.tagName ) );
}

export interface PointerTrackHandlers {
    onMove( ev: PointerEvent ): void;
    /** Called once when the pointer is released or the gesture is cancelled. */
    onEnd?( ev: PointerEvent ): void;
}

/**
 * Follows the pointer on the whole document until it is released, for drags and resizes.
 * The listeners are captured, so the page cannot stop the gesture. Returns a function that ends it early, without `onEnd`.
 */
export function trackPointer( handlers: PointerTrackHandlers ): () => void {
    const stop = (): void => {
        document.removeEventListener( 'pointermove', handlers.onMove, true );
        document.removeEventListener( 'pointerup', onUp, true );
        document.removeEventListener( 'pointercancel', onUp, true );
    };
    const onUp = ( ev: PointerEvent ): void => {
        stop();
        handlers.onEnd?.( ev );
    };
    document.addEventListener( 'pointermove', handlers.onMove, true );
    document.addEventListener( 'pointerup', onUp, true );
    document.addEventListener( 'pointercancel', onUp, true );
    return stop;
}

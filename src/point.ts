export interface ElementAtOptions {
    /** Elements for which this returns true are looked through (e.g. an overlay's own host), as if they were not there. */
    skip?( el: Element ): boolean;
    /** Descends into open shadow roots to find the innermost element. Default: true. */
    composed?: boolean;
    /** Where to start; a document or a shadow root. Default: `document`. */
    root?: Document | ShadowRoot;
}

function stackAt( scope: Document | ShadowRoot, x: number, y: number ): Element[] {
    if ( typeof scope.elementsFromPoint === 'function' ) {
        return scope.elementsFromPoint( x, y );
    }
    const top = scope.elementFromPoint?.( x, y );
    return top ? [top] : [];
}

/**
 * The topmost element at a viewport point, ignoring skipped ones and, by default, looking into shadow roots.
 * Unlike `document.elementFromPoint`, a skipped element does not hide what lies below it.
 */
export function elementAt( x: number, y: number, options: ElementAtOptions = {} ): Element | null {
    let scope: Document | ShadowRoot = options.root ?? document;
    let found: Element | null = null;
    for ( ;; ) {
        const current: Document | ShadowRoot = scope;
        // Within a shadow root only its own elements count, the list also holds the hosts around it.
        const next: Element | undefined = stackAt( current, x, y ).find( el => el !== found
            && ( current instanceof Document || el.getRootNode() === current )
            && !options.skip?.( el ) );
        if ( !next ) {
            return found;
        }
        found = next;
        if ( options.composed === false || !next.shadowRoot ) {
            return found;
        }
        scope = next.shadowRoot;
    }
}

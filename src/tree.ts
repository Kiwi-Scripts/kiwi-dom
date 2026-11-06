/** What a test returns: a value for an element that matches, anything falsy for one that does not. */
export type Test<R> = ( el: Element ) => R | null | undefined | false;

/** An element together with the value the test returned for it. */
export interface Match<R> {
    element: Element;
    value: R;
}

export interface TraverseOptions {
    /** Also crosses shadow-root boundaries (open roots only). Default: false. */
    composed?: boolean;
}

export interface ClosestOptions extends TraverseOptions {
    /** Whether the element itself is tested first. Default: true. */
    includeSelf?: boolean;
}

export interface DescendantOptions extends TraverseOptions {
    /** Elements for which this returns true are skipped together with their whole subtree. */
    reject?( el: Element ): boolean;
    /** Stops after this many matches. */
    limit?: number;
}

export interface WalkOptions extends TraverseOptions {
    /** Elements for which this returns true are skipped together with their whole subtree. */
    reject?( el: Element ): boolean;
}

/** The parent element; with `composed`, the host of the shadow root an element is the top of. */
export function parentOf( el: Element, composed = false ): Element | null {
    if ( el.parentElement ) {
        return el.parentElement;
    }
    if ( composed ) {
        const root = el.getRootNode();
        if ( root instanceof ShadowRoot ) {
            return root.host;
        }
    }
    return null;
}

/** The elements above `el`, nearest first. */
export function* ancestorsOf( el: Element, options: TraverseOptions = {} ): Generator<Element> {
    for ( let at = parentOf( el, options.composed ); at; at = parentOf( at, options.composed ) ) {
        yield at;
    }
}

/** The nearest ancestor (by default including `el`) for which `test` returns a value, with that value. */
export function closestMatch<R>( el: Element, test: Test<R>, options: ClosestOptions = {} ): Match<R> | null {
    for ( let at: Element | null = options.includeSelf === false ? parentOf( el, options.composed ) : el; at; at = parentOf( at, options.composed ) ) {
        const value = test( at );
        if ( value ) {
            return { element: at, value };
        }
    }
    return null;
}

/**
 * The topmost matches below `el`, in document order: a depth-first search that does not descend into a match,
 * so nested matches are not reported.
 */
export function nearestDescendants<R>( el: Element | ShadowRoot | Document, test: Test<R>, options: DescendantOptions = {} ): Match<R>[] {
    const found: Match<R>[] = [];
    const limit = options.limit ?? Infinity;
    const visit = ( parent: Element | ShadowRoot | Document ): void => {
        const roots: ParentNode[] = [parent];
        if ( options.composed && parent instanceof Element && parent.shadowRoot ) {
            roots.unshift( parent.shadowRoot );
        }
        for ( const root of roots ) {
            for ( const child of Array.from( root.children ) ) {
                if ( found.length >= limit ) {
                    return;
                }
                if ( options.reject?.( child ) ) {
                    continue;
                }
                const value = test( child );
                if ( value ) {
                    found.push( { element: child, value } );
                } else {
                    visit( child );
                }
            }
        }
    };
    visit( el );
    return found;
}

/**
 * Every element below `root` in document order, without `root` itself.
 * With `composed`, the shadow tree of an element is visited right after the element, before its light children.
 */
export function* walkElements( root: Element | ShadowRoot | Document, options: WalkOptions = {} ): Generator<Element> {
    const reject = options.reject;
    const walker = document.createTreeWalker( root, NodeFilter.SHOW_ELEMENT, reject
        ? { acceptNode: node => reject( node as Element ) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT }
        : null );
    for ( let node = walker.nextNode(); node; node = walker.nextNode() ) {
        const el = node as Element;
        yield el;
        if ( options.composed && el.shadowRoot ) {
            yield* walkElements( el.shadowRoot, options );
        }
    }
}

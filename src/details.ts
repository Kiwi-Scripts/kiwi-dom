/** The `data-key`s of the expanded `details` in the container. */
export function openKeys( container: ParentNode ): Set<string | undefined> {
    return new Set( Array.from( container.querySelectorAll<HTMLDetailsElement>( 'details[open]' ) ).map( d => d.dataset.key ) );
}

/**
 * Re-renders a container while keeping which `details` are expanded (matched by `data-key`) and the scroll position.
 * A `details` that did not exist before keeps the state the re-render gave it, so new content can start expanded.
 * `details` without a key cannot be matched and are left as rendered.
 */
export function keepState( container: HTMLElement, rerender: () => void ): void {
    const before = new Map<string, boolean>();
    container.querySelectorAll<HTMLDetailsElement>( 'details[data-key]' ).forEach( d => before.set( d.dataset.key!, d.open ) );
    const scrollTop = container.scrollTop;
    rerender();
    container.querySelectorAll<HTMLDetailsElement>( 'details[data-key]' ).forEach( d => {
        const open = before.get( d.dataset.key! );
        if ( open !== undefined ) {
            d.open = open;
        }
    } );
    container.scrollTop = scrollTop;
}

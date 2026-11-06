/** The `data-key`s of the expanded `details` in the container. */
export function openKeys( container: ParentNode ): Set<string | undefined> {
    return new Set( Array.from( container.querySelectorAll<HTMLDetailsElement>( 'details[open]' ) ).map( d => d.dataset.key ) );
}

/**
 * Re-renders a container while keeping which `details` are expanded (matched by `data-key`) and the scroll position.
 * `details` without a key are matched as a group, so give every one a key that you want to keep.
 */
export function keepState( container: HTMLElement, rerender: () => void ): void {
    const open = openKeys( container );
    const scrollTop = container.scrollTop;
    rerender();
    container.querySelectorAll<HTMLDetailsElement>( 'details' ).forEach( d => d.open = open.has( d.dataset.key ) );
    container.scrollTop = scrollTop;
}

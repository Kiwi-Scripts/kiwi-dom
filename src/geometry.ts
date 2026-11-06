export const clamp = ( value: number, min: number, max: number ): number => Math.max( min, Math.min( value, max ) );

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface NearPointOptions {
    /** The gap between the point and the box. Default: 16. */
    offset?: number;
    /** The distance kept to the viewport edges. Default: 8. */
    margin?: number;
    /** Default: the window's inner size. */
    viewport?: Size;
}

/**
 * Where to put a box of `size` so that it appears next to the viewport point `at`.
 * It sits below and to the right of the point and flips to the other side where it would not fit.
 */
export function nearPoint( size: Size, at: Point, options: NearPointOptions = {} ): { left: number; top: number } {
    const { offset = 16, margin = 8 } = options;
    const { width: vw, height: vh } = options.viewport ?? { width: window.innerWidth, height: window.innerHeight };
    const left = at.x + offset + size.width + margin > vw ? at.x - offset - size.width : at.x + offset;
    const top = at.y + offset + size.height + margin > vh ? at.y - offset - size.height : at.y + offset;
    return { left: Math.max( margin, left ), top: Math.max( margin, top ) };
}

/** Shows `box` as an outline over `el` (fixed positioning, viewport coordinates), or hides it if the element is gone. */
export function placeBox( box: HTMLElement, el: Element | null | undefined ): void {
    if ( !el?.isConnected ) {
        box.style.display = 'none';
        return;
    }
    const r = el.getBoundingClientRect();
    Object.assign( box.style, {
        display: 'block', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`
    } );
}

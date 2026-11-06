type EventHandlers = { [K in keyof HTMLElementEventMap]?: ( ev: HTMLElementEventMap[K] ) => void };

export interface ElementProps {
    class?: string;
    /** Sets `textContent`; children are added after it. */
    text?: string;
    title?: string;
    dataset?: Record<string, string>;
    style?: Partial<CSSStyleDeclaration>;
    /** Attributes; `null`, `undefined` and `false` leave the attribute out, `true` sets it empty. */
    attrs?: Record<string, string | number | boolean | null | undefined>;
    on?: EventHandlers;
}

export type Child = Node | string | null | undefined | false;

function apply( el: Element, props: ElementProps, children: Child[] ): void {
    if ( props.class ) {
        el.setAttribute( 'class', props.class );
    }
    if ( props.text !== undefined ) {
        el.textContent = props.text;
    }
    if ( props.title ) {
        el.setAttribute( 'title', props.title );
    }
    for ( const [name, value] of Object.entries( props.attrs ?? {} ) ) {
        if ( value !== null && value !== undefined && value !== false ) {
            el.setAttribute( name, value === true ? '' : String( value ) );
        }
    }
    if ( props.style && 'style' in el ) {
        Object.assign( ( el as HTMLElement ).style, props.style );
    }
    if ( props.dataset && 'dataset' in el ) {
        Object.assign( ( el as HTMLElement ).dataset, props.dataset );
    }
    for ( const [type, handler] of Object.entries( props.on ?? {} ) ) {
        el.addEventListener( type, handler as EventListener );
    }
    el.append( ...children.filter( ( child ): child is Node | string => child !== null && child !== undefined && child !== false ) );
}

/** Creates an HTML element. Children that are `null`, `undefined` or `false` are left out, so they can be conditional. */
export function htmlEl<K extends keyof HTMLElementTagNameMap>( tag: K, props: ElementProps = {}, ...children: Child[] ): HTMLElementTagNameMap[K] {
    const el = document.createElement( tag );
    apply( el, props, children );
    return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Creates an SVG element; numbers in `attrs` are converted, string children become text. */
export function svgEl<K extends keyof SVGElementTagNameMap>( tag: K, attrs: Record<string, string | number> = {}, ...children: ( Node | string )[] ): SVGElementTagNameMap[K] {
    const el = document.createElementNS( SVG_NS, tag );
    for ( const [name, value] of Object.entries( attrs ) ) {
        el.setAttribute( name, String( value ) );
    }
    el.append( ...children );
    return el;
}

/** An icon from the path data of a square viewBox (24 by default, as in most icon sets). */
export function svgIcon( path: string, viewBox = 24 ): SVGSVGElement {
    return svgEl( 'svg', { viewBox: `0 0 ${viewBox} ${viewBox}` }, svgEl( 'path', { d: path } ) );
}

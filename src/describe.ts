import { ancestorsOf } from './tree';

export interface DescribeOptions {
    /** How many classes are listed. Default: 3. */
    maxClasses?: number;
}

/** `tag#id.cls1.cls2.cls3`: short enough for a log line, specific enough to find the element. */
export function describeElement( el: Element, options: DescribeOptions = {} ): string {
    const maxClasses = options.maxClasses ?? 3;
    let text = el.localName;
    if ( el.id ) {
        text += `#${el.id}`;
    }
    for ( const cls of Array.from( el.classList ).slice( 0, maxClasses ) ) {
        text += `.${cls}`;
    }
    return text;
}

export interface Surroundings {
    /** The markup right before the element (the end of the preceding siblings). */
    before: string;
    /** The element's opening tag and the start of its content. */
    inside: string;
    /** The markup right after the element (the start of the following siblings). */
    after: string;
    /** `describeElement` of each ancestor, nearest first. */
    ancestors: string[];
}

export interface SurroundingsOptions {
    /** Characters of markup kept for each of before, inside and after. Default: 50. */
    budget?: number;
    /** Crosses shadow-root boundaries when listing the ancestors. Default: true. */
    composed?: boolean;
}

const ELLIPSIS = '…';

const squash = ( text: string ): string => text.replace( /\s+/g, ' ' ).trim();

function markupOf( node: Node ): string {
    if ( node instanceof Element ) {
        return node.outerHTML;
    }
    if ( node instanceof Comment ) {
        return `<!--${node.data}-->`;
    }
    return node.textContent ?? '';
}

/** Cuts to `budget` characters, marking the cut: from the end with `keepEnd`, otherwise from the start. */
export function truncate( text: string, budget: number, keepEnd = false ): string {
    if ( text.length <= budget ) {
        return text;
    }
    return keepEnd ? ELLIPSIS + text.slice( text.length - budget ) : text.slice( 0, budget ) + ELLIPSIS;
}

/** Collects up to `budget` characters of markup from the siblings on one side of `el`. */
function siblingMarkup( el: Element, budget: number, direction: 'previous' | 'next' ): string {
    let text = '';
    for ( let node = direction === 'previous' ? el.previousSibling : el.nextSibling; node && text.length <= budget; node = direction === 'previous' ? node.previousSibling : node.nextSibling ) {
        text = direction === 'previous' ? markupOf( node ) + text : text + markupOf( node );
        text = squash( text );
    }
    return truncate( text, budget, direction === 'previous' );
}

/** A little of the markup around `el`, to recognise where it is in a page without dumping it. */
export function describeSurroundings( el: Element, options: SurroundingsOptions = {} ): Surroundings {
    const budget = options.budget ?? 50;
    const shallow = el.cloneNode( false ) as Element;
    const opening = shallow.outerHTML.replace( /<\/[^>]*>$/, '' );
    const content = squash( el.innerHTML );
    return {
        before: siblingMarkup( el, budget, 'previous' ),
        inside: truncate( opening + content, budget + opening.length ),
        after: siblingMarkup( el, budget, 'next' ),
        ancestors: Array.from( ancestorsOf( el, { composed: options.composed ?? true } ), a => describeElement( a ) )
    };
}

/** The surroundings as one text, the element between markers: `before ▶ inside ◀ after`, then the ancestors. */
export function formatSurroundings( surroundings: Surroundings ): string {
    const { before, inside, after, ancestors } = surroundings;
    const line = [before, `▶ ${inside} ◀`, after].filter( Boolean ).join( ' ' );
    return ancestors.length ? `${line}\nin ${ancestors.join( ' < ' )}` : line;
}

import { describe, expect, it } from 'vitest';
import { ancestorsOf, closestMatch, nearestDescendants, parentOf, walkElements } from '../src';

function html( markup: string ): HTMLElement {
    const root = document.createElement( 'div' );
    root.innerHTML = markup;
    document.body.append( root );
    return root;
}

const byAttr = ( name: string ) => ( el: Element ) => el.getAttribute( name );

describe( 'closestMatch', () => {
    it( 'finds the nearest ancestor and returns the test value', () => {
        const root = html( '<section data-u="outer"><div data-u="inner"><p id="x"></p></div></section>' );
        const found = closestMatch( root.querySelector( '#x' )!, byAttr( 'data-u' ) );
        expect( found?.value ).toBe( 'inner' );
        expect( found?.element.tagName ).toBe( 'DIV' );
    } );

    it( 'tests the element itself unless includeSelf is false', () => {
        const root = html( '<div data-u="outer"><p id="x" data-u="self"></p></div>' );
        const x = root.querySelector( '#x' )!;
        expect( closestMatch( x, byAttr( 'data-u' ) )?.value ).toBe( 'self' );
        expect( closestMatch( x, byAttr( 'data-u' ), { includeSelf: false } )?.value ).toBe( 'outer' );
    } );

    it( 'returns null when nothing matches', () => {
        const root = html( '<div><p id="x"></p></div>' );
        expect( closestMatch( root.querySelector( '#x' )!, byAttr( 'data-u' ) ) ).toBeNull();
    } );

    it( 'crosses shadow roots only when composed', () => {
        const host = html( '<div data-u="host"></div>' ).firstElementChild!;
        const shadow = host.attachShadow( { mode: 'open' } );
        shadow.innerHTML = '<p id="inner"></p>';
        const inner = shadow.querySelector( '#inner' )!;
        expect( closestMatch( inner, byAttr( 'data-u' ) ) ).toBeNull();
        expect( closestMatch( inner, byAttr( 'data-u' ), { composed: true } )?.value ).toBe( 'host' );
    } );
} );

describe( 'parentOf / ancestorsOf', () => {
    it( 'steps from a shadow root to its host when composed', () => {
        const host = html( '<div></div>' ).firstElementChild!;
        const shadow = host.attachShadow( { mode: 'open' } );
        shadow.innerHTML = '<p id="inner"></p>';
        const inner = shadow.querySelector( '#inner' )!;
        expect( parentOf( inner ) ).toBeNull();
        expect( parentOf( inner, true ) ).toBe( host );
        expect( Array.from( ancestorsOf( inner, { composed: true } ) )[0] ).toBe( host );
    } );
} );

describe( 'nearestDescendants', () => {
    it( 'stops at the first matches and does not report nested ones', () => {
        const root = html( '<div data-u="a"><i data-u="nested"></i></div><p><span data-u="b"></span></p><em data-u="c"></em>' );
        const found = nearestDescendants( root, byAttr( 'data-u' ) );
        expect( found.map( m => m.value ) ).toEqual( ['a', 'b', 'c'] );
    } );

    it( 'skips rejected subtrees', () => {
        const root = html( '<div class="skip"><i data-u="hidden"></i></div><b data-u="seen"></b>' );
        const found = nearestDescendants( root, byAttr( 'data-u' ), { reject: el => el.classList.contains( 'skip' ) } );
        expect( found.map( m => m.value ) ).toEqual( ['seen'] );
    } );

    it( 'honours the limit', () => {
        const root = html( '<i data-u="1"></i><i data-u="2"></i><i data-u="3"></i>' );
        expect( nearestDescendants( root, byAttr( 'data-u' ), { limit: 2 } ) ).toHaveLength( 2 );
    } );

    it( 'looks into shadow roots when composed', () => {
        const root = html( '<div id="host"></div>' );
        const shadow = root.querySelector( '#host' )!.attachShadow( { mode: 'open' } );
        shadow.innerHTML = '<i data-u="inside"></i>';
        expect( nearestDescendants( root, byAttr( 'data-u' ) ) ).toHaveLength( 0 );
        expect( nearestDescendants( root, byAttr( 'data-u' ), { composed: true } ).map( m => m.value ) ).toEqual( ['inside'] );
    } );
} );

describe( 'walkElements', () => {
    it( 'yields descendants in document order without the root', () => {
        const root = html( '<a><b></b></a><c></c>' );
        expect( Array.from( walkElements( root ), el => el.tagName ) ).toEqual( ['A', 'B', 'C'] );
    } );

    it( 'skips rejected subtrees', () => {
        const root = html( '<a><b></b></a><c></c>' );
        const names = Array.from( walkElements( root, { reject: el => el.tagName === 'A' } ), el => el.tagName );
        expect( names ).toEqual( ['C'] );
    } );

    it( 'enters shadow roots when composed', () => {
        const root = html( '<a></a><c></c>' );
        root.querySelector( 'a' )!.attachShadow( { mode: 'open' } ).innerHTML = '<s></s>';
        expect( Array.from( walkElements( root ), el => el.tagName ) ).toEqual( ['A', 'C'] );
        expect( Array.from( walkElements( root, { composed: true } ), el => el.tagName ) ).toEqual( ['A', 'S', 'C'] );
    } );
} );

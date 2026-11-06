import { afterEach, describe, expect, it, vi } from 'vitest';
import { describeElement, describeSurroundings, elementAt, formatSurroundings, truncate } from '../src';

afterEach( () => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
} );

function html( markup: string ): HTMLElement {
    const root = document.createElement( 'div' );
    root.innerHTML = markup;
    document.body.append( root );
    return root;
}

describe( 'describeElement', () => {
    it( 'formats tag, id and at most three classes', () => {
        const root = html( '<SECTION id="main" class="a b c d"></SECTION>' );
        expect( describeElement( root.firstElementChild! ) ).toBe( 'section#main.a.b.c' );
        expect( describeElement( root.firstElementChild!, { maxClasses: 1 } ) ).toBe( 'section#main.a' );
    } );

    it( 'leaves out what is not there', () => {
        expect( describeElement( html( '<p></p>' ).firstElementChild! ) ).toBe( 'p' );
    } );
} );

describe( 'truncate', () => {
    it( 'marks the cut at the end or the start', () => {
        expect( truncate( 'abcdef', 3 ) ).toBe( 'abc…' );
        expect( truncate( 'abcdef', 3, true ) ).toBe( '…def' );
        expect( truncate( 'abc', 3 ) ).toBe( 'abc' );
    } );
} );

describe( 'describeSurroundings', () => {
    it( 'collects the markup around the element and its ancestors', () => {
        const root = html( '<ul class="list"><li>one</li><li id="me" class="x">two <b>bold</b></li><li>three</li></ul>' );
        const s = describeSurroundings( root.querySelector( '#me' )! );
        expect( s.before ).toBe( '<li>one</li>' );
        expect( s.after ).toBe( '<li>three</li>' );
        expect( s.inside ).toBe( '<li id="me" class="x">two <b>bold</b>' );
        expect( s.ancestors.slice( 0, 2 ) ).toEqual( ['ul.list', 'div'] );
    } );

    it( 'keeps to the budget', () => {
        const root = html( '<p>' + 'x'.repeat( 200 ) + '</p><i id="me"></i><p>' + 'y'.repeat( 200 ) + '</p>' );
        const s = describeSurroundings( root.querySelector( '#me' )!, { budget: 10 } );
        expect( s.before.length ).toBeLessThanOrEqual( 11 );
        expect( s.before.startsWith( '…' ) ).toBe( true );
        expect( s.after.endsWith( '…' ) ).toBe( true );
    } );

    it( 'formats as one text', () => {
        const root = html( '<b>a</b><i id="me">m</i><u>z</u>' );
        const text = formatSurroundings( describeSurroundings( root.querySelector( '#me' )! ) );
        expect( text ).toContain( '<b>a</b> ▶ <i id="me">m ◀ <u>z</u>' );
        expect( text ).toContain( 'in div' );
    } );
} );

describe( 'elementAt', () => {
    it( 'looks through skipped elements', () => {
        const root = html( '<p id="page"></p><div id="overlay"></div>' );
        const page = root.querySelector( '#page' )!;
        const overlay = root.querySelector( '#overlay' )!;
        document.elementsFromPoint = () => [overlay, page, document.body];
        expect( elementAt( 1, 1 ) ).toBe( overlay );
        expect( elementAt( 1, 1, { skip: el => el === overlay } ) ).toBe( page );
    } );

    it( 'descends into open shadow roots', () => {
        const root = html( '<div id="host"></div>' );
        const host = root.querySelector( '#host' )!;
        const shadow = host.attachShadow( { mode: 'open' } );
        shadow.innerHTML = '<span id="inner"></span>';
        const inner = shadow.querySelector( '#inner' )!;
        document.elementsFromPoint = () => [host, document.body];
        shadow.elementsFromPoint = () => [inner, host, document.body];
        expect( elementAt( 1, 1 ) ).toBe( inner );
        expect( elementAt( 1, 1, { composed: false } ) ).toBe( host );
    } );

    it( 'returns null where there is nothing', () => {
        document.elementsFromPoint = () => [];
        expect( elementAt( 1, 1 ) ).toBeNull();
    } );
} );

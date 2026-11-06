import { afterEach, describe, expect, it, vi } from 'vitest';
import { clamp, htmlEl, isEditing, keepState, nearPoint, openKeys, placeBox, svgIcon, trackPointer } from '../src';

afterEach( () => {
    document.body.innerHTML = '';
} );

describe( 'isEditing', () => {
    const from = ( el: HTMLElement ): boolean => {
        let result = false;
        document.body.append( el );
        el.addEventListener( 'keydown', ev => result = isEditing( ev ) );
        el.dispatchEvent( new KeyboardEvent( 'keydown', { bubbles: true, composed: true } ) );
        return result;
    };

    it( 'is true for text fields and false for other elements', () => {
        expect( from( document.createElement( 'input' ) ) ).toBe( true );
        expect( from( document.createElement( 'textarea' ) ) ).toBe( true );
        expect( from( document.createElement( 'div' ) ) ).toBe( false );
    } );
} );

describe( 'trackPointer', () => {
    const fire = ( type: string ): void => void document.dispatchEvent( new Event( type ) );

    it( 'reports moves until the pointer is released', () => {
        const onMove = vi.fn();
        const onEnd = vi.fn();
        trackPointer( { onMove, onEnd } );
        fire( 'pointermove' );
        fire( 'pointerup' );
        fire( 'pointermove' );
        expect( onMove ).toHaveBeenCalledTimes( 1 );
        expect( onEnd ).toHaveBeenCalledTimes( 1 );
    } );

    it( 'ends on cancel and can be stopped early without onEnd', () => {
        const a = { onMove: vi.fn(), onEnd: vi.fn() };
        trackPointer( a );
        fire( 'pointercancel' );
        expect( a.onEnd ).toHaveBeenCalledTimes( 1 );

        const b = { onMove: vi.fn(), onEnd: vi.fn() };
        trackPointer( b )();
        fire( 'pointermove' );
        fire( 'pointerup' );
        expect( b.onMove ).not.toHaveBeenCalled();
        expect( b.onEnd ).not.toHaveBeenCalled();
    } );
} );

describe( 'geometry', () => {
    it( 'clamps', () => {
        expect( [clamp( 5, 0, 3 ), clamp( -1, 0, 3 ), clamp( 2, 0, 3 )] ).toEqual( [3, 0, 2] );
    } );

    const viewport = { width: 500, height: 400 };
    const size = { width: 100, height: 50 };

    it( 'puts a box below right of the point', () => {
        expect( nearPoint( size, { x: 100, y: 100 }, { viewport } ) ).toEqual( { left: 116, top: 116 } );
    } );

    it( 'flips where it would not fit and stays inside the margin', () => {
        expect( nearPoint( size, { x: 480, y: 390 }, { viewport } ) ).toEqual( { left: 364, top: 324 } );
        expect( nearPoint( { width: 600, height: 50 }, { x: 10, y: 10 }, { viewport } ).left ).toBe( 8 );
    } );

    it( 'places an outline over a connected element and hides it otherwise', () => {
        const box = htmlEl( 'div' );
        const target = htmlEl( 'p' );
        target.getBoundingClientRect = () => ( { left: 1, top: 2, width: 3, height: 4 } as DOMRect );
        document.body.append( target );
        placeBox( box, target );
        expect( [box.style.display, box.style.left, box.style.top, box.style.width, box.style.height] ).toEqual( ['block', '1px', '2px', '3px', '4px'] );
        target.remove();
        placeBox( box, target );
        expect( box.style.display ).toBe( 'none' );
        placeBox( box, null );
        expect( box.style.display ).toBe( 'none' );
    } );
} );

describe( 'h', () => {
    it( 'builds an element from props and children', () => {
        const click = vi.fn();
        const el = htmlEl( 'button', {
            class: 'a b', text: 'go', title: 'Go', dataset: { key: 'k' }, style: { color: 'red' },
            attrs: { type: 'button', hidden: false, autofocus: true, tabindex: 2, nothing: null }, on: { click }
        }, htmlEl( 'i' ), 'tail', null, false, undefined );
        expect( el.className ).toBe( 'a b' );
        expect( el.title ).toBe( 'Go' );
        expect( el.dataset.key ).toBe( 'k' );
        expect( el.style.color ).toBe( 'red' );
        expect( el.getAttribute( 'tabindex' ) ).toBe( '2' );
        expect( el.hasAttribute( 'autofocus' ) ).toBe( true );
        expect( el.hasAttribute( 'hidden' ) ).toBe( false );
        expect( el.hasAttribute( 'nothing' ) ).toBe( false );
        expect( el.textContent ).toBe( 'gotail' );
        expect( el.children ).toHaveLength( 1 );
        el.click();
        expect( click ).toHaveBeenCalledTimes( 1 );
    } );

    it( 'builds an svg icon', () => {
        const icon = svgIcon( 'M0 0h24v24H0z' );
        expect( icon.getAttribute( 'viewBox' ) ).toBe( '0 0 24 24' );
        expect( icon.firstElementChild?.getAttribute( 'd' ) ).toBe( 'M0 0h24v24H0z' );
        expect( icon.namespaceURI ).toBe( 'http://www.w3.org/2000/svg' );
    } );
} );

describe( 'keepState', () => {
    const detail = ( key: string, open = false ): HTMLDetailsElement => htmlEl( 'details', { dataset: { key }, attrs: { open } } );

    it( 'restores expanded details and the scroll position after a re-render', () => {
        const container = htmlEl( 'div', {}, detail( 'a', true ), detail( 'b' ) );
        document.body.append( container );
        expect( openKeys( container ) ).toEqual( new Set( ['a'] ) );
        container.scrollTop = 7;
        keepState( container, () => container.replaceChildren( detail( 'a' ), detail( 'b' ) ) );
        expect( Array.from( container.querySelectorAll( 'details' ), d => d.open ) ).toEqual( [true, false] );
        expect( container.scrollTop ).toBe( 7 );
    } );
} );

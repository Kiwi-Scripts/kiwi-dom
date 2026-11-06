import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmitter, createScheduler, localStorageAdapter, memoryStorage, webStorage } from '../src';

describe( 'createEmitter', () => {
    it( 'delivers payloads and unsubscribes', () => {
        const emitter = createEmitter<{ a: number }>();
        const listener = vi.fn();
        const off = emitter.on( 'a', listener );
        emitter.emit( 'a', 1 );
        off();
        emitter.emit( 'a', 2 );
        expect( listener.mock.calls ).toEqual( [[1]] );
    } );

    it( 'keeps calling listeners after one throws and reports the error', () => {
        const onError = vi.fn();
        const emitter = createEmitter<{ a: number }>( onError );
        const second = vi.fn();
        emitter.on( 'a', () => {
            throw new Error( 'x' );
        } );
        emitter.on( 'a', second );
        emitter.emit( 'a', 1 );
        expect( second ).toHaveBeenCalledWith( 1 );
        expect( onError ).toHaveBeenCalledWith( expect.any( Error ), 'a' );
    } );

    it( 'allows unsubscribing while being called, and clears', () => {
        const emitter = createEmitter<{ a: undefined }>();
        const second = vi.fn();
        const off = emitter.on( 'a', () => off() );
        emitter.on( 'a', second );
        emitter.emit( 'a', undefined );
        emitter.clear();
        emitter.emit( 'a', undefined );
        expect( second ).toHaveBeenCalledTimes( 1 );
    } );
} );

describe( 'createScheduler', () => {
    beforeEach( () => void vi.useFakeTimers() );
    afterEach( () => void vi.useRealTimers() );

    it( 'absorbs requests while one is pending', () => {
        const run = vi.fn();
        const scheduler = createScheduler( run, 100 );
        scheduler.request();
        scheduler.request();
        vi.advanceTimersByTime( 100 );
        expect( run ).toHaveBeenCalledTimes( 1 );
        scheduler.request();
        vi.advanceTimersByTime( 100 );
        expect( run ).toHaveBeenCalledTimes( 2 );
    } );

    it( 'can be cancelled and starts its timer through runOutside', () => {
        const run = vi.fn();
        const runOutside = vi.fn( ( fn: () => unknown ) => fn() ) as unknown as <T>( fn: () => T ) => T;
        const scheduler = createScheduler( run, 100, runOutside );
        scheduler.request();
        scheduler.cancel();
        vi.advanceTimersByTime( 200 );
        expect( run ).not.toHaveBeenCalled();
        expect( runOutside ).toHaveBeenCalledTimes( 1 );
    } );
} );

describe( 'storage', () => {
    it( 'keeps values in memory', () => {
        const storage = memoryStorage();
        storage.set( 'a', '1' );
        expect( storage.get( 'a' ) ).toBe( '1' );
        storage.remove( 'a' );
        expect( storage.get( 'a' ) ).toBeNull();
    } );

    it( 'namespaces keys of web storage', () => {
        localStorageAdapter( 'p' ).set( 'k', 'v' );
        expect( localStorage.getItem( 'p:k' ) ).toBe( 'v' );
        expect( localStorageAdapter( 'p' ).get( 'k' ) ).toBe( 'v' );
        localStorage.clear();
    } );

    it( 'survives storage that throws', () => {
        const broken = webStorage( () => {
            throw new Error( 'blocked' );
        } );
        expect( () => broken.set( 'a', '1' ) ).not.toThrow();
        expect( broken.get( 'a' ) ).toBeNull();
        expect( () => broken.remove( 'a' ) ).not.toThrow();
    } );
} );

import { describe, expect, it } from 'vitest';

import * as dom from '../src';

describe( '@kiwi-js/dom', () => {
    it( 'loads', () => {
        expect( dom ).toBeDefined();
    } );
} );

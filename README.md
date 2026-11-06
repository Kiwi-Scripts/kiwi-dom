# @kiwi-js/dom

Framework-free DOM helpers. The finders are driven by predicates, so they know nothing about what they are looking for. It has no dependencies and is meant to be shared between kiwi projects; the first user is [`@kiwi-js/debug`](https://github.com/Kiwi-Scripts/kiwi-debug), and several helpers come from [`@kiwi-js/panels`](https://github.com/Kiwi-Scripts/kiwi-panels).

Everything is exported from the package root and tree-shakes (`sideEffects: false`).

## Finding elements

A *test* is `( el ) => value`; a falsy result means "no match", anything else is returned with the element as `{ element, value }`.

| Function | Does |
|---|---|
| `closestMatch( el, test, { includeSelf, composed } )` | The nearest ancestor (by default including `el`) for which `test` matches. |
| `nearestDescendants( el, test, { reject, composed, limit } )` | The topmost matches below `el` in document order; does not descend into a match. |
| `walkElements( root, { reject, composed } )` | A generator over all descendants; rejected subtrees are skipped. |
| `elementAt( x, y, { skip, composed, root } )` | The topmost element at a point; `skip`ped elements (e.g. an overlay) do not hide what lies below. |
| `parentOf( el, composed )`, `ancestorsOf( el, { composed } )` | Parent steps that can cross from a shadow root to its host. |

`composed` crosses open shadow roots, which web-component frameworks need.

## Describing elements

- `describeElement( el, { maxClasses } )` → `tag#id.cls1.cls2.cls3`.
- `describeSurroundings( el, { budget, composed } )` → `{ before, inside, after, ancestors }`, a little markup around the element; `formatSurroundings()` turns it into one text. `truncate( text, budget, keepEnd )` is the cutter it uses.

## From kiwi-panels

- Events: `isEditing( ev )` (is the event from a text field, shadow-DOM aware), `trackPointer( { onMove, onEnd } )` (follow the pointer for a drag until release; returns a canceller).
- Geometry: `clamp`, `nearPoint( size, at, { offset, margin, viewport } )` (place a box next to a point, flipping at the edges), `placeBox( box, el )` (outline an element, or hide the box).
- Building: `h( tag, { class, text, title, dataset, style, attrs, on }, ...children )`, `svgEl`, `svgIcon( path, viewBox )`.
- Details: `openKeys( container )`, `keepState( container, rerender )` keep expanded `details` (by `data-key`) and the scroll position across a re-render; a `details` that is new keeps the state it was rendered with.
- Plain utilities: `createEmitter()` (typed emitter), `createScheduler( run, interval, runOutside )` (throttled refresh; `runOutside` keeps the timer out of a framework's change detection), `memoryStorage()`, `webStorage()`, `localStorageAdapter()`, `sessionStorageAdapter()` (storage that never throws).

`@kiwi-js/panels` still has its own copies of these; moving it over to this package is a separate change.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

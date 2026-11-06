# @kiwi-js/dom

Framework-free DOM helpers, driven by predicates so that they know nothing about what they are looking for. It has no dependencies and is meant to be shared between kiwi projects; the first user is [`@kiwi-js/debug`](https://github.com/Kiwi-Scripts/kiwi-debug).

Planned API:

- `closestMatch( el, test, { includeSelf, composed } )`: the nearest ancestor for which `test` returns a value; `composed` crosses shadow-root boundaries.
- `nearestDescendants( el, test, { reject } )`: depth-first search that stops at the first matches.
- `walkElements( root, { reject } )`: a `TreeWalker` wrapper that skips rejected subtrees.
- `describeElement`, `describeSurroundings`, `elementAt( x, y, { skip } )`.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

# `viz` components (assets/viz/)

Site-wide: md-viewer loads them today (`VIZ_BASE`), md-editor and demo pages can
reuse them. Flat on purpose — one file per algorithm/structure; language is a
component option (`code: { cpp, python }`), not a folder. Old URLs under
`tools/md-viewer/viz/` 301-redirect here.

A fenced block tagged `viz <component>` with a JSON config becomes an
interactive step-through demo (Prev / Next / Play / End-of-group, code panel
with the running line highlighted, variable watch, optional input bar).

| File | Role |
| --- | --- |
| `_player.js` | Shared player UI. A component may declare `meta.switch = { key, label, options: [{ value, label }] }` to get a segmented selector (under the toolbar, styled apart from the action buttons) that re-runs the demo with that param changed (code panel follows; e.g. tree-traversal's order). Expand button opens the block in a near-fullscreen `<dialog>` (the same node is moved, so state survives; components may export `moved(stage, config)` to react, since iframes reload). Hides the toolbar when a demo has only one frame (`.is-static`). `meta.msgPosition: "top"` puts the step note under the toolbar. Rows that are wider than the block must overflow to the right inside a scroll container (`justify-content: safe center` / `align-items: safe center` with `overflow-x: auto`), never off the left edge. |
| `_core.js` | DOM-free helpers: `checkParams`, `withDefaults`, parsing. Param types: `string`, `bool`, `int`, `enum`, `int[]`, `number[]`, `json-array`. |
| `_tree.js` | Shared tree drawing: `treeView(stage, key?).update({ nodes: [{ id, label, col, depth, role, val, badge, dashed }], edges: [{ from, to, role (path | active | red | glue), dashed }] or [{ key, at: [c1, d1, c2, d2] }], cols, rows, empty })`; `heapPlace(i, depth)`. One size, palette and motion for every tree: a node keyed by `id` glides to its new place (edges follow), new ones fade in, removed ones fade out, colours cross-fade. |
| `_array.js` | Shared array drawing on the `.vz-row` / `.vz-cell` styles: `arrayView(stage, key?).update({ cells: [{ id, label, role, dashed, hidden }], index, ptrs, caption })`. A cell keyed by `id` glides when its element changes slot (a swap arcs, a shift slides, a new one pops in); index and pointer rows stay with the slots. |
| `<component>.js` | One component each. Must stay DOM-free at import time (check_md.py runs `validate`/`steps` under node); only `render` touches the DOM. |

## Components

| Component | Lecture | What it shows |
| --- | --- | --- |
| `selection-sort` | 6 | Passes, minIdx, swaps. |
| `arraylist` | 3 | add / insert / remove with shifting; resize (×2 or +1) and shrink at ¼, one copy per step. |
| `linked-list` | 4 | Singly linked list: get / add / remove at head or index, finger + previous walk, splice, bypass + delete. |
| `doubly-linked-list` | 4 | addFirst / addLast / removeFirst / removeLast with head and tail. |
| `stack` | 4–5 | push / pop / peek, top = head; algs4 shorthand `to be - or -`. |
| `queue` | 5 | enqueue / dequeue on an SLL with head and tail; same shorthand. |
| `circular-queue` | 5 | Fixed-capacity circular array: front, n, (front + n) % capacity. |
| `two-stack-eval` | 5 | Dijkstra's two-stack evaluation of fully parenthesized infix. |
| `postfix-eval` | 5 | One-stack postfix evaluation (v2 op v1). |
| `memory-trace` | any | Python Tutor-style stack/heap with pointer arrows; takes memdiag-format steps. |
| `array-2d` | 2 | Row-major layout of a 2D/3D array, offset and address of one element. |
| `doubling-test` | 2 | Doubling hypothesis: ratios, b = lg ratio, a = T/n^b, log-log plot. |
| `insertion-sort` | 7 | Swap version: `arr[j]` swaps left while smaller than `arr[j-1]`, `else break`; comparisons, swaps (= inversions), best/worst counts. |
| `merge-sort` | 8 | Top-down merge sort as a recursion tree (one row per depth, nodes aligned by index): calls appear on the way down, each merge refills its node from the two halves with i/j/k. `mode: "merge"` shows one merge of two sorted halves as aux + a rows. |
| `quick-sort` | 8 | Quicksort with the slides' partition (i/j scans, swap, pivot into a[j]); `mode: "partition"` runs one partition. |
| `binary-tree` | 10 | A binary tree drawn like the slides (heap positions, `"-"` = empty; several trees with `"Label = …"`, separated by a vertical bar), one idea per step via `views`: root, parent:X, siblings:X, ancestors:X, subtree:X, leaves, internal, path:X-Y-Z, depth, height, degree, full, complete (gaps dashed), nulls. No code panel. |
| `tree-traversal` | 10 | Binary tree given by heap positions (`"K, C, N, A, -, B"`): pre-, in-, post-order with the call stack, or level order with the queue (switchable in the demo); output sequence and visit numbers on the nodes. |
| `binary-heap` | 10–12 | Array-backed max/min heap (`pq[0]` unused) drawn as tree + array: `insert(x)` (append + swim), `swim(k)`, `sink(k)`, `delMax()` (`delMin()` with `"order": "min"`), `heapify()` (bottom-up construction, `for k = n/2 … 1: sink(k)`, one step group per k), heap sort's `sortdown()` (last op only; each removed max stays in the array, drawn as the green sorted tail), and `heapsort()` (the whole function: heapify then sortdown; last op only), up to 16 ops; code panel shows only the routines the ops use. |
| `bst` | 12 | Binary search tree drawn by in-order column × depth: `get(k)` (hit / miss, compares = depth + 1), `put(k, v)` (new leaf at the null link, or value update), `remove(k)` by Hibbard deletion (leaf, one child, two children → successor = min of the right subtree, its right child moves up). `keys` = starting insertion order (`k:v` for values), up to 15 nodes and 10 ops; code panel shows only the routines the ops use. |
| `two-three-tree` | 14 | 2-3 search tree, one circle per key with a glue bar joining the keys of a node: `get(k)` (interval search: left / middle / right link), `insert(k)` into a 2-node, into a 3-node (temporary 4-node, split, middle key up, repeat), root split (height + 1). `keys` = starting insertion order. No code panel. |
| `llrb` | 14 | Left-leaning red-black BST (red links drawn red via `_tree.js` edge role `red`): `put(k)` with the BST descent, new red node, then rotateLeft / rotateRight / flipColors on the way up and `root->color = BLACK`; `get(k)`; `check()` tests a given `tree` (heap positions, `*key` = red link) for symmetric order, left-leaning, no two reds, perfect black balance. Switch: LLRB view / 2-3 view (red children on their parent's level). |
| `hash-table` | 15 | Hash table with `put(k, v)` / `get(k)` / `remove(k)`; switch between separate chaining (array of chains, new node at the head, as the slides' `SeparateChaining`), linear probing and quadratic probing ((h + i²) % m) with tombstones (†) that searches skip and inserts reuse. Integer keys use k % m; word keys take their hash from `hashes` ("S:2, E:0"). |
| `recursion-tree` | 6 | Recursion-tree method for T(n) = aT(n/b) + f(n) or T(n-1) + f(n): levels revealed one at a time, per-call work, level totals, sum, and which Master Theorem case dominates. |
| `tokenize` | CS 121 W2 | Early tokenization: read characters one at a time, alphanumerics build a lower-cased token, a space or special character ends it, tokens shorter than `minLen` are dropped. |
| `crawl-frontier` | CS 121 W3 | Basic crawl over a link graph: seeds → FIFO frontier → fetch/store/extract, seen-set, per-host politeness delay, crawler trap, budget. Python panel. |
| `robots-txt` | CS 121 W3 | robots.txt group selection (bot-specific beats `*`), matching rule lines, longest-match vs first-match verdict per URL. Python panel. |
| `utf8-encode` | CS 121 W4 | UTF-8 encoding: code point → binary → the slide's encoding-table row → payload bits into the byte template → bytes in hex; UTF-8 vs UTF-32 byte count. Python panel. |
| `shingle-fingerprint` | CS 121 W4 | N-gram (shingle) fingerprint: hash per n-gram, keep h mod p = 0, fingerprint set; optional second document and \|F_A ∩ F_B\| / \|F_A ∪ F_B\| vs τ. Python panel. |
| `simhash` | CS 121 W4 | Simhash: word weights × hash bits → column sums V → fingerprint; optional second document and bit-agreement vs τ. Python panel. |
| `porter-step1` | CS 121 W5 | Porter stemmer Step 1a + 1b as the slide states them: which suffix rule fires per word, the word after each step (purple = changed by that step, final stem bold). `lang: "zh"` for Chinese text. Python panel. |
| `query-eval` | CS 121 W7 | Ranked query evaluation over postings `doc:count` (score = sum of counts): document-at-a-time (one doc across all lists) vs term-at-a-time (accumulators), switchable; `conjunctive` keeps only docs with every term and shows the skipped postings. Python panel. |
| `incidence-matrix` | CS 121 W5 | Term-document incidence matrix: a Boolean query (AND / OR / NOT, left to right) by bitwise ops on the terms' 0/1 rows, running result row. `lang: "zh"` for Chinese text. Python panel. |
| `inverted-index` | CS 121 W6 | Inverted index construction: (term, docID) pairs per document → sort by term then docID → merge into dictionary (doc. freq.) + postings; `postings`: `docs` / `counts` (docID:count) / `positions` (docID,pos). Python panel. |
| `postings-intersect` | CS 121 W6 | Postings-list intersection (Boolean AND): two pointers over docID-sorted lists, match → answer, else advance the smaller; comparison count vs x + y. Python panel. |
| `tfidf-cosine` | CS 121 W8 | Vector space scoring as the slides' tables: tf-raw → tf weight (n / l / b) → df, idf, wt (t) → length and n'lize (c) → products and their sum. SMART `ddd.qqq` with a query (default lnc.ltc: one score per document) or pairwise cosine between documents (`ddd`). Python panel. |
| `pagerank` | CS 121 W9 | PageRank by iteration over a small link graph (`"A -> B; B -> C; C -> A, B"`, ≤ 8 pages): PR(A) = (1 − d) + d·Σ PR(T)/C(T), all pages start at 1 and update from the previous iteration; first `detail` iterations page by page (in-links highlighted), then one step per iteration until no value changes by 0.0001; dead ends jump to a random page. Graph + iteration table. Python panel. |
| `web-demo` | IN4MATX 133 | Live HTML/CSS/JS in a sandboxed iframe (built lazily near the viewport) with a console. Source tabs: Shiki dark-plus, line numbers, line diff per step (gold = added, red rule = removed, hover the number), auto-scroll to the change, Copy; edits kept per step until Revert. Side by side on wide demos (draggable divider; layout and split remembered in `localStorage` `viz-web-demo-layout` / `viz-web-demo-split`); drag the preview's right edge to change the simulated viewport width. Preview sits in a browser-window frame (white page = real browser default). "Code Runner" hands the current code to `tools/code-runner/?from=viz` via `localStorage.cr-web-transfer`; Code Runner's Web mode imports `pageDocument()` from this file. Optional steps (cumulative CSS/JS, HTML replace, viewport width) and `libs` (bootstrap, mathjs, moment, vega-lite). |

## Component contract

```js
export const meta = { name, summary, groupLabel, params: { … }, example: { … } };
export function validate(config) { return [/* error strings */]; }   // use checkParams + own checks
export function steps(config) { return [ { msg, lines, group, vars: [[name, value], …], …state } ]; }
export function render(stage, frame) { /* draw one frame */ }
export const code = { cpp: [ "…" ] };       // optional; keep lines ≤ 48 chars; or code(config) returning that object
export const legend = [ { cls, label } ];   // optional; or legend(config) returning that list
export const input = { key, label, format, parse, random };   // optional (for "interactive": true)
```

A frame with `swap: [p, q]` gets a swap animation from the player (the two cells of the first `.vz-row` trade places along arcs) when stepping forward, so array components only need to set `swap`.

**Trees and arrays are drawn with `_tree.js` / `_array.js`, never by hand.** A
component describes each frame as data (`steps()` stays DOM-free) and gives
every element a stable id that follows it through swaps, shifts and moves (a
parallel `ids` array, as in `selection-sort.js` and `bst.js`), so the shared
views animate it. States are the shared roles, the same names as the legend
swatches: `cmp`, `min`, `swap`, `sorted`, `ghost`, `out`, `dim`, `unused` (several
at once as a list). Set the same `cols` / `rows` on every frame of a tree so the
drawing keeps one size. This is what keeps every demo's size, colours, layout
and motion the same; a new kind of picture that neither covers gets a shared
module of its own rather than private drawing code.

**Language.** The player passes the page language as `config._lang` (`"en-US"`
or `"zh-CN"`; md-viewer is English). Every text a reader sees comes in both
languages: in `steps()` / `legend(config)` / `code(config)` take
`const T = tr(config)` from `_core.js` and write `T("English", "中文")`; text
drawn by `render()` is put on the frame (e.g. `frame.ui`), since `render` gets
no config. `groupLabel`, switch labels, `input.label` and legend labels may be
`{ en, zh }` (the player picks one; `pick()` in `_core.js`). Code identifiers
and code panels stay as they are. The build runs `steps()` in both languages.
`input.parse` errors are still English only (parse gets no config).

Anything else a component needs (layout around the views, labels) injects its
own CSS once (`<style id="viz-<name>-style">`) using the player's `--vz-*`
colour variables, so light and dark themes both work.

## Common params (every component)

| Param | Default | Meaning |
| --- | --- | --- |
| `title` | none | Caption above the demo |
| `interactive` | `false` | Input bar (edit the data, Random) under the demo |
| `start` | `1` | 1-based step to open on |

Unknown params, wrong types or out-of-range values show a red error box on the
page (and fail the notes skill's `check_md.py`), never a half-working demo.
md-editor and the Ask AI widget see only the raw JSON, so a note must still
make sense without the demo.

## Adding a component

Name it after the algorithm/structure, not a course or week, and add it only
when a note needs it. Check `steps()` under node for several inputs (the final
state must be right), `chmod 644` the file, add a row to the table above, and
add it to the notes skill's `references/viz-components.md` (the skill may only
use listed components).

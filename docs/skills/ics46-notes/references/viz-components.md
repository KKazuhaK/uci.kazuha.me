# Interactive demos (`viz` blocks)

Kazuha's site turns a fenced block tagged `viz <component>` into a
step-through demo: Prev / Next / Play / End-of-group buttons, the structure
with colour-coded markers, a one-line explanation per step, the C++ code with
the running line highlighted (most components), and a variable-watch panel.
The body of the block is a JSON config on one line:

````markdown
```viz linked-list
{"title": "remove(2) (Activity 1)", "items": "!, ?, ROCKS, ICS46", "ops": "remove(2)"}
```
````

The block lives inside the `.md` file, so the note is still one file. The
components live in his site repo (`KKazuhaK/uci.kazuha.me`,
`public/assets/viz/<component>.js`, served at
https://ics.uci.edu/~kazuhak/assets/viz/); `check_md.py --site-repo <clone>`
loads them from the clone (or from `--viz-dir`) and runs each block's config through the
component's own validator — the same check the site build runs, and a
broken block fails the whole build. The site's assets/viz/ is the source of truth for component code; this file documents names and params only. Bug fixes on the site need no skill update — only a new component or a changed param does.
To read a component's code (e.g. to learn its config), read it in the
clone (or, without the repo, run `scripts/fetch_viz.sh` and use the
downloaded copies).

**These demos replace static diagrams.** Kazuha's standing preference (Oct
2026): every step-by-step picture or data-structure state is a `viz` demo,
not a Mermaid diagram or a memdiag trace. Mermaid is only a fallback for a
static picture no component can show (and then say so on the report's
`wanted:` line).

## Available components

Use **only** these (or ones you add — see "Adding a component"). A name that
doesn't exist on the site fails `check_md.py` and the site build.

Common params on every component:

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | string | none | Caption above the demo, e.g. `"Slides 27–35"`. |
| `interactive` | bool | `false` | Input bar (edit the ops/expression, Random) so readers try their own. |
| `start` | int ≥ 1 | `1` | Step to open on — land on the moment the text discusses. |

Unknown params are errors, not ignored — don't invent options. Most
components also take `code`: `"cpp"` (default, shows the code panel) or
`"none"`.

### Ops syntax (arraylist, linked-list, doubly-linked-list, stack, queue, circular-queue)

`ops` is a string of calls separated by `;`: `add(ICS46); add(1, Throws); remove()`.
Items are bare words or `"quoted strings"` (1–8 chars). `stack`, `queue` and
`circular-queue` also accept the algs4 shorthand the slides use:
`"To be or not to - be - - that - - - is"` (a word pushes/enqueues it, `-`
pops/dequeues). A config that would throw (pop on empty, index out of range,
full circular queue) is a validation error, so the demo always runs.

### `arraylist` (Lec 3)

Lecture 3 ArrayList: `add(x)` appends, `add(i, x)` inserts with right
shifts, `remove()` removes the last item, `remove(i)` shifts left, `get(i)`.
Full → resize (one frame per copied element), `n ≤ capacity/4` after a
remove → halve. Vars: size, capacity, copies, shifts, returned.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `ops` | string | required | ≤ 14 calls; size ≤ 16, capacity ≤ 32. |
| `capacity` | int 1–8 | `2` | Initial capacity (Lecture 3 default 2). |
| `growth` | `"double"` \| `"plus1"` | `"double"` | `"plus1"` shows the Θ(n²) copying of slide 44. |
| `shrink` | bool | `true` | Halve at ¼ full. |

### `linked-list` (Lec 4)

Singly linked list, Lecture 4 API: `add(x)` and `remove()` work at the
**head**; `add(i, x)`, `remove(i)`, `get(i)` walk with `finger` (+ `previous`).
Shows the splice (new node drawn "not in the list" with its `next` before
`previous->next` is set) and bypass-then-delete.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `ops` | string | required | ≤ 10 calls, ≤ 8 nodes. |
| `items` | string | `""` | Starting list head first, comma-separated: `"!, ?, ROCKS, ICS46"`. |
| `tail` | bool | `false` | Also maintain and show `tail`. |

### `doubly-linked-list` (Lec 4)

`addFirst(x)`, `addLast(x)`, `removeFirst()`, `removeLast()` with head and
tail, each O(1). Params: `ops` (required), `items`.

### `stack` (Lec 4–5)

Stack with top = head of an SLL: `push(x)`, `pop()`, `peek()` or the
shorthand. Shows the stack top-first and the popped item. Param: `ops`.

### `queue` (Lec 5)

Queue on an SLL with head (front) and tail (rear): `enqueue(x)`, `dequeue()`,
`peek()` or the shorthand. The last dequeue shows `tail = nullptr`. Param: `ops`.

### `circular-queue` (Lec 5)

Fixed-capacity circular array: `front`, `n`, rear slot `(front + n) % capacity`;
dequeued slots keep their stale value, drawn dashed. Params: `ops`,
`capacity` (2–10, default 5).

### `two-stack-eval` (Lec 5)

Dijkstra's two-stack algorithm on a **fully parenthesized** infix
expression, tokens space-separated: `"( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )"`.
Integers 0–9999, `+ - * /` (integer division). Param: `expression`.

### `postfix-eval` (Lec 5)

One-stack postfix evaluation, shows v1 (right operand, popped first) and v2:
`"5 1 2 + 4 * + 3 -"`. Param: `expression`.

### `memory-trace` (any lecture with pointers)

Python Tutor-style: stack frames left, heap objects right, every variable
and field shown, pointer arrows from the exact field, overwritten values
struck through, stale targets dashed with ×, deleted objects dashed
"(deleted)". The config is the **memdiag step format** (see
`scripts/memdiag.py --help`): the first step gives full `stack` and `heap`,
later steps may be incremental with `set`, `add_heap`, `add_vars`,
`push_frame`, `pop_frame`, `free`. Values `"->id"` point at a heap object
(or `"->frame.var"` with `"ref": true` for a reference), `"nullptr"`,
`"dangling"`; optional `"old"` and `"old_target"`.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `steps` | array | required | 1–12 steps, each `{ "code": "…", "note": "…", … }`. No `code` panel: each step's `code` is shown in the message. |

Keep each step one meaningful change; 2–4 steps per trace.

Keep traces small: about 4–6 heap objects at most, short variable/field
names where the slide allows. Big object graphs get crowded on phones even
with the routing; split them into two demos or use `linked-list` /
`doubly-linked-list` for list shapes. For a C++ reference to another variable
(`int*& s = p`), use `"value": "->main.p", "ref": true` — it is drawn as an
alias on the frame's left side.

### `array-2d` (Lec 2)

Row-major layout of `int a[R][C]` or `int a[D][R][C]`: walks the elements in
memory order (grid + flat block), then locates one element with the offset
formula and address.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `dims` | int[2–3], each 1–8 | required | At most 48 elements. |
| `find` | int[] | none | One index per dimension, e.g. `[2, 3]`. |
| `base` | int | `1000` | Address of `a[0][0]` (illustrative). |
| `elemSize` | int | `4` | sizeof one element. |
| `walk` | bool | `true` | `false` = jump straight to the lookup (needs `find`). |

### `doubling-test` (Lec 2)

Adds measurements one at a time to a log-log plot, with ratio T(n)/T(n/2),
b ≈ lg ratio, and finally a = T(n)/n^b with the fitted slope.

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `n` | int[3–10] | required | Increasing input sizes (doubling). |
| `times` | number[3–10] | required | Same length; zeros are skipped as "too small to time". |
| `unit` | string | `"s"` | Unit label. |

### `selection-sort` (Lec 6)

Each pass: `minIdx = i`, compare `a[j] < a[minIdx]`, then
`swap(a[i], a[minIdx])`. Params: `array` (2–12 ints, -99…999), `code`.
Good input: `[38, 3, 5, 47, 44, 36, 26, 1]` (swaps happen, and one pass is a
no-op swap).

### `insertion-sort` (Lec 7)

Swap version from the slides: for each `i`, `j` walks left swapping
`arr[j]` with `arr[j-1]` while `arr[j] < arr[j-1]`, `else break`. Vars `pass`,
`j`, `inserting`, `comparisons`, `swaps`; the end step states swaps = inversions
and the best/worst counts. Params: `array` (2–12 ints, -99…999), `code`.
Good input: `[3, 44, 38, 5, 47, 1, 36, 26]` (early breaks and full walks to
index 0 both happen).

### `merge-sort` (Lec 8)

Top-down merge sort drawn as a recursion tree: each `sort(lo, hi)` call is a
node (one row per depth); each `merge()` refills its node from the two halves
below, picking `aux[i]` or `aux[j]` for every `k`. Mode `merge` instead shows
the aux and a rows for one merge.
Params: `items` (string, comma-separated ints or 1–3 char words, 2–16 items),
`mode` (`"sort"` | `"merge"`, default sort), `mid` (mode merge only: last
index of the left half; both halves must be sorted), `code`.
Good inputs: `"M, E, R, G, E, S, R, T"`; merge mode `"A, G, L, O, R, H, I, M, S, T"`, `mid: 4`.

### `quick-sort` (Lec 8)

Sedgewick partition from the slides: pivot `a[lo]`, `i` scans right while
`a[i] < v`, `j` scans left while `v < a[j]`, swap, stop when they cross, then
swap `a[lo]` with `a[j]`. Input is taken as already shuffled. Params: `items`
(same format as merge-sort), `mode` (`"sort"` | `"partition"`), `code`.
Good input: `"3, 7, 8, 5, 2, 1, 9, 5, 4"`.

### `recursion-tree` (Lec 6)

Recursion-tree method: expands T(n) = aT(n/b) + f(n) level by level, sums the
levels, reads off the Big-O. Params: `recurrence` (required, e.g.
`"T(n) = 2T(n/2) + n"`, `"T(n) = T(n/2) + c"`, `"T(n) = b + T(n-1)"`), `n`,
`base` (default `"c"`), `code` (`"none"` | `"factorial"`, the slide's
factorial for the subtract form).

### `binary-tree` (Lec 10)

Draws a binary tree and highlights one idea per step. Params: `tree`
(required; heap positions, `-` = empty, several trees separated by `|`, each
optionally `"Label = …"`), `views` (`;`-separated: plain, root, leaves,
internal, depth, height, degree, full, complete, nulls, parent:X, siblings:X,
ancestors:X, subtree:X, path:X-Y-Z). No code panel.
Example: `{"tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "root; leaves; subtree:N; height"}`.

### `tree-traversal` (Lec 10)

Pre / in / post-order (recursive, call stack shown) or level-order (queue).
Params: `tree` (required, heap positions), `order` (`pre` | `in` | `post` |
`level`, also a switch above the stage), `code`.

### `binary-heap` (Lec 11–12)

Array-backed heap shown as tree and array: `insert(x)`, `swim(k)`, `sink(k)`,
`delMax()` / `delMin()`, `heapify()`, `sortdown()`, `heapsort()` (the last two
must be the last op). Params: `heap` (level order, ≤ 15), `ops` (required,
`;`-separated, ≤ 16), `order` (`max` | `min`), `code`.
Example: `{"heap": "100, 19, 36, 17, 3, 25, 1, 2, 7", "ops": "insert(47)"}`.

### `bst` (Lec 12)

`get(k)` hit / miss, `put(k)` / `put(k, v)`, `remove(k)` by Hibbard deletion.
Params: `keys` (starting tree, put in this order, `k:v` gives a value),
`ops` (required, ≤ 10), `code`.

### `two-three-tree` (Lec 14)

2-3 search tree, one circle per key with a glue bar joining a node's keys:
`get(k)` (left / middle / right interval) and `insert(k)` into a 2-node, into
a 3-node (temporary 4-node, split, middle key up, repeat), root split. Params:
`keys` (starting insertion order), `ops` (required: `insert(k)` / `put(k)`,
`get(k)`, ≤ 16). No code panel. To reproduce a slide's tree, search for an
insertion order that builds it (the Lec 14 anatomy tree is
`"R, C, X, E, S, P, M, L, A, H, J"`).

### `llrb` (Lec 14)

Left-leaning red-black BST, red links drawn red: `put(k)` (BST descent, red
new node, then rotateLeft / rotateRight / flipColors on the way up, root
black), `get(k)`, and `check()` (symmetric order, left-leaning, no two reds,
black balance — for "which trees are legal LLRBs" activities). Params: `keys`
(start by putting these) or `tree` (heap positions, `*key` = red link from the
parent), `ops` (≤ 12; empty = just show the tree), `view` (`llrb` | `23`, a
switch: `23` draws red children on their parent's level = the 2-3 tree),
`code`.

### `rb-rotation` (Lec 14)

One statement per step of `rotateLeft` / `rotateRight` / `flipColors`, alone
or chained in put()'s order, ending with put()'s `root->color = BLACK` when
needed and a check that the tree is a legal LLRB again. Nodes are filled red /
black, `h` and `x` are tags above the nodes, in-between states are real
(shared child after `h->right = x->left`; a parent keeps pointing at h until
`return x`). Code panel = only the functions used. Params: `op` (required:
`"rotateLeft"`, `"rotateRight, flipColors"`, or with h per op
`"rotateLeft(10), rotateRight(30), flipColors"`), `tree` (heap positions,
`*key` red; default = a state put() really reaches for that op), `h`, `code`.
Defaults: rotateLeft `20, 10, *40, -, -, 30, 50`; rotateRight + flipColors
`30, *20, -, *10` (put(10)); flipColors `40, 20, 50, *10, *30` with h = 20;
the chain above on `30, *10, -, -, *20` (put(20)).

### `hash-table` (Lec 15)

`put(k)` / `put(k, v)`, `get(k)`, `remove(k)` with a switch between separate
chaining (new node at the head of the chain, as the slides' code), linear
probing and quadratic probing ((h + i²) % m), tombstones (†) that searches
skip and inserts reuse. A full table / unreachable slot is a step ("insert
fails"), not an error. Params: `m` (required, 2–16), `ops` (required, ≤ 16;
`put(k)` without a value stores the put count 0, 1, 2 …), `mode`, `hashes`
(word keys: `"S:2, E:0"`; integers use k % m), `code`.

## How to use them in notes

- Put the block right after the explanation (and the slide's code) for the
  concept, before the complexity discussion. At most one demo per concept
  section (an Activity solution may add one more as a check).
- Introduce it in one sentence so readers know it's interactive, e.g.
  "Step through it below (← / → keys work when the demo is focused):".
- The demo adds to the explanation and never replaces it: keep the slide's
  trace table / the one-line text description, because md-editor and the
  Ask AI widget see only the JSON.
- Use the slide's own example (and say so in the `title`: `"Slides 9–15"`),
  so the demo matches what was shown in class. Use `start` to open on the
  interesting step (e.g. the resize).
- Mark the main demo for each structure/algorithm `"interactive": true`;
  demos for a specific worked example or an activity check stay fixed.
- Examples you choose yourself (not a slide's own trace) use **numbers**, not
  letters — Kazuha reads them faster. Keep a slide's letters only when the
  demo reproduces that slide's example.
- Show an operation only on a state the algorithm **really reaches**, and
  make the demo end in a valid structure (or run on to the step that makes it
  valid). E.g. a lone rotateRight on a legal LLRB leaves a right-leaning red
  link — show `"rotateRight, flipColors"` on the state put() produces instead.
  Check the final state against the structure's rules before inserting.
- Before putting a demo in, simulate it: run the component's `steps` under
  node (or `<kit>/scripts/viz_preview.py`) and check the final state matches the
  slide (sizes, return values, results).

## Adding a component

When a lecture needs a demo that doesn't exist (heap sift-up, BST insert,
hash probing, recursion tree, graph BFS/DFS …), **write it** — Kazuha adds
new components to his site repo himself:

**Organisation:** components stay **flat** in `public/assets/viz/`, one file per
algorithm/structure, named by what it shows (`binary-heap.js`, `bst-insert.js`)
— not by course, week or language. If a component needs code in another
language, add it as another key of its `code` object
(`code: { cpp: [...], python: [...] }`) and another value of its `code`
option, never a copy in a language folder.

0. Run `scripts/fetch_viz.sh` first and work from the downloaded copies
   (`_core.js`, `_player.js` and the existing components).
1. Follow the component contract (`meta`, `validate`,
   `steps`, `render`, optional `code` / `legend` / `input`) — read a
   fetched component such as `selection-sort.js` as the reference. Import
   `./_core.js`, and draw trees / arrays only through the shared
   `./_tree.js` / `./_array.js` views (node roles cmp, min, swap, sorted,
   ghost, dim, rbred, rbblack; a `tag` pill for pointer names like h / x, with
   a 0.6 top offset; edge roles path, active, red, glue); keep everything DOM-free at import time (check_md runs
   `validate` + `steps` under node); only `render` touches the DOM and injects
   its own `<style id="viz-<name>-style">` using the player's `--vz-*` colours.
   Copy the small ops parser from an existing component instead of importing
   a shared helper (check_md stages only `_core.js`, `_tree.js`, `_array.js`
   + the named file). Step messages are plain text with `backticks`; the
   player doesn't render `**bold**` (the asterisks show). Every frame must
   show the whole structure — re-link a rotated subtree to its parent at
   once, or nodes vanish mid-operation and glide back from the wrong place.
   Rows wider than the block must overflow to the right inside an
   `overflow-x: auto` container (`justify-content: safe center` /
   `align-items: safe center`), never off the left edge.
2. Keep code-panel lines ≤ 48 characters (the viewer's panel clips beyond
   that) and make every `lines` index point at the statement just executed.
3. Validation errors must name the param and say what's wrong; a config that
   would throw at run time is a validation error.
4. Test: node (validate the example and some bad configs, run `steps`, check
   the final state), then `python3 -I <kit>/scripts/viz_preview.py notes.md
   --viz <fetched dir with the new file added> --out <work>/shots` and look
   at the screenshots.
5. Put the file in the clone's `public/assets/viz/` and run
   `check_md.py notes.md --site-repo <clone>` — see SKILL.md Step 5.
6. Add its row to `public/assets/viz/README.md` (component · lecture · what
   it shows) and commit both with the note (SKILL.md Step 6); without the
   repo, deliver them next to the note. Add its name and params to this file.

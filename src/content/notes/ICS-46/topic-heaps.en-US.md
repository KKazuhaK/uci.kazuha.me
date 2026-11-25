---
title: "Heaps & Priority Queues"
summary: "Heap order, array representation, swim/insert, sink/delete max, the priority queue ADT and its implementations, min-heaps, and naive vs bottom-up heap construction."
topics:
  - heaps
kind: "topic"
order: 506
---

# Information and Computer Science 46 — Topic: Heaps & Priority Queues

## Table of Contents

- [1. Heap-Ordered Binary Trees](#1-heap-ordered-binary-trees)
- [2. Array Representation of a Binary Heap](#2-array-representation-of-a-binary-heap)
- [3. Swim and Insert](#3-swim-and-insert)
- [4. Sink and Delete the Maximum](#4-sink-and-delete-the-maximum)
- [5. Priority Queues](#5-priority-queues)
- [6. Heap Construction](#6-heap-construction)
- [7. Complete Implementation](#7-complete-implementation)
- [8. Quick Reference & Top 5 Things to Remember](#8-quick-reference--top-5-things-to-remember)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh. This note gathers heaps and priority queues from Lectures 10–12, organized by concept.

## 1. Heap-Ordered Binary Trees

**Definition.** A binary tree is **heap-ordered** if the key in each node is **≥ the keys in its two children** (if any). Equivalently, each node's key is ≤ its parent's key. Consequences:

- **No child assumption**: nothing says whether the left or the right child is smaller.
- Moving **up** from any node gives a **non-decreasing** sequence of keys; moving **down** gives a non-increasing one.
- So the **largest key is at the root**.

That is a **max-heap**. Flip every comparison and you get a **min-heap** (parent ≤ children, smallest key at the root). Examples:

| | Root | Level 1 | Level 2 | Level 3 |
|---|---|---|---|---|
| Max-heap | 100 | 19, 28 | 17, 3 (under 19) · 25, 1 (under 28) | 2, 7 (under 17) |
| Min-heap | 1 | 3, 2 | 7, 19 (under 3) · 25, 28 (under 2) | 17, 100 (under 7) |

Heap order only constrains each parent–child pair, not nodes on different paths: in the max-heap, 3 (level 2) is smaller than 7 (level 3), which is fine because 7 hangs under 17, not under 3.

> 📘 **Beyond the lecture**: In a heap of n keys about half the nodes (⌈n/2⌉) are leaves, and the **minimum of a max-heap can be any of them** — finding it takes O(n). A heap is only "sorted" along each root-to-leaf path. (algs4 §2.4 web exercises)

## 2. Array Representation of a Binary Heap

A **binary heap** is a heap-ordered **complete** binary tree (see [Trees](topic-trees.en-US.md) for complete trees) stored in an array in **level order**:

- nothing at index 0; the root is at index 1;
- the rest follow level by level, left to right;
- because the tree is complete there are no holes, so **no wasted space** and **no pointers** (a pointer-based tree spends three pointers — parent, left, right — per node).

**Index math (1-based):** for the node at index $k$

$$\text{parent} = \lfloor k/2 \rfloor, \qquad \text{children} = 2k \text{ and } 2k + 1$$

Moving up or down the tree is just arithmetic on indices — direct indexed access is much faster than following pointers, the same advantage an ArrayList has over a linked list.

Example: max-heap 100 / 19, 36 / 17, 3, 25, 1 / 2, 7 (this is the heap used in the practice problems below):

| index | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| pq[i] | – | 100 | 19 | 36 | 17 | 3 | 25 | 1 | 2 | 7 |

Check: 17 is at index 4 → parent ⌊4/2⌋ = 2 (19), children 8 and 9 (2 and 7). A letter heap: `– T S R P N O A E I H G` (T root; S, R; P, N, O, A; E, I, H, G).

> 📘 **Beyond the lecture**: An array sorted in **decreasing** order is always a valid max-heap: every parent index k is smaller than its children's indices 2k and 2k+1, so its key is at least as large. (algs4 §2.4 exercise)

## 3. Swim and Insert

### 3.1 Swim (Promote, Percolate Up)

**Scenario:** a key becomes **larger than its parent**, violating heap order. **Fix:** exchange it with its parent, and repeat until heap order is restored (it reaches a larger parent, or the root). Also called *reheapify bottom-up*.

```cpp
void swim(size_t k) {
    while (k > 1 && less(k/2, k)) {
        exch(k, k/2);
        k = k/2;
    }
}
```

`less(i, j)` compares `pq[i] < pq[j]` and `exch(i, j)` swaps them (the same helpers as in sorting, see [Sorting](topic-sorting.en-US.md)). Example: the key at index 5 becomes T in `– S P R G T O A E I H G`; T swaps with P (index 2), then with S (index 1):

```viz binary-heap
{"title": "swim(5)", "heap": "S, P, R, G, T, O, A, E, I, H, G", "ops": "swim(5)"}
```

Result: `– T S R G P O A E I H G`. Each iteration moves up one level, so swim is O(log n) (height of a complete tree).

> 📘 **Beyond the lecture**: Why one exchange never breaks order *below*: after swapping, the risen key is larger than its old parent (that's why it moved) and therefore larger than the old parent's other child too. The only possible new violation is with the next parent up — which is exactly what the loop checks. (algs4 §2.4)

### 3.2 Heap Insertion

**Insert:** add the new key **at the end of the bottom level** (the next free array slot, which keeps the tree complete), then **swim it up**.

```cpp
void insert(const Key& x) {
    pq[++n] = x;
    swim(n);
}
```

**Cost:** at most $\log n + 1$ compares — one per level on the path to the root, so **O(log n)**.

Example: insert S into `– T P R N H O A E I G`. S lands at index 11 (child of H); S > H → exchange; S > P → exchange; S < T → stop. Result `– T S R N P O A E I G H`.

```viz binary-heap
{"title": "insert(S)", "heap": "T, P, R, N, H, O, A, E, I, G", "ops": "insert(S)", "interactive": true}
```

Another example, on the max-heap `– 100 19 36 17 3 25 1 2 7`: inserting 47 lands it at index 10 (child of 3). 47 > 3 → swap; 47 > 19 → swap; 47 < 100 → stop. Array: `– 100 47 36 17 19 25 1 2 7 3`.

> ⚠️ **Pitfall**: `pq[++n]` is **pre**-increment: n becomes the new size first, then the key goes into `pq[n]`. With `pq[n++] = x` the key would go into the old `pq[n]` and **overwrite the last key**, because the heap lives in `pq[1..n]` (index 0 unused).

### 3.3 Practice

#### Heap insertion

Insert 47 in the max-heap `– 100 19 36 17 3 25 1 2 7`.

- **Task 1:** Show each step of the insert
- **Task 2:** Show the array representation of the resulting binary heap
- **Task 3:** What is the worst-case time complexity of insert?

> Hint: the new key goes into index 10 — whose child is that?

<details>
<summary>Solution</summary>

**Task 1:** 47 goes to `pq[10]`, the **left** child of index 5 (key 3), since 2·5 = 10. Swim: 47 > 3 → exchange (47 now at 5); 47 > 19 → exchange (47 now at 2); 47 < 100 → stop.

**Task 2:** `– 100 47 36 17 19 25 1 2 7 3`

**Task 3:** O(log n) — at most one exchange per level on the path to the root (≤ log n + 1 compares).

```viz binary-heap
{"title": "Exercise check: insert(47)", "heap": "100, 19, 36, 17, 3, 25, 1, 2, 7", "ops": "insert(47)"}
```

</details>

## 4. Sink and Delete the Maximum

### 4.1 Sink (Demote, Top-Down Heapify)

**Scenario:** a key becomes **smaller than one (or both) of its children**. **Fix:** exchange it with its **larger** child, and repeat until heap order is restored (both children smaller, or it reaches the bottom).

```cpp
void sink(int k) {
    while (2*k <= n) {
        int j = 2*k;
        if (j < n && less(j, j+1))
            j++;
        if (!less(k, j))
            break;
        exch(k, j);
        k = j;
    }
}
```

Line by line: `2*k <= n` — k still has a left child; `j = 2*k` — start at the left child; `j < n && less(j, j+1)` — if a right child exists and is larger, use it; `!less(k, j)` — k is not smaller than its larger child, done; otherwise exchange and continue from j.

Example: in `– T H R P S O A E I N G` the key H at index 2 is smaller than its children P and S. H swaps with S (index 5), then with N (index 10), and stops at the bottom. Result `– T S R P N O A E I H G`.

```viz binary-heap
{"title": "sink(2)", "heap": "T, H, R, P, S, O, A, E, I, N, G", "ops": "sink(2)"}
```

Sink also walks one root-to-leaf path: O(log n), with **2 compares per level** (pick the larger child, then compare with it).

> ⚠️ **Pitfall**: Exchange with the **larger** child, not the left one. If H swapped with P instead of S, P would end up above S — a new violation.

### 4.2 Delete the Maximum

**Delete max**: exchange the root with the node at the end, remove it from the heap (and return it), then **sink** the new root down. For a min-heap the same code returns (and deletes) the minimum.

```cpp
Key delMax() {
    Key max = pq[1];
    exch(1, n--);
    sink(1);
    return max;
}
```

`exch(1, n--)` swaps `pq[1]` with `pq[n]` and *then* shrinks n, so the old maximum sits just past the end of the heap and is no longer part of it.

**Cost: at most 2 log n compares.** Why 2 log n and not log n? Sink does **two compares per level** — one to pick the larger child (`less(j, j+1)`), one to compare the key with that child (`less(k, j)`) — and walks at most log n levels. Swim (insert) needs only one compare per level, since a node has one parent: at most log n + 1.

Example: delete the max from `– T S R N P O A E I G H`. T and H are exchanged, T leaves the heap, then H sinks: H < S → swap; H < P → swap; H > G → stop. Result `– S P R N H O A E I G`.

```viz binary-heap
{"title": "delMax() on T S R N P O A E I G H", "heap": "T, S, R, N, P, O, A, E, I, G, H", "ops": "delMax()", "interactive": true}
```

> ⚠️ **Pitfall**: After `exch(1, n--)` the new root is the old *last* key, which is usually one of the smallest — so it almost always sinks most of the way down. Don't sink from index n or swim from the root; delMax only ever calls `sink(1)`.

### 4.3 Running Time of Heap Operations

| Operation | Worst case | Why |
|---|---|---|
| Insertion | O(log n) | append + swim along one leaf-to-root path |
| Delete max | O(log n) | exch + sink along one root-to-leaf path (≤ 2 log n compares) |
| Find max | O(1) | it's `pq[1]` |
| Space | O(n) | one array slot per key (plus the unused `pq[0]`) |

The algs4 *2.4 Binary Heap Demo* animates insert and delete max on a letter heap.

> 📘 **Beyond the lecture**: With a fixed-size array the log n bounds are worst case. If the array grows by doubling on insert (and shrinks on delete), as with the ArrayList, the bounds become **amortized** O(log n) — an occasional insert also pays O(n) for the copy. (algs4 §2.4, practical considerations)

### 4.4 Practice

All of these start from the max-heap `– 100 19 36 17 3 25 1 2 7` ([§2](#2-array-representation-of-a-binary-heap)).

#### Heap sink

Sink 7 to its appropriate place in this binary heap: `– 19 7 36 17 3 25 1 2` (7 at index 2).

- **Task 1:** Show each step of the sink
- **Task 2:** Show the array representation of the resulting binary heap
- **Task 3:** What is the worst-case time complexity of sink?

<details>
<summary>Solution</summary>

**Task 1:** 7's children are 17 (index 4) and 3 (index 5); the larger is 17, and 7 < 17 → exchange (7 now at 4). Its only child is 2 (index 8); 7 > 2 → stop.

**Task 2:** `– 19 17 36 7 3 25 1 2`

**Task 3:** O(log n) — one level per exchange, two compares per level (≤ 2 log n compares).

```viz binary-heap
{"title": "Exercise check: sink(2)", "heap": "19, 7, 36, 17, 3, 25, 1, 2", "ops": "sink(2)"}
```

</details>

#### Delete the maximum

Starting from the max-heap above:

**(01) Single Delete** — call delete max and show the state of the heap.

**(02) Complexity** — what is the worst-case time complexity of deleteMax?

**(03) Array Trace** — call delete max 9 times on the original heap and show the values in the array.

> Hint: after the exchange, sink always moves toward the *larger* child.

<details>
<summary>Solution</summary>

**(01)** Exchange 100 with the last key 7 and remove 100. Sink 7: children 19 and 36 → exchange with 36 (7 at index 3); children 25 and 1 → exchange with 25 (7 at index 6); index 6 has no children → stop. Heap: `– 36 19 25 17 3 7 1 2`, returns 100.

**(02)** O(log n): one root-to-leaf path, at most 2 log n compares.

**(03)** The nine calls return `100 36 25 19 17 7 3 2 1` (decreasing order). Because each call parks the removed max at the end of the shrinking heap, the array itself becomes `– 1 2 3 7 17 19 25 36 100` — sorted ascending (the idea behind heap sort, see [Sorting](topic-sorting.en-US.md)).

Array after each call (`|` marks the end of the heap; keys to its right were removed and parked there by `exch(1, n--)`):

| Call | Returns | `pq[1..9]` |
|---|---|---|
| 1 | 100 | 36 19 25 17 3 7 1 2 \| 100 |
| 2 | 36 | 25 19 7 17 3 2 1 \| 36 100 |
| 3 | 25 | 19 17 7 1 3 2 \| 25 36 100 |
| 4 | 19 | 17 3 7 1 2 \| 19 25 36 100 |
| 5 | 17 | 7 3 2 1 \| 17 19 25 36 100 |
| 6 | 7 | 3 1 2 \| 7 17 19 25 36 100 |
| 7 | 3 | 2 1 \| 3 7 17 19 25 36 100 |
| 8 | 2 | 1 \| 2 3 7 17 19 25 36 100 |
| 9 | 1 | \| 1 2 3 7 17 19 25 36 100 |

The demo below drops each removed key from the drawing instead of parking it, so it ends with an empty heap; the table shows the in-place array.

```viz binary-heap
{"title": "Nine delMax() calls", "heap": "100, 19, 36, 17, 3, 25, 1, 2, 7", "ops": "delMax(); delMax(); delMax(); delMax(); delMax(); delMax(); delMax(); delMax(); delMax()"}
```

</details>

## 5. Priority Queues

### 5.1 The Priority Queue ADT

A **priority queue** serves the **best element first**, in contrast to a FIFO queue (oldest first) or a LIFO stack (newest first). It has two key operations:

1. **Delete (return) the maximum** — retrieves the top-priority element;
2. **Insert** — adds a new element with its priority.

Practical applications: operating systems (load balancing, interrupt handling), compression (Huffman coding), AI (A\* search), graph search (Dijkstra's and Prim's algorithms). The key question: *how can we implement a priority queue efficiently?*

Example: insert 5, 1, 9, then delete max → 9; insert 7, delete max → 7. A FIFO queue would have returned 5 then 1.

### 5.2 Implementations

| Implementation | Insert | Delete maximum | Idea |
|---|---|---|---|
| Option 1: unordered array ("lazy") | O(1) | O(n) | append instantly; deletion scans the whole array for the max |
| Option 2: ordered array ("eager") | O(n) | O(1) | keep it sorted so the max is at the end; insertion shifts elements |
| Option 3: binary heap ("optimal balance") | O(log n) | O(log n) | tree structure gives logarithmic time for both |

Arrays force an extreme trade-off between O(1) and O(n); a binary heap brings both operations to logarithmic time, which is why it is the standard choice for the priority queue ADT. Over m operations of each kind, the arrays cost O(mn) in the worst case and the heap O(m log n).

> 📘 **Beyond the lecture**: The "best" choice depends on the mix. With a huge number of inserts and only a few delete-max calls, an unordered array wins (O(1) inserts). With many find-max calls and few updates, an ordered array wins (the max is always at the end). The heap is the choice when both operations are frequent. (algs4 §2.4 exercises)

### 5.3 Min-Heaps and delMin

A **min-heap** keeps each key **≤** its children, so the minimum is at the root. The code is the max-heap code with every comparison flipped (`less(a, b)` becomes "a is greater than b"), and delete max becomes **delMin**: swap the root with the last key, remove it, sink the new root toward the *smaller* child.

Running 12 operations on a min-heap (insert P, Q, E, delete min, insert X, A, M, delete min, insert P, L, E, delete min) returns **E, A, E** and leaves `– L P M Q P X`. Step through it below (← / → keys work when the demo is focused):

```viz binary-heap
{"title": "A priority queue on a min-heap", "ops": "insert(P); insert(Q); insert(E); delMin(); insert(X); insert(A); insert(M); delMin(); insert(P); insert(L); insert(E); delMin()", "order": "min", "interactive": true}
```

> ⚠️ **Pitfall**: Duplicate keys are allowed. In step 9 the second P is inserted while a P is already in the heap; `less` is strict, so an equal key stops swimming as soon as it meets an equal parent and never swaps with it.

### 5.4 Practice

#### Priority queue on a min-heap

Perform the following operations in a PQ based on a min-heap (note: draw the contents of the heap at end of each step):

| | | | |
|---|---|---|---|
| 1. Insert P | 4. Delete min | 7. Insert M | 10. Insert L |
| 2. Insert Q | 5. Insert X | 8. Delete min | 11. Insert E |
| 3. Insert E | 6. Insert A | 9. Insert P | 12. Delete min |

> Hint: in a min-heap a key swims up while it is *smaller* than its parent.

<details>
<summary>Solution</summary>

Heap array in level order after each step:

| Step | Operation | Returns | Heap |
|---|---|---|---|
| 1 | insert P | | P |
| 2 | insert Q | | P Q |
| 3 | insert E | | E Q P |
| 4 | delete min | E | P Q |
| 5 | insert X | | P Q X |
| 6 | insert A | | A P X Q |
| 7 | insert M | | A M X Q P |
| 8 | delete min | A | M P X Q |
| 9 | insert P | | M P X Q P |
| 10 | insert L | | L P M Q P X |
| 11 | insert E | | E P L Q P X M |
| 12 | delete min | E | L P M Q P X |

Key steps: in step 6, A swims from index 4 past Q and P to the root; in step 10, L swims past X and M to the root; in step 12, the last key M moves to the root and sinks to index 3. The demo in [§5.3](#53-min-heaps-and-delmin) steps through all twelve operations.

</details>

## 6. Heap Construction

To turn an arbitrary array `a[1..n]` into a max-heap there are **two ways**, and they are easy to mix up because both end with a heap. They differ in direction, in the operation they use (swim vs sink), and in cost. Both are shown on the array `[2, 9, 7, 6, 5, 8]` (n = 6).

### 6.1 Method A: Naive (Top-Down), Insert One Key at a Time

The heap **grows from the left**. At first only `a[1]` is a heap; each step lets the next key join at the end of the heap and **swims** it up while it is larger than its parent. This is n `insert`s done in place (inserting into an empty heap moves nothing, so the loop starts at k = 2):

```cpp
for (int k = 2; k <= n; k++)   // a[1..k-1] is already a heap
    swim(a, k);                // a[k] joins it: swim up past smaller parents
```

| Step | New key | Swim | Heap after |
|---|---|---|---|
| k = 1 | 2 | — (alone) | 2 |
| k = 2 | 9 | 9 > 2 → swap | 9 2 |
| k = 3 | 7 | 7 < 9 → stays | 9 2 7 |
| k = 4 | 6 | 6 > 2 → swap; 6 < 9 → stop | 9 6 7 2 |
| k = 5 | 5 | 5 < 6 → stays | 9 6 7 2 5 |
| k = 6 | 8 | 8 > 7 → swap; 8 < 9 → stop | 9 6 8 2 5 7 |

The demo writes each step as `insert(x)`, which is the same append + swim:

```viz binary-heap
{"title": "Method A: insert 2, 9, 7, 6, 5, 8 one at a time", "ops": "insert(2); insert(9); insert(7); insert(6); insert(5); insert(8)"}
```

**Cost:** the k-th key can swim up to log k levels. In the worst case (ascending input: every new key is the new maximum and swims all the way to the root) that is log 1 + log 2 + … + log n = **O(n log n)**.

### 6.2 Method B: Optimal (Bottom-Up), Sink from n/2 Down to 1

Take the whole array **as it is** as a complete binary tree (it already is one, in level order):

1. View the array as a complete binary tree;
2. **Ignore all leaves** (indices n/2 + 1, …, n) — a single node is already a heap;
3. Sink every other node, going **right to left**, from the last internal node back to the root:

```cpp
for ( int k = n/2; k >= 1; k-- )
    sink(a, k, n);
```

**Key insight:** after `sink(a, k, n)` completes, the subtree rooted at k is a heap. Sinking right to left means both children of k are already heaps when k is processed, so one sink fixes the whole subtree; after `sink(a, 1, n)` the whole array is a heap.

**Why does n/2 give the first node to process?** Node k has a left child exactly when 2k ≤ n, i.e. k ≤ n/2. The last node, n, has parent ⌊n/2⌋, so ⌊n/2⌋ is the last node with any child; every index above it is a leaf. With n = 11 the loop starts at k = 5; with n = 6 at k = 3.

`sink(a, k, n)` is the heap's `sink` taking the array and its size as arguments (so heap sort can work on any array); its body is the same as `sink(k)` in [§4.1](#41-sink-demote-top-down-heapify).

Trace on `S O R T E X A M P L E` (n = 11):

| Step | Call | What moves | Array after |
|---|---|---|---|
| a) | start (arbitrary order) | — | S O R T E X A M P L E |
| b) | sink(5, 11) | E swaps with its larger child L | S O R T L X A M P E E |
| c) | sink(4, 11) | T ≥ M, P: no move | S O R T L X A M P E E |
| d) | sink(3, 11) | R swaps with X | S O X T L R A M P E E |
| e) | sink(2, 11) | O swaps with T, then with P | S T X P L R A M O E E |
| f) | sink(1, 11) | S swaps with X, stops above R and A | X T S P L R A M O E E |

```viz binary-heap
{"title": "Bottom-up heap construction", "heap": "S, O, R, T, E, X, A, M, P, L, E", "ops": "heapify()", "interactive": true}
```

The same on `[2, 9, 7, 6, 5, 8]` (n = 6, so the loop starts at k = 6/2 = 3):

| Step | Call | What moves | Array after |
|---|---|---|---|
| start | (arbitrary order) | — | 2 9 7 6 5 8 |
| k = 3 | sink(3, 6) | 7 < its only child 8 → swap | 2 9 8 6 5 7 |
| k = 2 | sink(2, 6) | 9 ≥ 6 and 5 → no move | 2 9 8 6 5 7 |
| k = 1 | sink(1, 6) | 2 swaps with 9, then with 6 | 9 6 8 2 5 7 |

Step through it below. The code panel follows the `for` loop and the `sink` it calls (← / → keys work when the demo is focused; the skip button ⏭ jumps to the next k):

```viz binary-heap
{"title": "Method B: bottom-up construction on [2, 9, 7, 6, 5, 8]", "heap": "2, 9, 7, 6, 5, 8", "ops": "heapify()", "interactive": true}
```

**Cost:** **O(n)** — most nodes sit near the bottom and can sink only a little; [§6.4](#64-why-bottom-up-construction-is-on) adds it up.

### 6.3 The Two Methods Side by Side

| | A: naive (top-down) | B: bottom-up |
|---|---|---|
| Idea | n inserts: the heap grows from the left, one key at a time | fix the whole array in place, from the last internal node back to the root |
| Loop | `for k = 2 … n: swim(a, k)` | `for k = n/2 … 1: sink(a, k, n)` |
| A key moves | **up** (swim, toward the root) | **down** (sink, toward the leaves) |
| Leaves | every key is swum, leaves included | leaves are skipped (already heaps) |
| Worst case | O(n log n) | **O(n)** |
| On `[2, 9, 7, 6, 5, 8]` | 9 6 8 2 5 7 (3 exchanges) | 9 6 8 2 5 7 (3 exchanges) |
| On `[1, 2, 3, 4, 5, 6, 7]` | 7 4 6 1 3 2 5 (10 exchanges) | 7 5 6 4 2 1 3 (4 exchanges) |
| Typical use | a priority queue whose keys arrive over time | heap sort's phase 1 (all keys are there up front) |

On the first array both methods happen to produce the same heap. In general they don't (the last row): both results are valid heaps, just different ones. So a question asking for the "bottom-up" result must be answered with method B.

> ⚠️ **Pitfall**: Method B's loop runs **right to left** (n/2 down to 1). Going left to right breaks it: when you sink k, its children's subtrees must already be heaps.

> ⚠️ **Pitfall**: Don't swap the operations. Construction A **swims** (each new key moves up); construction B **sinks** (each internal node moves down). Swimming the keys from n/2 down to 1 is neither method and doesn't build a heap.

### 6.4 Why Bottom-Up Construction Is O(n)

Sinking a node costs at most its **height** (distance to the leaves), and most nodes are near the bottom. Count per level (height 0 = leaves):

| Height h | # nodes at height h | Max sink cost | Work per level |
|---|---|---|---|
| 0 (leaves) | ~ n/2 | 0 | 0 |
| 1 | ~ n/4 | 1 | (n/4) · 1 |
| 2 | ~ n/8 | 2 | (n/8) · 2 |
| … | … | … | … |
| h | ~ n / 2^(h+1) (1 at the root) | h (log n at the root) | (n / 2^(h+1)) · h |

Total work = n/2 · 0 + n/4 · 1 + n/8 · 2 + … + 1 · log n = n (0/2 + 1/4 + 2/8 + 3/16 + …) ≤ n · 1 = **O(n)**.

**The shifting method** shows the series is at most 1. Let S = 1/4 + 2/8 + 3/16 + 4/32 + …. Then S/2 = 1/8 + 2/16 + 3/32 + …. Subtracting term by term:

S − S/2 = 1/4 + 1/8 + 1/16 + … = 1/2 (a geometric series), so S = 1.

Compare: naive construction inserts one key at a time, and late inserts can swim log n levels, so it is **O(n log n)**. The bottom-up method is faster because the few nodes that can move far (near the root) are the ones that get sunk, while the many leaves cost nothing.

> 💡 **Key Insight**: Naive insertion pays log n for the *many* nodes at the bottom; bottom-up sinking pays log n only for the *one* node at the top.

### 6.5 From a Heap to Heap Sort

Heap sort = phase 1 (bottom-up construction, method B) + phase 2 (sortdown: repeatedly move the maximum to the back). Both phases call the **same `sink`**, with different arguments: phase 1 sinks **every internal k** with the **full n**; phase 2 always sinks the **root 1**, with an n that **shrinks** by one each round. The sortdown, the full `heapSort` listing, its analysis and the sorting summary are in [Sorting](topic-sorting.en-US.md).

### 6.6 Practice

#### Heap construction

**Part 1.** Run heap construction on the array [2,9,7,6,5,8]. Show each step.

**Part 2.** What is the worst-case time complexity of naive heap construction? (Inserting 1 element at a time)

**Part 3.** What is the worst-case time complexity of optimized heap construction?

> Hint: n = 6, so the first call is `sink(3, 6)`.

<details>
<summary>Solution</summary>

**Part 1:** `sink(3, 6)`: 7 < 8 → swap → `2 9 8 6 5 7`; `sink(2, 6)`: 9 is larger than 6 and 5 → no move; `sink(1, 6)`: 2 < 9 → swap, then 2 < 6 → swap → **`9 6 8 2 5 7`** (3 exchanges in total).

**Part 2:** **O(n log n)** — n insertions, each O(log n).

**Part 3:** **O(n)** — most nodes sit near the bottom and sink only a short distance; the series n · Σ h/2^(h+1) ≤ n. See [§6.2](#62-method-b-optimal-bottom-up-sink-from-n2-down-to-1) and [§6.4](#64-why-bottom-up-construction-is-on).

</details>

## 7. Complete Implementation

`MaxPQ` and `MinPQ` use a growing `std::vector` instead of a fixed array, and `size_t` for `swim` and `sink` (the slides use `size_t` in `swim` but `int` in `sink`; mixing `int k` with a `size_t n` gives a signed/unsigned comparison warning). The free functions `sink(a, k, n)` and `heapify` are the bottom-up construction.

```cpp
#include <iostream>
#include <string>
#include <utility>
#include <vector>

// Max-oriented priority queue on a binary heap, pq[0] unused.
template <typename Key>
class MaxPQ {
private:
    std::vector<Key> pq{Key{}};   // pq[0] unused
    size_t n = 0;

    bool less(size_t i, size_t j) const { return pq[i] < pq[j]; }
    void exch(size_t i, size_t j) { std::swap(pq[i], pq[j]); }
    void swim(size_t k) {
        while (k > 1 && less(k/2, k)) {
            exch(k, k/2);
            k = k/2;
        }
    }
    void sink(size_t k) {
        while (2*k <= n) {
            size_t j = 2*k;
            if (j < n && less(j, j+1)) j++;
            if (!less(k, j)) break;
            exch(k, j);
            k = j;
        }
    }

public:
    bool isEmpty() const { return n == 0; }
    size_t size() const { return n; }
    void insert(const Key& x) {
        pq.push_back(x);              // slide: pq[++n] = x;
        ++n;
        swim(n);
    }
    Key delMax() {
        Key max = pq[1];
        exch(1, n--);
        sink(1);
        pq.pop_back();                // drop the old maximum from the vector
        return max;
    }
    void load(const std::vector<Key>& keys) {   // as-is, for the activities
        pq.assign(1, Key{});
        pq.insert(pq.end(), keys.begin(), keys.end());
        n = keys.size();
    }
    void sinkAt(size_t k) { sink(k); }
    void print() const {
        for (size_t i = 1; i <= n; i++) std::cout << pq[i] << ' ';
        std::cout << '\n';
    }
};

// Min-oriented version: same code with less() flipped.
template <typename Key>
class MinPQ {
private:
    std::vector<Key> pq{Key{}};
    size_t n = 0;
    bool greater(size_t i, size_t j) const { return pq[j] < pq[i]; }
    void exch(size_t i, size_t j) { std::swap(pq[i], pq[j]); }
    void swim(size_t k) {
        while (k > 1 && greater(k/2, k)) { exch(k, k/2); k = k/2; }
    }
    void sink(size_t k) {
        while (2*k <= n) {
            size_t j = 2*k;
            if (j < n && greater(j, j+1)) j++;
            if (!greater(k, j)) break;
            exch(k, j);
            k = j;
        }
    }
public:
    void insert(const Key& x) { pq.push_back(x); ++n; swim(n); }
    Key delMin() {
        Key min = pq[1];
        exch(1, n--);
        sink(1);
        pq.pop_back();
        return min;
    }
    void print() const {
        for (size_t i = 1; i <= n; i++) std::cout << pq[i] << ' ';
        std::cout << '\n';
    }
};

// Heap construction on a 1-based array a[1..n].
template <typename Key>
void sink(std::vector<Key>& a, size_t k, size_t n) {
    while (2*k <= n) {
        size_t j = 2*k;
        if (j < n && a[j] < a[j+1]) j++;
        if (!(a[k] < a[j])) break;
        std::swap(a[k], a[j]);
        k = j;
    }
}
template <typename Key>
void heapify(std::vector<Key>& a) {           // a[0] unused
    size_t n = a.size() - 1;
    for (size_t k = n/2; k >= 1; k--) {
        sink(a, k, n);
        std::cout << "  after sink(" << k << ", " << n << "): ";
        for (size_t i = 1; i <= n; i++) std::cout << a[i] << ' ';
        std::cout << '\n';
    }
}

int main() {
    std::vector<int> h = {100, 19, 36, 17, 3, 25, 1, 2, 7};

    MaxPQ<int> a; a.load(h); a.insert(47);
    std::cout << "insert 47: "; a.print();

    MaxPQ<int> b; b.load({19, 7, 36, 17, 3, 25, 1, 2}); b.sinkAt(2);
    std::cout << "sink 7:    "; b.print();

    MaxPQ<int> c; c.load(h);
    std::cout << "delMax -> " << c.delMax() << ", heap: "; c.print();

    MaxPQ<int> d; d.load(h);
    std::cout << "9 x delMax:";
    while (!d.isEmpty()) std::cout << ' ' << d.delMax();
    std::cout << '\n';

    MaxPQ<char> L;
    for (char ch : std::string("TPRNHOAEIG")) L.insert(ch);
    std::cout << "letter heap: "; L.print();
    L.insert('S');
    std::cout << "+S:          "; L.print();

    MaxPQ<char> s2;
    s2.load({'T','H','R','P','S','O','A','E','I','N','G'});
    s2.sinkAt(2);
    std::cout << "sink 2:      "; s2.print();

    MinPQ<char> m;
    std::cout << "min-heap operations:\n";
    std::string ops[] = {"P","Q","E","-","X","A","M","-","P","L","E","-"};
    int step = 1;
    for (const std::string& op : ops) {
        std::cout << "  " << step++ << ". ";
        if (op == "-") std::cout << "delMin -> " << m.delMin() << " | ";
        else { m.insert(op[0]); std::cout << "insert " << op << " | "; }
        m.print();
    }

    std::vector<char> v = {' ', 'S','O','R','T','E','X','A','M','P','L','E'};
    std::cout << "heap construction:\n";
    heapify(v);
}
```

Output:

```text
insert 47: 100 47 36 17 19 25 1 2 7 3 
sink 7:    19 17 36 7 3 25 1 2 
delMax -> 100, heap: 36 19 25 17 3 7 1 2 
9 x delMax: 100 36 25 19 17 7 3 2 1
letter heap: T P R N H O A E I G 
+S:          T S R N P O A E I G H 
sink 2:      T S R P N O A E I H G 
min-heap operations:
  1. insert P | P 
  2. insert Q | P Q 
  3. insert E | E Q P 
  4. delMin -> E | P Q 
  5. insert X | P Q X 
  6. insert A | A P X Q 
  7. insert M | A M X Q P 
  8. delMin -> A | M P X Q 
  9. insert P | M P X Q P 
  10. insert L | L P M Q P X 
  11. insert E | E P L Q P X M 
  12. delMin -> E | L P M Q P X 
heap construction:
  after sink(5, 11): S O R T L X A M P E E 
  after sink(4, 11): S O R T L X A M P E E 
  after sink(3, 11): S O X T L R A M P E E 
  after sink(2, 11): S T X P L R A M O E E 
  after sink(1, 11): X T S P L R A M O E E 
```

The loop in `heapify` uses `size_t k` to match `n`. That is safe only because the loop stops at `k >= 1` — a `size_t` loop running down to 0 would wrap around instead of going negative.

## 8. Quick Reference & Top 5 Things to Remember

| Operation (binary heap, n keys) | Worst case | Compares |
|---|---|---|
| insert (append + swim) | O(log n) | ≤ log n + 1 |
| delMax / delMin (exch + sink) | O(log n) | ≤ 2 log n |
| find max / min | O(1) | 0 |
| naive construction (n inserts) | O(n log n) | swim each key |
| bottom-up construction | O(n) | sink each k from n/2 down to 1 |
| space | O(n) | |

| Priority queue as | Insert | Delete max |
|---|---|---|
| unordered array | O(1) | O(n) |
| ordered array | O(n) | O(1) |
| binary heap | O(log n) | O(log n) |

**Top 5 things to remember**

1. A max-heap is a heap-ordered complete binary tree stored in `pq[1..n]`: parent ⌊k/2⌋, children 2k and 2k+1, the maximum at the root.
2. Insert = put the key at `pq[++n]` and swim up (one compare per level); delMax = `exch(1, n--)` then `sink(1)` (two compares per level, always toward the larger child).
3. Both operations are O(log n) because they follow one root-leaf path; find max is O(1).
4. A priority queue serves the best element first; unordered or ordered arrays make one operation O(n), the binary heap makes both O(log n). A min-heap is the same code with comparisons flipped.
5. Build a heap bottom-up (sink k = n/2 … 1, right to left) in O(n); n naive inserts (swim) cost O(n log n) and may give a different heap.

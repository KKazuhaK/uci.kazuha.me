---
title: "Heap Sort & BSTs"
summary: "Heap construction (naive O(n log n) vs bottom-up O(n)), sortdown, heap sort analysis and the sorting summary, then binary search trees: symmetric order, the Node class, search, insert, tree shape and height, and Hibbard deletion."
---

# Information and Computer Science 46 — Lecture 12: Heap Sort, Binary Search Trees

## Table of Contents

- [1. Heap Construction: Naive vs Bottom-Up](#1-heap-construction-naive-vs-bottom-up)
- [2. Why Bottom-Up Construction Is O(n)](#2-why-bottom-up-construction-is-on)
- [3. Sortdown](#3-sortdown)
- [4. Heap Sort Analysis and the Sorting Summary](#4-heap-sort-analysis-and-the-sorting-summary)
- [5. Binary Search Trees](#5-binary-search-trees)
- [6. The Node Class](#6-the-node-class)
- [7. Search](#7-search)
- [8. Insert](#8-insert)
- [9. Tree Shape and Running Time](#9-tree-shape-and-running-time)
- [10. Hibbard Deletion](#10-hibbard-deletion)
- [11. BST Summary: Deletion Makes Trees Lopsided](#11-bst-summary-deletion-makes-trees-lopsided)
- [12. Complete Implementation](#12-complete-implementation)
- [13. In-class Activities (with Solutions)](#13-in-class-activities-with-solutions)
- [14. Quick Reference & Top 5 Things to Remember](#14-quick-reference--top-5-things-to-remember)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh, Fall 2026, 11/05/26 (the title slide still says 11/03/26)
> Built from the Lecture 12 slides (which repeat the heap sort and BST slides from the end of the Lecture 11 deck; the heap-vs-BST comparison slide is taken from the Lecture 11 deck), with algs4 §2.4 Priority Queues (heapsort) and §3.2 Binary Search Trees as supplements. Organized by concept, not by source.

> 📅 **Class logistics**: Quiz 4 Fri 11/6 (Sorting, Trees, Heaps) · Midterm Thu 11/12 · No HW or Lab until after the midterm
> Midterm topics: templates, randomness, pointers, references, smart pointers, multidimensional data; analysis of algorithms, ArrayList, Linked List, circular array; Stacks, Queues, Deques; amortized analysis, analysis of recursion; comparison-based sorting
> Midterm prep: sample midterm (to be provided), quizzes, lecture activities, homeworks, labs — lab implementations will be covered
> AI tool access needs the 2-part consent form (stored data not used for academic integrity issues; research consent = 1% extra credit, an alternate extra-credit method will be provided)

---

## 1. Heap Construction: Naive vs Bottom-Up

Heap sort's first phase turns an arbitrary array `a[1..n]` into a max-heap. There are two ways to do it:

- **Naive (top-down):** insert the keys one at a time — each insert is an append plus a swim, O(log n). n insertions → **O(n log n)**.
- **Optimized (bottom-up):** treat the array as a complete binary tree, skip the leaves, and sink every internal node from `k = n/2` down to `k = 1` (introduced in [Lecture 11](lec-11.en-US.md#8-optimal-bottom-up-heap-construction)):

```cpp
for (int k = n/2; k >= 1; k--)
    sink(a, k, n);
```

Slide 6's worked answer on `[2, 9, 7, 6, 5, 8]` (n = 6, so the loop starts at k = 6/2 = 3):

| Step | Call | What moves | Array after |
|---|---|---|---|
| start | (arbitrary order) | — | 2 9 7 6 5 8 |
| k = 3 | sink(3, 6) | 7 < its only child 8 → swap | 2 9 8 6 5 7 |
| k = 2 | sink(2, 6) | 9 ≥ 6 and 5 → no move | 2 9 8 6 5 7 |
| k = 1 | sink(1, 6) | 2 swaps with 9, then with 6 | 9 6 8 2 5 7 |

Step through it below (← / → keys work when the demo is focused):

```viz binary-heap
{"title": "Slide 6: bottom-up construction on [2, 9, 7, 6, 5, 8]", "heap": "2, 9, 7, 6, 5, 8", "ops": "sink(3); sink(2); sink(1)", "interactive": true}
```

> ⚠️ **Pitfall**: The loop runs **right to left** (n/2 down to 1). Going left to right breaks it: when you sink k, its children's subtrees must already be heaps.

> 📝 **Practice**: [Activity: Heap Construction](#131-activity-heap-construction-slide-5) — run it by hand, then name the naive and optimized worst cases.

## 2. Why Bottom-Up Construction Is O(n)

Sinking a node costs at most its **height** (distance to the leaves), and most nodes are near the bottom. Count per level (height 0 = leaves):

| Height h | # nodes at height h | Max sink cost | Work per level |
|---|---|---|---|
| 0 (leaves) | ~ n/2 | 0 | 0 |
| 1 | ~ n/4 | 1 | (n/4) · 1 |
| 2 | ~ n/8 | 2 | (n/8) · 2 |
| … | … | … | … |
| h | ~ n / 2^(h+1) (1 at the root) | h (log n at the root) | (n / 2^(h+1)) · h |

Total work = n/2 · 0 + n/4 · 1 + n/8 · 2 + … + 1 · log n = n (0/2 + 1/4 + 2/8 + 3/16 + …) ≤ n · 1 = **O(n)**.

**The shifting method** (the slide's hint) shows the series is at most 1. Let S = 1/4 + 2/8 + 3/16 + 4/32 + …. Then S/2 = 1/8 + 2/16 + 3/32 + …. Subtracting term by term:

S − S/2 = 1/4 + 1/8 + 1/16 + … = 1/2 (a geometric series), so S = 1.

Compare: naive construction inserts one key at a time, and late inserts can swim log n levels, so it is **O(n log n)**. The bottom-up method is faster because the few nodes that can move far (near the root) are the ones that get sunk, while the many leaves cost nothing.

> 💡 **Key Insight**: Naive insertion pays log n for the *many* nodes at the bottom; bottom-up sinking pays log n only for the *one* node at the top.

## 3. Sortdown

Phase 2: remove the maximum one at a time, but **leave it in the array** instead of nulling it out. `exch(a, 1, n--)` swaps the max into the last heap slot and shrinks the heap, so that slot is now outside the heap and holds its final value.

```cpp
while (n > 1) {
    exch(a, 1, n--);
    sink(a, 1, n);
}
```

**Key insight (slide):** after each iteration the array is a **heap-ordered subarray followed by a subarray in final sorted order**. Ascending output comes from a *max*-heap, because each max is placed at the back.

Slide 9 traces sortdown on the algs4 example (the heap built from `S O R T E X A M P L E`, i.e. `X T S P L R A M O E E`): `exch(1, 11), sink(1, 10)`, `exch(1, 10), sink(1, 9)`, … down to `exch(1, 2), sink(1, 1)`, ending with `A E E L M O P R S T X`. Slide 10 links the algs4 *2.4 Heapsort Demo*. Step through it below:

```viz binary-heap
{"title": "Slide 9: sortdown on X T S P L R A M O E E", "heap": "X, T, S, P, L, R, A, M, O, E, E", "ops": "sortdown()", "interactive": true}
```

**Cost:** n − 1 iterations, each one exchange plus a sink of O(log n) → **O(n log n)** in the worst case.

> ⚠️ **Pitfall**: `sink(a, 1, n)` must use the **already decremented** n. Sinking with the old n would pull the just-placed maximum back into the heap.

> 📝 **Practice**: [Activity 1](#132-activity-1-sortdown-slide-11) — sortdown on the heap from §1 and its worst case.

## 4. Heap Sort Analysis and the Sorting Summary

Heap sort = bottom-up construction + sortdown.

| Phase | Exchanges and compares |
|---|---|
| Heap construction | O(n) exchanges and O(n) compares |
| Sortdown (and the total) | O(n log n) exchanges and compares |

So heap sort is **in place** and has a **guaranteed O(n log n) worst case** — no extra array. Merge sort needs O(n) extra space; quick sort is in place but O(n²) in the worst case.

**Big-O optimal, but…**

1. **Longer inner loop:** more work per key compare than quick sort (a higher constant factor).
2. **Poor cache locality.** *Why?* Sink jumps from index k to 2k, so in a large array consecutive compares touch memory far apart. Quick sort and merge sort scan neighboring elements, which stay in cache.
3. **Not stable:** long-distance exchanges don't keep equal keys in their original order.

Slide 13's sorting summary:

| Sort | In place | Stable | Best | Average | Worst | Remarks |
|---|---|---|---|---|---|---|
| Selection | ✓ | | O(n²) | O(n²) | O(n²) | n exchanges |
| Insertion | ✓ | ✓ | O(n) | O(n²) | O(n²) | use for small arrays or partially ordered |
| Merge | | ✓ | O(n log n) | O(n log n) | O(n log n) | guaranteed performance; stable |
| Quick | ✓ | | O(n log n) | O(n log n) | O(n²) | n log n probabilistic guarantee; fastest! |
| Heap | ✓ | | O(n log n) | O(n log n) | O(n log n) | guaranteed performance; in place |

The recap slide links a full heap sort animation: https://visualgo.net/en/heap?slide=1

> 📘 **Beyond the lecture**: The constants are small. algs4 shows bottom-up construction uses at most 2n compares and n exchanges, and heap sort as a whole uses fewer than 2 n lg n compares and exchanges (that is also its average case). (algs4 §2.4)

> ⚠️ **Pitfall**: "Heap sort is O(n log n)" holds for the **best case too** (distinct keys). Unlike insertion sort, it can't finish early on an already sorted array: a sorted ascending array isn't a max-heap, and sortdown always does n − 1 sinks.

## 5. Binary Search Trees

A **binary search tree (BST)** is a binary tree in **symmetric order**: every node has a key, and that key is

- **larger** than all keys in its left subtree, and
- **smaller** than all keys in its right subtree.

Implementation notes from the slide: duplicate keys can be handled in different ways, but **we assume no duplicates**. The optional textbook uses BSTs to implement **dictionaries**, so each node holds a **key-value pair**; other implementations (e.g. sets) hold only a key.

Example (the slides' running tree): root S; left subtree E with children A and R; right child X. The keys smaller than E (A, C) sit under E's left link, and the keys between E and S (H, M, R) sit under E's right link. An **in-order** traversal ([Lecture 10](lec-10.en-US.md#8-depth-first-pre--in--and-post-order)) visits the keys in sorted order: A C E H M R S X.

Heaps and BSTs are both binary trees but solve different problems (slide from the Lecture 11 deck):

| | Heap | BST |
|---|---|---|
| Used to implement | Priority queues | Sorted dictionaries |
| Supported operations | Insert, delete max | Insert, search, delete, ordered operations |
| What is inserted | Keys | Key-value pairs |
| Underlying data structure | (Resizing) array | Linked nodes |
| Tree shape | Complete binary tree | Depends on data |
| Ordering of keys | Heap-ordered | Symmetrically ordered |
| Duplicate keys allowed? | Yes | No (when used to implement dictionaries) |

> ⚠️ **Pitfall**: The rule is about **whole subtrees**, not just children. A tree where every left child < parent < right child can still fail, e.g. root 8 with left child 3, and 3's right child 9: 9 is in 8's *left* subtree but larger than 8.

## 6. The Node Class

A BST uses an inner class `Node` made of:

- a **Key** and a **Value** (the dictionary pair);
- **pointers to the roots of the left (smaller keys) and right (larger keys) subtrees**;
- optionally, a **node counter**: the number of nodes in the subtree rooted at this node. It speeds up some operations, e.g. finding the k-th smallest or largest key.

The BST itself just holds `Node* root`. Slide 18's code:

```cpp
template <template Key, typename Value>
class BST {
private:
    class Node {
        Key key;            // sorted by key
        Value val;          // associated value
        Node* left, right;  // roots of left and right subtrees
        int size;           // #nodes in subtree rooted at this

        Node(const Key& k, const Value& v, int s)
            : key(k), val(v), left(nullptr), right(nullptr), size(s) {}
    };

    Node* root;             // root of BST
};
```

Slide bugs (these won't compile; a quiz may show the code as written):

- `template <template Key, …>` → `template <typename Key, typename Value>`.
- `Node* left, right;` declares `right` as a `Node`, not a `Node*` (the `*` binds to one name only) → `Node* left, *right;` or two declarations.
- `class Node` makes every member private, so `BST`'s methods can't read `x->key` → use `struct Node` or add `public:`.

The fixed version is in [§12](#12-complete-implementation). `put` also needs a `size(Node*)` helper that returns 0 for `nullptr`; the slides use it without showing it.

## 7. Search

Start comparing at the root:

- if the key is **less** than the node's key, go to the **left** subtree;
- if it is **greater**, go to the **right** subtree;
- if they are **equal**, it's a **search hit**.

Return the node pointer for the key, or `nullptr` if there is no such key (some implementations return the last node reached instead). **Number of compares = depth of the node + 1.**

Slide 21's recursive version returns the value instead, and `Value()` on a miss:

```cpp
Value get(const Key& key) const {
    return get(root, key);
}

Value get(Node* x, const Key& key) const {
    if (x == nullptr)
        return Value();
    if (key < x->key)
        return get(x->left, key);
    else if (key > x->key)
        return get(x->right, key);
    else
        return x->val;
}
```

Slide 20's example on the S-E-X-A-R-C-H-M tree: **search for R** — R < S, go left; R > E, go right; R == R, hit (3 compares; R is at depth 2). **Search for T** — T > S, go right; T < X, go left; that link is null, so it's a miss. Step through both:

```viz bst
{"title": "Slide 20: search hit (R) and search miss (T)", "keys": "S, E, X, A, R, C, H, M", "ops": "get(R); get(T)", "interactive": true}
```

> ⚠️ **Pitfall**: `Value()` on a miss is ambiguous — a stored value could also equal `Value()` (0 for `int`). That's why the slide's other version returns a node pointer (`nullptr` = miss).

> 📝 **Practice**: [Activity 2](#133-activity-2-search-slide-26) — search for 4 and 9.

## 8. Insert

Insert follows the search path:

- less than the node's key → go left; greater → go right;
- **if you reach null, insert** a new node there;
- **if the key already exists, update its value** (no duplicates).

Number of compares = depth of the node + 1. Slide 22 links the algs4 *3.2 Binary Search Tree Demo*. Slide 25's code:

```cpp
void put(const Key& key, const Value& val) {
    root = put(root, key, val);
}

Node* put(Node* x, const Key& key, const Value& val) {
    if (x == nullptr)
        return new Node(key, val, 1);
    if (key < x->key)
        x->left = put(x->left, key, val);
    else if (key > x->key)
        x->right = put(x->right, key, val);
    else
        x->val = val;
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
```

Each call returns the root of its (possibly changed) subtree, and the caller stores it back in its link. Only the null link at the bottom changes. On the way back up, the other assignments write back the same pointer and the `size` fields are recomputed.

Slide 24's example **inserts L**: L < S → left to E; L > E → right to R; L < R → left to H; L > H → right to M; L < M and M's left link is null → create the node there. Then links are reset and counts incremented on the way up.

```viz bst
{"title": "Slide 24: inserting L", "keys": "S, E, X, A, R, C, H, M", "ops": "put(L)"}
```

> ⚠️ **Pitfall**: Writing `put(x->left, key, val);` without assigning the result loses the new node. Only the returned pointer gets hooked into the tree. The same goes for `put(root, …)` in the public method.

> 📝 **Practice**: [Activity 3](#134-activity-3-insert-slide-27) — add (4, 3) and (9, 2).

## 9. Tree Shape and Running Time

The **same set of keys** gives **different BSTs depending on insertion order** (slide 28):

- **best case:** perfectly balanced, e.g. H at the root, C and S below it, then A E R X;
- **typical case:** somewhat uneven, height a small multiple of log n;
- **worst case:** keys inserted in sorted order (A C E H R S X) build a "stick". Every node has only a right child, so the height is n.

Since search and insert compares = depth + 1, cost is **O(height)**:

- If n distinct keys are inserted in **random order**, the expected compares for search/insert is **O(log n)**, and the expected height is O(log n).
- The **worst-case height is n**: the keys would have to arrive sorted (or reverse sorted). Then search, insert and delete are **O(n)**.

Example: inserting H C S A E R X (median first, then the medians of each half) gives the best-case tree of height 3. Inserting A C E H R S X gives height 7.

> 📘 **Beyond the lecture**: The random-order constant is about 1.39: a search hit, miss or insert in a BST built from n random keys takes about 2 ln n ≈ 1.39 lg n compares on average — only about 39% more than a perfectly balanced tree. Any order that puts H first, C before A and E, and S before R and X gives the best-case tree. (algs4 §3.2)

## 10. Hibbard Deletion

Delete is the hard operation, because removing a node with two children leaves two subtrees and only one parent link to attach them to. **Hibbard deletion** has three cases (slides 30–32):

1. **Leaf:** simply delete the node (its parent's link becomes null). Example: in the tree 46 / 34, 70 / 11, 44, 52 (52 is 70's left child) / 6, 19, delete 52.
2. **One child:** delete the node and replace it with its child. Example: delete 70 from the same tree; 52 takes its place as 46's right child.
3. **Two children:** replace the node with its **successor** (the next largest key in the tree), which is the **smallest node of the right subtree**, i.e. the **left-most node of the right subtree**. The successor has no left child. Move the successor's right child (if any) to where the successor was. Example: delete 50 from 50 / 29, 65 / 11, 32, 51, 91 / 52, 72, 99. The successor is 51 (go right to 65, then left to 51). 51 replaces 50, and 51's right child 52 becomes 65's left child.

The swap keeps symmetric order: the successor is larger than everything in the left subtree and smaller than everything left in the right subtree, since no key lies between the deleted key and its successor.

The slides describe the cases without code. A completed version in the style of `put` (ours):

```cpp
Node* remove(Node* x, const Key& key) {
    if (x == nullptr) return nullptr;           // key not found
    if (key < x->key)
        x->left = remove(x->left, key);
    else if (key > x->key)
        x->right = remove(x->right, key);
    else {
        if (x->right == nullptr) {              // case 1, or case 2 (left child only)
            Node* l = x->left;
            delete x;
            return l;
        }
        if (x->left == nullptr) {               // case 2 (right child only)
            Node* r = x->right;
            delete x;
            return r;
        }
        Node* t = x;                            // case 3
        x = min(t->right);                      // successor
        x->right = deleteMin(t->right);         // unlink it from the right subtree
        x->left = t->left;
        delete t;
    }
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
```

`min` follows left links to the end; `deleteMin` unlinks the minimum by returning its right subtree in its place (both are in [§12](#12-complete-implementation)). The name is `remove` because `delete` is a C++ keyword. Step through slide 32's case 3 (try `remove(11)` for case 1 or `remove(91)` for case 3 with a deeper successor):

```viz bst
{"title": "Slide 32: case 3, delete 50", "keys": "50, 29, 65, 11, 32, 51, 91, 52, 72, 99", "ops": "remove(50)", "interactive": true}
```

**Cost:** finding the node and then its successor walks down one path: **O(height)**.

> ⚠️ **Pitfall**: In case 3, set `x->right = deleteMin(t->right)` **before** `x->left = t->left`. When the successor is t's own right child (as in Activity 4's remove 6), setting the left link first makes `deleteMin(t->right)` start at the successor, follow its new left link into the old left subtree, and unlink the wrong node.

> 📝 **Practice**: [Activity 4](#135-activity-4-remove-slide-33) (all three cases on one tree) and [Activity 5](#136-activity-5-hibbard-deletion-slide-34).

## 11. BST Summary: Deletion Makes Trees Lopsided

- Random insertions give a BST of **average O(log n) height**, so search and add are O(log n) on average.
- Insertion in sorted order gives the worst-case stick, so BSTs have **O(n) worst-case** search, insert and delete.
- Insertions mixed with **Hibbard deletions** make the BST **unbalanced, skewed to the left**. Deletion always takes the successor from the right subtree, so right subtrees keep shrinking (the slide contrasts a full tree with a left-heavy one).

*What can we do about the asymmetry from deletion?* **Symmetric Hibbard deletion:** alternate between the successor and the **predecessor** (the largest key in the left subtree), or choose one at random. It has been shown empirically to keep the tree height close to O(log n), but there is **no formal proof**.

Even then, none of this fixes the worst case: a BST still has O(n) worst-case operations.

> ➡️ **Continued in [Lecture 14](lec-14.en-US.md)**: the order-of-growth table for symbol tables (BST worst case n vs the goal of log n for every operation) and "How do we achieve the goal?" — balanced BSTs (2-3 trees, left-leaning red-black trees).

## 12. Complete Implementation

```cpp
#include <iostream>
#include <utility>
#include <vector>

// ---------- Heap sort (1-based: a[0] unused) ----------
template <typename T>
bool less(const std::vector<T>& a, int i, int j) { return a[i] < a[j]; }

template <typename T>
void exch(std::vector<T>& a, int i, int j) { std::swap(a[i], a[j]); }

template <typename T>
void sink(std::vector<T>& a, int k, int n) {
    while (2 * k <= n) {
        int j = 2 * k;
        if (j < n && less(a, j, j + 1)) j++;
        if (!less(a, k, j)) break;
        exch(a, k, j);
        k = j;
    }
}

template <typename T>
void heapSort(std::vector<T>& a) {       // a[1..n] holds the keys
    int n = static_cast<int>(a.size()) - 1;
    for (int k = n / 2; k >= 1; k--)     // 1) heap construction
        sink(a, k, n);
    while (n > 1) {                       // 2) sortdown
        exch(a, 1, n--);
        sink(a, 1, n);
    }
}

// ---------- BST (dictionary) ----------
template <typename Key, typename Value>
class BST {
private:
    class Node {
    public:
        Key key;            // sorted by key
        Value val;          // associated value
        Node* left, *right; // roots of left and right subtrees
        int size;           // #nodes in subtree rooted at this

        Node(const Key& k, const Value& v, int s)
            : key(k), val(v), left(nullptr), right(nullptr), size(s) {}
    };

    Node* root;             // root of BST

    int size(Node* x) const { return x == nullptr ? 0 : x->size; }

    Value get(Node* x, const Key& key) const {
        if (x == nullptr)
            return Value();
        if (key < x->key)
            return get(x->left, key);
        else if (key > x->key)
            return get(x->right, key);
        else
            return x->val;
    }

    Node* put(Node* x, const Key& key, const Value& val) {
        if (x == nullptr)
            return new Node(key, val, 1);
        if (key < x->key)
            x->left = put(x->left, key, val);
        else if (key > x->key)
            x->right = put(x->right, key, val);
        else
            x->val = val;
        x->size = 1 + size(x->left) + size(x->right);
        return x;
    }

    Node* min(Node* x) const {
        return x->left == nullptr ? x : min(x->left);
    }

    // Unlinks (does not delete) the minimum node of subtree x.
    Node* deleteMin(Node* x) {
        if (x->left == nullptr)
            return x->right;
        x->left = deleteMin(x->left);
        x->size = 1 + size(x->left) + size(x->right);
        return x;
    }

    Node* remove(Node* x, const Key& key) {          // Hibbard deletion
        if (x == nullptr) return nullptr;
        if (key < x->key)
            x->left = remove(x->left, key);
        else if (key > x->key)
            x->right = remove(x->right, key);
        else {
            if (x->right == nullptr) {               // cases 1 and 2
                Node* l = x->left;
                delete x;
                return l;
            }
            if (x->left == nullptr) {                // case 2
                Node* r = x->right;
                delete x;
                return r;
            }
            Node* t = x;                             // case 3
            x = min(t->right);                       // successor
            x->right = deleteMin(t->right);
            x->left = t->left;
            delete t;
        }
        x->size = 1 + size(x->left) + size(x->right);
        return x;
    }

    void destroy(Node* x) {
        if (x == nullptr) return;
        destroy(x->left);
        destroy(x->right);
        delete x;
    }

    void preorder(Node* x, std::ostream& out) const {
        if (x == nullptr) { out << "-"; return; }
        out << x->key;
        if (x->left == nullptr && x->right == nullptr) return;
        out << "(";
        preorder(x->left, out);
        out << " ";
        preorder(x->right, out);
        out << ")";
    }

public:
    BST() : root(nullptr) {}
    ~BST() { destroy(root); }
    BST(const BST&) = delete;
    BST& operator=(const BST&) = delete;

    int size() const { return size(root); }
    Value get(const Key& key) const { return get(root, key); }
    void put(const Key& key, const Value& val) { root = put(root, key, val); }
    void remove(const Key& key) { root = remove(root, key); }

    void print(std::ostream& out) const { preorder(root, out); out << "\n"; }
};

int main() {
    std::vector<int> a{0, 2, 9, 7, 6, 5, 8};         // a[0] unused
    int n = 6;
    for (int k = n / 2; k >= 1; k--) sink(a, k, n);
    std::cout << "heap: ";
    for (int i = 1; i <= n; i++) std::cout << a[i] << " ";
    std::cout << "\n";
    heapSort(a);
    std::cout << "sorted: ";
    for (int i = 1; i <= n; i++) std::cout << a[i] << " ";
    std::cout << "\n";

    std::vector<char> s{' ', 'S','O','R','T','E','X','A','M','P','L','E'};
    heapSort(s);
    for (std::size_t i = 1; i < s.size(); i++) std::cout << s[i];
    std::cout << "\n";

    const std::vector<int> keys{8, 3, 10, 1, 6, 14, 4, 7, 13};
    BST<int, int> t;
    for (int k : keys) t.put(k, k * 10);
    t.print(std::cout);
    std::cout << "get(4) = " << t.get(4) << ", get(9) = " << t.get(9)
              << ", size = " << t.size() << "\n";
    t.put(4, 3);
    t.put(9, 2);
    std::cout << "get(4) = " << t.get(4) << ", get(9) = " << t.get(9)
              << ", size = " << t.size() << "\n";
    t.print(std::cout);

    for (int k : {1, 14, 6, 3, 8}) {                 // Activity 4: each from the original
        BST<int, int> u;
        for (int x : keys) u.put(x, 0);
        u.remove(k);
        std::cout << "remove " << k << ": ";
        u.print(std::cout);
    }
    BST<int, int> h;                                 // Activity 5
    for (int x : {21, 10, 79, 73, 95, 70, 74, 71}) h.put(x, 0);
    h.remove(21);
    std::cout << "remove 21: ";
    h.print(std::cout);
}
```

Output (`print` writes a tree as `key(left right)`, with `-` for an empty subtree):

```text
heap: 9 6 8 2 5 7 
sorted: 2 5 6 7 8 9 
AEELMOPRSTX
8(3(1 6(4 7)) 10(- 14(13 -)))
get(4) = 40, get(9) = 0, size = 9
get(4) = 3, get(9) = 2, size = 10
8(3(1 6(4 7)) 10(9 14(13 -)))
remove 1: 8(3(- 6(4 7)) 10(- 14(13 -)))
remove 14: 8(3(1 6(4 7)) 10(- 13))
remove 6: 8(3(1 7(4 -)) 10(- 14(13 -)))
remove 3: 8(4(1 6(- 7)) 10(- 14(13 -)))
remove 8: 10(3(1 6(4 7)) 14(13 -))
remove 21: 70(10 79(73(71 74) 95))
```

## 13. In-class Activities (with Solutions)

Try each one before reading the solution. The activities use one BST several times:

```text
        8
      /   \
     3     10
    / \      \
   1   6      14
      / \     /
     4   7   13
```

### 13.1 Activity: Heap Construction (slide 5)

**Part 1.** Run heap construction on the array [2,9,7,6,5,8]. Show each step.

**Part 2.** What is the worst-case time complexity of naive heap construction? (Inserting 1 element at a time)

**Part 3.** What is the worst-case time complexity of optimized heap construction?

> ✍️ **Try it first.** Hint: n = 6, so the first call is `sink(3, 6)`.

**Solution.**
**Part 1:** `sink(3, 6)`: 7 < 8 → swap → `2 9 8 6 5 7`; `sink(2, 6)`: 9 is larger than 6 and 5 → no move; `sink(1, 6)`: 2 < 9 → swap, then 2 < 6 → swap → **`9 6 8 2 5 7`** (3 exchanges in total).
**Part 2:** **O(n log n)** — n insertions, each O(log n).
**Part 3:** **O(n)** — most nodes sit near the bottom and sink only a short distance; the series n · Σ h/2^(h+1) ≤ n. See [§1](#1-heap-construction-naive-vs-bottom-up) and [§2](#2-why-bottom-up-construction-is-on).

### 13.2 Activity 1: Sortdown (slide 11)

Given the heap you constructed before (`9 6 8 2 5 7`), run the second step of heapsort, sortdown, to sort the array. What is the worst-case time complexity of sortdown?

> ✍️ **Try it first.**

**Solution.** The bar separates the heap from the sorted part:

| Step | After `exch(1, n--)` | After `sink(1, n)` |
|---|---|---|
| n = 6 → 5 | 7 6 8 2 5 \| 9 | 8 6 7 2 5 \| 9 |
| n = 5 → 4 | 5 6 7 2 \| 8 9 | 7 6 5 2 \| 8 9 |
| n = 4 → 3 | 2 6 5 \| 7 8 9 | 6 2 5 \| 7 8 9 |
| n = 3 → 2 | 5 2 \| 6 7 8 9 | 5 2 \| 6 7 8 9 (no move) |
| n = 2 → 1 | 2 \| 5 6 7 8 9 | loop ends (n = 1) |

Result: **2 5 6 7 8 9**. Worst case: **O(n log n)** — n − 1 iterations, each a sink of up to log n levels. Check it:

```viz binary-heap
{"title": "Activity 1 check: sortdown on 9 6 8 2 5 7", "heap": "9, 6, 8, 2, 5, 7", "ops": "sortdown()"}
```

Back to [§3](#3-sortdown).

### 13.3 Activity 2: Search (slide 26)

Search for the keys 4 and 9 in the BST above.

> ✍️ **Try it first.** Count the compares.

**Solution.** **4:** 4 < 8 → left; 4 > 3 → right; 4 < 6 → left; 4 == 4 → **hit**, 4 compares (depth 3 + 1). **9:** 9 > 8 → right; 9 < 10 → left; 10's left link is null → **miss** (`nullptr` / `Value()`), 2 compares. Back to [§7](#7-search).

### 13.4 Activity 3: Insert (slide 27)

How do we add to BST while keeping symmetric ordering? Add the key-value pairs (4,3) and (9,2) in the BST above. (Nodes are shown with only keys.)

> ✍️ **Try it first.** Hint: one of these keys is already in the tree.

**Solution.** **(4,3):** the search path 8 → 3 → 6 → 4 ends at an existing node, so **only its value is updated** to 3; the tree shape doesn't change. **(9,2):** 9 > 8 → right; 9 < 10 → left; null → **new node 9 (value 2) becomes 10's left child**. Check both, together with Activity 2:

```viz bst
{"title": "Activities 2 and 3 check", "keys": "8, 3, 10, 1, 6, 14, 4, 7, 13", "ops": "get(4); get(9); put(4, 3); put(9, 2)"}
```

Back to [§8](#8-insert).

### 13.5 Activity 4: Remove (slide 33)

How do we remove a key-value pair while keeping symmetric ordering? Remove each node from the original BST above (each one separately):

- remove 1
- remove 14
- remove 6
- remove 3
- remove 8

> ✍️ **Try it first.** Name the case for each one before you redraw the tree.

**Solution.**

| Remove | Case | Result (`key(left right)`, `-` = empty) |
|---|---|---|
| 1 | leaf | 8(3(- 6(4 7)) 10(- 14(13 -))) |
| 14 | one child → 13 moves up | 8(3(1 6(4 7)) 10(- 13)) |
| 6 | two children; successor 7 (6's right child, no left child) | 8(3(1 7(4 -)) 10(- 14(13 -))) |
| 3 | two children; successor 4 = min of the subtree at 6 | 8(4(1 6(- 7)) 10(- 14(13 -))) |
| 8 | two children; successor 10 = min of the right subtree (10 has no left child), so 10's right subtree stays put | 10(3(1 6(4 7)) 14(13 -)) |

The trap is **remove 3**: its successor is not its right child 6 but the left-most node under 6, which is 4. Back to [§10](#10-hibbard-deletion).

### 13.6 Activity 5: Hibbard Deletion (slide 34)

Delete the node 21 following Hibbard's deletion, in the tree 21 / 10, 79 / 73, 95 / 70, 74 (73's children) / 71 (70's right child).

> ✍️ **Try it first.**

**Solution.** 21 has two children → case 3. The successor is the minimum of the right subtree: 79 → 73 → **70** (70 has no left child). 70's right child **71 moves up to be 73's left child**, then 70 takes 21's place: **70 / 10, 79 / 73, 95 / 71, 74**. Check it:

```viz bst
{"title": "Activity 5 check: delete 21", "keys": "21, 10, 79, 73, 95, 70, 74, 71", "ops": "remove(21)"}
```

Back to [§10](#10-hibbard-deletion).

## 14. Quick Reference & Top 5 Things to Remember

| Operation | Worst case | Note |
|---|---|---|
| Heap construction, naive (n inserts) | O(n log n) | swim each new key |
| Heap construction, bottom-up | O(n) | `for k = n/2 … 1: sink(a, k, n)` |
| Sortdown | O(n log n) | `exch(a, 1, n--); sink(a, 1, n);` |
| Heap sort | O(n log n), in place, not stable | best case also n log n |
| BST search / insert / delete | O(height): O(n) worst, O(log n) average with random inserts | compares = depth + 1 |

| BST delete case | Action |
|---|---|
| Leaf | parent link ← null |
| One child | parent link ← that child |
| Two children | replace with successor = left-most node of the right subtree; the successor's right child takes its old spot |

**Top 5 things to remember**

1. Bottom-up heap construction sinks from n/2 down to 1 and is **O(n)** (sum n · Σ h/2^(h+1) ≤ n); inserting keys one at a time is O(n log n).
2. Sortdown swaps the max to the end, shrinks n and then sinks with the *new* n; the array is always a heap followed by a sorted tail.
3. Heap sort: O(n log n) in every case and in place, but not stable, with poor cache locality and a longer inner loop than quick sort.
4. BST cost is O(height): random insertion order gives O(log n) on average; sorted input gives a stick of height n, so O(n) worst case.
5. Hibbard deletion of a two-child node uses the successor (min of the right subtree); doing it over and over skews the tree left. Symmetric deletion helps empirically, but there's no proof.

---
title: "Search Trees"
summary: "Binary search trees (symmetric order, Node class, search, insert, shape and height, Hibbard deletion), 2-3 trees (search, insertion, height), and left-leaning red-black BSTs (definition, rotations, color flips, insertion, 2 lg n height) with the dictionary summary table."
topics:
  - search-trees
kind: "topic"
order: 507
---

# Information and Computer Science 46 — Topic: Search Trees

## Table of Contents

- [1. Binary Search Trees](#1-binary-search-trees)
- [2. BST Search](#2-bst-search)
- [3. BST Insert](#3-bst-insert)
- [4. Tree Shape and Running Time](#4-tree-shape-and-running-time)
- [5. Hibbard Deletion](#5-hibbard-deletion)
- [6. Why We Need Balance](#6-why-we-need-balance)
- [7. 2-3 Trees](#7-2-3-trees)
- [8. Left-Leaning Red-Black BSTs (LLRB)](#8-left-leaning-red-black-bsts-llrb)
- [9. Complete Implementation](#9-complete-implementation)
- [10. Quick Reference & Top 5 Things to Remember](#10-quick-reference--top-5-things-to-remember)

> This chapter builds ordered dictionaries from the binary search tree up: search, insertion and deletion in a BST, why its worst case is bad, and how 2-3 trees and left-leaning red-black trees guarantee O(log n), with complete C++ code for the BST and the LLRB. It assumes binary trees and traversals ([Trees](topic-trees.en-US.md)) and big-O analysis ([Analysis](topic-analysis.en-US.md)); heaps ([Heaps](topic-heaps.en-US.md)) appear as a contrast.

## 1. Binary Search Trees

### 1.1 The Dictionary Problem

A **dictionary** (symbol table) stores **key-value pairs** and supports three operations: `put(key, val)` inserts a pair (or updates the value if the key exists), `get(key)` finds the value for a key, and `remove(key)` deletes a pair. An **ordered** dictionary additionally supports questions about key order: minimum, maximum, the next larger key, the k-th smallest key, range queries.

An unordered list needs n compares per search; a sorted array finds a key by binary search in log n compares, but inserting into it shifts O(n) elements. A **binary search tree** aims for log n on all operations by keeping the data in linked nodes that are ordered by key. The comparison table in [section 8.6](#86-time-analysis-and-the-dictionary-summary) sets all of these side by side.

### 1.2 Symmetric Order

A **binary search tree (BST)** is a binary tree in **symmetric order**: every node has a key, and that key is

- **larger** than all keys in its left subtree, and
- **smaller** than all keys in its right subtree.

Duplicate keys can be handled in different ways, but **we assume no duplicates**. In a dictionary each node holds a **key-value pair**; other uses (e.g. sets) hold only a key.

Example (the running tree, built by inserting S E X A R C H M): root S; left subtree rooted at E with children A and R; right child X. The keys smaller than E (A, C) sit under E's left link, and the keys between E and S (H, M, R) sit under E's right link. An **in-order** traversal ([Trees](topic-trees.en-US.md)) visits the keys in sorted order: A C E H M R S X.

> ⚠️ **Pitfall**: The rule is about **whole subtrees**, not just children. A tree where every left child < parent < right child can still fail, e.g. root 8 with left child 3, and 3's right child 9: 9 is in 8's *left* subtree but larger than 8.

### 1.3 Heap vs BST

Heaps and BSTs are both binary trees but solve different problems:

| | Heap | BST |
|---|---|---|
| Used to implement | Priority queues | Sorted dictionaries |
| Supported operations | Insert, delete max | Insert, search, delete, ordered operations |
| What is inserted | Keys | Key-value pairs |
| Underlying data structure | (Resizing) array | Linked nodes |
| Tree shape | Complete binary tree | Depends on data |
| Ordering of keys | Heap-ordered | Symmetrically ordered |
| Duplicate keys allowed? | Yes | No (when used to implement dictionaries) |

See [Heaps](topic-heaps.en-US.md) for the heap side.

### 1.4 The Node Class

A BST is built from linked nodes. Each `Node` holds:

- a **key** and a **value** (the dictionary pair);
- **pointers to the roots of the left (smaller keys) and right (larger keys) subtrees**;
- a **node counter** `size`: the number of nodes in the subtree rooted at this node. It speeds up some operations, e.g. finding the k-th smallest or largest key, and it is kept up to date by `put` and `remove`.

The BST object itself just holds `Node* root`. All code in this chapter uses `size_t` for counts and a `struct Node` nested inside the tree class:

```cpp
template <typename Key, typename Value>
class BST {
private:
  struct Node {
    Key key;               // sorted by key
    Value val;             // associated value
    Node* left;            // root of the subtree with smaller keys
    Node* right;           // root of the subtree with larger keys
    size_t size;           // number of nodes in the subtree rooted here

    Node(const Key& k, const Value& v, size_t s)
        : key(k), val(v), left(nullptr), right(nullptr), size(s) {}
  };

  Node* root;              // root of the BST

  size_t size(Node* x) const { return x == nullptr ? 0 : x->size; }
```

The helper `size(Node*)` returns 0 for `nullptr`, so a node's count can always be recomputed as `1 + size(x->left) + size(x->right)`.

> ⚠️ **Pitfall**: Three easy mistakes in the node declaration. `Node* left, right;` declares `right` as a `Node`, not a `Node*`, because the `*` binds to one name only; write one pointer per declaration. A nested `class Node` makes every member private, so the tree's methods cannot read `x->key`; use `struct` (or add `public:`). And an uninitialized child pointer is garbage, not `nullptr`: the constructor must set both links to `nullptr`.

## 2. BST Search

### 2.1 The Algorithm

Start comparing at the root:

- if the key is **less** than the node's key, go to the **left** subtree;
- if it is **greater**, go to the **right** subtree;
- if they are **equal**, it's a **search hit**.

Reaching a null link is a **search miss**. **Number of compares = depth of the node + 1.** The recursive version returns the value, and `Value()` on a miss:

```cpp
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

The public `Value get(const Key& key) const { return get(root, key); }` starts the recursion at the root.

Example on the S-E-X-A-R-C-H-M tree: **search for R**: R < S, go left; R > E, go right; R == R, hit (3 compares; R is at depth 2). **Search for T**: T > S, go right; T < X, go left; that link is null, so it's a miss. Step through both:

```viz bst
{"title": "Search hit (R) and search miss (T)", "keys": "S, E, X, A, R, C, H, M", "ops": "get(R); get(T)", "interactive": true}
```

> ⚠️ **Pitfall**: `Value()` on a miss is ambiguous: a stored value could also equal `Value()` (0 for `int`). To tell a miss from a stored default value, search with a loop that reports whether a node was reached, as `contains` does in [section 9.1](#91-bst); returning the node pointer (`nullptr` = miss) works the same way. Some implementations return the last node reached instead.

### 2.2 Practice

#### Searching a BST

Search for the keys 4 and 9 in this BST (the same tree is used by the insertion and deletion practice below):

```viz binary-tree
{"title": "The practice BST", "tree": "8, 3, 10, 1, 6, -, 14, -, -, 4, 7, -, -, 13"}
```

> Hint: count the compares.

<details>
<summary>Solution</summary>

**4:** 4 < 8 → left; 4 > 3 → right; 4 < 6 → left; 4 == 4 → **hit**, 4 compares (depth 3 + 1). **9:** 9 > 8 → right; 9 < 10 → left; 10's left link is null → **miss** (`nullptr` / `Value()`), 2 compares.

</details>

## 3. BST Insert

### 3.1 The Algorithm

Insert follows the search path:

- less than the node's key → go left; greater → go right;
- **if you reach null, insert** a new node there;
- **if the key already exists, update its value** (no duplicates).

Number of compares = depth of the node + 1. The code:

```cpp
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

with the public wrapper `void put(const Key& key, const Value& val) { root = put(root, key, val); }`. Each call returns the root of its (possibly changed) subtree, and the caller stores it back in its link. Only the null link at the bottom actually changes: on the way back up, the other assignments write back the same pointer, and the `size` fields are recomputed.

Example, **inserting L** into the S-E-X-A-R-C-H-M tree: L < S → left to E; L > E → right to R; L < R → left to H; L > H → right to M; L < M and M's left link is null → create the node there. Then links are reset and counts incremented on the way up.

```viz bst
{"title": "Inserting L", "keys": "S, E, X, A, R, C, H, M", "ops": "put(L)"}
```

> ⚠️ **Pitfall**: Writing `put(x->left, key, val);` without assigning the result loses the new node. Only the returned pointer gets hooked into the tree. The same goes for `put(root, …)` in the public method.

### 3.2 Practice

#### Inserting into a BST

How do we add to a BST while keeping symmetric ordering? Add the key-value pairs (4,3) and (9,2) to the practice BST from [section 2.2](#22-practice). (Nodes are shown with only keys.)

> Hint: one of these keys is already in the tree.

<details>
<summary>Solution</summary>

**(4,3):** the search path 8 → 3 → 6 → 4 ends at an existing node, so **only its value is updated** to 3; the tree shape doesn't change. **(9,2):** 9 > 8 → right; 9 < 10 → left; null → **new node 9 (value 2) becomes 10's left child**. Check both, together with the search practice:

```viz bst
{"title": "Search and insert practice check", "keys": "8, 3, 10, 1, 6, 14, 4, 7, 13", "ops": "get(4); get(9); put(4, 3); put(9, 2)"}
```

The compiled program in [section 9.1](#91-bst) prints the same trees.

</details>

## 4. Tree Shape and Running Time

The **same set of keys** gives **different BSTs depending on insertion order**:

- **best case:** perfectly balanced, e.g. H at the root, C and S below it, then A E R X;
- **typical case:** somewhat uneven, height a small multiple of log n;
- **worst case:** keys inserted in sorted order (A C E H R S X) build a "stick". Every node has only a right child, so the height is n.

Since search and insert compares = depth + 1, cost is **O(height)**:

- If n distinct keys are inserted in **random order**, the expected compares for search/insert is **O(log n)**, and the expected height is O(log n).
- The **worst-case height is n**: the keys would have to arrive sorted (or reverse sorted). Then search, insert and delete are **O(n)**.

Example: inserting H C S A E R X (median first, then the medians of each half) gives the best-case tree of height 3. Inserting A C E H R S X gives height 7; the program in [section 9.1](#91-bst) prints both heights.

> 📘 **Going further**: The random-order constant is about 1.39: a search hit, miss or insert in a BST built from n random keys takes about 2 ln n ≈ 1.39 lg n compares on average, only about 39% more than a perfectly balanced tree. Any order that puts H first, C before A and E, and S before R and X gives the best-case tree. (algs4 §3.2)

## 5. Hibbard Deletion

### 5.1 The Three Cases

Delete is the hard operation, because removing a node with two children leaves two subtrees and only one parent link to attach them to. **Hibbard deletion** has three cases:

1. **Leaf:** simply delete the node (its parent's link becomes null). Example: in the tree 46 / 34, 70 / 11, 44, 52 (52 is 70's left child) / 6, 19, delete 52.
2. **One child:** delete the node and replace it with its child. Example: delete 70 from the same tree; 52 takes its place as 46's right child.
3. **Two children:** replace the node with its **successor** (the next largest key in the tree), which is the **smallest node of the right subtree**, i.e. the **left-most node of the right subtree**. The successor has no left child. Move the successor's right child (if any) to where the successor was. Example: delete 50 from 50 / 29, 65 / 11, 32, 51, 91 / 52, 72, 99. The successor is 51 (go right to 65, then left to 51). 51 replaces 50, and 51's right child 52 becomes 65's left child.

The swap keeps symmetric order: the successor is larger than everything in the left subtree and smaller than everything left in the right subtree, since no key lies between the deleted key and its successor.

### 5.2 Code

The code follows the style of `put`:

```cpp
  Node* min(Node* x) const {
    return x->left == nullptr ? x : min(x->left);
  }

  // Unlinks (does not delete) the minimum node of the subtree rooted at x.
  Node* deleteMin(Node* x) {
    if (x->left == nullptr)
      return x->right;
    x->left = deleteMin(x->left);
    x->size = 1 + size(x->left) + size(x->right);
    return x;
  }

  Node* remove(Node* x, const Key& key) {          // Hibbard deletion
    if (x == nullptr) return nullptr;              // key not found
    if (key < x->key)
      x->left = remove(x->left, key);
    else if (key > x->key)
      x->right = remove(x->right, key);
    else {
      if (x->right == nullptr) {                   // leaf, or only a left child
        Node* l = x->left;
        delete x;
        return l;
      }
      if (x->left == nullptr) {                    // only a right child
        Node* r = x->right;
        delete x;
        return r;
      }
      Node* t = x;                                 // two children
      x = min(t->right);                           // successor
      x->right = deleteMin(t->right);              // unlink it from the right subtree
      x->left = t->left;
      delete t;
    }
    x->size = 1 + size(x->left) + size(x->right);
    return x;
  }
```

`min` follows left links to the end; `deleteMin` unlinks the minimum by returning its right subtree in its place. The method is called `remove` because `delete` is a C++ keyword. Step through the case-3 example (try `remove(11)` for case 1 or `remove(91)` for case 3 with a deeper successor):

```viz bst
{"title": "Case 3, delete 50", "keys": "50, 29, 65, 11, 32, 51, 91, 52, 72, 99", "ops": "remove(50)", "interactive": true}
```

**Cost:** finding the node and then its successor walks down one path: **O(height)**.

> ⚠️ **Pitfall**: In case 3, set `x->right = deleteMin(t->right)` **before** `x->left = t->left`. When the successor is t's own right child (as in removing 6 in the practice below), setting the left link first makes `deleteMin(t->right)` start at the successor, follow its new left link into the old left subtree, and unlink the wrong node.

### 5.3 Practice

#### Removing from a BST

How do we remove a key-value pair while keeping symmetric ordering? Remove each node from the original practice BST ([section 2.2](#22-practice)), each one separately:

- remove 1
- remove 14
- remove 6
- remove 3
- remove 8

> Hint: name the case for each one before you redraw the tree.

<details>
<summary>Solution</summary>

| Remove | Case | Result (`key(left right)`, `-` = empty) |
|---|---|---|
| 1 | leaf | 8(3(- 6(4 7)) 10(- 14(13 -))) |
| 14 | one child → 13 moves up | 8(3(1 6(4 7)) 10(- 13)) |
| 6 | two children; successor 7 (6's right child, no left child) | 8(3(1 7(4 -)) 10(- 14(13 -))) |
| 3 | two children; successor 4 = min of the subtree at 6 | 8(4(1 6(- 7)) 10(- 14(13 -))) |
| 8 | two children; successor 10 = min of the right subtree (10 has no left child), so 10's right subtree stays put | 10(3(1 6(4 7)) 14(13 -)) |

The trap is **remove 3**: its successor is not its right child 6 but the left-most node under 6, which is 4. The compiled program in [section 9.1](#91-bst) prints these five trees.

</details>

#### Hibbard deletion of the root

Delete the node 21 following Hibbard's deletion, in the tree 21 / 10, 79 / 73, 95 / 70, 74 (73's children) / 71 (70's right child).

<details>
<summary>Solution</summary>

21 has two children → case 3. The successor is the minimum of the right subtree: 79 → 73 → **70** (70 has no left child). 70's right child **71 moves up to be 73's left child**, then 70 takes 21's place: **70 / 10, 79 / 73, 95 / 71, 74**. Check it:

```viz bst
{"title": "Hibbard practice check: delete 21", "keys": "21, 10, 79, 73, 95, 70, 74, 71", "ops": "remove(21)"}
```

</details>

## 6. Why We Need Balance

- Random insertions give a BST of **average O(log n) height**, so search and add are O(log n) on average.
- Insertion in sorted order gives the worst-case stick, so BSTs have **O(n) worst-case** search, insert and delete.
- Insertions mixed with **Hibbard deletions** make the BST **unbalanced, skewed to the left**. Deletion always takes the successor from the right subtree, so right subtrees keep shrinking (a full tree versus a left-heavy one).

*What can we do about the asymmetry from deletion?* **Symmetric Hibbard deletion:** alternate between the successor and the **predecessor** (the largest key in the left subtree), or choose one at random. It has been shown empirically to keep the tree height close to O(log n), but there is **no formal proof**.

Even then, none of this fixes the worst case: a BST still has O(n) worst-case operations. The order-of-growth table for dictionaries puts the problem in one view:

| | Search (worst) | Insert (worst) | Delete (worst) | Search (avg) | Insert (avg) | Delete (avg) |
|---|---|---|---|---|---|---|
| BST | n | n | n | log n | log n | √n |
| **Goal** | **log n** | **log n** | **log n** | **log n** | **log n** | **log n** |

The worst case is the "stick" from sorted input (A C E H R S X); random input gives log n, but Hibbard deletion drifts the average delete to √n. **Balanced search trees** guarantee log n for every operation. Red-black trees are the ones used as system symbol tables (e.g. C++ `std::map`); AVL, splay and randomized BSTs are other balanced BSTs. This chapter develops the **left-leaning red-black tree (LLRB)**, and to understand it we start with the 2-3 tree.

## 7. 2-3 Trees

### 7.1 Definition

A 2-3 tree lets a node hold **one or two keys**:

- **2-node**: 1 key (and value), **2 links**: left subtree smaller, right subtree larger (a normal BST node).
- **3-node**: 2 keys (and values), **3 links**: left (< key1), middle (between key1 and key2), right (> key2).

Two properties hold at all times:

- **Symmetric order**: an in-order traversal yields all keys in ascending order.
- **Perfect balance**: every path from the root to a null link has exactly the same length.

The "anatomy" tree used throughout (root M; E J and R below; A C, H, L, P, S X at the bottom):

```viz two-three-tree
{"title": "Anatomy of a 2-3 search tree: search for H", "keys": "R, C, X, E, S, P, M, L, A, H, J", "ops": "get(H)"}
```

(The demo builds that tree by inserting the keys in a suitable order; keys of one node are joined by a thick bar.)

### 7.2 Search

Compare the search key against **every key in the node**, find the interval that contains it (left, middle if it's a 3-node, or right), follow that link, and repeat. Searching for **H** above: H < M → left; H is between E and J → middle; H found → return its value (search hit). A miss ends at a null link.

### 7.3 Insertion

Search for the key; the search ends at a node at the bottom. Then:

1. **Into a 2-node**: add the key, making it a 3-node. Done. (Insert K → the 2-node L becomes K L.)
2. **Into a 3-node**: add the key to make a **temporary 4-node** (3 keys, 4 links), then split it into two 2-nodes and **pass the middle key up to the parent**:
   - tree is a single 3-node (insert S into A E → A E S): the middle key E becomes a new root with children A and S. **Height went up by 1**.
   - parent is a 2-node (insert Z into S X → S X Z): X goes up, the parent R becomes the 3-node R X. Done.
   - parent is a 3-node (insert D into A C → A C D): C goes up, the parent E J becomes the temporary 4-node C E J; split again, E goes up to M. **Repeat up the tree as necessary.**
3. **Splitting the root**: if the root ends up a temporary 4-node, split it into **three 2-nodes**. The height grows by 1 but perfect balance is preserved: 2-3 trees grow at the **top**, not at the bottom.

Step through the examples on the anatomy tree (← / → keys work when the demo is focused):

```viz two-three-tree
{"title": "Insert K, Z, D", "keys": "R, C, X, E, S, P, M, L, A, H, J", "ops": "insert(K); insert(Z); insert(D)", "interactive": true}
```

Each transformation is **local**: it changes a constant number of links and passes one key up; no other part of the tree is touched. That's why order and balance survive every insert. (algs4 has a 2-3 tree demo that animates this.)

> ⚠️ **Pitfall**: A new key never goes into a new node at the bottom, because that would break perfect balance. It always joins an existing bottom node; only a root split adds a level.

### 7.4 Performance

The height of a 2-3 tree with n keys:

- **Worst case: lg n**, when all nodes are 2-nodes (a perfect binary tree).
- **Best case: log₃ n ≈ 0.631 lg n**, when all nodes are 3-nodes.

So search and insert visit at most about lg n nodes: guaranteed **O(log n)**, and 2-3 trees are at log n in every column of the dictionary table ([section 8.6](#86-time-analysis-and-the-dictionary-summary)). For a million keys that's between 12 and 20 levels.

The catch is the code: two node types, converting 2-nodes into 3-nodes, splitting 4-nodes, many cases. That difficulty is what the LLRB solves.

### 7.5 Practice

#### Building a 2-3 tree

Draw the 2-3 tree that results when you insert the keys E A S Y Q U T I O N in that order in an initially empty tree.

> Hint: splits happen when inserting S, Q, T (twice: a leaf and then the root) and O.

<details>
<summary>Solution</summary>

| Insert | What happens | Tree after (levels top to bottom, `[ ]` = one node) |
|---|---|---|
| E, A | 2-node → 3-node | [A E] |
| S | 4-node A E S at the root → split | [E] / [A] [S] |
| Y | into 2-node | [E] / [A] [S Y] |
| Q | 4-node Q S Y → S up | [E S] / [A] [Q] [Y] |
| U | into 2-node | [E S] / [A] [Q] [U Y] |
| T | 4-node T U Y → U up → root E S U → split | [S] / [E] [U] / [A] [Q] [T] [Y] |
| I | into 2-node | [S] / [E] [U] / [A] [I Q] [T] [Y] |
| O | 4-node I O Q → O up | [S] / [E O] [U] / [A] [I] [Q] [T] [Y] |
| N | into 2-node | [S] / [E O] [U] / [A] [I N] [Q] [T] [Y] |

Final tree: root **S**; second level **E O** and **U**; bottom **A**, **I N**, **Q** (children of E O) and **T**, **Y** (children of U). Height 3, all null links at the same depth. Check it:

```viz two-three-tree
{"title": "2-3 tree construction check: E A S Y Q U T I O N", "ops": "insert(E); insert(A); insert(S); insert(Y); insert(Q); insert(U); insert(T); insert(I); insert(O); insert(N)"}
```

</details>

## 8. Left-Leaning Red-Black BSTs (LLRB)

### 8.1 2-3 Trees as BSTs

**Use a plain BST to represent a 2-3 tree**:

- Start with a standard BST, made of 2-nodes.
- **Red links "glue" two 2-nodes into one logical 3-node.** A 3-node (a, b) becomes b with a as its left child, joined by a red link: less than a hangs left of a, between a and b hangs right of a, greater than b hangs right of b.
- **Black links** bind the 2-3 tree together.
- Red links are internal and **lean left**.

This is a **1-1 correspondence**: draw the red links horizontally and collapse the nodes they join, and you get the 2-3 tree back. Since the black links are exactly the 2-3 tree's links, the LLRB keeps **perfect black balance**. The advantage: **BST code works with minimal changes**. Use the View switch to flip between the LLRB and the 2-3 view (red links flat):

```viz llrb
{"title": "The anatomy tree as an LLRB", "tree": "M, J, R, *E, L, P, X, C, H, -, -, -, -, *S, -, *A"}
```

### 8.2 The LLRB Definition

A left-leaning red-black tree is a BST such that:

1. **No two consecutive red links**: no node has two red links connected to it.
2. **Left-leaning**: every red link leans left.
3. **Perfect black balance**: every path from the root to a null link has the same number of black links.

Rule 1 means there are no 4-nodes; rule 2 means each 3-node has one fixed shape; rule 3 is the 2-3 tree's perfect balance.

### 8.3 Search and the Node Class

**Search is exactly the BST search**: colors are ignored. It is the same `get` as in [section 2.1](#21-the-algorithm), but it runs faster because the tree is balanced.

There are no link objects, so **each node stores the color of the link from its parent**: `true` = red, `false` = black, and null links are always black. The LLRB `Node` is the BST `Node` of [section 1.4](#14-the-node-class) with one more field and constructor argument:

```cpp
  static constexpr bool RED = true;
  static constexpr bool BLACK = false;

  struct Node {
    Key key;               // sorted by key
    Value val;             // associated value
    Node* left;            // root of the subtree with smaller keys
    Node* right;           // root of the subtree with larger keys
    bool color;            // color of the link from the parent
    size_t size;           // number of nodes in the subtree rooted here

    Node(const Key& k, const Value& v, bool c, size_t s)
        : key(k), val(v), left(nullptr), right(nullptr), color(c), size(s) {}
  };

  bool isRed(Node* x) const {
    if (x == nullptr) return false;   // null links are black
    return x->color == RED;
  }
```

In the anatomy tree above, the link from J to its left child E is red (E's `color` is `RED`) while the link from M to J is black.

> ⚠️ **Pitfall**: The color is a property of the *link into* a node, not of the node "itself". "C is red" means "the link from C's parent to C is red". The root has no parent link, so it is always black.

### 8.4 Rotations and Color Flips

Insertion may temporarily break the color rules; three O(1) operations fix them:

- **Left rotation**: turn a (temporarily) right-leaning red link between h and its right child x into a left-leaning one. x takes h's place and h's color; h becomes x's red left child; x's old left subtree (keys between h and x) becomes h's right subtree.
- **Right rotation**: the mirror image: turn a left-leaning red link to (temporarily) lean right.
- **Color flip**: a node with two red children is a temporary 4-node. Make both children black and the node's own link red: the middle key moves up into its parent's 2-3 node. This is the 4-node split.

Each returns the new root of the subtree, and the rotations also keep the `size` counts right:

```cpp
  Node* rotateLeft(Node* h) {
    Node* x = h->right;
    h->right = x->left;
    x->left = h;
    x->color = h->color;
    h->color = RED;
    x->size = h->size;
    h->size = size(h->left) + size(h->right) + 1;
    return x;
  }

  Node* rotateRight(Node* h) {
    Node* x = h->left;
    h->left = x->right;
    x->right = h;
    x->color = h->color;
    h->color = RED;
    x->size = h->size;
    h->size = size(h->left) + size(h->right) + 1;
    return x;
  }

  void flipColors(Node* h) {
    h->color = RED;
    h->left->color = BLACK;
    h->right->color = BLACK;
  }
```

Each operation step by step, one statement per step (h and x are the local pointers; a node's fill is the color of the link from its parent). The three demos are one story, the end of `put(35)` into this LLRB: as a 2-3 tree, root **[20 60]** with children **10**, **[30 40]**, **70**. 35 lands between 30 and 40, that 3-node splits, and 35 moves up into **[20 60]**, so the demos start right after that split, with every subtree non-empty: x's inner subtree is a real node (30, then 40) that has to move, and h is red in the first rotation, so x inherits **red**. The demos leave out the two `size` lines of the code above, which only keep the subtree counts right. You can type your own tree into the first one:

```viz rb-rotation
{"title": "put(35), after the split below: rotateLeft(20) — h is red and has a parent", "op": "rotateLeft", "interactive": true}
```

`rotateLeft` in words: x = h's right child (35); h's right link takes x's left subtree (30, the keys between 20 and 35); x's left link takes h; x inherits h's color, **red** here, because 20 was the red left key of the 3-node; h turns red; `return x` and 60's left link now points at 35. The tree isn't legal yet: 60 → 35 → 20 are two red left links in a row.

```viz rb-rotation
{"title": "then rotateRight(60) — x's right subtree 40 moves over", "op": "rotateRight"}
```

`rotateRight` is the mirror image: x = h's left child (35); h's left link takes x's right subtree (40, the keys between 35 and 60); x's right link takes h; x inherits h's color (black this time); h turns red. Now 35 has two red children: a temporary 4-node 20 35 60.

```viz rb-rotation
{"title": "then flipColors(35), and put() blackens the root", "op": "flipColors"}
```

`flipColors` moves no pointer at all: h turns red and both children turn black, which splits the 4-node. 35 is the root here, so `put()`'s `root->color = BLACK` recolors it and the tree grows one level: 2-3 tree [35] / [20] [60] / 10, 30, 40, 70, a legal LLRB.

> 📘 **Going further**: A rotation changes three pointers and keeps symmetric order: the three subtrees (less than E, between E and S, greater than S) stay in the same left-to-right order. Neither a rotation nor a flip changes the number of black links on any root-to-null path, which is why they preserve perfect black balance. (algs4 §3.3; Thornton's AVL notes use the same rotations.)

### 8.5 LLRB Insertion

**Strategy**: keep the 1-1 correspondence with 2-3 trees. Symmetric order and perfect black balance are maintained during every step, but the color invariants may be violated temporarily: a right-leaning red link, two red children (temporary 4-node), left-left red, or left-right red (both temporary 4-nodes). Rotations and color flips restore them.

The algorithm:

1. Do a standard BST insertion and **color the new link red** (the new key joins an existing 2-3 node).
2. Repeat until the color invariants are restored, on the way back up:
   - right link red (left black)? → **rotate left**;
   - two left reds in a row? → **rotate right**;
   - both children red? → **flip colors**.
3. Color the root black (public method).

The code is the BST `put` of [section 3.1](#31-the-algorithm) plus the three checks:

```cpp
  // Insert the key-value pair into the subtree rooted at h.
  Node* put(Node* h, const Key& key, const Value& val) {
    if (h == nullptr) return new Node(key, val, RED, 1);   // insert at the bottom, red

    if (key < h->key)
      h->left = put(h->left, key, val);                    // traverse as in a BST
    else if (key > h->key)
      h->right = put(h->right, key, val);
    else
      h->val = val;

    if (isRed(h->right) && !isRed(h->left))     h = rotateLeft(h);   // right-leaning red link
    if (isRed(h->left) && isRed(h->left->left)) h = rotateRight(h);  // two left reds in a row
    if (isRed(h->left) && isRed(h->right))      flipColors(h);       // temporary 4-node

    h->size = size(h->left) + size(h->right) + 1;
    return h;
  }

  void put(const Key& key, const Value& val) {
    root = put(root, key, val);
    root->color = BLACK;                         // the root is always black
  }
```

The public `put` must **color the root black** after each insertion: a flip can turn the root's link red, and recoloring it black is how the tree grows taller, exactly the 2-3 root split. (algs4 §3.3, "Keeping the root black")

**The order of the three checks matters**: each fix produces exactly the situation the next check looks for. A left rotation can create two left reds in a row, which the right rotation turns into a node with two red children, which the color flip splits. Three `if`s in that order handle every case in one pass per level.

An example where doing the checks out of order needs extra work: insert a key **between** the two keys of a 3-node, e.g. 35 into the 3-node 30 40 (40 with red left child 30). 35 lands as 30's red right child: rotate left at 30 (now 40–35–30 is left-left red), rotate right at 40 (35 with red children 30 and 40), flip colors. Now suppose the flip were checked **before** the right rotation: at 40 the left child is red but the right child is null, so no flip; then the right rotation leaves 35 with two red children, an unsplit temporary 4-node that stays broken until some later pass reaches it. Checked in the right order, each fix sets up the next one at the same node. The whole `put(35)` from [section 8.4](#84-rotations-and-color-flips), from the new red node up (the same three fixes run again one level up, at 20 and 60):

```viz rb-rotation
{"title": "The whole put(35), fixes in order at 30 / 40, then at 20 / 60", "op": "rotateLeft(30), rotateRight(40), flipColors, rotateLeft(20), rotateRight(60), flipColors"}
```

Step through the trace of inserting S E A R C H X M P L, in either view:

```viz llrb
{"title": "put S E A R C H X M P L", "ops": "put(S); put(E); put(A); put(R); put(C); put(H); put(X); put(M); put(P); put(L)", "interactive": true}
```

The compiled program in [section 9.2](#92-llrb) builds the same tree and prints it (`*` marks a red link).

> ⚠️ **Pitfall**: `h = rotateLeft(h);` — the rotation returns the new subtree root and you must store it (and return `h` at the end), the same way BST `put` returns its link. Calling `rotateLeft(h);` alone leaves the parent pointing at the wrong node.

### 8.6 Time Analysis and the Dictionary Summary

**Height of an LLRB is ≤ 2 lg n** in the worst case. The worst case: the **shortest** root-to-null path is all black links (all 2-nodes, about lg n), and the **longest** path alternates black and red links (every node on it is a 3-node), so it is at most twice as long. Since all paths have the same number of black links, no path can be longer than 2 × that.

Summary of dictionary operations:

| | Search (worst) | Insert (worst) | Delete (worst) | Search (avg) | Insert (avg) | Delete (avg) |
|---|---|---|---|---|---|---|
| Sequential search (unordered list) | n | n | n | n/2 | n | n/2 |
| Binary search (ordered array) | log n | n | n | log n | n/2 | n/2 |
| BST | n | n | n | log n | log n | √n |
| 2-3 search tree | c log n | c log n | c log n | c log n | c log n | c log n |
| Red-black BST | 2 log n | 2 log n | 2 log n | 1 log n | 1 log n | 1 log n |

(The BST's average delete is √n only once repeated Hibbard deletions have skewed the tree, as in [section 6](#6-why-we-need-balance); with random insertions alone it stays log n.) So an LLRB is **O(log n) worst case** for search, insert and delete, and in practice paths are about lg n long.

### 8.7 Practice

#### Which trees are legal LLRBs?

Which of the following are legal LLRB trees? Convert the legal LLRBs to 2-3 trees. (Red links marked "red".)

- **(i)** C; C's left A (red), C's right Y; Y's left H; H's left D (red).
- **(ii)** E; E's left D (red), E's right H; D's children C and F; C's left A (red); H's children G and Z.
- **(iii)** E; children B and Y; B's children A and D; Y's children H and Z (all black).
- **(iv)** H; children C and Y; C's left A (red); Y's left T (red).

<details>
<summary>Solution</summary>

**(iii) and (iv) only.**

- **(i)** is **not balanced**: the path C → A → null has 1 black link, while C → Y → H → D → null has 3. (A 2-node Y with only a left child can't exist in a 2-3 tree.)
- **(ii)** is **not in symmetric order**: F is in D's right subtree, so it must be between D and E, but F > E (in-order: A C D F E G H Z). It isn't balanced either.
- **(iii)** has no red links and every root-to-null path has 3 black links → legal. Its 2-3 tree is the same shape: root [E], then [B] [Y], then [A] [D] [H] [Z], all 2-nodes.
- **(iv)**: both red links lean left, no node touches two red links, every path has 2 black links → legal. 2-3 tree: root [H], children **[A C]** and **[T Y]**.

Check each tree against the three rules (switch to the 2-3 view for the conversion):

```viz llrb
{"title": "Legal LLRB check: tree (iv)", "tree": "H, C, Y, *A, -, *T", "ops": "check()"}
```

```viz llrb
{"title": "Legal LLRB check: tree (i)", "tree": "C, *A, Y, -, -, H, -, -, -, -, -, *D", "ops": "check()"}
```

</details>

#### Constructing an LLRB

Construct the LLRB by inserting in order: **S E A R C H X M P L**, and then (separately) **A C E H L M P R S X**.

> Hint: after every insertion, run the three checks bottom-up, then make the root black.

<details>
<summary>Solution</summary>

**S E A R C H X M P L**: fix-ups per insertion (bottom-up):

| Insert | Fix-ups |
|---|---|
| S, E | none (E is S's red left child) |
| A | rotate right at S, flip colors at E, root black |
| R | none |
| C | rotate left at A |
| H | rotate right at S, flip at R, rotate left at E → R is the root, E its red left child |
| X | rotate left at S |
| M | rotate left at H |
| P | flip at M (children H, P); rotate left at E; rotate right at R; flip at M again; root black (height grows) |
| L | rotate left at H |

Final: root **M**; **E** and **R** below it; E's children **C** (with red left child A) and **L** (with red left child H); R's children **P** and **X** (with red left child S). As a 2-3 tree: [M] / [E] [R] / [A C] [H L] [P] [S X].

**A C E H L M P R S X** (ascending): the new key always lands on the right, so almost every insertion starts with a left rotation, and a color flip propagates up whenever the right spine fills. Final: root **H**; **C** (children A, E) and **R**; R's left child **M** is red (M's children L, P), R's right child **X** has red left child **S**. As a 2-3 tree: [H] / [C] [M R] / [A] [E] [L] [P] [S X]. Ascending input, the worst case for a plain BST, still gives height 4.

```viz llrb
{"title": "LLRB construction check: ascending order", "ops": "put(A); put(C); put(E); put(H); put(L); put(M); put(P); put(R); put(S); put(X)"}
```

The compiled program in [section 9.2](#92-llrb) builds both trees.

</details>

## 9. Complete Implementation

Two classes cover the chapter, with the same `Node` conventions (`key`, `val`, `left`, `right`, `size`, a `size(Node*)` helper, recursive `put` returning the subtree root): `BST` is a dictionary with `put`, `get`, `contains`, Hibbard `remove`, `min`, `deleteMin` and a destructor; `LLRB` is the same tree with a `color` per node, the two rotations, `flipColors` and the three-check `put`. `main` replays the worked examples and practice problems.

### 9.1 BST

`print` writes a tree as `key(left right)` with `-` for an empty subtree.

```cpp
#include <cstddef>
#include <iostream>
#include <vector>

// Binary search tree used as a dictionary: symmetric order, Hibbard deletion.
template <typename Key, typename Value>
class BST {
private:
  struct Node {
    Key key;               // sorted by key
    Value val;             // associated value
    Node* left;            // root of the subtree with smaller keys
    Node* right;           // root of the subtree with larger keys
    size_t size;           // number of nodes in the subtree rooted here

    Node(const Key& k, const Value& v, size_t s)
        : key(k), val(v), left(nullptr), right(nullptr), size(s) {}
  };

  Node* root;              // root of the BST

  size_t size(Node* x) const { return x == nullptr ? 0 : x->size; }

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

  // Unlinks (does not delete) the minimum node of the subtree rooted at x.
  Node* deleteMin(Node* x) {
    if (x->left == nullptr)
      return x->right;
    x->left = deleteMin(x->left);
    x->size = 1 + size(x->left) + size(x->right);
    return x;
  }

  Node* remove(Node* x, const Key& key) {          // Hibbard deletion
    if (x == nullptr) return nullptr;              // key not found
    if (key < x->key)
      x->left = remove(x->left, key);
    else if (key > x->key)
      x->right = remove(x->right, key);
    else {
      if (x->right == nullptr) {                   // leaf, or only a left child
        Node* l = x->left;
        delete x;
        return l;
      }
      if (x->left == nullptr) {                    // only a right child
        Node* r = x->right;
        delete x;
        return r;
      }
      Node* t = x;                                 // two children
      x = min(t->right);                           // successor
      x->right = deleteMin(t->right);              // unlink it from the right subtree
      x->left = t->left;
      delete t;
    }
    x->size = 1 + size(x->left) + size(x->right);
    return x;
  }

  size_t height(Node* x) const {                   // number of nodes on the longest path
    if (x == nullptr) return 0;
    size_t l = height(x->left), r = height(x->right);
    return 1 + (l > r ? l : r);
  }

  void destroy(Node* x) {
    if (x == nullptr) return;
    destroy(x->left);
    destroy(x->right);
    delete x;
  }

  void inorder(Node* x, std::ostream& out) const {
    if (x == nullptr) return;
    inorder(x->left, out);
    out << x->key << ' ';
    inorder(x->right, out);
  }

  void preorder(Node* x, std::ostream& out) const {   // key(left right), - = empty
    if (x == nullptr) { out << '-'; return; }
    out << x->key;
    if (x->left == nullptr && x->right == nullptr) return;
    out << '(';
    preorder(x->left, out);
    out << ' ';
    preorder(x->right, out);
    out << ')';
  }

public:
  BST() : root(nullptr) {}
  BST(const BST&) = delete;
  BST& operator=(const BST&) = delete;
  ~BST() { destroy(root); }

  size_t size() const { return size(root); }
  size_t height() const { return height(root); }
  Value get(const Key& key) const { return get(root, key); }
  void put(const Key& key, const Value& val) { root = put(root, key, val); }
  void remove(const Key& key) { root = remove(root, key); }

  // Search that tells a miss from a stored Value().
  bool contains(const Key& key) const {
    Node* x = root;
    while (x != nullptr) {
      if (key < x->key) x = x->left;
      else if (key > x->key) x = x->right;
      else return true;
    }
    return false;
  }

  void printInorder(std::ostream& out) const { inorder(root, out); out << '\n'; }
  void print(std::ostream& out) const { preorder(root, out); out << '\n'; }
};

int main() {
  // Symmetric order: in-order traversal gives the sorted keys.
  BST<char, int> letters;
  for (char c : {'S', 'E', 'X', 'A', 'R', 'C', 'H', 'M'}) letters.put(c, 0);
  std::cout << "S E X A R C H M, in order: ";
  letters.printInorder(std::cout);
  letters.put('L', 0);
  std::cout << "after put(L): ";
  letters.print(std::cout);

  // Shape depends on the insertion order.
  BST<char, int> best, stick;
  for (char c : {'H', 'C', 'S', 'A', 'E', 'R', 'X'}) best.put(c, 0);
  for (char c : {'A', 'C', 'E', 'H', 'R', 'S', 'X'}) stick.put(c, 0);
  std::cout << "H C S A E R X: height " << best.height()
            << ", A C E H R S X: height " << stick.height() << '\n';

  // Search and insert on the practice tree.
  const std::vector<int> keys{8, 3, 10, 1, 6, 14, 4, 7, 13};
  BST<int, int> t;
  for (int k : keys) t.put(k, k * 10);
  t.print(std::cout);
  std::cout << std::boolalpha << "get(4) = " << t.get(4) << ", get(9) = " << t.get(9)
            << ", contains(9) = " << t.contains(9) << ", size = " << t.size() << '\n';
  t.put(4, 3);
  t.put(9, 2);
  std::cout << "get(4) = " << t.get(4) << ", get(9) = " << t.get(9)
            << ", size = " << t.size() << '\n';
  t.print(std::cout);

  // Hibbard deletion, each key removed from a fresh copy of the original tree.
  for (int k : {1, 14, 6, 3, 8}) {
    BST<int, int> u;
    for (int x : keys) u.put(x, 0);
    u.remove(k);
    std::cout << "remove " << k << ": ";
    u.print(std::cout);
  }
  BST<int, int> h;
  for (int x : {21, 10, 79, 73, 95, 70, 74, 71}) h.put(x, 0);
  h.remove(21);
  std::cout << "remove 21: ";
  h.print(std::cout);

  // The three cases on the worked examples.
  const std::vector<int> tree46{46, 34, 70, 11, 44, 52, 6, 19};
  for (int k : {52, 70}) {
    BST<int, int> w;
    for (int x : tree46) w.put(x, 0);
    w.remove(k);
    std::cout << "46 tree, remove " << k << ": ";
    w.print(std::cout);
  }
  BST<int, int> z;
  for (int x : {50, 29, 65, 11, 32, 51, 91, 52, 72, 99}) z.put(x, 0);
  z.remove(50);
  std::cout << "50 tree, remove 50: ";
  z.print(std::cout);
}
```

Output:

```text
S E X A R C H M, in order: A C E H M R S X 
after put(L): S(E(A(- C) R(H(- M(L -)) -)) X)
H C S A E R X: height 3, A C E H R S X: height 7
8(3(1 6(4 7)) 10(- 14(13 -)))
get(4) = 40, get(9) = 0, contains(9) = false, size = 9
get(4) = 3, get(9) = 2, size = 10
8(3(1 6(4 7)) 10(9 14(13 -)))
remove 1: 8(3(- 6(4 7)) 10(- 14(13 -)))
remove 14: 8(3(1 6(4 7)) 10(- 13))
remove 6: 8(3(1 7(4 -)) 10(- 14(13 -)))
remove 3: 8(4(1 6(- 7)) 10(- 14(13 -)))
remove 8: 10(3(1 6(4 7)) 14(13 -))
remove 21: 70(10 79(73(71 74) 95))
46 tree, remove 52: 46(34(11(6 19) 44) 70)
46 tree, remove 70: 46(34(11(6 19) 44) 52)
50 tree, remove 50: 51(29(11 32) 65(52 91(72 99)))
```

### 9.2 LLRB

`*` marks a node whose link from the parent is red; `check()` verifies the three rules and a black root.

```cpp
#include <cstddef>
#include <iostream>
#include <string>

// Left-leaning red-black BST: the BST of the previous listing, plus one color per node.
template <typename Key, typename Value>
class LLRB {
private:
  static constexpr bool RED = true;
  static constexpr bool BLACK = false;

  struct Node {
    Key key;               // sorted by key
    Value val;             // associated value
    Node* left;            // root of the subtree with smaller keys
    Node* right;           // root of the subtree with larger keys
    bool color;            // color of the link from the parent
    size_t size;           // number of nodes in the subtree rooted here

    Node(const Key& k, const Value& v, bool c, size_t s)
        : key(k), val(v), left(nullptr), right(nullptr), color(c), size(s) {}
  };

  Node* root;              // root of the tree

  bool isRed(Node* x) const {
    if (x == nullptr) return false;   // null links are black
    return x->color == RED;
  }

  size_t size(Node* x) const { return x == nullptr ? 0 : x->size; }

  Value get(Node* x, const Key& key) const {   // exactly the BST search: colors are ignored
    if (x == nullptr)
      return Value();
    if (key < x->key)
      return get(x->left, key);
    else if (key > x->key)
      return get(x->right, key);
    else
      return x->val;
  }

  Node* rotateLeft(Node* h) {
    Node* x = h->right;
    h->right = x->left;
    x->left = h;
    x->color = h->color;
    h->color = RED;
    x->size = h->size;
    h->size = size(h->left) + size(h->right) + 1;
    return x;
  }

  Node* rotateRight(Node* h) {
    Node* x = h->left;
    h->left = x->right;
    x->right = h;
    x->color = h->color;
    h->color = RED;
    x->size = h->size;
    h->size = size(h->left) + size(h->right) + 1;
    return x;
  }

  void flipColors(Node* h) {
    h->color = RED;
    h->left->color = BLACK;
    h->right->color = BLACK;
  }

  // Insert the key-value pair into the subtree rooted at h.
  Node* put(Node* h, const Key& key, const Value& val) {
    if (h == nullptr) return new Node(key, val, RED, 1);   // insert at the bottom, red

    if (key < h->key)
      h->left = put(h->left, key, val);                    // traverse as in a BST
    else if (key > h->key)
      h->right = put(h->right, key, val);
    else
      h->val = val;

    if (isRed(h->right) && !isRed(h->left))     h = rotateLeft(h);   // right-leaning red link
    if (isRed(h->left) && isRed(h->left->left)) h = rotateRight(h);  // two left reds in a row
    if (isRed(h->left) && isRed(h->right))      flipColors(h);       // temporary 4-node

    h->size = size(h->left) + size(h->right) + 1;
    return h;
  }

  size_t height(Node* x) const {                 // number of nodes on the longest path
    if (x == nullptr) return 0;
    size_t l = height(x->left), r = height(x->right);
    return 1 + (l > r ? l : r);
  }

  // Number of black links from x down to every null link, or -1 if the paths disagree.
  int blackHeight(Node* x) const {
    if (x == nullptr) return 0;
    int l = blackHeight(x->left), r = blackHeight(x->right);
    if (l < 0 || r < 0 || l != r) return -1;
    return l + (isRed(x) ? 0 : 1);
  }

  bool noRedViolations(Node* x) const {          // no right reds, no two reds in a row
    if (x == nullptr) return true;
    if (isRed(x->right)) return false;
    if (isRed(x) && isRed(x->left)) return false;
    return noRedViolations(x->left) && noRedViolations(x->right);
  }

  void destroy(Node* x) {
    if (x == nullptr) return;
    destroy(x->left);
    destroy(x->right);
    delete x;
  }

  void inorder(Node* x, std::ostream& out) const {   // red links marked *
    if (x == nullptr) return;
    inorder(x->left, out);
    out << (isRed(x) ? "*" : "") << x->key << ' ';
    inorder(x->right, out);
  }

  void preorder(Node* x, std::ostream& out) const {  // key(left right), * = red link, - = empty
    if (x == nullptr) { out << '-'; return; }
    out << (isRed(x) ? "*" : "") << x->key;
    if (x->left == nullptr && x->right == nullptr) return;
    out << '(';
    preorder(x->left, out);
    out << ' ';
    preorder(x->right, out);
    out << ')';
  }

public:
  LLRB() : root(nullptr) {}
  LLRB(const LLRB&) = delete;
  LLRB& operator=(const LLRB&) = delete;
  ~LLRB() { destroy(root); }

  size_t size() const { return size(root); }
  size_t height() const { return height(root); }
  Value get(const Key& key) const { return get(root, key); }

  void put(const Key& key, const Value& val) {
    root = put(root, key, val);
    root->color = BLACK;                         // the root is always black
  }

  // The three rules of the definition (plus a black root).
  bool check() const {
    return !isRed(root) && noRedViolations(root) && blackHeight(root) >= 0;
  }

  void printInorder(std::ostream& out) const { inorder(root, out); out << '\n'; }
  void print(std::ostream& out) const { preorder(root, out); out << '\n'; }
};

int main() {
  LLRB<char, int> t;
  std::string keys = "SEARCHXMPL";
  for (size_t i = 0; i < keys.size(); i++) t.put(keys[i], static_cast<int>(i));
  std::cout << "S E A R C H X M P L\n  in order: ";
  t.printInorder(std::cout);
  std::cout << "  tree: ";
  t.print(std::cout);
  std::cout << std::boolalpha << "  size " << t.size() << ", height " << t.height() << ", legal " << t.check()
            << ", get(H) = " << t.get('H') << ", get(Z) = " << t.get('Z') << '\n';

  LLRB<char, int> u;
  std::string inc = "ACEHLMPRSX";
  for (size_t i = 0; i < inc.size(); i++) u.put(inc[i], static_cast<int>(i));
  std::cout << "A C E H L M P R S X (ascending)\n  tree: ";
  u.print(std::cout);
  std::cout << "  height " << u.height() << ", legal " << u.check() << '\n';

  // Ascending input is the worst case for a plain BST; here height stays near lg n.
  LLRB<int, int> big;
  for (int k = 1; k <= 1023; k++) big.put(k, k);
  std::cout << "1023 ascending keys: height " << big.height() << " (2 lg n = 20), legal "
            << big.check() << '\n';
}
```

Output (height counts nodes on the longest path):

```text
S E A R C H X M P L
  in order: *A C E *H L M P R *S X 
  tree: M(E(C(*A -) L(*H -)) R(P X(*S -)))
  size 10, height 4, legal true, get(H) = 5, get(Z) = 0
A C E H L M P R S X (ascending)
  tree: H(C(A E) R(*M(L P) X(*S -)))
  height 4, legal true
1023 ascending keys: height 10 (2 lg n = 20), legal true
```

## 10. Quick Reference & Top 5 Things to Remember

| | BST | 2-3 tree | LLRB |
|---|---|---|---|
| Node | 1 key, 2 links | 1–2 keys, 2–3 links | 1 key, 2 links + color of parent link |
| Balance | none (depends on insertion order) | perfect (all null links at one depth) | perfect black balance |
| Height | n worst, O(log n) random | between log₃ n and lg n | ≤ 2 lg n |
| Search / insert (worst) | O(n) | O(log n) | O(log n) |
| Delete | Hibbard: leaf, one child, successor; drifts to √n | — | O(log n) worst case (summary table) |
| Insert fix-ups | none | split temporary 4-nodes upward | rotateLeft, rotateRight, flipColors, root black |

**Top 5 things to remember**

1. A BST is symmetric-ordered over whole subtrees; search and insert cost depth + 1 compares, i.e. O(height), which is O(log n) for random order but n for sorted input.
2. Hibbard deletion: leaf → remove; one child → replace by the child; two children → replace by the successor (left-most node of the right subtree) and unlink it with `deleteMin`; repeated use skews the tree.
3. A 2-3 tree stays perfectly balanced because inserts join a bottom node and split temporary 4-nodes upward; only a root split adds height, so height is between log₃ n and lg n.
4. An LLRB encodes a 2-3 tree as a BST: red links glue 2-nodes into 3-nodes, no two reds in a row, reds lean left, equal black count on every path, so height ≤ 2 lg n.
5. LLRB `put`: insert red at the bottom, then on the way up rotate left (right red), rotate right (two left reds), flip colors (two red children), in that order, and color the root black.

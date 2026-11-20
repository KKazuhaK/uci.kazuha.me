---
title: "2-3 Trees & Red-Black BSTs"
summary: "Balanced search trees: 2-3 tree search, insertion with 4-node splits and height bounds; left-leaning red-black BSTs (1-1 correspondence, definition, rotations, color flips, insertion and its order of checks, 2 lg n height); then hash tables: buckets, hash code + compression, collisions."
---

# Information and Computer Science 46 — Lecture 14: Balanced BSTs (2-3 Trees, LLRB) + Hash Tables

## Table of Contents

- [1. The Goal: log n in the Worst Case](#1-the-goal-log-n-in-the-worst-case)
- [2. 2-3 Trees](#2-2-3-trees)
- [3. 2-3 Tree Search](#3-2-3-tree-search)
- [4. 2-3 Tree Insertion](#4-2-3-tree-insertion)
- [5. 2-3 Tree Performance](#5-2-3-tree-performance)
- [6. Left-Leaning Red-Black BSTs: 2-3 Trees as BSTs](#6-left-leaning-red-black-bsts-2-3-trees-as-bsts)
- [7. The LLRB Definition](#7-the-llrb-definition)
- [8. Search and the Node Class](#8-search-and-the-node-class)
- [9. Rotations and Color Flips](#9-rotations-and-color-flips)
- [10. LLRB Insertion](#10-llrb-insertion)
- [11. LLRB Time Analysis and the Dictionary Summary](#11-llrb-time-analysis-and-the-dictionary-summary)
- [12. Hash Tables: the Idea](#12-hash-tables-the-idea)
- [13. Hash Functions: Hash Code + Compression](#13-hash-functions-hash-code--compression)
- [14. Collisions](#14-collisions)
- [15. Complete Implementation](#15-complete-implementation)
- [16. In-class Activities (with Solutions)](#16-in-class-activities-with-solutions)
- [17. Quick Reference & Top 5 Things to Remember](#17-quick-reference--top-5-things-to-remember)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh, Fall 2026, 11/10/26 and 11/17/26 (both decks are titled "Lecture 14")
> Built from the 11/10 deck "Balanced BST + Review" (2-3 trees) and the 11/17 deck "LLRB + Hash Tables", with algs4 §3.3 Balanced Search Trees, algs4 §3.4 Hash Tables and Thornton's ICS 46 notes (Hash Tables; AVL Trees for rotations) as supplements. The 11/17 deck's separate-chaining slides are repeated in Lecture 15, so they are covered there. Organized by concept, not by source.

> 📅 **Class logistics**: (11/10) Midterm Thu 11/12 · Quiz 4: Sorting, Trees, Heaps · new HW/Lab released after the midterm
> (11/17) Quiz 5 Fri 11/20 (BST and balanced BST) · HW 6 & Lab 5 due Fri 11/20 · midterms still being graded
> Course-approved AI tool: submit the two-part consent form (data storage for tool access — not used for academic-integrity cases; optional research use for 1% extra credit, with an alternative EC method)
> The 11/10 deck ended with two midterm-review problems (circular SLL `removeLast`, a stack built from one queue); they're worked in the [midterm review notes](midterm-review.en-US.md).

---

## 1. The Goal: log n in the Worst Case

A plain BST is only fast when it happens to be balanced. Slide 5 (11/10) puts the problem in one table:

| | Search (worst) | Insert (worst) | Delete (worst) | Search (avg) | Insert (avg) | Delete (avg) |
|---|---|---|---|---|---|---|
| BST | n | n | n | log n | log n | √n |
| **Goal** | **log n** | **log n** | **log n** | **log n** | **log n** | **log n** |

The worst case is the "stick" from sorted input (A C E H R S X); random input gives log n, but Hibbard deletion drifts the average delete to √n. **Balanced search trees** guarantee log n for every operation. Red-black trees are the ones used as system symbol tables (e.g. C++ `std::map`); AVL, splay and randomized BSTs are other balanced BSTs. Yeh teaches the **left-leaning red-black tree (LLRB)**, and to understand it we start with the 2-3 tree.

## 2. 2-3 Trees

A 2-3 tree lets a node hold **one or two keys**:

- **2-node**: 1 key (and value), **2 links** — left subtree smaller, right subtree larger (a normal BST node).
- **3-node**: 2 keys (and values), **3 links** — left (< key1), middle (between key1 and key2), right (> key2).

Two properties hold at all times:

- **Symmetric order**: an in-order traversal yields all keys in ascending order.
- **Perfect balance**: every path from the root to a null link has exactly the same length.

The "anatomy" tree used all lecture (root M; E J and R below; A C, H, L, P, S X at the bottom):

```viz two-three-tree
{"title": "Anatomy of a 2-3 search tree (slides 8, 11): search for H", "keys": "R, C, X, E, S, P, M, L, A, H, J", "ops": "get(H)"}
```

(The demo builds that tree by inserting the keys in a suitable order; keys of one node are joined by a thick bar.)

## 3. 2-3 Tree Search

Compare the search key against **every key in the node**, find the interval that contains it (left, middle if it's a 3-node, or right), follow that link, and repeat (slides 9–12). Slides 9–10 search for **H**: H < M → left; H is between E and J → middle; H found → return its value (search hit). A miss ends at a null link.

## 4. 2-3 Tree Insertion

Search for the key; the search ends at a node at the bottom. Then (slides 14–18):

1. **Into a 2-node**: add the key, making it a 3-node. Done. (Slide 14: insert K → the 2-node L becomes K L.)
2. **Into a 3-node**: add the key to make a **temporary 4-node** (3 keys, 4 links), then split it into two 2-nodes and **pass the middle key up to the parent**:
   - tree is a single 3-node (slide 15, insert S into A E → A E S): the middle key E becomes a new root with children A and S. **Height went up by 1**.
   - parent is a 2-node (slide 16, insert Z into S X → S X Z): X goes up, the parent R becomes the 3-node R X. Done.
   - parent is a 3-node (slide 17, insert D into A C → A C D): C goes up, the parent E J becomes the temporary 4-node C E J; split again, E goes up to M. **Repeat up the tree as necessary.**
3. **Splitting the root** (slide 18): if the root ends up a temporary 4-node, split it into **three 2-nodes**. The height grows by 1 but perfect balance is preserved — 2-3 trees grow at the **top**, not at the bottom.

Step through the slide examples on the anatomy tree (← / → keys work when the demo is focused):

```viz two-three-tree
{"title": "Slides 14–17: insert K, Z, D", "keys": "R, C, X, E, S, P, M, L, A, H, J", "ops": "insert(K); insert(Z); insert(D)", "interactive": true}
```

Each transformation is **local**: it changes a constant number of links and passes one key up; no other part of the tree is touched. That's why order and balance survive every insert. (Slide 13 links the algs4 *3.3 2-3 Tree Demo*.)

> ⚠️ **Pitfall**: A new key never goes into a new node at the bottom — that would break perfect balance. It always joins an existing bottom node; only a root split adds a level.

> 📝 **Practice**: [Activity 1 (11/10)](#161-activity-1-construction-1110-deck-slide-19) — build a 2-3 tree from E A S Y Q U T I O N.

## 5. 2-3 Tree Performance

Slide 20 asks for the height of a 2-3 tree with n keys:

- **Worst case: lg n** — all 2-nodes (a perfect binary tree).
- **Best case: log₃ n ≈ 0.631 lg n** — all 3-nodes.

So search and insert visit at most about lg n nodes: guaranteed **O(log n)**, and slide 21 puts 2-3 trees at log n in every column of the table. For a million keys that's between 12 and 20 levels.

The catch is the code: two node types, converting 2-nodes into 3-nodes, splitting 4-nodes, many cases. That difficulty is what the LLRB solves.

## 6. Left-Leaning Red-Black BSTs: 2-3 Trees as BSTs

**Use a plain BST to represent a 2-3 tree** (slides 5–7, 9 of the 11/17 deck):

- Start with a standard BST, made of 2-nodes.
- **Red links "glue" two 2-nodes into one logical 3-node.** A 3-node (a, b) becomes b with a as its left child, joined by a red link: less than a hangs left of a, between a and b hangs right of a, greater than b hangs right of b.
- **Black links** bind the 2-3 tree together.
- Red links are internal and **lean left**.

This is a **1-1 correspondence**: draw the red links horizontally and collapse the nodes they join, and you get the 2-3 tree back. Since the black links are exactly the 2-3 tree's links, the LLRB keeps **perfect black balance**. The advantage: **BST code works with minimal changes**. Use the View switch to flip between the LLRB and the 2-3 view (red links flat):

```viz llrb
{"title": "Slides 6–7: the anatomy tree as an LLRB", "tree": "M, J, R, *E, L, P, X, C, H, -, -, -, -, *S, -, *A"}
```

## 7. The LLRB Definition

A left-leaning red-black tree is a BST such that (slide 10):

1. **No two consecutive red links**: no node has two red links connected to it.
2. **Left-leaning**: every red link leans left.
3. **Perfect black balance**: every path from the root to a null link has the same number of black links.

Rule 1 means there are no 4-nodes; rule 2 means each 3-node has one fixed shape; rule 3 is the 2-3 tree's perfect balance.

> 📝 **Practice**: [Activity 1 (11/17)](#162-activity-1-legal-llrbs-1117-deck-slide-8) — which trees are legal LLRBs?

## 8. Search and the Node Class

**Search is exactly the BST search** — colors are ignored — but it runs faster because the tree is balanced (slide 11):

```cpp
Value get(const Key& key) const{
    return get(root, key);
}

Value get(Node* x, const Key& key) const {
    while (x != nullptr) {
        if      (key < x->key) x = x->left;
        else if (key > x->key) x = x->right;
        else                   return x->val;
    }
    return Value{};
}
```

There are no link objects, so **each node stores the color of the link from its parent** (slide 12): `true` = red, `false` = black, and null links are always black.

```cpp
static const bool RED = true;
static const bool BLACK = false;
// BST helper node data type
class Node {
public:
Key key; // key
     Value val; // associated data
     Node *left, *right; // links to left and right subtrees
     bool color; // color of parent link
     int size; // subtree count
};
bool isRed(Node* x) {
     if (x == nullptr) return false; // null links are black
     return x->color == RED;
}
```

In the slide's picture, `h->left->color` is RED (E–C is red) and `h->right->color` is BLACK (E–J is black).

> ⚠️ **Pitfall**: The color is a property of the *link into* a node, not of the node "itself". "C is red" means "the link from C's parent to C is red". The root has no parent link, so it is always black.

## 9. Rotations and Color Flips

Insertion may temporarily break the color rules; three O(1) operations fix them (slides 13–15). The slides show them as pictures; the code below is the standard algs4 version in Yeh's C++ style (`size` updates included so the counts stay right):

- **Left rotation**: turn a (temporarily) right-leaning red link between h and its right child x into a left-leaning one. x takes h's place and h's color; h becomes x's red left child; x's old left subtree (keys between h and x) becomes h's right subtree.
- **Right rotation**: the mirror image — turn a left-leaning red link to (temporarily) lean right.
- **Color flip**: a node with two red children is a temporary 4-node. Make both children black and the node's own link red: the middle key moves up into its parent's 2-3 node — this is the 4-node split.

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
// rotateRight: same code with left and right swapped

void flipColors(Node* h) {
    h->color = RED;
    h->left->color = BLACK;
    h->right->color = BLACK;
}
```

> 📘 **Beyond the lecture**: A rotation changes three pointers and keeps symmetric order — the three subtrees (less than E, between E and S, greater than S) stay in the same left-to-right order. Neither a rotation nor a flip changes the number of black links on any root-to-null path, which is why they preserve perfect black balance. (algs4 §3.3; Thornton's AVL notes use the same rotations.)

## 10. LLRB Insertion

**Strategy**: keep the 1-1 correspondence with 2-3 trees. Symmetric order and perfect black balance are maintained during every step, but the color invariants may be violated temporarily (slide 16): a right-leaning red link, two red children (temporary 4-node), left-left red, or left-right red (both temporary 4-nodes). Rotations and color flips restore them.

The algorithm (slide 17):

1. Do a standard BST insertion and **color the new link red** (the new key joins an existing 2-3 node).
2. Repeat until the color invariants are restored, on the way back up:
   - right link red (left black)? → **rotate left**;
   - two left reds in a row? → **rotate right**;
   - both children red? → **flip colors**.

The code (slide 19):

```cpp
// insert the key-value pair in the subtree rooted at h
template <typename Key, typename Value>
Node<Key, Value>* put(Node<Key, Value>* h, const Key& key, const Value& val) {
    if (h == nullptr) return new Node<Key,Value>(key, val, RED, 1);  // Insert at bottom, color red

    if (key < h->key) h->left = put(h->left,  key, val);  // Compare as before to traverse tree
    else if (key > h->key) h->right = put(h->right, key, val);
    else h->val    = val;

    if (isRed(h->right) &&  !isRed(h->left))       h = rotateLeft(h); // Fix any right-leaning links
    if (isRed(h->left)  &&   isRed(h->left->left)) h = rotateRight(h);// 2 left red links
    if (isRed(h->left)  &&   isRed(h->right))      flipColors(h);     // 4-node

    h->size = size(h->left) + size(h->right) + 1;
    return h;
}
```

Slide bug: the slide 12 `Node` is a plain class with no constructor (and no template parameters), so `new Node<Key,Value>(key, val, RED, 1)` doesn't compile as shown — give `Node` a constructor `Node(key, val, color, size)` that sets both links to `nullptr`, as in [§15](#15-complete-implementation).

**The order of the three checks matters** (slides 19–20): each fix produces exactly the situation the next check looks for — a left rotation can create two left reds in a row, which the right rotation turns into a node with two red children, which the color flip splits. Three `if`s in that order handle every case in one pass per level.

Slide 20 asks for an example where doing the checks out of order needs extra work: insert a key **between** the two keys of a 3-node, e.g. B into the 3-node A C (C with red left child A). B lands as A's red right child: rotate left at A (now C–B–A is left-left red), rotate right at C (B with red children A and C), flip colors. Now suppose the flip were checked **before** the right rotation: at C the left child is red but the right child is null, so no flip; then the right rotation leaves B with two red children — an unsplit temporary 4-node that stays broken until some later pass reaches it. Checked in the slide's order, each fix sets up the next one at the same node.

Step through it on the slide 21 trace (S E A R C H X M P L), in either view:

```viz llrb
{"title": "Slide 21: put S E A R C H X M P L", "ops": "put(S); put(E); put(A); put(R); put(C); put(H); put(X); put(M); put(P); put(L)", "interactive": true}
```

> 📘 **Beyond the lecture**: Slide 19 shows only the recursive `put`. The public `put` must also **color the root black** after each insertion: `root = put(root, key, val); root->color = BLACK;`. A flip can turn the root's link red; recoloring it black is how the tree grows taller — exactly the 2-3 root split. (algs4 §3.3, "Keeping the root black")

> ⚠️ **Pitfall**: `h = rotateLeft(h);` — the rotation returns the new subtree root and you must store it (and return `h` at the end), the same way BST `put` returns its link. Calling `rotateLeft(h);` alone leaves the parent pointing at the wrong node.

> 📝 **Practice**: [Activity 2 (11/17)](#163-activity-2-construct-an-llrb-1117-deck-slide-21) — insert S E A R C H X M P L, then A C E H L M P R S X.

## 11. LLRB Time Analysis and the Dictionary Summary

**Height of an LLRB is ≤ 2 lg n** in the worst case (slide 22). The worst case: the **shortest** root-to-null path is all black links (all 2-nodes, about lg n), and the **longest** path alternates black and red links (every node on it is a 3-node), so it is at most twice as long. Since all paths have the same number of black links, no path can be longer than 2 × that.

Slide 23's summary of dictionary (symbol table) operations:

| | Search (worst) | Insert (worst) | Delete (worst) | Search (avg) | Insert (avg) | Delete (avg) |
|---|---|---|---|---|---|---|
| Sequential search (unordered list) | n | n | n | n/2 | n | n/2 |
| Binary search (ordered array) | log n | n | n | log n | n/2 | n/2 |
| BST | n | n | n | log n | log n | log n |
| 2-3 search tree | c log n | c log n | c log n | c log n | c log n | c log n |
| Red-black BST | 2 log n | 2 log n | 2 log n | 1 log n | 1 log n | 1 log n |

(This table lists the BST average delete as log n; §1's √n is what repeated Hibbard deletions drift to.) So an LLRB is **O(log n) worst case** for search, insert and delete, and in practice paths are about lg n long.

## 12. Hash Tables: the Idea

A balanced BST gives O(log n) and keeps keys in order. A **hash table** aims for **O(1) average** time for search, insert and delete of key-value pairs; the trade-off is that keys are no longer kept in order (slide 25).

Yeh's analogy (slides 26–30): to find a shirt in a pile of laundry you could search the unordered pile (unordered list) or compare clothes and build a tree (BST). What you actually do is **put clothes into drawers**. Information about the item tells you **where to put it** and later **where to look**: a hash table uses a clue from the data itself to decide its location, for every operation.

Structure (slide 31): a large number of small collections called **buckets** (`[0] … [m-1]`), which together form the hash table, plus a **rule — the hash function** — that maps each item to its bucket (slide 32: shirt → hash function → 3, the shirts drawer; sweaters 0, jackets 1, pants 2, shirts 3, socks 4). To find something, look only in its bucket.

## 13. Hash Functions: Hash Code + Compression

**First try** (slide 33): `hash_value = hash(input)` with `hash = len(input)`, e.g. "Prof Yeh" → 8. The problem: 8 isn't a bucket — there are only 5 buckets, so the value has to be squeezed into the range of indices.

**Second try, in two parts** (slide 34):

1. `hashCode()` maps the input to an integer (the **hash code**);
2. **compression** maps the hash code into the range of buckets: **`hash = hashCode(input) % numBuckets`**.

The same function is used for **both insert and search** (slides 35–36). With 5 buckets and `len` as the hash code:

| Input | hashCode = len | % 5 | Bucket |
|---|---|---|---|
| "Prof Yeh" | 8 | 8 % 5 | 3 |
| "Students" | 8 | 8 % 5 | 3 |

> 📘 **Beyond the lecture**: A good hash function is **deterministic** (equal keys → same hash), **fast**, and **spreads keys uniformly** over 0 … m−1. `len` fails the last one badly. For integer keys the usual choice is **modular hashing** `k % m` with **m prime**, so that patterns in the keys don't line up with m. (algs4 §3.4; Thornton's credit-card example shows how biased digits ruin a hash.)

> ⚠️ **Pitfall**: In C++ (as in Java), `%` of a **negative** number is negative, so `hashCode(key) % m` can give an index like −2. Use an unsigned hash (e.g. `std::hash` returns `size_t`) or fix the sign before indexing.

## 14. Collisions

A **collision** happens when multiple elements hash to the same bucket (slides 37–38): "Prof Yeh" and "Students" both land in bucket 3. Collisions can't be avoided in general — there are far more possible keys than buckets — so a hash table needs a collision-resolution strategy. Slide 39 asks how to let one bucket hold several items and what structure makes insertion fast: a linked list per bucket.

> ➡️ **Continued in [Lecture 15](lec-15.en-US.md)**: collision handling — separate chaining (its structure, the S E A R C H trace, Activity 3 and the implementation are repeated there), linear probing and quadratic probing.

## 15. Complete Implementation

```cpp
#include <iostream>
#include <string>

template <typename Key, typename Value>
class LLRB {
    static const bool RED = true;
    static const bool BLACK = false;

    class Node {
    public:
        Key key;            // key
        Value val;          // associated data
        Node *left, *right; // links to left and right subtrees
        bool color;         // color of parent link
        int size;           // subtree count
        Node(const Key& k, const Value& v, bool c, int s)
            : key(k), val(v), left(nullptr), right(nullptr), color(c), size(s) {}
    };

    Node* root = nullptr;

    bool isRed(Node* x) const {
        if (x == nullptr) return false; // null links are black
        return x->color == RED;
    }
    int size(Node* x) const { return x == nullptr ? 0 : x->size; }

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

    // insert the key-value pair in the subtree rooted at h
    Node* put(Node* h, const Key& key, const Value& val) {
        if (h == nullptr) return new Node(key, val, RED, 1); // Insert at bottom, color red

        if (key < h->key) h->left = put(h->left, key, val);   // Compare as before to traverse tree
        else if (key > h->key) h->right = put(h->right, key, val);
        else h->val = val;

        if (isRed(h->right) && !isRed(h->left))    h = rotateLeft(h);  // Fix any right-leaning links
        if (isRed(h->left) && isRed(h->left->left)) h = rotateRight(h); // 2 left red links
        if (isRed(h->left) && isRed(h->right))     flipColors(h);      // 4-node

        h->size = size(h->left) + size(h->right) + 1;
        return h;
    }

    Value get(Node* x, const Key& key) const {
        while (x != nullptr) {
            if      (key < x->key) x = x->left;
            else if (key > x->key) x = x->right;
            else                   return x->val;
        }
        return Value{};
    }

    int height(Node* x) const {
        if (x == nullptr) return 0;
        int l = height(x->left), r = height(x->right);
        return 1 + (l > r ? l : r);
    }
    void print(Node* x, std::ostream& out) const {   // in-order, red nodes marked *
        if (x == nullptr) return;
        print(x->left, out);
        out << (isRed(x) ? "*" : "") << x->key << ' ';
        print(x->right, out);
    }
    void destroy(Node* x) {
        if (x == nullptr) return;
        destroy(x->left); destroy(x->right); delete x;
    }

public:
    LLRB() = default;
    LLRB(const LLRB&) = delete;
    LLRB& operator=(const LLRB&) = delete;
    ~LLRB() { destroy(root); }

    void put(const Key& key, const Value& val) {
        root = put(root, key, val);
        root->color = BLACK;              // the root is always black
    }
    Value get(const Key& key) const { return get(root, key); }
    int size() const { return size(root); }
    int height() const { return height(root); }
    Key rootKey() const { return root->key; }
    void print(std::ostream& out) const { print(root, out); out << '\n'; }
};

int main() {
    LLRB<char, int> t;
    std::string keys = "SEARCHXMPL";
    for (int i = 0; i < (int)keys.size(); i++) t.put(keys[i], i);
    std::cout << "in-order: "; t.print(std::cout);
    std::cout << "root " << t.rootKey() << ", size " << t.size() << ", height " << t.height() << '\n';
    std::cout << "get(H) = " << t.get('H') << ", get(Z) = " << t.get('Z') << '\n';

    LLRB<char, int> u;
    std::string inc = "ACEHLMPRSX";
    for (int i = 0; i < (int)inc.size(); i++) u.put(inc[i], i);
    std::cout << "ascending: "; u.print(std::cout);
    std::cout << "root " << u.rootKey() << ", height " << u.height() << '\n';
}
```

Output (`*` = the link from the parent is red; height counts nodes on the longest path):

```text
in-order: *A C E *H L M P R *S X 
root M, size 10, height 4
get(H) = 5, get(Z) = 0
ascending: A C E H L *M P R *S X 
root H, height 4
```

## 16. In-class Activities (with Solutions)

Try each one before opening the solution. The two decks both number from Activity 1, so the deck date is in each title.

### 16.1 Activity 1: Construction (11/10 deck, slide 19)

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
{"title": "Activity 1 (11/10) check: E A S Y Q U T I O N", "ops": "insert(E); insert(A); insert(S); insert(Y); insert(Q); insert(U); insert(T); insert(I); insert(O); insert(N)"}
```

</details>

Back to [§4](#4-2-3-tree-insertion).

### 16.2 Activity 1: Legal LLRBs (11/17 deck, slide 8)

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
- **(iii)** has no red links and every root-to-null path has 3 black links → legal. Its 2-3 tree is the same shape: root [E], then [B] [Y], then [A] [D] [H] [Z] — all 2-nodes.
- **(iv)**: both red links lean left, no node touches two red links, every path has 2 black links → legal. 2-3 tree: root [H], children **[A C]** and **[T Y]**.

Check each tree against the three rules (switch to the 2-3 view for the conversion):

```viz llrb
{"title": "Activity 1 (11/17) check: tree (iv)", "tree": "H, C, Y, *A, -, *T", "ops": "check()"}
```

```viz llrb
{"title": "Activity 1 (11/17) check: tree (i)", "tree": "C, *A, Y, -, -, H, -, -, -, -, -, *D", "ops": "check()"}
```

</details>

Back to [§7](#7-the-llrb-definition).

### 16.3 Activity 2: Construct an LLRB (11/17 deck, slide 21)

Construct the LLRB by inserting in order: **S E A R C H X M P L**, and then (separately) **A C E H L M P R S X**.

> Hint: after every insertion, run the three checks bottom-up, then make the root black.

<details>
<summary>Solution</summary>

**S E A R C H X M P L** — fix-ups per insertion (bottom-up):

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
{"title": "Activity 2 check: ascending order", "ops": "put(A); put(C); put(E); put(H); put(L); put(M); put(P); put(R); put(S); put(X)"}
```

</details>

Back to [§10](#10-llrb-insertion).

## 17. Quick Reference & Top 5 Things to Remember

| Structure | Search | Insert | Delete | Why |
|---|---|---|---|---|
| BST | O(n) worst, O(log n) avg | O(n) worst | O(n) worst, √n avg after many Hibbard deletes | height depends on insertion order |
| 2-3 tree | O(log n) worst | O(log n) worst | O(log n) worst | perfect balance; height between log₃ n and lg n |
| LLRB | O(log n) worst | O(log n) worst | O(log n) worst | height ≤ 2 lg n; average path ≈ lg n |
| Hash table | O(1) average | O(1) average | O(1) average | depends on the hash function (Lecture 15) |

| LLRB fix-up (checked in this order) | Condition | Action |
|---|---|---|
| 1 | right child red, left child black | `h = rotateLeft(h)` |
| 2 | left child red and left-left grandchild red | `h = rotateRight(h)` |
| 3 | both children red | `flipColors(h)` |

**Top 5 things to remember**

1. 2-3 tree insert: join the bottom node; a 3-node becomes a temporary 4-node, split it and push the middle key up, repeating; a root split is the only way the height grows, so perfect balance always holds.
2. An LLRB is a 2-3 tree drawn as a BST: a red link glues a 3-node's two keys, red links lean left, no node touches two reds, and every root-to-null path has the same number of black links.
3. LLRB `put` = BST insert with a red link, then on the way up: rotate left (right red), rotate right (two left reds), flip colors (two red children) — in that order — and finally make the root black.
4. Height ≤ 2 lg n (the longest path alternates red and black, the shortest is all black), so search, insert and delete are O(log n) in the worst case.
5. A hash function = hash code + compression (`hashCode(key) % m`); it decides the bucket for both insert and search, and collisions (two keys, one bucket) must be handled.

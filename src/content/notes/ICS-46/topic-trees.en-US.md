---
title: "Trees & Traversals"
summary: "Tree terminology, depth and height, full vs complete binary trees, node-count and height bounds, the BinaryTree skeleton, and level-, pre-, in- and post-order traversals."
topics:
  - trees
kind: "topic"
order: 505
---

# Information and Computer Science 46 — Topic: Trees & Traversals

## Table of Contents

- [1. Trees: Hierarchical Data](#1-trees-hierarchical-data)
- [2. Tree Terminology](#2-tree-terminology)
- [3. Depth, Level and Height](#3-depth-level-and-height)
- [4. Full and Complete Binary Trees](#4-full-and-complete-binary-trees)
- [5. Counting Nodes and Height Bounds](#5-counting-nodes-and-height-bounds)
- [6. Skeleton Implementation](#6-skeleton-implementation)
- [7. Breadth-First: Level-Order Traversal](#7-breadth-first-level-order-traversal)
- [8. Depth-First: Pre-, In- and Post-Order](#8-depth-first-pre--in--and-post-order)
- [9. Complete Implementation](#9-complete-implementation)
- [10. Quick Reference & Top 5 Things to Remember](#10-quick-reference--top-5-things-to-remember)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh. This note gathers trees and traversals from Lecture 10, organized by concept.

## 1. Trees: Hierarchical Data

Lists, stacks and queues are **linear**: every element has at most one predecessor and one successor. A **tree** is an abstract data type that stores elements **hierarchically**: each element has a **single parent** (its immediate ancestor) and **zero or more children** (its immediate descendants). Examples: an organization chart (CEO → CFO, CMO, COO, CTO → …), a website's sitemap (Home → About, Products, …), and a file system (`/` → Documents, Downloads, Music → …).

In CS we draw trees upside down: the **root** at the top, the **leaves** at the bottom.

**Definition.** A tree $T$ is a set of nodes that store elements in a parent–child relationship such that

- if $T$ is non-empty, it has a special node, the **root**, that has no parent;
- every node $v$ other than the root has a **unique parent**.

Example: root A; A's children B and C; B has only a right child D; C's children E and F; E has a left child G; F's children H and I. Step through it (← / → keys work when the demo is focused):

```viz binary-tree
{"title": "A first tree", "tree": "A, B, C, -, D, E, F, -, -, -, -, G, -, H, I", "views": "root; parent:C; ancestors:G"}
```

## 2. Tree Terminology

All examples use one **example tree**:

| Node | K | C | N | A | F | M | V | B | D | H | U |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Left child | C | A | M | — | D | — | U | — | — | — | — |
| Right child | N | F | V | B | H | — | — | — | — | — | — |

| Term | Meaning | Example |
|---|---|---|
| Edge | a pair of connected nodes | (K, C) |
| Parent / child | node directly above / below | K is the parent of C and N |
| Siblings | nodes with the same parent | A and F |
| Ancestor / descendant | anywhere above / below on the path to the root | K is an ancestor of B; B is a descendant of K |
| Subtree | a node plus all of its descendants | subtree at N = {N, M, V, U} |
| Leaf (external node) | no children | {B, D, H, M, U} |
| Internal node | at least one child | {K, C, N, A, F, V} |
| Forest | a set of disjoint trees | |
| Simple path | distinct nodes with an edge between each consecutive pair | K-N-V-U |
| Path length | number of **edges** on the path | K-C-A has length 2 |
| Height of a node | length of the longest path from it down to a leaf | height(C) = 2 (C-F-D) |
| Height of the tree | longest root-to-leaf path = height of the root | 3 (e.g. K-C-A-B) |
| Degree of a node | number of its children | degree(C) = 2 |
| Degree (arity) of a tree | max degree of any node | 2 |
| Binary tree | a tree with arity 2: each node has at most 2 children, each in a **left** or **right** slot | |

Each term on the example tree, one step per term:

```viz binary-tree
{"title": "Terminology on the example tree", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "parent:K; siblings:A; ancestors:B; subtree:N; leaves; internal; path:K-N-V-U; path:K-C-A; degree"}
```

> ⚠️ **Pitfall**: Slide bugs (the quick-check answer as shown on the slides) list the leaves as {B, D, H, M, U, V} and the internal nodes as {K, C, N, A, F}. V has a child (U), so V is **internal**: leaves {B, D, H, M, U}, internal {K, C, N, A, F, V}.

## 3. Depth, Level and Height

**Depth (= level)** of a node: its distance (number of edges) from the root. The root is at depth/level 0. The **depth of a binary tree** is the maximum level of all its nodes, and a node with the maximum depth is always a leaf.

**Height** is measured the other way, from the bottom:

- a leaf has height 0;
- any other node has height 1 + the maximum height of its non-null children.

The **height of the tree** is the height of its root. So depth counts down from the root, height counts up from the leaves, and for the whole tree the two agree (max depth = height of the root).

Example: in a 10-node tree the leaves are labelled 0, their parents 1 and 2, and the root 3; the deepest leaves sit at depth 3, so tree depth = tree height = 3. In the example tree from [§2](#2-tree-terminology): depth(F) = 2, height(F) = 1, height(K) = 3.

Depth (badges counted down from the root) and height (counted up from the leaves) on the example tree — the 10-node tree above has a node with three children, so it isn't binary, which is why the demo uses the example tree:

```viz binary-tree
{"title": "Depth vs height", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "depth; height"}
```

> ⚠️ **Pitfall**: Depth and height are counted in **edges**, not nodes. A single-node tree has height 0; with the recursive formula an empty tree is given height −1 so that a leaf comes out as 1 + max(−1, −1) = 0 (see `height()` in [§9](#9-complete-implementation)).

## 4. Full and Complete Binary Trees

### 4.1 Definitions

- **Full (proper)** binary tree: every node has **0 or 2** children — never exactly one.
- **Complete** binary tree: has minimal height — every level is full except possibly the last, and the nodes on the last level are **as far left as possible** (no holes in level order).

The two properties are independent (a tree can be either, both or neither):

| | Full | Not full |
|---|---|---|
| **Complete** | every level full, or last level left-packed with pairs | last level ends with a lone left child |
| **Not complete** | some leaf missing on an upper level, or a gap on the last level, but no node with one child | e.g. a node with one child *and* a gap |

Four shapes, then the example tree — nodes with one child are marked purple for *full*, gaps in level order show as dashed slots for *complete*:

```viz binary-tree
{"title": "Complete and full", "tree": "Neither complete nor full = A, B, C, D, E, F, G, H, -, -, -, I, J | Complete but not full = A, B, C, D, E, F, G, H | Full but not complete = A, B, C, D, E, F, G, H, I, -, -, J, K | Complete and full = A, B, C, D, E, F, G, H, I | Example tree = K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "full; complete"}
```

The example tree from [§2](#2-tree-terminology) is **neither**: A and V have one child each (not full), and its last level has a hole where A's left child would be (not complete).

### 4.2 Practice

#### Full or complete?

**(a)** A root with two children; the left child has two children (leaves); the right child has one child, on its left. Is the tree A: Full, B: Complete, C: Full and Complete, D: Neither Full nor Complete?

**(b)** A root with a single child, on its **right**. Same choices.

<details>
<summary>Solution</summary>

**(a) B: Complete.** Levels 0 and 1 are full and the last level (three leaves) is packed to the left. Not full: the root's right child has exactly one child.

**(b) D: Neither.** The root has exactly one child (not full), and the last level's only node is on the right, leaving a hole on the left (not complete). A root whose only child is on the **left** would be complete.

```viz binary-tree
{"title": "Practice check: (a) and (b)", "tree": "(a) = A, B, C, D, E, F | (b) = A, -, B", "views": "full; complete"}
```

</details>

## 5. Counting Nodes and Height Bounds

**Lemma.** A binary tree has at most $2^k$ nodes on level $k$ (each level can at most double). Level 2 of the example tree holds the maximum $2^2 = 4$: A, F, M, V.

**Theorem.** A binary tree of height $h$ with $n$ nodes satisfies

$$h + 1 \le n \le 2^{h+1} - 1 \qquad\Longleftrightarrow\qquad \log_2(n+1) - 1 \le h \le n - 1$$

- **Minimum** $n = h + 1$: a "stick" — every node has one child, the tree is a linked list. So the **worst-case height is $n - 1 = O(n)$**.
- **Maximum** $n = 1 + 2 + 4 + \dots + 2^h = 2^{h+1} - 1$: every level full. So the **best-case height is $O(\log n)$**, reached by compact (complete) trees.

Example: 7 nodes can have height anywhere from 2 (all three levels full) to 6 (a stick).

```viz binary-tree
{"title": "Fewest vs most nodes for the same height h = 2", "tree": "h = 2, most nodes (7) = A, B, C, D, E, F, G | h = 2, fewest nodes (3, a stick) = A, B, -, C", "views": "depth"}
```

> 💡 **Key Insight**: Every tree operation that walks one root-to-leaf path costs O(height) — between O(log n) and O(n). Keeping trees short is what balanced trees ([Search Trees](topic-search-trees.en-US.md)) and [Heaps](topic-heaps.en-US.md) are about.

> ⚠️ **Pitfall**: Slide bugs (the labelling as shown on the slides): the upper bound is labelled "MAX (complete)", but $2^{h+1} - 1$ nodes needs **every** level full (a *perfect* tree); a complete tree of height $h$ can have anywhere from $2^h$ to $2^{h+1} - 1$ nodes.

## 6. Skeleton Implementation

Like the linked list, a binary tree is a set of `Node` objects linked by pointers, but each node has **two** links:

```cpp
template <typename Item>
class BinaryTree {
private:
    // Nested Node class
    class Node {
    public:
        Item item;      // Payload
        Node* left;     // Pointer to left child
        Node* right;    // Pointer to right child

        // Node constructor
        Node(Node* leftNode, Node* rightNode, const Item& value)
            : item(value), left(leftNode), right(rightNode) {}
    };

    Node* root; // Pointer to the root node of the tree
};
```

The picture names the parts: `root` points at the top node; each `left`/`right` pointer is a **link**; any node together with everything below it is a **subtree** (so every link points at a subtree — that's why tree code is naturally recursive); a **leaf** is a node whose two links are both **null links** (`nullptr`).

```viz binary-tree
{"title": "Root, subtree and null links", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "views": "root; subtree:C; nulls"}
```

Example: a 3-node tree is `new Node(new Node(nullptr, nullptr, "A"), new Node(nullptr, nullptr, "C"), "B")` — note the constructor takes the children **first** and the value last.

## 7. Breadth-First: Level-Order Traversal

Linear structures have one natural order; trees can be traversed in several:

- **breadth-first**: level order;
- **depth-first**: pre-order, in-order, post-order ([§8](#8-depth-first-pre--in--and-post-order)).

**Level order**: mark the nodes of level $i$ as visited, left to right, before any node of level $i + 1$, starting at level 0. On the example tree: **K C N A F M V B D H U**.

The slides give the order, not code; the standard implementation (mine) uses a FIFO queue ([Linear Data Structures](topic-linear.en-US.md)): pop a node, visit it, push its children.

```cpp
void levelorder() const {
    std::queue<Node*> q;
    if (root) q.push(root);
    while (!q.empty()) {
        Node* t = q.front(); q.pop();
        visit(t->item);
        if (t->left)  q.push(t->left);
        if (t->right) q.push(t->right);
    }
}
```

Step through it below (← / → keys work when the demo is focused):

```viz tree-traversal
{"title": "Level order of the example tree", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "order": "level", "interactive": true}
```

Each node enters and leaves the queue once, so the traversal is O(n).

> ⚠️ **Pitfall**: Slide bugs (the note on the level-order slide): it says level order "provides sorted order for Binary Search Trees". That is **in-order** ([§8](#8-depth-first-pre--in--and-post-order)); level order of a BST is not sorted.

## 8. Depth-First: Pre-, In- and Post-Order

### 8.1 The Three Orders

All three visit the root and recursively traverse the left subtree, then the right subtree. The prefix says **when the root is marked visited**: **pre** = before both subtrees, **in** = between them, **post** = after both.

| Traversal | Recursion | Example tree | Typical use (slides) |
|---|---|---|---|
| Pre-order | root, Preorder(left), Preorder(right) | K C A B F D H N M V U | process a parent before its children, e.g. **copy** a tree |
| In-order | Inorder(left), root, Inorder(right) | A B C D F H K M N U V | on a binary search tree gives **sorted order** (e.g. find the kth smallest) |
| Post-order | Postorder(left), Postorder(right), root | B A D H F C M U V N K | process both subtrees before the parent, e.g. **deletion** |

As code (mine — the slides give the recursion in words), only the position of `visit` changes:

```cpp
void preorder(Node* t) {
    if (t == nullptr) return;
    visit(t->item);          // root first
    preorder(t->left);
    preorder(t->right);
}
// inorder:   inorder(t->left);  visit(t->item);  inorder(t->right);
// postorder: postorder(t->left); postorder(t->right); visit(t->item);
```

Step through the in-order traversal (the call stack is shown in orange):

```viz tree-traversal
{"title": "In-order of the example tree", "tree": "K, C, N, A, F, M, V, -, B, D, H, -, -, U", "order": "in", "interactive": true}
```

Every node gets exactly one call (plus one call per null link), so each traversal is O(n) time; the call stack holds one frame per level, O(height) extra space.

> 💡 **Key Insight**: A quick way to check by hand: in pre-order the **root is first**, in post-order the **root is last**, and in in-order the root **splits** the left subtree's nodes from the right subtree's (A B C D F H | K | M N U V).

### 8.2 Practice

#### List the nodes in all four orders


List the nodes in pre-order, in-order, post-order, and level order:

| Node | 8 | 5 | 4 | 9 | 7 | 11 | 1 | 12 | 3 | 2 |
|---|---|---|---|---|---|---|---|---|---|---|
| Left child | 5 | 9 | — | — | 1 | 3 | — | 2 | — | — |
| Right child | 4 | 7 | 11 | — | 12 | — | — | — | — | — |

(Root 8; 5 has children 9 and 7; 7 has children 1 and 12; 12 has a left child 2; 4 has only a right child 11; 11 has a left child 3.)

> Hint: 4 has no left child and 11 has no right child — when the recursion reaches them, the missing side returns immediately.

<details>
<summary>Solution</summary>

| Order | Sequence |
|---|---|
| Pre-order | 8 5 9 7 1 12 2 4 11 3 |
| In-order | 9 5 1 7 2 12 8 4 3 11 |
| Post-order | 9 1 2 12 7 5 3 11 4 8 |
| Level order | 8 5 4 9 7 11 1 12 3 2 |

Checks: pre-order starts with the root 8, post-order ends with it; in-order puts 8 between the left subtree (9 5 1 7 2 12) and the right subtree (4 3 11). In in-order, 4 comes **before** 3 and 11 because it has no left subtree; in level order, 3 (level 3, under 11) comes **after** 1 and 12 and 2 is last (level 4). Check the post-order here:

```viz tree-traversal
{"title": "Post-order check", "tree": "8, 5, 4, 9, 7, -, 11, -, -, 1, 12, -, -, 3, -, -, -, -, -, -, -, 2", "order": "post"}
```

</details>

## 9. Complete Implementation

The tree part of the lecture's program (`build` reads a tree from 1-based level-order positions, `-` = empty):

```cpp
#include <algorithm>
#include <iostream>
#include <queue>
#include <string>
#include <vector>

template <typename Item>
class BinaryTree {
private:
    class Node {
    public:
        Item item;
        Node* left;
        Node* right;
        Node(Node* leftNode, Node* rightNode, const Item& value)
            : item(value), left(leftNode), right(rightNode) {}
    };
    Node* root;

    // pos[1] = root, children of p at 2p, 2p+1, "-" = empty
    static Node* build(const std::vector<std::string>& pos, size_t p) {
        if (p >= pos.size() || pos[p] == "-") return nullptr;
        return new Node(build(pos, 2 * p), build(pos, 2 * p + 1), pos[p]);
    }
    static void destroy(Node* t) {          // post-order
        if (t == nullptr) return;
        destroy(t->left);
        destroy(t->right);
        delete t;
    }
    static void preorder(Node* t) {
        if (t == nullptr) return;
        std::cout << t->item << ' ';
        preorder(t->left);
        preorder(t->right);
    }
    static void inorder(Node* t) {
        if (t == nullptr) return;
        inorder(t->left);
        std::cout << t->item << ' ';
        inorder(t->right);
    }
    static void postorder(Node* t) {
        if (t == nullptr) return;
        postorder(t->left);
        postorder(t->right);
        std::cout << t->item << ' ';
    }
    static int height(Node* t) {             // empty = -1, leaf = 0
        if (t == nullptr) return -1;
        return 1 + std::max(height(t->left), height(t->right));
    }
    static int size(Node* t) {
        return t == nullptr ? 0 : 1 + size(t->left) + size(t->right);
    }

public:
    explicit BinaryTree(const std::vector<std::string>& pos) : root(build(pos, 1)) {}
    ~BinaryTree() { destroy(root); }
    BinaryTree(const BinaryTree&) = delete;
    BinaryTree& operator=(const BinaryTree&) = delete;

    void preorder() const { preorder(root); std::cout << '\n'; }
    void inorder() const { inorder(root); std::cout << '\n'; }
    void postorder() const { postorder(root); std::cout << '\n'; }
    void levelorder() const {
        std::queue<Node*> q;
        if (root) q.push(root);
        while (!q.empty()) {
            Node* t = q.front(); q.pop();
            std::cout << t->item << ' ';
            if (t->left)  q.push(t->left);
            if (t->right) q.push(t->right);
        }
        std::cout << '\n';
    }
    int height() const { return height(root); }
    int size() const { return size(root); }
};

int main() {
    BinaryTree<std::string> t({"", "K", "C", "N", "A", "F", "M", "V",
                               "-", "B", "D", "H", "-", "-", "U"});
    std::cout << "pre:   "; t.preorder();
    std::cout << "in:    "; t.inorder();
    std::cout << "post:  "; t.postorder();
    std::cout << "level: "; t.levelorder();
    std::cout << "size " << t.size() << ", height " << t.height() << '\n';
}
```

Output (`g++ -std=c++17 -Wall -fsanitize=address,undefined`):

```text
pre:   K C A B F D H N M V U
in:    A B C D F H K M N U V
post:  B A D H F C M U V N K
level: K C N A F M V B D H U
size 11, height 3
```


## 10. Quick Reference & Top 5 Things to Remember

| Operation / fact | Cost | Why |
|---|---|---|
| Pre/in/post/level-order traversal | O(n) | one visit per node |
| Depth-first extra space | O(height) | one call-stack frame per level |
| Height of a binary tree with n nodes | between ⌈log₂(n+1)⌉ − 1 and n − 1 | complete vs stick |
| Max nodes on level k / in a tree of height h | 2^k / 2^(h+1) − 1 | each level doubles |

**Top 5 things to remember**

1. Depth counts edges down from the root (root = 0); height counts edges up from the deepest leaf (leaf = 0); tree height = height of the root.
2. Full = every node has 0 or 2 children; complete = all levels full except the last, which is filled from the left — they are independent.
3. A binary tree with n nodes has height between log₂(n+1) − 1 and n − 1, so root-to-leaf operations cost O(log n) to O(n).
4. Pre = root first, in = root in the middle, post = root last; in-order of a BST is sorted, level order uses a queue.
5. Every traversal visits each node once: O(n) time, with O(height) call-stack space for the depth-first orders.

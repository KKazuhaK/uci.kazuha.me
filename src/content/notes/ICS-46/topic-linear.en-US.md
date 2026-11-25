---
title: "Lists, Stacks & Queues"
summary: "Linear structures: ArrayList and amortized resizing, singly and doubly linked lists, the Stack and Queue ADTs and their array/linked implementations, circular arrays and deques, and expression evaluation with stacks."
topics:
  - linear
kind: "topic"
order: 503
---

# Information and Computer Science 46 — Topic: Lists, Stacks & Queues

## Table of Contents

- [1. Linear Structures, ADTs and Data Structures](#1-linear-structures-adts-and-data-structures)
- [2. ArrayList (Dynamic Array)](#2-arraylist-dynamic-array)
- [3. Resizing and Amortized Analysis](#3-resizing-and-amortized-analysis)
- [4. Singly Linked Lists](#4-singly-linked-lists)
- [5. Doubly Linked Lists](#5-doubly-linked-lists)
- [6. ArrayList vs. Linked Lists](#6-arraylist-vs-linked-lists)
- [7. Stacks](#7-stacks)
- [8. Queues](#8-queues)
- [9. Circular Array Queue](#9-circular-array-queue)
- [10. Deques](#10-deques)
- [11. Stack Applications: Expression Evaluation](#11-stack-applications-expression-evaluation)
- [12. Queue Applications](#12-queue-applications)
- [13. Quick Reference & Top 5 Things to Remember](#13-quick-reference--top-5-things-to-remember)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh. This note gathers lists, stacks and queues from Lectures 3–7, organized by concept.

## 1. Linear Structures, ADTs and Data Structures

### 1.1 Why data structures?

A data structure **organizes and stores data** so the needed operations are efficient (an unorganized vs. a categorized library). It is judged by **time** and **space** complexity, and there is **no one-size-fits-all** — hence many structures.

Typical operations: **insertion, deletion, searching, replacement**, plus **traversal, sorting, check if empty**. No single structure does all of them efficiently; the choice depends on your data, which operations you need (and how often), and technical limits (memory, real-time).

**Linear vs. non-linear:**

| Linear (sequence; each element has a previous/next) | Non-linear (hierarchical / interconnected) |
|---|---|
| Contiguous: arrays, ArrayLists ([§2](#2-arraylist-dynamic-array)) | Trees: binary trees, BSTs |
| Pointer-based: singly/doubly linked lists ([§4](#4-singly-linked-lists), [§5](#5-doubly-linked-lists)) | Graphs: nodes and edges |
| Sequential access: stacks, queues ([§7](#7-stacks), [§8](#8-queues)) | non-contiguous memory, non-sequential traversal |

For the non-linear side see [Trees](topic-trees.en-US.md).

### 1.2 ADT vs. data structure

The lecture material separates **what** a collection does from **how** it is built.

- An **abstract data type (ADT)** is the *what*: which data is stored and which operations exist. It is a behavioral contract and says nothing about memory layout.
- A **data structure (DS)** is the *how*: how the data is organized, stored and manipulated. It is about memory layout, efficiency and the algorithms behind each operation.

| ADT (the "what") | Operations | Data structures that implement it (the "how") |
|---|---|---|
| List | `add()`, `remove()`, `get()` on an ordered collection | ArrayList (dynamically resizing array), LinkedList (node pointers) |
| Stack | LIFO: `push()`, `pop()`, `peek()` | array-based stack, linked stack (singly-linked nodes) |
| Queue | FIFO: `enqueue()`, `dequeue()` | circular array (ring buffer), linked queue (head/tail pointers) |

Example: "a Stack" means the ADT; "a linked stack whose top is the head" is one data structure for it. Its `push` is O(1) because of the *structure*, not because of the ADT.

## 2. ArrayList (Dynamic Array)

### 2.1 State

An ArrayList (resizable / dynamic array) is a **zero-indexed linear structure** in **contiguous memory**, backed by an **underlying array of some capacity**. Like an array it has **O(1) access by index**. It holds three things: the **elements** array, the **size** (number of items), and the **capacity** (allocated length). It allocates/frees automatically, uses the first `size` cells, and when full allocates a larger array and copies everything over. It parallels `std::vector`.

The picture below has capacity 8 and size 3; the dashed cells are allocated but unused:

```viz arraylist
{"title": "Capacity 8, size 3", "ops": "add(ICS46); add(ROCKS); add(!)", "capacity": 8, "start": 7, "code": "none"}
```

Invariant: **size ≤ capacity**; cells `[size, capacity)` hold nothing meaningful.

### 2.2 API

| Group | Operation | Meaning |
|---|---|---|
| Constructors | `ArrayList()` | empty, **initial capacity 2** |
| | `ArrayList(int capacity)` | empty, given capacity |
| Inspection | `isEmpty()`, `size()`, `at(int index)` | empty?, item count, item at index |
| Modifiers | `add(Item item)` | append at the end |
| | `add(int index, Item item)` | insert, shift later items right |
| | `Item remove()` | remove and return the last item |
| | `Item remove(int index)` | remove at index, shift later items left |
| | `set(int index, Item item)` | replace item at index |

The trace below uses the `std::string` version (`void add(const std::string& s)`).

### 2.3 Trace

Each step adds a line; predict the contents, size and capacity before reading the row:

| Step | Call | Contents | Size | Cap | What happened |
|---|---|---|---|---|---|
| 1 | `ArrayList a1;` | — | 0 | 2 | default capacity 2 |
| 2 | `a1.add("ICS46");` | ICS46 | 1 | 2 | store at index size |
| 3 | `a1.add("Rocks");` | ICS46, Rocks | 2 | 2 | now full |
| 4 | `a1.add("!");` | ICS46, Rocks, ! | 3 | **4** | full → double, copy, then add |
| 5 | `a1.add(1, "Throws");` | ICS46, Throws, Rocks, ! | 4 | 4 | shift Rocks, ! right |
| 6 | `a1.add(3, "?");` | ICS46, Throws, Rocks, ?, ! | 5 | **8** | full → double, shift right, add |
| 7 | `a1.remove();` | ICS46, Throws, Rocks, ? | 4 | 8 | returns `!` |
| 8 | `a1.remove();` | ICS46, Throws, Rocks | 3 | 8 | returns `?` |
| 9 | `a1.remove();` | ICS46, Throws | 2 | **4** | returns `Rocks`; 2/8 = ¼ full → halve |

Running this program against the [complete implementation](#26-complete-implementation) gives the same states (`a1.at(5)` afterwards throws `out_of_range: index 5`).

The whole trace, one element move at a time — try your own calls in the box underneath. Step through it below (← / → keys work when the demo is focused):

```viz arraylist
{"title": "ArrayList trace", "ops": "add(ICS46); add(Rocks); add(!); add(1, Throws); add(3, ?); remove(); remove(); remove()", "interactive": true}
```

> ⚠️ **Slide bug** (the trace as shown on the slides): one step's header says `remove()` but the step shown is `a1.add(3, "?")` (the header was carried over from the next step).

### 2.4 What a resize does

On a full array, `add` allocates double the capacity, copies all n elements (**the Θ(n) part**), frees the old array, repoints `data_`, then stores the item. The pointer change is the lesson, so here it is once: `a1.add("!")` on the full capacity-2 array (it opens on the resize). Step through it below (← / → keys work when the demo is focused):

```viz arraylist
{"title": "add on a full ArrayList", "ops": "add(ICS46); add(Rocks); add(!)", "start": 7}
```

`add(index, item)` instead shifts `data_[index..n-1]` one slot right, **back-to-front** (`for (size_t i = n_; i > index; --i) data_[i] = data_[i-1];`), so nothing is overwritten before it's moved; `remove(index)` shifts left, front-to-back.

> ⚠️ **Pitfall**: copy **first**, then `delete[]`, then reassign — deleting first loses the data, reassigning first leaks the old buffer.

### 2.5 Running times

| Operation | Worst | Amortized |
|---|---|---|
| `isEmpty`, `size`, `at`, `set` | O(1) | — |
| `add(x)` (end) | O(n) | **O(1)** |
| `remove()` (end) | O(n) with shrinking | O(1) |
| `add(i, x)`, `remove(i)` | O(n) (shifting) | O(n) |

Great at the end and at random access, bad at the front/middle — linked lists ([§4](#4-singly-linked-lists)) make the opposite trade.

### 2.6 Complete implementation

```cpp
#include <cstddef>
#include <stdexcept>
#include <string>
#include <utility>

template <typename T>
class ArrayList {
public:
    ArrayList() : ArrayList(2) {}                       // initial capacity 2
    explicit ArrayList(size_t capacity)
        : data_{new T[capacity > 0 ? capacity : 1]},
          capacity_{capacity > 0 ? capacity : 1}, n_{0} {}

    // Rule of three: we own data_, so copying must copy the buffer.
    ~ArrayList() { delete[] data_; }
    ArrayList(const ArrayList& other)
        : data_{new T[other.capacity_]}, capacity_{other.capacity_}, n_{other.n_} {
        for (size_t i = 0; i < n_; ++i) data_[i] = other.data_[i];
    }
    ArrayList& operator=(ArrayList other) {             // copy-and-swap
        std::swap(data_, other.data_);
        std::swap(capacity_, other.capacity_);
        std::swap(n_, other.n_);
        return *this;
    }

    bool isEmpty() const { return n_ == 0; }
    size_t size() const { return n_; }
    size_t capacity() const { return capacity_; }

    const T& at(size_t index) const { rangeCheck(index); return data_[index]; }

    void set(size_t index, const T& item) { rangeCheck(index); data_[index] = item; }

    void add(const T& item) {                          // append at the end
        if (n_ == capacity_) resize(2 * capacity_);
        data_[n_++] = item;
    }

    void add(size_t index, const T& item) {            // insert, shift right
        if (index > n_) throw std::out_of_range("add: index " + std::to_string(index));
        if (n_ == capacity_) resize(2 * capacity_);
        for (size_t i = n_; i > index; --i) data_[i] = data_[i - 1];
        data_[index] = item;
        ++n_;
    }

    T remove() {                                       // remove from the end
        if (n_ == 0) throw std::out_of_range("remove from empty ArrayList");
        T item = data_[--n_];
        shrinkIfSparse();
        return item;
    }

    T remove(size_t index) {                           // remove at index, shift left
        rangeCheck(index);
        T item = data_[index];
        for (size_t i = index; i + 1 < n_; ++i) data_[i] = data_[i + 1];
        --n_;
        shrinkIfSparse();
        return item;
    }

private:
    T* data_;
    size_t capacity_;
    size_t n_;

    void rangeCheck(size_t index) const {
        if (index >= n_) throw std::out_of_range("index " + std::to_string(index));
    }
    void shrinkIfSparse() {                            // halve when 1/4 full
        if (capacity_ > 1 && n_ <= capacity_ / 4) resize(capacity_ / 2);
    }
    void resize(size_t newCapacity) {
        T* bigger = new T[newCapacity];
        for (size_t i = 0; i < n_; ++i) bigger[i] = data_[i];
        delete[] data_;
        data_ = bigger;
        capacity_ = newCapacity;
    }
};
```

### 2.7 Practice

#### ArrayList trace: what should happen?

Starting from `ArrayList a1;`, predict contents, size and capacity after: `add("ICS46")`, `add("Rocks")`, `add("!")`, `add(1, "Throws")`, `add(3, "?")`, then three `remove()`s.

<details>
<summary>Solution</summary>

1/2 → 2/2 (full) → `!` triggers doubling: 3/4 → Throws shifts Rocks, ! right: 4/4 → `?` triggers doubling to 8, `!` shifts: [ICS46, Throws, Rocks, ?, !] 5/8 → removes return `!`, `?`, `Rocks`; at 2/8 = ¼ capacity halves: [ICS46, Throws] 2/4. Table: [§2.3](#23-trace).

</details>

## 3. Resizing and Amortized Analysis

### 3.1 Policy and worst case

| | Expand | Shrink |
|---|---|---|
| Trigger | adding to a **full** list | list becomes **¼ full** |
| Action | capacity × 2 | capacity × ½ |
| Cost | copy all elements | copy all elements |

**Key question:** what is the worst case of `add()`? **Cost model:** 1 for the insertion, n for copying n items. So one `add` costs 1 normally and n + 1 when it resizes: **worst case O(n)**. That's too pessimistic for a sequence of adds — hence amortized analysis.

> 📘 **Beyond the lecture**: shrinking at ¼ (not ½) avoids thrashing — at ½, alternating add/remove at the boundary would resize, costing Θ(n), on every call.

### 3.2 Amortized cost

**Amortized cost per operation** = total cost of a sequence of n operations ÷ n. Methods: **aggregate** (bound the total T(n), divide by n — used here), **accounting** (charge a fixed price, bank credit), **potential** (a potential function stores "energy").

> 💡 **Key Insight**: amortized ≠ average case. No probability: it's a worst-case guarantee on the *total* of any sequence.

### 3.3 Doubling vs. growing by 1

Start at capacity 1 and call `add` n times. The (k+1)-th add copies k elements when the array is full:

| k | 0 | 1 | 2 | 3 | 4 | 5–7 | 8 | 9–15 | 16 |
|---|---|---|---|---|---|---|---|---|---|
| Copy cost, ×2 | 0 | 1 | 2 | 0 | 4 | 0 | 8 | 0 | 16 |
| Copy cost, +1 | 0 | 1 | 2 | 3 | 4 | 5–7 | 8 | 9–15 | 16 |

(Insertion cost is 1 in every column; total = insertion + copy.)

Watch the copies pile up with +1 growth — switch `growth` in your head to doubling and compare with the table. Step through it below (← / → keys work when the demo is focused):

```viz arraylist
{"title": "Growing by +1: every add after the first copies everything", "ops": "add(A); add(B); add(C); add(D); add(E); add(F)", "capacity": 1, "growth": "plus1"}
```

- **Doubling:** copies $= 1 + 2 + 4 + \dots + 2^{\lfloor \log_2 n \rfloor} \le 2n$ (geometric, ratio 2), insertions $= n$, total $\le 3n$ → **amortized O(1)**, but "lumpy": resizes come half as often and cost twice as much.
- **+1:** total $= n + (0 + 1 + \dots + (n-1)) = n + n(n-1)/2 = \Theta(n^2)$ → **amortized Θ(n)**.

Measured element copies (start capacity 1):

```text
n=17  doubling: 31 copies (2.82353 per add)   +1: 136 copies (9 per add)
n=1000000  doubling: 1048575 copies (2.04858 per add)   +1: 499999500000 copies (500000 per add)
```

> ⚠️ **Pitfall**: say "`add` is **amortized** O(1), **worst case** O(n)" — dropping "amortized" is wrong.

> 📘 **Beyond the lecture** (Thornton): amortized O(1) is fine for total time but not when *every* operation has a deadline (real-time control, 60 fps games) — one O(n) resize is a missed frame.

### 3.4 Practice

#### Amortized analysis: increase by 1

What is the amortized time complexity of ArrayList's `add()` if we only add 1 additional element when it's full?

<details>
<summary>Solution</summary>

**Θ(n) per add.** The array is full before every add, so the (k+1)-th add copies k elements: total $n + n(n-1)/2 = \Theta(n^2)$, divided by n. Doubling gives ≤ 3n total, O(1) amortized.

</details>

## 4. Singly Linked Lists

### 4.1 Nodes connected by pointers

An ArrayList keeps items in one contiguous block. A **linked list** is still a dynamic linear structure, but each item lives in its own heap **node**, and the order is stored in **pointers** from node to node — the nodes can be anywhere in memory. In a memory-cell picture of cells 0–7, the list "CS ? !" starts at cell 3 (the **head**), cell 3 links to cell 1, cell 1 links to cell 6; the other cells aren't part of the list.

Recursive definition: a singly linked list is **either empty (`nullptr`) or a node holding an item and a pointer to a singly linked list**. `Node<T>` holds one item of type `T` and a link to the next node. The last node's `next` is `nullptr` (the slash in the usual box drawing).

```viz linked-list
{"title": "Reaching the last node means walking", "items": "CS, ?, !", "ops": "get(2)", "start": 1}
```

> 📘 **Beyond the lecture** (algs4 §1.3): the recursive definition gives the standard traversal loop, `for (Node* x = head; x != nullptr; x = x->next)`, which you'll use for printing, the destructor and copying.

### 4.2 The API and a worked sequence

The `SinglyLinkedList<T>` API: `SinglyLinkedList()`, `bool isEmpty() const`, `size_t size() const`, `T get(size_t index) const`, `void add(const T& item)` (**at the head**), `void add(size_t index, const T& item)`, `T remove()` (**the head**), `T remove(size_t index)`. Note that the no-index `add`/`remove` work at the **head**, the opposite of the ArrayList's.

A worked sequence (indices count from the head, starting at 0):

| Step | Call | List afterwards | `n` |
|---|---|---|---|
| 1 | `SinglyLinkedList<std::string> sll;` | empty | 0 |
| 2–4 | `add("ICS 46")`, `add("ROCKS")`, `add("!")` | ! → ROCKS → ICS 46 | 3 |
| 5 | `add(1, "?")` | ! → ? → ROCKS → ICS 46 | 4 |
| 6 | `remove()` returns "!" | ? → ROCKS → ICS 46 | 3 |
| 7 | `remove(1)` returns "ROCKS" | ? → ICS 46 | 2 |

Step through it below (← / → keys work when the demo is focused):

```viz linked-list
{"title": "Singly linked list: add and remove", "ops": "add(ICS 46); add(ROCKS); add(!); add(1, ?); remove(); remove(1)", "interactive": true}
```

Head-insertion means items come out in **reverse order** of insertion — that's LIFO, the stack behaviour of [§7](#7-stacks).

### 4.3 The class: nested `Node`, `head`, `n`

The plan: our own list, a **template**, a **nested class `Node`**, and a **count of elements**.

```cpp
template <typename T>
class SinglyLinkedList {
private:
    /**
     * Defines the nodes of the singly linked list. Each node holds
     * a value and a pointer to the next node.
     */
    class Node {
    public:
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };

    Node* head;         // Pointer to the first node
    std::size_t n;      // Number of elements in the list

public:
    SinglyLinkedList() : head(nullptr), n(0) {}
    ~SinglyLinkedList();

    // Rule of Five: also define copy ctor, copy assign,
    // move ctor, move assign

    // isEmpty, size, get, add, remove ...
};
```

Storing `n` makes `size()` O(1), at the price that every mutator must update it. `Node` has **no default constructor** — that matters for two slide bugs below.

```cpp
bool isEmpty() const {
    return head == nullptr; // return size() == 0;
}

size_t size() const {
    return n;
}
```

The two `isEmpty` versions agree as long as the invariant **`head == nullptr` exactly when `n == 0`** holds. The destructor frees every node by removing the head until the list is empty; the copy/move operations are needed too — the compiler's default copy would share one chain and double-free it.

### 4.4 `rangeCheck`

```cpp
void rangeCheck(size_t index) const {
    if (index > n || index < 0)
        throw std::out_of_range("Index " + std::to_string(index) + " out of bounds");
}
```

> ⚠️ **Pitfall**: `index < 0` on a `size_t` is always false, and `index > n` lets `index == n` through, so `get(n)` dereferences `nullptr` → use `if (index >= n)` for `get`/`remove`; `add(index, item)` allows `index == n` (append) and checks `index > n` itself.

Example (compiled): on a 2-item list, `get(2)` prints `get(2): Index 2 out of bounds`.

### 4.5 `get(index)`: walk with a finger

The only node you can reach directly is the head, so put a temporary pointer — the **finger** — on it and move forward `index` times:

```cpp
T get(size_t index) {
    // Check whether index is valid
    rangeCheck(index);

    // Start from head of list
    Node* finger = head;

    // Move forward 'index' times
    while (index > 0) {
        finger = finger->next;
        index--;
    }

    // return the item in the node at position 'index'
    return finger->item;
}
```

Example: `get(2)` on ! → ? → ROCKS → ICS46 moves finger "!" → "?" → "ROCKS" and returns "ROCKS". Up to `n - 1` steps, so **O(n)**.

> ⚠️ **Pitfall**: `get` is missing `const` on the slide (the API says `T get(size_t index) const`) → add it, or you can't call `get` on a `const` list.

### 4.6 `add(item)`: insert at the head

Make the new node point at the current first node, then make `head` point at the new node:

```cpp
void add(const T& item) {
    Node* oldHead = head;                 // remember the current first node
    Node* newNode = new Node(item);       // allocate node (next defaults to nullptr)
    newNode->next = oldHead;              // link new node to the old head
    head = newNode;                       // new node becomes the head
    ++n;                                  // increase number of nodes
}
```

Example: `add("UCI")` on ! → ? → ROCKS → ICS46 gives `[UCI, !, ?, ROCKS, ICS46] n=5`. No loop → **O(1)**, and it works on an empty list too (`oldHead` is `nullptr`).

> ⚠️ **Pitfall**: link before you move `head`. Writing `head = newNode;` first loses the only pointer to the old list. `head = new Node(item, head);` does both in one line.

### 4.7 `add(index, item)`: insert at an index

To insert "UCI" at index 2 of ! → ? → ROCKS → ICS46, the pointer that must change is **"?"'s `next`** — the node *before* the spot. So walk two pointers: `finger` lands on the node now at `index`, `previous` stays one behind. For `add(2, …)` the pair (`previous`, `finger`) goes (nullptr, "!") → ("!", "?") → ("?", "ROCKS"), then stops.

```cpp
void add(int index, const T& item) {
        // check that index is within range
    rangeCheck(index);
        // if index is 0, then call one-argument add
    if (index == 0) {
        add(item);
        // else
    } else {
        // make two pointers, previous and finger. Point previous to null and finger to head
        Node* previous = nullptr;
        Node* finger = head;
        // search for index-th position by pointing previous to finger and advancing finger
        while (index > 0 && finger != nullptr) {
            previous = finger;
            finger = finger->next;
            index--;
        }
        // create new node to insert in correct position. Set its pointers and contents
        Node* current = new Node();
        current->next = finger;
        current->item = item;
        // make previous point to newly created node.
        previous->next = current;
        // increase number of nodes
        n++;
    }
}
```

> ⚠️ **Pitfall**: `new Node()` doesn't compile (`Node` has no default constructor) → `Node* current = new Node(item, finger);`. Also `int index` → `size_t`, and the range check must allow `index == n`.

Index 0 is a special case because `previous` would stay `nullptr`, and inserting at the front changes `head`, not some node's `next`. The two-step picture after the walk, using the fixed line: `add(2, "UCI")` on ! → ? → ROCKS → ICS46, from the walk to the splice. Step through it below (← / → keys work when the demo is focused):

```viz linked-list
{"title": "add(2, \"UCI\")", "items": "!, ?, ROCKS, ICS46", "ops": "add(2, UCI)"}
```

Example (compiled): `add(2, "UCI")` → `[!, ?, UCI, ROCKS, ICS46] n=5`; `add(4, "end")` on a 4-item list appends → `[!, ?, ROCKS, ICS46, end] n=5`. Walk up to `n` steps → **O(n)**.

### 4.8 `remove()`: remove the head

Move `head` one node right, then delete the old first node:

```cpp
T remove() {
    // Make a temporary pointer to head
    Node* temp = head;
    // Move head one to the right
    head = head->next;
    // Decrease number of nodes
    n--;

    // Delete old head node
    T data = temp->data;
    delete temp;
    return data;
}
```

> ⚠️ **Pitfall**: `temp->data` / `finger->data` — the field is called `item` → `T data = temp->item;`.

Copy the item out, **then** `delete`, then return the copy — after `delete`, `temp` dangles. Example: `remove()` on ! → ? → ROCKS → ICS 46 returns "!". **O(1)**. (On an empty list it would dereference `nullptr`; the [complete implementation](#54-complete-implementation-sll-and-dll) throws first.)

### 4.9 `remove(index)`: remove at an index

Same walk as `add(index, item)`; once `finger` is on the victim, make `previous` skip over it. The finished method is the solution of the [remove-at-an-index problem](#implement-remove-at-an-index) below (with `item` for the slides' `finger->data`).

`remove(2)` on ! → ? → ROCKS → ICS46: walk, bypass, delete. Step through it below (← / → keys work when the demo is focused):

```viz linked-list
{"title": "remove(2)", "items": "!, ?, ROCKS, ICS46", "ops": "remove(2)"}
```

Example (compiled): `remove(2)` on ! → ? → UCI → ROCKS → ICS46 returns "UCI". Walk → **O(n)**.

### 4.10 Cost of each operation

The question is always: *how many nodes must we walk past before the constant-time pointer work?*

| Operation | Worst case | Why |
|---|---|---|
| `add(item)` at head | **O(1)** | no loop |
| `get(index)` | **O(n)** | walk up to `n - 1` steps |
| `add(index, item)` | **O(n)** | walk, then O(1) splice |
| `remove()` at head | **O(1)** | move `head`, delete one node |
| `remove(index)` | **O(n)** | walk, then O(1) bypass |
| add / remove at tail (head only) | **O(n)** | walk to the end (removal needs the second-to-last node) |

An older version of `add` assigns to `first = new Node();` and sets `first->item`, `first->next = oldHead`.

> ⚠️ **Pitfall**: slide bugs (the code as shown on the slides): leftover `first` (no such member; `head` never updated) and `new Node()` → use the `add(item)` version of [§4.6](#46-additem-insert-at-the-head); the answer is still O(1).
> ⚠️ **Pitfall**: `public T get(int index)` on a slide is a Java leftover → in C++, access comes from the `public:` label.

> 📘 **Beyond the lecture** (Thornton, Linked List Variations): `get(i)` is really **Θ(i)** — `get(0)` is fast on any list. "O(n)" is the worst case over all `i`.

### 4.11 Would a tail pointer help?

Add a `Node* tail` member pointing at the last node:

- **Add at tail → O(1)**: `tail->next = newNode; tail = newNode;` (empty list: set `head` too).
- **Remove at tail → still O(n)**: you need the *second-to-last* node to set its `next` to `nullptr`, and an SLL can't step backwards from `tail`.

> 💡 **Key Insight**: in an SLL, a pointer to a node lets you change what comes **after** it, never what comes **before** it.

### 4.12 Practice

#### Implement remove at an index

Complete the `else` branch (the picture shows ! ? ROCKS ICS46 with `previous` and `finger` under it):

```cpp
//Retrieves and removes the item at the specified index.
T remove(int index) {
        // check that index is within range
    rangeCheck(index);
        // if index is 0, then call remove
    if (index == 0) {
        return remove();
        // else
    } else {
        // TODO
    }
}
```

<details>
<summary>Solution</summary>

```cpp
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; index--; }
        previous->next = finger->next;    // bypass the node
        n--;
        T data = finger->item;            // copy out BEFORE delete
        delete finger;
        return data;
```

Only the `next` of the node *before* the victim changes, so you need `previous`; index 0 is separate because there the pointer to change is `head`.

</details>

#### Time complexity of singly linked list operations

Fill in the worst case: `add(E item)` — O(1) insert at head, O( ) insert at tail; `get(int index)` — O( ); `add(int index, T item)` — O( ); `remove()` — O( ) from the head, O( ) from the tail; `remove(int index)` — O( ).

<details>
<summary>Solution</summary>

Add at tail **O(n)** (O(1) with a tail pointer); `get` **O(n)**; `add(index)` **O(n)**; remove from head **O(1)**, from tail **O(n)** (even with a tail pointer — no way back to the second-to-last node); `remove(index)` **O(n)**.

</details>

## 5. Doubly Linked Lists

### 5.1 Node with `prev`, head and tail

A **doubly linked list (DLL)** gives every node a second pointer to the node before it:

```cpp
class Node {
    T item;
    Node* next;
    Node* prev;
};
```

The operations name the end they work on: `DoublyLinkedList()`, `isEmpty()`, `size()`, `get(int index)`, `addFirst(Item item)`, `addLast(Item item)`, `add(int index, Item item)`, `Item removeFirst()`, `Item removeLast()`, `Item remove(int index)` (`Item`/`int` are the slides' naming; in our C++ it's `T`/`size_t`). The list keeps a **head** (Head/Beginning/Front/First) and a **tail** (Tail/End/Back/Last).

Five small diagrams, read in order, show the list growing and then shrinking:

| Diagram | Nodes | head | tail |
|---|---|---|---|
| 1 | ICS 46 (`prev` and `next` both null) | ICS 46 | ICS 46 (same node) |
| 2 | ROCKS ⇄ ICS 46 | ROCKS | ICS 46 |
| 3 | ROCKS ⇄ ICS 46 ⇄ ! | ROCKS | ! |
| 4 | ROCKS ⇄ ICS 46 | ROCKS | ICS 46 |
| 5 | ICS 46 | ICS 46 | ICS 46 |

One sequence that produces the five states in order. Step through it below (← / → keys work when the demo is focused):

```viz doubly-linked-list
{"title": "Five DLL states", "ops": "addLast(ICS 46); addFirst(ROCKS); addLast(!); removeLast(); removeFirst()", "interactive": true}
```

The one-node state is the edge case: `head == tail`, so adding to an empty list or removing the last node must update **both**.

### 5.2 Both ends in O(1) (my completion)

The lecture gives the API and pictures, not DLL code; this is my completion (compiled; `addLast`/`addFirst`/`removeFirst` are in [§5.4](#54-complete-implementation-sll-and-dll)):

```cpp
T removeLast() {                               // O(1) thanks to prev
    if (isEmpty()) throw std::out_of_range("removeLast() on empty list");
    Node* old = tail;
    tail = tail->prev;                          // second-to-last, one step away
    if (tail != nullptr) tail->next = nullptr; else head = nullptr;
    T data = old->item;
    delete old;
    --n;
    return data;
}
```

Inserting in the middle changes **four** links (new node's `prev` and `next`, `before->next`, `after->prev`); removing a middle node `x` is `x->prev->next = x->next; x->next->prev = x->prev;`. Example (compiled): `addLast("ICS 46"); addFirst("ROCKS"); addLast("!")` → `[ROCKS, ICS 46, !] backwards [!, ICS 46, ROCKS]`; then `removeLast()` returns "!".

> 📘 **Beyond the lecture** (Thornton, Linked List Variations): a DLL can walk from whichever end is closer, Θ(min(i, n − i)) ≤ n/2 steps — faster, but **still O(n)**.

### 5.3 DLL analysis

| Operation (head + tail) | Worst case |
|---|---|
| insert at head / at tail | **O(1)** / **O(1)** |
| `get(index)`, `add(index, item)`, `remove(index)` | **O(n)** (walk) |
| remove from head / from tail | **O(1)** / **O(1)** (`tail->prev`) |

### 5.4 Complete implementation: SLL and DLL

SLL (slide code, bugs fixed) and DLL (my completion). Built with `g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined`: no warnings, no sanitizer reports.

```cpp
#include <cstddef>
#include <iostream>
#include <stdexcept>
#include <string>

// Singly linked list (slide code, bugs fixed)
template <typename T>
class SinglyLinkedList {
private:
    class Node {
    public:
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head;      // first node
    std::size_t n;   // number of items

    void rangeCheck(std::size_t index) const {   // 0 <= index < n
        if (index >= n)
            throw std::out_of_range("Index " + std::to_string(index) + " out of bounds");
    }

public:
    SinglyLinkedList() : head(nullptr), n(0) {}
    ~SinglyLinkedList() { while (head != nullptr) remove(); }
    SinglyLinkedList(const SinglyLinkedList&) = delete;            // Rule of Five: copy/move not provided here
    SinglyLinkedList& operator=(const SinglyLinkedList&) = delete;

    bool isEmpty() const { return head == nullptr; }
    std::size_t size() const { return n; }

    T get(std::size_t index) const {
        rangeCheck(index);
        Node* finger = head;
        while (index > 0) { finger = finger->next; index--; }
        return finger->item;
    }
    void add(const T& item) {                          // at head
        head = new Node(item, head);
        ++n;
    }
    void add(std::size_t index, const T& item) {       // 0 <= index <= n
        if (index > n)
            throw std::out_of_range("Index " + std::to_string(index) + " out of bounds");
        if (index == 0) { add(item); return; }
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; index--; }
        previous->next = new Node(item, finger);
        n++;
    }
    T remove() {                                       // at head
        if (head == nullptr) throw std::out_of_range("remove() on empty list");
        Node* temp = head;
        head = head->next;
        n--;
        T data = temp->item;
        delete temp;
        return data;
    }
    T remove(std::size_t index) {                      // remove at an index
        rangeCheck(index);
        if (index == 0) return remove();
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; index--; }
        previous->next = finger->next;
        n--;
        T data = finger->item;
        delete finger;
        return data;
    }
    void print() const {
        std::cout << "[";
        for (Node* p = head; p != nullptr; p = p->next) std::cout << p->item << (p->next ? ", " : "");
        std::cout << "] n=" << n << '\n';
    }
};

// Doubly linked list with head and tail (my completion)
template <typename T>
class DoublyLinkedList {
private:
    class Node {
    public:
        T item;
        Node* next;
        Node* prev;
        Node(const T& it, Node* pv = nullptr, Node* nx = nullptr) : item(it), next(nx), prev(pv) {}
    };
    Node* head;
    Node* tail;
    std::size_t n;

    Node* nodeAt(std::size_t index) const {        // walk from the nearer end
        if (index < n / 2) {
            Node* p = head;
            for (std::size_t i = 0; i < index; ++i) p = p->next;
            return p;
        }
        Node* p = tail;
        for (std::size_t i = n - 1; i > index; --i) p = p->prev;
        return p;
    }

public:
    DoublyLinkedList() : head(nullptr), tail(nullptr), n(0) {}
    ~DoublyLinkedList() { while (!isEmpty()) removeFirst(); }
    DoublyLinkedList(const DoublyLinkedList&) = delete;
    DoublyLinkedList& operator=(const DoublyLinkedList&) = delete;

    bool isEmpty() const { return n == 0; }
    std::size_t size() const { return n; }

    void addFirst(const T& item) {
        Node* node = new Node(item, nullptr, head);
        if (head != nullptr) head->prev = node; else tail = node;
        head = node;
        ++n;
    }
    void addLast(const T& item) {
        Node* node = new Node(item, tail, nullptr);
        if (tail != nullptr) tail->next = node; else head = node;
        tail = node;
        ++n;
    }
    T removeFirst() {
        if (isEmpty()) throw std::out_of_range("removeFirst() on empty list");
        Node* old = head;
        head = head->next;
        if (head != nullptr) head->prev = nullptr; else tail = nullptr;
        T data = old->item;
        delete old;
        --n;
        return data;
    }
    T removeLast() {
        if (isEmpty()) throw std::out_of_range("removeLast() on empty list");
        Node* old = tail;
        tail = tail->prev;
        if (tail != nullptr) tail->next = nullptr; else head = nullptr;
        T data = old->item;
        delete old;
        --n;
        return data;
    }
    T get(std::size_t index) const {
        if (index >= n) throw std::out_of_range("bad index");
        return nodeAt(index)->item;
    }
    void add(std::size_t index, const T& item) {
        if (index > n) throw std::out_of_range("bad index");
        if (index == 0) { addFirst(item); return; }
        if (index == n) { addLast(item); return; }
        Node* after = nodeAt(index);
        Node* before = after->prev;
        Node* node = new Node(item, before, after);
        before->next = node;
        after->prev = node;
        ++n;
    }
    T remove(std::size_t index) {
        if (index >= n) throw std::out_of_range("bad index");
        if (index == 0) return removeFirst();
        if (index == n - 1) return removeLast();
        Node* victim = nodeAt(index);
        victim->prev->next = victim->next;
        victim->next->prev = victim->prev;
        T data = victim->item;
        delete victim;
        --n;
        return data;
    }
    void print() const {
        std::cout << "[";
        for (Node* p = head; p != nullptr; p = p->next) std::cout << p->item << (p->next ? ", " : "");
        std::cout << "] backwards [";
        for (Node* p = tail; p != nullptr; p = p->prev) std::cout << p->item << (p->prev ? ", " : "");
        std::cout << "] n=" << n << '\n';
    }
};

int main() {
    SinglyLinkedList<std::string> sll;                 // the worked sequence
    sll.add("ICS 46"); sll.add("ROCKS"); sll.add("!");
    sll.add(1, "?");                 sll.print();
    std::cout << "remove() -> " << sll.remove() << '\n';
    std::cout << "remove(1) -> " << sll.remove(1) << '\n';
    sll.print();
    try { sll.get(2); } catch (const std::out_of_range& e) { std::cout << "get(2): " << e.what() << '\n'; }

    DoublyLinkedList<std::string> dll;                 // the five DLL states
    dll.addLast("ICS 46"); dll.addFirst("ROCKS"); dll.addLast("!");
    dll.print();
    std::cout << "removeLast() -> " << dll.removeLast() << '\n';
    dll.add(1, "UCI");               dll.print();
    std::cout << "get(1) -> " << dll.get(1) << ", remove(1) -> " << dll.remove(1) << '\n';
    dll.print();
}
```

Output:

```text
[!, ?, ROCKS, ICS 46] n=4
remove() -> !
remove(1) -> ROCKS
[?, ICS 46] n=2
get(2): Index 2 out of bounds
[ROCKS, ICS 46, !] backwards [!, ICS 46, ROCKS] n=3
removeLast() -> !
[ROCKS, UCI, ICS 46] backwards [ICS 46, UCI, ROCKS] n=3
get(1) -> UCI, remove(1) -> UCI
[ROCKS, ICS 46] backwards [ICS 46, ROCKS] n=2
```

### 5.5 Practice

#### Time complexity analysis for a DLL

Same table as for the singly linked list, for a doubly linked list.

<details>
<summary>Solution</summary>

Insert at head **O(1)**, at tail **O(1)**; `get` **O(n)**; `add(index)` **O(n)**; remove from head **O(1)**, from tail **O(1)**; `remove(index)` **O(n)**. Only the tail rows change: `tail->prev` reaches the second-to-last node in one step.

</details>

## 6. ArrayList vs. Linked Lists

Worst case unless marked.

| Operation | ArrayList | SLL | SLL + tail | DLL (head + tail) |
|---|---|---|---|---|
| get at index | **O(1)** | O(n) | O(n) | O(n) |
| add at front | O(n) shift | **O(1)** | **O(1)** | **O(1)** |
| add at end | **O(1) amortized** | O(n) | **O(1)** | **O(1)** |
| remove front | O(n) shift | **O(1)** | **O(1)** | **O(1)** |
| remove end | **O(1) amortized** | O(n) | O(n) | **O(1)** |
| add / remove at index | O(n) shift | O(n) walk | O(n) walk | O(n) walk |

In an ArrayList, O(n) comes from **shifting**; in a linked list, from **walking** — the splice itself is O(1). Each node also costs extra memory for its pointers (measured on this g++ build: an SLL `Node<int>` is 16 bytes, a DLL `Node<int>` 24, vs. 4 bytes per ArrayList slot).

> 💡 **Key Insight** (Thornton): more links buy faster operations at the cost of memory and more edge cases — pick the simplest variation that's fast enough for the operations you need.

## 7. Stacks

### 7.1 The stack ADT

A **stack** is a dynamic linear structure where items are inserted and removed **LIFO (Last In, First Out)**: you only touch one end, the **top**. Pancakes: add one = **push** onto the top; take one = **pop** the top; look at the top without taking it = **peek**. Goal: push and pop as efficient as possible. (Picture: a stack of coloured discs with push/pop arrows at the top.)

### 7.2 Tracing push and pop

Input `To be or not to - be - - that - - - is` — a word is a push, `-` is a pop:

| After | Popped | Stack (bottom → top) |
|---|---|---|
| To be or not to | | To be or not to |
| `-` | to | To be or not |
| be, `-`, `-` | be, not | To be or |
| that, `-`, `-`, `-` | that, or, be | To |
| is | | To is |

Compiled output:

```text
popped: to be not that or be
left on stack (top first): is To
```

Step through it below (← / → keys work when the demo is focused):

```viz stack
{"title": "To be or not to - be - - that - - - is", "ops": "To be or not to - be - - that - - - is", "interactive": true}
```

### 7.3 Stack on an ArrayList

Draw "ICS46 ROCKS !" in slots 0–2, index 0 = **Front**, the last item = **End/Rear**. Put the **top at the end**: push = `add(item)`, pop = `remove()`, peek = `at(size() - 1)` — nothing else moves.

```cpp
template <typename T>
class ArrayStack {
private:
    ArrayList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    std::size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }              // append at the end
    T pop() { return list.remove(); }                          // remove from the end
    const T& peek() const { return list.at(list.size() - 1); } // read the last item
};
```

Example (compiled, counting element copies + shifts for n pushes):

```text
n=1000  top-at-back moves=2022 (2.022 per push)  top-at-front moves=501522 (501.522 per push)
n=8000  top-at-back moves=16190 (2.02375 per push)  top-at-front moves=32012190 (4001.52 per push)
```

Top at the back stays at ~2 moves per push (amortized O(1)); top at the front costs ~n/2 per push (O(n)).

> 📘 **Beyond the lecture** (Thornton, Amortized Analysis): amortized O(1) is a bound on the **total** over any sequence (n pushes ≤ 3n work), not on each call — one push that doubles the array is O(n). Peek's O(1) is a true worst case.

### 7.4 Stacks on linked lists

A stack (LIFO) only touches its top. In a singly linked list (SLL) with only `head` (picture: head → item1 → … → item5 → null), the only end you can change in O(1) is the head. So put the **top at the head**: push = "insert at head" (`add(item)`, [§4.6](#46-additem-insert-at-the-head)), pop = "remove head" (`remove()`, [§4.8](#48-remove-remove-the-head)). All three operations are **O(1) worst case**. This is the opposite end from the ArrayList stack, whose top is at the back.

```cpp
// inside LinkedStack<T>: Node* head (top), std::size_t n
void push(const T& item) {
    Node* oldHead = head;              // remember the current first node
    Node* newNode = new Node(item);    // next defaults to nullptr
    newNode->next = oldHead;           // link new node to the old head
    head = newNode;                    // new node becomes the head
    ++n;
}

T pop() {
    if (isEmpty()) throw std::underflow_error("pop from empty stack");
    Node* temp = head;
    head = head->next;                 // move head one to the right
    --n;
    T data = temp->item;               // copy the item out BEFORE deleting
    delete temp;
    return data;
}

const T& peek() const { return head->item; }   // (after the same empty check)
```

Push ICS46, ROCKS, ! and pop everything (full class in [§8.8](#88-complete-implementation-linkedstack-and-linkedqueue)):

```text
peek: !, size 3
pop: ! ROCKS ICS46
error: pop from empty stack
```

> ⚠️ **Pitfall**: the singly-linked-list `remove()` on the slides writes `T data = temp->data;` but the `Node` has `item`, not `data` → use `temp->item`. The slide also has no empty check; `pop()` needs one.

- **DLL with head and tail**: O(1) at both ends, so the top can go at either end — but every node carries a `prev` the stack never uses.
- **Top at the tail of an SLL** (reversed): with only `head`, push/pop/peek are all **O(n)** (walk to the end). Adding a `tail` pointer makes push and peek O(1), but **pop stays O(n)**: after removing the last node you need the second-to-last node, which an SLL can only find by walking from the head.

### 7.5 How do we choose?

| Implementation | push / pop / peek | Trade-off | When it wins |
|---|---|---|---|
| ArrayList | O(1) on average, O(1) on average, O(1) | less memory, faster overall, **lumpy** performance | the focus is on overall performance |
| Singly linked list | O(1), O(1), O(1) — **worst case** | extra time and space for links, but a **guarantee** every operation is fast | planes coming in for landing; an internet switch with packets arriving at a high rate |
| Doubly linked list | O(1) | extra memory overhead, same performance as SLL | — |

🔑 **Best choice depends on the problem.**

> 📘 **Beyond the lecture**: Thornton calls the ArrayList's "O(1) on average" **amortized** O(1): over any real sequence of pushes, the total cost divided by the number of pushes is constant, because one O(n) resize pays for n cheap pushes. A single push can still take O(n) — that's the "lumpy" part, and why a system that can't afford one slow step picks the linked list.

### 7.6 Practice

#### Implementing a stack with an ArrayList

Implement a stack using an **ArrayList** (operations `add(Item item)`, `add(int index, Item item)`, `remove()`). (a) Where should the top be (front or back)? (b) How do we implement Pop, Push and Peek? (c) **Amortized** big-O for Pop and Push? (d) **Worst-case** big-O for Peek? (e) **Worst-case** big-O if the top is in the reverse direction?

<details>
<summary>Solution</summary>

(a) The **back** (End/Rear) — adding/removing there shifts nothing.
(b) push = `add(item)`, pop = `remove()`, peek = `at(size() - 1)`.
(c) Both **O(1) amortized** (occasionally O(n) when the array doubles or shrinks at ¼ full).
(d) **O(1)**.
(e) Top at the front: push = `add(0, item)`, pop = `remove(0)` shift everything → **O(n)**; peek = `at(0)` stays O(1).

</details>

#### Implementing a stack with a singly or doubly linked list

Implementing Stacks using
- **singly linked list**
- **doubly linked list**

(a) Where should the top of the stack be? (b) How do we implement Pop, Push, and Peek with the linked list? (c) What is the worst-case big-O runtime for Pop, Push, and Peek? (d) What is the worst-case big-O if you implement the top of stack in the reverse direction?

<details>
<summary>Solution</summary>

- **(a)** SLL: at the **head**. DLL with head and tail: either end.
- **(b)** push = insert at head; pop = save `head`, advance it, copy the item, delete the old node; peek = `head->item` (empty checks on pop/peek). Code in [§7.4](#74-stacks-on-linked-lists).
- **(c)** All **O(1) worst case**.
- **(d)** Top at the tail: SLL head-only → all O(n); SLL head + tail → push/peek O(1) but **pop O(n)**; DLL → all O(1) via `tail->prev`.

</details>

## 8. Queues

### 8.1 The queue ADT: FIFO

A **queue** is a dynamic linear structure for sequential data that removes the **least recent** item first: items leave in the exact order they arrived (FIFO, First In First Out). Metaphor: a line of people waiting to buy tickets.

- **Enqueue**: add a new item to the **end** of the line.
- **Dequeue**: remove the item at the **front** of the line.
- Goal: maximize time efficiency for **both** operations — a queue has two "business ends", a stack only one.

### 8.2 Example of queue operations

A word means enqueue it, `-` means dequeue and print (same input as the stack example in [§7.2](#72-tracing-push-and-pop)). Queue written front → back:

| Step | Input | Printed | Queue after |
|---|---|---|---|
| 1–5 | To be or not to | | To be or not to |
| 6 | `-` | **To** | be or not to |
| 7 | be | | be or not to be |
| 8–9 | `-` `-` | **be**, **or** | not to be |
| 10 | that | | not to be that |
| 11–13 | `-` `-` `-` | **not**, **to**, **be** | that |
| 14 | is | | that is |

Step through it below (← / → keys work when the demo is focused):

```viz queue
{"title": "To be or not to - be - - that - - - is", "ops": "To be or not to - be - - that - - - is", "interactive": true}
```

The output is the input order, `To be or not to be` — a queue never reorders. The [complete implementation](#88-complete-implementation-linkedstack-and-linkedqueue) program replays it: `dequeued: To be or not to be`, then `left in queue (2): front = that`.

### 8.3 Implementation options at a glance

The same four questions apply to ArrayList, SLL and DLL: where to enqueue/dequeue, how to implement it, the worst-case (or amortized) run times, and what happens if you reverse the direction. The answers in one table:

| Structure & layout | enqueue | dequeue |
|---|---|---|
| ArrayList, front = index 0, rear = end | O(1) amortized | **O(n)** (shift left) |
| ArrayList reversed, rear = index 0, front = end | **O(n)** (shift right) | O(1) |
| Circular array (📘 beyond the lecture, [§9](#9-circular-array-queue)) | O(1) amortized | O(1) |
| SLL, head only, front = head | **O(n)** (walk to end) | O(1) |
| SLL, head only, reversed | O(1) | **O(n)** |
| ✅ SLL, head + tail, front = head, rear = tail | O(1) | O(1) |
| ❌ SLL, head + tail, reversed | O(1) | **O(n)** |
| DLL, head + tail, either direction | O(1) | O(1) |

### 8.4 Queue on an ArrayList

An ArrayList keeps item 0 in cell 0, so whichever end of the queue sits at index 0 costs O(n) — every other item shifts. Usual layout: enqueue with `add(item)`, dequeue with `remove(0)`.

```cpp
template <typename T>
class ArrayListQueue {
private:
    ArrayList<T> list;
public:
    void enqueue(const T& item) { list.add(item); }   // O(1) amortized
    T dequeue() {                                     // O(n): shifts everyone left
        if (list.isEmpty()) throw std::underflow_error("dequeue from empty queue");
        return list.remove(0);
    }
    const T& front() const { return list.at(0); }
};
```

Enqueue ICS46, ROCKS, ! and drain: `ICS46 ROCKS !` (compiled against a stand-in with the ArrayList operations of [§2](#2-arraylist-dynamic-array)).

### 8.5 Singly linked list with a tail pointer

With only `head`, one operation is always O(n). **The fix: keep a `tail` pointer**, and enqueue at the tail, dequeue at the head. Direction still matters: `tail` lets you *add* after the last node in O(1), not *remove* it (removing needs its predecessor).

```cpp
// inside LinkedQueue<T>: Node* head (front), Node* tail (rear), std::size_t n
void enqueue(const T& item) {          // O(1)
    Node* newNode = new Node(item);
    if (isEmpty()) head = newNode;     // first node is both front and rear
    else tail->next = newNode;
    tail = newNode;
    ++n;
}

T dequeue() {                          // O(1)
    if (isEmpty()) throw std::underflow_error("dequeue from empty queue");
    Node* temp = head;
    head = head->next;
    if (head == nullptr) tail = nullptr;   // queue became empty
    --n;
    T data = temp->item;
    delete temp;
    return data;
}
```

Enqueue onto a non-empty queue, then drain it — watch the last `dequeue()` reset `tail`. Step through it below (← / → keys work when the demo is focused):

```viz queue
{"title": "SLL with head and tail", "ops": "enqueue(ICS46); enqueue(ROCKS); enqueue(!); dequeue(); dequeue(); dequeue()"}
```

> ⚠️ **Pitfall**: Two empty-queue cases. Enqueue into an empty queue has no `tail->next` to set, so set `head` too. Dequeue of the last item must reset `tail = nullptr`, or the next enqueue writes through freed memory.

### 8.6 Doubly linked list

Picture a DLL with Head/Front on ROCKS and Tail/Back on "!". A DLL with head and tail can insert and remove at **both** ends in O(1) (the new tail after a removal is `tail->prev`), so both directions give O(1) enqueue and dequeue. The cost is an extra `prev` per node with no speed gain over the SLL with tail. A DLL is also what a **deque** (double-ended queue, [§10](#10-deques)) needs: add and remove at both ends.

### 8.7 What is the best choice?

The answers below are mine, by the same reasoning as [§7.5](#75-how-do-we-choose).

- **ArrayList**: as-is, dequeue is O(n) — a poor queue. As a circular array: O(1) amortized, least memory, but lumpy.
- **Singly linked list**: with a tail pointer, O(1) worst case for both — the guarantee, at one pointer per node.
- **Doubly linked list**: O(1) either way, but extra memory for `prev` with the same performance.
- Best choice depends on the problem (overall throughput → circular array; every operation fast → SLL with tail).

### 8.8 Complete implementation: LinkedStack and LinkedQueue

```cpp
#include <cstddef>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>

// Stack on a singly linked list: top = head
template <typename T>
class LinkedStack {
private:
    class Node {
    public:
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head = nullptr;   // top
    std::size_t n = 0;

public:
    LinkedStack() = default;
    ~LinkedStack() { while (!isEmpty()) pop(); }
    LinkedStack(const LinkedStack&) = delete;             // Rule of Five: copy/move not provided here
    LinkedStack& operator=(const LinkedStack&) = delete;

    bool isEmpty() const { return n == 0; }
    std::size_t size() const { return n; }

    void push(const T& item) {                 // O(1)
        head = new Node(item, head);
        ++n;
    }
    T pop() {                                  // O(1)
        if (isEmpty()) throw std::underflow_error("pop from empty stack");
        Node* temp = head;
        head = head->next;
        --n;
        T data = temp->item;                   // copy out before delete
        delete temp;
        return data;
    }
    const T& peek() const {                    // O(1)
        if (isEmpty()) throw std::underflow_error("peek at empty stack");
        return head->item;
    }
};

// Queue on a singly linked list with head AND tail: front = head, rear = tail
template <typename T>
class LinkedQueue {
private:
    class Node {
    public:
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head = nullptr;   // front: dequeue here
    Node* tail = nullptr;   // rear: enqueue here
    std::size_t n = 0;

public:
    LinkedQueue() = default;
    ~LinkedQueue() { while (!isEmpty()) dequeue(); }
    LinkedQueue(const LinkedQueue&) = delete;
    LinkedQueue& operator=(const LinkedQueue&) = delete;

    bool isEmpty() const { return n == 0; }
    std::size_t size() const { return n; }

    void enqueue(const T& item) {              // O(1)
        Node* newNode = new Node(item);
        if (isEmpty()) head = newNode;
        else tail->next = newNode;
        tail = newNode;
        ++n;
    }
    T dequeue() {                              // O(1)
        if (isEmpty()) throw std::underflow_error("dequeue from empty queue");
        Node* temp = head;
        head = head->next;
        if (head == nullptr) tail = nullptr;   // became empty
        --n;
        T data = temp->item;
        delete temp;
        return data;
    }
    const T& front() const {
        if (isEmpty()) throw std::underflow_error("front of empty queue");
        return head->item;
    }
};

int main() {
    LinkedStack<std::string> st;
    st.push("ICS46"); st.push("ROCKS"); st.push("!");
    std::cout << "peek: " << st.peek() << ", size " << st.size() << "\npop:";
    while (!st.isEmpty()) std::cout << ' ' << st.pop();
    try { st.pop(); } catch (const std::underflow_error& e) { std::cout << "\nerror: " << e.what(); }

    LinkedQueue<std::string> q;
    std::istringstream in("To be or not to - be - - that - - - is");
    std::string t;
    std::cout << "\ndequeued:";
    while (in >> t) {
        if (t == "-") std::cout << ' ' << q.dequeue();
        else q.enqueue(t);
    }
    std::cout << "\nleft in queue (" << q.size() << "): front = " << q.front() << '\n';
}
```

```text
peek: !, size 3
pop: ! ROCKS ICS46
error: pop from empty stack
dequeued: To be or not to be
left in queue (2): front = that
```

### 8.9 Practice

#### Implementing a queue with an ArrayList

Implementing queue with **ArrayList**: Where should we enqueue and dequeue items? Implement enqueue and dequeue operations. What are the worst-case (or amortized) run-times? What if we reverse the direction of enqueue and dequeue?

<details>
<summary>Solution</summary>

- Enqueue at the end with `list.add(item)`, dequeue at index 0 with `list.remove(0)`.
- Enqueue **O(1) amortized**; dequeue **O(n)** (everything shifts left).
- Reversed (`add(0, item)` / `remove()`): enqueue **O(n)**, dequeue O(1).
- Either way one operation is O(n), because the ArrayList pins item 0 to cell 0 ([§9](#9-circular-array-queue) for the fix).

</details>

#### Implementing a queue with a singly linked list

Implementing queue with **singly linked list**: Where should we enqueue and dequeue items? Implement enqueue and dequeue operations. What are the worst-case run-times? What if we reverse the direction of enqueue and dequeue? What modification allows us to get O(1) for both ops?

<details>
<summary>Solution</summary>

- Dequeue at the head, enqueue at the last node.
- Head only: dequeue O(1), enqueue **O(n)**. Reversed: enqueue O(1), dequeue **O(n)**.
- Modification: a **tail pointer**, with front = head and rear = tail → both O(1) ([§8.5](#85-singly-linked-list-with-a-tail-pointer)).
- Trap: the reversed direction with a tail pointer is still O(n) for dequeue.

</details>

#### Implementing a queue with a doubly linked list

Implementing queue with **doubly linked list**: Where should we enqueue and dequeue items? Implement enqueue and dequeue operations. What are the worst-case run-times? What if we reverse the direction of enqueue and dequeue?

<details>
<summary>Solution</summary>

- Enqueue at the tail (`newNode->prev = tail; tail->next = newNode; tail = newNode;`, or set `head` if empty), dequeue at the head (`head = head->next; head->prev = nullptr;`, or `tail = nullptr` if it becomes empty).
- Both **O(1)** worst case, and still O(1) reversed. Price: the extra `prev` pointer.

</details>

## 9. Circular Array Queue

### 9.1 Why not a plain ArrayList?

A queue enqueues at the rear and dequeues at the front. If you keep the queue in an ArrayList with the front fixed at index 0, every `dequeue()` must shift all remaining elements left, which costs O(n) (`[A B C D]` → dequeue → `[B C D]`).

A **circular array** lets the starting index move instead. On dequeue, the **front index** just advances. No element moves, so dequeue is O(1) (after dequeuing A, `front` moves from 0 to 1 and B, C stay where they are).

> 📘 **Beyond the lecture** (Thornton, *Stacks, Queues, and Deques*): `std::vector` used normally has the same problem. It always keeps its elements in cells 0…size−1, so one end of the queue is stuck at cell 0, and either enqueue or dequeue becomes Θ(n). The fix is a plain array whose front and back indices "float".

### 9.2 Front, rear and wrap-around

A circular-array queue implements a queue in a **fixed-size array** and keeps two indices:

- `front_idx`: the position of the front element.
- `rear_idx`: by one convention the **last valid entry**, by the other the **next empty index**. The lecture algorithms use "next empty index".

Both indices only move forward. When one reaches the end of the array it **wraps around** to 0 with modulo arithmetic:

```text
index = (index + 1) % capacity
```

So the queue's elements are the slots from `front` going right, possibly continuing at slot 0 (example: capacity 6, `front_idx = 1`, the queue is A B C D in slots 1–4, and the rear is at slot 4).

| Operation | Algorithm | Cost |
|---|---|---|
| enqueue(value) | `array[rear_idx] = value;` `rear_idx = (rear_idx + 1) % capacity;` | O(1) |
| dequeue() | `val = array[front_idx];` `front_idx = (front_idx + 1) % capacity;` return `val` | O(1) |

Step through it below (← / → keys work when the demo is focused). The site's demo uses the "track the size" convention from [§9.3](#93-full-vs-empty): rear slot = `(front + n) % capacity`. Watch F wrap into slot 0:

```viz circular-queue
{"title": "Queue on a circular array, capacity 5", "ops": "A B C D - - E F G", "capacity": 5, "interactive": true}
```

> ⚠️ **Pitfall**: the slides label enqueue and dequeue "amortized O(1)". For a fixed-capacity circular array both are plain **O(1) worst case**. "Amortized" only enters if the array **resizes** when full (the challenge question in the [deque practice](#102-practice)).

### 9.3 Full vs empty

If `rear_idx` is the next empty slot, then `front == rear` both when the queue is empty and when it has filled every slot. There are two ways to tell them apart:

1. **Always keep one slot empty.** Then
   - empty: `front == rear`
   - full: `(rear + 1) % capacity == front`

   The cost is one wasted slot.
2. **Track the size** `n`. Empty is `n == 0`, full is `n == capacity`, and you don't need `rear` at all, because it equals `(front + n) % capacity`.

### 9.4 The size-tracking version

> 📘 **Beyond the lecture**: Thornton and algs4 fix the array by letting the front move. Keep `f` (index of the front item) and `n` (count). Enqueue writes at `(f + n) % capacity` and does `++n`; dequeue reads `items[f]`, then `f = (f + 1) % capacity`, `--n`. Both O(1) (enqueue amortized when the array doubles). Keep the count `n`: with only front and back indices, "full" and "empty" look the same.

Example (capacity 2 → doubled to 4): enqueue 1, 2, 3; dequeue 1, 2; enqueue 4, 5. Now `f = 2` and 5 has wrapped to cell 0: cells are `[5, _, 3, 4]`, queue order 3 4 5.

The same example on a capacity-4 array (no resize needed here). Step through it below (← / → keys work when the demo is focused):

```viz circular-queue
{"title": "Circular array: the front moves, nothing shifts", "ops": "1 2 3 - - 4 5", "capacity": 4, "interactive": true}
```

## 10. Deques

### 10.1 The deque ADT

A **deque** (double-ended queue, pronounced "deck") adds and removes at **both** ends:

| Operation | Meaning |
|---|---|
| `enqueueFront(x)` / `enqueueBack(x)` | add at the front / back |
| `dequeueFront()` / `dequeueBack()` | remove and return from the front / back |
| `front()` / `back()` | look at the front / back element without removing it |

- With a **front index** pointing at the first element and a **rear index** pointing at where the next element goes (or at the last element), a deque is a circular array in which **both indices move in both directions**. `enqueueFront` steps `front` *left*, wrapping from 0 to `capacity − 1`: `front = (front - 1 + capacity) % capacity`. `dequeueBack` steps the rear left the same way.
- It is a **versatile structure**: use only one end and you have a stack; add at one end and remove at the other and you have a queue.
- C++ ships one: `std::deque`.
- As a **linked list**, a deque needs removals at both ends, so use a **doubly linked list** (a singly linked list can't remove its last node in O(1)); see [§5](#5-doubly-linked-lists).

> ⚠️ **Pitfall**: `(front - 1) % capacity` is **−1** in C++ when `front` is 0, because `%` keeps the sign of the left operand. Add `capacity` before taking `%`.

### 10.2 Practice

#### Deque on a circular array

Implement the following methods of a deque on a circular array and update the front/rear indices:

1. `enqueueFront(val)`: add element to the front of the deque
2. `enqueueBack(val)`: add element to the rear of the deque
3. `dequeueFront()`: remove and return the element from the front
4. `dequeueBack()`: remove and return the element from the rear

**Challenge question:** how do we update the deque when dynamically resizing the circular array? (Adding to a full deque requires expanding capacity.)

> Hint: keep `front` and the size `n`; then the back element is at `(front + n − 1) % capacity`.

<details>
<summary>Solution</summary>

Track `front` and `n` (option 2 of [§9.3](#93-full-vs-empty)). The rear slot is `(front + n) % capacity`.

```cpp
void enqueueFront(const T& val) {
    if (n == capacity) resize(2 * capacity);
    front = (front - 1 + capacity) % capacity;   // step left, wrapping
    data[front] = val;
    n++;
}
void enqueueBack(const T& val) {
    if (n == capacity) resize(2 * capacity);
    data[(front + n) % capacity] = val;          // rear slot
    n++;
}
T dequeueFront() {
    if (n == 0) throw std::underflow_error("empty deque");
    T val = data[front];
    front = (front + 1) % capacity;
    n--;
    return val;
}
T dequeueBack() {
    if (n == 0) throw std::underflow_error("empty deque");
    T val = data[(front + n - 1) % capacity];    // last element
    n--;
    return val;
}
```

**Challenge: resizing.** You can't copy the old array cell by cell into the same positions, because the elements may wrap around the end. Three steps:

1. **Allocate** a larger array (double the capacity).
2. **Unroll** the elements into it sequentially, in deque order: new `[k]` = old `[(front + k) % oldCapacity]` for k = 0 … n−1.
3. **Reset** `front = 0` and `rear = size` (with the size-tracking version, `rear` simply follows from `n`).

```cpp
void resize(int newCap) {
    T* bigger = new T[newCap];
    for (int k = 0; k < n; k++)                  // unroll in deque order
        bigger[k] = data[(front + k) % capacity];
    delete[] data;
    data = bigger;
    capacity = newCap;
    front = 0;                                   // rear slot is now n
}
```

With doubling, each enqueue is **amortized O(1)** (the same argument as the ArrayList in [§3](#3-resizing-and-amortized-analysis)); the dequeues are O(1). Test run starting at capacity 2: `enqueueBack(1); enqueueBack(2); enqueueFront(0); enqueueFront(-1); enqueueBack(3)`, then one `dequeueFront()`, one `dequeueBack()`, and dequeueFront until empty:

```text
deque size=5 capacity=8 : -1 0 1 2 3
dequeued: -1 3 0 1 2
```

</details>

## 11. Stack Applications: Expression Evaluation

### 11.1 Where stacks show up

Basic mechanisms in compilers and interpreters; the back button in a browser; undo in a word processor. This section is the compiler/interpreter case: evaluating arithmetic.

### 11.2 Infix vs. postfix

- **Infix**: operator **between** operands; standard math notation, needs parentheses for precedence. Example `( ( 2 + 3 ) * ( 4 * 5 ) )`.
- **Postfix**: operator **after** its operands, **no parentheses**; evaluated with one stack left to right, no ambiguity.

To convert a fully parenthesized infix expression, rewrite each innermost `( a op b )` as `a b op`, working outward:
`( ( 2 + 3 ) * ( 4 * 5 ) )` ⇒ sub-eval `((2 3 +) * (4 5 *))` ⇒ **`2 3 + 4 5 * *`**. Operands keep their order; only operators move.

### 11.3 Dijkstra's two-stack algorithm

Read the fully parenthesized infix expression left to right with a **value stack** and an **operator stack**:

- Value: push onto the value stack.
- Operator: push onto the operator stack.
- Left parenthesis: ignore.
- Right parenthesis: pop an operator and two values; push the result of applying that operator to those values onto the value stack.

The algs4 demo shows a frame with value stack 1, 2 and operator stack +, +. The expression isn't given on the slide; it is consistent with algs4's demo expression `( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )`, so the trace below is inferred from algs4. Stacks bottom → top:

| Token(s) | Value stack | Operator stack |
|---|---|---|
| `( 1 + ( ( 2 +` | 1 2 | + + ← *the frame shown on the slide* |
| `3 )` → 2 + 3 | 1 5 | + |
| `* ( 4 * 5 )` → 4 * 5 | 1 5 20 | + * |
| `)` → 5 * 20 | 1 100 | + |
| `)` → 1 + 100 | **101** | |

Every operation must be wrapped in its own parentheses: the `)` is the signal "apply the most recent operator now".

Step through it below (← / → keys work when the demo is focused):

```viz two-stack-eval
{"title": "Dijkstra's two-stack algorithm", "expression": "( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )", "interactive": true}
```

### 11.4 Operand order

The algs4 "Dijkstra's 2-Stack Demo" video ([Google Drive](https://docs.google.com/file/d/1kLs501v5QjCoGAp5lO-58KUpNXyibNCm/preview)) comes with the note *"video seems to have the order of the operands flipped."* The rule: the **first value popped is the right operand** (it was pushed last), the second popped is the left one. Written as code: `v1 = pop()`, `v2 = pop()`, `push(v2 op v1)`.

Example: `( 10 - 4 )` pops 4, then 10 → 10 − 4 = **6**. Flipped, you'd get 4 − 10 = −6. For `+` and `*` the order doesn't matter, which is why the demo's answer still comes out right.

> ⚠️ **Pitfall**: with `-` and `/` the order matters. Write down v1 and v2 and compute `v2 op v1`.

### 11.5 Postfix evaluation

Process the expression left to right; if it's an operand, push it; if it's an operation, pop 2 operands and push the result of applying it. The answer is the one item left (`peek()`). Trace of `(52 - ((5 + 7) * 4))` ⇒ `52 5 7 + 4 * -` (bottom → top):

| Token | Action | Stack |
|---|---|---|
| `52` `5` `7` | push ×3 | 52 5 7 |
| `+` | v1=7, v2=5, push(v2+v1)=12 | 52 12 |
| `4` | push(4) | 52 12 4 |
| `*` | v1=4, v2=12, push(v2*v1)=48 | 52 48 |
| `-` | v1=48, v2=52, push(v2-v1)=4 | 4 → peek()=4 |

Step through it below (← / → keys work when the demo is focused):

```viz postfix-eval
{"title": "52 5 7 + 4 * -", "expression": "52 5 7 + 4 * -", "interactive": true}
```

```cpp
long evalPostfix(const std::string& expr) {
    LinkedStack<long> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (tok == "+" || tok == "-" || tok == "*" || tok == "/") {
            long v1 = s.pop();               // right operand (popped first)
            long v2 = s.pop();               // left operand
            s.push(applyOp(tok, v2, v1));    // v2 op v1
        } else {
            s.push(std::stol(tok));
        }
    }
    long result = s.pop();
    if (!s.isEmpty()) throw std::invalid_argument("malformed postfix expression");
    return result;
}
```

`evalPostfix` on `52 5 7 + 4 * -`, `5 1 2 + 4 * + 3 -` and `10 4 -` prints `4 14 6` (`applyOp(op, left, right)` returns `left op right`; `LinkedStack` is in [§8.8](#88-complete-implementation-linkedstack-and-linkedqueue)).

### 11.6 Practice

#### Evaluating infix and postfix expressions

- Use 2-stack method for **infix** expression evaluation: `( ( 2 + 3 ) * ( 4 * 5 ) )`
- Use a stack to evaluate **postfix** expression: `5 1 2 + 4 * + 3 -`
- Convert the above expression back to infix

<details>
<summary>Solution</summary>

**(a)** = **100**. Values/operators (bottom → top): after `( ( 2 + 3 )` → 5 / empty; after `* ( 4 * 5 )` → 5 20 / `*`; final `)` → 5 × 20 = 100.

**(b)** = **14**:

| Token | Action | Stack |
|---|---|---|
| `5` `1` `2` | push ×3 | 5 1 2 |
| `+` | v1=2, v2=1 → 3 | 5 3 |
| `4` `*` | v1=4, v2=3 → 12 | 5 12 |
| `+` | v1=12, v2=5 → 17 | 17 |
| `3` `-` | v1=3, v2=17 → 14 | 14 |

Check (a) and (b) step by step:

```viz two-stack-eval
{"title": "Infix check (a)", "expression": "( ( 2 + 3 ) * ( 4 * 5 ) )"}
```

```viz postfix-eval
{"title": "Postfix check (b)", "expression": "5 1 2 + 4 * + 3 -"}
```

**(c)** Push expressions instead of numbers: `((5 + ((1 + 2) * 4)) - 3)`, i.e. 5 + (1 + 2) × 4 − 3 = 14. Operand order 5, 1, 2, 4, 3 is unchanged.

</details>

## 12. Queue Applications

A Spotify playlist (songs play in the order queued), data buffers (Netflix, Hulu), asynchronous data transfer (file I/O, sockets), requests for shared resources (printers), traffic analysis, waiting times at a call center.

> 💡 **Key Insight**: Use a queue when there is a **mismatch between input and output rate**: items arrive in bursts and are served steadily, and the queue holds the backlog in arrival order.

## 13. Quick Reference & Top 5 Things to Remember

| Operation | ArrayList | SLL | SLL + tail | DLL | Stack on ArrayList (top at end) |
|---|---|---|---|---|---|
| index access | O(1) | O(n) | O(n) | O(n) | — |
| add / remove front | O(n) | O(1) | O(1) | O(1) | — |
| add end | O(1) amort. | O(n) | O(1) | O(1) | push: O(1) amort. |
| remove end | O(1) amort. | O(n) | O(n) | O(1) | pop: O(1) amort. |
| add / remove at index | O(n) | O(n) | O(n) | O(n) | — |
| peek | — | — | — | — | O(1) |

| ADT | Order | Add / remove / look | Best linked list | Where the ends go | Cost |
|---|---|---|---|---|---|
| Stack | LIFO | push / pop / peek | SLL, head only | top = head | O(1) worst case |
| Queue | FIFO | enqueue / dequeue / front | SLL, head + tail | front = head, rear = tail | O(1) worst case |
| Stack on ArrayList | LIFO | push / pop / peek | — | top = end | O(1) amortized ("lumpy") |
| Queue on ArrayList | FIFO | enqueue / dequeue | — | front = index 0 | dequeue O(n) |
| Circular-array queue / deque | FIFO / both ends | enqueue / dequeue | — | front moves, wraps with `%` | O(1) (amortized if it resizes) |

ArrayList resize policy: default capacity 2; ×2 when full; ×½ when ¼ full. Growing by +1 instead is amortized Θ(n) per `add`.

**Top 5 things to remember**

1. Every indexed linked-list operation is O(n) because of the **walk**; the splice itself is O(1). Inserting/removing inside an SLL needs the **previous** node, and index 0 is special because it changes `head`. A DLL's `prev` makes tail removal O(1); an SLL's is O(n) even with a tail pointer.
2. ArrayList `add`/`remove` at the end are **amortized** O(1) (doubling, shrink at ¼ full) but O(n) worst case; at the front or middle they are O(n) from shifting. Growing by a constant is Θ(n) per add.
3. A linked-list stack puts the **top at the head** (push, pop, peek O(1) worst case); the ArrayList stack puts it at the **end** (O(1) amortized, "lumpy"); the wrong end costs O(n).
4. A queue on an SLL needs a **tail** pointer and must **enqueue at the tail, dequeue at the head**; a plain ArrayList queue always has one O(n) operation, so use a circular array (keep a front index and a count, wrap with `%`) — the same structure extends to a deque.
5. The **first value popped is the right operand**: compute `v2 op v1` (it matters for `-` and `/`); postfix needs one stack and no parentheses, fully parenthesized infix needs Dijkstra's two stacks. Copy the item out **before** `delete`, and update `n` in every mutator.

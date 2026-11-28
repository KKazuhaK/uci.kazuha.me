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
- [13. Complete Implementation](#13-complete-implementation)
- [14. Quick Reference & Top 5 Things to Remember](#14-quick-reference--top-5-things-to-remember)

> This chapter builds the basic linear structures from the ground up: the resizable array (ArrayList), singly and doubly linked lists, stacks, queues, circular arrays and deques, with their running times and one consistent family of C++ classes. It assumes C++ classes, templates, pointers and dynamic memory ([C++ Foundations](topic-cpp.en-US.md)) and big-O notation ([Analysis](topic-analysis.en-US.md)).

## 1. Linear Structures, ADTs and Data Structures

### 1.1 Why Data Structures?

A data structure **organizes and stores data** so that the operations we need are efficient (compare an unorganized library with a categorized one). It is judged by **time** and **space** complexity, and there is **no one-size-fits-all**, which is why there are many structures.

Typical operations are **insertion, deletion, searching and replacement**, plus **traversal, sorting and checking for emptiness**. No single structure does all of them efficiently. The choice depends on the data, on which operations are needed (and how often), and on technical limits such as memory or real-time deadlines.

### 1.2 Linear vs. Non-linear

| Linear (a sequence; each element has a previous and a next) | Non-linear (hierarchical or interconnected) |
|---|---|
| Contiguous: arrays, ArrayLists ([§2](#2-arraylist-dynamic-array)) | Trees: binary trees, BSTs |
| Pointer-based: singly and doubly linked lists ([§4](#4-singly-linked-lists), [§5](#5-doubly-linked-lists)) | Graphs: nodes and edges |
| Sequential access: stacks, queues ([§7](#7-stacks), [§8](#8-queues)) | non-contiguous memory, non-sequential traversal |

For the non-linear side see [Trees](topic-trees.en-US.md).

### 1.3 ADT vs. Data Structure

We separate **what** a collection does from **how** it is built.

- An **abstract data type (ADT)** is the *what*: which data is stored and which operations exist. It is a behavioral contract and says nothing about memory layout.
- A **data structure (DS)** is the *how*: how the data is organized, stored and manipulated. It is about memory layout, efficiency and the algorithms behind each operation.

| ADT (the "what") | Operations | Data structures that implement it (the "how") |
|---|---|---|
| List | `add()`, `remove()`, `get()` on an ordered collection | ArrayList (dynamically resizing array), linked list (node pointers) |
| Stack | LIFO: `push()`, `pop()`, `peek()` | array-based stack, linked stack (singly linked nodes) |
| Queue | FIFO: `enqueue()`, `dequeue()` | circular array (ring buffer), linked queue (head/tail pointers) |

Example: "a Stack" means the ADT; "a linked stack whose top is the head" is one data structure for it. Its `push` is O(1) because of the *structure*, not because of the ADT.

### 1.4 The Class Family Used in This Chapter

All code in the chapter belongs to one family of class templates with the same conventions, so that the pieces fit together:

- `T` is the item type, `size_t n` is the number of items, and indices are zero-based `size_t`.
- A linked node is a nested `struct Node` with members `item`, `next` and (in doubly linked lists) `prev`; lists keep `head`, `tail` and `n`. An array-backed class keeps `data`, `cap` (the allocated length) and `n`.
- An invalid index throws `std::out_of_range`; popping or dequeuing from an empty stack or queue throws `std::underflow_error`. Observers (`get`, `peek`, `front`) return a copy of the item.

| Class | ADT | Built on |
|---|---|---|
| `ArrayList<T>` ([§2](#2-arraylist-dynamic-array)) | List | a resizable array |
| `SinglyLinkedList<T>` ([§4](#4-singly-linked-lists)) | List | nodes with `next`; `head` and `tail` |
| `DoublyLinkedList<T>` ([§5](#5-doubly-linked-lists)) | List | nodes with `next` and `prev`; `head` and `tail` |
| `ArrayStack<T>`, `LinkedStack<T>` ([§7](#7-stacks)) | Stack | an `ArrayList` / a `SinglyLinkedList` |
| `ArrayListQueue<T>`, `LinkedQueue<T>` ([§8](#8-queues)) | Queue | an `ArrayList` / a `SinglyLinkedList` |
| `CircularQueue<T>` ([§9](#9-circular-array-queue)) | Queue | a circular array |
| `Deque<T>` ([§10](#10-deques)) | Deque | a circular array |

The stacks and queues are thin wrappers (adapters) around a list: each operation is one or two calls on the list, so their running times are inherited from the list. Section 13 lists every class in full, compiled and run.

## 2. ArrayList (Dynamic Array)

### 2.1 State

An ArrayList (resizable or dynamic array) is a **zero-indexed linear structure** in **contiguous memory**, backed by an **underlying array of some capacity**. Like an array it has **O(1) access by index**. It holds three things: the array `data`, the **size** `n` (number of items) and the **capacity** `cap` (allocated length). It allocates and frees memory automatically, uses the first `n` cells, and when full allocates a larger array and copies everything over. It parallels `std::vector`.

The picture below has capacity 8 and size 3; the dashed cells are allocated but unused:

```viz arraylist
{"title": "Capacity 8, size 3", "ops": "add(ICS46); add(ROCKS); add(!)", "capacity": 8, "start": 7, "code": "none"}
```

The invariant is **n ≤ cap**; cells `[n, cap)` hold nothing meaningful.

### 2.2 API

| Group | Operation | Meaning |
|---|---|---|
| Constructors | `ArrayList()` | empty, **initial capacity 2** |
| | `ArrayList(size_t capacity)` | empty, given capacity |
| Inspection | `isEmpty()`, `size()`, `capacity()`, `get(size_t index)` | empty?, item count, allocated length, item at index |
| Modifiers | `add(const T& item)` | append at the end |
| | `add(size_t index, const T& item)` | insert, shift later items right |
| | `T remove()` | remove and return the last item |
| | `T remove(size_t index)` | remove at index, shift later items left |
| | `set(size_t index, const T& item)` | replace the item at index |

The unindexed `add` and `remove` work at the **end**, the cheap end of an array (like `push_back` and `pop_back`).

### 2.3 Adding and Resizing

The data members and the two constructors (capacity 0 is bumped to 1, otherwise doubling would never grow it):

```cpp
template <typename T>
class ArrayList {
private:
    T* data;          // the underlying array
    size_t cap;       // allocated length
    size_t n;         // number of items

public:
    ArrayList() : ArrayList(2) {}                      // default capacity 2
    explicit ArrayList(size_t capacity)
        : data(new T[capacity > 0 ? capacity : 1]), cap(capacity > 0 ? capacity : 1), n(0) {}
    // ...
```

Appending stores the item at index `n`, after growing the array if it is full:

```cpp
    void add(const T& item) {                          // append at the end
        if (n == cap) resize(2 * cap);
        data[n++] = item;
    }

    void resize(size_t newCap) {
        T* bigger = new T[newCap];
        for (size_t i = 0; i < n; ++i) bigger[i] = data[i];   // the Theta(n) copy
        delete[] data;
        data = bigger;
        cap = newCap;
    }
```

On a full array, `add` allocates double the capacity, copies all n elements (**the Θ(n) part**), frees the old array, repoints `data`, then stores the item. The pointer change is the lesson, so here it is once: `add("!")` on the full capacity-2 array (the demo opens on the resize). Step through it below (← / → keys work when the demo is focused):

```viz arraylist
{"title": "add on a full ArrayList", "ops": "add(ICS46); add(Rocks); add(!)", "start": 7}
```

> ⚠️ **Pitfall**: copy **first**, then `delete[]`, then reassign `data`. Deleting first loses the data; reassigning first leaks the old buffer.

Because the class owns `data`, copying an ArrayList must copy the buffer too, otherwise two lists would free the same array. The complete class therefore follows the rule of three: a destructor `delete[] data`, a copy constructor that allocates `new T[other.cap]` and copies the items, and a copy-and-swap `operator=(ArrayList other)`.

### 2.4 Inserting and Removing at an Index

`add(index, item)` shifts `data[index..n-1]` one slot right, **back to front**, so that nothing is overwritten before it has been moved. `remove(index)` shifts left, front to back:

```cpp
    void add(size_t index, const T& item) {            // insert, shift right
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (n == cap) resize(2 * cap);
        for (size_t i = n; i > index; --i) data[i] = data[i - 1];   // back to front
        data[index] = item;
        ++n;
    }

    T remove(size_t index) {                           // remove at index, shift left
        rangeCheck(index);
        T item = data[index];
        for (size_t i = index; i + 1 < n; ++i) data[i] = data[i + 1];   // front to back
        --n;
        shrinkIfSparse();
        return item;
    }
```

`add(index, item)` allows `index == n` (an append); every other index-taking method requires `index < n`, which `rangeCheck` enforces by throwing `std::out_of_range`. The unindexed `remove()` takes the last item, `T item = data[--n];`, and throws if the list is empty. Both removals finish with `shrinkIfSparse()`:

```cpp
    void shrinkIfSparse() {                            // halve when 1/4 full
        if (cap > 1 && n <= cap / 4) resize(cap / 2);
    }
```

The growth and shrink policy is analysed in [section 3](#3-resizing-and-amortized-analysis).

### 2.5 A Complete Trace

Each step adds a line; predict the contents, size and capacity before reading the row:

| Step | Call | Contents | Size | Cap | What happened |
|---|---|---|---|---|---|
| 1 | `ArrayList<std::string> a1;` | — | 0 | 2 | default capacity 2 |
| 2 | `a1.add("ICS46");` | ICS46 | 1 | 2 | store at index n |
| 3 | `a1.add("Rocks");` | ICS46, Rocks | 2 | 2 | now full |
| 4 | `a1.add("!");` | ICS46, Rocks, ! | 3 | **4** | full → double, copy, then add |
| 5 | `a1.add(1, "Throws");` | ICS46, Throws, Rocks, ! | 4 | 4 | shift Rocks, ! right |
| 6 | `a1.add(3, "?");` | ICS46, Throws, Rocks, ?, ! | 5 | **8** | full → double, shift right, add |
| 7 | `a1.remove();` | ICS46, Throws, Rocks, ? | 4 | 8 | returns `!` |
| 8 | `a1.remove();` | ICS46, Throws, Rocks | 3 | 8 | returns `?` |
| 9 | `a1.remove();` | ICS46, Throws | 2 | **4** | returns `Rocks`; 2/8 = ¼ full → halve |

The compiled program in [section 13](#13-complete-implementation) prints exactly these states, and `a1.get(5)` afterwards throws `out_of_range: index 5`. The whole trace, one element move at a time (try your own calls in the box underneath). Step through it below (← / → keys work when the demo is focused):

```viz arraylist
{"title": "ArrayList trace", "ops": "add(ICS46); add(Rocks); add(!); add(1, Throws); add(3, ?); remove(); remove(); remove()", "interactive": true}
```

### 2.6 Running Times

| Operation | Worst | Amortized |
|---|---|---|
| `isEmpty`, `size`, `get`, `set` | O(1) | — |
| `add(x)` (end) | O(n) | **O(1)** |
| `remove()` (end) | O(n) with shrinking | O(1) |
| `add(i, x)`, `remove(i)` | O(n) (shifting) | O(n) |

An ArrayList is great at the end and at random access, and bad at the front and middle. Linked lists ([§4](#4-singly-linked-lists)) make the opposite trade.

### 2.7 Practice

#### ArrayList trace: what should happen?

Starting from an empty `ArrayList<std::string> a1;` with the default capacity 2, predict the contents, size and capacity after each of: `add("ICS46")`, `add("Rocks")`, `add("!")`, `add(1, "Throws")`, `add(3, "?")`, then three `remove()` calls.

<details>
<summary>Solution</summary>

1/2 → 2/2 (full) → `!` triggers doubling: 3/4 → "Throws" shifts Rocks and ! right: 4/4 → `?` triggers doubling to 8, and `!` shifts: [ICS46, Throws, Rocks, ?, !] 5/8 → the removes return `!`, `?`, `Rocks`; at 2/8 = ¼ the capacity halves: [ICS46, Throws] 2/4. The table is in [§2.5](#25-a-complete-trace).

</details>

## 3. Resizing and Amortized Analysis

### 3.1 Policy and Worst Case

| | Expand | Shrink |
|---|---|---|
| Trigger | adding to a **full** list | list becomes **¼ full** |
| Action | capacity × 2 | capacity × ½ |
| Cost | copy all elements | copy all elements |

**Key question:** what is the worst case of `add()`? **Cost model:** 1 for the insertion, n for copying n items. So one `add` costs 1 normally and n + 1 when it resizes: **worst case O(n)**. That is too pessimistic for a *sequence* of adds, hence amortized analysis.

> 📘 **Going further**: shrinking at ¼ (not ½) avoids thrashing. If the list shrank at ½, alternating `add` and `remove` at the boundary would resize, costing Θ(n), on every call.

### 3.2 Amortized Cost

**Amortized cost per operation** = total cost of a sequence of n operations ÷ n. Methods: **aggregate** (bound the total T(n), divide by n; used here), **accounting** (charge a fixed price and bank the credit), **potential** (a potential function stores "energy").

> 💡 **Key Insight**: amortized ≠ average case. No probability is involved: it is a worst-case guarantee on the *total* of any sequence.

### 3.3 Doubling vs. Growing by 1

Start at capacity 1 and call `add` n times. The (k+1)-th add copies k elements when the array is full:

| k | 0 | 1 | 2 | 3 | 4 | 5–7 | 8 | 9–15 | 16 |
|---|---|---|---|---|---|---|---|---|---|
| Copy cost, ×2 | 0 | 1 | 2 | 0 | 4 | 0 | 8 | 0 | 16 |
| Copy cost, +1 | 0 | 1 | 2 | 3 | 4 | 5–7 | 8 | 9–15 | 16 |

(Insertion cost is 1 in every column; total = insertion + copy.)

Watch the copies pile up with +1 growth and compare with the table. Step through it below (← / → keys work when the demo is focused):

```viz arraylist
{"title": "Growing by +1: every add after the first copies everything", "ops": "add(A); add(B); add(C); add(D); add(E); add(F)", "capacity": 1, "growth": "plus1"}
```

- **Doubling:** copies $= 1 + 2 + 4 + \dots + 2^{\lfloor \log_2 n \rfloor} \le 2n$ (geometric, ratio 2), insertions $= n$, total $\le 3n$ → **amortized O(1)**, but "lumpy": resizes come half as often and cost twice as much.
- **+1:** total $= n + (0 + 1 + \dots + (n-1)) = n + n(n-1)/2 = \Theta(n^2)$ → **amortized Θ(n)**.

Measured with the program in [section 13](#13-complete-implementation) (start capacity 1; "per add" counts the insertion too):

```text
n=17  doubling: 31 copies (2.82353 per add)   +1: 136 copies (9 per add)
n=1000000  doubling: 1048575 copies (2.04858 per add)   +1: 499999500000 copies (500000 per add)
```

> ⚠️ **Pitfall**: say "`add` is **amortized** O(1), **worst case** O(n)". Dropping "amortized" is wrong.

> 📘 **Going further** (Thornton): amortized O(1) is fine for total time but not when *every* operation has a deadline (real-time control, 60 fps games): one O(n) resize is a missed frame.

### 3.4 Practice

#### Amortized analysis: increase by 1

What is the amortized time complexity of ArrayList's `add()` if, whenever the array is full, we grow it by only 1 additional cell?

<details>
<summary>Solution</summary>

**Θ(n) per add.** The array is full before every add, so the (k+1)-th add copies k elements: total $n + n(n-1)/2 = \Theta(n^2)$, divided by n. Doubling gives ≤ 3n total, O(1) amortized.

</details>

## 4. Singly Linked Lists

### 4.1 Nodes Connected by Pointers

An ArrayList keeps its items in one contiguous block. A **linked list** is still a dynamic linear structure, but each item lives in its own heap **node**, and the order is stored in **pointers** from node to node, so the nodes can be anywhere in memory. In a memory-cell picture of cells 0–7, the list "CS ? !" starts at cell 3 (the **head**), cell 3 links to cell 1, cell 1 links to cell 6; the other cells are not part of the list.

Recursive definition: a singly linked list is **either empty (`nullptr`) or a node holding an item and a pointer to a singly linked list**. A `Node` holds one item of type `T` and a link to the next node. The last node's `next` is `nullptr` (the slash in the usual box drawing). Reaching a node means walking from the head:

```viz linked-list
{"title": "Reaching the last node means walking", "items": "CS, ?, !", "ops": "get(2)", "start": 1}
```

> 📘 **Going further** (algs4 §1.3): the recursive definition gives the standard traversal loop, `for (Node* x = head; x != nullptr; x = x->next)`, used for printing, the destructor and copying.

### 4.2 API and a Worked Sequence

The `SinglyLinkedList<T>` API: `SinglyLinkedList()`, `bool isEmpty() const`, `size_t size() const`, `T get(size_t index) const`, `void add(const T& item)` (**at the head**), `void add(size_t index, const T& item)`, `T remove()` (**the head**), `T remove(size_t index)`. The unindexed `add` and `remove` work at the **head**, the cheap end of a linked list: the opposite of the ArrayList's, whose cheap end is the back.

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

Head insertion means items come out in **reverse order** of insertion. That is LIFO, the stack behaviour of [§7](#7-stacks).

### 4.3 The Class: Nested Node, head, tail and n

The plan: our own list, as a **template**, with a **nested struct `Node`** and a **count of elements**.

```cpp
template <typename T>
class SinglyLinkedList {
private:
    struct Node {
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head = nullptr;     // first node
    Node* tail = nullptr;     // last node
    size_t n = 0;             // number of items

public:
    SinglyLinkedList() = default;
    ~SinglyLinkedList() { while (head != nullptr) remove(); }
    SinglyLinkedList(const SinglyLinkedList&) = delete;            // copying not provided
    SinglyLinkedList& operator=(const SinglyLinkedList&) = delete;

    bool isEmpty() const { return head == nullptr; }   // or: return n == 0;
    size_t size() const { return n; }
    // get, add, remove ...
```

Storing `n` makes `size()` O(1), at the price that every mutator must update it. The two `isEmpty` versions agree as long as the invariant **`head == nullptr` exactly when `n == 0`** holds. The destructor frees every node by removing the head until the list is empty. The compiler's default copy would copy only `head`, `tail` and `n`, so two lists would share one chain and free it twice; a production class defines the rule-of-five operations, and here copying is simply disabled. `Node` has **no default constructor**, which matters below.

The `tail` pointer is not used by sections 4.4–4.10, which work with `head` and `n` only. Section 4.11 shows what it adds, and the lines that maintain it (four of them) are marked there; the complete class in [section 13](#13-complete-implementation) contains them.

### 4.4 rangeCheck

Every method that takes an existing position first checks `0 ≤ index < n`:

```cpp
    void rangeCheck(size_t index) const {              // 0 <= index < n
        if (index >= n) throw std::out_of_range("index " + std::to_string(index));
    }
```

> ⚠️ **Pitfall**: with an unsigned `size_t`, the test `index < 0` is always false, and `index > n` lets `index == n` through, so `get(n)` would dereference `nullptr`. Use `index >= n` for `get` and `remove`. `add(index, item)` allows `index == n` (an append) and checks `index > n` itself.

On a 2-item list, `get(2)` throws `out_of_range: index 2` (see the output in [section 13](#13-complete-implementation)).

### 4.5 get(index): Walk with a Finger

The only node you can reach directly is the head, so put a temporary pointer, the **finger**, on it and move forward `index` times:

```cpp
    T get(size_t index) const {
        rangeCheck(index);
        Node* finger = head;
        while (index > 0) { finger = finger->next; --index; }
        return finger->item;
    }
```

Example: `get(2)` on ! → ? → ROCKS → ICS46 moves the finger "!" → "?" → "ROCKS" and returns "ROCKS". It takes up to `n - 1` steps, so **O(n)**.

> ⚠️ **Pitfall**: forgetting `const` on `get` means it cannot be called on a `const` list.

### 4.6 add(item): Insert at the Head

Make the new node point at the current first node, then make `head` point at the new node:

```cpp
    void add(const T& item) {
        Node* oldHead = head;                 // remember the current first node
        Node* newNode = new Node(item);       // allocate a node (next defaults to nullptr)
        newNode->next = oldHead;              // link the new node to the old head
        head = newNode;                       // the new node becomes the head
        ++n;                                  // one more node
    }
```

Example: `add("UCI")` on ! → ? → ROCKS → ICS46 gives `[UCI, !, ?, ROCKS, ICS46]`, `n = 5`. There is no loop, so **O(1)**, and it works on an empty list too (`oldHead` is `nullptr`). The complete class writes the same thing in one line, `head = new Node(item, head);` (plus the `tail` line of [§4.11](#411-adding-a-tail-pointer)).

> ⚠️ **Pitfall**: link before you move `head`. Writing `head = newNode;` first loses the only pointer to the old list. The one-line form `head = new Node(item, head);` does both in the right order.

### 4.7 add(index, item): Insert at an Index

To insert "UCI" at index 2 of ! → ? → ROCKS → ICS46, the pointer that must change is **"?"'s `next`**, the node *before* the spot. So walk two pointers: `finger` lands on the node now at `index`, and `previous` stays one behind. For `add(2, …)` the pair (`previous`, `finger`) goes (nullptr, "!") → ("!", "?") → ("?", "ROCKS"), then stops.

```cpp
    void add(size_t index, const T& item) {            // 0 <= index <= n
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (index == 0) { add(item); return; }         // the head changes
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; --index; }
        previous->next = new Node(item, finger);       // splice the new node in
        ++n;
    }
```

Index 0 is a special case because `previous` would stay `nullptr`: inserting at the front changes `head`, not some node's `next`. The picture after the walk, from the walk to the splice: `add(2, "UCI")` on ! → ? → ROCKS → ICS46. Step through it below (← / → keys work when the demo is focused):

```viz linked-list
{"title": "add(2, \"UCI\")", "items": "!, ?, ROCKS, ICS46", "ops": "add(2, UCI)"}
```

Example: `add(2, "UCI")` gives `[!, ?, UCI, ROCKS, ICS46]`, `n = 5`; `add(4, "end")` on a 4-item list appends, giving `[!, ?, ROCKS, ICS46, end]`. The walk takes up to `n` steps, so **O(n)**.

> ⚠️ **Pitfall**: `new Node()` does not compile here, because `Node` has no default constructor; build the node with its data, `new Node(item, finger)`. Also take the index as `size_t`, and let the range check allow `index == n`.

### 4.8 remove(): Remove the Head

Move `head` one node right, then delete the old first node:

```cpp
    T remove() {
        if (head == nullptr) throw std::out_of_range("remove() on an empty list");
        Node* temp = head;                    // the node to delete
        head = head->next;                    // move head one to the right
        --n;
        T item = temp->item;                  // copy the item out BEFORE delete
        delete temp;
        return item;
    }
```

Copy the item out, **then** `delete`, then return the copy; after `delete`, `temp` dangles. Example: `remove()` on ! → ? → ROCKS → ICS 46 returns "!". It is **O(1)**. On an empty list there is no head to dereference, so the check throws first.

### 4.9 remove(index): Remove at an Index

The same walk as `add(index, item)`; once `finger` is on the victim, make `previous` skip over it. The finished method is the answer to the [remove-at-an-index problem](#implement-remove-at-an-index) at the end of this section. `remove(2)` on ! → ? → ROCKS → ICS46: walk, bypass, delete. Step through it below (← / → keys work when the demo is focused):

```viz linked-list
{"title": "remove(2)", "items": "!, ?, ROCKS, ICS46", "ops": "remove(2)"}
```

Example: `remove(2)` on ! → ? → UCI → ROCKS → ICS46 returns "UCI". The walk makes it **O(n)**.

### 4.10 Cost of Each Operation

The question is always: *how many nodes must we walk past before the constant-time pointer work?* With only a `head` pointer:

| Operation | Worst case | Why |
|---|---|---|
| `add(item)` at head | **O(1)** | no loop |
| `get(index)` | **O(n)** | walk up to `n - 1` steps |
| `add(index, item)` | **O(n)** | walk, then O(1) splice |
| `remove()` at head | **O(1)** | move `head`, delete one node |
| `remove(index)` | **O(n)** | walk, then O(1) bypass |
| add / remove at tail (head only) | **O(n)** | walk to the end (removal needs the second-to-last node) |

> 📘 **Going further** (Thornton, Linked List Variations): `get(i)` is really **Θ(i)**, since `get(0)` is fast on any list. "O(n)" is the worst case over all `i`.

### 4.11 Adding a Tail Pointer

Add a `Node* tail` member pointing at the last node, with the invariant that `tail == nullptr` exactly when the list is empty, and otherwise `tail->next == nullptr`:

- **Add at tail → O(1)**: `tail->next = node; tail = node;`. On an empty list there is no `tail->next`; set `head` instead.
- **Remove at tail → still O(n)**: you need the *second-to-last* node to set its `next` to `nullptr`, and a singly linked list cannot step backwards from `tail`.

```cpp
    void addLast(const T& item) {                      // insert at the tail, O(1)
        Node* node = new Node(item);
        if (tail == nullptr) head = node;              // the list was empty
        else tail->next = node;
        tail = node;
        ++n;
    }
```

Four lines of the other methods keep `tail` correct:

| Method | Added line | When it matters |
|---|---|---|
| `add(item)` | `if (tail == nullptr) tail = head;` | adding to an empty list: the new node is both ends |
| `remove()` | `if (head == nullptr) tail = nullptr;` | removing the last node empties the list |
| `remove(index)` | `if (finger == tail) tail = previous;` | removing the last node by index |
| `add(index, item)` | `if (index == n) { addLast(item); return; }` | appending through the indexed method |

> ⚠️ **Pitfall**: the two empty-list cases. Adding to an empty list must set `head` as well as `tail`; removing the last node must reset `tail = nullptr`, or the next `addLast` writes through a pointer to freed memory.

> 💡 **Key Insight**: in a singly linked list, a pointer to a node lets you change what comes **after** it, never what comes **before** it.

With the tail pointer the costs become: add at tail **O(1)**, remove at tail **O(n)**; everything else is unchanged.

### 4.12 Practice

#### Implement remove at an index

Complete the `else` branch of `remove(size_t index)`, assuming a head-only list (`previous` and `finger` walk down the list as in `add(index, item)`):

```cpp
// Retrieves and removes the item at the specified index.
T remove(size_t index) {
    rangeCheck(index);                    // check that index is within range
    if (index == 0) {
        return remove();                  // index 0 is the head case
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
        while (index > 0) { previous = finger; finger = finger->next; --index; }
        previous->next = finger->next;    // bypass the node
        --n;
        T item = finger->item;            // copy out BEFORE delete
        delete finger;
        return item;
```

Only the `next` of the node *before* the victim changes, so you need `previous`; index 0 is separate because there the pointer to change is `head`. (In the complete class, one more line, `if (finger == tail) tail = previous;`, keeps the tail correct.)

</details>

#### Time complexity of singly linked list operations

Fill in the worst case for a singly linked list with only a `head` pointer: `add(item)` is O(1) at the head and O( ) at the tail; `get(index)` is O( ); `add(index, item)` is O( ); `remove()` is O( ) from the head and O( ) from the tail; `remove(index)` is O( ).

<details>
<summary>Solution</summary>

Add at tail **O(n)** (O(1) with a tail pointer); `get` **O(n)**; `add(index)` **O(n)**; remove from head **O(1)**, from tail **O(n)** (even with a tail pointer, since there is no way back to the second-to-last node); `remove(index)` **O(n)**.

</details>

## 5. Doubly Linked Lists

### 5.1 Node with prev, head and tail

A **doubly linked list (DLL)** gives every node a second pointer to the node before it:

```cpp
    struct Node {
        T item;
        Node* next;
        Node* prev;
        Node(const T& it, Node* pv = nullptr, Node* nx = nullptr)
            : item(it), next(nx), prev(pv) {}
    };
```

The operations name the end they work on: `DoublyLinkedList()`, `isEmpty()`, `size()`, `get(size_t index)`, `addFirst(item)`, `addLast(item)`, `add(size_t index, item)`, `T removeFirst()`, `T removeLast()`, `T remove(size_t index)`. The list keeps a **head** (also called Beginning, Front or First) and a **tail** (End, Back or Last), plus the count `n`.

Five small states, read in order, show the list growing and then shrinking:

| State | Nodes | head | tail |
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

The one-node state is the edge case: `head == tail`, so adding to an empty list or removing the last node must update **both** pointers.

### 5.2 Both Ends in O(1)

Because every node knows its predecessor, the new tail after a removal is one step away, `tail->prev`:

```cpp
    T removeLast() {                                   // O(1) thanks to prev
        if (isEmpty()) throw std::out_of_range("removeLast() on an empty list");
        Node* old = tail;
        tail = tail->prev;                             // second-to-last, one step away
        if (tail != nullptr) tail->next = nullptr; else head = nullptr;
        T item = old->item;
        delete old;
        --n;
        return item;
    }
```

`addLast` and `addFirst` mirror each other. `addLast` links the new node after the tail (and sets `head` too if the list was empty); `addFirst` links it before the head (and sets `tail` if the list was empty). `removeFirst` mirrors `removeLast`.

Inserting in the middle changes **four** links (the new node's `prev` and `next`, `before->next` and `after->prev`); removing a middle node `x` is `x->prev->next = x->next; x->next->prev = x->prev;`:

```cpp
    void add(size_t index, const T& item) {            // 0 <= index <= n
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (index == 0) { addFirst(item); return; }
        if (index == n) { addLast(item); return; }
        Node* after = nodeAt(index);
        Node* before = after->prev;
        Node* node = new Node(item, before, after);    // the new node's two links
        before->next = node;                           // the neighbours' two links
        after->prev = node;
        ++n;
    }
```

Example: `addLast("ICS 46"); addFirst("ROCKS"); addLast("!")` gives `[ROCKS, ICS 46, !]`, and walking backwards from the tail gives `[!, ICS 46, ROCKS]`; then `removeLast()` returns "!".

> 📘 **Going further** (Thornton, Linked List Variations): a DLL can walk from whichever end is closer, Θ(min(i, n − i)) ≤ n/2 steps, which is faster but **still O(n)**. The helper `nodeAt` in the complete class does exactly this.

### 5.3 DLL Analysis

| Operation (head + tail) | Worst case |
|---|---|
| insert at head / at tail | **O(1)** / **O(1)** |
| `get(index)`, `add(index, item)`, `remove(index)` | **O(n)** (walk) |
| remove from head / from tail | **O(1)** / **O(1)** (`tail->prev`) |

### 5.4 Practice

#### Time complexity analysis for a DLL

Fill in the same table as for the singly linked list, for a doubly linked list with head and tail pointers: add at head and tail, `get(index)`, `add(index, item)`, remove from head and tail, `remove(index)`.

<details>
<summary>Solution</summary>

Insert at head **O(1)**, at tail **O(1)**; `get` **O(n)**; `add(index)` **O(n)**; remove from head **O(1)**, from tail **O(1)**; `remove(index)` **O(n)**. Only the tail rows change compared with the singly linked list: `tail->prev` reaches the second-to-last node in one step.

</details>

## 6. ArrayList vs. Linked Lists

Worst case unless marked.

| Operation | ArrayList | SLL (head only) | SLL + tail | DLL (head + tail) |
|---|---|---|---|---|
| get at index | **O(1)** | O(n) | O(n) | O(n) |
| add at front | O(n) shift | **O(1)** | **O(1)** | **O(1)** |
| add at end | **O(1) amortized** | O(n) | **O(1)** | **O(1)** |
| remove front | O(n) shift | **O(1)** | **O(1)** | **O(1)** |
| remove end | **O(1) amortized** | O(n) | O(n) | **O(1)** |
| add / remove at index | O(n) shift | O(n) walk | O(n) walk | O(n) walk |

In an ArrayList, O(n) comes from **shifting**; in a linked list, from **walking**, since the splice itself is O(1). Each node also costs extra memory for its pointers (measured on this g++ build: an SLL node holding an `int` is 16 bytes, a DLL node 24, versus 4 bytes per ArrayList slot).

> 💡 **Key Insight** (Thornton): more links buy faster operations at the cost of memory and more edge cases. Pick the simplest variation that is fast enough for the operations you need.

## 7. Stacks

### 7.1 The Stack ADT

A **stack** is a dynamic linear structure where items are inserted and removed **LIFO (Last In, First Out)**: you only touch one end, the **top**. Think of pancakes: adding one is **push** (onto the top), taking one is **pop** (the top), and looking at the top without taking it is **peek**. The goal is to make push and pop as efficient as possible.

| Operation | Meaning |
|---|---|
| `push(item)` | add an item on top |
| `pop()` | remove and return the top item (error if empty) |
| `peek()` | return the top item without removing it (error if empty) |
| `isEmpty()`, `size()` | is it empty?, how many items |

### 7.2 Tracing Push and Pop

Input `To be or not to - be - - that - - - is`: a word is a push, `-` is a pop:

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

Draw "ICS46 ROCKS !" in slots 0–2, with index 0 = **front** and the last item = **end** (rear). Put the **top at the end**: push = `add(item)`, pop = `remove()`, peek = `get(size() - 1)`, and nothing else moves.

```cpp
template <typename T>
class ArrayStack {
private:
    ArrayList<T> list;                                 // top = the end
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }       // O(1) amortized
    T pop() {                                          // O(1) amortized
        if (isEmpty()) throw std::underflow_error("pop from an empty stack");
        return list.remove();
    }
    T peek() const {                                   // O(1)
        if (isEmpty()) throw std::underflow_error("peek at an empty stack");
        return list.get(list.size() - 1);
    }
};
```

Measured (compiled; counting element copies and shifts, each store counts one move, for n pushes):

```text
n=1000  top-at-back moves=2022 (2.022 per push)  top-at-front moves=501522 (501.522 per push)
n=8000  top-at-back moves=16190 (2.02375 per push)  top-at-front moves=32012190 (4001.52 per push)
```

With the top at the back it stays at about 2 moves per push (amortized O(1)); with the top at the front (`add(0, item)` for every push) it costs about n/2 per push (O(n)).

> 📘 **Going further** (Thornton, Amortized Analysis): amortized O(1) is a bound on the **total** over any sequence (n pushes ≤ 3n work), not on each call: one push that doubles the array is O(n). Peek's O(1) is a true worst case.

### 7.4 Stacks on Linked Lists

A stack (LIFO) only touches its top. In a singly linked list with only `head` (head → item1 → … → item5 → null), the only end you can change in O(1) is the head. So put the **top at the head**: push = "insert at head" (`add(item)`, [§4.6](#46-additem-insert-at-the-head)), pop = "remove head" (`remove()`, [§4.8](#48-remove-remove-the-head)). All three operations are **O(1) worst case**. This is the opposite end from the ArrayList stack, whose top is at the back.

```cpp
template <typename T>
class LinkedStack {
private:
    SinglyLinkedList<T> list;                          // top = the head
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }       // O(1) worst case
    T pop() {                                          // O(1) worst case
        if (isEmpty()) throw std::underflow_error("pop from an empty stack");
        return list.remove();
    }
    T peek() const {                                   // O(1) worst case
        if (isEmpty()) throw std::underflow_error("peek at an empty stack");
        return list.get(0);
    }
};
```

Pushing ICS46, ROCKS, ! and popping everything:

```text
peek: !, size 3
pop: ! ROCKS ICS46
error: pop from an empty stack
```

Other layouts:

- **DLL with head and tail**: O(1) at both ends, so the top can go at either end, but every node carries a `prev` the stack never uses.
- **Top at the tail of an SLL** (reversed): with only `head`, push, pop and peek are all **O(n)** (walk to the end). Adding a `tail` pointer makes push and peek O(1), but **pop stays O(n)**: after removing the last node you need the second-to-last node, which a singly linked list can only find by walking from the head.

### 7.5 How Do We Choose?

| Implementation | push / pop / peek | Trade-off | When it wins |
|---|---|---|---|
| ArrayList | O(1) on average, O(1) on average, O(1) | less memory, faster overall, **lumpy** performance | the focus is on overall performance |
| Singly linked list | O(1), O(1), O(1) — **worst case** | extra time and space for links, but a **guarantee** that every operation is fast | planes coming in for landing; an internet switch with packets arriving at a high rate |
| Doubly linked list | O(1) | extra memory overhead, same performance as the SLL | — |

🔑 **The best choice depends on the problem.**

> 📘 **Going further**: Thornton calls the ArrayList's "O(1) on average" **amortized** O(1): over any real sequence of pushes, the total cost divided by the number of pushes is constant, because one O(n) resize pays for n cheap pushes. A single push can still take O(n). That is the "lumpy" part, and why a system that cannot afford one slow step picks the linked list.

### 7.6 Practice

#### Implementing a stack with an ArrayList

Implement a stack using an **ArrayList** (operations `add(item)`, `add(index, item)`, `remove()`). (a) Where should the top be (front or back)? (b) How do we implement push, pop and peek? (c) What is the **amortized** big-O for pop and push? (d) What is the **worst-case** big-O for peek? (e) What is the **worst-case** big-O if the top is in the reverse direction?

<details>
<summary>Solution</summary>

(a) The **back** (end/rear): adding and removing there shifts nothing.
(b) push = `add(item)`, pop = `remove()`, peek = `get(size() - 1)`.
(c) Both **O(1) amortized** (occasionally O(n) when the array doubles or shrinks at ¼ full).
(d) **O(1)**.
(e) Top at the front: push = `add(0, item)` and pop = `remove(0)` shift everything → **O(n)**; peek = `get(0)` stays O(1).

</details>

#### Implementing a stack with a singly or doubly linked list

Implement a stack using (1) a **singly linked list** and (2) a **doubly linked list**. (a) Where should the top of the stack be? (b) How do we implement pop, push and peek with the linked list? (c) What is the worst-case big-O runtime for pop, push and peek? (d) What is the worst-case big-O if you put the top of the stack in the reverse direction?

<details>
<summary>Solution</summary>

- **(a)** SLL: at the **head**. DLL with head and tail: either end.
- **(b)** push = insert at head; pop = save `head`, advance it, copy the item, delete the old node; peek = `head->item` (with empty checks on pop and peek). The code is `LinkedStack` in [§7.4](#74-stacks-on-linked-lists).
- **(c)** All **O(1) worst case**.
- **(d)** Top at the tail: SLL head-only → all O(n); SLL head + tail → push and peek O(1) but **pop O(n)**; DLL → all O(1) via `tail->prev`.

</details>

## 8. Queues

### 8.1 The Queue ADT: FIFO

A **queue** is a dynamic linear structure for sequential data that removes the **least recent** item first: items leave in the exact order they arrived (FIFO, First In First Out). The metaphor is a line of people waiting to buy tickets.

- **Enqueue**: add a new item to the **end** (rear) of the line.
- **Dequeue**: remove the item at the **front** of the line.
- `front()` looks at the front item without removing it.
- The goal is to maximize time efficiency for **both** operations: a queue has two "business ends", a stack only one.

### 8.2 Example of Queue Operations

A word means enqueue it, `-` means dequeue and print (the same input as the stack example in [§7.2](#72-tracing-push-and-pop)). The queue is written front → back:

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

The output is the input order, `To be or not to be`: a queue never reorders. The compiled program in [section 13](#13-complete-implementation) replays it and prints `dequeued: To be or not to be`, then `left in queue (2): front = that`.

### 8.3 Implementation Options at a Glance

The same four questions apply to an ArrayList, a singly linked list and a doubly linked list: where to enqueue and dequeue, how to implement it, the worst-case (or amortized) run times, and what happens if you reverse the direction. The answers in one table:

| Structure & layout | enqueue | dequeue |
|---|---|---|
| ArrayList, front = index 0, rear = end | O(1) amortized | **O(n)** (shift left) |
| ArrayList reversed, rear = index 0, front = end | **O(n)** (shift right) | O(1) |
| Circular array ([§9](#9-circular-array-queue)) | O(1) amortized | O(1) |
| SLL, head only, front = head | **O(n)** (walk to end) | O(1) |
| SLL, head only, reversed | O(1) | **O(n)** |
| ✅ SLL, head + tail, front = head, rear = tail | O(1) | O(1) |
| ❌ SLL, head + tail, reversed | O(1) | **O(n)** |
| DLL, head + tail, either direction | O(1) | O(1) |

### 8.4 Queue on an ArrayList

An ArrayList keeps item 0 in cell 0, so whichever end of the queue sits at index 0 costs O(n): every other item shifts. The usual layout enqueues with `add(item)` and dequeues with `remove(0)`:

```cpp
template <typename T>
class ArrayListQueue {                                 // front = index 0
private:
    ArrayList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void enqueue(const T& item) { list.add(item); }    // O(1) amortized
    T dequeue() {                                      // O(n): everything shifts left
        if (isEmpty()) throw std::underflow_error("dequeue from an empty queue");
        return list.remove(0);
    }
    T front() const {
        if (isEmpty()) throw std::underflow_error("front of an empty queue");
        return list.get(0);
    }
};
```

Enqueueing ICS46, ROCKS, ! and draining the queue prints `ICS46 ROCKS !`.

### 8.5 Singly Linked List with a Tail Pointer

With only `head`, one operation is always O(n). **The fix: keep a `tail` pointer**, enqueue at the tail and dequeue at the head. Direction still matters: `tail` lets you *add* after the last node in O(1), not *remove* it (removal needs its predecessor). A `LinkedQueue` is therefore a `SinglyLinkedList` used through `addLast` and `remove` ([§4.11](#411-adding-a-tail-pointer)):

```cpp
template <typename T>
class LinkedQueue {                                    // front = head, rear = tail
private:
    SinglyLinkedList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void enqueue(const T& item) { list.addLast(item); }   // O(1)
    T dequeue() {                                         // O(1)
        if (isEmpty()) throw std::underflow_error("dequeue from an empty queue");
        return list.remove();
    }
    T front() const {
        if (isEmpty()) throw std::underflow_error("front of an empty queue");
        return list.get(0);
    }
};
```

Enqueue onto a non-empty queue, then drain it, and watch the last `dequeue()` reset `tail`. Step through it below (← / → keys work when the demo is focused):

```viz queue
{"title": "SLL with head and tail", "ops": "enqueue(ICS46); enqueue(ROCKS); enqueue(!); dequeue(); dequeue(); dequeue()"}
```

> ⚠️ **Pitfall**: two empty-queue cases. Enqueue into an empty queue has no `tail->next` to set, so it must set `head` too. Dequeue of the last item must reset `tail = nullptr`, or the next enqueue writes through freed memory. Both are handled inside `addLast` and `remove()` of the list.

### 8.6 Doubly Linked List

A DLL with head and tail (Head/Front on ROCKS, Tail/Back on "!") can insert and remove at **both** ends in O(1) (the new tail after a removal is `tail->prev`), so both directions give O(1) enqueue and dequeue. The cost is an extra `prev` per node with no speed gain over the SLL with tail. A DLL is also what a **deque** (double-ended queue, [§10](#10-deques)) needs when built from nodes: add and remove at both ends.

### 8.7 What Is the Best Choice?

By the same reasoning as for stacks ([§7.5](#75-how-do-we-choose)):

- **ArrayList**: as is, dequeue is O(n), a poor queue. As a circular array: O(1) amortized, least memory, but lumpy.
- **Singly linked list**: with a tail pointer, O(1) worst case for both, which is the guarantee, at one pointer per node.
- **Doubly linked list**: O(1) either way, but extra memory for `prev` with the same performance.
- The best choice depends on the problem (overall throughput → circular array; every operation fast → SLL with tail).

### 8.8 Practice

#### Implementing a queue with an ArrayList

Implement a queue with an **ArrayList**. Where should we enqueue and dequeue items? Implement enqueue and dequeue. What are the worst-case (or amortized) run times? What if we reverse the direction of enqueue and dequeue?

<details>
<summary>Solution</summary>

- Enqueue at the end with `list.add(item)`, dequeue at index 0 with `list.remove(0)`.
- Enqueue **O(1) amortized**; dequeue **O(n)** (everything shifts left).
- Reversed (`add(0, item)` / `remove()`): enqueue **O(n)**, dequeue O(1).
- Either way one operation is O(n), because the ArrayList pins item 0 to cell 0 ([§9](#9-circular-array-queue) gives the fix).

</details>

#### Implementing a queue with a singly linked list

Implement a queue with a **singly linked list**. Where should we enqueue and dequeue items? Implement enqueue and dequeue. What are the worst-case run times? What if we reverse the direction of enqueue and dequeue? What modification allows O(1) for both operations?

<details>
<summary>Solution</summary>

- Dequeue at the head, enqueue at the last node.
- Head only: dequeue O(1), enqueue **O(n)**. Reversed: enqueue O(1), dequeue **O(n)**.
- Modification: a **tail pointer**, with front = head and rear = tail → both O(1) ([§8.5](#85-singly-linked-list-with-a-tail-pointer)).
- Trap: the reversed direction with a tail pointer is still O(n) for dequeue.

</details>

#### Implementing a queue with a doubly linked list

Implement a queue with a **doubly linked list**. Where should we enqueue and dequeue items? Implement enqueue and dequeue. What are the worst-case run times? What if we reverse the direction of enqueue and dequeue?

<details>
<summary>Solution</summary>

- Enqueue at the tail (`newNode->prev = tail; tail->next = newNode; tail = newNode;`, or set `head` if the list is empty), dequeue at the head (`head = head->next; head->prev = nullptr;`, or `tail = nullptr` if it becomes empty). With the `DoublyLinkedList` class this is `addLast` and `removeFirst`.
- Both **O(1)** worst case, and still O(1) reversed. The price is the extra `prev` pointer.

</details>

## 9. Circular Array Queue

### 9.1 Why Not a Plain ArrayList?

A queue enqueues at the rear and dequeues at the front. If you keep the queue in an ArrayList with the front fixed at index 0, every `dequeue()` must shift all remaining elements left, which costs O(n) (`[A B C D]` → dequeue → `[B C D]`).

A **circular array** lets the starting index move instead. On dequeue, the **front index** just advances. No element moves, so dequeue is O(1) (after dequeuing A, `front` moves from 0 to 1 and B, C, D stay where they are).

> 📘 **Going further** (Thornton, *Stacks, Queues, and Deques*): `std::vector` used normally has the same problem. It always keeps its elements in cells 0…size−1, so one end of the queue is stuck at cell 0, and either enqueue or dequeue becomes Θ(n). The fix is a plain array whose front and back indices "float".

### 9.2 Front, Rear and Wrap-around

A circular-array queue implements a queue in a **fixed-size array** and keeps two indices:

- `front_idx`: the position of the front element.
- `rear_idx`: by one convention the **last valid entry**, by the other the **next empty index**. We use "next empty index".

Both indices only move forward. When one reaches the end of the array it **wraps around** to 0 with modulo arithmetic:

```text
index = (index + 1) % capacity
```

So the queue's elements are the slots from `front` going right, possibly continuing at slot 0 (example: capacity 6, `front_idx = 1`, the queue is A B C D in slots 1–4, and the rear is at slot 4).

| Operation | Algorithm | Cost |
|---|---|---|
| enqueue(value) | `array[rear_idx] = value;` `rear_idx = (rear_idx + 1) % capacity;` | O(1) |
| dequeue() | `val = array[front_idx];` `front_idx = (front_idx + 1) % capacity;` return `val` | O(1) |

Step through it below (← / → keys work when the demo is focused). The demo uses the "track the size" convention of [§9.3](#93-full-vs-empty): the rear slot is `(front + n) % capacity`. Watch F wrap into slot 0:

```viz circular-queue
{"title": "Queue on a circular array, capacity 5", "ops": "A B C D - - E F G", "capacity": 5, "interactive": true}
```

Compiled, the final state of this demo is `[F G C D E] f=2 n=5`: F and G have wrapped into slots 0 and 1, and the front is at slot 2.

> ⚠️ **Pitfall**: for a fixed-capacity circular array, enqueue and dequeue are plain **O(1) worst case**, not "amortized". "Amortized" only enters if the array **resizes** when full ([§9.4](#94-the-size-tracking-version)).

### 9.3 Full vs. Empty

If `rear_idx` is the next empty slot, then `front == rear` both when the queue is empty and when it has filled every slot. There are two ways to tell the cases apart:

1. **Always keep one slot empty.** Then
   - empty: `front == rear`
   - full: `(rear + 1) % capacity == front`

   The cost is one wasted slot.
2. **Track the size** `n`. Empty is `n == 0`, full is `n == cap`, and you do not need `rear` at all, because it equals `(front + n) % cap`.

### 9.4 The Size-Tracking Version

> 📘 **Going further**: Thornton and algs4 fix the array by letting the front move. Keep `f` (index of the front item) and `n` (count). Enqueue writes at `(f + n) % cap` and does `++n`; dequeue reads `data[f]`, then `f = (f + 1) % cap`, `--n`. Both are O(1) (enqueue amortized when the array doubles). Keep the count `n`: with only front and back indices, "full" and "empty" look the same.

`CircularQueue<T>` stores `data`, `cap`, `f` and `n`. When the array is full, `enqueue` doubles it. The elements may wrap around the end of the old array, so the new array cannot be a cell-by-cell copy. **Unroll** them in queue order instead: new `[k]` = old `[(f + k) % cap]` for k = 0 … n−1, then reset `f = 0`:

```cpp
    void resize(size_t newCap) {                       // unroll into a bigger array
        T* bigger = new T[newCap];
        for (size_t k = 0; k < n; ++k) bigger[k] = data[(f + k) % cap];
        delete[] data;
        data = bigger;
        cap = newCap;
        f = 0;
    }

    void enqueue(const T& item) {
        if (n == cap) resize(2 * cap);
        data[(f + n) % cap] = item;                    // the rear slot
        ++n;
    }
    T dequeue() {
        if (n == 0) throw std::underflow_error("dequeue from an empty queue");
        T item = data[f];
        f = (f + 1) % cap;                             // nothing moves
        --n;
        return item;
    }
```

With doubling, enqueue is **amortized O(1)** (the same argument as the ArrayList in [section 3](#3-resizing-and-amortized-analysis)) and dequeue is O(1).

Example (capacity 2, doubled to 4): enqueue 1, 2, 3; dequeue 1, 2; enqueue 4, 5. The compiled program prints the physical cells (`_` = unused):

```text
enqueue 1 2 3   [1 2 3 _] f=0 n=3 cap=4
dequeue x2      [_ _ 3 _] f=2 n=1
enqueue 4 5     [5 _ 3 4] f=2 n=3
```

Now `f = 2` and 5 has wrapped to cell 0: cells `[5, _, 3, 4]`, queue order 3 4 5. The same example on a capacity-4 array (no resize needed here). Step through it below (← / → keys work when the demo is focused):

```viz circular-queue
{"title": "Circular array: the front moves, nothing shifts", "ops": "1 2 3 - - 4 5", "capacity": 4, "interactive": true}
```

## 10. Deques

### 10.1 The Deque ADT

A **deque** (double-ended queue, pronounced "deck") adds and removes at **both** ends:

| Operation | Meaning |
|---|---|
| `enqueueFront(x)` / `enqueueBack(x)` | add at the front / back |
| `dequeueFront()` / `dequeueBack()` | remove and return from the front / back |
| `front()` / `back()` | look at the front / back element without removing it |

- With a **front index** pointing at the first element and a **rear index** pointing at where the next element goes (or at the last element), a deque is a circular array in which **both indices move in both directions**. With the size-tracking layout of [§9.4](#94-the-size-tracking-version), `enqueueBack` writes at the rear slot `(f + n) % cap`, `dequeueBack` takes the last element at `(f + n − 1) % cap`, and `enqueueFront` steps `f` *left*, wrapping from 0 to `cap − 1`: `f = (f + cap − 1) % cap`.
- It is a **versatile structure**: use only one end and you have a stack; add at one end and remove at the other and you have a queue.
- C++ ships one: `std::deque`.
- As a **linked list**, a deque needs removals at both ends, so use a **doubly linked list** (a singly linked list cannot remove its last node in O(1)); see [§5](#5-doubly-linked-lists).
- A `Deque<T>` class reuses `CircularQueue<T>`: its `enqueue` is `enqueueBack`, its `dequeue` is `dequeueFront`, the `resize` of [§9.4](#94-the-size-tracking-version) is inherited, and it adds `enqueueFront`, `dequeueBack` and `back`.
- Resizing is the same unrolling as for the circular queue, so with doubling each enqueue is **amortized O(1)** and each dequeue is O(1).

> ⚠️ **Pitfall**: `(f - 1) % cap` is a huge number (or −1 with signed integers) in C++ when `f` is 0, because `%` keeps the sign of the left operand and `size_t` wraps around. Add `cap` before taking `%`: `(f + cap - 1) % cap`.

### 10.2 Practice

#### Deque on a circular array

Implement the following methods of a deque on a circular array and update the front and rear indices:

1. `enqueueFront(val)`: add an element to the front of the deque
2. `enqueueBack(val)`: add an element to the rear of the deque
3. `dequeueFront()`: remove and return the element from the front
4. `dequeueBack()`: remove and return the element from the rear

**Challenge question:** how do we update the deque when dynamically resizing the circular array? (Adding to a full deque requires expanding the capacity.)

> Hint: keep `f` and the size `n`; then the back element is at `(f + n − 1) % cap`.

<details>
<summary>Solution</summary>

Track `f` and `n` (option 2 of [§9.3](#93-full-vs-empty)). The rear slot is `(f + n) % cap`.

```cpp
void enqueueFront(const T& item) {
    if (n == cap) resize(2 * cap);
    f = (f + cap - 1) % cap;                     // step left, wrapping
    data[f] = item;
    ++n;
}
void enqueueBack(const T& item) {
    if (n == cap) resize(2 * cap);
    data[(f + n) % cap] = item;                  // rear slot
    ++n;
}
T dequeueFront() {
    if (n == 0) throw std::underflow_error("dequeueFront from an empty deque");
    T item = data[f];
    f = (f + 1) % cap;
    --n;
    return item;
}
T dequeueBack() {
    if (n == 0) throw std::underflow_error("dequeueBack from an empty deque");
    T item = data[(f + n - 1) % cap];            // last element
    --n;
    return item;
}
```

**Challenge: resizing.** You cannot copy the old array cell by cell into the same positions, because the elements may wrap around the end. Three steps:

1. **Allocate** a larger array (double the capacity).
2. **Unroll** the elements into it sequentially, in deque order: new `[k]` = old `[(f + k) % cap]` for k = 0 … n−1.
3. **Reset** `f = 0`; the rear slot is then `n` (with the size-tracking version `rear` simply follows from `n`). This is the `resize` of [§9.4](#94-the-size-tracking-version).

With doubling, each enqueue is **amortized O(1)** and the dequeues are O(1). A test run starting at capacity 2: `enqueueBack(1); enqueueBack(2); enqueueFront(0); enqueueFront(-1); enqueueBack(3)`, then rotating through the deque once, then one `dequeueFront()`, one `dequeueBack()`, and `dequeueFront` until empty:

```text
deque size=5 capacity=8 : -1 0 1 2 3
front=-1 back=3
dequeued: -1 3 0 1 2
```

</details>

## 11. Stack Applications: Expression Evaluation

### 11.1 Where Stacks Show Up

Stacks are a basic mechanism in compilers and interpreters, in the back button of a browser and in undo in a word processor. This section is the compiler/interpreter case: evaluating arithmetic.

### 11.2 Infix vs. Postfix

- **Infix**: the operator is **between** its operands; standard math notation, which needs parentheses for precedence. Example: `( ( 2 + 3 ) * ( 4 * 5 ) )`.
- **Postfix**: the operator is **after** its operands, with **no parentheses**; it is evaluated with one stack, left to right, with no ambiguity.

To convert a fully parenthesized infix expression, rewrite each innermost `( a op b )` as `a b op`, working outward:
`( ( 2 + 3 ) * ( 4 * 5 ) )` ⇒ `((2 3 +) * (4 5 *))` ⇒ **`2 3 + 4 5 * *`**. Operands keep their order; only operators move.

### 11.3 Dijkstra's Two-Stack Algorithm

Read the fully parenthesized infix expression left to right with a **value stack** and an **operator stack**:

- Value: push onto the value stack.
- Operator: push onto the operator stack.
- Left parenthesis: ignore.
- Right parenthesis: pop an operator and two values; push the result of applying that operator to those values onto the value stack.

Trace of the algs4 example `( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )`, stacks bottom → top:

| Token(s) | Value stack | Operator stack |
|---|---|---|
| `( 1 + ( ( 2 +` | 1 2 | + + |
| `3 )` → 2 + 3 | 1 5 | + |
| `* ( 4 * 5 )` → 4 * 5 | 1 5 20 | + * |
| `)` → 5 * 20 | 1 100 | + |
| `)` → 1 + 100 | **101** | |

Every operation must be wrapped in its own parentheses: the `)` is the signal "apply the most recent operator now". Step through it below (← / → keys work when the demo is focused):

```viz two-stack-eval
{"title": "Dijkstra's two-stack algorithm", "expression": "( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )", "interactive": true}
```

### 11.4 Operand Order

The **first value popped is the right operand** (it was pushed last); the second popped is the left one. Written as code: `v1 = pop()`, `v2 = pop()`, `push(v2 op v1)`.

Example: `( 10 - 4 )` pops 4, then 10 → 10 − 4 = **6**. Flipped, you would get 4 − 10 = −6. For `+` and `*` the order does not matter.

> ⚠️ **Pitfall**: with `-` and `/` the order matters. Write down `v1` and `v2` and compute `v2 op v1`. (Some demonstrations of the algorithm show the operands flipped; they still look right on `+` and `*`.)

The algorithm as code, with a `LinkedStack<long>` of values and a `LinkedStack<std::string>` of operators; `applyOp(op, left, right)` returns `left op right`:

```cpp
long evalInfix(const std::string& expr) {
    LinkedStack<long> values;
    LinkedStack<std::string> ops;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (tok == "(") continue;              // ignore
        if (isOperator(tok)) ops.push(tok);
        else if (tok == ")") {
            std::string op = ops.pop();
            long v1 = values.pop();            // right operand
            long v2 = values.pop();            // left operand
            values.push(applyOp(op, v2, v1));
        } else {
            values.push(std::stol(tok));
        }
    }
    return values.pop();
}
```

### 11.5 Postfix Evaluation

Process the expression left to right: if the token is an operand, push it; if it is an operator, pop 2 operands and push the result of applying it. The answer is the one item left (`peek()`). Trace of `(52 - ((5 + 7) * 4))` ⇒ `52 5 7 + 4 * -` (bottom → top):

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
        if (isOperator(tok)) {
            long v1 = s.pop();                 // right operand (popped first)
            long v2 = s.pop();                 // left operand
            s.push(applyOp(tok, v2, v1));      // v2 op v1
        } else {
            s.push(std::stol(tok));
        }
    }
    long result = s.pop();
    if (!s.isEmpty()) throw std::invalid_argument("malformed postfix expression");
    return result;
}
```

`evalPostfix` on `52 5 7 + 4 * -`, `5 1 2 + 4 * + 3 -` and `10 4 -` gives `4`, `14` and `6`.

### 11.6 Postfix Back to Infix

The same loop converts postfix back to a fully parenthesized infix expression if the stack holds expression strings instead of numbers. On an operator, pop the right and then the left sub-expression and push `"(" + left + " op " + right + ")"`:

```cpp
std::string postfixToInfix(const std::string& expr) {
    LinkedStack<std::string> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (isOperator(tok)) {
            std::string right = s.pop();
            std::string left = s.pop();
            s.push("(" + left + " " + tok + " " + right + ")");
        } else {
            s.push(tok);
        }
    }
    return s.pop();
}
```

### 11.7 Practice

#### Evaluating infix and postfix expressions

- Use the 2-stack method to evaluate the **infix** expression `( ( 2 + 3 ) * ( 4 * 5 ) )`.
- Use a stack to evaluate the **postfix** expression `5 1 2 + 4 * + 3 -`.
- Convert the postfix expression back to infix.

<details>
<summary>Solution</summary>

**(a)** = **100**. Values / operators (bottom → top): after `( ( 2 + 3 )` → 5 / empty; after `* ( 4 * 5 )` → 5 20 / `*`; final `)` → 5 × 20 = 100.

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

**(c)** Push expressions instead of numbers: `((5 + ((1 + 2) * 4)) - 3)`, i.e. 5 + (1 + 2) × 4 − 3 = 14. The operand order 5, 1, 2, 4, 3 is unchanged (this is `postfixToInfix`, [§11.6](#116-postfix-back-to-infix)).

</details>

## 12. Queue Applications

A music playlist (songs play in the order queued), data buffers (video streaming), asynchronous data transfer (file I/O, sockets), requests for shared resources (printers), traffic analysis, waiting times at a call center.

> 💡 **Key Insight**: use a queue when there is a **mismatch between input and output rate**: items arrive in bursts and are served steadily, and the queue holds the backlog in arrival order.

## 13. Complete Implementation

The family of classes compiles as one header plus one test program. `linear.hpp` holds every class of the chapter: `ArrayList`, `SinglyLinkedList` (with `tail`), `DoublyLinkedList`, the two stacks, the two list-based queues, `CircularQueue` and `Deque`. `main.cpp` adds the expression evaluators and replays the traces of the chapter. Built with `g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined`: no warnings, no sanitizer reports.

### 13.1 linear.hpp

```cpp
#pragma once
#include <cstddef>
#include <sstream>
#include <stdexcept>
#include <string>
#include <utility>

// ---------------------------------------------------------------------------
// ArrayList: a resizable array. Cells [0, n) hold the items, [n, cap) are unused.
// ---------------------------------------------------------------------------
template <typename T>
class ArrayList {
private:
    T* data;          // the underlying array
    size_t cap;       // allocated length
    size_t n;         // number of items

    void rangeCheck(size_t index) const {              // 0 <= index < n
        if (index >= n) throw std::out_of_range("index " + std::to_string(index));
    }
    void resize(size_t newCap) {
        T* bigger = new T[newCap];
        for (size_t i = 0; i < n; ++i) bigger[i] = data[i];   // the Theta(n) copy
        delete[] data;
        data = bigger;
        cap = newCap;
    }
    void shrinkIfSparse() {                            // halve when 1/4 full
        if (cap > 1 && n <= cap / 4) resize(cap / 2);
    }

public:
    ArrayList() : ArrayList(2) {}                      // default capacity 2
    explicit ArrayList(size_t capacity)
        : data(new T[capacity > 0 ? capacity : 1]), cap(capacity > 0 ? capacity : 1), n(0) {}

    // Rule of three: we own data, so copying must copy the buffer.
    ~ArrayList() { delete[] data; }
    ArrayList(const ArrayList& other)
        : data(new T[other.cap]), cap(other.cap), n(other.n) {
        for (size_t i = 0; i < n; ++i) data[i] = other.data[i];
    }
    ArrayList& operator=(ArrayList other) {            // copy-and-swap
        std::swap(data, other.data);
        std::swap(cap, other.cap);
        std::swap(n, other.n);
        return *this;
    }

    bool isEmpty() const { return n == 0; }
    size_t size() const { return n; }
    size_t capacity() const { return cap; }

    T get(size_t index) const { rangeCheck(index); return data[index]; }
    void set(size_t index, const T& item) { rangeCheck(index); data[index] = item; }

    void add(const T& item) {                          // append at the end
        if (n == cap) resize(2 * cap);
        data[n++] = item;
    }
    void add(size_t index, const T& item) {            // insert, shift right
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (n == cap) resize(2 * cap);
        for (size_t i = n; i > index; --i) data[i] = data[i - 1];   // back to front
        data[index] = item;
        ++n;
    }
    T remove() {                                       // remove from the end
        if (n == 0) throw std::out_of_range("remove() on an empty list");
        T item = data[--n];
        shrinkIfSparse();
        return item;
    }
    T remove(size_t index) {                           // remove at index, shift left
        rangeCheck(index);
        T item = data[index];
        for (size_t i = index; i + 1 < n; ++i) data[i] = data[i + 1];   // front to back
        --n;
        shrinkIfSparse();
        return item;
    }

    std::string toString() const {
        std::ostringstream out;
        out << '[';
        for (size_t i = 0; i < n; ++i) out << (i ? ", " : "") << data[i];
        out << ']';
        return out.str();
    }
};

// ---------------------------------------------------------------------------
// SinglyLinkedList: head and tail pointers. add() / remove() work at the head.
// ---------------------------------------------------------------------------
template <typename T>
class SinglyLinkedList {
private:
    struct Node {
        T item;
        Node* next;
        Node(const T& it, Node* nx = nullptr) : item(it), next(nx) {}
    };
    Node* head = nullptr;     // first node
    Node* tail = nullptr;     // last node
    size_t n = 0;             // number of items

    void rangeCheck(size_t index) const {              // 0 <= index < n
        if (index >= n) throw std::out_of_range("index " + std::to_string(index));
    }

public:
    SinglyLinkedList() = default;
    ~SinglyLinkedList() { while (head != nullptr) remove(); }
    SinglyLinkedList(const SinglyLinkedList&) = delete;            // copying not provided
    SinglyLinkedList& operator=(const SinglyLinkedList&) = delete;

    bool isEmpty() const { return head == nullptr; }
    size_t size() const { return n; }

    T get(size_t index) const {
        rangeCheck(index);
        Node* finger = head;
        while (index > 0) { finger = finger->next; --index; }
        return finger->item;
    }

    void add(const T& item) {                          // insert at the head, O(1)
        head = new Node(item, head);
        if (tail == nullptr) tail = head;              // the list was empty
        ++n;
    }
    void addLast(const T& item) {                      // insert at the tail, O(1)
        Node* node = new Node(item);
        if (tail == nullptr) head = node;              // the list was empty
        else tail->next = node;
        tail = node;
        ++n;
    }
    void add(size_t index, const T& item) {            // 0 <= index <= n
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (index == 0) { add(item); return; }
        if (index == n) { addLast(item); return; }
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; --index; }
        previous->next = new Node(item, finger);
        ++n;
    }

    T remove() {                                       // remove the head, O(1)
        if (head == nullptr) throw std::out_of_range("remove() on an empty list");
        Node* temp = head;
        head = head->next;
        if (head == nullptr) tail = nullptr;           // the list became empty
        --n;
        T item = temp->item;                           // copy out BEFORE delete
        delete temp;
        return item;
    }
    T remove(size_t index) {                           // remove at index
        rangeCheck(index);
        if (index == 0) return remove();
        Node* previous = nullptr;
        Node* finger = head;
        while (index > 0) { previous = finger; finger = finger->next; --index; }
        previous->next = finger->next;                 // bypass the node
        if (finger == tail) tail = previous;
        --n;
        T item = finger->item;
        delete finger;
        return item;
    }

    std::string toString() const {
        std::ostringstream out;
        out << '[';
        for (Node* x = head; x != nullptr; x = x->next)
            out << x->item << (x->next != nullptr ? ", " : "");
        out << ']';
        return out.str();
    }
};

// ---------------------------------------------------------------------------
// DoublyLinkedList: every node also knows its predecessor.
// ---------------------------------------------------------------------------
template <typename T>
class DoublyLinkedList {
private:
    struct Node {
        T item;
        Node* next;
        Node* prev;
        Node(const T& it, Node* pv = nullptr, Node* nx = nullptr)
            : item(it), next(nx), prev(pv) {}
    };
    Node* head = nullptr;
    Node* tail = nullptr;
    size_t n = 0;

    void rangeCheck(size_t index) const {              // 0 <= index < n
        if (index >= n) throw std::out_of_range("index " + std::to_string(index));
    }
    Node* nodeAt(size_t index) const {                 // walk from the nearer end
        if (index < n / 2) {
            Node* x = head;
            for (size_t i = 0; i < index; ++i) x = x->next;
            return x;
        }
        Node* x = tail;
        for (size_t i = n - 1; i > index; --i) x = x->prev;
        return x;
    }

public:
    DoublyLinkedList() = default;
    ~DoublyLinkedList() { while (!isEmpty()) removeFirst(); }
    DoublyLinkedList(const DoublyLinkedList&) = delete;
    DoublyLinkedList& operator=(const DoublyLinkedList&) = delete;

    bool isEmpty() const { return n == 0; }
    size_t size() const { return n; }

    T get(size_t index) const { rangeCheck(index); return nodeAt(index)->item; }

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
    void add(size_t index, const T& item) {            // 0 <= index <= n
        if (index > n) throw std::out_of_range("index " + std::to_string(index));
        if (index == 0) { addFirst(item); return; }
        if (index == n) { addLast(item); return; }
        Node* after = nodeAt(index);
        Node* before = after->prev;
        Node* node = new Node(item, before, after);    // the new node's two links
        before->next = node;                           // the neighbours' two links
        after->prev = node;
        ++n;
    }

    T removeFirst() {
        if (isEmpty()) throw std::out_of_range("removeFirst() on an empty list");
        Node* old = head;
        head = head->next;
        if (head != nullptr) head->prev = nullptr; else tail = nullptr;
        T item = old->item;
        delete old;
        --n;
        return item;
    }
    T removeLast() {                                   // O(1) thanks to prev
        if (isEmpty()) throw std::out_of_range("removeLast() on an empty list");
        Node* old = tail;
        tail = tail->prev;
        if (tail != nullptr) tail->next = nullptr; else head = nullptr;
        T item = old->item;
        delete old;
        --n;
        return item;
    }
    T remove(size_t index) {
        rangeCheck(index);
        if (index == 0) return removeFirst();
        if (index == n - 1) return removeLast();
        Node* victim = nodeAt(index);
        victim->prev->next = victim->next;
        victim->next->prev = victim->prev;
        T item = victim->item;
        delete victim;
        --n;
        return item;
    }

    std::string toString() const {
        std::ostringstream out;
        out << '[';
        for (Node* x = head; x != nullptr; x = x->next)
            out << x->item << (x->next != nullptr ? ", " : "");
        out << ']';
        return out.str();
    }
    std::string toStringBackwards() const {
        std::ostringstream out;
        out << '[';
        for (Node* x = tail; x != nullptr; x = x->prev)
            out << x->item << (x->prev != nullptr ? ", " : "");
        out << ']';
        return out.str();
    }
};

// ---------------------------------------------------------------------------
// Stacks: top = the cheap end of the list.
// ---------------------------------------------------------------------------
template <typename T>
class ArrayStack {
private:
    ArrayList<T> list;                                 // top = the end
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }       // O(1) amortized
    T pop() {                                          // O(1) amortized
        if (isEmpty()) throw std::underflow_error("pop from an empty stack");
        return list.remove();
    }
    T peek() const {                                   // O(1)
        if (isEmpty()) throw std::underflow_error("peek at an empty stack");
        return list.get(list.size() - 1);
    }
};

template <typename T>
class LinkedStack {
private:
    SinglyLinkedList<T> list;                          // top = the head
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void push(const T& item) { list.add(item); }       // O(1) worst case
    T pop() {                                          // O(1) worst case
        if (isEmpty()) throw std::underflow_error("pop from an empty stack");
        return list.remove();
    }
    T peek() const {                                   // O(1) worst case
        if (isEmpty()) throw std::underflow_error("peek at an empty stack");
        return list.get(0);
    }
};

// ---------------------------------------------------------------------------
// Queues
// ---------------------------------------------------------------------------
template <typename T>
class ArrayListQueue {                                 // front = index 0
private:
    ArrayList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void enqueue(const T& item) { list.add(item); }    // O(1) amortized
    T dequeue() {                                      // O(n): everything shifts left
        if (isEmpty()) throw std::underflow_error("dequeue from an empty queue");
        return list.remove(0);
    }
    T front() const {
        if (isEmpty()) throw std::underflow_error("front of an empty queue");
        return list.get(0);
    }
};

template <typename T>
class LinkedQueue {                                    // front = head, rear = tail
private:
    SinglyLinkedList<T> list;
public:
    bool isEmpty() const { return list.isEmpty(); }
    size_t size() const { return list.size(); }
    void enqueue(const T& item) { list.addLast(item); }   // O(1)
    T dequeue() {                                         // O(1)
        if (isEmpty()) throw std::underflow_error("dequeue from an empty queue");
        return list.remove();
    }
    T front() const {
        if (isEmpty()) throw std::underflow_error("front of an empty queue");
        return list.get(0);
    }
};

// Circular array: f = index of the front item, n = number of items.
template <typename T>
class CircularQueue {
protected:
    T* data;
    size_t cap;
    size_t f = 0;
    size_t n = 0;

    void resize(size_t newCap) {                       // unroll into a bigger array
        T* bigger = new T[newCap];
        for (size_t k = 0; k < n; ++k) bigger[k] = data[(f + k) % cap];
        delete[] data;
        data = bigger;
        cap = newCap;
        f = 0;
    }

public:
    explicit CircularQueue(size_t capacity = 2)
        : data(new T[capacity > 0 ? capacity : 1]), cap(capacity > 0 ? capacity : 1) {}
    ~CircularQueue() { delete[] data; }
    CircularQueue(const CircularQueue&) = delete;
    CircularQueue& operator=(const CircularQueue&) = delete;

    bool isEmpty() const { return n == 0; }
    size_t size() const { return n; }
    size_t capacity() const { return cap; }

    void enqueue(const T& item) {
        if (n == cap) resize(2 * cap);
        data[(f + n) % cap] = item;                    // the rear slot
        ++n;
    }
    T dequeue() {
        if (n == 0) throw std::underflow_error("dequeue from an empty queue");
        T item = data[f];
        f = (f + 1) % cap;                             // nothing moves
        --n;
        return item;
    }
    T front() const {
        if (n == 0) throw std::underflow_error("front of an empty queue");
        return data[f];
    }

    std::string layout() const {                       // the physical cells, '_' = unused
        std::ostringstream out;
        out << '[';
        for (size_t c = 0; c < cap; ++c) {
            if (c) out << ' ';
            if ((c + cap - f) % cap < n) out << data[c]; else out << '_';
        }
        out << "] f=" << f << " n=" << n;
        return out.str();
    }
};

// Deque: the same circular array, with both ends open.
template <typename T>
class Deque : public CircularQueue<T> {
    using Base = CircularQueue<T>;
    using Base::data;
    using Base::cap;
    using Base::f;
    using Base::n;
    using Base::resize;

public:
    explicit Deque(size_t capacity = 2) : Base(capacity) {}

    void enqueueFront(const T& item) {
        if (n == cap) resize(2 * cap);
        f = (f + cap - 1) % cap;                       // step left, wrapping (never % of a negative)
        data[f] = item;
        ++n;
    }
    void enqueueBack(const T& item) { this->enqueue(item); }
    T dequeueFront() { return this->dequeue(); }
    T dequeueBack() {
        if (n == 0) throw std::underflow_error("dequeueBack from an empty deque");
        T item = data[(f + n - 1) % cap];              // the last item
        --n;
        return item;
    }
    T back() const {
        if (n == 0) throw std::underflow_error("back of an empty deque");
        return data[(f + n - 1) % cap];
    }
};
```

### 13.2 main.cpp

```cpp
#include <iostream>
#include <sstream>
#include <string>

#include "linear.hpp"

// ---- Expression evaluation -------------------------------------------------
long applyOp(const std::string& op, long left, long right) {
    if (op == "+") return left + right;
    if (op == "-") return left - right;
    if (op == "*") return left * right;
    if (op == "/") {
        if (right == 0) throw std::domain_error("division by zero");
        return left / right;
    }
    throw std::invalid_argument("unknown operator " + op);
}

bool isOperator(const std::string& tok) {
    return tok == "+" || tok == "-" || tok == "*" || tok == "/";
}

// Postfix: one stack, no parentheses.
long evalPostfix(const std::string& expr) {
    LinkedStack<long> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (isOperator(tok)) {
            long v1 = s.pop();                 // right operand (popped first)
            long v2 = s.pop();                 // left operand
            s.push(applyOp(tok, v2, v1));      // v2 op v1
        } else {
            s.push(std::stol(tok));
        }
    }
    long result = s.pop();
    if (!s.isEmpty()) throw std::invalid_argument("malformed postfix expression");
    return result;
}

// Dijkstra's two-stack algorithm: fully parenthesized infix.
long evalInfix(const std::string& expr) {
    LinkedStack<long> values;
    LinkedStack<std::string> ops;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (tok == "(") continue;              // ignore
        if (isOperator(tok)) ops.push(tok);
        else if (tok == ")") {
            std::string op = ops.pop();
            long v1 = values.pop();            // right operand
            long v2 = values.pop();            // left operand
            values.push(applyOp(op, v2, v1));
        } else {
            values.push(std::stol(tok));
        }
    }
    return values.pop();
}

// Postfix back to fully parenthesized infix: push expressions, not numbers.
std::string postfixToInfix(const std::string& expr) {
    LinkedStack<std::string> s;
    std::istringstream in(expr);
    std::string tok;
    while (in >> tok) {
        if (isOperator(tok)) {
            std::string right = s.pop();
            std::string left = s.pop();
            s.push("(" + left + " " + tok + " " + right + ")");
        } else {
            s.push(tok);
        }
    }
    return s.pop();
}

// ---- Instrumentation for the cost experiments ------------------------------
struct Counted {                               // counts every assignment (element copy or shift)
    int v = 0;
    static inline long long assignments = 0;
    Counted() = default;
    Counted(const Counted&) = default;
    Counted& operator=(const Counted& o) { v = o.v; ++assignments; return *this; }
};

// Copies made by n adds starting from capacity 1 (model of the growth policy).
unsigned long long copies(size_t n, bool doubling) {
    size_t capacity = 1, size = 0;
    unsigned long long total = 0;
    for (size_t i = 0; i < n; ++i) {
        if (size == capacity) { total += size; capacity = doubling ? 2 * capacity : capacity + 1; }
        ++size;
    }
    return total;
}

int main() {
    std::cout << "== ArrayList trace ==\n";
    ArrayList<std::string> a1;
    auto row = [&](const char* call) {
        std::cout << call << "  " << a1.toString() << "  size=" << a1.size()
                  << " cap=" << a1.capacity() << '\n';
    };
    row("ArrayList a1;");
    a1.add("ICS46");        row("add(\"ICS46\")");
    a1.add("Rocks");        row("add(\"Rocks\")");
    a1.add("!");            row("add(\"!\")");
    a1.add(1, "Throws");    row("add(1, \"Throws\")");
    a1.add(3, "?");         row("add(3, \"?\")");
    for (int k = 0; k < 3; ++k) {
        std::string gone = a1.remove();
        row(("remove() -> " + gone).c_str());
    }
    try { a1.get(5); } catch (const std::out_of_range& e) { std::cout << "get(5): out_of_range: " << e.what() << '\n'; }

    std::cout << "\n== growth policy ==\n";
    for (size_t n : {17ul, 1000000ul}) {
        double d = static_cast<double>(copies(n, true) + n), p = static_cast<double>(copies(n, false) + n);
        std::cout << "n=" << n << "  doubling: " << copies(n, true) << " copies (" << d / n
                  << " per add)   +1: " << copies(n, false) << " copies (" << p / n << " per add)\n";
    }

    std::cout << "\n== singly linked list ==\n";
    SinglyLinkedList<std::string> sll;
    sll.add("ICS 46"); sll.add("ROCKS"); sll.add("!");
    sll.add(1, "?");
    std::cout << sll.toString() << " n=" << sll.size() << '\n';
    std::cout << "remove() -> " << sll.remove() << '\n';
    std::cout << "remove(1) -> " << sll.remove(1) << '\n';
    std::cout << sll.toString() << " n=" << sll.size() << '\n';
    try { sll.get(2); } catch (const std::out_of_range& e) { std::cout << "get(2): out_of_range: " << e.what() << '\n'; }

    SinglyLinkedList<std::string> s2;
    s2.add("ICS46"); s2.add("ROCKS"); s2.add("?"); s2.add("!");
    std::cout << "get(2) on " << s2.toString() << " -> " << s2.get(2) << '\n';
    s2.add("UCI");
    std::cout << "add(\"UCI\"): " << s2.toString() << " n=" << s2.size() << '\n';
    s2.remove();
    s2.add(2, "UCI");
    std::cout << "add(2, \"UCI\"): " << s2.toString() << " n=" << s2.size() << '\n';
    std::cout << "remove(2) -> " << s2.remove(2) << '\n';
    s2.add(4, "end");
    std::cout << "add(4, \"end\"): " << s2.toString() << " n=" << s2.size() << '\n';
    std::cout << "remove(4) -> " << s2.remove(4) << " (the tail), then addLast(\"again\"): ";
    s2.addLast("again");
    std::cout << s2.toString() << '\n';

    std::cout << "\n== doubly linked list ==\n";
    DoublyLinkedList<std::string> dll;
    dll.addLast("ICS 46"); dll.addFirst("ROCKS"); dll.addLast("!");
    std::cout << dll.toString() << " backwards " << dll.toStringBackwards() << " n=" << dll.size() << '\n';
    std::cout << "removeLast() -> " << dll.removeLast() << '\n';
    dll.add(1, "UCI");
    std::cout << dll.toString() << " backwards " << dll.toStringBackwards() << " n=" << dll.size() << '\n';
    std::cout << "get(1) -> " << dll.get(1) << ", remove(1) -> " << dll.remove(1) << '\n';
    std::cout << dll.toString() << " backwards " << dll.toStringBackwards() << " n=" << dll.size() << '\n';

    std::cout << "\n== memory per element ==\n";
    struct SNode { int item; SNode* next; };
    struct DNode { int item; DNode* next; DNode* prev; };
    std::cout << "SLL node " << sizeof(SNode) << " bytes, DLL node " << sizeof(DNode)
              << " bytes, ArrayList slot " << sizeof(int) << " bytes\n";

    std::cout << "\n== stacks ==\n";
    {
        LinkedStack<std::string> st;
        std::istringstream in("To be or not to - be - - that - - - is");
        std::string t;
        std::cout << "popped:";
        while (in >> t) {
            if (t == "-") std::cout << ' ' << st.pop();
            else st.push(t);
        }
        std::cout << "\nleft on stack (top first):";
        while (!st.isEmpty()) std::cout << ' ' << st.pop();
        std::cout << '\n';
    }
    {
        LinkedStack<std::string> st;
        st.push("ICS46"); st.push("ROCKS"); st.push("!");
        std::cout << "peek: " << st.peek() << ", size " << st.size() << "\npop:";
        while (!st.isEmpty()) std::cout << ' ' << st.pop();
        try { st.pop(); } catch (const std::underflow_error& e) { std::cout << "\nerror: " << e.what() << '\n'; }

        ArrayStack<std::string> as;
        as.push("ICS46"); as.push("ROCKS"); as.push("!");
        std::cout << "ArrayStack peek: " << as.peek() << ", pop:";
        while (!as.isEmpty()) std::cout << ' ' << as.pop();
        std::cout << '\n';
    }
    for (size_t n : {1000ul, 8000ul}) {
        Counted::assignments = 0;
        {
            ArrayStack<Counted> st;
            for (size_t i = 0; i < n; ++i) st.push(Counted());
        }
        long long back = Counted::assignments;
        Counted::assignments = 0;
        {
            ArrayList<Counted> list;
            for (size_t i = 0; i < n; ++i) list.add(0, Counted());
        }
        long long front = Counted::assignments;
        std::cout << "n=" << n << "  top-at-back moves=" << back << " (" << static_cast<double>(back) / n
                  << " per push)  top-at-front moves=" << front << " (" << static_cast<double>(front) / n
                  << " per push)\n";
    }

    std::cout << "\n== queues ==\n";
    {
        LinkedQueue<std::string> q;
        std::istringstream in("To be or not to - be - - that - - - is");
        std::string t;
        std::cout << "dequeued:";
        while (in >> t) {
            if (t == "-") std::cout << ' ' << q.dequeue();
            else q.enqueue(t);
        }
        std::cout << "\nleft in queue (" << q.size() << "): front = " << q.front() << '\n';

        ArrayListQueue<std::string> aq;
        aq.enqueue("ICS46"); aq.enqueue("ROCKS"); aq.enqueue("!");
        std::cout << "ArrayListQueue:";
        while (!aq.isEmpty()) std::cout << ' ' << aq.dequeue();
        std::cout << '\n';

        LinkedQueue<std::string> lq;
        lq.enqueue("ICS46"); lq.enqueue("ROCKS"); lq.enqueue("!");
        std::cout << "LinkedQueue:";
        while (!lq.isEmpty()) std::cout << ' ' << lq.dequeue();
        lq.enqueue("again");                   // after draining: head and tail were reset
        std::cout << "  then enqueue -> front = " << lq.front() << '\n';
    }

    std::cout << "\n== circular queue ==\n";
    {
        CircularQueue<int> q(2);               // capacity 2, doubled to 4
        for (int x : {1, 2, 3}) q.enqueue(x);
        std::cout << "enqueue 1 2 3   " << q.layout() << " cap=" << q.capacity() << '\n';
        q.dequeue(); q.dequeue();
        std::cout << "dequeue x2      " << q.layout() << '\n';
        q.enqueue(4); q.enqueue(5);
        std::cout << "enqueue 4 5     " << q.layout() << '\n';

        CircularQueue<char> w(5);              // wrap-around: A B C D - - E F G
        std::string ops = "ABCD--EFG";
        for (char c : ops) {
            if (c == '-') w.dequeue(); else w.enqueue(c);
        }
        std::cout << "capacity 5      " << w.layout() << " cap=" << w.capacity() << '\n';
    }

    std::cout << "\n== deque ==\n";
    {
        Deque<int> d(2);
        d.enqueueBack(1); d.enqueueBack(2); d.enqueueFront(0); d.enqueueFront(-1); d.enqueueBack(3);
        std::cout << "deque size=" << d.size() << " capacity=" << d.capacity() << " :";
        for (size_t i = 0; i < d.size(); ++i) { int x = d.dequeueFront(); std::cout << ' ' << x; d.enqueueBack(x); }
        std::cout << "\nfront=" << d.front() << " back=" << d.back() << '\n';
        std::cout << "dequeued: " << d.dequeueFront() << ' ' << d.dequeueBack();
        while (!d.isEmpty()) std::cout << ' ' << d.dequeueFront();
        std::cout << '\n';
    }

    std::cout << "\n== expressions ==\n";
    std::cout << "infix  ( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) ) = " << evalInfix("( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )") << '\n';
    std::cout << "infix  ( ( 2 + 3 ) * ( 4 * 5 ) ) = " << evalInfix("( ( 2 + 3 ) * ( 4 * 5 ) )") << '\n';
    std::cout << "infix  ( 10 - 4 ) = " << evalInfix("( 10 - 4 )") << '\n';
    for (const char* e : {"52 5 7 + 4 * -", "5 1 2 + 4 * + 3 -", "10 4 -"})
        std::cout << "postfix  " << e << " = " << evalPostfix(e) << '\n';
    std::cout << "5 1 2 + 4 * + 3 - as infix: " << postfixToInfix("5 1 2 + 4 * + 3 -") << '\n';
}
```

### 13.3 Output

```text
== ArrayList trace ==
ArrayList a1;  []  size=0 cap=2
add("ICS46")  [ICS46]  size=1 cap=2
add("Rocks")  [ICS46, Rocks]  size=2 cap=2
add("!")  [ICS46, Rocks, !]  size=3 cap=4
add(1, "Throws")  [ICS46, Throws, Rocks, !]  size=4 cap=4
add(3, "?")  [ICS46, Throws, Rocks, ?, !]  size=5 cap=8
remove() -> !  [ICS46, Throws, Rocks, ?]  size=4 cap=8
remove() -> ?  [ICS46, Throws, Rocks]  size=3 cap=8
remove() -> Rocks  [ICS46, Throws]  size=2 cap=4
get(5): out_of_range: index 5

== growth policy ==
n=17  doubling: 31 copies (2.82353 per add)   +1: 136 copies (9 per add)
n=1000000  doubling: 1048575 copies (2.04858 per add)   +1: 499999500000 copies (500000 per add)

== singly linked list ==
[!, ?, ROCKS, ICS 46] n=4
remove() -> !
remove(1) -> ROCKS
[?, ICS 46] n=2
get(2): out_of_range: index 2
get(2) on [!, ?, ROCKS, ICS46] -> ROCKS
add("UCI"): [UCI, !, ?, ROCKS, ICS46] n=5
add(2, "UCI"): [!, ?, UCI, ROCKS, ICS46] n=5
remove(2) -> UCI
add(4, "end"): [!, ?, ROCKS, ICS46, end] n=5
remove(4) -> end (the tail), then addLast("again"): [!, ?, ROCKS, ICS46, again]

== doubly linked list ==
[ROCKS, ICS 46, !] backwards [!, ICS 46, ROCKS] n=3
removeLast() -> !
[ROCKS, UCI, ICS 46] backwards [ICS 46, UCI, ROCKS] n=3
get(1) -> UCI, remove(1) -> UCI
[ROCKS, ICS 46] backwards [ICS 46, ROCKS] n=2

== memory per element ==
SLL node 16 bytes, DLL node 24 bytes, ArrayList slot 4 bytes

== stacks ==
popped: to be not that or be
left on stack (top first): is To
peek: !, size 3
pop: ! ROCKS ICS46
error: pop from an empty stack
ArrayStack peek: !, pop: ! ROCKS ICS46
n=1000  top-at-back moves=2022 (2.022 per push)  top-at-front moves=501522 (501.522 per push)
n=8000  top-at-back moves=16190 (2.02375 per push)  top-at-front moves=32012190 (4001.52 per push)

== queues ==
dequeued: To be or not to be
left in queue (2): front = that
ArrayListQueue: ICS46 ROCKS !
LinkedQueue: ICS46 ROCKS !  then enqueue -> front = again

== circular queue ==
enqueue 1 2 3   [1 2 3 _] f=0 n=3 cap=4
dequeue x2      [_ _ 3 _] f=2 n=1
enqueue 4 5     [5 _ 3 4] f=2 n=3
capacity 5      [F G C D E] f=2 n=5 cap=5

== deque ==
deque size=5 capacity=8 : -1 0 1 2 3
front=-1 back=3
dequeued: -1 3 0 1 2

== expressions ==
infix  ( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) ) = 101
infix  ( ( 2 + 3 ) * ( 4 * 5 ) ) = 100
infix  ( 10 - 4 ) = 6
postfix  52 5 7 + 4 * - = 4
postfix  5 1 2 + 4 * + 3 - = 14
postfix  10 4 - = 6
5 1 2 + 4 * + 3 - as infix: ((5 + ((1 + 2) * 4)) - 3)
```

## 14. Quick Reference & Top 5 Things to Remember

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

1. Every indexed linked-list operation is O(n) because of the **walk**; the splice itself is O(1). Inserting or removing inside an SLL needs the **previous** node, and index 0 is special because it changes `head`. A DLL's `prev` makes tail removal O(1); an SLL's is O(n) even with a tail pointer.
2. ArrayList `add` / `remove` at the end are **amortized** O(1) (doubling, shrink at ¼ full) but O(n) worst case; at the front or middle they are O(n) from shifting. Growing by a constant is Θ(n) per add.
3. A linked-list stack puts the **top at the head** (push, pop, peek O(1) worst case); the ArrayList stack puts it at the **end** (O(1) amortized, "lumpy"); the wrong end costs O(n).
4. A queue on an SLL needs a **tail** pointer and must **enqueue at the tail, dequeue at the head**; a plain ArrayList queue always has one O(n) operation, so use a circular array (keep a front index and a count, wrap with `%`). The same structure extends to a deque.
5. The **first value popped is the right operand**: compute `v2 op v1` (it matters for `-` and `/`); postfix needs one stack and no parentheses, fully parenthesized infix needs Dijkstra's two stacks. Copy the item out **before** `delete`, and update `n` in every mutator.
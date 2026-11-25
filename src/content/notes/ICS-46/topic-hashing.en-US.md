---
title: "Hash Tables"
summary: "Hash tables: buckets, hash code + compression, collisions, separate chaining (load factor), linear probing (tombstones, primary clustering, probe counts, resizing) and quadratic probing."
topics:
  - hashing
kind: "topic"
order: 508
---

# Information and Computer Science 46 — Topic: Hash Tables

## Table of Contents

- [1. Hash Tables: the Idea](#1-hash-tables-the-idea)
- [2. Hash Functions: Hash Code + Compression](#2-hash-functions-hash-code--compression)
- [3. Collisions](#3-collisions)
- [4. Separate Chaining](#4-separate-chaining)
- [5. Linear Probing](#5-linear-probing)
- [6. Quadratic Probing](#6-quadratic-probing)
- [7. Complete Implementation](#7-complete-implementation)
- [8. Quick Reference & Top 5 Things to Remember](#8-quick-reference--top-5-things-to-remember)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh. This note gathers hash tables from Lectures 14–15, organized by concept.

## 1. Hash Tables: the Idea

A balanced BST gives O(log n) and keeps keys in order (see [Search Trees](topic-search-trees.en-US.md)). A **hash table** aims for **O(1) average** time for search, insert and delete of key-value pairs; the trade-off is that keys are no longer kept in order.

Yeh's analogy: to find a shirt in a pile of laundry you could search the unordered pile (unordered list) or compare clothes and build a tree (BST). What you actually do is **put clothes into drawers**. Information about the item tells you **where to put it** and later **where to look**: a hash table uses a clue from the data itself to decide its location, for every operation.

Structure: a large number of small collections called **buckets** (`[0] … [m-1]`), which together form the hash table, plus a **rule — the hash function** — that maps each item to its bucket (shirt → hash function → 3, the shirts drawer; sweaters 0, jackets 1, pants 2, shirts 3, socks 4). To find something, look only in its bucket.

## 2. Hash Functions: Hash Code + Compression

- **Hash function**: generates an index into the hash table. Goal: **uniform hashing** (minimize collisions).
- **Step 1, hash code**: converts the input key into an integer and spreads the data out evenly.
- **Step 2, compression (modulo)**: maps the hash code to a valid bucket index, `hash_code % num_buckets`.

**First try**: `hash_value = hash(input)` with `hash = len(input)`, e.g. "Prof Yeh" → 8. The problem: 8 isn't a bucket — there are only 5 buckets, so the value has to be squeezed into the range of indices.

**Second try, in two parts**:

1. `hashCode()` maps the input to an integer (the **hash code**);
2. **compression** maps the hash code into the range of buckets: **`hash = hashCode(input) % numBuckets`**.

The same function is used for **both insert and search**. With 5 buckets and `len` as the hash code:

| Input | hashCode = len | % 5 | Bucket |
|---|---|---|---|
| "Prof Yeh" | 8 | 8 % 5 | 3 |
| "Students" | 8 | 8 % 5 | 3 |

> 📘 **Beyond the lecture**: A good hash function is **deterministic** (equal keys → same hash), **fast**, and **spreads keys uniformly** over 0 … m−1. `len` fails the last one badly. For integer keys the usual choice is **modular hashing** `k % m` with **m prime**, so that patterns in the keys don't line up with m. (algs4 §3.4; Thornton's credit-card example shows how biased digits ruin a hash.)

> ⚠️ **Pitfall**: In C++ (as in Java), `%` of a **negative** number is negative, so `hashCode(key) % m` can give an index like −2. Use an unsigned hash (e.g. `std::hash` returns `size_t`) or fix the sign before indexing.

## 3. Collisions

A **collision** happens when multiple elements hash to the same bucket: "Prof Yeh" and "Students" both land in bucket 3 (analogy: finding your assigned seat when someone is already in it). Collisions can't be avoided in general — there are far more possible keys than buckets, and they occur even under the uniform hashing assumption — so a hash table needs a collision-resolution strategy. The basic question is how to let one bucket hold several items, and which structure makes insertion fast: a linked list per bucket. Three approaches:

| Approach | Idea | Technique |
|---|---|---|
| 1 | Allow multiple elements inside each bucket | **Separate chaining** |
| 2 | Overflow to other buckets | **Linear probing** (and quadratic probing) |
| 3 | Kick out the existing data | **Cuckoo hashing** |

Sections 4–6 cover separate chaining, linear probing and quadratic probing.

## 4. Separate Chaining

### 4.1 Structure and Trace

**Structure**: an **array of linked lists** (or an array of arraylists). The hash value indexes the correct bucket directly, and each array element (bucket) stores the **head pointer** of a linked list. With b buckets:

1. **Hash**: map the key to an integer i between 0 and b − 1.
2. **Insert**: add the item to the i-th chain **if it's not already there** — that requires scanning the chain first to check for duplicates (if the key is there, update its value).
3. **Search**: only search the i-th chain.

A trace with b = 5 buckets, where the value is the insertion index and new nodes go at the **front** of their chain:

| Key | S | E | A | R | C | H | E | X | A | M | P | L | E |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Hash | 2 | 0 | 0 | 4 | 4 | 4 | 0 | 2 | 0 | 4 | 3 | 3 | 0 |
| Value | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

The second E (value 6), second A (8) and third E (12) are **updates**, not new nodes. Final table: 0: A,8 → E,12 · 1: empty · 2: X,7 → S,0 · 3: L,11 → P,10 · 4: M,9 → H,5 → C,4 → R,3. Step through it and try your own keys, or switch to probing (← / → keys work when the demo is focused):

```viz hash-table
{"title": "Separate chaining, m = 5", "m": 5, "hashes": "S:2, E:0, A:0, R:4, C:4, H:4, X:2, M:4, P:3, L:3", "ops": "put(S); put(E); put(A); put(R); put(C); put(H); put(E); put(X); put(A); put(M); put(P); put(L); put(E)", "interactive": true}
```

### 4.2 Implementation

The slide code (`hashFunction` isn't shown; it is hash code % m):

```cpp
template <typename Key, typename Value>
class SeparateChaining {
private:
  struct Node {
    Key key;
    Value val;
    Node* next;
  };
  static const int m = 128; // hash table size
  Node* dict[m]; // array of linked lists
public:
  Value get(const Key& key) const {
    int i = hashFunction(key); // compute hash value
    for (Node* x = dict[i]; x != nullptr; x = x->next) {
      if (x->key == key) return x->val; // return when found
    }
    return Value();
  }
  void put(const Key& key, const Value& val) {
    int i = hashFunction(key);
    for (Node* x = dict[i]; x != nullptr; x = x->next) {
      if (x->key == key) { x->val = val; return; }
    }
    dict[i] = new Node{key, val, dict[i]}; // insert at head
  }
};
```

`put` scans the chain first (update if found), then links a new node at the head: its `next` is the old head `dict[i]`, and `dict[i]` now points at it — O(1) after the scan.

> ⚠️ **Pitfall**: Slide bugs (the code as shown on the slides): `dict[m]` is never initialized, so the chains start as garbage pointers instead of `nullptr` — write `Node* dict[m] = {};`. Note the braces in `new Node{key, val, dict[i]}`: `Node` is an aggregate with no constructor, so `new Node(key, val, dict[i])` would not compile in C++17. ([§7](#7-complete-implementation) has the fix, a `remove`, and a destructor.)

Deletion is easy with chaining: find the node in chain i and unlink it, as in a linked list; nothing else moves.

### 4.3 Analysis: Load Factor

**Worst case O(n)**: all values hash to one bucket and you search through that one chain. The **average case depends on the strength of the hash function**. With a strong hash function that spreads n elements evenly over m buckets:

- on average there are **n / m** elements in each bucket;
- the average cost of search and insert is **n / m** — each search probes about m times fewer keys than a sequential search of one list.

**n / m is the load factor**: it tells us how full the hash table is. To make search and insert **O(1)**, choose m proportional to n so that n / m stays a constant (resize the array as n grows). Then the average search and insert time is constant.

- load factor too high (m too small) → slow operations with long chains;
- load factor too low (m too large) → wasted memory, many empty chains.

**Ordered operations** (min, max, the keys in sorted order, range queries) **are not supported** — use a (balanced) BST for those ([Search Trees](topic-search-trees.en-US.md)). Average case for insert, search and delete: O(1); worst case: O(n).

> 📘 **Beyond the lecture**: The load factor means something different in the two families. With chaining, α = n/m is the average chain length and may exceed 1 (10 keys per bucket still works, just slower). With linear or quadratic probing every key needs its own slot, so α is the fraction of the array in use and **must stay below 1**. (algs4 §3.4)

### 4.4 Practice

#### Separate chaining with m = 7

Perform hash table operations using separate chaining based on the following rules and inputs. Show states after task A and after task C.

**System parameters**: implementation strategy separate chaining; hash table size **m = 7**; hash function for integer keys k: **h(k) = k % m**.

**Task A — insert key-value pairs**: insert the following pairs in order and show the resulting dictionary: (47, 0), (3, 1), (28, 2), (14, 3), (9, 4), (47, 5).

**Task B — search operations**: how many compares are required to search for keys 28 and 47?

**Task C — delete operation**: delete key 14.

> Hint: new nodes go at the head of the chain, and 47 appears twice.

<details>
<summary>Solution</summary>

Hashes: 47 % 7 = 5, 3 % 7 = 3, 28 % 7 = 0, 14 % 7 = 0, 9 % 7 = 2.

**After task A** — the second (47, 5) finds 47 in chain 5 and **updates** its value; 14 goes in front of 28:

| Bucket | Chain (head first) |
|---|---|
| 0 | (14, 3) → (28, 2) |
| 1 | — |
| 2 | (9, 4) |
| 3 | (3, 1) |
| 4 | — |
| 5 | (47, 5) |
| 6 | — |

**Task B**: search 28 → chain 0, compare with 14, then 28: **2 compares**. Search 47 → chain 5, compare with 47: **1 compare**.

**After task C**: chain 0 becomes (28, 2); everything else is unchanged. Check it:

```viz hash-table
{"title": "Separate chaining check", "m": 7, "ops": "put(47, 0); put(3, 1); put(28, 2); put(14, 3); put(9, 4); put(47, 5); get(28); get(47); remove(14)"}
```

</details>

## 5. Linear Probing

### 5.1 Insert and Search

**Linear probing** keeps all keys in the array itself — when a bucket is taken, **overflow to the next one** (this family is called *open addressing*):

- **Insert**: to insert x, compute h(x) and try to place x there. If it's full, keep moving through the array by 1 position, **wrapping around the end**, until a free spot is found.
- **Search**: compute h(x) and start looking there. Move around the ring **until the element is found or a blank spot is detected** — a blank spot proves x isn't in the table, because insert would have put it there.
- Use the load factor n/m to prevent the table from filling to capacity.

Picture the table as a ring of m = 16 slots holding z (2), x (7), w (8), r (9) and y (14). **Search for a with h(a) = 8** (before b is inserted): 8 (w), 9 (r), 10 is blank → a is not in the table. **Insert b with h(b) = 7**: slots 7, 8, 9 are full, so b goes to slot 10. The demo assumes h(w) = 7 and h(r) = 8 (only where they ended up is drawn), which is consistent with that picture:

```viz hash-table
{"title": "Linear probing on a ring of 16", "mode": "linear", "m": 16, "hashes": "z:2, x:7, w:7, r:8, y:14, b:7, a:8", "ops": "put(z); put(x); put(w); put(r); put(y); get(a); put(b); remove(w); get(r)", "interactive": true}
```

> 📘 **Beyond the lecture**: Thornton's ICS 46 notes probe **backward** (i − 1, i − 2, …). Either direction works as long as insert, search and delete use the same probe sequence; Yeh's slides and algs4 move forward, (h + i) % m.

### 5.2 Deletion: Tombstones

Deletion is trickier than with chaining. Simply searching for the element and emptying its slot causes a problem: **delete w, then search for r**. r was placed in slot 9 because slot 8 was taken by w; if slot 8 is now blank, the search for r (starting at 8) stops right there and wrongly reports r missing.

The fix: **tombstones** — distinguish *deleted* from *empty*.

- When removing an element, mark that cell as empty **but previously occupied** (a tombstone).
- When searching, **don't stop at a tombstone** — keep going.
- Insert can **replace a tombstone** (reuse the slot).

In the demo above, the last two operations remove w (slot 8 becomes †) and then find r by probing past the tombstone.

> ⚠️ **Pitfall**: A tombstone is not empty for *search* but is free for *insert*. If you stop searching at a tombstone you lose keys; if you never reuse tombstones the table fills up with them (rehashing into a fresh array clears them).

### 5.3 In Practice: Speed and Primary Clustering

Linear probing is **one of the fastest general-purpose hashing strategies**:

- **low memory overhead**: just an array and a hash function (no nodes, no `next` pointers);
- **excellent locality**: a search looks at adjacent locations;
- **great cache performance**: the combination of the two.

Its weakness is **primary clustering**. A **cluster** is a contiguous block of occupied slots. New keys are likely to hash into the **middle of big clusters** (a big cluster is a big target), and each such key is placed at the cluster's end, making it bigger — so the number of collisions grows as a function of the existing collisions.

### 5.4 Time Analysis and Resizing

Under the uniform hashing assumption, with load factor **α = n/m** (n = input size, m = table size), the average number of probes is (Knuth 1963):

- search hits: ½ (1 + 1 / (1 − α))
- search misses and insertions: ½ (1 + 1 / (1 − α)²)

These only make sense for α < 1. At α = ½ and close to 1:

| α | Search hit | Search miss / insert |
|---|---|---|
| 1/2 | 1.5 probes | 2.5 probes |
| 0.9 | 5.5 probes | 50.5 probes |

Near a full table the misses explode. **Typical choice: n/m = ½** — constant work per operation on average. Keep it there by **doubling** the table when n/m ≥ ½ and **halving** it when n/m ≤ ⅛.

What is the cost of changing the hash table size? Every key's slot depends on m (`hash % m`), so a resize must **rehash every key** into the new array — O(n) for that one operation. Because the size doubles or halves (like ArrayList), the cost spreads over the operations that led to it: **amortized O(1)** per operation.

> 📘 **Beyond the lecture**: You can't copy the old array into the bigger one slot by slot — keys would sit at their old `% m` positions and searches with the new m would miss them. Rehashing also throws away all tombstones. (Thornton, Hash Tables)

### 5.5 Practice

#### Linear probing with deletions

m = 13, h(x) = x mod 13. Insert keys 18, 3, 16, 22, 21, 8; delete 16, delete 21; search for 8; insert 20, 7. (Fill in a 13-slot table, indices 0–12.)

> Hint: the deletions leave tombstones, and the search for 8 has to probe past one.

<details>
<summary>Solution</summary>

Inserts: 18 → 5; 3 → 3; 16 → 3 taken → **4**; 22 → 9; 21 → 8; 8 → 8 taken, 9 taken → **10**.

| Slot | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| after inserts | | | | 3 | 16 | 18 | | | 21 | 22 | 8 | | |
| after deletes | | | | 3 | † | 18 | | | † | 22 | 8 | | |
| final | | | | 3 | † | 18 | | 20 | 7 | 22 | 8 | | |

Delete 16 and 21 → tombstones (†) at 4 and 8. **Search 8**: slot 8 is a tombstone (keep going), 9 holds 22, 10 holds 8 → **found after 3 probes**. Without tombstones the search would stop at the empty slot 8 and wrongly miss.

Insert 20 → slot 7 (empty). Insert 7 → slot 7 holds 20; slot 8 is a tombstone, so **7 reuses slot 8**. (A careful insert first checks that 7 isn't further along — 9, 10, then the empty 11 — before using the tombstone; the result is the same.)

```viz hash-table
{"title": "Linear probing check", "mode": "linear", "m": 13, "ops": "put(18); put(3); put(16); put(22); put(21); put(8); remove(16); remove(21); get(8); put(20); put(7)"}
```

</details>

## 6. Quadratic Probing

### 6.1 The Probe Sequence

Modify the probe sequence so that

**h(k, i) = (h(k) + c₁·i + c₂·i²) % m, with c₂ ≠ 0**, where i is the number of collisions so far for this key (i = 0 is the first try).

When c₂ = 0, quadratic probing reduces to linear probing. The jumps grow (1, 4, 9, … past the home slot with c₁ = 0, c₂ = 1), so keys that collide don't all pile onto the same contiguous cluster. Search and delete use the **same probe sequence** and **tombstones**, exactly as in linear probing.

> ⚠️ **Pitfall**: The probe sequence does not necessarily visit every slot. With h(k, i) = (h(k) + i²) % 13 the offsets i² % 13 take only 7 distinct values (0, 1, 3, 4, 9, 10, 12), so an insert can fail while the table still has empty slots — another reason to keep the load factor low.

### 6.2 Practice

#### Quadratic probing with a delete

h(k) = k % m and h(k, i) = (h(k) + i²) % m. Assume m = 13, and key-value pairs to insert: (17,0), (33,1), (18,2), (20,3), (44,4), (11,5), (19,6), (7,7). (17 lands in slot 4.)

After the initial insertions: delete 44; search for 19; insert 5.

Note, the (17,0) value refers to (key, value); i is a variable counting the number of collisions.

> Hint: 19 and 7 each need more than one collision; for 7 the fourth try (i = 3) wraps around.

<details>
<summary>Solution</summary>

| Key | h(k) | Probes (i = 0, 1, 2, …) | Slot |
|---|---|---|---|
| 17 | 4 | 4 | 4 |
| 33 | 7 | 7 | 7 |
| 18 | 5 | 5 | 5 |
| 20 | 7 | 7 ✗, 8 | 8 |
| 44 | 5 | 5 ✗, 6 | 6 |
| 11 | 11 | 11 | 11 |
| 19 | 6 | 6 ✗, 7 ✗, 10 | 10 |
| 7 | 7 | 7 ✗, 8 ✗, 11 ✗, 16 % 13 = 3 | 3 |

After the insertions: 3: (7,7) · 4: (17,0) · 5: (18,2) · 6: (44,4) · 7: (33,1) · 8: (20,3) · 10: (19,6) · 11: (11,5).

- **Delete 44**: probe 5 (18), 6 (44) → slot 6 becomes a **tombstone**.
- **Search 19**: 6 is a tombstone (keep going), 7 (33), 10 (19) → **found after 3 probes**.
- **Insert 5**: h = 5 holds 18; i = 1 → slot 6 is a tombstone → **5 goes into slot 6**.

```viz hash-table
{"title": "Quadratic probing check", "mode": "quadratic", "m": 13, "ops": "put(17, 0); put(33, 1); put(18, 2); put(20, 3); put(44, 4); put(11, 5); put(19, 6); put(7, 7); remove(44); get(19); put(5)"}
```

</details>

## 7. Complete Implementation

`SeparateChaining` follows the slide code with the `dict` fix, a `remove`, and m = 7 to match the separate-chaining practice problem. `LinearProbing` is not from the slides (they give no code): int keys, h(k) = k % 13, tombstones as a `DELETED` state.

```cpp
#include <iostream>
#include <functional>
#include <string>

template <typename Key, typename Value>
class SeparateChaining {
private:
    struct Node {
        Key key;
        Value val;
        Node* next;
    };
    static const int m = 7;          // hash table size (slides: 128)
    Node* dict[m] = {};              // array of linked lists, all nullptr

    int hashFunction(const Key& key) const {
        return std::hash<Key>{}(key) % m;   // hashCode, then compress to 0..m-1
    }
public:
    SeparateChaining() = default;
    SeparateChaining(const SeparateChaining&) = delete;
    SeparateChaining& operator=(const SeparateChaining&) = delete;
    ~SeparateChaining() {
        for (int i = 0; i < m; i++)
            while (dict[i]) { Node* x = dict[i]; dict[i] = x->next; delete x; }
    }

    Value get(const Key& key) const {
        int i = hashFunction(key); // compute hash value
        for (Node* x = dict[i]; x != nullptr; x = x->next) {
            if (x->key == key) return x->val; // return when found
        }
        return Value();
    }

    void put(const Key& key, const Value& val) {
        int i = hashFunction(key);
        for (Node* x = dict[i]; x != nullptr; x = x->next) {
            if (x->key == key) { x->val = val; return; }
        }
        dict[i] = new Node{key, val, dict[i]}; // insert at head
    }

    void remove(const Key& key) {
        int i = hashFunction(key);
        Node** p = &dict[i];                       // the link that may need fixing
        while (*p != nullptr && (*p)->key != key) p = &(*p)->next;
        if (*p != nullptr) { Node* x = *p; *p = x->next; delete x; }
    }

    void print() const {
        for (int i = 0; i < m; i++) {
            std::cout << i << ':';
            for (Node* x = dict[i]; x != nullptr; x = x->next)
                std::cout << " (" << x->key << ',' << x->val << ')';
            std::cout << '\n';
        }
    }
};

// Linear probing with tombstones (int keys, h(k) = k % m).
class LinearProbing {
    static const int m = 13;
    enum State { EMPTY, FULL, DELETED };
    int keys[m];
    int vals[m];
    State state[m] = {};             // all EMPTY

    int hash(int key) const { return key % m; }
public:
    // returns the slot holding key, or -1; counts probes
    int find(int key, int& probes) const {
        int h = hash(key);
        probes = 0;
        for (int i = 0; i < m; i++) {
            int s = (h + i) % m;           // quadratic: (h + i * i) % m
            probes++;
            if (state[s] == EMPTY) return -1;            // blank spot: stop
            if (state[s] == FULL && keys[s] == key) return s;
            // DELETED (tombstone) or another key: keep going
        }
        return -1;
    }
    void put(int key, int val) {
        int h = hash(key), firstFree = -1;
        for (int i = 0; i < m; i++) {
            int s = (h + i) % m;
            if (state[s] == FULL && keys[s] == key) { vals[s] = val; return; }
            if (state[s] != FULL && firstFree < 0) firstFree = s;   // tombstone or empty
            if (state[s] == EMPTY) break;
        }
        if (firstFree < 0) return;        // table full (resize long before this)
        keys[firstFree] = key; vals[firstFree] = val; state[firstFree] = FULL;
    }
    void remove(int key) {
        int probes;
        int s = find(key, probes);
        if (s >= 0) state[s] = DELETED;   // tombstone, not EMPTY
    }
    void print() const {
        for (int s = 0; s < m; s++)
            std::cout << (state[s] == FULL ? std::to_string(keys[s]) : state[s] == DELETED ? "X" : ".") << ' ';
        std::cout << '\n';
    }
};

int main() {
    SeparateChaining<int, int> t;
    int pairs[][2] = {{47,0},{3,1},{28,2},{14,3},{9,4},{47,5}};
    for (auto& p : pairs) t.put(p[0], p[1]);
    t.print();
    std::cout << "get(28) = " << t.get(28) << ", get(47) = " << t.get(47) << '\n';
    t.remove(14);
    std::cout << "after remove(14):\n"; t.print();

    LinearProbing lp;
    for (int k : {18, 3, 16, 22, 21, 8}) lp.put(k, 0);
    lp.print();
    lp.remove(16); lp.remove(21);
    lp.print();
    int probes; int s = lp.find(8, probes);
    std::cout << "find(8): slot " << s << ", " << probes << " probes\n";
    lp.put(20, 0); lp.put(7, 0);
    lp.print();
}
```

Output (`X` = tombstone, `.` = empty):

```text
0: (14,3) (28,2)
1:
2: (9,4)
3: (3,1)
4:
5: (47,5)
6:
get(28) = 2, get(47) = 5
after remove(14):
0: (28,2)
1:
2: (9,4)
3: (3,1)
4:
5: (47,5)
6:
. . . 3 16 18 . . 21 22 8 . . 
. . . 3 X 18 . . X 22 8 . . 
find(8): slot 10, 3 probes
. . . 3 X 18 . 20 7 22 8 . . 
```

## 8. Quick Reference & Top 5 Things to Remember

| | Separate chaining | Linear probing | Quadratic probing |
|---|---|---|---|
| Storage | array of m linked lists | one array, keys in the slots | one array |
| Collision | add to the chain (at the head) | try (h + i) % m | try (h + i²) % m |
| Search stops at | end of chain i | the key or an **empty** slot | the key or an empty slot |
| Delete | unlink the node | tombstone | tombstone |
| Load factor α = n/m | average chain length, may be > 1 | must be < 1; keep ≈ ½ | must be < 1 |
| Average / worst | O(1) / O(n) | O(1) / O(n) | O(1) / O(n) |

**Top 5 things to remember**

1. Separate chaining: `i = hash(key) % m`, scan chain i (update if the key is there), otherwise insert a new node at the head; search only chain i.
2. Average cost is proportional to the load factor n/m; keep it constant by growing m with n (double at ½, halve at ⅛ for probing), and a resize means rehashing every key — O(n) once, amortized O(1).
3. Linear probing search stops only at the key or an empty slot, so deletion must leave a tombstone; search skips tombstones, insert may reuse them.
4. Linear probing is fast in practice (memory, locality, cache) but suffers primary clustering; probes ≈ ½(1 + 1/(1−α)) for hits and ½(1 + 1/(1−α)²) for misses, so keep α ≈ ½.
5. Quadratic probing uses (h(k) + c₁i + c₂i²) % m with c₂ ≠ 0 (c₂ = 0 is linear); hash tables give O(1) average but O(n) worst case and no ordered operations.

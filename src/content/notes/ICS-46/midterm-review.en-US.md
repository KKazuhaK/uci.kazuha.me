---
title: "Midterm Review"
summary: "Midterm review for Lectures 0–12: exam scope and strategy, Big-O and loop counting, ArrayList and amortized analysis, linked lists, stacks/queues/deques built from each other, the four comparison sorts, trees and traversals, heaps and priority queues, binary search trees, the Lec 0–2 C++ topics, and the sample midterm, quizzes, homework and labs solved with likely variants."
---

# Information and Computer Science 46 — Midterm Review

## Table of Contents

- [1. Scope and Format](#1-scope-and-format)
- [2. How to Take This Exam](#2-how-to-take-this-exam)
- [3. Big-O and Order of Growth (Sample Q1)](#3-big-o-and-order-of-growth-sample-q1)
- [4. Counting Loops and Recursion (Sample Q2)](#4-counting-loops-and-recursion-sample-q2)
- [5. ArrayList and Amortized Analysis](#5-arraylist-and-amortized-analysis)
- [6. Linked Lists (Sample Q3)](#6-linked-lists-sample-q3)
- [7. Stacks, Queues and Deques (Sample Q4)](#7-stacks-queues-and-deques-sample-q4)
- [8. Comparison Sorting (Sample Q5)](#8-comparison-sorting-sample-q5)
- [9. Trees, Binary Trees and Traversals](#9-trees-binary-trees-and-traversals)
- [10. Heaps and Priority Queues](#10-heaps-and-priority-queues)
- [11. Binary Search Trees](#11-binary-search-trees)
- [12. Heap Sort (Not on the Midterm)](#12-heap-sort-not-on-the-midterm)
- [13. Templates, Pointers, Smart Pointers, 2D Arrays](#13-templates-pointers-smart-pointers-2d-arrays)
- [14. The Design Question](#14-the-design-question)
- [15. Lab Code to Know by Heart](#15-lab-code-to-know-by-heart)
- [16. Quick Reference and Last-Night Checklist](#16-quick-reference-and-last-night-checklist)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh, Fall 2026. Midterm: Thursday 11/12/26, in lecture.
> Built from the sample midterm, Quizzes 2–4, HW 1/2/3/5, Labs 1–4, the "Midterm Topics & Prep" slide of Lecture 12, and the in-class review in Lecture 14 (11/10). Each topic links back to its lecture notes for the full explanation; this page is the exam layer on top.
> Every piece of code here was compiled with `g++ -std=c++17 -Wall -Wextra -fsanitize=address,undefined` and run; printed results are real output.

---

## 1. Scope and Format

The topic list (Lecture 12, slide 3), plus the trees Prof. Yeh added later:

| Midterm topic | Where it was taught |
|---|---|
| Templates, randomness, pointers, references, smart pointers, multidimensional data | [Lec 0](lec-00.en-US.md), [Lec 1](lec-01.en-US.md), [Lec 2](lec-02.en-US.md) |
| Analysis of algorithms, ArrayList, Linked List, Circular Array | [Lec 2](lec-02.en-US.md), [Lec 3](lec-03.en-US.md), [Lec 4](lec-04.en-US.md), [Lec 7](lec-07.en-US.md) |
| Stacks, Queues, Deques | [Lec 4](lec-04.en-US.md), [Lec 5](lec-05.en-US.md), [Lec 7](lec-07.en-US.md) |
| Amortized analysis, analysis of recursion | [Lec 3](lec-03.en-US.md), [Lec 6](lec-06.en-US.md) |
| Comparison-based sorting (selection, insertion, merge, quick) | [Lec 7](lec-07.en-US.md), [Lec 8](lec-08.en-US.md), [Lec 9](lec-09.en-US.md) |
| Trees, binary trees, traversals; heaps and priority queues; binary search trees | [Lec 10](lec-10.en-US.md), [Lec 11](lec-11.en-US.md), Lec 12 ([§9](#9-trees-binary-trees-and-traversals)–[§11](#11-binary-search-trees)) |

Study materials named on the same slide: the sample midterm, quizzes, lecture activities, homeworks and labs — and **"Lab implementations will be covered."**

- **Trees are in.** The slide's list stops at sorting, but Prof. Yeh has since said trees will be on the midterm: tree terminology and traversals, heaps and priority queues (including bottom-up heap construction), and BSTs ([§9](#9-trees-binary-trees-and-traversals)–[§11](#11-binary-search-trees)). The sample has no tree question, so those sections are built from the Lecture 10–12 activities.
- **Heap sort is out** (confirmed by Prof. Yeh, matching the sample's "ignore Heapsort"). Its notes stay on this page, folded away ([§12](#12-heap-sort-not-on-the-midterm)), for the final.
- **Format** (as announced in lecture): free response on paper, closed book, C++ written by hand (the quizzes allowed no cheat sheet; assume the same unless told otherwise).
  - **No multiple choice.** Mostly fill-in-the-blank, explanation and coding; **partial credit** is given.
  - **5 main questions, each multi-part, about 10 points each**, ordered by topic — the same shape as the sample (Big-O, loop counting, a linked-list method, a structure built from another structure, sorting).
  - **One coding problem, one code-review problem ([§2.7](#27-the-code-review-question)), and many conceptual questions.** Expect to analyze functions: runtime, efficiency and edge cases.
  - **Runtime** of recursive code may be classified with the **Master theorem or a recursion-tree diagram** — either is accepted ([§4.3](#43-recurrences-that-could-replace-mystery4)).
  - **Extra-credit problems** are deliberately long and difficult: leave them until the main questions are done.
- **Reviewed in class.** The Lecture 14 review (11/10) walked through exactly two sample questions: Q3, `removeLast` on a circular SLL ([§6.2](#62-sample-q3-solved-removelast-on-a-circular-sll-with-only-tail)), and Q4, a stack from one queue ([§7.2](#72-sample-q4-solved-a-stack-with-one-queue)). Know both, and their variants, cold.
- **The full sample questions are on this page**, each at the top of its solution section (§3.1, §4.1, §6.2, §7.2, §8.3–8.4), with the wording unchanged.
- **The sample is the blueprint.** Expect the same five questions with details changed — a different method (`removeFirst` instead of `removeLast`), a different pointer (head instead of tail), a different input (reverse-sorted instead of sorted). Each section below solves the sample question and then the variants most likely to replace it.

---

## 2. How to Take This Exam

### 2.1 Write down your assumptions

Questions sometimes leave a detail open (duplicates allowed? empty list? may I add a member variable?). Don't guess silently — write one line and answer under it:

> *Assumption: the list may be empty; `removeLast()` on an empty list throws `std::underflow_error`.*

A stated, reasonable assumption turns "ambiguous" into "answered". It also protects you when the grader's rubric expects a specific case: you have shown you saw it.

### 2.2 Find the changed detail before you write

Read each question twice and underline the one thing that differs from the version you practiced: head vs tail pointer, front vs rear, worst vs amortized, one queue vs two, sorted vs reverse-sorted input. Most lost points on a modified question come from answering the original.

The sample itself has rough edges, so don't let them throw you: Q3 names the class `CircularLinkedList<Item>` but the header says `SinglyLinkedList<T>::removeLast()`, declares `Node tail;` (Java style) where C++ needs `Node* tail;`, and Q2 says "five mystery methods" but shows four. Q4 has `Public:`, `boolean` and `Stack() = default:`. Write correct C++ and, if something matters, note how you read it.

### 2.3 Every complexity answer gets a "because"

Write the bound **and** the reason in one line, and name the case:

- ❌ "O(n)"
- ✅ "O(n) worst case: to remove the last node we must find its predecessor, which takes a walk of n − 1 nodes from the front."

Written reasoning is what earns partial credit when the bound is off, and it is all the grader can see.

### 2.4 Hand-written C++ is graded as C++

- Pointers: `Node* p`, `p->next`, `nullptr` (not `null`, not `p.next`).
- Out-of-class member definitions: `template <typename T>` then `T CircularLinkedList<T>::removeLast() { … }`.
- Free what you unlink (`delete old;`), and copy the item out **before** `delete`.
- Return something on every path; throw on an empty structure (`throw std::underflow_error("...");`).

### 2.5 The special-case checklist

Before you write any linked-structure or array method, go down this list and handle (or rule out) each one:

| Case | Typical fix |
|---|---|
| empty | throw, or set both ends on the first insert |
| exactly one element | after removal, **both** head and tail become `nullptr` |
| operation at the first / last position | update `head` / `tail` |
| full array | resize (double), copy in **logical** order |
| wrap-around | `(i + 1) % cap`, `(i - 1 + cap) % cap` |

### 2.6 Time

- The paper is long. Do the question types you have drilled first (Big-O table, loop counts, sort table), then the code.
- Skip the extra-credit problems on the first pass; come back to them only when every main question has an answer.
- Expect one harder design-style question ([§14](#14-the-design-question)). Budget for it, and if you are stuck write the idea, the invariant and the complexity you are aiming for — that alone is worth points.
- Listen for corrections announced during the exam.
- Recent material shows up: make sure trees, heaps and BSTs ([§9](#9-trees-binary-trees-and-traversals)–[§11](#11-binary-search-trees)) are solid, not just the early lectures.

Prof. Yeh's own prep advice (Ed): be able to do **every lecture activity and homework question and their variations**, and review the labs; the assessments test depth of understanding.

### 2.7 The code-review question

You are given code (usually a method of a structure from the course) and asked what is wrong with it or how good it is. Go down the same list every time and write one line per finding — what breaks, on which input, and the fix:

| Check | What to look for |
|---|---|
| Correctness | wrong loop bound (off by one), wrong order of pointer updates, shifting in the wrong direction, `%` on a negative number |
| Edge cases | empty structure, one element, operation at the front / back, full array, wrap-around ([§2.5](#25-the-special-case-checklist)) |
| Memory | `delete` missing (leak), using a node after `delete` (dangling), reading the item after freeing it |
| Runtime and efficiency | an O(n) call inside a loop (O(n²) overall), a resize by a constant amount, work redone on every call |
| Contract | does it keep the invariant (BST order, heap order, `count`, `tail`)? does it return the right value? |

Practice: each snippet has at least one bug.

**(a)** ArrayList `add(index, item)`:

```cpp
for (size_t i = index; i < n_; ++i)
    data_[i + 1] = data_[i];
data_[index] = item;
++n_;
```

<details>
<summary>Solution</summary>

It shifts from the front, so `data_[index]` is copied into every later slot and all the other items are overwritten. Shift from the end: `for (size_t i = n_; i > index; --i) data_[i] = data_[i - 1];`. It also never checks `n_ == capacity_` before writing `data_[n_]` (call `expand()` first) or `index <= n_`.

</details>

**(b)** `removeLast` on an SLL with `head` and `tail`:

```cpp
T removeLast() {
    Node* p = head;
    while (p->next != tail) p = p->next;
    T item = tail->item;
    delete tail;
    tail = p;
    return item;
}
```

<details>
<summary>Solution</summary>

Three bugs. (1) Empty list: `p` is `nullptr`, so `p->next` crashes — throw first. (2) One node: `head == tail`, the loop runs off the end (`p->next` is `nullptr`, never `tail`) — set both `head` and `tail` to `nullptr` instead. (3) The new tail still points at the deleted node: add `p->next = nullptr;`. It is also O(n) by design; only a DLL makes it O(1).

</details>

**(c)** Two-stack queue `dequeue`:

```cpp
T dequeue() {
    while (!stackIn.isEmpty())
        stackOut.push(stackIn.pop());
    return stackOut.pop();
}
```

<details>
<summary>Solution</summary>

It transfers even when `stackOut` still holds items, so newer items land on top of older ones and FIFO order breaks (enqueue 1, 2; dequeue → 1; enqueue 3; dequeue → 3, but should be 2). Transfer only `if (stackOut.isEmpty())`, and throw when both stacks are empty.

</details>

**(d)** Deque on a circular array, push at the front (`front`, `count` and `capacity` are `int`):

```cpp
void pushFront(const T& x) {
    front = (front - 1) % capacity;
    data[front] = x;
    count++;
}
```

<details>
<summary>Solution</summary>

When `front` is 0, `(0 - 1) % capacity` is −1 in C++ (`%` keeps the sign), so it writes `data[-1]`. Use `(front - 1 + capacity) % capacity`. It also never checks `count == capacity` (resize first, unrolling from `front`).

</details>

**(e)** BST insert:

```cpp
void put(Node* x, const Key& key, const Value& val) {
    if (x == nullptr) { x = new Node(key, val, 1); return; }
    if (key < x->key) put(x->left, key, val);
    else if (key > x->key) put(x->right, key, val);
    else x->val = val;
}
```

<details>
<summary>Solution</summary>

`x` is a copy of the pointer, so the new node is assigned to a local variable and never linked into the tree (and leaks). Either return the subtree root and reassign — `x->left = put(x->left, key, val);` as in the slide code ([§11](#11-binary-search-trees)) — or take `Node*& x`. The `size` fields are also never updated.

</details>

**(f)** Summing a linked list (efficiency):

```cpp
int sum = 0;
for (size_t i = 0; i < list.size(); i++)
    sum += list.get(i);
```

<details>
<summary>Solution</summary>

Correct, but `get(i)` on a linked list walks i nodes, so the loop costs 0 + 1 + ⋯ + (n − 1) = O(n²). Walk the nodes once (`for (Node* p = head; p != nullptr; p = p->next) sum += p->item;`, or an iterator) for O(n). On an ArrayList the same loop is O(n).

</details>

---

## 3. Big-O and Order of Growth (Sample Q1)

**Rules.** Keep the fastest-growing term, drop its constant coefficient; a constant (even 2¹²) is O(1); bases of logs don't matter (log₂ n and log₁₀ n differ by a constant), but bases of exponentials do (3ⁿ is not O(2ⁿ)). O = upper bound, Ω = lower bound, Θ = both ([Lec 3](lec-03.en-US.md#2-asymptotic-analysis-big-o-big-ω-big-θ)).

**Ladder** (memorize it): 1 < log n < √n < n < n log n < n² < n³ < 2ⁿ < n! < nⁿ.

### 3.1 Sample Q1 solved

**The question** (sample midterm Q1, 10 pts):

*a.* For each function f(n) in the table below, please write down O(f(n)) in the simplest possible form. For example, if f(n) was 2n, then O(f(n)) would be written as n (or O(n), if you like).

| Function | Big-O |
|---|---|
| 2ⁿ | |
| n²/2 + 1000 n log n | |
| 50 n log n + n! | |
| 30n | |
| 3 n log n + 1000n | |
| n³ + 50n² + 1000 | |
| 2 log n + 47 | |
| 2¹² | |

*b.* Please order *the answers* given in part a so that they are in increasing order of rate of growth. I.e., write the slowest growing function on the left and the fastest growing on the right with the others between in order of growth for large values of n.

**Worked through:**

| f(n) | Big-O |
|---|---|
| 2ⁿ | O(2ⁿ) |
| n²/2 + 1000 n log n | O(n²) |
| 50 n log n + n! | O(n!) |
| 30n | O(n) |
| 3 n log n + 1000n | O(n log n) |
| n³ + 50n² + 1000 | O(n³) |
| 2 log n + 47 | O(log n) |
| 2¹² | O(1) |

**(b) Increasing order:** 2¹² → 2 log n + 47 → 30n → 3n log n + 1000n → n²/2 + 1000 n log n → n³ + 50n² + 1000 → 2ⁿ → 50 n log n + n!, i.e. 1 < log n < n < n log n < n² < n³ < 2ⁿ < n!.

> ⚠️ **Pitfall**: in part (b) order the *answers* (the Big-O classes), not the raw functions — and don't let large constants (1000n) push a term up the ladder.

### 3.2 Variants

| f(n) | Answer | Why |
|---|---|---|
| log(n²) | O(log n) | = 2 log n |
| (log n)² | O((log n)²) | grows faster than log n, slower than n |
| n log n + n^1.5 | O(n^1.5) | n^1.5 / (n log n) = √n / log n → ∞ |
| 2ⁿ⁺¹ | O(2ⁿ) | = 2 · 2ⁿ |
| 2²ⁿ | O(4ⁿ) | = (2²)ⁿ — **not** O(2ⁿ) |
| n + n/2 + n/4 + … + 1 | O(n) | geometric, ≤ 2n (Quiz 2) |
| 1 + 2 + … + n | O(n²) | n(n+1)/2 |
| 1 + ½ + ⅓ + … + 1/n | O(log n) | harmonic series |
| 2ⁿ + n¹⁰ + n log n | O(2ⁿ) | Quiz 2 |
| nlogn + n² + 2¹⁰⁰⁰ | O(n²) | Quiz 2: the constant is still O(1) |

**HW 2 — what happens when n doubles?** T(2n)/T(n) is the fingerprint of the class:

| Class | n → 2n multiplies time by |
|---|---|
| O(1) | 1 |
| O(log n) | adds a constant (log 2n = log n + 1) |
| O(n) | 2 |
| O(n log n) | slightly more than 2 |
| O(n²) | 4 |
| O(n³) | 8 |
| O(2ⁿ) | squares it (2²ⁿ = (2ⁿ)²) |

Empirically ([Lec 2](lec-02.en-US.md#53-the-doubling-hypothesis)): ratio ≈ 2ᵇ, so b = log₂(ratio); e.g. 1.0 s → 8.1 s means b ≈ 3.

---

## 4. Counting Loops and Recursion (Sample Q2)

**Method.** For a loop, count the iterations from the loop variable's start, step and stop. For nested loops, add up the inner count for each outer value (it may depend on the outer variable). For recursion, write T(n) = (recursive calls) + (work outside them) and solve ([Lec 6](lec-06.en-US.md)).

### 4.1 Sample Q2 solved

**The question** (sample midterm Q2, 10 pts):

For each of the following five mystery methods, calculate the number of invocations of `method()` as a function of n. Use Big-O notation to simplify your answer. For your convenience, here are some useful approximations you might need to use: 1 + 1/2 + 1/3 + 1/4 + ⋯ + 1/n ~ O(log n); 1 + 2 + 3 + ⋯ + n ~ O(n²).

```cpp
void mystery1(int n) {
    for (int i=0; i < 2*n; i++) {
        method();
    }
}

void mystery2(int n) {
    for (int i=1; i < n; i = i*2) {
        method();
    }
}

void mystery3(int n) {
    int i = 1;
    while (i < n*n) {
        method();
        i++;
    }
}

void mystery4(int n) {
    if (n == 0)
        Return 1;
    else
        Return n * mystery4(n-1);
}
```

(As in the original: it says "five" but shows four, and `mystery4` is declared `void` yet returns a value.)

**Worked through:**

| Method | Exact number of `method()` calls | Big-O | Measured (n = 1000) |
|---|---|---|---|
| `mystery1`: `i = 0; i < 2*n; i++` | 2n | O(n) | 2000 |
| `mystery2`: `i = 1; i < n; i = i*2` | ⌈log₂ n⌉ (i = 1, 2, 4, …, < n) | O(log n) | 10 |
| `mystery3`: `i = 1; while (i < n*n) i++` | n² − 1 | O(n²) | 999,999 |
| `mystery4`: recursive `n * mystery4(n-1)` | no `method()` call; it makes n + 1 calls to itself | O(n) | 21 calls for n = 20 |

For `mystery4`: T(n) = T(n − 1) + c, T(0) = c, so T(n) = c(n + 1) = O(n). It also uses O(n) **stack space** (n + 1 frames alive at the deepest point).

> 💡 **Key Insight**: "`i = i * 2`" means log₂ n, "`i < n * n`" means n², and a recursive function with no loop is not O(1) — count the calls.

### 4.2 Loop patterns that could replace them

Counts measured for n = 1024:

| Code | Count | Big-O |
|---|---|---|
| `for (i = 1; i < n; i *= 3)` | log₃ n (7) | O(log n) |
| `for (i = n; i > 1; i /= 2)` | log₂ n | O(log n) |
| `for (i = 1; i < n; i += 10)` (Lab 2) | n/10 (103) | O(n) |
| `for (i = 1; i * i < n; i++)` | √n (31) | O(√n) |
| `for (i = 0; i < n; i++) for (j = 0; j < i; j++)` | n(n−1)/2 (523,776) | O(n²) |
| `for (i = 0; i < n; i++) for (k = n; k > 1; k /= 2)` | n log₂ n (10,240) | O(n log n) |
| `for (i = 1; i < n; i *= 2) for (j = 0; j < i; j++)` | 1 + 2 + 4 + … < 2n (1023) | **O(n)** |
| `for (i = 0; i < 10000; i++) for (k = 1; k < n; k *= 2)` (Quiz 2) | 10000 · log₂ n | O(log n) |

> ⚠️ **Pitfall**: the doubling outer loop with an inner loop up to `i` looks like n log n, but the inner counts are 1, 2, 4, …, a geometric series bounded by 2n. And a loop with a constant bound (10000) is a constant factor, not an n.

### 4.3 Recurrences that could replace `mystery4`

| Recurrence | Example | Solution |
|---|---|---|
| T(n) = T(n−1) + c | factorial, sum of a list | O(n) |
| T(n) = T(n−1) + n | recursive selection sort | O(n²) |
| T(n) = 2T(n−1) + c | `f(n-1) + f(n-1)` (naive Fibonacci-like) | O(2ⁿ) (1, 3, 7, 15, … = 2ⁿ⁺¹ − 1) |
| T(n) = T(n/2) + c | binary search | O(log n) |
| T(n) = 2T(n/2) + c | visit both halves, O(1) work | O(n) |
| T(n) = 2T(n/2) + n | merge sort | O(n log n) |
| T(n) = T(n/2) + n | halve and scan | O(n) |

**Master theorem** for T(n) = aT(n/b) + O(nᵈ): compare a with bᵈ — equal → O(nᵈ log n); a < bᵈ → O(nᵈ); a > bᵈ → O(n^(log_b a)). It does **not** apply to T(n − 1) recurrences; draw the recursion tree for those ([Lec 6](lec-06.en-US.md#7-method-b-the-master-theorem)).

**Recursion tree** (accepted on the exam instead of the Master theorem): draw one node per call with the work done *outside* the recursive calls, add up each level, then add the levels.

| Recurrence | Level k | Number of levels | Total |
|---|---|---|---|
| 2T(n/2) + n (merge sort) | 2ᵏ calls × n/2ᵏ = n | log₂ n | n log n |
| T(n/2) + n | 1 call × n/2ᵏ | log₂ n | n + n/2 + ⋯ ≤ 2n = O(n) |
| 2T(n/2) + 1 | 2ᵏ calls × 1 | log₂ n | 1 + 2 + ⋯ + n ≈ 2n = O(n) |
| T(n − 1) + n | 1 call × (n − k) | n | n + (n − 1) + ⋯ + 1 = O(n²) |
| 2T(n − 1) + 1 | 2ᵏ calls × 1 | n | 1 + 2 + ⋯ + 2ⁿ⁻¹ = 2ⁿ − 1 = O(2ⁿ) |

Write the per-level sum and the number of levels in your answer — that is the reasoning partial credit is given for.

---

## 5. ArrayList and Amortized Analysis

**Three components** (HW 2): a pointer to a heap array (`T* data`), the **size** n (items stored), the **capacity** (slots allocated). Access `data[i]`, O(1), after checking `i < n`.

**Adding when size == capacity** (HW 2, e.g. size 8, capacity 8): allocate a new array of capacity 16, copy the 8 items, `delete[]` the old array, point `data` at the new one, set capacity = 16, then store the item at index 8 and make size 9. That `add` costs O(n); the next 7 cost O(1) each.

### 5.1 Costs (Quiz 2 asked best and worst)

| Operation | Best | Worst | Amortized |
|---|---|---|---|
| `get(i)` / `set(i, x)` | O(1) | O(1) | — |
| `add(x)` at the end | O(1) | O(n) (resize) | **O(1)** with doubling |
| `remove()` from the end | O(1) | O(n) (shrink) | **O(1)** |
| `add(0, x)` at the front | O(n) | O(n) | O(n) — always shifts all n |
| `add(i, x)` / `remove(i)` | O(1) at the end | O(n) | — |

> ⚠️ **Pitfall**: "remove from rear" has best O(1) and worst O(n) only because of shrinking; "add to front" is O(n) whenever the list is non-empty — every item shifts (Quiz 2's key also accepts O(1) as the best case, for an empty list).

### 5.2 Amortized cost of a resize policy (Quiz 2)

The rule: **grow or shrink by a constant factor** → each resize's O(n) copy is paid for by the Θ(n) cheap operations before it → amortized O(1). **Grow or shrink by a constant amount** → a copy every k operations → total 1 + (k+1) + (2k+1) + … = Θ(n²) for n adds → amortized **O(n)**.

| Policy | Amortized per op |
|---|---|
| capacity × 2 when full | O(1) |
| capacity × 3 when full | O(1) |
| capacity + 1 when full ([Lec 3](lec-03.en-US.md#73-doubling-vs-growing-by-1-slides-4044)) | O(n) |
| capacity + 3 (or + 1000) when full | O(n) |
| halve when ¼ full | O(1) |
| shrink by 100 when ¼ full | O(n) |

> 💡 **Key Insight**: shrink at **¼** full, not ½. Halving at ½ full lets an add/remove pair at the boundary resize every time (thrashing, O(n) each).

The Lab 2 code you must be able to write (`add(index)`, `remove(index)`, `expand`, `shrink`) is the [Lecture 3 complete implementation](lec-03.en-US.md#8-complete-implementation). The two loops to get right:

```cpp
for (size_t i = n_; i > index; --i) data_[i] = data_[i - 1];      // add: shift right, from the end
for (size_t i = index; i + 1 < n_; ++i) data_[i] = data_[i + 1];  // remove: shift left, from index
```

> ⚠️ **Pitfall**: shifting right must start from the **end** (otherwise you overwrite the items you still need), and with `size_t` a loop like `for (i = n - 1; i >= index; --i)` never ends when `index` is 0.

---

## 6. Linked Lists (Sample Q3)

### 6.1 Cost table — the most-asked fact on the quizzes

| Operation | SLL (head) | SLL (head + tail) | DLL (head + tail) | Circular SLL (tail only) |
|---|---|---|---|---|
| add first | O(1) | O(1) | O(1) | O(1) |
| add last | O(n) | O(1) | O(1) | O(1) |
| remove first | O(1) | O(1) | O(1) | O(1) |
| remove last | O(n) | **O(n)** | O(1) | **O(n)** |
| get(i) / add(i) / remove(i) | O(n) | O(n) | O(n) (from the nearer end) | O(n) |

> 💡 **Key Insight**: a tail pointer lets you **add** after the last node in O(1), never **remove** it in O(1) in a singly linked list: removing needs the predecessor, and only a `prev` pointer (DLL) finds it without a walk.

### 6.2 Sample Q3 solved: `removeLast` on a circular SLL with only `tail`

**The question** (sample midterm Q3, 10 pts):

A circular singly-linked list holding elements of type `T` has instance variables `Node tail;` and `int count;`. A circular singly-linked list is represented as in the picture below, where `tail` would refer to the last node in the list, and the `next` field of the last node refers to the first element.

```text
                             tail
                              │
                              ▼
  ┌────┬───┐   ┌────┬───┐   ┌────┬───┐
┌▶│ 12 │ ●─┼──▶│ 99 │ ●─┼──▶│ 37 │ ● │
│ └────┴───┘   └────┴───┘   └────┴─┼─┘
└──────────────────────────────────┘
```

In this problem, you will implement a method in the `CircularLinkedList<Item>` class to delete and return the Item of the last (right-most) node in the list. In the example, 37 would be returned. The header of the method is below:

```cpp
// post: The last elt has been deleted from the list.
// The rest of the list is unchanged
// @returns value held in removed node before deletion
Template <typename T>
T SinglyLinkedList<T>::removeLast() {
```

*a.* What special case(s) must you consider when writing this method?

*b.* Please write the C++ code for this method (including special cases). Recall that a `Node` holds an `T item` and a `Node* next` to a `Node`.

*c.* What is the big-O complexity of your method above and what would it be if we only have the head pointer to the beginning of the list. I.e., we had a head pointer instead of a tail pointer.

**Worked through:**

The list `12 → 99 → 37 → (back to 12)`, `tail` on 37; `tail->next` is the first node.

**(a) Special cases.**
1. **Empty list** (`tail == nullptr`): nothing to remove — throw.
2. **One node** (`tail->next == tail`): after removing it the list is empty, so `tail = nullptr`.
3. **General case**: walk from the first node to the node whose `next` is `tail` (the predecessor), then two pointer updates: `prev->next = tail->next;` and `tail = prev;`.

**(b) Code.**

```cpp
// Assumption: Node is { T item; Node* next; }, members Node* tail; int count;
template <typename T>
T CircularLinkedList<T>::removeLast() {
    if (tail == nullptr)
        throw std::underflow_error("removeLast on empty list");
    Node* old = tail;
    T item = old->item;
    if (tail->next == tail) {               // only one node
        tail = nullptr;
    } else {
        Node* prev = tail->next;            // start at the first node
        while (prev->next != tail)
            prev = prev->next;
        prev->next = tail->next;            // predecessor now points to the first node
        tail = prev;
    }
    delete old;
    count--;
    return item;
}
```

Test run (12, 99, 37 added with `addLast`):

```text
12 99 37 (count 3)
removeLast -> 37  12 99 (count 2)
```

**(c) Complexity.** **O(n)**: the walk to the predecessor visits n − 1 nodes. With a **head** pointer instead of tail it is still **O(n)**: you walk to the last node's predecessor the same way (and with only `head` you must also walk to find the last node itself). Only adding a `prev` pointer to every node makes it O(1) (Quiz 2's answer).

> ⚠️ **Pitfall**: in a circular list there is no `nullptr` to stop at. A loop written `while (p->next != nullptr)` never ends — stop at `tail` instead.

### 6.3 Variants on the same list

All in the [compiled code](#152-the-code-bank-compiled); with `tail` only:

```cpp
void addLast(const T& item) {                    // O(1)
    Node* node = new Node{item, nullptr};
    if (tail == nullptr) node->next = node;      // a single node points to itself
    else { node->next = tail->next; tail->next = node; }
    tail = node;
    count++;
}
void addFirst(const T& item) {                   // O(1): same splice, but tail stays
    Node* node = new Node{item, nullptr};
    if (tail == nullptr) { node->next = node; tail = node; }
    else { node->next = tail->next; tail->next = node; }
    count++;
}
T removeFirst() {                                // O(1)
    if (tail == nullptr) throw std::underflow_error("removeFirst on empty list");
    Node* first = tail->next;
    T item = first->item;
    if (first == tail) tail = nullptr;           // it was the only node
    else tail->next = first->next;
    delete first;
    count--;
    return item;
}
```

| Variant question | Answer |
|---|---|
| Circular SLL, tail only: addFirst / addLast / removeFirst | O(1) / O(1) / O(1) — `tail->next` *is* the head |
| Circular SLL, **head only**: addFirst | **O(n)** if you may only relink: the last node's `next` must point to the new head, and finding the last node is a walk. (Trick for O(1): insert the new node *after* head, then swap the two items.) |
| Circular SLL, head only: removeFirst | O(n) by relinking, same reason (O(1) trick: copy `head->next`'s item into head, delete `head->next`) |
| Remove from head of a circular SLL with no head pointer (Quiz 2) | O(1): `tail->next` |
| What change makes removeLast O(1)? (Quiz 2) | add a `prev` pointer to each node (circular DLL) |
| Quiz 2 phrasing: list z → y → x → w, tail = w | `x->next = head;` (or `x->next = w->next;`) then `tail = x;` |

**Non-circular SLL with head and tail** (Lab 2's `removeLast`): same walk, but the predecessor's `next` becomes `nullptr`, and the one-node case sets **both** `head` and `tail` to `nullptr`.

**HW 1 `InsertAtFront` with a dummy head node:** the dummy never holds data, so there is no empty-list special case:

```cpp
void InsertAtFront(InventoryNode* headNode, InventoryNode* currNode) {
    currNode->nextNodeRef = headNode->nextNodeRef;   // new node -> old first
    headNode->nextNodeRef = currNode;                // dummy head -> new node
}
```

Output on the HW input: `200 forks / 150 cups / 200 spoons / 100 plates` (reverse of input order). The order of the two lines matters — reversed, the rest of the list is lost.

---

## 7. Stacks, Queues and Deques (Sample Q4)

### 7.1 Which underlying structure? (Quiz 3, Lec 5)

| Question | Answer and reason |
|---|---|
| Stack on a linked list — most efficient in time and space | **SLL, no tail**: top = head, push/pop/peek all O(1); a tail or `prev` is wasted memory |
| Queue on a linked list | **SLL with tail**: enqueue at tail, dequeue at head, both O(1). Reversed (enqueue at head, dequeue at tail) makes dequeue O(n) |
| Strict real-time system (flight control): ArrayList or linked list? | **Linked list**: O(1) worst case every time; the ArrayList's occasional O(n) resize is a latency spike even though it is O(1) amortized |
| Queue on a plain ArrayList | one end costs O(n) (shift); fix with a **circular array** → O(1) amortized |
| Deque on a linked list | **DLL**: removal at both ends needs `prev` |

### 7.2 Sample Q4 solved: a stack with one queue

**The question** (sample midterm Q4, 10 pts):

Implement a Stack using one Queue. You can use the methods available to the Queue class (`enqueue`, `dequeue`, `isEmpty`, `peek`).

```cpp
Template <typename T>
class Stack<T> {
Public:
    Stack() = default:
    boolean isEmpty() { }
    void push(T item) { }
    T pop() { }
    T peek() { }
Private:
    Queue<T> q;
}
```

*a.* What is the worst-case Big-O time complexity of the push operation for this stack? Explain why.

*b.* What is the worst-case Big-O time complexity of the pop operation for this stack? Explain why.

**Worked through:**

Keep the queue's **front = the stack's top**. On `push`, enqueue the new item and then rotate the n older items behind it.

```cpp
// Assumption: I may add a counter (the Queue API has no size()).
template <typename T>
class Stack {
public:
    Stack() = default;
    bool isEmpty() { return q.isEmpty(); }
    void push(T item) {                       // O(n)
        q.enqueue(item);
        for (int i = 0; i < n; i++)           // move the n older items behind it
            q.enqueue(q.dequeue());
        n++;
    }
    T pop() {                                 // O(1)
        T x = q.dequeue();                    // dequeue throws if empty
        n--;
        return x;
    }
    T peek() { return q.peek(); }             // O(1)
private:
    Queue<T> q;
    int n = 0;
};
```

Push 1, 2, 3 → peek 3, pop 3, pop 2; push 4 → pop 4, pop 1 (`peek 3 pops: 3241`).

**(a) push: O(n) worst case** — after enqueuing, each of the n older items is dequeued and re-enqueued once, 2n queue operations. **(b) pop: O(1)** — the top is at the front, one `dequeue`.

**The other valid design** (pop-costly): `push` just enqueues (O(1)); `pop` rotates n − 1 items to the back and dequeues the last one (O(n)). Either earns full credit if your complexity answers match **your** code — say which design you chose.

> ⚠️ **Pitfall**: without a count you can't tell when one full rotation is done (`isEmpty` is never true mid-rotation). Add the counter and say so (assumption), rather than writing a loop that rotates forever.

### 7.3 Variants

**Stack with two queues** (Lab 3 `QueueStack`): push enqueues into `secondary`, moves everything from `primary` behind it, then swaps the two queue pointers. Push O(n), pop/peek O(1); pop on empty throws `std::underflow_error`.

```cpp
void push(const T& item) {
    secondary->enqueue(item);
    while (!primary->isEmpty()) secondary->enqueue(primary->dequeue());
    std::swap(primary, secondary);
}
```

**Queue with two stacks** (HW 3, asked again on Quiz 3): enqueue pushes onto `stackIn`. Dequeue/peek **transfer only when `stackOut` is empty**: pop everything from `stackIn` and push it onto `stackOut`, which reverses it so the oldest item is on top. Transferring while `stackOut` still has items buries older items under newer ones and breaks FIFO.

```cpp
void enqueue(const T& x) { stackIn.push(x); }            // O(1)
T dequeue() { transfer(); return stackOut.pop(); }       // O(n) worst, O(1) amortized
T peek()    { transfer(); return stackOut.peek(); }
void transfer() {
    if (!stackOut.isEmpty()) return;                      // only when stackOut is empty
    while (!stackIn.isEmpty()) stackOut.push(stackIn.pop());
    if (stackOut.isEmpty()) throw std::underflow_error("empty queue");
}
```

Amortized O(1): each item is pushed and popped at most twice in total (once per stack), so n operations cost O(n).

HW 3's 14-operation trace (stacks written bottom → top, from the compiled run):

| # | Operation | stackIn | stackOut | Returns |
|---|---|---|---|---|
| 1–3 | enqueue 10, 20, 30 | 10, 20, 30 | | |
| 4 | peek() | | 30, 20, 10 | 10 |
| 5 | dequeue() | | 30, 20 | 10 |
| 6 | peek() | | 30, 20 | 20 |
| 7 | dequeue() | | 30 | 20 |
| 8 | enqueue(40) | 40 | 30 | |
| 9 | enqueue(50) | 40, 50 | 30 | |
| 10 | peek() | 40, 50 | 30 | 30 |
| 11 | dequeue() | 40, 50 | | 30 |
| 12 | enqueue(60) | 40, 50, 60 | | |
| 13 | dequeue() | | 60, 50 | 40 |
| 14 | peek() | | 60, 50 | 50 |

Quiz 3's shorter version: enqueue 7, 9 → in `7,9`; dequeue → in empty, out `9`, returns 7; enqueue 8 → in `8`, out `9`; dequeue → in `8`, out empty, returns 9; peek → in empty, out `8`, returns 8.

**Queue with one stack** (harder variant): use recursion — the call stack acts as the second stack. Dequeue pops down to the bottom item, then pushes the others back on the way out. O(n) time and O(n) stack frames.

```cpp
T dequeue() {
    T x = s.pop();                 // throws if empty
    if (s.isEmpty()) return x;     // x was the bottom = the front
    T front = dequeue();
    s.push(x);                     // restore in the original order
    return front;
}
```

### 7.4 Circular arrays and deques (Quiz 3, Lab 3)

With **`front` = first valid element and `rear` = last valid element** (Quiz 3's convention), a deque on a circular array of capacity `size`:

| Operation | Index update |
|---|---|
| push at front | `front = (front - 1 + size) % size;` then store at `front` |
| push at rear | `rear = (rear + 1) % size;` then store at `rear` |
| pop at front | read `front`, then `front = (front + 1) % size;` |
| pop at rear | read `rear`, then `rear = (rear - 1 + size) % size;` |

- **As a stack**: push and pop at the **same** end (e.g. push front + pop front).
- **As a queue**: push at one end, pop at the other (push rear + pop front).

> ⚠️ **Pitfall**: `(front - 1) % size` is −1 in C++ when `front` is 0 — `%` keeps the sign. Always add `size` first.

**Lab 3 `CircularArray` with resize** (front + count convention; rear slot = `(front + count) % capacity`):

```cpp
void enqueue(const T& x) {                       // amortized O(1)
    if (count == capacity) resize(2 * capacity);
    data[(front + count) % capacity] = x;
    count++;
}
T dequeue() {                                    // O(1)
    if (count == 0) throw std::underflow_error("dequeue on empty");
    T x = data[front];
    front = (front + 1) % capacity;
    count--;
    return x;
}
void resize(int newCap) {                        // copy in QUEUE order, not array order
    T* bigger = new T[newCap];
    for (int k = 0; k < count; k++) bigger[k] = data[(front + k) % capacity];
    delete[] data;
    data = bigger; capacity = newCap; front = 0;
}
```

> ⚠️ **Pitfall**: the ArrayList's `expand` (copy `data[0..n-1]` to the same indices) breaks a wrapped queue — after the copy the items are out of order. Unroll from `front`. Full vs empty: with front/rear only, `front == rear` can mean both; keep a count (or leave one slot empty).

**Lab 3 postfix calculator**: operands push; an operator pops **v1 = right operand first**, then v2 = left, pushes `v2 op v1`. Division by zero → `std::domain_error`, push the operands back; fewer than two operands → push the lone one back; unknown operator → `std::invalid_argument` ([Lec 5](lec-05.en-US.md#45-postfix-evaluation-slide-17)).

---

## 8. Comparison Sorting (Sample Q5)

### 8.1 The summary table (Lec 12)

| Sort | In place | Stable | Best | Average | Worst | Remark |
|---|---|---|---|---|---|---|
| Selection | ✓ | | O(n²) | O(n²) | O(n²) | n − 1 exchanges |
| Insertion | ✓ | ✓ | O(n) | O(n²) | O(n²) | small or partially sorted arrays |
| Merge | | ✓ | O(n log n) | O(n log n) | O(n log n) | guaranteed; O(n) extra space |
| Quick | ✓ | | O(n log n) | O(n log n) | O(n²) | probabilistic guarantee; fastest in practice |
| Heap (not on the midterm) | ✓ | | O(n log n) | O(n log n) | O(n log n) | guaranteed and in place |

Code for all of them: [selection and insertion](lec-07.en-US.md#5-selection-sort), [merge](lec-08.en-US.md#2-merging-two-sorted-halves), [quick](lec-09.en-US.md#2-partitioning-hoare-2-pointer-scheme), [heap](#12-heap-sort-not-on-the-midterm).

### 8.2 Recognizing an intermediate state

| Algorithm | What a mid-sort snapshot looks like |
|---|---|
| Selection | prefix = the **k smallest** keys, sorted, in their final places; the rest is the original order except where the swapped-out keys landed |
| Insertion | prefix = the **first k original keys**, sorted (not the k smallest); suffix untouched |
| Merge (top-down) | sorted runs on recursion boundaries (first 2, 3, 5, 9 … items), everything after them untouched |
| Quick (pivot `a[lo]`, no shuffle) | after the first partition: the original first key sits at index j with only smaller keys left of it and larger keys right of it |
| Heap (not on the midterm) | suffix = the **largest** keys, sorted, in final places; prefix is heap-ordered (its first element is its maximum) |

### 8.3 Sample Q5(a) solved

**The question** (sample midterm Q5 "Sorting (ignore Heapsort)", part a, 10 pts):

In the table below, the first row (last column is 0) contains an array of 18 unsorted numbers between 1 and 50. The last row (last column is 6) contains the same numbers in sorted order. The other rows show the array in **some intermediate** state during one of these five sorting algorithms: 1) Selection sort, 2) Insertion sort, 3) Mergesort, 4) Quicksort (no initial shuffling), 5) Heapsort. Match each algorithm with the right row by writing its number (1-5) in the last column. Please keep in mind that for some algorithms, more than one rows might satisfy an intermediate state. Place extra credit answer to the right of the table.

| | | | | | | | | | | | | | | | | | | |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 12 | 11 | 35 | 46 | 20 | 43 | 42 | 47 | 44 | 32 | 16 | 10 | 40 | 18 | 41 | 21 | 28 | 15 | **0** |
| 11 | 10 | 12 | 15 | 16 | 18 | 20 | 21 | 28 | 32 | 35 | 40 | 41 | 42 | 43 | 44 | 46 | 47 | |
| 11 | 12 | 20 | 35 | 42 | 43 | 46 | 47 | 44 | 32 | 16 | 10 | 40 | 18 | 41 | 21 | 28 | 15 | |
| 11 | 12 | 20 | 35 | 46 | 43 | 42 | 47 | 44 | 32 | 16 | 10 | 40 | 18 | 41 | 21 | 28 | 15 | |
| 10 | 11 | 12 | 46 | 20 | 43 | 42 | 47 | 44 | 32 | 16 | 35 | 40 | 18 | 41 | 21 | 28 | 15 | |
| 10 | 11 | 12 | 15 | 16 | 43 | 42 | 47 | 44 | 32 | 20 | 35 | 40 | 18 | 41 | 21 | 28 | 46 | |
| 10 | 11 | 12 | 15 | 16 | 18 | 20 | 21 | 28 | 32 | 35 | 40 | 41 | 42 | 43 | 44 | 46 | 47 | **6** |

**Worked through:**

Rows are numbered by the table's last column (row 0 = input, row 6 = sorted). I simulated the five algorithms with the course code on the row-0 array and checked every snapshot:

| Row | Array | Algorithm | Why |
|---|---|---|---|
| 1 | 11 10 **12 15 16 18 20 21 28 32 35 40 41 42 43 44 46 47** | **5 Heapsort** | 16 largest keys sorted at the end; prefix `11 10` is heap-ordered (heap sort is excluded this term, so a modified version of this question would likely list only the other four sorts) |
| 2 | **11 12 20 35 42 43 46 47** 44 32 16 10 … | **2 Insertion** | the first 8 *original* keys sorted, rest untouched (10 is not at the front, so not selection) |
| 3 | **11 12 20 35 46** 43 42 47 44 … | **3 Mergesort** | `sort(0,8)` → `sort(0,4)` finished: first 5 merged, rest untouched |
| 4 | 10 11 **12** 46 20 43 42 47 44 32 16 35 40 18 41 21 28 15 | **4 Quicksort** | first partition: the old first key 12 is at index 2 with only smaller keys (10 11) left of it and larger keys right of it (35 was swapped into 10's old spot) |
| 5 | **10 11 12 15 16** 43 42 47 44 32 20 35 40 18 41 21 28 46 | **1 Selection** | the 5 smallest keys in place; 20, 35, 46 sit where the swapped-out keys were |

**Extra credit (more than one row fits):** row 3 is also insertion sort after 5 passes, and row 4 is also selection sort after 3 passes. The unique matching above comes from rows 2 and 5, which only one algorithm can produce.

### 8.4 Sample Q5(b) and its variants: number of compares

**The question** (sample midterm Q5, part b, 8 pts): For the following algorithms, assume they are given an array with n elements *that are already sorted*. Choose among O(1), O(log n), O(n), O(n log n), O(n²).

i. How many compares does selection sort take?

ii. How many compares does insertion sort take?

iii. How many compares does mergesort take?

iv. How many compares does quicksort take when the first element is chosen as pivot?

**Worked through:**

Measured with the course code (counting every key comparison), n = 1000 → n = 2000:

| Input | Selection | Insertion | Merge | Quick, pivot = first | Quick, median-of-3 | Heap (not tested) |
|---|---|---|---|---|---|---|
| **sorted** (sample) | **O(n²)** 499,500 → 1,999,000 | **O(n)** 999 → 1999 | **O(n log n)** 5,044 → 11,088 | **O(n²)** 501,498 → 2,002,998 | O(n log n) | O(n log n) |
| reverse sorted | O(n²) | **O(n²)** 499,500 | O(n log n) | **O(n²)** | O(n log n) | O(n log n) |
| all keys equal | O(n²) | O(n) | O(n log n) | **O(n log n)** 8,898 → 19,786 | O(n log n) | O(n) 2,994 → 5,994 |

Why, in one line each:
- **Selection** always scans the whole unsorted part: n(n−1)/2, no early exit.
- **Insertion** on sorted input: one compare per element, then `break` → n − 1. Reverse: every element walks to the front → n(n−1)/2. Equal keys: `a[j] < a[j-1]` is false at once → n − 1.
- **Merge** always splits in half; each level costs ≤ n compares, log₂ n levels (sorted input still needs ½ n log n, so it is n log n, not n). Exception: with Lab 4's skip `if (a[mid] <= a[mid + 1]) return;` every merge is skipped on sorted input → O(n) compares.
- **Quick, pivot = first** on sorted *or* reverse-sorted input: the pivot is the min (or max) every time → splits 0 / n−1 → T(n) = T(n−1) + n = O(n²).
- **Quick on all-equal keys** (HW 5 Q4): both scans **stop on keys equal to the pivot**, so `i` and `j` meet in the middle → even splits → O(n log n). If the scans skipped equal keys, one pointer would run to the end → O(n²).
- **Heap on all-equal keys**: no `sink` ever moves, so construction and sortdown are both linear (beyond the slides — the slides' claim is the O(n log n) worst case).

### 8.5 HW 5 questions (likely variants)

**Q3: partition `H O M E W O R K F I V E`** (pivot `v = H`, slide code, no shuffle):

| Step | i stops at | j stops at | Array after |
|---|---|---|---|
| start | | | H O M E W O R K F I V E |
| swap 1 | 1 (O ≥ H) | 11 (E ≤ H) | H **E** M E W O R K F I V **O** |
| swap 2 | 2 (M) | 8 (F) | H E **F** E W O R K **M** I V O |
| cross | 4 (W) | 3 (E) | i ≥ j → stop |
| final `swap(a[lo], a[j])` | | j = 3 | **E E F H** W O R K M I V O |

H ends at index 3: everything left is ≤ H, everything right ≥ H. Step through it below (← / → keys work when the demo is focused):

```viz quick-sort
{"title": "HW 5 Q3: partition H O M E W O R K F I V E", "items": "H, O, M, E, W, O, R, K, F, I, V, E", "mode": "partition"}
```

**Q5: pick the pivot from two fixed indices to fix the O(n²) worst case?** (a) Impossible: for any deterministic rule that looks at fixed positions, an adversary can build an input where both of those positions hold the smallest keys of every subarray, so each partition still splits 0 / n−1 → O(n²). (b) The question rules out shuffling and random pivots, so the fix has to change what the pivot *is*, not where it is read from. A worst-case O(n log n) guarantee needs a pivot that always splits well: the **true median**, found in O(n) per call with the median-of-medians algorithm, gives T(n) = 2T(n/2) + O(n) = O(n log n). The practical alternative is to stop quick sort when recursion gets too deep and finish with heap sort (O(n log n) worst case, [§12](#12-heap-sort-not-on-the-midterm)) — that is what `std::sort` does. (Both are beyond the slides; the slides' own tools, shuffle and Lab 4's `RANDOM` pivot, only make the worst case *unlikely*.) Median-of-three ([Lec 9](lec-09.en-US.md#71-pivot-strategies-in-code-lab-4)) is also a fixed-position rule, so it has the same problem as the classmate's idea.

**Quiz 4 Q1 (quick sort analysis).** Worst case: when the input is already sorted, ascending **or** descending (with the pivot taken from a fixed position), the run time is **O(n²)**. Two methods that give a *probabilistic* guarantee on any input: (1) **randomly shuffle** the array before sorting; (2) choose the pivot **randomly** (or as the median of 3 randomly chosen samples). Both keep the O(n²) case possible but make it extremely unlikely for every input.

**Q1–2: merge without the `i > mid` / `j > hi` tests**: copy the right half into `aux` **reversed**, then merge from both ends; each half's largest key acts as a sentinel. Faster, but not stable. Full code in [Lec 8 §6.2](lec-08.en-US.md#62-merging-without-the-exhaustion-checks-hw-5).

**Lab 4 additions to know**: insertion-sort cutoff for small subarrays (the inner loop must stop at `j > lo`), the "already in order" skip `if (data[mid] <= data[mid + 1]) return;`, median-of-three moving the median into `a[lo]` so the unchanged partition can use it ([Lec 8 §6.1](lec-08.en-US.md#61-improvements-1-and-2-in-code-lab-4), [Lec 9 §7.1](lec-09.en-US.md#71-pivot-strategies-in-code-lab-4)).

### 8.6 Stability and memory, quickly

- **Stable**: insertion (swaps only adjacent, strictly smaller) and merge (tie → take from the left). **Not stable**: selection (long-distance swap), quick (long-distance swaps), heap (sortdown swaps the root to the end).
- **Extra memory**: merge O(n) (`aux`); quick O(log n) average for the recursion (O(n) worst); selection, insertion, heap O(1).
- **Lower bound**: every comparison sort needs Ω(n log n) compares in the worst case.

---

## 9. Trees, Binary Trees and Traversals

Full explanations: [Lecture 10](lec-10.en-US.md). The exam-relevant facts:

| Term | Definition | Trap |
|---|---|---|
| Depth (= level) of a node | edges from the root down to it; root = 0 | counted in **edges**, not nodes |
| Height of a node | edges on the longest path down to a leaf; leaf = 0 | empty tree = −1 in the recursive formula |
| Height of the tree | height of the root = max depth | a single node has height 0 |
| Leaf / internal | 0 children / at least 1 child | a node with one child is internal |
| Degree | number of children (binary tree: ≤ 2) | |
| Full (proper) | every node has **0 or 2** children | |
| Complete | every level full except possibly the last, which is filled **from the left** | full and complete are independent |

**Node counts.** Level k holds at most 2ᵏ nodes; a tree of height h has h + 1 ≤ n ≤ 2^(h+1) − 1 nodes, so its height is between ⌈log₂(n+1)⌉ − 1 (complete) and n − 1 (a "stick"). Every operation that walks one root-to-leaf path is O(height): O(log n) when the tree is short, O(n) when it is a stick.

**Traversals** (all O(n) time; the recursive ones use O(height) stack space):

| Order | Rule | Typical use |
|---|---|---|
| Pre-order | root, left, right | copy a tree |
| In-order | left, root, right | **sorted order of a BST** |
| Post-order | left, right, root | delete / free a tree, compute heights |
| Level order | level by level, left to right, with a **queue** | breadth-first |

```cpp
void preorder(Node* t) {
    if (t == nullptr) return;
    visit(t->item);              // root first
    preorder(t->left);
    preorder(t->right);
}
// inorder:   inorder(t->left);  visit(t->item);  inorder(t->right);
// postorder: postorder(t->left); postorder(t->right); visit(t->item);

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

int height(Node* t) {            // post-order: children first
    if (t == nullptr) return -1;
    return 1 + std::max(height(t->left), height(t->right));
}
```

> 💡 **Key Insight**: check a traversal by the root: first in pre-order, last in post-order, and in in-order it splits the left subtree's keys from the right subtree's.

**Lecture 10 practice, solved** (details in [Lec 10 §15](lec-10.en-US.md#15-in-class-activities-with-solutions)):
- Activity 1 (root 8; 5 → 9, 7; 7 → 1, 12; 12 → 2 on the left; 4 → 11 on the right; 11 → 3 on the left): pre `8 5 9 7 1 12 2 4 11 3`, in `9 5 1 7 2 12 8 4 3 11`, post `9 1 2 12 7 5 3 11 4 8`, level `8 5 4 9 7 11 1 12 3 2`.
- Full or complete: a root whose only child is on the **right** is neither; a tree whose last level is left-packed but has a node with one child is complete, not full.

**Variant: the four orders of the BST used in Lec 12's activities** (8; 3 → 1, 6; 6 → 4, 7; 10 → 14 on the right; 14 → 13 on the left), from the compiled run:

| Order | Sequence |
|---|---|
| Pre-order | 8 3 1 6 4 7 10 14 13 |
| In-order | 1 3 4 6 7 8 10 13 14 (sorted — it is a BST) |
| Post-order | 1 4 7 6 3 13 14 10 8 |
| Level order | 8 3 10 1 6 14 4 7 13 |

Height 3, 9 nodes. Step through the in-order below (← / → keys work when the demo is focused):

```viz tree-traversal
{"title": "Variant: in-order of the Lec 12 activity BST", "tree": "8, 3, 10, 1, 6, -, 14, -, -, 4, 7, -, -, 13", "order": "in", "interactive": true}
```

> ⚠️ **Pitfall**: in in-order, a node with no left child is visited **before** its right subtree (10 comes before 13 and 14 above). In level order, a deep node on the left still comes after every shallower node on the right.

### 9.1 Rebuilding a tree from pre-order and in-order (Quiz 4 Q3)

**What each order tells you:** pre-order (root, left, right) — its **first** key is the root. In-order (left, root, right) — the root **splits** it into the left subtree's keys and the right subtree's keys. Recurse on each side, taking the next roots from pre-order in turn.

**Quiz 4:** pre-order `50 36 17 2 0 3 28 30 1`, in-order `2 17 0 36 3 50 30 28 1`.

| Step | Root (from pre-order) | In-order split: left \| right |
|---|---|---|
| whole tree | 50 | 2 17 0 36 3 \| 30 28 1 |
| left of 50 | 36 | 2 17 0 \| 3 |
| left of 36 | 17 | 2 \| 0 |
| right of 50 | 28 | 30 \| 1 |

So 50 → 36, 28; 36 → 17, 3; 17 → 2, 0; 28 → 30, 1. Check (compiled run): its post-order is `2 0 17 3 36 30 1 28 50`.

```viz binary-tree
{"title": "Quiz 4 Q3: the rebuilt tree", "tree": "50, 36, 28, 17, 3, 30, 1, 2, 0", "views": "plain; subtree:36; subtree:28"}
```

Variants:
- **Post-order + in-order** works the same way, but the root is the **last** key of post-order, and you build the **right** subtree first when reading post-order from the back.
- **Pre-order + post-order** is not enough in general: a node with a single child gives the same pre- and post-order whether that child is on the left or the right. In-order is what fixes left vs right.
- Only one order given? Not unique — unless the tree is a **BST**: then in-order is just the sorted keys, and pre-order alone determines it (insert the keys in pre-order).

---

## 10. Heaps and Priority Queues

Full explanations: [Lecture 10](lec-10.en-US.md#9-heap-ordered-binary-trees) and [Lecture 11](lec-11.en-US.md).

A **binary heap** is a **complete** binary tree that is **heap-ordered** (every parent ≥ its children in a max-heap), stored in an array from index 1:

| 1-based (slides) | 0-based (if you use one) |
|---|---|
| parent of k = k/2 | parent of i = (i − 1)/2 |
| children of k = 2k, 2k + 1 | children of i = 2i + 1, 2i + 2 |
| last internal node = n/2 | last internal node = n/2 − 1 |

The slide code (a fixed-size array `pq[0..capacity]`, `pq[0]` unused; the `std::vector` version in [Lec 11 §9](lec-11.en-US.md#9-complete-implementation) uses `push_back` instead of `pq[++n] = x`):

```cpp
void swim(size_t k) {                 // move up while larger than the parent
    while (k > 1 && less(k/2, k)) {
        exch(k, k/2);
        k = k/2;
    }
}
void sink(size_t k) {                 // move down toward the LARGER child
    while (2*k <= n) {
        size_t j = 2*k;
        if (j < n && less(j, j+1)) j++;
        if (!less(k, j)) break;
        exch(k, j);
        k = j;
    }
}
void insert(const Key& x) { pq[++n] = x; swim(n); }
Key delMax() {
    Key max = pq[1];
    exch(1, n--);                     // last key to the root
    sink(1);
    return max;
}
```

| Operation | Worst case | Compares |
|---|---|---|
| insert (append + swim) | O(log n) | ≤ log n + 1 |
| delMax (exch + sink) | O(log n) | ≤ 2 log n (two per level) |
| find max | O(1) | 0 |
| naive build (n inserts) | O(n log n) | |
| bottom-up build | **O(n)** | |

| Priority queue on | insert | delete max |
|---|---|---|
| unordered array | O(1) | O(n) |
| ordered array | O(n) | O(1) |
| binary heap | O(log n) | O(log n) |

**Min-heap**: the same code with the comparison flipped — the smallest key is at the root, a key swims while **smaller** than its parent, and sink goes toward the **smaller** child.

### 10.1 Lecture 11 exercises, solved

Starting max-heap: `– 100 19 36 17 3 25 1 2 7` (details in [Lec 11 §10](lec-11.en-US.md#10-in-class-activities-with-solutions)); all results checked by the compiled run.

| Exercise | Answer |
|---|---|
| insert 47 | 47 goes to index 10 (left child of index 5); swims past 3 and 19, stops under 100 → `– 100 47 36 17 19 25 1 2 7 3` |
| sink 7 in `– 19 7 36 17 3 25 1 2` | 7 < larger child 17 → swap; 7 > its child 2 → stop → `– 19 17 36 7 3 25 1 2` |
| delMax | returns 100; 7 moves to the root and sinks past 36 and 25 → `– 36 19 25 17 3 7 1 2` |
| 9 × delMax | returns `100 36 25 19 17 7 3 2 1`; the array ends sorted ascending |
| min-heap: insert P, Q, E, delMin, … (12 steps) | final heap `L P M Q P X`; see the step table in Lec 11 §10.4 |

### 10.2 Building a heap bottom-up (Lecture 12 Activity, Parts 1–3)

```cpp
for (int k = n/2; k >= 1; k--)        // skip the leaves; sink every internal node
    sink(a, k, n);
```

**Part 1: [2, 9, 7, 6, 5, 8].** n = 6, so the loop starts at k = 6/2 = 3 (nodes 4–6 are leaves).

| Call | What happens | Array |
|---|---|---|
| start | | 2 9 7 6 5 8 |
| `sink(3, 6)` | 7 < its child 8 → swap | 2 9 **8** 6 5 **7** |
| `sink(2, 6)` | 9 ≥ children 6, 5 → no move | 2 9 8 6 5 7 |
| `sink(1, 6)` | 2 < larger child 9 → swap; 2 < larger child 6 → swap | **9 6** 8 **2** 5 7 |

Step through it below (← / → keys work when the demo is focused):

```viz binary-heap
{"title": "Lec 12 Activity: heap construction on 2 9 7 6 5 8", "heap": "2, 9, 7, 6, 5, 8", "ops": "sink(3); sink(2); sink(1)", "interactive": true}
```

**Part 2 — naive construction** (insert one at a time, each swims): n inserts × O(log n) = **O(n log n)**.
**Part 3 — bottom-up construction: O(n).** Half the nodes are leaves (sink cost 0), a quarter can sink 1 level, an eighth 2 levels, …: total ≤ n (0/2 + 1/4 + 2/8 + 3/16 + …) ≤ n · 1. Most nodes are near the bottom, where sinking is cheap. (Shifting method from the slide: S = Σ k/2^(k+1); S − S/2 is a geometric series, so S = 1.)

### 10.3 Variants

| Question | Answer |
|---|---|
| Is `– 50 30 40 35 10 20` a max-heap? | No: 35 (index 4) is a child of 30 (index 2). Check every k ≥ 2: `pq[k/2] >= pq[k]` |
| Where is the **minimum** of a max-heap? | in one of the leaves, indices n/2 + 1 … n; finding it is O(n) |
| Height of a heap with n keys | ⌊log₂ n⌋ — it is complete, so it can never become a stick |
| Why start bottom-up construction at n/2? | ⌊n/2⌋ is the last node with a child; sinking a leaf does nothing |
| Why does sink pick the **larger** child? | the larger child becomes the parent of the other one, so heap order holds |
| Is a sorted-descending array a max-heap? | yes — every parent comes before (and is ≥) its children |

> ⚠️ **Pitfall**: index arithmetic. Mixing the 1-based formulas (children 2k, 2k + 1) with a 0-based C++ array is the classic heap bug — say which convention you use.

### 10.4 Quiz 4, Q2 and Q4

**Q2.** For a 1-indexed heap: parent = i/2, left = 2i, right = 2i + 1. Optimized (bottom-up) construction starts sinking at index **n/2** and costs **O(n)** worst case.

**Q4.** Build a max-heap from `50 36 17 2 0 3 28 30 1` (n = 9, start at k = 9/2 = 4), then call delete max. From the compiled run:

| Step | Array (index 1 … 9) |
|---|---|
| start | 50 36 17 2 0 3 28 30 1 |
| `sink(4)`: 2 < larger child 30 → swap | 50 36 17 **30** 0 3 28 **2** 1 |
| `sink(3)`: 17 < larger child 28 → swap | 50 36 **28** 30 0 3 **17** 2 1 |
| `sink(2)`, `sink(1)`: already in order | 50 36 28 30 0 3 17 2 1 |
| delMax, initial exchange `exch(1, 9)` | **1** 36 28 30 0 3 17 2 \| 50 |
| `sink(1)`: 1 ↓ 36, ↓ 30, ↓ 2 | 36 30 28 2 0 3 17 1 |

delMax returns 50. The answer key accepts the "initial exchange" drawing with or without 50 still shown at index 9.

```viz binary-heap
{"title": "Quiz 4 Q4: build a max-heap, then delMax", "heap": "50, 36, 17, 2, 0, 3, 28, 30, 1", "ops": "sink(4); sink(3); sink(2); sink(1); delMax()"}
```

(Q2's last part, heap sort with a min-heap, is in the folded [§12](#12-heap-sort-not-on-the-midterm).)

---

## 11. Binary Search Trees

**Symmetric order**: every node's key is **larger than all keys in its left subtree** and **smaller than all keys in its right subtree**. We assume **no duplicate keys**. The textbook's BST is a dictionary: each node holds a key-value pair, two subtree pointers, and optionally a **size** (nodes in its subtree, used for k-th smallest). The BST itself is just `Node* root`.

Slide code (slide p18, the `put`/`get` slides):

```cpp
template <typename Key, typename Value>   // slide has a typo: "template <template Key, ...>"
class BST {
private:
    class Node {
        Key key;              // sorted by key
        Value val;            // associated value
        Node* left, right;    // roots of left and right subtrees
        int size;             // #nodes in subtree rooted at this
        Node(const Key& k, const Value& v, int s)
            : key(k), val(v), left(nullptr), right(nullptr), size(s) {}
    };
    Node* root;               // root of BST
};
```

> ⚠️ **Pitfall**: the slide declares `Node* left, right;` — in C++ that makes `left` a pointer and `right` a plain `Node` (which can't even compile inside `Node`). Write `Node* left; Node* right;` (or `Node *left, *right;`). The class also needs `public:` on `Node`'s members, or `friend` access, for `BST` to use them.

```cpp
Value get(Node* x, const Key& key) const {
    if (x == nullptr)
        return Value();                 // miss
    if (key < x->key)
        return get(x->left, key);
    else if (key > x->key)
        return get(x->right, key);
    else
        return x->val;                  // hit
}
Node* put(Node* x, const Key& key, const Value& val) {
    if (x == nullptr)
        return new Node(key, val, 1);   // reached a null link: new leaf
    if (key < x->key)
        x->left = put(x->left, key, val);
    else if (key > x->key)
        x->right = put(x->right, key, val);
    else
        x->val = val;                   // key exists: update the value
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
```

- **Search/insert compares = depth of the node + 1.**
- `put` returns the subtree's (possibly new) root and the caller re-assigns the link (`x->left = put(...)`) — that is how a `nullptr` link becomes the new node, and how sizes are fixed on the way back up.

### 11.1 Deletion (Hibbard)

| Case | What to do |
|---|---|
| 1. leaf | delete it (parent's link becomes `nullptr`) |
| 2. one child | replace the node with its child |
| 3. two children | replace it with its **successor** — the next larger key = the **leftmost node of its right subtree**; the successor's right child (it has no left child) moves up into the successor's old place |

Hibbard deletion always uses the successor, so after many deletions the tree leans left (skewed). **Symmetric Hibbard deletion** alternates (or randomly picks) successor and predecessor; it keeps the height close to O(log n) in experiments, with no formal proof.

My implementation of Hibbard deletion (the slides show the cases as pictures, not code); compiled and checked on Activities 4 and 5:

```cpp
Node* min(Node* x) const { return x->left == nullptr ? x : min(x->left); }
Node* deleteMin(Node* x) {                // unlink the min, don't free it
    if (x->left == nullptr) return x->right;
    x->left = deleteMin(x->left);
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
Node* remove(Node* x, const Key& key) {
    if (x == nullptr) return nullptr;     // key not found
    if (key < x->key) x->left = remove(x->left, key);
    else if (key > x->key) x->right = remove(x->right, key);
    else {
        if (x->right == nullptr) { Node* l = x->left; delete x; return l; }
        if (x->left == nullptr) { Node* r = x->right; delete x; return r; }
        Node* t = x;                      // two children:
        x = min(t->right);                // successor
        x->right = deleteMin(t->right);   // its right child moves up
        x->left = t->left;
        delete t;
    }
    x->size = 1 + size(x->left) + size(x->right);
    return x;
}
```

### 11.2 Shape and cost

| | Search | Insert | Delete |
|---|---|---|---|
| BST, worst case | O(n) | O(n) | O(n) |
| BST, average (random insertion order) | O(log n) | O(log n) | O(√n) — Hibbard deletions skew the tree (Lec 14 summary table) |
| Goal (balanced trees, after the midterm) | O(log n) | O(log n) | O(log n) |

- The same keys give different trees depending on insertion order. Random order → expected height O(log n). **Sorted (or reverse-sorted) order → a stick of height n − 1**: inserting 1 … 7 in order gives height 6; inserting 4 2 6 1 3 5 7 gives height 2 (compiled run).
- In-order traversal prints the keys sorted (O(n)); the minimum is the leftmost node, the maximum the rightmost.

### 11.3 Lecture 12 Activities 2–5, solved

All on this BST (keys only), and all results from the compiled run:

```viz binary-tree
{"title": "Lec 12 Activities 2–4: the BST", "tree": "8, 3, 10, 1, 6, -, 14, -, -, 4, 7, -, -, 13", "views": "plain; path:8-3-6-4; path:8-10"}
```

**Activity 2 — search 4 and 9.** 4: 8 → left, 3 → right, 6 → left, 4 **hit** (4 compares = depth 3 + 1). 9: 8 → right, 10 → left is `nullptr` → **miss** after 2 compares.

**Activity 3 — add (4, 3) and (9, 2).** 4 already exists → its value is **updated** to 3, no new node. 9: 8 → right, 10 → left is null → new leaf **9 as 10's left child**. Size goes from 9 to 10.

**Activity 4 — remove each key from the original tree:**

| Remove | Case | Result |
|---|---|---|
| 1 | leaf | 3's left becomes `nullptr` |
| 14 | one child | 13 takes 14's place as 10's right child |
| 6 | two children | successor 7 (leftmost of {7}) replaces 6; 7's left = 4 |
| 3 | two children | successor 4 (leftmost of 6's subtree) replaces 3: 4 → 1, 6; 6 keeps only 7 |
| 8 | two children | successor 10 (10 has no left child) becomes the root: 10 → 3, 14 |

```viz binary-tree
{"title": "Lec 12 Activity 4: the tree after each removal", "tree": "remove 1 = 8, 3, 10, -, 6, -, 14, -, -, 4, 7, -, -, 13 | remove 14 = 8, 3, 10, 1, 6, -, 13, -, -, 4, 7 | remove 6 = 8, 3, 10, 1, 7, -, 14, -, -, 4, -, -, -, 13 | remove 3 = 8, 4, 10, 1, 6, -, 14, -, -, -, 7, -, -, 13 | remove 8 = 10, 3, 14, 1, 6, 13, -, -, -, 4, 7"}
```

**Activity 5 — delete 21 (Hibbard).** 21 has two children. Successor = leftmost of the right subtree: 79 → 73 → **70** (no left child). 70's right child 71 moves up into 70's place (73's left), and 70 replaces 21 at the root.

```viz binary-tree
{"title": "Lec 12 Activity 5: delete 21", "tree": "before = 21, 10, 79, -, -, 73, 95, -, -, -, -, 70, 74, -, -, -, -, -, -, -, -, -, -, -, 71 | after = 70, 10, 79, -, -, 73, 95, -, -, -, -, 71, 74"}
```

### 11.4 Variants

| Question | Answer |
|---|---|
| Delete with the **predecessor** instead | rightmost node of the **left** subtree; its left child moves up. Remove 8 above → 7 becomes the root |
| Which insertion order gives a stick? | sorted or reverse-sorted keys — more generally, any order where each key is the smallest or largest of the keys **not yet inserted** (e.g. 1, 7, 4 gives a zig-zag stick; 4, 1, 7 does not) |
| Height after inserting n keys in sorted order | n − 1; search/insert/delete then cost O(n) |
| Number of compares to find a key | its depth + 1 (a miss: depth of the null link reached) |
| Is the in-order sequence enough to check a BST? | yes — a binary tree is a BST exactly when its in-order traversal is strictly increasing |
| Checking only `left->key < key < right->key` at each node | **not** enough: every key in the left subtree must be smaller, not just the child |

> ⚠️ **Pitfall**: in case 3 the successor is **never** just "the right child" unless that child has no left child (Activity 4, remove 8). Go right once, then left as far as possible.

---

## 12. Heap Sort (Not on the Midterm)

Prof. Yeh confirmed heap sort will **not** be on the midterm. The material stays here for the final — expand it when you need it.

<details>
<summary><b>Heap sort: sortdown, Lecture 12 Activity 1 and analysis (click to expand)</b></summary>

Two phases on the heap's 1-based array: build a heap bottom-up ([§10.2](#102-building-a-heap-bottom-up-lecture-12-activity-parts-13)), then **sortdown** — move the max to the end, shrink the heap, fix the root:

```cpp
while (n > 1) {
    exch(a, 1, n--);
    sink(a, 1, n);
}
```

**Lecture 12 Activity 1: sortdown from 9 6 8 2 5 7.** From the compiled run (the part after `|` is already sorted):

| Step | Array |
|---|---|
| start (heap) | 9 6 8 2 5 7 |
| exch 9 ↔ 7, sink 7 | 8 6 7 2 5 \| 9 |
| exch 8 ↔ 5, sink 5 | 7 6 5 2 \| 8 9 |
| exch 7 ↔ 2, sink 2 | 6 2 5 \| 7 8 9 |
| exch 6 ↔ 5, sink 5 | 5 2 \| 6 7 8 9 |
| exch 5 ↔ 2 | 2 \| 5 6 7 8 9 |

**Worst case of sortdown: O(n log n)** — n − 1 exchanges, each followed by a sink of at most log₂ n levels (2 compares per level).

**Heap sort analysis (Lec 12 slide).**

- Construction: O(n) compares and exchanges. Sortdown and total: **O(n log n)** compares and exchanges, **worst case**, in place (no extra array).
- Versus merge sort: same guarantee, but merge needs O(n) extra space. Versus quick sort: in place too, but quick sort's worst case is O(n²).
- Why it is still not the default: a longer inner loop (higher constant per compare than quick sort), **poor cache locality** (k jumps to 2k: far-apart memory), and **not stable**.
- Key invariant during sortdown: the array is a heap-ordered prefix followed by a suffix in final sorted order.
- On all-equal keys no `sink` ever moves, so heap sort makes only O(n) compares (beyond the slides).
- Quiz 4: heap sort with a **min-heap** moves the minimum to the end each time, so the array ends **largest to smallest** (descending).

</details>

---

## 13. Templates, Pointers, Smart Pointers, 2D Arrays

The early-lecture topics are on the list even though the sample has no question on them. The facts that make good short questions:

**Templates** ([Lec 0](lec-00.en-US.md)):
- A template is a blueprint; `Box<int>` and `Box<double>` are separate, unrelated types created at **compile time**.
- The whole definition must be visible where it is used → `.hpp` (or `.hpp` + `.tpp`), never a separate `.cpp`.
- Constraints on `T` are implicit: list every operation the body performs on a `T` (`<`, copy, assign, `<<`).
- Deduction does no conversion: `myMin(3, 4.5)` fails; write `myMin<double>(3, 4.5)`.

HW 1's `Pair::CompareWith` (compiled; output `[4, 6] > [3, 5]`, `[4.3, 2.1] = [4.3, 2.1]`, `[one, two] < [three, four]`) — it needs only `<` on `TheType`:

```cpp
template<typename TheType>
char Pair<TheType>::CompareWith(Pair<TheType>* otherPair) {
   if (firstVal < otherPair->firstVal) return '<';
   if (otherPair->firstVal < firstVal) return '>';
   if (secondVal < otherPair->secondVal) return '<';
   if (otherPair->secondVal < secondVal) return '>';
   return '=';
}
```

**Randomness** ([Lec 1](lec-01.en-US.md#1-randomness-and-random-number-generation)): seed an engine once (`std::default_random_engine engine{device()};` or a fixed seed for reproducible tests), and always draw through a distribution (`std::uniform_int_distribution<int> d{1, 6}; d(engine)`).

**References and pointers** ([Lec 1](lec-01.en-US.md#2-c-references)):
- A reference is a permanent alias: assigning through it changes the original, it can't be re-bound, and never return a reference to a local.
- `*a = *b` copies the **value**; `a = b` copies the **address** (can leak the old object and set up a double delete).
- `new` without `delete` leaks; using a pointer after `delete` is dangling.

**Smart pointers** ([Lec 1](lec-01.en-US.md#4-smart-pointers-and-ownership), [Lec 2](lec-02.en-US.md#1-smart-pointers-ownership-finished)):

| Type | Ownership | Exam fact |
|---|---|---|
| `unique_ptr` | exactly one owner | copying is a compile error; `std::move` transfers and leaves the source `nullptr` |
| `shared_ptr` | reference counted | object dies with the last owner; parent ↔ child cycles **leak** |
| `weak_ptr` | non-owning | breaks cycles (child → parent); `lock()` before use |

**Multidimensional arrays** ([Lec 2](lec-02.en-US.md#3-multidimensional-arrays)): row-major. For `T a[R][C]`, `a[i][j]` is element `i·C + j` from the start, address `base + (i·C + j)·sizeof(T)`. For `a[D][R][C]`: `(i·R·C + j·C + k)`. HW 2's memory questions: an `int[R][C]` takes 4·R·C bytes (4-byte `int`); a pointer is 8 bytes on a 64-bit machine; 1 GB = 2³⁰ bytes = 2³³ bits.

---

## 14. The Design Question

Expect one question that asks you to **design** a structure with given costs, usually by combining two you know — the way Lab 2's `BalancedList` combines an array and a linked list. A method that works:

1. Write the target table (operation → required bound).
2. For each operation, ask which known structure gives that bound and why (index math → array; O(1) splice at a known spot → linked node; both ends → circular array / DLL).
3. Combine them and check every row of the table, including the worst case of any resize.
4. State the invariant that makes it work, and the assumptions.

**Worked example: Lab 2's `BalancedList`** — target: `add(item)` at the front, `get(index)` and `remove()` from the front in **O(log n)** worst case; `add(index)` / `remove(index)` may be O(n). One design that meets it (mine, not the official solution):

- A singly linked chain of nodes whose capacities **double**: 1, 2, 4, 8, … So n items need only about log₂ n nodes.
- Each node stores its items in a small **circular array**, so adding or removing at either end of one node is O(1). ⚠️ This departs from the lab's starter code, where each node holds a plain ArrayList and the class definition may not change: with an ArrayList, adding at the front of a node shifts the whole node, so the cascade below would cost O(n). On the exam, say which node representation you assume.
- Assume a node is allocated without constructing its slots (or one spare node is kept), so growing the chain by one node doesn't cost O(n).
- `get(i)`: skip whole nodes by their sizes (≤ log n nodes), then index inside the node → O(log n).
- `add(item)` at the front: insert at the front of node 0; if it overflows, move node 0's last item to the front of node 1, and so on down the chain → at most log n O(1) moves → O(log n).
- `remove()` from the front: remove from node 0, then pull the first item of each next node back one node → O(log n).
- Invariant: every node except the last is full, so positions are found by arithmetic on the capacities.

Why the plain unrolled list (10 items per node) is not enough: it has n/10 nodes, so `get` is still O(n). The fix is to make the **number of nodes** logarithmic.

---

## 15. Lab Code to Know by Heart

### 15.1 What each lab contributes

| Lab | Implement from memory | Where |
|---|---|---|
| 1 | a small class with constructor, getters, `toString`; Google Test `EXPECT_EQ` | [Lec 0 §2](lec-00.en-US.md#2-c-unit-tests-with-google-test) |
| 2 | ArrayList `add(i)`, `remove(i)`, `expand`, `shrink`; SLL with tail `get`, `add(i)`, `remove(i)`, `addLast`, `removeLast`; BalancedList idea | [§5](#5-arraylist-and-amortized-analysis), [§6](#6-linked-lists-sample-q3), [§14](#14-the-design-question) |
| 3 | `CircularArray` enqueue/dequeue/resize; `QueueStack` with two queues; postfix calculator | [§7](#7-stacks-queues-and-deques-sample-q4) |
| 4 | selection, insertion (swap version), optimized merge (cutoff + aux), quick with Hoare partition, median-of-three, random pivot | [§8](#8-comparison-sorting-sample-q5) |

### 15.2 The code bank (compiled)

Everything on this page in one place: `CircularLinkedList` (tail only), the one-queue stack in both designs, the two-queue stack, the two-stack queue, the one-stack queue, `CircularArray` with resize, the five sorts with a compare counter, and the mystery methods.

```cpp
template <typename T>
class CircularLinkedList {
    struct Node { T item; Node* next; };
    Node* tail = nullptr;                      // tail->next is the first node
    int count = 0;
public:
    ~CircularLinkedList() { while (count > 0) removeFirst(); }
    void addLast(const T& item);               // §6.3
    void addFirst(const T& item);              // §6.3
    T removeFirst();                           // §6.3
    T removeLast();                            // §6.2
};

template <typename T>
class StackOneQueuePop {                       // §7.2, pop-costly design
    Queue<T> q;                                // top = rear of q
    int n = 0;
public:
    bool isEmpty() { return q.isEmpty(); }
    void push(T item) { q.enqueue(item); n++; }            // O(1)
    T pop() {                                               // O(n)
        if (n == 0) throw std::underflow_error("pop on empty stack");
        for (int i = 0; i < n - 1; i++) q.enqueue(q.dequeue());
        n--;
        return q.dequeue();
    }
};

// Heap sort (not on the midterm) on a 0-based C++ array: heap index k (1..n) lives in a[k-1]
template <typename T>
void sink(T* a, int k, int n) {
    while (2 * k <= n) {
        int j = 2 * k;
        if (j < n && a[j - 1] < a[j]) j++;     // larger child
        if (!(a[k - 1] < a[j - 1])) break;
        std::swap(a[k - 1], a[j - 1]);
        k = j;
    }
}
template <typename T>
void heapSort(T* a, int n) {
    for (int k = n / 2; k >= 1; k--) sink(a, k, n);   // construction, O(n)
    while (n > 1) {                                    // sortdown, O(n log n)
        std::swap(a[0], a[n - 1]);                     // exch(a, 1, n--)
        n--;
        sink(a, 1, n);
    }
}
```

Run output (the driver caps `mystery4` at n = 20, so its last column is 21 calls on every line ≥ 20; all sorts were also checked to produce sorted output on sorted, reversed and all-equal inputs):

```text
== Q3 circular SLL
12 99 37 (count 3)
removeLast -> 37  12 99 (count 2)
addFirst(5): 5 12 99 (count 3)
removeFirst -> 5  12 99 (count 2)
removeLast -> 12  (count 0)
empty: removeLast on empty list
== Q4 stack with one queue
peek 3 pops: 3241 | pop-costly: 321 | two queues: 321
== queue with one stack (recursion)
1234
== circular array with resize
1 cap=4 order: 2 3 4
heap construction [2,9,7,6,5,8] -> 9 6 8 2 5 7
== mystery counts
n=8: 16 3 63 9
n=16: 32 4 255 17
n=1000: 2000 10 999999 21
```

---

## 16. Quick Reference and Last-Night Checklist

**Costs to know cold**

| Structure | O(1) | O(n) | Note |
|---|---|---|---|
| ArrayList | get/set, add/remove at end (amortized) | add/remove at index or front | resize ×2 / ÷2 at ¼ |
| SLL (head) | add/remove first | anything at the end or index | |
| SLL (head + tail) | add/remove first, **add** last | **remove last** | |
| DLL (head + tail) | add/remove at both ends | index ops | |
| Circular array queue/deque | both ends (amortized with resize) | resize copy | unroll from `front` |
| Stack from 1 or 2 queues | pop, peek | push (or the reverse design) | |
| Queue from 2 stacks | enqueue; dequeue amortized | dequeue worst case | transfer only when out is empty |
| Binary heap | max | | insert / delMax O(log n); build O(n) |
| BST | | search / insert / delete in the worst case (stick) | average: search, insert O(log n), Hibbard delete O(√n); in-order = sorted |
| Any tree traversal | | O(n) | recursion uses O(height) stack |

**Last-night checklist**

- [ ] Write the Big-O ladder from memory and order a mixed list of functions.
- [ ] Count `i *= 2`, `i < n*n`, nested `j < i`, and the doubling-outer trap.
- [ ] Solve T(n − 1) + c, T(n − 1) + n, T(n/2) + c, 2T(n/2) + n.
- [ ] Explain why ×2 growth is amortized O(1) and +k growth is O(n).
- [ ] Write `removeLast` / `removeFirst` / `addFirst` on a circular SLL with tail, special cases first.
- [ ] Write a stack from one queue (both designs) and a queue from two stacks, with a trace table.
- [ ] Circular-array index formulas for all four deque operations, plus the resize unroll.
- [ ] Identify a sort from a snapshot; compare counts on sorted / reversed / equal input.
- [ ] Partition an array by hand with the slide's Hoare scheme.
- [ ] Insert into / delMax from a heap by hand (array and tree); build a heap bottom-up and explain why it is O(n).
- [ ] List pre-, in-, post- and level order of a tree; depth vs height; full vs complete.
- [ ] Rebuild a binary tree from its pre-order and in-order (Quiz 4).
- [ ] BST search, insert and all three Hibbard deletion cases by hand; why sorted insertion makes a stick.
- [ ] `unique_ptr` move, `shared_ptr` cycle, row-major address formula.

### Top 5 things to remember

1. The midterm is the sample's five question types with details changed — find the changed detail first, and write your assumptions.
2. Every complexity answer needs the case (worst / amortized) and a one-line reason.
3. A tail pointer makes **adding** at the end O(1), never **removing** it in an SLL; only `prev` fixes that.
4. Building one structure from another: put the expensive work in one operation, and make your complexity answers match the design you wrote.
5. Sorted input: insertion O(n), selection O(n²), merge O(n log n), first-element-pivot quick sort O(n²) — and a BST built from sorted keys is a stick with O(n) operations.

---
title: "Sorting"
summary: "Sorting basics (keys, cost model, memory, stability), selection, insertion, merge, quick and heap sort with their traces, analyses and improvements, and the comparison of all sorts."
topics:
  - sorting
kind: "topic"
order: 504
---

# Information and Computer Science 46 — Topic: Sorting

## Table of Contents

- [1. Sorting Basics](#1-sorting-basics)
- [2. Selection Sort](#2-selection-sort)
- [3. Insertion Sort](#3-insertion-sort)
- [4. Selection vs Insertion Sort](#4-selection-vs-insertion-sort)
- [5. Merge Sort](#5-merge-sort)
- [6. Quick Sort](#6-quick-sort)
- [7. Heap Sort](#7-heap-sort)
- [8. Comparing the Sorts](#8-comparing-the-sorts)
- [9. Complete Implementation](#9-complete-implementation)
- [10. Quick Reference & Top 5 Things to Remember](#10-quick-reference--top-5-things-to-remember)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh. This note gathers sorting from Lectures 7–9, 11 and 12, organized by concept.

## 1. Sorting Basics

### 1.1 Why Study Sorting

1. **Practical utility.** Sorting is everywhere: by price, last name, size, date, zip code. It underlies user interfaces, database queries and data presentation.
2. **Benchmark.** It is a good way to compare the performance of different algorithms on exactly the same problem, and some sorting strategies are tied to specific data structures.
3. **Problem-solving tool.** Sorting your data first is often a good starting point (keep this in mind for interviews). It changes what you can do next: for example, a sorted array allows binary search.

There are many sorting algorithms: adaptive heapsort, bitonic sorter (highly parallel, popular on GPUs), block sort, bubble sort, bucket sort, cascade mergesort, cocktail sort, comb sort, flashsort, gnome sort, **heapsort**, **insertion sort**, library sort, **mergesort**, odd-even sort, pancake sort, **quicksort**, radixsort, **selection sort**, shell sort, spaghetti sort, treesort, and more. The ones in bold are the ones this course studies.

### 1.2 Keys, Compare and Exchange

- **Sorting** arranges the n items of a collection in non-decreasing order, numerically or alphabetically.
- When an item has several components, the **key** is the component we sort by. It decides the relative order. Example: a book can be sorted by title, by author (both alphabetical) or by ISBN (numerical).

Every algorithm here touches the data only through two abstractions:

- **compare**: is `v` less than `w`? In C++ this is `operator<` (overloaded for your type) or a custom comparator function.
- **exchange**: swap `a[i]` and `a[j]`.

```cpp
T temp = a[i];      // manual swap
a[i] = a[j];
a[j] = temp;

std::swap(a[i], a[j]);   // standard library (#include <utility>)
```

### 1.3 Cost Model, Memory and Stability

**Cost model.** We count **compares and exchanges**. For an algorithm that doesn't exchange, count array accesses instead. Not every sort is comparison-based: radix sort, for example, never compares two keys.

**Memory.** Extra memory matters as much as running time.

| Category | Extra memory |
|---|---|
| **In place** | constant or logarithmic extra memory beyond the items being sorted |
| **Not in place** | linear extra memory, proportional to the input size |

**Stability.** A sort is **stable** if items with equal keys come out in the same relative order they went in. Example with cards sorted by rank: input 7♠ 5♥ 2♥ 5♠. A stable sort gives 2♥ **5♥ 5♠** 7♠ (5♥ was first, so it stays first). An unstable sort may give 2♥ **5♠ 5♥** 7♠.

> 📘 **Beyond the lecture** (Thornton, *Comparison-Based Sorting*): stability is what lets you sort by several keys in turn. Sort people by first name, then **stably** by last name. The result is ordered by last name, and people with the same last name stay ordered by first name. An unstable second sort could scramble those ties.

## 2. Selection Sort

### 2.1 Idea and Code

Divide the array into a **sorted subarray on the left** and an **unsorted subarray on the right**. Repeat:

- find the **smallest** element in the unsorted part,
- exchange it with the **leftmost unsorted** element,
- move the boundary one element to the right.

```cpp
#include <utility>// for std::swap
template <typename T>
void selectionSort(T* arr, int size) {
   for (int i = 0; i < size - 1; i++) {
      // Find index of smallest remaining element
      int min = i;
      for (int j = i + 1; j < size; j++) {
         if (arr[j] < arr[min]) {
            min = j;
         }
      }

      // efficient swap using move semantics
      std::swap(arr[i], arr[min]);
   }
}
```

**Invariants.** At the end of iteration i:

- `arr[0…i]` is sorted in ascending order, and
- no entry in `arr[i+1…n−1]` is smaller than any entry in `arr[0…i]`.

So after iteration i, `arr[0…i]` holds the final values for those positions and is never touched again. The last element is automatically in place, which is why the outer loop stops at `size − 1`.

Step through it on the array `3 44 38 5 47 1 36 26` (→ `1 3 5 26 36 38 44 47`):

```viz selection-sort
{"title": "Selection sort on 3 44 38 5 47 1 36 26", "array": [3, 44, 38, 5, 47, 1, 36, 26], "interactive": true}
```

### 2.2 Analysis

- **Comparisons:** iteration i scans n − 1 − i elements, so the total is (n−1) + (n−2) + … + 1 = n(n−1)/2 ≈ n²/2, i.e. **O(n²)**. This is the same for every input, because the scan can't stop early.
- **Exchanges:** one per iteration, n − 1 in total, so **O(n)** (the code also "swaps" when `min == i`).
- **Already sorted?** Still n(n−1)/2 comparisons, so still O(n²). Selection sort can't notice that the data is sorted.
- **In place:** yes, only `i`, `j` and `min` are extra.
- **Stable:** no. The long-distance swap can jump an element over an equal one. Example: `5♥ 5♠ 2♥`. Pass 0 swaps 2♥ with 5♥, giving `2♥ 5♠ 5♥`, so the two fives are now reversed.

Measured with counters on n = 1000 (this matches the formulas: 1000·999/2 = 499,500):

```text
n=1000 sorted:   selection cmps=499500 swaps=999
n=1000 reversed: selection cmps=499500 swaps=999
```

> 📘 **Beyond the lecture** (algs4 §2.1): because selection sort does at most n − 1 exchanges, it is the one to choose when **moving** items is far more expensive than comparing them. algs4's example is a warehouse clerk reordering heavy crates by reading their labels.

### 2.3 Practice

#### Selection sort by hand

**(a)** Using selection sort, sort the array with elements [12, 10, 16, 11, 9, 7]. Visualize your work for every iteration of the algorithm.

**(b)** Runtime analysis:

- What is the Big-O notation of the worst-case running time? Number of comparisons? Number of exchanges?
- What if the data is already sorted?
- Is selection sort in-place? Why?
- Is it stable? Why?

<details>
<summary>Solution</summary>

**(a)** After each iteration i (the sorted prefix is `arr[0…i]`):

| After i | Array | Swapped |
|---|---|---|
| start | 12 10 16 11 9 7 | |
| 0 | **7** 10 16 11 9 12 | 12 ↔ 7 |
| 1 | **7 9** 16 11 10 12 | 10 ↔ 9 |
| 2 | **7 9 10** 11 16 12 | 16 ↔ 10 |
| 3 | **7 9 10 11** 16 12 | 11 is already the min (self-swap) |
| 4 | **7 9 10 11 12 16** | 16 ↔ 12 |

That is 15 comparisons (5 + 4 + 3 + 2 + 1 = 6·5/2) and 5 swaps. Check it below:

```viz selection-sort
{"title": "Selection sort on [12, 10, 16, 11, 9, 7]", "array": [12, 10, 16, 11, 9, 7]}
```

**(b)**

- Worst case **O(n²)**: n(n−1)/2 comparisons, n − 1 exchanges (O(n)).
- Already sorted: **no help**, still n(n−1)/2 comparisons, O(n²). The scan for the minimum always runs to the end.
- **In place:** yes. O(1) extra memory (`i`, `j`, `min`).
- **Not stable:** swapping `arr[i]` with a far-away minimum can jump `arr[i]` over an equal key (`5♥ 5♠ 2♥` → `2♥ 5♠ 5♥`).

</details>

## 3. Insertion Sort

### 3.1 Idea and Code

Keep a *partially* sorted subarray on the left and an unsorted subarray on the right. Repeat:

- take the next element of the unsorted part,
- find where it belongs in the sorted part and insert it there,
- move the boundary one element to the right.

This is how most people sort a hand of cards. Unlike selection sort, the left part is sorted only *relative to itself*: later elements can still be inserted into it.

```cpp
#include <utility>// for std::swap
template <typename T>
void insertionSort(T* arr, int size) {
   for (int i = 0; i < size ; i++) {
      for (int j = i; j > 0; j--) {      // slide: "j–" (see bug note)
         if (arr[j] < arr[j-1]) {
            std::swap(arr[j], arr[j-1]);
         }
         else break;
      }
   }
}
```

> ⚠️ **Slide bug**: the slide has `j–` (an en dash) in the inner loop, which doesn't compile. It must be `j--`. (The outer loop starting at `i = 0` is harmless: pass 0 does nothing.)

The inner loop swaps `arr[j]` **left past every larger neighbour**. At the first neighbour that is not larger it **breaks**: everything further left is sorted, so the element is already in place. That early exit is the whole difference from selection sort.

Step through it on the same array:

```viz insertion-sort
{"title": "Insertion sort on 3 44 38 5 47 1 36 26", "array": [3, 44, 38, 5, 47, 1, 36, 26], "interactive": true}
```

### 3.2 Analysis

| Input | Comparisons | Exchanges | Big-O |
|---|---|---|---|
| **Best**: already sorted | n − 1 (each pass: one compare, then break) | 0 | **O(n)** |
| **Worst**: reverse sorted | n(n−1)/2 (each element travels all the way to the front) | n(n−1)/2 | **O(n²)** |
| Average (random) | ≈ n²/4 | ≈ n²/4 | O(n²) |

```text
n=1000 sorted:   insertion cmps=999    swaps=0
n=1000 reversed: insertion cmps=499500 swaps=499500
```

- **In place:** yes.
- **Stable:** yes. It swaps only when `arr[j] < arr[j-1]` (strictly less), so an element never moves past an equal one. Sorting the cards 7♠ 5♥ 2♥ 5♠ by rank gives `2H 5H 5S 7S`: 5♥ stays ahead of 5♠.

> 📘 **Beyond the lecture** (algs4 §2.1): the number of exchanges insertion sort makes is exactly the number of **inversions**, the pairs of items that are out of order. So on a *partially sorted* array (few inversions, e.g. a sorted list with a few new items appended) insertion sort runs in nearly linear time. This is why it is used for small or nearly sorted inputs.

### 3.3 Practice

#### Insertion sort by hand

**(a)** Using insertion sort, sort the array with elements [12, 10, 16, 11, 9, 7]. Visualize your work for every iteration of the algorithm.

**(b)** Worst-case time complexity?

- Best case: when?
- Number of comparisons? Exchanges?

<details>
<summary>Solution</summary>

**(a)** After each pass i (the sorted prefix is `arr[0…i]`, the inserted element in bold):

| After i | Array | Comparisons | Swaps |
|---|---|---|---|
| 0 | **12** 10 16 11 9 7 | 0 | 0 |
| 1 | **10** 12 16 11 9 7 | 1 | 1 |
| 2 | 10 12 **16** 11 9 7 | 1 (16 > 12, break) | 0 |
| 3 | 10 **11** 12 16 9 7 | 3 (stops at 10) | 2 |
| 4 | **9** 10 11 12 16 7 | 4 (reaches the front) | 4 |
| 5 | **7** 9 10 11 12 16 | 5 (reaches the front) | 5 |

Total: 14 comparisons, 12 swaps. 12 is the number of inversions in the input. Check it below:

```viz insertion-sort
{"title": "Insertion sort on [12, 10, 16, 11, 9, 7]", "array": [12, 10, 16, 11, 9, 7]}
```

**(b)**

- **Worst case O(n²)**, when the input is **reverse sorted**: element i is swapped all the way to the front, so n(n−1)/2 comparisons and n(n−1)/2 exchanges.
- **Best case O(n)**, when the input is **already sorted**: each pass does one comparison, then `break`. That is n − 1 comparisons and 0 exchanges.
- The trap: selection sort's best case is still O(n²). Insertion sort's `break` is what makes its best case linear.

</details>

## 4. Selection vs Insertion Sort

| | Selection sort | Insertion sort |
|---|---|---|
| Comparisons, worst | n(n−1)/2 → O(n²) | n(n−1)/2 → O(n²) (reverse sorted) |
| Comparisons, best | n(n−1)/2 → O(n²) (always) | n − 1 → O(n) (already sorted) |
| Exchanges | n − 1 → O(n), always | 0 (best) to n(n−1)/2 (worst) |
| In place | yes | yes |
| Stable | **no** (long-distance swaps) | **yes** (swaps only adjacent, strictly smaller) |
| Strength | fewest exchanges | fast on sorted / nearly sorted data |

> 💡 **Key Insight**: both are O(n²) in the worst case. Selection sort pays n²/2 comparisons *every* time. Insertion sort pays only for the disorder that is actually there.

Timing both (with merge and quick sort): on 64,000 random ints this swap-based insertion sort is ~9× *slower* than selection sort (each step is a dependent swap rather than a cheap compare, so equal-looking O(n²) costs very different constants); on sorted input it is ~20,000× faster. Table in [section 6.8](#68-pivot-strategies-in-code).

## 5. Merge Sort

### 5.1 The Idea

Merge sort was invented by John von Neumann in 1945 and is "the quintessential example of divide and conquer". The algorithm:

1. **Divide** the array into two halves.
2. **Recursively sort** each half.
3. **Merge** the two sorted halves.

Overview on `M E R G E S O R T E X A M P L E`:

| step | array |
| --- | --- |
| input | M E R G E S O R T E X A M P L E |
| sort left half | E E G M O R R S \| T E X A M P L E |
| sort right half | E E G M O R R S \| A E E L M P T X |
| merge results | A E E E E G L M M O P R R S T X |

> 💡 **Key Insight**: Splitting is trivial (cut at the middle index). All the real work, every comparison, happens in `merge()`.

### 5.2 Merging Two Sorted Halves

`merge` takes `a[lo..mid]` and `a[mid+1..hi]`, which are **each already sorted**, and makes `a[lo..hi]` sorted. It first copies the range into the auxiliary array `aux`, then writes back into `a` one position `k` at a time:

```cpp
template <typename T>
void merge(T* a, T* aux, int lo, int mid, int hi)
{
    for (int k = lo; k <= hi; k++)       // Copy from a to aux
        aux[k] = a[k];

    int i = lo, j = mid + 1;

    for (int k = lo; k <= hi; k++) {     // Merge back into a
        if (i > mid)                     // Left subarray is exhausted
            a[k] = aux[j++];
        else if (j > hi)                 // Right subarray is exhausted
            a[k] = aux[i++];
        else if (aux[j] < aux[i])        // Select from right subarray
            a[k] = aux[j++];
        else                             // Select from left subarray
            a[k] = aux[i++];
    }
}
```

What each index tracks:

- `i` = next unused item of the **left** half in `aux` (valid while `i <= mid`)
- `j` = next unused item of the **right** half in `aux` (valid while `j <= hi`)
- `k` = next slot of `a` to fill

`i > mid` means the left half is used up, `j > hi` means the right half is used up; then the rest is copied without comparing. Only when both halves still have items does the third branch compare `aux[j] < aux[i]`, and the smaller one wins. The "cards demo": two sorted piles face up, always take the smaller top card.

Merging `aux = A G L O R | H I M S T` (lo = 0, mid = 4, hi = 9):

| k | case | assignment | a after |
| --- | --- | --- | --- |
| 0 | aux[i] < aux[j] (A vs H) | a[0] = aux[0] | **A** |
| 1 | G vs H | a[1] = aux[1] | A **G** |
| 2 | aux[i] > aux[j] (L vs H) | a[2] = aux[5] | A G **H** |
| 3 | L vs I | a[3] = aux[6] | A G H **I** |
| 4 | L vs M | a[4] = aux[2] | … **L** |
| 5 | O vs M | a[5] = aux[7] | … **M** |
| 6 | O vs S | a[6] = aux[3] | … **O** |
| 7 | R vs S | a[7] = aux[4] | … **R** |
| 8 | i > mid | a[8] = aux[8] | … **S** |
| 9 | i > mid | a[9] = aux[9] | A G H I L M O R S T |

Step through it below (← / → keys work when the demo is focused):

```viz merge-sort
{"title": "Merge A G L O R | H I M S T", "items": "A, G, L, O, R, H, I, M, S, T", "mode": "merge", "mid": 4}
```

> ⚠️ **Pitfall**: `merge` is only correct if both halves are already sorted. It never looks back, so an unsorted half just comes out in its original order mixed with the other half.

### 5.3 The Recursive sort and the Wrapper

```cpp
template <typename T>
void sort(T* a, T* aux, int lo, int hi)
{
    if (hi <= lo)                        // Base case for recursion
        return;

    int mid = lo + (hi - lo) / 2;        // calculate midpoint, split in half
    sort(a, aux, lo, mid);               // recursively sort left subarray
    sort(a, aux, mid+1, hi);             // recursively sort right subarray
    merge(a, aux, lo, mid, hi);          // merge left and right
}

template <typename T>
void sort(T* a, int length)
{
    T* aux = new T[length];              // Dynamically allocate aux array
    sort(a, aux, 0, length - 1);
    delete[] aux;
}
```

- `lo` and `hi` are **inclusive**, so the wrapper passes `length - 1`.
- Base case `hi <= lo`: a range of 0 or 1 items is already sorted.
- `mid = lo + (hi - lo) / 2` equals `(lo + hi) / 2` but cannot overflow `int`. Left half `lo..mid` gets the extra item when the length is odd.
- The two `sort` functions are **overloads**. The user calls `sort(a, length)`; the wrapper allocates `aux` **once** and passes it down, instead of allocating inside every `merge`.
- `new T[length]` pairs with `delete[]`.

`std::sort` and `std::merge` are already in `<algorithm>`; we write our own to understand them.

### 5.4 Tracing Merge Sort

Follow `sort([M,E,R,G,E,S,R,T])`. The call order is **depth-first**: keep going left until a base case (picture a brick wall), then do the right side, then merge on the way back up.

| call | what happens | a afterwards |
| --- | --- | --- |
| sort(0,7) | mid = 3, go left | M E R G E S R T |
| sort(0,3) | mid = 1, go left | |
| sort(0,1) | mid = 0; sort(0,0) and sort(1,1) hit the base case; merge(0,0,1) | **E M** R G E S R T |
| sort(2,3) | sort(2,2), sort(3,3) return; merge(2,2,3) | E M **G R** E S R T |
| back in sort(0,3) | merge(0,1,3) | **E G M R** E S R T |
| sort(4,7) | same pattern on E S R T | E G M R **E R S T** |
| back in sort(0,7) | merge(0,3,7) | **E E G M R R S T** |

The whole recursion tree: `MERG | ESRT` → `ME RG ES RT` → single letters → `EM GR ES RT` → `EGMR ERST` → `EEGMRRST`. The `aux` array keeps old copies between merges (e.g. `[M, E, R, G, , , , ]`); that is harmless because each `merge` re-copies its own range first.

Step through the whole recursion (edit the items to try your own):

```viz merge-sort
{"title": "sort M E R G E S R T", "items": "M, E, R, G, E, S, R, T", "interactive": true}
```

### 5.5 Analysis of Merge Sort

**Why it matters:** with 10¹⁰ comparisons/s (laptop) vs 10¹⁷ (supercomputer):

| computer | insertion sort: thousand | million | billion | mergesort: thousand | million | billion |
| --- | --- | --- | --- | --- | --- | --- |
| laptop | instant | 2 hours | 300 years | instant | 1 sec | 15 min |
| supercomputer | instant | 1 sec | 1 week | instant | instant | instant |

A laptop running merge sort beats a supercomputer running insertion sort: good algorithms are better than supercomputers.

**Counting comparisons.** One `merge` of n items makes at most **n − 1** comparisons: each comparison places one item, and the last item is always placed without one (the other half is already empty). So the worst-case count satisfies

$$C(n) = 2\,C(n/2) + (n - 1), \qquad C(1) = 0$$

(the two recursive sorts, plus the final merge; computing `mid` costs no comparisons). For growth order, write $T(n) = 2T(n/2) + n$.

- **Recursion tree**: level k has 2ᵏ subproblems of size n/2ᵏ, so each level merges n items in total. Halving n until it reaches 1 takes log₂ n levels. Total ≈ n · log₂ n. Exactly, $C(n) = n\log_2 n - n + 1$ for n a power of 2 (n = 8 → 17).
- **Master theorem** ($T(n) = aT(n/b) + n^d$): a = 2, b = 2, d = 1, and a = bᵈ, so $T(n) = \Theta(n^d \log n) = \Theta(n \log n)$.

Counting all work (copies to `aux`, index updates) instead of comparisons only changes the constant: each `merge` is still Θ(n), so the answer is the same **Θ(n log n)** in the best, average and worst case.

Merging two sorted halves of n/2 each takes between ~n/2 comparisons (one half runs out first, e.g. `1 2 3 | 4 5 6` → 3) and n − 1 (the halves interleave, e.g. `1 3 5 | 2 4 6` → 5).

> 📘 **Beyond the lecture**: algs4 §2.2 states the full range: merge sort uses between ½ n lg n and n lg n comparisons for any input of size n. The best case is half the worst because one merge needs at least n/2 comparisons (one half runs out first).

### 5.6 Properties and Improvements

- **Extra memory ∝ n**: `aux` must hold n items for the last merge.
- **Not in-place** in its simplest form. There are modifications that halve the auxiliary array, but a truly in-place merge is very hard.
- **Stable**: equal keys keep their original order. In `merge`, the right item is taken only if `aux[j] < aux[i]`; on a tie the `else` branch takes the **left** one, which came first.

Improvements:

1. Use **insertion sort** for small subarrays.
2. **Stop** if already sorted.
3. **Eliminate the copy** to the auxiliary array to save time.

> 📘 **Beyond the lecture**: what the three improvements mean concretely (algs4 §2.2): (1) cutting off to insertion sort below ~10–15 items speeds up a typical merge sort by 10–15%; (2) skip `merge` when `a[mid] <= a[mid+1]`, which makes an already sorted input linear; (3) alternate the roles of `a` and `aux` at each recursion level, saving the copy time (not the space).

> ⚠️ **Pitfall**: change the tie-break to `aux[j] <= aux[i]` and merge sort is no longer stable (equal items from the right jump ahead).

### 5.7 Improvements in Code: Cutoff and Skip Check

The TimingSort project's `MergeOptimized` builds improvements 1 and 2 into the recursive helper. Same algorithm as [section 5.3](#53-the-recursive-sort-and-the-wrapper), but on `std::vector<T>&`, with `aux` allocated once in `sort()`:

```cpp
template <typename T>
void MergeOptimized<T>::mergeSortHelper(std::vector<T>& data,
        std::vector<T>& aux, int lo, int hi)
{
    if (hi <= lo) return;

    // 1. small range: insertion sort on data[lo..hi]
    if (insertionSortThreshold > 0 &&
        hi - lo + 1 <= insertionSortThreshold) {
        for (int i = lo + 1; i <= hi; ++i)
            for (int j = i; j > lo && data[j] < data[j - 1]; --j)
                std::swap(data[j], data[j - 1]);
        return;
    }

    int mid = lo + (hi - lo) / 2;
    mergeSortHelper(data, aux, lo, mid);
    mergeSortHelper(data, aux, mid + 1, hi);

    // 2. halves already in order: nothing to merge
    if (data[mid] <= data[mid + 1]) return;
    merge(data, aux, lo, mid, hi);
}
```

- **Threshold ≤ 0 turns the cutoff off.** The constructor's default threshold is `-1` (no cutoff, `MergeOptimized<int>()`), and `name()` prints `MergeSort: 32` only when it is on.
- **Skip check**: on already sorted input every `merge` is skipped, so the whole sort costs T(n) = 2T(n/2) + 1 = **Θ(n)** (n − 1 comparisons). Neither change moves equal keys past each other, so the sort **stays stable** (the project's `IsStable` test checks this).
- **Measured** (g++ -O2, 64,000 ints): random 6.5 ms without cutoff vs 8.6 ms (cutoff 32) and 12.0 ms (cutoff 64); sorted 0.34 ms vs 0.08 ms. A separate benchmark on 2²⁰ random ints (best of 5): no cutoff 128 ms, cutoff 8 → 130, 16 → 140, 32 → 169, 64 → 221. So with this swap-based insertion sort the cutoff only pays off on (nearly) sorted data, and 32/64 is far above algs4's ~10–15. Table in [section 6.8](#68-pivot-strategies-in-code).

> ⚠️ **Pitfall**: the insertion sort inside the helper must stop at `j > lo`, not `j > 0`. With `j > 0` it keeps swapping into the neighbouring subarray, which the recursion has not finished yet.

### 5.8 Merging Without the Exhaustion Checks

A faster `merge` removes the first two tests, `i > mid` and `j > hi` (algs4 exercise 2.2.10, "faster merge"). The trick: copy the right half into `aux` **in reverse**. Then `aux[lo..hi]` rises through the left half and falls through the right half, and the largest item of each half sits next to the middle. When one half runs out, its pointer moves onto the other half's **largest** item, which is never smaller than anything still waiting, so it acts as a sentinel and no bounds checks are needed. Merge from both ends: `i` moves right from `lo`, `j` moves left from `hi`.

```cpp
template <typename T>
void merge(T* a, T* aux, int lo, int mid, int hi)
{
    for (int k = lo; k <= mid; ++k) {
        aux[k] = a[k];
    }

    for (int k = mid + 1; k <= hi; ++k) {
        aux[k] = a[hi + mid + 1 - k];
    }

    int i = lo;
    int j = hi;

    for (int k = lo; k <= hi; ++k) {
        if (aux[j] < aux[i]) {
            a[k] = aux[j--];
        }
        else {
            a[k] = aux[i++];
        }
    }
}
```

Example with the halves of [section 5.2](#52-merging-two-sorted-halves): `A G L O R | H I M S T` is copied as `aux = A G L O R T S M I H`. The merge takes A, G (left), H, I, (right from the end) … and after R the left pointer moves onto T, so S and T come out in order without any `i > mid` test.

- Index check: `k = mid + 1` copies `a[hi]`, `k = hi` copies `a[mid + 1]`, so the second loop reverses exactly the right half.
- Cost: one comparison per step instead of up to three, still Θ(n) per merge and **Θ(n log n)** overall. Same separate benchmark (2²⁰ random ints): 118 ms vs 128 ms (~8% faster).
- **Not stable.** Once the left half is used up, `i` walks into the reversed right half, and on a tie the `else` branch takes `aux[i]`, the item that came *later*. Example: `(1a) | (2b 2c)` → `aux = 1a 2c 2b` → result `1a 2c 2b`. That's why a merge that must stay stable keeps the four-branch version from [section 5.2](#52-merging-two-sorted-halves).

> ⚠️ **Pitfall**: two easy slips in this version. The first copy loop must start at `lo`, not `0` (copying from 0 makes each merge cost O(hi), and the whole sort O(n²)). And the left pointer moves forward (`aux[i++]`); only `j` counts down.

### 5.9 Practice

#### Comparisons in merge

How many calls does `merge()` make to `<` in order to merge two already sorted subarrays, each of length n/2, into a sorted array of length n?

A. ~ n/4 to ~ n/2
B. ~ n/2
C. ~ n/2 to n
D. ~ n
E. ~ n to 2n

Provide a best case example and a worst case example (use 3 elements in each sorted subarray).

> Hint: every comparison places exactly one item; no comparisons happen once a half runs out.

<details>
<summary>Solution</summary>

**Solution: C.** Best case: one half runs out after n/2 comparisons, e.g. `1 2 3 | 4 5 6` → 3 comparisons (1, 2, 3 each beat 4; then 4 5 6 are copied). Worst case: the halves interleave so neither runs out until the end, e.g. `1 3 5 | 2 4 6` → 5 = n − 1 comparisons. So between ~n/2 and ~n. Check the worst case:

```viz merge-sort
{"title": "Worst case: 1 3 5 | 2 4 6", "items": "1, 3, 5, 2, 4, 6", "mode": "merge", "mid": 2}
```

</details>

#### Subarray lengths

Which of the following subarray lengths will occur when running merge sort on an array of length 10?

A. { 1, 2, 3, 5, 7, 10 }
B. { 2, 4, 6, 8, 10 }
C. { 1, 2, 5, 10 }
D. { 1, 2, 3, 4, 5, 10 }
E. { 1, 2, 3, 5, 10 }

<details>
<summary>Solution</summary>

**Solution: E.** A length-n range splits into ⌈n/2⌉ (left, it gets `mid`) and ⌊n/2⌋: 10 → 5 + 5, 5 → 3 + 2, 3 → 2 + 1, 2 → 1 + 1. Lengths: 10, 5, 3, 2, 1. A has 7, B and D have even lengths that never appear (and B lacks 1, which every recursion reaches), C misses 3.

</details>

#### Worst-case analysis of merge sort

**(a)** Analyze the worst-case time complexity of merge sort (number of comparisons).
**(b)** Write the recurrence to describe worst-case time complexity.
**(c)** Use recursion tree or master theorem to solve the recurrence.

<details>
<summary>Solution</summary>

**(a)** All comparisons happen in `merge`; merging n items takes at most n − 1. **(b)** $C(n) = 2C(n/2) + (n - 1)$, $C(1) = 0$; as growth order $T(n) = 2T(n/2) + n$. **(c)** Tree: log₂ n levels × n per level = n log₂ n (exactly n log₂ n − n + 1). Master theorem: a = 2, b = 2, d = 1, a = bᵈ → Θ(n log n).

</details>

## 6. Quick Sort

### 6.1 Background and the Idea

Quick sort is also divide-and-conquer, invented by Sir Tony Hoare in 1959. He wanted to sort words before looking them up in a dictionary, came up with quicksort but did not know how to implement it, then learned Algol 60 and recursion and implemented it. He won the 1980 Turing Award (and also invented null, which he regretted).

Unlike merge sort, the work happens **before** the recursion instead of after it:

1. **Shuffle** the array (randomly).
2. **Partition** so that, for some pivot index `j`:
   - entry `a[j]` is in its final place,
   - no larger entry is to the left of `j`,
   - no smaller entry is to the right of `j`.
3. **Sort** each subarray recursively. There is no merge step — once both sides are sorted, the whole array is sorted.

| | before | after partition |
|---|---|---|
| layout | `v` (pivot at `lo`), then unknowns up to `hi` | `≤ v` … `v` (at `j`) … `≥ v` |

The recursive driver plus the public entry point:

```cpp
#include <random>
#include <utility>

// quicksort
template <typename T>
void sort(T* a, int lo, int hi)
{
    if (hi <= lo) return;
    int j = partition(a, lo, hi);
    sort(a, lo, j-1);
    sort(a, j+1, hi);
}

template <typename T>
void sort(T* a, int length) {
    std::random_device device;                          // Random shuffle
    std::default_random_engine engine{device()};
    std::shuffle(std::begin(a), std::end(a), engine);

    sort(a, 0, length-1);
}
```

Example (from algs4): input `Q U I C K S O R T E X A M P L E` → shuffle → `K R A T E L E P U I M Q C X O S` → partition on `K` → `E C A I E K L P U T M Q R X O S` → sort left → sort right → `A C E E I K L M O P Q R S T U X`.

> ⚠️ **Slide bugs** (the code as shown on the slides):
> `std::shuffle(std::begin(a), std::end(a), engine)` does not compile — `a` is a `T*`, and `std::begin`/`std::end` need an array or container. Fix: `std::shuffle(a, a + length, engine);`
> `std::shuffle` is declared in `<algorithm>`, which the slide doesn't include. Fix: add `#include <algorithm>`.

> 💡 **Key Insight**: Merge sort = trivial split, hard combine. Quick sort = hard split (partition), trivial combine. Each partition puts **one** element (the pivot) in its final position, which is why the recursion always terminates — each subarray is strictly smaller.

### 6.2 Partitioning

Goal: rearrange `a[lo..hi]` so that `a[lo..j-1] <= a[j] <= a[j+1..hi]`.

- The pivot `v` is `a[lo]` ("simplest method"). Pointer `i` starts at `lo`, `j` at `hi + 1`.
- Repeat until `i` and `j` cross:
  - scan `i` left→right **while `a[i] < v`** (stop at a key **≥** the pivot);
  - scan `j` right→left **while `v < a[j]`** (stop at a key **≤** the pivot);
  - if `i >= j`, break;
  - exchange `a[i]` with `a[j]`.
- Finally exchange `a[lo]` with `a[j]` and return `j`.

Why swap with `a[j]` and not `a[i]`? When the scans cross, `j` sits on the last element of the `≤ v` region, so swapping the pivot there keeps everything left of it `≤ v`.

```cpp
template <typename T>
int partition(T* a, int lo, int hi) {
    int i = lo;
    int j = hi + 1;
    T v = a[lo];
    while (true) {

        // Move i to the right for elements < v

        while (i < hi && a[++i] < v) {
            if (i == hi) break;
        }
        // Move j to the left for elements > v

        while (v < a[--j]) {
            if (j == lo) break;
        }
        if (i >= j) break;         // If pointers cross, stop

        std::swap(a[i], a[j]);     // Swap elements at i and j
    }
    // Place the partitioning item in its correct position
    std::swap(a[lo], a[j]);
    return j;
}
```

The `i == hi` / `j == lo` guards keep the scans inside the subarray when the pivot is the largest or smallest key. (The `j == lo` guard is actually redundant — `a[lo]` is `v` itself and `v < v` is false — but it's harmless.) The slide title spells the name "Sedgwick"; it's Robert **Sedgewick**.

> ⚠️ **Pitfall**: Pre-increment matters. `a[++i]` moves first, then compares, so the first element `i` looks at is `a[lo+1]` (the pivot is skipped). Likewise `a[--j]` starts at `a[hi]` because `j` begins at `hi + 1`.

> 📘 **Beyond the lecture**: Both scans **stop on keys equal to the pivot** (`<`, not `<=`). That looks like it causes useless swaps, but it is what keeps quick sort fast on arrays full of duplicates: with all-equal keys, stopping makes `i` and `j` meet in the middle (an even split → n log n), while not stopping would run one pointer to the end and give a 0 / n−1 split → quadratic time (algs4 §2.3).

### 6.3 Tracing One Partition

The first partition of the shuffled array `K R A T E L E P U I M Q C X O S` with `v = K`:

| round | `i` stops at | `j` stops at | action | array after |
|---|---|---|---|---|
| 1 | 1 (`R` ≥ K) | 12 (`C` ≤ K) | swap | `K C A T E L E P U I M Q R X O S` |
| 2 | 3 (`T`) | 9 (`I`) | swap | `K C A I E L E P U T M Q R X O S` |
| 3 | 5 (`L`) | 6 (`E`) | swap | `K C A I E E L P U T M Q R X O S` |
| 4 | 6 (`L`) | 5 (`E`) | `i >= j` → break | — |
| end | | | `swap(a[0], a[5])`, return 5 | `E C A I E K L P U T M Q R X O S` |

After it: `K` is at index 5 for good, everything left of it is `≤ K`, everything right is `≥ K`. Then `sort` recurses on `lo = 0, hi = 4` (starting with `E C A I E`, `i = 0`, `j = 5`).

Step through it below (← / → keys work when the demo is focused):

```viz quick-sort
{"title": "partition(a, 0, 15), v = K", "items": "K, R, A, T, E, L, E, P, U, I, M, Q, C, X, O, S", "mode": "partition"}
```

### 6.4 Full Sort Trace

algs4's trace lists every `partition` call. Each row is the array after partitioning `a[lo..hi]` around the pivot that ends up at `j`; rows with `lo == hi` (or `hi < lo`) are size-1/0 subarrays — **no partition** happens, `sort` just returns.

| lo | j | hi | array after this call |
|---|---|---|---|
| 0 | 5 | 15 | E C A I E **K** L P U T M Q R X O S |
| 0 | 3 | 4 | E C A **E** I K L P U T M Q R X O S |
| 0 | 2 | 2 | A C **E** E I K … |
| 0 | 0 | 1 | **A** C E E I K … |
| 6 | 6 | 15 | A C E E I K **L** P U T M Q R X O S |
| 7 | 9 | 15 | … L M O **P** T Q R X U S |
| 7 | 7 | 8 | … L **M** O P … |
| 10 | 13 | 15 | … P S Q R **T** U X |
| 10 | 12 | 12 | … P R Q **S** T U X |
| 10 | 11 | 11 | … P Q **R** S T U X |
| 14 | 14 | 15 | … T **U** X |
| | | | A C E E I K L M O P Q R S T U X |

In the usual colouring of this trace, **pink** marks the left call `sort(a, lo, j-1)`, **blue** the right call `sort(a, j+1, hi)`, **red** the pivot. Notice the order: the left subarray is completely sorted before the right one is touched (depth-first recursion).

```viz quick-sort
{"title": "Full quick sort of the shuffled array", "items": "K, R, A, T, E, L, E, P, U, I, M, Q, C, X, O, S", "mode": "sort", "interactive": true}
```

### 6.5 Analysis: Worst, Best, Average

One call to `partition` on `n` elements is **O(n)**: `i` and `j` together sweep the subarray once (about n + 1 compares). So everything depends on **where the pivot lands**.

| case | scenario | recurrence | solution |
|---|---|---|---|
| worst | pivot is always the smallest or largest key → splits of 0 and n−1 (e.g. already sorted or reverse-sorted input with no shuffle) | T(n) = T(n−1) + n | n + (n−1) + … + 2 ≈ n²/2 → **O(n²)** |
| best | pivot is always the median → two halves | T(n) = 2T(n/2) + n | lg n levels × n work per level → **O(n log n)** |
| average | random shuffle → pivot rank is uniformly random | — | **O(n log n)** |

Measured with the code above (no shuffle, sorted input of size n): n = 100 → 5,148 compares, n = 200 → 20,298, n = 400 → 80,598 — about n²/2, quadrupling each time n doubles. The same sorted input of size 1,000 **with** the shuffle took 12,083 compares.

What reduces the chance of the worst case? The **random shuffle** at the start: no fixed input (sorted, reversed, …) is bad any more; only unlucky random choices are, and those are vanishingly unlikely for large n. That's the "probabilistic guarantee".

> 📘 **Beyond the lecture**: The average is about **2n ln n ≈ 1.39 n lg n** compares (algs4 §2.3), while merge sort uses at most about n lg n. That ratio is where "39% more compares than merge sort" comes from.

### 6.6 Properties

- **39% more compares than merge sort, but faster in practice.** Why:
  - fewer data moves (merge sort copies every element to `aux` and back at every level);
  - good cache behavior — partition scans memory sequentially, which works well with prefetch;
  - no extra memory allocation.
- **Random shuffle** gives a probabilistic guarantee against the worst case.
- O(n log n) average, O(n²) worst.
- **In-place**: only swaps inside the array (plus the recursion stack).
- **Not stable**: long-distance swaps can reorder equal keys. Example from the practice problem below: partitioning `5 8 7 9 5 4` around the first `5` ends with `swap(a[lo], a[j])` exchanging the two `5`s.

Quick sort's performance shows Big-O is an **incomplete model** of real-world performance: it has the worst Big-O of the n log n sorts and is still the fastest.

### 6.7 Improvements

1. **For small subarrays, use insertion sort** — recursion overhead dominates on tiny subarrays, and insertion sort is fast there (same trick as merge sort, [section 5.6](#56-properties-and-improvements)).
2. **Improve pivot selection** (and drop the up-front random shuffle):
   - use a **random element** as the pivot (swap it into `a[lo]`, then partition as usual);
   - use the **median of a small sample** as the pivot — a better split on average.

> 📘 **Beyond the lecture**: algs4 suggests a cutoff anywhere from about 5 to 15 elements for switching to insertion sort, and says a sample of **3** (median-of-three) captures most of the benefit of median-of-sample.

Animated "dance" videos exist for [merge sort](https://www.youtube.com/watch?v=XaqR3G_NVoo) and [quick sort](https://www.youtube.com/watch?v=3San3uKKHgg) — the quick sort dance uses a **different partition variant** than the one here, so don't use it to check traces.

### 6.8 Pivot Strategies in Code

The TimingSort project's `QuickOptimized` implements improvement 2 with **no up-front shuffle**. The constructor takes `"LO"` (default), `"MEDIAN"` or `"RANDOM"`, and `choosePivot` runs before every `partition`. Whatever it picks is **swapped into `data[lo]`**, so `partition` stays exactly the code of [section 6.2](#62-partitioning) (pivot `v = a[lo]`).

```cpp
// MEDIAN: order a[lo], a[mid], a[hi],
// then move the median into a[lo]
int mid = lo + (hi - lo) / 2;
if (a[mid] < a[lo]) std::swap(a[lo], a[mid]);
if (a[hi] < a[lo])  std::swap(a[lo], a[hi]);
if (a[hi] < a[mid]) std::swap(a[mid], a[hi]);
std::swap(a[lo], a[mid]);

// RANDOM: any index in [lo, hi] (inclusive)
std::uniform_int_distribution<int> dist{lo, hi};
std::swap(a[lo], a[dist(rng)]);
```

- After the three compare-swaps, `a[lo] <= a[mid] <= a[hi]`, so `a[mid]` is the median of the three; the last swap moves it to `lo`. Anything else that is not `"MEDIAN"`/`"RANDOM"` falls back to `"LO"` (pivot = first element).
- `rng` is a member (`std::mt19937 rng{std::random_device{}()};`), seeded once. Creating a `random_device` on every call is slow.
- **Why it matters — sorted input.** With `"LO"` the pivot is the smallest key every time, so each partition splits 0 / n−1: ~n²/2 compares and recursion depth n (a deep enough input overflows the stack). Median-of-three picks the true middle of a sorted range, so the top-level split is perfect and the ones below stay near-perfect; a random pivot gives the probabilistic n log n guarantee that the shuffle used to give.

Measured (g++ -O2, one run, ms):

| n = 64,000 | Selection | Insertion | Merge | Merge, cutoff 32 | Quick LO | Quick MEDIAN | Quick RANDOM |
|---|---|---|---|---|---|---|---|
| random | 836 | 7,766 | 6.5 | 8.6 | 5.2 | 6.2 | 5.5 |
| already sorted | 871 | 0.04 | 0.34 | 0.08 | **983** | 0.72 | 1.95 |

The table is the point of [section 6.6](#66-properties) in numbers: quick sort is the fastest on random data but quadratic with a bad pivot; insertion sort is the fastest of all on sorted data and the slowest on random data, even slower than selection sort with the same O(n²), because every step of the swap-based version is a dependent swap rather than a cheap compare. Merge sort tuning (cutoff, skip check) is in [section 5.7](#57-improvements-in-code-cutoff-and-skip-check).

> ⚠️ **Pitfall**: `medianOfThree` / `randomPivot` must leave the pivot **in `a[lo]`**, because `partition` assumes it. Returning the pivot value but leaving it at `mid` (or at the random index) partitions around the wrong element.

### 6.9 Practice

#### Quick sort by hand

Sort the following with quick sort, assuming `a[lo]` is the pivot:

| 3 | 7 | 8 | 5 | 2 | 1 | 9 | 5 | 4 |
|---|---|---|---|---|---|---|---|---|

(Visualgo's quicksort implementation is different from what is presented here.)

> Hint: no shuffle; run `partition` exactly as coded — `i` stops on ≥ pivot, `j` stops on ≤ pivot.

<details>
<summary>Solution</summary>

First partition, `lo = 0, hi = 8`, `v = 3`:

| round | `i` stops | `j` stops | action | array |
|---|---|---|---|---|
| 1 | 1 (7) | 5 (1) | swap | 3 1 8 5 2 7 9 5 4 |
| 2 | 2 (8) | 4 (2) | swap | 3 1 2 5 8 7 9 5 4 |
| 3 | 3 (5) | 2 (2) | cross → break | |
| end | | | swap a[0], a[2]; j = 2 | 2 1 **3** 5 8 7 9 5 4 |

All calls:

| lo | j | hi | array after |
|---|---|---|---|
| 0 | 2 | 8 | 2 1 **3** 5 8 7 9 5 4 |
| 0 | 1 | 1 | 1 **2** 3 5 8 7 9 5 4 |
| 3 | 5 | 8 | 1 2 3 5 4 **5** 9 7 8 |
| 3 | 4 | 4 | 1 2 3 4 **5** 5 9 7 8 |
| 6 | 8 | 8 | 1 2 3 4 5 5 8 7 **9** |
| 6 | 7 | 7 | 1 2 3 4 5 5 7 **8** 9 |
| | | | 1 2 3 4 5 5 7 8 9 |

The trap is the call on `5 8 7 9 5 4` (`v = 5`): `j` stops on the second `5` because it's **equal** to the pivot (`5 < 5` is false), so the two `5`s get swapped — quick sort is not stable. Check it step by step:

```viz quick-sort
{"title": "Quick sort by hand: 3 7 8 5 2 1 9 5 4", "items": "3, 7, 8, 5, 2, 1, 9, 5, 4", "mode": "sort"}
```

</details>

#### Quick sort analysis

**Worst Case Analysis**
**(a)** Scenario — when does this occur?
**(b)** Mathematical model — identify then solve the recurrence.

**Best Case Analysis**
**(c)** Scenario — when does this occur?
**(d)** Mathematical model — identify then solve the recurrence.

**(e)** What reduces the likelihood of the worst case happening?

<details>
<summary>Solution</summary>

**(a)** Every pivot is the smallest (or largest) key of its subarray, so each partition peels off just one element: one side is empty, the other has n − 1. With pivot = `a[lo]` and no shuffle, an already-sorted (or reverse-sorted) array does this.

**(b)** T(n) = T(n − 1) + n (partition is O(n)). Unrolling: n + (n − 1) + … + 2 ≈ n²/2 → **O(n²)**.

**(c)** Every pivot lands in the middle (it's the median), splitting into two halves.

**(d)** T(n) = 2T(n/2) + n — the merge sort recurrence: lg n levels, n work per level → **O(n log n)**.

**(e)** The **random shuffle** before sorting (or a random / median-of-sample pivot): the worst case then needs extremely unlucky random choices instead of a common input like a sorted array.

</details>

## 7. Heap Sort

### 7.1 The Plan

Use a heap ([Heaps](topic-heaps.en-US.md)) to sort in two steps:

1. **Heap construction** — build a binary heap from all n keys to be sorted;
2. **Sortdown** — repeatedly remove and return the maximum key.

Example: a max-heap of the 9 keys 1, 2, 3, 7, 17, 19, 25, 36, 100 gives them back from nine delete-max calls as `100 36 25 19 17 7 3 2 1` — sorted in decreasing order. Because `exch(1, n--)` parks each removed max just past the end of the shrinking heap, the array itself ends up sorted ascending: `– 1 2 3 7 17 19 25 36 100`. That in-place trick is the sortdown ([section 7.6](#76-sortdown)).

Phase 2 is always the same. Phase 1 can be done in **two ways**, and they are easy to mix up because both end with a heap. They differ in direction, in the operation they use (swim vs sink), and in cost. Both are shown below on the array `[2, 9, 7, 6, 5, 8]` (n = 6).

### 7.2 Method A: Naive Top-Down Construction

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

### 7.3 Method B: Bottom-Up Construction

Take the whole array **as it is** as a complete binary tree. Leaves (`a[n/2+1..n]`) are already one-key heaps, so skip them. Go **right to left** over the internal nodes and **sink** each one:

```cpp
for (int k = n/2; k >= 1; k--)
    sink(a, k, n);
```

**Key insight:** after `sink(a, k, n)` completes, the subtree rooted at k is a heap. Sinking right to left means both children of k are already heaps when k is processed, so one sink fixes the whole subtree; after `sink(a, 1, n)` the whole array is a heap.

**Why does n/2 give the first node to process?** Node k has a left child exactly when 2k ≤ n, i.e. k ≤ n/2. The last node, n, has parent ⌊n/2⌋, so ⌊n/2⌋ is the last node with any child; every index above it is a leaf. With n = 11 the loop starts at k = 5.

`sink(a, k, n)` is the heap's `sink` taking the array and its size as arguments (so heap sort can work on any array); its body is the same as `sink(k)` in [Heaps](topic-heaps.en-US.md).

On `[2, 9, 7, 6, 5, 8]` (n = 6, so the loop starts at k = 6/2 = 3):

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

A longer trace on `S O R T E X A M P L E` (n = 11):

| Step | Call | What moves | Array after |
|---|---|---|---|
| a) | start (arbitrary order) | — | S O R T E X A M P L E |
| b) | sink(5, 11) | E swaps with its larger child L | S O R T L X A M P E E |
| c) | sink(4, 11) | T ≥ M, P: no move | S O R T L X A M P E E |
| d) | sink(3, 11) | R swaps with X | S O X T L R A M P E E |
| e) | sink(2, 11) | O swaps with T, then with P | S T X P L R A M O E E |
| f) | sink(1, 11) | S swaps with X, stops above R and A | X T S P L R A M O E E |

```viz binary-heap
{"title": "Bottom-up heap construction on S O R T E X A M P L E", "heap": "S, O, R, T, E, X, A, M, P, L, E", "ops": "heapify()", "interactive": true}
```

**Cost:** **O(n)** — most nodes sit near the bottom and can sink only a little; [section 7.5](#75-why-bottom-up-construction-is-on) adds it up.

### 7.4 The Two Methods Side by Side

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

On the array above both methods happen to produce the same heap. In general they don't (the last row): both results are valid heaps, just different ones. So a question asking for the "bottom-up" result must be answered with method B.

> ⚠️ **Pitfall**: Method B's loop runs **right to left** (n/2 down to 1). Going left to right breaks it: when you sink k, its children's subtrees must already be heaps.

> ⚠️ **Pitfall**: Don't swap the operations. Construction A **swims** (each new key moves up); construction B **sinks** (each internal node moves down). Swimming the keys from n/2 down to 1 is neither method and doesn't build a heap.

### 7.5 Why Bottom-Up Construction Is O(n)

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

### 7.6 Sortdown

Phase 2: remove the maximum one at a time, but **leave it in the array** instead of nulling it out. `exch(a, 1, n--)` swaps the max into the last heap slot and shrinks the heap, so that slot is now outside the heap and holds its final value.

```cpp
while (n > 1) {
    exch(a, 1, n--);
    sink(a, 1, n);
}
```

**Key insight:** after each iteration the array is a **heap-ordered subarray followed by a subarray in final sorted order**. Ascending output comes from a *max*-heap, because each max is placed at the back.

Sortdown on the algs4 example (the heap built from `S O R T E X A M P L E`, i.e. `X T S P L R A M O E E`): `exch(1, 11), sink(1, 10)`, `exch(1, 10), sink(1, 9)`, … down to `exch(1, 2), sink(1, 1)`, ending with `A E E L M O P R S T X`. Step through it below:

```viz binary-heap
{"title": "Sortdown on X T S P L R A M O E E", "heap": "X, T, S, P, L, R, A, M, O, E, E", "ops": "sortdown()", "interactive": true}
```

**Cost:** n − 1 iterations, each one exchange plus a sink of O(log n) → **O(n log n)** in the worst case.

> ⚠️ **Pitfall**: `sink(a, 1, n)` must use the **already decremented** n. Sinking with the old n would pull the just-placed maximum back into the heap.

### 7.7 The Complete Heap Sort

Heap sort = phase 1 (method B) + phase 2 (sortdown), both on the same array:

```cpp
void heapSort(std::vector<int>& a) {     // keys in a[1..n]; a[0] unused
    int n = a.size() - 1;
    for (int k = n/2; k >= 1; k--)       // phase 1: bottom-up construction, O(n)
        sink(a, k, n);
    while (n > 1) {                      // phase 2: sortdown, O(n log n)
        exch(a, 1, n--);                 //   max to the back; the heap shrinks
        sink(a, 1, n);                   //   repair the new root
    }
}
```

Both phases call the **same `sink`**, but with different arguments. Phase 1 sinks **every internal k** with the **full n**. Phase 2 always sinks the **root 1**, with an n that **shrinks** by one each round. (`less`, `exch` and `sink` are in [section 9](#9-complete-implementation).) The whole sort on `[2, 9, 7, 6, 5, 8]`:

```viz binary-heap
{"title": "Whole heap sort on [2, 9, 7, 6, 5, 8]: phase 1, then phase 2", "heap": "2, 9, 7, 6, 5, 8", "ops": "heapsort()"}
```

### 7.8 Heap Sort Analysis

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

A full heap sort animation is at https://visualgo.net/en/heap?slide=1.

> 📘 **Beyond the lecture**: The constants are small. algs4 shows bottom-up construction uses at most 2n compares and n exchanges, and heap sort as a whole uses fewer than 2 n lg n compares and exchanges (that is also its average case). (algs4 §2.4)

> ⚠️ **Pitfall**: "Heap sort is O(n log n)" holds for the **best case too** (distinct keys). Unlike insertion sort, it can't finish early on an already sorted array: a sorted ascending array isn't a max-heap, and sortdown always does n − 1 sinks.

### 7.9 Practice

#### Heap construction by hand

**Part 1.** Run heap construction on the array [2,9,7,6,5,8]. Show each step.

**Part 2.** What is the worst-case time complexity of naive heap construction? (Inserting 1 element at a time)

**Part 3.** What is the worst-case time complexity of optimized heap construction?

> Hint: n = 6, so the first call is `sink(3, 6)`.

<details>
<summary>Solution</summary>

**Part 1:** `sink(3, 6)`: 7 < 8 → swap → `2 9 8 6 5 7`; `sink(2, 6)`: 9 is larger than 6 and 5 → no move; `sink(1, 6)`: 2 < 9 → swap, then 2 < 6 → swap → **`9 6 8 2 5 7`** (3 exchanges in total).

**Part 2:** **O(n log n)** — n insertions, each O(log n).

**Part 3:** **O(n)** — most nodes sit near the bottom and sink only a short distance; the series n · Σ h/2^(h+1) ≤ n. See [section 7.3](#73-method-b-bottom-up-construction) and [section 7.5](#75-why-bottom-up-construction-is-on).

</details>

#### Sortdown by hand

Given the heap you constructed before (`9 6 8 2 5 7`), run the second step of heapsort, sortdown, to sort the array. What is the worst-case time complexity of sortdown?

<details>
<summary>Solution</summary>

The bar separates the heap from the sorted part:

| Step | After `exch(1, n--)` | After `sink(1, n)` |
|---|---|---|
| n = 6 → 5 | 7 6 8 2 5 \| 9 | 8 6 7 2 5 \| 9 |
| n = 5 → 4 | 5 6 7 2 \| 8 9 | 7 6 5 2 \| 8 9 |
| n = 4 → 3 | 2 6 5 \| 7 8 9 | 6 2 5 \| 7 8 9 |
| n = 3 → 2 | 5 2 \| 6 7 8 9 | 5 2 \| 6 7 8 9 (no move) |
| n = 2 → 1 | 2 \| 5 6 7 8 9 | loop ends (n = 1) |

Result: **2 5 6 7 8 9**. Worst case: **O(n log n)** — n − 1 iterations, each a sink of up to log n levels. Check it:

```viz binary-heap
{"title": "Sortdown on 9 6 8 2 5 7", "heap": "9, 6, 8, 2, 5, 7", "ops": "sortdown()"}
```

</details>

## 8. Comparing the Sorts

### 8.1 Summary Table

| Sort | In place | Stable | Best | Average | Worst | Remarks |
|---|---|---|---|---|---|---|
| Selection | ✓ | | O(n²) | O(n²) | O(n²) | n exchanges |
| Insertion | ✓ | ✓ | O(n) | O(n²) | O(n²) | use for small arrays or partially ordered |
| Merge | | ✓ | O(n log n) | O(n log n) | O(n log n) | guaranteed performance; stable |
| Quick | ✓ | | O(n log n) | O(n log n) | **O(n²)** | n log n probabilistic guarantee; fastest in practice |
| Heap | ✓ | | O(n log n) | O(n log n) | O(n log n) | guaranteed performance; in place |

No sort here is in place, stable and O(n log n) in the worst case at once: merge sort gives up in-place, quick sort and heap sort give up stability, quick sort also gives up the worst case.

### 8.2 Lower Bound

**All comparison-based sorting algorithms have a lower bound of n log n in the worst case** (strictly it's a lower bound, Ω).

> 📘 **Beyond the lecture**: Why n log n can't be beaten: a comparison sort must distinguish all n! orderings of the input, and each compare has only two outcomes, so some input needs at least lg(n!) ≈ n lg n compares (algs4 §2.2). Merge sort meets this bound, so it is asymptotically optimal.

## 9. Complete Implementation

Merge sort:

```cpp
#include <utility>

namespace mergesort {
template <typename T>
void merge(T* a, T* aux, int lo, int mid, int hi) {
    for (int k = lo; k <= hi; k++) aux[k] = a[k];
    int i = lo, j = mid + 1;
    for (int k = lo; k <= hi; k++) {
        if (i > mid)              a[k] = aux[j++];
        else if (j > hi)          a[k] = aux[i++];
        else if (aux[j] < aux[i]) a[k] = aux[j++];
        else                      a[k] = aux[i++];
    }
}
template <typename T>
void sort(T* a, T* aux, int lo, int hi) {
    if (hi <= lo) return;
    int mid = lo + (hi - lo) / 2;
    sort(a, aux, lo, mid);
    sort(a, aux, mid+1, hi);
    merge(a, aux, lo, mid, hi);
}
template <typename T>
void sort(T* a, int length) {
    T* aux = new T[length];
    sort(a, aux, 0, length - 1);
    delete[] aux;
}
}
```

Tested with `g++ -std=c++17 -Wall -fsanitize=address,undefined` (comparisons counted with an instrumented `operator<`):

```text
merge example: AGHILMORST  compares=8
best 123|456 compares=3
worst 135|246 compares=5
MERGESRT -> EEGMRRST  compares=15
worst n=8 compares=17 (n lg n - n + 1 = 17)
mergesort wrapper: 1 2 3 5 8 9
```

Quick sort (with the shuffle fixed):

```cpp
#include <algorithm>
#include <random>
#include <utility>

template <typename T>
int partition(T* a, int lo, int hi) {
    int i = lo;
    int j = hi + 1;
    T v = a[lo];
    while (true) {
        while (i < hi && a[++i] < v) {
            if (i == hi) break;
        }
        while (v < a[--j]) {
            if (j == lo) break;
        }
        if (i >= j) break;
        std::swap(a[i], a[j]);
    }
    std::swap(a[lo], a[j]);
    return j;
}

template <typename T>
void sort(T* a, int lo, int hi) {
    if (hi <= lo) return;
    int j = partition(a, lo, hi);
    sort(a, lo, j - 1);
    sort(a, j + 1, hi);
}

template <typename T>
void sort(T* a, int length) {
    std::random_device device;
    std::default_random_engine engine{device()};
    std::shuffle(a, a + length, engine);  // fixed
    sort(a, 0, length - 1);
}
```

Heap sort (1-based: `a[0]` unused), with a driver that builds the heap for `[2, 9, 7, 6, 5, 8]` and then sorts it:

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
}
```

Output:

```text
heap: 9 6 8 2 5 7 
sorted: 2 5 6 7 8 9 
AEELMOPRSTX
```

## 10. Quick Reference & Top 5 Things to Remember

| Sort | In place | Stable | Best | Average | Worst | Extra memory |
|---|---|---|---|---|---|---|
| Selection | yes | no | O(n²) | O(n²) | O(n²) | O(1) |
| Insertion | yes | yes | O(n) | O(n²) | O(n²) | O(1) |
| Merge | no | yes | O(n log n) | O(n log n) | O(n log n) | O(n) `aux` |
| Quick | yes | no | O(n log n) | O(n log n) | O(n²) | O(log n) stack |
| Heap | yes | no | O(n log n) | O(n log n) | O(n log n) | O(1) |

| Piece | Cost |
|---|---|
| `merge` of two halves of n/2 | between ~n/2 and n − 1 comparisons |
| `partition(a, lo, hi)` | O(n) |
| heap construction: naive (n inserts) / bottom-up | O(n log n) / **O(n)** |
| sortdown | O(n log n) |

**Top 5 things to remember**

1. Selection sort does n(n−1)/2 compares on every input (n − 1 exchanges, not stable); insertion sort's early `break` makes the sorted case O(n) and it is stable.
2. Merge sort: trivial split, all work in `merge` (ties take the left item, so it is stable); C(n) = 2C(n/2) + (n − 1) gives Θ(n log n) in every case, at the cost of an O(n) `aux` array.
3. Quick sort: partition puts the pivot in its final spot (both scans stop on keys equal to the pivot, final swap is with `a[j]`); average O(n log n), worst O(n²) when the pivot is always the min or max, made improbable by a shuffle or random / median-of-three pivot.
4. Heap sort = bottom-up construction (sink k from n/2 down to 1, O(n)) + sortdown (`exch(1, n--)`, `sink(1, n)`, O(n log n)): in place with a guaranteed O(n log n) worst case, but not stable and cache-unfriendly.
5. No comparison sort beats n log n in the worst case; every n log n sort here gives up something (merge: in place; quick: stability and the worst case; heap: stability and speed in practice).

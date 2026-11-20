# ICS 46 Fall 2026 — lecture → supplement map

Taken from the hyperlinks in `ICS 46 - Fall 2026 - Schedule.pdf`. If a newer
schedule is available, re-extract its links (render_slides.py prints slide
links; for the schedule use pypdf annotations) and trust that over this table.

| Lec | Date | Topic | Supplements (fetch in full) | Textbook (not fetchable — skip) |
|---|---|---|---|---|
| 0 | 9/24 | Intro, Templates | https://ics.uci.edu/~thornton/ics46/Notes/Templates/ | — |
| 1 | 9/29 | Randomness | (ICS 46 notes, no link given) | — |
| 2 | 10/1 | Pointers, References, Smart Pointers | https://ics.uci.edu/~thornton/ics45c/Notes/PointersAndTheHeap/ | — |
| 3 | 10/6 | Multidimensional Data, Empirical Analysis | https://ics.uci.edu/~thornton/ics46/Notes/MultidimensionalData/ , https://algs4.cs.princeton.edu/14analysis/ | — |
| 3→4 note | | | 14analysis is shared: scientific method, doubling test, mathematical models, order of growth → Lec 3 (empirical analysis); memory usage of objects/linked lists and amortized vs worst case → Lec 4 | |
| 4 | 10/8 | Analysis of Algorithms, Dynamic Array, Linked List (the Lec 04 slide deck also covers Stacks) | https://algs4.cs.princeton.edu/14analysis/ , https://algs4.cs.princeton.edu/13stacks/ (linked lists + stacks live here) | Ch 1.4 |
| 5 | 10/13 | (Linked lists cont. / skip lists per schedule) | — | — |
| 6 | 10/15 | Stacks, Queues, Deques | https://algs4.cs.princeton.edu/13stacks/ | Ch 1.3 |
| 7 | 10/20 | Analysis of Recursion; Sorting 1 (selection, insertion) | https://algs4.cs.princeton.edu/21elementary/ | Ch 2.1 |
| 8–9 | 10/22, 10/27 | Sorting 2 (merge, quick) | https://algs4.cs.princeton.edu/22mergesort/ , https://algs4.cs.princeton.edu/23quick/ (schedule names "23quick" but links only 22mergesort; URL inferred) | Ch 2.2, 2.3 |
| 10 | 10/29 | Trees, Binary Trees, Traversals | https://algs4.cs.princeton.edu/31elementary/ | Ch 3.1 |
| 11 | 11/3 | Heaps, Priority Queues | https://algs4.cs.princeton.edu/24pq/ | Ch 2.4, 2.5 |
| 12 | 11/5 | Binary Search Tree | https://algs4.cs.princeton.edu/32bst/ | Ch 3.2 |
| 13 | 11/17 | Balanced BST (Red-Black) | https://algs4.cs.princeton.edu/33balanced/ | Ch 3.3 |
| 14–15 | 11/19, 11/24 | Hash Tables | https://algs4.cs.princeton.edu/34hash/ | Ch 3.4 |
| 17 | 12/1 | Graphs 1 | https://algs4.cs.princeton.edu/41graph/ | Ch 4.1 |
| 18 | 12/3 | Graphs 2 | https://algs4.cs.princeton.edu/42digraph/ | Ch 4.2 |

Topic → page shortcut (use when a deck covers more than its schedule row):
linked lists, stacks, queues, bags → 13stacks · Big-O, amortised analysis,
memory use → 14analysis · elementary sorts → 21elementary · mergesort →
22mergesort · quicksort → 23quick · priority queues/heaps → 24pq · symbol
tables → 31elementary · BST → 32bst · red-black/2-3 → 33balanced · hashing
→ 34hash · undirected graphs → 41graph · directed graphs → 42digraph ·
templates → Thornton ICS 46 Templates · pointers/heap → Thornton ICS 45C
PointersAndTheHeap · 2D arrays/multidimensional data → Thornton ICS 46
MultidimensionalData.

Note: the schedule's lecture numbering and the slide file names don't
always agree (e.g. the slide file "Lec 03 - AnalysisArrayList" vs schedule
row 3 "Multidimensional Data"). The slide PDF's own title page and date are
the authority; match supplements by **topic**, not by number.

Quiz scopes (Fri discussion): Quiz 2 = Lec 4–5, Quiz 3 = Lec 6–7,
Quiz 4 = Lec 8–12, Quiz 5 = Lec 13–14. Midterm 11/12, Final 12/8.

## What each supplement is like

- **Thornton's notes** (ics.uci.edu/~thornton/...): long prose in C++, often
  split into several sub-pages linked at the bottom of the index page. Fetch
  the index AND every sub-page it links to that is about the topic.
- **algs4 booksite** (algs4.cs.princeton.edu): summary pages for the
  Sedgewick & Wayne textbook. Code is **Java** and the user hasn't learned
  Java — use the ideas, tables, and complexity results, and if code is
  needed write it in C++ in the style of Yeh's slides. Never paste Java.
  The page ends with a "Q + A" and "Exercises" section; those count as part
  of the page for completeness checks.

## Thornton's ICS 46 notes — always check these too

The schedule's "ICS 46 notes" entries mean Alex Thornton's ICS 46 notes
(https://ics.uci.edu/~thornton/ics46/Notes/, Spring 2022 offering). Most
rows in the schedule don't link them, so use this topic map. Every page is
`https://ics.uci.edu/~thornton/ics46/Notes/<Page>/`.

| Yeh lecture topic | Thornton pages |
|---|---|
| Intro, Templates (Lec 0) | Templates, CourseIntroduction, ContractsAndExceptions |
| Randomness (Lec 1) | Randomness |
| Pointers, References, Smart Pointers (Lec 2) | SmartPointers, MoveSemantics (+ ICS 45C PointersAndTheHeap from the schedule) |
| Multidimensional Data, Empirical Analysis (Lec 3) | MultidimensionalData, AsymptoticAnalysis |
| Analysis, Dynamic Array, Linked List, Stacks (Lec 4) | AsymptoticAnalysis, AmortizedAnalysis, LinkedLists, StacksQueuesDeques |
| Linked lists cont., Skip lists (Lec 5) | LinkedLists, SkipLists |
| Stacks, Queues, Deques (Lec 6) | StacksQueuesDeques, AmortizedAnalysis |
| Analysis of Recursion, Sorting 1 (Lec 7) | AnalyzingRecursion, ComparisonBasedSorting |
| Sorting 2: merge, quick (Lec 8–9) | ComparisonBasedSorting, LinearTimeSorting (only if the slides go there) |
| Trees, Binary Trees, Traversals (Lec 10) | GeneralTrees, TreeTraversals, NaryBinaryTrees |
| Heaps, Priority Queues (Lec 11) | PriorityQueues |
| Binary Search Tree (Lec 12) | BinarySearchTrees |
| Balanced BST (Lec 13) | AVLTrees (Thornton teaches AVL; Yeh teaches red-black — use only the shared ideas: why balance matters, rotations) |
| Hash Tables (Lec 14–15) | HashTables |
| Graphs 1 (Lec 17) | Graphs, GraphTraversals, GraphConnectedness |
| Graphs 2 (Lec 18) | ShortestPaths, TopologicalOrdering |

Match by what the slides actually cover, not by lecture number: a deck that
runs into the next topic gets that topic's pages too. Thornton's code is
C++ (usable, in his style); algs4's is Java (ideas only).

---
title: "Query Processing & Efficient Top-K"
summary: "How a search engine answers a query fast: merging postings for AND (skip pointers, query term order by document frequency), document-at-a-time vs term-at-a-time scoring, conjunctive processing, threshold methods and MaxScore, early termination, the heap for top-K selection, inexact top-K (index elimination, champion lists, static quality g(d) and the net score, high/low lists, impact-ordered postings, tiered indexes), distributed query evaluation and query caching."
topics:
  - query-processing
kind: "topic"
order: 507
---

# CS 121: Information Retrieval — Topic: Query Processing & Efficient Top-K

## Table of Contents

- [1. Why Query Processing Needs Optimizing](#1-why-query-processing-needs-optimizing)
- [2. AND by Merging Postings, Skip Pointers and Query Order](#2-and-by-merging-postings-skip-pointers-and-query-order)
- [3. Document-at-a-Time vs Term-at-a-Time](#3-document-at-a-time-vs-term-at-a-time)
- [4. Conjunctive Processing](#4-conjunctive-processing)
- [5. Threshold Methods, MaxScore and Early Termination](#5-threshold-methods-maxscore-and-early-termination)
- [6. Efficient Cosine Ranking and the Top-K Heap](#6-efficient-cosine-ranking-and-the-top-k-heap)
- [7. Inexact Top-K and Index Elimination](#7-inexact-top-k-and-index-elimination)
- [8. Champion Lists](#8-champion-lists)
- [9. Static Quality g(d), the Net Score, and High and Low Lists](#9-static-quality-gd-the-net-score-and-high-and-low-lists)
- [10. Impact-Ordered Postings](#10-impact-ordered-postings)
- [11. Tiered Indexes](#11-tiered-indexes)
- [12. Distributed Query Evaluation and Query Caching](#12-distributed-query-evaluation-and-query-caching)
- [13. Comparing the Methods](#13-comparing-the-methods)
- [14. Quick Reference & Top 5 Things to Remember](#14-quick-reference--top-5-things-to-remember)

> This chapter is about **using** an inverted index to answer queries quickly. It assumes the index itself ([Inverted Indexes & Index Construction](topic-indexing.en-US.md)) and the scoring functions it speeds up: Boolean matching, tf-idf and cosine similarity ([Retrieval Models](topic-retrieval-models.en-US.md)). The query-independent quality score $g(d)$ of §9 is typically [PageRank](topic-link-analysis.en-US.md).

## 1. Why Query Processing Needs Optimizing

A web index is huge and a user waits only a fraction of a second. Scoring *every* document for *every* query is the expensive part, so engines look for ways to avoid it. The ideas in this chapter fall into four groups:

| Group | Idea | Sections |
|---|---|---|
| Faster exact matching | merge sorted postings, skip pointers, start from the rarest term | §2 |
| **Safe** ranked evaluation | compute exactly the same top $K$ as a full evaluation, but read or score less (document-at-a-time, term-at-a-time, conjunctive processing, MaxScore) | §3–§5 |
| **Unsafe** (inexact) ranked evaluation | accept a top $K$ that may differ slightly from the exact one, in exchange for speed (index elimination, champion lists, $g(d)$ ordering, impact ordering, tiers, early termination) | §5, §7–§11 |
| Scaling out | spread the work over machines and remember popular results | §12 |

Two classes of optimization recur throughout:

| Class | Examples | Better for |
|---|---|---|
| **Read less data** from inverted lists | skip pointers (§2.2), indexing the index (see [Inverted Indexes & Index Construction](topic-indexing.en-US.md)) | **simple** feature (scoring) functions |
| **Calculate scores for fewer documents** | conjunctive processing (§4), MaxScore (§5), and the inexact methods | **complex** feature functions |

> 💡 **Key Insight**: Everything from §7 on is deliberately **unsafe**: the exact top $K$ is traded for speed, and that is justified because the exact top $K$ by cosine was never the real goal (cosine is only a proxy for user happiness, §7.1).

> 📘 **Going further**: [IIR Ch 7 Computing scores in a complete search system](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7 Query Processing (book p. 165)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 2. AND by Merging Postings, Skip Pointers and Query Order

### 2.1 The merge (INTERSECT)

Given the index, how do we process a query? Take the Boolean query **Brutus AND Caesar** (the Boolean model itself is in [Retrieval Models](topic-retrieval-models.en-US.md); it has only two outcomes, TRUE and FALSE: "exact-match" retrieval, the simplest form of "ranking", and proximity operators are also used. Typical users: email, library catalogs, macOS Spotlight).

1. Locate *Brutus* in the dictionary; retrieve its postings.
2. Locate *Caesar* in the dictionary; retrieve its postings.
3. **"Merge"** the two postings: **intersect** the document sets.

```text
Brutus → 2 → 4 → 8 → 16 → 32 → 64 → 128
Caesar → 1 → 2 → 3 → 5 → 8 → 13 → 21 → 34
answer:  2, 8
```

**The merge** walks through the two postings **simultaneously**, in time **linear in the total number of postings entries**. If the list lengths are $x$ and $y$, the merge at query time takes $O(x+y)$ operations. **Crucial: postings sorted by docID.**

```text
INTERSECT(p1, p2)
 1  answer ← ⟨ ⟩
 2  while p1 ≠ NIL and p2 ≠ NIL
 3  do if docID(p1) = docID(p2)
 4        then ADD(answer, docID(p1))
 5             p1 ← next(p1)
 6             p2 ← next(p2)
 7        else if docID(p1) < docID(p2)
 8                then p1 ← next(p1)
 9                else p2 ← next(p2)
10  return answer
```

The same thing in Python, with list indexes as the pointers:

```python
def intersect(p1, p2):
    """INTERSECT on Python lists."""
    answer = []
    i = j = 0
    while i < len(p1) and j < len(p2):
        if p1[i] == p2[j]:
            answer.append(p1[i])
            i += 1
            j += 1
        elif p1[i] < p2[j]:
            i += 1
        else:
            j += 1
    return answer

brutus = [2, 4, 8, 16, 32, 64, 128]
caesar = [1, 2, 3, 5, 8, 13, 21, 34]
print(intersect(brutus, caesar))
```

```text
[2, 8]
```

Why the smaller pointer may move: if `p1[i] < p2[j]`, the other list has already passed `p1[i]` (it is sorted), so document `p1[i]` can't be in both. Try your own lists (`list1 | list2`):

```viz postings-intersect
{"title": "Brutus AND Caesar", "lists": "2 4 8 16 32 64 128 | 1 2 3 5 8 13 21 34", "terms": "Brutus, Caesar", "interactive": true}
```

> ⚠️ **Pitfall**: The $O(x+y)$ merge depends on both lists being **sorted by docID**. Unsorted postings would force a search of one list for every entry of the other.

> 📘 **Going further**: [Croft §5.7 Query Processing (book p. 165)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR Ch 1 (processing Boolean queries)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

### 2.2 Skip pointers

"You can also add **skip pointers**" to a postings list. In the standard figure, *Brutus* `2 4 8 16 32 64 128` has skips 2 → 16 → 128 and *Caesar* `1 2 3 5 8 13 21 34` has skips 1 → 5 → 21. A skip pointer lets the merge **jump over a run of postings** when the skip target is still not larger than the other list's current docID. The result is the same (`2 8`); fewer postings are read. Skips only pay off on long lists: here is a merge with evenly spaced skips (about $\sqrt{n}$ apart) on a 100-posting list against a 3-posting list:

```python
import math

def intersect_skips(p1, p2, skip1=None, skip2=None):
    """Merge with optional skip pointers. skipK = {index: index_of_skip_target}.
    Returns (answer, number of docID comparisons)."""
    skip1, skip2 = skip1 or {}, skip2 or {}
    i = j = comps = 0
    answer = []
    while i < len(p1) and j < len(p2):
        comps += 1
        if p1[i] == p2[j]:
            answer.append(p1[i]); i += 1; j += 1
        elif p1[i] < p2[j]:
            if i in skip1 and p1[skip1[i]] <= p2[j]:
                while i in skip1 and p1[skip1[i]] <= p2[j]:
                    i = skip1[i]            # jump over the run
            else:
                i += 1
        else:
            if j in skip2 and p2[skip2[j]] <= p1[i]:
                while j in skip2 and p2[skip2[j]] <= p1[i]:
                    j = skip2[j]
            else:
                j += 1
    return answer, comps

def add_skips(n):
    """Evenly spaced skips, every ~sqrt(n) postings."""
    step = max(2, round(math.sqrt(n)))
    return {i: i + step for i in range(0, n - step, step)}

long_list = list(range(2, 202, 2))      # 100 postings: 2, 4, ..., 200
short_list = [60, 130, 190]
print(intersect_skips(long_list, short_list))
print(intersect_skips(long_list, short_list, add_skips(len(long_list))))
```

```text
([60, 130, 190], 95)
([60, 130, 190], 28)
```

Same answer, 28 comparisons instead of 95.

> 📘 **Going further**: [Croft §5.4.7 Skipping and Skip Pointers (book p. 151)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR Ch 2 (faster postings merges via skip pointers)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

### 2.3 Query optimization: process in order of increasing frequency

Can we optimize at **query time** too? Take a query that is an AND of $n$ terms: for each term get its postings, then AND them together. **What is the best order?**

| Term | Postings |
|---|---|
| Brutus | 2 4 8 16 32 64 128 |
| Caesar | 1 2 3 5 8 16 21 34 |
| Calpurnia | 13 16 |

Query: *Brutus AND Calpurnia AND Caesar*. **Process in order of increasing frequency**: start with the **smallest set**, then keep cutting further. Execute it as **(Calpurnia AND Brutus) AND Caesar**. The intermediate result can never be longer than the shortest list, so every later merge is cheap.

**This is why we keep the document frequency in the dictionary**: df is exactly the length of each postings list, known before reading any of them.

The first merge of the optimized order:

```viz postings-intersect
{"title": "(Calpurnia AND Brutus) first — the shortest list leads", "lists": "13 16 | 2 4 8 16 32 64 128", "terms": "Calpurnia, Brutus"}
```

The answer `[16]` is then ANDed with Caesar → `[16]`.

> ⚠️ **Pitfall**: Order by **df** (number of documents), not by how often the term appears in total: df is the postings list length, and that is what determines the merge cost.

> 📘 **Going further**: [IIR Ch 1 (processing Boolean queries, query optimization)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

### 2.4 Practice

#### Brutus AND Caesar by merging

Brutus → `2 4 8 16 32 64 128`, Caesar → `1 2 3 5 8 13 21 34`. Run INTERSECT, listing each comparison.

<details>
<summary>Solution</summary>

Pointer pairs (Brutus, Caesar):

| Step | Compare | Action |
|---|---|---|
| 1 | 2 vs 1 | 1 < 2 → advance Caesar |
| 2 | 2 vs 2 | equal → **add 2**, advance both |
| 3 | 4 vs 3 | 3 < 4 → advance Caesar |
| 4 | 4 vs 5 | 4 < 5 → advance Brutus |
| 5 | 8 vs 5 | 5 < 8 → advance Caesar |
| 6 | 8 vs 8 | equal → **add 8**, advance both |
| 7 | 16 vs 13 | 13 < 16 → advance Caesar |
| 8 | 16 vs 21 | 16 < 21 → advance Brutus |
| 9 | 32 vs 21 | 21 < 32 → advance Caesar |
| 10 | 32 vs 34 | 32 < 34 → advance Brutus |
| 11 | 64 vs 34 | 34 < 64 → advance Caesar → Caesar exhausted, stop |

Answer **[2, 8]** after 11 comparisons, within the $x + y = 7 + 8 = 15$ bound. 128 is never looked at.

</details>

#### Best order for Brutus AND Calpurnia AND Caesar

Brutus `2 4 8 16 32 64 128` · Caesar `1 2 3 5 8 16 21 34` · Calpurnia `13 16`. In which order should the ANDs run, and what is the answer?

<details>
<summary>Solution</summary>

Order by increasing document frequency: Calpurnia (df 2), Brutus (df 7), Caesar (df 8). Execute **(Calpurnia AND Brutus) AND Caesar**:

1. Calpurnia AND Brutus = `[16]`.
2. `[16]` AND Caesar = `[16]`.

Answer: **document 16**. The second merge works on a 1-element list instead of two lists of 7 and 8. The dfs come from the dictionary, without reading any postings.

</details>

## 3. Document-at-a-Time vs Term-at-a-Time

### 3.1 The two evaluation orders

For ranked retrieval there are two ways to compute scores from inverted lists:

- **Document-at-a-time (DAAT)**: computes **complete scores** for documents by processing **all term lists, one document at a time**.
- **Term-at-a-time (TAAT)**: **accumulates** scores for documents by processing **term lists one at a time**.

**Both have optimization techniques** that significantly reduce the time to generate scores (§4–§5).

Example: query **salt water tropical**, postings written `x:y` = document number : word count, and the score of a document is the sum of its counts. Document-at-a-time goes column by column: doc 1 = 1 + 1 + 2 = **4**, doc 2 = 1 + 2 = **3**, doc 3 = **1**, doc 4 = 1 + 1 = **2**. Term-at-a-time reads *salt* (partial scores 1:1, 4:1), then *water* (1:2, 2:1, 4:2), then *tropical*, and ends with the same final scores 1:4, 2:3, 3:1, 4:2.

```viz query-eval
{"title": "salt water tropical — switch between the two orders", "postings": "salt: 1:1 4:1; water: 1:1 2:1 4:1; tropical: 1:2 2:2 3:1", "mode": "doc", "interactive": true}
```

> ⚠️ **Pitfall**: In the final term-at-a-time state, the third accumulator is **3:1** (doc 3 contains only *tropical*, once), not 2:2. The final scores are `1:4 2:3 3:1 4:2`.

### 3.2 The pseudocode

Both procedures take the query $Q$, the index $I$, the feature functions $f$ and $g$, and $k$, and use a **priority queue** $R$ of size $k$ for the top results. The update $s_d \leftarrow s_d + g_i(Q) f_i(l_i)$ is the abstract ranking model (a query feature times a document feature; see [Inverted Indexes & Index Construction](topic-indexing.en-US.md)). In the example, $g_i(Q) = 1$ and $f_i$ is the count.

Document-at-a-time:

```text
procedure DocumentAtATimeRetrieval(Q, I, f, g, k)
    L ← Array()
    R ← PriorityQueue(k)
    for all terms w_i in Q do
        l_i ← InvertedList(w_i, I)
        L.add( l_i )
    end for
    for all documents d ∈ I do
        s_d ← 0
        for all inverted lists l_i in L do
            if l_i.getCurrentDocument() = d then
                s_d ← s_d + g_i(Q) f_i(l_i)     ▷ Update the document score
            end if
            l_i.movePastDocument( d )
        end for
        R.add( s_d, d )
    end for
    return the top k results from R
end procedure
```

Term-at-a-time keeps a hash table $A$ of **accumulators**:

```text
procedure TermAtATimeRetrieval(Q, I, f, g, k)
    A ← HashTable()
    L ← Array()
    R ← PriorityQueue(k)
    for all terms w_i in Q do
        l_i ← InvertedList(w_i, I)
        L.add( l_i )
    end for
    for all lists l_i ∈ L do
        while l_i is not finished do
            d ← l_i.getCurrentDocument()
            A_d ← A_d + g_i(Q) f(l_i)
            l_i.moveToNextDocument()
        end while
    end for
    for all accumulators A_d in A do
        s_d ← A_d                ▷ Accumulator contains the document score
        R.add( s_d, d )
    end for
    return the top k results from R
end procedure
```

The same two procedures in Python (a min-heap of size $k$ plays the priority queue):

```python
import heapq

index = {
    "salt":     {1: 1, 4: 1},
    "water":    {1: 1, 2: 1, 4: 1},
    "tropical": {1: 2, 2: 2, 3: 1},
}
query = ["salt", "water", "tropical"]

def document_at_a_time(query, index, k):
    lists = [index[t] for t in query]
    docs = sorted(set().union(*lists))
    heap = []                                 # min-heap of (score, doc): the k best so far
    for d in docs:                            # one document at a time...
        s = sum(l.get(d, 0) for l in lists)   # ...complete score from every list
        heapq.heappush(heap, (s, d))
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(heap, reverse=True)

def term_at_a_time(query, index, k):
    acc = {}                                  # accumulators: partial scores
    for t in query:                           # one list at a time
        for d, f in index[t].items():
            acc[d] = acc.get(d, 0) + f
        print("after", t, "->", acc)
    return heapq.nlargest(k, ((s, d) for d, s in acc.items()))

print(document_at_a_time(query, index, 10))
print(term_at_a_time(query, index, 10))
```

```text
[(4, 1), (3, 2), (2, 4), (1, 3)]
after salt -> {1: 1, 4: 1}
after water -> {1: 2, 4: 2, 2: 1}
after tropical -> {1: 4, 4: 2, 2: 3, 3: 1}
[(4, 1), (3, 2), (2, 4), (1, 3)]
```

Each pair is `(score, doc)`: both orders give ranking **1, 2, 4, 3**.

### 3.3 List functions and the trade-off

The inverted-list object supports these operations (they are what makes skipping possible in §4):

| Function | Does |
|---|---|
| `getCurrentDocument()` | the document number of the current posting |
| `skipForwardToDocument(d)` | moves forward until `getCurrentDocument()` ≥ $d$; may read to the end of the list |
| `movePastDocument(d)` | moves forward until `getCurrentDocument()` > $d$ |
| `moveToNextDocument()` | the next document; = `movePastDocument(getCurrentDocument())` |
| `getNextAccumulator(d)` | the first document number $d' \ge d$ that already has an accumulator |
| `removeAccumulatorsBetween(a, b)` | removes accumulators for documents with $a < d < b$ |

> ⚠️ **Pitfall**: Mind the direction of the comparisons: you move forward **until the current document is ≥ d** (`skipForwardToDocument`) or **> d** (`movePastDocument`); `moveToNextDocument` equals `movePastDocument(current)` only with those readings.

**Trade-off**: term-at-a-time **uses more memory for accumulators** (a partial score for every document seen so far), but **accesses disk more efficiently** (each list is read sequentially, once). Document-at-a-time keeps only $k$ results, but reads from all lists at once.

> 📘 **Going further**: [Croft §5.7.1 Document-at-a-time Evaluation (book p. 166), §5.7.2 Term-at-a-time Evaluation (book p. 168)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 3.4 Practice

#### Score salt water tropical both ways

Postings (doc:count): salt `1:1 4:1` · water `1:1 2:1 4:1` · tropical `1:2 2:2 3:1`. Score = sum of counts. Compute the final scores document-at-a-time and term-at-a-time, and the conjunctive result (only documents containing all three terms).

<details>
<summary>Solution</summary>

**Document-at-a-time** (one column at a time):

| Doc | salt | water | tropical | Score |
|---|---|---|---|---|
| 1 | 1 | 1 | 2 | **4** |
| 2 | — | 1 | 2 | **3** |
| 3 | — | — | 1 | **1** |
| 4 | 1 | 1 | — | **2** |

**Term-at-a-time** (one row at a time, accumulators):

| After | Accumulators |
|---|---|
| salt | 1:1, 4:1 |
| water | 1:2, 2:1, 4:2 |
| tropical | 1:4, 2:3, 3:1, 4:2 |

Same final scores; ranking: **1, 2, 4, 3**.

**Conjunctive**: only doc 1 contains all three terms → **doc 1 = 4**.

</details>

## 4. Conjunctive Processing

**Conjunctive processing**:

- among the **simplest** query optimizations, and the **default mode** of many engines;
- **every returned document must contain all query terms** (an AND, but with scores);
- works best when **one query term is rare**: by first selecting the documents containing the rare term(s), you **skip a large fraction** of the documents;
- usable in **both** term-at-a-time and document-at-a-time.

**Conjunctive term-at-a-time**: **check the accumulator for the next document containing all previously seen terms, and skip the list of postings to that document.** The first list ($i = 0$) creates accumulators as usual; for later lists, `getNextAccumulator(d)` finds the next candidate $d'$, `removeAccumulatorsBetween(d_0, d')` throws away candidates this list skipped (they lack the term), and the list either scores $d$ (if $d = d'$) or skips forward to $d'$.

```text
 1: procedure TermAtATimeRetrieval(Q, I, f, g, k)
 2:   A ← Map()
 3:   L ← Array()
 4:   R ← PriorityQueue(k)
 5:   for all terms w_i in Q do
 6:     l_i ← InvertedList(w_i, I)
 7:     L.add( l_i )
 8:   end for
 9:   for all lists l_i ∈ L do
10:     d_0 ← −1
11:     while l_i is not finished do
12:       if i = 0 then
13:         d ← l_i.getCurrentDocument()
14:         A_d ← A_d + g_i(Q) f(l_i)
15:         l_i.moveToNextDocument()
16:       else
17:         d ← l_i.getCurrentDocument()
18:         d′ ← A.getNextAccumulator(d)
19:         A.removeAccumulatorsBetween(d_0, d′)
20:         if d = d′ then
21:           A_d ← A_d + g_i(Q) f(l_i)
22:           l_i.moveToNextDocument()
23:         else
24:           l_i.skipForwardToDocument(d′)
25:         end if
26:         d_0 ← d′
27:       end if
28:     end while
29:   end for
30:   for all accumulators A_d in A do
31:     s_d ← A_d           ▷ Accumulator contains the document score
32:     R.add( s_d, d )
33:   end for
34:   return the top k results from R
35: end procedure
```

**Conjunctive document-at-a-time**: **find the largest document pointed to by an inverted list; try to skip all lists to point to that document; if it can, score, otherwise break.**

```text
 1: procedure DocumentAtATimeRetrieval(Q, I, f, g, k)
 2:   L ← Array()
 3:   R ← PriorityQueue(k)
 4:   for all terms w_i in Q do
 5:     l_i ← InvertedList(w_i, I)
 6:     L.add( l_i )
 7:   end for
 8:   d ← −1
 9:   while all lists in L are not finished do
10:     s_d ← 0
11:     for all inverted lists l_i in L do
12:       if l_i.getCurrentDocument() > d then
13:         d ← l_i.getCurrentDocument()
14:       end if
15:     end for
16:     for all inverted lists l_i in L do
17:       l_i.skipForwardToDocument(d)
18:       if l_i.getCurrentDocument() = d then
19:         s_d ← s_d + g_i(Q) f_i(l_i)     ▷ Update the document score
20:         l_i.movePastDocument( d )
21:       else
22:         d ← −1
23:         break
24:       end if
25:     end for
26:     if d > −1 then R.add( s_d, d )
27:     end if
28:   end while
29:   return the top k results from R
30: end procedure
```

On *salt water tropical*, only document 1 has all three terms, so conjunctive processing returns just doc 1 = 4, and never scores docs 2, 3, 4:

```viz query-eval
{"title": "Conjunctive salt water tropical — skipping instead of scoring", "postings": "salt: 1:1 4:1; water: 1:1 2:1 4:1; tropical: 1:2 2:2 3:1", "mode": "doc", "conjunctive": true}
```

A compact (set-based) version of the same idea: intersect from the rarest list outward, then score only the survivors.

```python
def conjunctive(query, index, k):
    lists = sorted((index[t] for t in query), key=len)   # rarest first
    candidates = set(lists[0])
    for l in lists[1:]:
        candidates &= set(l)
    scored = [(sum(l[d] for l in lists), d) for d in candidates]
    return heapq.nlargest(k, scored)

print(conjunctive(query, index, 10))
```

```text
[(4, 1)]
```

> 💡 **Key Insight**: Conjunctive processing is the lesson of [§2.3](#23-query-optimization-process-in-order-of-increasing-frequency) again: the rarest term bounds the work. Here *salt* (2 documents) limits the candidates to docs 1 and 4 before *water* or *tropical* is fully read.

> 📘 **Going further**: [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 5. Threshold Methods, MaxScore and Early Termination

**Threshold methods** use the **number of top-ranked documents needed ($k$)** to optimize query processing; for most applications, $k$ is small.

- For any query there is a **minimum score** a document must reach to be shown: the score of the $k$-th highest-scoring document, which gives the **threshold $\tau$**.
- Unfortunately, **we don't know $\tau$** until the query is done; optimization methods **estimate $\tau'$** and ignore documents that can't beat it.
- **Document-at-a-time**: use the score of the **lowest-ranked document so far** (the $k$-th in the priority queue) as $\tau'$. **Term-at-a-time**: use the **$k$-th largest score in the accumulator table**.

**MaxScore** compares the **maximum score that the remaining documents could have** to $\tau'$, and ignores the parts of inverted lists that **can't generate a score above $\tau'$**. It is a **safe** optimization: the ranking is the **same** as without it.

**MaxScore example**: query *eucalyptus tree*. *Tree* is common (a long list); *eucalyptus* is rare (a few postings).

- The indexer computes $\mu_{tree}$, the **maximum score for any document containing just "tree"**.
- Assume $k = 3$; $\tau'$ is the lowest score after the first three documents.
- **Likely $\tau' > \mu_{tree}$**: $\tau'$ is the score of a document that contains **both** query terms.
- So we can **safely skip over all gray postings**: the *tree* postings need to be read only for the first few documents and for documents that also contain *eucalyptus*; every other *tree* posting is skipped: a tree-only document scores at most $\mu_{tree} < \tau'$ and can't enter the top 3.

A small illustration (invented counts: 40 documents contain *tree* with count 1–3, and three of them also contain *eucalyptus*):

```python
import heapq
tree = {d: 1 + (d % 3) for d in range(1, 41)}            # 40 docs, tf 1..3
eucalyptus = {7: 4, 19: 3, 33: 5}                         # 3 docs
mu_tree = max(tree.values())                              # best score from "tree" alone
k = 3

def full(k):
    scores = {d: tree.get(d, 0) + eucalyptus.get(d, 0) for d in set(tree) | set(eucalyptus)}
    return heapq.nlargest(k, ((s, d) for d, s in scores.items()))

def maxscore(k):
    heap, scored = [], 0
    for d in sorted(set(tree) | set(eucalyptus)):
        # tau' = k-th best score so far; a tree-only doc can reach at most mu_tree
        if len(heap) == k and d not in eucalyptus and mu_tree <= heap[0][0]:
            continue                                      # skip: cannot enter the top k
        s = tree.get(d, 0) + eucalyptus.get(d, 0)
        scored += 1
        heapq.heappush(heap, (s, d))
        if len(heap) > k:
            heapq.heappop(heap)
    return sorted(heap, reverse=True), scored

print("mu_tree =", mu_tree)
print("full     :", full(k), "docs scored:", len(set(tree) | set(eucalyptus)))
print("maxscore :", *maxscore(k))
```

```text
mu_tree = 3
full     : [(6, 33), (6, 7), (5, 19)] docs scored: 40
maxscore : [(6, 33), (6, 7), (5, 19)] 9
```

Same top 3 (it is **safe**), but 9 documents scored instead of 40.

**Other approaches**:

| Approach | How | Safe? |
|---|---|---|
| **Early termination** | some queries are more expensive than others: **ignore high-frequency word lists** in term-at-a-time; **ignore documents at the end of lists** in doc-at-a-time | **unsafe**: the ranking can change |
| **List ordering** | order inverted lists by a **quality metric** (e.g. PageRank) or by **partial score** | makes unsafe (and fast) optimizations **more likely to retrieve good documents** |

List ordering is developed in §9–§10.

> ⚠️ **Pitfall**: "Safe" means the top-$k$ ranking is identical to full evaluation (MaxScore). Early termination is "unsafe": faster, but it can drop a document that belonged in the top $k$.

> 📘 **Going further**: [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §5.3.6 Ordering (book p. 139)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 6. Efficient Cosine Ranking and the Top-K Heap

### 6.1 Cosine ranking without computing all N cosines

For vector-space ranking (see [Retrieval Models](topic-retrieval-models.en-US.md)), the goal is to find the **K docs** in the collection **"nearest" to the query**, i.e. the **K largest query-doc cosines**. Efficient ranking means two things: **computing a single cosine** efficiently, and **choosing the K largest** cosine values efficiently. **Can we do this without computing all N cosines?**

- What we're doing in effect is solving the **K-nearest-neighbor problem** for a query vector. In general we **don't know how to do this efficiently in high-dimensional spaces**,
- **but** for web search we don't have to: **query vectors are highly sparse!** The problem is **solvable for short queries**, and **standard indexes support this well** (only the few postings lists of the query terms are touched).

**Special case, unweighted queries**: no weighting on query terms; assume each query term occurs only once. Then **for ranking you don't need to normalize the query vector**: every document's score is divided by the same query length, which can't change the order. (So $w_{t,q} = 1$ and the score update of the cosine algorithm just adds $w_{t,d}$.)

> 📘 **Going further**: [IIR Ch 7 (efficient scoring and ranking)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 6.2 Selecting the top K with a heap

**Selection vs. sorting**: we typically want the **top K** docs in the cosine ranking, **not a total order of every document** in the collection. Can we pick off the docs with the K highest cosines? Let **J = number of docs with nonzero cosines**; we seek the **K best of these J**.

**Use a heap**:

- A **binary tree in which each node's value > the values of its children** (a max-heap).
- **Takes 2J operations to construct**, then each of the **K "winners" is read off in 2 log J steps**.
- **For J = 1M, K = 100, this is about 10% of the cost of sorting!**

With base-2 logs and sorting at $J \log_2 J$ comparisons: heap $= 2J + 2K\log_2 J \approx 2.00$ million vs sort $\approx 19.9$ million, a ratio of **0.10**, the quoted 10%. (In Python, `heapq.nlargest(K, …)` does exactly this job.)

> ⚠️ **Pitfall**: The saving comes from K ≪ J: building the heap is linear, and you pay $\log J$ only K times. Sorting pays $\log J$ for **every** one of the J documents.

### 6.3 Practice

#### Heap vs sorting for one million docs

A heap takes $2J$ operations to build and $2\log_2 J$ steps per winner; sorting all $J$ documents costs about $J\log_2 J$ comparisons (base-2 logs and $J\log_2 J$ for sorting are assumptions). How does picking the top $K = 100$ of $J = 1{,}000{,}000$ compare with sorting all $J$?

<details>
<summary>Solution</summary>

- Heap: $2J + K \cdot 2\log_2 J = 2{,}000{,}000 + 100 \times 2 \times 19.93 \approx 2{,}003{,}986$ operations.
- Sorting: $J \log_2 J \approx 19{,}931{,}569$ comparisons.
- Ratio ≈ **0.10**: "about 10% of the cost of sorting".

The linear build dominates; the 100 extractions barely count. Checking it in Python (including that `heapq.nlargest` returns the same 100 values as a full sort):

```python
import math
J, K = 1_000_000, 100
heap = 2 * J + K * 2 * math.log2(J)
sort = J * math.log2(J)
print(f"log2 J = {math.log2(J):.2f}")
print(f"heap : {heap:,.0f}")
print(f"sort : {sort:,.0f}")
print(f"ratio: {heap / sort:.3f}")

import heapq, random
random.seed(1)
scores = [random.random() for _ in range(J)]
top = heapq.nlargest(K, scores)
print(top == sorted(scores, reverse=True)[:K])
```

```text
log2 J = 19.93
heap : 2,003,986
sort : 19,931,569
ratio: 0.101
True
```

</details>

## 7. Inexact Top-K and Index Elimination

### 7.1 Cosine is only a proxy

**Bottlenecks**: the **primary computational bottleneck** in scoring is the **cosine computation**. Can we avoid all this computation? **Yes, but we may sometimes get it wrong**: a doc **not** in the top K **may creep into** the list of K output docs. **Is this such a bad thing?**

**Cosine similarity is only a proxy!**

- The **user has a task** and a **query formulation**.
- **Cosine matches docs to the query**, not to the task.
- So cosine is anyway **a proxy for user happiness**.
- If we get a list of K docs **"close" to the top K** by cosine, it **should be OK**.

**Generic approach**:

- Find a **set A of contenders**, with $K < |A| \ll N$.
  - $A$ does **not necessarily contain the top K**,
  - but has **many docs from among the top K**.
  - Return the top K docs in $A$.
- Think of $A$ as **pruning non-contenders**.
- The same approach is also used for **other (non-cosine) scoring functions**.

The schemes that follow this approach: **index elimination** (§7.2), champion lists (§8), static quality and high/low lists (§9), impact ordering (§10) and tiered indexes (§11).

> ⚠️ **Pitfall**: These methods are **inexact** ("unsafe" in the sense of §5): the $K$ returned may not be the true top $K$ by cosine.

> 📘 **Going further**: [IIR Ch 7 Computing scores in a complete search system](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 7.2 Index elimination

The basic cosine algorithm **already only considers docs containing at least one query term**. Take this heuristic further:

1. **Only consider high-idf query terms.**
2. **Only consider docs containing many query terms.**

**High-idf query terms only**: for a query such as *catcher in the rye*, **only accumulate scores from *catcher* and *rye***. Intuition: *in* and *the* contribute little to the scores and so **don't alter the rank-ordering much**. Benefit: **postings of low-idf terms have many docs** → these (many!!!) docs get **eliminated from the set A** of contenders.

**Docs containing many query terms**:

- Any doc with at least one query term is a candidate for the top K output list.
- For **multi-term queries**, only compute scores for docs containing **several of the query terms** (perhaps all terms!), say **at least 3 out of 4**.
- This imposes a **"soft conjunction"** on queries, as seen on web search engines (**early Google**).
- It **may end up with fewer than K candidates** if too restrictive. Add another heuristic on top: **you can iterate!** (relax to fewer terms).
- **Easy to implement in postings traversal.**

**Example: 3 of 4 query terms**

| Term | Postings |
|---|---|
| Antony | 3 4 **8** **16** **32** 64 128 |
| Brutus | 2 4 **8** **16** **32** 64 128 |
| Caesar | 1 2 3 5 **8** 13 21 34 |
| Calpurnia | 13 **16** **32** |

**Scores are only computed for docs 8, 16 and 32** (the boxed postings). If you only want to show **2 docs** to the user, that's enough; if you need more, **iterate** and also compute scores for docs with **2** query terms.

> ⚠️ **Pitfall**: "At least 3 of 4" isn't AND: doc 8 lacks Calpurnia and doc 16 lacks Caesar, and both are scored. It's a threshold on how many lists a doc appears in, which a document-at-a-time traversal counts for free.

> 📘 **Going further**: [IIR Ch 7 (index elimination, inexact top K)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 7.3 Practice

#### Which documents does "3 of 4 query terms" score?

Antony `3 4 8 16 32 64 128` · Brutus `2 4 8 16 32 64 128` · Caesar `1 2 3 5 8 13 21 34` · Calpurnia `13 16 32`. With the rule "at least 3 of the 4 query terms", which documents get scored? What if the user needs more results?

<details>
<summary>Solution</summary>

Count in how many lists each document appears:

| Docs | Lists |
|---|---|
| **8** (Antony, Brutus, Caesar), **16** (Antony, Brutus, Calpurnia), **32** (Antony, Brutus, Calpurnia) | **3** |
| 2, 3, 4, 13, 64, 128 | 2 |
| 1, 5, 21, 34 | 1 |

Only **docs 8, 16 and 32** are scored. That's enough to show 2 results. If more are needed, iterate: lower the threshold to 2 terms, which adds docs 2, 3, 4, 13, 64 and 128 to the contenders.

A quick check in Python:

```python
from collections import Counter
postings = {
    "Antony":    [3, 4, 8, 16, 32, 64, 128],
    "Brutus":    [2, 4, 8, 16, 32, 64, 128],
    "Caesar":    [1, 2, 3, 5, 8, 13, 21, 34],
    "Calpurnia": [13, 16, 32],
}
count = Counter(d for plist in postings.values() for d in plist)
for need in (3, 2):
    print(f">= {need} of 4:", sorted(d for d, c in count.items() if c >= need))
```

```text
>= 3 of 4: [8, 16, 32]
>= 2 of 4: [2, 3, 4, 8, 13, 16, 32, 64, 128]
```

(The "at least 2" set contains the three documents already scored plus the six new ones.)

</details>

## 8. Champion Lists

- **Precompute** for each dictionary term $t$ the $r$ docs of **highest weight** in $t$'s postings. Call this the **champion list** for $t$ (aka **fancy list** or **top docs** for $t$).
- $r$ has to be chosen **at index build time**. Thus it's possible that $r < K$: the query asks for more results than any one champion list holds.
- At query time, **only compute the complete scores for docs in the champion list of some query term**, then pick the $K$ top-scoring docs from amongst these.

An illustration with $r = 2$ (invented weights; the score of a document is the sum of its weights for the query terms *car insurance*):

```python
weights = {
    "car":       {1: 0.9, 2: 0.2, 3: 0.7, 4: 0.6, 5: 0.5},
    "insurance": {2: 0.8, 3: 0.6, 4: 0.5, 5: 0.9},
}
r = 2
champions = {t: sorted(w, key=w.get, reverse=True)[:r] for t, w in weights.items()}
print(champions)
query = ["car", "insurance"]
def score(d):
    return round(sum(weights[t].get(d, 0) for t in query), 2)
candidates = sorted(set().union(*(champions[t] for t in query)))
print("candidates:", candidates)
print("champion top 3:", sorted(((score(d), d) for d in candidates), reverse=True)[:3])
print("exact top 3   :", sorted(((score(d), d) for d in range(1, 6)), reverse=True)[:3])
```

```text
{'car': [1, 3], 'insurance': [5, 2]}
candidates: [1, 2, 3, 5]
champion top 3: [(1.4, 5), (1.3, 3), (1.0, 2)]
exact top 3   : [(1.4, 5), (1.3, 3), (1.1, 4)]
```

Doc 4 is a champion for neither term, yet it is in the exact top 3: champion lists are **inexact**.

> ⚠️ **Pitfall**: $r$ is fixed when the index is built, $K$ comes with the query. If $r < K$ (and the champion lists barely overlap), you can't even fill a page of $K$ results from the champions alone.

## 9. Static Quality g(d), the Net Score, and High and Low Lists

### 9.1 Static quality scores

We want top-ranking documents to be **both relevant and authoritative**.

- **Relevance** is being modeled by **cosine scores**.
- **Authority** is typically a **query-independent** property of a document.

Examples of authority signals (the last three are **quantitative**):

| Signal | Quantitative? |
|---|---|
| Wikipedia among websites | |
| Articles in certain newspapers | |
| A paper with many citations | ✓ |
| Many bitly's, diggs or del.icio.us marks | ✓ |
| PageRank, HITS (see [Link Analysis](topic-link-analysis.en-US.md)) | ✓ |

**Modeling authority**: assign to each document $d$ a **query-independent quality score in $[0, 1]$**, denoted $g(d)$. Thus a quantity like the number of citations is **scaled into $[0, 1]$** (a formula for this is the practice problem in §9.5).

### 9.2 The net score

A simple total score combining relevance and authority:

$$\text{net-score}(q, d) = g(d) + \text{cosine}(q, d)$$

$g(d)$ is the static quality of $d$; $\text{cosine}(q, d)$ is its query relevance (see [Retrieval Models](topic-retrieval-models.en-US.md)). You can use some other linear combination, $g(d) + \alpha \cdot \text{cosine}(q, d)$ ($\alpha$ sets how much relevance counts against authority); indeed **any function of the two "signals" of user happiness**. Now we seek the **top $K$ docs by net score**.

### 9.3 Order all postings by g(d)

- **First idea: order all postings by $g(d)$.**
- **Key**: this is a **common ordering for all postings**: every list is sorted the same way (by $g$, as docID order was before).
- Thus we can **concurrently traverse** the query terms' postings for **postings intersection** and **cosine score computation**, like the docID-ordered merge of §2.1.

**Why order postings by $g(d)$?** Under $g(d)$-ordering, **top-scoring docs are likely to appear early** in postings traversal (remember: $g(d) + \alpha \cdot \text{cosine}(q, d)$). In **time-bound applications** (say, we have to return whatever search results we can in **~50 ms**), this allows us to **stop postings traversal early**, short of computing complete scores for all docs in postings.

**Champion lists in $g(d)$-ordering**: maintain for each term a champion list of the $r$ docs with **highest $g(d) + \text{tf-idf}_{t,d}$**, and seek top-$K$ results from **only the docs in these champion lists**.

> 💡 **Key Insight**: This is §5's "list ordering by a quality metric (e.g. PageRank)" in detail.

### 9.4 High and low lists

- For each term, maintain **two disjoint sets**: **high** and **low** lists. Think of **high** as the champion list.
- When traversing postings on a query, **traverse high lists first**. If we get **more than $K$ docs**, select the top $K$ and **stop**; else proceed to get docs from the **low** lists.
- Can be used even for **simple cosine scores, without** a global quality $g(d)$.
- It is a means for **segmenting the index into two tiers**: generalized in §11.

### 9.5 Practice

#### Scaling citation counts into [0, 1]

Four papers have 0, 5, 50 and 500 citations. Suggest a formula that turns a citation count $c$ into a quality score $g \in [0, 1]$ and apply it. Then, for two documents A (cosine 0.6, $g = 0.2$) and B (cosine 0.5, $g = 0.5$), compute $g + \alpha\cdot\text{cosine}$ for $\alpha = 1$ and $\alpha = 4$ and say which wins.

<details>
<summary>Solution</summary>

Several formulas work; each must map 0 to 0 and keep scores in $[0,1]$:

| Formula | 0 | 5 | 50 | 500 |
|---|---|---|---|---|
| Min-max: $c / c_{\max}$ | 0 | 0.01 | 0.1 | 1 |
| Saturating: $c/(c + 50)$ | 0 | 0.091 | 0.5 | 0.909 |
| Log: $\ln(1+c)/\ln(1+c_{\max})$ | 0 | 0.288 | 0.632 | 1 |

Min-max lets one extremely cited paper flatten everyone else; the saturating and log forms spread out the small and medium counts (this is a design choice: any monotone, bounded scaling is acceptable).

Net score ($\alpha = 1$): A $= 0.2 + 0.6 = 0.8$, B $= 0.5 + 0.5 = 1.0$ → **B wins**. With $\alpha = 4$: A $= 0.2 + 4(0.6) = 2.6$, B $= 0.5 + 4(0.5) = 2.5$ → **A wins**. A larger $\alpha$ makes relevance count more against authority, so the ranking flips.

</details>

## 10. Impact-Ordered Postings

We only want to compute scores for docs for which $\mathrm{wf}_{t,d}$ (the weight of term $t$ in doc $d$, e.g. its tf-idf) is **high enough**. So **sort each postings list by $\mathrm{wf}_{t,d}$**.

**Now: not all postings are in a common order!** Each list has its own order, so the concurrent merge of §9.3 no longer works. How do we compute scores in order to pick off the top $K$? Two ideas:

**Idea 1: early termination**

- When traversing $t$'s postings, **stop early** after either a **fixed number of $r$ docs**, or when **$\mathrm{wf}_{t,d}$ drops below some threshold**.
- Take the **union** of the resulting sets of docs: one from the postings of each query term.
- **Compute only the scores for docs in this union.**

**Idea 2: idf-ordered terms**

- When considering the postings of query terms, look at them **in order of decreasing idf**: high-idf terms are likely to contribute most to the score.
- As we update the score contribution from each query term, **stop if doc scores are relatively unchanged**.
- Can apply to cosine or some other net scores.

> ⚠️ **Pitfall**: Don't mix the two orders. **$g(d)$-ordering** is one order shared by all lists (good for merging); **impact ordering** sorts each list by its own $\mathrm{wf}_{t,d}$ (good for cutting each list short, but no common order).

> 📘 **Going further**: [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 11. Tiered Indexes

- **Break postings up into a hierarchy of lists**: most important … least important.
- Can be done by **$g(d)$** or another measure (**zone weight, tf-idf**, etc.).
- The inverted index is thus broken up into **tiers of decreasing importance**.
- At query time **use the top tier unless it fails to yield $K$ docs**; if so, **drop to lower tiers**.

**Example tiered index**: four terms, three documents:

| Term | Tier 1 | Tier 2 | Tier 3 |
|---|---|---|---|
| auto | Doc2 | — | Doc1 |
| best | — | Doc1, Doc3 | — |
| car | Doc1, Doc3 | — | Doc2 |
| insurance | Doc2, Doc3 | — | — |

High and low lists (§9.4) are the two-tier case.

> 📘 **Going further**: [IIR Ch 7 Computing scores in a complete search system](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

## 12. Distributed Query Evaluation and Query Caching

### 12.1 Distributed query evaluation

Distributing the query **speeds up query processing significantly**.

**Basic process**: all queries go to a **director machine**; the director sends messages to many **index servers**; each index server does **some portion** of the query processing; the director **organizes the results** and returns them to the user. Two main ways to split the work:

| | Document distribution | Term distribution |
|---|---|---|
| Index | each index server is a **search engine for a small fraction** of the collection | a **single index** for the whole cluster; **each inverted list** is assigned to one index server |
| Query | the director sends **a copy of the query to every** index server; each returns its **top-k** | in most cases the data for a query is **not on a single machine**; one server (usually the one with the **longest inverted list**) processes the query, the others **send it their information** |
| Results | the director **merges** them into one ranked list | final results sent to the director |
| Watch out | **collection statistics should be shared** for effective ranking | moving list data between servers |

> ⚠️ **Pitfall**: With document distribution, each server only sees its own documents. If each computed df from its fraction, the same document would get different scores on different servers; that's why collection statistics must be shared.

> 📘 **Going further**: [Croft §5.7.5 Distributed Evaluation (book p. 180)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 12.2 Query caching

- Query distributions are **similar to Zipf**: **about ½ of each day's queries are unique**, but some are **very popular**. The Zipf plot for a query log looks like the one for words: straight on log-log in the middle, off at the highest and lowest frequencies (hapax legomena = words that occur once); see [Text Processing](topic-text-processing.en-US.md) for Zipf's law.
- Caching can significantly improve effectiveness:
  - cache (perhaps **in memory**) **popular query results**;
  - cache **in memory** common **inverted lists**.
- **Inverted list caching can help even with unique queries**: a never-seen query is still made of common words.
- The cache **must be refreshed** to prevent stale data.

> 📘 **Going further**: [Croft §5.7.6 Caching (book p. 181)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 13. Comparing the Methods

| Method | Works by | Safe? | Common ordering of lists? | Needs at index time |
|---|---|---|---|---|
| Skip pointers (§2.2) | reading fewer postings in a merge | yes | docID | skip pointers |
| Rarest-first AND (§2.3) | smallest intermediate results | yes | docID | df in the dictionary |
| Document-at-a-time / term-at-a-time (§3) | complete scores per document vs accumulators | yes | docID | nothing |
| Conjunctive processing (§4) | score only docs with all terms | yes (for AND semantics) | docID | nothing |
| MaxScore (§5) | skip postings that cannot beat $\tau'$ | yes | docID | per-term maximum score $\mu$ |
| Heap for top $K$ (§6.2) | read off $K$ winners instead of sorting $J$ | yes | n/a | nothing |
| Index elimination (§7.2) | drop low-idf terms / docs with few query terms | no | docID | nothing |
| Champion lists (§8) | score only the top-$r$ docs per term | no | by weight | $r$, champion lists |
| $g(d)$ ordering, high/low lists (§9) | best-quality docs first; stop early | no | **$g(d)$ (shared)** | $g(d)$, two lists |
| Impact ordering (§10) | each list sorted by $\mathrm{wf}_{t,d}$; stop early | no | **per list** | $\mathrm{wf}_{t,d}$ order |
| Tiered indexes (§11) | top tier first, lower tiers only if needed | no | per tier | tier assignment |
| Distribution and caching (§12) | more machines; remember results | yes | n/a | shared statistics, cache |

## 14. Quick Reference & Top 5 Things to Remember

| Term | Meaning |
|---|---|
| INTERSECT | merge of two docID-sorted postings lists in $O(x+y)$ |
| Skip pointer | a jump over a run of postings in a long list |
| Document-at-a-time | complete score of one document across all lists, then the next; only $k$ results kept |
| Term-at-a-time | one list at a time, partial scores in accumulators; sequential disk access, more memory |
| Conjunctive processing | only documents containing all query terms are scored |
| $\tau$, $\tau'$ | the $k$-th best score; its running estimate |
| MaxScore | skip postings whose best possible score cannot beat $\tau'$ (safe) |
| Early termination | stop reading lists early (unsafe) |
| Contender set $A$ | $K < \lvert A\rvert \ll N$, holds many of the top $K$ |
| Index elimination | only high-idf terms; only docs with several query terms |
| Champion list | the $r$ highest-weight docs of a term, fixed at index time |
| $g(d)$ | query-independent quality in $[0,1]$; net score $= g(d) + \alpha\cdot\text{cosine}$ |
| High / low lists, tiers | segmented postings, top tier first |
| Impact ordering | each list sorted by $\mathrm{wf}_{t,d}$ |
| Document / term distribution | split the collection / split the lists across index servers |

**Top 5 things to remember**

1. AND queries are a **merge of docID-sorted lists in $O(x+y)$**; start with the **rarest term** (smallest df, known from the dictionary), and add skip pointers on long lists.
2. **Document-at-a-time** keeps only $k$ results but reads all lists at once; **term-at-a-time** reads each list once but needs accumulators. **Conjunctive processing** and **MaxScore** (threshold $\tau'$ vs the best possible score) cut work while keeping the exact top $K$ (safe).
3. For top $K$ of $J$ scored docs use a **heap**: $2J + 2K\log J$ instead of $J\log J$ (about 10% for $J = 1$M, $K = 100$).
4. **Inexact top $K$** works on a contender set $A$ ($K < |A| \ll N$) because cosine is only a proxy: index elimination (high-idf terms, "3 of 4" terms), champion lists, $g(d)$-ordering with net score $g(d) + \alpha\cdot\text{cosine}$, high/low lists, impact ordering and tiers (top tier first, drop down only if fewer than $K$).
5. Scale out with **document** or **term distribution** (share collection statistics!) and **cache** popular results and common inverted lists; the cache must be refreshed.

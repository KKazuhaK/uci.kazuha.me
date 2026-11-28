# CS 121: Information Retrieval — Topic: Link Analysis: HITS & PageRank

## Table of Contents

- [1. Why Links Are Evidence](#1-why-links-are-evidence)
- [2. HITS: Hubs and Authorities](#2-hits-hubs-and-authorities)
- [3. PageRank: The Random Surfer](#3-pagerank-the-random-surfer)
- [4. Computing PageRank](#4-computing-pagerank)
- [5. PageRank in a Real Engine](#5-pagerank-in-a-real-engine)
- [6. HITS vs PageRank](#6-hits-vs-pagerank)
- [7. Quick Reference & Top 5 Things to Remember](#7-quick-reference--top-5-things-to-remember)

> This chapter scores pages by the **links between them** rather than by their words. It assumes the web graph ([Search Engines & the Web](topic-search-engines.en-US.md)) and tf-idf / cosine ranking ([Retrieval Models](topic-retrieval-models.en-US.md)); the scores it produces become the static quality $g(d)$ of [Query Processing & Efficient Top-K](topic-query-processing.en-US.md).

## 1. Why Links Are Evidence

A link from page $x$ to page $y$ is a small, human-made judgment: the author of $x$ thought $y$ was worth pointing to. Text matching alone cannot tell a respected page from a copy or a spam page that uses the same words; the link structure can.

How badly web search needed this signal: in **November 1997**, "only one of the top four commercial search engines finds itself" — that is, returns its own search page in the top ten results when you search for its name. Brin and Page's stated goal in the paper that introduced PageRank was "to improve the quality of web search engines".

> 📘 **Going further**: [Brin & Page, "The Anatomy of a Large-Scale Hypertextual Web Search Engine" (1998)](http://infolab.stanford.edu/~backrub/google.html) · [Page, Brin, Motwani & Winograd, "The PageRank Citation Ranking: Bringing Order to the Web"](http://ilpubs.stanford.edu:8090/422/)

Two classic algorithms turn links into scores:

- **HITS** (§2) works **per query**: it gathers the pages around the query's results and finds two kinds of good pages, hubs and authorities.
- **PageRank** (§3–§5) works **once for the whole web**: one query-independent score per page, the long-term visit rate of a random surfer.

## 2. HITS: Hubs and Authorities

### 2.1 Hubs and authorities

**Hyperlink-Induced Topic Search (HITS)**. In response to a query, instead of an ordered list of pages each meeting the query, find **two sets of inter-related pages**:

- **Hub pages** are **good lists of links** on a subject — e.g. "Bob's list of cancer-related links."
- **Authority pages** occur **recurrently on good hubs** for the subject.

HITS is best suited for **"broad topic" queries** rather than for page-finding queries, and gets at a **broader slice of common opinion**.

The definition is **circular**:

- A good **hub** page for a topic **points to** many authoritative pages for that topic.
- A good **authority** page for a topic **is pointed to** by many good hubs for that topic.

The circularity is turned into an **iterative computation**. The hope: if hubs Alice and Bob both link to AT&T, Sprint and Tmob, those three come out as the authorities for *mobile telecom companies* (worked out in [§2.5](#25-practice)).

### 2.2 The base set and the connectivity server

**High-level scheme**: extract from the web a **base set** of pages that could be good hubs or authorities; from these, identify a **small set of top hub and authority pages** by an iterative algorithm.

**Creating the base set**:

1. Given a text query (say *browser*), use a **text index** to get all pages containing *browser*. Call this the **root set**.
2. Add in any page that either **points to** a page in the root set, or **is pointed to** by a page in the root set.
3. Call this the **base set**.

Picture the root set as an inner region and the base set as a box around it that also holds the linked neighbours; the in-links (and out-links) of the root set come from a **connectivity server**.

**Connectivity server**: support for fast queries on the web graph — **which URLs point to a given URL? Which URLs does a given URL point to?**

- Stores mappings **in memory** from URL → outlinks and URL → inlinks.
- Uses the **sparse** properties of the graph (**do not build the entire matrix!**).
- Applications: **crawl control**; **web graph analysis** (connectivity, crawl optimization); **link analysis** (HITS, PageRank, …).

### 2.3 The iteration

**Distilling hubs and authorities**. Compute, for each page $x$ in the base set, a **hub score $h(x)$** and an **authority score $a(x)$**.

- **Initialize**: for all $x$, $h(x) \leftarrow 1$, $a(x) \leftarrow 1$.
- **Iteratively update** all $h(x)$, $a(x)$:

$$h(x) \leftarrow \sum_{x \mapsto y} a(y) \qquad\qquad a(x) \leftarrow \sum_{y \mapsto x} h(y)$$

$x \mapsto y$ means "$x$ links to $y$": a page's hub score is the sum of the authority scores of the pages it **points to**; its authority score is the sum of the hub scores of the pages that **point to it**.

- After a few iterations (or convergence), output pages with the **highest $h()$** scores as top hubs and **highest $a()$** scores as top authorities.

**Scaling**: to prevent $h()$ and $a()$ from getting too big, **scale down after each iteration**. The scaling factor doesn't really matter (as long as you are consistent): **we only care about the relative values** of the scores.

**How many iterations?** Claim: relative values of scores **converge after a few iterations** — suitably scaled, $h()$ and $a()$ settle into a **steady state**. In practice, **~5 iterations** is enough to get you close to stability.

> ⚠️ **Pitfall**: The arrows are the whole trick. **Hub** ← sum of **authorities it points to**; **authority** ← sum of **hubs pointing to it**. Swapping them is the classic mistake.

> 📘 **Going further**: Written with the base set's adjacency matrix $M$ ($M_{xy} = 1$ if $x \mapsto y$), one round is $\mathbf{a} \leftarrow M^T\mathbf{h}$, $\mathbf{h} \leftarrow M\mathbf{a}$, so the scaled scores converge to the principal eigenvectors of $M^TM$ (authorities) and $MM^T$ (hubs). That is why the relative values reach a steady state. ([IIR Ch 21 Link analysis](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf), §21.3)

### 2.4 Example and issues

**Japan Elementary Schools**: a HITS result in two columns. **Hubs** include "100 Schools Home Pages (English)", "K-12 from Japan", "Koulutus ja oppilaitokset" (Finnish) and "Education"; **authorities** include "The American School in Japan", "KEIMEI GAKUEN Home Page (Japanese)", "Torisu primary school" and "Yakumo Elementary, Hokkaido, Japan", plus many pages titled in Japanese.

Things to note:

- It **pulled together good pages regardless of the language** of page content.
- It uses **only link analysis after the base set is assembled** — the iterative scoring is **query-independent**.
- The iterative computation after text index retrieval is **significant overhead** (but **not at query time!**).

**HITS issues**:

- **Topic drift**: off-topic pages can cause off-topic "authorities" to be returned — e.g. the neighborhood graph can be about a "super topic".
- **Mutually reinforcing affiliates**: affiliated pages/sites can **boost each other's scores**. Linkage between affiliated pages is not a useful signal, so **avoid considering them** in the analysis.

> 📘 **Going further**: [IIR Ch 21 Link analysis](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §4.5 Link Analysis (book p. 104), §4.5.3 Link Quality (book p. 111)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 2.5 Practice

#### HITS on the mobile-telecom graph

Hubs Alice and Bob each link to AT&T, Sprint and Tmob; a third page, Carol, links only to AT&T. Start every score at 1. In each round, first compute every authority score from the current hub scores, then every hub score from the new authority scores, then scale each list so its largest value is 1. Give the scores after round 1 and say where they settle.

<details>
<summary>Solution</summary>

**Round 1.** Authorities from $h = 1$: AT&T is pointed to by Alice, Bob and Carol → 3; Sprint and Tmob by Alice and Bob → 2 each. Scaled by 3: **AT&T = 1, Sprint = Tmob = 0.667**. Hubs from those: Alice = Bob = 1 + 0.667 + 0.667 = 2.333, Carol = 1. Scaled by 2.333: **Alice = Bob = 1, Carol = 0.429**.

Running the rounds in Python:

```python
links = {
    "Alice": ["AT&T", "Sprint", "Tmob"],
    "Bob":   ["AT&T", "Sprint", "Tmob"],
    "Carol": ["AT&T"],
}
pages = sorted(set(links) | {y for ys in links.values() for y in ys})
h = {x: 1.0 for x in pages}
a = {x: 1.0 for x in pages}
for it in range(1, 6):
    a = {x: sum(h[y] for y in pages if x in links.get(y, [])) for x in pages}
    h = {x: sum(a[y] for y in links.get(x, [])) for x in pages}
    sa, sh = max(a.values()), max(h.values())   # scale: largest score = 1
    a = {x: v / sa for x, v in a.items()}
    h = {x: v / sh for x, v in h.items()}
    print(it, "a:", {x: round(v, 3) for x, v in a.items() if v},
          "h:", {x: round(v, 3) for x, v in h.items() if v})
```

```text
1 a: {'AT&T': 1.0, 'Sprint': 0.667, 'Tmob': 0.667} h: {'Alice': 1.0, 'Bob': 1.0, 'Carol': 0.429}
2 a: {'AT&T': 1.0, 'Sprint': 0.824, 'Tmob': 0.824} h: {'Alice': 1.0, 'Bob': 1.0, 'Carol': 0.378}
3 a: {'AT&T': 1.0, 'Sprint': 0.841, 'Tmob': 0.841} h: {'Alice': 1.0, 'Bob': 1.0, 'Carol': 0.373}
4 a: {'AT&T': 1.0, 'Sprint': 0.843, 'Tmob': 0.843} h: {'Alice': 1.0, 'Bob': 1.0, 'Carol': 0.372}
5 a: {'AT&T': 1.0, 'Sprint': 0.843, 'Tmob': 0.843} h: {'Alice': 1.0, 'Bob': 1.0, 'Carol': 0.372}
```

By round 4–5 nothing changes in the third decimal: about five rounds reach the steady state. AT&T, Sprint and Tmob are the authorities (AT&T first, since it has one more hub); Alice and Bob are the top hubs. Carol is a weak hub because it points to only one authority.

</details>

## 3. PageRank: The Random Surfer

### 3.1 The random walk

**PageRank scoring**. Imagine a browser doing a **random walk** on web pages:

- Start at a random page.
- At each step, go out of the current page along one of the links on that page, **equiprobably** (a page with three out-links sends the walker along each with probability 1/3).
- "In the **steady state**" each page has a **long-term visit rate** — use this as the page's score.

### 3.2 Dead ends and teleporting

**Not quite enough**: the web is full of **dead-ends** (a page with in-links but no out-links). The random walk can get **stuck** in dead-ends, and then it makes no sense to talk about long-term visit rates.

**Teleporting**:

- **At a dead end**, jump to a **random web page**.
- **At any non-dead end**, with probability **10%**, jump to a random web page; with the remaining probability (**90%**), go out on a random link.
- The 10% is a **parameter**.

**Result of teleporting**: now the walk **cannot get stuck locally**, and there is a **long-term rate at which any page is visited** (not obvious). The idea of PageRank is that **pages visited more by this random walker are more important**. Computing that visit rate is §4.

> 💡 **Key Insight**: Unlike HITS, PageRank is computed **once for the whole web**, not per query — it is a static quality score $g(d)$ ([Query Processing & Efficient Top-K](topic-query-processing.en-US.md)). And unlike anchor text ([Text Processing](topic-text-processing.en-US.md)), it uses only the link structure, not the words on the link.

> 📘 **Going further**: [Croft §4.5.2 PageRank (book p. 105)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR Ch 21 Link analysis](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

## 4. Computing PageRank

There are two ways: **1. algebraic calculation** (the one in the original Google paper) and **2. a Markov chain model**. This section develops the algebraic one.

### 4.1 The formula

$$p_i = (1 - d) + d \sum_{j=1}^{N} \left(\frac{L_{ij}}{c_j}\right) p_j \qquad\qquad c_j = \sum_{i=1}^{N} L_{ij}$$

$p_i$ is the PageRank of page $i$, $p_j$ the PageRank of page $j$; $L_{ij} = 1$ if page $j$ points to $i$, and 0 otherwise; $c_j$ is **how many pages are leaving page $j$** (its out-links); $d$ is the **damping factor**.

The same thing, as the Google paper writes it:

$$PR(A) = (1 - d) + d \left( \frac{PR(T_1)}{C(T_1)} + \dots + \frac{PR(T_n)}{C(T_n)} \right)$$

$A$ is a page; $T_1 \dots T_n$ are the pages that **link to** $A$; $PR(T_i)$ is the PageRank of $T_i$; $C(T_i)$ is the number of **outgoing** links from $T_i$; $d$ is a damping/teleport factor, **usually 0.85**.

> ⚠️ **Pitfall**: $C(T_i)$ counts the out-links of the page **giving** the vote, not the in-links of $A$. A page with many out-links splits its PageRank into many small votes.

The two parameterizations line up: $d$ is the probability of following a link, so the random walk's "10% teleport" is $d = 0.9$, and the formula's $d = 0.85$ is a 15% teleport. The formula is scaled so the **average** PageRank is 1 rather than the sum: in the example below the three values always add up to $N = 3$.

### 4.2 A three-page example

Three pages: **A → B**, **B → C**, **C → A** and **C → B**. So $C(A) = 1$, $C(B) = 1$, $C(C) = 2$, and with $d = 0.85$:

$$PR(A) = 0.15 + 0.85 \cdot \frac{PR(C)}{2}$$
$$PR(B) = 0.15 + 0.85 \cdot \left(\frac{PR(A)}{1} + \frac{PR(C)}{2}\right)$$
$$PR(C) = 0.15 + 0.85 \cdot \frac{PR(B)}{1}$$

**How do we start?** Guess $PR(p) = 1$ for starters, then **iterate**. Each iteration computes all three new values from the **previous** iteration's values:

| Iteration | PR(A) | PR(B) | PR(C) | Sum |
|---|---|---|---|---|
| 0 (guess) | 1 | 1 | 1 | 3 |
| 1 | 0.575 | 1.425 | 1 | 3 |
| 2 | 0.575 | 1.06375 | 1.36125 | 3 |
| 3 | 0.728531 | 1.217281 | 1.054187 | 3 |
| … | | | | |
| 19 | 0.644456 | 1.192206 | 1.163337 | 3 |
| limit | 0.6444 | 1.1922 | 1.1634 | 3 |

The rows come from this script; iteration 19 is the first where no value changes by 0.0001 or more, and "limit" is the exact solution of the three equations (4 decimals):

```python
d = 0.85
pr = {"A": 1.0, "B": 1.0, "C": 1.0}
print(0, pr)
for k in range(1, 100):
    new = {
        "A": (1 - d) + d * pr["C"] / 2,
        "B": (1 - d) + d * (pr["A"] / 1 + pr["C"] / 2),
        "C": (1 - d) + d * pr["B"] / 1,
    }
    done = all(abs(new[p] - pr[p]) < 1e-4 for p in pr)
    pr = new
    if k <= 3 or done:
        print(k, {p: round(v, 6) for p, v in pr.items()}, "sum =", round(sum(pr.values()), 6))
    if done:
        break
```

```text
0 {'A': 1.0, 'B': 1.0, 'C': 1.0}
1 {'A': 0.575, 'B': 1.425, 'C': 1.0} sum = 3.0
2 {'A': 0.575, 'B': 1.06375, 'C': 1.36125} sum = 3.0
3 {'A': 0.728531, 'B': 1.217281, 'C': 1.054187} sum = 3.0
19 {'A': 0.644456, 'B': 1.192206, 'C': 1.163337} sum = 3.0
```

The algorithm **converges after N iterations**; once converged, the normalized probability distribution (**average PageRank for all pages**) will be **1** — here $3 / 3 = 1$. B wins: it gets votes from both A and C.

```viz pagerank
{"title": "PageRank on the A, B, C graph", "graph": "A -> B; B -> C; C -> A, B", "interactive": true}
```

> 📝 **Practice**: [§4.4](#44-practice)

### 4.3 Matrix notation

Stack all $p_i$ into a vector $\mathbf{p}$:

$$\mathbf{p} = (1 - d)\,\mathbf{e} + d \cdot \mathbf{L}\mathbf{D}_c^{-1}\mathbf{p} \qquad\qquad \mathbf{e}^T\mathbf{p} = N$$

$\mathbf{L}$ is the link matrix ($L_{ij}$), $\mathbf{D}_c$ the **diagonal matrix with diagonal elements $c_j$** (so $\mathbf{D}_c^{-1}$ divides each column by its out-degree), $\mathbf{e}$ the **vector of $N$ ones**. The constraint $\mathbf{e}^T\mathbf{p} = N$ is the **normalization** chosen so that **the average PageRank is 1**. Using it, $(1-d)\mathbf{e} = (1-d)\mathbf{e}\mathbf{e}^T\mathbf{p}/N$, which folds everything into one matrix:

$$\mathbf{p} = \left[(1 - d)\,\mathbf{e}\mathbf{e}^T/N + d\,\mathbf{L}\mathbf{D}_c^{-1}\right]\mathbf{p} = \mathbf{A}\mathbf{p}$$

So $\mathbf{p}$ is an eigenvector of $\mathbf{A}$ (eigenvalue 1), found by **power iteration**:

$$\mathbf{p}_k \leftarrow \mathbf{A}\mathbf{p}_{k-1}; \qquad \mathbf{p}_k \leftarrow N \frac{\mathbf{p}_k}{\mathbf{e}^T\mathbf{p}_k}$$

The matrix form is the one that parallelizes: each round is one sparse matrix-vector product. The same example in this form:

```python
import numpy as np

# L[i, j] = 1 if page j points to page i (order A, B, C)
L = np.array([[0, 0, 1],    # C -> A
              [1, 0, 1],    # A -> B, C -> B
              [0, 1, 0]])   # B -> C
N, d = 3, 0.85
e = np.ones(N)
Dc_inv = np.diag(1 / L.sum(axis=0))   # c_j = out-links of j
A = (1 - d) * np.outer(e, e) / N + d * L @ Dc_inv

p = np.ones(N)                 # guess 1
for k in range(50):
    p = A @ p                  # p_k <- A p_{k-1}
    p = N * p / (e @ p)        # keep e^T p = N
print(p.round(4))
```

```text
[0.6444 1.1922 1.1634]
```

Same values as the table's limit.

> 📘 **Going further**: [PageRank visualization](http://ed.ilogues.com/projects/2015/03/22/pagerank-visualization) · [Croft §4.5.2 PageRank (book p. 105)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 4.4 Practice

#### Two PageRank iterations by hand

Links: A → B, B → C, C → A, C → B. $d = 0.85$, every page starts at 1. Compute iterations 1 and 2, and say where it converges.

<details>
<summary>Solution</summary>

Out-link counts: $C(A) = 1$, $C(B) = 1$, $C(C) = 2$. In-links: A ← C; B ← A, C; C ← B. Every new value uses the **previous** iteration's values.

**Iteration 1** (all previous values = 1):
- $PR(A) = 0.15 + 0.85 \cdot 1/2 = 0.575$
- $PR(B) = 0.15 + 0.85 \cdot (1/1 + 1/2) = 1.425$
- $PR(C) = 0.15 + 0.85 \cdot 1/1 = 1$

**Iteration 2** (previous: A = 0.575, B = 1.425, C = 1):
- $PR(A) = 0.15 + 0.85 \cdot 1/2 = 0.575$
- $PR(B) = 0.15 + 0.85 \cdot (0.575 + 1/2) = 1.06375$
- $PR(C) = 0.15 + 0.85 \cdot 1.425 = 1.36125$

Continuing ([§4.2](#42-a-three-page-example)'s script): iteration 3 gives A = 0.728531, B = 1.217281, C = 1.054187; iteration 19 is the first where no value changes by 0.0001 or more (A = 0.644456, B = 1.192206, C = 1.163337), and the exact solution is **A ≈ 0.6444, B ≈ 1.1922, C ≈ 1.1634**. The sum stays 3 in every iteration (no dead ends), so the average PageRank is **1**. **B** ranks first: it collects A's whole vote plus half of C's.

```viz pagerank
{"title": "Check: iterations 1–2 page by page, then to convergence", "graph": "A -> B; B -> C; C -> A, B", "code": "none"}
```

</details>

## 5. PageRank in a Real Engine

**PageRank summary**:

- **Preprocessing**: given the graph of links, build a **(sparse) matrix** of the links; from it compute PageRank.
- One possibility to add PR in query processing (at query time): retrieve pages meeting the query, **rank them by their PageRank**. But this rank order is **query-independent**…

**The reality**:

- PageRank is used in Google and other engines, but is **hardly the full story** of ranking. It is just **one among many criteria** used in relevance scoring; many additional sophisticated features are used, some address specific query classes, and **machine-learned ranking** is used more and more.
- Given a query, a real-life search engine computes a **composite score** for each web page that combines **hundreds of features** (cosine similarity, term proximity, PageRank, HITS, etc.) — the aggregate scores of [Retrieval Models](topic-retrieval-models.en-US.md).
- PageRank **alone** is still very useful for things like **crawl policy** ([Web Crawling](topic-crawling.en-US.md)).

> 📘 **Going further**: [Croft §7.5 Web Search (book p. 279)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 6. HITS vs PageRank

| | HITS | PageRank |
|---|---|---|
| Scores | hub $h(x)$, authority $a(x)$ | one score per page |
| Update | $h(x) \leftarrow \sum_{x \mapsto y} a(y)$, $a(x) \leftarrow \sum_{y \mapsto x} h(y)$ | $PR(A) = (1-d) + d\sum PR(T_i)/C(T_i)$ |
| Start | all 1 | all 1 |
| Graph | per-query base set (root set + neighbors) | whole web |
| When computed | after retrieving the root set (not at query time) | offline, once |
| Iterations | ~5, rescale each time | until it converges (avg PR = 1) |
| Issues | topic drift, mutually reinforcing affiliates | dead ends → teleporting |
| Best for | broad-topic queries | a query-independent quality score $g(d)$ |

## 7. Quick Reference & Top 5 Things to Remember

| Term | Meaning |
|---|---|
| Hub | a page that points to many good authorities |
| Authority | a page pointed to by many good hubs |
| Root set | pages containing the query, from the text index |
| Base set | root set + pages linking to or linked from it |
| Connectivity server | in-memory URL → outlinks / inlinks maps, sparse |
| Dead end | a page with no out-links |
| Teleport | jump to a random page (always at a dead end; with probability $1-d$ elsewhere) |
| Damping factor $d$ | probability of following a link; usually 0.85 |

**Top 5 things to remember**

1. **HITS**: hub = sum of the authorities it points to, authority = sum of the hubs pointing to it; start at 1, rescale each round, ~5 rounds; only relative values matter.
2. HITS runs on a per-query **base set** (root set from the text index + its in- and out-neighbors from a connectivity server); it suffers from topic drift and mutually reinforcing affiliates.
3. **PageRank** is the long-term visit rate of a random surfer; **teleporting** fixes dead ends and guarantees the rate exists.
4. $PR(A) = (1-d) + d \sum PR(T_i)/C(T_i)$ with $d = 0.85$ and $C(T_i)$ the **out-links of the voter**; start at 1 and update every page from the previous iteration's values; it converges with average PageRank 1 (A, B, C example: 0.6444, 1.1922, 1.1634).
5. In matrix form $\mathbf{p} = \mathbf{A}\mathbf{p}$ is solved by power iteration; in a real engine PageRank is one query-independent feature among hundreds, and is also used for crawl policy.
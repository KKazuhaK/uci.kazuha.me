# CS 121: Information Retrieval — Week 8: Ranked Retrieval / The Vector Space Model

## Table of Contents

- [1. Where We Are This Week](#1-where-we-are-this-week)
- [2. Documents as Vectors](#2-documents-as-vectors)
- [3. Queries as Vectors, and Why Not Euclidean Distance](#3-queries-as-vectors-and-why-not-euclidean-distance)
- [4. Use the Angle: Cosine Similarity](#4-use-the-angle-cosine-similarity)
- [5. Length Normalization](#5-length-normalization)
- [6. Computing Cosine Scores](#6-computing-cosine-scores)
- [7. tf-idf Variants and SMART Notation](#7-tf-idf-variants-and-smart-notation)
- [8. Vector Space Ranking, Summed Up and Extended](#8-vector-space-ranking-summed-up-and-extended)
- [9. Efficient Cosine Ranking](#9-efficient-cosine-ranking)
- [10. Selecting the Top K with a Heap](#10-selecting-the-top-k-with-a-heap)
- [11. Cosine Is Only a Proxy: Inexact Top K](#11-cosine-is-only-a-proxy-inexact-top-k)
- [12. Index Elimination](#12-index-elimination)
- [13. In-class Notes & Assignment Tips](#13-in-class-notes--assignment-tips)
- [14. Worked Examples (with Solutions)](#14-worked-examples-with-solutions)
- [15. Quick Reference & Top 5 Things to Remember](#15-quick-reference--top-5-things-to-remember)

> UCI CS 121 / IN4MATX 141: Information Retrieval — Prof. Alberto Krone-Martins, Fall 2026, week of Nov 18
> Built from the Lecture 20.5 (in class, Nov 18), 21 and 22 slides (the YuJa videos are not included). Organized by concept, not by lecture.
> 📖 Readings this week: [Croft et al., Ch 7 Retrieval Models](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Manning, Raghavan & Schütze, *Introduction to IR*, Ch 6 and 7](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

> 📅 **Class logistics**: **Online Quiz 3** in class on **Wednesday, Nov 18** — bring your laptop. Rules (L20.5 p47): open slides and open books; **no internet, no LLMs, no help from friends**. Anyone caught gets a **zero** and may be reported to campus (the classroom wifi is monitored).
> Assignment 2 grades will be on Canvas later this week (L20.5 p2).
> Assignment 3 Milestone 3 (ranked search) is due **Friday, Nov 27, 11:59 pm**.
> Next week (Nov 25): Lectures 23–25 — faster scoring, static quality, PageRank/HITS, evaluation.

---

## 1. Where We Are This Week

On the architecture map ([Week 1 §10](week-01.en-US.md#10-search-engine-architecture)), L21 p2 and L22 p3 sit in the **Ranking** box: given a query and the index, put the documents in order.

**The in-class deck (L20.5) recaps Week 7.** Its "Today" agenda (p5, repeated with highlights on p25–42) walks the Week 7 videos again:

| L20.5 pages | Topic | Week 7 |
|---|---|---|
| p6–23 | Small index in a hash table; a large index doesn't fit in memory → scan (sorting the query terms helps) or jump: **index the index**, `seek(position)` | [§6](week-07.en-US.md#6-index-engineering-reading-an-index-bigger-than-memory), [Example 20.5](week-07.en-US.md#205-what-does-seek-return-l18-p1923) |
| p27–30 | "The web changes continuously… do you always need to recreate the index?" → **delayed updating**: small temporary auxiliary indexes for updated pages ("Index n..") and removed pages ("Deleted Pages"), with a **veto system** between them and ranking | [§8](week-07.en-US.md#8-updating-the-index) |
| p34 | Conjunctive processing: **every returned document must contain all terms** | [§12](week-07.en-US.md#12-conjunctive-processing) |
| p38 | Jaccard coefficient | [§15](week-07.en-US.md#15-take-1-the-jaccard-coefficient) |
| p40 | Term-document count matrix | [§16](week-07.en-US.md#16-count-vectors-and-the-bag-of-words) |
| p43–44 | tf-idf weight and $S(q,d) = \sum_{t \in q \cap d} w_{t,d}$ | [§18](week-07.en-US.md#18-document-frequency-idf-and-tf-idf) |

**"Later this week"** (L20.5 p45) — the Week 8 **and** Week 9 videos (the Week 9 ones may be uploaded early):

- Vector space model: documents (and queries) as vectors in a high-dimensional space → §2–3
- Cosine similarity; ranking using cosine scores → §4–6
- tf-idf variants → §7
- Strategies for accelerating scoring: champion, high and low lists; tiered indexes; early termination → starts here (§9–12), continues in Week 9
- Static quality scores (introduction to authority weighting $g(d)$), fields and zones, query term proximity (windowing weighting), aggregating scoring → previewed in §8, Week 9
- HITS (Hyper-link Induced Topic Search); PageRank (sequential; matrix notation, amenable to parallel implementation — bonus material) → Week 9
- Evaluation: effectiveness vs efficiency, evaluation corpus, pooling, query log, filtering and click deviation measure, simple metrics (precision, recall) → Week 9

L22 p8 states this week's second half: **speeding up vector space ranking**, and **starting to put together a complete search system** — which will need miscellaneous topics and **heuristics**.

> 🔗 **Go deeper**: [Croft §7.1 Overview of Retrieval Models (book p. 233)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

---

## 2. Documents as Vectors

Week 7 ended with tf-idf ([Week 7 §18.3](week-07.en-US.md#183-tf-idf)): $w_{t,d} = (1 + \log_{10} \mathrm{tf}_{t,d}) \times \log_{10}(N/\mathrm{df}_t)$, the best-known weighting scheme, increasing with occurrences in the document and with rarity in the collection (recapped on L22 p4).

**Binary → count → weight matrix** (L21 p4–5). The term-document matrix has gone through three versions: **incidence** (0/1, [Week 5](week-05.en-US.md#13-the-term-document-incidence-matrix)) → **counts** ([Week 7 §16](week-07.en-US.md#16-count-vectors-and-the-bag-of-words)) → **tf-idf weights**:

| | Antony and Cleopatra | Julius Caesar | The Tempest | Hamlet | Othello | Macbeth |
|---|---|---|---|---|---|---|
| Antony | 5.25 | 3.18 | 0 | 0 | 0 | 0.35 |
| Brutus | 1.21 | 6.1 | 0 | 1 | 0 | 0 |
| Caesar | 8.59 | 2.54 | 0 | 1.51 | 0.25 | 0 |
| Calpurnia | 0 | 1.54 | 0 | 0 | 0 | 0 |
| Cleopatra | 2.85 | 0 | 0 | 0 | 0 | 0 |
| mercy | 1.51 | 0 | 1.9 | 0.12 | 5.25 | 0.88 |
| worser | 1.37 | 0 | 0.11 | 4.15 | 0.25 | 1.95 |

**Each document is now represented by a real-valued vector of tf-idf weights $\in \mathbb{R}^{|V|}$** — a column of this table. (The slide gives no N or df for it, so these weights can't be recomputed here.)

**Documents as vectors** (L21 p6–10):

- We have a **$|V|$-dimensional vector space** ($|V|$ = vocabulary size).
- **Terms are the axes** of the space.
- **Documents are points or vectors** in this space.
- **Very high-dimensional**: tens of millions of dimensions for a web search engine.
- **Very sparse**: most entries are zero (a page uses a tiny fraction of the vocabulary).

> 💡 **Key Insight**: A document vector is never stored as $|V|$ numbers — its nonzero entries are exactly its postings.

> 🔗 **Go deeper**: [Croft §7.1.2 The Vector Space Model (book p. 237)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR §6.3 The vector space model for scoring (cited on L21 p6)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

---

## 3. Queries as Vectors, and Why Not Euclidean Distance

**Queries as vectors** (L21 p11–14 · L22 p5):

- **Key idea 1**: do the same for queries — represent them as **vectors in the same space**.
- **Key idea 2**: **rank documents by their proximity to the query** in this space. Proximity = similarity of vectors; proximity ≈ inverse of distance.
- Why: we want to get away from the **you're-either-in-or-out Boolean model**, and instead **rank more relevant documents higher** than less relevant ones ([Week 7 §14](week-07.en-US.md#14-from-boolean-to-ranked-retrieval)).

**Formalizing proximity** (L21 p15–18). The first thing that comes to mind is the distance between two points (= between the end points of the two vectors): **Euclidean distance?** It's **a bad idea**, because Euclidean distance is **large for vectors of different lengths** — and **queries and documents usually have very different lengths**.

**The picture** (L21 p19): two axes, JEALOUS (x) and GOSSIP (y), both from 0 to 1. $d_1$ points almost straight up (mostly *gossip*), $d_3$ almost flat (mostly *jealous*), and $q$ and $d_2$ point in nearly the same direction (both terms, in similar proportion) — but $d_2$ is a much longer arrow that runs off the unit square. The Euclidean distance between $q$ and $d_2$ is **large even though the distribution of terms in $q$ and in $d_2$ is very similar**.

L22 p7 makes the same point as a ranking: on axes term1/term2, $q$ sits near (1, 1); $d_1$ lies further out **on the same line** through the origin as $q$, while $d_2$ is closer to $q$ as a point but off in a steeper direction. **By Euclidean tf-idf: $d_2, d_1$. By cosine: $d_1, d_2$.**

> ⚠️ **Pitfall**: "Closest point" and "most similar direction" are different questions. A long document that is about exactly the query's topic is *far* from a 3-word query in Euclidean terms. The vector space model ranks by direction.

> 📝 **Practice**: [Worked Example 14.1](#141-rank-d1-and-d2-by-distance-and-by-angle-l22-p7)

---

## 4. Use the Angle: Cosine Similarity

**Thought experiment** (L21 p20–24): take a document $d$ and **append it to itself**; call it $d'$.

- "Semantically" $d$ and $d'$ have **the same content**.
- The **Euclidean distance** between them can be **quite large** — bad!
- The **angle** between them is **0**, corresponding to **maximal similarity** — good!

**Key idea: rank documents according to the angle between document and query.**

**From angles to cosines** (L21 p25–26). Cosine is a **monotonically decreasing** function on $[0°, 180°]$ (the slide plots $\cos$ from 0° to 360°: 1 at 0°, 0 at 90°, −1 at 180°, back to 1 at 360°). So ranking by angle and ranking by cosine are equivalent. The slide pairs "**decreasing** order of angle" with "**increasing** order of cosine" — a correct equivalence, but the ranking we *want* is the reverse pair: **increasing angle = decreasing cosine**, best document first.

**cosine(query, document)** (L21 p27 · L22 p6):

$$\cos(\vec q, \vec d) = \frac{\vec q \cdot \vec d}{\lvert\vec q\rvert\,\lvert\vec d\rvert} = \frac{\vec q}{\lvert\vec q\rvert} \cdot \frac{\vec d}{\lvert\vec d\rvert} = \frac{\sum_{i=1}^{|V|} q_i d_i}{\sqrt{\sum_{i=1}^{|V|} q_i^2}\,\sqrt{\sum_{i=1}^{|V|} d_i^2}}$$

$q_i$ is the tf-idf weight of term $i$ in the query, $d_i$ the tf-idf weight of term $i$ in the document. The numerator is the **dot product**; dividing by the two lengths turns both vectors into **unit vectors**. $\cos(\vec q, \vec d)$ is the cosine similarity of $q$ and $d$ — equivalently, the cosine of the angle between them.

> 🔗 **Go deeper**: [Croft §7.1.2 The Vector Space Model (book p. 237)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR Ch 6 (cosine similarity)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

---

## 5. Length Normalization

A vector is **length-normalized** by dividing each component by its length, using the **$L_2$ norm** (L21 p28–30):

$$\lVert\vec x\rVert_2 = \sqrt{\sum_i x_i^2}$$

- Dividing by the $L_2$ norm makes it a **unit vector** — a point **on the surface of the unit hypersphere**.
- Effect on $d$ and $d'$ ($d$ appended to itself): **identical vectors** after length normalization.
- **Long and short documents now have comparable weights.**

**Cosine for length-normalized vectors** (L21 p31) is simply the **dot product** (scalar product):

$$\cos(\vec q, \vec d) = \vec q \cdot \vec d = \sum_{i=1}^{|V|} q_i d_i \qquad \text{for } q, d \text{ length-normalized.}$$

**Illustrated** (L21 p32): axes RICH and POOR, unit square, a dashed quarter-circle of radius 1. The normalized vectors $\vec v(d_1)$, $\vec v(q)$, $\vec v(d_2)$, $\vec v(d_3)$ all end **on that arc**; only their directions differ, and the angle $\theta$ is drawn between $\vec v(d_1)$ and $\vec v(d_2)$. $\vec v(q)$ and $\vec v(d_2)$ are close neighbours on the arc.

**Example: how similar are three novels?** (L21 p34–41) — *Sense and Sensibility* (SaS), *Pride and Prejudice* (PaP), *Wuthering Heights* (WH), four terms, **no idf** to keep it simple (so the scheme is "lnc": log tf, no idf, cosine). Counts → log weights → normalize → dot products:

| term | SaS | PaP | WH |
|---|---|---|---|
| affection | 115 | 58 | 20 |
| jealous | 10 | 7 | 11 |
| gossip | 2 | 0 | 6 |
| wuthering | 0 | 0 | 38 |

Result: $\cos(\text{SaS}, \text{PaP}) \approx 0.94$, $\cos(\text{SaS}, \text{WH}) \approx 0.79$, $\cos(\text{PaP}, \text{WH}) \approx 0.69$. The two Austen novels are closest. Step through it:

```viz tfidf-cosine
{"title": "Three novels, pairwise cosine with lnc (L21 p34–41)", "docs": "SaS: affection:115 jealous:10 gossip:2 wuthering:0; PaP: affection:58 jealous:7 gossip:0 wuthering:0; WH: affection:20 jealous:11 gossip:6 wuthering:38", "scheme": "lnc"}
```

> 💡 **Key Insight**: L21 p38's caption: once the documents are normalized they're "already on the surface of a hypersphere", so cosine needs no division at query time — just the dot product. That's why engines normalize document vectors **at index time**.

> 📝 **Practice**: [Worked Example 14.2](#142-how-similar-are-the-three-novels-l21-p3441)

---

## 6. Computing Cosine Scores

The algorithm (L21 p33 · L22 p9, which highlights the last line, "Top K components of Scores[]"):

```text
CosineScore(q)
 1  float Scores[N] = 0
 2  float Length[N]
 3  for each query term t
 4  do calculate w_t,q and fetch postings list for t
 5       for each pair(d, tf_t,d) in postings list
 6       do Scores[d] += w_t,d × w_t,q
 7  Read the array Length
 8  for each d
 9  do Scores[d] = Scores[d] / Length[d]
10  return Top K components of Scores[]
```

- It's **term-at-a-time** ([Week 7 §11](week-07.en-US.md#11-document-at-a-time-vs-term-at-a-time)): `Scores` are the accumulators, filled one postings list at a time.
- Only documents that contain **at least one query term** ever get a nonzero score — the postings lists are the only thing read.
- `Length[d]` is computed **at index time** and just read (line 7); dividing at the end (line 9) is the document half of the cosine. The query's length is the same for every document, so it doesn't change the ranking.
- Line 10 is §10's problem: get the top K without sorting everything.

The same steps in Python, on L21's lnc.ltc example (§7): the document *car insurance auto insurance*, the query *best car insurance*:

```python
import heapq
import math

# The lnc.ltc example (L21 p47-53): one document.
docs = {"d": "car insurance auto insurance".split()}
df = {"auto": 5000, "best": 50000,
      "car": 10000, "insurance": 1000}
N = 1_000_000

def log_tf(tf):
    return 1 + math.log10(tf) if tf > 0 else 0

# Index time: postings (d, tf) and Length[d] (lnc)
postings, length = {}, {}
for d, words in docs.items():
    counts = {t: words.count(t) for t in set(words)}
    for t, tf in counts.items():
        postings.setdefault(t, []).append((d, tf))
    length[d] = math.sqrt(sum(log_tf(tf) ** 2
                              for tf in counts.values()))

def cosine_score(query, K=10):
    q = {t: query.count(t) for t in set(query)}
    w_q = {t: log_tf(tf) * math.log10(N / df[t])
           for t, tf in q.items()}          # ltc ...
    q_len = math.sqrt(sum(w * w for w in w_q.values()))
    scores = {}                             # line 1
    for t, wtq in w_q.items():              # lines 3-4
        for d, tf in postings.get(t, []):   # line 5
            scores[d] = scores.get(d, 0) + \
                log_tf(tf) * wtq / q_len    # line 6
    for d in scores:                        # lines 7-9
        scores[d] /= length[d]
    return heapq.nlargest(K, scores.items(),
                          key=lambda x: x[1])  # line 10

print(round(length["d"], 2))
print([(d, round(s, 2)) for d, s in
       cosine_score("best car insurance".split())])
```

```text
1.92
[('d', 0.8)]
```

The document length 1.92 and the score 0.8 are the slide's (L21 p52–53). ($N$ = 1,000,000 isn't printed on the slide; it's the value that reproduces its idf column, e.g. $\log_{10}(10^6/5000) = 2.3$.)

> 🔗 **Go deeper**: [IIR Ch 6 (computing vector scores)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

---

## 7. tf-idf Variants and SMART Notation

**tf-idf weighting has many variants** (L21 p42 · p50). In parentheses: the **one-letter acronym** for each choice.

| Term frequency | | Document frequency | | Normalization | |
|---|---|---|---|---|---|
| n (natural) | $\mathrm{tf}_{t,d}$ | n (no) | 1 | n (none) | 1 |
| **l (logarithm)** | $1 + \log(\mathrm{tf}_{t,d})$ | **t (idf)** | $\log \frac{N}{\mathrm{df}_t}$ | **c (cosine)** | $\frac{1}{\sqrt{w_1^2 + w_2^2 + \dots + w_M^2}}$ |
| a (augmented) | $0.5 + \frac{0.5 \times \mathrm{tf}_{t,d}}{\max_t(\mathrm{tf}_{t,d})}$ | p (prob idf) | $\max\{0, \log \frac{N - \mathrm{df}_t}{\mathrm{df}_t}\}$ | u (pivoted unique) | $1/u$ |
| b (boolean) | 1 if $\mathrm{tf}_{t,d} > 0$, else 0 | | | b (byte size) | $1/\mathit{CharLength}^{\alpha}$, $\alpha < 1$ |
| L (log ave) | $\frac{1 + \log(\mathrm{tf}_{t,d})}{1 + \log(\mathrm{ave}_{t \in d}(\mathrm{tf}_{t,d}))}$ | | | | |

The first row (n, n, n — raw counts, no idf, no normalization) is boxed on the slide; the bold row (l, t, c, red on the slide) is **ltc: "the general standard that is usually adopted"** (p42; just "ltc: standard" on p50).

**Weighting may differ in queries vs documents** (L21 p43–46):

- Many search engines allow **different weightings for queries and documents**.
- **SMART notation** denotes the combination an engine uses as **ddd.qqq** — three letters for the document, three for the query, from the table above.
- **A very standard weighting scheme is lnc.ltc**:
  - **Document**: **l**ogarithmic tf, **n**o idf, **c**osine normalization.
  - **Query**: **l**ogarithmic tf, idf (**t**), **c**osine normalization.

**tf-idf example: lnc.ltc** (L21 p47–53). Document *car insurance auto insurance*; query *best car insurance*. The slide fills the table column by column (raw tf → tf-wt → df/idf → wt → normalized → products):

| Term | q tf-raw | q tf-wt | df | idf | q wt | q n'lize | d tf-raw | d tf-wt | d wt | d n'lize | Prod |
|---|---|---|---|---|---|---|---|---|---|---|---|
| auto | 0 | 0 | 5000 | 2.3 | 0 | 0 | 1 | 1 | 1 | 0.52 | 0 |
| best | 1 | 1 | 50000 | 1.3 | 1.3 | 0.34 | 0 | 0 | 0 | 0 | 0 |
| car | 1 | 1 | 10000 | 2.0 | 2.0 | 0.52 | 1 | 1 | 1 | 0.52 | 0.27 |
| insurance | 1 | 1 | 1000 | 3.0 | 3.0 | 0.78 | 2 | 1.3 | 1.3 | 0.68 | 0.53 |

Doc length $= \sqrt{1^2 + 0^2 + 1^2 + 1.3^2} \approx 1.92$. **Score $= 0 + 0 + 0.27 + 0.53 = 0.8$.** The document's "wt" column equals its tf-wt — that's the **n** (no idf) in lnc.

```viz tfidf-cosine
{"title": "tf-idf example: lnc.ltc (L21 p47–53)", "docs": "d: car insurance auto insurance", "query": "best car insurance", "scheme": "lnc.ltc", "df": "auto:5000 best:50000 car:10000 insurance:1000", "N": 1000000, "interactive": true}
```

> ⚠️ **Pitfall**: In ddd.qqq the **document comes first**. lnc.ltc puts idf on the **query** side only — and since idf is a property of the term, applying it once (to the query) is enough to make rare query terms count more in the product. Mixing up which side gets the "t" is the classic quiz trap.

> 📝 **Practice**: [Worked Example 14.3](#143-score-best-car-insurance-with-lncltc-l21-p4753)

> 🔗 **Go deeper**: [IIR Ch 6 (variant tf-idf functions, SMART notation)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §7.1.2 The Vector Space Model (book p. 237)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

---

## 8. Vector Space Ranking, Summed Up and Extended

**Summary — vector space ranking** (L21 p54–56):

1. Represent the **query** as a weighted tf-idf vector.
2. Represent **each document** as a weighted tf-idf vector.
3. Compute the **cosine similarity** score for the query vector and each document vector.
4. **Rank** documents with respect to the query by score.
5. Return the **top K** (e.g., K = 10) to the user.

**One possible aggregation of the scoring** (L21 p57) — a real engine mixes the vector space score with other evidence:

$$S(q, D) = \alpha\left[\beta \sum_{t \in (q \cap D)} \mathrm{tfidf}_{t,D}\,\bigl(1 + P(t, D)\bigr) + (1 - \beta)\cos(q, D)\right] \times \bigl(1 + \Phi(q, D)\bigr) + (1 - \alpha)\,g(D)$$

| Symbol | Meaning |
|---|---|
| $\mathrm{tfidf}(t, D)$ | the tf.idf of term $t$ in document $D$ |
| $\cos(q, D)$ | cosine similarity between the vectors of query $q$ and document $D$ |
| $P(t, D)$ | **"field weight"** of token $t$ in $D$ — promotes documents where the tokens appear in a **header, bold, italics**, etc. |
| $\Phi(q, D)$ | **"phrase weight"** of $q$ in $D$ — promotes documents where the tokens appear **in the same order and at the same distances** as in the query |
| $g(D)$ | a function of the **document's own characteristics and link analysis** (e.g. PageRank, HITS) |
| $\alpha$ | tunable: balances the **query + document** part against the **document-only** part |
| $\beta$ | tunable: balances the **tf.idf** part against the **cosine** part |

> 💡 **Key Insight**: Read it inside out: tf-idf boosted by fields, blended with cosine ($\beta$), boosted by phrase matches ($\Phi$), then blended with query-independent quality ($\alpha$, $g$). $P$ needs field information at index time, $\Phi$ needs **positions** ([Week 7 §5](week-07.en-US.md#5-positional-indexes)), and $g$ is Week 9's PageRank/HITS — the agenda items "fields and zones", "query term proximity" and "static quality scores" in one formula.

> 🔗 **Go deeper**: [Croft §7.4 Complex Queries and Combining Evidence (book p. 267)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §7.5 Web Search (book p. 279)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR Ch 7 (a complete search system)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

---

## 9. Efficient Cosine Ranking

L22 ("Scoring and result assembly") asks how to make §6 fast (L22 p10–17):

- Find the **K docs** in the collection **"nearest" to the query** ⇒ the **K largest query-doc cosines**.
- Efficient ranking means two things: **computing a single cosine** efficiently, and **choosing the K largest** cosine values efficiently.
- **Can we do this without computing all N cosines?**
- What we're doing in effect is solving the **K-nearest-neighbor problem** for a query vector. In general we **don't know how to do this efficiently in high-dimensional spaces** —
- **but** for web search we don't have to: **query vectors are highly sparse!** The problem is **solvable for short queries**, and **standard indexes support this well** (only the few postings lists of the query terms are touched).

**Special case — unweighted queries** (L22 p18): no weighting on query terms — assume each query term occurs only once. Then **for ranking you don't need to normalize the query vector**: every document's score is divided by the same query length, which can't change the order. (So $w_{t,q} = 1$ and line 6 of `CosineScore` just adds $w_{t,d}$.)

> 🔗 **Go deeper**: [IIR Ch 7 (efficient scoring and ranking)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

---

## 10. Selecting the Top K with a Heap

**Selection vs. sorting** (L22 p19–21): we typically want the **top K** docs in the cosine ranking, **not a total order of every document** in the collection. Can we pick off the docs with the K highest cosines? Let **J = number of docs with nonzero cosines**; we seek the **K best of these J**.

**Use a heap** (L22 p22):

- A **binary tree in which each node's value > the values of its children** (a max-heap; see [ICS 46 Lecture 10 §9](../ICS-46/lec-10.en-US.md#9-heap-ordered-binary-trees)).
- **Takes 2J operations to construct**, then each of the **K "winners" is read off in 2 log J steps**.
- **For J = 1M, K = 100, this is about 10% of the cost of sorting!**

With base-2 logs and sorting at $J \log_2 J$ comparisons: heap $= 2J + 2K\log_2 J \approx 2.00$ million vs sort $\approx 19.9$ million, a ratio of **0.10** — the slide's 10%. (In Python, `heapq.nlargest(K, …)` in §6 does exactly this job.)

> ⚠️ **Pitfall**: The saving comes from K ≪ J: building the heap is linear, and you pay $\log J$ only K times. Sorting pays $\log J$ for **every** one of the J documents.

> 📝 **Practice**: [Worked Example 14.4](#144-heap-vs-sorting-for-one-million-docs-l22-p22)

---

## 11. Cosine Is Only a Proxy: Inexact Top K

**Bottlenecks** (L22 p23–27): the **primary computational bottleneck** in scoring is the **cosine computation**. Can we avoid all this computation? **Yes, but we may sometimes get it wrong**: a doc **not** in the top K **may creep into** the list of K output docs. **Is this such a bad thing?**

**Cosine similarity is only a proxy!** (L22 p28–31)

- The **user has a task** and a **query formulation**.
- **Cosine matches docs to the query** — not to the task.
- So cosine is anyway **a proxy for user happiness**.
- If we get a list of K docs **"close" to the top K** by cosine, it **should be OK**.

**Generic approach** (L22 p32–35):

- Find a **set A of contenders**, with $K < |A| \ll N$.
  - $A$ does **not necessarily contain the top K**,
  - but has **many docs from among the top K**.
  - Return the top K docs in $A$.
- Think of $A$ as **pruning non-contenders**.
- The same approach is also used for **other (non-cosine) scoring functions**.
- We'll look at a few schemes following this approach: **index elimination** (§12) this week; champion lists, tiered indexes and the rest in [Week 9](week-09.en-US.md).

> 💡 **Key Insight**: Compare Week 7's **safe** vs **unsafe** optimizations ([Week 7 §13](week-07.en-US.md#13-threshold-methods-maxscore-and-early-termination)): everything from here on is deliberately **unsafe** — the exact top K is traded for speed, justified because the exact top K was never the real goal.

---

## 12. Index Elimination

The basic cosine algorithm **already only considers docs containing at least one query term** (L22 p36–37). Take this heuristic further:

1. **Only consider high-idf query terms.**
2. **Only consider docs containing many query terms.**

**High-idf query terms only** (L22 p38–40): for a query such as *catcher in the rye*, **only accumulate scores from *catcher* and *rye***. Intuition: *in* and *the* contribute little to the scores and so **don't alter the rank-ordering much**. Benefit: **postings of low-idf terms have many docs** → these (many!!!) docs get **eliminated from the set A** of contenders.

**Docs containing many query terms** (L22 p41–45, p47):

- Any doc with at least one query term is a candidate for the top K output list.
- For **multi-term queries**, only compute scores for docs containing **several of the query terms** (perhaps all terms!) — say, **at least 3 out of 4**.
- This imposes a **"soft conjunction"** on queries, as seen on web search engines (**early Google**).
- It **may end up with fewer than K candidates** if too restrictive. Add another heuristic on top: **you can iterate!** (relax to fewer terms).
- **Easy to implement in postings traversal.**

**Example: 3 of 4 query terms** (L22 p46):

| Term | Postings |
|---|---|
| Antony | 3 4 **8** **16** **32** 64 128 |
| Brutus | 2 4 **8** **16** **32** 64 128 |
| Caesar | 1 2 3 5 **8** 13 21 34 |
| Calpurnia | 13 **16** **32** |

**Scores are only computed for docs 8, 16 and 32** (the boxed postings). If you only want to show **2 docs** to the user, that's enough; if you need more, **iterate** and also compute scores for docs with **2** query terms.

> ⚠️ **Pitfall**: "At least 3 of 4" isn't AND — doc 8 lacks Calpurnia and doc 16 lacks Caesar, and both are scored. It's a threshold on how many lists a doc appears in, which a document-at-a-time traversal counts for free.

> 📝 **Practice**: [Worked Example 14.5](#145-which-documents-does-3-of-4-query-terms-score-l22-p46)

> 🔗 **Go deeper**: [IIR Ch 7 (index elimination, inexact top K)](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques (book p. 170)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

---

## 13. In-class Notes & Assignment Tips

**Do you really need "index the index" in Project 3?** (L20.5 p24) **Maybe!** Remember the **300 ms** budget for query processing in MS3, and that **you cannot load your entire index object into memory**. Same advice as [Week 7 §19](week-07.en-US.md#19-in-class-notes--assignment-tips).

**Assignment 3 in-class work** (L20.5 p46): part of the session was set aside to work on Assignment 3 (the slide is only a title).

> 💡 **Key Insight**: MS3 is §6 + §7: precompute each document's length (lnc) at index time, weight the query with ltc, accumulate over the postings you `seek` to ([Week 7 §6](week-07.en-US.md#6-index-engineering-reading-an-index-bigger-than-memory)), divide, take the top K with a heap (§10). §12's high-idf-only trick is an easy speed-up if 300 ms is tight.

---

## 14. Worked Examples (with Solutions)

### 14.1 Rank d1 and d2 by distance and by angle (L22 p7)

On axes term1/term2, the query $q$ sits near (1, 1). $d_1$ lies further out along the **same line** through the origin as $q$; $d_2$ is a point **closer to $q$** but in a steeper direction (more term2 than term1). Rank $d_1$, $d_2$ by Euclidean distance, then by cosine.

<details>
<summary>Solution</summary>

- **Euclidean distance**: $d_2$ is the nearer point → **$d_2$, $d_1$**.
- **Cosine**: $d_1$ has the **same direction** as $q$ (angle ≈ 0, cosine ≈ 1); $d_2$'s direction is off by a visible angle → **$d_1$, $d_2$**.

Cosine is right: $d_1$ has the query's terms in the query's proportions, just longer — like $d'$ (§4). (The slide gives no coordinates; this reads the picture.)

</details>

Back to [§3](#3-queries-as-vectors-and-why-not-euclidean-distance).

### 14.2 How similar are the three novels? (L21 p34–41)

Counts (no idf): affection SaS 115 / PaP 58 / WH 20; jealous 10 / 7 / 11; gossip 2 / 0 / 6; wuthering 0 / 0 / 38. Compute log-frequency weights, length-normalize, and the three pairwise cosines. Why is $\cos(\text{SaS}, \text{PaP}) > \cos(\text{SaS}, \text{WH})$?

<details>
<summary>Solution</summary>

**1. Log-frequency weights** $1 + \log_{10}\mathrm{tf}$ (0 if tf = 0):

| term | SaS | PaP | WH |
|---|---|---|---|
| affection | 3.06 | 2.76 | 2.30 |
| jealous | 2.00 | 1.85 | 2.04 |
| gossip | 1.30 | 0 | 1.78 |
| wuthering | 0 | 0 | 2.58 |

**2. Lengths**: SaS $\sqrt{3.06^2 + 2.00^2 + 1.30^2} = 3.881$, PaP 3.323, WH 4.391. Divide each column by its length:

| term | SaS | PaP | WH |
|---|---|---|---|
| affection | 0.789 | 0.832 | 0.524 |
| jealous | 0.515 | 0.555 | 0.465 |
| gossip | 0.335 | 0 | 0.405 |
| wuthering | 0 | 0 | 0.588 |

(Slide p37 prints PaP jealous as 0.557; $1.845 / 3.323 = 0.555$.)

**3. Dot products** (the vectors are unit length, so dot product = cosine):

- $\cos(\text{SaS}, \text{PaP}) = 0.789 \times 0.832 + 0.515 \times 0.557 + 0.335 \times 0 + 0 \times 0 \approx$ **0.94**
- $\cos(\text{SaS}, \text{WH}) \approx$ **0.79**
- $\cos(\text{PaP}, \text{WH}) \approx$ **0.69**

(Exact values: 0.942, 0.789, 0.694 — the same to two decimals with either 0.555 or 0.557.)

**Why SaS–PaP > SaS–WH?** SaS and PaP have the **same shape**: dominated by *affection*, some *jealous*, and (almost) no *gossip* and **no *wuthering***. WH spreads its weight over all four terms and has a big *wuthering* component that the other two lack entirely — that dimension adds to WH's length but contributes **0** to every product with SaS or PaP. Same proportions → small angle → high cosine, regardless of the books' lengths.

</details>

Back to [§5](#5-length-normalization).

### 14.3 Score "best car insurance" with lnc.ltc (L21 p47–53)

Document *car insurance auto insurance*; query *best car insurance*; df: auto 5000, best 50000, car 10000, insurance 1000. Fill in the lnc.ltc table and compute the score.

<details>
<summary>Solution</summary>

**Query (ltc)**: tf-raw best 1, car 1, insurance 1, auto 0 → tf-wt 1, 1, 1, 0. idf = $\log_{10}(N/\mathrm{df})$: auto 2.3, best 1.3, car 2.0, insurance 3.0 (the slide's values, reproduced with $N = 10^6$). wt = tf-wt × idf: auto 0, best 1.3, car 2.0, insurance 3.0. Length $= \sqrt{1.3^2 + 2.0^2 + 3.0^2} = 3.83$ → normalized: best **0.34**, car **0.52**, insurance **0.78**.

**Document (lnc)**: tf-raw auto 1, best 0, car 1, insurance 2 → tf-wt 1, 0, 1, $1 + \log_{10} 2 = 1.3$. No idf, so wt = tf-wt. Length $= \sqrt{1^2 + 0^2 + 1^2 + 1.3^2} \approx 1.92$ → normalized: auto **0.52**, car **0.52**, insurance **0.68**.

**Products**: auto $0 \times 0.52 = 0$; best $0.34 \times 0 = 0$; car $0.52 \times 0.52 = 0.27$; insurance $0.78 \times 0.68 = 0.53$.

**Score = 0 + 0 + 0.27 + 0.53 = 0.8** (unrounded: 0.801). *auto* is in the document but not the query and *best* in the query but not the document: both contribute 0, but both still count in their vector's length.

</details>

Back to [§7](#7-tf-idf-variants-and-smart-notation).

### 14.4 Heap vs sorting for one million docs (L22 p22)

A heap takes 2J operations to build and 2 log J steps per winner. How does picking the top K = 100 of J = 1,000,000 compare with sorting all J?

<details>
<summary>Solution</summary>

- Heap: $2J + K \cdot 2\log_2 J = 2{,}000{,}000 + 100 \times 2 \times 19.93 \approx 2{,}003{,}986$ operations.
- Sorting: $J \log_2 J \approx 19{,}931{,}569$ comparisons.
- Ratio ≈ **0.10** → "about 10% of the cost of sorting", as the slide says.

The linear build dominates; the 100 extractions barely count. (Base-2 logs and $J\log_2 J$ for sorting are my assumptions; the slide gives only the 10%.)

</details>

Back to [§10](#10-selecting-the-top-k-with-a-heap).

### 14.5 Which documents does "3 of 4 query terms" score? (L22 p46)

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

</details>

Back to [§12](#12-index-elimination).

---

## 15. Quick Reference & Top 5 Things to Remember

**Vector space model**

| Idea | In one line | Slides |
|---|---|---|
| Document vector | column of tf-idf weights in $\mathbb{R}^{\lvert V\rvert}$; terms = axes; very sparse | L21 p4–10 |
| Query vector | the query in the same space; rank docs by proximity | L21 p11–14 |
| Euclidean distance | bad: large for vectors of different lengths | L21 p15–19, L22 p7 |
| Angle / cosine | $d$ and $d$+$d$ have angle 0; rank by decreasing cosine | L21 p20–26 |
| Length normalization | divide by $L_2$ norm → unit vector; long and short docs comparable | L21 p28–30 |
| Cosine of unit vectors | dot product $\sum_i q_i d_i$ | L21 p31 |

**Formulas**

| Name | Formula |
|---|---|
| tf-idf | $w_{t,d} = (1 + \log_{10}\mathrm{tf}_{t,d}) \times \log_{10}(N/\mathrm{df}_t)$ |
| $L_2$ norm | $\lVert\vec x\rVert_2 = \sqrt{\sum_i x_i^2}$ |
| Cosine | $\cos(\vec q, \vec d) = \dfrac{\vec q \cdot \vec d}{\lvert\vec q\rvert\,\lvert\vec d\rvert}$ |
| Aggregated score | $\alpha[\beta\sum \mathrm{tfidf}(1+P) + (1-\beta)\cos] \times (1 + \Phi) + (1-\alpha)g(D)$ |

**SMART letters** (ddd.qqq — document first)

| Position | Letters |
|---|---|
| tf | n natural · **l** log · a augmented · b boolean · L log ave |
| df | n no · **t** idf · p prob idf |
| norm | n none · **c** cosine · u pivoted unique · b byte size |
| Standard | **lnc.ltc**: doc log tf, no idf, cosine; query log tf, idf, cosine |

**Faster ranking**

| Technique | Idea | Exact? |
|---|---|---|
| Sparse queries + index | only the query terms' postings are read | yes |
| Unweighted queries | skip normalizing the query | yes (ranking unchanged) |
| Heap for top K | 2J to build + 2 log J per winner (~10% of sorting at J = 1M, K = 100) | yes |
| Contender set A | $K < \lvert A\rvert \ll N$, return the top K of A | no |
| Index elimination: high-idf terms | skip low-idf terms (*in*, *the*) | no |
| Index elimination: many terms | only docs with ≥ m of the query terms ("soft conjunction"); iterate if < K | no |

**Top 5 things to remember**

1. Rank by **angle, not distance**: cosine = dot product of the **length-normalized** tf-idf vectors, so a document and its doubled copy are identical.
2. Normalize documents **at index time** (`Length[d]`); the query's length never changes the ranking, so unweighted queries need no normalization at all.
3. **SMART ddd.qqq puts the document first**: lnc.ltc = documents log-tf + cosine, no idf; query log-tf + idf + cosine. Score of the slide's example: **0.8**.
4. `CosineScore` is **term-at-a-time** with accumulators, and its last line is a **top-K selection** — a heap beats sorting all J scored docs (≈10% of the cost for J = 1M, K = 100).
5. Cosine is **only a proxy** for user happiness, so **inexact top K** is fine: build a set of contenders A — e.g. by **index elimination** (high-idf terms only; docs with ≥ 3 of 4 terms, iterating if too few).
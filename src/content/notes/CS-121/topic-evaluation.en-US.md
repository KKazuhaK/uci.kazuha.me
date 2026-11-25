---
title: "Search Engine Evaluation"
summary: "How users judge a search engine (relevance, trust, duplicates, readability, speed, F-shape reading, precision vs recall, interface and tools), effectiveness vs efficiency vs cost, test collections (CACM, AP, GOV2, TREC topics), relevance judgments, pooling, query logs and clickthrough data (click bias, Skip Above and Skip Next, click deviation), and precision, recall, fallout and classification errors with a worked example."
topics:
  - evaluation
kind: "topic"
order: 509
---

# CS 121: Information Retrieval — Topic: Search Engine Evaluation

## Table of Contents

- [1. What Users Want from a Search Engine](#1-what-users-want-from-a-search-engine)
- [2. Effectiveness, Efficiency and Cost](#2-effectiveness-efficiency-and-cost)
- [3. Test Collections and Relevance Judgments](#3-test-collections-and-relevance-judgments)
- [4. Pooling](#4-pooling)
- [5. Query Logs and Clickthrough Data](#5-query-logs-and-clickthrough-data)
- [6. Precision, Recall and Classification Errors](#6-precision-recall-and-classification-errors)
- [7. Quick Reference & Top 5 Things to Remember](#7-quick-reference--top-5-things-to-remember)

> This chapter asks how we know a search engine is any good: first from the **user's** point of view, then with the **lab measurements** (test collections, judgments, logs, precision and recall) that let engineers compare ranking methods. The rankings being measured come from [Retrieval Models](topic-retrieval-models.en-US.md) and [Query Processing & Efficient Top-K](topic-query-processing.en-US.md); the users themselves are described in [Search Engines & the Web](topic-search-engines.en-US.md).

## 1. What Users Want from a Search Engine

**The major standard is the quality of the pages returned.** In classic IR that is relevance $R(Q, D)$; a real engine's relevance is $R(Q, D, \dots)$ — query, document *and more* — and how you really define it is among your engine's secrets. Also important to users:

- Trust
- Duplicate elimination (with a "show similar" option)
- Readability
- Fast access
- No pop-ups

### 1.1 Precision vs. recall from the user's view

- **Precision**: how relevant are the *first few* hits?
- **Recall**: how *many* of the relevant hits are presented?

**For web search, precision is more important than recall.** The Nielsen Norman Group eyetracking heat maps show an **F-shape** on "About us", product and search-results pages alike: across the top, across again, then down the left edge. Users read the top of the page and mostly stop at the first screen (85% look at one result screen; 41.2% give up by the end of page 1 in the iProspect survey), so the *top* hits decide quality.

**When is recall important? When completeness is required**: a **commitment reading pattern** (the whole page is read) — sources trusted *a priori*, motivated users. Example: search engines for **law and the sciences**.

> 📘 **Going further**: [Nielsen Norman Group](https://www.nngroup.com) (the eyetracking studies behind the F-shape). Precision and recall get their exact set definitions in [§6](#6-precision-recall-and-classification-errors).

> 📝 **Practice**: [§1.3](#13-practice)

### 1.2 Interface and tools

**Good UI: simple, no clutter** (compare the home pages of Google, DuckDuckGo, Bing, Yandex, Baidu and Yahoo!). Plus **pre- and post-processing tools**:

- Spell check / auto correct
- Suggested alternative searches
- Links to resources (maps, images, etc.)
- Handling syntactic cues — e.g. a URL typed in the search box, or a math equation

### 1.3 Practice

#### Precision or recall?

Which is more important for a general web search engine: precision (how relevant are the first few hits?) or recall (how many of the relevant hits are presented)? And when is recall the one that matters?

<details>
<summary>Solution</summary>

**Precision**, for web search: users read in an F-shape and mostly stop at the first screen (85% look at one result screen; 41.2% give up by the end of page 1 in the iProspect survey), so the *top* hits decide quality. **Recall** matters **when completeness is required** — motivated users, trusted sources, the commitment reading pattern: search engines for **law** and the **sciences**.

</details>

## 2. Effectiveness, Efficiency and Cost

Evaluation is always relative to a **given query, a corpus and a specific definition of relevance**:

- **Effectiveness** measures the **ability to find the right information** — how well the rank corresponds to the rank that the user expects.
- **Efficiency** measures **how quickly** this is done and how many **resources** are needed — the time and space requirements of the methods that produced the ranking.

Evaluation is **key to building effective and efficient search engines**:

- Measurement is usually carried out in **controlled laboratory experiments**; **online** testing can also be done.
- **Effectiveness, efficiency and cost are related**: if we want a particular level of effectiveness and efficiency, this will determine the **cost** of the system configuration; **efficiency and cost targets may impact effectiveness**.

> 📘 **Going further**: [Croft §8.1 Why Evaluate? (book p. 297)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR Ch 8 Evaluation in information retrieval](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

## 3. Test Collections and Relevance Judgments

An **evaluation corpus** allows results from different methods to be **compared**. **Test collections** consist of **documents, queries, and relevance judgments**, e.g.:

- **CACM**: titles and abstracts from the *Communications of the ACM* from 1958–1979. Queries and relevance judgments generated by **computer scientists**.
- **AP**: Associated Press newswire documents from 1988–1990 (from TREC disks 1–3). Queries are the **title fields** from TREC topics 51–150. Topics and relevance judgments generated by **government information analysts**.
- **GOV2**: web pages crawled from websites in the **.gov** domain during early 2004. Queries are the title fields from TREC topics 701–850. Topics and relevance judgments generated by **government analysts**.

| Collection | Number of documents | Size | Average number of words/doc. |
|---|---|---|---|
| CACM | 3,204 | 2.2 Mb | 64 |
| AP | 242,918 | 0.7 Gb | 474 |
| GOV2 | 25,205,179 | 426 Gb | 1073 |

| Collection | Number of queries | Average number of words/query | Average number of relevant docs/query |
|---|---|---|---|
| CACM | 64 | 13.0 | 16 |
| AP | 100 | 4.3 | 220 |
| GOV2 | 150 | 3.1 | 180 |

> 💡 **Key Insight**: Compare the query lengths: 13.0 words per query for CACM (queries written by computer scientists) vs 4.3 and 3.1 for AP and GOV2, whose queries are the short TREC **title** fields.

**A TREC topic** — **the title is used as the query**:

```text
<top>
<num> Number: 794

<title> pet therapy

<desc> Description:
How are pets or animals used in therapy for humans and what are the
benefits?

<narr> Narrative:
Relevant documents must include details of how pet- or animal-assisted
therapy is or has been used.  Relevant details include information
about pet therapy programs, descriptions of the circumstances in which
pet therapy is used, the benefits of this type of therapy, the degree
of success of this therapy, and any laws or regulations governing it.

</top>
```

**Relevance judgments.** Obtaining relevance judgments is an **expensive, time-consuming process**: who does it? What are the instructions? What is the level of agreement? **TREC judgments** depend on the task being evaluated, are **generally binary**, and **agreement is good because of the "narrative"** (the `<narr>` field spells out what counts as relevant).

> 📘 **Going further**: [Croft §8.2 The Evaluation Corpus (book p. 299)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 4. Pooling

**Exhaustive judgments for all documents in a collection are not practical** (think 25 million GOV2 pages × 150 topics). The **pooling** technique is used in GOV2:

- The **top $k$ results** (for TREC, $k$ varied **between 50 and 200**) from the rankings obtained by **different search engines** (or retrieval algorithms) are **merged into a pool**.
- **Duplicates are removed.**
- Documents are presented in some **random order** to the relevance judges.

Pooling produces a **large number of relevance judgments for each query, although still incomplete** — and studies have shown that **comparisons are accurate**.

> ⚠️ **Pitfall**: Only pooled documents get judged, so a relevant document that no participating system ranked in its top $k$ is never judged. That is why pooled judgments are "still incomplete": good for **comparing** systems, not a complete list of the relevant documents.

## 5. Query Logs and Clickthrough Data

### 5.1 Query logs

**Query logs** are used for both **tuning and evaluating** search engines, and also for techniques such as **query suggestion**. They **can generate privacy concerns** — anonymize the logged data? Typical contents:

- **User identifier** or user session identifier
- **Query terms** — stored **exactly** as the user entered them
- **List of URLs of results**, their **ranks** on the result list, and **whether they were clicked on**
- **Timestamp(s)** — the time of user events such as query submission and clicks
- **In which page the user clicked**

### 5.2 Clicks as preferences: Skip Above and Skip Next

**Clicks are not relevance judgments**, although they are **correlated**. They are **biased** by a number of factors such as **rank on the result list** (a kind of confirmation bias: people click what is on top). Clickthrough data can instead be used to predict **preferences between pairs of documents**:

- correlated with relevance judgments;
- appropriate for tasks with **multiple levels of relevance**, focused on **user relevance**;
- various **"policies"** are used to generate preferences.

**Example click policy: Skip Above and Skip Next** (Agichtein et al., 2006). Result list $d_1, d_2, d_3, d_4$, and only $d_3$ was clicked. Generated preferences: $d_3 > d_2$, $d_3 > d_1$, $d_3 > d_4$ — the clicked document beats every unclicked result **above** it (the user skipped them) and the unclicked result **just below** it.

> 📝 **Practice**: [§5.4](#54-practice)

### 5.3 Filtering noisy clicks: click deviation

**Click data of a single user can be noisy!** But click data can be **aggregated** to remove noise. **Click distribution** information can identify clicks that have a **higher frequency than would be expected** — those have a **high correlation with relevance**, e.g. using **click deviation** to filter clicks for preference-generation policies.

The **click deviation** $CD(d, p)$ for a result $d$ in position $p$:

$$CD(d, p) = O(d, p) - E(p)$$

$O(d, p)$ is the **observed** click frequency for document $d$ at rank position $p$ **over all instances of a given query**; $E(p)$ is the **expected** click frequency at rank $p$ **averaged across all queries**. Use this value to filter clicks and provide more reliable information (optimizing your ranking).

> 📘 **Going further**: [Croft §8.3 Logging (book p. 305)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 5.4 Practice

#### Skip Above and Skip Next

The result list is $d_1, d_2, d_3, d_4$ and the user clicked only $d_3$. Which preferences does Skip Above and Skip Next generate?

<details>
<summary>Solution</summary>

- **Skip Above**: the user saw and skipped $d_1$ and $d_2$ before clicking $d_3$ → $d_3 > d_2$ and $d_3 > d_1$.
- **Skip Next**: the unclicked result right after the click → $d_3 > d_4$.

So $d_3 > d_2$, $d_3 > d_1$, $d_3 > d_4$: pairs ordered, not relevance judged.

```python
def skip(ranking, clicked):
    prefs = []
    for c in clicked:
        i = ranking.index(c)
        for j in range(i):                      # Skip Above
            if ranking[j] not in clicked:
                prefs.append((c, ranking[j]))
        if i + 1 < len(ranking) and ranking[i + 1] not in clicked:   # Skip Next
            prefs.append((c, ranking[i + 1]))
    return prefs

print(skip(["d1", "d2", "d3", "d4"], {"d3"}))
```

```text
[('d3', 'd1'), ('d3', 'd2'), ('d3', 'd4')]
```

</details>

## 6. Precision, Recall and Classification Errors

Precision and recall first appeared from the user's side in [§1.1](#11-precision-vs-recall-from-the-users-view); here they get their set definitions. Let **$A$ be the set of relevant documents** and **$B$ the set of retrieved documents**:

| | Relevant | Non-Relevant |
|---|---|---|
| **Retrieved** | $A \cap B$ | $\overline{A} \cap B$ |
| **Not Retrieved** | $A \cap \overline{B}$ | $\overline{A} \cap \overline{B}$ |

$$\text{Recall} = \frac{|A \cap B|}{|A|} \qquad\qquad \text{Precision} = \frac{|A \cap B|}{|B|}$$

$\overline{A}$ = non-relevant documents, $\overline{B}$ = documents not retrieved.

- **Recall**: how well the search engine is doing at **finding all the relevant documents** for a query.
- **Precision**: how well it is doing at **rejecting non-relevant documents**.

**Classification errors**:

- **False positive (Type I error)**: a **non-relevant document is retrieved** ($\overline{A} \cap B$). Its rate is the **fallout**:

$$\text{Fallout} = \frac{|\overline{A} \cap B|}{|\overline{A}|}$$

- **False negative (Type II error)**: **relevant documents that are not retrieved** ($A \cap \overline{B}$). As a fraction of the relevant documents, that is **$1 - \text{Recall}$**.

> ⚠️ **Pitfall**: The denominators decide everything: recall divides by **all relevant** ($|A|$), precision by **all retrieved** ($|B|$), fallout by **all non-relevant** ($|\overline{A}|$). Fallout is not $1 - \text{precision}$.

> 📘 **Going further**: [Croft §8.4.1 Recall and Precision (book p. 308)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR Ch 8 Evaluation in information retrieval](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

> 📝 **Practice**: [§6.1](#61-practice)

### 6.1 Practice

#### Precision, recall and fallout by hand

A collection has 20 documents $d_1,\dots,d_{20}$. The relevant ones are $d_1, d_3, d_5, d_7, d_9$. The engine retrieves $d_1, d_2, d_3, d_4$. Compute recall, precision and fallout, and the fraction of relevant documents missed.

<details>
<summary>Solution</summary>

$A = \{d_1, d_3, d_5, d_7, d_9\}$ so $|A| = 5$; $B = \{d_1, d_2, d_3, d_4\}$ so $|B| = 4$; $|\overline{A}| = 20 - 5 = 15$.

- $A \cap B = \{d_1, d_3\}$, so recall $= 2/5 = 0.4$ and precision $= 2/4 = 0.5$.
- $\overline{A} \cap B = \{d_2, d_4\}$, so fallout $= 2/15 \approx 0.1333$ (not $1 - $ precision $= 0.5$).
- Missed relevant documents $A \cap \overline{B} = \{d_5, d_7, d_9\}$: $1 - \text{recall} = 0.6$.

```python
relevant = {"d1", "d3", "d5", "d7", "d9"}
retrieved = {"d1", "d2", "d3", "d4"}
collection = {f"d{i}" for i in range(1, 21)}
tp = relevant & retrieved
fp = retrieved - relevant
fn = relevant - retrieved
nonrel = collection - relevant
print("recall    =", len(tp), "/", len(relevant), "=", len(tp) / len(relevant))
print("precision =", len(tp), "/", len(retrieved), "=", len(tp) / len(retrieved))
print("fallout   =", len(fp), "/", len(nonrel), "=", round(len(fp) / len(nonrel), 4))
print("1-recall  =", 1 - len(tp) / len(relevant))
```

```text
recall    = 2 / 5 = 0.4
precision = 2 / 4 = 0.5
fallout   = 2 / 15 = 0.1333
1-recall  = 0.6
```

</details>

## 7. Quick Reference & Top 5 Things to Remember

| Term | Meaning |
|---|---|
| Effectiveness | ability to find the right information (rank matches what the user expects) |
| Efficiency | time and space needed to produce the ranking |
| Test collection | documents + queries + relevance judgments (CACM, AP, GOV2) |
| TREC topic | `<num>`, `<title>` (used as the query), `<desc>`, `<narr>` |
| Pooling | merge top $k$ ($50$–$200$) of several systems, dedupe, shuffle, judge |
| Skip Above / Skip Next | clicked doc beats unclicked docs above it and the unclicked one just below |
| Click deviation | $CD(d,p) = O(d,p) - E(p)$ |
| Recall | $\lvert A\cap B\rvert / \lvert A\rvert$ |
| Precision | $\lvert A\cap B\rvert / \lvert B\rvert$ |
| Fallout | $\lvert\overline{A}\cap B\rvert / \lvert\overline{A}\rvert$ (false-positive rate) |

**Top 5 things to remember**

1. Web users read in an F-shape and stop early, so **precision** matters most for web search; **recall** matters when completeness is required (law, sciences).
2. **Effectiveness** (right answers), **efficiency** (time, space) and **cost** trade off against each other; evaluation is mostly done in controlled lab experiments.
3. A **test collection** is documents + queries + (mostly binary) relevance judgments; since judging everything is impractical, **pooling** judges the merged top $k$ of several systems — incomplete, but comparisons are accurate.
4. **Clicks are biased by rank and are not relevance judgments**; use them as pairwise preferences (Skip Above and Skip Next) and filter noise with click deviation $O(d,p) - E(p)$.
5. Recall $= |A\cap B|/|A|$, precision $= |A\cap B|/|B|$, fallout $= |\overline{A}\cap B|/|\overline{A}|$; false negatives are $1 - $ recall, and fallout is not $1 - $ precision.

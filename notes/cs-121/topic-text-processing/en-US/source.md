# CS 121: Information Retrieval — Topic: Text Processing

## Table of Contents

- [1. From Documents to Index Terms](#1-from-documents-to-index-terms)
- [2. Tokenization](#2-tokenization)
- [3. Text Statistics and Zipf's Law](#3-text-statistics-and-zipfs-law)
- [4. Stopping and Stopwords](#4-stopping-and-stopwords)
- [5. Stemming: Suffix-s, Porter, Krovetz](#5-stemming-suffix-s-porter-krovetz)
- [6. Phrases: POS Tagging and Word N-Grams](#6-phrases-pos-tagging-and-word-n-grams)
- [7. Document Structure and Markup](#7-document-structure-and-markup)
- [8. Links and Anchor Text](#8-links-and-anchor-text)
- [9. Quick Reference & Top 5 Things to Remember](#9-quick-reference--top-5-things-to-remember)

> This chapter covers the **Text Transformation** stage of a search engine: what happens to a document's text between the document store and the index. It assumes the architecture of [Search Engines & the Web](topic-search-engines.en-US.md) and the stored documents of [Document Conversion, Storage & Duplicates](topic-documents.en-US.md); its output (index terms, phrases, extra text fields) is what [Inverted Indexes & Index Construction](topic-indexing.en-US.md) stores and [Retrieval Models](topic-retrieval-models.en-US.md) ranks.

## 1. From Documents to Index Terms

The **corpus** is the complete set of documents available to be searched. In web search it is the full set of pages the engine will consider — what text acquisition put in the local document store.

**Text processing** is the stage where the documents of the corpus are prepared for use in the search engine. It happens **before building the index**, to improve efficiency and performance, and it typically has **two main steps**:

1. **Tokenization** (lexical analysis) — breaking the text into tokens.
2. **Linguistic pre-processing** — applying rules to the tokens to improve the efficiency of the index: stopping and stemming (§4–§5), plus phrase detection (§6).

Why not simply index the raw strings?

- Matching **the exact string of characters** the user typed is **too restrictive** for web search — it does not work well for effectiveness (for example, case-sensitive search may or may not be what you want).
- **Not all words are of equal value** in a search.
- Sometimes it is not clear **where words begin and end** — in languages like Chinese and Korean it is not even clear what a word is.

Processing text is the essential step that converts documents into **index terms**. The rest of the chapter follows the pipeline: tokenizing (§2), statistics that guide the later choices (§3), stopping (§4), stemming (§5), phrases (§6), and the structure and links that tell the engine which parts of a page matter most (§7–§8).

> 📘 **Going further**: [Croft §3.1 Deciding What to Search (book p. 31)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §4.1 From Words to Terms (book p. 73)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 2. Tokenization

### 2.1 What a tokenizer does

**Tokenizing**, or **lexical analysis**, forms units of meaning from characters, usually from sequences of them: it **breaks the input into simple units of meaning**. A token can be a word — or not; it depends on how you choose to create tokens. It is surprisingly complex in English and can be harder in other languages.

The tokenizer (also called a **lexer** or **scanner**) turns a **character stream into a token stream**. The same machine shows up in two places:

| Where | What the tokenizer feeds |
|---|---|
| Compiler front-end | A parser |
| Preprocessor for information retrieval | The retrieval system |

Turning upper case into lower case has several names: **case folding**, **normalization** or **downcasing**.

### 2.2 What is a token? It depends

"Divide on whitespace and throw away punctuation" is the obvious rule, but some cases force a choice:

| Problem | Examples |
|---|---|
| Apostrophes | O'Neill, Aren't |
| Hyphens | clear-headed vs clearheaded; mother-in-law |
| Several words, one token? | San Francisco; white space; New York University vs York University |
| Tokens that aren't words | `info@uci.edu`, `http://www.ics.uci.edu/`, `192.168.0.1` |

There is no universally right answer: each choice decides which queries can match (three tokens for New York University means "York University" matches it too).

### 2.3 The early tokenization methodology

Early IR systems used a very simple rule:

- A token is a **sequence of 3 or more alphanumeric characters**.
- A **space or special character** ends the token.
- All characters are converted to **lower case**.

On a sample sentence it gives:

```text
"Bigcorp's 2007 bi-annual report showed profits rose 10%."
        ↓
"bigcorp 2007 annual report showed profits rose"
```

`s`, `bi` and `10` are shorter than 3 characters and are thrown away. The verdict: **too generic and simple, resulting in a lot of lost information** — it is too simple for search, or even for large-scale experiments. Small decisions in tokenizing can have a **major impact** on the effectiveness of some queries.

Step through the rule character by character, or type your own text:

```viz tokenize
{"title": "Early tokenization methodology", "text": "Bigcorp's 2007 bi-annual report showed profits rose 10%.", "interactive": true}
```

> ⚠️ **Pitfall**: This is the *historical* rule, shown to expose what a naive tokenizer loses. Real systems decide the cases of §2.4 explicitly, and a rule you are given for a particular task overrides this demo's choices.

> 📝 **Practice**: [§2.6](#26-practice)

### 2.4 Hard cases to consider

| Problem | Why it matters | Examples |
|---|---|---|
| **Small words** | Can be important in some queries, usually in combinations | xp, am, pm, el paso, world war II, "to be or not to be" |
| **Hyphens — merge** | Sometimes the hyphen isn't needed; both forms are common, so merge them | e-bay, wal-mart, active-x, cd-rom, t-shirts |
| **Hyphens — hard cases** | The hyphen may be part of the word or a word separator; harder to decide | winston-salem, mazda rx-7, e-cards, pre-diabetes, t-mobile, spanish-speaking |
| **Special characters** | Important parts of tags, URLs, code in documents | — |
| **Capitalized words** | May or may not mean the same as lower case | "Bush", "Apple" vs "bush", "apple" |
| **Apostrophes** | Part of a word, part of a possessive, or just a mistake | rosie o'donnell, can't, don't, 80's, 1890's, men's straw hats, master's degree, england's ten largest cities, shriner's |
| **Numbers** | Can be important, decimals included | nokia 3250, top 10 courses, united 93, quicktime 6.5 pro, 92.3 the beat, 288358, 3.14159265 |
| **Periods** | Appear in numbers, abbreviations, URLs, ends of sentences, … | I.B.M., Ph.D., cs.umass.edu, F.E.A.R. |

> ⚠️ **Pitfall**: In a search engine, the tokenizing steps for **queries must be identical** to the steps for documents. If documents index `ibm` but the query is tokenized to `i`, `b`, `m`, nothing matches.

> 📘 **Going further**: [Croft §4.3.2 Tokenizing (book p. 87)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 2.5 The tokenizing process

Tokenizing is a **multiple-step process**. The first step uses a **tokenizer + parser** to identify which parts of the document to tokenize for search (the markup of §7 is where the parser earns its keep).

The most general strategy is to **defer complex decisions to other components**:

- A word is any set of alphanumeric characters, ended by a space or special character, with everything converted to lower case.
- **Everything is indexed**, and the system keeps track of additional information. Example: `92.3` → `92` `3`, but a search still finds documents with `92` and `3` **adjacent**.
- Add some special rules to reduce dependence on the query transformation components.

That is not very different from the simple tokenizing used in the past. Rules used with early **TREC** collections:

| Rule | Examples |
|---|---|
| Apostrophes in words ignored | o'connor → `oconnor`, bob's → `bobs` |
| Periods in abbreviations ignored | I.B.M. → `ibm`, Ph.D. → `phd` |

Difficult cases are still left to **post-processing**: information extraction and query transformation.

> 💡 **Key Insight**: The tokenizer stays simple on purpose and keeps enough information (like word positions) that later stages can recover what it threw away.

### 2.6 Practice

#### Early tokenization of the Bigcorp sentence

Apply the early methodology (tokens = runs of 3 or more alphanumeric characters; any space or special character ends a token; lower-case everything) to:

`Bigcorp's 2007 bi-annual report showed profits rose 10%.`

<details>
<summary>Solution</summary>

Split at every non-alphanumeric character (`'`, spaces, `-`, `%`, `.`) and lower-case: `bigcorp`, `s`, `2007`, `bi`, `annual`, `report`, `showed`, `profits`, `rose`, `10`. Drop the runs shorter than 3 — `s`, `bi`, `10`. Result: `bigcorp 2007 annual report showed profits rose`, 7 tokens. Lost: the "bi" that changes "annual" and the 10% that was the news — "too generic".

</details>

#### What happens to the tricky tokens?

Run each of these inputs through (a) "split on whitespace, then throw away punctuation" and (b) the early methodology (runs of 3+ alphanumerics, lower-cased): O'Neill, Aren't, clear-headed, clearheaded, mother-in-law, San Francisco, New York University, `info@uci.edu`, `http://www.ics.uci.edu/`, `192.168.0.1`. Which ones go wrong, and how?

<details>
<summary>Solution</summary>

| Input | (a) whitespace + drop punctuation | (b) early methodology (3+ alnum) |
|---|---|---|
| O'Neill | `oneill` | `neill` (`o` dropped) |
| Aren't | `arent` | `aren` (`t` dropped) |
| clear-headed | `clearheaded` | `clear`, `headed` |
| clearheaded | `clearheaded` | `clearheaded` |
| mother-in-law | `motherinlaw` | `mother`, `law` (`in` dropped) |
| San Francisco | `san`, `francisco` | `san`, `francisco` |
| New York University | `new`, `york`, `university` | `new`, `york`, `university` |
| `info@uci.edu` | `infouciedu` | `info`, `uci`, `edu` |
| `http://www.ics.uci.edu/` | `httpwwwicsuciedu` | `http`, `www`, `ics`, `uci`, `edu` |
| `192.168.0.1` | `19216801` | `192`, `168` (`0`, `1` dropped) |

Rule (a) makes clear-headed match clearheaded but glues e-mails, URLs and IPs into meaningless strings; rule (b) shreds them and loses the short parts. **Neither** keeps O'Neill, "San Francisco" or "New York University" as one unit. Every fix is a design decision — "What is a token? Depends…". Check column (b):

```viz tokenize
{"title": "Tricky tokens under the early method", "text": "O'Neill aren't clear-headed mother-in-law"}
```

</details>

## 3. Text Statistics and Zipf's Law

### 3.1 Why statistics matter

Text uses a huge variety of words, but **many statistical characteristics of word occurrences are predictable**, for example the distribution of word counts. **Retrieval models and ranking algorithms depend heavily on them** ([Retrieval Models](topic-retrieval-models.en-US.md)): the important words for retrieval **occur often in a document but are not frequent in the corpus**.

### 3.2 Zipf's law

The distribution of word frequencies is **very skewed**: a few words occur very often, many hardly ever. The two most common words ("the", "of") make up **about 10%** of all word occurrences. Zipf's "law": **the frequency of the $r$-th most common word is inversely proportional to $r$** — rank times frequency is about constant:

$$r \cdot f \approx k \qquad\text{or}\qquad r \cdot P_r \approx c, \quad c \approx 0.1 \text{ for English}$$

$r$ is the rank (words sorted by decreasing frequency), $f$ the word's frequency, $P_r$ its probability of occurrence (frequency / total word occurrences), and $k$, $c$ constants. Plotted for English, $P_r$ (0–0.1) against rank (0–100) is a curve that starts near 0.1, drops steeply over the first ~10 ranks, then flattens close to 0 — the shape of $0.1/r$.

### 3.3 Zipf's law on AP89

**AP89** (Associated Press 1989 news) statistics:

| Statistic | Value |
|---|---|
| Total documents | 84,678 |
| Total word occurrences | 39,749,179 |
| Vocabulary size (unique words) | 198,763 |
| Words occurring > 1000 times | 4,169 |
| Words occurring once | 70,064 |

AP89's 50 most frequent words, with $P_r$ (in %) and $r \cdot P_r$ computed from the frequencies and the total of 39,749,179 occurrences (the script that produced them is below the table):

| Word | Freq. | r | $P_r$ (%) | $r \cdot P_r$ | Word | Freq. | r | $P_r$ (%) | $r \cdot P_r$ |
|---|---|---|---|---|---|---|---|---|---|
| the | 2,420,778 | 1 | 6.09 | 0.061 | has | 136,007 | 26 | 0.34 | 0.089 |
| of | 1,045,733 | 2 | 2.63 | 0.053 | are | 130,322 | 27 | 0.33 | 0.089 |
| to | 968,882 | 3 | 2.44 | 0.073 | not | 127,493 | 28 | 0.32 | 0.090 |
| a | 892,429 | 4 | 2.25 | 0.090 | who | 116,364 | 29 | 0.29 | 0.085 |
| and | 865,644 | 5 | 2.18 | 0.109 | they | 111,024 | 30 | 0.28 | 0.084 |
| in | 847,825 | 6 | 2.13 | 0.128 | its | 111,021 | 31 | 0.28 | 0.087 |
| said | 504,593 | 7 | 1.27 | 0.089 | had | 103,943 | 32 | 0.26 | 0.084 |
| for | 363,865 | 8 | 0.92 | 0.073 | will | 102,949 | 33 | 0.26 | 0.085 |
| that | 347,072 | 9 | 0.87 | 0.079 | would | 99,503 | 34 | 0.25 | 0.085 |
| was | 293,027 | 10 | 0.74 | 0.074 | about | 92,983 | 35 | 0.23 | 0.082 |
| on | 291,947 | 11 | 0.73 | 0.081 | i | 92,005 | 36 | 0.23 | 0.083 |
| he | 250,919 | 12 | 0.63 | 0.076 | been | 88,786 | 37 | 0.22 | 0.083 |
| is | 245,843 | 13 | 0.62 | 0.080 | this | 87,286 | 38 | 0.22 | 0.083 |
| with | 223,846 | 14 | 0.56 | 0.079 | their | 84,638 | 39 | 0.21 | 0.083 |
| at | 210,064 | 15 | 0.53 | 0.079 | new | 83,449 | 40 | 0.21 | 0.084 |
| by | 209,586 | 16 | 0.53 | 0.084 | or | 81,796 | 41 | 0.21 | 0.084 |
| it | 195,621 | 17 | 0.49 | 0.084 | which | 80,385 | 42 | 0.20 | 0.085 |
| from | 189,451 | 18 | 0.48 | 0.086 | we | 80,245 | 43 | 0.20 | 0.087 |
| as | 181,714 | 19 | 0.46 | 0.087 | more | 76,388 | 44 | 0.19 | 0.085 |
| be | 157,300 | 20 | 0.40 | 0.079 | after | 75,165 | 45 | 0.19 | 0.085 |
| were | 153,913 | 21 | 0.39 | 0.081 | us | 72,045 | 46 | 0.18 | 0.083 |
| an | 152,576 | 22 | 0.38 | 0.084 | percent | 71,956 | 47 | 0.18 | 0.085 |
| have | 149,749 | 23 | 0.38 | 0.087 | up | 71,082 | 48 | 0.18 | 0.086 |
| his | 142,285 | 24 | 0.36 | 0.086 | one | 70,266 | 49 | 0.18 | 0.087 |
| but | 140,880 | 25 | 0.35 | 0.089 | people | 68,988 | 50 | 0.17 | 0.087 |

```python
rows = [("the", 2420778), ("of", 1045733), ("to", 968882), ("a", 892429), ("and", 865644),
        ("in", 847825), ("said", 504593), ("for", 363865), ("that", 347072), ("was", 293027),
        ("on", 291947), ("he", 250919), ("is", 245843), ("with", 223846), ("at", 210064), ("by",
        209586), ("it", 195621), ("from", 189451), ("as", 181714), ("be", 157300), ("were",
        153913), ("an", 152576), ("have", 149749), ("his", 142285), ("but", 140880), ("has",
        136007), ("are", 130322), ("not", 127493), ("who", 116364), ("they", 111024), ("its",
        111021), ("had", 103943), ("will", 102949), ("would", 99503), ("about", 92983), ("i",
        92005), ("been", 88786), ("this", 87286), ("their", 84638), ("new", 83449), ("or",
        81796), ("which", 80385), ("we", 80245), ("more", 76388), ("after", 75165), ("us",
        72045), ("percent", 71956), ("up", 71082), ("one", 70266), ("people", 68988)]  # rank order 1-50
N = 39749179
rp = [r * f / N for r, (w, f) in enumerate(rows, 1)]
for r in (1, 2, 3, 50):
    w, f = rows[r - 1]
    print(r, w, f, f"P_r = {100 * f / N:.2f}%", f"r*P_r = {rp[r - 1]:.3f}")
print("ranks 1-10:  r*P_r from", f"{min(rp[:10]):.3f}", "to", f"{max(rp[:10]):.3f}")
print("ranks 11-50: r*P_r from", f"{min(rp[10:]):.3f}", "to", f"{max(rp[10:]):.3f}")
```

```text
1 the 2420778 P_r = 6.09% r*P_r = 0.061
2 of 1045733 P_r = 2.63% r*P_r = 0.053
3 to 968882 P_r = 2.44% r*P_r = 0.073
50 people 68988 P_r = 0.17% r*P_r = 0.087
ranks 1-10:  r*P_r from 0.053 to 0.128
ranks 11-50: r*P_r from 0.076 to 0.090
```

Across the 50 words, $r \cdot P_r$ ranges from 0.053 to 0.128 in the top 10 (the biggest swings are at the very top: "of" 0.053, "in" 0.128), then settles between 0.076 and 0.090 from rank 11 to 50 — close to Zipf's $c \approx 0.1$.

On a **log-log** plot of probability ($10^{-8}$ to 1) against rank (1 to $10^6$), the Zipf line $P_r = 0.1/r$ is a straight line of slope −1. The AP89 points follow it through the middle ranks, sit **below** it at the very top ranks (the first few words), and **fall away** below it for ranks past ~10,000, ending in flat steps of rare words. **Note the problems at high and low frequencies.** Words that occur only once are **hapax legomena** (ἅπαξ λεγόμενον, "said once") — 70,064 of AP89's 198,763 words, about 35%.

> ⚠️ **Pitfall**: A published version of this table lists $P_r$ values about 6% higher than the ones above ("the" = 6.49%, not 6.09%, which would put $r \cdot P_r$ in 0.081–0.096 for ranks 11–50). Those numbers are consistent with a total of about 37.3 million occurrences (2,420,778 / 0.0649), not the 39,749,179 stated in the statistics table. Always recompute from the frequencies and the stated total; the Zipf conclusion (roughly constant $r \cdot P_r$ in the middle, bending at both ends) does not change.

> 📘 **Going further**: [Croft §4.2 Text Statistics (book p. 75)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §4.2.1 Vocabulary Growth (book p. 80)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §4.2.2 Estimating Collection and Result Set Sizes (book p. 83)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **Practice**: [§3.4](#34-practice)

### 3.4 Practice

#### Checking Zipf's law on AP89

Use these AP89 figures: 39,749,179 word occurrences, 198,763 unique words, 70,064 words occurring once, 4,169 words occurring more than 1,000 times; "the" occurs 2,420,778 times (rank 1), "of" 1,045,733 times (rank 2), and "people" 68,988 times (rank 50). How much of the text are "the" and "of"? Is $r \cdot P_r$ near 0.1 for "people"? What fraction of the vocabulary are hapax legomena, and what fraction occur more than 1,000 times?

<details>
<summary>Solution</summary>

- "the" + "of": (2,420,778 + 1,045,733) / 39,749,179 = 3,466,511 / 39,749,179 = **8.7%** — the "about 10%" of Zipf's law (6.09% + 2.63%).
- "people": $r \cdot P_r = 50 \times 68{,}988 / 39{,}749{,}179 = 0.087$, close to 0.1. In general $r \cdot P_r$ is 0.061 for "the" and 0.053 for "of", and stays between 0.076 and 0.090 for ranks 11–50 (see the table in §3.3).
- Hapax legomena: 70,064 / 198,763 = **35%** of the vocabulary occurs exactly once; only 4,169 words (2.1%) occur more than 1,000 times.

Zipf holds roughly in the middle and breaks at both ends — the problems at high and low frequencies.

</details>

## 4. Stopping and Stopwords

**Function words** — determiners, prepositions — have little meaning on their own and very high occurrence frequencies (the top of the Zipf curve in §3). They can be treated as **stopwords**, i.e. removed, which:

- reduces index space,
- improves response time,
- improves effectiveness.

However, they can be important **in combinations**: "to be or not to be" is all stopwords.

**Building the list**: a stopword list can be made from the highest-frequency words or from a standard list. Lists are customized for applications, domains, and even **parts of documents** — "click" and "here" are good stopwords for anchor text (§8).

> 💡 **Key Insight**: The usual best policy is to **index all words** in the documents and decide **at query time** which words to use. Removing a word at indexing time can't be undone.

> 📘 **Going further**: [Croft §4.3.3 Stopping (book p. 90)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 5. Stemming: Suffix-s, Porter, Krovetz

### 5.1 Morphology and why stem

Stemming is also called **conflation**. Words are made of **morphemes**:

- **Stems** are the core units.
- **Affixes** are the units that adhere to stems. In "stems", STEM is the stem and S is the affix.

Many words have morphological variations: **inflectional** (plurals, tenses) and **derivational** (turning verbs into nouns by adding a suffix such as *-ation*). In most cases the variants have the same or very similar meanings.

**Stemmers** try to reduce those variations to a **common stem**, usually by removing suffixes. Like stopping, this can happen at indexing time and/or during query processing. Example: a user searches "mark spitz swimming", but pages about past events say "swam". The stemmer has to turn both "swimming" and "swam" into the same stem (e.g. "swim") for them to match.

The payoff is usually **small but significant**: about 5–10% better effectiveness for English, and up to 50% for Arabic or Russian, where it can be crucial. Arabic builds many words around one root — the root *ktb*:

| Word | Meaning |
|---|---|
| kitab | a book |
| kitabi | my book |
| alkitab | the book |
| kitabuki | your book (f) |
| kitabuka | your book (m) |
| kitabuhu | his book |
| kataba | to write |
| maktaba | library, bookstore |
| maktab | office |

**Two basic types**, both language dependent:

- **Dictionary-based**: uses lists of related words.
- **Algorithmic**: uses a program to determine related words.

### 5.2 The suffix-s stemmer

The simplest English algorithmic stemmer is **suffix-s**: remove an "s" ending, assuming it's a plural.

```python
def suffix_s(word):
    return word[:-1] if word.endswith("s") else word

for w in ["cats", "lakes", "wiis", "centuries", "is"]:
    print(w, "->", suffix_s(w))
```

```text
cats -> cat
lakes -> lake
wiis -> wii
centuries -> centurie
is -> i
```

It makes **many false negatives** (related words it fails to join: centuries ↛ century) and **some false positives** (unrelated words it joins: is → i).

> ⚠️ **Pitfall**: Mind the direction. A **false positive** conflates words that *shouldn't* match (is/I); a **false negative** misses words that *should* (centuries/century).

### 5.3 The Porter stemmer

The **Porter stemmer** is an algorithmic stemmer used in IR experiments since around 1980:

- It is a **series of rules** in five steps; at each step, the rule for the **longest applicable suffix** is executed.
- It is effective in TREC.
- It produces **stems, not words**.
- Drawback: it makes a number of errors and is difficult to modify.

Step 1 (one of the five), in full:

```text
Step 1a:
- Replace sses by ss (e.g., stresses → stress).
- Delete s if the preceding word part contains a vowel not immediately
  before the s (e.g., gaps → gap but gas → gas).
- Replace ied or ies by i if preceded by more than one letter, otherwise
  by ie (e.g., ties → tie, cries → cri).
- If suffix is us or ss do nothing (e.g., stress → stress).
Step 1b:
- Replace eed, eedly by ee if it is in the part of the word after the
  first non-vowel following a vowel (e.g., agreed → agree, feed → feed).
- Delete ed, edly, ing, ingly if the preceding word part contains a
  vowel, and then if the word ends in at, bl, or iz add e (e.g., fished →
  fish, pirating → pirate), or if the word ends with a double letter that
  is not ll, ss or zz, remove the last letter (e.g., falling → fall,
  dripping → drip), or if the word is short, add e (e.g., hoping → hope).
- Whew!
```

Step through all twelve examples below, or type your own words. The table fills in each word after 1a and after 1b — a purple cell means *that* step changed the word, and the final stem is bold — and the code panel highlights the rule that fired:

```viz porter-step1
{"title": "Porter Step 1a + 1b on twelve examples", "words": "stresses, gaps, gas, ties, cries, agreed, feed, fished, pirating, falling, dripping, hoping", "interactive": true}
```

Every example comes out as stated: stress, gap, gas, tie, cri, agree, feed, fish, pirate, fall, drip, hope. Note "cri": a stem, not a word.

**Porter's mistakes**:

| False positives (conflated, shouldn't be) | False negatives (not conflated, should be) |
|---|---|
| organization / organ | european / europe |
| generalization / generic | cylinder / cylindrical |
| numerical / numerous | matrices / matrix |
| policy / police | urgency / urgent |
| university / universe | create / creation |
| addition / additive | analysis / analyses |
| negligible / negligent | useful / usefully |
| execute / executive | noise / noisy |
| past / paste | decompose / decomposition |
| ignore / ignorant | sparse / sparsity |
| special / specialized | resolve / resolution |
| head / heading | triangle / triangular |

The **Porter2** stemmer addresses some of these issues, and you can include exceptions. A similar approach has been used for other languages.

> 📘 **Going further**: [Porter stemmer (tartarus.org)](https://tartarus.org/martin/PorterStemmer/) · [Porter2 / Snowball English stemmer](http://snowball.tartarus.org/algorithms/english/stemmer.html) · [Croft §4.3.4 Stemming (book p. 91)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 5.4 Dictionary stemmers and the Krovetz stemmer

**Dictionary stemmers** use human-built word lists of `(word, stem)` pairs:

- **Very low false positive rate**.
- Related words don't need to look alike: "is", "be", "was".
- Important drawback: they **can't react automatically to new words**.
- Lists can be built semi-automatically by statistical analysis, then curated by humans. This is useful for **query expansion** in search applications.

The **Krovetz stemmer** is a **hybrid** of algorithmic and dictionary. It rests on the observation that irregular words are usually the oldest in the language, while new words tend to follow regular grammatical conventions.

1. The word is checked in the dictionary. If it's there, it's left alone or replaced with its "exception".
2. If not, the word is checked for suffixes that could be removed.
3. After removal, the dictionary is checked again.

Its advantage: it usually produces **words, not stems**. It has a lower false positive rate and a somewhat higher false negative rate (depending on the size and curation of the dictionary). For search, effectiveness is comparable.

### 5.5 Porter vs Krovetz on one text

| | Text |
|---|---|
| **Original** | Document will describe marketing strategies carried out by U.S. companies for their agricultural chemicals, report predictions for market share of such chemicals, or report market statistics for agrochemicals, pesticide, herbicide, fungicide, insecticide, fertilizer, predicted sales, market share, stimulate demand, price cut, volume of sales. |
| **Porter** | document describ market strategi carri compani agricultur chemic report predict market share chemic report market statist agrochem pesticid herbicid fungicid insecticid fertil predict sale market share stimul demand price cut volum sale |
| **Krovetz** | document describe marketing strategy carry company agriculture chemical report prediction market share chemical report market statistic agrochemic pesticide herbicide fungicide insecticide fertilizer predict sale stimulate demand price cut volume sale |

Both outputs have also dropped the stopwords (will, out, by, for, their, of, such, or). Porter's tokens are stems like "strategi" and "compani"; Krovetz's are real words like "strategy" and "company".

> 💡 **Key Insight**: Algorithmic = rules, many errors, no dictionary to maintain. Dictionary = few false positives, can't handle new words. Krovetz = dictionary first, rules as a fallback.

| Stemmer | Type | Output | Errors |
|---|---|---|---|
| suffix-s | Algorithmic | Stem | Many false negatives, some false positives |
| Porter | Algorithmic (rules, longest suffix) | Stems | Many errors, hard to modify |
| Porter2 | Algorithmic | Stems | Fixes some Porter issues, allows exceptions |
| Dictionary | Word lists | Words | Very few false positives; can't handle new words |
| Krovetz | Hybrid: dictionary, then suffix removal | Words | Fewer false positives, somewhat more false negatives |

> 📝 **Practice**: [§5.6](#56-practice)

### 5.6 Practice

#### Suffix-s: false positives and false negatives

Apply the suffix-s stemmer (remove an "s" ending, assuming a plural) to cats, lakes, wiis, centuries, is. Which results are false negatives and which are false positives?

<details>
<summary>Solution</summary>

cats → cat, lakes → lake and wiis → wii are correct. centuries → **centurie**, not century: it fails to conflate two related words, so it's a **false negative**. is → **i**: it conflates two unrelated words, so it's a **false positive**.

</details>

#### Porter Step 1 by hand

Using only Step 1a then Step 1b as stated in §5.3, stem: stresses, gaps, gas, ties, cries, agreed, feed, fished, pirating, falling, dripping, hoping.

<details>
<summary>Solution</summary>

| Word | Rule that fires | Result |
|---|---|---|
| stresses | 1a: sses → ss | stress |
| gaps | 1a: delete s (vowel "a" before the "p") | gap |
| gas | 1a: keep s (the vowel "a" is immediately before the s) | gas |
| ties | 1a: ies → ie (only one letter, "t", before it) | tie |
| cries | 1a: ies → i (more than one letter before it) | cri |
| agreed | 1b: eed → ee (the suffix is after "ag", the first non-vowel following a vowel) | agree |
| feed | 1b: eed kept (the suffix isn't in that region) | feed |
| fished | 1b: delete ed | fish |
| pirating | 1b: delete ing, then "at" → add e | pirate |
| falling | 1b: delete ing; "ll" is an allowed double letter | fall |
| dripping | 1b: delete ing, then double "p" → drop one | drip |
| hoping | 1b: delete ing, then short word → add e | hope |

The demo in §5.3 runs exactly these rules and gives the same twelve results.

</details>

## 6. Phrases: POS Tagging and Word N-Grams

### 6.1 Why phrases

Phrases are important in search: many web search queries are **2–3 word phrases**. Phrases are:

- **More precise** than single words — documents containing "black sea" vs. the two words "black" and "sea". **Order matters**: do you want pages with "the sea turned black"?
- **Less ambiguous** — "big apple" vs. "apple".

They can be **difficult for ranking**, and the details depend on the model. Given the query "fishing supplies", how should you score documents with the exact phrase many times, the exact phrase once, the words in the same sentence, the same paragraph, the whole document, or variations on the words?

Two questions: **what is a phrase?** and **how are phrases recognized?** There are three approaches:

1. Identify syntactic phrases with a **part-of-speech (POS) tagger** (§6.2).
2. Use **word n-grams** (§6.3).
3. Store **word positions** in the index and use **proximity operators** in queries ([Inverted Indexes & Index Construction](topic-indexing.en-US.md)).

> 📘 **Going further**: [Croft §4.3.5 Phrases and N-grams (book p. 97)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 6.2 Part-of-speech tagging

POS taggers use **statistical / machine-learning models** of text to predict the syntactic tag of each word. Example tags:

| Tag | Meaning | Tag | Meaning |
|---|---|---|---|
| NN | singular noun | IN | preposition |
| NNS | plural noun | JJ | adjective |
| VB | verb | CC | conjunction (e.g. "and", "or") |
| VBD | verb, past tense | PRP | pronoun |
| VBN | verb, past participle | MD | modal auxiliary (e.g. "can", "will") |

Phrases can then be defined as **simple noun groups**. The Brill tagger on the comparison text of §5.5:

```text
Document/NN will/MD describe/VB marketing/NN strategies/NNS carried/VBD
out/IN by/IN U.S./NNP companies/NNS for/IN their/PRP agricultural/JJ
chemicals/NNS ,/, report/NN predictions/NNS for/IN market/NN share/NN
of/IN such/JJ chemicals/NNS ,/, or/CC report/NN market/NN statistics/NNS
for/IN agrochemicals/NNS ,/, pesticide/NN ,/, herbicide/NN ,/,
fungicide/NN ,/, insecticide/NN ,/, fertilizer/NN ,/, predicted/VBN
sales/NNS ,/, market/NN share/NN ,/, stimulate/VB demand/NN ,/, price/NN
cut/NN ,/, volume/NN of/IN sales/NNS ./.
```

The most frequent noun phrases found this way in two collections (TREC news and a patent collection):

| TREC freq. | TREC phrase | Patent freq. | Patent phrase |
|---|---|---|---|
| 65824 | united states | 975362 | present invention |
| 61327 | article type | 191625 | u.s. pat |
| 33864 | los angeles | 147352 | preferred embodiment |
| 18062 | hong kong | 95097 | carbon atoms |
| 17788 | north korea | 87903 | group consisting |
| 17308 | new york | 81809 | room temperature |
| 15513 | san diego | 78458 | seq id |
| 15009 | orange county | 75850 | brief description |
| 12869 | prime minister | 66407 | prior art |
| 12799 | first time | 59828 | perspective view |
| 12067 | soviet union | 58724 | first embodiment |
| 10811 | russian federation | 56715 | reaction mixture |
| 9912 | united nations | 54619 | detailed description |
| 8127 | southern california | 54117 | ethyl acetate |
| 7640 | south korea | 52195 | example 1 |
| 7620 | end recording | 52003 | block diagram |
| 7524 | european union | 46299 | second embodiment |
| 7436 | south africa | 41694 | accompanying drawings |
| 7362 | san francisco | 40554 | output signal |
| 7086 | news conference | 37911 | first end |
| 6792 | city council | 35827 | second end |
| 6348 | middle east | 34881 | appended claims |
| 6157 | peace process | 33947 | distal end |
| 5955 | human rights | 32338 | cross-sectional view |
| 5837 | white house | 30193 | outer surface |

### 6.3 Word n-grams

POS tagging is **too slow for large collections**. The simpler definition: a phrase is **any sequence of n words**, an **n-gram** (also called a **shingle**). A bigram is 2 words, a trigram 3, a unigram a single word. N-grams are also used at the **character level**, for applications such as OCR.

N-grams are usually formed from **overlapping** word sequences: move an n-word "window" one word at a time through the document.

```python
def ngrams(words, n):
    return [" ".join(words[i:i + n])
            for i in range(len(words) - n + 1)]

words = "the sea turned black".split()
for n in (1, 2, 3):
    print(n, ngrams(words, n))
```

```text
1 ['the', 'sea', 'turned', 'black']
2 ['the sea', 'sea turned', 'turned black']
3 ['the sea turned', 'sea turned black']
```

Run it below; the step counts the n-grams of a 1,000-word document:

```viz web-demo
{"title": "Word n-grams: a window moving one word at a time", "html": "<p>See the console.</p>", "js": "const words = \"the sea turned black\".split(\" \");\nfunction ngrams(ws, n) {\n  const out = [];\n  for (let i = 0; i + n <= ws.length; i++) out.push(ws.slice(i, i + n).join(\" \"));\n  return out;\n}\nconsole.log(\"unigrams\", ngrams(words, 1));\nconsole.log(\"bigrams \", ngrams(words, 2));\nconsole.log(\"trigrams\", ngrams(words, 3));", "steps": [{"note": "Count the windows instead of listing them: a document of N words has N − n + 1 n-grams of length n.", "js": "\n// n-gram instances in a 1,000-word document, 2 <= n <= 5\nlet total = 0;\nfor (let n = 2; n <= 5; n++) { console.log(\"n =\", n, \":\", 1000 - n + 1); total += 1000 - n + 1; }\nconsole.log(\"total\", total);"}], "height": 60, "interactive": true}
```

What n-grams buy you:

- **Frequent n-grams are more likely to be meaningful phrases.**
- N-grams form a **Zipf distribution** — a better fit than words alone (Zipf's law is in §3).
- You could **index all n-grams** up to a specified length. Advantage: **much faster than POS tagging**. Drawback: **uses a lot of storage** — a 1,000-word document contains **3,990** instances of word n-grams with 2 ≤ n ≤ 5 (a window of $n$ words fits in $N - n + 1$ positions in an $N$-word document).

**Google n-grams**: even at that storage cost, **many web search engines do index n-grams**. Google's sample:

| | Count |
|---|---|
| Tokens | 1,024,908,267,229 |
| Sentences | 95,119,665,584 |
| Unigrams | 13,588,391 |
| Bigrams | 314,843,401 |
| Trigrams | 977,069,902 |
| Fourgrams | 1,313,818,354 |
| Fivegrams | 1,176,470,663 |

The most frequent trigram in English on the web is **"all rights reserved"**; in Chinese, "limited liability corporation".

> 📝 **Practice**: [§6.4](#64-practice)

### 6.4 Practice

#### How many n-grams in a 1,000-word document?

A document has 1,000 words. How many word n-gram instances does it contain for 2 ≤ n ≤ 5, with an overlapping window?

<details>
<summary>Solution</summary>

A window of n words fits in $1000 - n + 1$ positions: 999 bigrams, 998 trigrams, 997 fourgrams and 996 fivegrams. That's $999 + 998 + 997 + 996 = 3{,}990$ — four times the document's length. That's the storage cost of indexing n-grams.

</details>

## 7. Document Structure and Markup

**Some parts of a document are more important than others.** The document parser recognizes structure from markup such as HTML tags:

- **Headers, anchor text and bolded text** are all likely to contain important text.
- **Metadata** can also be important.
- **Links** are used for link analysis ([Link Analysis: HITS & PageRank](topic-link-analysis.en-US.md)).

Take the Wikipedia page "Tropical fish". The rendered page has the title, "From Wikipedia, the free encyclopedia", and two paragraphs with many linked words (fish, tropical, freshwater, salt water, Fishkeepers, aquarium, iridescence, pigmented). Its HTML source, abridged:

```html
<html>
<head>
<meta name="keywords" content="Tropical fish, Airstone, Albinism, Algae eater,
Aquarium, Aquarium fish feeder, Aquarium furniture, Aquascaping, Bath treatment
(fishkeeping),Berlin Method, Biotope" />
...
<title>Tropical fish - Wikipedia, the free encyclopedia</title>
</head>
<body>
...
<h1 class="firstHeading">Tropical fish</h1>
...
<p><b>Tropical fish</b> include <a href="/wiki/Fish" title="Fish">fish</a> found in <a
href="/wiki/Tropics" title="Tropics">tropical</a> environments around the world,
including both <a href="/wiki/Fresh_water" title="Fresh water">freshwater</a> and <a
href="/wiki/Sea_water" title="Sea water">salt water</a> species. <a
href="/wiki/Fishkeeping" title="Fishkeeping">Fishkeepers</a> often use the term
<i>tropical fish</i> to refer only those requiring fresh water, with saltwater tropical fish
referred to as <i><a href="/wiki/List_of_marine_aquarium_fish_species" title="List of
marine aquarium fish species">marine fish</a></i>.</p>
<p>Tropical fish are popular <a href="/wiki/Aquarium" title="Aquarium">aquarium</a>
fish , due to their often bright coloration. In freshwater fish, this coloration typically
derives from <a href="/wiki/Iridescence" title="Iridescence">iridescence</a>, while salt
water fish are generally <a href="/wiki/Pigment" title="Pigment">pigmented</a>.</p>
...
</body></html>
```

The markup tells the parser what's what: the `<title>`, the `<h1>` heading, the bold `<b>Tropical fish</b>`, the keywords `<meta>`, and every `<a href>` link. The links (freshwater, salt water, aquarium, iridescence, pigmented) lead into §8.

> 📘 **Going further**: [Croft §4.4 Document Structure and Markup (book p. 101)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 8. Links and Anchor Text

Links are a key component of the Web: important for navigation, but also for search. In

```html
<a href="http://example.com">Example website</a>
```

"Example website" is the **anchor text** and `http://example.com` is the **destination link**. Search engines use both.

Anchor text is used as a **description of the content of the destination page**. The anchor text of **all links pointing to a page** is collected into an **additional text field** for that page. For example, the page `www.example.com` has four fields:

| Field | Content |
|---|---|
| text (the page's own body) | document text |
| anchor from other.com | example |
| anchor from null.com | click here |
| title | example site |

Anchor text tends to be **short, descriptive, and similar to query text**. Retrieval experiments have shown that it has a **significant impact on effectiveness for some types of queries — more than PageRank!** (PageRank, which uses only the link structure and not the words on the link, is in [Link Analysis: HITS & PageRank](topic-link-analysis.en-US.md).)

> ⚠️ **Pitfall**: Anchor text describes the page the link **points to**, not the page it sits on. And "click here" is the kind of anchor text a stopword list for anchors removes (§4).

> 📘 **Going further**: [Croft §4.5.1 Anchor Text (book p. 105)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 9. Quick Reference & Top 5 Things to Remember

| Text-processing step | What it does | Watch out for |
|---|---|---|
| Tokenizing | Characters → tokens; lower-case (case folding) | Hyphens, apostrophes, periods, numbers; queries must be tokenized like documents |
| Stopping | Remove function words | "to be or not to be"; best: index all, decide at query time |
| Stemming | Conflate morphological variants to a stem | False positives (is → i) vs false negatives (centuries ↛ century) |
| Phrases | Multi-word units | POS tagging (slow) vs n-grams (storage) vs positions + proximity |
| Structure / markup | Weight headers, anchors, bold, metadata | Anchor text describes the **destination** page |

| Fact | Value |
|---|---|
| Zipf's law | $r \cdot P_r \approx c$, $c \approx 0.1$ for English |
| AP89 | 39.7M word occurrences, 198,763 unique, 70,064 hapax legomena (35%) |
| n-grams in an $N$-word document | $N - n + 1$ for each $n$; 3,990 for $2 \le n \le 5$, $N = 1000$ |

**Top 5 things to remember**

1. Tokenizing decisions are small but can change query effectiveness a lot — and queries must go through exactly the same steps as documents.
2. Word frequencies are Zipfian: $r \cdot P_r \approx 0.1$ in the middle, a few words ("the", "of" ≈ 9–10%) dominate, ~35% of AP89's vocabulary occurs once, and the law bends at both ends.
3. Usual policy for stopwords: index everything and decide at query time; stopwords matter in combinations.
4. Stemmers trade false positives against false negatives: Porter produces stems (cri), Krovetz produces words.
5. Phrases can be found by POS tagging (accurate, slow), n-grams (fast, storage-hungry: 3,990 per 1,000 words for n = 2–5), or positions + proximity operators; anchor text is a strong signal for the destination page.
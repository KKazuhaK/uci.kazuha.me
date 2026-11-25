---
title: "Document Conversion, Storage & Duplicates"
summary: "Converting documents to text, character encodings (ASCII, Unicode, UTF-8/UTF-16/UTF-32), storing documents (TREC Web format, compression, BigTable), exact duplicates (checksums, CRC), near duplicates (n-gram fingerprints, Simhash), and removing page noise (content blocks, document slope curve, DOM)."
topics:
  - documents
kind: "topic"
order: 503
---

# CS 121: Information Retrieval — Topic: Document Conversion, Storage & Duplicates

## Table of Contents

- [1. Conversion: From Many Formats to Text](#1-conversion-from-many-formats-to-text)
- [2. Character Encoding, Unicode & UTF-8](#2-character-encoding-unicode--utf-8)
- [3. Storing the Documents: TREC Web, Compression & BigTable](#3-storing-the-documents-trec-web-compression--bigtable)
- [4. Exact Duplicates: Checksums & CRCs](#4-exact-duplicates-checksums--crcs)
- [5. Near Duplicates & N-gram Fingerprints](#5-near-duplicates--n-gram-fingerprints)
- [6. Simhash](#6-simhash)
- [7. Removing Noise: Finding Content Blocks](#7-removing-noise-finding-content-blocks)
- [8. Quick Reference & Top 5 Things to Remember](#8-quick-reference--top-5-things-to-remember)

> This chapter follows a crawled page on its way into the search engine: **convert** it to text (§1–2), **store** it (§3), throw away **duplicates** (§4–6) and **noise** (§7). On the architecture map ([Search Engines & the Web](topic-search-engines.en-US.md)) that is *Text Acquisition → Local Document Store → Text Transformation*. Pages arrive from [Web Crawling](topic-crawling.en-US.md); the next step, looking at the words themselves (tokens, Zipf's law, stemming), is [Text Processing](topic-text-processing.en-US.md).
>
> 📖 Background reading: [Croft et al., *Search Engines: Information Retrieval in Practice*, Ch. 3 "Crawls and Feeds" (§3.5–§3.8)](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf).

## 1. Conversion: From Many Formats to Text

Before text can be indexed it has to be **converted**:

- Text is stored in **hundreds of incompatible file formats**: raw text, RTF, HTML, XML, Microsoft Word, ODF, PDF.
- **Other types of files**, not dedicated to text, are also important: PowerPoint, Excel, Keynote, Pages.
- You typically use a **conversion tool or library**. It **converts the document content into a tagged text format such as HTML or XML** and **retains some of the important formatting** information.
- Some converters **don't retain formatting** — e.g. the Unix tools `pdftotxt`, `pdf2ps` + `pdf2ascii`.

> 📘 **Going further**: [Croft §3.5 The Conversion Problem](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 2. Character Encoding, Unicode & UTF-8

### 2.1 Glyphs and encodings

**Glyphs** (Greek γλυφή, "carving") are the symbols you see, which encode letters or meanings. A **character encoding** is a **mapping between bits and glyphs** — how you get from the bits in a file to the characters on a screen — and it **can be a major source of incompatibility**.

- **ASCII** (since 1963) is the basic encoding for English: **128** letters, numbers, special characters and control characters in **7 bits**, extended with an extra bit for storage in bytes.
- **Other languages have many more glyphs**: Chinese has more than **40,000** characters, over **3,000** in common use.
- Many languages have **multiple encoding schemes** — the CJK (Chinese-Japanese-Korean) family, Hindi, Arabic. With those older schemes you **must specify the encoding**, because **the file is not self-describing**, and you **can't have multiple languages in one file**.
- **Unicode** was developed in the late '80s to address these problems.

### 2.2 Unicode and its encodings

**Unicode** is a **single mapping from numbers to glyphs** that tries to include every glyph in common use in all known languages. Its reserved (private-use) area even lets you write invented scripts.

Unicode **solves the number → glyph problem** but **does not uniquely specify the bits → glyph mapping**. That is what the encodings **UTF-8, UTF-16, UTF-32** do: they turn the number (the **code point**) into bytes.

Why several encodings? **Compatibility and space**:

| Encoding | Bytes per character | Trade-off |
|---|---|---|
| UTF-8 | 1 for English (= ASCII), up to **4** (e.g. some traditional Chinese characters) | Variable length: less space, but string operations are harder (character *i* isn't at byte *i*) |
| UTF-32 | Always **4** | More memory, no backward compatibility with ASCII, but fixed width |

You can **mix both**: many applications use **UTF-32 internally** (fast random lookup) and **UTF-8 on disk** (less space).

### 2.3 How UTF-8 works

The code point's range picks a row of the table; each `x` is filled with the code point's bits, high bits first:

| Decimal | Hexadecimal | Encoding |
|---|---|---|
| 0–127 | 0–7F | `0xxxxxxx` |
| 128–2047 | 80–7FF | `110xxxxx 10xxxxxx` |
| 2048–55295 | 800–D7FF | `1110xxxx 10xxxxxx 10xxxxxx` |
| 55296–57343 | D800–DFFF | Undefined |
| 57344–65535 | E000–FFFF | `1110xxxx 10xxxxxx 10xxxxxx` |
| 65536–1114111 | 10000–10FFFF | `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx` |

Example: Greek **π is code point 960** = `00000011 11000000` in binary (3C0 hex). 960 is in the second row, so the encoding is `110xxxxx 10xxxxxx`: the **high 5 bits** go into the first byte, the **next 6 bits** into the second. The result is **`11001111 10000000` = `CF 80`**. Step through it, or type other characters:

```viz utf8-encode
{"title": "UTF-8 encoding of π", "text": "π", "interactive": true}
```

The leading bits give the length (`110` = 2 bytes, `1110` = 3, `11110` = 4); continuation bytes start with `10`, so an ASCII byte (`0xxxxxxx`) is never part of a multi-byte character. Python agrees:

```python
print("π".encode("utf-8").hex(" "))       # cf 80
print("π".encode("utf-32-be").hex(" "))   # 00 00 03 c0
print(len("中".encode("utf-8")))           # 3
```

```text
cf 80
00 00 03 c0
3
```

> 📘 **Going further**: [Croft §3.5.1 Character Encodings](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 2.4 Practice

> 📝 **Practice**: [§2.4](#24-practice)

#### UTF-8 encoding of π

π is Unicode code point 960. What bytes does UTF-8 store? How many bytes does UTF-32 use?

<details>
<summary>Solution</summary>

960 = `0x3C0` = `00000011 11000000`. It's in 128–2047, so the template is `110xxxxx 10xxxxxx`, with 5 + 6 = 11 payload bits: 960 in 11 bits is `01111000000`. High 5 bits `01111` → `110`+`01111` = `11001111`; next 6 bits `000000` → `10`+`000000` = `10000000`. Result **`CF 80`**, 2 bytes. UTF-32 always uses 4: `00 00 03 C0`.

</details>

## 3. Storing the Documents: TREC Web, Compression & BigTable

### 3.1 Why store, and what the store needs

After documents are converted you need to **store** them. Reasons to keep the converted text:

- it **saves crawling time** when the page hasn't been updated;
- it gives **efficient access to the text** for **snippet generation**, additional information extraction, and so on.

Database systems can provide document storage for some applications, but **web search engines use customized document storage systems**. Requirements for a search engine's document store:

| Requirement | What it means |
|---|---|
| **Random access** | Request a document's content by its **URL**; normally a **hash function on the URL** finds it |
| **Compression and large files** | Reduce storage requirements and keep access efficient |
| **Update** | Handle large volumes of new and modified documents; add new **anchor text** (text of links *pointing to* the page, found later on other pages) |

**Large files**: web pages are small, so store **many pages in a smaller number of large files** instead of one file per document. This **avoids file I/O overhead** (open/close per page) and **reduces seek time relative to read time** — one seek, then a long sequential read. **Compound document formats** store multiple documents in a file, e.g. **TREC Web** (§3.2).

> 📘 **Going further**: [Croft §3.6 Storing the Documents](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [§3.6.1 Using a Database System](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [§3.6.2 Random Access](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [§3.6.4 Update](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 3.2 The TREC Web format

One file, two crawled pages:

```xml
<DOC>
<DOCNO>WTX001-B01-10</DOCNO>
<DOCHDR>
http://www.example.com/test.html 204.244.59.33 19970101013145 text/html 440
HTTP/1.0 200 OK
Date: Wed, 01 Jan 1997 01:21:13 GMT
Server: Apache/1.0.3
Content-type: text/html
Content-length: 270
Last-modified: Mon, 25 Nov 1996 05:31:24 GMT
</DOCHDR>
<HTML>
<TITLE>Tropical Fish Store</TITLE>
Coming soon!
</HTML>
</DOC>
<DOC>
<DOCNO>WTX001-B01-109</DOCNO>
<DOCHDR>
http://www.example.com/fish.html 204.244.59.33 19970101013149 text/html 440
HTTP/1.0 200 OK
Date: Wed, 01 Jan 1997 01:21:19 GMT
Server: Apache/1.0.3
Content-type: text/html
Content-length: 270
Last-modified: Mon, 25 Nov 1996 05:31:24 GMT
</DOCHDR>
<HTML>
<TITLE>Fish Information</TITLE>
This page will soon contain interesting
information about tropical fish.
</HTML>
</DOC>
```

The parts of the format:

| Part | Where | Role |
|---|---|---|
| **Document blocks** | `<DOC>` … `</DOC>` | One crawled page each; many per file |
| **Headers** | `<DOCHDR>` … `</DOCHDR>` | Crawl record: URL, server IP, crawl timestamp (`19970101013145`), type, then the HTTP response headers |
| **Content** | `<HTML>` … `</HTML>` | The page itself |
| **Document identifier** | `<DOCNO>` | Unique ID (`WTX001-B01-10`, `WTX001-B01-109`) |
| **Modification tag** | `Last-modified:` | When the server says the page last changed — what a re-crawl compares against (see freshness and age in [Web Crawling](topic-crawling.en-US.md)) |

> 💡 **Key Insight**: This is the "large file" idea in practice: a crawler appends `<DOC>` blocks to a big file, and a small index from `DOCNO` (or a URL hash) to a byte offset gives random access.

### 3.3 Compression

**Text is highly redundant (or predictable)** — Shannon's 1951 paper "Prediction and Entropy of Printed English" measures exactly that. **Lossless** compression exploits that redundancy to make files smaller **without losing any content**; indexes can be compressed too.

- Popular algorithms compress HTML and XML text by **80%**: e.g. **DEFLATE** (zip, gzip) and **LZW** (Unix `compress`, PDF).
- Large files may be compressed **in blocks** so that one document can be read without decompressing the whole file.

Repetitive markup compresses extremely well; real pages are less repetitive, hence the ~80% figure rather than this toy's 97%:

```python
import zlib

page = b"<html><body>" + b"<p>Tropical fish include fish found in tropical environments.</p>\n" * 50 + b"</body></html>"
print(len(page), len(zlib.compress(page, 9)))
```

```text
3326 108
```

> 📘 **Going further**: [Croft §3.6.3 Compression and Large Files](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 3.4 BigTable

**BigTable** is Google's document storage system, customized for **storing, finding and updating** web pages and handling large collections on **inexpensive computers**. One **logical table** is split into many **tablets**, each held by a server.

Organization:

- Logically organized into **rows**; **a row stores the data for a single web page**.
- **Columns can have multiple timestamps** (versions). **A row key, a column key and a timestamp point to a single cell.**
- A row can have a **huge number of columns**: all rows have the **same column groups**, but **not all rows have the same columns** — important for reducing disk reads.
- Rows are **partitioned into tablets by row key** (e.g. URLs starting with a certain letter in one tablet), which makes it simple to find the right server.

A sample row:

| Row key | `text` | `anchor:other.com` | `anchor:null.com` | `title` |
|---|---|---|---|---|
| `www.example.com` | document text | example | click here | example site |

`anchor:` is a column group; each linking site gets its own column holding its anchor text — the "add new anchor text" update from §3.1.

Advantages and drawbacks:

- **No query language**: no complex queries to optimize.
- **Only row-level transactions.**
- Tablets live in a **replicated file system** accessible by all BigTable servers.
- Any change to a tablet is recorded in a **transaction log**, also in a shared file system.
- If a tablet server crashes, **another server reads the tablet data and log from the file system and takes over**.
- Tablets may be compressed.

> 📘 **Going further**: [Croft §3.6.5 BigTable](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 4. Exact Duplicates: Checksums & CRCs

### 4.1 Why duplicates matter

Duplicates and near duplicates come from **copies, versions, plagiarism, spam and mirror sites**; **30%** of the pages in a large crawl are exact or near duplicates of the rest (**Fetterly et al., 2003**). They **consume significant resources** during crawling, indexing and search, and add little value to most users (but may add value in some use cases). The fix is to detect them with hashes for exact copies and fingerprints for near ones; the crawler-side view is in [Web Crawling](topic-crawling.en-US.md).

### 4.2 Checksums and CRCs

**Exact duplicate detection is relatively easy.** A **checksum** is a value computed from the document's content — e.g. the **sum of the bytes** in the file:

| T | r | o | p | i | c | a | l | (space) | f | i | s | h | Sum |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 54 | 72 | 6F | 70 | 69 | 63 | 61 | 6C | 20 | 66 | 69 | 73 | 68 | 508 |

All values are hexadecimal: 508 hex = **1,288** decimal.

- Files with different text **can have the same checksum** — a byte sum ignores order, so any rearrangement of the same bytes collides.
- A **cyclic redundancy check (CRC)** also considers the **positions** of the bytes. It's **still prone to collisions, but very rarely**. Other functions: **BLAKE2/3, MD5, SHA1, SHA2**, etc.
- Whatever you use **needs to be fast** — it runs on every page.

```python
import zlib

for s in [b"Tropical fish", b"Tropical fihs"]:
    print(s, sum(s), hex(sum(s)), hex(zlib.crc32(s)))
```

```text
b'Tropical fish' 1288 0x508 0x18f14f94
b'Tropical fihs' 1288 0x508 0x3ba24de2
```

Swapping two letters keeps the byte sum but changes the CRC.

> 📘 **Going further**: [Croft §3.7 Detecting Duplicates](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 4.3 Practice

> 📝 **Practice**: [§4.3](#43-practice)

#### A byte-sum checksum

Sum the bytes of the ASCII string "Tropical fish". Is a byte sum a safe way to detect exact duplicates?

<details>
<summary>Solution</summary>

In hex, 54 + 72 + 6F + 70 + 69 + 63 + 61 + 6C + 20 + 66 + 69 + 73 + 68 = **508 hex = 1,288**. It's not safe: the sum ignores order, so "Tropical fihs" also sums to 1,288. A CRC weighs bytes by position: CRC-32 gives `0x18f14f94` vs `0x3ba24de2`.

</details>

## 5. Near Duplicates & N-gram Fingerprints

### 5.1 Defining near duplicates

**Near-duplicate detection is harder.** Are two pages with the same text but different ads or format near duplicates? A near duplicate is **defined by a threshold on some similarity measure** between two documents — e.g. D1 is a near duplicate of D2 if **more than 90% of the words** are the same. Counting shared words needs exactly the tokenizing and word counting of [Text Processing](topic-text-processing.en-US.md).

Two scenarios:

| Scenario | Task | Cost |
|---|---|---|
| **Search** | Find near duplicates of one document D | $O(N)$ comparisons |
| **Discovery** | Find **all pairs** of near duplicates in the collection | $O(N^2)$ comparisons |

Normal IR techniques work for search; for discovery, you need compact representations called **fingerprints**.

### 5.2 The fingerprint algorithm

1. **Parse the document into words**; punctuation, HTML tags and extra whitespace are removed.
2. **Group the words into contiguous n-grams** for some n — usually overlapping.
3. **Select some of the n-grams** to represent the document.
4. **Hash the selected n-grams** — faster retrieval, smaller representation.
5. **Store the hash values**, typically in an inverted index (see [Inverted Indexes & Index Construction](topic-indexing.en-US.md)).
6. **Compare documents by the overlap of their fingerprints.**

The example is built one stage at a time:

- (a) Text: "Tropical fish include fish found in tropical environments around the world, including both freshwater and salt water species."
- (b) 3-grams: tropical fish include, fish include fish, include fish found, …, salt water species — 18 words give **16** 3-grams.
- (c) Hash values: `938 664 463 822 492 798 78 969 143 236 913 908 694 553 870 779`.
- (d) Selected using **0 mod 4**: `664 492 236 908`.

(The example hashes every n-gram and then selects; steps 3 and 4 above in the other order are the same idea.) Step through the 16 n-grams; edit the text to use a demo hash:

```viz shingle-fingerprint
{"title": "N-gram fingerprint of the tropical fish text", "interactive": true}
```

Reproducing the stages in Python (the hash values are the example's, not a real hash function):

```python
text = "Tropical fish include fish found in tropical environments around the world, including both freshwater and salt water species."
HASH = [938, 664, 463, 822, 492, 798, 78, 969, 143, 236, 913, 908, 694, 553, 870, 779]
words = [w.strip(",.").lower() for w in text.split()]
grams = [" ".join(words[i:i + 3]) for i in range(len(words) - 2)]
fp = {h for h in HASH if h % 4 == 0}
print(len(words), len(grams), sorted(fp))
print([g for g, h in zip(grams, HASH) if h % 4 == 0])
```

```text
18 16 [236, 492, 664, 908]
['fish include fish', 'found in tropical', 'the world including', 'including both freshwater']
```

### 5.3 Comparing fingerprints

With fingerprints $F_A$ and $F_B$, the similarity is the size of the intersection over the size of the union:

$$S_{A,B} = \frac{|F_A \cap F_B|}{|F_A \cup F_B|} \qquad S_{A,B} \ge \tau \implies \text{A and B are near duplicates}$$

$|F|$ is the number of hash values in a set (its cardinality), and $\tau$ is a threshold **you** choose: they are near duplicates "under your definition of threshold".

```python
def jaccard(a, b):
    return len(a & b) / len(a | b)

print(jaccard(fp, {664, 492, 100, 200, 236}))
```

```text
0.5
```

> ⚠️ **Pitfall**: "0 mod p" selection keeps only about $1/p$ of the n-grams, and which ones depends only on their hash values, so two copies of the same text select the same ones. Selecting by position ("every 4th n-gram") would not: insert one word at the top and every selected n-gram changes.

> 📘 **Going further**: [Croft §3.7 Detecting Duplicates](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 5.4 Practice

> 📝 **Practice**: [§5.4](#54-practice)

#### Which fingerprint values does "0 mod 4" select?

The text "Tropical fish include fish found in tropical environments around the world, including both freshwater and salt water species." has 18 words. Its overlapping 3-grams, in order, hash to 938, 664, 463, 822, 492, 798, 78, 969, 143, 236, 913, 908, 694, 553, 870, 779. How many 3-grams are there, which hash values does "0 mod 4" select, and which 3-grams are they? How would you compare this fingerprint with another document's?

<details>
<summary>Solution</summary>

18 words → 18 − 3 + 1 = 16 3-grams. Remainders mod 4:

| Hash | 938 | 664 | 463 | 822 | 492 | 798 | 78 | 969 | 143 | 236 | 913 | 908 | 694 | 553 | 870 | 779 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| mod 4 | 2 | **0** | 3 | 2 | **0** | 2 | 2 | 1 | 3 | **0** | 1 | **0** | 2 | 1 | 2 | 3 |

$F$ = {664, 492, 236, 908}: 4 of 16 values, from "fish include fish", "found in tropical", "the world including" and "including both freshwater". Comparing it with another document's fingerprint uses $|F_A \cap F_B| / |F_A \cup F_B| \ge \tau$.

</details>

## 6. Simhash

### 6.1 Motivation

Similarity comparisons on **word-based representations** (cosine similarity, see [Retrieval Models](topic-retrieval-models.en-US.md)) find near duplicates **more effectively** than n-gram fingerprints; their problem is **efficiency**. **Simhash** (Charikar, 2002) combines the advantages of word-based similarity with the efficiency of hash fingerprints: the **cosine correlation** between two pages is proportional to the **number of bits that are the same** in their simhash fingerprints.

### 6.2 The algorithm

1. Process the document into a **set of features with weights** — here, **words weighted by their frequency**.
2. Generate a **b-bit hash** for each word (b = the fingerprint size); unique per word.
3. In a b-dimensional vector $V$, for every word **add its weight** to component $i$ if bit $i$ of its hash is **1**, **subtract** it if the bit is **0**.
4. After all words, the fingerprint's bit $i$ is **1 if $V_i$ is positive**, 0 otherwise.

The example uses the same text as §5:

- (b) Words with weights: tropical 2, fish 2, include 1, found 1, environments 1, around 1, world 1, including 1, both 1, freshwater 1, salt 1, water 1, species 1 (in, the, and are left out).
- (c) 8-bit hash values:

| Word | Hash | Word | Hash | Word | Hash |
|---|---|---|---|---|---|
| tropical | `01100001` | fish | `10101011` | include | `11100110` |
| found | `00011110` | environments | `00101101` | around | `10001011` |
| world | `00101010` | including | `11000000` | both | `10101110` |
| freshwater | `00111111` | salt | `10110101` | water | `00100101` |
| species | `11101110` | | | | |

- (d) $V$ = **1 −5 9 −9 3 1 3 3**.
- (e) Fingerprint = **1 0 1 0 1 1 1 1**.

Check the last component by hand: tropical `01100001` → `- + + - - - - +`, fish → `+ - + - + - + +`, include → `+ + + - - + + -`, and down the last column: $3 = 2 + 2 - 1 - 1 + 1 + 1 - 1 - 1 - 1 + 1 + 1 + 1 - 1$. The demo adds one word per step:

```viz simhash
{"title": "Simhash of the tropical fish text", "interactive": true}
```

As code, including what happens when one word is removed from the text:

```python
from collections import Counter

H = {"tropical": "01100001", "fish": "10101011", "include": "11100110",
     "found": "00011110", "environments": "00101101", "around": "10001011",
     "world": "00101010", "including": "11000000", "both": "10101110",
     "freshwater": "00111111", "salt": "10110101", "water": "00100101",
     "species": "11101110"}
text = "Tropical fish include fish found in tropical environments around the world, including both freshwater and salt water species."
words = [w.strip(",.").lower() for w in text.split()]

def simhash(counts):
    V = [0] * 8
    for w, c in counts.items():
        for i, b in enumerate(H[w]):
            V[i] += c if b == "1" else -c
    return V, "".join("1" if v > 0 else "0" for v in V)

counts = Counter(w for w in words if w in H)
V, f = simhash(counts)
print(V, f)

counts2 = counts.copy()
counts2["species"] = 0            # drop one word
V2, f2 = simhash(counts2)
print(V2, f2, sum(a == b for a, b in zip(f, f2)) / 8)
```

```text
[1, -5, 9, -9, 3, 1, 3, 3] 10101111
[0, -6, 8, -8, 2, 0, 2, 4] 00101011 0.75
```

Removing one weight-1 word moved every component of $V$ by only 1 (a component that reached 0 flips, since the rule needs $V_i$ strictly positive), so 6 of the 8 bits still agree.

### 6.3 Comparing two simhashes

The similarity is the **fraction of the n bits that are the same**:

$$S_{A,B} = \frac{\sum_n (H_A \equiv_{\text{bitwise}} H_B)}{n} \qquad S_{A,B} \ge \tau \implies \text{near duplicates}$$

$H_A, H_B$ are the two fingerprints, $\equiv_{\text{bitwise}}$ counts 1 for each position where the bits agree, $n$ is the number of bits — equivalently $1 - \text{Hamming distance}/n$.

> ⚠️ **Pitfall**: Simhash is the opposite of a normal hash. A good hash changes completely when one byte changes (§4); simhash is built so that similar documents get fingerprints that differ in **few** bits — a one-word edit only moves $V$ by that word's weight.

> 📘 **Going further**: [Croft §3.7 Detecting Duplicates](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 6.4 Practice

> 📝 **Practice**: [§6.4](#64-practice)

#### Simhash of the tropical fish text

A document has these words with weights (frequency): tropical 2, fish 2, include 1, found 1, environments 1, around 1, world 1, including 1, both 1, freshwater 1, salt 1, water 1, species 1. Their 8-bit hashes are tropical `01100001`, fish `10101011`, include `11100110`, found `00011110`, environments `00101101`, around `10001011`, world `00101010`, including `11000000`, both `10101110`, freshwater `00111111`, salt `10110101`, water `00100101`, species `11101110`. Compute $V$ and the simhash fingerprint.

<details>
<summary>Solution</summary>

Each word adds +weight for a 1 bit and −weight for a 0 bit. Column by column:

| Bit | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| $V$ | 1 | −5 | 9 | −9 | 3 | 1 | 3 | 3 |
| Fingerprint | 1 | 0 | 1 | 0 | 1 | 1 | 1 | 1 |

Bit 8: tropical +2, fish +2, include −1, found −1, environments +1, around +1, world −1, including −1, both −1, freshwater +1, salt +1, water +1, species −1 → 3 > 0 → 1. Fingerprint **10101111**. Two documents with simhashes $H_A, H_B$ are compared by the fraction of the 8 bits that agree, against $\tau$.

</details>

## 7. Removing Noise: Finding Content Blocks

Many web pages contain text, links and pictures **not related to the main content**: banners, navigation, side columns, ads. This material is mostly **noise** that could hurt the page's ranking. Techniques detect the **content blocks**; non-content material is **ignored or reduced in importance** at indexing time.

Example: a news page with its banner and side columns as **noise blocks**, and a CNN.com "Science & Space" article ("Aquarium plays whale shark matchmaker") whose story text is the **content block**, surrounded by navigation, a search box and ads. So how can you detect content?

### 7.1 Cumulative distribution of tags (document slope curve)

Technique 1 is the *document slope curve* (Finn, Kushmerick & Smyth, 2001). Walk through the page's tokens and count the tags seen so far: **token count** (up to about 3,500) on x, **tag count** (up to about 1,000) on y. The curve climbs steadily through tag-heavy navigation, and the **main text is the "plateau" in the middle** (the "text area", around 1,000–1,500 tokens), where many tokens pass with almost no tags.

As an optimization problem: represent the page as a **sequence of bits**, $b_n = 1$ if the $n$th token is a **tag**. Find $i$ and $j$ that maximize the number of **tags below $i$ and above $j$** plus the number of **non-tag tokens between $i$ and $j$**:

$$\max_{i,\,j} \; \sum_{n=0}^{i-1} b_n \;+\; \sum_{n=i}^{j} (1 - b_n) \;+\; \sum_{n=j+1}^{N-1} b_n$$

$N$ is the number of tokens; tokens $i$ … $j$ are the content block. The first and last sums reward tags *outside* the block, the middle one rewards text *inside* it.

**Alternative**: cut the curve into vertical **slices**, determine the **slope** inside each, and iterate, reducing the slice size until you find **zero-slope windows**.

### 7.2 DOM and layout approaches

**Other approaches** use the **Document Object Model (DOM)** structure and **visual (layout) features**: an HTML parser turns HTML into a DOM tree. For the CNN page the tree is `#document` → `HTML` → `HEAD`, `BODY` (`contentArea`), with `DIV`s and `TABLE`s named `cnnCeil`, `cnnBreakingNewsBanner`, `iframecnnBreakingNewsBanner`, `cnnCeilSearch`, `cnnArticleWireFrame`, `cnnFootBox`, `csiIframe` — and, the one that matters, `TABLE` → `TBODY` → `TR` → **`TD` `cnnArticleContent`**, the article.

> 📘 **Going further**: [Croft §3.8 Removing Noise](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 8. Quick Reference & Top 5 Things to Remember

| Encoding | Bytes per character | Note |
|---|---|---|
| ASCII | 1 (7 bits used) | 128 characters, English only |
| UTF-8 | 1–4 | ASCII-compatible; templates `0xxxxxxx`, `110xxxxx 10xxxxxx`, `1110xxxx` + 2, `11110xxx` + 3 |
| UTF-32 | 4 | Fixed width: fast random access, more memory |

| Duplicate-detection method | Detects | How | Similarity |
|---|---|---|---|
| Checksum (byte sum) | Exact | Sum of bytes | Equal or not; order-blind collisions |
| CRC, MD5, SHA, BLAKE | Exact | Position-aware hash | Equal or not; rare collisions |
| N-gram fingerprint | Near | n-grams → hashes → keep 0 mod p | $\lvert F_A \cap F_B\rvert / \lvert F_A \cup F_B\rvert \ge \tau$ |
| Simhash | Near | weights × ±hash bits → sign of $V$ | equal bits / n $\ge \tau$ |

| Storage / noise | Key idea |
|---|---|
| Large files, TREC Web | Many `<DOC>` blocks per file: less file I/O, seek once |
| Compression | Lossless, ~80% on HTML/XML (DEFLATE, LZW), in blocks |
| BigTable | Row = page; (row key, column key, timestamp) → cell; tablets by row key |
| Content blocks | Plateau of the cumulative tag curve; maximize tags outside + text inside $[i, j]$ |

**Top 5 things to remember**

1. Unicode maps glyphs to numbers; UTF-8/16/32 map numbers to bytes. π = U+03C0 = 960 → `110`01111 `10`000000 = `CF 80`.
2. Search engines store documents in big compound files (TREC Web) or BigTable — random access by URL hash, compression, updates — not one file per page.
3. Exact duplicates: checksums/CRCs; near duplicates: n-gram fingerprints ("0 mod p" selection, intersection over union ≥ τ) or simhash (fraction of equal bits ≥ τ).
4. Simhash: $V_i$ += weight if bit $i$ is 1, −= weight if 0; bit = 1 if $V_i > 0$ — similar documents get similar fingerprints.
5. Strip noise before indexing: the main text is the plateau of the cumulative tag curve (or the content block of the DOM tree). For word statistics such as Zipf's law, see [Text Processing](topic-text-processing.en-US.md).

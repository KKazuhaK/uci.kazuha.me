---
title: "Algorithm Analysis"
summary: "Why analyze algorithms, empirical timing (doubling test, power laws), cost models and tilde notation, Big-O / Big-Ω / Big-Θ, common orders of growth, space complexity, and analyzing recursion with recurrences, recursion trees and the Master Theorem."
topics:
  - analysis
kind: "topic"
order: 502
---

# Information and Computer Science 46 — Topic: Algorithm Analysis

## Table of Contents

- [1. Why Analyze Algorithms?](#1-why-analyze-algorithms)
- [2. Empirical Analysis of Running Time](#2-empirical-analysis-of-running-time)
- [3. Mathematical Models of Running Time](#3-mathematical-models-of-running-time)
- [4. Asymptotic Analysis: Big-O, Big-Ω, Big-Θ](#4-asymptotic-analysis-big-o-big-ω-big-θ)
- [5. Common Orders of Growth](#5-common-orders-of-growth)
- [6. Space Complexity](#6-space-complexity)
- [7. Analysis of Recursion: Recurrences and Recursion Trees](#7-analysis-of-recursion-recurrences-and-recursion-trees)
- [8. The Master Theorem](#8-the-master-theorem)
- [9. Quick Reference & Top 5 Things to Remember](#9-quick-reference--top-5-things-to-remember)

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh. This note gathers algorithm analysis from Lectures 2, 3 and 6, organized by concept.

## 1. Why Analyze Algorithms?

You are often three people at once: the **programmer** (needs a working solution), the **client** (wants an efficient one) and the **theoretician** (wants to understand). Reasons to analyze efficiency: **predict** performance, **compare** algorithms, **provide** guarantees, **understand** the theory, and **avoid** performance bugs.

**Computational complexity** = **time complexity** (how running time grows with input size) + **space complexity** (how memory grows). Time can be attacked two ways: measure it ([§2](#2-empirical-analysis-of-running-time)) and model it ([§3](#3-mathematical-models-of-running-time)); the model is then summarized with asymptotic notation ([§4](#4-asymptotic-analysis-big-o-big-ω-big-θ)). Space is covered in [§6](#6-space-complexity), and recursive algorithms in [§7](#7-analysis-of-recursion-recurrences-and-recursion-trees)–[§8](#8-the-master-theorem).

## 2. Empirical Analysis of Running Time

### 2.1 The running example: 3-SUM

Given n distinct numbers, how many **unordered triplets** sum to 0? Input `30 -40 -20 -10 40 0 10 5` → **4** (`30 -40 10`, `30 -20 -10`, `-40 40 0`, `-10 0 10`).

```cpp
int count = 0;
for (int i = 0; i < n; i++) {
    for (int j = i+1; j < n; j++) {
        for (int k = j+1; k < n; k++) {
            if (a[i] + a[j] + a[k] == 0) {
                count++;
            }
        }
    }
}
```

Timing it on files of random ints:

| File | n | Triples | Time (s) |
|---|---|---|---|
| 8ints.txt | 8 | 4 | 0 |
| 1Kints.txt | 1000 | 70 | 0.081 |
| 2Kints.txt | 2000 | 528 | 0.38 (rerun: 0.371) |
| 4Kints.txt | 4000 | 4039 | 2.792 |
| 8Kints.txt | 8000 | 32074 | 21.623 |
| 16Kints.txt | 16000 | 255181 | 177.344 |

Same input, different times (0.38 vs 0.371): measurements are noisy.

> 📘 **Beyond the lecture**: algs4 frames this as the scientific method — observe, hypothesize a model, predict an unmeasured case, verify, repeat. The doubling test below is exactly that loop.

### 2.2 Log-log plots and power laws

Plot T(n) vs n, then re-plot on a **log-log** chart. If it's a straight line, the running time is a **power law**:

$$T(n) = a\,n^b \quad\Longrightarrow\quad \log T(n) = b \log n + \log a$$

The slope is **b**. The 3-SUM measurements, added one at a time on a log-log plot with the doubling ratios (step through it below; ← / → keys work when the demo is focused):

```viz doubling-test
{"title": "3-SUM doubling test", "n": [1000, 2000, 4000, 8000, 16000], "times": [0.081, 0.38, 2.792, 21.623, 177.344]}
```

From lg n = 11.97 to 13.97 the line rises 7.47 − 1.48 ≈ 6.0 over 2.0: slope **b = 3**. The fit: **T(n) ≈ 0.42 × 10⁻¹⁰ n³** s.

### 2.3 The doubling hypothesis

Double n and take the ratio — a cancels:

$$\frac{T(n)}{T(n/2)} = \frac{a\,n^b}{a\,(n/2)^b} = 2^b$$

- **b**: for 8000 → 16000 the ratio is 177.344 / 21.623 ≈ **8.2**, so b ≈ lg 8.2 ≈ **3**.
- **a**: T(16000) = 177.34 = a × 16000³ → a = 0.42 × 10⁻¹⁰.

> ⚠️ **Pitfall**: 177.34 / 16000³ actually computes to **0.43 × 10⁻¹⁰**; the 0.42 comes from the fitted line.

All the ratios from the timing table:

| n | T(n) (s) | T(n)/T(n/2) | lg ratio |
|---|---|---|---|
| 8 | 0 | — | — |
| 1000 | 0.081 | — | — |
| 2000 | 0.38 | 4.7 | 2.2 |
| 4000 | 2.792 | 7.3 | 2.9 |
| 8000 | 21.623 | 7.7 | 2.95 |
| 16000 | 177.344 | 8.2 | 3.04 |

**Why pick the 2 larger input sizes?** At small n the times are tiny, so timer resolution and noise are a big fraction (n = 8 even reads 0), and lower-order terms and fixed overheads aren't yet negligible next to n³. The ratio only settles near 8 for large n.

Reproduced on my machine (`-O2`, min of 3 runs, random ints): ratios 7.97, 7.60, 8.25, 7.81 from n = 500 to 8000 — **b ≈ 3** again, but a ≈ 1.7 × 10⁻¹⁰ (86.949 s at n = 8000), a different constant on different hardware.

### 2.4 What determines a and b

For T(n) = a·n^b:

| | System-independent factors | System-dependent factors |
|---|---|---|
| Determine | the exponent **b** (and affect a) | only the constant **a** |
| Examples | data structures + algorithm for the operations; the algorithm; the input data | hardware (CPU, memory, cache); software (compiler, garbage collector); system (OS, network, etc.) |

So b is a property of the algorithm and its input; a faster machine changes a, never b.

### 2.5 Practice

#### Pick the model from a table of timings

Suppose you time your code and make the following observations. Which function is the closest model of T(n)? Show your work.

A. n²  B. 6 × 10⁻⁴ n  C. 5 × 10⁻⁹ n²  D. 7 × 10⁻⁹ n²

| Input size | 1000 | 2000 | 4000 | 8000 | 16000 | 32000 |
|---|---|---|---|---|---|---|
| Time | 0 | 0.0 | 0.1 | 0.3 | 1.3 | 5.1 |

<details>
<summary>Solution</summary>

**Solution: C.**

1. b from the two largest sizes: 5.1 / 1.3 ≈ 3.9 ≈ 2² → **b ≈ 2**. Rules out B (linear).
2. a from n = 32000: a = 5.1 / 32000² = 5.1 / (1.024 × 10⁹) ≈ **5 × 10⁻⁹**.
3. Check: A predicts ~10⁹ s; D predicts 7.2 s at 32000. C predicts 5.1 s and 1.28 s at 16000. ✓

Ignore the small sizes: 0.3 / 0.1 = 3 is mostly rounding.

</details>

## 3. Mathematical Models of Running Time

### 3.1 Total time = Σ cost × frequency

(Donald Knuth, 1960s): **total running time = sum of cost × frequency over all operations.**

| Cost | Frequency |
|---|---|
| system & machine dependent | algorithm & data dependent |
| exact cost depends on machine and compiler; analyze the program to find its basic operations | depends on data structures, algorithm design and input; accurate mathematical models are available in principle |

Relative cost of basic C++ operations: `int add < int multiply < int divide < float add < float multiply < float divide`; memory access varies, but basic models assume it costs about an add.

| Operation | Example | Cost |
|---|---|---|
| Variable declaration | `int a;` | c1 |
| Assignment | `a = b;` | c2 |
| Integer comparison | `a < b;` | c3 |
| Array / vector access | `a[i]`, `v[i]` | c4 |
| Container size | `v.size()` | c5 |
| Dynamic allocation | `new int[n]`, `std::vector<int> v(n)` | c6·n |

Allocation is the odd one: proportional to n, not constant. (The original table's column header shows a raw `$c_i$` — a LaTeX rendering slip.)

### 3.2 Counting operations: 1-Sum

Given n distinct numbers, how many single numbers equal 0?

```cpp
int count = 0;
for (int i = 0; i < n; i++) {
    if (a[i] == 0) {
        count++;
    }
}
```

| Operation | Frequency | Why |
|---|---|---|
| Variable declaration | 2 | `count`, `i` |
| Assignment | 2 | `count = 0`, `i = 0` |
| Less than | **n + 1** | `i < n` is true n times, then false once to exit |
| Equal to | n | `a[i] == 0` |
| Array access | n | `a[i]` |
| Increment | **n to 2n** | `i++` n times, plus 0..n `count++` depending on data |

Instrumented at n = 10: `less=11 equal=10 access=10`; `incr=10` with no zero, `incr=11` with one zero.

> ⚠️ **Pitfall**: with **distinct** numbers at most one can be 0, so the increment count is really **n to n + 1** (n to 2n is the bound without "distinct").

### 3.3 Counting operations: 2-Sum

**Problem:** given n distinct numbers, how many *unordered* pairs ("duplets") sum to 0? Brute force tries each pair `i < j` once:

```cpp
int count = 0;
for (int i = 0; i < n; i++) {
    for (int j = i+1; j < n; j++) {
        if (a[i] + a[j] == 0) {
            count++;
        }
    }
}
```

For a fixed `i` the inner body runs `n - i - 1` times, so in total $(n-1) + \dots + 1 + 0 = n(n-1)/2$ times (one per pair). Each loop *test* runs once more than its body. The count:

| Operation | Frequency | Where it comes from |
|---|---|---|
| Variable declaration | $n + 2$ | `count`, `i`, and `j` once per outer iteration |
| Assignment | $n + 2$ | `count = 0`, `i = 0`, `j = i+1` ×n |
| Less than | $(n+1)(n+2)/2$ | outer: $n+1$; inner: $n + (n-1) + \dots + 1 = n(n+1)/2$ |
| Equal to | $n(n-1)/2$ | once per inner body |
| Array access | $n(n-1)$ | `a[i]`, `a[j]`: 2 per inner body |
| Increment | $n(n+1)/2$ to $n^2$ | `i++` ×n + `j++` ×n(n−1)/2, plus 0 or more `count++` |

The verdict: **"Already becoming too tedious to calculate!"** — so pick one cost model (array accesses) and keep only the leading term ([§3.4](#34-tilde-notation), [§3.5](#35-simplification-cost-model--tilde)): brute-force 2-Sum makes **$\sim n^2$** array accesses.

Instrumented run (every row matches):

```text
n=10 (no pairs)  pairs=0 decl=12 assign=12 less=66 eq=45 access=90 incr=55
   formulas: n+2=12 (n+1)(n+2)/2=66 n(n-1)/2=45 n(n-1)=90 n(n+1)/2=55 n^2=100
```

> ⚠️ **Pitfall**: the loop test runs **one more time than the body** (the final, failing test) — outer `<` is $n+1$, not $n$.

### 3.4 Tilde notation

Estimate running time (or memory) by keeping only the **leading term** — for large n the lower-order terms are negligible.

| Expression | Tilde |
|---|---|
| (1/6)n³ + 10n + 100 | ~ n³ |
| (1/6)n³ + 100n² + 47 | ~ n³ |
| (1/6)n³ + 100n^(2/3) + (1/2)/n | ~ n³ |

> 📘 **Beyond the lecture**: algs4 defines g(n) ~ f(n) as g(n)/f(n) → 1, which keeps the coefficient: the first row is strictly ~ (1/6)n³. The "~ n³" form is shorthand for the order of growth. Big-O ([§4](#4-asymptotic-analysis-big-o-big-ω-big-θ)) drops the constant too.

### 3.5 Simplification: cost model + tilde

(1) **Cost model** — use one basic operation as a proxy for running time, e.g. **array accesses**; (2) describe its frequency with tilde notation. Applied to 2-Sum:

| Operation | Frequency | Tilde |
|---|---|---|
| Variable declaration | n + 2 | ~ n |
| Assignment | n + 2 | ~ n |
| Less than | (n + 1)(n + 2)/2 | ~ n² |
| Equal to | n(n − 1)/2 | ~ n² |
| Array access | n(n − 1) | ~ n² |
| Increment | n(n + 1)/2 to n² | ~ n² |

Result: **~n² array accesses for the 2-SUM problem.** Same reasoning for 3-SUM: C(n, 3) ~ n³/6 triples × 3 accesses = **~n³/2 array accesses**, matching the b = 3 the experiment found.

### 3.6 Practice

#### Operation counts for 2-Sum

Given n distinct numbers, how many unordered duplets sum to 0? How many of each type of operation (variable declaration, assignment, less than, equal to, array access, increment) as a function of **n**? (Code as in [§3.3](#33-counting-operations-2-sum).)

<details>
<summary>Solution</summary>

Declarations $n+2$, assignments $n+2$, `<` $(n+1)(n+2)/2$, `==` $n(n-1)/2$, array accesses $n(n-1)$, increments $n(n+1)/2$ to $n^2$. Key reason: the inner body runs once per pair, $n(n-1)/2$ times, and each loop test runs once more than its body. Tilde: $\sim n^2$ array accesses.

</details>

## 4. Asymptotic Analysis: Big-O, Big-Ω, Big-Θ

### 4.1 Why "think big"

Compare $f(n) = n$, $g(n) = 4n$, $h(n) = n^2$. For small n, $f$ and $g$ look very different and $h$ is even *below* them ($n^2 < 4n$ for $n < 4$). For large n, $f$ and $g$ look alike next to $h$, which grows at a distinctly different rate.

**Asymptotic analysis** describes running time as a function of input size n and looks only at its growth as n gets large: **ignore small n ("THINK BIG")**; **slower growth rate = better algorithm**.

| n | $f = n$ | $g = 4n$ | $h = n^2$ |
|---|---|---|---|
| 2 | 2 | 8 | 4 |
| 4 | 4 | 16 | 16 |
| 100 | 100 | 400 | 10,000 |

### 4.2 Big-O: upper bound

$f(n)$ is $O(g(n))$ if there exist positive constants $c$ and $n_0$ with

$$f(n) \le c \cdot g(n) \quad \text{for all } n \ge n_0.$$

$f$ is the actual running time, $g$ a simpler function of the same shape; $c$ absorbs constant factors, $n_0$ ignores small n. Informally: "my code takes **at most** this long." Examples: $3n^3 + 2n + 7 = O(n^3)$; $2^n + n^2 = O(2^n)$; $1000 = O(1)$; and $3n^3 + 2n + 7 = O(n^6)$ is true **but a useless bound** — give the tightest one. Big-O enables high-level comparison as n grows and ignores lower-level details: it is **not** the exact runtime.

**Worked $c$, $n_0$:** for $n \ge 1$, $2n \le 2n^3$ and $7 \le 7n^3$, so $3n^3 + 2n + 7 \le 12n^3$. Hence $c = 12$, $n_0 = 1$ works and $3n^3 + 2n + 7 = O(n^3)$. Shortcut: **keep the fastest-growing term, drop its coefficient.**

### 4.3 Big-Ω: lower bound

$f(n)$ is $\Omega(g(n))$ if there exist positive $c$, $n_0$ with $f(n) \ge c \cdot g(n)$ for all $n \ge n_0$ — "**at least** this long." Ω can describe whole classes of algorithms: every comparison-based sort is $\Omega(n \log n)$.

Two example plots: $f_1(n)$ sits mostly at small values with occasional spikes up to about n → $\Omega(1)$; $f_2(n)$ is a straight line ≈ n → $\Omega(n)$.

> 📘 **Beyond the lecture**: $f_1$'s spikes fall on the primes and its low values look like each n's smallest divisor — the step count of trial-division primality testing: cheap for most n, linear for primes.

### 4.4 Big-Θ: tight bound

$f(n)$ is $\Theta(g(n))$ if it is both $O(g(n))$ and $\Omega(g(n))$ — "exactly this long, up to constants and lower-order terms." **If Big-O and Big-Ω differ, Big-Θ is undefined.** So $f_2(n) = \Theta(n)$, while $f_1$ ($O(n)$, $\Omega(1)$) has no Θ.

| Notation | Bound | Definition (∃ $c, n_0 > 0$, ∀ $n \ge n_0$) | Plain English |
|---|---|---|---|
| $O(g)$ | upper | $f(n) \le c \cdot g(n)$ | at most |
| $\Omega(g)$ | lower | $f(n) \ge c \cdot g(n)$ | at least |
| $\Theta(g)$ | tight | both | "exactly", up to constants |

The same notations describe time **and** space.

### 4.5 Case vs. growth rate

Two separate questions: **which case?** (best / average / worst input) and **how does it grow?** (O(1), O(log n), O(n), O(n²), …). Linear search in an array of n:

| Case | When | Comparisons | Growth |
|---|---|---|---|
| Best | target is first | 1 | O(1) |
| Average | target in the middle | n/2 | O(n) |
| Worst | target last or absent | n | O(n) |

> ⚠️ **Pitfall**: "Big-O = worst case, Big-Ω = best case" is **wrong**. Fix a case first, then bound it: linear search is worst case Θ(n) and best case Θ(1). With no case named, it is O(n) and Ω(1) but has no Θ.

### 4.6 Practice

#### Reading bounds off a graph

**(a)** Which g(n) can be the Big-O of f(n) (a curve rising faster than the lines): $n$, $4n$, or $n^2$?
**(b)** Big-Omega of $f_1(n)$ and $f_2(n)$?
**(c)** Big-Theta of $f_1(n)$ and $f_2(n)$?

<details>
<summary>Solution</summary>

(a) Only $n^2$ — no constant multiple of a line stays above a curve that grows faster; $n$ and $4n$ are the same class anyway. (b) $f_1 = \Omega(1)$ (infinitely many tiny values), $f_2 = \Omega(n)$. (c) $f_1$: O(n) but Ω(1), so **Θ undefined**; $f_2 = \Theta(n)$.

</details>

#### Big-O, Big-Omega, Big-Theta of simple tasks

Given an array of n 3-digit integers in random order, describe the time complexity in terms of Big-O, Big-Omega, Big-Theta for: (a) 1. print all elements to std::out; 2. search the (unsorted) array for a number. (b) Big-O of: 1. T(n) = 7n − 2000; 2. T(n) = n³ + 46n² + 10000; 3. T(n) = 3 log n + 5n.

<details>
<summary>Solution</summary>

| Task | O | Ω | Θ |
|---|---|---|---|
| print all | O(n) | Ω(n) | Θ(n) — every input visits all n |
| search unsorted | O(n) | Ω(1) | none without a case (best Θ(1), worst Θ(n)) |

(b) 1. O(n) (−2000 only matters for small n). 2. O(n³). 3. O(n) (log n grows slower than n).

</details>

## 5. Common Orders of Growth

A handful of functions cover almost every algorithm (chart from bigocheatsheet.com — green for O(1)/O(log n), yellow O(n), orange O(n log n), red O(n²), O(2ⁿ), O(n!)).

| Order | Name | Typical shape | Example | n = 1,000 |
|---|---|---|---|---|
| $1$ | constant | fixed statements | `a[i]` | 1 |
| $\log n$ | logarithmic | halve the range each step | binary search | ≈10 |
| $n$ | linear | one loop | linear search | 1,000 |
| $n \log n$ | linearithmic | divide in half + linear work | mergesort | ≈10⁴ |
| $n^2$ | quadratic | two nested loops | 2-Sum | 10⁶ |
| $n^3$ | cubic | three nested loops | 3-Sum | 10⁹ |
| $2^n$ | exponential | every subset | subset sum | ≈10³⁰¹ |
| $n!$ | factorial | every ordering | brute-force TSP | astronomically large |

## 6. Space Complexity

A **bit** is 0/1, a **byte** is 8 bits. Traditional KB/MB/GB/TB = $2^{10}/2^{20}/2^{30}/2^{40}$ bytes (1,024, not 1,000); the IEC names for these powers of two are KiB/MiB/GiB/TiB.

Typical C++ sizes, with `sizeof` measured on x86-64 Linux (g++ 13):

| Type | Typical | Measured |
|---|---|---|
| `bool`, `char` | 1 byte | 1 |
| `short` | 2 | 2 |
| `int`, `float` | 4 | 4 |
| `long` | 4 or 8 | 8 |
| `long long`, `double` | 8 | 8 |
| pointer (`int*`) | 8 on 64-bit, 4 on 32-bit | 8 |

- **Static arrays**: element storage, 0 overhead. **Dynamic arrays** and **objects**: storage + variable overhead.
- **Pointers**: 8 bytes on 64-bit. **References**: no guaranteed size (implementation-dependent).

> ⚠️ **Pitfall**: `long` is 4 bytes on 64-bit Windows; use `std::int64_t` if you need an exact width.

> 📘 **Beyond the lecture** (algs4): objects are padded for alignment — measured, `struct { char c; double d; }` is **16** bytes, not 9.

## 7. Analysis of Recursion: Recurrences and Recursion Trees

### 7.1 Why analyze recursion

Some algorithms and data structures are best written recursively, so we need to find their running time just as we did for loops. The standard example:

```cpp
int factorial(int n)
{
    if (n == 0)
        return 1;
    else
        return n * factorial(n - 1);
}
```

**What is the worst-case time complexity?** O(n). `factorial(n)` makes n multiplications and n + 1 calls in total (`factorial(n)`, `factorial(n-1)`, …, `factorial(0)`), each doing constant work.

> ⚠️ **Pitfall**: "No loops, so O(1)" is wrong. The work is hidden in the recursive call: `factorial(10)` clearly does more than `factorial(5)`. Always ask how many calls happen and what each one costs.

### 7.2 The two-step recipe

To find the time complexity of a recursive algorithm:

1. **Set up a recurrence**: an equation that expresses the running time T(n)
   - in terms of one or more subproblems of size < n,
   - plus any additional work done outside the recursive calls.
2. **Solve the recurrence** (approximately), using one of two methods:
   - **Method A — Recursion-tree method** ([§7.4](#74-method-a-recursion-tree-for-factorial)–[§7.5](#75-recursion-tree-for-a-divide-in-half-recurrence))
   - **Method B — Master theorem** ([§8](#8-the-master-theorem))

Every recurrence also needs a **base case** (e.g. T(0) or T(1)), which is a constant.

### 7.3 Setting up a recurrence: factorial

For the `factorial` function above:

```text
T(0) = a
T(n) = b + T(n - 1)      for n > 0
```

- **T(0)** is the time when `n == 0`. **a** is the constant time to check `n == 0` and return 1.
- For **n > 0**, **b** is the constant time for everything *except* the recursive call (the check, `n - 1`, the multiply, the return).
- **T(n − 1)** is the time of the recursive call. It is described by the same recurrence.

Reading a recurrence off code: count the recursive calls (here one), write the size each one gets (here n − 1), and add the cost of the rest of the body (here the constant b).

> 📘 **Beyond the lecture** (Thornton, *Asymptotic Analysis of Recursion*): another way to solve it is **repeated substitution**. Keep substituting until a pattern shows:
> T(n) = b + T(n−1) = 2b + T(n−2) = 3b + T(n−3) = … = jb + T(n−j).
> (The pattern can be proven for all j by induction.) Choose j = n to reach the base case: T(n) = nb + T(0) = **nb + a**, which grows linearly, so T(n) is Θ(n). The recursion tree in the next section reaches the same sum by drawing it.

### 7.4 Method A: recursion tree for factorial

Draw one node per call, put the work each call does *outside* its recursive calls next to it, and add everything up. For `factorial(5)` the "tree" is a chain:

| Call | Level | Recurrence term | Work at this node |
|---|---|---|---|
| `factorial(5) = 5 * factorial(4)` | 0 | T(n) | b |
| `factorial(4) = 4 * factorial(3)` | 1 | T(n−1) | b |
| `factorial(3) = 3 * factorial(2)` | 2 | T(n−2) | b |
| `factorial(2) = 2 * factorial(1)` | 3 | T(n−3) | b |
| `factorial(1) = 1 * factorial(0)` | 4 | T(n−4) | b |
| `factorial(0) = 1` | base | T(0) = constant | a |

- There are **n levels** (plus the base case).
- Each level takes constant time b.
- T(n) = levels × time per level = n·b (+ a) ⇒ **O(n)**.

Step through it below (← / → keys work when the demo is focused):

```viz recursion-tree
{"title": "factorial(5) as a recursion tree", "recurrence": "T(n) = b + T(n-1)", "n": 5, "base": "a", "code": "factorial"}
```

Counting the calls in real code agrees: an instrumented `factorial` (a `++calls` at the top) prints

```text
factorial(5) = 120, calls = 6
```

That is n + 1 = 6 calls: five with cost b, one base case with cost a.

### 7.5 Recursion tree for a divide-in-half recurrence

An "unknown algorithm" splits its input in half twice and does linear work at each call:

```text
T(n) = 2T(n/2) + n
T(1) = c,  where c is a constant
```

**The rule of the method:** charge each operation to the function call (tree node) where it is executed. Work done inside further recursive calls is counted separately, at *their* nodes. So the node for an input of length m is charged m (the "+ n" term evaluated at its own size), and never more.

| Level | Calls | Input size each | Work per call | Level total |
|---|---|---|---|---|
| 0 | 1 | n | n | n |
| 1 | 2 | n/2 | n/2 | n |
| 2 | 4 | n/4 | n/4 | n |
| 3 | 8 | n/8 | n/8 | n |
| … | … | … | … | n |
| log₂ n (leaves) | 2^(log₂ n) = n | 1 | c | c·n |

- The size halves on each level, so it reaches 1 after **log₂ n** halvings. The tree has height log₂ n, so there are log₂ n + 1 levels counting the leaf level.
- There are **n leaves**, each a base case T(1) = c.
- Each non-leaf level costs **n** in total: 2^i calls × n/2^i each.
- Total: n·log₂ n + c·n ⇒ **O(n log n)**.

Step through it below. The input bar lets you type any recurrence of the form aT(n/b) + f(n) (for example, the ones in the practice problems):

```viz recursion-tree
{"title": "T(n) = 2T(n/2) + n, drawn for n = 8", "recurrence": "T(n) = 2T(n/2) + n", "n": 8, "interactive": true}
```

A real function with exactly this shape, counting one unit for each "+ n" step and one for each base case (c = 1):

```cpp
long work = 0;

void unknown(int n)                      // T(n) = 2T(n/2) + n
{
    if (n == 1) { ++work; return; }      // base case: c
    for (int i = 0; i < n; ++i) ++work;  // the "+ n"
    unknown(n / 2);
    unknown(n / 2);
}
```

```text
unknown(8): work = 32
unknown(16): work = 80
unknown(1024): work = 11264
```

Each matches n·log₂ n + n: 8·3 + 8 = 32, 16·4 + 16 = 80, 1024·10 + 1024 = 11264.

> 💡 **Key Insight**: For a recursion tree you need three numbers: how many levels, how many nodes per level, and how much work each node does. Total = the sum of the level totals.

### 7.6 Practice

#### How many levels and leaves?

For the tree of

```text
T(n) = 2T(n/2) + n
T(1) = c, where c is a constant
```

How many levels and leaves are there?

> Hint: how many times can you halve n before reaching 1?

<details>
<summary>Solution</summary>

The input size halves at each level, reaching 1 after log₂ n halvings. So the tree has height log₂ n, which gives **log₂ n + 1 levels** if you count both the root level 0 and the leaf level. The number of nodes doubles each level, so the leaf level has 2^(log₂ n) = **n leaves**. Each non-leaf level costs n and the leaves cost c·n, so T(n) = n log₂ n + cn = O(n log n). See [§7.5](#75-recursion-tree-for-a-divide-in-half-recurrence).

</details>

#### Recursion tree method: binary search and 2T(n/2) + c

**(a)** Determine the Big-O time complexity of binary search using the recursion tree method:

```text
T(n) = T(n/2) + c
T(1) = c
```

**(b)** Determine the Big-O time complexity for the following recurrence using the recursion tree:

```text
T(n) = 2T(n/2) + c
```

(The original problem labels both parts "a)".)

<details>
<summary>Solution</summary>

**Solution (a): O(log n).** Each call makes **one** recursive call on half the range and does constant work c (compute `mid`, one comparison). The "tree" is a chain with one node per level. There are log₂ n + 1 levels, each costing c, so T(n) = c(log₂ n + 1) = **O(log n)**. A recursive binary search with exactly this shape:

```cpp
bool binarySearch(const int* arr, int lo, int hi, int target)
{
    if (lo > hi) return false;           // empty range
    int mid = lo + (hi - lo) / 2;
    if (arr[mid] == target) return true;
    if (target < arr[mid])
        return binarySearch(arr, lo, mid - 1, target);
    return binarySearch(arr, mid + 1, hi, target);
}
```

Searching a 16-element array for a value that isn't there (the worst case) makes 6 calls: ranges of size 16, 8, 4, 2, 1 and then the empty range. That is log₂ 16 + 1 = 5 levels plus the empty-range call this version uses as its base case.

</details>

<details>
<summary>Solution</summary>

**Solution (b): O(n).** Level i has 2^i nodes, each costing c, so the level totals are c, 2c, 4c, …, n·c (the n leaves). This geometric sum is c(2n − 1) = **O(n)**. The work doubles every level, so the leaves dominate. The two recurrences differ only in "T" vs "2T", and that alone takes the answer from log n to n. Check the sum below (n = 16: 31c = c(2·16 − 1)):

```viz recursion-tree
{"title": "T(n) = 2T(n/2) + c, drawn for n = 16", "recurrence": "T(n) = 2T(n/2) + c", "n": 16}
```

</details>

## 8. The Master Theorem

### 8.1 The formula

The master theorem is a formula that solves recurrences in which **all subproblems are the same size**. It packages the recursion-tree method into a plug-and-play result, so it is faster than drawing the tree.

Suppose $T(n) = a \cdot T(n/b) + O(n^d)$. Then

$$
T(n) = \begin{cases}
O(n^d \log n) & \text{if } a = b^d \\
O(n^d) & \text{if } a < b^d \\
O(n^{\log_b a}) & \text{if } a > b^d
\end{cases}
$$

Three parameters:

- **a**: number of subproblems (recursive calls per call)
- **b**: factor by which the input size shrinks (each subproblem has size n/b)
- **d**: the non-recursive work is n^d, i.e. the work to create all the subproblems and combine their solutions

To use it, read off a, b, d, compute b^d, and compare it with a.

> ⚠️ **Pitfall**: constant extra work, O(1) or "+ c", means **d = 0** (n⁰ = 1), so b^d = 1. In T(n) = 2T(n/2) + c the comparison is 2 vs 1, not 2 vs 2.

### 8.2 Why three cases: where the work is

The recursion tree shows where the formula comes from. Level 0 has 1 node doing f(n). Level 1 has a nodes doing f(n/b) each. Level i has **a^i** nodes on inputs of size **n/b^i**. The bottom level has a^(log_b n) = n^(log_b a) leaves doing f(1).

With f(n) = n^d, level i costs a^i · (n/b^i)^d = n^d · (a/b^d)^i. So going down one level multiplies the level total by **a / b^d**:

| Case | Level totals going down | Intuition | Result |
|---|---|---|---|
| a = b^d | stay the same (n^d each, log_b n + 1 levels) | Work **balanced** across the tree | O(n^d log n) |
| a < b^d | shrink geometrically | Work done at the **root dominates** | O(n^d) |
| a > b^d | grow geometrically | Work done at the **leaves dominates** | O(n^(log_b a)), the number of leaves |

Step through a leaves-dominate example below; type other recurrences in the input bar to see the other two cases:

```viz recursion-tree
{"title": "T(n) = 4T(n/2) + n, drawn for n = 4", "recurrence": "T(n) = 4T(n/2) + n", "n": 4, "interactive": true}
```

### 8.3 Worked examples

| Recurrence | a | b | d | a vs b^d | T(n) |
|---|---|---|---|---|---|
| T(n) = 4T(n/2) + O(n) | 4 | 2 | 1 | 4 > 2 | O(n^(log₂ 4)) = **O(n²)** |
| T(n) = 3T(n/2) + O(n) | 3 | 2 | 1 | 3 > 2 | O(n^(log₂ 3)) ≈ **O(n^1.6)** (log₂ 3 ≈ 1.585) |

And the recurrence from [§7.5](#75-recursion-tree-for-a-divide-in-half-recurrence) for comparison: T(n) = 2T(n/2) + n has a = 2, b = 2, d = 1, so 2 = 2¹, which is the balanced case: O(n log n), the same as the recursion tree.

### 8.4 When it does not apply

**Can the master theorem solve T(n) = T(n/3) + T(2n/3) + n?** **No.** The two subproblems have different sizes (n/3 and 2n/3), so there is no single b. Use the recursion tree instead. Each full level costs at most n (the sizes on a level add up to at most n). The longest path shrinks by 2/3 each step, so there are about log_{3/2} n levels. Total O(n log n).

> ⚠️ **Pitfall**: the master theorem needs the form a·T(n/b) + n^d with equal-size subproblems. T(n−1) recurrences (like factorial) and uneven splits are not covered. Use the recursion tree (or substitution) for those.

### 8.5 Practice

#### Eight recurrences with the master theorem

Solve with the master theorem, $T(n) = a \cdot T(n/b) + O(n^d)$:

**(a)** Write the recurrence for binary search and solve it with the master theorem.

**(b)** T(n) = T(n/2) + O(n)

**(c)** T(n) = 2T(n/2) + O(1)

**(d)** T(n) = 2T(n/2) + O(n)

**(e)** T(n) = 4T(n/2) + n

**(f)** T(n) = 4T(n/2) + n²

**(g)** T(n) = 4T(n/2) + n³

**(h)** T(n) = 3T(2n/3) + n

> Hint: for each one write a, b, d, then compare a with b^d.

<details>
<summary>Solution</summary>

| | Recurrence | a | b | d | b^d | Case | T(n) |
|---|---|---|---|---|---|---|---|
| (a) | T(n) = T(n/2) + O(1) | 1 | 2 | 0 | 1 | a = b^d | O(n⁰ log n) = **O(log n)** |
| (b) | T(n) = T(n/2) + O(n) | 1 | 2 | 1 | 2 | a < b^d | **O(n)** |
| (c) | T(n) = 2T(n/2) + O(1) | 2 | 2 | 0 | 1 | a > b^d | O(n^(log₂ 2)) = **O(n)** |
| (d) | T(n) = 2T(n/2) + O(n) | 2 | 2 | 1 | 2 | a = b^d | **O(n log n)** |
| (e) | T(n) = 4T(n/2) + n | 4 | 2 | 1 | 2 | a > b^d | O(n^(log₂ 4)) = **O(n²)** |
| (f) | T(n) = 4T(n/2) + n² | 4 | 2 | 2 | 4 | a = b^d | **O(n² log n)** |
| (g) | T(n) = 4T(n/2) + n³ | 4 | 2 | 3 | 8 | a < b^d | **O(n³)** |
| (h) | T(n) = 3T(2n/3) + n | 3 | 3/2 | 1 | 1.5 | a > b^d | O(n^(log_{3/2} 3)) ≈ **O(n^2.71)** |

Key traps:

- (a) and (c) have O(1) extra work, so **d = 0**. (a) matches the binary-search recursion tree in [§7.6](#76-practice).
- (c) and the recursion tree of the 2T(n/2) + c problem in [§7.6](#76-practice) agree: O(n).
- (e)–(g) keep a = 4, b = 2 and change only d, which walks through all three cases: leaves, balanced, root.
- (h): the size shrinks *to* 2n/3, so the shrink factor is b = n ÷ (2n/3) = **3/2**, not 2/3 or 3. Then log_{3/2} 3 = ln 3 / ln 1.5 ≈ 1.0986 / 0.4055 ≈ 2.71.

</details>

## 9. Quick Reference & Top 5 Things to Remember

| Tool | What it gives | Key fact |
|---|---|---|
| Doubling test | exponent b of T(n) = a·n^b | T(n)/T(n/2) → 2^b; a depends on the machine, b does not |
| Cost model + tilde | leading term of an operation count | 2-Sum ~ n² array accesses; 3-Sum ~ n³/2 |
| Big-O / Ω / Θ | upper / lower / tight bound | Θ exists only when O and Ω agree; case (best/worst) is a separate choice |
| Orders of growth | 1 < log n < n < n log n < n² < n³ < 2ⁿ < n! | slower growth = better algorithm |
| Recurrence (factorial) | T(n) = b + T(n−1) | O(n) |
| Recurrence (halving) | T(n) = T(n/2) + c; 2T(n/2) + c; 2T(n/2) + n | O(log n); O(n); O(n log n) |
| Master theorem | T(n) = aT(n/b) + O(n^d) | a = b^d: O(n^d log n); a < b^d: O(n^d); a > b^d: O(n^(log_b a)) |

**Top 5 things to remember**

1. Running time follows a power law T(n) = a·n^b; the doubling ratio 2^b reveals b, and only the constant a depends on hardware.
2. Total time = Σ cost × frequency; pick one cost model (e.g. array accesses) and keep the leading term (tilde): 2-Sum ~ n², 3-Sum ~ n³.
3. Big-O is an upper bound, Big-Ω a lower bound, Big-Θ a tight bound (only when they agree); best/average/worst case is a separate question from the bound.
4. A recursive algorithm needs a recurrence (base case + subproblems + outside work); solve it with a recursion tree: levels × nodes per level × work per node.
5. Master theorem for T(n) = aT(n/b) + O(n^d): compare a with b^d (equal: n^d log n; less: n^d; greater: n^(log_b a)); constant extra work means d = 0, and uneven subproblem sizes or T(n−1) need the tree instead.

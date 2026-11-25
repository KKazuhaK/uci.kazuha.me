---
title: "链接分析：HITS 与 PageRank"
summary: "为何链接是证据；HITS 的枢纽页与权威页（根集与基础集、连通性服务器、迭代与主题漂移）；PageRank 的随机游走者与远程跳转；按迭代与矩阵形式给出的 PageRank 公式；以及 PageRank 在真实搜索引擎中如何使用。"
topics:
  - link-analysis
kind: "topic"
order: 508
---

# CS 121: Information Retrieval — 话题：链接分析：HITS 与 PageRank

## 目录

- [1. 链接为何是证据](#1-链接为何是证据)
- [2. HITS：枢纽页与权威页](#2-hits枢纽页与权威页)
- [3. PageRank：随机游走者](#3-pagerank随机游走者)
- [4. 计算 PageRank](#4-计算-pagerank)
- [5. 真实搜索引擎中的 PageRank](#5-真实搜索引擎中的-pagerank)
- [6. HITS 与 PageRank](#6-hits-与-pagerank)
- [7. 速查与五条要点](#7-速查与五条要点)

> 本章用页面之间的**链接**而不是页面的文字来给页面打分。它以网络图（[搜索引擎与 Web](topic-search-engines.zh-CN.md)）和 tf-idf / 余弦排序（[检索模型](topic-retrieval-models.zh-CN.md)）为前提；它产生的分数会成为 [查询处理与高效 Top-K](topic-query-processing.zh-CN.md) 中的静态质量分数 $g(d)$。

## 1. 链接为何是证据

从页面 $x$ 到页面 $y$ 的一条链接，是一个微小的、由人作出的判断：$x$ 的作者认为 $y$ 值得指向。仅靠文本匹配，无法区分一个受人尊重的页面与一个复制品，或与之用了相同词语的垃圾页面；链接结构却可以做到。

网络搜索当时多么迫切地需要这一信号：在 **1997 年 11 月**，"only one of the top four commercial search engines finds itself"（即四大商业搜索引擎中只有一个，在搜索自身名称时，能在前十条结果中返回它自己的搜索页面）。Brin 和 Page 在提出 PageRank 的论文中明确表述的目标是 "to improve the quality of web search engines"（提高网络搜索引擎的质量）。

> 📘 **延伸阅读**： [Brin & Page, "The Anatomy of a Large-Scale Hypertextual Web Search Engine" (1998)](http://infolab.stanford.edu/~backrub/google.html) · [Page, Brin, Motwani & Winograd, "The PageRank Citation Ranking: Bringing Order to the Web"](http://ilpubs.stanford.edu:8090/422/)

两个经典算法把链接转化为分数：

- **HITS**（§2）以**每个查询**为单位：它收集查询结果周围的页面，找出两类好页面，即枢纽页和权威页。
- **PageRank**（§3–§5）对**整个网络只计算一次**：为每个页面给出一个与查询无关的分数，即随机游走者的长期访问率。

## 2. HITS：枢纽页与权威页

### 2.1 枢纽页与权威页

**超链接诱导的主题搜索（HITS）**。对于一个查询，它不返回一个由各自满足查询的页面组成的有序列表，而是找出**两组相互关联的页面**：

- **枢纽页**是关于某一主题的**优质链接列表**，例如 Bob 的癌症相关链接列表。
- **权威页**会**反复出现在**该主题的**优质枢纽页**上。

HITS 最适合**"宽泛主题"查询**，而不是找单个页面的查询；它能反映**更广泛的大众共识**。

这一定义是**循环的**：

- 某一主题的好**枢纽页**会**指向**该主题的许多权威页。
- 某一主题的好**权威页**会**被**该主题的许多好枢纽页**指向**。

这种循环被转化为一个**迭代计算**。其设想是：如果枢纽 Alice 和 Bob 都链接到 AT&T、Sprint 和 Tmob，那么这三者会作为*移动电信公司*的权威页脱颖而出（计算过程见 [§2.5](#25-练习)）。

### 2.2 基础集与连通性服务器

**总体方案**：从网络中抽取一个**基础集**，其中的页面可能是好的枢纽页或权威页；再用迭代算法从中找出**少量排名靠前的枢纽页与权威页**。

**构建基础集**：

1. 给定一个文本查询（比如 *browser*），用**文本索引**取得所有包含 *browser* 的页面，称之为**根集**。
2. 加入任何**指向**根集中某个页面，或**被**根集中某个页面**指向**的页面。
3. 称之为**基础集**。

可以把根集想象成一块内部区域，把基础集想象成包围它的一个方框，方框中还包括与之相连的邻居页面；根集的入链（以及出链）则来自**连通性服务器**。

**连通性服务器**：支持对网络图进行快速查询，即**哪些 URL 指向某个给定的 URL？某个给定的 URL 指向哪些 URL？**

- 在**内存**中保存从 URL 到出链、从 URL 到入链的映射。
- 利用图的**稀疏**性质（**不要构造整个矩阵！**）。
- 应用包括：**爬取控制**；**网络图分析**（连通性、爬取优化）；**链接分析**（HITS、PageRank 等）。

### 2.3 迭代过程

**提炼枢纽页与权威页**。对基础集中的每个页面 $x$，计算一个**枢纽分数 $h(x)$** 和一个**权威分数 $a(x)$**。

- **初始化**：对所有 $x$，$h(x) \leftarrow 1$，$a(x) \leftarrow 1$。
- **迭代更新**所有 $h(x)$、$a(x)$：

$$h(x) \leftarrow \sum_{x \mapsto y} a(y) \qquad\qquad a(x) \leftarrow \sum_{y \mapsto x} h(y)$$

$x \mapsto y$ 表示"$x$ 链接到 $y$"：一个页面的枢纽分数，是它**所指向**的页面的权威分数之和；它的权威分数，是**指向它**的页面的枢纽分数之和。

- 经过若干次迭代（或收敛之后），输出**$h()$ 最高**的页面作为顶级枢纽页，输出**$a()$ 最高**的页面作为顶级权威页。

**缩放**：为防止 $h()$ 和 $a()$ 变得过大，要**在每次迭代后缩小**。缩放因子其实无关紧要（只要保持一致）：**我们只关心分数的相对值**。

**需要多少次迭代？** 结论是：分数的相对值会**在几次迭代之后收敛**，经过适当缩放，$h()$ 和 $a()$ 会趋于一个**稳态**。实践中，**约 5 次迭代**就足以接近稳定。

> ⚠️ **易错点**：箭头就是全部诀窍。**枢纽**的分数来自它所指向的**权威**之和；**权威**的分数来自指向它的**枢纽**之和。把两者弄反是经典错误。

> 📘 **延伸阅读**：若以基础集的邻接矩阵 $M$ 表示（$M_{xy} = 1$ 当且仅当 $x \mapsto y$），每一轮可写为 $\mathbf{a} \leftarrow M^T\mathbf{h}$，$\mathbf{h} \leftarrow M\mathbf{a}$，于是缩放后的分数会收敛到 $M^TM$（权威）和 $MM^T$（枢纽）的主特征向量。这正是相对值能达到稳态的原因。（[IIR 第 21 章 Link analysis](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)，§21.3）

### 2.4 例子与问题

**日本小学**：一个分两栏展示的 HITS 结果。**枢纽页**包括 "100 Schools Home Pages (English)"、"K-12 from Japan"、"Koulutus ja oppilaitokset"（芬兰语）和 "Education"；**权威页**包括 "The American School in Japan"、"KEIMEI GAKUEN Home Page (Japanese)"、"Torisu primary school" 和 "Yakumo Elementary, Hokkaido, Japan"，另有许多日文标题的页面。

需要注意的是：

- 它**不论页面内容是什么语言，都能把好的页面聚集起来**。
- 基础集组装完成之后，它**只使用链接分析**；迭代打分与查询**无关**。
- 文本索引检索之后的迭代计算是**不小的开销**（但**不发生在查询时**！）。

**HITS 的问题**：

- **主题漂移**：离题的页面可能导致离题的"权威"被返回，例如邻域图可能围绕某个"超级主题"展开。
- **相互强化的附属站点**：附属页面或站点可以**相互抬高分数**。附属页面之间的链接并不是有用的信号，因此分析中**应避免考虑它们**。

> 📘 **延伸阅读**：[IIR 第 21 章 Link analysis](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §4.5 Link Analysis（书中第 104 页）、§4.5.3 Link Quality（书中第 111 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 2.5 练习

#### 移动电信图上的 HITS

枢纽 Alice 和 Bob 各自链接到 AT&T、Sprint 和 Tmob；第三个页面 Carol 只链接到 AT&T。所有分数从 1 开始。每一轮先由当前的枢纽分数计算每个权威分数，再由新的权威分数计算每个枢纽分数，然后将每个列表缩放，使其最大值为 1。请给出第 1 轮后的分数，并说明它们最终收敛到哪里。

<details>
<summary>解答</summary>

**第 1 轮。** 由 $h = 1$ 得到权威分数：AT&T 被 Alice、Bob 和 Carol 指向 → 3；Sprint 与 Tmob 各被 Alice 和 Bob 指向 → 各为 2。除以 3 缩放后：**AT&T = 1，Sprint = Tmob = 0.667**。由这些权威分数得到枢纽分数：Alice = Bob = 1 + 0.667 + 0.667 = 2.333，Carol = 1。除以 2.333 缩放后：**Alice = Bob = 1，Carol = 0.429**。

用 Python 运行各轮：

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

到第 4–5 轮时，结果的小数点后第三位已不再变化：大约五轮即可达到稳态。AT&T、Sprint 和 Tmob 是权威页（AT&T 排第一，因为它多一个指向它的枢纽）；Alice 和 Bob 是顶级枢纽页。Carol 是较弱的枢纽页，因为它只指向一个权威页。

</details>

## 3. PageRank：随机游走者

### 3.1 随机游走

**PageRank 打分**。设想一个浏览器在网页上做**随机游走**：

- 从一个随机页面开始。
- 每一步，都沿当前页面上的某条链接离开，且**每条链接被选中的概率相等**（一个有三条出链的页面，每条出链被选中的概率都是 1/3）。
- 在**稳态**下，每个页面都有一个**长期访问率**，并把它作为该页面的分数。

### 3.2 死胡同与远程跳转

**还不够**：网络上充满了**死胡同**（有入链但没有出链的页面）。随机游走可能会**卡在**死胡同里，而一旦如此，讨论长期访问率就没有意义了。

**远程跳转**：

- **在死胡同处**，跳转到一个**随机网页**。
- **在非死胡同处**，以 **10%** 的概率跳转到一个随机网页；以其余的概率（**90%**）沿一条随机链接离开。
- 这里的 10% 是一个**参数**。

**远程跳转的结果**：现在游走者**不会在局部卡住**，并且任何页面都有一个**长期被访问的速率**（这一点并不显然）。PageRank 的思想是：这个随机游走者访问得越多的页面，就越重要。如何计算这一访问率，见 §4。

> 💡 **关键洞见**：与 HITS 不同，PageRank 是为**整个网络**计算一次，而不是按查询计算，它是 [查询处理与高效 Top-K](topic-query-processing.zh-CN.md) 中的静态质量分数 $g(d)$。而与锚文本（[文本处理](topic-text-processing.zh-CN.md)）不同，它只使用链接结构，而不使用链接上的文字。

> 📘 **延伸阅读**：[Croft §4.5.2 PageRank（书中第 105 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR 第 21 章 Link analysis](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

## 4. 计算 PageRank

计算 PageRank 有两种方法：**1. 代数计算**（原始 Google 论文中所用的方法）和 **2. 马尔可夫链模型**。本节展开的是代数方法。

### 4.1 公式

$$p_i = (1 - d) + d \sum_{j=1}^{N} \left(\frac{L_{ij}}{c_j}\right) p_j \qquad\qquad c_j = \sum_{i=1}^{N} L_{ij}$$

$p_i$ 是页面 $i$ 的 PageRank，$p_j$ 是页面 $j$ 的 PageRank；若页面 $j$ 指向 $i$，则 $L_{ij} = 1$，否则为 0；$c_j$ 是**离开页面 $j$ 的链接数**（即它的出链数）；$d$ 是**阻尼因子**。

同一公式，按 Google 论文的写法为：

$$PR(A) = (1 - d) + d \left( \frac{PR(T_1)}{C(T_1)} + \dots + \frac{PR(T_n)}{C(T_n)} \right)$$

$A$ 是一个页面；$T_1 \dots T_n$ 是**链接到** $A$ 的页面；$PR(T_i)$ 是 $T_i$ 的 PageRank；$C(T_i)$ 是 $T_i$ 的**出向**链接数；$d$ 是阻尼（远程跳转）因子，**通常取 0.85**。

> ⚠️ **易错点**：$C(T_i)$ 统计的是**投出票的**页面的出链数，而不是 $A$ 的入链数。出链很多的页面会把它的 PageRank 分成许多小份的投票。

两种参数化方式是一致的：$d$ 是沿链接前进的概率，所以随机游走中的"10% 远程跳转"对应 $d = 0.9$，而公式中的 $d = 0.85$ 对应 15% 的远程跳转。公式经过缩放，使**平均** PageRank 为 1（而不是总和为 1）：在下面的例子中，三个值的和始终为 $N = 3$。

### 4.2 三页示例

三个页面：**A → B**、**B → C**、**C → A** 和 **C → B**。因此 $C(A) = 1$、$C(B) = 1$、$C(C) = 2$，取 $d = 0.85$：

$$PR(A) = 0.15 + 0.85 \cdot \frac{PR(C)}{2}$$
$$PR(B) = 0.15 + 0.85 \cdot \left(\frac{PR(A)}{1} + \frac{PR(C)}{2}\right)$$
$$PR(C) = 0.15 + 0.85 \cdot \frac{PR(B)}{1}$$

**从哪里开始？** 先猜 $PR(p) = 1$，然后**迭代**。每一轮都用**上一轮**的值计算三个新值。

| 迭代 | PR(A) | PR(B) | PR(C) | 总和 |
|---|---|---|---|---|
| 0（猜测） | 1 | 1 | 1 | 3 |
| 1 | 0.575 | 1.425 | 1 | 3 |
| 2 | 0.575 | 1.06375 | 1.36125 | 3 |
| 3 | 0.728531 | 1.217281 | 1.054187 | 3 |
| … | | | | |
| 19 | 0.644456 | 1.192206 | 1.163337 | 3 |
| 极限 | 0.6444 | 1.1922 | 1.1634 | 3 |

下表各行由以下脚本得到：第 19 轮是第一次没有任何值变化 0.0001 或更多的迭代；"极限"是三个方程的精确解（保留 4 位小数）：

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

该算法**在 N 轮迭代之后收敛**；收敛之后，归一化的概率分布（即**所有页面的平均 PageRank**）为 **1**，这里即 $3 / 3 = 1$。B 排名第一：它同时获得了 A 和 C 的投票。

```viz pagerank
{"title": "A、B、C 图的 PageRank", "graph": "A -> B; B -> C; C -> A, B", "interactive": true}
```

> 📝 **练习**：[§4.4](#44-练习)

### 4.3 矩阵记法

把所有 $p_i$ 堆叠成一个向量 $\mathbf{p}$：

$$\mathbf{p} = (1 - d)\,\mathbf{e} + d \cdot \mathbf{L}\mathbf{D}_c^{-1}\mathbf{p} \qquad\qquad \mathbf{e}^T\mathbf{p} = N$$

$\mathbf{L}$ 是链接矩阵（$L_{ij}$），$\mathbf{D}_c$ 是**对角元为 $c_j$ 的对角矩阵**（因此 $\mathbf{D}_c^{-1}$ 把每一列除以其出度），$\mathbf{e}$ 是**由 $N$ 个 1 组成的向量**。约束 $\mathbf{e}^T\mathbf{p} = N$ 是为使**平均 PageRank 为 1** 而选取的**归一化**。利用它，$(1-d)\mathbf{e} = (1-d)\mathbf{e}\mathbf{e}^T\mathbf{p}/N$，从而可以把所有项合并为一个矩阵：

$$\mathbf{p} = \left[(1 - d)\,\mathbf{e}\mathbf{e}^T/N + d\,\mathbf{L}\mathbf{D}_c^{-1}\right]\mathbf{p} = \mathbf{A}\mathbf{p}$$

因此 $\mathbf{p}$ 是 $\mathbf{A}$ 的特征向量（特征值为 1），可以用**幂迭代**求得：

$$\mathbf{p}_k \leftarrow \mathbf{A}\mathbf{p}_{k-1}; \qquad \mathbf{p}_k \leftarrow N \frac{\mathbf{p}_k}{\mathbf{e}^T\mathbf{p}_k}$$

矩阵形式便于并行化：每一轮只是一次稀疏矩阵与向量的乘积。同一个例子的矩阵形式如下：

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

与表中的极限值相同。

> 📘 **延伸阅读**：[PageRank 可视化](http://ed.ilogues.com/projects/2015/03/22/pagerank-visualization) · [Croft §4.5.2 PageRank（书中第 105 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 4.4 练习

#### 手工计算 PageRank 的前两轮迭代

链接：A → B，B → C，C → A，C → B。$d = 0.85$，每个页面从 1 开始。计算第 1 和第 2 轮迭代，并说明它收敛到哪里。

<details>
<summary>解答</summary>

出链数：$C(A) = 1$，$C(B) = 1$，$C(C) = 2$。入链：A ← C；B ← A、C；C ← B。每个新值都使用**上一轮**的值。

**第 1 轮**（上一轮的值均为 1）：
- $PR(A) = 0.15 + 0.85 \cdot 1/2 = 0.575$
- $PR(B) = 0.15 + 0.85 \cdot (1/1 + 1/2) = 1.425$
- $PR(C) = 0.15 + 0.85 \cdot 1/1 = 1$

**第 2 轮**（上一轮的值：A = 0.575，B = 1.425，C = 1）：
- $PR(A) = 0.15 + 0.85 \cdot 1/2 = 0.575$
- $PR(B) = 0.15 + 0.85 \cdot (0.575 + 1/2) = 1.06375$
- $PR(C) = 0.15 + 0.85 \cdot 1.425 = 1.36125$

继续使用 [§4.2](#42-三页示例) 的脚本：第 3 轮得到 A = 0.728531，B = 1.217281，C = 1.054187；第 19 轮是第一次没有任何值变化 0.0001 或更多的迭代（A = 0.644456，B = 1.192206，C = 1.163337），精确解为 **A ≈ 0.6444，B ≈ 1.1922，C ≈ 1.1634**。每一轮的和都保持为 3（没有死胡同），因此平均 PageRank 为 **1**。**B** 排名第一：它获得了 A 的全部投票，加上 C 投票的一半。

```viz pagerank
{"title": "核对：逐页计算第 1–2 轮迭代，再到收敛", "graph": "A -> B; B -> C; C -> A, B", "code": "none"}
```

</details>

## 5. 真实搜索引擎中的 PageRank

**PageRank 小结**：

- **预处理**：给定链接图，构建一个（稀疏）链接矩阵，并由它计算 PageRank。
- 在查询处理（查询时）中加入 PR 的一种方式：检索出满足查询的页面，并**按它们的 PageRank 排序**。但这一排序与**查询无关**……

**现实情况**：

- PageRank 被 Google 等搜索引擎使用，但它**远非排序的全部故事**。它只是相关性打分中**众多标准之一**；还使用了许多其他复杂特征，其中一些针对特定的查询类别，而**机器学习排序**的使用也越来越多。
- 对于一个查询，真实的搜索引擎会为每个网页计算一个**综合分数**，它结合了**数百个特征**（余弦相似度、词项邻近度、PageRank、HITS 等），即 [检索模型](topic-retrieval-models.zh-CN.md) 中的聚合分数。
- 单独使用 PageRank，对于**爬取策略**（[网络爬虫](topic-crawling.zh-CN.md)）等工作仍然非常有用。

> 📘 **延伸阅读**：[Croft §7.5 Web Search（书中第 279 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 6. HITS 与 PageRank

| | HITS | PageRank |
|---|---|---|
| 分数 | 枢纽 $h(x)$，权威 $a(x)$ | 每个页面一个分数 |
| 更新 | $h(x) \leftarrow \sum_{x \mapsto y} a(y)$，$a(x) \leftarrow \sum_{y \mapsto x} h(y)$ | $PR(A) = (1-d) + d\sum PR(T_i)/C(T_i)$ |
| 起始 | 全部为 1 | 全部为 1 |
| 图 | 每个查询的基础集（根集 + 邻居） | 整个网络 |
| 何时计算 | 检索出根集之后（不在查询时） | 离线，只计算一次 |
| 迭代 | 约 5 次，每次重新缩放 | 直到收敛（平均 PR = 1） |
| 问题 | 主题漂移、相互强化的附属站点 | 死胡同 → 远程跳转 |
| 最适合 | 宽泛主题的查询 | 与查询无关的质量分数 $g(d)$ |

## 7. 速查与五条要点

| 术语 | 含义 |
|---|---|
| 枢纽页 | 指向许多好的权威页的页面 |
| 权威页 | 被许多好的枢纽页指向的页面 |
| 根集 | 文本索引中包含查询的页面 |
| 基础集 | 根集，加上指向根集或被根集指向的页面 |
| 连通性服务器 | 内存中的 URL → 出链 / 入链映射，稀疏存储 |
| 死胡同 | 没有出链的页面 |
| 远程跳转 | 跳转到一个随机页面（在死胡同处总是跳转；在其他地方以概率 $1-d$ 跳转） |
| 阻尼因子 $d$ | 沿链接前进的概率；通常为 0.85 |

**必记的 5 件事**

1. **HITS**：枢纽 = 它所指向的权威之和，权威 = 指向它的枢纽之和；从 1 开始，每轮重新缩放，约 5 轮；只有相对值有意义。
2. HITS 在每个查询的**基础集**上运行（根集来自文本索引，其入邻居与出邻居来自连通性服务器）；它存在主题漂移和相互强化的附属站点问题。
3. **PageRank** 是随机游走者的长期访问率；**远程跳转**解决死胡同问题，并保证该访问率存在。
4. $PR(A) = (1-d) + d \sum PR(T_i)/C(T_i)$，其中 $d = 0.85$，$C(T_i)$ 是**投票页面**的出链数；从 1 开始，每轮用上一轮的值更新所有页面；它以平均 PageRank 1 收敛（A、B、C 例子：0.6444，1.1922，1.1634）。
5. 矩阵形式 $\mathbf{p} = \mathbf{A}\mathbf{p}$ 用幂迭代求解；在真实引擎中，PageRank 是数百个特征中与查询无关的一个，也用于爬取策略。

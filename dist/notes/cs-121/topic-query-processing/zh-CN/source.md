# CS 121: Information Retrieval — 话题：查询处理与高效 Top-K

## 目录

- [1. 为何查询处理需要优化](#1-为何查询处理需要优化)
- [2. 用合并 postings 求 AND、跳表指针与查询顺序](#2-用合并-postings-求-and跳表指针与查询顺序)
- [3. 按文档处理与按词项处理](#3-按文档处理与按词项处理)
- [4. 合取处理](#4-合取处理)
- [5. 阈值方法、MaxScore 与提前终止](#5-阈值方法maxscore-与提前终止)
- [6. 高效余弦排序与用堆求前 K 个](#6-高效余弦排序与用堆求前-k-个)
- [7. 近似的前 K 个与索引剪枝](#7-近似的前-k-个与索引剪枝)
- [8. 冠军列表](#8-冠军列表)
- [9. 静态质量 g(d)、净得分与高低列表](#9-静态质量-gd净得分与高低列表)
- [10. 按影响排序的 postings](#10-按影响排序的-postings)
- [11. 分层索引](#11-分层索引)
- [12. 分布式查询求值与查询缓存](#12-分布式查询求值与查询缓存)
- [13. 方法比较](#13-方法比较)
- [14. 速查与五条要点](#14-速查与五条要点)

> 本章讲的是如何**利用**倒排索引快速回答查询。它以索引本身（[倒排索引与索引构建](topic-indexing.zh-CN.md)）以及它所加速的打分函数为前提：布尔匹配、tf-idf 与余弦相似度（[检索模型：布尔、tf-idf 与向量空间](topic-retrieval-models.zh-CN.md)）。§9 中与查询无关的质量分数 $g(d)$，通常就是 PageRank（见 [链接分析：HITS 与 PageRank](topic-link-analysis.zh-CN.md)）。

## 1. 为何查询处理需要优化

网络索引非常庞大，而用户只愿等待极短的时间。对*每一个*查询给*每一篇*文档打分是最昂贵的部分，因此引擎会设法避免这样做。本章的思路分为四类：

| 类别 | 思路 | 小节 |
|---|---|---|
| 更快的精确匹配 | 合并有序的 postings、跳表指针、从最稀有的词项开始 | §2 |
| **安全**的排序求值 | 算出与完整求值完全相同的前 $K$ 个，但读取或打分的内容更少（按文档处理、按词项处理、合取处理、MaxScore） | §3–§5 |
| **不安全**（近似）的排序求值 | 接受一个可能与精确结果略有不同的前 $K$ 个，以换取速度（索引剪枝、冠军列表、$g(d)$ 排序、影响排序、分层、提前终止） | §5、§7–§11 |
| 横向扩展 | 把工作分摊到多台机器上，并记住热门结果 | §12 |

贯穿全章的有两类优化：

| 类别 | 例子 | 更适合 |
|---|---|---|
| **从postings 列表读取更少数据** | 跳表指针（§2.2）、为索引建索引（见 [倒排索引与索引构建](topic-indexing.zh-CN.md)） | **简单的**特征（打分）函数 |
| **为更少的文档计算分数** | 合取处理（§4）、MaxScore（§5），以及近似方法 | **复杂的**特征函数 |

> 💡 **关键洞见**：从 §7 开始的一切都是**刻意不安全**的：为了速度，放弃了精确的前 $K$ 个。这是合理的，因为按余弦得到的精确前 $K$ 个从来不是真正的目标（余弦只是用户满意度的代理，见 §7.1）。

> 📘 **延伸阅读**：[IIR 第 7 章（Computing scores in a complete search system）](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7 Query Processing（书中第 165 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 2. 用合并 postings 求 AND、跳表指针与查询顺序

### 2.1 合并（INTERSECT）

给定索引，我们如何处理查询？以布尔查询 **Brutus AND Caesar** 为例（布尔模型本身见 [检索模型：布尔、tf-idf 与向量空间](topic-retrieval-models.zh-CN.md)。它只有两种结果，TRUE 与 FALSE：这是"精确匹配"检索，也是最简单形式的"排序"；邻近算子同样会用到。典型用户：电子邮件、图书馆目录、macOS Spotlight）。

1. 在词典中找到 *Brutus*，取出它的 postings。
2. 在词典中找到 *Caesar*，取出它的 postings。
3. **"合并"**两个 postings：对文档集合取**交集**。

```text
Brutus → 2 → 4 → 8 → 16 → 32 → 64 → 128
Caesar → 1 → 2 → 3 → 5 → 8 → 13 → 21 → 34
answer:  2, 8
```

**合并**同时沿两个 postings 前进，所需时间与 postings 条目的总数成线性关系。若两个列表长度分别为 $x$ 和 $y$，查询时的合并需要 $O(x+y)$ 次操作。**关键：postings 必须按 docID 排序。**

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

下面是同一算法的 Python 版本，用列表下标充当指针：

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

为什么可以移动较小的那个指针：若 `p1[i] < p2[j]`，另一个列表已经越过了 `p1[i]`（它是有序的），所以文档 `p1[i]` 不可能同时出现在两个列表中。可以自己试试不同的列表（`list1 | list2`）：

```viz postings-intersect
{"title": "Brutus AND Caesar 的合并", "lists": "2 4 8 16 32 64 128 | 1 2 3 5 8 13 21 34", "terms": "Brutus, Caesar", "lang": "zh", "interactive": true}
```

> ⚠️ **易错点**：$O(x+y)$ 的合并依赖于两个列表都**按 docID 排序**。若 postings 无序，就必须为另一个列表的每个条目在这一列表中搜索一遍。

> 📘 **延伸阅读**：[Croft §5.7 Query Processing（书中第 165 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR 第 1 章（处理布尔查询）](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

### 2.2 跳表指针

还可以为 postings 列表加上**跳表指针**（"You can also add **skip pointers**"）。在标准图中，*Brutus* `2 4 8 16 32 64 128` 的跳表指针是 2 → 16 → 128，*Caesar* `1 2 3 5 8 13 21 34` 的跳表指针是 1 → 5 → 21。当跳跃目标仍不大于另一个列表的当前 docID 时，跳表指针可以让合并**越过一段 postings**。结果相同（`2 8`），但读取的 postings 更少。跳表只有在长列表上才有价值：下面是在一个 100 条 postings 的列表与一个 3 条 postings 的列表上做合并，跳表约每隔 $\sqrt{n}$ 均匀分布：

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

答案相同，但比较次数从 95 次降为 28 次。

> 📘 **延伸阅读**：[Croft §5.4.7 Skipping and Skip Pointers（书中第 151 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR 第 2 章（用跳表指针加快 postings 合并）](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

### 2.3 查询优化：按频率递增的顺序处理

能否也在**查询时**做优化？对一个由 $n$ 个词项组成的 AND 查询：为每个词项取出 postings，再把它们 AND 起来。**最好的顺序是什么？**

| 词项 | Postings |
|---|---|
| Brutus | 2 4 8 16 32 64 128 |
| Caesar | 1 2 3 5 8 16 21 34 |
| Calpurnia | 13 16 |

查询：*Brutus AND Calpurnia AND Caesar*。**按频率递增的顺序处理**：从**最小的集合**开始，然后不断进一步缩小。应按 **(Calpurnia AND Brutus) AND Caesar** 执行。中间结果的长度永远不会超过最短的列表，因此之后的每次合并都很便宜。

**这就是我们在词典中保存文档频率的原因**：df 恰好就是每个 postings 列表的长度，在读取任何列表之前就已知。

优化后顺序的第一次合并：

```viz postings-intersect
{"title": "先算 (Calpurnia AND Brutus)——最短的列表领先", "lists": "13 16 | 2 4 8 16 32 64 128", "terms": "Calpurnia, Brutus", "lang": "zh"}
```

然后把结果 `[16]` 与 Caesar 做 AND，得到 `[16]`。

> ⚠️ **易错点**：按 **df**（文档数）排序，而不是按词项在全文中出现的总次数排序。df 是 postings 列表的长度，它决定了合并的代价。

> 📘 **延伸阅读**：[IIR 第 1 章（处理布尔查询，查询优化）](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

### 2.4 练习

#### 用合并求 Brutus AND Caesar

Brutus → `2 4 8 16 32 64 128`，Caesar → `1 2 3 5 8 13 21 34`。运行 INTERSECT，并列出每一次比较。

<details>
<summary>解答</summary>

指针对（Brutus，Caesar）：

| 步骤 | 比较 | 动作 |
|---|---|---|
| 1 | 2 vs 1 | 1 < 2 → 移动 Caesar |
| 2 | 2 vs 2 | 相等 → **加入 2**，两者都前进 |
| 3 | 4 vs 3 | 3 < 4 → 移动 Caesar |
| 4 | 4 vs 5 | 4 < 5 → 移动 Brutus |
| 5 | 8 vs 5 | 5 < 8 → 移动 Caesar |
| 6 | 8 vs 8 | 相等 → **加入 8**，两者都前进 |
| 7 | 16 vs 13 | 13 < 16 → 移动 Caesar |
| 8 | 16 vs 21 | 16 < 21 → 移动 Brutus |
| 9 | 32 vs 21 | 21 < 32 → 移动 Caesar |
| 10 | 32 vs 34 | 32 < 34 → 移动 Brutus |
| 11 | 64 vs 34 | 34 < 64 → 移动 Caesar → Caesar 已耗尽，停止 |

答案 **[2, 8]**，共 11 次比较，在 $x + y = 7 + 8 = 15$ 的上界之内。128 从未被读取。

</details>

#### Brutus AND Calpurnia AND Caesar 的最佳顺序

Brutus `2 4 8 16 32 64 128` · Caesar `1 2 3 5 8 16 21 34` · Calpurnia `13 16`。这些 AND 应按什么顺序执行？答案是什么？

<details>
<summary>解答</summary>

按文档频率递增排序：Calpurnia（df 2）、Brutus（df 7）、Caesar（df 8）。执行 **(Calpurnia AND Brutus) AND Caesar**：

1. Calpurnia AND Brutus = `[16]`。
2. `[16]` AND Caesar = `[16]`。

答案：**文档 16**。第二次合并处理的是一个只有 1 个元素的列表，而不是两个分别含 7 个和 8 个元素的列表。df 来自词典，无需读取任何 postings。

</details>

## 3. 按文档处理与按词项处理

### 3.1 两种求值顺序

对于排序检索，从postings 列表计算分数有两种方式：

- **按文档处理（DAAT）**：通过**逐个文档**处理**所有词项列表**，来计算文档的**完整分数**。
- **按词项处理（TAAT）**：通过**逐个词项列表**处理，来**累加**文档的分数。

**两种方式都有优化技术**，可以显著减少生成分数的时间（§4–§5）。

例子：查询 **salt water tropical**，postings 写作 `文档编号:词出现次数`，文档的分数是各次数之和。按文档处理逐列进行：文档 1 = 1 + 1 + 2 = **4**，文档 2 = 1 + 2 = **3**，文档 3 = **1**，文档 4 = 1 + 1 = **2**。按词项处理则依次读取 *salt*（部分分数 1:1、4:1）、*water*（1:2、2:1、4:2）、*tropical*，最终得到相同的分数 1:4、2:3、3:1、4:2。

```viz query-eval
{"title": "salt water tropical——在两种顺序之间切换", "postings": "salt: 1:1 4:1; water: 1:1 2:1 4:1; tropical: 1:2 2:2 3:1", "mode": "doc", "interactive": true}
```

> ⚠️ **易错点**：在按词项处理的最终状态中，第三个累加器是 **3:1**（文档 3 只含 *tropical*，出现一次），而不是 2:2。最终分数为 `1:4 2:3 3:1 4:2`。

### 3.2 伪代码

两个过程都接收查询 $Q$、索引 $I$、特征函数 $f$ 和 $g$，以及 $k$，并使用一个大小为 $k$ 的**优先队列** $R$ 保存前几名结果。更新式 $s_d \leftarrow s_d + g_i(Q) f_i(l_i)$ 是抽象的排序模型（查询特征乘以文档特征；见 [倒排索引与索引构建](topic-indexing.zh-CN.md)）。在例子中，$g_i(Q) = 1$，而 $f_i$ 是词出现次数。

按文档处理：

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

按词项处理则使用一张累加器哈希表 $A$：

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

下面是同样两个过程的 Python 版本（一个大小为 $k$ 的最小堆充当优先队列）：

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

每一对是 `(分数, 文档)`：两种顺序都给出排名 **1, 2, 4, 3**。

### 3.3 列表函数与权衡

postings 列表对象支持以下操作（正是它们使 §4 中的跳过成为可能）：

| 函数 | 作用 |
|---|---|
| `getCurrentDocument()` | 当前 posting 的文档编号 |
| `skipForwardToDocument(d)` | 向前移动，直到 `getCurrentDocument()` ≥ $d$；可能一直读到列表末尾 |
| `movePastDocument(d)` | 向前移动，直到 `getCurrentDocument()` > $d$ |
| `moveToNextDocument()` | 下一个文档；等于 `movePastDocument(getCurrentDocument())` |
| `getNextAccumulator(d)` | 第一个已经有累加器的文档编号 $d' \ge d$ |
| `removeAccumulatorsBetween(a, b)` | 删除满足 $a < d < b$ 的文档的累加器 |

> ⚠️ **易错点**：注意比较的方向：你是向前移动，直到当前文档 **≥ d**（`skipForwardToDocument`）或 **> d**（`movePastDocument`）；`moveToNextDocument` 只有按这种理解才等于 `movePastDocument(current)`。

**权衡**：按词项处理**累加器占用更多内存**（每个已见文档都保存一个部分分数），但**磁盘访问更高效**（每个列表只顺序读取一次）。按文档处理只保留 $k$ 个结果，但需要同时从所有列表读取。

> 📘 **延伸阅读**：[Croft §5.7.1 Document-at-a-time Evaluation（书中第 166 页）、§5.7.2 Term-at-a-time Evaluation（书中第 168 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 3.4 练习

#### 两种方式给 salt water tropical 打分

Postings（文档:次数）：salt `1:1 4:1` · water `1:1 2:1 4:1` · tropical `1:2 2:2 3:1`。分数 = 次数之和。分别用按文档处理与按词项处理算出最终分数，并求合取结果（只包含同时含有三个词项的文档）。

<details>
<summary>解答</summary>

**按文档处理**（逐列进行）：

| 文档 | salt | water | tropical | 分数 |
|---|---|---|---|---|
| 1 | 1 | 1 | 2 | **4** |
| 2 | — | 1 | 2 | **3** |
| 3 | — | — | 1 | **1** |
| 4 | 1 | 1 | — | **2** |

**按词项处理**（逐行进行，使用累加器）：

| 处理完 | 累加器 |
|---|---|
| salt | 1:1, 4:1 |
| water | 1:2, 2:1, 4:2 |
| tropical | 1:4, 2:3, 3:1, 4:2 |

最终分数相同；排名：**1, 2, 4, 3**。

**合取**：只有文档 1 包含全部三个词项 → **文档 1 = 4**。

</details>

## 4. 合取处理

**合取处理**：

- 是最简单的查询优化之一，也是许多引擎的**默认模式**；
- **每个返回的文档都必须包含所有查询词项**（这是带分数的 AND）；
- 当**某个查询词项很稀有**时效果最好：先选出包含稀有词项的文档，就能**跳过很大一部分**文档；
- 在**按词项处理**和**按文档处理**中都可以使用。

**合取的按词项处理**：**检查累加器，找到下一个包含所有先前已见词项的文档，并把 postings 列表跳到该文档。** 第一个列表（$i = 0$）照常建立累加器；对之后的列表，`getNextAccumulator(d)` 找到下一个候选文档 $d'$，`removeAccumulatorsBetween(d_0, d')` 丢弃本列表跳过的候选（它们缺少该词项），然后该列表要么为 $d$ 计分（若 $d = d'$），要么向前跳到 $d'$。

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

**合取的按文档处理**：**找到某个postings 列表所指向的最大文档；尝试把所有列表都跳到该文档；如果能做到，就计分，否则 break。**

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

对 *salt water tropical*，只有文档 1 含有全部三个词项，因此合取处理只返回文档 1 = 4，而从不为文档 2、3、4 计分：

```viz query-eval
{"title": "合取的 salt water tropical——用跳过代替计分", "postings": "salt: 1:1 4:1; water: 1:1 2:1 4:1; tropical: 1:2 2:2 3:1", "mode": "doc", "conjunctive": true}
```

同一思路的紧凑（基于集合）版本：从最稀有的列表开始求交集，然后只为留下的候选计分。

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

> 💡 **关键洞见**：合取处理再次体现了 [§2.3](#23-查询优化按频率递增的顺序处理) 的道理：最稀有的词项限定了工作量的上界。这里 *salt*（2 个文档）在 *water* 和 *tropical* 被完整读取之前，就已把候选限制为文档 1 和 4。

> 📘 **延伸阅读**：[Croft §5.7.3 Optimization Techniques（书中第 170 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 5. 阈值方法、MaxScore 与提前终止

**阈值方法**利用**需要的排名靠前的文档数（$k$）**来优化查询处理；对大多数应用而言，$k$ 很小。

- 对任何查询，一篇文档要被展示，必须达到一个**最低分数**：即得分排第 $k$ 高的文档的分数，它给出**阈值 $\tau$**。
- 遗憾的是，**直到查询结束我们才知道 $\tau$**；优化方法会**估计 $\tau'$**，并忽略那些不可能超过它的文档。
- **按文档处理**：用**目前排名最低的文档**（优先队列中的第 $k$ 个）的分数作为 $\tau'$。**按词项处理**：用**累加器表中第 $k$ 大的分数**。

**MaxScore** 把**剩余文档可能得到的最高分数**与 $\tau'$ 比较，忽略postings 列表中**不可能产生高于 $\tau'$ 的分数**的部分。这是一种**安全**的优化：排序结果与不做该优化时**完全相同**。

**MaxScore 示例**：查询 *eucalyptus tree*。*Tree* 很常见（列表很长）；*eucalyptus* 很稀有（只有几条 posting）。

- 建索引时会计算 $\mu_{tree}$，即**仅含 "tree" 的任何文档**能获得的最高分数。
- 假设 $k = 3$；$\tau'$ 是前三个文档之后的最低分数。
- **很可能 $\tau' > \mu_{tree}$**：$\tau'$ 是一个**同时含有两个查询词项**的文档的分数。
- 因此我们可以**安全地跳过所有灰色的 postings**：*tree* 的 postings 只需为前几个文档以及同时含 *eucalyptus* 的文档读取；其余每条 *tree* posting 都被跳过。只含 tree 的文档得分至多为 $\mu_{tree} < \tau'$，进不了前 3 名。

下面是一个小例子（计数为虚构：40 篇文档含 *tree*，词频为 1–3，其中 3 篇也含 *eucalyptus*）：

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

结果相同（这是**安全**的），但只为 9 篇文档打分，而不是 40 篇。

**其他方法**：

| 方法 | 做法 | 安全？ |
|---|---|---|
| **提前终止** | 有些查询比其他查询更昂贵：按词项处理时**忽略高频词的列表**；按文档处理时**忽略列表末尾的文档** | **不安全**：排序可能改变 |
| **列表排序** | 按某个**质量指标**（例如 PageRank）或**部分分数**排序postings 列表 | 使不安全（但快速）的优化**更有可能检索到好文档** |

列表排序在 §9–§10 中展开。

> ⚠️ **易错点**："安全"指前 $k$ 名的排序与完整求值完全一致（MaxScore）。提前终止是"不安全"的：更快，但可能丢掉一篇本应进入前 $k$ 名的文档。

> 📘 **延伸阅读**：[Croft §5.7.3 Optimization Techniques（书中第 170 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §5.3.6 Ordering（书中第 139 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 6. 高效余弦排序与用堆求前 K 个

### 6.1 不必计算全部 N 个余弦的排序

对于向量空间排序（见 [检索模型：布尔、tf-idf 与向量空间](topic-retrieval-models.zh-CN.md)），目标是找出集合中与查询"最接近"的 **K 篇文档**，即余弦值最大的 **K 个**查询-文档余弦。高效排序意味着两件事：高效地**计算单个余弦**，以及高效地**选出最大的 K 个**余弦值。**能否不计算全部 N 个余弦？**

- 我们实际上是在为查询向量解决 **K 近邻问题**。一般来说，我们**不知道如何在高维空间中高效地解决它**，
- **但**对网络搜索而言，我们并不必须解决它：**查询向量高度稀疏！** 对于短查询，这个问题是**可以解决的**，而且**标准索引能很好地支持它**（只需触及查询词项对应的少数几个 postings 列表）。

**特殊情形：无权重查询**：对查询词项不加权，并假设每个查询词项只出现一次。这时**排序时无需对查询向量归一化**：每篇文档的分数都除以同一个查询长度，这不会改变顺序。（因此 $w_{t,q} = 1$，余弦算法的分数更新只是把 $w_{t,d}$ 加起来。）

> 📘 **延伸阅读**：[IIR 第 7 章（efficient scoring and ranking）](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques（书中第 170 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 6.2 用堆选出前 K 个

**选择与排序**：在余弦排序中，我们通常只需要**前 K 个**文档，而**不需要集合中每篇文档的全序**。能否挑出余弦值最高的 K 篇文档？设 **J = 余弦非零的文档数**；我们要从这 J 篇中选出最好的 K 篇。

**使用堆**：

- 一棵**二叉树，其中每个节点的值都大于其子节点的值**（即最大堆）。
- **建堆需要 2J 次操作**，然后每个 K 个"胜出者"可以在 2 log J 步内取出。
- **对于 J = 100 万、K = 100，这大约是排序成本的 10%！**

按以 2 为底的对数计，排序需要 $J \log_2 J$ 次比较：堆的代价 $= 2J + 2K\log_2 J \approx 2.00$ 百万，排序 $\approx 19.9$ 百万，比值为 **0.10**，即所说的 10%。（在 Python 中，`heapq.nlargest(K, …)` 正好完成这项工作。）

> ⚠️ **易错点**：节省来自 K ≪ J：建堆是线性的，只需为 K 次付出 $\log J$ 的代价。排序则要为 J 篇文档中的**每一篇**付出 $\log J$。

### 6.3 练习

#### 一百万文档：堆与排序

建堆需要 $2J$ 次操作，每个胜出者需要 $2\log_2 J$ 步；对全部 $J$ 篇文档排序大约需要 $J\log_2 J$ 次比较（以 2 为底的对数，以及 $J\log_2 J$ 的排序代价都是假设）。从 $J = 1{,}000{,}000$ 中选出前 $K = 100$ 个，与对全部 $J$ 篇排序相比如何？

<details>
<summary>解答</summary>

- 堆：$2J + K \cdot 2\log_2 J = 2{,}000{,}000 + 100 \times 2 \times 19.93 \approx 2{,}003{,}986$ 次操作。
- 排序：$J \log_2 J \approx 19{,}931{,}569$ 次比较。
- 比值 ≈ **0.10**："大约是排序成本的 10%"。

线性的建堆部分占主导；那 100 次取出几乎不计。用 Python 验证（包括 `heapq.nlargest` 返回的 100 个值与完整排序的结果相同）：

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

## 7. 近似的前 K 个与索引剪枝

### 7.1 余弦只是代理

**瓶颈**：打分中**主要的计算瓶颈**是余弦计算。能否避免所有这些计算？**可以，但有时可能会算错**：一篇**不在**前 K 个之中的文档，可能会**混进**输出的 K 篇文档。**这真的糟糕吗？**

**余弦相似度只是一个代理！**

- **用户有一个任务**，以及一种**查询的表达方式**。
- **余弦匹配的是文档与查询**，而不是文档与任务。
- 因此，余弦无论如何都只是**用户满意度的代理**。
- 如果我们得到的 K 篇文档按余弦"接近"前 K 名，**应该可以接受**。

**通用方法**：

- 找出一个**候选集合 A**，满足 $K < |A| \ll N$。
  - $A$ **不一定包含前 K 名**，
  - 但包含**许多来自前 K 名的文档**。
  - 从 $A$ 中返回前 K 篇文档。
- 可以把 $A$ 看作**剪除非候选者**。
- 对**其他（非余弦）打分函数**也使用同样的方法。

遵循这一思路的方案包括：**索引剪枝**（§7.2）、冠军列表（§8）、静态质量与高低列表（§9）、影响排序（§10），以及分层索引（§11）。

> ⚠️ **易错点**：这些方法是**近似的**（即 §5 意义上的"不安全"）：返回的 $K$ 篇文档未必是按余弦排出的真正前 $K$ 名。

> 📘 **延伸阅读**：[IIR 第 7 章（Computing scores in a complete search system）](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques（书中第 170 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 7.2 索引剪枝

基本的余弦算法**已经只考虑至少包含一个查询词项的文档**。把这个启发式再推进一步：

1. **只考虑高 idf 的查询词项。**
2. **只考虑包含许多查询词项的文档。**

**只用高 idf 的查询词项**：对于 *catcher in the rye* 这样的查询，**只累加 *catcher* 和 *rye* 的分数**。直觉是：*in* 和 *the* 对分数贡献很小，因此**不会大幅改变排序**。好处是：**低 idf 词项的 postings 包含许多文档**，这些（非常多的！）文档因此被**从候选集合 A 中剔除**。

**包含许多查询词项的文档**：

- 任何至少含一个查询词项的文档，都是前 K 个输出列表的候选。
- 对于多词项查询，只为包含**若干个查询词项**（也许是全部词项！）的文档计算分数，比如**至少包含 4 个查询词项中的 3 个**。
- 这相当于对查询施加了一个**"软合取"**，早期的 Google 等网络搜索引擎上可以见到这种做法。
- 如果限制过严，候选文档可能**少于 K 个**。可以在此之上再加一个启发式：**可以迭代！**（放宽到更少的词项。）
- **在 postings 遍历中很容易实现。**

**例子：4 个查询词项中的 3 个**

| 词项 | Postings |
|---|---|
| Antony | 3 4 **8** **16** **32** 64 128 |
| Brutus | 2 4 **8** **16** **32** 64 128 |
| Caesar | 1 2 3 5 **8** 13 21 34 |
| Calpurnia | 13 **16** **32** |

**只会为文档 8、16 和 32 计分**（即加粗的 postings）。如果只需要向用户展示 **2 个文档**，这就够了；如果需要更多，就**迭代**，并同时为只含 **2 个**查询词项的文档计分。

> ⚠️ **易错点**："至少 3 个（共 4 个）"并不是 AND：文档 8 缺少 Calpurnia，文档 16 缺少 Caesar，但两者都会被计分。这是对文档出现在多少个列表中的一个阈值，按文档遍历可以零成本地统计它。

> 📘 **延伸阅读**：[IIR 第 7 章（索引剪枝、近似的前 K 个）](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf) · [Croft §5.7.3 Optimization Techniques（书中第 170 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 7.3 练习

#### 「4 个查询词项中至少 3 个」会给哪些文档打分？

Antony `3 4 8 16 32 64 128` · Brutus `2 4 8 16 32 64 128` · Caesar `1 2 3 5 8 13 21 34` · Calpurnia `13 16 32`。按照"4 个查询词项中至少 3 个"的规则，哪些文档会被计分？如果用户需要更多结果，又该怎么办？

<details>
<summary>解答</summary>

统计每篇文档出现在多少个列表中：

| 文档 | 出现的列表数 |
|---|---|
| **8**（Antony、Brutus、Caesar），**16**（Antony、Brutus、Calpurnia），**32**（Antony、Brutus、Calpurnia） | **3** |
| 2、3、4、13、64、128 | 2 |
| 1、5、21、34 | 1 |

只有**文档 8、16 和 32** 会被计分。这足以展示 2 条结果。如果需要更多，就迭代：把阈值降到 2 个词项，这会把文档 2、3、4、13、64 和 128 加入候选。

用 Python 快速检查：

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

（"至少 2 个"的集合包含已经计过分的三篇文档，再加上六篇新文档。）

</details>

## 8. 冠军列表

- **预先计算**：对每个词典词项 $t$，保存 $t$ 的 postings 中**权重最高**的 $r$ 篇文档。称之为 $t$ 的**冠军列表**（又称 **fancy list**，或 $t$ 的 **top docs**）。
- $r$ 必须在**建索引时**选定。因此可能出现 $r < K$ 的情况：查询要求的结果数超过了任何单个冠军列表所能容纳的数量。
- 查询时，**只对某个查询词项的冠军列表中的文档计算完整分数**，然后从中挑出得分最高的 $K$ 篇文档。

用 $r = 2$ 作说明（权重为虚构；文档的分数是其在查询词 *car insurance* 上的权重之和）：

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

文档 4 对两个词项都不是冠军，但它却在精确的前 3 名之中：冠军列表是**近似的**。

> ⚠️ **易错点**：$r$ 在建索引时固定，$K$ 则随查询而来。若 $r < K$（且冠军列表几乎不重叠），仅靠冠军列表甚至凑不满一页 $K$ 条结果。

## 9. 静态质量 g(d)、净得分与高低列表

### 9.1 静态质量分数

我们希望排名靠前的文档既**相关**又**权威**。

- **相关性**由**余弦分数**来建模。
- **权威性**通常是文档的一种**与查询无关**的属性。

权威性信号的例子（最后三项是**可量化**的）：

| 信号 | 可量化？ |
|---|---|
| 网站之中的 Wikipedia | |
| 某些报纸上的文章 | |
| 被大量引用的论文 | ✓ |
| 大量 bitly、digg 或 del.icio.us 标记 | ✓ |
| PageRank、HITS（见 [链接分析：HITS 与 PageRank](topic-link-analysis.zh-CN.md)） | ✓ |

**为权威性建模**：为每篇文档 $d$ 分配一个取值在 $[0, 1]$ 之间的**与查询无关的质量分数**，记为 $g(d)$。因此，引用次数这样的量需要被**缩放到 $[0, 1]$**（一个公式见 §9.5 的练习）。

### 9.2 净得分

一个综合了相关性与权威性的简单总分：

$$\text{net-score}(q, d) = g(d) + \text{cosine}(q, d)$$

$g(d)$ 是 $d$ 的静态质量；$\text{cosine}(q, d)$ 是它与查询的相关度（见 [检索模型：布尔、tf-idf 与向量空间](topic-retrieval-models.zh-CN.md)）。也可以使用其他线性组合 $g(d) + \alpha \cdot \text{cosine}(q, d)$（$\alpha$ 决定相关性相对于权威性的权重）；事实上，**用户满意度的两个"信号"的任意函数**都可以。现在我们要找的是**按净得分排出的前 $K$ 篇文档**。

### 9.3 按 g(d) 排序所有 postings

- **第一个想法：按 $g(d)$ 排序所有 postings。**
- **关键**：这是**所有 postings 共用的一种顺序**：每个列表都以同样的方式排序（按 $g$，就像之前按 docID 排序一样）。
- 因此我们可以**同时遍历**各查询词项的 postings，进行**postings 求交**与**余弦分数计算**，就像 §2.1 中按 docID 排序的合并一样。

**为什么按 $g(d)$ 排序 postings？** 在 $g(d)$ 排序下，**得分最高的文档很可能出现在 postings 遍历的前面**（记住：$g(d) + \alpha \cdot \text{cosine}(q, d)$）。在**有时限的应用**中（比如我们必须在约 **50 毫秒**内返回能得到的任何搜索结果），这使我们能够**提前停止 postings 遍历**，无需为 postings 中的所有文档计算完整分数。

**$g(d)$ 排序下的冠军列表**：为每个词项维护一个冠军列表，保存 **$g(d) + \text{tf-idf}_{t,d}$ 最高**的 $r$ 篇文档，并且只从这些冠军列表中的文档里寻找前 $K$ 个结果。

> 💡 **关键洞见**：这是 §5 中"按质量指标（例如 PageRank）排序列表"的具体展开。

### 9.4 高列表与低列表

- 对每个词项，维护两个**互不相交**的集合：**高列表**和**低列表**。可以把**高列表**看作冠军列表。
- 在处理某个查询的 postings 时，**先遍历高列表**。如果得到**超过 $K$ 篇**文档，就选出前 $K$ 篇并**停止**；否则继续从**低列表**中取文档。
- 即使是**不使用全局质量 $g(d)$、只用简单余弦分数**，也可以使用。
- 这是把索引**切分为两层**的一种手段：§11 中将其推广。

### 9.5 练习

#### 把引用次数缩放到 [0, 1]

四篇论文分别有 0、5、50 和 500 次引用。提出一个公式，把引用次数 $c$ 转换为质量分数 $g \in [0, 1]$，并将其应用。然后，对两篇文档 A（余弦 0.6，$g = 0.2$）和 B（余弦 0.5，$g = 0.5$），计算 $\alpha = 1$ 与 $\alpha = 4$ 时的 $g + \alpha\cdot\text{cosine}$，并说明哪一篇胜出。

<details>
<summary>解答</summary>

有好几种公式可行；每种都必须把 0 映射为 0，并使分数保持在 $[0,1]$ 之内：

| 公式 | 0 | 5 | 50 | 500 |
|---|---|---|---|---|
| 最小-最大：$c / c_{\max}$ | 0 | 0.01 | 0.1 | 1 |
| 饱和型：$c/(c + 50)$ | 0 | 0.091 | 0.5 | 0.909 |
| 对数：$\ln(1+c)/\ln(1+c_{\max})$ | 0 | 0.288 | 0.632 | 1 |

最小-最大法会让一篇被引用极多的论文把其他所有论文压平；饱和型与对数型则拉开了少量和中等引用次数之间的差距（这是一种设计选择：任何单调、有界的缩放都可以接受）。

净得分（$\alpha = 1$）：A $= 0.2 + 0.6 = 0.8$，B $= 0.5 + 0.5 = 1.0$ → **B 胜出**。当 $\alpha = 4$ 时：A $= 0.2 + 4(0.6) = 2.6$，B $= 0.5 + 4(0.5) = 2.5$ → **A 胜出**。$\alpha$ 越大，相关性相对于权威性的权重越高，排序就会翻转。

</details>

## 10. 按影响排序的 postings

我们只想为那些 $\mathrm{wf}_{t,d}$（词项 $t$ 在文档 $d$ 中的权重，例如 tf-idf）**足够高**的文档计算分数。因此要**按 $\mathrm{wf}_{t,d}$ 对每个 postings 列表排序**。

**现在：并非所有 postings 都处于同一顺序！** 每个列表有自己的顺序，因此 §9.3 中的并发合并不再适用。我们如何按顺序计算分数以选出前 $K$ 名？有两种想法：

**想法 1：提前终止**

- 遍历 $t$ 的 postings 时，在**固定的 $r$ 篇文档**之后，或当 $\mathrm{wf}_{t,d}$ 降到某个阈值以下时，**提前停止**。
- 取各查询词项 postings 所得文档集合的**并集**：每个词项贡献一个集合。
- **只为这个并集中的文档计算分数。**

**想法 2：按 idf 排序词项**

- 考虑查询词项的 postings 时，**按 idf 从大到小**依次查看：高 idf 词项最可能对分数贡献最大。
- 每当更新一个查询词项的分数贡献后，如果文档分数**相对没有变化**，就**停止**。
- 可以应用于余弦或其他净得分。

> ⚠️ **易错点**：不要混淆两种顺序。**$g(d)$ 排序**是所有列表共用的一种顺序（利于合并）；**影响排序**让每个列表按各自的 $\mathrm{wf}_{t,d}$ 排序（利于提前截断每个列表，但不存在共同的顺序）。

> 📘 **延伸阅读**：[Croft §5.7.3 Optimization Techniques（书中第 170 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 11. 分层索引

- **把 postings 拆分为一组列表层级**：从最重要到最不重要。
- 可以按 **$g(d)$** 或其他度量（**区域权重、tf-idf** 等）来划分。
- 这样，倒排索引就被拆分为**重要性递减的若干层**。
- 查询时**优先使用最顶层，除非它无法给出 $K$ 篇文档**；若是这样，就**降到更低的层**。

**分层索引示例**：四个词项，三篇文档：

| 词项 | 第 1 层 | 第 2 层 | 第 3 层 |
|---|---|---|---|
| auto | Doc2 | — | Doc1 |
| best | — | Doc1, Doc3 | — |
| car | Doc1, Doc3 | — | Doc2 |
| insurance | Doc2, Doc3 | — | — |

高列表与低列表（§9.4）就是两层的情形。

> 📘 **延伸阅读**：[IIR 第 7 章（Computing scores in a complete search system）](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

## 12. 分布式查询求值与查询缓存

### 12.1 分布式查询求值

把查询分布出去**能显著加快查询处理**。

**基本流程**：所有查询都发给一台**调度机**（director）；调度机把消息发给许多**索引服务器**；每台索引服务器完成查询处理的**一部分**；调度机**整理结果**并返回给用户。拆分工作主要有两种方式：

| | 文档分布 | 词项分布 |
|---|---|---|
| 索引 | 每台索引服务器是集合中**一小部分文档的搜索引擎** | 整个集群**只有一个索引**；**每个postings 列表**分配给一台索引服务器 |
| 查询 | 调度机把**查询的副本发给每台**索引服务器；每台返回自己的 **top-k** | 多数情况下，一个查询所需的数据**不在同一台机器上**；由一台服务器（通常是持有**最长postings 列表**的那台）处理查询，其他服务器把**自己的信息发给它** |
| 结果 | 调度机把它们**合并**成一个排序列表 | 最终结果发回调度机 |
| 注意 | 为了排序有效，**集合统计量应该共享** | 列表数据要在服务器之间传输 |

> ⚠️ **易错点**：在文档分布下，每台服务器只看得到自己的文档。如果每台都用自己那部分来计算 df，同一篇文档在不同服务器上会得到不同的分数，这就是集合统计量必须共享的原因。

> 📘 **延伸阅读**：[Croft §5.7.5 Distributed Evaluation（书中第 180 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 12.2 查询缓存

- 查询的分布**类似 Zipf**：**每天大约一半的查询是唯一的**，但有些查询**非常热门**。查询日志的 Zipf 图与词的 Zipf 图相似：双对数坐标下中段为直线，最高与最低频率处偏离（hapax legomena = 只出现一次的词）；关于 Zipf 定律见 [文本处理](topic-text-processing.zh-CN.md)。
- 缓存可以显著提升效率：
  - 缓存（可能**放在内存中**）**热门查询的结果**；
  - 在**内存中**缓存常用的**postings 列表**。
- **即使对于唯一的查询，postings 列表缓存也有帮助**：从未见过的查询仍然由常见词组成。
- 缓存**必须刷新**，以防数据过时。

> 📘 **延伸阅读**：[Croft §5.7.6 Caching（书中第 181 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 13. 方法比较

| 方法 | 工作方式 | 安全？ | 列表有共同顺序？ | 建索引时需要 |
|---|---|---|---|---|
| 跳表指针（§2.2） | 合并时读取更少的 postings | 是 | docID | 跳表指针 |
| 最稀有优先的 AND（§2.3） | 中间结果最小 | 是 | docID | 词典中的 df |
| 按文档处理 / 按词项处理（§3） | 每篇文档的完整分数，对比累加器 | 是 | docID | 无 |
| 合取处理（§4） | 只为包含所有词项的文档打分 | 是（就 AND 语义而言） | docID | 无 |
| MaxScore（§5） | 跳过不可能超过 $\tau'$ 的 postings | 是 | docID | 每个词项的最高分 $\mu$ |
| 用堆求前 $K$ 个（§6.2） | 读取前 $K$ 个胜出者，而不是对 $J$ 个排序 | 是 | 不适用 | 无 |
| 索引剪枝（§7.2） | 丢弃低 idf 词项 / 含查询词项较少的文档 | 否 | docID | 无 |
| 冠军列表（§8） | 每个词项只为前 $r$ 篇文档打分 | 否 | 按权重 | $r$、冠军列表 |
| $g(d)$ 排序、高/低列表（§9） | 质量最高的文档优先；提前停止 | 否 | **$g(d)$（共用）** | $g(d)$、两个列表 |
| 按影响排序（§10） | 每个列表按 $\mathrm{wf}_{t,d}$ 排序；提前停止 | 否 | **每个列表各自** | $\mathrm{wf}_{t,d}$ 顺序 |
| 分层索引（§11） | 先用顶层，只有需要时才用低层 | 否 | 每层各自 | 分层分配 |
| 分布与缓存（§12） | 更多机器；记住结果 | 是 | 不适用 | 共享统计量、缓存 |

## 14. 速查与五条要点

| 术语 | 含义 |
|---|---|
| INTERSECT | 两个按 docID 排序的 postings 列表的合并，代价为 $O(x+y)$ |
| 跳表指针 | 在长列表中越过一段 postings |
| 按文档处理 | 先算完一篇文档在所有列表上的完整分数，再处理下一篇；只保留 $k$ 个结果 |
| 按词项处理 | 一次处理一个列表，部分分数保存在累加器中；磁盘访问顺序进行，内存占用更多 |
| 合取处理 | 只为包含所有查询词项的文档打分 |
| $\tau$，$\tau'$ | 第 $k$ 高的分数；它的运行估计值 |
| MaxScore | 跳过最高可能分数无法超过 $\tau'$ 的 postings（安全） |
| 提前终止 | 提前停止读取列表（不安全） |
| 候选集合 $A$ | $K < \lvert A\rvert \ll N$，包含许多前 $K$ 名 |
| 索引剪枝 | 只用高 idf 词项；只用含多个查询词项的文档 |
| 冠军列表 | 某词项权重最高的 $r$ 篇文档，建索引时固定 |
| $g(d)$ | 与查询无关、取值在 $[0,1]$ 的质量分数；净得分 $= g(d) + \alpha\cdot\text{cosine}$ |
| 高/低列表、分层 | 切分后的 postings，先用顶层 |
| 按影响排序 | 每个列表按 $\mathrm{wf}_{t,d}$ 排序 |
| 文档分布 / 词项分布 | 切分文档集合 / 在索引服务器之间切分列表 |

**五条要点**

1. AND 查询是按 docID 排序的列表的**合并，代价为 $O(x+y)$**；从**最稀有的词项**（df 最小，可从词典得知）开始，并在长列表上加入跳表指针。
2. **按文档处理**只保留 $k$ 个结果，但同时读取所有列表；**按词项处理**每个列表只读一次，但需要累加器。**合取处理**与 **MaxScore**（阈值 $\tau'$ 与最高可能分数比较）在保持精确前 $K$ 名（安全）的同时减少工作量。
3. 对于 $J$ 篇已打分文档中选出前 $K$ 名，使用**堆**：$2J + 2K\log J$，而不是 $J\log J$（对于 $J = 1$ 百万、$K = 100$，约为 10%）。
4. **近似的前 $K$ 名**在候选集合 $A$（$K < |A| \ll N$）上工作，因为余弦只是代理：索引剪枝（高 idf 词项、"4 个中的 3 个"词项）、冠军列表、$g(d)$ 排序与净得分 $g(d) + \alpha\cdot\text{cosine}$、高/低列表、按影响排序，以及分层（先用顶层，只有不足 $K$ 个时才降层）。
5. 通过**文档分布**或**词项分布**横向扩展（共享集合统计量！），并**缓存**热门结果和常用postings 列表；缓存必须刷新。
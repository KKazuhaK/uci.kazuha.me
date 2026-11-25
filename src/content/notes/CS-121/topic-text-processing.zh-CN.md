---
title: "文本处理"
summary: "语料与文本处理流程；分词（词法分析器、早期的 3 个以上字母数字规则、连字符、撇号、数字、句点、TREC 规则）；文本统计与 Zipf 定律（AP89、hapax legomena）；停用词与停用词去除；词干提取（suffix-s、Porter、Porter2、词典词干提取器、Krovetz，以及假阳性与假阴性）；短语（词性标注、词 n-gram、Google n-gram）；文档结构与标记；以及锚文本。"
topics:
  - text-processing
kind: "topic"
order: 504
---

# CS 121: Information Retrieval — 话题：文本处理

## 目录

- [1. 从文档到索引词项](#1-从文档到索引词项)
- [2. 分词](#2-分词)
- [3. 文本统计与 Zipf 定律](#3-文本统计与-zipf-定律)
- [4. 停用词去除与停用词](#4-停用词去除与停用词)
- [5. 词干提取：suffix-s、Porter、Krovetz](#5-词干提取suffix-sporterkrovetz)
- [6. 短语：词性标注与词 n-gram](#6-短语词性标注与词-n-gram)
- [7. 文档结构与标记](#7-文档结构与标记)
- [8. 链接与锚文本](#8-链接与锚文本)
- [9. 速查与五条要点](#9-速查与五条要点)

> 本章讲的是搜索引擎的**文本转换**（Text Transformation）阶段：文档的文本在文档库与索引之间会经历什么。它以[搜索引擎与 Web](topic-search-engines.zh-CN.md)的架构和[文档转换、存储与去重](topic-documents.zh-CN.md)中存储的文档为前提；它的输出（索引词项、短语、额外的文本字段）正是[倒排索引与索引构建](topic-indexing.zh-CN.md)所存储的内容，也是[检索模型：布尔、tf-idf 与向量空间](topic-retrieval-models.zh-CN.md)排序时所用的内容。

## 1. 从文档到索引词项

**语料**（corpus）是可供搜索的全部文档的集合。在网页搜索中，它就是搜索引擎会考虑的全部页面，也就是文本获取（text acquisition）放入本地文档库的内容。

**文本处理**（text processing）是为搜索引擎使用语料中的文档做准备的阶段。它**发生在建立索引之前**，目的是提高效率和性能，通常包含**两个主要步骤**：

1. **分词**（tokenization，即词法分析 lexical analysis）：把文本切分为词元（token）。
2. **语言学预处理**（linguistic pre-processing）：对词元应用规则，以提高索引的效率：停用词去除与词干提取（§4–§5），再加上短语识别（§6）。

为什么不直接索引原始字符串？

- 对网页搜索而言，**逐字匹配用户输入的字符串**限制太多，效果不好（例如，区分大小写的搜索未必是你想要的）。
- **并非所有词的价值都相同**。
- 有时**词的起止位置并不清楚**：在中文、韩文这类语言中，甚至连"词"是什么都说不清。

处理文本，是把文档转换为**索引词项**（index term）的关键步骤。本章沿着这条流程展开：分词（§2）、为后续选择提供依据的统计（§3）、停用词去除（§4）、词干提取（§5）、短语（§6），以及帮助引擎判断页面哪些部分更重要的结构与链接（§7–§8）。

> 📘 **延伸阅读**：[Croft §3.1 Deciding What to Search（书中第 31 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §4.1 From Words to Terms（书中第 73 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 2. 分词

### 2.1 分词器的作用

**分词**（tokenizing），又叫**词法分析**（lexical analysis），是从字符（通常是字符序列）中组成有意义的单元：它把**输入切分为具有简单含义的单元**。词元可以是一个词，也可以不是，这取决于你选择如何创建词元。在英语中，分词已经出乎意料地复杂；在其他语言中可能更难。

分词器（tokenizer，也称**词法分析器**（lexer）或**扫描器**（scanner））把**字符流转换为词元流**。同一种机制会出现在两个地方：

| 位置 | 分词器的输出交给谁 |
|---|---|
| 编译器前端 | 语法分析器（parser） |
| 信息检索的预处理器 | 检索系统 |

把大写转换为小写，有几种说法：**大小写折叠**（case folding）、**规范化**（normalization）或**转小写**（downcasing）。

### 2.2 什么是词元？取决于约定

"按空白切分，再丢掉标点"是显而易见的规则，但有些情况迫使我们做出选择：

| 问题 | 例子 |
|---|---|
| 撇号 | O'Neill、Aren't |
| 连字符 | clear-headed 与 clearheaded；mother-in-law |
| 多个词，算作一个词元？ | San Francisco；white space；New York University 与 York University |
| 不是词的词元 | `info@uci.edu`、`http://www.ics.uci.edu/`、`192.168.0.1` |

没有普遍正确的答案：每种选择都决定了哪些查询能够匹配。例如，把 New York University 切成三个词元，就意味着 "York University" 也能匹配它。

### 2.3 早期的分词方法

早期的 IR 系统使用一条非常简单的规则：

- 词元是**连续 3 个或以上的字母数字字符**。
- **空格或特殊字符**结束一个词元。
- 所有字符转换为**小写**。

对一个示例句子，结果如下：

```text
"Bigcorp's 2007 bi-annual report showed profits rose 10%."
        ↓
"bigcorp 2007 annual report showed profits rose"
```

`s`、`bi` 和 `10` 都短于 3 个字符，被丢弃。结论是：这种方法**过于笼统、过于简单，丢失了大量信息**——对搜索来说它太简陋，即便用于大规模实验也是如此。分词中的小决定，可能对某些查询的效果产生**重大影响**。

逐个字符地走一遍这条规则，或输入你自己的文本：

```viz tokenize
{"title": "早期分词方法", "text": "Bigcorp's 2007 bi-annual report showed profits rose 10%.", "interactive": true}
```

> ⚠️ **易错点**：这是*历史上的*规则，用来展示朴素分词器会丢掉什么。真实系统会对 §2.4 中的各种情况作出明确的决定；而你为某项特定任务所得到的规则，会覆盖本演示中的选择。

> 📝 **练习**：[§2.6](#26-练习)

### 2.4 需要考虑的难点

| 问题 | 为什么重要 | 例子 |
|---|---|---|
| **小词** | 在某些查询中可能很重要，通常是在组合中 | xp、am、pm、el paso、world war II、"to be or not to be" |
| **连字符：可合并** | 有时连字符并不必要；两种写法都常见，因此可以合并 | e-bay、wal-mart、active-x、cd-rom、t-shirts |
| **连字符：难以判断** | 连字符可能是词的一部分，也可能是分隔符，更难决定 | winston-salem、mazda rx-7、e-cards、pre-diabetes、t-mobile、spanish-speaking |
| **特殊字符** | 在标签、URL、代码等文档部分中很重要 | — |
| **大写词** | 含义可能与小写形式相同，也可能不同 | "Bush"、"Apple" 与 "bush"、"apple" |
| **撇号** | 可能是词的一部分、所有格的一部分，或只是一个错误 | rosie o'donnell、can't、don't、80's、1890's、men's straw hats、master's degree、england's ten largest cities、shriner's |
| **数字** | 可能很重要，小数也包括在内 | nokia 3250、top 10 courses、united 93、quicktime 6.5 pro、92.3 the beat、288358、3.14159265 |
| **句点** | 出现在数字、缩写、URL、句末等位置 | I.B.M.、Ph.D.、cs.umass.edu、F.E.A.R. |

> ⚠️ **易错点**：在搜索引擎中，**查询的分词步骤必须与文档的分词步骤完全相同**。如果文档索引的是 `ibm`，而查询被切分为 `i`、`b`、`m`，那么什么也匹配不上。

> 📘 **延伸阅读**：[Croft §4.3.2 Tokenizing（书中第 87 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 2.5 分词过程

分词是一个**多步骤的过程**。第一步使用**分词器 + 解析器**找出文档中哪些部分需要为搜索而分词（§7 中的标记正是解析器发挥作用的地方）。

最一般的策略是**把复杂的决定交给其他组件**：

- 词是由字母数字字符组成的任意序列，以空格或特殊字符结束，并全部转换为小写。
- **所有内容都被索引**，系统同时记录额外的信息。例如：`92.3` → `92` `3`，但搜索仍能找到 `92` 与 `3` **相邻**出现的文档。
- 加入一些特殊规则，以减少对查询变换组件的依赖。

这与过去使用的简单分词方法差别不大。早期 **TREC** 语料所使用的规则：

| 规则 | 例子 |
|---|---|
| 忽略词中的撇号 | o'connor → `oconnor`，bob's → `bobs` |
| 忽略缩写中的句点 | I.B.M. → `ibm`，Ph.D. → `phd` |

困难的情况仍交给**后处理**：信息抽取与查询变换。

> 💡 **关键洞见**：分词器有意保持简单，同时保留足够的信息（例如词的位置），让后续阶段能够找回它丢弃的内容。

### 2.6 练习

#### Bigcorp 句子的早期分词

将早期方法（词元 = 连续 3 个或以上的字母数字字符；任何空格或特殊字符都会结束一个词元；全部转为小写）应用于：

`Bigcorp's 2007 bi-annual report showed profits rose 10%.`

<details>
<summary>解答</summary>

在每个非字母数字字符（`'`、空格、`-`、`%`、`.`）处切分，并转为小写：`bigcorp`、`s`、`2007`、`bi`、`annual`、`report`、`showed`、`profits`、`rose`、`10`。丢弃长度小于 3 的片段——`s`、`bi`、`10`。结果为 `bigcorp 2007 annual report showed profits rose`，共 7 个词元。丢失的是改变了 "annual" 含义的 "bi"，以及作为新闻要点的 10%——即"过于笼统"。

</details>

#### 棘手的词元会怎样？

对以下每个输入，分别运行 (a) "按空白切分，再丢掉标点" 和 (b) 早期方法（连续 3 个以上字母数字，转为小写）：O'Neill、Aren't、clear-headed、clearheaded、mother-in-law、San Francisco、New York University、`info@uci.edu`、`http://www.ics.uci.edu/`、`192.168.0.1`。哪些会出错？会怎样出错？

<details>
<summary>解答</summary>

| 输入 | (a) 按空白切分 + 丢弃标点 | (b) 早期方法（3 个以上字母数字） |
|---|---|---|
| O'Neill | `oneill` | `neill`（丢掉了 `o`） |
| Aren't | `arent` | `aren`（丢掉了 `t`） |
| clear-headed | `clearheaded` | `clear`、`headed` |
| clearheaded | `clearheaded` | `clearheaded` |
| mother-in-law | `motherinlaw` | `mother`、`law`（丢掉了 `in`） |
| San Francisco | `san`、`francisco` | `san`、`francisco` |
| New York University | `new`、`york`、`university` | `new`、`york`、`university` |
| `info@uci.edu` | `infouciedu` | `info`、`uci`、`edu` |
| `http://www.ics.uci.edu/` | `httpwwwicsuciedu` | `http`、`www`、`ics`、`uci`、`edu` |
| `192.168.0.1` | `19216801` | `192`、`168`（丢掉了 `0`、`1`） |

规则 (a) 让 clear-headed 能匹配 clearheaded，却把电子邮件、URL 和 IP 粘成毫无意义的字符串；规则 (b) 把它们切碎，并丢失了短片段。**两者都**没能把 O'Neill、"San Francisco" 或 "New York University" 保留为一个整体。每一种修补方案都是设计决定，正如那句"什么是词元？取决于……"。请核对第 (b) 列：

```viz tokenize
{"title": "早期方法下的棘手词元", "text": "O'Neill aren't clear-headed mother-in-law"}
```

</details>

## 3. 文本统计与 Zipf 定律

### 3.1 为什么要看统计量

文本使用的词种类繁多，但词出现的许多统计特征是**可以预测的**，例如词频的分布。**检索模型与排序算法高度依赖这些特征**（[检索模型：布尔、tf-idf 与向量空间](topic-retrieval-models.zh-CN.md)）：对检索重要的词，通常是**在某个文档中频繁出现，但在整个语料中并不常见**的词。

### 3.2 Zipf 定律

词频分布**高度偏斜**：少数词出现得非常频繁，许多词几乎从不出现。最常见的两个词（"the"、"of"）约占所有词出现次数的 **10%**。Zipf 的"定律"指出：**第 $r$ 个最常见词的频率与 $r$ 成反比**，即秩与频率的乘积大致为常数：

$$r \cdot f \approx k \qquad\text{or}\qquad r \cdot P_r \approx c, \quad c \approx 0.1 \text{ for English}$$

这里 $r$ 是秩（按频率降序排列的词序号），$f$ 是该词的频率，$P_r$ 是它的出现概率（频率 / 词出现总数），$k$、$c$ 为常数。对英语绘制 $P_r$（0 到 0.1）与秩（0 到 100）的曲线，会得到一条从 0.1 附近开始、在前约 10 个秩内急剧下降、随后趋于接近 0 的平缓曲线：其形状就是 $0.1/r$。

### 3.3 AP89 上的 Zipf 定律

**AP89**（美联社 1989 年新闻）的统计数据：

| 统计项 | 数值 |
|---|---|
| 文档总数 | 84,678 |
| 词出现总次数 | 39,749,179 |
| 词表大小（不同的词） | 198,763 |
| 出现次数超过 1000 的词 | 4,169 |
| 只出现一次的词 | 70,064 |

AP89 最常见的 50 个词，其 $P_r$（%）与 $r \cdot P_r$ 由频次和 39,749,179 次出现的总数计算得出（生成这些数字的脚本位于表格下方）：

| 词 | 频次 | r | $P_r$（%） | $r \cdot P_r$ | 词 | 频次 | r | $P_r$（%） | $r \cdot P_r$ |
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

在这 50 个词中，前 10 名的 $r \cdot P_r$ 在 0.053 到 0.128 之间（最大的波动出现在最顶端："of" 为 0.053，"in" 为 0.128），第 11 到第 50 名则稳定在 0.076 到 0.090 之间，接近 Zipf 的 $c \approx 0.1$。

在**对数-对数图**上，概率（$10^{-8}$ 到 1）对秩（1 到 $10^6$）的关系中，Zipf 直线 $P_r = 0.1/r$ 是斜率为 −1 的直线。AP89 的数据点在中间秩段紧贴该直线，在最前面几个秩处**低于**直线，对超过约 10,000 的秩则**向下偏离**，最后形成罕见词的阶梯状平台。**注意高频和低频处的问题。**只出现一次的词称为 **hapax legomena**（希腊语 ἅπαξ λεγόμενον，意为"只说过一次"）：AP89 的 198,763 个词中有 70,064 个，约占 35%。

> ⚠️ **易错点**：一个已发表版本的表格，其 $P_r$ 值比上面给出的高约 6%（"the" = 6.49%，而不是 6.09%；这会使第 11 到 50 名的 $r \cdot P_r$ 落在 0.081 到 0.096 之间）。那些数字与约 3730 万次的总数一致（2,420,778 / 0.0649），而不是统计表中给出的 39,749,179。应当始终根据频次和所给总数重新计算；Zipf 的结论（中间段 $r \cdot P_r$ 大致恒定，两端弯曲）并不会因此改变。

> 📘 **延伸阅读**：[Croft §4.2 Text Statistics（书中第 75 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §4.2.1 Vocabulary Growth（书中第 80 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §4.2.2 Estimating Collection and Result Set Sizes（书中第 83 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **练习**：[§3.4](#34-练习)

### 3.4 练习

#### 在 AP89 上检验 Zipf 定律

使用以下 AP89 数据：词出现总次数 39,749,179，不同的词 198,763 个，只出现一次的词 70,064 个，出现超过 1,000 次的词 4,169 个；"the" 出现 2,420,778 次（秩 1），"of" 出现 1,045,733 次（秩 2），"people" 出现 68,988 次（秩 50）。"the" 和 "of" 占文本的多少？"people" 的 $r \cdot P_r$ 是否接近 0.1？hapax legomena 占词表的比例是多少？出现超过 1,000 次的词又占多少？

<details>
<summary>解答</summary>

- "the" + "of"：(2,420,778 + 1,045,733) / 39,749,179 = 3,466,511 / 39,749,179 = **8.7%**，即 Zipf 定律中的"约 10%"（6.09% + 2.63%）。
- "people"：$r \cdot P_r = 50 \times 68{,}988 / 39{,}749{,}179 = 0.087$，接近 0.1。一般而言，"the" 的 $r \cdot P_r$ 为 0.061，"of" 为 0.053，秩 11 到 50 则保持在 0.076 到 0.090 之间（见 §3.3 的表）。
- hapax legomena：70,064 / 198,763 = **35%** 的词表只出现一次；只有 4,169 个词（2.1%）出现超过 1,000 次。

Zipf 定律在中间段大致成立，在两端失效，也就是高频和低频处的问题。

</details>

## 4. 停用词去除与停用词

**功能词**（如限定词、介词）本身几乎没有意义，而且出现频率极高，位于 §3 中 Zipf 曲线的顶端。它们可以被当作**停用词**（stopword）去掉，这样可以：

- 减少索引空间，
- 缩短响应时间，
- 提高效果。

不过，它们在**组合中**可能很重要："to be or not to be" 全部由停用词组成。

**构建词表**：停用词表可以取自最高频的词，也可以采用标准词表。词表会针对应用、领域，甚至**文档的不同部分**定制：对锚文本（§8）而言，"click" 和 "here" 就是很好的停用词。

> 💡 **关键洞见**：通常最好的策略是**索引文档中的所有词**，并在**查询时**决定使用哪些词。在建索引时删除的词，无法再恢复。

> 📘 **延伸阅读**：[Croft §4.3.3 Stopping（书中第 90 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 5. 词干提取：suffix-s、Porter、Krovetz

### 5.1 词形与为何要做词干提取

词干提取（stemming）也叫**合并**（conflation）。词由**语素**（morpheme）构成：

- **词干**（stem）是核心单元。
- **词缀**（affix）是附着在词干上的单元。在 "stems" 中，STEM 是词干，S 是词缀。

许多词都有形态变化：**屈折变化**（inflectional，如复数、时态）和**派生变化**（derivational，如通过加后缀 *-ation* 把动词变为名词）。在大多数情况下，这些变体的含义相同或非常相近。

**词干提取器**（stemmer）试图把这些变化归并到一个**共同的词干**，通常是通过去掉后缀实现的。与停用词一样，它可以在建索引时进行，也可以在查询处理时进行，或两者兼用。例如，用户搜索 "mark spitz swimming"，而描述往届赛事的网页写的是 "swam"。词干提取器必须把 "swimming" 和 "swam" 都转换为同一个词干（例如 "swim"），二者才能匹配。

这种收益通常**不大，但很重要**：英语的效果提升约为 5% 到 10%，阿拉伯语或俄语则可达 50%，在这些语言里它可能至关重要。阿拉伯语的许多词都围绕一个词根构建，比如词根 *ktb*：

| 词 | 含义 |
|---|---|
| kitab | 一本书 |
| kitabi | 我的书 |
| alkitab | 这本书 |
| kitabuki | 你的书（阴性） |
| kitabuka | 你的书（阳性） |
| kitabuhu | 他的书 |
| kataba | 写 |
| maktaba | 图书馆、书店 |
| maktab | 办公室 |

**两种基本类型**，都依赖具体语言：

- **基于词典**：使用相关词的列表。
- **基于算法**：使用程序来判断相关词。

### 5.2 suffix-s 词干提取器

最简单的英语算法型词干提取器是 **suffix-s**：去掉结尾的 "s"，假定它是复数。

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

它会产生**很多假阴性**（应当合并的相关词没有合并：centuries ↛ century），也会产生**一些假阳性**（把不相关的词合并了：is → i）。

> ⚠️ **易错点**：注意方向。**假阳性**（false positive）是把*不该*匹配的词合并在一起（is/I）；**假阴性**（false negative）是漏掉了*应该*匹配的词（centuries/century）。

### 5.3 Porter 词干提取器

**Porter 词干提取器**是一种算法型词干提取器，自 1980 年前后起就用于 IR 实验：

- 它由五个步骤组成的**一系列规则**构成；在每个步骤中，执行**最长适用后缀**对应的规则。
- 它在 TREC 上效果良好。
- 它产生的是**词干，而不一定是词**。
- 缺点：它会犯不少错误，而且难以修改。

第 1 步（五步之一）的完整内容：

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

下面可以逐步演示全部十二个例子，也可以输入你自己的词。表格会在 1a 步和 1b 步之后分别填入每个词的结果：紫色单元格表示*该步*改变了这个词，最终的词干加粗；代码面板会高亮触发的规则：

```viz porter-step1
{"title": "Porter 第 1a + 1b 步：十二个例子", "words": "stresses, gaps, gas, ties, cries, agreed, feed, fished, pirating, falling, dripping, hoping", "interactive": true}
```

十二个例子的结果都与预期一致：stress、gap、gas、tie、cri、agree、feed、fish、pirate、fall、drip、hope。注意 "cri"：它是词干，不是词。

**Porter 的错误**：

| 假阳性（被合并了，但不该合并） | 假阴性（没有合并，但应该合并） |
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

**Porter2** 词干提取器修正了其中的一部分问题，并允许加入例外。其他语言也采用过类似的做法。

> 📘 **延伸阅读**：[Porter stemmer (tartarus.org)](https://tartarus.org/martin/PorterStemmer/) · [Porter2 / Snowball English stemmer](http://snowball.tartarus.org/algorithms/english/stemmer.html) · [Croft §4.3.4 Stemming（书中第 91 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 5.4 词典词干提取器与 Krovetz 词干提取器

**词典词干提取器**使用人工构建的 `(词, 词干)` 对列表：

- **假阳性率非常低**。
- 相关的词不需要长得相像，例如 "is"、"be"、"was"。
- 一个重要缺点是它**无法自动应对新词**。
- 词表可以通过统计分析半自动地构建，再由人工校对。这对搜索应用中的**查询扩展**很有用。

**Krovetz 词干提取器**是算法与词典的**混合体**。它基于这样一种观察：不规则的词通常是语言中最古老的，而新词往往遵循规则的语法惯例。

1. 先在词典中查找该词。若在词典中，则保持不变，或替换为它的"例外"形式。
2. 若不在词典中，则检查它是否带有可以去掉的后缀。
3. 去掉后缀之后，再次查询词典。

它的优势在于：通常产生的是**词，而不是词干**。其假阳性率较低，假阴性率则略高（取决于词典的大小和整理质量）。用于搜索时，两者效果相当。

### 5.5 同一段文本上的 Porter 与 Krovetz

| | 文本 |
|---|---|
| **原文** | Document will describe marketing strategies carried out by U.S. companies for their agricultural chemicals, report predictions for market share of such chemicals, or report market statistics for agrochemicals, pesticide, herbicide, fungicide, insecticide, fertilizer, predicted sales, market share, stimulate demand, price cut, volume of sales. |
| **Porter** | document describ market strategi carri compani agricultur chemic report predict market share chemic report market statist agrochem pesticid herbicid fungicid insecticid fertil predict sale market share stimul demand price cut volum sale |
| **Krovetz** | document describe marketing strategy carry company agriculture chemical report prediction market share chemical report market statistic agrochemic pesticide herbicide fungicide insecticide fertilizer predict sale stimulate demand price cut volume sale |

两种输出都去掉了停用词（will、out、by、for、their、of、such、or）。Porter 的词元是 "strategi"、"compani" 这样的词干；Krovetz 的词元则是 "strategy"、"company" 这样的真实单词。

> 💡 **关键洞见**：算法型 = 规则，错误多，无需维护词典。词典型 = 假阳性少，但无法处理新词。Krovetz = 先查词典，规则作为兜底。

| 词干提取器 | 类型 | 输出 | 错误 |
|---|---|---|---|
| suffix-s | 算法型 | 词干 | 假阴性多，也有一些假阳性 |
| Porter | 算法型（规则，最长后缀） | 词干 | 错误多，难以修改 |
| Porter2 | 算法型 | 词干 | 修正了 Porter 的部分问题，允许加入例外 |
| 词典型 | 词表 | 词 | 假阳性极少；无法处理新词 |
| Krovetz | 混合：先查词典，再去掉后缀 | 词 | 假阳性较少，假阴性稍多 |

> 📝 **练习**：[§5.6](#56-练习)

### 5.6 练习

#### Suffix-s：假阳性与假阴性

将 suffix-s 词干提取器（去掉结尾的 "s"，假定是复数）应用于 cats、lakes、wiis、centuries、is。哪些结果是假阴性，哪些是假阳性？

<details>
<summary>解答</summary>

cats → cat、lakes → lake、wiis → wii 都是正确的。centuries → **centurie**，而不是 century：它没能合并两个相关的词，因此是**假阴性**。is → **i**：它合并了两个不相关的词，因此是**假阳性**。

</details>

#### 手工计算 Porter 第 1 步

仅使用 §5.3 中所述的第 1a 步和第 1b 步，对以下词进行词干提取：stresses、gaps、gas、ties、cries、agreed、feed、fished、pirating、falling、dripping、hoping。

<details>
<summary>解答</summary>

| 词 | 触发的规则 | 结果 |
|---|---|---|
| stresses | 1a：sses → ss | stress |
| gaps | 1a：删去 s（"p" 之前的元音是 "a"） | gap |
| gas | 1a：保留 s（s 之前紧邻的是元音 "a"） | gas |
| ties | 1a：ies → ie（其前只有一个字母 "t"） | tie |
| cries | 1a：ies → i（其前不止一个字母） | cri |
| agreed | 1b：eed → ee（后缀位于 "ag" 之后，即第一个跟在元音后的非元音之后的部分） | agree |
| feed | 1b：保留 eed（后缀不在该区域内） | feed |
| fished | 1b：删去 ed | fish |
| pirating | 1b：删去 ing，然后 "at" → 加 e | pirate |
| falling | 1b：删去 ing；"ll" 是允许的双字母 | fall |
| dripping | 1b：删去 ing，然后双 "p" → 去掉一个 | drip |
| hoping | 1b：删去 ing，然后因为是短词 → 加 e | hope |

§5.3 中的演示运行的正是这些规则，并给出相同的十二个结果。

</details>

## 6. 短语：词性标注与词 n-gram

### 6.1 为什么要识别短语

短语在搜索中很重要：许多网页搜索查询都是 **2 到 3 个词的短语**。短语：

- 比单个词**更精确**：包含 "black sea" 的文档，与只是同时含有 "black" 和 "sea" 两个词的文档并不相同。**词序很重要**：你想要的是 "the sea turned black" 这样的页面吗？
- **歧义更少**："big apple" 与 "apple" 的对比。

短语也会**给排序带来困难**，具体细节取决于所用的模型。对于查询 "fishing supplies"，应该如何给下列文档打分：完整短语出现多次、完整短语出现一次、两个词出现在同一句中、同一段中、整篇文档中，或词的各种变体？

两个问题：**什么是短语？**以及**如何识别短语？**有三种方法：

1. 用**词性（POS）标注器**识别句法短语（§6.2）。
2. 使用**词 n-gram**（§6.3）。
3. 在索引中存储**词的位置**，并在查询中使用**邻近运算符**（[倒排索引与索引构建](topic-indexing.zh-CN.md)）。

> 📘 **延伸阅读**：[Croft §4.3.5 Phrases and N-grams（书中第 97 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 6.2 词性标注

词性标注器利用文本的**统计 / 机器学习模型**，预测每个词的句法标签。标签示例：

| 标签 | 含义 | 标签 | 含义 |
|---|---|---|---|
| NN | 单数名词 | IN | 介词 |
| NNS | 复数名词 | JJ | 形容词 |
| VB | 动词 | CC | 连词（如 "and"、"or"） |
| VBD | 动词，过去式 | PRP | 代词 |
| VBN | 动词，过去分词 | MD | 情态助动词（如 "can"、"will"） |

于是可以把短语定义为**简单名词组**。下面是 Brill 标注器在 §5.5 那段对比文本上的输出：

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

用这种方法在两个语料中找到的最高频名词短语（TREC 新闻语料与一个专利语料）：

| TREC 频次 | TREC 短语 | 专利频次 | 专利短语 |
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

### 6.3 词 n-gram

词性标注**对大型语料来说太慢**。更简单的定义是：短语就是**任意 n 个词组成的序列**，即一个 **n-gram**（也叫 **shingle**）。bigram 是 2 个词，trigram 是 3 个词，unigram 是单个词。n-gram 也用于**字符级别**，例如 OCR 之类的应用。

n-gram 通常由**重叠**的词序列构成：把一个包含 n 个词的"窗口"每次向后移动一个词，穿过整篇文档。

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

运行下面的演示；该步骤会统计一篇 1,000 词文档中的 n-gram 数量：

```viz web-demo
{"title": "词 n-gram：每次移动一个词的窗口", "html": "<p>See the console.</p>", "js": "const words = \"the sea turned black\".split(\" \");\nfunction ngrams(ws, n) {\n  const out = [];\n  for (let i = 0; i + n <= ws.length; i++) out.push(ws.slice(i, i + n).join(\" \"));\n  return out;\n}\nconsole.log(\"unigrams\", ngrams(words, 1));\nconsole.log(\"bigrams \", ngrams(words, 2));\nconsole.log(\"trigrams\", ngrams(words, 3));", "steps": [{"note": "Count the windows instead of listing them: a document of N words has N − n + 1 n-grams of length n.", "js": "\n// L14 p14: n-gram instances in a 1,000-word document, 2 <= n <= 5\nlet total = 0;\nfor (let n = 2; n <= 5; n++) { console.log(\"n =\", n, \":\", 1000 - n + 1); total += 1000 - n + 1; }\nconsole.log(\"total\", total);"}], "height": 60, "interactive": true}
```

n-gram 能带来的好处：

- **频繁出现的 n-gram 更可能是有意义的短语。**
- N-gram 呈现 **Zipf 分布**，比单独的词更符合这一分布（Zipf 定律见 §3）。
- 可以为长度不超过指定值的**所有 n-gram 建索引**。优点：**比词性标注快得多**。缺点：**占用大量存储**。一篇 1,000 词的文档包含 **3,990** 个 2 ≤ n ≤ 5 的词 n-gram 实例（长为 $n$ 的窗口能放入长为 $N$ 词的文档中的 $N - n + 1$ 个位置）。

**Google n-gram**：即便存储开销如此之大，**许多网络搜索引擎仍然会为 n-gram 建索引**。以下是 Google 的样本数据：

| | 计数 |
|---|---|
| 词元（Tokens） | 1,024,908,267,229 |
| 句子（Sentences） | 95,119,665,584 |
| Unigrams | 13,588,391 |
| Bigrams | 314,843,401 |
| Trigrams | 977,069,902 |
| Fourgrams | 1,313,818,354 |
| Fivegrams | 1,176,470,663 |

网络上最常见的英语 trigram 是 **"all rights reserved"**；在中文中则是 "limited liability corporation"。

> 📝 **练习**：[§6.4](#64-练习)

### 6.4 练习

#### 一篇 1,000 词的文档有多少个 n-gram？

一篇文档有 1,000 个词。对于 2 ≤ n ≤ 5，使用重叠窗口，它包含多少个词 n-gram 实例？

<details>
<summary>解答</summary>

长为 n 的窗口可以放在 $1000 - n + 1$ 个位置：999 个 bigram、998 个 trigram、997 个 fourgram、996 个 fivegram。合计 $999 + 998 + 997 + 996 = 3{,}990$，是文档长度的四倍。这就是为 n-gram 建索引的存储代价。

</details>

## 7. 文档结构与标记

**文档的某些部分比其他部分更重要。** 文档解析器通过 HTML 标签之类的标记来识别结构：

- **标题、锚文本和加粗文本**很可能包含重要内容。
- **元数据**也可能很重要。
- **链接**用于链接分析（[链接分析：HITS 与 PageRank](topic-link-analysis.zh-CN.md)）。

以维基百科页面 "Tropical fish" 为例。渲染后的页面有标题、"From Wikipedia, the free encyclopedia"，以及两段含有许多链接词的文字（fish、tropical、freshwater、salt water、Fishkeepers、aquarium、iridescence、pigmented）。其 HTML 源码节选如下：

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

标记告诉解析器每个部分是什么：`<title>`、`<h1>` 标题、加粗的 `<b>Tropical fish</b>`、关键词 `<meta>`，以及每个 `<a href>` 链接。那些链接（freshwater、salt water、aquarium、iridescence、pigmented）引出了 §8。

> 📘 **延伸阅读**：[Croft §4.4 Document Structure and Markup（书中第 101 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 8. 链接与锚文本

链接是网络的关键组成部分：它对导航很重要，对搜索也很重要。在

```html
<a href="http://example.com">Example website</a>
```

中，"Example website" 是**锚文本**（anchor text），`http://example.com` 是**目标链接**（destination link）。搜索引擎会同时使用这两者。

锚文本被用作**目标页面内容的描述**。所有**指向某个页面的链接**的锚文本，会被收集成该页面的一个**额外文本字段**。例如，页面 `www.example.com` 有四个字段：

| 字段 | 内容 |
|---|---|
| text（页面自身的正文） | document text |
| 来自 other.com 的锚文本 | example |
| 来自 null.com 的锚文本 | click here |
| title（标题） | example site |

锚文本往往**简短、描述性强，并且与查询文本相似**。检索实验表明，它对**某些类型的查询**的效果有**显著影响，甚至超过了 PageRank！**（PageRank 只使用链接结构，不使用链接上的文字，见 [链接分析：HITS 与 PageRank](topic-link-analysis.zh-CN.md)。）

> ⚠️ **易错点**：锚文本描述的是链接**指向的**页面，而不是链接所在的页面。另外，"click here" 正是锚文本专用停用词表会去掉的那类文字（§4）。

> 📘 **延伸阅读**：[Croft §4.5.1 Anchor Text（书中第 105 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 9. 速查与五条要点

| 文本处理步骤 | 作用 | 注意事项 |
|---|---|---|
| 分词 | 字符 → 词元；转为小写（大小写折叠） | 连字符、撇号、句点、数字；查询必须与文档以相同方式分词 |
| 停用词去除 | 去掉功能词 | "to be or not to be"；最佳做法：全部索引，查询时再决定 |
| 词干提取 | 把形态变体归并为一个词干 | 假阳性（is → i）与假阴性（centuries ↛ century） |
| 短语 | 多词单元 | 词性标注（慢）、n-gram（占存储）、位置 + 邻近运算符 |
| 结构 / 标记 | 重视标题、锚文本、加粗、元数据 | 锚文本描述的是**目标**页面 |

| 事实 | 数值 |
|---|---|
| Zipf 定律 | $r \cdot P_r \approx c$，英语中 $c \approx 0.1$ |
| AP89 | 39.7M 次词出现，198,763 个不同的词，70,064 个 hapax legomena（35%） |
| 长为 $N$ 的文档中的 n-gram | 每个 $n$ 有 $N - n + 1$ 个；$N = 1000$ 时，$2 \le n \le 5$ 共 3,990 个 |

**必记的 5 件事**

1. 分词的决定虽小，却可能大幅改变查询的效果，而且查询必须经过与文档完全相同的步骤。
2. 词频服从 Zipf 分布：中间段 $r \cdot P_r \approx 0.1$；少数词（"the"、"of" 约占 9–10%）占主导；AP89 词表中约 35% 的词只出现一次；该定律在两端都会偏离。
3. 停用词的通常策略：全部索引，查询时再决定；停用词在组合中可能很重要。
4. 词干提取器在假阳性与假阴性之间权衡：Porter 产生词干（cri），Krovetz 产生词。
5. 短语可以用词性标注（准确、慢）、n-gram（快，但占存储：n = 2–5 时每 1,000 词有 3,990 个）或位置 + 邻近运算符来识别；锚文本是目标页面的强信号。

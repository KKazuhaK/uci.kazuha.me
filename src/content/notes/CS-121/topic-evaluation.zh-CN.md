---
title: "搜索引擎评测"
summary: "用户如何判断一个搜索引擎（相关性、可信度、去重、可读性、速度、F 形阅读、精确率与召回率、界面与工具）；有效性、效率与成本；测试集合（CACM、AP、GOV2、TREC 主题）、相关性判断、汇集、查询日志与点击数据（点击偏差、Skip Above 与 Skip Next），以及精确率、召回率、误报率和分类错误，并附一个具体例题。"
topics:
  - evaluation
kind: "topic"
order: 509
---

# CS 121: Information Retrieval — 话题：搜索引擎评测

## 目录

- [1. 用户对搜索引擎的期望](#1-用户对搜索引擎的期望)
- [2. 有效性、效率与成本](#2-有效性效率与成本)
- [3. 测试集合与相关性判断](#3-测试集合与相关性判断)
- [4. 汇集](#4-汇集)
- [5. 查询日志与点击数据](#5-查询日志与点击数据)
- [6. 精确率、召回率与分类错误](#6-精确率召回率与分类错误)
- [7. 速查与五条要点](#7-速查与五条要点)

> 本章探讨我们如何判断一个搜索引擎是否好用：先从**用户**的角度出发，再看**实验室测量**（测试集合、相关性判断、日志，以及精确率与召回率），这些测量让工程师能够比较不同的排序方法。被评测的排序来自 [检索模型：布尔、tf-idf 与向量空间](topic-retrieval-models.zh-CN.md) 和 [查询处理与高效 Top-K](topic-query-processing.zh-CN.md)；用户本身则在 [搜索引擎与 Web](topic-search-engines.zh-CN.md) 中有所描述。

## 1. 用户对搜索引擎的期望

**最主要的标准是返回页面的质量。** 在经典 IR 中，它就是相关性 $R(Q, D)$；真实引擎的相关性则是 $R(Q, D, \dots)$（查询、文档*以及更多因素*），而它究竟如何定义，是各家引擎的机密之一。同样对用户很重要的还有：

- 可信度
- 去重（并提供"显示相似结果"选项）
- 可读性
- 快速访问
- 没有弹窗

### 1.1 用户视角下的精确率与召回率

- **精确率**：最前面几条结果的相关程度如何？
- **召回率**：相关结果中有多少被展示了出来？

**对网页搜索而言，精确率比召回率更重要。** 尼尔森诺曼集团（Nielsen Norman Group）的眼动热力图显示，"关于我们"页、产品页和搜索结果页都呈现 **F 形**：视线先横扫顶部，再横扫一次，然后沿左边缘向下。用户只读顶部，多数人停在第一屏（85% 的人只看一屏结果；在 iProspect 调查中，41.2% 的人在第一页结束时放弃），因此*最靠前的*结果决定了质量。

**召回率何时重要？当需要完整性时**：此时的阅读方式是**承诺式阅读模式**（整页都会被读完），信源事先就值得信任，用户动机也很强。例如，**法律和科学**领域的搜索引擎。

> 📘 **延伸阅读**：[Nielsen Norman Group](https://www.nngroup.com)（F 形结论背后的眼动研究）。精确率与召回率的精确集合定义见 [§6](#6-精确率召回率与分类错误)。

> 📝 **练习**：[§1.3](#13-练习)

### 1.2 界面与工具

**界面要好：简洁，不杂乱**（可对比 Google、DuckDuckGo、Bing、Yandex、Baidu 和 Yahoo! 的首页）。此外还有**前处理与后处理工具**：

- 拼写检查 / 自动纠正
- 推荐的替代搜索
- 指向资源的链接（地图、图片等）
- 处理句法线索，例如在搜索框中输入的 URL 或数学公式

### 1.3 练习

#### 精确率还是召回率？

对于通用的网页搜索引擎，精确率（前几条结果有多相关？）和召回率（展示了多少相关结果？）哪个更重要？什么时候召回率才是更重要的那一个？

<details>
<summary>解答</summary>

对于网页搜索，**精确率**更重要：用户按 F 形阅读，多数人只看第一屏（85% 的人只看一屏结果；iProspect 调查中 41.2% 的人在第一页结束时放弃），因此*最靠前*的结果决定质量。**召回率**在**需要完整性时**才重要：动机强的用户、可信的信源、承诺式阅读模式，即**法律**和**科学**领域的搜索引擎。

</details>

## 2. 有效性、效率与成本

评测总是相对于**给定的查询、语料库和特定的相关性定义**而言的：

- **有效性**衡量**找到正确信息的能力**，即排序与用户所期望的排序吻合得有多好。
- **效率**衡量**完成这件事有多快**，以及需要多少**资源**，即产生排序的方法所需的时间与空间。

评测是**构建有效且高效的搜索引擎的关键**：

- 测量通常在**受控的实验室实验**中进行；也可以进行**在线**测试。
- **有效性、效率和成本彼此相关**：若要达到某一水平的有效性与效率，就决定了系统配置的**成本**；**效率与成本的目标可能反过来影响有效性**。

> 📘 **延伸阅读**：[Croft §8.1 Why Evaluate?（书中第 297 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR 第 8 章 Evaluation in information retrieval](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

## 3. 测试集合与相关性判断

**评测语料库**让不同方法的结果可以相互**比较**。**测试集合**由**文档、查询和相关性判断**三部分组成，例如：

- **CACM**：1958–1979 年《Communications of the ACM》的标题和摘要。查询与相关性判断由**计算机科学家**生成。
- **AP**：1988–1990 年美联社新闻专线文档（来自 TREC 磁盘 1–3）。查询取自 TREC 主题 51–150 的 title 字段。主题与相关性判断由**政府信息分析师**生成。
- **GOV2**：2004 年初从 **.gov** 域名网站爬取的网页。查询取自 TREC 主题 701–850 的 title 字段。主题与相关性判断由**政府分析师**生成。

| 集合 | 文档数 | 大小 | 每篇文档的平均词数 |
|---|---|---|---|
| CACM | 3,204 | 2.2 Mb | 64 |
| AP | 242,918 | 0.7 Gb | 474 |
| GOV2 | 25,205,179 | 426 Gb | 1073 |

| 集合 | 查询数 | 每个查询的平均词数 | 每个查询的平均相关文档数 |
|---|---|---|---|
| CACM | 64 | 13.0 | 16 |
| AP | 100 | 4.3 | 220 |
| GOV2 | 150 | 3.1 | 180 |

> 💡 **关键洞见**：比较一下查询长度。CACM 的查询由计算机科学家撰写，平均每个查询 13.0 个词；而 AP 和 GOV2 使用的是简短的 TREC **title** 字段，分别只有 4.3 和 3.1 个词。

**一个 TREC 主题**，其中 **title 被用作查询**：

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

**相关性判断。** 获得相关性判断是一个**昂贵、耗时的过程**：由谁来判断？指令是什么？评判者之间的一致程度如何？**TREC 的判断取决于所评测的任务**，通常是**二元**的；由于有 "narrative"（`<narr>` 字段详细说明了什么算相关），**一致性较好**。

> 📘 **延伸阅读**：[Croft §8.2 The Evaluation Corpus（书中第 299 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 4. 汇集

**对集合中所有文档做穷尽式判断是不现实的**（想想 GOV2 的 2500 万个网页 × 150 个主题）。GOV2 采用了**汇集**（pooling）技术：

- 来自**不同搜索引擎**（或检索算法）排序的**前 $k$ 个结果**（对 TREC 而言，$k$ 在 **50 到 200** 之间）被合并为一个**池**。
- **去除重复项。**
- 文档以某种**随机顺序**呈现给相关性评审员。

汇集为每个查询提供了**大量的相关性判断**，尽管仍然**不完整**；研究表明，**系统之间的比较结果是准确的**。

> ⚠️ **易错点**：只有被汇集的文档会被判断，因此任何参与系统都没有排进前 $k$ 名的相关文档，永远不会被判断。这就是汇集得到的判断"仍然不完整"的原因：它适合用来**比较**系统，而不是完整的相关文档清单。

## 5. 查询日志与点击数据

### 5.1 查询日志

**查询日志**既用于**调优和评测**搜索引擎，也用于**查询建议**等技术。它们**可能引发隐私问题**，因此要考虑是否对记录的数据做匿名化。典型内容包括：

- **用户标识符**或用户会话标识符
- **查询词项**，按用户输入的**原样**存储
- **结果的 URL 列表**、它们在结果列表中的**排名**，以及**是否被点击**
- **时间戳**：查询提交和点击等用户事件的时间
- **用户点击了哪个页面**

### 5.2 把点击当作偏好

**点击不是相关性判断**，尽管两者**相关**。点击会受多种因素的**偏差**影响，例如在结果列表中的**排名**（一种确认偏误：人们倾向于点击排在最上面的内容）。点击数据则可以用来预测**文档对之间的偏好**：

- 与相关性判断相关；
- 适用于具有**多个相关等级**、侧重**用户相关性**的任务；
- 使用各种**"策略"**来生成偏好。

**示例点击策略：Skip Above 与 Skip Next**（Agichtein et al., 2006）。结果列表为 $d_1, d_2, d_3, d_4$，只有 $d_3$ 被点击。生成的偏好为 $d_3 > d_2$、$d_3 > d_1$、$d_3 > d_4$：被点击的文档胜过它**上方**每一个未被点击的结果（用户跳过了它们），也胜过它**正下方**那个未被点击的结果。

> 📝 **练习**：[§5.4](#54-练习)

### 5.3 用点击偏差过滤噪声

**单个用户的点击数据可能很嘈杂！** 但点击数据可以被**聚合**以消除噪声。**点击分布**信息可以找出**频率高于预期**的点击，这些点击与相关性**高度相关**，例如用**点击偏差**来过滤用于生成偏好的点击。

位置 $p$ 上结果 $d$ 的**点击偏差** $CD(d, p)$ 为：

$$CD(d, p) = O(d, p) - E(p)$$

$O(d, p)$ 是在**给定查询的所有实例**上，文档 $d$ 在排名位置 $p$ 处的**观察**点击频率；$E(p)$ 是在**所有查询**上平均的、排名 $p$ 处的**期望**点击频率。用这个值来过滤点击，可以得到更可靠的信息（用于优化排序）。

> 📘 **延伸阅读**：[Croft §8.3 Logging（书中第 305 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 5.4 练习

#### Skip Above 与 Skip Next

结果列表为 $d_1, d_2, d_3, d_4$，用户只点击了 $d_3$。Skip Above 与 Skip Next 会生成哪些偏好？

<details>
<summary>解答</summary>

- **Skip Above**：用户在点击 $d_3$ 之前看到并跳过了 $d_1$ 和 $d_2$，所以 $d_3 > d_2$ 且 $d_3 > d_1$。
- **Skip Next**：点击之后紧邻的未被点击的结果，所以 $d_3 > d_4$。

因此得到 $d_3 > d_2$、$d_3 > d_1$、$d_3 > d_4$：这些都是排好序的文档对，而不是判定出的相关性。

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

## 6. 精确率、召回率与分类错误

精确率和召回率已在 [§1.1](#11-用户视角下的精确率与召回率) 中从用户的角度出现过，这里给出它们的集合定义。设 $A$ 为**相关文档的集合**，$B$ 为**检索到的文档的集合**：

| | 相关 | 不相关 |
|---|---|---|
| **检索到** | $A \cap B$ | $\overline{A} \cap B$ |
| **未检索到** | $A \cap \overline{B}$ | $\overline{A} \cap \overline{B}$ |

$$\text{Recall} = \frac{|A \cap B|}{|A|} \qquad\qquad \text{Precision} = \frac{|A \cap B|}{|B|}$$

$\overline{A}$ 为不相关文档，$\overline{B}$ 为未被检索到的文档。

- **召回率**：搜索引擎为某个查询**找全所有相关文档**的能力如何。
- **精确率**：它**排除不相关文档**的能力如何。

**分类错误**：

- **假阳性（第一类错误）**：**检索到了一个不相关的文档**（$\overline{A} \cap B$）。其比率即**误报率**（fallout）：

$$\text{Fallout} = \frac{|\overline{A} \cap B|}{|\overline{A}|}$$

- **假阴性（第二类错误）**：**相关但未被检索到的文档**（$A \cap \overline{B}$）。占相关文档的比例即 **$1 - \text{召回率}$**。

> ⚠️ **易错点**：分母决定一切。召回率除以**所有相关文档**（$|A|$），精确率除以**所有检索到的文档**（$|B|$），误报率除以**所有不相关文档**（$|\overline{A}|$）。误报率不等于 $1 - $ 精确率。

> 📘 **延伸阅读**：[Croft §8.4.1 Recall and Precision（书中第 308 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [IIR 第 8 章 Evaluation in information retrieval](https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf)

> 📝 **练习**：[§6.1](#61-练习)

### 6.1 练习

#### 用手算精确率、召回率与误报率

某集合有 20 篇文档 $d_1,\dots,d_{20}$，相关的是 $d_1, d_3, d_5, d_7, d_9$。引擎检索到了 $d_1, d_2, d_3, d_4$。请计算召回率、精确率和误报率，以及被漏掉的相关文档所占的比例。

<details>
<summary>解答</summary>

$A = \{d_1, d_3, d_5, d_7, d_9\}$，所以 $|A| = 5$；$B = \{d_1, d_2, d_3, d_4\}$，所以 $|B| = 4$；$|\overline{A}| = 20 - 5 = 15$。

- $A \cap B = \{d_1, d_3\}$，因此召回率 $= 2/5 = 0.4$，精确率 $= 2/4 = 0.5$。
- $\overline{A} \cap B = \{d_2, d_4\}$，因此误报率 $= 2/15 \approx 0.1333$（而不是 $1 - $ 精确率 $= 0.5$）。
- 被漏掉的相关文档 $A \cap \overline{B} = \{d_5, d_7, d_9\}$：$1 - $ 召回率 $= 0.6$。

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

## 7. 速查与五条要点

| 术语 | 含义 |
|---|---|
| 有效性 | 找到正确信息的能力（排序与用户期望一致） |
| 效率 | 产生排序所需的时间和空间 |
| 测试集合 | 文档 + 查询 + 相关性判断（CACM、AP、GOV2） |
| TREC 主题 | `<num>`、`<title>`（用作查询）、`<desc>`、`<narr>` |
| 汇集 | 合并多个系统的前 $k$ 个（$50$–$200$），去重、打乱顺序后判断 |
| Skip Above / Skip Next | 被点击的文档优于其上方被跳过的文档，以及紧随其后未被点击的那个 |
| 点击偏差 | $CD(d,p) = O(d,p) - E(p)$ |
| 召回率 | $\lvert A\cap B\rvert / \lvert A\rvert$ |
| 精确率 | $\lvert A\cap B\rvert / \lvert B\rvert$ |
| 误报率 | $\lvert\overline{A}\cap B\rvert / \lvert\overline{A}\rvert$（假阳性率） |

**必记的 5 条要点**

1. 网页用户按 F 形阅读，且很早就停下，所以对网页搜索而言，**精确率**最重要；只有在需要完整性时（法律、科学），**召回率**才重要。
2. **有效性**（找到正确答案）、**效率**（时间与空间）和**成本**相互权衡；评测大多在受控的实验室实验中完成。
3. **测试集合**是文档 + 查询 +（多为二元的）相关性判断；由于全部判断不现实，**汇集**只对合并后的前 $k$ 个结果做判断。结果不完整，但比较是准确的。
4. **点击受排名影响，且不是相关性判断**；把它们当作成对的偏好（Skip Above 与 Skip Next），并用点击偏差 $O(d,p) - E(p)$ 过滤噪声。
5. 召回率 $= |A\cap B|/|A|$，精确率 $= |A\cap B|/|B|$，误报率 $= |\overline{A}\cap B|/|\overline{A}|$；假阴性为 $1 - $ 召回率，而误报率不等于 $1 - $ 精确率。

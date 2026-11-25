---
title: "文档转换、存储与去重"
summary: "将文档转换为文本，字符编码（ASCII、Unicode、UTF-8/UTF-16/UTF-32），文档存储（TREC Web 格式、压缩、BigTable），精确重复（校验和、CRC），近似重复（N-gram 指纹、Simhash），以及去除页面噪声（内容块、文档斜率曲线、DOM）。"
topics:
  - documents
kind: "topic"
order: 503
---

# CS 121: Information Retrieval — 话题：文档转换、存储与去重

## 目录

- [1. 从多种格式到文本的转换](#1-从多种格式到文本的转换)
- [2. 字符编码、Unicode 与 UTF-8](#2-字符编码unicode-与-utf-8)
- [3. 文档存储：TREC Web、压缩与 BigTable](#3-文档存储trec-web压缩与-bigtable)
- [4. 精确重复：校验和与 CRC](#4-精确重复校验和与-crc)
- [5. 近似重复与 N-gram 指纹](#5-近似重复与-n-gram-指纹)
- [6. Simhash](#6-simhash)
- [7. 去除噪声：查找内容块](#7-去除噪声查找内容块)
- [8. 速查与五条要点](#8-速查与五条要点)

> 本章跟随一个被爬取的页面进入搜索引擎：先把它**转换**为文本（§1–2），再**存储**它（§3），然后剔除**重复**（§4–6）和**噪声**（§7）。在架构图（[搜索引擎与 Web](topic-search-engines.zh-CN.md)）上，这一路径是*文本获取 → 本地文档库 → 文本转换*。页面来自[网络爬虫](topic-crawling.zh-CN.md)；下一步是研究词本身（token、Zipf 定律、词干提取），即[文本处理](topic-text-processing.zh-CN.md)。
>
> 📖 **背景阅读**：[Croft 等人，*Search Engines: Information Retrieval in Practice*，第 3 章 "Crawls and Feeds"（§3.5–§3.8）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)。

## 1. 从多种格式到文本的转换

在文本可以被索引之前，必须先对它进行**转换**：

- 文本以**数百种互不兼容的文件格式**存在：纯文本、RTF、HTML、XML、Microsoft Word、ODF、PDF。
- **其他并非专为文本设计的文件类型**同样重要：PowerPoint、Excel、Keynote、Pages。
- 通常使用**转换工具或库**，它把文档内容**转换为带标签的文本格式（如 HTML 或 XML）**，并**保留其中一部分重要的格式信息**。
- 有些转换器**不保留格式**，例如 Unix 工具 `pdftotxt`、`pdf2ps` + `pdf2ascii`。

> 📘 **延伸阅读**：[Croft §3.5 The Conversion Problem](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 2. 字符编码、Unicode 与 UTF-8

### 2.1 字形与编码

**字形**（glyph，来自希腊语 γλυφή，意为"雕刻"）是你看到的符号，它们编码字母或含义。**字符编码**是**比特与字形之间的映射**，即从文件中的比特得到屏幕上字符的方式，它**可能是造成不兼容的主要原因**。

- **ASCII**（自 1963 年起）是英语的基础编码：用 **7 位**表示 **128** 个字母、数字、特殊字符和控制字符，并额外加一位以便按字节存储。
- **其他语言的字形要多得多**：中文有 **40,000** 多个字符，其中常用的超过 **3,000** 个。
- 许多语言有**多种编码方案**，例如 CJK（中日韩）系列、印地语和阿拉伯语。使用这些旧方案时必须**指定编码**，因为**文件不是自描述的**，并且**一个文件中无法同时包含多种语言**。
- **Unicode** 开发于 80 年代末，正是为了解决这些问题。

### 2.2 Unicode 及其编码

**Unicode** 是从数字到字形的**单一映射**，尽量包含所有已知语言中常用的字形。它的保留（私用）区域甚至可以用来书写自创的文字。

Unicode **解决了"数字 → 字形"的问题**，但**没有唯一确定"比特 → 字形"的映射**。UTF-8、UTF-16、UTF-32 这些编码正是做这件事的：它们把数字（**码位**，code point）转换为字节。

为什么要有多种编码？出于**兼容性与空间**的考虑：

| 编码 | 每个字符的字节数 | 权衡 |
|---|---|---|
| UTF-8 | 英文为 1（与 ASCII 相同），最多 **4**（例如某些繁体中文字符） | 可变长度：占用空间少，但字符串操作更难（第 *i* 个字符不在第 *i* 个字节处） |
| UTF-32 | 始终为 **4** | 占用内存更多，与 ASCII 不向后兼容，但宽度固定 |

你可以**两者混用**：许多应用在内部使用 **UTF-32**（便于快速随机查找），在磁盘上使用 **UTF-8**（占用空间更少）。

### 2.3 UTF-8 的工作原理

码位所在的范围决定表中的行；每个 `x` 依次由码位的比特填充，高位在前：

| 十进制 | 十六进制 | 编码 |
|---|---|---|
| 0–127 | 0–7F | `0xxxxxxx` |
| 128–2047 | 80–7FF | `110xxxxx 10xxxxxx` |
| 2048–55295 | 800–D7FF | `1110xxxx 10xxxxxx 10xxxxxx` |
| 55296–57343 | D800–DFFF | 未定义 |
| 57344–65535 | E000–FFFF | `1110xxxx 10xxxxxx 10xxxxxx` |
| 65536–1114111 | 10000–10FFFF | `11110xxx 10xxxxxx 10xxxxxx 10xxxxxx` |

示例：希腊字母 **π 的码位是 960**，二进制为 `00000011 11000000`（十六进制 3C0）。960 位于第二行，因此编码形式为 `110xxxxx 10xxxxxx`：**高 5 位**放入第一个字节，**接下来的 6 位**放入第二个字节。结果为 **`11001111 10000000` = `CF 80`**。你可以逐步查看，也可以输入其他字符：

```viz utf8-encode
{"title": "π 的 UTF-8 编码", "text": "π", "interactive": true}
```

前导位决定长度（`110` 表示 2 个字节，`1110` 表示 3 个，`11110` 表示 4 个）；后续字节以 `10` 开头，因此 ASCII 字节（`0xxxxxxx`）永远不会是多字节字符的一部分。Python 的结果与此一致：

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

> 📘 **延伸阅读**：[Croft §3.5.1 Character Encodings](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 2.4 练习

> 📝 **练习**：[§2.4](#24-练习)

#### π 的 UTF-8 编码

π 是 Unicode 码位 960。UTF-8 存储哪些字节？UTF-32 使用多少字节？

<details>
<summary>解答</summary>

960 = `0x3C0` = `00000011 11000000`。它位于 128–2047 范围内，因此模板为 `110xxxxx 10xxxxxx`，有 5 + 6 = 11 个有效载荷位：960 用 11 位表示为 `01111000000`。高 5 位 `01111` → `110`+`01111` = `11001111`；接下来 6 位 `000000` → `10`+`000000` = `10000000`。结果为 **`CF 80`**，共 2 个字节。UTF-32 始终使用 4 个字节：`00 00 03 C0`。

</details>

## 3. 文档存储：TREC Web、压缩与 BigTable

### 3.1 存储的理由与要求

转换之后，需要**存储**文档。保留转换后文本的理由：

- 当页面未更新时，它**节省重新爬取的时间**；
- 它能**高效访问文本**，用于**摘要生成**、额外信息抽取等。

数据库系统可以为某些应用提供文档存储，但**网络搜索引擎使用定制的文档存储系统**。搜索引擎文档库的要求如下：

| 要求 | 含义 |
|---|---|
| **随机访问** | 通过 **URL** 请求文档内容；通常用**URL 上的哈希函数**定位文档 |
| **压缩与大文件** | 减少存储需求，并保持访问效率 |
| **更新** | 处理大量新增和修改的文档；添加新的**锚文本**（指向该页面的链接的文本，之后在其他页面上才被发现） |

**大文件**：网页很小，因此要把**许多页面存入较少的大文件**，而不是每个文档一个文件。这样可以**避免文件 I/O 开销**（每页的打开与关闭），并且**相对于读取时间降低寻道时间**：一次寻道，然后进行长时间的顺序读取。**复合文档格式**在一个文件中存储多个文档，例如 **TREC Web**（见 §3.2）。

> 📘 **延伸阅读**：[Croft §3.6 Storing the Documents](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [§3.6.1 Using a Database System](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [§3.6.2 Random Access](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [§3.6.4 Update](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 3.2 TREC Web 格式

一个文件，包含两个被爬取的页面：

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

格式的各部分：

| 部分 | 位置 | 作用 |
|---|---|---|
| **文档块** | `<DOC>` … `</DOC>` | 每个被爬取的页面一个；每个文件中有很多个 |
| **头部** | `<DOCHDR>` … `</DOCHDR>` | 爬取记录：URL、服务器 IP、爬取时间戳（`19970101013145`）、类型，然后是 HTTP 响应头 |
| **内容** | `<HTML>` … `</HTML>` | 页面本身 |
| **文档标识符** | `<DOCNO>` | 唯一 ID（`WTX001-B01-10`、`WTX001-B01-109`） |
| **修改标记** | `Last-modified:` | 服务器声明页面最后修改的时间，是重新爬取时用来比较的依据（参见[网络爬虫](topic-crawling.zh-CN.md)中关于新鲜度与时效的部分） |

> 💡 **关键洞见**：这就是"大文件"思想的实际应用：爬虫把 `<DOC>` 块追加到一个大文件中，而一个从 `DOCNO`（或 URL 哈希）到字节偏移量的小索引提供随机访问。

### 3.3 压缩

**文本高度冗余（或可预测）**。香农 1951 年的论文 "Prediction and Entropy of Printed English" 正是对此进行度量的。**无损**压缩利用这种冗余，在**不丢失任何内容**的前提下使文件变小；索引同样可以压缩。

- 常见算法可将 HTML 和 XML 文本压缩 **80%**：例如 **DEFLATE**（zip、gzip）和 **LZW**（Unix `compress`、PDF）。
- 大文件可以**分块**压缩，这样读取一个文档时无需解压整个文件。

重复的标记压缩效果极好；真实页面的重复性较低，因此是约 80%，而不是这个玩具例子中的 97%：

```python
import zlib

page = b"<html><body>" + b"<p>Tropical fish include fish found in tropical environments.</p>\n" * 50 + b"</body></html>"
print(len(page), len(zlib.compress(page, 9)))
```

```text
3326 108
```

> 📘 **延伸阅读**：[Croft §3.6.3 Compression and Large Files](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 3.4 BigTable

**BigTable** 是 Google 的文档存储系统，专为在**廉价计算机**上**存储、查找和更新**网页并处理大型集合而设计。一个**逻辑表**被切分为许多**子表**（tablet），每个子表由一台服务器持有。

组织方式：

- 在逻辑上按**行**组织；**一行存储单个网页的数据**。
- **列可以有多个时间戳**（版本）。**行键、列键和时间戳共同指向一个单元格。**
- 一行可以有**极多的列**：所有行具有**相同的列组**，但**并非所有行都有相同的列**，这对减少磁盘读取很重要。
- 行按**行键**划分为子表（例如以某个字母开头的 URL 位于同一子表中），这使得找到正确的服务器变得简单。

一个示例行：

| 行键 | `text` | `anchor:other.com` | `anchor:null.com` | `title` |
|---|---|---|---|---|
| `www.example.com` | document text | example | click here | example site |

`anchor:` 是一个列组；每个链接来源站点都有自己的一列，用来保存其锚文本，也就是 §3.1 中所说的"添加新锚文本"更新。

优点与缺点：

- **没有查询语言**：无需优化复杂查询。
- **只支持行级事务。**
- 子表存放在一个可被所有 BigTable 服务器访问的**复制文件系统**中。
- 对子表的任何更改都会记录在**事务日志**中，该日志同样位于共享文件系统上。
- 若子表服务器崩溃，**另一台服务器会从文件系统读取子表的数据和日志并接管**。
- 子表可以被压缩。

> 📘 **延伸阅读**：[Croft §3.6.5 BigTable](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 4. 精确重复：校验和与 CRC

### 4.1 为何重复很重要

重复与近似重复来自**副本、版本、抄袭、垃圾信息和镜像站点**；在大型爬取中，**30%** 的页面与其他页面完全相同或近似相同（**Fetterly et al., 2003**）。它们会在爬取、索引和搜索过程中**消耗大量资源**，而对大多数用户几乎没有价值（但在某些用例中可能有价值）。解决办法是用哈希检测精确副本，用指纹检测近似副本；爬虫一侧的视角见[网络爬虫](topic-crawling.zh-CN.md)。

### 4.2 校验和与 CRC

**精确重复检测相对容易。** 校验和是由文档内容计算出的一个值，例如**文件中所有字节的和**：

| T | r | o | p | i | c | a | l | （空格） | f | i | s | h | 和 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 54 | 72 | 6F | 70 | 69 | 63 | 61 | 6C | 20 | 66 | 69 | 73 | 68 | 508 |

所有数值均为十六进制：508（十六进制）= **1,288**（十进制）。

- 文本不同的文件**可能具有相同的校验和**：字节求和忽略顺序，因此同一组字节的任何重排都会产生碰撞。
- **循环冗余校验（CRC）**还会考虑字节的**位置**。它**仍可能发生碰撞，但非常罕见**。其他函数包括 **BLAKE2/3、MD5、SHA1、SHA2** 等。
- 无论使用哪种方法，**都需要足够快**，因为它要对每个页面运行。

```python
import zlib

for s in [b"Tropical fish", b"Tropical fihs"]:
    print(s, sum(s), hex(sum(s)), hex(zlib.crc32(s)))
```

```text
b'Tropical fish' 1288 0x508 0x18f14f94
b'Tropical fihs' 1288 0x508 0x3ba24de2
```

交换两个字母会保持字节和不变，但会改变 CRC。

> 📘 **延伸阅读**：[Croft §3.7 Detecting Duplicates](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 4.3 练习

> 📝 **练习**：[§4.3](#43-练习)

#### 字节和校验和

对 ASCII 字符串 "Tropical fish" 的字节求和。字节和是检测精确重复的安全方法吗？

<details>
<summary>解答</summary>

以十六进制计算：54 + 72 + 6F + 70 + 69 + 63 + 61 + 6C + 20 + 66 + 69 + 73 + 68 = **508（十六进制）= 1,288**。这并不安全：求和忽略顺序，因此 "Tropical fihs" 的和也是 1,288。CRC 会按位置对字节加权：CRC-32 得到 `0x18f14f94` 与 `0x3ba24de2`。

</details>

## 5. 近似重复与 N-gram 指纹

### 5.1 定义近似重复

**近似重复检测更难。** 两个文本相同、但广告或格式不同的页面是近似重复吗？近似重复由两个文档之间某种相似度度量的**阈值**来定义，例如，若 D1 与 D2 **超过 90% 的词相同**，则 D1 是 D2 的近似重复。计算共享词恰好需要[文本处理](topic-text-processing.zh-CN.md)中的分词与词频统计。

两种场景：

| 场景 | 任务 | 代价 |
|---|---|---|
| **搜索** | 找出一个文档 D 的近似重复 | $O(N)$ 次比较 |
| **发现** | 找出集合中**所有**近似重复的**文档对** | $O(N^2)$ 次比较 |

普通的信息检索技术适用于搜索；而对于发现任务，则需要称为**指纹**（fingerprint）的紧凑表示。

### 5.2 指纹算法

1. **把文档解析为词**；去除标点、HTML 标签和多余的空白。
2. **将词分组为连续的 n-gram**（取某个 n 值），通常是重叠的。
3. **选出部分 n-gram** 来代表文档。
4. **对选中的 n-gram 取哈希**，检索更快，表示更小。
5. **存储哈希值**，通常存放在[倒排索引与索引构建](topic-indexing.zh-CN.md)中。
6. **通过比较指纹的重叠程度来比较文档。**

示例逐阶段构建：

- (a) 文本："Tropical fish include fish found in tropical environments around the world, including both freshwater and salt water species."
- (b) 3-gram：tropical fish include、fish include fish、include fish found、……、salt water species——18 个词得到 **16** 个 3-gram。
- (c) 哈希值：`938 664 463 822 492 798 78 969 143 236 913 908 694 553 870 779`。
- (d) 使用 **0 mod 4** 选出：`664 492 236 908`。

（示例先对每个 n-gram 取哈希，再进行选择；上面第 3 步与第 4 步的顺序与此相反，但思路相同。）逐步查看这 16 个 n-gram；也可以编辑文本，使用演示用的哈希：

```viz shingle-fingerprint
{"title": "热带鱼文本的 N-gram 指纹", "interactive": true}
```

用 Python 复现各阶段（哈希值取自示例，并非真正的哈希函数）：

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

### 5.3 比较指纹

给定指纹 $F_A$ 与 $F_B$，相似度是交集大小与并集大小之比：

$$S_{A,B} = \frac{|F_A \cap F_B|}{|F_A \cup F_B|} \qquad S_{A,B} \ge \tau \implies \text{A and B are near duplicates}$$

$|F|$ 是集合中哈希值的个数（即其基数），$\tau$ 是**你**选择的阈值：在"你所定义的阈值"之下，它们即为近似重复。

```python
def jaccard(a, b):
    return len(a & b) / len(a | b)

print(jaccard(fp, {664, 492, 100, 200, 236}))
```

```text
0.5
```

> ⚠️ **易错点**："0 mod p" 的选择只保留大约 $1/p$ 的 n-gram，而且选中哪些只取决于它们的哈希值，因此同一文本的两个副本会选中相同的 n-gram。若按位置选择（"每隔 4 个 n-gram 取一个"），则不然：在开头插入一个词，所有被选中的 n-gram 都会随之改变。

> 📘 **延伸阅读**：[Croft §3.7 Detecting Duplicates](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 5.4 练习

> 📝 **练习**：[§5.4](#54-练习)

#### 0 mod 4 会选出哪些指纹值？

文本 "Tropical fish include fish found in tropical environments around the world, including both freshwater and salt water species." 有 18 个词。按顺序，其重叠的 3-gram 的哈希值依次为 938、664、463、822、492、798、78、969、143、236、913、908、694、553、870、779。共有多少个 3-gram？"0 mod 4" 会选出哪些哈希值？它们对应哪些 3-gram？如何将这一指纹与另一文档的指纹进行比较？

<details>
<summary>解答</summary>

18 个词 → 18 − 3 + 1 = 16 个 3-gram。对 4 取余：

| 哈希 | 938 | 664 | 463 | 822 | 492 | 798 | 78 | 969 | 143 | 236 | 913 | 908 | 694 | 553 | 870 | 779 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 对 4 取余 | 2 | **0** | 3 | 2 | **0** | 2 | 2 | 1 | 3 | **0** | 1 | **0** | 2 | 1 | 2 | 3 |

$F$ = {664, 492, 236, 908}：16 个值中有 4 个，分别来自 "fish include fish"、"found in tropical"、"the world including" 和 "including both freshwater"。与另一文档的指纹比较时，使用 $|F_A \cap F_B| / |F_A \cup F_B| \ge \tau$。

</details>

## 6. Simhash

### 6.1 动机

基于**词的表示**上的相似度比较（余弦相似度，参见[检索模型：布尔、tf-idf 与向量空间](topic-retrieval-models.zh-CN.md)），比 n-gram 指纹更有效地找到近似重复；它的问题在于**效率**。**Simhash**（Charikar, 2002）结合了基于词的相似度的优点与哈希指纹的效率：两个页面之间的**余弦相关性**与它们 simhash 指纹中**相同比特的数量**成正比。

### 6.2 算法

1. 把文档处理为一组**带权重的特征**，这里是**按词频加权的词**。
2. 为每个词生成一个 **b 位哈希**（b 为指纹的大小）；每个词的哈希都是唯一的。
3. 在 b 维向量 $V$ 中，对每个词：若其哈希的第 $i$ 位为 **1**，就把它的权重**加到**分量 $i$ 上；若该位为 **0**，则**减去**它的权重。
4. 处理完所有词后，指纹的第 $i$ 位在 $V_i$ 为正时为 **1**，否则为 0。

示例与第 5 节使用相同的文本：

- (b) 带权重的词：tropical 2、fish 2、include 1、found 1、environments 1、around 1、world 1、including 1、both 1、freshwater 1、salt 1、water 1、species 1（in、the、and 被略去）。
- (c) 8 位哈希值：

| 词 | 哈希 | 词 | 哈希 | 词 | 哈希 |
|---|---|---|---|---|---|
| tropical | `01100001` | fish | `10101011` | include | `11100110` |
| found | `00011110` | environments | `00101101` | around | `10001011` |
| world | `00101010` | including | `11000000` | both | `10101110` |
| freshwater | `00111111` | salt | `10110101` | water | `00100101` |
| species | `11101110` | | | | |

- (d) $V$ = **1 −5 9 −9 3 1 3 3**。
- (e) 指纹 = **1 0 1 0 1 1 1 1**。

手工检查最后一个分量：tropical `01100001` → `- + + - - - - +`，fish → `+ - + - + - + +`，include → `+ + + - - + + -`，沿最后一列向下：$3 = 2 + 2 - 1 - 1 + 1 + 1 - 1 - 1 - 1 + 1 + 1 + 1 - 1$。演示每一步加入一个词：

```viz simhash
{"title": "热带鱼文本的 Simhash", "interactive": true}
```

用代码表示（包括从文本中删去一个词时会发生什么）：

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

删去一个权重为 1 的词，使 $V$ 的每个分量只变化了 1（恰好变为 0 的分量会翻转，因为规则要求 $V_i$ 严格为正），因此 8 位中仍有 6 位相同。

### 6.3 比较两个 simhash

相似度是**相同比特所占的比例**：

$$S_{A,B} = \frac{\sum_n (H_A \equiv_{\text{bitwise}} H_B)}{n} \qquad S_{A,B} \ge \tau \implies \text{near duplicates}$$

$H_A, H_B$ 是两个指纹，$\equiv_{\text{bitwise}}$ 在两者比特一致的每个位置计为 1，$n$ 是比特数。它等价于 $1 - \text{Hamming distance}/n$，即 1 减去汉明距离与 n 之比。

> ⚠️ **易错点**：Simhash 与普通哈希恰恰相反。好的哈希在一个字节改变时会完全改变（§4）；simhash 的设计目标则是让相似文档的指纹只在**少数**比特上不同：只改动一个词，只会使 $V$ 改变该词权重那么多。

> 📘 **延伸阅读**：[Croft §3.7 Detecting Duplicates](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

### 6.4 练习

> 📝 **练习**：[§6.4](#64-练习)

#### 热带鱼文本的 Simhash

某文档包含以下词及其权重（频次）：tropical 2、fish 2、include 1、found 1、environments 1、around 1、world 1、including 1、both 1、freshwater 1、salt 1、water 1、species 1。其 8 位哈希值分别为：tropical `01100001`，fish `10101011`，include `11100110`，found `00011110`，environments `00101101`，around `10001011`，world `00101010`，including `11000000`，both `10101110`，freshwater `00111111`，salt `10110101`，water `00100101`，species `11101110`。计算 $V$ 与 simhash 指纹。

<details>
<summary>解答</summary>

每个词对 1 位加上 +权重，对 0 位加上 −权重。按列计算：

| 比特 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| $V$ | 1 | −5 | 9 | −9 | 3 | 1 | 3 | 3 |
| 指纹 | 1 | 0 | 1 | 0 | 1 | 1 | 1 | 1 |

第 8 位：tropical +2，fish +2，include −1，found −1，environments +1，around +1，world −1，including −1，both −1，freshwater +1，salt +1，water +1，species −1，合计为 3 > 0，因此该位为 1。指纹为 **10101111**。两个文档的 simhash $H_A, H_B$ 通过 8 位中相同比特的比例与 $\tau$ 比较。

</details>

## 7. 去除噪声：查找内容块

许多网页包含与**主要内容无关**的文本、链接和图片：横幅、导航、侧栏和广告。这些材料大多是**噪声**，可能会损害页面的排名。一些技术用于检测**内容块**；在建立索引时，非内容材料会被**忽略或降低重要性**。

示例：一个新闻页面的横幅与侧栏被标为**噪声块**；CNN.com 的 "Science & Space" 文章（"Aquarium plays whale shark matchmaker"）中，正文是**内容块**，周围是导航、搜索框和广告。那么，如何检测出内容？

### 7.1 标签的累积分布（文档斜率曲线）

技术一是*文档斜率曲线*（Finn, Kushmerick & Smyth, 2001）。沿页面的 token 逐个遍历，统计到目前为止见到的标签数：横轴为 **token 数**（最多约 3,500），纵轴为**标签数**（最多约 1,000）。曲线在标签密集的导航区域稳步上升，而**正文是中间的"平台"**（标为 "Text area"，约 1,000–1,500 个 token），在那里许多 token 经过时几乎没有标签。

作为优化问题：把页面表示为一个**比特序列**，若第 $n$ 个 token 是**标签**则 $b_n = 1$。寻找 $i$ 和 $j$，使得 **$i$ 之前和 $j$ 之后的标签数**，加上 **$i$ 与 $j$ 之间的非标签 token 数**，达到最大：

$$\max_{i,\,j} \; \sum_{n=0}^{i-1} b_n \;+\; \sum_{n=i}^{j} (1 - b_n) \;+\; \sum_{n=j+1}^{N-1} b_n$$

$N$ 是 token 的数量；token $i$ … $j$ 构成内容块。第一项和第三项奖励块**外部**的标签，中间一项奖励块**内部**的文本。

**替代方法**：把曲线切分为纵向**片段**，求每个片段内的**斜率**，并迭代，不断缩小片段大小，直到找到**零斜率窗口**。

### 7.2 DOM 与版面方法

**其他方法**利用**文档对象模型（DOM）**结构和**视觉（版面）特征**：HTML 解析器把 HTML 转换为 DOM 树。CNN 页面的树为 `#document` → `HTML` → `HEAD`、`BODY`（`contentArea`），其中的 `DIV` 和 `TABLE` 分别名为 `cnnCeil`、`cnnBreakingNewsBanner`、`iframecnnBreakingNewsBanner`、`cnnCeilSearch`、`cnnArticleWireFrame`、`cnnFootBox`、`csiIframe`；而真正重要的是 `TABLE` → `TBODY` → `TR` → **`TD` `cnnArticleContent`**，即文章本身。

> 📘 **延伸阅读**：[Croft §3.8 Removing Noise](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 8. 速查与五条要点

| 编码 | 每个字符的字节数 | 说明 |
|---|---|---|
| ASCII | 1（只用 7 位） | 128 个字符，仅限英语 |
| UTF-8 | 1–4 | 与 ASCII 兼容；模板 `0xxxxxxx`、`110xxxxx 10xxxxxx`、`1110xxxx` + 2、`11110xxx` + 3 |
| UTF-32 | 4 | 宽度固定：随机访问快，但占用内存更多 |

| 重复检测方法 | 检测对象 | 方式 | 相似度 |
|---|---|---|---|
| 校验和（字节和） | 精确 | 字节求和 | 相等与否；忽略顺序导致碰撞 |
| CRC、MD5、SHA、BLAKE | 精确 | 考虑位置的哈希 | 相等与否；碰撞罕见 |
| N-gram 指纹 | 近似 | n-gram → 哈希 → 保留 0 mod p | $\lvert F_A \cap F_B\rvert / \lvert F_A \cup F_B\rvert \ge \tau$ |
| Simhash | 近似 | 权重 × ±哈希位 → $V$ 的符号 | 相同比特数 / n $\ge \tau$ |

| 存储 / 噪声 | 关键思路 |
|---|---|
| 大文件、TREC Web | 每个文件中有许多 `<DOC>` 块：减少文件 I/O，只需寻道一次 |
| 压缩 | 无损，对 HTML/XML 约 80%（DEFLATE、LZW），分块进行 |
| BigTable | 行 = 页面；（行键，列键，时间戳）→ 单元格；按行键划分子表 |
| 内容块 | 标签累积曲线的平台；最大化 $[i, j]$ 之外的标签数与之内的文本数 |

**必记的 5 件事**

1. Unicode 把字形映射为数字；UTF-8/16/32 把数字映射为字节。π = U+03C0 = 960 → `110`01111 `10`000000 = `CF 80`。
2. 搜索引擎把文档存储在大型复合文件（TREC Web）或 BigTable 中：通过 URL 哈希实现随机访问，并支持压缩与更新，而不是每个页面一个文件。
3. 精确重复：校验和/CRC；近似重复：N-gram 指纹（"0 mod p" 选择，交集除以并集 ≥ τ），或 Simhash（相同比特的比例 ≥ τ）。
4. Simhash：$V_i$ 在比特 $i$ 为 1 时加上权重，为 0 时减去权重；当 $V_i > 0$ 时比特为 1。相似的文档得到相似的指纹。
5. 索引之前先去除噪声：主文本是累积标签曲线上的平台（或 DOM 树中的内容块）。关于词的统计（如 Zipf 定律），参见[文本处理](topic-text-processing.zh-CN.md)。

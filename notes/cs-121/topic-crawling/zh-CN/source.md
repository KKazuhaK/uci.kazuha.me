# CS 121: Information Retrieval — 话题：网络爬虫

## 目录

- [1. 获取网页数据：四种方式](#1-获取网页数据四种方式)
- [2. URI、URL 与 URN](#2-uriurl-与-urn)
- [3. 基本爬取算法](#3-基本爬取算法)
- [4. 爬取许可：robots.txt](#4-爬取许可robotstxt)
- [5. Sitemap：提供给爬虫的信息](#5-sitemap提供给爬虫的信息)
- [6. 为什么基本算法不够用](#6-为什么基本算法不够用)
- [7. 礼貌性与性能](#7-礼貌性与性能)
- [8. 爬虫陷阱](#8-爬虫陷阱)
- [9. 重复、数据噪声、客户端脚本与深网](#9-重复数据噪声客户端脚本与深网)
- [10. 何时重新爬取：新鲜度与年龄](#10-何时重新爬取新鲜度与年龄)
- [11. 分布式爬取](#11-分布式爬取)
- [12. 其他类型的爬取：聚焦、桌面与文档订阅源](#12-其他类型的爬取聚焦桌面与文档订阅源)
- [13. 伦理与法律](#13-伦理与法律)
- [14. 隐私：你的爬虫留下了什么](#14-隐私你的爬虫留下了什么)
- [15. 版权、合理使用与法律案例](#15-版权合理使用与法律案例)
- [16. 速查与五条要点](#16-速查与五条要点)

> 本章讲的是**文本获取**：搜索引擎如何从网络上获得它的文档。它位于 [搜索引擎与 Web](topic-search-engines.zh-CN.md) 所描述的架构的最前端；爬虫存下的内容，会按 [文档转换、存储与去重](topic-documents.zh-CN.md) 的方式进行转换与去重，然后再建立 [倒排索引与索引构建](topic-indexing.zh-CN.md)。

## 1. 获取网页数据：四种方式

在任何搜索或排序之前，引擎都需要数据。从网络获取数据有四种方式：

| 方式 | 工作原理 | 说明 |
|---|---|---|
| **数据转储** | 网站定期打包自己的数据，以“转储”（dump）的形式提供 | 维基百科（建议用 torrent 下载）；arXiv 的批量全文访问 |
| **URL 下载** | 两步：（1）找出特定资源的 URL；（2）对这份列表运行下载器 | 例如从 SourceForge / GitHub“爬取”源代码，或论文、网页等。一些网站使用规则的 URL：`http://link.springer.com/chapter/10.1007/978-3-642-34213-4_1`、`…_2`，…；Google Code 的 `http://code.google.com/p/python-for-android/downloads/list` |
| **Web API** | 网站提供（REST）接口来获取其数据 | 通常**层级更高**（无需解析 HTML），但通常**限制较多**（只提供部分数据）。Facebook Graph API、YouTube API、Twitter API、arXiv API 等 |
| **网页爬取** | 像人一样：获取 HTML 页面及其他文档，并在过程中**发现新的 URL** | 适合**不断变化**的集合和**未知**的文档。网站管理员不喜欢爬虫：它们消耗了本该供人使用的资源（本章其余部分讨论的正是这种张力） |

> 💡 **关键洞见**：只有在事先不知道 URL 时，爬取才是必需的；URL 下载则需要可预测的模式，例如 `…34213-4_1`、`…_2`。

> 📘 **延伸阅读**：[Wikipedia：数据库下载](http://en.wikipedia.org/wiki/Wikipedia:Database_download) · [arXiv 批量数据（S3）](https://arxiv.org/help/bulk_data_s3) · [arXiv API](https://arxiv.org/help/api/index) · [Facebook Graph API](https://developers.facebook.com/docs/reference/api/) · [Graph API 示例](https://developers.facebook.com/docs/reference/api/examples/) · [YouTube API](https://developers.google.com/youtube/) · [Twitter API 文档](https://dev.twitter.com/docs) · [Croft §3.4 Document Feeds](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 2. URI、URL 与 URN

爬虫以 URL 为生，因此必须精确地使用这些概念。注意 URI、URN 与 URL 之间的区别。

### 2.1 定义

**URI** 是用来标识资源的字符串。（有时它被展开为 "Universal Resource Identifier"；标准名称是 **Uniform** Resource Identifier。）

| 示例 URI | 类型 |
|---|---|
| `http://www.ics.uci.edu` | URL |
| ISBN 0-486-27777-3 | URN |
| `ftp://ftp.ics.uci.edu` | URL |

- **URL（定位符）**：必须指明资源**在哪里**。
- **URN（名称）**：只说明资源**是什么**。
- 本章关注的是 URL，但 “URI” 常被当作同义词混用。

### 2.2 URL 的组成

```text
scheme://domain:port/path?query_string#fragment_id
         \_________/
          authority
```

`scheme://domain` 是**必需的**；`:port/path?query_string#fragment_id` 是**可选的**。域名与端口合起来构成**授权部分**（authority）。完整情况稍微复杂一些（参见完整规范）。

两个带标注的 URL：

| URL | 各部分 |
|---|---|
| `http://www.ics.uci.edu/~lopes` | `http` = 位于 Web 服务器上 · `www.ics.uci.edu` = 没有端口，只有域名 · `~lopes` = 路径 |
| `http://calendar.ics.uci.edu/calendar.php?type=month&calendar=1&category=&month=02&year=2013` | 域名 `calendar.ics.uci.edu` · 路径 `calendar.php` · 查询 `type=month&calendar=1&category=&month=02&year=2013` |

**域名与子域名**：在 `calendar.ics.uci.edu` 中，**域名**是 `uci.edu`；`ics` 和 `calendar` 是子域名。

**绝对 URL 与相对 URL**，对爬虫至关重要：`<a href="http://www.ics.uci.edu/~algol/somesite.html">` 是绝对 URL；`<a href="/somesite.html">` 是相对 URL，必须相对于它所在的页面来解析。

动手试一试：逐步查看解析过程、查询参数和相对路径的解析（编辑 URL 后点击运行）：

```viz web-demo
{"title": "URL 的组成", "html": "<p>See the console.</p>", "js": "const urls = [\n  \"http://www.ics.uci.edu/~lopes\",\n  \"http://calendar.ics.uci.edu/calendar.php?type=month&calendar=1&category=&month=02&year=2013\"\n];\nfor (const s of urls) {\n  const u = new URL(s);\n  console.log(s);\n  console.log({ scheme: u.protocol, host: u.hostname, port: u.port, path: u.pathname, query: u.search, fragment: u.hash });\n}", "steps": [{"note": "The query string is a list of name=value pairs; category is present but empty.", "js": "\nconst q = new URL(urls[1]).searchParams;\nfor (const [name, value] of q) console.log(name, \"=\", JSON.stringify(value));"}, {"note": "Relative links are resolved against the page they appear on: a leading / restarts at the domain.", "js": "\nconst page = \"http://www.ics.uci.edu/~algol/somesite.html\";\nconsole.log(new URL(\"/somesite.html\", page).href);\nconsole.log(new URL(\"somesite.html\", page).href);"}, {"note": "Every optional part filled in (illustrative URL): port, path, query, fragment.", "js": "\nconst full = new URL(\"http://www.ics.uci.edu:8080/~lopes/index.html?lang=en#top\");\nconsole.log({ host: full.hostname, port: full.port, path: full.pathname, query: full.search, fragment: full.hash });"}], "height": 60, "interactive": true}
```

在 Python 中，`urllib.parse` 给出相同的各个部分：

```python
from urllib.parse import urlsplit, urljoin

p = urlsplit("http://calendar.ics.uci.edu/calendar.php"
             "?type=month&calendar=1&category=&month=02&year=2013")
print(p.scheme, p.hostname, p.port, p.path)
print(p.query)

page = "http://www.ics.uci.edu/~algol/somesite.html"
print(urljoin(page, "/somesite.html"))
print(urljoin(page, "somesite.html"))
```

```text
http calendar.ics.uci.edu None /calendar.php
type=month&calendar=1&category=&month=02&year=2013
http://www.ics.uci.edu/somesite.html
http://www.ics.uci.edu/~algol/somesite.html
```

> ⚠️ **易错点**：上面两个链接**并不是**同一个页面。在 `http://www.ics.uci.edu/~algol/somesite.html` 上，`href="/somesite.html"` 解析为 `http://www.ics.uci.edu/somesite.html`，开头的 `/` 去掉了 `~algol/`。在把每个链接加入队列之前，都要先解析（`urljoin`）。

> 📘 **延伸阅读**：[W3C：URL 规范](http://www.w3.org/Addressing/URL/url-spec.txt) · [Croft §3.2.1 Retrieving Web Pages（书中第 33 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **练习**：[§2.3](#23-练习)

### 2.3 练习

#### 拆解 URL

按照 `scheme://domain:port/path?query_string#fragment_id`，给出 (a) `http://www.ics.uci.edu/~lopes` 和 (b) `http://calendar.ics.uci.edu/calendar.php?type=month&calendar=1&category=&month=02&year=2013` 的每一个部分。(b) 中的域名是什么？哪些部分是必需的？

<details>
<summary>解答</summary>

| 组成部分 | (a) | (b) |
|---|---|---|
| 协议（scheme） | `http` | `http` |
| 域名（主机） | `www.ics.uci.edu` | `calendar.ics.uci.edu` |
| 端口 | 未写出（只有域名） | 未写出 |
| 路径 | `/~lopes` | `/calendar.php` |
| 查询字符串 | 无 | `type=month&calendar=1&category=&month=02&year=2013`，共 5 对；`category` 为空 |
| 片段（fragment） | 无 | 无 |

(b) 中的域名是 `uci.edu`（`ics`、`calendar` 是子域名）。只有 `scheme://domain` 是必需的。这些值与 `urlsplit` 以及 [§2.2](#22-url-的组成) 中的演示得到的结果相同。

</details>

#### URI、URL 还是 URN？

判断 `http://www.ics.uci.edu`、ISBN 0-486-27777-3 和 `ftp://ftp.ics.uci.edu` 各属于哪一类。

<details>
<summary>解答</summary>

三者都是 **URI**。`http://www.ics.uci.edu` 和 `ftp://ftp.ics.uci.edu` 是 **URL**，它们说明资源**在哪里**。ISBN 是 **URN**，它说明书**是什么**，而不是某一本副本在哪里。

</details>

## 3. 基本爬取算法

**爬虫**（crawler，或称 spider）是一个程序，它像人点击浏览一样，获取 HTML 页面并跟随其中的链接。在搜索引擎的架构图上，爬取属于 **文本获取（Text Acquisition）** 模块。

### 3.1 什么算是算法？

在写下爬取循环之前，先用 **Knuth 的定义** 检验它是否真的是一个算法。一个过程若具备以下性质，就是算法：

| 性质 | 要问的问题 |
|---|---|
| **有限性**（Finiteness） | 它是否会在有限步之后结束？ |
| **确定性**（Definiteness） | 每一步是否被严格且无歧义地规定？ |
| **输入**（Input） | 它是否有零个或多个输入？ |
| **输出**（Output） | 它是否有一个或多个与输入相关的输出？ |
| **有效性**（Effectiveness） | 每一步操作是否基础到一个人只用纸和笔就能完成？ |

设计爬取循环时要牢记这些性质：面对庞大且不断变化的网络（[搜索引擎与 Web](topic-search-engines.zh-CN.md)），要认真考虑有限性。

### 3.2 循环、待爬队列与伪代码

基本爬取算法：

1. 初始化一个 URL 队列，即**种子**（seeds）。
2. 重复以下步骤，直到队列中没有更多 URL：
   - 从队列中取出一个 URL；
   - 如果该页面允许爬取，则获取对应的页面；
   - 存储该页面的表示形式；
   - 从页面中提取 URL，并加入队列。

该队列称为**待爬队列**（frontier）。可以想象三个区域：**已爬取的网页**、**URL 待爬队列**，以及**网络的其余部分**。网络蜘蛛从种子页面出发：每次获取都把一个页面移入“已爬取”，而它的链接则把“网络的其余部分”中的新页面拉入待爬队列。

Croft 版本的伪代码：

```text
procedure CrawlerThread(frontier)
    while not frontier.done() do
        website ← frontier.nextSite()
        url ← website.nextURL()
        if website.permitsCrawl(url) then
            text ← retrieveURL(url)
            storeDocument(url, text)
            for each url in parse(text) do
                frontier.addURL(url)
            end for
        end if
        frontier.releaseSite(website)
    end while
end procedure
```

两项主要工作：**在获得授权的前提下下载网页，并发现新的 URL**。`website.permitsCrawl(url)` 这一调用提出了一个问题：*怎么知道网站是否允许爬取？*（[§4](#4-爬取许可robotstxt)）待爬队列先交出一个*站点*，然后再从中取出一个 URL；**礼貌性**就在这里生效（[§7](#7-礼貌性与性能)）。

下面的演示爬取一张图：四个主机（`www.cs.umass.edu`、`www.bbc.co.uk`、`www.whitehouse.gov`、`www.cnn.com`），每个主机三页，页面之间既有站内链接也有跨站链接；箭头标出 `nextSite()` 与 `nextURL()`。它从 umass 和 cnn 的首页开始。可以逐步查看，也可以编辑图结构后点击运行：

```viz crawl-frontier
{"title": "基本爬取：“爬虫眼中的网络”", "web": "www.cs.umass.edu/index.html -> www.cs.umass.edu/courses, www.cs.umass.edu/news; www.cs.umass.edu/news -> www.bbc.co.uk/index.html, www.cnn.com/2006/09/story.html; www.bbc.co.uk/index.html -> www.bbc.co.uk/today, www.bbc.co.uk/2005/story.html; www.bbc.co.uk/2005/story.html -> www.whitehouse.gov/index.html; www.whitehouse.gov/index.html -> www.whitehouse.gov/news.html, www.whitehouse.gov/about.html; www.cnn.com/index.html -> www.cnn.com/2006/09/story.html, www.cnn.com/2003/04/story.html", "seeds": "www.cs.umass.edu/index.html, www.cnn.com/index.html", "interactive": true}
```

全部 12 个页面以 FIFO（广度优先）的顺序，在 12 次获取中被爬取。`www.cnn.com/2006/09/story.html` 被链接了两次，但只入队一次：待爬队列会记住它见过哪些 URL。

> ⚠️ **易错点**：“重复直到队列中没有更多 URL”只有在待爬队列拒绝已经见过的 URL 时才会结束。没有已见集合，两个互相链接的页面就会无限循环。这与重复*内容*的检测不同（[§9](#9-重复数据噪声客户端脚本与深网)）。

> 📘 **延伸阅读**：[Croft §3.2 Crawling the Web（书中第 32 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.2.2 The Web Crawler（书中第 35 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 4. 爬取许可：robots.txt

**爬取前先礼貌地询问网站是否允许你爬取。** **机器人排除标准**（Robots Exclusion Standard），又称 `robots.txt`，是网站可以放在根目录下的一个文件（`http://www.cnn.com/robots.txt`、`http://en.wikipedia.org/robots.txt`）。它的语法非常简单。多年来它没有正式标准，只是一种约定；之后它被写成了 RFC 9309。它依靠**君子协定**运作，**它不是安全机制**：忽略它的爬虫仍然能拿到页面。

### 4.1 五个经典示例

来自 robotstxt.org：

| 目标 | robots.txt |
|---|---|
| 禁止所有机器人访问整个服务器 | `User-agent: *` / `Disallow: /` |
| 允许所有机器人完全访问 | `User-agent: *` / `Disallow:`（留空） |
| 禁止所有机器人访问站点的一部分 | `User-agent: *` / `Disallow: /cgi-bin/` / `Disallow: /tmp/` / `Disallow: /junk/` |
| 禁止单个机器人 | `User-agent: BadBot` / `Disallow: /` |
| 允许单个机器人 | `User-agent: Google` / `Disallow:` — 空行 — `User-agent: *` / `Disallow: /` |

（` / ` 用于分隔文件中的各行。）`Disallow:` 后面留空，表示不禁止任何内容，即“全部允许”。`Disallow: /` 禁止一切，因为每个路径都以 `/` 开头。

> 💡 **关键洞见**：**有一条优先级规则**：如果存在专门针对某个机器人的分组，那么对该机器人适用的规则**只有**该分组中的规则。在“允许单个机器人”的例子中，Google 只读取自己的分组（`Disallow:` 即全部允许），而永远看不到 `*` 分组中的 `Disallow: /`。

### 4.2 禁止文件夹中的 Allow

你可以禁止一个文件夹，同时允许其中的一个资源，例如一个列出你*希望*被索引的链接的页面。CNN 的文件有六行 `Sitemap:`、`User-agent: *`、若干 `Allow` 行，然后是约 35 行 `Disallow`（`/*.jsx$`、`/ads/`、`/aol/`、`/audio/`，……，`/partners/`，……，`/search/`，……，`/webview/`）。其中值得关注的是两对规则：`Allow: /audio/podcasts/` 与 `Disallow: /audio/`，以及 `Allow: /partners/ipad/live-video.json` 与 `Disallow: /partners/`。

为什么 `Allow` 会胜出？今天的规则（RFC 9309、Google 以及较新的 Python）是**最长匹配**：最长的匹配路径获胜，平局时 `Allow` 获胜。下面的演示把这一规则应用于 CNN 文件的节选版本：

```viz robots-txt
{"title": "CNN 的 robots.txt（节选）", "robots": "User-agent: *\nAllow: /audio/podcasts/\nAllow: /partners/ipad/live-video.json\nDisallow: /*.jsx$\nDisallow: /ads/\nDisallow: /audio/\nDisallow: /partners/\nDisallow: /search/", "urls": "/audio/podcasts/ep1.mp3, /audio/live.html, /partners/ipad/live-video.json, /partners/ipad/x.json, /2026/10/14/world/index.html, /video/player.jsx", "interactive": true}
```

允许访问的是：播客、`live-video.json` 和文章（没有规则匹配）。禁止访问的是：`/audio/live.html`、`/partners/ipad/x.json`，以及 `/video/player.jsx`（通配符规则 `/*.jsx$`）。用 Python 实现如下：

```python
from urllib.robotparser import RobotFileParser

rules = """User-agent: *
Allow: /audio/podcasts/
Allow: /partners/ipad/live-video.json
Disallow: /*.jsx$
Disallow: /audio/
Disallow: /partners/
"""
rp = RobotFileParser()
rp.parse(rules.splitlines())   # or set_url(...) + read()
for path in ["/audio/podcasts/ep1.mp3", "/audio/live.html",
             "/partners/ipad/live-video.json",
             "/video/player.jsx"]:
    url = "https://www.cnn.com" + path
    print(path, rp.can_fetch("MyCrawler", url))
```

```text
/audio/podcasts/ep1.mp3 True
/audio/live.html False
/partners/ipad/live-video.json True
/video/player.jsx False
```

这是在 Python 3.13 上的输出。在 Python 3.11 和 3.12 上，前三行相同，但最后一行是 `/video/player.jsx True`：旧版解析器不认识 `Disallow: /*.jsx$` 中的 `*` 和 `$`。

> ⚠️ **易错点**：较旧版本的 Python robotparser（已测试 3.11.18 和 3.12.3）会采用文件中**第一条匹配的行**，并且把 `*` 和 `$` 当作字面字符。CNN 把 `Allow` 行放在最前面，因此只有 `/*.jsx$` 会出错。但如果把 `Disallow: /audio/` 放在 `Allow: /audio/podcasts/` 之上，旧解析器就会阻止播客（对这个文件，3.11.18 上 `can_fetch` 返回 `False`，3.13.18 上返回 `True`）。在演示中设置 `"match": "first"` 即可看到这一点。

> 📘 **延伸阅读**：[cnn.com/robots.txt](http://www.cnn.com/robots.txt) · [en.wikipedia.org/robots.txt](http://en.wikipedia.org/robots.txt) · [robotstxt.org: About /robots.txt](http://www.robotstxt.org/robotstxt.html) · [Croft §3.2.2 The Web Crawler（书中第 35 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **练习**：[§4.3](#43-练习)

### 4.3 练习

#### 哪条 robots.txt 规则适用？

共有五个 robots.txt 文件：(1) `User-agent: *` / `Disallow: /`；(2) `User-agent: *` / `Disallow:`；(3) `User-agent: *`，并有 `Disallow: /cgi-bin/`、`Disallow: /tmp/`、`Disallow: /junk/`；(4) `User-agent: BadBot` / `Disallow: /`；(5) `User-agent: Google` / `Disallow:`，然后空一行，再接 `User-agent: *` / `Disallow: /`。对每个文件，机器人 `BadBot`、`Google` 和 `MyCrawler` 是否可以获取 `/`、`/tmp/a.html` 和 `/index.html`？

<details>
<summary>解答</summary>

先选出分组（指名该机器人的分组优先于 `*`），再匹配路径。这些结果已用 Python 的 `urllib.robotparser` 验证（3.11.18 与 3.13.18 上完全相同）：

| 文件 | BadBot | Google | MyCrawler |
|---|---|---|---|
| (1) 全部禁止（`*`：`Disallow: /`） | 无 | 无 | 无 |
| (2) 全部允许（`*`：`Disallow:`） | 全部 | 全部 | 全部 |
| (3) 部分禁止（`*`：`/cgi-bin/`、`/tmp/`、`/junk/`） | `/`、`/index.html`（不含 `/tmp/a.html`） | 同上 | 同上 |
| (4) 禁止单个机器人（`BadBot`：`Disallow: /`） | 无 | 全部（没有分组适用） | 全部 |
| (5) 允许单个机器人（`Google`：`Disallow:` + `*`：`Disallow: /`） | 无 | **全部** | 无 |

最后一行正是优先级规则：Google 自己的分组允许一切，`*` 分组对它不适用。验证：

```viz robots-txt
{"title": "允许单个机器人与优先级规则", "robots": "User-agent: Google\nDisallow:\n\nUser-agent: *\nDisallow: /", "urls": "/index.html, /tmp/a.html", "agent": "Google"}
```

（robotparser 会把分组名作为子串匹配，因此 `Googlebot/2.1` 也会匹配 `Google` 分组；RFC 9309 要求精确匹配令牌。）

</details>

#### 禁止文件夹中的允许规则

某个 robots.txt（针对 `User-agent: *`）包含 `Allow: /audio/podcasts/`、`Allow: /partners/ipad/live-video.json`、`Disallow: /audio/` 和 `Disallow: /partners/`。判断 `/audio/podcasts/ep1.mp3`、`/audio/live.html`、`/partners/ipad/live-video.json` 和 `/partners/ipad/x.json` 各自是否允许访问。

<details>
<summary>解答</summary>

找出所有路径是 URL 路径前缀的规则，让最长的那条获胜：

| 路径 | 匹配的规则 | 胜出者 | 结论 |
|---|---|---|---|
| `/audio/podcasts/ep1.mp3` | `Allow: /audio/podcasts/`（16），`Disallow: /audio/`（7） | Allow | **允许** |
| `/audio/live.html` | `Disallow: /audio/` | Disallow | 禁止 |
| `/partners/ipad/live-video.json` | `Allow: …/live-video.json`（30），`Disallow: /partners/`（10） | Allow | **允许** |
| `/partners/ipad/x.json` | `Disallow: /partners/` | Disallow | 禁止 |

这个文件夹是关闭的，只有网站希望被爬取的那个资源例外。只有 `Allow` 行被列在最前面，“先匹配者胜出”的规则才会得到相同的结果。代码如下：

```python
rules = [("Allow", "/audio/podcasts/"), ("Allow", "/partners/ipad/live-video.json"),
         ("Disallow", "/audio/"), ("Disallow", "/partners/")]

def allowed(path):
    hits = [(len(p), kind == "Allow") for kind, p in rules if path.startswith(p)]
    return max(hits)[1] if hits else True      # longest wins, Allow wins a tie

for path in ["/audio/podcasts/ep1.mp3", "/audio/live.html",
             "/partners/ipad/live-video.json", "/partners/ipad/x.json"]:
    print(path, allowed(path))
```

```text
/audio/podcasts/ep1.mp3 True
/audio/live.html False
/partners/ipad/live-video.json True
/partners/ipad/x.json False
```

</details>

## 5. Sitemap：提供给爬虫的信息

robots.txt 告诉爬虫**不要**去哪里。**Sitemap**（由 Google 推出）让网站管理员向爬虫提供**正面**信息：

- 它们包含 **URL 列表**，以及关于这些 URL 的数据，例如**修改时间**和**修改频率**。
- 它们**列在 robots.txt 中**（CNN 的前六行，以 `Sitemap: https://www.cnn.com/sitemaps/cnn/index.xml` 开头）。
- 它们由服务器管理员生成，通常通过脚本完成。
- 它们可以告诉爬虫那些**可能找不到的页面**，即没有被任何地方链接的页面。
- 它们给出页面的**相对重要性**，以及**何时该检查页面是否有变化**的提示（更新频率）。

CNN 的 `index.xml` 是一个 **sitemap 索引**：一个 `<sitemapindex>`，列出更多的 sitemap（`video-2020-01.xml`、`article-2020-01.xml`、…），每个都带有 `<lastmod>`。其中每一个都是一个 `<urlset>`，每个页面对应一个 `<url>`：

```xml
<url>
  <loc>https://www.cnn.com/2012/01/25/world/gallery/wus-us-mia/index.html</loc>
  <lastmod>2012-01-25T18:24:37Z</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.5</priority>
  <image:image>
    <image:loc>https://i2.cdn.turner.com/cnnnext/dam/assets/120111071718-jpac1-plane-story-top.jpg</image:loc>
    <image:caption>Gunnery Sgt. Bryon Bebout with the wreckage of a B-24 …</image:caption>
  </image:image>
</url>
```

`<loc>` = URL，`<lastmod>` = 修改时间，`<changefreq>` = 修改频率，`<priority>` = 相对重要性。爬虫用 `<lastmod>` 和 `<changefreq>` 来决定*何时*再次访问（[§10](#10-何时重新爬取新鲜度与年龄)）。

> 📘 **延伸阅读**：[CNN sitemap 索引](https://www.cnn.com/sitemaps/cnn/index.xml) · [Croft §3.2.6 Sitemaps](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 6. 为什么基本算法不够用

基本算法**理论上是正确的**，但在实践中**严重不足**。它：

| # | 问题 | 参见 |
|---|---|---|
| 1 | 会惹恼网站管理员（不礼貌），它在滥用 Web 服务器 | [§7](#7-礼貌性与性能) |
| 2 | 非常慢，一次只处理一个页面 | [§7](#7-礼貌性与性能) |
| 3 | 会陷入陷阱和无限序列 | [§8](#8-爬虫陷阱) |
| 4 | 会在不知情的情况下获取重复内容 | [§9](#9-重复数据噪声客户端脚本与深网) |
| 5 | 会引入数据噪声 | [§9](#9-重复数据噪声客户端脚本与深网) |
| 6 | 会因客户端脚本而遗漏内容 | [§9](#9-重复数据噪声客户端脚本与深网) |

重复与近似重复的数学原理在 [文档转换、存储与去重](topic-documents.zh-CN.md) 中讨论。

## 7. 礼貌性与性能

### 7.1 礼貌性

**避免过于频繁地访问任何网站：网站是为人服务的，而不是为机器人服务的。** 如果忽视礼貌性，你的爬虫就是一次**拒绝服务（DoS）攻击**。要保持礼貌：**对同一服务器的请求之间使用人为延迟**。

### 7.2 性能：爬虫大部分时间在等待

获取一个页面需要经过多次网络往返：

1. 爬虫（一个客户端程序）连接到 **DNS** 服务器。
2. DNS 把主机名翻译为 **IP 地址**。
3. 爬虫连接到服务器主机的特定 **端口**。
4. 它发送一个 **HTTP 请求** 获取该页面，通常是 `GET`。

粗略估算：每次获取 500 毫秒，**一次一个地抓取 100 万个页面需要 500,000 秒，约 5.8 天**，而服务器无响应时情况还会更糟。大部分时间里线程都在**等待网络数据**（[§7.4](#74-练习)）。

这一权衡的各步如下：

| | |
|---|---|
| 问题 | 网络爬虫花费大量时间**等待**请求的响应 |
| 解决方案 | 使用**线程**，一次获取数百个页面（或分布式地进行爬取，见 [§11](#11-分布式爬取)） |
| 缺点 | 爬虫可能会向网站**泛滥请求** |
| 缓解措施 | **礼貌策略**：例如把请求分散到不同服务器，对同一 Web 服务器的请求之间设置延迟，等等 |

使用线程时，礼貌性更难控制，但仍然可以做到，例如让不同的线程访问不同的服务器。

**在哪里执行礼貌策略？** 在 [§3.2](#32-循环待爬队列与伪代码) 的伪代码中，它可以放在 `website ← frontier.nextSite()` 中，也可以放在 `url ← website.nextURL()` 中。在演示中，每个主机在一次获取之后必须休息 2 个 tick；`nextSite()` 会跳过正在休息的主机，而当所有主机都在休息时，线程会等待：

```viz crawl-frontier
{"title": "礼貌性：每个主机休息 2 个 tick", "web": "www.cs.umass.edu/index.html -> www.cs.umass.edu/courses, www.cs.umass.edu/news; www.cs.umass.edu/news -> www.bbc.co.uk/index.html, www.cnn.com/2006/09/story.html; www.bbc.co.uk/index.html -> www.bbc.co.uk/today, www.bbc.co.uk/2005/story.html; www.bbc.co.uk/2005/story.html -> www.whitehouse.gov/index.html; www.whitehouse.gov/index.html -> www.whitehouse.gov/news.html, www.whitehouse.gov/about.html; www.cnn.com/index.html -> www.cnn.com/2006/09/story.html, www.cnn.com/2003/04/story.html", "seeds": "www.cs.umass.edu/index.html, www.cnn.com/index.html", "politeness": 2, "start": 8}
```

同样的 12 个页面现在需要 22 个 tick，而不是 12 个，其中 10 个用于等待。在单线程下，礼貌性会耗费时间，这也是爬虫要用许多线程访问许多主机的原因。

### 7.3 DNS 查询

在任何获取之前，爬虫必须把域名转换为 IP 地址：`www.ics.uci.edu` → `128.195.1.83`。DNS 是一组分布式服务器：**延迟可能很高（2 秒并不罕见）**，常见实现是**阻塞式**的（一次只处理一个请求），而且结果会被**缓存**。若每次查询需要 800 毫秒，查询整个 Web 要多久？没有给出主机数量，按每百万个域名计算，约为 **9.3 天**（每次 2 秒则约 23 天）。

> 💡 **关键洞见**：爬虫是 **I/O 密集型**的（Go 中用 goroutine，Python 中用线程或异步 I/O），而按主机缓存 DNS 是最便宜的加速方法。

> 📘 **延伸阅读**：[Croft §3.2.1 Retrieving Web Pages（书中第 33 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.2.2 The Web Crawler（书中第 35 页）](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **练习**：[§7.4](#74-练习)

### 7.4 练习

#### 爬取 100 万个页面的时间

获取一个页面需要 500 毫秒。一次一个地爬取 100 万个页面需要多长时间？使用线程后会有什么变化？

<details>
<summary>解答</summary>

$10^6 \times 0.5\ \text{s} = 500{,}000\ \text{s}$ ≈ 138.9 小时 ≈ **5.8 天**，实际情况更糟（服务器无响应），而且几乎全部时间都在等待网络。若用 $k$ 个线程并行（分布在不同服务器上以保持礼貌），理想时间为 $500{,}000 / k$ 秒：10 个线程约 13.9 小时，100 个约 1.4 小时，500 个约 17 分钟。

```python
n, fetch = 1_000_000, 0.5            # pages, seconds per fetch
total = n * fetch
print(f"1 thread: {total:,.0f} s = {total/3600:.1f} h = {total/86400:.1f} days")
for k in (10, 100, 500):
    s = total / k
    print(f"{k:>3} threads: {s/3600:.1f} h = {s/60:.0f} min")
```

```text
1 thread: 500,000 s = 138.9 h = 5.8 days
 10 threads: 13.9 h = 833 min
100 threads: 1.4 h = 83 min
500 threads: 0.3 h = 17 min
```

</details>

#### 每次 DNS 查询 800 毫秒

一次 DNS 查询需要 800 毫秒，而且常见的解析器是阻塞式的（一次只处理一个请求）。“查询整个 Web”需要多长时间？

<details>
<summary>解答</summary>

没有给出主机数量，因此按每百万个名字计算：$10^6 \times 0.8\ \text{s} = 800{,}000\ \text{s} \approx 9.3$ 天；若每次 2 秒，约为 23 天。修复办法：**缓存**（一次查询可以服务于某个主机的所有 URL），并且不要阻塞，即并发地解析。

```python
n = 1_000_000
for lookup in (0.8, 2.0):
    s = n * lookup
    print(f"DNS at {lookup} s per name, per million names: {s:,.0f} s = {s/86400:.1f} days")
```

```text
DNS at 0.8 s per name, per million names: 800,000 s = 9.3 days
DNS at 2.0 s per name, per million names: 2,000,000 s = 23.1 days
```

</details>

## 8. 爬虫陷阱

**爬虫陷阱**可能会把爬虫永远困在一个站点上：Web 服务器返回不断变化的 URL 和内容，通常来自动态页面。陷阱可以是：

- **无意的**：例如**ICS 日历就是一个爬虫陷阱**。每个月份页面都链接到下一个月份，永无止境。
- **有意的**：一些网站管理员设置陷阱来惩罚不礼貌的爬虫（fleiner.com/bots），例如非常大的文档，它们在 robots.txt 中被禁止，目的是消耗资源，或破坏忽略 robots.txt 的爬虫中设计不良的解析器。

演示中的日历总是链接到一个从未见过的 URL（`?n=1`、`?n=2`、…），因此已见集合永远不起作用，只有 10 次获取的预算能让它停下来：

```viz crawl-frontier
{"title": "爬虫陷阱：ICS 日历", "web": "www.ics.uci.edu/ -> www.ics.uci.edu/calendar, www.ics.uci.edu/about; www.ics.uci.edu/about -> www.ics.uci.edu/", "seeds": "www.ics.uci.edu/", "trap": "www.ics.uci.edu/calendar", "maxFetches": 10}
```

该站点只有 3 个真实页面，但 10 次获取中有 8 次都花在了日历上，而待爬队列仍然没有清空。

> ⚠️ **易错点**：有意设置的陷阱针对的是**忽略 robots.txt** 的爬虫。遵守 robots.txt 是第一道防线；限制每个主机的页面数量或 URL 深度，以及发现几乎相同的页面，则可以捕获无意的陷阱。

> 📘 **延伸阅读**：[fleiner.com/bots — 让恶意机器人远离](http://www.fleiner.com/bots/)

## 9. 重复、数据噪声、客户端脚本与深网

**重复内容。** 完全重复与近似重复都非常普遍：副本、镜像站点、版本、垃圾信息、抄袭。研究发现，**30% 的网页是其他 70% 的[近似]重复**。它们几乎没有价值：对搜索引擎和用户来说都是噪声，用户应该只看到一份副本（也许附带一个“显示相似结果”的链接）。

| | 完全重复 | 近似重复 |
|---|---|---|
| 检测方法 | 简单：**哈希、校验和** | 较难：**页面指纹** |
| 常见程度 | 少见 | 常见 |

指纹方法本身（校验和、simhash 等）见 [文档转换、存储与去重](topic-documents.zh-CN.md)。

**数据噪声。** 页面包含与内容无关的部分，例如**广告、模板**（典型页面顶部有横幅广告，左右两栏环绕着真正的内容），而噪声会损害检索效果。**查找内容块**的技术之一是**标签的累积分布**（*文档斜率曲线*，Finn、Kushmerick 与 Smyth，2001）。图的横轴是**词元数**（0–3,500），纵轴是**标签数**（0–900）。曲线在标签密集处上升，而在**“文本区域”**（约 1,000–1,500 个词元）几乎变平，那里就是正文。文献中还有其他技术。

**客户端脚本。** 现代网站大量使用脚本（JavaScript、TypeScript），内容隐藏在 `XMLHttpRequest` 之后。要获取这些内容，必须与脚本交互，即**用户交互模拟**（例如 Selenium），而这很困难。大多数爬虫不这样做，因此这些内容从未被索引。

**深网**是爬虫很少涉足的地方：隐藏在**登录表单**之后的内容、隐藏在 **JavaScript/TypeScript** 之后的内容，以及**没有被任何地方链接**的站点（站点地图有助于处理后两类，见 [§5](#5-sitemap提供给爬虫的信息)）。据估计，它的规模是**浅网的 400–500 倍**。

> 📘 **延伸阅读**：[深网估计（doi:10.3998/3336451.0007.104）](http://dx.doi.org/10.3998/3336451.0007.104) · [Croft §3.2.5 Deep Web](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.7 Detecting Duplicates](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.8 Removing Noise](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 10. 何时重新爬取：新鲜度与年龄

### 10.1 新鲜度

页面会不断被**添加、删除和修改**。**过时的**副本不再反映真实的页面，因此爬虫必须反复**重新访问**，以维持**新鲜度**（freshness）。HTTP 的 **`HEAD`** 请求返回的是页面的*相关信息*，而不是页面本身：

```text
Client request:  HEAD /csinfo/people.html HTTP/1.1
                 Host: www.cs.umass.edu

Server response: HTTP/1.1 200 OK
                 Date: Thu, 03 Apr 2008 05:17:54 GMT
                 Server: Apache/2.0.52 (CentOS)
                 Last-Modified: Fri, 04 Jan 2008 15:28:39 GMT
                 ETag: "239c33-2576-2a2837c0"
                 Accept-Ranges: bytes
                 Content-Length: 9590
                 Connection: close
                 Content-Type: text/html; charset=ISO-8859-1
```

要看的关键头部是 **`Last-Modified`**：把它与你存储副本的日期做比较。你可以自己试一试：

```bash
curl --head https://www.ics.uci.edu/~algol/index.html
```

你无法持续检查每个页面，因此应该检查**重要的**和**经常变化的**页面。**新鲜度**是集合中新鲜页面所占的比例，而优化它是**危险的**：一个总在更新的站点，在你的副本中几乎永远不是新鲜的，因此一个以新鲜度最大化为目标的引擎会*停止爬取它*。另一个指标是**年龄**。

### 10.2 新鲜度与年龄

在同一条时间轴上：爬取、更新、爬取、更新、爬取。

| 事件 | 新鲜度 | 年龄 |
|---|---|---|
| 爬取 | 1（副本与页面一致） | 0 |
| 爬取之后页面更新 | 降为 0 | 从 0 开始线性增长 |
| 下次爬取前又发生更新 | 保持为 0 | 继续增长（从*第一次错过的*变化开始计时） |
| 下一次爬取 | 恢复为 1 | 恢复为 0 |

新鲜度是非真即假的阶跃；年龄衡量副本**过时了多久**。

### 10.3 期望年龄

页面在上次爬取后 $t$ 天的期望年龄是：

$$\text{Age}(\lambda, t) = \int_0^t P(\text{page changed at time } x)\,(t - x)\,dx$$

$P(\text{page changed at time } x)$ 是页面在时刻 $x$ 发生变化的概率；$(t - x)$ 是该变化与现在之间的时间，即副本已经过时了多久。平均而言，更新服从**泊松过程**（Cho & Garcia-Molina，2003），因此到下一次更新的时间服从**指数分布**，其均值为变化频率 $\lambda$（每天的变化次数）：

$$\text{Age}(\lambda, t) = \int_0^t \lambda e^{-\lambda x}\,(t - x)\,dx = t - \frac{1 - e^{-\lambda t}}{\lambda}$$

对于 $\lambda = 1/7$（每周一次变化），且 $t$ 从 0 到约 7 天，曲线**向上弯曲**：$t = 2$ 时为 0.26，$t = 4$ 时为 0.95，$t = 6$ 时为 1.97，$t = 7$ 时为 $7/e \approx 2.58$。数值积分与闭式解一致：

```python
from math import exp

lam = 1 / 7                                   # one change per week, per day

def age(t):                                   # closed form
    return t - (1 - exp(-lam * t)) / lam

def age_numeric(t, n=100_000):                # midpoint rule on the integral
    dx = t / n
    return sum(lam * exp(-lam * x) * (t - x) * dx
               for x in ((i + 0.5) * dx for i in range(n)))

for t in (1, 2, 4, 6, 7):
    print(t, round(age(t), 2), round(age_numeric(t), 2))
print(7 / exp(1))
```

```text
1 0.07 0.07
2 0.26 0.26
4 0.95 0.95
6 1.97 1.97
7 2.58 2.58
2.5751560882000963
```

> 💡 **关键洞见**：“页面越老，不去爬取它的代价就越大”：期望年龄的增长*快于*线性，因此每多等一天的代价都比前一天更大，对 $\lambda$ 较大的页面而言尤其如此。

> 📘 **延伸阅读**：[Croft §3.2.3 Freshness](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **练习**：[§10.4](#104-练习)

### 10.4 练习

#### 每周变化一次时的期望年龄

若 $\lambda = 1/7$（每天的变化次数），页面在爬取后 2、4、6 和 7 天的期望年龄分别是多少？

<details>
<summary>解答</summary>

对 $\lambda e^{-\lambda x}(t - x)$ 从 0 积分到 $t$，得到 $\text{Age}(\lambda, t) = t - (1 - e^{-\lambda t})/\lambda$：

| $t$（天） | 1 | 2 | 4 | 6 | 7 |
|---|---|---|---|---|---|
| 期望年龄（天） | 0.07 | 0.26 | 0.95 | 1.97 | 2.58 |

曲线在右端升至约 2.5，并向上弯曲；在 $t = 7$ 时，年龄恰好为 $7e^{-1}$。第 4 天到第 6 天的期望年龄增加了约 1 天，而第 0 天到第 2 天只增加了约 0.26。

</details>

## 11. 分布式爬取

使用多台计算机进行爬取有三个理由：

1. 它让爬虫**更接近它所爬取的站点**，从而降低网络需求。
2. 它**减少每个爬虫需要记住的站点数量**，从而降低本地内存需求。
3. 它总体上**减少了本地所需的资源**。

分布式爬虫可能会用**哈希函数**，根据 URL 的**主机部分**把 URL 分配给计算机或线程，这样每个主机只由一个爬虫负责，从而能保持礼貌。[§3.2](#32-循环待爬队列与伪代码) 中的 `CrawlerThread` 伪代码把 `frontier` 作为参数，是有原因的：**待爬队列的信息应当共享**（一个已见集合，一份礼貌性状态）。

> 📘 **延伸阅读**：[Croft §3.2.7 Distributed Crawling](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 12. 其他类型的爬取：聚焦、桌面与文档订阅源

**聚焦爬取**（focused crawling）只下载与**某个特定主题**相关（或围绕特定时间事件）的页面，用于垂直搜索，或为某一主题改进搜索引擎。同一主题的页面往往**链接到同一主题的页面**；热门页面可以作为种子（例如用户搜索某个关键词后点击最多的页面），并由**文本分类器**判断页面是否属于该主题。

**桌面爬取**（desktop crawls）用于桌面与企业搜索，它与 Web 爬取不同：数据更容易找到（文件系统类似于站点地图）；对更新做出快速响应更为重要；它们必须节省磁盘、内存和 CPU，并且对用户透明；必须处理多种文档格式；数据隐私也重要得多。

**文档订阅源**（document feed）。许多文档只是被**发布**，即创建一次，很少更新，例如新闻、博客文章、新闻稿和电子邮件。来自同一来源的已发布文档形成一个序列，即文档订阅源；爬虫要在订阅源的**末尾**寻找新文档。订阅源有两种类型：

- **推送订阅源**（push feed）会提醒订阅者有新文档，例如新闻社的订阅源。推送需要订阅，例如 **WebSub**。
- **拉取订阅源**（pull feed）要求订阅者定期检查新文档。最常见的拉取格式是 **RSS**，即 Really Simple Syndication / RDF Site Summary / Rich Site Summary。

RSS 示例：

```xml
<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Search Engine News</title>
    <link>http://www.search-engine-news.org/</link>
    <description>News about search engines.</description>
    <language>en-us</language>
    <pubDate>Tue, 19 Jun 2008 05:17:00 GMT</pubDate>
    <ttl>60</ttl>

    <item>
      <title>Upcoming SIGIR Conference</title>
      <link>http://www.sigir.org/conference</link>
      <description>The annual SIGIR conference is coming!
        Mark your calendars and check for cheap
        flights.</description>
      <pubDate>Tue, 05 Jun 2008 09:50:11 GMT</pubDate>
      <guid>http://search-engine-news.org#500</guid>
    </item>
    ...
    <item>
      <title>New Search Engine Textbook</title>
      <link>http://www.cs.umass.edu/search-book</link>
      <description>A new textbook about search engines
        will be published soon.</description>
      <pubDate>Tue, 05 Jun 2008 09:33:01 GMT</pubDate>
      <guid>http://search-engine-news.org#499</guid>
    </item>
  </channel>
</rss>
```

第一个 `<item>` 之前是**订阅源的频道信息**；每个 `<item>` 是**条目信息**；`<pubDate>` 和 `<ttl>` 是爬虫要读取的部分。对爬虫而言：

- `<ttl>`（存活时间）是内容应被缓存的时长，**单位为分钟**，这里是 60。
- 订阅源像网页一样通过 HTTP `GET` 访问；用 `HEAD` 检查订阅源是否有变化。
- 订阅源很容易解析（它就是 XML），新信息也容易找到：`GET`、解析，然后取出所有新的 `<item>` … `</item>` 条目。

> 📘 **延伸阅读**：[W3C WebSub](https://www.w3.org/TR/websub/) · [Croft §3.2.4 Focused Crawling](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.3 Crawling Documents and Email](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.4 Document Feeds](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 13. 伦理与法律

> 💡 **关键洞见**：**“你能做，不代表你就该做。”** 这是整个伦理讨论的主旨。

### 13.1 给机器人编写者的指南

这是 robotstxt.org 上的一份文本，写于 1993 年，年代虽久，但仍然非常切题：

| 准则 | 含义 |
|---|---|
| **再三考虑** | 你真的需要机器人吗？ |
| **承担责任** | 如果你的行为造成了问题，要能迅速采取行动加以应对 |
| **本地测试** | 在把爬虫放给别人之前，先逐步扩大范围 |
| **不占用资源** | Web 服务器首先是为人服务的。慢慢走，不要跑 |
| **保持跟进** | “了解你的机器人在做什么，并确保它始终处于控制之下，这一点至关重要” |

此外，还要**了解网站的爬取政策**，并**联系网站管理员**。例如 GitHub 的第 5 条“抓取与 API 使用限制”：研究人员可以抓取公开的非个人信息，*前提是*其成果为开放获取；档案管理人员可以抓取公开数据；为发送垃圾信息或出售用户个人信息（给猎头、招聘网站）而进行的抓取是被禁止的；所有使用都必须遵守 GitHub 的隐私声明。

### 13.2 伦理比法律的范围更大

*法律*只是*伦理问题*这个大圆圈中的一个小圆圈：很多合法的事情仍然是不道德的。

### 13.3 Web 与法律

Web 只有约三十年的历史，是一片“狂野的西部（或者说狂野的 Web……）”，法律很少、未经检验或已经过时，因此**你自己的判断和行为至关重要**。它诞生于 CERN，最初用于物理研究：Tim Berners-Lee 1989 年的提案，针对的是 CERN 中复杂演化系统的信息丢失问题，方案是一个分布式超文本系统。约 1993 年的第一个网站至今仍然在线，1993 年 NeXT 浏览器的截图也还在。

### 13.4 最早的 Web 搜索引擎

| 年份 | 引擎 | 新在哪里 |
|---|---|---|
| 1993 | W3Catalogue | 原始的目录 |
| 1993 | World Wide Web Wanderer | 第一个网络爬虫，最初用于测量 Web 的规模 |
| 1993 | JumpStation | 爬取、索引、搜索：第一个“现代”引擎 |
| 1994 | Excite | 早期商业 Web 的搜索引擎 |
| 1994 | WebCrawler | 全文索引 |
| 1996 | RankDex | 基于链接的排名，启发了 Google 的 PageRank |

（JumpStation 有时被写作 “JumpSearch”；它的搜索页标题为 "NCSA Mosaic – JumpStation II Document Search Page"。RankDex 基于链接的排名，是 [链接分析：HITS 与 PageRank](topic-link-analysis.zh-CN.md) 中 PageRank 的前身。）

> 📘 **延伸阅读**：[robotstxt.org: Guidelines for robot writers](http://www.robotstxt.org/guidelines.html) · [GitHub: scraping and API usage restrictions](https://help.github.com/en/github/site-policy/github-acceptable-use-policies#5-scraping-and-api-usage-restrictions) · [Berners-Lee's 1989 proposal](https://www.w3.org/History/1989/proposal.html) · [The first website](http://info.cern.ch/hypertext/WWW/TheProject.html) · [NeXT browser screenshot, 1993](http://info.cern.ch/NextBrowser1.html)

## 14. 隐私：你的爬虫留下了什么

隐私是双向的：**用户**和**提供者**都可能伤害对方，伤害可能来自**个人信息（隐私）**，也可能来自**内容（安全）**。网站可以发布**隐私声明**，说明它们收集什么以及如何使用。你的爬虫同样会留下记录：每一个请求都会进入 Web 服务器的访问日志，例如下面这些 Apache 日志行：

```text
66.249.66.18 - - [25/Jan/2012:00:18:27 -0800] "GET /xwiki/bin/export/Stats/CurrentYearActivity?format=rtf HTTP/1.1" 404 335 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
180.76.6.28 - - [25/Jan/2012:00:18:31 -0800] "GET / HTTP/1.1" 200 45 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"
66.249.66.18 - - [25/Jan/2012:00:19:02 -0800] "GET /calswim/coverage-s1.png HTTP/1.1" 200 961543 "-" "Googlebot-Image/1.0"
173.192.98.90 - - [25/Jan/2012:00:33:00 -0800] "GET / HTTP/1.1" 404 290 "-" "Python-urllib/2.4"
80.165.186.186 - - [25/Jan/2012:01:21:24 -0800] "GET /events-dataset-api/ HTTP/1.1" 200 3214 "http://www.kdnuggets.com/datasets/index.html" "Mozilla/5.0 (Windows NT 5.1; rv:9.0.1) Gecko/20100101 Firefox/9.0.1"
180.76.5.65 - - [25/Jan/2012:02:18:20 -0800] "GET / HTTP/1.1" 200 45 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; …
```

每一行都记录了客户端的 **IP**、**时间**、**请求**、**状态**、**字节数**、**来源页**（referrer）和**用户代理**（user agent）。Googlebot 和 Baiduspider 通过一个 URL 表明自己的身份；`Python-urllib/2.4` 是一个匿名脚本；那条 Firefox 日志则是一个人从 KDnuggets 点进来的。管理员可以看到谁在爬取什么、多久爬取一次。

> 💡 **关键洞见**：给你的爬虫一个诚实、可识别的 User-Agent。管理员正是通过这样的日志行，来决定是联系你还是封禁你。

> 📘 **延伸阅读**：[UCI 隐私声明](http://uci.edu/privacy.php)

> 📝 **练习**：[§14.1](#141-练习)

### 14.1 练习

#### 解读一条 Apache 日志

把下面这一行拆分为各个字段：`80.165.186.186 - - [25/Jan/2012:01:21:24 -0800] "GET /events-dataset-api/ HTTP/1.1" 200 3214 "http://www.kdnuggets.com/datasets/index.html" "Mozilla/5.0 (Windows NT 5.1; rv:9.0.1) Gecko/20100101 Firefox/9.0.1"`。它是机器人吗？（作为对比，同一份日志中另一行的用户代理是 `Python-urllib/2.4`，请求是 `GET / HTTP/1.1`，来源页是 `"-"`。）

<details>
<summary>解答</summary>

用 combined log format 的正则表达式解析：

```python
import re

line = ('80.165.186.186 - - [25/Jan/2012:01:21:24 -0800] "GET /events-dataset-api/ HTTP/1.1" 200 3214 '
        '"http://www.kdnuggets.com/datasets/index.html" '
        '"Mozilla/5.0 (Windows NT 5.1; rv:9.0.1) Gecko/20100101 Firefox/9.0.1"')
pat = re.compile(r'(\S+) (\S+) (\S+) \[([^\]]+)\] "([^"]*)" (\d+) (\d+|-) "([^"]*)" "([^"]*)"')
names = ["ip", "ident", "user", "time", "request", "status", "bytes", "referrer", "user agent"]
for name, v in zip(names, pat.match(line).groups()):
    print(f"{name:10} {v}")
```

```text
ip         80.165.186.186
ident      -
user       -
time       25/Jan/2012:01:21:24 -0800
request    GET /events-dataset-api/ HTTP/1.1
status     200
bytes      3214
referrer   http://www.kdnuggets.com/datasets/index.html
user agent Mozilla/5.0 (Windows NT 5.1; rv:9.0.1) Gecko/20100101 Firefox/9.0.1
```

| 字段 | 值 |
|---|---|
| 客户端 IP | `80.165.186.186` |
| 身份、用户 | `-`、`-`（未知） |
| 时间 | `25/Jan/2012:01:21:24 -0800` |
| 请求 | `GET /events-dataset-api/ HTTP/1.1` |
| 状态 | `200`（OK） |
| 字节数 | `3214` |
| 来源页 | `http://www.kdnuggets.com/datasets/index.html` |
| 用户代理 | Windows NT 5.1 上的 Firefox 9.0.1 |

这是一个人，而不是机器人：使用的是浏览器用户代理，并且是从 KDnuggets 的链接跳转过来的（来源页）。对比 `Python-urllib/2.4` 那一行：没有来源页，只有一个库的用户代理，是一个不说明运行者是谁的脚本。

</details>

## 15. 版权、合理使用与法律案例

**版权。** 智力成果，例如 Web 内容和源代码，受版权法保护：这是一种以美国宪法为基础、由法律授予的保护，适用于以有形媒介固定的原创作品，无论是否发表（copyright.gov）。那么你能使用网络上的材料吗？

**合理使用**（fair use）。为**批评、评论、新闻、教学、学术和研究**等目的而进行的复制，可能被视为合理使用，但这是一个非常模糊的领域。有四个因素决定某一具体使用是否合理：

1. **使用的目的与性质**，包括是否具有商业性，或是否为非营利的教育目的。
2. 受版权保护作品的**性质**。
3. 所使用部分的**数量与实质性**，相对于作品整体而言。
4. 对作品**潜在市场或价值**的影响。

**法律案例。** 两起案件都是依据“**侵占动产**（trespass to chattels）”获胜的，即干扰他人的财产，这里指他们的计算机系统。

| 案件 | 日期 | 发生了什么 | 裁决 |
|---|---|---|---|
| eBay vs. Bidder's Edge | 2000年5月24日 | eBay 阻止了 Bidder's Edge 的爬虫 | 故意、未经授权地干扰 eBay 的计算机系统，并造成损害 |
| American Airlines vs. FareChase | 2003年3月10日 | AA 阻止 FareChase 抓取 AA.com 的“web fares”（票价比较） | 故意、未经同意；损害了 AA 的网络和财产。同年晚些时候达成和解 |

> ⚠️ **易错点**：两起案件都与**爬取**有关（对服务器造成的负载，以及对服务器的未经授权使用），而不是复制文本。尊重 robots.txt 和礼貌性，不仅是良好的礼仪，也是法律层面的要求。

> 📘 **延伸阅读**：[copyright.gov](http://www.copyright.gov) · [Copyright FAQ](https://www.copyright.gov/help/faq/faq-general.html) · [Fair use (FL-102)](https://www.copyright.gov/fls/fl102.html) · [eBay v. Bidder's Edge (Justia)](https://law.justia.com/cases/federal/district-courts/FSupp2/100/1058/2478126/) · [AA v. FareChase injunction (EFF)](https://www.eff.org/document/preliminary-injunction-american-airlines-v-farechase-inc)

## 16. 速查与五条要点

| robots.txt | 含义 |
|---|---|
| `User-agent: Name` | 针对该机器人的分组；如果存在，则**只有**它的规则适用于该机器人 |
| `Disallow: /` / `Disallow:` | 禁止一切 / 不禁止任何内容 |
| `Disallow: /tmp/` | 禁止以 `/tmp/` 开头的路径 |
| `Disallow: /audio/` 下的 `Allow: /audio/podcasts/` | 在关闭的文件夹中重新开放一个资源（最长匹配获胜） |
| `Sitemap: URL` | 站点地图的位置 |

| 爬虫问题 | 解决办法 |
|---|---|
| 不礼貌 | 按主机设置人为延迟；在 `nextSite()` / `nextURL()` 中执行 |
| 慢（等待网络与 DNS） | 线程 / 分布式爬取；缓存 DNS |
| 陷阱 | 遵守 robots.txt；留意不断变化的 URL（例如 ICS 日历） |
| 重复内容 | 哈希 / 校验和（完全重复）、指纹（近似重复） |
| 噪声 | 内容块：标签的累积分布 |
| 客户端脚本 | 用户交互模拟（Selenium）；大多数爬虫会跳过它 |

| 术语 | 含义 |
|---|---|
| URL / URN / URI | 资源在哪里 / 资源是什么 / 两者的统称 |
| 待爬队列（frontier） | 等待爬取的 URL 队列；从种子开始 |
| `HEAD` | 只请求头部信息的 HTTP 请求（`Last-Modified`） |
| 新鲜度 | 集合中保持最新的副本所占的比例 |
| 年龄 | 副本已经过时多久；$\text{Age}(\lambda,t) = \int_0^t \lambda e^{-\lambda x}(t-x)\,dx$ |
| 分布式爬取 | 对**主机**做哈希后分配给爬虫；共享待爬队列 |
| 推送 / 拉取订阅源 | 发布者提醒你（WebSub）/ 你自己轮询（RSS，`<ttl>` 以分钟计） |
| 深网 | 隐藏在登录、脚本之后，或没有被链接；是浅网的 400–500 倍 |
| 侵占动产 | eBay v. Bidder's Edge 与 AA v. FareChase 案所依据的诉由（trespass to chattels） |

**五条要点**

1. 爬取循环：待爬队列 → 是否允许？ → 获取 → 存储 → 提取 → 加入**未见过的**链接（先解析相对 URL）；礼貌性位于 `nextSite()`/`nextURL()` 之中。
2. robots.txt：针对某个机器人的分组会完全覆盖 `*`；在被 `Disallow` 的文件夹中，`Allow` 依靠**最长匹配**获胜；它基于君子协定，而不是安全机制。
3. 爬取是 I/O 密集型的：100 万个页面 × 500 毫秒 ≈ 单线程下 5.8 天，因此要使用多个线程，并且对每个主机保持礼貌。
4. 优化**新鲜度**可能会让你放弃变化很快的站点；**年龄**随着自上次爬取以来的时间增长，而且增长快于线性。
5. “你能做，不代表你就该做”：遵循机器人编写者指南，标明你的机器人身份；并记住两起法律案例都与爬取有关（侵占动产）。
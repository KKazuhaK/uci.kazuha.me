# CS 121: Information Retrieval — Topic: Web Crawling

## Table of Contents

- [1. Acquiring Web Data: Four Flavors](#1-acquiring-web-data-four-flavors)
- [2. URIs, URLs and URNs](#2-uris-urls-and-urns)
- [3. The Basic Crawl Algorithm](#3-the-basic-crawl-algorithm)
- [4. Permission to Crawl: robots.txt](#4-permission-to-crawl-robotstxt)
- [5. Sitemaps: Information to Crawlers](#5-sitemaps-information-to-crawlers)
- [6. Why the Basic Algorithm Is Not Enough](#6-why-the-basic-algorithm-is-not-enough)
- [7. Politeness and Performance](#7-politeness-and-performance)
- [8. Crawler Traps](#8-crawler-traps)
- [9. Duplicates, Data Noise, Client-Side Scripting and the Deep Web](#9-duplicates-data-noise-client-side-scripting-and-the-deep-web)
- [10. When to Crawl Again: Freshness and Age](#10-when-to-crawl-again-freshness-and-age)
- [11. Distributed Crawling](#11-distributed-crawling)
- [12. Other Types of Crawling: Focused, Desktop, Document Feeds](#12-other-types-of-crawling-focused-desktop-document-feeds)
- [13. Ethics and the Law](#13-ethics-and-the-law)
- [14. Privacy: What Your Crawler Leaves Behind](#14-privacy-what-your-crawler-leaves-behind)
- [15. Copyright, Fair Use and Legal Cases](#15-copyright-fair-use-and-legal-cases)
- [16. Quick Reference & Top 5 Things to Remember](#16-quick-reference--top-5-things-to-remember)

> This chapter covers **text acquisition**: how a search engine gets its documents from the web in the first place. It sits at the front of the architecture described in [Search Engines & the Web](topic-search-engines.en-US.md); what the crawler stores is converted and deduplicated as described in [Document Conversion, Storage & Duplicates](topic-documents.en-US.md), and then indexed ([Inverted Indexes & Index Construction](topic-indexing.en-US.md)).

## 1. Acquiring Web Data: Four Flavors

Before any searching or ranking, the engine needs the data. There are four ways to acquire it from the web:

| Flavor | How it works | Notes |
|---|---|---|
| **Data dumps** | Sites package their data periodically and provide it as a "dump" | Wikipedia (it suggests you torrent it); arXiv bulk full-text access |
| **URL downloads** | Two steps: (1) find out the URLs of specific resources; (2) run a downloader over that list | E.g. "crawling" (!) SourceForge / GitHub for source code — or papers, pages, etc. Some sites use regular URLs: `http://link.springer.com/chapter/10.1007/978-3-642-34213-4_1`, `…_2`, …; Google Code's `http://code.google.com/p/python-for-android/downloads/list` |
| **Web APIs** | Sites provide (REST) interfaces for getting their data | Usually **higher-level** (no HTML parsing) but usually **restrictive** (only part of the data). Facebook Graph API, YouTube API, Twitter API, arXiv API, … |
| **Web crawling** | Like people: get HTML pages and other documents, **discovering new URLs as it goes** | Good for **changing** collections and **unknown** documents. Web admins don't like crawlers: they consume resources meant for people (the rest of this chapter is about exactly that tension) |

> 💡 **Key Insight**: Only crawling works when you don't know the URLs in advance; URL downloads need a predictable pattern like `…34213-4_1`, `…_2`.

> 📘 **Going further**: [Wikipedia: Database download](http://en.wikipedia.org/wiki/Wikipedia:Database_download) · [arXiv bulk data (S3)](https://arxiv.org/help/bulk_data_s3) · [arXiv API](https://arxiv.org/help/api/index) · [Facebook Graph API](https://developers.facebook.com/docs/reference/api/) · [Graph API examples](https://developers.facebook.com/docs/reference/api/examples/) · [YouTube API](https://developers.google.com/youtube/) · [Twitter API docs](https://dev.twitter.com/docs) · [Croft §3.4 Document Feeds](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 2. URIs, URLs and URNs

A crawler lives on URLs, so be precise about them. Pay attention to the difference between URI, URN and URL.

### 2.1 Definitions

A **URI** is a string of characters used to identify a resource. (It is sometimes expanded as "Universal Resource Identifier"; the standard name is **Uniform** Resource Identifier.)

| Example URI | Kind |
|---|---|
| `http://www.ics.uci.edu` | URL |
| ISBN 0-486-27777-3 | URN |
| `ftp://ftp.ics.uci.edu` | URL |

- **URL (locator)**: must specify **where** the resource is.
- **URN (name)**: just **what** it is.
- This chapter focuses on URLs, but "URI" often slips in as a synonym.

### 2.2 Anatomy of a URL

```text
scheme://domain:port/path?query_string#fragment_id
         \_________/
          authority
```

`scheme://domain` is **mandatory**; `:port/path?query_string#fragment_id` is **optional**. Together, domain and port form the **authority**. The full picture is slightly more complicated (see the full spec).

Two annotated URLs:

| URL | Parts |
|---|---|
| `http://www.ics.uci.edu/~lopes` | `http` = on a web server · `www.ics.uci.edu` = no port, just domain · `~lopes` = path |
| `http://calendar.ics.uci.edu/calendar.php?type=month&calendar=1&category=&month=02&year=2013` | domain `calendar.ics.uci.edu` · path `calendar.php` · query `type=month&calendar=1&category=&month=02&year=2013` |

**Domains and subdomains**: in `calendar.ics.uci.edu`, the **domain name** is `uci.edu`; `ics` and `calendar` are subdomains.

**Absolute vs. relative URLs** — essential for a crawler: `<a href="http://www.ics.uci.edu/~algol/somesite.html">` is absolute; `<a href="/somesite.html">` is relative and has to be resolved against the page it appears on.

Try it — step through the parsing, the query parameters and relative resolution (edit the URLs and press Run):

```viz web-demo
{"title": "Anatomy of a URL", "html": "<p>See the console.</p>", "js": "const urls = [\n  \"http://www.ics.uci.edu/~lopes\",\n  \"http://calendar.ics.uci.edu/calendar.php?type=month&calendar=1&category=&month=02&year=2013\"\n];\nfor (const s of urls) {\n  const u = new URL(s);\n  console.log(s);\n  console.log({ scheme: u.protocol, host: u.hostname, port: u.port, path: u.pathname, query: u.search, fragment: u.hash });\n}", "steps": [{"note": "The query string is a list of name=value pairs; category is present but empty.", "js": "\nconst q = new URL(urls[1]).searchParams;\nfor (const [name, value] of q) console.log(name, \"=\", JSON.stringify(value));"}, {"note": "Relative links are resolved against the page they appear on: a leading / restarts at the domain.", "js": "\nconst page = \"http://www.ics.uci.edu/~algol/somesite.html\";\nconsole.log(new URL(\"/somesite.html\", page).href);\nconsole.log(new URL(\"somesite.html\", page).href);"}, {"note": "Every optional part filled in (illustrative URL): port, path, query, fragment.", "js": "\nconst full = new URL(\"http://www.ics.uci.edu:8080/~lopes/index.html?lang=en#top\");\nconsole.log({ host: full.hostname, port: full.port, path: full.pathname, query: full.search, fragment: full.hash });"}], "height": 60, "interactive": true}
```

In Python, `urllib.parse` gives the same parts:

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

> ⚠️ **Pitfall**: The two links above are **not** the same page. On `http://www.ics.uci.edu/~algol/somesite.html`, `href="/somesite.html"` resolves to `http://www.ics.uci.edu/somesite.html` — the leading `/` drops `~algol/`. Resolve every link (`urljoin`) before you queue it.

> 📘 **Going further**: [W3C: URL specification](http://www.w3.org/Addressing/URL/url-spec.txt) · [Croft §3.2.1 Retrieving Web Pages](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **Practice**: [§2.3](#23-practice)

### 2.3 Practice

#### Take the URLs apart

Using `scheme://domain:port/path?query_string#fragment_id`, give every part of (a) `http://www.ics.uci.edu/~lopes` and (b) `http://calendar.ics.uci.edu/calendar.php?type=month&calendar=1&category=&month=02&year=2013`. What is the domain name in (b)? Which parts are mandatory?

<details>
<summary>Solution</summary>

| Part | (a) | (b) |
|---|---|---|
| scheme | `http` | `http` |
| domain (host) | `www.ics.uci.edu` | `calendar.ics.uci.edu` |
| port | none written (just the domain) | none written |
| path | `/~lopes` | `/calendar.php` |
| query string | none | `type=month&calendar=1&category=&month=02&year=2013` — 5 pairs; `category` is empty |
| fragment | none | none |

Domain name in (b): `uci.edu` (`ics`, `calendar` are subdomains). Only `scheme://domain` is mandatory. These are the same values `urlsplit` and the demo in [§2.2](#22-anatomy-of-a-url) produce.

</details>

#### URI, URL or URN?

Classify `http://www.ics.uci.edu`, ISBN 0-486-27777-3 and `ftp://ftp.ics.uci.edu`.

<details>
<summary>Solution</summary>

All three are **URIs**. `http://www.ics.uci.edu` and `ftp://ftp.ics.uci.edu` are **URLs** — they say **where** the resource is. The ISBN is a **URN** — it names **what** the book is, not where a copy is.

</details>

## 3. The Basic Crawl Algorithm

A **crawler** (or spider) is a program that, like a person clicking around, gets HTML pages and follows their links. On the architecture map of a search engine, crawling is the **Text Acquisition** box.

### 3.1 What counts as an algorithm?

Before writing the crawl loop down, ask whether it is an algorithm at all, using **Knuth's definition**. A procedure is an algorithm if it has:

| Property | The question to ask |
|---|---|
| **Finiteness** | Does it end after a finite number of steps? |
| **Definiteness** | Are the steps rigorously and unambiguously specified? |
| **Input** | Does it have zero or more inputs? |
| **Output** | Does it have one or more outputs related to the inputs? |
| **Effectiveness** | Are the operations basic enough for someone to perform them using pencil and paper only? |

Keep these in mind for the crawl loop — on a huge, ever-changing web ([Search Engines & the Web](topic-search-engines.en-US.md)), think hard about finiteness.

### 3.2 The loop, the frontier and the pseudocode

The basic crawl algorithm:

1. Initialize a queue of URLs — the **seeds**.
2. Repeat until there are no more URLs in the queue:
   - get one URL from the queue;
   - if the page can be crawled, fetch the associated page;
   - store a representation of the page;
   - extract the URLs from the page and add them to the queue.

The queue is called the **frontier**. Picture three zones — **crawled web pages**, the **URL frontier**, and **the rest of the web** — with the web spider starting from the seed pages: each fetch moves a page into "crawled", and its links pull new pages from "the rest of the web" into the frontier.

The pseudocode, in Croft's version:

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

Two major jobs: **download web pages if authorized, and discover new URLs**. The call `website.permitsCrawl(url)` raises the question *how do you know if the website allows you to crawl?* ([§4](#4-permission-to-crawl-robotstxt)). The frontier hands out a *site* first, then a URL from it; that is where politeness lives ([§7](#7-politeness-and-performance)).

The demo below uses a graph of four hosts with three pages each (`www.cs.umass.edu`, `www.bbc.co.uk`, `www.whitehouse.gov`, `www.cnn.com`), with links inside and across hosts and one machine, `crawler.searchengine.com`, talking to all four; arrows mark `nextSite()` and `nextURL()`. It starts from the umass and cnn index pages as seeds. Step through it, or edit the graph and press Run:

```viz crawl-frontier
{"title": "Basic crawl over “How the crawler sees the web”", "web": "www.cs.umass.edu/index.html -> www.cs.umass.edu/courses, www.cs.umass.edu/news; www.cs.umass.edu/news -> www.bbc.co.uk/index.html, www.cnn.com/2006/09/story.html; www.bbc.co.uk/index.html -> www.bbc.co.uk/today, www.bbc.co.uk/2005/story.html; www.bbc.co.uk/2005/story.html -> www.whitehouse.gov/index.html; www.whitehouse.gov/index.html -> www.whitehouse.gov/news.html, www.whitehouse.gov/about.html; www.cnn.com/index.html -> www.cnn.com/2006/09/story.html, www.cnn.com/2003/04/story.html", "seeds": "www.cs.umass.edu/index.html, www.cnn.com/index.html", "interactive": true}
```

All 12 pages are crawled in 12 fetches, in FIFO (breadth-first) order. `www.cnn.com/2006/09/story.html` is linked twice but queued once: the frontier remembers which URLs it has seen.

> ⚠️ **Pitfall**: "Repeat until no more URLs in queue" only ends if the frontier refuses URLs it has already seen — without a seen-set, two pages linking to each other loop forever. That's separate from duplicate *content* detection ([§9](#9-duplicates-data-noise-client-side-scripting-and-the-deep-web)).

> 📘 **Going further**: [Croft §3.2 Crawling the Web](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.2.2 The Web Crawler](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 4. Permission to Crawl: robots.txt

**Be polite: ask the website whether you may crawl it first.** The **Robots Exclusion Standard**, a.k.a. `robots.txt`, is a file that sites may put at their root (`http://www.cnn.com/robots.txt`, `http://en.wikipedia.org/robots.txt`). The syntax is very simple. For decades there was no formal standard (it was a convention); it has since been written up as RFC 9309. It works on an **honor basis** — **it's not a security mechanism**: a crawler that ignores it still gets the pages.

### 4.1 The five classic examples

From robotstxt.org:

| Goal | robots.txt |
|---|---|
| Exclude all robots from the whole server | `User-agent: *` / `Disallow: /` |
| Allow all robots complete access | `User-agent: *` / `Disallow:` (empty) |
| Exclude all robots from part of the site | `User-agent: *` / `Disallow: /cgi-bin/` / `Disallow: /tmp/` / `Disallow: /junk/` |
| Exclude a single robot | `User-agent: BadBot` / `Disallow: /` |
| Allow a single robot | `User-agent: Google` / `Disallow:` — blank line — `User-agent: *` / `Disallow: /` |

(` / ` separates lines of the file.) `Disallow:` followed by nothing disallows nothing, so it means "allow all". `Disallow: /` blocks everything, because every path starts with `/`.

> 💡 **Key Insight**: **There is a precedence rule**: if there is a section that is specific for a bot, the rules that are valid for that bot are **only** the rules in that section. In "allow a single robot", Google reads only its own group (`Disallow:` = everything allowed) and never sees the `*` group's `Disallow: /`.

### 4.2 Allow inside a Disallowed folder

You can disallow a folder but allow one resource in it — e.g. a page listing the links you *want* indexed. CNN's file is six `Sitemap:` lines, `User-agent: *`, the `Allow` lines, then about 35 `Disallow` lines (`/*.jsx$`, `/ads/`, `/aol/`, `/audio/`, … `/partners/`, … `/search/`, … `/webview/`). The interesting pairs are `Allow: /audio/podcasts/` vs `Disallow: /audio/` and `Allow: /partners/ipad/live-video.json` vs `Disallow: /partners/`.

Why does the `Allow` win? Today's rule (RFC 9309, Google, and recent Python) is **longest match**: the longest matching path wins, and `Allow` wins a tie. The demo applies it to an abridged copy of CNN's file:

```viz robots-txt
{"title": "CNN robots.txt, abridged", "robots": "User-agent: *\nAllow: /audio/podcasts/\nAllow: /partners/ipad/live-video.json\nDisallow: /*.jsx$\nDisallow: /ads/\nDisallow: /audio/\nDisallow: /partners/\nDisallow: /search/", "urls": "/audio/podcasts/ep1.mp3, /audio/live.html, /partners/ipad/live-video.json, /partners/ipad/x.json, /2026/10/14/world/index.html, /video/player.jsx", "interactive": true}
```

Allowed: the podcast, `live-video.json` and the article (no rule matches). Disallowed: `/audio/live.html`, `/partners/ipad/x.json`, and `/video/player.jsx` (wildcard rule `/*.jsx$`). In Python:

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

That is the output on Python 3.13. On Python 3.11 and 3.12 the first three lines are the same, but the last one is `/video/player.jsx True`: the older parser does not understand the `*` and `$` in `Disallow: /*.jsx$`.

> ⚠️ **Pitfall**: Older Pythons' robotparser (3.11.18 and 3.12.3 tested) takes the **first matching line in file order** and treats `*` and `$` literally. CNN lists its `Allow` lines first, so only `/*.jsx$` breaks — but put `Disallow: /audio/` *above* `Allow: /audio/podcasts/` and the old parser blocks the podcasts (`can_fetch` returned `False` on 3.11.18 and `True` on 3.13.18 for exactly that file). Set `"match": "first"` in the demo to see it.

> 📘 **Going further**: [cnn.com/robots.txt](http://www.cnn.com/robots.txt) · [en.wikipedia.org/robots.txt](http://en.wikipedia.org/robots.txt) · [robotstxt.org: About /robots.txt](http://www.robotstxt.org/robotstxt.html) · [Croft §3.2.2 The Web Crawler](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **Practice**: [§4.3](#43-practice)

### 4.3 Practice

#### Which robots.txt rule applies?

Five robots.txt files are in play: (1) `User-agent: *` / `Disallow: /`; (2) `User-agent: *` / `Disallow:`; (3) `User-agent: *` with `Disallow: /cgi-bin/`, `Disallow: /tmp/`, `Disallow: /junk/`; (4) `User-agent: BadBot` / `Disallow: /`; (5) `User-agent: Google` / `Disallow:`, a blank line, then `User-agent: *` / `Disallow: /`. For each file, may the robots `BadBot`, `Google` and `MyCrawler` fetch `/`, `/tmp/a.html` and `/index.html`?

<details>
<summary>Solution</summary>

First pick the group (a group naming the bot wins over `*`), then match the paths. These results were checked with Python's `urllib.robotparser` (identical on 3.11.18 and 3.13.18):

| File | BadBot | Google | MyCrawler |
|---|---|---|---|
| (1) Exclude all (`*`: `Disallow: /`) | none | none | none |
| (2) Allow all (`*`: `Disallow:`) | all | all | all |
| (3) Exclude part (`*`: `/cgi-bin/`, `/tmp/`, `/junk/`) | `/`, `/index.html` (not `/tmp/a.html`) | same | same |
| (4) Exclude a single robot (`BadBot`: `Disallow: /`) | none | all (no group applies) | all |
| (5) Allow a single robot (`Google`: `Disallow:` + `*`: `Disallow: /`) | none | **all** | none |

The last row is the precedence rule: Google's own group allows everything, and the `*` group doesn't apply to it. Check:

```viz robots-txt
{"title": "Allow a single robot + the precedence rule", "robots": "User-agent: Google\nDisallow:\n\nUser-agent: *\nDisallow: /", "urls": "/index.html, /tmp/a.html", "agent": "Google"}
```

(robotparser matches the group name as a substring, so `Googlebot/2.1` also gets the `Google` group; RFC 9309 wants the exact token.)

</details>

#### Allow inside a Disallowed folder

A robots.txt for `User-agent: *` has `Allow: /audio/podcasts/`, `Allow: /partners/ipad/live-video.json`, `Disallow: /audio/` and `Disallow: /partners/`. Decide `/audio/podcasts/ep1.mp3`, `/audio/live.html`, `/partners/ipad/live-video.json` and `/partners/ipad/x.json`.

<details>
<summary>Solution</summary>

Find every rule whose path is a prefix of the URL path, and let the longest one win:

| Path | Matching rules | Winner | Verdict |
|---|---|---|---|
| `/audio/podcasts/ep1.mp3` | `Allow: /audio/podcasts/` (16), `Disallow: /audio/` (7) | Allow | **allowed** |
| `/audio/live.html` | `Disallow: /audio/` | Disallow | disallowed |
| `/partners/ipad/live-video.json` | `Allow: …/live-video.json` (30), `Disallow: /partners/` (10) | Allow | **allowed** |
| `/partners/ipad/x.json` | `Disallow: /partners/` | Disallow | disallowed |

The folder is closed except for the resource the site wants crawled. First-match gives the same answers only because the `Allow` lines are listed first. As code:

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

## 5. Sitemaps: Information to Crawlers

robots.txt tells crawlers where **not** to go. **Sitemaps** (introduced by Google) let web masters send crawlers **positive** information:

- They contain **lists of URLs** and data about them, such as **modification time** and **modification frequency**.
- They're **listed in robots.txt** (CNN's first six lines, starting `Sitemap: https://www.cnn.com/sitemaps/cnn/index.xml`).
- They're generated by the server administrators, usually by scripts.
- They can tell the crawler about **pages it might not find** — pages that aren't linked from anywhere.
- They give the crawler their **relative importance** and a **hint about when to check a page for changes** (update frequency).

CNN's `index.xml` is a **sitemap index**: a `<sitemapindex>` listing more sitemaps (`video-2020-01.xml`, `article-2020-01.xml`, …), each with a `<lastmod>`. Each of those is a `<urlset>` with one `<url>` per page:

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

`<loc>` = URL, `<lastmod>` = modification time, `<changefreq>` = modification frequency, `<priority>` = relative importance. `<lastmod>` and `<changefreq>` are what a crawler uses to decide *when* to come back ([§10](#10-when-to-crawl-again-freshness-and-age)).

> 📘 **Going further**: [CNN sitemap index](https://www.cnn.com/sitemaps/cnn/index.xml) · [Croft §3.2.6 Sitemaps](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 6. Why the Basic Algorithm Is Not Enough

The basic algorithm is **theoretically correct** but **seriously lacking in practice**. It:

| # | Problem | Covered in |
|---|---|---|
| 1 | Will upset web admins (impolite) — it's abusing the web servers | [§7](#7-politeness-and-performance) |
| 2 | Is very slow — 1 page at a time | [§7](#7-politeness-and-performance) |
| 3 | Will get caught in traps and infinite sequences | [§8](#8-crawler-traps) |
| 4 | Will fetch duplicates without noticing | [§9](#9-duplicates-data-noise-client-side-scripting-and-the-deep-web) |
| 5 | Will bring in data noise | [§9](#9-duplicates-data-noise-client-side-scripting-and-the-deep-web) |
| 6 | Will miss content due to client-side scripting | [§9](#9-duplicates-data-noise-client-side-scripting-and-the-deep-web) |

The mathematics of duplicate and near-duplicate detection is treated in [Document Conversion, Storage & Duplicates](topic-documents.en-US.md).

## 7. Politeness and Performance

### 7.1 Politeness

**Avoid hitting any site too often: sites are for people, not for bots.** Ignore politeness and your crawler is a **denial-of-service (DoS) attack**. Be polite: **use artificial delays** between requests to the same server.

### 7.2 Performance: the crawler mostly waits

Retrieving one page takes several network round trips:

1. The crawler (a client program) connects to a **DNS** server.
2. DNS translates the host name into an **IP address**.
3. The crawler connects to the server host on a specific **port**.
4. It sends an **HTTP request** for the page, usually a `GET`.

Back of the envelope: at 500 ms per fetch, **1 million pages one at a time take 500,000 s ≈ 5.8 days** — and it's worse than that with unresponsive servers. Most of that time the thread is **waiting for network data** (worked out in [§7.4](#74-practice)).

The trade-off, step by step:

| | |
|---|---|
| Problem | Web crawlers spend a lot of time **waiting** for responses to requests |
| Solution | Use **threads** and fetch hundreds of pages at once (or distribute the crawl, [§11](#11-distributed-crawling)) |
| Drawback | Crawlers could **flood sites** with requests |
| Mitigation | **Politeness policies**: e.g. distribute requests between different servers, delay between requests to the same web server, … |

With threads, politeness is harder to control but possible, e.g. different threads on different servers.

**Where to enforce politeness?** In the pseudocode of [§3.2](#32-the-loop-the-frontier-and-the-pseudocode) it can be enforced in `website ← frontier.nextSite()` and in `url ← website.nextURL()`. In the demo each host must rest 2 ticks after a fetch; `nextSite()` skips resting hosts, and the thread waits when all of them are resting:

```viz crawl-frontier
{"title": "Politeness: 2-tick rest per host", "web": "www.cs.umass.edu/index.html -> www.cs.umass.edu/courses, www.cs.umass.edu/news; www.cs.umass.edu/news -> www.bbc.co.uk/index.html, www.cnn.com/2006/09/story.html; www.bbc.co.uk/index.html -> www.bbc.co.uk/today, www.bbc.co.uk/2005/story.html; www.bbc.co.uk/2005/story.html -> www.whitehouse.gov/index.html; www.whitehouse.gov/index.html -> www.whitehouse.gov/news.html, www.whitehouse.gov/about.html; www.cnn.com/index.html -> www.cnn.com/2006/09/story.html, www.cnn.com/2003/04/story.html", "seeds": "www.cs.umass.edu/index.html, www.cnn.com/index.html", "politeness": 2, "start": 8}
```

The same 12 pages now take 22 ticks instead of 12 — 10 spent waiting. With one thread politeness costs time, which is why crawlers spread many threads over many hosts.

### 7.3 DNS lookups

Before any fetch, the crawler must turn a domain name into an IP address: `www.ics.uci.edu` → `128.195.1.83`. DNS is a distributed set of servers: **latency can be high (2 s is not unusual)**, common implementations are **blocking** (one request at a time), and results are **cached**. At 800 ms per lookup, how long to look up the entire Web? With no host count given, per million names it is ≈ **9.3 days** (≈ 23 days at 2 s).

> 💡 **Key Insight**: A crawler is **I/O-bound** — goroutines in Go, threads or async I/O in Python — and caching DNS per host is the cheapest speed-up.

> 📘 **Going further**: [Croft §3.2.1 Retrieving Web Pages](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.2.2 The Web Crawler](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **Practice**: [§7.4](#74-practice)

### 7.4 Practice

#### Crawl time for 1 million pages

One page fetch takes 500 ms. How long does it take to crawl 1 million pages one at a time? What changes with threads?

<details>
<summary>Solution</summary>

$10^6 \times 0.5\ \text{s} = 500{,}000\ \text{s}$ ≈ 138.9 h ≈ **5.8 days** — worse in practice (unresponsive servers), and almost all of it waiting on the network. With $k$ threads in parallel (on different servers, to stay polite) the ideal is $500{,}000 / k$ s: 10 threads ≈ 13.9 h, 100 ≈ 1.4 h, 500 ≈ 17 min.

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

#### DNS lookups at 800 ms

One DNS lookup takes 800 ms, and common resolvers are blocking (one request at a time). How long would it take to "look up the entire Web"?

<details>
<summary>Solution</summary>

No host count is given, so per million names: $10^6 \times 0.8\ \text{s} = 800{,}000\ \text{s} \approx 9.3$ days; at 2 s, ≈ 23 days. Fixes: **cache** (one lookup serves all of a host's URLs) and don't block — resolve concurrently.

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

## 8. Crawler Traps

A trap **may trap the crawler on a site forever**: the web server responds with **ever-changing URLs and content**, typically from dynamic pages. Traps can be:

- **Unintentional**: e.g. **the ICS calendar is a crawler trap**. Every month page links to the next month, forever.
- **Intentional**: some web admins create traps to penalize impolite crawlers (fleiner.com/bots) — e.g. very large documents, *disallowed in robots.txt*, built to consume resources or break the poorly designed parsers of crawlers that ignore robots.txt.

The demo's calendar always links to a never-seen URL (`?n=1`, `?n=2`, …), so the seen-set never helps; only the 10-fetch budget stops it:

```viz crawl-frontier
{"title": "A crawler trap: the ICS calendar", "web": "www.ics.uci.edu/ -> www.ics.uci.edu/calendar, www.ics.uci.edu/about; www.ics.uci.edu/about -> www.ics.uci.edu/", "seeds": "www.ics.uci.edu/", "trap": "www.ics.uci.edu/calendar", "maxFetches": 10}
```

The site has 3 real pages, but 8 of the 10 fetches go to the calendar and the frontier is still not empty.

> ⚠️ **Pitfall**: The intentional traps are aimed at crawlers that **ignore robots.txt**. Honoring robots.txt is the first defense; a cap on pages per host / URL depth, and noticing near-identical pages, catch the unintentional ones.

> 📘 **Going further**: [fleiner.com/bots — keeping bad robots away](http://www.fleiner.com/bots/)

## 9. Duplicates, Data Noise, Client-Side Scripting and the Deep Web

**Duplicates.** Exact and near duplication are widespread: copies, mirror sites, versions, spam, plagiarism. Studies find **30% of web pages are [near-]duplicates of the other 70%**. They have little or no value: they're noise to the search engine and the user, who should see only one copy (perhaps with a "show similar" link).

| | Exact duplicates | Near duplicates |
|---|---|---|
| Detection | Easy: **hashes, checksums** | Harder: **page fingerprints** |
| How common | Rare | Common |

The fingerprinting methods themselves (checksums, simhash, and so on) are in [Document Conversion, Storage & Duplicates](topic-documents.en-US.md).

**Data noise.** Pages carry content not related to the page — **ads, templates** (a typical page has a top banner ad and left and right columns around the real content) — and noise hurts retrieval. **Finding content blocks**, technique 1: the **cumulative distribution of tags** (*document slope curve*, Finn, Kushmerick & Smyth, 2001). The plot has **token count** (0–3,500) on x and **tag count** (0–900) on y; it climbs where tags are dense and goes nearly **flat in the "text area"** (≈ 1,000–1,500 tokens) — the main content. Other techniques exist in the literature.

**Client-side scripting.** Modern sites are heavily scripted (JavaScript, TypeScript), with content behind `XMLHttpRequest`s. Reaching it means interacting with the scripts — **user-interaction emulation** (e.g. Selenium), which is hard; most crawlers don't, so that content is never indexed.

**The deep web** is the places crawlers rarely go: content behind **login forms**, content behind **JavaScript/TypeScript**, and sites that **aren't linked from anywhere** (sitemaps help with these, [§5](#5-sitemaps-information-to-crawlers)). It's estimated to be **400–500× larger than the shallow web**.

> 📘 **Going further**: [Deep web estimate (doi:10.3998/3336451.0007.104)](http://dx.doi.org/10.3998/3336451.0007.104) · [Croft §3.2.5 Deep Web](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.7 Detecting Duplicates](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.8 Removing Noise](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 10. When to Crawl Again: Freshness and Age

### 10.1 Freshness

Pages are constantly **added, deleted and modified**; **stale** copies no longer reflect the real pages, so the crawler must keep **revisiting** to maintain **freshness**. HTTP's **`HEAD`** request returns information *about* the page, not the page itself:

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

The key header is **`Last-Modified`**: compare it with the date of your stored copy. Try it yourself:

```bash
curl --head https://www.ics.uci.edu/~algol/index.html
```

You can't check every page constantly: check **important** and **frequently changing** pages. **Freshness** = the proportion of fresh pages in the collection, and optimizing it is **dangerous**: a site that is always updated is almost never fresh in your copy, so a freshness-maximizing engine would *stop crawling it*. Another metric: **age**.

### 10.2 Freshness vs. age

On one time axis — crawl, updates, crawl, update, crawl:

| Event | Freshness | Age |
|---|---|---|
| Crawl | 1 (copy matches the page) | 0 |
| Page updates after the crawl | drops to 0 | starts growing linearly from 0 |
| More updates before the next crawl | stays 0 | keeps growing (it counts from the *first* missed change) |
| Next crawl | back to 1 | back to 0 |

Freshness is a yes/no step; age measures **how long** the copy has been out of date.

### 10.3 Expected age

The expected age of a page $t$ days after it was last crawled:

$$\text{Age}(\lambda, t) = \int_0^t P(\text{page changed at time } x)\,(t - x)\,dx$$

$P(\text{page changed at time } x)$ is the probability the page changed at time $x$; $(t - x)$ is the time between that change and now — how long the copy has been stale. Updates follow a **Poisson process** on average (Cho & Garcia-Molina, 2003), so the time to the next update is **exponential** with mean change frequency $\lambda$ (changes per day):

$$\text{Age}(\lambda, t) = \int_0^t \lambda e^{-\lambda x}\,(t - x)\,dx = t - \frac{1 - e^{-\lambda t}}{\lambda}$$

For $\lambda = 1/7$ (one change per week) and $t$ from 0 to about 7 days, the curve bends **upward**: 0.26 at $t = 2$, 0.95 at $t = 4$, 1.97 at $t = 6$, $7/e \approx 2.58$ at $t = 7$. A numeric integration agrees with the closed form:

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

> 💡 **Key Insight**: "The older a page gets, the more it costs not to crawl it": expected age grows *faster* than linearly, so each extra day of waiting costs more than the last — sooner for pages with a large $\lambda$.

> 📘 **Going further**: [Croft §3.2.3 Freshness](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

> 📝 **Practice**: [§10.4](#104-practice)

### 10.4 Practice

#### Expected age for one change per week

With $\lambda = 1/7$ changes per day, what is the expected age of a page 2, 4, 6 and 7 days after it was crawled?

<details>
<summary>Solution</summary>

Integrating $\lambda e^{-\lambda x}(t - x)$ from 0 to $t$ gives $\text{Age}(\lambda, t) = t - (1 - e^{-\lambda t})/\lambda$:

| $t$ (days) | 1 | 2 | 4 | 6 | 7 |
|---|---|---|---|---|---|
| Expected age (days) | 0.07 | 0.26 | 0.95 | 1.97 | 2.58 |

The curve rises to about 2.5 at the right edge, bending upward; at $t = 7$ the age is exactly $7e^{-1}$. Days 4→6 add ≈ 1 day of expected age; days 0→2 added only ≈ 0.26.

</details>

## 11. Distributed Crawling

Three reasons to use multiple computers for crawling:

1. It puts the crawler **closer to the sites it crawls** → lower network requirements.
2. It **reduces the number of sites each crawler has to remember** → lower local memory requirements.
3. It **reduces the locally required resources** in general.

Distributed crawlers may use a **hash function to assign URLs** to computers/threads, computed on the **host part** of each URL — so one crawler owns each host and can keep it polite. The `CrawlerThread` pseudocode ([§3.2](#32-the-loop-the-frontier-and-the-pseudocode)) takes the `frontier` as its argument for a reason: **the frontier information should be shared** (one seen-set, one politeness state).

> 📘 **Going further**: [Croft §3.2.7 Distributed Crawling](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 12. Other Types of Crawling: Focused, Desktop, Document Feeds

**Focused crawling** downloads only pages **about a particular topic** (or around specific events in time), for vertical search or to improve an engine on one topic. Pages on a topic tend to **link to pages on the same topic**; popular pages are the seeds (e.g. pages many users click after searching a keyword), and a **text classifier** decides whether a page is on topic.

**Desktop crawls**, for desktop and enterprise search, differ from web crawling: data is much easier to find (file system ~ sitemap); responding quickly to updates matters more; they must be conservative with disk, memory and CPU (transparent to the user); they must cope with many document formats; and data privacy matters much more.

**Document feeds.** Many documents are just **published** — created once and rarely updated (news, blog posts, press releases, e-mail). Published documents from one source form a sequence, a **document feed**; crawlers find new documents at **the end of the feed**. Two types:

- A **push feed** alerts the subscriber to new documents (e.g. news agencies). Push involves a subscription, e.g. **WebSub**.
- A **pull feed** requires the subscriber to check periodically for new documents. The most common pull format is **RSS** — Really Simple Syndication / RDF Site Summary / Rich Site Summary.

An RSS example:

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

Everything before the first `<item>` is the **feed channel info**; each `<item>` is **item info**; the `<pubDate>`s and `<ttl>` are what the crawler reads. For crawlers:

- `<ttl>` (time to live) is how long, **in minutes**, the contents should be cached — here 60.
- Feeds are accessed like web pages, with HTTP `GET`; use `HEAD` to check whether the feed changed.
- Feeds are easy to parse (just XML), and new information is easy to find: `GET`, parse, and grab any new `<item>` … `</item>` entries.

> 📘 **Going further**: [W3C WebSub](https://www.w3.org/TR/websub/) · [Croft §3.2.4 Focused Crawling](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.3 Crawling Documents and Email](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf) · [Croft §3.4 Document Feeds](https://ciir.cs.umass.edu/downloads/SEIRiP.pdf)

## 13. Ethics and the Law

> 💡 **Key Insight**: **"Just because you can, doesn't mean you should."** This is the main point of the whole ethics discussion.

### 13.1 Guidelines for bot writers

An old (1993!) but still very relevant text from robotstxt.org:

| Guideline | Meaning |
|---|---|
| **Reconsider** | Do you really need a bot? |
| **Be accountable** | If your actions cause problems, be available to take prompt action in response |
| **Test locally** | Expand the scope gradually before you unleash your crawler on others |
| **Don't hog resources** | Web servers are for people primarily. Walk, don't run |
| **Stay with it** | "It's vital to know what your robot is doing, and that it remains under control" |

Also **find out the site's crawling policy** and **contact the web admins**. An example policy is GitHub's §5 "Scraping and API Usage Restrictions": researchers may scrape public, non-personal information *if* their publications are open access; archivists may scrape public data; scraping for spam or to sell user personal information (to recruiters, headhunters, job boards) is forbidden; all use must follow GitHub's Privacy Statement.

### 13.2 Ethics is bigger than law

*Laws* is a small circle inside the large circle of *Ethical Issues*: much that is legal is still unethical.

### 13.3 The Web and the law

The Web is only about three decades old — a "Wild Wild West (or Wild Wild Web…)" with very few laws, untested or outdated, so **your own judgments and actions matter**. It was born at CERN for physics research: Tim Berners-Lee's 1989 proposal addresses the loss of information about complex evolving systems at CERN with a distributed hypertext system. A copy of the first website from about 1993 is still online, as is a 1993 NeXT browser screenshot.

### 13.4 The first web search engines

| Year | Engine | What was new |
|---|---|---|
| 1993 | W3Catalogue | Primitive catalogue |
| 1993 | World Wide Web Wanderer | First web crawler, built to measure the size of the web |
| 1993 | JumpStation | Crawling, indexing, searching: first "modern" engine |
| 1994 | Excite | Search engine of the early commercial web |
| 1994 | WebCrawler | Full-text indexing |
| 1996 | RankDex | Link-based ranking that inspired Google's PageRank |

(JumpStation is sometimes listed as "JumpSearch"; its search page was titled "NCSA Mosaic – JumpStation II Document Search Page". RankDex's link-based ranking is the ancestor of the PageRank in [Link Analysis: HITS & PageRank](topic-link-analysis.en-US.md).)

> 📘 **Going further**: [robotstxt.org: Guidelines for robot writers](http://www.robotstxt.org/guidelines.html) · [GitHub: scraping and API usage restrictions](https://help.github.com/en/github/site-policy/github-acceptable-use-policies#5-scraping-and-api-usage-restrictions) · [Berners-Lee's 1989 proposal](https://www.w3.org/History/1989/proposal.html) · [The first website](http://info.cern.ch/hypertext/WWW/TheProject.html) · [NeXT browser screenshot, 1993](http://info.cern.ch/NextBrowser1.html)

## 14. Privacy: What Your Crawler Leaves Behind

Privacy runs both ways: **users** and **providers** can each harm the other, through **personal information (privacy)** and through **content (security)**. Sites may publish **privacy statements** — what they collect and how it's used. Your crawler is on the record too: every request lands in the web server's access log, e.g. Apache lines like these:

```text
66.249.66.18 - - [25/Jan/2012:00:18:27 -0800] "GET /xwiki/bin/export/Stats/CurrentYearActivity?format=rtf HTTP/1.1" 404 335 "-" "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
180.76.6.28 - - [25/Jan/2012:00:18:31 -0800] "GET / HTTP/1.1" 200 45 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"
66.249.66.18 - - [25/Jan/2012:00:19:02 -0800] "GET /calswim/coverage-s1.png HTTP/1.1" 200 961543 "-" "Googlebot-Image/1.0"
173.192.98.90 - - [25/Jan/2012:00:33:00 -0800] "GET / HTTP/1.1" 404 290 "-" "Python-urllib/2.4"
80.165.186.186 - - [25/Jan/2012:01:21:24 -0800] "GET /events-dataset-api/ HTTP/1.1" 200 3214 "http://www.kdnuggets.com/datasets/index.html" "Mozilla/5.0 (Windows NT 5.1; rv:9.0.1) Gecko/20100101 Firefox/9.0.1"
180.76.5.65 - - [25/Jan/2012:02:18:20 -0800] "GET / HTTP/1.1" 200 45 "-" "Mozilla/5.0 (compatible; Baiduspider/2.0; …
```

Each line records client **IP**, **time**, **request**, **status**, **bytes**, **referrer** and **user agent**. Googlebot and Baiduspider identify themselves with a URL; `Python-urllib/2.4` is an anonymous script; the Firefox line is a person coming from KDnuggets. The admin sees who crawls what, how often.

> 💡 **Key Insight**: Give your crawler an honest, identifying User-Agent. The log line is how a web admin decides whether to contact you or to block you.

> 📘 **Going further**: [UCI privacy statement](http://uci.edu/privacy.php)

> 📝 **Practice**: [§14.1](#141-practice)

### 14.1 Practice

#### Reading an Apache log line

Split `80.165.186.186 - - [25/Jan/2012:01:21:24 -0800] "GET /events-dataset-api/ HTTP/1.1" 200 3214 "http://www.kdnuggets.com/datasets/index.html" "Mozilla/5.0 (Windows NT 5.1; rv:9.0.1) Gecko/20100101 Firefox/9.0.1"` into fields. Is it a bot? (For comparison, another line of the same log has the user agent `Python-urllib/2.4`, request `GET / HTTP/1.1`, and the referrer `"-"`.)

<details>
<summary>Solution</summary>

Parsed with a combined-log-format regex:

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

| Field | Value |
|---|---|
| Client IP | `80.165.186.186` |
| Identity, user | `-`, `-` (unknown) |
| Time | `25/Jan/2012:01:21:24 -0800` |
| Request | `GET /events-dataset-api/ HTTP/1.1` |
| Status | `200` (OK) |
| Bytes | `3214` |
| Referrer | `http://www.kdnuggets.com/datasets/index.html` |
| User agent | Firefox 9.0.1 on Windows NT 5.1 |

A person, not a bot: a browser user agent, arriving from a KDnuggets link (the referrer). Compare the `Python-urllib/2.4` line: no referrer, a bare library user agent — a script that doesn't say who runs it.

</details>

## 15. Copyright, Fair Use and Legal Cases

**Copyright.** Products of intellect — web content, source code — are ruled by copyright law: "a form of protection grounded in the U.S. Constitution and granted by law for original works of authorship fixed in a tangible medium of expression", published or not (copyright.gov). So can you use web material?

**Fair use.** Reproduction may be considered fair for purposes such as **criticism, comment, news, teaching, scholarship, research** — but it's a very grey area. Four factors decide whether a particular use is fair:

1. The **purpose and character** of the use, including whether it's commercial or for nonprofit educational purposes.
2. The **nature** of the copyrighted work.
3. The **amount and substantiality** of the portion used, relative to the work as a whole.
4. The **effect on the potential market** for, or value of, the work.

**Legal cases.** Both were won on **"trespass to chattels"**: interfering with someone else's property, here their computer systems.

| Case | Date | What happened | Finding |
|---|---|---|---|
| eBay vs. Bidder's Edge | May 24, 2000 | eBay stopped Bidder's Edge's crawlers | Intentional, unauthorized interference with eBay's computer system that caused damage |
| American Airlines vs. FareChase | Mar 10, 2003 | AA stopped FareChase scraping AA.com "web fares" (fare comparison) | Intentional, without consent; harms AA's network and property. Settled later that year |

> ⚠️ **Pitfall**: Both cases were about **crawling** (load on, and unauthorized use of, the servers), not about copying text. Respecting robots.txt and politeness is the legal side of the story too, not just good manners.

> 📘 **Going further**: [copyright.gov](http://www.copyright.gov) · [Copyright FAQ](https://www.copyright.gov/help/faq/faq-general.html) · [Fair use (FL-102)](https://www.copyright.gov/fls/fl102.html) · [eBay v. Bidder's Edge (Justia)](https://law.justia.com/cases/federal/district-courts/FSupp2/100/1058/2478126/) · [AA v. FareChase injunction (EFF)](https://www.eff.org/document/preliminary-injunction-american-airlines-v-farechase-inc)

## 16. Quick Reference & Top 5 Things to Remember

| robots.txt | Meaning |
|---|---|
| `User-agent: Name` | Group for that bot; if present, **only** its rules apply to it |
| `Disallow: /` / `Disallow:` | Block everything / block nothing |
| `Disallow: /tmp/` | Block paths starting with `/tmp/` |
| `Allow: /audio/podcasts/` under `Disallow: /audio/` | Re-opens one resource in a closed folder (longest match wins) |
| `Sitemap: URL` | Where the sitemaps are |

| Crawler problem | Fix |
|---|---|
| Impolite | Artificial delays per host; enforce in `nextSite()` / `nextURL()` |
| Slow (waiting on the network, DNS) | Threads / distributed crawling; cache DNS |
| Traps | Honor robots.txt; watch for ever-changing URLs (e.g. the ICS calendar) |
| Duplicates | Hashes/checksums (exact), fingerprints (near) |
| Noise | Content blocks: cumulative tag distribution |
| Client-side scripting | User-interaction emulation (Selenium) — most crawlers skip it |

| Term | Meaning |
|---|---|
| URL / URN / URI | Where a resource is / what it is / either (the umbrella term) |
| Frontier | Queue of URLs still to crawl; starts with the seeds |
| `HEAD` | HTTP request for headers only (`Last-Modified`) |
| Freshness | Fraction of the collection that is up to date |
| Age | How long a copy has been out of date; $\text{Age}(\lambda,t) = \int_0^t \lambda e^{-\lambda x}(t-x)\,dx$ |
| Distributed crawl | Hash the **host** → crawler; share the frontier |
| Push / pull feed | Publisher alerts you (WebSub) / you poll (RSS, `<ttl>` in minutes) |
| Deep web | Behind logins, scripts, or unlinked; 400–500× the shallow web |
| Trespass to chattels | The claim in eBay v. Bidder's Edge and AA v. FareChase |

**Top 5 things to remember**

1. Crawl loop: frontier → permitted? → fetch → store → extract → add the **unseen** links (resolve relative URLs first); politeness lives in `nextSite()`/`nextURL()`.
2. robots.txt: a bot-specific group overrides `*` completely; `Allow` inside a `Disallow`ed folder wins by **longest match**; and it's honor-based, not security.
3. Crawling is I/O-bound: 1M pages × 500 ms ≈ 5.8 days on one thread, so use many threads — and stay polite per host.
4. Optimizing **freshness** can make you abandon fast-changing sites; **age** grows faster than linearly with time since the last crawl.
5. "Just because you can, doesn't mean you should": follow the bot-writer guidelines, identify your bot, and remember that both legal cases were about crawling (trespass to chattels).
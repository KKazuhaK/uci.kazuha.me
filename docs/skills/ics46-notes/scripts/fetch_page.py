#!/usr/bin/env python3
"""Fetch a supplement page (Thornton notes, algs4 booksite) as full text.

WebFetch returns a model summary, not the page, so it can't be used for
completeness checks. This downloads the raw HTML with curl (which honours the
session's proxy settings) and converts it to Markdown-ish text: headings
become #, <pre> blocks stay fenced, links are listed at the end so sub-pages
can be followed.

Usage:
  fetch_page.py <url> <out.md>
Prints: heading count, word count, last heading, and same-site sub-links
(so you can decide which to fetch next).
"""
import html.parser
import subprocess
import sys
from urllib.parse import urljoin, urlparse


class Conv(html.parser.HTMLParser):
    BLOCK = {"p", "div", "br", "li", "tr", "table", "ul", "ol", "dd", "dt"}

    def __init__(self, base):
        super().__init__(convert_charrefs=True)
        self.base, self.out, self.links = base, [], []
        self.pre = 0
        self.skip = 0
        self.heads = []
        self.cur_head = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style"):
            self.skip += 1
        elif tag == "pre":
            self.pre += 1
            self.out.append("\n```\n")
        elif tag in ("h1", "h2", "h3", "h4"):
            self.cur_head = []
            self.out.append("\n\n" + "#" * int(tag[1]) + " ")
        elif tag == "li":
            self.out.append("\n- ")
        elif tag in self.BLOCK:
            self.out.append("\n")
        elif tag == "a" and a.get("href"):
            self.links.append(urljoin(self.base, a["href"]))
        elif tag == "img" and a.get("src"):
            self.out.append(f"[image: {urljoin(self.base, a['src'])}]")

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self.skip -= 1
        elif tag == "pre":
            self.pre -= 1
            self.out.append("\n```\n")
        elif tag in ("h1", "h2", "h3", "h4") and self.cur_head is not None:
            self.heads.append("".join(self.cur_head).strip())
            self.cur_head = None
            self.out.append("\n")

    def handle_data(self, d):
        if self.skip:
            return
        if not self.pre:
            d = " ".join(d.split()) + (" " if d[-1:].isspace() else "")
        self.out.append(d)
        if self.cur_head is not None:
            self.cur_head.append(d)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    url, out = sys.argv[1], sys.argv[2]
    r = subprocess.run(["curl", "-sSL", "--max-time", "60", url],
                       capture_output=True)
    if r.returncode:
        sys.exit(f"FETCH FAILED {url}: {r.stderr.decode().strip()}")
    raw = r.stdout.decode("utf-8", "replace")
    c = Conv(url)
    c.feed(raw)
    text = "".join(c.out)
    while "\n\n\n" in text:
        text = text.replace("\n\n\n", "\n\n")
    with open(out, "w") as f:
        f.write(f"<!-- source: {url} -->\n{text.strip()}\n")
    host = urlparse(url).netloc
    prefix = url.rsplit("/", 1)[0] if not url.endswith("/") else url
    subs = sorted({l.split("#")[0] for l in c.links
                   if urlparse(l).netloc == host and l.startswith(prefix)
                   and l.split("#")[0] != url
                   # source files and archives aren't prose sub-pages
                   and not l.split("#")[0].endswith(
                       (".java.html", ".java", ".tar.gz", ".zip", ".txt",
                        ".cpp", ".h", ".png", ".jpg", ".gif"))})
    print(f"saved {out}: {len(text.split())} words, {len(c.heads)} headings")
    print(f"last heading: {c.heads[-1] if c.heads else '(none)'}")
    if subs:
        print("same-site sub-links:")
        for s in subs:
            print("  " + s)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Check a notes file against Kazuha's site before delivery.

The notes live in his Astro site repo (GitHub KKazuhaK/uci.kazuha.me) as
src/content/notes/<COURSE>/<slug>.<lang>.md; pushing to main publishes them (CI builds
and checks, the server pulls the deploy branch every 5 minutes) at
https://ics.uci.edu/~kazuhak/notes/<course>/<slug>/<lang>/. The site renders
them with one shared renderer (marked GFM + footnotes + KaTeX + Shiki +
Mermaid 11 + viz) and publishes that renderer as a standalone module,
assets/js/kzh-markdown.mjs, for this script. Checks:

1. Frontmatter + file name — `title` / `summary` present and non-empty
   (JSON-style double-quoted strings), file named <slug>.<lang>.md
   (lec-NN / week-NN / a special like final-review; no hw-NN homework
   notes — practice problems live inside the lecture notes). `topics`
   (the course hub's "By topic" view): ids exist in the course JSON
   (with --site-repo), every section has its `## N.` / `### N.M` heading,
   and the other language's file, when it sits next to this one, has the
   identical block.
2. Source lint — house rules (images only from the KKazuhaK/assets jsDelivr
   CDN; no legacy ?kind=course_notes links) and things that silently
   disappear or change meaning in CommonMark. Relative note links
   (lec-09.en-US.md#x, ../CS-121/week-01.en-US.md) are checked against the
   live sitemap.json: a target that isn't published yet is a WARN (it
   renders as plain text until that note exists).
3. Real render — imports the site's published renderer module under node and
   calls renderMarkdown(body, {lang, highlight:false, math:false,
   codeUi:false}) (byte-identical to the old md-viewer), then inspects the
   output: swallowed `<T>`-style text, headings the source didn't intend
   (setext), TOC anchors that don't exist, stray markers.
4. Mermaid — renders every ```mermaid block with mermaid-cli.
6 (with 2). Answers — every worked answer sits in a fold block:
   <details> / <summary>Solution|Answer</summary> (zh-CN: 解答|答案), blank
   lines around the content, nothing nested, no heading inside; old-style
   "> ✍️ Try it first" lines and **Solution**/**Answer** paragraphs left
   outside a fold are reported. When the other language's file sits next
   to this one, both must have the same folds in the same sections and order.
5. viz — every ```viz <component> block: valid JSON, the component exists
   (live site assets/viz/, or --viz-dir), its own validate() accepts the
   config and steps() runs. The site build runs the same check and a broken
   demo FAILS THE WHOLE BUILD, so treat every viz ERROR as blocking.

Usage:
  check_md.py notes.md                      # all checks
  check_md.py notes.md --no-mermaid         # skip 4
  check_md.py notes.md --no-viz             # skip 5
  check_md.py notes.md --offline            # skip 3 and the sitemap lookup (no network)
  check_md.py notes.md --no-name-check      # file-name problems become WARN (drafts with other names)
  check_md.py notes.md --renderer FILE      # local kzh-markdown.mjs instead of the live one
  check_md.py notes.md --viz-dir DIR        # local viz components (e.g. <repo>/public/assets/viz,
                                            #   or a fetch_viz.sh folder plus a new component)
  check_md.py notes.md --sitemap FILE       # local sitemap.json instead of the live one
  check_md.py notes.md --site-repo DIR      # a clone of KKazuhaK/uci.kazuha.me (the usual way; no network to the
                                            #   site and no build needed): viz from DIR/public/assets/viz, note
                                            #   list from DIR/src/content/notes, and, unless --renderer is given,
                                            #   the renderer from the deploy branch (CI's latest build):
                                            #   git fetch origin +refs/heads/deploy:refs/remotes/origin/deploy
                                            #   git show origin/deploy:assets/js/kzh-markdown.mjs
  check_md.py notes.md --course CODE        # course folder the note goes in (default: IN4MATX-133)
  check_md.py file.md --mermaid-only        # only 4 (used by memdiag; no frontmatter needed)
  --viewer is obsolete (the md-viewer page no longer contains the parser); it is ignored with a warning.

Exit code 1 if any ERROR. If a check can't run (no node / network /
Chromium) it prints WARNING ... NOT checked — say so in the delivery report.
Tooling is cached under ~/.cache/in4matx133-notes/.
"""
import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

COURSE = "IN4MATX-133"
SITE = "https://ics.uci.edu/~kazuhak"
RENDERER_URL = SITE + "/assets/js/kzh-markdown.mjs"
SITEMAP_URL = SITE + "/sitemap.json"
VIZ_URL = SITE + "/assets/viz/"
CACHE = os.path.expanduser("~/.cache/in4matx133-notes")
API_VERSION = 1
CDN_PREFIX = "https://cdn.jsdelivr.net/gh/KKazuhaK/assets@main/ics.uci.edu/"

NOTE_FILE = re.compile(r"^([a-z0-9-]+)\.(en-US|zh-CN)\.md$")
# Same pattern as the site's src/lib/note-links.ts
NOTE_LINK = re.compile(r"^(?:\./|\.\./([A-Z0-9]+-[A-Z0-9]+)/)?([a-z0-9-]+)\.(en-US|zh-CN)\.md(#.*)?$")
STRICT_TAGS = True  # True: every <tag> in prose must be in backticks (web course)


def strip_code_spans(s):
    return re.sub(r"`[^`]*`", "``", s)


def fetch(url, dest):
    r = subprocess.run(["curl", "-sSfL", "--max-time", "30", "-o", dest, url + "?nocache=" + str(os.getpid())],
                       capture_output=True)
    return r.returncode == 0 and os.path.exists(dest)


# ---------------------------------------------------------------- 1. frontmatter + name

def split_frontmatter(text):
    """Return (fields dict | None, issues, body, body_offset_lines)."""
    issues = []
    lines = text.split("\n")
    if not lines or lines[0].strip() != "---":
        issues.append(("ERROR", 1, "no frontmatter — the file must start with ---, title: \"…\", summary: \"…\", ---"))
        return None, issues, text, 0
    try:
        end = next(i for i in range(1, len(lines)) if lines[i].strip() == "---")
    except StopIteration:
        issues.append(("ERROR", 1, "frontmatter is not closed with a second ---"))
        return None, issues, text, 0
    fields = {}
    i = 1
    while i < end:
        raw = lines[i]
        i += 1
        if not raw.strip():
            continue
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", raw)
        if not m:
            issues.append(("ERROR", i, f"frontmatter line is not 'key: \"value\"': {raw.strip()[:60]}"))
            continue
        key, val = m.group(1), m.group(2).strip()
        if key == "topics" and not val:
            items = []
            while i < end and re.match(r"^\s+-\s", lines[i]):
                items.append((i + 1, lines[i]))
                i += 1
            fields["topics"] = parse_topics(items, issues)
            if not items:
                issues.append(("ERROR", i, "frontmatter topics: list the topics as '  - <id>' lines below it"))
            continue
        if key == "order":
            if re.fullmatch(r"-?[0-9]+(?:\.[0-9]+)?", val):
                fields["order"] = float(val)
            else:
                issues.append(("ERROR", i, f"frontmatter order: write a bare number (order: 501), not {val[:20]}"))
            continue
        if not (val.startswith('"') and val.endswith('"') and len(val) >= 2):
            issues.append(("ERROR", i, f"frontmatter {key}: write the value as a JSON-style double-quoted string"))
            continue
        try:
            fields[key] = json.loads(val)
        except ValueError as e:
            issues.append(("ERROR", i, f"frontmatter {key}: not a valid double-quoted string ({e}) — escape \" and \\"))
            continue
        if key == "kind" and fields[key] not in ("topic", "review"):
            issues.append(("ERROR", i, f"frontmatter kind: \"{fields[key]}\" — use \"topic\" or \"review\" (leave it out for a lecture note)"))
        elif key not in ("title", "summary", "kind"):
            issues.append(("WARN", i, f"frontmatter has '{key}' — notes use only title, summary, topics, kind and order"))
    for key in ("title", "summary"):
        if not str(fields.get(key, "")).strip():
            issues.append(("ERROR", 1, f"frontmatter {key} is missing or empty"))
    body_lines = lines[end + 1:]
    if body_lines and body_lines[0].strip():
        issues.append(("WARN", end + 2, "leave one blank line after the closing ---"))
    first = next((l for l in body_lines if l.strip()), "")
    if not first.startswith("# "):
        issues.append(("WARN", 0, "the body should start with its own '# ' title"))
    return fields, issues, "\n".join(body_lines), end + 1


# ---------------------------------------------------------------- 1b. topics (course hub "By topic" view)

# One list item: "  - <id>" or "  - { id: <id>, sections: \"…\" }" (spaces only; a
# trailing comment needs a space before #, as in YAML).
TOPIC_ITEM = re.compile(r'^ +- +(?:([a-z0-9-]+)|\{(.*)\})(?: +#.*)?$')
TOPIC_FIELD = re.compile(r'\s*(id|sections)\s*:\s+(?:([a-z0-9-]+)|"([^"]*)")\s*')
SECTION_KEY = re.compile(r"^([0-9]+)(?:\.([0-9]+))?$")


def parse_sections(spec):
    """'5-11, 13.1-13.3' -> ['5', ..., '11', '13.1', '13.2', '13.3'] or raise ValueError (same rules as src/lib/topics.ts)."""
    out = {}
    for part in [p.strip() for p in spec.split(",")]:
        ends = [e.strip() for e in part.split("-")]
        ms = [SECTION_KEY.match(e) for e in ends]
        if not part or len(ends) > 2 or not all(ms):
            raise ValueError(f'bad section "{part}" (use 5, 5-11, 13.1 or 13.1-13.3)')
        a, b = ms[0], ms[-1]
        sub = a.group(2) is not None
        if sub != (b.group(2) is not None) or (sub and a.group(1) != b.group(1)):
            raise ValueError(f'bad range "{part}": both ends must be N or N.M with the same N')
        lo, hi = (int(a.group(2)), int(b.group(2))) if sub else (int(a.group(1)), int(b.group(1)))
        if hi < lo:
            raise ValueError(f'bad range "{part}"')
        for n in range(lo, hi + 1):
            out[f"{a.group(1)}.{n}" if sub else str(n)] = (int(a.group(1)), n) if sub else (n, 0)
    return [k for k, _ in sorted(out.items(), key=lambda kv: kv[1])]


def parse_topics(items, issues):
    """[(line_no, raw)] -> [(id, [section keys])]; problems go into issues."""
    topics = []
    for ln, raw in items:
        m = TOPIC_ITEM.match(raw)
        fields = {}
        if m and m.group(2) is not None:
            body, pos = m.group(2), 0
            while True:
                f = TOPIC_FIELD.match(body, pos)
                if not f or f.group(1) in fields or (f.group(1) == "id") != (f.group(2) is not None):
                    m = None
                    break
                fields[f.group(1)] = f.group(2) or f.group(3)
                pos = f.end()
                if pos == len(body):
                    break
                if body[pos] != ",":
                    m = None
                    break
                pos += 1
            if m and set(fields) != {"id", "sections"}:
                m = None
        if not m:
            issues.append(("ERROR", ln, "topics item must be '  - <id>' or "
                                        "'  - { id: <id>, sections: \"5-11, 13.3-13.6\" }' (spaces, no tabs)"))
            continue
        tid = m.group(1) or fields["id"]
        try:
            secs = parse_sections(fields["sections"]) if "sections" in fields else []
        except ValueError as e:
            issues.append(("ERROR", ln, f"topics {tid}: {e}"))
            continue
        if any(t[0] == tid for t in topics):
            issues.append(("ERROR", ln, f"topics: '{tid}' listed twice"))
        topics.append((tid, secs))
    return topics


def numbered_headings(lines):
    """Section keys of '## N. …' and '### N.M …' headings outside code fences."""
    keys, fence = set(), None  # fence = the opening run (``` / ````  / ~~~)
    for line in lines:
        f = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if f:
            run = f.group(1)
            if fence is None:
                fence = run
            elif run[0] == fence[0] and len(run) >= len(fence) and not f.group(2).strip():
                fence = None
            continue
        if fence:
            continue
        m = re.match(r"^## ([0-9]+)\.\s", line) or re.match(r"^### ([0-9]+\.[0-9]+)\s", line)
        if m:
            keys.add(m.group(1))
    return keys


def course_topic_ids(course, repo):
    """Topic ids from the course JSON in a site clone, or None when there's no clone."""
    if not repo:
        return None
    try:
        with open(os.path.join(repo, "src", "content", "courses", course + ".json"), encoding="utf-8") as f:
            return [t["id"] for t in json.load(f).get("topics", [])]
    except (OSError, ValueError, KeyError):
        return None


def check_topics(topics, lines, path, lang, course, repo):
    issues = []
    if topics is None:
        ids = course_topic_ids(course, repo)
        if ids:
            issues.append(("WARN", 1, "no topics in the frontmatter — the note will be listed under \"Other\" "
                                       f"on the course hub (topics: {', '.join(ids)})"))
        return issues
    ids = course_topic_ids(course, repo)
    if ids is None:
        issues.append(("WARN", 1, "topic ids NOT checked against the course (pass --site-repo)"))
    if not isinstance(topics, list):
        return issues + [("ERROR", 1, "topics must be a list of '  - <id>' lines, not a string")]
    have = numbered_headings(lines)
    for tid, secs in topics:
        if ids is not None and tid not in ids:
            issues.append(("ERROR", 1, f"topics: unknown id '{tid}' (this course has: {', '.join(ids) or 'none'})"))
        for k in secs:
            if k not in have:
                want = f"### {k}" if "." in k else f"## {k}."
                issues.append(("ERROR", 1, f"topics {tid}: no '{want}' heading for section {k}"))
    other = {"en-US": "zh-CN", "zh-CN": "en-US"}.get(lang)
    sib = re.sub(r"\.(en-US|zh-CN)\.md$", f".{other}.md", path) if other else None
    if sib and sib != path and os.path.exists(sib):
        sib_fields, _, _, _ = split_frontmatter(open(sib, encoding="utf-8").read().replace("\r\n", "\n"))
        if sib_fields is not None and sib_fields.get("topics") != topics:
            issues.append(("ERROR", 1, f"topics differ from {os.path.basename(sib)} — both languages need the identical topics block"))
    return issues


FOLD_OPEN = re.compile(r"^(?:>\s*)*<details\b[^>]*>\s*$")
FOLD_KIND = {"Solution": "S", "解答": "S", "Answer": "A", "答案": "A"}


def fold_sections(lines):
    """For each <details> fold outside code fences (also `<details open>` and folds inside a
    blockquote, which the site counts too): (section, kind, line). section = the '## N.' /
    '### N.M' heading it sits under ('' before the first); kind = S (Solution/解答),
    A (Answer/答案) or '?' (a descriptive summary); line = 0-based index in `lines`."""
    out, cur, fence = [], "", None
    for i, line in enumerate(lines):
        f = re.match(r"^ {0,3}(`{3,}|~{3,})(.*)$", line)
        if f:
            run = f.group(1)
            if fence is None:
                fence = run
            elif run[0] == fence[0] and len(run) >= len(fence) and not f.group(2).strip():
                fence = None
            continue
        if fence:
            continue
        m = re.match(r"^## ([0-9]+)\.\s", line) or re.match(r"^### ([0-9]+\.[0-9]+)\s", line)
        if m:
            cur = m.group(1)
        elif FOLD_OPEN.match(line.strip()):
            nxt = re.sub(r"^(?:>\s*)*", "", lines[i + 1].strip()) if i + 1 < len(lines) else ""
            sm = re.match(r"^<summary>(.*)</summary>$", nxt)
            out.append((cur, FOLD_KIND.get(sm.group(1).strip(), "?") if sm else "?", i))
    return out


def check_sibling_folds(lines, path, lang, off=0):
    """en-US and zh-CN need the same <details> folds in the same sections and order, with
    paired summaries (Solution <-> 解答, Answer <-> 答案): the site reopens a reader's open
    answers by position after a language switch."""
    other = {"en-US": "zh-CN", "zh-CN": "en-US"}.get(lang)
    sib = re.sub(r"\.(en-US|zh-CN)\.md$", f".{other}.md", path) if other else None
    if not sib or sib == path or not os.path.exists(sib):
        return []
    _, _, sib_body, _ = split_frontmatter(open(sib, encoding="utf-8").read().replace("\r\n", "\n"))
    mine, theirs = fold_sections(lines), fold_sections(sib_body.split("\n"))
    name = os.path.basename(sib)
    if [m[:2] for m in mine] == [t[:2] for t in theirs]:
        return []
    tail = " — both languages need the same folds in the same order"
    if len(mine) != len(theirs):
        return [("ERROR", 1, f"{len(mine)} <details> folds here, {len(theirs)} in {name}" + tail)]
    k = next(i for i, (x, y) in enumerate(zip(mine, theirs)) if x[:2] != y[:2])
    ln = mine[k][2] + 1 + off
    if mine[k][0] != theirs[k][0]:
        return [("ERROR", ln, f"fold #{k + 1} is in section {mine[k][0] or '(intro)'} here but "
                              f"{theirs[k][0] or '(intro)'} in {name}" + tail +
                              " (also check that both files number their headings '## N. ' / '### N.M ' alike)")]
    return [("ERROR", ln, f"fold #{k + 1}: summary doesn't pair with {name} (Solution <-> 解答, Answer <-> 答案)")]


def check_name(path, strict):
    """Return (issues, slug, lang)."""
    level = "ERROR" if strict else "WARN"
    base = os.path.basename(path)
    m = NOTE_FILE.match(base)
    if not m:
        old = re.search(r"_(?:Lec|Week)\d+_Notes", base)
        hint = " (the old XXX_LecNN_Notes_<lang>.md names are no longer used)" if old else ""
        return [(level, 0, f"file name '{base}' must be <slug>.<en-US|zh-CN>.md, e.g. lec-10.en-US.md{hint}")], None, None
    slug, lang = m.group(1), m.group(2)
    if re.match(r"^(?:hw|homework)(?:-|\d)", slug):
        # Always an ERROR (even with --no-name-check): homework notes are banned, not misnamed.
        return [("ERROR", 0, f"slug '{slug}': no separate homework notes — put the problems as practice "
                             "inside the lecture notes where the topic is taught")], slug, lang
    if re.match(r"^(lec|week)-", slug) and not re.match(r"^(lec|week)-\d{2}$", slug):
        return [(level, 0, f"slug '{slug}' must be lec-NN / week-NN with two digits")], slug, lang
    return [], slug, lang


# ---------------------------------------------------------------- 2. source lint

KNOWN_HTML = set("""a abbr b blockquote br code del details div em h1 h2 h3 h4 h5 h6 hr i img
ins kbd li mark ol p pre s small span strong sub summary sup table tbody td th thead tr u ul""".split())


FOLD_LINE = re.compile(r"^(?:<details>|</details>|<summary>.*</summary>)$")
SUMMARIES = {"en-US": ("Solution", "Answer"), "zh-CN": ("解答", "答案")}
ANSWER_LABEL = re.compile(r"^\*\*(?:Solutions?|Answers?|解答|答案)(?![A-Za-z])")


def check_answers(lines, off, lang):
    """Worked answers are folded as
         <details>
         <summary>Solution</summary>
         (blank)
         ...answer...
         (blank)
         </details>
         (blank)
    The browser folds it natively; the site keeps the reader's open answers across
    the language switch by position, so en-US and zh-CN need the same blocks in the
    same order."""
    issues = []

    def add(level, i, msg):
        issues.append((level, i + 1 + off, msg))

    blank = lambda i: i < 0 or i >= len(lines) or not lines[i].strip()
    allowed = SUMMARIES.get(lang, SUMMARIES["en-US"])
    in_fence = False
    open_at = None
    folds = 0
    for i, raw in enumerate(lines):
        s = raw.strip()
        if re.match(r"^(?:>\s*)*(```|~~~)", s):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        if s != raw.rstrip() and FOLD_LINE.match(s):
            add("ERROR", i, "fold tags must start at column 0 (indented, they are code or list text)")
        if s == "<details>":
            if open_at is not None:
                add("ERROR", i, f"<details> inside the fold opened on line {open_at + 1 + off} — no nesting; close it first")
            open_at = i
            folds += 1
            if not blank(i - 1):
                add("ERROR", i, "blank line needed before <details>")
            m = re.match(r"^<summary>(.*)</summary>$", lines[i + 1].strip() if i + 1 < len(lines) else "")
            if not m:
                add("ERROR", i, "<details> must be followed directly by <summary>…</summary> on the next line")
            else:
                if m.group(1) not in allowed:
                    # A fold of long, non-essential material may say what it holds; an answer fold may not.
                    add("WARN", i + 1, f"summary '{m.group(1)[:60]}' — an answer fold uses {' or '.join(allowed)} for {lang}; "
                                       "a descriptive summary is only for long, non-essential material")
                if not blank(i + 2):
                    add("ERROR", i + 2, "blank line needed after <summary>…</summary>, or the Markdown inside is not rendered")
        elif s == "</details>":
            if open_at is None:
                add("ERROR", i, "</details> without an open <details>")
            else:
                if i - open_at <= 3:
                    add("ERROR", i, "empty fold")
                if not blank(i - 1):
                    add("ERROR", i, "blank line needed before </details>, or the last block is swallowed into the HTML")
                if not blank(i + 1):
                    add("ERROR", i + 1, "blank line needed after </details> — an HTML block runs to the next blank line and swallows this line")
            open_at = None
        elif s.startswith("<summary>") and not (i > 0 and lines[i - 1].strip() == "<details>"):
            add("ERROR", i, "<summary> belongs on the line right after <details>")
        elif open_at is not None and re.match(r"^#{1,6}\s", s):
            add("ERROR", i, "heading inside an answer fold — the answer ends before the next heading; close </details> first")
        elif re.match(r"^>\s*✍️", s):
            add("ERROR", i, "'✍️ Try it first' is the old convention — drop it; the folded answer already makes the reader try first")
        elif open_at is None and ANSWER_LABEL.match(s):
            add("WARN", i, "**Solution**/**Answer** outside a fold — if this answers an exercise, wrap it in <details> (see the skill); "
                           "if it is lecture prose ('the solution is…'), ignore")
    if open_at is not None:
        add("ERROR", open_at, "<details> never closed")
    return issues, folds


def image_ok(url):
    return url.startswith(CDN_PREFIX)


def lint(lines, off):
    """Source-level rules. The real render (check 3) catches the rest. `off` = frontmatter lines before the body."""
    issues = []
    links = []  # (line, target) of relative .md links

    def add(level, i, msg):
        issues.append((level, i + 1 + off, msg))

    in_fence = False
    prev_blank = True
    for i, raw in enumerate(lines):
        s = raw.strip()
        if re.match(r"^(?:>\s*)*(```|~~~)", s):
            in_fence = not in_fence
            prev_blank = False
            continue
        if in_fence:
            continue
        if not s:
            prev_blank = True
            continue
        body = strip_code_spans(s)
        if FOLD_LINE.match(s):
            prev_blank = False
            continue  # the answer fold block itself, checked by check_answers()

        if STRICT_TAGS and re.match(r"^#{1,6}\s", s) and re.search(r"<[^<>]+>", s):
            add("ERROR", i, "angle-bracket tag in a heading — the renderer drops <...> from the anchor id even inside backticks; write the tag name bare (div vs span)")
        for m in re.finditer(r"!\[[^\]]*\]\(\s*<?([^)\s>]+)", body):
            if not image_ok(m.group(1)):
                add("ERROR", i, f"image {m.group(1)[:80]} — only slide figures on the KKazuhaK/assets jsDelivr CDN "
                                f"({CDN_PREFIX}<course>/<slug>/<name>.png) are allowed; otherwise use a viz demo, a table or text")
        for m in re.finditer(r"<img\b[^>]*\bsrc=[\"']?([^\"'\s>]+)", body, re.I):
            if not image_ok(m.group(1)):
                add("ERROR", i, f"<img> {m.group(1)[:80]} — only KKazuhaK/assets jsDelivr CDN images are allowed")
        if "kind=course_notes" in body:
            add("ERROR", i, "legacy ?kind=course_notes link — link the source file instead: [Lecture 9](lec-09.en-US.md#anchor), "
                            "other course [Week 1](../CS-121/week-01.en-US.md)")
        for m in re.finditer(r"(?<!!)\[[^\]]*\]\(\s*<?([^)\s>]+)", body):
            t = m.group(1)
            if re.search(r"\.md(#|$)", t) and not re.match(r"https?:|\?", t):
                if NOTE_LINK.match(t):
                    links.append((i + 1 + off, t))
                else:
                    add("ERROR", i, f"note link '{t}' — write lec-NN.<lang>.md#anchor (same course) or ../<COURSE>/<slug>.<lang>.md")
        # `<word>` outside code is parsed as an HTML tag and vanishes (vector<int> -> vector)
        for m in re.finditer(r"<(/?)([A-Za-z][A-Za-z0-9-]*)([^<>]*)>", body):
            if re.match(r"https?:|mailto:", m.group(2) + m.group(3)):
                continue
            if STRICT_TAGS:
                # A web course names tags constantly. Unknown ones vanish; known ones (<div>, <p>, <script>)
                # are rendered as REAL markup and can break the page. Every tag in prose goes in `code`.
                add("ERROR", i, f"'{m.group(0)}' outside backticks is rendered as real HTML (or vanishes) — write it as `{m.group(0)}`")
            elif m.group(2).lower() not in KNOWN_HTML:
                add("ERROR", i, f"'{m.group(0)}' outside backticks is read as an HTML tag and disappears — put it in `code`")
        if re.match(r"^(={3,}|-{3,})\s*$", s) and not prev_blank and i > 0 \
                and not re.match(r"^\s*([-*+]|\d+\.)\s", lines[i - 1]) and not lines[i - 1].lstrip().startswith("|"):
            add("ERROR", i, "'---'/'===' right under a text line turns that line into a heading (setext); put a blank line before it")
        if re.match(r"^ {4,}\S", raw) and prev_blank and not re.match(r"^\s*([-*+]|\d+\.)\s", raw):
            add("WARN", i, "4+ space indent after a blank line is a code block in CommonMark (unless it continues a list item)")
        if "$" in body and not re.search(r"\$[^$\s][^$]*\$", body):
            add("WARN", i, "lone '$' — KaTeX may pair it with another '$' on the page; wrap it in `code`")
        prev_blank = False
    if in_fence:
        add("ERROR", len(lines) - 1, "unclosed code fence")
    return issues, links


def repo_published(repo):
    """Note URLs from a site repo clone's src/content/notes/<COURSE>/<slug>.<lang>.md files."""
    root = os.path.join(repo, "src", "content", "notes")
    out = set()
    for f in glob.glob(os.path.join(root, "*", "*.md")):
        m = NOTE_FILE.match(os.path.basename(f))
        if m:
            out.add(f"/notes/{os.path.basename(os.path.dirname(f)).lower()}/{m.group(1)}/{m.group(2)}")
    return out


def check_links(links, course, sitemap_file, offline, repo=None):
    """WARN for relative note links whose target isn't published yet. Returns (issues, note or None)."""
    if not links:
        return [], None
    path = sitemap_file
    if repo and not path:
        published = repo_published(repo)
        return [("WARN", ln, f"link target {t} is not in the site repo yet — it shows as plain text until that note exists")
                for ln, t in links if not _target_in(t, course, published)], None
    if not path:
        if offline:
            return [], f"{len(links)} note link(s) NOT checked against sitemap.json (--offline)"
        os.makedirs(CACHE, exist_ok=True)
        path = os.path.join(CACHE, "sitemap.json")
        if not fetch(SITEMAP_URL, path):
            return [], f"could not download sitemap.json — {len(links)} note link(s) NOT checked"
    try:
        data = json.load(open(path, encoding="utf-8"))
        published = {u.rstrip("/") for p in data.get("pages", []) for n in p.get("notes", [])
                     for u in n.get("urls", {}).values()}
    except (ValueError, OSError, AttributeError) as e:
        return [], f"sitemap.json unreadable ({e}) — note links NOT checked"
    issues = []
    for ln, t in links:
        if not _target_in(t, course, published):
            issues.append(("WARN", ln, f"link target {t} is not on the site yet — it shows as plain text until that note exists"))
    return issues, None


def _target_in(t, course, published):
    m = NOTE_LINK.match(t)
    c, slug, lang = m.group(1) or course, m.group(2), m.group(3)
    return f"/notes/{c.lower()}/{slug}/{lang}" in published


# ---------------------------------------------------------------- 3. real render

HARNESS = r"""
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [mod, note, lang, out] = process.argv.slice(2);
const m = await import(pathToFileURL(mod).href);
if (typeof m.renderMarkdown !== "function") { console.error("module has no renderMarkdown"); process.exit(3); }
const r = await m.renderMarkdown(readFileSync(note, "utf8"), { lang, highlight: false, math: false, codeUi: false });
writeFileSync(out, JSON.stringify({ api: m.API_VERSION ?? null, html: r.html, headings: r.headings }));
"""


def deploy_renderer(repo):
    """kzh-markdown.mjs from the repo's deploy branch (CI publishes every main build there).
    Returns (path, description) or (None, reason). A depth-1 clone only tracks main, so fetch with an
    explicit refspec; if the fetch fails (offline), fall back to the deploy ref already in the clone."""
    git = ["git", "-C", repo]
    f = subprocess.run(git + ["fetch", "-q", "--depth", "1", "origin",
                              "+refs/heads/deploy:refs/remotes/origin/deploy"], capture_output=True, timeout=120)
    sha = subprocess.run(git + ["rev-parse", "--short", "origin/deploy"], capture_output=True)
    if sha.returncode:
        return None, "no deploy branch in " + repo + (" (fetch failed: " + f.stderr.decode().strip()[-150:] + ")" if f.returncode else "")
    os.makedirs(CACHE, exist_ok=True)
    out = os.path.join(CACHE, "kzh-markdown.mjs")
    r = subprocess.run(git + ["show", "origin/deploy:assets/js/kzh-markdown.mjs"], capture_output=True)
    if r.returncode or not r.stdout:
        return None, "deploy branch has no assets/js/kzh-markdown.mjs"
    open(out, "wb").write(r.stdout)
    stale = "" if f.returncode == 0 else ", fetch failed — using the deploy ref already in the clone"
    return out, f"deploy branch @ {sha.stdout.decode().strip()}{stale}"


def site_render(body, lang, renderer_file=None):
    """Render with the site's own renderer module. Returns (result dict, None) or (None, reason)."""
    if not shutil.which("node"):
        return None, "node not available"
    os.makedirs(CACHE, exist_ok=True)
    mod = renderer_file and os.path.abspath(renderer_file)
    if not mod:
        mod = os.path.join(CACHE, "kzh-markdown.mjs")
        if not fetch(RENDERER_URL, mod):
            return None, "could not download " + RENDERER_URL
    hjs = os.path.join(CACHE, "render_harness.mjs")
    open(hjs, "w").write(HARNESS)
    with tempfile.TemporaryDirectory() as d:
        src, out = os.path.join(d, "body.md"), os.path.join(d, "out.json")
        open(src, "w", encoding="utf-8").write(body)
        r = subprocess.run(["node", hjs, mod, src, lang, out], capture_output=True, timeout=120)
        if r.returncode:
            return None, "renderer failed: " + (r.stderr.decode() or r.stdout.decode())[-300:]
        return json.load(open(out, encoding="utf-8")), None


def check_rendered(res, lines, off):
    issues = []
    if res.get("api") != API_VERSION:
        issues.append(("WARN", 0, f"renderer API_VERSION is {res.get('api')}, this script expects {API_VERSION} — "
                                  "the module's API changed; update the skill's check_md.py"))
    html_out = res["html"]
    from html.parser import HTMLParser

    class P(HTMLParser):
        def __init__(s):
            super().__init__(convert_charrefs=True)
            s.tags, s.ids, s.heads, s.text, s.in_code = [], set(), 0, [], 0
        def handle_starttag(s, t, a):
            s.tags.append(t)
            d = dict(a)
            if d.get("id"):
                s.ids.add(d["id"])
            if t in ("h1", "h2", "h3", "h4", "h5", "h6"):
                s.heads += 1
            if t in ("code", "pre"):
                s.in_code += 1
        def handle_endtag(s, t):
            if t in ("code", "pre"):
                s.in_code = max(0, s.in_code - 1)
        def handle_data(s, d):
            if not s.in_code:
                s.text.append(d)

    p = P()
    p.feed(html_out)
    for t in sorted(set(p.tags) - KNOWN_HTML - {"input", "section", "button", "svg", "path", "rect", "label"}):
        issues.append(("ERROR", 0, f"rendered output contains an unknown <{t}> element — some `<{t}>` text "
                                   "outside backticks was swallowed as HTML"))
    src_heads, fence = 0, False
    for raw in lines:
        if re.match(r"^\s*(?:>\s*)*(```|~~~)", raw):
            fence = not fence
        elif not fence and re.match(r"^#{1,6}\s", raw):
            src_heads += 1
    if p.heads != src_heads:
        issues.append(("ERROR", 0, f"renderer produced {p.heads} headings but the source has {src_heads} '#' "
                                   "headings — a setext heading (text line + ---/===) or a '#' inside a quote/list"))
    fence = False
    for i, raw in enumerate(lines):
        if re.match(r"^\s*(?:>\s*)*(```|~~~)", raw):
            fence = not fence
            continue
        if fence:
            continue
        for m in re.finditer(r"\]\(#([^)\s]+)\)", strip_code_spans(raw)):
            if m.group(1) not in p.ids:
                issues.append(("ERROR", i + 1 + off, f"link #{m.group(1)} has no matching id in the rendered page"))
    text = "".join(p.text)
    for pat, what in ((r"\*\*\S", "a literal '**' (bold didn't close)"), (r"(?<!\w)__\S", "a literal '__'"),
                      (r"\\[|*_`#\[\]]", "a literal backslash escape")):
        m = re.search(pat, text)
        if m:
            ctx = text[max(0, m.start() - 40):m.end() + 40].replace("\n", " ")
            issues.append(("WARN", 0, f"rendered text has {what}: …{ctx}…"))
    return issues


# ---------------------------------------------------------------- 4. mermaid

def mermaid_blocks(lines, off=0):
    blocks, cur, start = [], None, 0
    for i, raw in enumerate(lines):
        s = raw.strip()
        if cur is None and s.startswith("```mermaid"):
            cur, start = [], i + 1 + off
        elif cur is not None and s.startswith("```"):
            blocks.append((start, "\n".join(cur)))
            cur = None
        elif cur is not None:
            cur.append(raw)
    return blocks


def find_chromium():
    cands = []
    pw = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")
    cands += sorted(glob.glob(os.path.join(pw, "chromium-*/chrome-linux*/chrome")))
    cands += [shutil.which(n) for n in ("chromium", "chromium-browser", "google-chrome")]
    cands += ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
    for c in cands:
        if c and os.path.exists(c):
            return c
    return None


def find_mmdc():
    m = shutil.which("mmdc")
    if m:
        return m
    d = os.path.join(CACHE, "mmdc")
    m = os.path.join(d, "node_modules/.bin/mmdc")
    if os.path.exists(m):
        return m
    if not shutil.which("npm"):
        return None
    os.makedirs(d, exist_ok=True)
    env = dict(os.environ, PUPPETEER_SKIP_DOWNLOAD="1")
    r = subprocess.run(["npm", "i", "--prefix", d, "@mermaid-js/mermaid-cli@11"],
                       capture_output=True, env=env)
    return m if r.returncode == 0 and os.path.exists(m) else None


def render_all(blocks):
    """Return list of (line, error) for blocks that fail; None if unable."""
    if not blocks:
        return []
    mmdc, chrome = find_mmdc(), find_chromium()
    if not mmdc or not chrome:
        return None
    fails = []
    with tempfile.TemporaryDirectory() as d:
        pp = os.path.join(d, "pp.json")
        json.dump({"executablePath": chrome, "args": ["--no-sandbox"]}, open(pp, "w"))
        for line, src in blocks:
            inp = os.path.join(d, f"b{line}.mmd")
            open(inp, "w").write(src)
            r = subprocess.run([mmdc, "-p", pp, "-i", inp, "-o",
                                os.path.join(d, f"b{line}.svg"), "-q"],
                               capture_output=True, timeout=120)
            if r.returncode:
                err = (r.stderr.decode() or r.stdout.decode()).strip().splitlines()
                msg = next((e for e in err if "Error" in e or "error" in e), err[-1] if err else "?")
                fails.append((line, msg[:300]))
    return fails


# ---------------------------------------------------------------- 5. viz

VIZ_HARNESS = r"""
const [dir, jobs] = process.argv.slice(2);
const { pathToFileURL } = require("url");
(async () => {
  const out = [];
  for (const job of JSON.parse(jobs)) {
    try {
      const mod = await import(pathToFileURL(dir + "/" + job.name + ".js").href);
      const errs = mod.validate(job.config);
      if (errs.length) { out.push({ line: job.line, errors: errs }); continue; }
      const core = await import(pathToFileURL(dir + "/_core.js").href);
      const frames = mod.steps(core.withDefaults(mod.meta.params, job.config));
      if (!Array.isArray(frames) || !frames.length) out.push({ line: job.line, errors: ["steps() returned no frames"] });
      else out.push({ line: job.line, frames: frames.length });
    } catch (e) { out.push({ line: job.line, errors: ["component crashed: " + e.message] }); }
  }
  console.log(JSON.stringify(out));
})();
"""


def viz_blocks(lines, off=0):
    """[(line, name, source)] for every ```viz block."""
    blocks, cur = [], None
    for i, raw in enumerate(lines):
        s = raw.strip()
        if cur is None and re.match(r"^```viz(\s|$)", s):
            parts = s[3:].split()
            cur = (i + 1 + off, parts[1] if len(parts) > 1 else "", [])
        elif cur is not None and s.startswith("```"):
            blocks.append((cur[0], cur[1], "\n".join(cur[2])))
            cur = None
        elif cur is not None:
            cur[2].append(raw)
    return blocks


def check_viz(blocks, viz_dir=None):
    """Return (issues, summary) — summary is None if the check could not run."""
    issues, jobs = [], []
    for line, name, src in blocks:
        if not re.match(r"^[a-z][a-z0-9-]*$", name):
            issues.append(("ERROR", line, "viz block needs a component name: ```viz <component>"))
            continue
        try:
            config = json.loads(src) if src.strip() else {}
        except ValueError as e:
            issues.append(("ERROR", line, f"viz {name}: config is not valid JSON ({e})"))
            continue
        jobs.append({"line": line, "name": name, "config": config})
    if not jobs:
        return issues, f"{len(blocks)} block(s)"
    if not shutil.which("node"):
        return issues, None
    vdir = os.path.join(CACHE, "viz")
    shutil.rmtree(vdir, ignore_errors=True)
    os.makedirs(vdir)
    missing = set()
    for name in ["_core", "_tree", "_array"] + sorted({j["name"] for j in jobs}):
        dest = os.path.join(vdir, name + ".js")
        if viz_dir:
            src = os.path.join(viz_dir, name + ".js")
            ok = os.path.exists(src)
            if ok:
                shutil.copy(src, dest)
        else:
            ok = fetch(VIZ_URL + name + ".js", dest)
        if not ok and name in ("_tree", "_array"):
            continue
        if not ok:
            if name == "_core":
                return issues, None
            missing.add(name)
    # node needs to know these are ES modules
    open(os.path.join(vdir, "package.json"), "w").write('{"type": "module"}')
    where = viz_dir or "the live site"
    for j in [j for j in jobs if j["name"] in missing]:
        issues.append(("ERROR", j["line"], f"viz component \"{j['name']}\" does not exist in {where} — use one listed in "
                                           "references/viz-components.md, or pass --viz-dir with the new component"))
    jobs = [j for j in jobs if j["name"] not in missing]
    if jobs:
        hjs = os.path.join(CACHE, "viz_harness.cjs")
        open(hjs, "w").write(VIZ_HARNESS)
        r = subprocess.run(["node", hjs, vdir, json.dumps(jobs)], capture_output=True, timeout=60)
        if r.returncode:
            return issues, None
        for res in json.loads(r.stdout.decode()):
            for e in res.get("errors", []):
                issues.append(("ERROR", res["line"], f"viz: {e}"))
    counts = {}
    for _, name, _ in blocks:
        counts[name] = counts.get(name, 0) + 1
    return issues, f"{len(blocks)} block(s) (" + ", ".join(f"{k} ×{v}" for k, v in sorted(counts.items())) + ")"


# ---------------------------------------------------------------- main

def report(issues):
    bad = False
    for level, ln, msg in sorted(issues, key=lambda x: x[1]):
        print(f"{level} line {ln}: {msg}" if ln else f"{level}: {msg}")
        bad |= level == "ERROR"
    return bad


def main():
    ap = argparse.ArgumentParser(description="Check a notes file against Kazuha's site.", add_help=False)
    ap.add_argument("path", nargs="?")
    ap.add_argument("-h", "--help", action="store_true")
    for f in ("--no-mermaid", "--no-viz", "--offline", "--mermaid-only", "--no-name-check"):
        ap.add_argument(f, action="store_true")
    ap.add_argument("--renderer")
    ap.add_argument("--viz-dir")
    ap.add_argument("--sitemap")
    ap.add_argument("--site-repo")
    ap.add_argument("--course", default=COURSE)
    ap.add_argument("--viewer")
    a = ap.parse_args()
    if a.help or not a.path:
        print(__doc__)
        sys.exit(0)
    renderer_desc = ("local module " + a.renderer) if a.renderer else "the live site module"
    renderer_err = None
    if a.site_repo:
        a.viz_dir = a.viz_dir or os.path.join(a.site_repo, "public", "assets", "viz")
        if not a.renderer and not a.mermaid_only:
            a.renderer, why = deploy_renderer(a.site_repo)
            if a.renderer:
                renderer_desc = why
            else:
                renderer_err = why
    text = open(a.path, encoding="utf-8").read().replace("\r\n", "\n")
    bad = False

    if a.mermaid_only:
        lines, off = text.split("\n"), 0
    else:
        if a.viewer:
            print("WARNING: --viewer is obsolete (ignored) — the check now uses the site's renderer module; "
                  "use --renderer FILE / --viz-dir DIR for local copies.")
        issues = []
        fields, fm_issues, body, off = split_frontmatter(text)
        issues += fm_issues
        name_issues, slug, lang = check_name(a.path, not a.no_name_check)
        issues += name_issues
        lang = lang or "en-US"
        lines = body.split("\n")
        lint_issues, links = lint(lines, off)
        issues += lint_issues
        if fields is not None and fields.get("kind") == "topic":
            want = (slug or "")[len("topic-"):] if (slug or "").startswith("topic-") else None
            t = fields.get("topics")
            if want is None:
                issues.append(("ERROR", 0, "a kind: \"topic\" note must be named topic-<topic id>.<lang>.md"))
            elif not (isinstance(t, list) and len(t) == 1 and t[0] == (want, [])):
                issues.append(("ERROR", 1, f"a topic note needs exactly 'topics:' + '  - {want}' (a bare id, no sections)"))
        if fields is not None and fields.get("kind") == "topic" and "order" not in fields:
            issues.append(("WARN", 1, "a topic note should set order (501 + its position in the course JSON) to sort after the lectures"))
        if fields is not None and lang in ("en-US", "zh-CN"):
            sib = re.sub(r"\.(en-US|zh-CN)\.md$", ".%s.md" % ("zh-CN" if lang == "en-US" else "en-US"), a.path)
            if sib != a.path and os.path.exists(sib):
                sf = split_frontmatter(open(sib, encoding="utf-8").read().replace("\r\n", "\n"))[0] or {}
                for k in ("kind", "order"):
                    if sf.get(k) != fields.get(k):
                        issues.append(("ERROR", 1, f"frontmatter {k} differs from {os.path.basename(sib)} — both languages need the same {k}"))
        if fields is not None and fields.get("kind") == "review" and fields.get("topics"):
            issues.append(("ERROR", 1, "a kind: \"review\" note has its own hub view — leave topics out"))
        if fields is not None and (slug or "").startswith("topic-") and fields.get("kind") != "topic":
            issues.append(("ERROR", 1, "a topic-<id> note needs kind: \"topic\" in the frontmatter"))
        if fields is not None and fields.get("kind") != "review":
            issues += check_topics(fields.get("topics"), lines, a.path, lang, a.course, a.site_repo)
        answer_issues, folds = check_answers(lines, off, lang)
        issues += answer_issues
        issues += check_sibling_folds(lines, a.path, lang, off)
        print(f"answers: {folds} folded")
        link_issues, link_note = check_links(links, a.course, a.sitemap, a.offline, a.site_repo)
        issues += link_issues
        if link_note:
            print("WARNING: " + link_note + ".")
        elif links:
            print(f"note links: {len(links)} checked against " + ("the site repo" if a.site_repo and not a.sitemap else "sitemap.json"))
        if renderer_err:
            print(f"WARNING: real render NOT checked ({renderer_err}).")
        elif a.offline and not a.renderer:
            print("WARNING: real render NOT checked (--offline).")
        else:
            res, why = site_render(body, lang, a.renderer)
            if res is None:
                print(f"WARNING: real render NOT checked ({why}).")
            else:
                issues += check_rendered(res, lines, off)
                print(f"render: done with {renderer_desc} (lang {lang})")
        if fields is not None:
            print(f"frontmatter: title = {json.dumps(fields.get('title', ''), ensure_ascii=False)}; "
                  f"summary = {json.dumps(fields.get('summary', ''), ensure_ascii=False)}")
            if isinstance(fields.get("topics"), list) and fields["topics"]:
                print("topics: " + "; ".join(t + (" §" + ",".join(sec) if sec else " (whole note)") for t, sec in fields["topics"]))
        if slug:
            print(f"Save as: src/content/notes/{a.course}/{os.path.basename(a.path)} in KKazuhaK/uci.kazuha.me  →  "
                  f"https://ics.uci.edu/~kazuhak/notes/{a.course.lower()}/{slug}/{lang}/")
        bad |= report(issues)
        e = sum(1 for x in issues if x[0] == "ERROR")
        print(f"lint: {e} error(s), {len(issues) - e} warning(s)")

    if not a.no_mermaid:
        blocks = mermaid_blocks(lines, off)
        res = render_all(blocks)
        if res is None:
            print(f"WARNING: could not set up mmdc/Chromium — {len(blocks)} Mermaid "
                  "block(s) NOT render-checked. Say so in the delivery report.")
        else:
            for ln, msg in res:
                print(f"ERROR mermaid block at line {ln}: {msg}")
            print(f"mermaid: {len(blocks) - len(res)}/{len(blocks)} blocks render")
            bad |= bool(res)
    if not a.no_viz and not a.mermaid_only:
        blocks = viz_blocks(lines, off)
        if blocks:
            vissues, summary = check_viz(blocks, a.viz_dir)
            for level, ln, msg in vissues:
                print(f"{level} line {ln}: {msg}")
            if summary is None:
                print(f"WARNING: could not load the viz components (no node / network) — {len(blocks)} viz "
                      "block(s) NOT checked. A broken viz block fails the site build: don't deliver unchecked.")
            else:
                e = sum(1 for x in vissues if x[0] == "ERROR")
                print(f"viz: {summary}, " + ("all valid" if not e else f"{e} error(s) — these would fail the site build"))
            bad |= any(x[0] == "ERROR" for x in vissues)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()

<!--
Procedure for the claude.ai skill "uci-cs121-notes-maker". The skill on
claude.ai is only a stub (trigger description + "clone the site repo, read this
file and follow it"); this folder is the single source of truth for the
procedure. Its scripts and references are shared with the IN4MATX 133 kit
(docs/skills/in4matx133-notes/), not copied. Change it with a normal commit to
main (authored by Kazuha Mo only); never re-upload a packaged skill.
-->

# UCI CS 121 weekly notes

Kazuha (third-year CS at UCI; codes in Go/Python/C++, years of homelab and
web-infrastructure experience) wants notes he can study from **instead of**
re-reading the slides, published on his UCI site (ics.uci.edu/~kazuhak,
built with Astro from the repo `KKazuhaK/uci.kazuha.me`; pushing to main
publishes) next to his ICS 45C, ICS 46 and IN4MATX 133 notes.
The notes must contain everything the week's slides contain — including
what is only in the pictures — in clear English. Not for answering a single
CS 121 question or doing the assignments (A1–A3).

**Organised by week, not by lecture.** CS 121 is a flipped class: each
week has ~3 pre-recorded video lectures (decks "Lecture 7", "Lecture 8" …)
plus the Wednesday in-person deck ("Lecture 6.5") that recaps them. The
decks of one week repeat each other heavily, so one note per week, with
the week's material merged by concept, is the natural unit.
`Week 3` → `week-03.en-US.md`. If he asks for several weeks or
"everything for Quiz 2", make one file per week.

**The deliverable is one `.md` file** (plus any new viz component `.js`
files for his site). No image files, no zip. It goes into his site repo
as `src/content/notes/CS-121/week-NN.en-US.md`, and pushing to main
publishes it (Step 6); the site renders it and builds the course hub, prev/next,
home page and sitemap from its frontmatter (`title` + `summary`, see
Step 4). The only images allowed are slide screenshots on his jsDelivr
assets CDN (`https://cdn.jsdelivr.net/gh/KKazuhaK/assets@main/ics.uci.edu/cs-121/week-NN/<name>.png`),
used only when a figure can't be a demo, table or text — deliver the
cropped PNG with the note. Otherwise:
code in fenced blocks (`python`, `text` for pseudocode, `bash`, `html`,
`xml`), formulas in KaTeX (`$…$`, `$$…$$`), slide tables as Markdown tables,
algorithms as `viz` demos.

## The kit: this repo

Everything this procedure uses lives in `KKazuhaK/uci.kazuha.me`: this file
(`docs/skills/cs121-notes/SKILL.md`), the shared scripts and references of
the IN4MATX 133 kit (`docs/skills/in4matx133-notes/` — same renderer, same
house style; its `check_md.py` has the strict "every `<tag>` in backticks"
rule, which CS 121 needs: crawling and HTML-parsing slides name tags
constantly), the viz components and their catalog
(`public/assets/viz/`, `README.md` there), the note format
(`docs/notes-authoring.md`) and the notes themselves. **The repo is the
single source of truth**: never use script or reference copies bundled
with a claude.ai skill, and don't reimplement a script ad hoc. If a script
needs a fix, fix it in the IN4MATX 133 kit with a commit (it's shared).

The stub skill has already attached the repo (`add_repo`, access `push`
when you will publish, `read` otherwise) and cloned or pulled it to
`/home/claude/uci.kazuha.me` (`git clone --depth 1
https://github.com/KKazuhaK/uci.kazuha.me /home/claude/uci.kazuha.me`, generous
timeout). Pull again before each week. Publishing is "push to main" (Step 6).

```bash
SITE=/home/claude/uci.kazuha.me
K=$SITE/docs/skills/cs121-notes        # this file
S=$SITE/docs/skills/in4matx133-notes/scripts      # render_slides.py, check_md.py, viz_preview.py, word_count.py
R=$SITE/docs/skills/in4matx133-notes/references   # viewer-markdown.md, sources.md, viz-components.md (web-demo)
V=$SITE/public/assets/viz              # components + README.md (catalog and authoring contract)
# new components go in $V/ (+ a row in $V/README.md)
python3 -I $S/check_md.py $SITE/src/content/notes/CS-121/week-NN.en-US.md --course CS-121 --site-repo $SITE
python3 -I $S/viz_preview.py $SITE/src/content/notes/CS-121/week-NN.en-US.md --viz $V --out <work>/shots --steps 1,last
```

`--site-repo` validates `viz` blocks against `$V`,
checks note links against the repo's notes, and takes the renderer module
from the repo's `deploy` branch (CI's latest build — the script runs
`git fetch origin +refs/heads/deploy:refs/remotes/origin/deploy` and
`git show origin/deploy:assets/js/kzh-markdown.mjs` itself; a depth-1
clone tracks only main, so a plain `git fetch origin deploy` isn't
enough). No access to ics.uci.edu and no build needed; the output should
say `render: done with deploy branch @ <sha>`. **`--course CS-121` is
required** (the script's default course is IN4MATX-133).

Before writing, read `$R/viewer-markdown.md` (the traps: bare `<tag>`
rendered as real HTML, setext headings, lone `$`, tags in headings breaking
anchors, lists inside `>`). Its file names and links say IN4MATX-133; for
CS 121 the file is `week-NN.en-US.md` in `src/content/notes/CS-121/`.
`check_md.py` caches under `~/.cache/in4matx133-notes` — that's fine to share.

## Where the material is

**Canvas is the source of truth for slides** (course id `87165`, Canvas MCP):

- `list_course_files 87165` lists every deck as
  `f2026-i141c121-lectureN.pdf`, with X.5 decks as `lectureNp5.pdf`
  (`lecture6p5.pdf` = Lecture 6.5). The claude.ai Project "CS 121" holds
  some decks as `…-compressed.pdf` attachments, but **not** the X.5 decks
  and not always the newest ones — use the Project copy only when it's the
  same lecture, and fetch the rest from Canvas.
- `read_course_file 87165 <file_id>` saves the original PDF and prints its
  path; copy it into `<work>/decks/lecN.pdf` (use `lec6p5.pdf` for 6.5).
  Don't use `read_course_file_text` as the source — it loses every figure.
- **No Canvas MCP in the session?** Two fallbacks, in this order: (1) decks
  Kazuha uploads to the chat or the Project (Canvas file names keep their
  prefix: the cross-listed `f2026-s141c121-…` from L23 on is the same course
  as `f2026-i141c121-…`); (2) Claude in Chrome on his signed-in Canvas: open
  `https://canvas.eee.uci.edu/api/v1/courses/87165/files?per_page=100&sort=created_at&order=desc`
  in a tab and call the API from the page with `fetch(..., {credentials: 'include'})`
  (strip the `while(1);` prefix before `JSON.parse`): `/files?search_term=lecture`
  for decks and their ids/sizes, `/assignments?per_page=100` and
  `/quizzes?per_page=100` for dates (UTC; convert to Pacific). Compare sizes
  to tell whether a Project copy is the same file. Close the tab when done.
- **The week → deck map** is the Schedule. Read the Project doc
  `Schedule.md` (`project_read`) every run — the professor edits it — and
  take that week's row: Topic, Readings, decks, and the logistics in bold
  (quiz, assignment deadlines). Its links carry the Canvas file ids. Map as
  of Nov 20, 2026 (ids from the Canvas files API):

| Week | Date | Decks (Canvas file id) | Readings (outbound links only) |
|---|---|---|---|
| 1 | 30 Sep | L1 (37048454), L2 (37059126), L3 (37059127) | Basic computing skills booklet (Canvas 37013271); Croft Ch 1–2 |
| 2 | 07 Oct | L3.5 (37139345), L4 (37112962), L5 (37112963), L6 (37112964) | Croft Ch 3; Yandex leaked factors file (Canvas 37013257, "if you are curious") |
| 3 | 14 Oct | L6.5 (37217243), L7 (37211256), L8 (37211257), L9 (37211258) | Croft Ch 3 |
| 4 | 21 Oct | L9.5 (37557083), L10 (37285116), L11 (37285118), L12 (37285119) | Croft Ch 3; Ch 4 up to 4.4 |
| 5 | 28 Oct | L12.5 (37557073), L13 (37395733), L14 (37395734) | Croft Ch 4 to 4.4; Manning IIR Ch 1 |
| 6 | 04 Nov | L14.5 (37579499), L15 (37557070), L16 (37557000) | Croft Ch 5; IIR Ch 2, 4 |
| 7 | 11 Nov (no in-person class) | L17 (37715927), L18 (37715928), L19 (37715929), L20 (37715930) — no L17.5 | Croft Ch 5, 7; IIR Ch 2, 4 |
| 8 | 18 Nov | L20.5, L21 (37715931), L22 (37715932) | Croft Ch 7; IIR Ch 6, 7 |
| 9 | 25 Nov | L23, L24, L25 | Croft 4.5; IIR Ch 21; PageRank and Google papers (Canvas) |
| 10 | 02 Dec | L25.5, L26, L27 | Croft Ch 8, 9; IIR Ch 8, 14 |

  **Done so far**: look at the repo, not at a list here —
  `ls $SITE/src/content/notes/CS-121/` (en-US and zh-CN per week; by
  Nov 20, 2026 Weeks 1–9 exist in both languages; Week 6 was written before
  L14.5 was posted and doesn't include it yet). For recap links, read the
  earlier note's `##`/`###` headings and build the anchor from them (rule in
  viewer-markdown.md); `check_md.py` verifies every anchor.

  **X.5 decks don't always recap their own week.** L6.5 replayed the same
  week's videos, but L20.5 (Week 8 in the Schedule) is the in-class recap
  of the *previous* week's videos (L17–L20) plus Week 8 announcements. Follow
  the Schedule for which note lists the deck (Kazuha, Nov 2026: "按 syllabus
  来"): the X.5's own week cites it in the scope note and logistics and links
  back; what the X.5 adds to the earlier week's concepts (in-class emphasis,
  a labelled formula, an extra architecture build) goes into that earlier
  week's note as `🗣️ In class` lines with its page cites, in both languages.
  A week with no in-person class (Week 7) still is a week.

  Decks without an id weren't posted yet; look them up with
  `list_course_files` (search `lectureN`). If a deck in the row still isn't
  on Canvas, write the week from the decks that are, and say in the report
  that the week is **provisional — L9.5 missing**, so he can re-run later.
- **Not available**: the YuJa videos (and the "Lecture 8 bonus on tmux
  (on YuJa only)"). The notes are built from the slides; name the
  video-only items in the report.
- **Not lecture material**: assignment specs (A1–A3, e.g. the Project's
  `Assignment1-Text-Processing.md`) and Canvas quizzes. Don't solve
  assignments. Deadlines and quiz dates go in the logistics box. But
  assignment *advice that is on a slide* (the tmux cheat sheet, "errors
  that look like `_pickle.PicklingError`…") is slide content — cover it in
  the "In-class notes & assignment tips" section.
- **Course info** (front page `get_front_page 87165`): flipped class,
  Wed 5–7:50 pm HIB 100, quizzes open-book/open-slides on Canvas in class,
  lowest quiz dropped, paper final weighted as a quiz. Use it only to
  resolve logistics; Week 1 notes summarise course policy briefly because
  Lecture 1 covers it.

## Textbooks and slide links: outbound links only

Kazuha's rule for this course (Oct 2026), the same as IN4MATX 133: **the
slides are the only content source.** The Schedule's readings and every
URL on the slides become links the reader can click out to; never fetch,
summarise or paraphrase them into the notes, and don't add outside
knowledge beyond a one-line clarification where a slide is ambiguous or
wrong.

- **Readings**: Croft, Metzler & Strohman, *Search Engines: Information
  Retrieval in Practice* — https://ciir.cs.umass.edu/downloads/SEIRiP.pdf
  (required); Manning, Raghavan & Schütze, *Introduction to Information
  Retrieval* — https://nlp.stanford.edu/IR-book/pdf/irbookonlinereading.pdf
  (recommended). List the week's readings once in the scope note, and in
  each concept section put the matching **section** link in its `🔗` line,
  labelled with the section and its book page: "Croft §3.2.2 The Web
  Crawler (book p. 35)". Get section titles and book page numbers from the
  table of contents only: `project_read` on the Project's `Search Engines -
  Information Retrieval in Practice.pdf` returns a text file (the TOC is
  near the top, ~lines 87–150) — never read its body. No PDF is reachable
  here, so `#page=N` anchors aren't possible; link the PDF itself.
  Canvas files link as `https://canvas.eee.uci.edu/courses/87165/files/<id>`.
- **Slide URLs**: extract annotations and typed URLs with the snippet in
  `$R/sources.md` ("Links from the slides"). Typed URLs often lose their
  spaces/dashes in extraction (`http://www.cnn.com/robots.txt•http://en.…`)
  — fix them by looking at the page. Label each from what the slide says.
  Leave out: `mailto:`, example URLs that are the *subject* of a slide (a
  URL-normalisation example, `http://www.ics.uci.edu/~lopes` as a trap
  example — those stay in the text as `code`), and duplicates.
- **Many slide figures are textbook figures** (Croft's pseudocode, the
  Simhash example, plots). Transcribe what the slide shows — that's slide
  content — but write the explanation in your own words; this is a public
  page, and slide 1 forbids commercial duplication and credits Croft /
  Addison Wesley.

## Overlap: merge within the week, link across weeks

- **Within the week**, the X.5 deck replays slides from the week's video
  decks, and video decks repeat each other's openers (L2 p4 = L1 p36's
  definition of IR). Merge every copy into the one concept section; cite all
  pages (`L7 p13 · L6.5 p13`). What only the X.5 deck has — the in-class
  emphasis ("Main point: Just because you can, doesn't mean you should",
  L6.5 p29), extra builds, the tmux cheat sheet, troubleshooting — goes into
  the matching concept section or "In-class notes & assignment tips".
- **Across weeks**, content taught in an earlier week is not rewritten:
  one sentence of recap and a link to that week's notes — a relative link
  to the source file: `[Week 3](week-03.en-US.md#2-robotstxt)`; another
  course: `[Lecture 4](../ICS-46/lec-04.en-US.md)`. A link to a week not
  written yet shows as plain text until it exists.
  If the later deck adds something new to it, write the new part in full.
- **The recurring "Architecture" slide** (Text Acquisition → Text
  Transformation → Index Creation → Querying …) opens most decks as a
  you-are-here map. Explain it once (Week 1); in later weeks, one line
  saying which box this week's material lives in.
- **Stale builds**: the in-class decks sometimes carry dates from an older
  offering in early frames (L6.5 p4 "Test: until April 22nd", fixed to
  "Oct 23rd" on p5). The last frame of a build wins; never copy a stale date.
- **Quiz access codes** (Lecture 1 shows how to open Quiz 0) and any
  password on a slide never go in the public notes: write "access code
  given in class (L1 pN)". The same goes for other things that are private
  or only work in the room: PollEverywhere join links, site-verification
  tokens visible in screenshots, personal profile URLs used as examples
  (`graph.facebook.com/<a person>`).
- **Dates: Canvas wins.** Check every deadline and quiz date on a slide
  against `list_assignments 87165` / `list_quizzes 87165`. When they
  disagree, write the Canvas date and flag the slide in one line (L6.5 p8
  says A2 deployment ends "Nov 30th"; Canvas and the earlier frames say Oct
  30, 9 pm — a slide typo).

## Three rules that decide whether the notes are any good

**1. Every page is accounted for, and every image is looked at.** The
decks are mostly text, but the pseudocode (`CrawlerThread`), the robots.txt
examples, sitemaps, Simhash/fingerprint walk-throughs, encoding tables and
plots are images; and long animation builds reveal one bullet per frame
(L7 p27–34). Render every page; open every VISUAL-ONLY / TEXT+VISUAL page
full size; skim the TEXT pages on contact sheets. For a build, read the
**last** frame in full and note what each earlier frame adds only if the
order matters.

**2. Organise by concept, not by deck.** One section per idea ("robots.txt
and sitemaps", "Simhash"), with every deck's slides on it, the pseudocode,
the demo, the pitfalls and the links inside it. No "Lecture 8" or
"In-class review" sections. Two planned exceptions, both at the end:
"In-class notes & assignment tips" (only what has no concept home) and
"Worked Examples (with Solutions)".

**3. Lean: the knowledge point + an example, slides first.** Kazuha's
verdict on his heavy ICS 46 notes: too much to read. Per concept: the point
as the slides make it (1–4 plain sentences) → the slide's pseudocode /
formula / table → **one** example (a demo, a small worked case, a table) →
at most one `⚠️ Pitfall` (a real quiz trap) → the `🔗` line. No essays.
About **4,000–7,000 words per week** including code (`word_count.py`
prints the per-lecture 2,500–4,500 target of the other skills — ignore
that line; for a week, keep prose under ~5,500). Lean never means dropping
slide content: every page's content is somewhere, briefly. (Actual: Week 1,
three light decks ≈ 3,700; Weeks 2–3, four decks ≈ 6,100–6,200 — that's
the expected range.) Slide errors stay, as one line (slide version → fix).

## Workflow

### Step 1 — Gather the week's decks and render them

1. `project_read Schedule.md` → the week's row. Fetch each deck
   (Canvas first, see above) into `<work>/decks/`.
2. Render each deck:
   `python3 -I $S/render_slides.py render <work>/decks/lec7.pdf <work>/lec7 --prefix lec7`
   (`--prefix lec6p5` for 6.5). Read every `inventory.md`. Its "first line"
   column shows the footer (`Department of Informatics, UC Irvine7`) — the
   slide title is right after the page number.
3. Open the visual pages full size and the rest on contact sheets
   (`render_slides.py sheet <work>/lec7 out.png 2 3 4 …`, ~12 per sheet).
   Record per page: what it shows, pseudocode/code (verbatim), formulas,
   tables, any worked example, links, and its topic.
4. Cross-deck matching: the same title and body in two decks is the same
   slide. Text matching finds most of it:

   ```bash
   python3 -I - <work>/decks/*.pdf <<'EOF'
   import sys,re,difflib; from pypdf import PdfReader
   D={f.split('/')[-1]:[re.sub(r'\s+',' ',p.extract_text() or '') for p in PdfReader(f).pages] for f in sys.argv[1:]}
   ks=list(D)
   for a in range(len(ks)):
     for b in range(a+1,len(ks)):
       for i,x in enumerate(D[ks[a]],1):
         r,j=max((difflib.SequenceMatcher(None,x,y).ratio(),j) for j,y in enumerate(D[ks[b]],1))
         if len(x)>60 and r>0.8: print(f'{ks[a]} p{i} ~ {ks[b]} p{j} {r:.2f} | {x[35:95]}')
   EOF
   ```

   Image-only pages (the pseudocode, robots.txt screenshots) match only by
   eye — compare them on contact sheets.

### Step 2 — Topic skeleton and checklists

List the week's concepts (usually 8–15) in teaching order: the video
decks' order, with the X.5 deck's material slotted where it belongs.
Assign **every page of every deck** to a concept, "admin" (announcements,
"Today…" agendas, quiz reminders → logistics box), "tips" (In-class notes
& assignment tips), "recap → Week N", or "skip" (a pure photo/meme, with
the reason). Save `<work>/checklist.md` before writing:

```
## Permission to crawl: robots.txt
- [ ] L7 p16–19 · L6.5 p16–21: Robots Exclusion Standard, root file, no formal standard
- [ ] L7 p18 table: exclude all / allow all / exclude a part / single robot (transcribe all 5 examples)
- [ ] L7 p24: Allow inside a Disallowed folder
- [ ] L8 p4: robotstxt.org guidelines link
- [ ] viz: robots-txt (match a few URLs against the CNN file)
- [ ] worked example → Worked Examples
- [ ] links: robotstxt.org, cnn.com/robots.txt, Croft §3.2.x
```

Write only after every concept has its list; tick as you write.

### Step 3 — Verify every computation

The slides' worked examples (Simhash on the "Tropical fish…" text,
fingerprint similarity with a threshold τ, UTF-8 encoding of π = U+03C0 →
`CF 80`, the back-of-the-envelope crawl time for 1M pages at 500 ms, word
counts, Zipf/Heaps estimates, tf-idf and cosine scores, PageRank
iterations …) must be reproduced in a scratch Python file in `<work>/` and
run. Use the slide's own inputs (its given hash values, its counts) — not
your own hashing — so the result matches the slide. The notes state only
results the script produced. If the slide's arithmetic is wrong, keep the
slide's number, flag it in one line, give the corrected one. **No invented
numbers**: when a slide only defines something (CPM / CPC / CPA), don't add
an "illustration" with made-up prices, even labelled as such — it's outside
content. Arithmetic directly on the slide's own figures (summing a chart's
bars) is fine; say it's your sum. Python code shown in the notes (a
tokenizer, a robots.txt check with `urllib.robotparser`, a fingerprint
function) must run, with its real output in a comment or a short block
after it.

### Step 4 — Write the notes

English, the way a strong TA explains in office hours — direct, concrete,
"here's what goes wrong if you don't". The course language is Python; show
code in Python. Kazuha's own background helps for systems topics (DNS
latency, HTTP status codes, async I/O, caches): a Go or networking
comparison is fine where it genuinely clarifies, in one line.

Per concept section:
- **Explanation** (following the slides), then the slide's pseudocode
  (`text` fence, verbatim — keep `procedure CrawlerThread(frontier)` and its
  layout) or formula (KaTeX), then the example.
- **Formulas**: `$…$` inline, `$$…$$` display. Define every symbol in the
  sentence after the formula. Never leave a bare `$` in prose (write
  amounts as "USD 294B" or in `code`).
- **Slide tables / figures** → Markdown tables (robots.txt rule table,
  encoding table, Freshness vs Age); a plot → one sentence on what it shows
  plus its axes and the trend.
- **Demos**: one `viz` block per concept where an algorithm or a state
  change is the point (see "Viz demos"); text still states the result.
- **Callouts**: `> ⚠️ **Pitfall**:`, `> 💡 **Key Insight**:`,
  `> 📝 **Practice**:` (link to the worked example), `> 🗣️ **In class**:`
  (the professor's emphasis from the X.5 deck, e.g. "Just because you can,
  doesn't mean you should"), `> 🔗 **Go deeper**:` (slide links + textbook
  section). Keep tables and lists outside `>`.
- **Worked Examples (with Solutions)**: every slide example with a
  computation or a concrete decision (which robots.txt rule applies, is this
  URL a trap, are A and B near-duplicates at τ = 0.9) gets one `###`, in
  teaching order, titled `N.k <what it computes> (L12 p11–15)`. State the
  problem with the slide's data, then the solution: each step, the result
  from Step 3, and the key reason. No invented problems — only what the
  slides work through (a slide question that the next slide answers counts).
  The concept section states the result too and links down with
  `📝 Practice`. The solution goes in a fold block, exactly:

      <details>
      <summary>Solution</summary>

      …the answer…

      </details>

  Blank lines after `<summary>` and before and after `</details>` (an HTML
  block runs to the next blank line and swallows what follows). Only the
  answer goes inside: the question, headings, the "Back to …" link and
  🧪 / 🔗 callouts stay outside. No "Try it first" line — the closed fold
  already makes the reader try first. A zh-CN translation keeps the same
  folds in the same order (the site restores the reader's open answers by
  position) with `<summary>解答</summary>`. Fold nothing else unless it is
  long and non-essential — never as a blanket rule. `check_md.py` checks
  all of this.

Note structure:

```markdown
---
title: "<short card title, e.g. Web Crawling>"
summary: "<one sentence listing this week's topics>"
---

# CS 121: Information Retrieval — Week N: <topics from the Schedule row>

## Table of Contents

- [1. <Concept>](#1-concept)
- ...

> UCI CS 121 / IN4MATX 141: Information Retrieval — Prof. Alberto Krone-Martins, Fall 2026, week of <date>
> Built from Lectures <6.5, 7, 8, 9> (slides; the YuJa videos are not included). Organized by concept, not by lecture.
> 📖 Readings this week: [Croft, Ch 3](…) · [IIR Ch 1](…)

> 📅 **Class logistics**: <quiz / deadlines from the Schedule row and the slides, checked against Canvas, one line each>

---

## 1. <Concept>
### 1.1 ...
...
## N-2. In-class Notes & Assignment Tips      (only if the week has some)
## N-1. Worked Examples (with Solutions)
## N. Quick Reference & Top 5 Things to Remember
```

The quick reference: one table per family (robots.txt directives, crawler
problems → fixes, encodings, duplicate-detection methods, formulas …); "Top
5" = the five ideas most likely to cost points on the quiz, one sentence
each.

**Frontmatter** — `title` and `summary` (JSON-style double-quoted strings),
then a `topics:` block, then one blank line, then the body's own `#` title.
`title` is the short name on the course hub card; `summary` is one sentence
listing the week's topics. `topics` assigns the week's numbered sections to
the topic ids in `src/content/courses/CS-121.json`
(`  - { id: crawling, sections: "1-13, 15.1-15.6" }`; both ends of a range at
the same level; leave out course intro, In-class Notes & Assignment Tips and
Quick Reference; a "Where we are" §1 goes in only when it carries real
content, e.g. week-06/07 §1 → indexing; see `docs/notes-authoring.md` §2). The en-US and zh-CN files
carry the identical block. The hub, prev/next, home page and sitemap are
generated from these — there is no index page or catalog to update by hand.

### Topic notes (`topic-<id>`) — keep them in step

Each topic in the course JSON also has one **topic note**,
`src/content/notes/CS-121/topic-<id>.<lang>.md` (`kind: "topic"`,
`topics:` + `  - <id>`, `order: 501 +` its position in the course JSON), the
only card for that topic in the hub's By topic view. It is a self-contained
textbook chapter: motivation → definitions → methods/algorithms → analysis →
variants → comparison → practice → quick reference, one explanation per
idea, one naming scheme, and **no sources or course plan** (no slides,
lectures, weeks, videos, instructor, A1–A3, quizzes, dates, scope or
grades). Every concept, formula, table, worked example, pitfall and viz demo
from the weeks is kept (viz JSON as in the week note except `title`, minus
slide cites in code comments; the zh-CN copy takes the week zh-CN's step
`note` text and `"lang": "zh"`); supplements
are `> 📘 **Going further**:` callouts; practice sits in `### N.M Practice`
at the end of its `##`, one `####` per problem, answer folded under
`Solution` (zh-CN: `解答`); Python is run and its real output shown. Links go only to other
`topic-<id>` notes, never to `week-*.md`. Title line:
`# CS 121: Information Retrieval — Topic: <label>` /
`# CS 121: Information Retrieval — 话题：<中文标签>`; zh-CN callouts
⚠️ **易错点** / 💡 **关键洞见** / 📘 **延伸阅读** / 📝 **练习**.

**Rule: when a new week adds material to a topic, merge it into that
topic's note too (en-US and zh-CN) in the same push**, and add the week's
`topics` block. A week that needs a **new topic id** waits: ask Kazuha
before adding the id to the course JSON.

## Viz demos

The site turns ```` ```viz <component> ```` + a one-line JSON config into
a step-through demo. Components live in his site repo
(`public/assets/viz/<name>.js`, catalog in that folder's `README.md`;
read them in the site repo clone). A broken viz block fails the whole site
build, so every block must pass `check_md.py`. What exists:

**What exists: read `$V/README.md`** — its catalog rows say which course
and week each component was built for (CS 121 ones are tagged
`CS 121 W<N>`: `tokenize`, `crawl-frontier`, `robots-txt`, `utf8-encode`,
`shingle-fingerprint`, `simhash`, `porter-step1`, `incidence-matrix`,
`inverted-index`, `postings-intersect`, `query-eval`, `tfidf-cosine`,
`pagerank` as of Nov 20, 2026), and each `.js` file's `meta.params` is the
full parameter reference (types, defaults, limits). Don't keep a copy of
that catalog in this file. All take `code` = `"python"` (default) or
`"none"`, plus the common `title`, `interactive`, `start`. Reuse them in
later weeks (e.g. a recap demo) instead of writing near-duplicates.

**Language in zh-CN notes**: components that declare a `lang` param
(`postings-intersect`, `inverted-index`, `incidence-matrix`, `porter-step1`)
need `"lang": "zh"` in the zh-CN note's config; the others follow the page
language automatically (the player passes it as `config._lang`; components
call `tr(config)` from `_core.js`). Don't add `lang` to a component that
doesn't declare it.

Other components:

- `web-demo` (`$R/viz-components.md`): HTML/CSS/JS with a console. Good
  for anything a few lines of JS can show — URL parsing, a regex, counting
  words; also for HTML-parsing slides (link extraction, "content blocks"
  from tags) with the page in `html`.
- ICS 46 components (data structures in C++) — rarely a fit here.

Kazuha's choice for this course (Oct 2026): **when an IR algorithm is the
lesson and `web-demo`'s console would only print the final answer, write a
new component.** A closed-form curve (L9's expected age) or a static
picture (the architecture diagram — a small Mermaid diagram is fine) is not
a step-by-step algorithm. Possible ones still to come: `hits` (hub/authority
iteration), `precision-recall` — only if a deck walks through one with
numbers. Before writing one, check it doesn't already
exist in `$V/`.

Writing a component — follow the authoring contract in
`$V/README.md` (`meta`, `validate`,
`steps`, `render`, optional `code`/`legend`/`input`; import only
`./_core.js`; DOM-free at import; validation errors name the param). Read
`_core.js`, `_player.js` and an existing component in the site repo first.
For CS 121: the code panel is **Python** (`code: { python: [...] }`, option
`"python"` default, `"none"`), lines ≤ 48 characters; default config = the
slide's own example; name it by what it shows, flat in `public/assets/viz/`.
Test under node (good and bad configs, final state), put the file in
`$SITE/public/assets/viz/` (with its `README.md` row), validate and preview the note with the commands
in "Tooling", and look at the screenshots. The `.js` and its README row
(component · week · what it shows) are committed with the note (Step 6);
the README row is the catalog entry — nothing to add to this file.

Use demos sparingly: at most one per concept section (a worked example may
add a fixed one that checks the answer); `"interactive": true` on the main
one; title says which slides it reproduces (`"Simhash (L12 p7–15)"`).

## Step 5 — Verify before delivering

- `checklist.md` has no unticked items (or each open one is in the report).
  Every page of every deck is accounted for; spot-check three VISUAL pages
  and one long build against the notes.
- No concept appears in two places; search for each key term (`robots`,
  `fingerprint`, `trap` …).
- Every worked example is in the Worked Examples section with the slide's
  data and a solution whose numbers came from the Step 3 script; linked
  both ways.
- No textbook or linked page's content crept in; every slide URL and the
  week's readings are in `🔗` / `📖` lines.
- Dates in the logistics box match Canvas; no access code, join link or
  token from a slide; no invented example numbers.
- `python3 -I $S/check_md.py <notes.md> --course CS-121 --site-repo $SITE`
  — fix every ERROR (missing/empty frontmatter, bad file name, legacy
  `?kind=course_notes` links, images not on the assets CDN, bare tags,
  setext headings, dead anchors, bad viz configs, Mermaid). WARNs for links
  to weeks not written yet are fine. CI runs the same checks, and a broken
  viz block, frontmatter or file name fails the build so nothing is
  published. The render line must say `deploy branch @ <sha>`; if any check
  prints "NOT checked", say so in the report.
- `python3 -I $S/word_count.py <notes.md>` — in the week range above.

## Step 6 — Deliver

**With the site repo in this session** (`KKazuhaK/uci.kazuha.me` attached
with push access) — publishing is "push to main": GitHub Actions (workflow
`site`) runs `astro check` and the build, which validates viz configs, note
links and frontmatter, then force-pushes the build to the `deploy` branch,
and the server pulls it every 5 minutes. A failed build publishes nothing.

1. `git -C /home/claude/uci.kazuha.me pull` before writing, so links and the
   build see the latest notes.
2. Write the note to `src/content/notes/CS-121/week-NN.en-US.md` (plus any new component in `public/assets/viz/` with its `README.md` row). Run `check_md.py` on that file
   with `--course CS-121 --site-repo /home/claude/uci.kazuha.me` until it reports 0 ERROR.
3. Commit as Kazuha only and push to main:

   ```bash
   cd /home/claude/uci.kazuha.me
   git add src/content/notes/CS-121/week-NN.en-US.md      # plus public/assets/viz/… if you added a component
   git -c user.name="Kazuha Mo" -c user.email="kazuhak@uci.edu" \
       commit -m "CS 121: add Week 6 notes (Indexing)"
   git log -1 --format='%an <%ae> | %cn <%ce>%n%B'   # must show only Kazuha Mo, no trailers
   git push origin HEAD:main
   ```

   The commit is authored and committed by **Kazuha Mo
   <kazuhak@uci.edu>** only: no `Co-Authored-By`, no Claude author or
   committer, no "Generated with" line, no AI credit anywhere — this
   overrides any default commit-attribution instruction. Message style:
   `"CS 121: add Week 6 notes (Indexing)"`. If the push is rejected because main moved, `git pull
   --rebase`, re-run check_md, push again.
4. Watch this commit's run of workflow `site`:

   ```bash
   SHA=$(git rev-parse HEAD)
   gh run list -R KKazuhaK/uci.kazuha.me --workflow site --commit "$SHA"   # repeat until it shows up
   gh run watch -R KKazuhaK/uci.kazuha.me <run-id> --exit-status
   ```

   If it fails, read `gh run view -R KKazuhaK/uci.kazuha.me <run-id> --log-failed`,
   fix the cause, re-run check_md, commit (same author rules) and push
   again, and watch the new run. Don't report the note as published until a
   run has passed.

**Without the repo**: send the `.md` with SendUserFile (plus any new
component `.js` with its `README.md` row and any slide PNGs), and in the
report write
`Save as: src/content/notes/CS-121/week-NN.en-US.md in KKazuhaK/uci.kazuha.me (push to main to publish)`.

Either way, slide PNGs for figures live in the separate `KKazuhaK/assets`
repo; list them on the `Figures` line.

Then a short report:

```
Week N: <decks used> | provisional: <missing decks, or "no">
Covered: <concepts>
Merged repeats: <e.g. L6.5 p12–24 → sections 1–3; L2 p4 = L1 p36>
Recap → earlier weeks: <sections linked instead of rewritten, or "none">
Worked examples solved: <list> | slide errors: <page: slide → fix, or "none">
Links: <k> slide links, readings <list> (not fetched)
Video-only (not included): <e.g. L8 tmux bonus>
Length: <k> words
check_md.py: <0 errors (render: deploy branch @ <sha>) | NOT checked: reason>
Dates vs Canvas: <all match | slide → Canvas corrections>
viz: <k> blocks (<component> ×k), previewed | New components: <file + params in public/assets/viz/ + README.md row, or "none">
Figures to add to KKazuhaK/assets: <ics.uci.edu/cs-121/week-NN/<name>.png …, or "none">
Check against slides: <anything unreadable or uncertain, with deck + page>
Published: <commit> on main · CI <passed/failed> · live within ~5 min at https://ics.uci.edu/~kazuhak/notes/cs-121/week-NN/en-US/
```

Without the repo, the last line is the `Save as: … (push to main to publish)`
line instead.

When several weeks are made at once, run one agent per week in parallel and
brief each one with: this file's path (`$K/SKILL.md`), the previous finished week's note
as the style reference, its decks (already downloaded into its work dir),
the Schedule row (subagents may not have the Projects tool), the topic
boundary with the neighbouring week, and **which new component names it
may write** so two agents never build the same one. Each run uses its own
work dir, its own copy of the clone (`cp -r $SITE <work>/site`, no pushing
from it), and its own HOME for `check_md.py`
(`mkdir -p <work>/home && cp -r ~/.pki <work>/home/; HOME=<work>/home …`).
Subagents can't write `report.md` (the harness blocks report files) — have
them return the report text in their final message. Afterwards the main
session: (1) reviews each note against these rules (invented numbers,
outside content, dates vs Canvas); (2) fills in the cross-week `#anchors`
the agents couldn't know; (3) copies every note and new component into
`$SITE`, re-runs `check_md.py --course CS-121 --site-repo $SITE` on all the
notes together, then commits (one commit per week, Kazuha as the only
author), pushes once and watches the CI run (Step 6). If two agents edit
`$V/README.md`, merge their new rows by hand — don't copy one agent's
README over the repo's.

## Translations (zh-CN)

Every week also gets `week-NN.zh-CN.md`, made **after** the English note is
final. Kazuha's rule (Nov 2026): **translation goes to a cheap model** —
run it as a subagent with `model: "haiku"`, never in the main (expensive)
session. Brief it with:

- the English file to translate and where to write the result (its own work
  dir; the main session copies it into `$SITE` after review);
- `docs/notes-authoring.md` §7 and an existing zh-CN week as the style model
  (headings with the same numbers, count and order; `## 目录`; callout
  labels ⚠️ **易错点** / ⚠️ **幻灯片错误** / 💡 **关键见解** / 📝 **练习** /
  🗣️ **课堂** / 🔗 **延伸阅读** / 📖 本周阅读 / 📅 **课程安排**; "Back to" →
  "回到[第 N 节](#…)"; "(book p. N)" → "（书中第 N 页）"; `<summary>解答</summary>`);
- keep code, pseudocode, math, URLs, slide cites, numbers and viz JSON
  unchanged except a viz `title`; `lang: "zh"` only for components that
  declare it (see "Viz demos");
- links to other weeks go to their zh-CN files with anchors built from the
  **Chinese** heading (rule in viewer-markdown.md); when the target week is
  being translated in parallel, wait for it or fix the anchors afterwards —
  don't give the agent guessed headings;
- reuse the series' terms (check earlier zh-CN weeks; e.g. precision =
  精确率, recall = 召回率, index elimination = 索引剪枝);
- run `check_md.py` on the result and match `## `, `### ` and `<details>`
  counts with the English file.

The main session spot-checks a few sections, fixes term drift, runs
`check_md.py` again in `$SITE` and commits the zh-CN file separately.
A small later edit to an English note (a new callout, extra page cites) is
also synced to its zh-CN file by a Haiku subagent.

In a run where you can't send files or ask (scheduled or delegated), save
the note, any component and the report in the output folder you were given
and say in the report what you decided instead of asking.

Be honest in the `Check against slides` line — a figure you couldn't read, a number you had
to reconstruct, or a deck you couldn't get should be named.
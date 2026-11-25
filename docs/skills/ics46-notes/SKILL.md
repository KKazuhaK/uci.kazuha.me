<!--
Procedure for the claude.ai skill "uci-ics46-notes-maker". The skill on
claude.ai is only a stub (trigger description + "clone the site repo, read this
file and follow it"); this folder is the single source of truth for the
procedure, its scripts and its references. Change it with a normal commit to
main (authored by Kazuha Mo only); never re-upload a packaged skill.
-->

# UCI ICS 46 lecture notes

Kazuha (third-year CS at UCI, took ICS 45C, codes in Go/Python/C++) wants
notes he can study from **instead of** re-reading the slides, and he
publishes them on his UCI static site (ics.uci.edu/~kazuhak) for everyone,
next to his ICS 45C notes. So the notes must contain everything the slides
contain — including what is only in the pictures — written in clear English.

**The deliverable is one `.md` file and nothing else.** No image files, no
code folder, no zip. It goes into his site repo (GitHub
`KKazuhaK/uci.kazuha.me`) as `src/content/notes/ICS-46/<slug>.<lang>.md`, and
pushing to main publishes it (Step 6); the Astro build renders it and builds
the course hub, prev/next, home page and sitemap from its frontmatter, so
anything that lives outside the file breaks or gets lost. (The one exception — slide
screenshots on his jsDelivr assets CDN — is in Step 4.) Code goes in fenced blocks; every diagram — data-structure states,
pointer/memory traces, array layouts, algorithm steps, plots — is an
interactive `viz` block (a JSON config the viewer turns into a step-through
player; see `references/viz-components.md`), not a static Mermaid picture;
slide tables become Markdown tables. Read `references/viewer-markdown.md` before
writing — the site's renderer is GFM (marked) with a few traps that matter for C++
notes, above all: `vector<int>` outside backticks is read as an HTML tag
and vanishes.

When several lectures are asked for at once, settle all the deck
boundaries first (see "Overlapping decks") and only then write each file.

One run = one lecture by default (`Lec 04` → `lec-04.en-US.md`).
If he asks for a week or a quiz range, make one file per lecture.

## The kit: this folder in the site repo

Everything this procedure uses lives in `KKazuhaK/uci.kazuha.me` under
`docs/skills/ics46-notes/` (this file, `scripts/`, `references/`). In the
commands below, `<kit>` means
`/home/claude/uci.kazuha.me/docs/skills/ics46-notes`. The stub skill has
already cloned or pulled the repo before you read this; if you run any
command later in a long session, `git -C /home/claude/uci.kazuha.me pull`
first so you use the current scripts. When a rule here changes (a new viz
component, a new check, a lesson from Kazuha's feedback), commit the change
to this folder in the same push as the note — that is how the skill stays
current.

The repo is public, so cloning works without access. Publishing (Step 6)
needs the repo attached with push access (`add_repo`, access `push`).

## Where the material is

- **Slides** (primary source): PDFs in the claude.ai Project "ICS 46", named
  like `Week 2 - Lec 04 - LinkedList.pdf`. In a session they appear as
  uploaded files (e.g. `/root/.claude/uploads/.../*Lec_04*.pdf`) or via the
  Projects tool (`project_read` returns text only — that is not enough, you
  need the actual PDF to render pages; find it on disk or ask him to attach it).
- **Schedule PDF** lists each lecture's supplement links. A ready map is in
  `references/sources.md` — read it to find this lecture's supplements.
- **Homework PDFs** are not lecture material, but their problems make good
  practice: quote a problem (original wording is fine) where its topic is
  taught or in a practice section at the end of the topic, with the worked
  answer folded in `<details>`. Never attach, link or upload the PDF itself.
- **Earlier lectures**: when a slide leans on something from a previous
  lecture (e.g. "implement a stack with our ArrayList"), use
  `project_search` (or the earlier slide PDF) to pull that lecture's exact
  API/definition rather than guessing. Restate what's needed in a sentence
  or two, and link the earlier notes with a relative link to the source
  file (`[Lecture 3](lec-03.en-US.md#anchor)`, see
  `references/viewer-markdown.md`; if that note hasn't been written yet the
  link shows as plain text until it is — still fine to include).

## Overlapping decks: the newer deck owns shared content

Yeh carries unfinished material over: the end of one deck often reappears
at the start of the next (Lec 05's "Analysis of Recursion" is repeated as
Lec 06's opening section; Lec 04's "Activity 5 & 6: Implementing Stacks"
returns as Lec 05's "Activity 0"; Lec 01's smart-pointer Activity 3 comes
back in Lec 02 with its solution). **Content that appears in two decks
belongs to the newer lecture** — its presence there means the earlier
lecture didn't get to it in class. Kazuha set this rule; apply it every
time, without asking.

- Before Step 1's reading, compare this deck with the **next** deck (and the
  previous one). Matches are slides with the same title and body, a
  reworded/renumbered activity ("Activity 5 & 6" → "Activity 0"), or an
  activity prompt that the next deck repeats together with its solution.
  Shared admin slides (title page, "Programming Environment") only go to
  the newer lecture's logistics box. Text matching finds most of them:

  ```bash
  python3 -I - <<'EOF' <this.pdf> <next.pdf>
  import sys,re,difflib; from pypdf import PdfReader
  t=lambda f:[re.sub(r'\s+',' ',p.extract_text() or '') for p in PdfReader(f).pages]
  A,B=t(sys.argv[1]),t(sys.argv[2])
  for i,a in enumerate(A,1):
      r,j=max((difflib.SequenceMatcher(None,a,b).ratio(),j) for j,b in enumerate(B,1))
      if len(a)>40 and r>0.6: print(f'p{i} ~ next p{j} {r:.2f} | {a[:60]}')
  EOF
  ```

  Image-only slides don't show up in text matching, so also put the last
  ~8 pages of this deck and the first ~10 of the next on contact sheets and
  compare by eye.
- Drop the repeated pages from this lecture's notes — the concept, the
  activity and its solution all go into the newer lecture's notes. Once a
  section is repeated in the next deck, treat its unrepeated tail as not
  reached too (Lec 05 p28 "Activity 5: binary search" sits inside the
  repeated recursion section, so it moves with it).
- Where the cut happens, end the last concept section with a one-line
  pointer so nothing looks lost:
  `> ➡️ **Continued in [Lecture N+1](lec-MM.en-US.md)**: <topics>`
- Pull in the repeated pages that this lecture's *previous* deck had
  (they belong here now) and read them from **this** deck's version, since
  the newer one may be edited or include the solution.
- If the next deck isn't available yet, write the notes from the whole deck
  and say in the delivery report that the boundary is provisional; when the
  next deck arrives, re-check and move overlapping sections.
- List the boundary in the delivery report:
  `Boundary: p50–51 → Lec 05 (repeated as p4–5); received p32–34 from Lec 01`.

## Three rules that decide whether the notes are any good

**1. Every slide is read as an image, not just as text.** Yeh's decks put the
class definitions, most code, and every diagram inside pictures. On the Lec 04
deck, 44 of 51 pages need visual reading; text extraction returns "SLL" for a
page that actually holds the full `SinglyLinkedList` class. Notes written from
extracted text silently lose the most testable content. So render every page,
open every non-trivial page with Read, and transcribe what's in the image.

**2. Organise by concept, not by source.** One section per idea (e.g.
"Inserting at an index"), with the slide content, the supplement content, the
diagram, and the pitfalls all inside that section. (In-class Activities are
the one planned exception — their prompts and worked solutions are gathered
in a practice section at the end, see Step 4 — but the *concept* an activity
teaches is still fully explained in its concept section.) Never a "Supplement" or "From the reading" section — when the same
idea is split across sections he has to stitch it back together while
studying and will miss pieces. This mirrors the ICS 45C notes skill, which
learned it the hard way.

**3. Lean: the knowledge point + an example, slides first.** Kazuha's
verdict on the first, heavy version (Oct 2026): too much to read, too many
diagrams. What he wants per concept is the point as the slide makes it, the
slide's code, and **one** example — that's enough. Concretely:

- Each concept section = the point in 1–4 plain sentences (following the
  slide) → the slide's code if it has any → one example (a short snippet
  with its real output, a small worked case, or a tiny table) → at most one
  `⚠️ Pitfall` (only a real exam trap) and at most one `📘 Beyond the lecture`.
  No multi-paragraph essays, no "why it matters" sections, no subsections
  for side topics.
- The slides are the content; outside sources only supplement a point the
  slide already makes — **at most ~4 `📘 Beyond the lecture` callouts per
  lecture**, never a topic the slides don't touch (no extra structures,
  variants, exercises or historical notes that aren't on a slide).
- Length: roughly **2,500–4,500 words** per lecture including code (a
  lecture that builds two classes may run ~5,000 because of the Complete
  Implementation block). If a draft is far over, cut repetition and side
  topics, not slide content.
- Slide bugs: keep every one, as **one line** (slide version → fix).
- Lean never means dropping slide content: every slide page still has its
  content somewhere, briefly.

## Workflow

### Step 1 — Render and inventory the slides

```bash
python3 -I <kit>/scripts/render_slides.py render <slides.pdf> <work>/lecNN --prefix lecNN
```

This writes `slides/lecNN-pXX.png` for every page and `inventory.md` with a
flag per page (VISUAL-ONLY / TEXT+VISUAL / TEXT / DIVIDER?) and which pages
are animation builds of the previous one. Read `inventory.md` first.

Then **open every page image with Read** except pure admin/title pages. For a
quick skim of many pages, make contact sheets
(`render_slides.py sheet <work>/lecNN out.png 10 11 12 13`), but transcribe
code and small labels from the full-size page, because contact sheets are too
small for exact code.

While reading, record for each page: what it shows, any code (verbatim), any
diagram, any question/blank box/"?" (these are in-class prompts), and which
topic it belongs to. Animation builds (consecutive near-identical pages) are
one step-by-step sequence — note what changes between frames, since that
change is the lesson.

### Step 2 — Read every supplement, then check for gaps

The slides are the main source, but **do this step every time, in full** —
it is the safety net for anything the slides only show in passing or that
you misread. Skipping it, or skimming half a page, is how things get missed.

Supplements for a lecture are (see `references/sources.md`):
- the schedule's links for that row (algs4 booksite, Thornton pages), and
- Thornton's ICS 46 notes pages for every topic the slides cover (the
  schedule says "ICS 46 notes" but usually doesn't link them — the topic
  map in sources.md does).

Match by **topic covered in the slides**, not by lecture number; a deck
often runs into the next schedule row (Lec 04's second half is stacks, so it
needs `13stacks` and Thornton's StacksQueuesDeques too). Fetch each page with

```bash
python3 -I <kit>/scripts/fetch_page.py <url> <work>/sup/<name>.md
```

then Read the whole saved file. (Don't use WebFetch here: it returns a model
summary, so you can't tell what was left out.) The script prints the word
count, the last heading, and same-site sub-pages — follow sub-pages that are
prose about this topic. Check each page arrived whole: it should reach its
natural end (algs4: the Q + A / Exercises / Web Exercises sections;
Thornton: the closing paragraphs). If a fetch fails, retry once; if it still
fails, say so in the delivery report — don't fill in from memory.

**Gap check.** For each supplement, list its sections/main points in
`<work>/supplement-check.md` and mark each one:
- `covered` — already in the notes from the slides (name the section);
- `added` — the slides touch this topic but the supplement adds something
  worth knowing (a definition, a caveat, a cleaner argument, a common
  mistake). Add it to the relevant concept section as a
  `> 📘 **Beyond the lecture**:` callout or a sentence in the text;
- `later` — belongs to a different lecture's topic (say which);
- `skip` — not useful for this course (say why in a few words).

Nothing stays unmarked. This turns "I looked at it" into something checkable,
and the counts go in the delivery report.

Keep supplement material in its supporting role: it fills gaps and sharpens
explanations; it doesn't grow the notes into a textbook chapter on topics
the lecture never touched. Read every supplement in full anyway (that's how
misreadings get caught), but put at most ~4 points into the notes as
`added` — pick the ones that clarify something a slide says; mark the rest
`skip (beyond the slides)` in the gap check. Write it in your own words — Kazuha publishes
these notes on his public UCI page, so don't paste the booksite's or
Thornton's sentences; a short quoted phrase is fine when the exact wording is
the point, with the source named.

algs4 code is Java. Kazuha hasn't learned Java: take the ideas, tables and
complexity results, and if code helps, write C++ in the style of Yeh's
slides (templates, nested `Node`, `size_t n`). No Java in the notes.
Thornton's code is C++ but in his own style; prefer Yeh's names and API when
they differ, and say so if the difference matters.

### Step 3 — Build the topic skeleton and checklists

List the lecture's concepts (usually 5–12), in the slides' order. Assign
**every inventory page** to a concept, or to "admin" (class news, extension
install, consent forms — these go in a one-line "Class logistics" box at the
top, not dropped, since due dates matter), or to "→ Lec N+1" for pages the
next deck repeats (see "Overlapping decks").

Before writing, save a checklist per concept to `<work>/checklist.md`
(page numbers below are illustrative; use your inventory's):

```
## BST insert
- [ ] slides pA–pB animation: walk left/right from the root, attach new leaf
- [ ] slide pC code insert(Node*& t, const T& x)
- [ ] supplement: algs4 3.2 note on insertion order and tree shape
- [ ] Activity N: insert 5,3,8,1 by hand, draw the tree
- [ ] pitfalls: duplicates, passing Node* by value instead of Node*&
```

Write only after every concept has its list. Tick items in the file as you
write them; Step 5 checks that nothing is left unticked. The list is the
thing that stops "I think I covered it" from quietly dropping a slide.

### Step 4 — Write the notes

Language: English. Explain the way a strong TA would in office hours —
direct, concrete, "here's what goes wrong if you don't". Use Python
comparisons only where they genuinely help (e.g. `list.append` amortisation
vs `ArrayList` doubling, Python names-are-references vs C++ pointers); never
Java.

Per concept section:
- **Explanation** first, then the slide's code/diagram, then the rest.
- **Code from slides**: transcribe into fenced `cpp` blocks, keeping Yeh's
  names and comments. If a slide shows a fragment or a TODO, give the slide
  version, then a completed version clearly labelled as yours. Slides
  sometimes have bugs (wrong field names, missing constructors, off-by-one
  range checks, Java leftovers); keep the slide version as shown, then flag
  the bug and give the fix — a quiz may test the slide as written.
- **Code must compile.** Assemble the lecture's class (e.g. `SinglyLinkedList`)
  into a scratch `.cpp` in the work dir with a small `main`, build it with
  `g++ -std=c++17 -Wall -fsanitize=address,undefined`, run it, and put the
  real output in the notes. Fix the notes, not the test, if something's off.
  The scratch file is for checking only and is not delivered; if the lecture
  builds a class, include it in the notes as one compact ```` ```cpp ````
  block with no prose in its own section ("Complete implementation").
- **Pictures and step-by-step diagrams → `viz` demos.** Nothing from the
  slides is embedded as an image, and nothing is drawn as a static Mermaid
  diagram or memdiag trace any more. For each slide picture that carries
  meaning:
  - a data-structure state or a sequence of operations (ArrayList trace,
    linked-list insert/remove, stack/queue trace, expression evaluation,
    sorting passes …) → the matching component from
    `references/viz-components.md`, configured with the slide's own example;
  - pointer / ownership / memory pictures (references, `new`/`delete`, smart
    pointers, a tree's links) → `memory-trace` with memdiag-format steps
    (every object with all its fields, arrows from the exact field, old
    values struck through, stale arrows shown) — 2–4 steps, each one
    meaningful change;
  - array layouts → `array-2d`; measured running times / log-log plots →
    `doubling-test`;
  - slide tables → Markdown tables; screenshots of code → ```` ```cpp ````
    blocks; photos/memes/timelines → one sentence or a short list (or skip if
    they carry no content).
  - No local image files, ever. The only images allowed are slide
    screenshots hosted on jsDelivr from his `KKazuhaK/assets` repo:
    `![alt](https://cdn.jsdelivr.net/gh/KKazuhaK/assets@main/ics.uci.edu/ics-46/<slug>/<name>.png)`.
    Use one only when a slide figure can't be a demo, table or text; deliver
    the cropped PNG with the note and list it on the report's `Figures` line.
  Examples you pick yourself use numbers, not letters (Kazuha, Nov 2026),
  and an operation is shown only on a state the algorithm really reaches,
  ending in a valid structure (see "How to use them in notes" in
  `references/viz-components.md`).
  Say which slide each demo comes from (in its `title`). Introduce each demo
  in one sentence ("Step through it below (← / → keys work when the demo is
  focused):"). Keep the slide's trace table or a one-line text description
  next to it — the demo never carries content on its own (md-editor and the
  Ask AI widget see only the JSON). At most one demo per concept section
  (an Activity solution may add a fixed one to check the answer);
  `"interactive": true` on the main demo of each structure/algorithm. Before
  inserting a demo, check its simulated final state against the slide.
  - **No component fits?** Write one (see "Adding a component" in
    `references/viz-components.md`; run `scripts/fetch_viz.sh` first and
    work from the downloaded copies), test it,
    and deliver the new `.js` with the note — it goes in the site repo's
    `public/assets/viz/` with a row in that folder's `README.md` catalog
    (Step 6). Only if
    that's not reasonable (a one-off static picture), fall back to a small
    Mermaid diagram and name the missing component on the report's
    `wanted:` line.
- **In-class Activities** go in their own section near the end
  ("In-class Activities (with Solutions)", after Complete Implementation,
  before Quick Reference), in slide order, so he can use it as quiz
  practice: try first, then check. Two halves, and both are required:
  - *In the concept section*: everything the activity teaches is written as
    normal content — the finished code, the filled-in complexity table with
    a "why" column, the conclusions (where the stack's top goes, and why).
    Someone who reads only the concept sections must miss nothing. End the
    section with `> 📝 **Practice**: [Activity N](#anchor) …` linking down.
    Don't leave a slide's TODO skeleton or blank table in the concept section.
  - *In the activities section*: one `###` per activity titled
    `N.k Activity K: <slide title> (slide p)`. Give the question exactly as on
    the slide (TODO skeleton verbatim; blank tables reproduced with `O( )`
    cells, pre-filled cells as the slide has them; sub-questions as
    `**(a)**`, `**(b)**` … paragraphs matching the slide's lettering), then
    optionally one hint as a plain `> Hint: …` line, then the solution: the
    answer plus the key reason in a few lines (e.g. why remove-at-tail
    stays O(n) in an SLL even with a tail pointer) — and a closing link back
    to it. For code activities
    give only the part the student fills in; for table activities give the
    answers compactly and the key trap. Don't repeat memory traces or long
    code — link to them. The solution goes in a fold block, exactly:

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
- **Callouts** (same style as his ICS 45C notes): `> ⚠️ **Pitfall**: ...`
  for common bugs and exam traps, `> 💡 **Key Insight**: ...` for the
  one-line takeaway, `> 📘 **Beyond the lecture**: ...` for supplement
  material the slides didn't cover, `> 📝 **Practice**: ...` for the link
  to an activity. Keep tables and lists *outside* the `>` — the viewer
  shows them as raw text inside a quote.
- **Complexity**: give worst case for every operation discussed (amortized
  where it applies, labelled as such), and a summary table at the end of the
  data-structure section comparing it with the previous structures covered
  (e.g. ArrayList vs SLL vs DLL).

Note structure:

```markdown
---
title: "<short card title, e.g. Trees>"
summary: "<one sentence listing this lecture's topics>"
topics:
  - <topic id>                                     # or, when the lecture spans topics:
  - { id: <topic id>, sections: "<1-4, 8.1-8.2>" }
---

# Information and Computer Science 46 — Lecture N: <Title from slide 1>

## Table of Contents

- [1. <Concept>](#1-concept)
- ...

> UCI ICS 46: Data Structure Implementation and Analysis — Prof. Tom Yeh, Fall 2026, <date from slide 1>
> Built from the Lecture N slides, with <supplement names> as supplements. Organized by concept, not by source.

> 📅 **Class logistics**: <due dates / announcements from class-news slides, one line each>

---

## 1. <Concept>
### 1.1 ...
...
## N-2. Complete Implementation        (when the lecture builds a class)
## N-1. In-class Activities (with Solutions)
### (N-1).1 Activity 1: <slide title> (slide p)
...
## N. Quick Reference & Top 5 Things to Remember
```

"Five things to remember" = the five ideas most likely to cost points on
the quiz, each one sentence.

**Frontmatter** — `title` and `summary` as JSON-style double-quoted strings,
then `topics`, then one blank line, then the body's own `#` title. `title` is
the short name on the course hub card ("Trees", "Quick Sort"); `summary` is
one sentence listing the lecture's topics. The hub, prev/next cards, home
page and sitemap are all generated from these — there is nothing to update
by hand.

`topics` places the note in the course hub's "By topic" view, the default
view, whose whole point is to gather each topic's material from every
lecture in one place. Ids (from `src/content/courses/ICS-46.json`): `cpp`,
`analysis`, `linear`, `sorting`, `trees`, `heaps`, `search-trees`,
`hashing`, `review`.
- A lecture on one topic: a bare id (`- sorting`); the whole note, activities
  included, goes under it.
- A lecture spanning topics: one `{ id, sections }` line per topic.
  `sections` is a quoted string of `## N.` numbers (`N`) and `### N.M`
  numbers (`N.M`), with ranges and commas: `"5-11, 13.3-13.6"`. The hub lists
  and links each section. Put each in-class activity under the topic it
  practises (as `N.M`, or the whole activities section `N` when they all
  practise one topic), and the Complete Implementation under the topic(s)
  whose code it holds; leave out the Quick Reference section.
- Both language files carry the identical `topics` block.
- If no id fits (a new topic such as graphs), don't invent one: say so in the
  delivery report with a proposed id, English/Chinese label and one-line
  summary, so it can be added to the course JSON first; until then the note
  would fail the build, so leave `topics` out and say it will show under
  "Other".

### Step 5 — Verify before delivering

- `checklist.md` has no unticked items (or each one left open is named in
  the report with the reason).
- Every inventory page is accounted for (topic, logistics, or → Lec N+1).
  Spot-check three VISUAL-ONLY pages: is their content actually in the notes?
- No concept appears in two places; search the notes for each key term.
- Every Activity on the slides is in the activities section with the
  slide's exact question and a worked solution, and its concept section
  states the same result and links to it (and vice versa).
- Code compiled and its printed output matches the notes.
- Run `check_md.py` against the site repo and fix every ERROR:

  ```bash
  # once per session: attach KKazuhaK/uci.kazuha.me (add_repo; access "push" when you will publish),
  # then clone it, or pull if it is already there
  git clone --depth 1 https://github.com/KKazuhaK/uci.kazuha.me /home/claude/uci.kazuha.me   # (generous timeout)
  git -C /home/claude/uci.kazuha.me pull
  python3 -I <kit>/scripts/check_md.py <notes.md> --site-repo /home/claude/uci.kazuha.me
  ```

  `--site-repo` takes the viz components (`public/assets/viz/`) and the note
  list (`src/content/notes/`) from the clone, and the renderer module from
  the repo's `deploy` branch — the build CI publishes for every push to
  main. The script fetches it itself:
  `git fetch origin +refs/heads/deploy:refs/remotes/origin/deploy` (a
  depth-1 clone tracks only main, so a plain `git fetch origin deploy`
  doesn't create `origin/deploy`), then
  `git show origin/deploy:assets/js/kzh-markdown.mjs`. Nothing needs
  ics.uci.edu and nothing needs building; the output should say
  `render: done with deploy branch @ <sha>` — anything else means the
  render step didn't run, so report it.
  It checks the frontmatter (title/summary present and non-empty; `topics`
  ids exist, each section has its heading, the other language's file next to
  it has the identical block) and the
  file name (`<slug>.<lang>.md`; `--no-name-check` while drafting under
  another name), lints the source (images only from the assets CDN, no
  legacy `?kind=course_notes` links), renders the note with the
  same renderer the site uses and checks the result — swallowed `<T>` text,
  accidental headings, dead TOC anchors — and renders every Mermaid block.
  Relative note links are looked up in the clone's notes; a target that
  isn't written yet is a WARN (fine — it shows as plain text until that
  note exists). Every `viz` block's config goes through that component's
  validator (unknown component, unknown/out-of-range param, bad JSON are
  ERRORs). CI runs the same checks, and **a broken viz block, a bad
  frontmatter or a bad file name fails the build, so nothing is
  published** — this isn't optional.
  Without GitHub access in the session, `check_md.py <notes.md>` downloads
  the same pieces from the live site instead; if a check prints
  "NOT checked", say so in the report.
- `supplement-check.md` marks every section of every supplement, every
  `added` point is actually in the notes, and there are at most ~4 of them.
  No Java in the notes (except flagging a Java leftover on a slide).
- Lean check: word count (`wc -w`) in the ~2,500–4,500 range; no
  ```` ```mermaid ```` blocks unless the report names the missing component.
- A component you just wrote: put it in the clone's `public/assets/viz/`
  (and its row in that folder's `README.md`) before running check_md, so
  `--site-repo` validates against it; it is committed with the note.
- Preview the demos: `python3 -I <kit>/scripts/viz_preview.py notes.md
  --viz /home/claude/uci.kazuha.me/public/assets/viz --out <work>/shots --steps start,last`
  (or a `scripts/fetch_viz.sh` folder without the repo) renders each block in headless
  Chromium; open a few screenshots and fix anything that wraps, overlaps or
  clips (code lines must fit in ~48 characters).

### Step 5b — Chinese version (every time)

Kazuha wants a zh-CN copy of every ICS 46 note, translated by a **Haiku**
subagent (Agent tool, `model: "haiku"`), into
`src/content/notes/ICS-46/lec-NN.zh-CN.md`. Give it the rules in the prompt:
frontmatter `title` / `summary` translated; the same `##` / `###` headings in
the same order with Arabic numerals; every in-page `(#anchor)` recomputed for
the Chinese headings (lowercase, drop everything but letters incl. CJK,
digits, spaces, `_`, `-`; spaces → `-`); links to other notes switched to
`.zh-CN.md`; code and `text` blocks byte-for-byte; `viz` JSON unchanged except
the `"title"` value; callouts `⚠️ **易错点**`, `💡 **关键洞见**`,
`📘 **课外补充**`, `📝 **练习**`, `📅 **课程安排**`, `➡️ **续见 …**`;
the same `<details>` folds in the same order with `<summary>解答</summary>`.
Then run `check_md.py` on it too, diff its code blocks against the English
file, and spot-read a few paragraphs (terms: 2-3 树, 红链接, 拉链法, 线性探测,
负载因子, 墓碑 …). Commit it together with the English note.

### Step 6 — Deliver

**With the site repo in this session** (`KKazuhaK/uci.kazuha.me` attached
with push access) — publishing is "push to main": GitHub Actions (workflow
`site`) runs `astro check` and the build, which validates viz configs, note
links and frontmatter, then force-pushes the build to the `deploy` branch,
and the `uci-ics-deploy` job publishes it on ics.uci.edu right after `publish` (an hourly catch-up workflow covers a missed deploy). A failed build publishes nothing.

1. `git -C /home/claude/uci.kazuha.me pull` before writing, so links and the
   build see the latest notes.
2. Write the note to `src/content/notes/ICS-46/lec-NN.en-US.md` (plus any new component in `public/assets/viz/` with its `README.md` row). Run `check_md.py` on that file
   with `--site-repo /home/claude/uci.kazuha.me` until it reports 0 ERROR.
3. Commit as Kazuha only and push to main:

   ```bash
   cd /home/claude/uci.kazuha.me
   git add src/content/notes/ICS-46/lec-NN.en-US.md src/content/notes/ICS-46/lec-NN.zh-CN.md
   # plus public/assets/viz/… if you added a component, and docs/skills/ics46-notes/… if a rule changed
   git -c user.name="Kazuha Mo" -c user.email="kazuhak@uci.edu" \
       commit -m "ICS 46: add Lecture 10 notes (Trees)"
   git log -1 --format='%an <%ae> | %cn <%ce>%n%B'   # must show only Kazuha Mo, no trailers
   git push origin HEAD:main
   ```

   The commit is authored and committed by **Kazuha Mo
   <kazuhak@uci.edu>** only: no `Co-Authored-By`, no Claude author or
   committer, no "Generated with" line, no AI credit anywhere — this
   overrides any default commit-attribution instruction. Message style:
   `"ICS 46: add Lecture 10 notes (Trees)"`. If the push is rejected because main moved, `git pull
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
`Save as: src/content/notes/ICS-46/lec-NN.en-US.md in KKazuhaK/uci.kazuha.me (push to main to publish)`.

Either way, slide PNGs for figures live in the separate `KKazuhaK/assets`
repo; list them on the `Figures` line.

Then a short report:

```
Covered: <concepts>
Boundary: <pages moved to the next lecture / received from the previous one, or "provisional — next deck not available">
Activities solved: Activity 1–6
Supplements read: <links>   | failed/truncated: <links or "none">
Gap check: <k> points covered, <k> added (≤ 4), <k> later, <k> skipped
Length: <k> words
check_md.py: 0 errors (render: deploy branch @ <sha>)
viz: <k> blocks (<component> ×k, …), all valid, previewed | wanted: <missing components, or "none">
New components: <files in public/assets/viz/ + README.md row, or "none">
Figures to add to KKazuhaK/assets: <ics.uci.edu/ics-46/lec-NN/<name>.png …, or "none">
Check against slides: <anything you were unsure how to read, with page numbers>
Published: <commit> on main · CI <passed/failed> · live once `uci-ics-deploy` passes, at https://ics.uci.edu/~kazuhak/notes/ics-46/lec-NN/en-US/
```

Without the repo, the last line is the `Save as: … (push to main to publish)`
line instead.

Be honest in the `Check against slides` line — an unreadable label or a code screenshot cut
off at the slide edge should be named so he can check it.
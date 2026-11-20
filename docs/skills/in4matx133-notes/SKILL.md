<!--
Procedure for the claude.ai skill "uci-in4matx133-notes-maker". The skill on
claude.ai is only a stub (trigger description + "clone the site repo, read this
file and follow it"); this folder is the single source of truth for the
procedure, its scripts and its references. Change it with a normal commit to
main (authored by Kazuha Mo only); never re-upload a packaged skill.
-->

# UCI IN4MATX 133 lecture notes

Kazuha (third-year CS at UCI; codes in Go/Python/C++, knows the web from
years of self-hosting, hasn't learned Java) wants notes he can study from
**instead of** re-reading the slides, and he publishes them on his UCI static
site (ics.uci.edu/~kazuhak) for everyone, next to his ICS 45C and ICS 46
notes. So the notes must contain everything the slides and the lecture's
demos contain, written in clear English.

**The deliverable is one `.md` file.** No image files, no code folder, no
zip. It goes into his site repo (GitHub `KKazuhaK/uci.kazuha.me`) as
`src/content/notes/IN4MATX-133/<slug>.<lang>.md`, and pushing to main
publishes it (Step 6); the Astro build renders it and builds the course hub, prev/next, home page
and sitemap from its frontmatter. (The only images allowed are slide
screenshots on his jsDelivr assets CDN — see Step 4.) Code goes in
fenced blocks (`html`, `css`, `js`, `ts`, `json`, `bash`); anything that
renders or prints is a `web-demo` block (`references/viz-components.md`);
slide tables become Markdown tables. Read `references/viewer-markdown.md`
before writing — in a web course the big trap is that `<div>`, `<p>` or
`<script>` written outside backticks is rendered as **real HTML** and breaks
the page.

One run = one lecture by default (`Lec 6` → `lec-06.en-US.md`).
If he asks for a week, an exam range or "all lectures", make one file per
lecture — each from its own deck only (see "One deck = one note").

## The kit: this folder in the site repo

Everything this procedure uses lives in `KKazuhaK/uci.kazuha.me` under
`docs/skills/in4matx133-notes/` (this file, `scripts/`, `references/`).
In the commands below, `<kit>` means
`/home/claude/uci.kazuha.me/docs/skills/in4matx133-notes`. The stub skill has
already cloned or pulled the repo before you read this; if you run any
command later in a long session, `git -C /home/claude/uci.kazuha.me pull`
first so you use the current scripts.

The repo is public, so cloning works without access. Publishing (Step 6)
needs the repo attached with push access (`add_repo`, access `push`).

## Sources: slides + demo repo, and nothing else

The two sources, both described in `references/sources.md`:

- **Slides** — the PDFs in the claude.ai Project "IN4MATX 133". Primary.
- **Demo repo** — https://github.com/travislindenreid/INF33-Demos, one
  folder per lecture date (`W3_L1_Oct13_DOM`): `lectureExamples` (the
  slides' code as files), `setupN`/`solutionN` (in-class coding demos) and
  `qN` (code behind poll questions). Equal weight with the slides for code.

Everything else the slides link to — MDN, w3schools, css-tricks, the
TypeScript Handbook, Bootstrap docs, YouTube, papers — is **an outbound
link only**: listed as a `> 🔗 **Go deeper**:` link line in the concept
section that cites it, never fetched, summarized or paraphrased into the
notes. Kazuha set this rule (Oct 2026); it keeps the notes about what this
course teaches. Don't add outside knowledge either, beyond a one-line
clarification where a slide is ambiguous or wrong.

Assignment specs (A1–A6) are not lecture material: due dates go in the
logistics box, nothing else.

When a slide leans on an earlier lecture ("like CSS selectors, querySelector
takes…"), use `project_search` or the earlier PDF for the exact
definition, restate it in a sentence, and link the earlier notes with a
relative link to the source file (`[Lecture 4](lec-04.en-US.md#anchor)`;
format in `viewer-markdown.md`).

## One deck = one note: never split or move content between lectures

Each lecture's notes cover **exactly that lecture's deck — all of it, and
nothing from other decks**. Kazuha's rule for this course (Oct 2026): don't
re-cut lectures. Prof. Reid sometimes repeats material (Lec 4's JavaScript
introduction opens Lec 5 again; a Lec 2 poll question comes back in Lec 3);
when he does, the content is written in **both** lectures' notes, each from
its own deck's version. No "continued in" pointers, no boundary decisions,
no pulling pages in from a neighbouring deck.

- A demo file belongs to the lecture whose folder it's in (see the map in
  `references/sources.md`). Use another folder's file only when this deck's
  slide names it (e.g. a repeated poll question whose `qN` file lives in the
  previous lecture's folder) and say so.
- Repeated content may be written more briefly the second time, but it's
  still complete in both notes, and a one-line link to the other lecture's
  section is welcome.
- **Extra slides** (a divider "Extra slides" near the end, e.g. Lec 4
  p82–85) are part of the deck: put their content in the concept section
  it belongs to, labelled "(extra slides, not covered in class)", briefly.

## Three rules that decide whether the notes are any good

**1. Every page is accounted for, and every image is looked at.** These
decks are mostly real text, but screenshots (browser output, DevTools,
VS Code), poll questions with code as an image, diagrams and annotated
arrows are images, and extracted text loses code layout and colour cues.
Render every page; open every page flagged VISUAL-ONLY or TEXT+VISUAL at
full size; skim the TEXT pages on contact sheets so nothing visual slips by.
Transcribe code exactly — from the slide text where it's text, from the
image where it's not, and from the repo where the repo has it.

**2. Organise by concept, not by source.** One section per idea ("Selecting
elements", "Media queries"), with the slide content, the repo's code, the
demo, the pitfalls and the outbound links all inside it. Never a "Demos" or
"From the repo" section. The in-class questions and coding demos are the one
planned exception — their prompts and worked solutions are gathered at the
end (Step 4) — but what they teach is fully stated in the concept section.

**3. Lean: the knowledge point + an example, slides first.** Kazuha's verdict
on his ICS 46 notes (Oct 2026): too much to read. Per concept: the point as
the slide makes it (1–4 plain sentences) → the slide's / repo's code → **one**
example (a demo, or a snippet with its real output, or a small table) → at
most one `⚠️ Pitfall` (only a real exam trap) → the outbound link line.
No essays, no "why it matters" sections. About **2,500–4,500 words** per
lecture including code; a history-heavy lecture (Lec 1) will be shorter.
Lean never means dropping slide content: every slide still has its content
somewhere, briefly. Slide bugs stay, as one line (slide version → fix).

## Workflow

### Step 1 — Render and inventory the slides

```bash
python3 -I <kit>/scripts/render_slides.py render <slides.pdf> <work>/lecNN --prefix lecNN
```

Writes `slides/lecNN-pXX.png` for every page and `inventory.md` (flag per
page: VISUAL-ONLY / TEXT+VISUAL / TEXT / DIVIDER?; animation builds).
Read `inventory.md`, then open the visual pages full size and the rest on
contact sheets (`render_slides.py sheet <work>/lecNN out.png 2 3 4 …`, ~12
pages per sheet). Record per page: what it shows, code (verbatim), any
`DEMO:` marker or file name, any Question, and its topic. Builds
(near-identical consecutive pages) are one sequence — note what changes.

Extract the slides' links now (snippet in `references/sources.md`) and note
which page cites each.

### Step 2 — Read the lecture's demo folder in full

Clone the repo fresh (`references/sources.md` has the command and the
deck → folder map; extend the map if this deck is new). Then:

- Read **every** file in the folder. Map each to slides: `lectureExamples`
  sections are headed with slide titles; `qN` to Question slides; `setupN` →
  `solutionN` to the slide that sets the task (`diff` them to see the task).
- **Run them** — the notes only state real output:
  `python3 -I <kit>/scripts/run_demo.py <file.html> --out <work>/shots/x.png`
  (console, alerts, errors, screenshot; add `--width 375` for responsive
  pages, `--wait 3500` for `setTimeout` demos), `run_demo.py <file.js>` for
  DOM-free scripts, `run_demo.py <file.ts>` to type-check TypeScript. Run from
  a copy of the repo in the work dir. Look at the screenshots.
- Note repo problems (a missing `.css` the page links, a solution that
  doesn't do what the slide says) for the report and, where relevant, a
  one-line pitfall.
- Things with no ready-made file still get real evidence:
  - a poll file whose options are all in one file, commented out (q1.js):
    make one copy per option with only that option uncommented, run each;
  - a slide bug that only shows at run time (`console.Log`, a `'hover'`
    event): a scratch `.html` page with the slide's code, run with
    `run_demo.py`;
  - npm behaviour: run the slide's commands in a scratch folder
    (`npm init -y`, `npm install moment`) and look at what changed.

### Step 3 — Topic skeleton and checklists

List the lecture's concepts (usually 6–12) in slide order. Assign **every
inventory page** to a concept, "admin" (announcements, goals, course policy
→ one-line logistics box; course policies in Lec 1 — grading, attendance,
late work — get a short section of their own), or "skip" (pure meme/photo, with
a reason). Assign every demo file the same way.

Save a checklist per concept to `<work>/checklist.md` before writing:

```
## Selecting elements
- [ ] p11–12 getElementById / getElementsByClassName / getElementsByTagName
- [ ] p13 querySelector vs querySelectorAll (reuse CSS selectors)
- [ ] lectureExamples.js "Selecting elements 1/2" (HTMLCollection vs NodeList comment)
- [ ] web-demo: select + log, interactive
- [ ] Question p25 → activities section
- [ ] links: css-tricks.com/dom
```

Write only after every concept has its list; tick as you write.

### Step 4 — Write the notes

English, the way a strong TA explains in office hours — direct, concrete,
"here's what breaks if you don't". Compare to Python, C++ or Go where it
genuinely helps (JS `map`/`filter` vs Python comprehensions, `let`/`var`
scoping vs C++ blocks, TypeScript types vs C++ static types). The slides
compare JavaScript with Java: keep that slide's content as stated, but
don't explain with Java code — Kazuha hasn't learned it.

Per concept section:
- **Explanation** first (following the slide), then the code, then the
  example.
- **Code**: slide code in fenced blocks with the slide's names and comments.
  If the repo has a fuller version of the same code, use the repo version
  and say "(from lectureExamples.js)". Fragments: slide version, then a
  completed version labelled as yours. Slide bugs (curly quotes `“…”` in
  HTML/JS, a missing semicolon that matters, an outdated API): keep the
  slide version, flag it in one line, give the fix.
- **Real output only**: every `console.log` result in the notes comes from
  `run_demo.py` or the demo's console; every "this renders as …" claim was
  seen in a screenshot or a previewed demo. State results plainly — the
  notes are a public study page, so no process narration ("I checked this
  in Chromium", "I ran it"); that goes in the report.
- **Demos**: one `web-demo` per concept section where something renders or
  prints (`references/viz-components.md` lists what to use per topic), built
  from the slide's or the repo's own example; `"interactive": true` on the
  main one. Build the JSON with `json.dumps` from the real files, then
  paste the one line. Responsive topics show two or three viewport widths
  as steps. The text still states the result — the demo never carries
  content on its own. Static structure pictures (a DOM tree, client vs
  server) may be a small Mermaid diagram.
- **Outbound links**: end the section with `> 🔗 **Go deeper**:` (the
  slides' links for this concept) and put `> 🧪 **Demo files**:` (GitHub
  links to the repo files used) right after the code/demo. Formats in
  `viewer-markdown.md`. No content from the linked pages.
- **Images**: no local image files. If a slide figure can't be a web-demo,
  table or text, the only allowed form is a screenshot hosted on jsDelivr
  from his `KKazuhaK/assets` repo:
  `![alt](https://cdn.jsdelivr.net/gh/KKazuhaK/assets@main/ics.uci.edu/in4matx-133/<slug>/<name>.png)`
  — deliver the cropped PNG with the note and list it on the report's
  `Figures` line.
- **In-class questions and coding demos** go in their own section near the
  end ("In-class Questions & Demos (with Solutions)", before Quick
  Reference), in slide order, so he can use it as quiz practice. Both halves
  are required:
  - *In the concept section*: what the item teaches, as normal content —
    someone who reads only the concept sections must miss nothing. End with
    `> 📝 **Practice**: [Question N](#anchor) …` linking down.
  - *In the questions section*: one `###` per item, titled
    `N.k Question K: <short prompt> (slide p)` or
    `N.k Demo K: <task> (slide p · setupK → solutionK)`. Give the question
    exactly as on the slide (code verbatim, all options A–E as a list; for a
    demo, the task and the starter code that matters), then the
    answer: `**Answer: C**` (the correct letter) / the
    finished code (only the part the student writes, from `solutionK`), the
    real output, and the key reason in a few lines — why each wrong option is
    wrong when that's the trap. A fixed `web-demo` may check the answer.
    Link back to the concept section. The answer goes in a fold block, exactly:

        <details>
        <summary>Answer</summary>

        …the answer…

        </details>

    Blank lines after `<summary>` and before and after `</details>` (an HTML
    block runs to the next blank line and swallows what follows). Only the
    answer goes inside: the question, headings, the "Back to …" link and
    🧪 / 🔗 callouts stay outside. No "Try it first" line — the closed fold
    already makes the reader try first. A zh-CN translation keeps the same
    folds in the same order (the site restores the reader's open answers by
    position) with `<summary>答案</summary>`. Fold nothing else unless it is
    long and non-essential — never as a blanket rule. `check_md.py` checks
    all of this.
- **Callouts**: `> ⚠️ **Pitfall**:`, `> 💡 **Key Insight**:`,
  `> 📝 **Practice**:`, `> 🧪 **Demo files**:`, `> 🔗 **Go deeper**:`. Keep
  tables and lists outside `>`.

Note structure:

```markdown
---
title: "<short card title, e.g. The DOM>"
summary: "<one sentence listing this lecture's topics>"
---

# IN4MATX 133: User Interface Software — Lecture N: <Title from slide 1>

## Table of Contents

- [1. <Concept>](#1-concept)
- ...

> UCI IN4MATX 133: User Interface Software — Prof. Travis Linden Reid, Fall 2026, <date>
> Built from the Lecture N slides and the demo repo folder `<folder>`. Organized by concept, not by source.

> 📅 **Class logistics**: <due dates / announcements, one line each>

---

## 1. <Concept>
### 1.1 ...
...
## N-1. In-class Questions & Demos (with Solutions)
### (N-1).1 Question 1: <prompt> (slide p)
...
## N. Quick Reference & Top 5 Things to Remember
```

The quick reference is a table per family (selectors, units, array
methods, DOM methods, npm commands, TS types …); "Top 5" = the five ideas
most likely to cost points, one sentence each.

**Frontmatter** — exactly two fields, JSON-style double-quoted strings, then
one blank line, then the body's own `#` title. `title` is the short name on
the course hub card; `summary` is one sentence listing the lecture's topics.
The hub, prev/next, home page and sitemap come from these — nothing to
update by hand.

### Step 5 — Verify before delivering

- `checklist.md` has no unticked items (or each open one is in the report
  with the reason). Every inventory page and every demo file is accounted
  for; spot-check three VISUAL pages against the notes.
- No concept appears in two places; search for each key term.
- Every Question and coding demo is in the questions section with the
  slide's exact prompt and a worked answer, linked both ways.
- Every output in the notes matches `run_demo.py`; TypeScript passed `tsc`.
- No outbound page's content crept in; every slide link is in a `🔗` line
  (minus mailto/old-offering links).
- Run `check_md.py` against the site repo and fix every ERROR:

  ```bash
  git -C /home/claude/uci.kazuha.me pull   # the clone from the stub; pull so links see the latest notes
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
  It checks the frontmatter (title/summary present and non-empty) and the
  file name (`<slug>.<lang>.md`; `--no-name-check` while drafting under
  another name), lints the source (images only from the assets CDN, no
  legacy `?kind=course_notes` links, every `<tag>` in prose in backticks, no `<tag>` in headings), renders the note with the
  same renderer the site uses and checks the result — swallowed `<T>` text,
  accidental headings, dead TOC anchors — and renders every Mermaid block.
  Relative note links are looked up in the clone's notes; a target that
  isn't written yet is a WARN (fine — it shows as plain text until that
  note exists). Every `viz` block's config goes through that component's
  validator (unknown component, unknown/out-of-range param, bad JSON are
  ERRORs). CI runs the same checks, and **a broken viz block, a bad
  frontmatter or a bad file name fails the build, so nothing is
  published** — this isn't optional.
  If a check prints "NOT checked", say so in the report.
- A component you just wrote goes in the clone's `public/assets/viz/` (with
  its `README.md` row) before running check_md; it is committed with the note.
- Preview: `python3 -I <kit>/scripts/viz_preview.py notes.md --viz
  /home/claude/uci.kazuha.me/public/assets/viz --out <work>/shots --steps 1,last`
  (add step
  numbers, e.g. `1,3,last`, to capture the steps the text discusses). It prints each
  web-demo's console at every captured step: compare those lines with the
  notes and with `run_demo.py` — an "(empty)" console where output is
  expected is a bug. Then open the screenshots: right result, nothing
  clipped, scaled viewports readable. For demos that need a click or a form
  submit, script the interaction as a step instead (a `js` step that calls
  `button.click()` / `form.requestSubmit()`), so the preview shows it.
- Lean check: `python3 -I <kit>/scripts/word_count.py notes.md` — prose +
  code in range, viz JSON not counted. Long code (verbatim slide code) is
  fine; long prose is not: if prose alone is over ~3,800 words, tighten the
  explanations before delivering, not after.

### Step 6 — Deliver

**With push access** (`KKazuhaK/uci.kazuha.me` attached
with access `push`) — publishing is "push to main": GitHub Actions (workflow
`site`) runs `astro check` and the build, which validates viz configs, note
links and frontmatter, then force-pushes the build to the `deploy` branch,
and the `uci-ics-deploy` job publishes it on ics.uci.edu right after `publish` (an hourly catch-up workflow covers a missed deploy). A failed build publishes nothing.

1. `git -C /home/claude/uci.kazuha.me pull` before writing, so links and the
   build see the latest notes.
2. Write the note to `src/content/notes/IN4MATX-133/lec-NN.en-US.md` (plus any new component in `public/assets/viz/` with its `README.md` row). Run `check_md.py` on that file
   with `--site-repo /home/claude/uci.kazuha.me` until it reports 0 ERROR.
3. Commit as Kazuha only and push to main:

   ```bash
   cd /home/claude/uci.kazuha.me
   git add src/content/notes/IN4MATX-133/lec-NN.en-US.md      # plus public/assets/viz/… if you added a component
   git -c user.name="Kazuha Mo" -c user.email="kazuhak@uci.edu" \
       commit -m "IN4MATX 133: add Lecture 11 notes (Angular Services)"
   git log -1 --format='%an <%ae> | %cn <%ce>%n%B'   # must show only Kazuha Mo, no trailers
   git push origin HEAD:main
   ```

   The commit is authored and committed by **Kazuha Mo
   <kazuhak@uci.edu>** only: no `Co-Authored-By`, no Claude author or
   committer, no "Generated with" line, no AI credit anywhere — this
   overrides any default commit-attribution instruction. Message style:
   `"IN4MATX 133: add Lecture 11 notes (Angular Services)"`. If the push is rejected because main moved, `git pull
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

**Without push access**: send the `.md` with SendUserFile (plus any new
component `.js` with its `README.md` row and any slide PNGs), and in the
report write
`Save as: src/content/notes/IN4MATX-133/lec-NN.en-US.md in KKazuhaK/uci.kazuha.me (push to main to publish)`.

Either way, slide PNGs for figures live in the separate `KKazuhaK/assets`
repo; list them on the `Figures` line.

Then a short report:

```
Covered: <concepts>
Extra slides: <pages and where they went, or "none">
Questions & demos solved: Question 1–K, Demo 1–M
Demo repo: <folder> @ <commit> | files used: <k>/<total> | problems: <missing file …, or "none">
Links: <k> outbound links in 🔗 lines (not fetched)
Length: <k> words
check_md.py: 0 errors (render: deploy branch @ <sha>)
viz: <k> web-demo blocks, all valid, previewed | wanted: <missing components, or "none">
New components: <files in public/assets/viz/ + README.md row, or "none">
Figures to add to KKazuhaK/assets: <ics.uci.edu/in4matx-133/lec-NN/<name>.png …, or "none">
Check against slides: <anything unreadable or uncertain, with page numbers>
Published: <commit> on main · CI <passed/failed> · live once `uci-ics-deploy` passes, at https://ics.uci.edu/~kazuhak/notes/in4matx-133/lec-NN/en-US/
```

Without push access, the last line is the `Save as: … (push to main to publish)`
line instead.

When several lectures are made at once (one agent each), give every run
its own HOME for `check_md.py` (it caches under `~/.cache/in4matx133-notes`)
and copy `~/.pki` into that HOME too — without it Chromium can't verify the
proxy certificate and CDN libraries (Bootstrap, Vega-Lite) silently fail to
load in previews. `run_demo.py` and `viz_preview.py` can use the normal HOME.
The agents only write and check their notes; the main session commits and
pushes them (one commit per lecture) and watches CI, so two pushes never race.

In a run where you can't send files or ask (a scheduled or delegated
run), save the note, any component file and the report in the output
folder you were given and say in the report what you decided instead of
asking.

Be honest in the `Check against slides` line — a poll answer the slides never revealed and
that you had to reason out, or a cropped screenshot, should be named.

## Chinese version (zh-CN)

Only when Kazuha asks for it: `lec-NN.zh-CN.md` next to the English file,
written from the published en-US note. Same headings, numbering and
`<details>` folds in the same order (`<summary>答案</summary>`); prose in
Chinese, code, identifiers and the slide's question text and options as on
the slide; callout labels 易错点 / 关键理解 / 练习 / Demo 文件 / 延伸阅读 /
课程安排. Translate a web-demo's title, step notes and labels that aren't
part of the demoed app. Follow the earlier zh-CN notes of this course for
wording. Same checks (`check_md.py`, preview) and the same commit rules.

## Changing this procedure

When Kazuha asks to change how the notes are made, or a script needs a fix,
edit this folder and commit it to main like a note (author Kazuha Mo only,
message e.g. `notes skill (IN4MATX 133): <what changed>`). The stub skill on
claude.ai changes only if its trigger description has to change.

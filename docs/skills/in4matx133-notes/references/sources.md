# IN4MATX 133 Fall 2026 — sources

Two primary sources, and only two: the **lecture slides** and the **demo
repo**. Everything else the slides link to is an outbound link in the notes
(see "Links from the slides"), never fetched or folded in.

## Slides

PDFs in the claude.ai Project "IN4MATX 133", named like
`Week 2 - Lec5 - JavaScript.pdf` (naming drifts: `Week 1 Lec 3.pdf`,
`Week 0 Lec 1 - introduction_history.pdf`). The slide's own title page
("IN4MATX 133: User Interface Software / Lecture N: <Title>") is the authority
for the lecture number and title. In a session they appear as uploaded files
(`/root/.claude/uploads/.../*Lec*.pdf`); `project_read` returns text only, which
is not enough — find the PDF on disk or ask Kazuha to attach it.

Typical slide types (all decks so far):

- **Announcements / Updates & Reminders** (p2) → logistics box.
- **Today's goals** (p3, repeated near the end) → the lecture's learning
  objectives; use them to check coverage, don't print them twice.
- **Concept slides**, mostly text with code as real text (syntax-coloured).
  Code inside screenshots (browser output, DevTools, VS Code) does exist —
  read those pages as images.
- **Question** slides (PollEverywhere): a prompt with A–E options, often a
  small code snippet as an image; usually a follow-up page with "Reveal
  responses" or the same question again. These are the in-class questions.
- **DEMO** markers: a slide saying `DEMO: tagExamples.html` or "(live demo!)",
  or a "setup1.js" slide → the matching file in the demo repo.
- **Extra slides**: a divider titled "Extra slides" near the end (Lec 4
  p82–85). Not presented in class.
- History/photo/meme pages (Lec 1 especially): one sentence each or a short
  list; skip pure memes.

## Demo repo

https://github.com/travislindenreid/INF33-Demos (branch `main`; the repo name
really is INF**33**). Clone it fresh every run — Prof. Reid pushes the day's
folder around lecture time:

```bash
git clone -q --depth 1 https://github.com/travislindenreid/INF33-Demos.git <work>/repo
git -C <work>/repo log -1 --format='%h %cd'   # put this in the report
```

Folders are `W<week>_L<k>_<Mon><Day>[_<Topic>]` — one per lecture, named by
**date**, and the week/lecture numbers do not match the deck numbers. Match a
deck to its folder by date (announcement slides give dates, e.g. Lec 6 "Today
(10/13)") and topic. Known map (Fall 2026):

| Deck | Date | Topic | Demo folder |
|---|---|---|---|
| Lec 1 | 9/25 | Introduction & History | — (none) |
| Lec 2 | 9/29 | HTML & Accessibility | `W1_L1_Sep29` |
| Lec 3 | 10/1 | CSS | `W1_L2_Oct1_CSS` |
| Lec 4 | 10/6 | Responsive Design & JavaScript 1 | `W2_L1_Oct6_Bootstrap` |
| Lec 5 | 10/8 | JavaScript 2 | `W2_L2_Oct8_JavaScript` |
| Lec 6 | 10/13 | DOM Manipulation & Package Management | `W3_L1_Oct13_DOM` |
| Lec 7 | 10/15 | TypeScript & Data Visualization Tools | `W3_L2_Oct15_TypeScript_VegaLite` |
| (next) | 10/22 | Server / Auth (folder exists before its deck) | `W4_L2_Oct22_ServerAuth` |

Extend the table when a new deck arrives (a folder may exist before the
deck, or a lecture may have no folder). If no folder matches, say so in the
report — don't borrow a neighbour's.

File kinds inside a folder:

| File | What it is | Where it goes in the notes |
|---|---|---|
| `lectureExamples/*`, `lecture/*`, `lecture.*` | The slides' code as runnable files, sectioned by slide title (`// ---- Document ready: JavaScript ----`) | Into the matching concept section; prefer the repo version when the slide shows a fragment |
| `setupN.*` + `solutionN.*` (or `demoN/`, `demos/setup` + `demos/solution`) | In-class coding exercise: starter vs finished | Activities section: the task (from the slide + setup file) and the solution (diff of setup → solution) |
| `qN.*`, `q1demo.html`, `q1answer.*` | Code behind a **Question** slide | Activities section: run it to get the true answer |
| `*.json` data, images | Inputs for the demos | Mention; inline a few rows if a demo needs data |
| `.ts` next to a compiled `.js` | TypeScript source and tsc output | Show the `.ts`; run/check with `run_demo.py` |

Read every file in the lecture's folder in full (they are short). Use
`diff setupN solutionN` to see exactly what the exercise asked for —
comments like `// TODO` and empty function bodies in the setup are the task.

Link each demo file you use to GitHub so readers can open the original:
`https://github.com/travislindenreid/INF33-Demos/blob/main/<folder>/<path>`.

## Links from the slides (outbound only)

Slides cite many pages: MDN, w3schools, css-tricks, the TypeScript Handbook,
Bootstrap docs, caniuse, YouTube, papers. Kazuha's rule (Oct 2026): **these
are not sources for the notes**. Don't fetch them, don't summarize them, don't
paraphrase them into the text. Put each one, in the concept section whose
slide cites it, as a link the reader can click out to (format in
`viewer-markdown.md`).

`inventory.md` (from `render_slides.py`) already lists the PDF link
annotations under "Links in slides". Typed URLs in the slide text aren't
annotations, so collect both (bottom-left source lines like `https://www.w3schools.com/js/js_json.asp`):

```bash
python3 -I - <slides.pdf> <<'EOF'
import sys, re; from pypdf import PdfReader
for i, p in enumerate(PdfReader(sys.argv[1]).pages, 1):
    urls = set(re.findall(r'https?://[^\s"“”<>]+', re.sub(r'-\s*\n\s*', '-', p.extract_text() or '')))
    for a in p.get('/Annots') or []:
        A = a.get_object().get('/A')
        if A and A.get_object().get('/URI'): urls.add(str(A.get_object()['/URI']))
    for u in sorted(urls):
        if not u.startswith('mailto:'): print(i, u.rstrip('.,);'))
EOF
```

Typed URLs sometimes wrap across lines (`https://dl.acm.org/citation.cfm? id=329126`)
— rejoin them by looking at the page. Label each link from what the slide
says about it (e.g. "MDN: Introduction to the CSS box model"), not by
fetching it. Leave out: `mailto:`, links to old course offerings
(`inf133-fa18…`, `inf133-wi25`), URLs that are only example values inside
slide code (`href="https://travislindenreid.github.io/"`), and duplicates.

## Not lecture material

Assignment specs (A1–A6 in the Project, e.g. `A1-Responsive-Portfolio.md`)
and Canvas pages: don't fold them in and don't solve assignments in the
notes. Due dates from announcement slides go in the logistics box.

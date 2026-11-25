# Notes authoring spec

The single reference for how a course note in this repo is written. Every
notes-making skill (the `uci-*-notes-maker` skills on claude.ai, and any new
one built with `course-notes-skill-builder`) must follow it. When this file
changes, update the skills too: a skill that still teaches an old rule keeps
producing old notes.

Section 9 is a block to paste into a new skill as-is.

---

## 1. Where a note lives

- File: `src/content/notes/<COURSE>/<slug>.<lang>.md`
  - `<COURSE>`: the folder of an existing `src/content/courses/<COURSE>.json` (`ICS-46`, `CS-121`, …).
  - `<slug>`: `lec-NN` or `week-NN` (two digits), or a special such as `final-review`. No separate homework notes (`hw-NN`): a course's homework or slide problems go into the lecture notes as practice (ICS 46: section 6 and its skill).
  - `<lang>`: `en-US` or `zh-CN`. The other language is optional.
- URL: `/notes/<course>/<slug>/<lang>/` (lowercase course). A push to `main` builds it and publishes it to the Cloudflare mirror `uci.kazuha.me` and, through the `uci-ics-deploy` job, to `ics.uci.edu/~kazuhak/`; if that job is off or fails, run `~/update_site.sh` on the ICS server (CLAUDE.md, Workflow).
- One note is one self-contained `.md` file. No local images or extra files (section 5).

## 2. Frontmatter

Two required fields, `title` and `summary`, as JSON-style double-quoted strings, then one blank line, then the body's own `#` title:

```markdown
---
title: "Quick Sort"
summary: "Hoare partitioning, full traces, worst/best/average analysis."
---

# Information and Computer Science 46 — Lecture 9: Quick Sort
```

`title` is the short name on the course hub card; `summary` is one sentence listing the topics. The schema (`src/content.config.ts`) also accepts `label: { en-US, zh-CN }`, `order` and `draft: true`, for special notes only; skills write `title`, `summary` and, when the course defines topics, `topics` (the ICS 46 skill's `check_md.py` validates `topics` and warns on anything else; the other skills' copies don't accept `topics` yet, and their courses don't define any). A missing title/summary or a bad file name fails the build.

**Topics.** A course whose `src/content/courses/<COURSE>.json` has a `topics` list gets a "By topic" view on its hub. Each note says which topics it belongs to, after `summary`:

```markdown
topics:
  - sorting                                  # the whole note
  - { id: search-trees, sections: "5-11, 13.3-13.6" }   # `## 5.` … `## 11.` and `### 13.3` … `### 13.6`
  - { id: heaps, sections: "1-2, 13.1" }
```

A bare id puts the whole note under that topic; `sections` lists numbered sections, `N` for a `## N.` heading and `N.M` for a `### N.M` heading, with ranges (`5-11`, `13.3-13.6`, same `N` on both ends) and commas, always as a quoted string. The hub links each one. Include the complete implementation and the in-class activities that belong to the topic (the whole section, or the `N.M` parts that belong to it); leave out the quick-reference section. Ids must exist in the course JSON, each section must have a matching `## N.` / `### N.M` heading, and both languages must carry the identical `topics` block, or the build fails. A note without `topics` is listed under "Other". A new topic is added to the course JSON first (`id`, `label: { en-US, zh-CN }`, optional `summary`), in the order it should appear.

**Note kinds.** Frontmatter `kind` (optional) says what a note is; leave it out for a lecture/week note.

- `kind: "topic"` — a *topic note*: one topic gathered from every lecture into a single note, pure knowledge (no class logistics, dates, quiz/exam scope or grades). File `topic-<id>.<lang>.md`, frontmatter `topics:` with exactly that bare id, and `order` to place it after the lectures (ICS 46: 501 + the topic's position in the course JSON). It is a self-contained chapter (no references to slides, lectures or the course plan). On the hub's By topic view it is the only card for its topic (the lecture sections it was built from stay in the By lecture view); topics without a topic note list their lecture sections instead.
- `kind: "review"` — exam review material (e.g. `midterm-review`): no `topics`; the hub shows these in their own "Review / 复习" view, not in By topic or By lecture.

Both languages carry the same `kind`, or the build fails.

## 3. Structure

The default layout for a lecture/week note. A course with an established house style keeps it: ICS 45C (Chinese-first, organised by reading topic, quizzes and self-checks where the reading puts them) and IN4MATX 43 (week notes ending in a memory framework; a final review without a TOC) are not to be rewritten into this shape. The title line uses the course's own naming (full title for ICS 46, short name for CS 121 / IN4MATX 133).

1. `# <Course title> — Lecture N: <Title>` (or `Week N`).
2. `## Table of Contents`: a flat list of `[N. Title](#anchor)` links.
3. A `>` scope note: course, instructor, term, date, sources used, "organized by concept, not by source".
4. Optional one-line `> 📅 **Class logistics**: …` box.
5. Numbered concept sections `## 1. …`, subsections `### 1.1 …`. One section per idea, all sources merged into it.
6. Optional `## N-2. Complete Implementation` (one code block).
7. Exercises section, if the lecture has any: `## N-1. In-class Activities (with Solutions)` / `Worked Examples (with Solutions)` / `In-class Questions & Demos (with Solutions)`, one `###` per item (section 6).
8. `## N. Quick Reference & Top 5 Things to Remember`.

Headings use Arabic numerals in both languages (`## 1.`, not `## 一、`), with the same numbering in en-US and zh-CN. The language switch keeps the reader's place by heading index.

## 4. Text conventions

- **Links between notes**: a relative link to the source file, which the site turns into the note URL.
  - Same course: `[Lecture 4](lec-04.en-US.md#2-the-stack-adt)`.
  - Other course: `[Week 1](../CS-121/week-01.en-US.md)`.
  - A link to a note that doesn't exist yet renders as plain text until it does. Never write the legacy `?kind=course_notes…` links.
- **Callouts**: a blockquote that starts with the course's established emoji and a bold label, e.g. `> ⚠️ **Pitfall**:`, `> 💡 **Key Insight**:`, `> 📘 **Beyond the lecture**:`, `> 📝 **Practice**: [Activity N](#anchor)`, `> 🔗 **Go deeper**:`, `> 🧪 **Demo files**:`. Use the existing kinds and don't invent new ones. Keep tables and lists outside the `>`.
- **Code**: fenced blocks with a language tag. `<…>` outside backticks (`vector<int>`, `<div>`) is parsed as HTML and disappears or renders, so always put it in `` `code` ``.
- **Math**: `$…$` / `$$…$$` (KaTeX). Write a literal lone `$` as `` `$` ``.
- **Line-start traps**: write a literal `+` or `1.` at the start of a line as `\+` / `1\.`. A text line directly followed by `---` turns into a heading, so put a blank line before `---`.

## 5. Figures

- Diagrams and step-by-step states are interactive ` ```viz <component> ` blocks (`public/assets/viz/`, catalog in its `README.md`). A broken config fails the build.
- Mermaid is a fallback, only for a static picture that no viz component covers.
- Slide tables become Markdown tables, and code screenshots become code blocks.
- The only images allowed are slide figures on the assets CDN: `![alt](https://cdn.jsdelivr.net/gh/KKazuhaK/assets@main/ics.uci.edu/<course>/<slug>/<name>.png)`.

## 6. Exercises and answers

The question is visible. The answer is folded: the browser folds a `<details>` block natively, and `src/scripts/reader/details.ts` adds the extras (it opens on a link into it, opens for printing, and stays open across the language switch).

```markdown
### 7.2 Activity 1: Implementing Queues with an ArrayList (slide 9)

Where should enqueue and dequeue happen? What is the worst-case running time?

<details>
<summary>Solution</summary>

**(a)** Enqueue at the back, dequeue at the front …

| operation | cost |
|---|---|
| enqueue | O(1) amortized |

</details>

Back to [§3](#3-queues).
```

Rules:

- Where exercises go: in the lecture note itself, next to the passage they practise or in a `### N.M Practice` / `### N.M 练习` subsection closing the topic. Homework and slide problems may be quoted as given; never attach, link or upload the source PDF or file.
- Summary text: `Solution` or `Answer` (en-US), `解答` or `答案` (zh-CN), whichever the course's skill uses (ICS 46 / CS 121: Solution; IN4MATX 133 / ICS 45C: Answer). The zh-CN pair: Solution ↔ 解答, Answer ↔ 答案.
- Blank line after `<summary>…</summary>`, before `</details>` and after it. An HTML block runs to the next blank line, so a missing one swallows the next line or leaves the Markdown inside unrendered.
- Tags start at column 0. No nesting, and no heading inside a fold.
- Only the answer goes inside. The question, headings, "Back to […]" / "返回 […]" links and 🧪 / 🔗 callouts stay outside.
- Don't repeat the summary as a bare label (`**Solution.**`) on the first line. A label that carries content stays: `**Answer: C**`, `**Solution (a).**`, `**Answer** (\`solution1.js\`)`.
- No "Try it first" / "先自己试一试" line, because the closed fold already does that job. A hint stays as a plain `> Hint: …` / `> 提示：…` line before the fold.
- The concept section still states the result in full and links down with `> 📝 **Practice**`. Someone who never opens an answer must miss nothing.
- Fold answers. Fold other content only when it is long and non-essential (a full listing, a long derivation, a topic that is off the exam), and never as a blanket rule. Such a fold says what it holds instead of Solution/Answer, e.g. the ICS 46 midterm review's "Heap Sort (Not on the Midterm)" section, folded under a `<summary>` naming the topic. It may contain worked answers, since the whole topic is set aside. `check_md.py` WARNs on any summary other than Solution/Answer, so check that each WARN is such a fold and not a bare exercise answer.
- A review sheet that works through sample questions as its content (the ICS 46 midterm review) is not folded question by question: the worked answers are what it teaches.

## 7. Translations (zh-CN)

- Same headings, same numbering and same order as en-US.
- Same `<details>` blocks in the same order, with the same content split. The site reopens the reader's open answers by position after a language switch, and only does so when both pages have the same number of blocks. The ICS 46 `check_md.py` is stricter: each fold must sit in the same `## N.` / `### N.M` section in both files, with paired summaries (Solution ↔ 解答, Answer ↔ 答案).
- Code, identifiers and course terms stay in English. Prose is Chinese.

## 8. Checking

- `check_md.py` (for ICS 46 in this repo at `docs/skills/ics46-notes/scripts/`, for IN4MATX 133 at `docs/skills/in4matx133-notes/scripts/`, which also requires every tag in prose to be in backticks; skills whose procedure lives under `docs/skills/` are updated by committing there, not by re-uploading). Copies of a skill older than 2026-11-10 report every `<details>` line as an ERROR; pull the repo (or re-sync an uploaded skill) rather than removing folds:

  ```bash
  python3 -I <skill>/scripts/check_md.py src/content/notes/<COURSE>/<slug>.<lang>.md --course <COURSE> --site-repo .
  ```

  It renders the note with the site's own renderer module and checks frontmatter, file name, links, images, swallowed tags, anchors, viz configs and the answer folds (section 6). Fix every ERROR. A link to a not-yet-written note is only a WARN.
- In this repo: `npm run check`, `npm run build`, `npx tsx scripts/migrate/parity.ts`. CI runs the same checks on every push.

## 9. Block for a new notes skill

Paste this into the skill's "write the notes" step, with the course filled in:

```text
Follow docs/notes-authoring.md in the site repo (KKazuhaK/uci.kazuha.me). In short:
- File src/content/notes/<COURSE>/<slug>.<lang>.md; frontmatter title + summary only.
- Numbered ## sections by concept; same numbering in en-US and zh-CN.
- Links between notes point at the source .md file; no legacy ?kind= links.
- Diagrams are viz blocks; images only from the KKazuhaK/assets jsDelivr CDN.
- Every exercise answer goes in a fold block:

    <details>
    <summary>Solution</summary>

    …the answer…

    </details>

  (zh-CN: 解答 / 答案). Blank lines after <summary> and around </details>;
  only the answer inside; no "Try it first" line; same folds in the same
  order in both languages. Fold nothing else unless it is long and
  non-essential (then the summary names what it holds). A review sheet
  whose worked questions are its content is not folded question by question.
- Run check_md.py and fix every ERROR before delivering.
```

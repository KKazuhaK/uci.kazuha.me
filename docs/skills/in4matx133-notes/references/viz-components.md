# Interactive demos (`viz` blocks) for IN4MATX 133

Kazuha's site turns a fenced block tagged `viz <component>` into a
demo with Prev / Next / Play buttons, a message line and a watch panel. The
body is a one-line JSON config. Components live on his site
(`KKazuhaK/uci.kazuha.me`, `public/assets/viz/<component>.js`, served at https://ics.uci.edu/~kazuhak/assets/viz/);
the site is the source of truth for their code. The other components there
(`arraylist`, `linked-list`, `memory-trace` …) are C++ data structures for
ICS 46 and don't fit this course — use `web-demo`.

## Available components

### `web-demo`

The page's HTML/CSS/JS in source tabs, the rendered page in a sandboxed
iframe, and a console underneath with `console.log` output (formatted like
Node: `[ '1', 'fish', 2, <1 empty item>, 'dog' ]`), `alert`/`confirm`/`prompt`
text (they don't pop up; `confirm` returns true, `prompt` returns `""`),
and uncaught errors in red. Optional **steps** apply one change each, so a
CSS rule, a media query or a DOM edit can be stepped through. Each step is
line-diffed against the one before: added lines get a gold bar, removed
lines a red rule (their text on hover), the changed tab gets a dot, and the
source scrolls to the change. The step `note` shows right under the step
controls.

What readers get on the site (no config needed, so don't describe these
as missing in the notes): VS Code-style highlighting with line numbers;
code and page side by side on wide screens (stacked on phones, switchable);
the page in a browser-window frame whose address bar shows the viewport
width; dragging the page's right edge changes the viewport width live;
an expand button for a near-fullscreen view; **Copy**; and **Code Runner**,
which opens the current code in the site's Code Runner (Web mode) to keep
experimenting. A demo with no steps hides the step controls. The page is
built only when the demo scrolls near the screen.

````markdown
```viz web-demo
{"title": "Box model (slides 30–33)", "html": "<div class=\"box\">content</div>", "css": ".box { background: #fde68a; border: 4px solid #b45309; }", "steps": [{"note": "padding: space inside the border.", "css": ".box { padding: 20px; }"}, {"note": "margin: space outside the border.", "css": ".box { margin: 24px; }"}], "height": 140}
```
````

| Param | Type | Default | Notes |
| --- | --- | --- | --- |
| `html` | string | required | Body content only — no `<html>`/`<head>`/`<body>`. |
| `css` | string | `""` | Page stylesheet. |
| `js` | string | `""` | Runs at the end of `<body>`; `DOMContentLoaded` listeners still fire after it. |
| `libs` | string[] | `[]` | Any of `"bootstrap"` (5.3), `"mathjs"`, `"moment"`, `"vega-lite"` (vega + vega-lite + vega-embed). Loaded from jsDelivr, pinned. |
| `width` | int 240–1400 | demo width | Simulated viewport width. Wider than the demo → scaled down to fit, so media queries see the real width. |
| `height` | int 60–800 | `220` | Page height in px before scaling. Size it to the content; console-only demos can be 60. |
| `steps` | array ≤ 10 | `[]` | `{ "note": "…", "css"?, "js"?, "html"?, "width"? }`. `css` and `js` are **appended** to what came before; `html` **replaces**; `width` changes the viewport. `note` (one sentence) is required. |
| `tab` | `"html"` \| `"css"` \| `"js"` | auto | Tab to open on (default: the tab the step edits, else the first non-empty). |
| `source` | `"tabs"` \| `"none"` | `"tabs"` | `"none"` hides the source when the same code is printed right above. |
| `title`, `interactive`, `start` | | | Common params. `interactive: true` makes the source editable with **Run edited code** (or Ctrl/⌘+Enter) / **Revert**; edits survive stepping away and back until Revert. |

Total source (all fields + steps) ≤ 8,000 characters — a demo shows the
slide's point, not a whole assignment page.

Page quirks:
- `<body onload="runJS()">` and other attributes on `<body>`: the demo has
  no `<body>` tag, so call the function at the end of `js` (`runJS();`) and
  say so in the title.
- Forms submit inside the demo: a submit the page doesn't cancel is
  stopped and logged as `[form submitted]`, so validation code
  (`onsubmit`, `preventDefault`) runs for real and the page never navigates.
- Geolocation, camera and other permission APIs aren't available in the
  sandbox; show that code in a block and describe what the slide shows.
- A page's own `var parent = …` (DOM code does this) is fine — the console
  hook keeps its own reference to the real parent window.

- A demo that throws on purpose (a slide bug, a `ReferenceError` example)
  shows the error in its console, and `viz_preview.py` also prints it as a
  `PAGEERROR` line and exits 1. That's expected for those blocks: check the
  line matches the intended error, and say so in the report.

Writing JSON for it: escape `"` as `\"` and newlines as `\n` inside the
strings. Build the config with a small Python/Node script from the real
demo files (json.dumps) instead of hand-escaping, then paste the one line.

What each lecture typically uses it for:

| Topic | How |
|---|---|
| HTML structure, semantic tags, lists, tables, forms | `html` only; `source: "tabs"` so the markup is visible |
| CSS selectors, specificity, box model, display/position | base `html`+`css`, one step per rule the slide adds |
| Responsive design, media queries, grid systems | `width: 375`, then a step `{ "width": 1024 }` (and 768 if the slide has three breakpoints) |
| Bootstrap | `libs: ["bootstrap"]`, steps at different widths for the grid |
| JavaScript language (types, arrays, objects, functions, map/filter) | `html: "<p>See the console.</p>"`, `height: 60`, code in `js`; one step per statement group the slide discusses |
| DOM selection/editing/events | page `html`, then a step per DOM call; `interactive: true` on the main one so readers can try their own selector |
| npm packages (mathjs, moment) | `libs` + a few calls logging results |
| TypeScript | the browser can't run TS: print the `.ts` in a ```` ```ts ```` block (checked with `run_demo.py`), and give the demo the compiled JavaScript with a note saying so |
| Vega-Lite | `libs: ["vega-lite"]`, `html: "<div id=\"vis\"></div>"`, spec inline with a few `data.values` rows (the iframe can't fetch the repo's JSON files) |

Not for: things with no visible or console effect (package manager
commands, file layout, tsconfig) — use a code block; a history photo — one
sentence.

## How to use demos in notes

- Put the block right after the explanation and the slide's code, before
  pitfalls. At most one demo per concept section (an activity solution may
  add one fixed demo to check the answer).
- Introduce it in one sentence ("Try it below — step through the changes,
  or edit the code and press Run:").
- The demo adds to the text and never replaces it: the note still states
  the result in words or a table (md-editor and the Ask AI widget see only
  the JSON).
- Use the slide's or the repo's own example, say which in the `title`
  (`"Slides 18–20 · lectureExamples.js"`).
- `"interactive": true` on the main demo of each topic; worked examples
  and poll-question checks stay fixed.
- Check before inserting: the console lines and the rendered result must
  match what `run_demo.py` gave for the original file. Preview with
  `viz_preview.py` and look at the screenshots.

## Where the code lives

`web-demo.js` is in his site repo (`public/assets/viz/`, live at
`assets/viz/`), and that copy is the only one: this skill bundles none.
`check_md.py --site-repo <clone>` validates against the clone's copy (or
`--viz-dir`) — the same check CI runs, and a broken block fails the build
so nothing is published; read it in the clone, or without the repo
`fetch_viz.sh` downloads it for `viz_preview.py` or for reading.

## Adding a component

If a lecture needs something `web-demo` can't show (e.g. an event-bubbling
trace, a specificity calculator, a fetch/promise timeline), write a new
component rather than forcing it:

1. In the clone's `public/assets/viz/` (or after
   `scripts/fetch_viz.sh <work>/viz _core _player web-demo` without the repo),
   read `web-demo.js` and `_player.js` as the reference.
2. Contract: `meta` (name, summary, params), `validate(config)` → error
   strings, `steps(config)` → frames (`msg`, optional `group`, `vars`,
   `lines`), `render(stage, frame, config)`; optional `code`, `legend`,
   `input`, `meta.msgPosition: "top"` (note under the controls), and
   `moved(stage, config)` (called after the expand button moves the block
   into or out of the fullscreen dialog; iframes reload then). Import only `./_core.js`; nothing may touch `document`/`window`
   at import time (check_md runs `validate` + `steps` under node). Inject
   your own `<style id="viz-<name>-style">` using the player's `--vz-*`
   colours. Name it by what it shows (`event-bubbling.js`), flat in
   `public/assets/viz/`.
3. Validation errors name the param and say what's wrong; a config that
   would throw at run time is a validation error.
4. Test under node (good and bad configs), put it in the clone's
   `public/assets/viz/`, run `check_md.py notes.md --site-repo <clone>`,
   preview with `viz_preview.py`, add its row to that folder's `README.md`
   catalog and commit both with the note (SKILL.md Step 6; without the repo,
   deliver them next to the note), and add its section to this file.

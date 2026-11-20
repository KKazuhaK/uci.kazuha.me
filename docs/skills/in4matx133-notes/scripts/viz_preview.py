"""Render every ```viz block of a notes file in headless Chromium and screenshot it.

check_md.py proves each config is valid and that steps() runs; this shows
what the reader will actually see, so layout problems (wrapping rows,
arrows through boxes, clipped code lines) get caught before delivery.

Usage:
  viz_preview.py notes.md --viz <dir with _player.js, _core.js, components> --out <shots dir>
  viz_preview.py notes.md --viz ... --out ... --width 820 --steps 1,last

  --viz    folder with the components (required) — run scripts/fetch_viz.sh
           first and pass its download folder (fetch_viz.sh's default is
           <work>/viz), or <clone of KKazuhaK/uci.kazuha.me>/public/assets/viz
  --width  page width in px (820 ≈ the note page's content column)
  --wait   ms to wait after each step before the screenshot (default 1200;
           web-demo reloads its iframe, so short waits show a stale console)
  --steps  which steps to capture per block: "start" (the block's own start,
           default), "1", "last", a step number, or a comma list like "1,3,last"

Prints one line per block (component, frames, errors), each web-demo's console
text at every captured step (compare it with the notes and run_demo.py),
and any console / page errors. Exit code 1 if a block shows the red error box or the page
throws. Needs Python playwright + Chromium (pip install playwright;
playwright install chromium) — if missing it says so: report "NOT previewed".
"""
import argparse
import http.server
import json
import os
import re
import shutil
import socketserver
import sys
import tempfile
import threading

HERE = os.path.dirname(os.path.abspath(__file__))


def viz_blocks(text):
    out, cur = [], None
    for i, raw in enumerate(text.split("\n")):
        s = raw.strip()
        if cur is None and re.match(r"^```viz(\s|$)", s):
            parts = s[3:].split()
            cur = [i + 1, parts[1] if len(parts) > 1 else "", []]
        elif cur is not None and s.startswith("```"):
            out.append((cur[0], cur[1], "\n".join(cur[2])))
            cur = None
        elif cur is not None:
            cur[2].append(raw)
    return out


PAGE = """<!doctype html><html><head><meta charset="utf-8">
<style>body{font-family:system-ui,sans-serif;max-width:%(w)dpx;margin:16px auto;background:#fff}</style></head>
<body><div id="out"></div><script type="module">
import * as player from "./_player.js";
const blocks = %(blocks)s;
const out = document.getElementById("out");
const report = [];
for (const b of blocks) {
  const w = document.createElement("div"); w.id = "b" + b.k; out.appendChild(w);
  let cfg = null;
  try { cfg = JSON.parse(b.src || "{}"); } catch (e) { report.push({k: b.k, error: "bad JSON: " + e.message}); continue; }
  let mod = null;
  try { mod = await import("./" + b.name + ".js"); } catch (e) { report.push({k: b.k, error: "no component " + b.name}); continue; }
  try { player.mount(w, mod, cfg, b.src); } catch (e) { report.push({k: b.k, error: "mount crashed: " + e.message}); continue; }
  const err = w.classList.contains("viz-error") ? w.textContent.slice(0, 300) : null;
  const step = (w.querySelector(".viz-step") || {}).textContent || "";
  report.push({k: b.k, error: err, step: step});
}
window.__report = report;
document.body.dataset.ready = "1";
</script></body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("notes")
    ap.add_argument("--viz", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--width", type=int, default=820)
    ap.add_argument("--steps", default="start")
    ap.add_argument("--wait", type=int, default=1200, help="ms after each step before the screenshot (web-demo reloads its iframe)")
    a = ap.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("WARNING: python playwright not installed — viz blocks NOT previewed. Say so in the report.")
        sys.exit(0)

    blocks = viz_blocks(open(a.notes, encoding="utf-8").read())
    if not blocks:
        print("no viz blocks")
        return
    tmp = tempfile.mkdtemp(prefix="vizprev-")
    for f in os.listdir(a.viz):
        if f.endswith(".js"):
            shutil.copy(os.path.join(a.viz, f), tmp)
    data = [{"k": k, "line": ln, "name": name, "src": src} for k, (ln, name, src) in enumerate(blocks)]
    # escape "</" so a demo's "</script>" can't close the page's own <script>
    open(os.path.join(tmp, "index.html"), "w").write(PAGE % {"w": a.width, "blocks": json.dumps(data).replace("</", "<\\/")})
    os.makedirs(a.out, exist_ok=True)

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *x, **kw):
            super().__init__(*x, directory=tmp, **kw)

        def log_message(self, *args):
            pass

    handler = Quiet
    httpd = socketserver.TCPServer(("127.0.0.1", 0), handler)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()

    bad = False
    logs = []
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception as e:  # no browser installed
            print("WARNING: Chromium not available (" + str(e).splitlines()[0] + ") — NOT previewed.")
            sys.exit(0)
        page = browser.new_page(viewport={"width": a.width + 40, "height": 900})
        page.on("console", lambda m: m.type in ("error", "warning") and logs.append(m.type + ": " + m.text[:200]))
        page.on("pageerror", lambda e: logs.append("PAGEERROR " + str(e)[:300]))
        page.goto("http://127.0.0.1:%d/index.html" % port)
        page.wait_for_selector("body[data-ready='1']", timeout=20000)
        page.wait_for_timeout(400)
        report = {r["k"]: r for r in page.evaluate("window.__report")}
        wanted = [s.strip() for s in a.steps.split(",")]
        for k, (ln, name, src) in enumerate(blocks):
            r = report.get(k, {})
            status = ("ERROR " + r["error"]) if r.get("error") else (r.get("step") or "?")
            bad |= bool(r.get("error"))
            print("line %d  viz %-20s %s" % (ln, name, status))
            el = page.query_selector("#b%d" % k)
            if not el or r.get("error"):
                continue
            # web-demo builds its page only near the viewport: scroll there first
            el.scroll_into_view_if_needed()
            page.wait_for_timeout(a.wait)
            for w in wanted:
                if w == "1":
                    page.evaluate("(k)=>{const b=document.querySelector('#b'+k+' [data-act=reset]'); b&&b.click();}", k)
                elif w.isdigit():
                    page.evaluate("([k,n])=>{const r=document.querySelector('#b'+k+' [data-act=reset]'); r&&r.click(); const b=document.querySelector('#b'+k+' [data-act=next]'); for(let i=1;i<n&&b&&!b.disabled;i++) b.click();}", [k, int(w)])
                elif w == "last":
                    page.evaluate("(k)=>{const n=document.querySelector('#b'+k+' [data-act=next]'); let i=0; while(n&&!n.disabled&&i<500){n.click();i++;}}", k)
                page.wait_for_timeout(a.wait)
                el.scroll_into_view_if_needed()
                el.screenshot(path=os.path.join(a.out, "line%04d-%s-%s.png" % (ln, name, w)))
                cons = page.evaluate("(k)=>{const c=document.querySelector('#b'+k+' .vz-wd-console'); return c ? c.innerText : null;}", k)
                if cons is not None:
                    print("    console @%s: %s" % (w, (" | ".join(l for l in cons.splitlines() if l.strip()) or "(empty)")[:400]))
        browser.close()
    httpd.shutdown()
    shutil.rmtree(tmp, ignore_errors=True)
    for l in logs:
        print(l)
        bad |= l.startswith("PAGEERROR")
    print("screenshots in " + a.out)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()

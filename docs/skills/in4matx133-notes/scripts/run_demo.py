#!/usr/bin/env python3
"""Run a course demo file and report what it really does.

The notes state the real console output and the real rendered result of the
lecture's demos and poll questions, never a guess. This runs them.

Usage:
  run_demo.py <page.html> [--width 1280] [--height 800] [--out shot.png] [--wait 800]
      Serves the page's folder on localhost (so fetch('data.json') and
      relative <script src> work), opens it in headless Chromium at the given
      viewport width, prints every console message, alert/confirm/prompt
      text, and page error in order, then saves a full-page screenshot.
      Run it at two widths (e.g. 375 and 1280) for responsive demos.
  run_demo.py <script.js>
      Runs the file with node and prints stdout/stderr. Only for scripts that
      don't touch document/window (array/object/function demos); DOM code
      needs the .html page.
  run_demo.py <file.ts> [--strict]
      Type-checks with tsc (--noEmit) and prints the diagnostics, then
      compiles to a temp .js and runs it with node if it has no DOM use.

Copy the repo folder into the work dir first and run from the copy; this
script never writes into the folder it serves.
Needs Python playwright + Chromium for .html (prints "NOT run" if missing).
"""
import argparse
import http.server
import os
import shutil
import socketserver
import subprocess
import sys
import tempfile
import threading


def run_node(path):
    r = subprocess.run(["node", path], capture_output=True, text=True, timeout=30)
    sys.stdout.write(r.stdout)
    if r.stderr:
        sys.stdout.write("[stderr]\n" + r.stderr)
    print("[exit %d]" % r.returncode)


def run_ts(path, strict):
    tsc = shutil.which("tsc") or shutil.which("npx")
    if not tsc:
        print("WARNING: tsc not available — NOT type-checked")
        return
    base = [tsc] if tsc.endswith("tsc") else [tsc, "--yes", "tsc"]
    opts = ["--target", "es2020", "--lib", "es2020,dom", "--skipLibCheck"] + (["--strict"] if strict else [])
    r = subprocess.run(base + opts + ["--noEmit", path], capture_output=True, text=True, timeout=120)
    print("tsc: " + ("no errors" if r.returncode == 0 else "errors"))
    sys.stdout.write(r.stdout)
    out = tempfile.mkdtemp(prefix="ts-")
    subprocess.run(base + opts + ["--outDir", out, path], capture_output=True, text=True, timeout=120)
    js = os.path.join(out, os.path.splitext(os.path.basename(path))[0] + ".js")
    if os.path.exists(js):
        src = open(js, encoding="utf-8").read()
        if "document." in src or "window." in src:
            print("(uses the DOM — run the .html page that loads it instead)")
        else:
            print("--- node output of the compiled JS ---")
            run_node(js)


def run_html(path, width, height, out, wait):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("WARNING: python playwright not installed — NOT run. Say so in the report.")
        return 0
    root = os.path.dirname(os.path.abspath(path))

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *x, **kw):
            super().__init__(*x, directory=root, **kw)

        def log_message(self, *args):
            pass

    httpd = socketserver.TCPServer(("127.0.0.1", 0), Quiet)
    port = httpd.server_address[1]
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    bad = 0
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch()
        except Exception as e:
            print("WARNING: Chromium not available (" + str(e).splitlines()[0] + ") — NOT run.")
            return 0
        page = browser.new_page(viewport={"width": width, "height": height})

        def on_console(m):
            print("console.%s: %s" % (m.type, m.text))

        def on_dialog(d):
            print("[%s] %s" % (d.type, d.message))
            d.accept()

        def on_error(e):
            nonlocal bad
            bad = 1
            print("PAGEERROR " + str(e))

        page.on("console", on_console)
        page.on("dialog", on_dialog)
        page.on("pageerror", on_error)
        page.on("requestfailed", lambda r: print("request failed: " + r.url))
        page.goto("http://127.0.0.1:%d/%s" % (port, os.path.basename(path)), wait_until="networkidle")
        page.wait_for_timeout(wait)
        if out:
            page.screenshot(path=out, full_page=True)
            print("screenshot: " + out)
        print("viewport %dx%d, title %r" % (width, height, page.title()))
        browser.close()
    httpd.shutdown()
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--width", type=int, default=1280)
    ap.add_argument("--height", type=int, default=800)
    ap.add_argument("--out")
    ap.add_argument("--wait", type=int, default=800, help="ms to wait after load (raise for setTimeout demos)")
    ap.add_argument("--strict", action="store_true")
    a = ap.parse_args()
    ext = os.path.splitext(a.file)[1].lower()
    if ext == ".js":
        run_node(a.file)
    elif ext == ".ts":
        run_ts(a.file, a.strict)
    elif ext in (".html", ".htm"):
        sys.exit(run_html(a.file, a.width, a.height, a.out, a.wait))
    else:
        sys.exit("run_demo.py: give a .html, .js or .ts file")


if __name__ == "__main__":
    main()

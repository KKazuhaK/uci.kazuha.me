#!/usr/bin/env python3
"""Render ICS 46 lecture slides and build a per-page inventory.

Rendering is for READING the slides; nothing rendered here is delivered
(the notes are a single Markdown file with no images).

Why this exists: Prof. Yeh's PDFs put most code and every diagram inside
images. Text extraction alone returns slide titles like "SLL" with nothing
else, so every page has to be rendered and looked at.

Usage:
  render_slides.py render <slides.pdf> <outdir> [--prefix lec04] [--dpi 150]
      -> <outdir>/slides/<prefix>-pNN.png   (every page)
      -> <outdir>/inventory.md              (what to look at, page by page)
  render_slides.py sheet <outdir> <out.png> <page> [<page> ...]
      -> contact sheet of several rendered pages (fast visual skim)
"""
import argparse
import os
import subprocess
import sys

import pypdf
from PIL import Image, ImageChops, ImageStat


def page_images(reader_page):
    """Count real embedded images (ignore 1x1 spacers and soft masks)."""
    n = 0
    try:
        res = reader_page.get("/Resources") or {}
        xobj = res.get("/XObject") or {}
        for k in xobj:
            o = xobj[k].get_object()
            if o.get("/Subtype") == "/Image":
                if int(o.get("/Width", 0)) > 8 and int(o.get("/Height", 0)) > 8:
                    n += 1
    except Exception:
        pass
    return n


def diff_ratio(a, b):
    """Mean pixel difference between two renders, 0 = identical."""
    a = Image.open(a).convert("L").resize((200, 150))
    b = Image.open(b).convert("L").resize((200, 150))
    return ImageStat.Stat(ImageChops.difference(a, b)).mean[0] / 255.0


def cmd_render(args):
    os.makedirs(os.path.join(args.outdir, "slides"), exist_ok=True)
    reader = pypdf.PdfReader(args.pdf)
    base = os.path.join(args.outdir, "slides", args.prefix)
    subprocess.run(["pdftoppm", "-r", str(args.dpi), "-png", args.pdf, base],
                   check=True)
    # pdftoppm pads page numbers to the page-count width; normalise to pNN.
    width = len(str(len(reader.pages)))
    pngs = []
    for i in range(1, len(reader.pages) + 1):
        src = f"{base}-{str(i).zfill(width)}.png"
        dst = f"{base}-p{i:02d}.png"
        if src != dst and os.path.exists(src):
            os.replace(src, dst)
        pngs.append(dst)

    rows, links = [], []
    for i, p in enumerate(reader.pages, 1):
        text = (p.extract_text() or "").strip()
        lines = [l.strip() for l in text.splitlines() if l.strip()]
        title = lines[0][:60] if lines else "(no text)"
        nimg = page_images(p)
        chars = len(text)
        # A page needs visual reading if it has images, or almost no text
        # (the content is drawn), or code-looking text that is cut off.
        if nimg and chars < 120:
            flag = "VISUAL-ONLY"
        elif nimg:
            flag = "TEXT+VISUAL"
        elif chars < 40:
            flag = "DIVIDER?"
        else:
            flag = "TEXT"
        build = ""
        if i > 1:
            d = diff_ratio(pngs[i - 2], pngs[i - 1])
            if d < 0.03:
                build = f"build of p{i-1} (diff {d:.3f})"
        for a in p.get("/Annots") or []:
            a = a.get_object()
            if a.get("/A") and "/URI" in a["/A"]:
                links.append((i, str(a["/A"]["/URI"])))
        rows.append((i, flag, nimg, chars, title.replace("|", "/"), build))

    inv = os.path.join(args.outdir, "inventory.md")
    with open(inv, "w") as f:
        f.write(f"# Slide inventory: {os.path.basename(args.pdf)}\n\n")
        f.write(f"{len(rows)} pages rendered to slides/{args.prefix}-pNN.png\n\n")
        f.write("Every row must end up assigned to a topic in the notes "
                "(or marked admin/skip). VISUAL rows must be opened with Read.\n\n")
        f.write("| page | flag | imgs | text chars | first line | animation |\n")
        f.write("|---|---|---|---|---|---|\n")
        for r in rows:
            f.write("| %d | %s | %d | %d | %s | %s |\n" % r)
        if links:
            f.write("\n## Links in slides\n\n")
            for i, u in links:
                f.write(f"- p{i}: {u}\n")
    vis = sum(1 for r in rows if r[1].startswith(("VISUAL", "TEXT+")))
    print(f"rendered {len(rows)} pages; {vis} need visual reading; "
          f"inventory -> {inv}")


def cmd_sheet(args):
    pngs = []
    for p in args.pages:
        cand = [f for f in os.listdir(os.path.join(args.outdir, "slides"))
                if f.endswith(f"-p{int(p):02d}.png")]
        if cand:
            pngs.append(os.path.join(args.outdir, "slides", cand[0]))
    if not pngs:
        sys.exit("no pages found")
    ims = [Image.open(p).convert("RGB") for p in pngs]
    w = 700
    ims = [im.resize((w, int(im.height * w / im.width))) for im in ims]
    h = max(im.height for im in ims)
    cols = 2
    rows_n = (len(ims) + 1) // cols
    sheet = Image.new("RGB", (w * cols, h * rows_n), "white")
    for k, im in enumerate(ims):
        sheet.paste(im, ((k % cols) * w, (k // cols) * h))
    sheet.save(args.out)
    print(f"sheet of {len(ims)} pages -> {args.out}")


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    r = sub.add_parser("render")
    r.add_argument("pdf")
    r.add_argument("outdir")
    r.add_argument("--prefix", default="lec")
    r.add_argument("--dpi", type=int, default=150)
    s = sub.add_parser("sheet")
    s.add_argument("outdir")
    s.add_argument("out")
    s.add_argument("pages", nargs="+")
    a = ap.parse_args()
    {"render": cmd_render, "sheet": cmd_sheet}[a.cmd](a)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Python Tutor-style, step-by-step memory diagrams as Mermaid text.

Output is plain Markdown (one ```mermaid block per step) that goes straight
into the notes file — no image files. Kazuha's md-viewer and GitHub both
render Mermaid.

Conventions (Kazuha's standing preference for ICS 46 diagrams):
  * every object shows ALL its member fields, one box per field;
  * a pointer arrow starts at the exact field / variable that holds it and
    lands on the target object's header box;
  * an overwritten value is shown struck through next to the new value;
  * a retargeted pointer keeps its old arrow, dotted grey ending in an x;
  * deleted heap objects are drawn grey and dashed with "(deleted)".

Spec (JSON):
{
  "title": "SLL add at head",
  "steps": [
    {
      "code": "Node* newNode = new Node(item);",   // line(s) just executed
      "note": "allocate the new node",              // optional caption
      "stack": [                                    // frames, top first
        {"frame": "add(item = \"UCI\")", "vars": [
          {"name": "oldHead", "value": "->n1"},
          {"name": "newNode", "value": "->n0"}]},
        {"frame": "sll", "vars": [
          {"name": "head", "value": "->n1", "old_target": "n2"},
          {"name": "n",    "value": "2",    "old": "1"}]}
      ],
      "heap": [
        {"id": "n0", "type": "Node", "fields": [
          {"name": "item", "value": "\"UCI\""},
          {"name": "next", "value": "->n1"}]},
        {"id": "n1", "type": "Node", "freed": true, "fields": [...]}
      ]
    }
  ]
}
Values: "->id" = pointer to heap object id; "nullptr" = null; "dangling" =
pointer to deleted memory; anything else is printed as-is. Optional on any
var/field: "old" (struck-through previous value), "old_target" (heap id the
pointer used to point to). "ref": true draws a reference (alias) as a
dotted arrow; its value may be "->id" or "->frame.var" to alias a stack var.

Keep every object present in every step (mark it freed instead of
dropping it) so the layout doesn't jump between steps.

Incremental steps (saves writing the whole state each time): a step with
no "stack"/"heap" copies the previous step's state with all old/old_target
marks cleared, then applies "set" / "add_heap" / "add_vars" / "free":
  {"code": "head = newNode; ++n;",
   "set": {"sll.head": {"value": "->n0", "old_target": "n1"},
           "sll.n":    {"value": "2", "old": "1"}}}
  "set" keys are "<frame>.<var>" or "<heap id>.<field>".
  "add_heap": [ {object as above} ]      new heap objects
  "add_vars": {"<frame>": [ {var} ]}     new locals in an existing frame
  "push_frame": {"frame": ..., "vars": [...]}  / "pop_frame": true
  "free": ["n1"]                          mark objects deleted

Usage:
  memdiag.py spec.json            -> Markdown on stdout
  memdiag.py spec.json --check    -> also render each step with mmdc
                                     (see check_md.py for setup) and fail
                                     on Mermaid syntax errors
"""
import json
import re
import subprocess
import sys
import tempfile
import os


def lab(s):
    """Escape a label for Mermaid's quoted-label syntax."""
    s = str(s)
    s = s.replace("#", "#35;").replace('"', "#quot;")
    s = s.replace("<", "#lt;").replace(">", "#gt;")
    return s


def ident(s):
    return re.sub(r"[^A-Za-z0-9_]", "_", str(s))


def value_text(item):
    v = item.get("value", "")
    if isinstance(v, str) and v.startswith("->"):
        shown = "●"
    elif v == "nullptr":
        shown = "∅ nullptr"
    elif v == "dangling":
        shown = "⚠ dangling"
    else:
        shown = lab(v)
    old = item.get("old")
    if old is not None:
        # <s> survives Mermaid's sanitizer (viewer uses securityLevel loose).
        return f"<s>{lab(old)}</s> {shown}"
    return shown


def step_to_mermaid(step):
    out = ["flowchart LR",
           "  classDef hdr font-weight:bold",
           "  classDef freed stroke-dasharray:4 3,color:#888"]
    edges = []          # (text, is_stale)
    freed_nodes = []
    hdr_nodes = []
    var_ids = {}        # "frame.var" -> node id, for references

    out.append('  subgraph STACK["Stack"]')
    for fi, fr in enumerate(step.get("stack", [])):
        fid = f"F{fi}"
        out.append(f'    subgraph {fid}["{lab(fr["frame"])}"]')
        for v in fr.get("vars", []):
            nid = f"{fid}_{ident(v['name'])}"
            var_ids[f"{fr['frame']}.{v['name']}"] = nid
            out.append(f'      {nid}["{lab(v["name"])} = {value_text(v)}"]')
        if not fr.get("vars"):
            out.append(f'      {fid}_empty["(no locals)"]')
        out.append("    end")
    if not step.get("stack"):
        out.append('    STACK_empty["(empty)"]')
    out.append("  end")

    out.append('  subgraph HEAP["Heap"]')
    for o in step.get("heap", []):
        oid = ident(o["id"])
        freed = o.get("freed", False)
        tag = " (deleted)" if freed else ""
        out.append(f'    subgraph {oid}[" "]')
        out.append(f'      {oid}_h["{lab(o.get("type", ""))} {lab(o["id"])}{tag}"]')
        hdr_nodes.append(f"{oid}_h")
        if freed:
            freed_nodes += [oid, f"{oid}_h"]
        for fld in o.get("fields", []):
            nid = f"{oid}_{ident(fld['name'])}"
            out.append(f'      {nid}["{lab(fld["name"])} = {value_text(fld)}"]')
            if freed:
                freed_nodes.append(nid)
        out.append("    end")
    if not step.get("heap"):
        out.append('    HEAP_empty["(empty)"]')
    out.append("  end")

    def target(val):
        t = val[2:]
        if "." in t and t in var_ids:
            return var_ids[t]
        return f"{ident(t)}_h"

    def add_edges(src, item):
        val = item.get("value", "")
        if isinstance(val, str) and val.startswith("->"):
            arrow = "-.->" if item.get("ref") else "-->"
            edges.append((f"  {src} {arrow} {target(val)}", False))
        if item.get("old_target"):
            edges.append((f"  {src} -.-x {target('->' + item['old_target'])}", True))

    for fi, fr in enumerate(step.get("stack", [])):
        for v in fr.get("vars", []):
            add_edges(f"F{fi}_{ident(v['name'])}", v)
    for o in step.get("heap", []):
        for fld in o.get("fields", []):
            add_edges(f"{ident(o['id'])}_{ident(fld['name'])}", fld)

    for text, _ in edges:
        out.append(text)
    if hdr_nodes:
        out.append(f"  class {','.join(hdr_nodes)} hdr")
    if freed_nodes:
        out.append(f"  class {','.join(freed_nodes)} freed")
    stale = [str(k) for k, (_, s) in enumerate(edges) if s]
    if stale:
        out.append(f"  linkStyle {','.join(stale)} stroke:#999,color:#999")
    return "\n".join(out)


def expand(steps):
    """Resolve incremental steps into full snapshots."""
    import copy
    full, prev = [], None
    for st in steps:
        if "stack" in st or "heap" in st or prev is None:
            cur = copy.deepcopy({"stack": st.get("stack", []), "heap": st.get("heap", [])})
        else:
            cur = copy.deepcopy({"stack": prev["stack"], "heap": prev["heap"]})
            for item in [v for f in cur["stack"] for v in f.get("vars", [])] + \
                        [f for o in cur["heap"] for f in o.get("fields", [])]:
                item.pop("old", None)
                item.pop("old_target", None)
            if st.get("pop_frame"):
                cur["stack"].pop(0)
            if st.get("push_frame"):
                cur["stack"].insert(0, copy.deepcopy(st["push_frame"]))
            for fname, vs in st.get("add_vars", {}).items():
                fr = next(f for f in cur["stack"] if f["frame"] == fname)
                fr.setdefault("vars", []).extend(copy.deepcopy(vs))
            cur["heap"].extend(copy.deepcopy(st.get("add_heap", [])))
            for oid in st.get("free", []):
                next(o for o in cur["heap"] if o["id"] == oid)["freed"] = True
            for key, upd in st.get("set", {}).items():
                owner, name = key.rsplit(".", 1)
                pool = [v for f in cur["stack"] if f["frame"] == owner for v in f["vars"]] or \
                       [f for o in cur["heap"] if o["id"] == owner for f in o["fields"]]
                tgt = next((x for x in pool if x["name"] == name), None)
                if tgt is None:
                    sys.exit(f"set: no variable/field {key!r}")
                tgt.update(upd)
        cur.update({k: st[k] for k in ("code", "note") if k in st})
        full.append(cur)
        prev = cur
    return full


def to_markdown(spec):
    steps = expand(spec["steps"])
    md = [f"**Memory trace: {spec.get('title', '')}** ({len(steps)} steps)", ""]
    for i, st in enumerate(steps, 1):
        line = f"**Step {i}/{len(steps)}:** `{st.get('code', '')}`"
        if st.get("note"):
            line += f" — {st['note']}"
        md += [line, "", "```mermaid", step_to_mermaid(st), "```", ""]
    return "\n".join(md), [step_to_mermaid(s) for s in steps]


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__)
        sys.exit(0)
    spec = json.load(open(sys.argv[1]))
    md, charts = to_markdown(spec)
    if "--check" in sys.argv:
        here = os.path.dirname(os.path.abspath(__file__))
        with tempfile.TemporaryDirectory() as d:
            for i, c in enumerate(charts, 1):
                p = os.path.join(d, f"s{i}.md")
                open(p, "w").write("```mermaid\n" + c + "\n```\n")
                r = subprocess.run([sys.executable, "-I",
                                    os.path.join(here, "check_md.py"), p,
                                    "--mermaid-only"], capture_output=True)
                if r.returncode:
                    sys.stderr.write(r.stdout.decode() + r.stderr.decode())
                    sys.exit(f"step {i} failed to render")
    print(md)


if __name__ == "__main__":
    main()

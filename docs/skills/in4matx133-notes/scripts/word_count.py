#!/usr/bin/env python3
"""Word count of a notes file, split the way the length target means it.

Usage: word_count.py notes.md
Prints prose words (outside fences), code words (```html/css/js/ts/... blocks),
and viz words (```viz blocks: the JSON, which does NOT count toward the
target). The target (SKILL.md rule 3) is prose + code.
"""
import sys

prose = code = viz = 0
fence = None
for line in open(sys.argv[1], encoding="utf-8"):
    s = line.strip()
    if s.startswith("```"):
        fence = None if fence is not None else (s[3:].strip() or "text")
        continue
    w = len(line.split())
    if fence is None:
        prose += w
    elif fence.startswith("viz"):
        viz += w
    else:
        code += w
print("prose %d + code %d = %d (target 2,500-4,500)   [viz JSON %d, not counted]" % (prose, code, prose + code, viz))
if prose > 3800:
    print("prose alone is over ~3,800 words: tighten explanations before anything else")

#!/usr/bin/env bash
# Download the current viz components from Kazuha's live site.
#
# The site's assets/viz/ is the only copy of the component code; this skill
# keeps no bundled copy. Run this before reading a component (to learn its
# config), writing a new one (to copy the contract and helpers), building the
# local --viz-dir folder for check_md.py, or running viz_preview.py.
#
# Usage:
#   fetch_viz.sh [DEST] [NAME ...]
#     DEST   folder to download into (default: $WORK/viz, or ./viz if
#            $WORK is unset)
#     NAME   component names to fetch (default: every component named in
#            references/viz-components.md as a "### `name`" heading)
#   _core.js, _player.js and the shared views _tree.js / _array.js are always fetched.
#
# Exits non-zero and names the file if any download fails.
set -u

BASE="https://ics.uci.edu/~kazuhak/assets/viz"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REF="$HERE/../references/viz-components.md"

DEST="${1:-${WORK:-$PWD}/viz}"
[ $# -gt 0 ] && shift

if [ $# -gt 0 ]; then
  names=("$@")
else
  if [ ! -f "$REF" ]; then
    echo "fetch_viz.sh: can't find $REF to read component names" >&2
    exit 2
  fi
  mapfile -t names < <(grep -oE '^### `[a-z][a-z0-9-]*`' "$REF" | sed -E 's/^### `(.*)`$/\1/')
  if [ ${#names[@]} -eq 0 ]; then
    echo "fetch_viz.sh: no component names found in $REF" >&2
    exit 2
  fi
fi

mkdir -p "$DEST" || { echo "fetch_viz.sh: can't create $DEST" >&2; exit 2; }

failed=()
for name in _core _player _tree _array "${names[@]}"; do
  name="${name%.js}"
  if curl -fsSL --max-time 30 -o "$DEST/$name.js.part" "$BASE/$name.js?nocache=$$"; then
    mv "$DEST/$name.js.part" "$DEST/$name.js"
    echo "fetched $name.js"
  else
    rm -f "$DEST/$name.js.part"
    echo "FAILED  $name.js  ($BASE/$name.js)" >&2
    failed+=("$name.js")
  fi
done

if [ ${#failed[@]} -gt 0 ]; then
  echo "fetch_viz.sh: ${#failed[@]} download(s) failed: ${failed[*]}" >&2
  exit 1
fi
echo "all components in $DEST"

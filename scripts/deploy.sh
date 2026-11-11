#!/usr/bin/env bash
# Copy the Astro build (dist/) into the web root (settings: deploy.env).
#   next  -> $WEB_ROOT/next/ (staging; safe to wipe)
#   prod  -> $WEB_ROOT itself
# SRC=<dir> deploys another build (scripts/pull-deploy.sh passes the CI build).
# Files the web server serves that are not built from this repo (resources/,
# remote_profiles/, deployment-local config, ...) are listed in KEEP, so --delete never touches them.
set -euo pipefail
cd "$(dirname "$0")/.."
. scripts/deploy-env.sh

target="${1:-}"
web="$WEB_ROOT"
src="${SRC:-dist}"
[ -f "$src/index.html" ] || { echo "$src/ has no build; run astro build first" >&2; exit 1; }

# dist/ must have been built for this target's base, or every link points at the wrong place.
case "$target" in
  next) want="${SITE_BASE}next/" ;;
  prod) want="$SITE_BASE" ;;
  *) want="" ;;
esac
if [ -n "$want" ] && ! grep -q "href=\"${want}notes/\"" "$src/index.html"; then
  echo "$src/ was not built for base ${want}; run the matching npm script (deploy / deploy:next) or check SITE_BASE in deploy.env" >&2
  exit 1
fi

# rsync --delete must only ever run on a dedicated directory.
real="$(readlink -f "$web" 2>/dev/null || echo "$web")"
case "$real" in
  /|"$(readlink -f "$HOME")"|/home|/var|/usr|/etc|/srv) echo "refusing to deploy into $web; check WEB_ROOT in deploy.env" >&2; exit 1 ;;
esac
# ... and never on (or above) this repo or the build checkout.
for inside in "$PWD" "$(readlink -f "$DIST_DIR" 2>/dev/null || echo "$DIST_DIR")" "$(readlink -f "$STATE_DIR" 2>/dev/null || echo "$STATE_DIR")" "$(readlink -f "$src")"; do
  case "$inside/" in "$real"/*) echo "refusing to deploy into $web: it contains $inside; check WEB_ROOT in deploy.env" >&2; exit 1 ;; esac
done

# sync_count <dest> <rsync options…>: sync $src into <dest> and print a "Changes:" line.
# With SYNC_PROGRESS=1 (scripts/pull-deploy.sh sets it, and turns these into a bar) a
# dry run first counts the paths that will change, and each one synced prints
# "Progress: <n> <total>".
sync_count() {
  local dest=$1 total=0 planned progress="${SYNC_PROGRESS:-0}"
  shift
  local opts=(-a --delete "--chmod=D755,F644" --itemize-changes "$@" "$src/" "$dest")
  if [ "$progress" = 1 ]; then
    planned="$(rsync --dry-run "${opts[@]}")"
    total="$(grep -c . <<<"$planned" || true)"
    echo "Progress: 0 $total"
  fi
  rsync "${opts[@]}" | {
    local line n=0 updated=0 deleted=0
    while IFS= read -r line; do
      n=$((n + 1))
      case "$line" in
        ">f"*) updated=$((updated + 1)) ;;
        "*deleting "*[!/]) deleted=$((deleted + 1)) ;;  # files, not dirs
      esac
      [ "$progress" = 1 ] && echo "Progress: $n $total"
    done
    echo "Changes: $updated files updated, $deleted removed"
  }
}

case "$target" in
  next)
    mkdir -p "$web/next"
    sync_count "$web/next/" --exclude=/.git/
    echo "Staged: ${PUBLIC_URL%/}/next/"
    ;;
  prod)
    # ~/public_html used to be a git clone of this repo. After a deploy it is build
    # output, and git commands there (clean, pull, add -A) would hit private
    # untracked dirs or check out source over the live site. Retire it first.
    if [ -e "$web/.git" ]; then
      echo "$web/.git exists; move it aside (e.g. mv $web/.git $web.git.bak) before the first prod deploy" >&2
      exit 1
    fi
    excludes=(--exclude=/.git/)
    for k in ${KEEP_PATHS[@]+"${KEEP_PATHS[@]}"}; do excludes+=("--exclude=/${k#/}"); done
    mkdir -p "$web"
    sync_count "$web/" "${excludes[@]}"
    echo "Deployed: $PUBLIC_URL"
    ;;
  *)
    echo "usage: scripts/deploy.sh next|prod" >&2; exit 2 ;;
esac

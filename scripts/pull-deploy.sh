#!/usr/bin/env bash
# Publish the latest CI build to the web root (settings: deploy.env). Run by
# ./update_site.sh, which waits for CI first. GitHub Actions builds every push to main and
# force-pushes the result to DEPLOY_BRANCH; this fetches that branch into DIST_DIR
# and, when it holds a build not yet deployed, syncs it with scripts/deploy.sh.
# No Node needed on the server.
#   scripts/pull-deploy.sh           # deploy only if the build changed
#   scripts/pull-deploy.sh --force   # redeploy the current build anyway
# Two stages (fetch, publish), printed by scripts/progress.sh; update_site.sh numbers
# them 3-4 and passes EXPECT_SOURCE (the main commit it checked CI for).
set -euo pipefail
here="$(cd "$(dirname "$0")/.." && pwd)"
. "$here/scripts/deploy-env.sh"
STAGE_TOTAL="${STAGE_TOTAL:-2}"
. "$here/scripts/progress.sh"
dist="$DIST_DIR"
state="$STATE_DIR"
mkdir -p "$state"
exec 9>"$state/site-pull-deploy.lock"
if ! flock -n 9; then
  echo "  ✗ another publish is running (lock $state/site-pull-deploy.lock); try again when it is done" >&2
  exit 1
fi

stage "Fetching the build ($DEPLOY_BRANCH)"
# Keep the source checkout current too (fast-forward only; never touches local edits).
# update_site.sh has just done this; it matters when this script is run on its own.
git -C "$here" pull -q --ff-only 2>/dev/null || info "note: $here not fast-forwarded (local commits or conflicts)"

repo="$(git -C "$here" remote get-url origin)"
if [ ! -d "$dist/.git" ]; then
  info "first run: cloning $DEPLOY_BRANCH into $dist"
  git_progress clone --depth 1 --branch "$DEPLOY_BRANCH" "$repo" "$dist"
else
  git_progress -C "$dist" fetch --depth 1 origin "$DEPLOY_BRANCH"
  if [ "$(git -C "$dist" rev-parse HEAD)" != "$(git -C "$dist" rev-parse FETCH_HEAD)" ]; then
    git -C "$dist" reset -q --hard FETCH_HEAD
    git -C "$dist" gc -q --prune=now
  fi
fi

head="$(git -C "$dist" rev-parse HEAD)"
msg="$(git -C "$dist" log -1 --format=%B)"
source_commit="$(sed -n 's/^Source-Commit: //p' <<<"$msg" | tail -1)"
built_base="$(sed -n 's/^Site-Base: //p' <<<"$msg" | tail -1)"
built_at="$(git -C "$dist" log -1 --format=%cd --date=format-local:'%Y-%m-%d %H:%M')"
if [ -n "$source_commit" ]; then ok "build of ${source_commit:0:7}, made $built_at"
else ok "$(git -C "$dist" log -1 --format=%s), made $built_at"; fi
if [ -n "${EXPECT_SOURCE:-}" ] && [ -n "$source_commit" ] && [ "$source_commit" != "$EXPECT_SOURCE" ]; then
  info "note: this is not the build of main (${EXPECT_SOURCE:0:7}); a newer push may have replaced it"
fi

stage "Publishing to $WEB_ROOT"
# Compare with what was last deployed (not with the previous fetch), so a deploy
# that failed half-way is retried on the next run.
marker="$state/site-deployed-$DEPLOY_BRANCH"
if [ "$head" = "$(cat "$marker" 2>/dev/null || true)" ] && [ "${1:-}" != "--force" ]; then
  ok "already live; nothing to do (--force republishes)"
  exit 0
fi
# CI tags each build with the base it was built for; refuse one meant for another server.
if [ -n "$built_base" ] && [ "${built_base%/}/" != "$SITE_BASE" ]; then
  fail "not deployed: $DEPLOY_BRANCH was built for base $built_base, deploy.env says $SITE_BASE"
  exit 1
fi
# deploy.sh's progress lines become a bar; its stderr is held back until the bar is
# cleared, so a warning or error doesn't land on the bar's line.
out="$(mktemp)" err="$(mktemp)"
set +e
SRC="$dist" SYNC_PROGRESS=1 "$here/scripts/deploy.sh" prod 2>"$err" | while IFS= read -r line; do
  case "$line" in
    "Progress: "*)
      read -r _ n total <<<"$line"
      if [ "$total" -gt 0 ]; then
        live "$((n * 10 / total))" "$(bar $((n * 100 / total))) · $n/$total changed paths synced"
      fi ;;
    "Changes: "*) echo "${line#Changes: }" >"$out" ;;
  esac
done
rc=$?
set -e
live_clear
cat "$err" >&2
summary="$(cat "$out")"
rm -f "$out" "$err"
[ "$rc" -eq 0 ] || exit "$rc"
echo "$head" > "$marker"
ok "deployed${summary:+: $summary}"

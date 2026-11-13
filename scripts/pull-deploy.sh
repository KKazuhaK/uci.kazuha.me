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
# Unattended (CI_MODE=1): wait for a run by hand to finish instead of failing.
if [ "${CI_MODE:-0}" = 1 ]; then lock_wait=(-w 600); else lock_wait=(-n); fi
if ! flock "${lock_wait[@]}" 9; then
  echo "  ✗ another publish is running (lock $state/site-pull-deploy.lock); try again when it is done" >&2
  exit 1
fi

# CI_MODE: a run by hand may have pulled a newer commit while this one waited for the
# lock; its scripts (deploy.sh below) were not CI-checked by this run, so leave it.
if [ "${CI_MODE:-0}" = 1 ] && [ "$(git -C "$here" rev-parse HEAD)" != "${EXPECT_SOURCE:-}" ]; then
  echo "  ✓ $here moved to $(git -C "$here" rev-parse --short HEAD) while waiting for the lock (a run by hand); leaving the publish to it"
  exit 0
fi

stage "Fetching the build ($DEPLOY_BRANCH)"
# Keep the source checkout current too (fast-forward only; never touches local edits).
# update_site.sh has just done this; it matters when this script is run on its own.
# Not in CI_MODE: update_site.sh checked CI for the commit it pulled, and a newer one
# pulled here would run its scripts unchecked.
if [ "${CI_MODE:-0}" != 1 ]; then
  git -C "$here" pull -q --ff-only 2>/dev/null || info "note: $here not fast-forwarded (local commits or conflicts)"
fi

repo="$(git -C "$here" remote get-url origin)"
if [ ! -d "$dist/.git" ]; then
  info "first run: cloning $DEPLOY_BRANCH into $dist"
  git_progress clone --depth 1 --branch "$DEPLOY_BRANCH" "$repo" "$dist"
else
  git_progress -C "$dist" fetch --depth 1 origin "$DEPLOY_BRANCH"
  if [ "$(git -C "$dist" rev-parse HEAD)" != "$(git -C "$dist" rev-parse FETCH_HEAD)" ]; then
    git -C "$dist" reset -q --hard FETCH_HEAD
    # Each build is a new single commit: drop the old ones now and then (a full gc
    # takes seconds, so not on every deploy).
    packs=("$dist"/.git/objects/pack/*.pack)
    if [ "${#packs[@]}" -gt 5 ]; then
      git -C "$dist" reflog expire --expire=now --all
      git -C "$dist" gc -q --prune=now
    fi
  fi
fi

head="$(git -C "$dist" rev-parse HEAD)"
msg="$(git -C "$dist" log -1 --format=%B)"
source_commit="$(sed -n 's/^Source-Commit: //p' <<<"$msg" | tail -1)"
built_base="$(sed -n 's/^Site-Base: //p' <<<"$msg" | tail -1)"
built_at="$(git -C "$dist" log -1 --format=%cd --date=format-local:'%Y-%m-%d %H:%M')"
if [ -n "$source_commit" ]; then ok "build of ${source_commit:0:7}, made $built_at"
else ok "$(git -C "$dist" log -1 --format=%s), made $built_at"; fi
if [ -n "${EXPECT_SOURCE:-}" ] && [ "$source_commit" != "$EXPECT_SOURCE" ]; then
  # Unattended, publish only main's own build: an older one (a re-run CI job pushed
  # it) would roll the site back, and a newer one is published by its own run.
  if [ "${CI_MODE:-0}" = 1 ]; then
    stage "Publishing to $WEB_ROOT"
    held="${source_commit:0:7}"
    ok "skipped: $DEPLOY_BRANCH holds the build of ${held:-an unknown commit}, not of main's ${EXPECT_SOURCE:0:7}; left as it is"
    exit 0
  fi
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

#!/usr/bin/env bash
# Bring the live site up to date with GitHub main (run by hand; there is no cron).
# Settings: deploy.env in this directory (copy deploy.env.example and set every value).
#   ./update_site.sh           wait for CI on the latest main commit, then publish its build
#   ./update_site.sh --force   republish the current build even if nothing changed
# Prints each stage as it runs: 1 source checkout, 2 CI, 3 fetch the build, 4 publish
# (3 and 4 are scripts/pull-deploy.sh).
set -euo pipefail
case "${1:-}" in ""|--force) ;; *) echo "usage: ./update_site.sh [--force]" >&2; exit 2 ;; esac
[ $# -le 1 ] || { echo "usage: ./update_site.sh [--force]" >&2; exit 2; }
cd "$(dirname "$(readlink -f "$0")")"
. scripts/deploy-env.sh
export STAGE_TOTAL=4
. scripts/progress.sh
repo="$GH_REPO"
t_start=$SECONDS

echo "update_site · $(date '+%Y-%m-%d %H:%M %Z') · $PWD"

stage "Updating the source checkout"
if git pull -q --ff-only; then
  head="$(git rev-parse origin/main)"
  ok "main is at $(git log -1 --format='%h %s' "$head")"
else
  head="$(git rev-parse origin/main)"
  skip "git pull failed (local commits or edits, or no network; see above); checking CI for origin/main as last fetched: $(git log -1 --format='%h %s' "$head")"
fi

stage "Waiting for CI"
if ! command -v gh >/dev/null 2>&1; then
  skip "gh is not installed, so CI was not checked"
else
  # A commit pushed a few seconds ago may not have a run yet: give GitHub a minute.
  # Only push runs on main publish a build (a PR or branch run of the same commit doesn't).
  run="" gh_err="" gh_log="$(mktemp)"
  for i in $(seq 7); do
    if ! run="$(gh run list --repo "$repo" --workflow site --commit "$head" --branch main --event push \
        --limit 1 --json databaseId --jq '.[0].databaseId // ""' 2>"$gh_log")"; then
      gh_err="$(head -1 "$gh_log")" run=""
      break
    fi
    [ -n "$run" ] && break
    [ "$i" = 1 ] && info "no CI run for ${head:0:7} yet (just pushed?); waiting up to a minute…"
    [ "$i" = 7 ] || sleep 10
  done
  rm -f "$gh_log"

  if [ -n "$gh_err" ]; then
    skip "could not ask GitHub about CI ($gh_err)"
  elif [ -z "$run" ]; then
    skip "still no CI run for ${head:0:7}; publishing the latest finished build"
  else
    id="$run"
    info "run https://github.com/$repo/actions/runs/$id"
    # Only the `build` job decides what reaches the servers; the `cloudflare` jobs
    # (uci.kazuha.me) can fail or still be running without affecting them.
    # → "status|conclusion|running step|failed step" (empty while the job is queued)
    build_job() {
      gh run view "$id" --repo "$repo" --json jobs --jq '
        .jobs[] | select(.name == "build")
        | [.status, (.conclusion // ""),
           ([.steps[]? | select(.status == "in_progress") | .name][0] // ""),
           ([.steps[]? | select(.conclusion == "failure") | .name][0] // "")]
        | join("|")' 2>/dev/null || echo "gh-error"
    }
    IFS='|' read -r status conclusion step failed <<<"$(build_job)"
    last="" last_t=$SECONDS
    for _ in $(seq 90); do  # give up after ~15 minutes
      [ "$status" = "completed" ] && break
      if [ "$status" = "gh-error" ]; then now="could not reach GitHub; retrying"
      elif [ "$step" ]; then now="running \"$step\""
      else now="${status:-queued}"; fi
      # A line whenever the step changes, and once a minute while it doesn't.
      if [ "$now" != "$last" ] || [ $((SECONDS - last_t)) -ge 60 ]; then
        info "build: $now · $(dur $((SECONDS - _stage_t0)))"
        last="$now" last_t=$SECONDS
      fi
      sleep 10
      IFS='|' read -r status conclusion step failed <<<"$(build_job)"
    done
    if [ "$status" != "completed" ]; then
      fail "CI did not finish within 15 minutes, so nothing was published. The live site keeps the last good build." \
        "Run ./update_site.sh again once it is done: https://github.com/$repo/actions/runs/$id"
      exit 1
    fi
    if [ "$conclusion" != "success" ]; then
      case "$conclusion" in failure|"") what="failed" ;; cancelled) what="was cancelled" ;; *) what="ended as $conclusion" ;; esac
      fail "CI $what${failed:+ at \"$failed\"}, so this commit was not published. The live site keeps the last good build." \
        "Details: gh run view $id --repo $repo --log-failed" \
        "         https://github.com/$repo/actions/runs/$id"
      exit 1
    fi
    ok "build passed"
  fi
fi

# Stages 3 and 4; pull-deploy.sh reports its own failures.
_stage_open=0
EXPECT_SOURCE="$head" STAGE_FIRST=3 scripts/pull-deploy.sh "$@"
echo "✓ Done in $(dur $((SECONDS - t_start))) · $PUBLIC_URL"

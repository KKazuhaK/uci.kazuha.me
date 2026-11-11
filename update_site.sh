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
if git_progress pull --ff-only; then
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
    # build_job → line 1 "status|conclusion|seconds so far", then one line per step,
    # "status|conclusion|seconds|name" (nothing while the job is queued).
    build_job() {
      gh run view "$1" --repo "$repo" --json jobs --jq '
        def secs(a; b): if (a // "" | startswith("0001")) or a == null then 0
          else [((if (b // "0001" | startswith("0001")) then now else (b | fromdateiso8601) end)
                 - (a | fromdateiso8601)) | floor, 0] | max end;
        .jobs[] | select(.name == "build")
        | "\(.status)|\(.conclusion // "")|\(secs(.startedAt; .completedAt))",
          (.steps[]? | "\(.status)|\(.conclusion // "")|\(secs(.startedAt; .completedAt))|\(.name)")' \
        2>/dev/null || echo "gh-error"
    }
    # How long each step took in the last successful build: the % and "of ~1m13s"
    # are measured against it. Without one, the % counts finished steps.
    base_id="$(gh run list --repo "$repo" --workflow site --branch main --event push --status success \
      --limit 2 --json databaseId --jq "[.[].databaseId | select(. != $id)][0] // \"\"" 2>/dev/null || true)"
    base_steps=""
    if [ -n "$base_id" ]; then
      base_steps="$(build_job "$base_id" | tail -n +2 | awk -F'|' '{ print $4 "\t" $3 }')"
    fi
    # ci_progress <step lines> → "percent|step index|steps|running step|its seconds|typical total"
    ci_progress() {
      BASE_STEPS="$base_steps" awk -F'|' '
        BEGIN { n = split(ENVIRON["BASE_STEPS"], L, "\n")
                for (i = 1; i <= n; i++) if (split(L[i], f, "\t") == 2) { typ[f[1]] = f[2]; tot += f[2]; bn++ } }
        $1 != "" { k++; st[k] = $1; el[k] = $3; nm[k] = $4 }
        END {
          total = k > bn ? k : bn
          for (i = 1; i <= k; i++) {
            t = (nm[i] in typ) ? typ[nm[i]] : 0
            if (st[i] == "completed") { done++; acc += tot > 0 ? t : 1 }
            else if (st[i] == "in_progress" && !cur) { cur = i; acc += tot > 0 ? (el[i] < t * 0.95 ? el[i] : t * 0.95) : 0 }
          }
          pct = total ? int(100 * acc / (tot > 0 ? tot : total)) : 0
          if (pct > 99) pct = 99
          idx = cur ? cur : done + 1
          if (idx > total) idx = total
          printf "%d|%d|%d|%s|%d|%d\n", pct, idx, total, cur ? nm[cur] : "", cur ? el[cur] : 0, tot
        }' <<<"$1"
    }
    shown=0  # steps already printed as finished
    # show_steps <step lines> <step count>: a ✓/✗ line for each newly finished step
    show_steps() {
      local i=0 s c e name mark
      while IFS='|' read -r s c e name; do
        [ -n "$s" ] || continue
        i=$((i + 1))
        [ "$i" -le "$shown" ] && continue
        [ "$s" = "completed" ] || break
        case "$c" in success) mark="✓" ;; skipped) mark="–" ;; *) mark="✗" ;; esac
        info "  $mark $i/$2 $name ($(dur "$e"))"
        shown=$i
      done <<<"$1"
    }

    snap="$(build_job "$id")"
    IFS='|' read -r status conclusion job_s <<<"${snap%%$'\n'*}"
    # Already finished before this run: no need to list its steps.
    [ "$status" = "completed" ] && shown=999
    deadline=$((SECONDS + 900))  # give up after 15 minutes
    while [ "$SECONDS" -lt "$deadline" ]; do
      steps="$(tail -n +2 <<<"$snap")"
      IFS='|' read -r pct idx total name cur_s typ_s <<<"$(ci_progress "$steps")"
      show_steps "$steps" "$total"
      [ "$status" = "completed" ] && break
      if [ "$status" = "gh-error" ]; then
        live "gh-error" "could not reach GitHub; retrying · $(dur $((SECONDS - _stage_t0)))"
      elif [ "$status" != "in_progress" ]; then
        live "queued" "build ${status:-queued}, waiting for a runner · $(dur $((SECONDS - _stage_t0)))"
      elif [ "$total" = 0 ]; then
        live "starting" "build starting · $(dur "${job_s:-0}")"
      else
        live "$idx" "$(bar "$pct") · step $idx/$total ${name:-starting} ($(dur "${cur_s:-0}")) · $(dur "${job_s:-0}")$( [ "${typ_s:-0}" -gt 0 ] && echo " of ~$(dur "$typ_s")")"
      fi
      sleep 5
      snap="$(build_job "$id")"
      IFS='|' read -r status conclusion job_s <<<"${snap%%$'\n'*}"
    done
    live_clear
    failed="$(tail -n +2 <<<"$snap" | awk -F'|' '$2 == "failure" { print $4; exit }')"
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
    ok "build passed$( [ "$shown" = 999 ] && echo "; CI took $(dur "${job_s:-0}")")"
  fi
fi

# Stages 3 and 4; pull-deploy.sh reports its own failures.
_stage_open=0
EXPECT_SOURCE="$head" STAGE_FIRST=3 scripts/pull-deploy.sh "$@"
echo "✓ Done in $(dur $((SECONDS - t_start))) · $PUBLIC_URL"

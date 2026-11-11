# shellcheck shell=bash
# Stage-by-stage status lines, sourced by update_site.sh and scripts/pull-deploy.sh:
#   → [2/4] Waiting for CI
#     ✓ 5/11 Type and content check (15s)
#     [██████████░░░░░░░░░░]  52% · step 7/11 Build each server target · 38s of ~1m13s
#     ✓ build passed (1m14s)
# The [███░░] line is a live line: in a terminal it is redrawn in place; in a log
# (stdout not a terminal) it is printed only when its key changes, or every 30s.
# update_site.sh runs pull-deploy.sh as its stages 3-4: it exports STAGE_FIRST=3 and
# STAGE_TOTAL=4, so the numbering carries on. Run alone, pull-deploy.sh counts 1-2 of 2.
# If a script exits with an error mid-stage, the EXIT trap names the stage that failed.

STAGE_FIRST="${STAGE_FIRST:-1}"
STAGE_TOTAL="${STAGE_TOTAL:-1}"
_stage_n=0
_stage_name=""
_stage_t0=$SECONDS
_stage_open=0
_tty=0
[ -t 1 ] && _tty=1
_live_key=""
_live_t=0

dur() {  # seconds → "45s" / "3m05s"
  local s=$1
  if [ "$s" -ge 60 ]; then printf '%dm%02ds' $((s / 60)) $((s % 60)); else printf '%ds' "$s"; fi
}

# bar <percent> → "[██████░░░░░░░░░░░░░░]  31%"
bar() {
  local pct=$1 w=20 i out="["
  [ "$pct" -lt 0 ] && pct=0
  [ "$pct" -gt 100 ] && pct=100
  for ((i = 0; i < w; i++)); do
    if [ $((i * 100)) -lt $((pct * w)) ]; then out+="█"; else out+="░"; fi
  done
  printf '%s] %3d%%' "$out" "$pct"
}

# live <key> <message>: the stage's current progress (see the top of this file)
live() {
  if [ "$_tty" = 1 ]; then
    local cols msg=$2
    # stty reads the terminal itself (tput cols in $(…) reports 80 whatever the width)
    cols="$(stty size </dev/tty 2>/dev/null | awk '{ print $2 }')"
    [ "${cols:-0}" -gt 20 ] 2>/dev/null || cols=80
    [ "${#msg}" -gt $((cols - 3)) ] && msg="${msg:0:$((cols - 4))}…"
    printf '\r\033[K  %s' "$msg"
  elif [ "$1" != "$_live_key" ] || [ $((SECONDS - _live_t)) -ge 30 ]; then
    echo "  $2"
    _live_key=$1 _live_t=$SECONDS
  fi
}
# live_clear: erase the live line before printing a permanent one
live_clear() { if [ "$_tty" = 1 ]; then printf '\r\033[K'; fi; _live_key=""; }

# stage <name>: start the next stage
stage() {
  live_clear
  _stage_n=$(( _stage_n == 0 ? STAGE_FIRST : _stage_n + 1 ))
  _stage_name=$1
  _stage_t0=$SECONDS
  _stage_open=1
  echo "→ [$_stage_n/$STAGE_TOTAL] $1"
}
info() { live_clear; echo "  $*"; }
# ok <message>: the stage finished
ok() { live_clear; _stage_open=0; echo "  ✓ $* ($(dur $((SECONDS - _stage_t0))))"; }
# skip <message>: the stage was skipped (a check that could not run); carry on
skip() { live_clear; _stage_open=0; echo "  ⚠ skipped: $*"; }
# fail <message>…: the stage failed; every further argument is printed as a detail line
fail() {
  live_clear
  _stage_open=0
  echo "  ✗ $1" >&2
  shift
  local line
  for line in "$@"; do echo "    $line" >&2; done
}

# git_progress <git args…>: run git with its transfer progress as a live line
# ("Receiving objects  45%"). Its other output is shown only if it fails.
git_progress() {
  local log rc
  log="$(mktemp)"
  set +e
  # git redraws its progress with \r: split on it here (tr would buffer it in the pipe).
  git "$@" --progress 2>&1 >>"$log" | {
    local chunk line what pct
    while IFS= read -r -d $'\r' chunk || [ -n "$chunk" ]; do
     while IFS= read -r line; do
      [ -n "$line" ] || continue
      if [[ $line =~ ^(remote:\ +)?([A-Za-z][A-Za-z\ ]*):\ +([0-9]+)%(.*)$ ]]; then
        what="${BASH_REMATCH[2]}" pct="${BASH_REMATCH[3]}"
        # In a log, only each phase's last line ("…100% (n/n), 2.1 MiB | 3 MiB/s, done.")
        [ "$_tty" = 1 ] || [[ $line == *done.* ]] || continue
        live "$what" "$(bar "$pct") · $what${BASH_REMATCH[4]}"
      else
        printf '%s\n' "$line" >>"$log"
      fi
     done <<<"$chunk"
     chunk=""
    done
  }
  rc=${PIPESTATUS[0]}
  set -e
  live_clear
  if [ "$rc" -ne 0 ]; then sed 's/^/    /' "$log" >&2; fi
  rm -f "$log"
  return "$rc"
}

_stage_exit() {
  local rc=$?
  if [ "$rc" -ne 0 ] && [ "$_stage_open" = 1 ]; then
    live_clear
    echo "  ✗ [$_stage_n/$STAGE_TOTAL] $_stage_name failed (exit $rc); the output above says why" >&2
  fi
}
trap _stage_exit EXIT

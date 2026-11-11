# shellcheck shell=bash
# Stage-by-stage status lines, sourced by update_site.sh and scripts/pull-deploy.sh:
#   → [2/4] Waiting for CI
#     build: running "Build each server target" · 1m20s
#     ✓ build passed (3m05s)
# update_site.sh runs pull-deploy.sh as its stages 3-4: it exports STAGE_FIRST=3 and
# STAGE_TOTAL=4, so the numbering carries on. Run alone, pull-deploy.sh counts 1-2 of 2.
# If a script exits with an error mid-stage, the EXIT trap names the stage that failed.

STAGE_FIRST="${STAGE_FIRST:-1}"
STAGE_TOTAL="${STAGE_TOTAL:-1}"
_stage_n=0
_stage_name=""
_stage_t0=$SECONDS
_stage_open=0

dur() {  # seconds → "45s" / "3m05s"
  local s=$1
  if [ "$s" -ge 60 ]; then printf '%dm%02ds' $((s / 60)) $((s % 60)); else printf '%ds' "$s"; fi
}

# stage <name>: start the next stage
stage() {
  _stage_n=$(( _stage_n == 0 ? STAGE_FIRST : _stage_n + 1 ))
  _stage_name=$1
  _stage_t0=$SECONDS
  _stage_open=1
  echo "→ [$_stage_n/$STAGE_TOTAL] $1"
}
info() { echo "  $*"; }
# ok <message>: the stage finished
ok() { _stage_open=0; echo "  ✓ $* ($(dur $((SECONDS - _stage_t0))))"; }
# skip <message>: the stage was skipped (a check that could not run); carry on
skip() { _stage_open=0; echo "  ⚠ skipped: $*"; }
# fail <message>…: the stage failed; every further argument is printed as a detail line
fail() {
  _stage_open=0
  echo "  ✗ $1" >&2
  shift
  local line
  for line in "$@"; do echo "    $line" >&2; done
}

_stage_exit() {
  local rc=$?
  if [ "$rc" -ne 0 ] && [ "$_stage_open" = 1 ]; then
    echo "  ✗ [$_stage_n/$STAGE_TOTAL] $_stage_name failed (exit $rc); the output above says why" >&2
  fi
}
trap _stage_exit EXIT

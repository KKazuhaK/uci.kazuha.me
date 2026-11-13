// Last-edited dates for notes, from git history (follows renames).
// Commits listed in .lastmod-ignore-revs (bulk moves/reformatting) don't count as edits.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

const ignored = new Set(
  existsSync(".lastmod-ignore-revs")
    ? readFileSync(".lastmod-ignore-revs", "utf8").split("\n").map((l) => l.replace(/#.*/, "").trim()).filter(Boolean)
    : [],
);

function git(args: string[]): string {
  try {
    // maxBuffer: the whole-history log for the index (about 70 KB today) must not hit the 1 MiB default.
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return "";
  }
}

const cache = new Map<string, Date>();

export function lastModified(path: string): Date {
  let date = cache.get(path);
  if (!date) cache.set(path, (date = fromIndex(path) ?? lookup(path)));
  return date;
}

// One `git log` over the whole history instead of a `git status` + `git log --follow`
// per note (two processes each, which was most of the build's time on CI). It walks
// commits newest first and follows renames back by hand, the way --follow does: each
// current note starts as its own name, and a rename moves the search to the old name.
// A note with uncommitted changes uses its mtime; one the index can't place falls back
// to the per-file lookup below.
let index: { dirty: Set<string>; dates: Map<string, Date> } | undefined;

function fromIndex(path: string): Date | undefined {
  index ??= buildIndex();
  if (index.dirty.has(path)) return statSync(path).mtime;
  return index.dates.get(path);
}

function buildIndex(): { dirty: Set<string>; dates: Map<string, Date> } {
  const dirty = new Set<string>();
  for (const line of git(["status", "--porcelain", "--untracked-files=all"]).split("\n")) {
    if (line.length > 3) for (const p of line.slice(3).split(" -> ")) dirty.add(p);
  }
  const dates = new Map<string, Date>();
  // name in the commit being looked at → the current path it became
  const alias = new Map<string, string>();
  for (const p of git(["ls-files"]).split("\n")) if (p) alias.set(p, p);
  let isIgnored = false;
  let date: Date | undefined;
  let renames: [string, string][] = [];
  const endCommit = (): void => {
    for (const [from, to] of renames) alias.set(from, to);
    renames = [];
  };
  const touch = (name: string): string | undefined => {
    const current = alias.get(name);
    if (current && !isIgnored && date && !dates.has(current)) dates.set(current, date);
    return current;
  };
  for (const line of git(["log", "-M", "--name-status", "--format=%x01%H %cI"]).split("\n")) {
    if (line.startsWith("\x01")) {
      endCommit();
      const [hash = "", iso = ""] = line.slice(1).split(" ");
      isIgnored = [...ignored].some((rev) => hash.startsWith(rev));
      date = iso ? new Date(iso) : undefined;
      continue;
    }
    const [status = "", a, b] = line.split("\t");
    if (!a) continue;
    if (status.startsWith("R") && b) {
      const current = touch(b);
      if (current) renames.push([a, current]);
    } else {
      touch(a);
    }
  }
  endCommit();
  return { dirty, dates };
}

function lookup(path: string): Date {
  if (git(["status", "--porcelain", "--", path]).trim()) return statSync(path).mtime;
  for (const line of git(["log", "--follow", "--format=%H %cI", "--", path]).split("\n")) {
    const [hash, date] = line.split(" ");
    if (hash && date && ![...ignored].some((rev) => hash.startsWith(rev))) return new Date(date);
  }
  return statSync(path).mtime;
}

// Both languages read the date in Irvine time, whatever machine runs the build.
const TZ = "America/Los_Angeles";

export function formatLastModified(date: Date, lang: "en-US" | "zh-CN"): string {
  if (lang === "zh-CN") {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date).map((x) => [x.type, x.value]));
    return `最后编辑于 ${p["year"]} 年 ${p["month"]} 月 ${p["day"]} 日`;
  }
  return "Last edited on " + date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: TZ });
}

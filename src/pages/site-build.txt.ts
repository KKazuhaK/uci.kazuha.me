// The commit this build was made from, one line. The hourly catch-up workflow
// (.github/workflows/uci-ics-catchup.yml) compares the live copy with the deploy
// branch's Source-Commit to see whether ics.uci.edu missed a deploy.
import type { APIRoute } from "astro";
import { execFileSync } from "node:child_process";

function buildCommit(): string {
  const fromCi = process.env["GITHUB_SHA"];
  if (fromCi && /^[0-9a-f]{40}$/.test(fromCi)) return fromCi;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unknown";
  }
}

export const GET: APIRoute = () =>
  new Response(buildCommit() + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });

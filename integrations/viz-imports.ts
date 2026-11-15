// The page imports a viz component as `<name>.js?v=<build>`, but the
// component's own imports (`./_core.js`, `./_tree.js`, …) carry no version, and
// the servers send no Cache-Control: a browser could pair a new component with a
// cached old `_core.js` and fail on a missing export. After the build, this adds
// `?v=<hash of all viz files>` to those relative imports in dist, so shared
// modules change URL whenever any viz file changes. The source files in
// public/ stay plain (the dev server and the build-time validation import them).
import type { AstroIntegration } from "astro";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const IMPORT = /(\bfrom\s*|\bimport\s*\(\s*)(["'])(\.\/[A-Za-z0-9_-]+\.js)\2/g;

export default function vizImports(): AstroIntegration {
  return {
    name: "viz-imports",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const vizDir = fileURLToPath(new URL("assets/viz/", dir));
        const files = (await readdir(vizDir)).filter((f) => f.endsWith(".js")).sort();
        const sources = new Map<string, string>();
        const hash = createHash("sha256");
        for (const f of files) {
          const text = await readFile(vizDir + f, "utf8");
          sources.set(f, text);
          hash.update(f + "\0" + text + "\0");
        }
        const version = hash.digest("hex").slice(0, 10);
        let rewritten = 0;
        for (const [f, text] of sources) {
          const out = text.replace(IMPORT, (_m, head: string, q: string, path: string) => head + q + path + "?v=" + version + q);
          if (out !== text) {
            await writeFile(vizDir + f, out);
            rewritten++;
          }
        }
        logger.info(`assets/viz: ${rewritten} modules import shared files with ?v=${version}`);
      },
    },
  };
}

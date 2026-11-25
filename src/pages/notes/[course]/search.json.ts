// Full-text search index of one course's notes, for the search box on the course hub.
// One entry per note version: its sections (## / ### / #### headings, with the same ids the reader
// page uses) and their plain text. Fetched by the hub only when the reader starts a search.
import type { APIRoute, GetStaticPaths } from "astro";
import { LANGS, type Lang } from "../../../lib/i18n";
import { slugifyHeading } from "../../../lib/markdown/slug";
import { courseSlug, getCourses, getNoteGroups, unitLabel } from "../../../lib/notes";
import { noteUrl } from "../../../lib/urls";

export const getStaticPaths = (async () =>
  (await getCourses()).map((course) => ({ params: { course: courseSlug(course.data.code) }, props: { code: course.data.code } }))) satisfies GetStaticPaths;

interface Section {
  id: string; // heading id, "" = the part before the first ## heading
  h: string; // heading text
  t: string; // plain text
}

/** Markdown → plain text, good enough for searching and snippets. */
function plain(md: string): string {
  return md
    .replace(/<\/?[a-zA-Z][^>]*>/g, " ") // HTML tags (<details>, <summary>, …)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\*\*|__|(?<![\w*])\*(?!\s)|(?<!\s)\*(?![\w*])/g, "")
    .replace(/^\s*>\s?/gm, "") // blockquote markers
    .replace(/^\s*[-*+]\s+/gm, "") // list bullets
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, "") // table separator rows
    .replace(/\|/g, " ")
    .replace(/\$+/g, " ") // math delimiters (the formula text itself stays searchable)
    .replace(/\s+/g, " ")
    .trim();
}

function sections(body: string): Section[] {
  const out: Section[] = [];
  const counts = new Map<string, number>();
  let cur: Section = { id: "", h: "", t: "" };
  let buf: string[] = [];
  let fence: string | null = null;
  let inToc = false; // the body of a "Table of Contents" / "目录" section is only links to headings
  const flush = () => {
    cur.t = inToc ? "" : plain(buf.join("\n"));
    if (!inToc && (cur.t || cur.h)) out.push(cur);
    buf = [];
  };
  for (const line of body.split("\n")) {
    const f = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (f) {
      if (fence === null) fence = f[1]!;
      else if (f[1]![0] === fence[0] && f[1]!.length >= fence.length && !f[2]!.trim()) fence = null;
      continue; // code, viz and mermaid blocks are not indexed
    }
    if (fence !== null) continue;
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (h) {
      const id = slugifyHeading(h[2]!, counts); // every heading counts, as in the renderer
      const depth = h[1]!.length;
      if (depth >= 2 && depth <= 4) {
        flush();
        inToc = /^(table of contents|目录)$/i.test(h[2]!.trim());
        cur = { id, h: plain(h[2]!), t: "" };
      }
      continue;
    }
    buf.push(line);
  }
  flush();
  return out;
}

export const GET: APIRoute = async ({ props }) => {
  const code = (props as { code: string }).code;
  const groups = (await getNoteGroups()).get(code) ?? [];
  const notes: { lang: Lang; kind: string; label: string; title: string; url: string; s: Section[] }[] = [];
  for (const g of groups) {
    for (const lang of LANGS) {
      const note = g.versions[lang];
      if (!note) continue;
      notes.push({ lang, kind: g.kind, label: unitLabel(g, lang), title: note.data.title, url: noteUrl(g.courseSlug, g.slug, lang), s: sections(note.body ?? "") });
    }
  }
  return new Response(JSON.stringify({ v: 1, notes }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};

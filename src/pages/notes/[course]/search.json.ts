// Search index of one course's notes, for the search box on the course hub: per note version its
// title, summary and headings (## / ### / ####, with the same ids the reader page uses). Note text
// is not indexed — the box finds notes and sections by their titles and keywords.
import type { APIRoute, GetStaticPaths } from "astro";
import { LANGS, type Lang } from "../../../lib/i18n";
import { slugifyHeading } from "../../../lib/markdown/slug";
import { courseSlug, getCourses, getNoteGroups, unitLabel } from "../../../lib/notes";
import { noteUrl } from "../../../lib/urls";

export const getStaticPaths = (async () =>
  (await getCourses()).map((course) => ({ params: { course: courseSlug(course.data.code) }, props: { code: course.data.code } }))) satisfies GetStaticPaths;

interface Section {
  id: string; // heading id
  h: string; // heading text
}

/** Markdown → plain text, for headings and summaries. */
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
  let fence: string | null = null;
  for (const line of body.split("\n")) {
    const f = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (f) {
      if (fence === null) fence = f[1]!;
      else if (f[1]![0] === fence[0] && f[1]!.length >= fence.length && !f[2]!.trim()) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const h = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (!h) continue;
    const id = slugifyHeading(h[2]!, counts); // every heading counts, as in the renderer
    const depth = h[1]!.length;
    if (depth >= 2 && depth <= 4 && !/^(table of contents|目录)$/i.test(h[2]!.trim())) out.push({ id, h: plain(h[2]!) });
  }
  return out;
}

export const GET: APIRoute = async ({ props }) => {
  const code = (props as { code: string }).code;
  const groups = (await getNoteGroups()).get(code) ?? [];
  const notes: { lang: Lang; g: string; kind: string; label: string; title: string; sum: string; url: string; s: Section[] }[] = [];
  for (const g of groups) {
    for (const lang of LANGS) {
      const note = g.versions[lang];
      if (!note) continue;
      notes.push({ lang, g: g.slug, kind: g.kind, label: unitLabel(g, lang), title: note.data.title, sum: plain(note.data.summary), url: noteUrl(g.courseSlug, g.slug, lang), s: sections(note.body ?? "") });
    }
  }
  return new Response(JSON.stringify({ v: 2, notes }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
};

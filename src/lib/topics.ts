// "By topic" view of a course hub: course JSON `topics` (names, order) + note frontmatter `topics`.
// Every mistake (unknown id, missing section, languages disagreeing) fails the build.
import { LANGS, type Lang } from "./i18n";
import { renderMarkdown } from "./markdown/render";
import type { CourseEntry, NoteEntry, NoteGroup } from "./notes";

export interface TopicSection {
  key: string; // "5" (## 5.) or "13.1" (### 13.1)
  depth: 2 | 3;
  id: string; // heading id in that language's note
  text: string; // heading text, "5. Binary Search Trees"
}

export interface TopicEntry {
  group: NoteGroup;
  /** Per language version; empty array = the whole note. */
  sections: Partial<Record<Lang, TopicSection[]>>;
}

export interface Topic {
  id: string;
  label: Record<Lang, string>;
  summary?: Record<Lang, string>;
  entries: TopicEntry[];
}

const OTHER: Pick<Topic, "id" | "label"> = { id: "other", label: { "en-US": "Other", "zh-CN": "其他" } };

type RawTopic = NonNullable<NoteEntry["data"]["topics"]>[number];

const KEY = /^(\d+)(?:\.(\d+))?$/;

/** "5-11" / "1-4, 13.1-13.2" / "7" → section keys ("5", "13.1") in reading order, no duplicates. */
export function parseSections(spec: string): string[] {
  const out = new Map<string, [number, number]>();
  for (const part of spec.split(",").map((p) => p.trim())) {
    const ends = part.split("-").map((x) => x.trim());
    const parsed = ends.map((e) => KEY.exec(e));
    if (!part || ends.length > 2 || parsed.some((m) => !m)) throw new Error(`bad section "${part}" in "${spec}" (use 5, 5-11, 13.1 or 13.1-13.3)`);
    const [a, b = a] = parsed as RegExpExecArray[];
    const sub = a![2] !== undefined;
    if (sub !== (b![2] !== undefined) || (sub && a![1] !== b![1])) throw new Error(`bad section range "${part}": both ends must be N or N.M with the same N`);
    const lo = Number(sub ? a![2] : a![1]);
    const hi = Number(sub ? b![2] : b![1]);
    if (hi < lo) throw new Error(`bad section range "${part}"`);
    for (let n = lo; n <= hi; n++) {
      const key = sub ? `${a![1]}.${n}` : String(n);
      out.set(key, sub ? [Number(a![1]), n] : [n, 0]);
    }
  }
  return [...out.entries()].sort(([, x], [, y]) => x[0] - y[0] || x[1] - y[1]).map(([k]) => k);
}

function normalize(raw: RawTopic[]): { id: string; sections: string[] }[] {
  return raw.map((t) => (typeof t === "string" ? { id: t, sections: [] } : { id: t.id, sections: parseSections(t.sections) }));
}

/** Numbered headings of a note by key: `## N. …` → "N", `### N.M …` → "N.M". */
async function numberedSections(note: NoteEntry, lang: Lang): Promise<Map<string, TopicSection>> {
  const { headings } = await renderMarkdown(note.body ?? "", { lang, highlight: false, math: false, codeUi: false });
  const map = new Map<string, TopicSection>();
  for (const h of headings) {
    const m = h.depth === 2 ? /^(\d+)\.\s/.exec(h.text) : h.depth === 3 ? /^(\d+\.\d+)\s/.exec(h.text) : null;
    if (m && !map.has(m[1]!)) map.set(m[1]!, { key: m[1]!, depth: h.depth as 2 | 3, id: h.id, text: h.text });
  }
  return map;
}

/** Topics in course order (plus "Other" for untagged notes), or null when the course has none. */
export async function getCourseTopics(course: CourseEntry, groups: NoteGroup[]): Promise<Topic[] | null> {
  const defs = course.data.topics;
  const code = course.data.code;
  if (!defs?.length) {
    for (const g of groups) {
      if (Object.values(g.versions).some((n) => n.data.topics?.length)) {
        throw new Error(`${code}/${g.slug} has frontmatter topics, but src/content/courses/${code}.json defines none`);
      }
    }
    return null;
  }
  const ids = new Set<string>();
  for (const d of defs) {
    if (ids.has(d.id) || d.id === OTHER.id) throw new Error(`${code}.json: duplicate or reserved topic id "${d.id}"`);
    ids.add(d.id);
  }

  const topics: Topic[] = defs.map((d) => ({ id: d.id, label: d.label, ...(d.summary ? { summary: d.summary } : {}), entries: [] }));
  const other: Topic = { ...OTHER, entries: [] };

  for (const group of groups) {
    if (group.kind === "review") continue; // review notes have their own hub view
    const present = LANGS.filter((l) => group.versions[l]);
    const perLang = present.map((l) => normalize(group.versions[l]!.data.topics ?? []));
    const tags = perLang[0]!;
    const key = JSON.stringify(tags);
    if (perLang.some((t) => JSON.stringify(t) !== key)) {
      throw new Error(`${code}/${group.slug}: frontmatter topics differ between ${present.join(" and ")}`);
    }
    if (group.kind === "topic") {
      const want = group.slug.slice("topic-".length);
      if (tags.length !== 1 || tags[0]!.id !== want || tags[0]!.sections.length) {
        throw new Error(`${code}/${group.slug}: a topic note needs exactly "topics: [${want}]" (a bare id, no sections)`);
      }
    }
    if (!tags.length) {
      other.entries.push({ group, sections: {} });
      continue;
    }
    const headingMaps = new Map<Lang, Map<string, TopicSection>>();
    for (const l of present) headingMaps.set(l, await numberedSections(group.versions[l]!, l));
    const seen = new Set<string>();
    for (const tag of tags) {
      if (!ids.has(tag.id)) throw new Error(`${code}/${group.slug}: unknown topic "${tag.id}" (topics in ${code}.json: ${[...ids].join(", ")})`);
      if (seen.has(tag.id)) throw new Error(`${code}/${group.slug}: topic "${tag.id}" listed twice`);
      seen.add(tag.id);
      const sections: TopicEntry["sections"] = {};
      for (const l of present) {
        sections[l] = tag.sections.map((n) => {
          const s = headingMaps.get(l)!.get(n);
          if (!s) throw new Error(`${code}/${group.slug}.${l}: topic "${tag.id}" names section ${n}, but there is no ${n.includes(".") ? `"### ${n}"` : `"## ${n}."`} heading`);
          return s;
        });
      }
      topics.find((t) => t.id === tag.id)!.entries.push({ group, sections });
    }
  }
  // The topic note (all of the topic in one place) leads; the lecture sections it was built from follow.
  for (const t of topics) t.entries.sort((a, b) => Number(b.group.kind === "topic") - Number(a.group.kind === "topic"));
  return [...topics, ...(other.entries.length ? [other] : [])];
}

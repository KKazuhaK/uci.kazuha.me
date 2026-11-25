import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { LANGS } from "./lib/i18n";

const localizedText = z.object({ "en-US": z.string().min(1), "zh-CN": z.string().min(1) });

const localizedCourseCopy = z.object({
  heroPrimary: z.string(),
  heroSecondary: z.string(),
  readerHeading: z.string(),
  // {course} and {weekPhrase} are filled in per note.
  readerDescription: z.string(),
});

const courses = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/courses" }),
  schema: z.object({
    code: z.string().regex(/^[A-Z0-9]+-[A-Z0-9]+$/),
    name: z.string(),
    fullTitle: z.string(),
    short: z.string(),
    tagline: z.string(),
    dept: z.string(),
    tone: z.enum(["blue", "navy", "gold"]),
    // Taken this term: sorted first on the homepage and Notes home.
    current: z.boolean(),
    order: z.number().int(),
    copy: z.object(Object.fromEntries(LANGS.map((l) => [l, localizedCourseCopy])) as Record<(typeof LANGS)[number], typeof localizedCourseCopy>),
    // Optional "By topic" view on the course hub, in this order. Notes opt in with frontmatter `topics`.
    topics: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z0-9-]+$/),
          label: localizedText,
          summary: localizedText.optional(),
        }),
      )
      .optional(),
  }),
});

// src/content/notes/<COURSE>/<slug>.<lang>.md, slug = lec-NN | week-NN | <special>
const NOTE_FILE = /^([A-Z0-9]+-[A-Z0-9]+)\/([a-z0-9-]+)\.(en-US|zh-CN)\.md$/;

const notes = defineCollection({
  loader: glob({
    pattern: "*/*.md",
    base: "./src/content/notes",
    generateId: ({ entry }) => {
      if (!NOTE_FILE.test(entry)) {
        throw new Error(`Note file "${entry}" must be named <COURSE>/<slug>.<en-US|zh-CN>.md`);
      }
      return entry.replace(/\.md$/, "");
    },
  }),
  schema: z.object({
    title: z.string().min(1),
    summary: z.string().min(1),
    // Only for specials (e.g. final-review) whose label can't be derived from the slug.
    label: z.object({ "en-US": z.string(), "zh-CN": z.string() }).optional(),
    // Override the slug-derived sort position.
    order: z.number().optional(),
    draft: z.boolean().default(false),
    // What the note is: a lecture/week note (default), a topic note that gathers one topic from every
    // lecture (slug topic-<id>, frontmatter topics: [<id>]), or review material (own hub view).
    kind: z.enum(["topic", "review"]).optional(),
    // Topics of the course hub's "By topic" view (ids from the course JSON). A bare id covers the
    // whole note; `sections` limits it to numbered sections, ## N. or ### N.M, as a quoted string
    // ("5-11, 13.3-13.6"). Checked in src/lib/topics.ts; both languages must list the same topics.
    topics: z
      .array(
        z.union([
          z.string(),
          z.object({ id: z.string(), sections: z.string().min(1) }).strict(),
        ]),
      )
      .optional(),
  }),
});

export const collections = { courses, notes };

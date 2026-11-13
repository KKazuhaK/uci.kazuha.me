// Reading bar + keyboard shortcuts + keeping your place when switching language.
//   [ / ]  previous / next note      L  switch language
// The bar sits in the intro card (placed by the inline script after the intro in
// NoteReader.astro) and is sticky: once it reaches the top of the screen it stays
// there as a floating pill (.is-floating) with the course, language and a middle
// button that scrolls back to the top. After a jump with its ‹ › (or [ ]), the next
// note opens scrolled so the bar is at the same spot on screen, under the pointer.
import { detailsCount, openDetailsAt, openDetailsIndexes } from "./details";
import { HEADING_SELECTOR } from "./toc";

const RESUME_KEY = "kzh-lang-switch-resume";
/** A reading-bar jump: the note it goes to and where the bar was on screen ({to, top}); read by the inline script in NoteReader.astro. */
const JUMP_KEY = "kzh-rb-jump";

interface Resume {
  /** Path of the page we're switching to, so a stale entry never applies elsewhere. */
  to: string;
  heading: number;
  headingCount: number;
  /** How far past that heading we were, as a fraction of its section. */
  within: number;
  /** Fallback: overall scroll fraction. */
  ratio: number;
  /** <details> blocks (answers) the reader had opened; translations have the same ones in the same order. */
  openDetails?: number[];
  detailsCount?: number;
}

function headingsOf(content: HTMLElement): HTMLElement[] {
  return Array.from(content.querySelectorAll<HTMLElement>(HEADING_SELECTOR));
}

function docTop(el: HTMLElement): number {
  return el.getBoundingClientRect().top + window.scrollY;
}

function scrollable(): number {
  return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

function captureResume(content: HTMLElement, to: string): Resume {
  const hs = headingsOf(content);
  const y = window.scrollY + 130;
  let idx = -1;
  for (let i = 0; i < hs.length; i++) {
    if (docTop(hs[i]!) <= y) idx = i;
    else break;
  }
  let within = 0;
  if (idx >= 0) {
    const start = docTop(hs[idx]!);
    const end = hs[idx + 1] ? docTop(hs[idx + 1]!) : docTop(content) + content.offsetHeight;
    within = Math.min(1, Math.max(0, (y - start) / Math.max(1, end - start)));
  }
  return { to, heading: idx, headingCount: hs.length, within, ratio: window.scrollY / scrollable(), openDetails: openDetailsIndexes(content),
    detailsCount: detailsCount(content) };
}

/** Restore the reading position saved by the page we came from (other language). */
export function restoreAfterLangSwitch(content: HTMLElement): void {
  let resume: Resume | null = null;
  try {
    resume = JSON.parse(sessionStorage.getItem(RESUME_KEY) || "null");
    sessionStorage.removeItem(RESUME_KEY);
  } catch {}
  if (!resume || resume.to !== location.pathname || location.hash) return;
  const r = resume;
  // Only when both pages have the same answers, so the wrong one is never revealed.
  if (Array.isArray(r.openDetails) && r.detailsCount === detailsCount(content)) openDetailsAt(content, r.openDetails);
  const apply = () => {
    const hs = headingsOf(content);
    // Translations share heading structure; if the count differs, fall back to scroll fraction.
    if (r.heading >= 0 && hs.length === r.headingCount && hs[r.heading]) {
      const start = docTop(hs[r.heading]!);
      const end = hs[r.heading + 1] ? docTop(hs[r.heading + 1]!) : docTop(content) + content.offsetHeight;
      window.scrollTo({ top: start + (end - start) * r.within - 130, behavior: "instant" });
    } else {
      window.scrollTo({ top: r.ratio * scrollable(), behavior: "instant" });
    }
  };
  apply();
  // Mermaid / viz blocks change height after they render; settle once more.
  setTimeout(apply, 600);
}

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

export function setupReadingBar(opts: {
  content: HTMLElement;
  intro: HTMLElement;
  bar: HTMLElement;
  progress: HTMLElement | null;
  prevUrl: string | undefined;
  nextUrl: string | undefined;
  altUrl: string | undefined;
}): void {
  const { content, bar, progress, prevUrl, nextUrl, altUrl } = opts;

  // Language switch links remember where we are.
  document.querySelectorAll<HTMLAnchorElement>("a[data-lang-switch]").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      try {
        sessionStorage.setItem(RESUME_KEY, JSON.stringify(captureResume(content, new URL(a.href).pathname)));
      } catch {}
    });
  });

  // Remember a jump made with the bar, so the next note opens with it in place.
  const markJump = (href: string): void => {
    const top = Math.round(bar.getBoundingClientRect().top);
    try { sessionStorage.setItem(JUMP_KEY, JSON.stringify({ to: new URL(href, location.href).pathname, top, at: Date.now() })); } catch {}
  };
  bar.querySelectorAll<HTMLAnchorElement>("a.rb-prev, a.rb-next").forEach((a) => {
    a.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      markJump(a.href);
    });
  });

  // Floating once sticky has pinned it to the top of the screen (CSS top: 12px).
  const shell = bar.parentElement;
  const instant = (fn: () => void): void => {
    const f = (window as { __kzhRbInstant?: (fn: () => void) => void }).__kzhRbInstant;
    if (typeof f === "function") f(fn); else fn();
  };
  // Until the page has settled (load + a moment), state changes come from restoring a
  // position (reload, language switch), not from the reader scrolling: no animation.
  let settled = false;
  window.addEventListener("load", () => setTimeout(() => { settled = true; }, 200));
  const updateFloating = (): void => {
    const r = bar.getBoundingClientRect();
    const floating = window.scrollY > 0 && r.top <= 12.5;
    if (floating !== bar.classList.contains("is-floating")) {
      const apply = (): void => { bar.classList.toggle("is-floating", floating); };
      if (settled) apply(); else instant(apply);
    }
    // Its sticky box can outlast the card's end by its own height (negative margin):
    // fade it out once the card's bottom edge reaches it.
    bar.classList.toggle("rb-leaving", !!shell && shell.getBoundingClientRect().bottom < r.bottom + 8);
  };
  // The layout may change (window resized, fonts loaded): decide again where it fits.
  const relayout = (): void => {
    const f = (window as { __kzhRbLayout?: () => void }).__kzhRbLayout;
    instant(() => {
      if (typeof f === "function") f();
      updateFloating();
    });
  };
  window.addEventListener("resize", relayout);
  window.addEventListener("load", relayout);
  updateFloating();

  bar.querySelector("[data-scroll-top]")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateFloating();
      const y = window.scrollY;
      if (progress) {
        const top = docTop(content);
        const p = (y + window.innerHeight * 0.3 - top) / Math.max(1, content.offsetHeight);
        progress.style.setProperty("--progress", String(Math.min(1, Math.max(0, p))));
      }
    });
  }, { passive: true });

  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
    if (document.querySelector(".mv-palette-overlay:not([hidden])")) return;
    if ((e.key === "[" && prevUrl) || (e.key === "]" && nextUrl)) {
      const to = e.key === "[" ? prevUrl! : nextUrl!;
      location.href = to;  // no jump mark: keeping the bar under the pointer is for clicks
    }
    else if ((e.key === "l" || e.key === "L") && altUrl) {
      document.querySelector<HTMLAnchorElement>("a[data-lang-switch]")?.click();
    } else return;
    e.preventDefault();
  });
}

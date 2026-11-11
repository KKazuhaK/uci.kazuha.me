// Behaviour for <details> blocks in a note. Worked answers are written in the
// Markdown as
//   <details>
//   <summary>Solution</summary>
//
//   …answer…
//
//   </details>
// and the browser folds them natively; this only adds the extras:
//   - a link or shared URL pointing into a closed block opens it
//   - printing shows every block
//   - the language switch keeps the blocks the reader opened (reading-bar.ts)

function detailsIn(container: HTMLElement): HTMLDetailsElement[] {
  return Array.from(container.querySelectorAll<HTMLDetailsElement>("details"));
}

/** Indexes of the blocks the reader has opened. */
export function openDetailsIndexes(container: HTMLElement): number[] {
  return detailsIn(container).flatMap((d, i) => (d.open ? [i] : []));
}

export function detailsCount(container: HTMLElement): number {
  return container.querySelectorAll("details").length;
}

export function openDetailsAt(container: HTMLElement, indexes: readonly number[]): void {
  const all = detailsIn(container);
  for (const i of indexes) { const d = all[i]; if (d) d.open = true; }
}

export function setupDetails(container: HTMLElement, onToggle?: () => void): void {
  const all = detailsIn(container);
  if (!all.length) return;
  if (onToggle) all.forEach((d) => d.addEventListener("toggle", onToggle));

  const openHash = (): void => {
    let id = location.hash.slice(1);
    try { id = decodeURIComponent(id); } catch { /* malformed escape: use it as is */ }
    const target = id ? document.getElementById(id) : null;
    for (let d = target?.closest("details"); d && container.contains(d); d = d.parentElement?.closest("details")) {
      d.open = true;
    }
  };
  openHash();
  window.addEventListener("hashchange", openHash);

  let closedForPrint: HTMLDetailsElement[] = [];
  window.addEventListener("beforeprint", () => {
    closedForPrint = all.filter((d) => !d.open);
    closedForPrint.forEach((d) => { d.open = true; });
  });
  window.addEventListener("afterprint", () => {
    closedForPrint.forEach((d) => { d.open = false; });
    closedForPrint = [];
  });
}

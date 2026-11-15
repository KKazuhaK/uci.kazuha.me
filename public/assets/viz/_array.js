// Shared array drawing for viz components (sorts, arraylist, circular queue,
// the heap's array, traversal output). Built on the player's .vz-row / .vz-cell
// styles, so every array looks the same; this adds motion. A component gives
// each element a stable `id`, and when the element changes place (a swap, a
// shift, a copy into a new array) its cell glides there: a swap goes along two
// arcs, a shift slides, a new element pops in. Positions (index numbers and
// pointers such as i / j / minIdx) belong to the slots, not to the elements,
// so they stay put in their own rows.
//
//   import { arrayView } from "./_array.js";
//   arrayView(stage).update({
//     cells: [{ id, label, role, dashed, hidden }],   // role: cmp | min | swap | sorted | ghost | dim | unused,
//                                              // or several ("cmp sorted"); hidden keeps the slot, shows nothing
//     index: true,                             // index row: true = 0..n-1, or an array of labels
//     ptrs: [[{ name: "i" }, { name: "j", role: "cmp" }], …]   // per slot, optional
//   });
//
// Without ids, a cell is its slot (values change in place, nothing moves).
// Several arrays in one stage: arrayView(stage, "aux"), arrayView(stage, "a").
// This file only touches the DOM inside arrayView(); importing it is DOM-free.

const MOVE_MS = 450;

const CSS = `
.vz-arr { display: flex; flex-direction: column; gap: 0.3rem; align-items: stretch; }
.vz-arr + .vz-arr, .vz-tree-wrap + .vz-arr, .vz-arr + .vz-tree-wrap { margin-top: 0.9rem; }
.vz-arr .vz-row { position: relative; }
.vz-arr .vz-arr-idx .vz-col, .vz-arr .vz-arr-ptrs .vz-col { min-height: 0; }
.vz-arr .vz-arr-idx .vz-idx { margin-top: 0; }
.vz-arr .vz-arr-ptrs { min-height: 2.5em; } /* same height with or without pointers: no jump */
.vz-arr .vz-arr-ptrs .vz-col { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; font-size: 0.78rem; }
.vz-arr-caption { color: var(--vz-muted); font-size: 0.8rem; text-align: center; }
.vz-cell.is-ghost, .vz-cell.is-unused { color: var(--vz-muted); border-style: dashed; }
.vz-cell.is-ghost { background: none; }
.vz-cell.is-dim { color: var(--vz-muted); }
.vz-cell.is-dashed { border-style: dashed; }
`;

// role may be one state or several ("cmp sorted", or an array): each becomes an is-* class.
function roleClasses(role) {
	if (!role) return "";
	const list = Array.isArray(role) ? role : String(role).split(/\s+/);
	return list.filter(Boolean).map(function(r) { return " is-" + String(r).replace(/^is-/, ""); }).join("");
}

function ensureCss() {
	if (document.getElementById("viz-array-style")) return;
	const st = document.createElement("style");
	st.id = "viz-array-style";
	st.textContent = CSS;
	document.head.appendChild(st);
}

function reducedMotion() {
	return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The array view `key` for this stage, reused while it is still in the stage. */
export function arrayView(stage, key) {
	ensureCss();
	const slot = "_vzArr" + (key || "");
	let v = stage[slot];
	if (!v || !stage.contains(v.el)) v = stage[slot] = createView(stage);
	return v;
}

function createView(host) {
	const root = document.createElement("div");
	root.className = "vz-arr";
	const caption = document.createElement("div");
	caption.className = "vz-arr-caption";
	const row = document.createElement("div");
	row.className = "vz-row vz-arr-cells";
	row.dataset.keyed = "1"; // the player's own swap arcs leave this row alone
	const idxRow = document.createElement("div");
	idxRow.className = "vz-row vz-arr-idx";
	const ptrRow = document.createElement("div");
	ptrRow.className = "vz-row vz-arr-ptrs";
	root.append(caption, row, idxRow, ptrRow);
	host.appendChild(root);

	const cols = new Map(); // id → { col, cell, anim }
	let first = true;

	function slotCols(target, n, make) {
		while (target.children.length > n) target.lastChild.remove();
		while (target.children.length < n) target.appendChild(make());
	}

	function update(view) {
		const cells = view.cells || [];
		const n = cells.length;
		caption.textContent = view.caption || "";
		caption.style.display = view.caption ? "" : "none";
		const animate = !first && !reducedMotion();

		// FLIP: each element's slot, and where its cell is on screen (mid-glide, if a
		// glide from the last frame is still running)…
		const slotBefore = new Map(), seenBefore = new Map();
		if (animate) cols.forEach(function(c, id) {
			slotBefore.set(id, c.col.getBoundingClientRect().left);
			seenBefore.set(id, c.cell.getBoundingClientRect().left);
		});

		const seen = new Set();
		const order = [];
		cells.forEach(function(d, i) {
			const id = d.id === undefined || d.id === null ? "#" + i : String(d.id);
			seen.add(id);
			let c = cols.get(id);
			if (!c) {
				const col = document.createElement("div");
				col.className = "vz-col";
				const cell = document.createElement("div");
				cell.className = "vz-cell";
				col.appendChild(cell);
				c = { col: col, cell: cell, fresh: true };
				cols.set(id, c);
			}
			c.cell.textContent = d.label === undefined || d.label === null ? "" : String(d.label);
			c.cell.className = "vz-cell" + roleClasses(d.role) + (d.dashed ? " is-dashed" : "");
			// hidden: the slot keeps its place in the row but shows nothing.
			c.col.style.visibility = d.hidden ? "hidden" : "";
			if (d.title) c.cell.title = d.title; else c.cell.removeAttribute("title");
			order.push(c);
		});
		cols.forEach(function(c, id) { if (!seen.has(id)) { c.col.remove(); cols.delete(id); } });
		order.forEach(function(c, i) { if (row.children[i] !== c.col) row.insertBefore(c.col, row.children[i] || null); });

		// Index and pointer rows belong to the slots.
		const labels = view.index === false || view.index === undefined ? null
			: Array.isArray(view.index) ? view.index : cells.map(function(_, i) { return i; });
		idxRow.style.display = labels ? "" : "none";
		if (labels) {
			slotCols(idxRow, n, function() { const c = document.createElement("div"); c.className = "vz-col"; c.innerHTML = '<div class="vz-idx"></div>'; return c; });
			Array.from(idxRow.children).forEach(function(c, i) {
				c.firstChild.textContent = labels[i] === undefined ? "" : String(labels[i]);
				c.style.visibility = cells[i] && cells[i].hidden ? "hidden" : "";
			});
		}
		// The pointer row stays (with its height) whenever the component uses pointers.
		const ptrs = view.ptrs || [];
		ptrRow.style.display = view.ptrs ? "" : "none";
		if (view.ptrs) {
			slotCols(ptrRow, n, function() { const c = document.createElement("div"); c.className = "vz-col"; return c; });
			Array.from(ptrRow.children).forEach(function(c, i) {
				c.innerHTML = (ptrs[i] || []).map(function(p) {
					return '<span class="vz-ptr' + (p.role ? " is-" + p.role : "") + '">' + escapeHtml(p.name) + "</span>";
				}).join("");
			});
		} else {
			ptrRow.textContent = "";
		}

		// …and the glide from there to its new slot. A cell whose slot didn't change
		// keeps any glide still running from the last frame (fast Play).
		if (animate) {
			const moved = [];
			cols.forEach(function(c, id) {
				const now = c.col.getBoundingClientRect().left;
				if (c.fresh) {
					if (c.cell.animate) c.anim = c.cell.animate([{ opacity: 0, transform: "translateY(-10px) scale(0.92)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "ease-out" });
					return;
				}
				if (!slotBefore.has(id) || Math.abs(slotBefore.get(id) - now) <= 0.5) return;
				moved.push({ c: c, slotDx: slotBefore.get(id) - now, dx: seenBefore.get(id) - now });
			});
			// A pair trading places arcs over / under each other; any other move slides.
			const isSwap = moved.length === 2 && Math.abs(moved[0].slotDx + moved[1].slotDx) < 1;
			moved.forEach(function(m) {
				if (!m.c.cell.animate) return;
				if (m.c.anim) m.c.anim.cancel();
				const lift = isSwap ? (m.slotDx > 0 ? -1 : 1) * 18 : 0;
				m.c.anim = m.c.cell.animate([
					{ transform: "translate(" + m.dx + "px, 0)" },
					{ transform: "translate(" + m.dx / 2 + "px, " + lift + "px)", offset: 0.5 },
					{ transform: "none" }
				], { duration: MOVE_MS, easing: "cubic-bezier(0.45, 0, 0.25, 1)" });
			});
		}
		cols.forEach(function(c) { c.fresh = false; });
		first = false;
	}

	return { el: root, update: update };
}

function escapeHtml(s) {
	return String(s).replace(/[&<>"]/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
}

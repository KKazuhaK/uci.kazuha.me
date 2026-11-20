// Shared tree drawing for viz components (bst, binary-tree, binary-heap,
// tree-traversal). A component describes each frame as plain data, nodes with a
// stable `id`, and the view keeps one SVG per stage and moves it from frame to
// frame: a node that changes place glides there (its edges follow), a new node
// fades in, a removed one fades out, and colours cross-fade. Every tree demo
// therefore looks and moves the same way.
//
//   import { treeView } from "./_tree.js";
//   export function render(stage, frame) {
//     treeView(stage).update({
//       nodes: [{ id, label, col, depth, role, val, badge, dashed }],
//       edges: [{ from, to, role, dashed }],
//       cols, rows,          // optional: fixed grid size, so the drawing doesn't resize between frames
//       empty: "(empty tree)"
//     });
//   }
//
// col / depth are grid units: x = (col + 0.5) columns, y = depth rows. Use
// `heapPlace(i, depth)` for heap positions (1-based index in a tree of `depth`
// levels below the root) or in-order columns (bst). role is one of the shared
// state names (the same as the array cells and the legend swatches):
//   cmp (being compared), min (chosen / successor), swap (moved / changed),
//   sorted (done / hit), ghost (placeholder), out (left the structure), dim.
// Edge roles: path (the path just taken), active (being followed), red (a red
// link in a red-black tree), glue (keys of one multi-key node, e.g. a 2-3 node).
// An edge joins two nodes by id and follows them as they move. For structures
// whose links belong to positions, not elements (a heap's slots), give
// `at: [col1, depth1, col2, depth2]` and a `key` instead: a fixed line.
// This file only touches the DOM inside treeView(); importing it is DOM-free.

export const NODE_R = 20;
export const COL_W = 50;
export const ROW_H = 62;
const PAD = 28;
const MOVE_MS = 450;

const CSS = `
.vz-tree-wrap { overflow-x: auto; }
.vz-tree { display: block; margin: 0 auto; font-family: "Consolas", "Menlo", monospace; overflow: visible; }
.vz-te { stroke: var(--vz-muted); stroke-width: 1.4; fill: none; transition: stroke .3s, stroke-width .3s, opacity .3s; }
.vz-te.is-path { stroke: var(--vz-swap-bd); stroke-width: 3.5; }
.vz-te.is-active { stroke: var(--vz-cmp-bd); stroke-width: 3; }
.vz-te.is-dashed { stroke-dasharray: 4 3; }
.vz-te.is-red { stroke: #d1453b; stroke-width: 5; }
.vz-te.is-glue { stroke: var(--vz-border); stroke-width: 7; stroke-linecap: round; opacity: .55; }
.vz-tn { transition: opacity .3s; }
.vz-tn circle { fill: var(--vz-surface); stroke: var(--vz-border); stroke-width: 1.6; transition: fill .3s, stroke .3s, stroke-width .3s; }
.vz-tn text { fill: var(--vz-ink); font-weight: 600; text-anchor: middle; dominant-baseline: central; font-size: 15px; transition: fill .3s; }
.vz-tn .vz-tn-val { fill: var(--vz-blue); font-size: 10px; font-weight: 700; text-anchor: start; }
.vz-tn .vz-tn-badge { fill: var(--vz-blue); font-size: 10px; font-weight: 700; text-anchor: end; }
.vz-tn.is-cmp circle { fill: var(--vz-cmp-bg); stroke: var(--vz-cmp-bd); stroke-width: 3; }
.vz-tn.is-min circle { fill: var(--vz-min-bg); stroke: var(--vz-min-bd); stroke-width: 2.5; }
.vz-tn.is-min text { fill: var(--vz-min-fg); }
.vz-tn.is-swap circle { fill: var(--vz-swap-bg); stroke: var(--vz-swap-bd); stroke-width: 2.5; }
.vz-tn.is-swap text { fill: var(--vz-swap-fg); }
.vz-tn.is-sorted circle { fill: var(--vz-sorted-bg); stroke: var(--vz-sorted-bd); stroke-width: 2.5; }
.vz-tn.is-sorted text { fill: var(--vz-sorted-fg); }
.vz-tn.is-dashed circle, .vz-tn.is-out circle { stroke-dasharray: 4 3; }
.vz-tn.is-ghost circle { stroke-dasharray: 4 3; fill: none; }
.vz-tn.is-ghost text, .vz-tn.is-dim text { fill: var(--vz-muted); }
.vz-tn.is-dim circle { stroke-dasharray: 2 3; }
.vz-tn .vz-tn-val, .vz-tn .vz-tn-badge { transition: fill .3s; }
.vz-tn.is-entering, .vz-te.is-entering, .vz-tn.is-leaving, .vz-te.is-leaving { opacity: 0; }
.vz-tree-empty { fill: var(--vz-muted); font-size: 13px; text-anchor: middle; }
@media (prefers-reduced-motion: reduce) {
	.vz-tn, .vz-tn circle, .vz-tn text, .vz-te { transition: none; }
}
`;

const SVGNS = "http://www.w3.org/2000/svg";

// role may be one state or several ("cmp sorted", or an array): each becomes an is-* class.
function roleClasses(role) {
	if (!role) return "";
	const list = Array.isArray(role) ? role : String(role).split(/\s+/);
	return list.filter(Boolean).map(function(r) { return " is-" + String(r).replace(/^is-/, ""); }).join("");
}

function ensureCss() {
	if (document.getElementById("viz-tree-style")) return;
	const st = document.createElement("style");
	st.id = "viz-tree-style";
	st.textContent = CSS;
	document.head.appendChild(st);
}

function el(tag, attrs, parent) {
	const e = document.createElementNS(SVGNS, tag);
	for (const k in attrs) e.setAttribute(k, attrs[k]);
	if (parent) parent.appendChild(e);
	return e;
}

function reducedMotion() {
	return typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Grid place of heap index i (1-based) in a tree whose lowest level is `depth`. */
export function heapPlace(i, depth) {
	const d = Math.floor(Math.log2(i));
	const span = Math.pow(2, depth - d);
	return { col: (i - Math.pow(2, d)) * span + span / 2 - 0.5, depth: d };
}

function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

// Edge endpoints cut back by the node radius, so lines stop at the circles
// (node fills are translucent in dark mode).
function trimmed(a, b) {
	const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
	const ux = dx / len * NODE_R, uy = dy / len * NODE_R;
	return [a.x + ux, a.y + uy, b.x - ux, b.y - uy];
}

/**
 * The tree view for this stage: created on first use, then reused for every
 * frame while its SVG is still in the stage (the player empties the stage on a
 * new config). `key` lets one stage hold several trees.
 */
export function treeView(stage, key) {
	ensureCss();
	const slot = "_vzTree" + (key || "");
	const host = stage;
	let v = host[slot];
	if (!v || !host.contains(v.wrap)) {
		v = host[slot] = createView(host);
	}
	return v;
}

function createView(host) {
	const wrap = document.createElement("div");
	wrap.className = "vz-tree-wrap";
	const langEl = host.closest ? host.closest("[data-lang]") : null;
	const svg = el("svg", { "class": "vz-tree", role: "img", "aria-label": langEl && langEl.getAttribute("data-lang") === "zh-CN" ? "树" : "tree" });
	svg.style.maxWidth = "100%";
	svg.style.height = "auto";
	const gE = el("g", {}, svg), gN = el("g", {}, svg);
	const empty = el("text", { "class": "vz-tree-empty" }, svg);
	wrap.appendChild(svg);
	host.appendChild(wrap);

	const nodes = new Map(); // id → { g, circle, text, val, badge, cur:{x,y}, from, to, bow }
	const edges = new Map(); // "from>to" → { line, from, to }
	let raf = 0;
	let first = true;

	function px(n) { return { x: PAD + (n.col + 0.5) * COL_W, y: PAD + n.depth * ROW_H }; }

	function placeEdges() {
		edges.forEach(function(e) {
			if (e.at) {
				const t = trimmed(px({ col: e.at[0], depth: e.at[1] }), px({ col: e.at[2], depth: e.at[3] }));
				e.line.setAttribute("x1", t[0]); e.line.setAttribute("y1", t[1]);
				e.line.setAttribute("x2", t[2]); e.line.setAttribute("y2", t[3]);
				return;
			}
			const a = nodes.get(e.from), b = nodes.get(e.to);
			if (!a || !b) return;
			const t = trimmed(a.cur, b.cur);
			e.line.setAttribute("x1", t[0]); e.line.setAttribute("y1", t[1]);
			e.line.setAttribute("x2", t[2]); e.line.setAttribute("y2", t[3]);
		});
	}

	function placeNode(n) {
		n.g.setAttribute("transform", "translate(" + n.cur.x + "," + n.cur.y + ")");
	}

	function tick(start) {
		cancelAnimationFrame(raf);
		const step = function(now) {
			const t = Math.min(1, (now - start) / MOVE_MS), k = ease(t);
			nodes.forEach(function(n) {
				if (!n.from) return;
				// bow: perpendicular offset, largest half-way
				const s = Math.sin(Math.PI * k);
				n.cur = { x: n.from.x + (n.to.x - n.from.x) * k + s * n.bowX, y: n.from.y + (n.to.y - n.from.y) * k + s * n.bowY };
				placeNode(n);
				if (t === 1) n.from = null;
			});
			placeEdges();
			if (t < 1) raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
	}

	function update(view) {
		const list = view.nodes || [];
		const cols = Math.max(view.cols || 0, list.reduce(function(m, n) { return Math.max(m, n.col + 1); }, 1));
		const rows = Math.max(view.rows || 0, list.reduce(function(m, n) { return Math.max(m, n.depth + 1); }, 1));
		const W = Math.max(cols * COL_W + PAD * 2, 200), H = (rows - 1) * ROW_H + PAD * 2;
		svg.setAttribute("viewBox", "0 0 " + W + " " + H);
		svg.setAttribute("width", W);
		empty.setAttribute("x", W / 2); empty.setAttribute("y", H / 2);
		empty.textContent = list.length ? "" : (view.empty || "");

		const animate = !first && !reducedMotion();
		const seen = new Set();
		const retargeted = new Set();
		let moving = false;
		list.forEach(function(d) {
			const id = String(d.id);
			seen.add(id);
			const to = px(d);
			let n = nodes.get(id);
			if (!n) {
				const g = el("g", { "class": "vz-tn" }, gN);
				n = {
					g: g,
					circle: el("circle", { r: NODE_R, cx: 0, cy: 0 }, g),
					text: el("text", { x: 0, y: 0 }, g),
					val: el("text", { "class": "vz-tn-val", x: NODE_R + 1, y: -NODE_R + 2 }, g),
					badge: el("text", { "class": "vz-tn-badge", x: -NODE_R + 1, y: -NODE_R - 1 }, g),
					cur: to, from: null
				};
				nodes.set(id, n);
				placeNode(n);
				if (animate) {
					n.g.classList.add("is-entering");
					requestAnimationFrame(function() { requestAnimationFrame(function() { n.g.classList.remove("is-entering"); }); });
				}
			} else if (n.leaving) {
				n.leaving = false;
				clearTimeout(n.leaveTimer);
				n.g.classList.remove("is-leaving");
			}
			n.text.textContent = d.label === undefined || d.label === null ? "" : String(d.label);
			n.val.textContent = d.val === undefined || d.val === null ? "" : String(d.val);
			n.badge.textContent = d.badge === undefined || d.badge === null ? "" : String(d.badge);
			n.g.setAttribute("class", "vz-tn" + roleClasses(d.role) + (d.dashed ? " is-dashed" : "") + (n.g.classList.contains("is-entering") ? " is-entering" : ""));
			if (n.cur.x !== to.x || n.cur.y !== to.y) {
				if (animate) {
					n.from = { x: n.cur.x, y: n.cur.y };
					n.to = to;
					// Two nodes trading places (a heap exchange) bow to opposite sides so
					// they don't run through each other: perpendicular, signed by direction.
					const dx = to.x - n.from.x, dy = to.y - n.from.y, len = Math.hypot(dx, dy) || 1;
					// (-dy, dx) already points the other way for the node going the other way.
					n.bowX = -dy / len * 14; n.bowY = dx / len * 14;
					retargeted.add(id);
					moving = true;
				} else {
					n.cur = to; n.from = null; placeNode(n);
				}
			}
		});
		nodes.forEach(function(n, id) {
			if (seen.has(id) || n.leaving) return;
			if (animate) {
				n.leaving = true;
				if (n.from) { n.from = null; placeNode(n); } // fade out where it is, no jump back
				n.g.classList.add("is-leaving");
				n.leaveTimer = setTimeout(function() { n.g.remove(); nodes.delete(id); }, 320);
			} else {
				n.g.remove(); nodes.delete(id);
			}
		});

		const eseen = new Set();
		(view.edges || []).forEach(function(d) {
			const k = d.at ? "@" + (d.key !== undefined ? d.key : d.at.join(",")) : d.from + ">" + d.to;
			eseen.add(k);
			let e = edges.get(k);
			if (!e) {
				e = { line: el("line", { "class": "vz-te" }, gE), from: String(d.from), to: String(d.to), at: d.at || null };
				edges.set(k, e);
				if (animate) {
					e.line.classList.add("is-entering");
					requestAnimationFrame(function() { requestAnimationFrame(function() { e.line.classList.remove("is-entering"); }); });
				}
			} else if (e.leaving) {
				e.leaving = false;
				clearTimeout(e.leaveTimer);
			}
			e.at = d.at || null; // a fixed edge follows the current layout (size can change)
			e.line.setAttribute("class", "vz-te" + roleClasses(d.role) + (d.dashed ? " is-dashed" : "") + (e.line.classList.contains("is-entering") ? " is-entering" : ""));
		});
		edges.forEach(function(e, k) {
			if (eseen.has(k) || e.leaving) return;
			if (animate) {
				e.leaving = true;
				e.line.classList.add("is-leaving");
				e.leaveTimer = setTimeout(function() { e.line.remove(); edges.delete(k); }, 320);
			} else {
				e.line.remove(); edges.delete(k);
			}
		});

		if (moving) {
			// A glide still running from the last frame goes on from where it is now
			// (the tween restarts its clock), instead of jumping back to its start.
			nodes.forEach(function(n, id) {
				if (n.from && !retargeted.has(id)) { n.from = { x: n.cur.x, y: n.cur.y }; n.bowX = 0; n.bowY = 0; }
			});
			placeEdges();
			tick(performance.now());
		} else {
			// Nothing new to move: a glide still running from the last frame (fast
			// Play) carries on to its end.
			placeEdges();
		}
		first = false;
	}

	return { wrap: wrap, svg: svg, update: update };
}

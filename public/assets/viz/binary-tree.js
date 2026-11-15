// A binary tree drawn the way the slides draw it, with one step per idea:
// root, parent/children, siblings, ancestors, subtree, leaves, internal
// nodes, a path and its length, depth / height / degree of every node,
// full and complete checks, null links. Several trees can be shown one
// after another (e.g. the four "complete / full" shapes).
// Trees are given in heap positions: position 1 is the root, the children
// of p are 2p and 2p + 1, "-" marks an empty position.
import { checkParams } from "./_core.js";
import { treeView, heapPlace } from "./_tree.js";

const MAXPOS = 31;

export const meta = {
	name: "binary-tree",
	summary: "Draws a binary tree and highlights one idea per step: root, parent, siblings, ancestors, subtree, leaves, internal nodes, path, depth, height, degree, full, complete, null links.",
	groupLabel: "tree",
	params: {
		tree: { type: "string", required: true, desc: "One or more trees separated by \"|\", each optionally prefixed with \"Label = \". Nodes by heap position, comma-separated: root first, children of p at 2p and 2p+1, \"-\" = empty. Labels 1–3 chars, unique per tree, at most 31 positions (depth ≤ 4)." },
		views: { type: "string", default: "plain", desc: "Steps shown for each tree, separated by \";\": plain, root, leaves, internal, depth, height, degree, full, complete, nulls, parent:X, siblings:X, ancestors:X, subtree:X, path:X-Y-Z. At most 14." }
	},
	example: { tree: "K, C, N, A, F, M, V, -, B, D, H, -, -, U", views: "root; leaves; subtree:N; path:K-N-V-U; depth; height" }
};

const SIMPLE = ["plain", "root", "leaves", "internal", "depth", "height", "degree", "full", "complete", "nulls"];
const WITH_NODE = ["parent", "siblings", "ancestors", "subtree"];

function parseOne(text) {
	let label = "";
	let body = String(text);
	const eq = body.lastIndexOf("="); // labels may contain "=" (e.g. "h = 2"); node lists never do
	if (eq >= 0) { label = body.slice(0, eq).trim(); body = body.slice(eq + 1); }
	if (label.length > 40) return { error: "\"tree\": label \"" + label.slice(0, 20) + "…\" is longer than 40 characters" };
	const parts = body.trim().split(/\s*[,，]\s*|\s+/).map(function(s) { return s.trim(); });
	if (parts.length === 1 && parts[0] === "") return { error: "\"tree\" has an empty tree" };
	if (parts.some(function(s) { return s === ""; })) return { error: "\"tree\" has an empty item (two commas in a row?); write \"-\" for an empty position" };
	if (parts.length > MAXPOS) return { error: "\"tree\" has " + parts.length + " positions; at most " + MAXPOS + " (depth ≤ 4)" };
	const pos = [null];
	const seen = {};
	for (const s of parts) {
		if (s === "-" || s === "_") { pos.push(null); continue; }
		if (s.length > 3) return { error: "\"tree\": label \"" + s + "\" is longer than 3 characters" };
		if (/[-|=;:]/.test(s)) return { error: "\"tree\": label \"" + s + "\" can't contain - | = ; :" };
		if (seen[s]) return { error: "\"tree\": label \"" + s + "\" appears twice; labels must be unique in a tree" };
		seen[s] = true;
		pos.push(s);
	}
	if (pos[1] === null) return { error: "\"tree\": position 1 (the root) can't be empty" };
	for (let p = 2; p < pos.length; p++) {
		if (pos[p] !== null && pos[p >> 1] === null) {
			return { error: "\"tree\": \"" + pos[p] + "\" at position " + p + " has no parent (position " + (p >> 1) + " is \"-\")" };
		}
	}
	while (pos.length > 2 && pos[pos.length - 1] === null) pos.pop();
	const at = {};
	for (let p = 1; p < pos.length; p++) if (pos[p] !== null) at[pos[p]] = p;
	return { label: label, pos: pos, at: at };
}

function parseTrees(text) {
	const chunks = String(text).split("|");
	if (chunks.length > 6) return { error: "\"tree\" has " + chunks.length + " trees; at most 6" };
	const trees = [];
	for (const c of chunks) {
		const t = parseOne(c);
		if (t.error) return t;
		trees.push(t);
	}
	return { trees: trees };
}

function parseViews(text) {
	const parts = String(text).split(";").map(function(s) { return s.trim(); }).filter(Boolean);
	if (parts.length === 0) return { error: "\"views\" is empty" };
	if (parts.length > 14) return { error: "\"views\" has " + parts.length + " steps; at most 14" };
	const views = [];
	for (const p of parts) {
		const m = /^([a-z]+)(?:\s*:\s*(.+))?$/.exec(p);
		if (!m) return { error: "\"views\": can't read \"" + p + "\"" };
		const name = m[1], arg = m[2] ? m[2].trim() : "";
		if (SIMPLE.indexOf(name) >= 0) {
			if (arg) return { error: "\"views\": \"" + name + "\" takes no argument" };
			views.push({ name: name });
		} else if (WITH_NODE.indexOf(name) >= 0) {
			if (!arg) return { error: "\"views\": \"" + name + "\" needs a node, e.g. " + name + ":A" };
			views.push({ name: name, node: arg });
		} else if (name === "path") {
			const nodes = arg.split(/\s*-\s*/).filter(Boolean);
			if (nodes.length < 2) return { error: "\"views\": path needs at least two nodes, e.g. path:K-N-V" };
			views.push({ name: name, nodes: nodes });
		} else {
			return { error: "\"views\": unknown view \"" + name + "\" (use " + SIMPLE.concat(WITH_NODE, ["path"]).join(", ") + ")" };
		}
	}
	return { views: views };
}

// Check that the node names in the views exist in every tree, and that paths follow edges.
function checkViews(trees, views) {
	for (const t of trees) {
		const where = t.label ? " in tree \"" + t.label + "\"" : " in the tree";
		for (const v of views) {
			if (v.node && !(v.node in t.at)) return "\"views\": node \"" + v.node + "\" is not" + where;
			if (v.nodes) {
				for (const n of v.nodes) if (!(n in t.at)) return "\"views\": path node \"" + n + "\" is not" + where;
				for (let i = 1; i < v.nodes.length; i++) {
					const a = t.at[v.nodes[i - 1]], b = t.at[v.nodes[i]];
					if ((a >> 1) !== b && (b >> 1) !== a) return "\"views\": " + v.nodes[i - 1] + "-" + v.nodes[i] + " is not an edge" + where;
				}
				const set = {};
				for (const n of v.nodes) { if (set[n]) return "\"views\": path " + v.nodes.join("-") + " repeats " + n + " (a simple path has distinct nodes)"; set[n] = true; }
			}
		}
	}
	return "";
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const t = parseTrees(config.tree);
	if (t.error) return [t.error];
	const v = parseViews(config.views || "plain");
	if (v.error) return [v.error];
	const e = checkViews(t.trees, v.views);
	return e ? [e] : [];
}

export const legend = [
	{ cls: "is-cmp", label: "Highlighted node" },
	{ cls: "is-min", label: "Related nodes" },
	{ cls: "is-swap", label: "Breaks the property" }
];

// ---------- tree facts ----------

function has(pos, p) { return p < pos.length && pos[p] !== null; }
function kids(pos, p) { return [2 * p, 2 * p + 1].filter(function(c) { return has(pos, c); }); }
function depthOf(p) { return Math.floor(Math.log2(p)); }
function heightOf(pos, p) {
	const k = kids(pos, p);
	return k.length ? 1 + Math.max.apply(null, k.map(function(c) { return heightOf(pos, c); })) : 0;
}
function subtree(pos, p) {
	const out = [p];
	kids(pos, p).forEach(function(c) { out.push.apply(out, subtree(pos, c)); });
	return out;
}
function nodes(pos) { const o = []; for (let p = 1; p < pos.length; p++) if (has(pos, p)) o.push(p); return o; }
function names(pos, list) { return list.map(function(p) { return pos[p]; }).join(", "); }

// ---------- steps ----------

export function steps(config) {
	const trees = parseTrees(config.tree).trees;
	const views = parseViews(config.views || "plain").views;
	const frames = [];
	// Same drawing height for every tree in the demo (no page jump between trees);
	// one extra row when the null links are shown, since they hang below the leaves.
	const showNulls = views.some(function(v) { return v.name === "nulls"; });
	const maxDepth = Math.max.apply(null, trees.map(function(t) { return depthOf(t.pos.length - 1); }));
	const rows = maxDepth + 1 + (showNulls ? 1 : 0);
	trees.forEach(function(t, ti) {
		const pos = t.pos, at = t.at;
		const all = nodes(pos);
		const n = all.length;
		const h = heightOf(pos, 1);
		const leaves = all.filter(function(p) { return kids(pos, p).length === 0; });
		const internal = all.filter(function(p) { return kids(pos, p).length > 0; });
		const name = t.label ? "**" + t.label + "**: " : "";
		views.forEach(function(v) {
			const f = { tree: ti, span: depthOf(pos.length - 1) + (showNulls ? 1 : 0), rows: rows, pos: pos, hl: [], rel: [], bad: [], edges: [], edgeRole: "active", badge: null, ghosts: [], nulls: false, msg: "", group: ti };
			const vars = [["nodes n", String(n)], ["height h", String(h)]];
			if (t.label) vars.unshift(["tree", t.label]);
			switch (v.name) {
			case "plain":
				f.msg = name + "A binary tree with " + n + " node" + (n === 1 ? "" : "s") + ", root `" + pos[1] + "`.";
				break;
			case "root":
				f.hl = [1];
				f.msg = name + "The **root** `" + pos[1] + "` is the only node with no parent. Every other node has exactly one parent.";
				break;
			case "parent": {
				const p = at[v.node], k = kids(pos, p);
				f.hl = [p]; f.rel = k; f.edges = k;
				f.msg = name + "`" + v.node + "` is the **parent** of " + (k.length ? k.map(function(c) { return "`" + pos[c] + "`"; }).join(" and ") + " (its **children**)." : "nothing: it is a leaf.") +
					(p > 1 ? " Its own parent is `" + pos[p >> 1] + "`." : " It has no parent (it is the root).");
				break;
			}
			case "siblings": {
				const p = at[v.node];
				const s = p > 1 ? p ^ 1 : 0;
				f.hl = [p];
				if (s && has(pos, s)) { f.rel = [s]; f.msg = name + "`" + v.node + "` and `" + pos[s] + "` are **siblings**: same parent `" + pos[p >> 1] + "`."; }
				else f.msg = name + "`" + v.node + "` has no sibling" + (p > 1 ? " (its parent `" + pos[p >> 1] + "` has one child)." : " (it is the root).");
				break;
			}
			case "ancestors": {
				const p = at[v.node], anc = [];
				for (let q = p >> 1; q >= 1; q >>= 1) anc.push(q);
				f.hl = [p]; f.rel = anc;
				for (let q = p; q > 1; q >>= 1) f.edges.push(q);
				f.msg = name + (anc.length
					? "The **ancestors** of `" + v.node + "` are the nodes on its path up to the root: " + names(pos, anc) + ". `" + v.node + "` is a **descendant** of each of them."
					: "`" + v.node + "` is the root, so it has no **ancestors**; every other node is its **descendant**.");
				break;
			}
			case "subtree": {
				const p = at[v.node], sub = subtree(pos, p);
				f.hl = [p]; f.rel = sub.slice(1); f.edges = sub.slice(1);
				f.msg = name + "The **subtree** rooted at `" + v.node + "` = `" + v.node + "` plus all its descendants: {" + names(pos, sub) + "}.";
				break;
			}
			case "leaves":
				f.rel = leaves;
				f.msg = name + "**Leaves** (external nodes) have no children: {" + names(pos, leaves) + "} — " + leaves.length + " of " + n + " node" + (n === 1 ? "" : "s") + ".";
				break;
			case "internal":
				f.rel = internal;
				f.msg = name + "**Internal** nodes have at least one child: {" + names(pos, internal) + "}.";
				break;
			case "path": {
				const ps = v.nodes.map(function(x) { return at[x]; });
				f.hl = [ps[0], ps[ps.length - 1]]; f.rel = ps.slice(1, -1); f.edgeRole = "path";
				for (let i = 1; i < ps.length; i++) f.edges.push(Math.max(ps[i - 1], ps[i]));
				f.msg = name + "**Simple path** " + v.nodes.join("-") + ": " + v.nodes.length + " nodes, so its **length** is " + (v.nodes.length - 1) + " (edges, not nodes).";
				vars.push(["path length", String(v.nodes.length - 1)]);
				break;
			}
			case "depth": {
				f.badge = {}; all.forEach(function(p) { f.badge[p] = depthOf(p); });
				const per = [];
				for (let d = 0; d <= h; d++) per.push(all.filter(function(p) { return depthOf(p) === d; }).length);
				f.msg = name + "**Depth (level)** = number of edges from the root: the root is at depth 0. Nodes per level: " +
					per.map(function(c, d) { return "level " + d + ": " + c + " (max 2^" + d + " = " + Math.pow(2, d) + ")"; }).join(", ") + ". Tree depth = " + h + ".";
				break;
			}
			case "height":
				f.badge = {}; all.forEach(function(p) { f.badge[p] = heightOf(pos, p); });
				f.msg = name + "**Height** = longest path down to a leaf: a leaf has height 0, any other node 1 + the max height of its children. Tree height = height of the root = " + h + ".";
				break;
			case "degree": {
				f.badge = {}; let mx = 0;
				all.forEach(function(p) { const d = kids(pos, p).length; f.badge[p] = d; if (d > mx) mx = d; });
				f.msg = name + "**Degree** = number of children. The degree (arity) of the tree is the max over all nodes: " + mx + ".";
				vars.push(["arity", String(mx)]);
				break;
			}
			case "full": {
				const one = all.filter(function(p) { return kids(pos, p).length === 1; });
				f.bad = one;
				f.msg = name + (one.length
					? "**Not full**: " + names(pos, one) + (one.length === 1 ? " has" : " have") + " exactly one child. A full tree has 0 or 2 children at every node."
					: "**Full**: every node has 0 or 2 children.");
				vars.push(["full", one.length ? "no" : "yes"]);
				break;
			}
			case "complete": {
				const last = pos.length - 1;
				const holes = [];
				for (let p = 2; p <= last; p++) if (!has(pos, p)) holes.push(p);
				f.ghosts = holes.filter(function(p) { return has(pos, p >> 1); });
				f.bad = [];
				const lastDepth = depthOf(last);
				const upperHole = holes.some(function(p) { return depthOf(p) < lastDepth; });
				f.msg = name + (holes.length
					? "**Not complete**: reading level by level, left to right, there " + (holes.length === 1 ? "is a gap" : "are gaps") + " (dashed) before the last node `" + pos[last] + "`" +
						(upperHole ? " — a level above the last one isn't full." : " — the last level isn't packed to the left.")
					: "**Complete**: every level is full except possibly the last, which is filled from the left — no gaps in level order.");
				vars.push(["complete", holes.length ? "no" : "yes"]);
				break;
			}
			case "nulls": {
				f.nulls = true;
				f.rel = leaves;
				f.msg = name + "Every missing child is a **null link** (`nullptr`); a **leaf** has two. A tree with " + n + " node" + (n === 1 ? "" : "s") + " has " + (n + 1) + " null links (2n links, n − 1 of them used by edges).";
				vars.push(["null links", String(n + 1)]);
				break;
			}
			}
			f.msg = f.msg.replace(/\*\*/g, ""); // the player renders `code` only, not bold
			f.vars = vars;
			f.step = frames.length;
			frames.push(f);
		});
	});
	return frames;
}

// ---------- drawing (shared tree view, one per tree) ----------

// Each tree has its own view (key "t" + index); only the current tree's view is
// shown. Node ids are heap positions, so a step only changes colours, which fade.
export function render(stage, frame) {
	const views = stage._btViews || (stage._btViews = {});
	const key = "t" + frame.tree;
	const view = views[key] = treeView(stage, key);
	for (const k in views) {
		if (views[k].wrap && stage.contains(views[k].wrap)) views[k].wrap.style.display = k === key ? "" : "none";
	}
	const pos = frame.pos, D = frame.span;
	const nodes = [], edges = [];
	function add(p, d) {
		const at = heapPlace(p, D);
		nodes.push(Object.assign({ id: p, col: at.col, depth: at.depth }, d));
	}
	for (let p = 1; p < pos.length; p++) {
		if (!has(pos, p)) continue;
		const role = frame.bad.indexOf(p) >= 0 ? "swap" : frame.hl.indexOf(p) >= 0 ? "cmp" : frame.rel.indexOf(p) >= 0 ? "min" : "";
		add(p, { label: pos[p], role: role, badge: frame.badge ? frame.badge[p] : undefined });
		if (p > 1) edges.push({ from: p >> 1, to: p, role: frame.edges.indexOf(p) >= 0 ? frame.edgeRole : "" });
	}
	// Gaps of a not-complete tree and null links are dashed placeholders.
	frame.ghosts.forEach(function(p) {
		add(p, { label: "", role: "ghost" });
		edges.push({ from: p >> 1, to: p, dashed: true });
	});
	if (frame.nulls) {
		for (let p = 1; p < pos.length; p++) {
			if (!has(pos, p)) continue;
			[2 * p, 2 * p + 1].forEach(function(c) {
				if (has(pos, c)) return;
				add(c, { label: "\u2205", role: "ghost" });
				edges.push({ from: p, to: c, dashed: true });
			});
		}
	}
	view.update({ nodes: nodes, edges: edges, cols: Math.pow(2, D), rows: frame.rows });
}

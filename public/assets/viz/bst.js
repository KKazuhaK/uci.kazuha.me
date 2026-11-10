// Binary search tree (key → value), Lecture 12: recursive get / put and
// Hibbard deletion (remove), step by step. The tree is drawn with each node
// in its in-order column and its depth as the row, so symmetric order is
// visible as left-to-right order.
import { checkParams } from "./_core.js";

const MAXN = 15;
const MAXOPS = 10;

export const meta = {
	name: "bst",
	summary: "Binary search tree: get(k) search hit/miss, put(k, v) insert or update, remove(k) by Hibbard deletion (leaf, one child, two children → successor).",
	groupLabel: "operation",
	params: {
		keys: { type: "string", default: "", desc: "Starting tree: keys put in this order, comma-separated (ints or 1–3 char words, distinct, at most 15). \"k:v\" gives a value." },
		ops: { type: "string", required: true, desc: "Operations separated by ';': get(k), put(k) or put(k, v), remove(k) (delete(k) also accepted). At most 10." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code shown beside the demo, with the running line highlighted." }
	},
	example: { keys: "8, 3, 10, 1, 6, 14, 4, 7, 13", ops: "get(4); get(9)" }
};

const KEY = "[^\\s,;:()\"]{1,3}";

function splitItems(text) {
	return String(text).split(/\s*[,，]\s*/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
}

function parseKeys(text) {
	const out = [];
	for (const s of splitItems(text)) {
		const m = new RegExp("^(" + KEY + ")(?::(" + KEY + "))?$").exec(s);
		if (!m) return { error: "\"keys\": can't read \"" + s + "\" (use a 1–3 character key, optionally key:value)" };
		out.push({ key: m[1], val: m[2] === undefined ? null : m[2] });
	}
	if (out.length > MAXN) return { error: "\"keys\" has " + out.length + " keys; at most " + MAXN };
	const seen = {};
	for (const o of out) {
		if (seen[o.key]) return { error: "\"keys\": key " + o.key + " appears twice (the BST assumes no duplicates)" };
		seen[o.key] = true;
	}
	return { items: out };
}

function parseOps(text) {
	const parts = String(text).split(";").map(function(s) { return s.trim(); }).filter(Boolean);
	if (parts.length === 0) return { error: "\"ops\" is empty" };
	if (parts.length > MAXOPS) return { error: "\"ops\" has " + parts.length + " operations; at most " + MAXOPS };
	const ops = [];
	for (const p of parts) {
		let m;
		if ((m = new RegExp("^get\\(\\s*\"?(" + KEY + ")\"?\\s*\\)$").exec(p))) ops.push({ op: "get", key: m[1] });
		else if ((m = new RegExp("^put\\(\\s*\"?(" + KEY + ")\"?\\s*(?:,\\s*\"?(" + KEY + ")\"?\\s*)?\\)$").exec(p))) ops.push({ op: "put", key: m[1], val: m[2] === undefined ? null : m[2] });
		else if ((m = new RegExp("^(?:remove|delete)\\(\\s*\"?(" + KEY + ")\"?\\s*\\)$").exec(p))) ops.push({ op: "remove", key: m[1] });
		else return { error: "\"ops\": can't read \"" + p + "\" (use get(k), put(k, v), remove(k))" };
	}
	return { ops: ops };
}

function isNum(s) { return /^-?\d+$/.test(s); }

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const k = parseKeys(config.keys || "");
	if (k.error) return [k.error];
	const o = parseOps(config.ops);
	if (o.error) return [o.error];
	const all = k.items.map(function(x) { return x.key; }).concat(o.ops.map(function(x) { return x.key; }));
	if (all.some(isNum) && !all.every(isNum)) return ["\"keys\"/\"ops\": mix of numbers and words; use one kind so keys compare sensibly"];
	const set = {};
	k.items.forEach(function(x) { set[x.key] = true; });
	let n = k.items.length;
	for (const x of o.ops) {
		if (x.op === "put" && !set[x.key]) { set[x.key] = true; n++; if (n > MAXN) return ["\"ops\": put(" + x.key + ") would make the tree bigger than " + MAXN + " nodes"]; }
		if (x.op === "remove" && set[x.key]) { delete set[x.key]; n--; }
	}
	return [];
}

// 1-based line numbers into CODE_LINES.
const CODE_LINES = [
	"Value get(Node* x, const Key& key) const {",   // 1
	"    if (x == nullptr) return Value();",        // 2
	"    if (key < x->key)",                        // 3
	"        return get(x->left, key);",            // 4
	"    else if (key > x->key)",                   // 5
	"        return get(x->right, key);",           // 6
	"    else return x->val;",                      // 7
	"}",                                            // 8
	"Node* put(Node* x, const Key& key,",           // 9
	"          const Value& val) {",                // 10
	"    if (x == nullptr)",                        // 11
	"        return new Node(key, val, 1);",        // 12
	"    if (key < x->key)",                        // 13
	"        x->left = put(x->left, key, val);",    // 14
	"    else if (key > x->key)",                   // 15
	"        x->right = put(x->right, key, val);",  // 16
	"    else x->val = val;",                       // 17
	"    x->size = 1 + size(x->left)",              // 18
	"                + size(x->right);",            // 19
	"    return x;",                                // 20
	"}",                                            // 21
	"Node* remove(Node* x, const Key& key) {",      // 22
	"    if (x == nullptr) return nullptr;",        // 23
	"    if (key < x->key)",                        // 24
	"        x->left = remove(x->left, key);",      // 25
	"    else if (key > x->key)",                   // 26
	"        x->right = remove(x->right, key);",    // 27
	"    else {",                                   // 28
	"        if (x->right == nullptr) {",           // 29
	"            Node* l = x->left;",               // 30
	"            delete x; return l;",              // 31
	"        }",                                    // 32
	"        if (x->left == nullptr) {",            // 33
	"            Node* r = x->right;",              // 34
	"            delete x; return r;",              // 35
	"        }",                                    // 36
	"        Node* t = x;",                         // 37
	"        x = min(t->right);  // successor",     // 38
	"        x->right = deleteMin(t->right);",      // 39
	"        x->left = t->left;",                   // 40
	"        delete t;",                            // 41
	"    }",                                        // 42
	"    x->size = 1 + size(x->left)",              // 43
	"                + size(x->right);",            // 44
	"    return x;",                                // 45
	"}"                                             // 46
];
const SECTIONS = { get: [1, 8], put: [9, 21], remove: [22, 46] };
const ORDER = ["get", "put", "remove"];

function lineMap(config) {
	const r = parseOps(config.ops || "");
	const used = {};
	(r.ops || []).forEach(function(o) { used[o.op] = true; });
	if (!r.ops) ORDER.forEach(function(k) { used[k] = true; });
	const map = {};
	let shown = 0;
	for (const name of ORDER) {
		const sec = SECTIONS[name];
		for (let l = sec[0]; l <= sec[1]; l++) map[l] = used[name] ? ++shown : 0;
	}
	return map;
}

export function code(config) {
	const map = lineMap(config);
	return { cpp: CODE_LINES.filter(function(_, i) { return map[i + 1] > 0; }) };
}

export const legend = [
	{ cls: "is-cmp", label: "x (node being compared)" },
	{ cls: "is-min", label: "Successor" },
	{ cls: "is-swap", label: "New / changed" },
	{ cls: "is-sorted", label: "Search hit" }
];

export const input = {
	key: "ops",
	label: "Operations",
	format: function(config) { return config.ops; },
	parse: function(text) {
		const r = parseOps(text);
		return r.error ? { error: r.error } : { value: text };
	},
	random: function(config) {
		const keys = parseKeys((config && config.keys) || "").items || [];
		const words = keys.length > 0 && !isNum(keys[0].key);
		const pick = function() {
			if (keys.length && Math.random() < 0.5) return keys[Math.floor(Math.random() * keys.length)].key;
			return words ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)] : String(Math.floor(Math.random() * 30 + 1));
		};
		return ["get(" + pick() + ")", "put(" + pick() + ")", "remove(" + pick() + ")"].join("; ");
	}
};

export function steps(config) {
	const start = parseKeys(config.keys || "").items;
	const ops = parseOps(config.ops).ops;
	const allKeys = start.map(function(x) { return x.key; }).concat(ops.map(function(x) { return x.key; }));
	const num = allKeys.every(isNum);
	const cmp = function(a, b) {
		if (num) return Number(a) - Number(b);
		return a < b ? -1 : a > b ? 1 : 0;
	};
	let nextId = 1;
	let root = null;
	let compares = 0;
	let result = "—";
	const frames = [];

	function mk(key, val) { return { id: nextId++, key: key, val: val, left: null, right: null }; }
	function silentPut(x, key, val) {
		if (!x) return mk(key, val);
		const c = cmp(key, x.key);
		if (c < 0) x.left = silentPut(x.left, key, val);
		else if (c > 0) x.right = silentPut(x.right, key, val);
		else x.val = val;
		return x;
	}
	start.forEach(function(s) { root = silentPut(root, s.key, s.val); });

	function count(x) { return x ? 1 + count(x.left) + count(x.right) : 0; }
	function height(x) { return x ? 1 + Math.max(height(x.left), height(x.right)) : 0; }

	// marks: { id: cls }; extra: { gone: {key, col, depth} } for a removed node drawn dashed.
	function snapshot(marks, extra) {
		const nodes = [], edges = [];
		let col = 0;
		(function walk(x, d, parent) {
			if (!x) return;
			walk(x.left, d + 1, x);
			nodes.push({ id: x.id, key: x.key, val: x.val, col: col++, depth: d, cls: (marks && marks[x.id]) || "" });
			walk(x.right, d + 1, x);
			if (parent) edges.push([parent.id, x.id]);
		})(root, 0, null);
		return { nodes: nodes, edges: edges, gone: extra && extra.gone ? extra.gone : null };
	}

	function push(f) {
		const s = snapshot(f.marks, f);
		frames.push({
			nodes: s.nodes, edges: s.edges, gone: s.gone,
			lines: f.lines || [], group: f.group, msg: f.msg,
			vars: [
				["key", f.key === undefined ? "—" : String(f.key)],
				["x", f.x ? String(f.x.key) : (f.xnull ? "nullptr" : "—")],
				["compares", String(compares)],
				["n", String(count(root))],
				["height", String(height(root))],
				["returned", result]
			]
		});
	}

	push({ group: 0, msg: root
		? "BST built by putting " + start.map(function(s) { return s.key; }).join(", ") + " in that order. Every key is larger than all keys in its left subtree and smaller than all keys in its right subtree."
		: "Empty BST (`root == nullptr`)." });

	function mark(id, c) { const m = {}; if (id) m[id] = c; return m; }

	// Walk down comparing `key`; returns { node, parent, dir } (node null on a miss).
	function descend(key, g, base, verb) {
		let x = root, parent = null, dir = null;
		if (!x) {
			push({ key: key, xnull: true, lines: [base.nil], group: g, msg: "`x == nullptr`: the tree is empty." });
			return { node: null, parent: null, dir: null };
		}
		while (x) {
			compares++;
			const c = cmp(key, x.key);
			if (c === 0) return { node: x, parent: parent, dir: dir };
			const go = c < 0 ? "left" : "right";
			push({ key: key, x: x, marks: mark(x.id, "is-cmp"), lines: c < 0 ? [base.lt, base.lt + 1] : [base.lt + 2, base.lt + 3], group: g,
				msg: "`" + key + "` " + (c < 0 ? "<" : ">") + " `" + x.key + "`: " + verb + " in the " + go + " subtree." });
			parent = x; dir = go;
			x = x[go];
		}
		push({ key: key, xnull: true, marks: mark(parent.id, "is-cmp"), lines: [base.nil], group: g,
			msg: "`" + parent.key + "`'s " + dir + " link is `nullptr`, so `" + key + "` is not in the tree." });
		return { node: null, parent: parent, dir: dir };
	}

	ops.forEach(function(o, idx) {
		const g = idx + 1;
		if (o.op === "get") {
			const before = compares;
			const r = descend(o.key, g, { nil: 2, lt: 3 }, "search");
			if (r.node) {
				result = r.node.val === null ? "val(" + r.node.key + ")" : String(r.node.val);
				push({ key: o.key, x: r.node, marks: mark(r.node.id, "is-sorted"), lines: [7], group: g,
					msg: "`" + o.key + "` == `" + r.node.key + "`: search hit after " + (compares - before) + " compare" + (compares - before === 1 ? "" : "s") + " (depth + 1)." });
			} else {
				result = "Value()";
				push({ key: o.key, xnull: true, lines: [2], group: g, msg: "Search miss: `get` returns `Value()` (a slide variant returns `nullptr` from a node-returning search)." });
			}
		} else if (o.op === "put") {
			const r = descend(o.key, g, { nil: 11, lt: 13 }, "insert");
			const val = o.val === null ? null : o.val;
			if (r.node) {
				const old = r.node.val;
				r.node.val = val;
				result = "—";
				push({ key: o.key, x: r.node, marks: mark(r.node.id, "is-swap"), lines: [17], group: g,
					msg: "`" + o.key + "` is already in the tree: update its value" + (val !== null ? " to " + val : "") + (old !== null ? " (was " + old + ")" : "") + ". No new node; the shape does not change." });
			} else {
				const nd = mk(o.key, val);
				if (!r.parent) root = nd; else r.parent[r.dir] = nd;
				result = "—";
				push({ key: o.key, x: nd, marks: mark(nd.id, "is-swap"), lines: [11, 12], group: g,
					msg: "`x == nullptr`: return `new Node(" + o.key + ", " + (val === null ? "val" : val) + ", 1)`" + (r.parent ? "; it becomes " + r.parent.key + "'s " + r.dir + " child" : "; it becomes the root") + "." });
				if (r.parent) {
					push({ key: o.key, marks: mark(nd.id, "is-swap"), lines: [18, 19, 20], group: g,
						msg: "On the way back up, each call resets its link (`x->left = …` / `x->right = …`) and recomputes `size`, then returns `x`." });
				}
			}
		} else {
			const r = descend(o.key, g, { nil: 23, lt: 24 }, "look");
			const x = r.node;
			if (!x) {
				result = "—";
				push({ key: o.key, xnull: true, lines: [23], group: g, msg: "Nothing to remove; the tree is unchanged." });
				return;
			}
			const link = function(child) { if (!r.parent) root = child; else r.parent[r.dir] = child; };
			push({ key: o.key, x: x, marks: mark(x.id, "is-cmp"), lines: [28], group: g,
				msg: "Found `" + x.key + "`. " + (!x.left && !x.right ? "Case 1: it is a leaf." : (!x.left || !x.right ? "Case 2: it has one child." : "Case 3: it has two children.")) });
			if (!x.left || !x.right) {
				const child = x.left || x.right;
				const lines = !x.right ? [29, 30, 31] : [33, 34, 35];
				link(child);
				result = String(x.key);
				const m = child ? mark(child.id, "is-swap") : {};
				push({ key: o.key, marks: m, lines: lines, group: g,
					msg: child
						? "Replace `" + x.key + "` with its only child `" + child.key + "` (the parent's link now points at it) and delete the node."
						: "Return `nullptr` to the parent: the leaf is simply deleted." });
				return;
			}
			// Case 3: successor = min of right subtree.
			let s = x.right, sp = x;
			const path = {}; path[x.id] = "is-cmp";
			path[s.id] = "is-min";
			push({ key: o.key, x: x, marks: Object.assign({}, path), lines: [37, 38], group: g,
				msg: "`t = x`. The successor is the smallest key in the right subtree: go right once to `" + s.key + "`, then left as far as possible." });
			while (s.left) {
				sp = s; s = s.left;
				const m = {}; m[x.id] = "is-cmp"; m[s.id] = "is-min";
				push({ key: o.key, x: x, marks: m, lines: [38], group: g, msg: "Go left to `" + s.key + "`." });
			}
			const sm = {}; sm[x.id] = "is-cmp"; sm[s.id] = "is-min";
			push({ key: o.key, x: x, marks: sm, lines: [38], group: g,
				msg: "`" + s.key + "` has no left child: it is the successor (next largest key after `" + x.key + "`)." +
					(s.right ? " Its right child `" + s.right.key + "` will move up into its place." : "") });
			// deleteMin(t->right): unlink s.
			if (sp === x) x.right = s.right; else sp.left = s.right;
			s.right = x.right;
			s.left = x.left;
			link(s);
			result = String(x.key);
			const fm = {}; fm[s.id] = "is-swap";
			push({ key: o.key, x: s, marks: fm, lines: [39, 40, 41], group: g,
				msg: "`x->right = deleteMin(t->right)`, `x->left = t->left`: `" + s.key + "` takes `" + x.key + "`'s place and `" + x.key + "` is deleted. Symmetric order still holds." });
		}
	});

	const map = lineMap(config);
	frames.forEach(function(f) { f.lines = f.lines.map(function(l) { return map[l]; }).filter(Boolean); });
	push({ group: ops.length, msg: "Done. In-order: " + (function() { const a = []; (function w(x) { if (!x) return; w(x.left); a.push(x.key); w(x.right); })(root); return a.length ? a.join(" ") : "(empty)"; })() +
		". Height " + height(root) + "; every operation walks one root-to-node path, so its cost is O(height)." });
	return frames;
}

// ---------- drawing ----------

const CSS = `
.vz-bst-wrap { overflow-x: auto; }
.vz-bst { display: block; margin: 0 auto; font-family: "Consolas", "Menlo", monospace; overflow: visible; }
.vz-bst .bst-edge { stroke: var(--vz-muted); stroke-width: 1.4; }
.vz-bst .bst-node circle { fill: var(--vz-surface); stroke: var(--vz-border); stroke-width: 1.6; transition: fill .3s, stroke .3s; }
.vz-bst .bst-node text { fill: var(--vz-ink); font-weight: 600; text-anchor: middle; dominant-baseline: central; font-size: 13px; }
.vz-bst .bst-node .bst-val { fill: var(--vz-blue); font-size: 10px; font-weight: 700; }
.vz-bst .bst-node.is-cmp circle { fill: var(--vz-cmp-bg); stroke: var(--vz-cmp-bd); stroke-width: 3; }
.vz-bst .bst-node.is-min circle { fill: var(--vz-min-bg); stroke: var(--vz-min-bd); stroke-width: 2.5; }
.vz-bst .bst-node.is-min text { fill: var(--vz-min-fg); }
.vz-bst .bst-node.is-swap circle { fill: var(--vz-swap-bg); stroke: var(--vz-swap-bd); stroke-width: 2.5; }
.vz-bst .bst-node.is-swap text { fill: var(--vz-swap-fg); }
.vz-bst .bst-node.is-sorted circle { fill: var(--vz-sorted-bg); stroke: var(--vz-sorted-bd); stroke-width: 2.5; }
.vz-bst .bst-node.is-sorted text { fill: var(--vz-sorted-fg); }
.vz-bst .bst-empty { fill: var(--vz-muted); font-size: 13px; text-anchor: middle; }
`;

function ensureCss() {
	if (document.getElementById("viz-bst-style")) return;
	const st = document.createElement("style");
	st.id = "viz-bst-style";
	st.textContent = CSS;
	document.head.appendChild(st);
}

const SVGNS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent) {
	const e = document.createElementNS(SVGNS, tag);
	for (const k in attrs) e.setAttribute(k, attrs[k]);
	if (parent) parent.appendChild(e);
	return e;
}

export function render(stage, frame) {
	ensureCss();
	const colW = 40, rowH = 52, pad = 22, R = 15;
	const cols = Math.max(frame.nodes.length, 1);
	const rows = frame.nodes.reduce(function(m, nd) { return Math.max(m, nd.depth + 1); }, 1);
	const W = Math.max(cols * colW + pad * 2, 200), H = rows * rowH + pad;
	stage.textContent = "";
	const wrap = document.createElement("div");
	wrap.className = "vz-bst-wrap";
	const svg = el("svg", { "class": "vz-bst", viewBox: "0 0 " + W + " " + H, width: W, role: "img", "aria-label": "binary search tree" });
	svg.style.maxWidth = "100%";
	svg.style.height = "auto";
	const pos = {};
	frame.nodes.forEach(function(nd) { pos[nd.id] = { x: pad + (nd.col + 0.5) * colW, y: pad + nd.depth * rowH }; });
	const gE = el("g", {}, svg), gN = el("g", {}, svg);
	frame.edges.forEach(function(e) {
		const a = pos[e[0]], b = pos[e[1]];
		el("line", { "class": "bst-edge", x1: a.x, y1: a.y, x2: b.x, y2: b.y }, gE);
	});
	frame.nodes.forEach(function(nd) {
		const g = el("g", { "class": "bst-node " + nd.cls }, gN);
		const p = pos[nd.id];
		el("circle", { cx: p.x, cy: p.y, r: R }, g);
		el("text", { x: p.x, y: p.y }, g).textContent = String(nd.key);
		if (nd.val !== null && nd.val !== undefined) {
			el("text", { "class": "bst-val", x: p.x + R + 1, y: p.y - R + 2 }, g).textContent = String(nd.val);
		}
	});
	if (!frame.nodes.length) el("text", { "class": "bst-empty", x: W / 2, y: H / 2 }, svg).textContent = "(empty tree)";
	wrap.appendChild(svg);
	stage.appendChild(wrap);
}

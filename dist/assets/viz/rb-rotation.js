// Red-black fix-up operations, one statement per step (Lecture 14):
// rotateLeft(h), rotateRight(h) and flipColors(h), alone or in the order put()
// runs them ("rotateRight, flipColors"), ending with put()'s
// `root->color = BLACK` when the root turned red. Nodes are filled with their
// colour (the colour of the link from the parent), the local pointers h and x
// are drawn as tags, and the in-between states are shown as they really are
// (after `h->right = x->left` two pointers share x's old left subtree, and the
// parent keeps pointing at h until the function returns x). The last step says
// whether the result is a legal LLRB again.
import { checkParams, tr } from "./_core.js?v=d245a77e9b";
import { treeView } from "./_tree.js?v=d245a77e9b";

const TOP = 0.6; // room above the root for the pointer tags
const OPS = ["rotateLeft", "rotateRight", "flipColors"];

// Default trees: states put() really reaches, so the result is a legal LLRB.
const DEFAULTS = {
	// One put(35) told in stages, with every subtree non-empty: the 3-node 30 40
	// below has just split (35 went up), so the 3-node 20 60 now holds 35 as well.
	"rotateLeft": { tree: "60, *20, 70, 10, *35, -, -, -, -, 30, 40", h: "20" }, // h red, under a parent, x->left = 30
	"rotateRight": { tree: "60, *35, 70, *20, 40, -, -, 10, 30" },                // x->right = 40, h black
	"rotateRight, flipColors": { tree: "60, *35, 70, *20, 40, -, -, 10, 30" },
	"flipColors": { tree: "35, *20, *60, 10, 30, 40, 70" },
	"rotateLeft(20), rotateRight(60), flipColors": { tree: "60, *20, 70, 10, *35, -, -, -, -, 30, 40" },
	// the whole put(35): bottom fix-ups at 30 / 40, then the same three one level up
	"rotateLeft(30), rotateRight(40), flipColors, rotateLeft(20), rotateRight(60), flipColors": { tree: "60, *20, 70, 10, 40, -, -, -, -, *30, -, -, -, -, -, -, -, -, -, -, *35" }
};

export const meta = {
	name: "rb-rotation",
	summary: "Red-black fix-ups statement by statement: rotateLeft / rotateRight / flipColors, alone or chained as put() runs them (then root->color = BLACK), with h / x pointer tags, red and black nodes, the real in-between states and a final LLRB check.",
	groupLabel: { en: "statement", zh: "语句" },
	params: {
		op: { type: "string", required: true, desc: "rotateLeft, rotateRight or flipColors, or several in put()'s order separated by commas (\"rotateRight, flipColors\"), at most 6. An op works on the node the previous one returned, or on the key in parentheses (\"rotateLeft(20), rotateRight(60), flipColors\")." },
		tree: { type: "string", default: "", desc: "Tree by heap positions (\"60, *20, 70, 10, *35, -, -, -, -, 30, 40\"): \"-\" = empty, \"*key\" = red (the link from its parent is red). Default: a state put() reaches for that op." },
		h: { type: "string", default: "", desc: "Key of the node passed as h to the first op. Default: the root (or the default tree's h)." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code panel: just the functions used." }
	},
	example: { op: "rotateRight, flipColors" }
};

const KEY = "[^\\s,;:()\"*\\-]{1,3}";

function parseOps(text) {
	const list = String(text || "").split(/\s*[,;]\s*/).map(function(s) { return s.trim(); }).filter(Boolean);
	if (!list.length) return { error: "\"op\" is empty" };
	if (list.length > 6) return { error: "\"op\": at most 6 operations" };
	const ops = [], at = [];
	for (const o of list) {
		const m = /^(\w+)(?:\(\s*([^()\s]{1,3})\s*\))?$/.exec(o);
		if (!m || OPS.indexOf(m[1]) < 0) return { error: "\"op\": unknown operation \"" + o + "\" (use rotateLeft, rotateRight, flipColors, optionally with h's key: rotateLeft(10))" };
		ops.push(m[1]); at.push(m[2] || "");
	}
	return { ops: ops, at: at };
}

function defaults(config) {
	const o = parseOps(config.op);
	if (o.error) return { tree: "" };
	return DEFAULTS[String(config.op).replace(/\s+/g, " ").trim()] || DEFAULTS[o.ops.join(", ")] || DEFAULTS[o.ops[0]];
}
function treeText(config) { return config.tree || defaults(config).tree; }
function hKey(config) { return config.h || (config.tree ? "" : defaults(config).h || ""); }

function parseTree(text) {
	const parts = String(text).split(/\s*[,，]\s*/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
	if (parts.length > 31) return { error: "\"tree\": at most 31 positions (5 levels)" };
	const slots = [null];
	const seen = {};
	let n = 0;
	for (let i = 0; i < parts.length; i++) {
		const s = parts[i];
		if (s === "-") { slots.push(null); continue; }
		const m = new RegExp("^(\\*?)(" + KEY + ")$").exec(s);
		if (!m) return { error: "\"tree\": can't read \"" + s + "\" (a key, *key for red, or -)" };
		const pos = i + 1;
		if (pos > 1 && !slots[Math.floor(pos / 2)]) return { error: "\"tree\": " + m[2] + " (position " + pos + ") has no parent" };
		if (seen[m[2]]) return { error: "\"tree\": key " + m[2] + " appears twice" };
		seen[m[2]] = true;
		slots.push({ key: m[2], red: !!m[1] });
		n++;
	}
	if (!n) return { error: "\"tree\" is empty" };
	if (n > 15) return { error: "\"tree\": at most 15 keys" };
	return { slots: slots };
}

function build(slots) {
	const nodes = {};
	const make = function(i) {
		if (i >= slots.length || !slots[i]) return null;
		const nd = { id: "n" + slots[i].key, key: slots[i].key, red: slots[i].red, left: null, right: null };
		nodes[nd.key] = nd;
		nd.left = make(2 * i);
		nd.right = make(2 * i + 1);
		return nd;
	};
	const root = make(1);
	return { root: root, nodes: nodes };
}

function findParent(root, target) {
	let res = null;
	(function w(x) {
		if (!x || res) return;
		if (x.left === target) res = { node: x, side: "left" };
		else if (x.right === target) res = { node: x, side: "right" };
		w(x.left); w(x.right);
	})(root);
	return res;
}

// LLRB rules on the whole tree; returns null when legal, else a reason key.
function llrbProblem(root) {
	const isRed = function(x) { return !!x && x.red; };
	let bad = null;
	let bh = -1;
	(function w(x, black) {
		if (bad) return;
		if (!x) { if (bh < 0) bh = black; else if (bh !== black) bad = "balance"; return; }
		if (isRed(x.right)) bad = "right";
		else if ((isRed(x) && isRed(x.left)) || (isRed(x.left) && isRed(x.right))) bad = "two";
		w(x.left, black + (x.red ? 0 : 1));
		w(x.right, black + (x.red ? 0 : 1));
	})(root, 0);
	if (!bad && root && root.red) bad = "root";
	return bad;
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const o = parseOps(config.op);
	if (o.error) return [o.error];
	const t = parseTree(treeText(config));
	if (t.error) return [t.error];
	try { run(config, null); } catch (e) { return [e.message]; }
	return [];
}

const CODE = {
	rotateLeft: [
		"Node* rotateLeft(Node* h) {",
		"    Node* x = h->right;",
		"    h->right = x->left;",
		"    x->left = h;",
		"    x->color = h->color;",
		"    h->color = RED;",
		"    return x;",
		"}"
	],
	rotateRight: [
		"Node* rotateRight(Node* h) {",
		"    Node* x = h->left;",
		"    h->left = x->right;",
		"    x->right = h;",
		"    x->color = h->color;",
		"    h->color = RED;",
		"    return x;",
		"}"
	],
	flipColors: [
		"void flipColors(Node* h) {",
		"    h->color = RED;",
		"    h->left->color = BLACK;",
		"    h->right->color = BLACK;",
		"}"
	]
};
const ROOT_LINE = "root->color = BLACK;   // in put()";

// The functions shown (each once, in first-use order) and where each starts.
function codeLayout(config) {
	const o = parseOps(config.op);
	const used = [];
	(o.ops || []).forEach(function(n) { if (used.indexOf(n) < 0) used.push(n); });
	const lines = [];
	const start = {};
	used.forEach(function(n, i) {
		if (i) lines.push("");
		start[n] = lines.length; // lines before the function's first line
		CODE[n].forEach(function(l) { lines.push(l); });
	});
	return { lines: lines, start: start };
}

export function code(config) {
	let lines = codeLayout(config).lines;
	try {
		if (run(config, null).rootLine) lines = lines.concat(["", ROOT_LINE]);
	} catch (e) { /* invalid config: validate() reports it */ }
	return { cpp: lines };
}

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-rbblack", label: T("Black (link from parent is black)", "黑（来自父节点的链接是黑的）") },
		{ cls: "is-rbred", label: T("Red (link from parent is red)", "红（来自父节点的链接是红的）") },
		{ cls: "is-rbchanged", label: T("Changed by this statement (ring)", "本语句改动的节点（外圈）") }
	];
}

export const input = {
	key: "tree",
	label: { en: "Tree (heap order, *key = red)", zh: "树（按堆序，*键 = 红）" },
	format: function(config) { return treeText(config); },
	parse: function(text) { const r = parseTree(text); return r.error ? { error: r.error } : { value: text }; },
	random: function(config) { return defaults(config || { op: "rotateLeft" }).tree; }
};

export function steps(config) {
	return run(config, tr(config)).frames;
}

// Runs the operations. T == null: dry run (validation / code panel), no frames.
function run(config, T) {
	const dry = !T;
	if (dry) T = function(en) { return en; };
	const parsed = parseOps(config.op);
	const ops = parsed.ops;
	const b = build(parseTree(treeText(config)).slots);
	let root = b.root;
	const hk = hKey(config);
	let h = parsed.at[0] ? b.nodes[parsed.at[0]] : hk ? b.nodes[hk] : root;
	parsed.at.forEach(function(k) { if (k && !b.nodes[k]) throw new Error("\"op\": key " + k + " is not in the tree"); });
	if (!h) throw new Error("\"h\": key " + hk + " is not in the tree");
	const frames = [];
	const tags = { h: h };
	let pos = {};
	let freeze = false;
	let x = null, L = "left", par = null;
	let group = 0;
	const cl = codeLayout(config);
	const lineOf = function(fn, k) { return cl.start[fn] + k; }; // k = 1-based line inside the function
	let rootLine = false;

	function layout() {
		const out = {};
		let col = 0;
		const swapIn = x && x[L] === h && (!par ? root === h : par.node[par.side] === h);
		(function walk(nd, d, from, side) {
			if (!nd) return;
			// draw x where h hangs (once x->L == h), but never substitute at x->L itself
			const atH = nd === h && (par ? from === par.node && side === par.side : from === null);
			const shown = swapIn && atH ? x : nd;
			walk(shown.left, d + 1, shown, "left");
			out[shown.id] = { col: col++, depth: d + TOP };
			walk(shown.right, d + 1, shown, "right");
		})(root, 0, null, null);
		return out;
	}

	function push(f) {
		if (dry) return;
		if (!freeze) pos = layout();
		const nodes = [], edges = [];
		const all = Object.keys(b.nodes).map(function(k) { return b.nodes[k]; });
		all.forEach(function(nd) {
			const p = pos[nd.id];
			if (!p) return;
			const role = (f.changed && f.changed.indexOf(nd) >= 0 ? "swap " : "") + (nd.red ? "rbred" : "rbblack");
			const tag = Object.keys(tags).filter(function(k) { return tags[k] === nd; }).join(", ");
			nodes.push({ id: nd.id, label: nd.key, col: p.col, depth: p.depth, role: role, tag: tag || undefined });
		});
		all.forEach(function(nd) {
			if (!pos[nd.id]) return;
			["left", "right"].forEach(function(side) {
				const c = nd[side];
				if (!c || !pos[c.id]) return;
				const isNew = f.newEdge && f.newEdge[0] === nd && f.newEdge[1] === side;
				edges.push({ from: nd.id, to: c.id, role: isNew ? "active" : (c.red ? "red" : "") });
			});
		});
		frames.push({ nodes: nodes, edges: edges, lines: f.lines || [], group: group, msg: f.msg,
			vars: [["h", h ? h.key + " (" + (h.red ? "RED" : "BLACK") + ")" : "—"], ["x", x ? x.key + " (" + (x.red ? "RED" : "BLACK") + ")" : "—"]] });
	}

	function describeStart(o) {
		if (o === "flipColors") {
			return h.left && h.right && h.left.red && h.right.red
				? T("`" + h.key + "` has two red children: a temporary 4-node (" + h.left.key + " " + h.key + " " + h.right.key + ").", "`" + h.key + "` 有两个红孩子：临时 4-节点（" + h.left.key + " " + h.key + " " + h.right.key + "）。")
				: "";
		}
		const c = h[o === "rotateRight" ? "left" : "right"];
		if (!c) return "";
		if (o === "rotateLeft") return T("`" + h.key + "`'s right link (to `" + c.key + "`) is " + (c.red ? "red" : "black") + (h.left && h.left.red ? "" : " and its left link is black") + ": it leans the wrong way.", "`" + h.key + "` 的右链接（指向 `" + c.key + "`）是" + (c.red ? "红" : "黑") + "的" + (h.left && h.left.red ? "" : "、左链接是黑的") + "：倾向错了。");
		return c.left ? T("`" + h.key + "` → `" + c.key + "` → `" + c.left.key + "` are two red left links in a row.", "`" + h.key + "` → `" + c.key + "` → `" + c.left.key + "` 是连续两条红色左链接。") : "";
	}
	const opName = function(o, i) { const k = parsed.at[i]; return o + "(" + (k || "h") + ")"; };

	push({ msg: (ops.length > 1
		? T("put() runs, from h = `" + h.key + "` upward: " + ops.map(opName).join(" → ") + ". ", "put() 从 h = `" + h.key + "` 往上依次执行：" + ops.map(opName).join(" → ") + "。")
		: T(ops[0] + "(h) with h = `" + h.key + "`. ", ops[0] + "(h)，h = `" + h.key + "`。")) + describeStart(ops[0]) });

	ops.forEach(function(o, oi) {
		if (oi > 0 && parsed.at[oi]) { h = b.nodes[parsed.at[oi]]; tags.h = h; }
		if (o === "flipColors") {
			if (!h.left || !h.right) throw new Error("flipColors needs both children of h (" + h.key + ")");
			const four = h.left.red && h.right.red;
			if (oi > 0) { group++; push({ msg: T("Next check in put(): both children of `" + h.key + "` are red → flipColors(h).", "put() 的下一项检查：`" + h.key + "` 的两个孩子都是红的 → flipColors(h)。") }); }
			const up = findParent(root, h);
			h.red = true; group++;
			push({ lines: [lineOf(o, 2)], changed: [h], msg: T("`h->color = RED;` — the link into `" + h.key + "` turns red: the middle key moves up " + (up ? "into `" + up.node.key + "`'s 2-3 node." : "(it's the root; put() blackens it again)."), "`h->color = RED;`——指向 `" + h.key + "` 的链接变红：中间键上移" + (up ? "，并入 `" + up.node.key + "` 所在的 2-3 节点。" : "（它是根，put() 会把它重新涂黑）。")) });
			h.left.red = false; group++;
			push({ lines: [lineOf(o, 3)], changed: [h.left], msg: T("`h->left->color = BLACK;` — `" + h.left.key + "` becomes a 2-node of its own.", "`h->left->color = BLACK;`——`" + h.left.key + "` 自成一个 2-节点。") });
			h.right.red = false; group++;
			push({ lines: [lineOf(o, 4)], changed: [h.right], msg: T("`h->right->color = BLACK;` — `" + h.right.key + "` too." + (four ? " The 4-node is split; no pointer moved." : ""), "`h->right->color = BLACK;`——`" + h.right.key + "` 也是。" + (four ? "4-节点分裂完成，没有移动任何指针。" : "")) });
			return;
		}
		const isL = o === "rotateLeft";
		L = isL ? "left" : "right";
		const R = isL ? "right" : "left";
		if (!h[R]) throw new Error(o + " needs h->" + R + " (h = " + h.key + " has no " + R + " child)");
		par = findParent(root, h);
		const otherWord = isL ? T("left", "左") : T("right", "右");
		const xWasRed = h[R].red;
		if (oi > 0) { group++; push({ msg: T("Next check in put() at `" + h.key + "` → " + o + "(h). ", "put() 在 `" + h.key + "` 的下一项检查 → " + o + "(h)。") + describeStart(o) }); }

		x = h[R]; tags.x = x; group++;
		push({ lines: [lineOf(o, 2)], msg: T("`Node* x = h->" + R + ";` — x points at `" + x.key + "`.", "`Node* x = h->" + R + ";`——x 指向 `" + x.key + "`。") });

		const mid = x[L];
		freeze = true;
		h[R] = mid; group++;
		const lo = isL ? h.key : x.key, hi = isL ? x.key : h.key;
		push({ lines: [lineOf(o, 3)], changed: [h], newEdge: mid ? [h, R] : null,
			msg: mid
				? T("`h->" + R + " = x->" + L + ";` — `" + mid.key + "` (keys between " + lo + " and " + hi + ") moves over to `" + h.key + "`. For now both `" + h.key + "` and `" + x.key + "` point at it, and `" + x.key + "` hangs only on the local variable x.",
					"`h->" + R + " = x->" + L + ";`——`" + mid.key + "`（介于 " + lo + " 和 " + hi + " 之间的键）挂到 `" + h.key + "` 下面。此刻 `" + h.key + "` 和 `" + x.key + "` 都指向它，而 `" + x.key + "` 只靠局部变量 x 抓着。")
				: T("`h->" + R + " = x->" + L + ";` — x->" + L + " is nullptr, so h->" + R + " becomes nullptr: `" + x.key + "` now hangs only on the local variable x.",
					"`h->" + R + " = x->" + L + ";`——x->" + L + " 是 nullptr，所以 h->" + R + " 变成 nullptr：`" + x.key + "` 只靠局部变量 x 抓着。") });

		x[L] = h;
		freeze = !!par; group++;
		push({ lines: [lineOf(o, 4)], changed: [x], newEdge: [x, L],
			msg: T("`x->" + L + " = h;` — `" + h.key + "` becomes `" + x.key + "`'s " + otherWord + " child" + (par ? ". The parent `" + par.node.key + "` still points at `" + h.key + "` until the function returns, so the drawing waits until then." : ", so `" + x.key + "` is drawn on top. Nothing points at `" + x.key + "` from above yet: put() stores the return value."),
				"`x->" + L + " = h;`——`" + h.key + "` 成为 `" + x.key + "` 的" + otherWord + "孩子" + (par ? "。父节点 `" + par.node.key + "` 仍指向 `" + h.key + "`，直到函数返回，所以图在那之前先不动。" : "，所以 `" + x.key + "` 画到上面。上面还没有指针指向 `" + x.key + "`：由 put() 保存返回值。")) });

		x.red = h.red; group++;
		push({ lines: [lineOf(o, 5)], changed: [x], msg: T("`x->color = h->color;` — `" + x.key + "` takes over h's old link and its color: " + (x.red ? "RED, because h was red (x is not always black)." : "BLACK (h's color, not a constant)."), "`x->color = h->color;`——`" + x.key + "` 接管 h 原来的链接和它的颜色：" + (x.red ? "红，因为 h 是红的（x 不一定是黑的）。" : "黑（这是 h 的颜色，不是写死的常量）。")) });

		h.red = true; group++;
		push({ lines: [lineOf(o, 6)], changed: [h], msg: T("`h->color = RED;` — the link from `" + x.key + "` down to `" + h.key + "` is the red link now, leaning " + otherWord + "." + (xWasRed && isL ? (x.red ? " The keys still form the same temporary 4-node." : " Same keys, same 2-3 node.") : ""), "`h->color = RED;`——现在从 `" + x.key + "` 到 `" + h.key + "` 的是红链接，" + otherWord + "倾。" + (xWasRed && isL ? (x.red ? "这些键仍是同一个临时 4-节点。" : "键相同，2-3 节点也相同。") : "")) });

		if (par) par.node[par.side] = x; else root = x;
		freeze = false; group++;
		const ret = x;
		push({ lines: [lineOf(o, 7)], changed: [x], newEdge: par ? [par.node, par.side] : null,
			msg: par
				? T("`return x;` — put() writes `h = " + o + "(h);`, so `" + par.node.key + "` now points at `" + x.key + "`. Three pointers changed, in-order is unchanged.", "`return x;`——put() 写的是 `h = " + o + "(h);`，于是 `" + par.node.key + "` 改为指向 `" + x.key + "`。改了三个指针，中序不变。")
				: T("`return x;` — put() writes `h = " + o + "(h);`: `" + x.key + "` is the new root of this subtree. Three pointers changed, in-order is unchanged.", "`return x;`——put() 写的是 `h = " + o + "(h);`：`" + x.key + "` 成为这棵子树的新根。改了三个指针，中序不变。") });
		h = ret; par = null; x = null;
		delete tags.x; tags.h = h;
	});

	if (root.red) {
		root.red = false; rootLine = true; group++;
		push({ lines: [cl.lines.length + 2], changed: [root], msg: T("Back in put(): `root->color = BLACK;` — the root is always black.", "回到 put()：`root->color = BLACK;`——根永远是黑的。") });
	}
	const prob = llrbProblem(root);
	const why = {
		right: T("a red link still leans right", "仍有右倾的红链接"),
		two: T("a node still touches two red links", "仍有节点连着两条红链接"),
		balance: T("black links per path differ", "各路径黑链接数不同"),
		root: T("the root is red", "根是红的")
	};
	push({ msg: prob
		? T("Result: not a legal LLRB yet — " + why[prob] + ". In put() the next check (or one a level further up) fixes it.", "结果：还不是合法的 LLRB——" + why[prob] + "。put() 的下一项检查（或上一层的检查）会修正它。")
		: T("Result: a legal LLRB again — red links lean left, no node touches two red links, every path has the same number of black links.", "结果：又是一棵合法的 LLRB——红链接左倾、没有节点连着两条红链接、每条路径的黑链接数相同。") });

	if (!dry) {
		const cols = frames.reduce(function(m, f) { return Math.max(m, f.nodes.length); }, 1);
		const rows = frames.reduce(function(m, f) { return f.nodes.reduce(function(r, nd) { return Math.max(r, nd.depth + 1); }, m); }, 1);
		frames.forEach(function(f) { f.cols = cols; f.rows = rows; });
	}
	return { frames: frames, rootLine: rootLine, problem: prob };
}

export function render(stage, frame) {
	treeView(stage).update({ nodes: frame.nodes, edges: frame.edges, cols: frame.cols, rows: frame.rows });
}

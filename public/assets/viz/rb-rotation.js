// Red-black fix-up operations, one statement per step (Lecture 14):
// rotateLeft(h), rotateRight(h) and flipColors(h). Nodes are filled with their
// colour (the colour of the link from the parent), the local pointers h and x
// are drawn as tags, and the in-between states are shown as they really are
// (after `h->right = x->left` two pointers share x's old left subtree, and the
// parent keeps pointing at h until the function returns x).
import { checkParams, tr } from "./_core.js";
import { treeView } from "./_tree.js";

const TOP = 0.6; // room above the root for the pointer tags

const DEFAULTS = {
	rotateLeft: "E, A, *S, -, -, H, X",
	rotateRight: "S, *E, X, A, H",
	flipColors: "E, *A, *S"
};

export const meta = {
	name: "rb-rotation",
	summary: "One red-black fix-up, statement by statement: rotateLeft(h), rotateRight(h) or flipColors(h), with h / x pointer tags, red and black nodes, and the real in-between states.",
	groupLabel: { en: "statement", zh: "语句" },
	params: {
		op: { type: "enum", values: ["rotateLeft", "rotateRight", "flipColors"], required: true, desc: "Which operation to step through." },
		tree: { type: "string", default: "", desc: "Tree by heap positions (\"E, A, *S, -, -, H, X\"): \"-\" = empty, \"*key\" = red (the link from its parent is red). Default: a small example for the op." },
		h: { type: "string", default: "", desc: "Key of the node passed as h. Default: the root." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code panel: just this function." }
	},
	example: { op: "rotateLeft" }
};

export const input = {
	key: "tree",
	label: { en: "Tree (heap order, *key = red)", zh: "树（按堆序，*键 = 红）" },
	format: function(config) { return config.tree || DEFAULTS[config.op] || ""; },
	parse: function(text) { const r = parseTree(text); return r.error ? { error: r.error } : { value: text }; },
	random: function(config) { return DEFAULTS[(config && config.op) || "rotateLeft"]; }
};

const KEY = "[^\\s,;:()\"*\\-]{1,3}";

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
	const make = function(i, parent, side) {
		if (i >= slots.length || !slots[i]) return null;
		const nd = { id: "n" + slots[i].key, key: slots[i].key, red: slots[i].red, left: null, right: null };
		nodes[nd.key] = nd;
		nd.left = make(2 * i, nd, "left");
		nd.right = make(2 * i + 1, nd, "right");
		return nd;
	};
	const root = make(1, null, null);
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

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const t = parseTree(config.tree || DEFAULTS[config.op] || "");
	if (t.error) return [t.error];
	const b = build(t.slots);
	const h = config.h ? b.nodes[config.h] : b.root;
	if (!h) return ["\"h\": key " + config.h + " is not in the tree"];
	if (config.op === "rotateLeft" && !h.right) return ["rotateLeft needs h->right (h = " + h.key + " has no right child)"];
	if (config.op === "rotateRight" && !h.left) return ["rotateRight needs h->left (h = " + h.key + " has no left child)"];
	if (config.op === "flipColors" && (!h.left || !h.right)) return ["flipColors needs both children of h (" + h.key + ")"];
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

export function code(config) { return { cpp: CODE[config.op] }; }

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-rbblack", label: T("Black (link from parent is black)", "黑（来自父节点的链接是黑的）") },
		{ cls: "is-rbred", label: T("Red (link from parent is red)", "红（来自父节点的链接是红的）") },
		{ cls: "is-rbchanged", label: T("Changed by this statement (ring)", "本语句改动的节点（外圈）") }
	];
}

export function steps(config) {
	const T = tr(config);
	const op = config.op;
	const slots = parseTree(config.tree || DEFAULTS[op]).slots;
	const b = build(slots);
	let root = b.root;
	const h = config.h ? b.nodes[config.h] : root;
	const par = findParent(root, h); // { node, side } or null
	const frames = [];
	const tags = {};
	let pos = {};          // id -> {col, depth} of the last laid-out frame
	let freeze = false;    // keep positions while the pointers don't form a tree
	let x = null;
	const L = op === "rotateRight" ? "right" : "left";   // the side x ends up holding h
	const R = op === "rotateRight" ? "left" : "right";   // the side h's child x hangs on

	const colorName = function(nd) { return nd.red ? T("RED", "RED（红）") : T("BLACK", "BLACK（黑）"); };

	// Lay out the tree the reader should see: the real tree from the root, except
	// that once x has taken h's place (x->L == h) we draw x where h was.
	function layout() {
		const out = {};
		let col = 0;
		let top = root;
		const swapIn = x && x[L] === h && (!par ? root === h : par.node[par.side] === h);
		(function walk(nd, d, from, side) {
			if (!nd) return;
			// substitute x only where h hangs from its parent (or is the root), not at x->L
			const atH = nd === h && (par ? from === par.node && side === par.side : from === null);
			const shown = swapIn && atH ? x : nd;
			walk(shown.left, d + 1, shown, "left");
			out[shown.id] = { col: col++, depth: d + TOP };
			walk(shown.right, d + 1, shown, "right");
		})(top, 0, null, null);
		return out;
	}

	function push(f) {
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
		frames.push({ nodes: nodes, edges: edges, lines: f.lines || [], group: f.group || 0, msg: f.msg,
			vars: [["h", h.key + " (" + (h.red ? "RED" : "BLACK") + ")"], ["x", x ? x.key + " (" + (x.red ? "RED" : "BLACK") + ")" : "—"]] });
	}

	tags.h = h;
	if (op === "flipColors") {
		const four = h.left.red && h.right.red;
		push({ msg: four ? T("flipColors(h) with h = `" + h.key + "`: both children are red — a temporary 4-node (" + h.left.key + " " + h.key + " " + h.right.key + ").",
			"flipColors(h)，h = `" + h.key + "`：两个孩子都是红的——一个临时 4-节点（" + h.left.key + " " + h.key + " " + h.right.key + "）。")
			: T("flipColors(h) with h = `" + h.key + "`. (In an LLRB it is only called when both children are red.)", "flipColors(h)，h = `" + h.key + "`。（在 LLRB 中只有两个孩子都红时才会调用它。）") });
		h.red = true;
		push({ lines: [2], group: 1, changed: [h], msg: T("`h->color = RED;` — the link into `" + h.key + "` turns red: the middle key joins its parent's 2-3 node." + (h === root ? " (h is the root here; put() makes the root black again afterwards.)" : ""),
			"`h->color = RED;`——指向 `" + h.key + "` 的链接变红：中间键并入父节点的 2-3 节点。" + (h === root ? "（这里 h 是根；put() 之后会把根重新涂黑。）" : "")) });
		h.left.red = false;
		push({ lines: [3], group: 2, changed: [h.left], msg: T("`h->left->color = BLACK;` — `" + h.left.key + "` becomes a 2-node of its own.", "`h->left->color = BLACK;`——`" + h.left.key + "` 自成一个 2-节点。") });
		h.right.red = false;
		push({ lines: [4], group: 3, changed: [h.right], msg: T("`h->right->color = BLACK;` — `" + h.right.key + "` too. The 4-node is split; no pointer moved, and every path still has the same number of black links.",
			"`h->right->color = BLACK;`——`" + h.right.key + "` 也是。4-节点分裂完成：没有移动任何指针，每条路径上的黑链接数也不变。") });
		return finish(frames);
	}

	const dirWord = op === "rotateLeft" ? T("right", "右") : T("left", "左");
	const otherWord = op === "rotateLeft" ? T("left", "左") : T("right", "右");
	const xc = h[R];
	const xWasRed = xc.red;
	push({ msg: T(op + "(h) with h = `" + h.key + "`: its " + dirWord + " link (to `" + xc.key + "`) is " + (xc.red ? "red" : "black") + "; turn it into a " + otherWord + "-leaning link.",
		op + "(h)，h = `" + h.key + "`：它的" + dirWord + "链接（指向 `" + xc.key + "`）是" + (xc.red ? "红" : "黑") + "的；要把它变成" + otherWord + "倾链接。") });

	x = h[R]; tags.x = x;
	push({ lines: [2], group: 1, msg: T("`Node* x = h->" + R + ";` — x points at `" + x.key + "`.", "`Node* x = h->" + R + ";`——x 指向 `" + x.key + "`。") });

	const mid = x[L];
	freeze = true; // the next state is not a tree: x is held only by the local variable
	h[R] = mid;
	push({ lines: [3], group: 2, changed: [h], newEdge: mid ? [h, R] : null,
		msg: mid
			? T("`h->" + R + " = x->" + L + ";` — `" + mid.key + "` (keys between `" + (op === "rotateLeft" ? h.key : x.key) + "` and `" + (op === "rotateLeft" ? x.key : h.key) + "`) moves over to `" + h.key + "`. For now both `" + h.key + "` and `" + x.key + "` point at it, and `" + x.key + "` hangs only on the local variable x.",
				"`h->" + R + " = x->" + L + ";`——`" + mid.key + "`（介于 `" + (op === "rotateLeft" ? h.key : x.key) + "` 和 `" + (op === "rotateLeft" ? x.key : h.key) + "` 之间的键）挂到 `" + h.key + "` 下面。此刻 `" + h.key + "` 和 `" + x.key + "` 都指向它，而 `" + x.key + "` 只靠局部变量 x 抓着。")
			: T("`h->" + R + " = x->" + L + ";` — x->" + L + " is nullptr, so h->" + R + " becomes nullptr: `" + x.key + "` now hangs only on the local variable x.",
				"`h->" + R + " = x->" + L + ";`——x->" + L + " 是 nullptr，所以 h->" + R + " 变成 nullptr：`" + x.key + "` 只靠局部变量 x 抓着。") });

	x[L] = h;
	// Root case: x is the new top right away. Below a parent, the parent still points
	// at h, so keep the drawing still until `return x` re-links it (no crossing lines).
	freeze = !!par;
	push({ lines: [4], group: 3, changed: [x], newEdge: [x, L],
		msg: T("`x->" + L + " = h;` — `" + h.key + "` becomes `" + x.key + "`'s " + otherWord + " child" + (par ? ". " : ", so `" + x.key + "` is drawn on top. ") + (par ? "The parent `" + par.node.key + "` still points at `" + h.key + "` until the function returns, so the drawing waits until then." : "Nothing points at `" + x.key + "` from above yet: the caller stores the return value."),
			"`x->" + L + " = h;`——`" + h.key + "` 成为 `" + x.key + "` 的" + otherWord + "孩子" + (par ? "。" : "，所以 `" + x.key + "` 画到上面。") + (par ? "父节点 `" + par.node.key + "` 仍指向 `" + h.key + "`，直到函数返回，所以图在那之前先不动。" : "上面还没有指针指向 `" + x.key + "`：由调用者保存返回值。")) });

	x.red = h.red;
	push({ lines: [5], group: 4, changed: [x], msg: T("`x->color = h->color;` — `" + x.key + "` takes over h's old link and its color: " + colorName(x) + ".", "`x->color = h->color;`——`" + x.key + "` 接管 h 原来的链接和它的颜色：" + colorName(x) + "。") });

	h.red = true;
	push({ lines: [6], group: 5, changed: [h], msg: T("`h->color = RED;` — the link from `" + x.key + "` down to `" + h.key + "` is the red link now, leaning " + otherWord + "." + (xWasRed ? " Same keys, same 2-3 node." : ""), "`h->color = RED;`——现在从 `" + x.key + "` 到 `" + h.key + "` 的是红链接，" + otherWord + "倾。" + (xWasRed ? "键相同，2-3 节点也相同。" : "")) });

	if (par) par.node[par.side] = x; else root = x;
	freeze = false;
	push({ lines: [7], group: 6, changed: [x], newEdge: par ? [par.node, par.side] : null,
		msg: par
			? T("`return x;` — the caller writes `h = " + op + "(h);`, so `" + par.node.key + "` now points at `" + x.key + "`. Three pointers changed, in-order is unchanged.", "`return x;`——调用者写 `h = " + op + "(h);`，于是 `" + par.node.key + "` 改为指向 `" + x.key + "`。改了三个指针，中序不变。")
			: T("`return x;` — the caller writes `h = " + op + "(h);`: `" + x.key + "` is the new root of this subtree. Three pointers changed, in-order is unchanged.", "`return x;`——调用者写 `h = " + op + "(h);`：`" + x.key + "` 成为这棵子树的新根。改了三个指针，中序不变。") });
	return finish(frames);

	function finish(fr) {
		const cols = fr.reduce(function(m, f) { return Math.max(m, f.nodes.length); }, 1);
		const rows = fr.reduce(function(m, f) { return f.nodes.reduce(function(r, nd) { return Math.max(r, nd.depth + 1); }, m); }, 1);
		fr.forEach(function(f) { f.cols = cols; f.rows = rows; });
		return fr;
	}
}

export function render(stage, frame) {
	treeView(stage).update({ nodes: frame.nodes, edges: frame.edges, cols: frame.cols, rows: frame.rows });
}

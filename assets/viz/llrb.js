// Left-leaning red-black BST (Lecture 14): put(k) with the three fix-ups on
// the way back up (rotate left, rotate right, flip colors), get(k), and
// check(), which tests a given tree against the LLRB definition. Red links
// are drawn red. The "2-3 view" draws every red child on its parent's level
// (red links horizontal), which is the 2-3 tree the LLRB encodes.
import { checkParams, tr } from "./_core.js?v=f4afb4f310";
import { treeView } from "./_tree.js?v=f4afb4f310";

const MAXN = 15;
const MAXOPS = 12;

export const meta = {
	name: "llrb",
	summary: "Left-leaning red-black BST: put(k) with rotateLeft / rotateRight / flipColors on the way up, get(k), and check() of the LLRB rules on a given tree; switchable LLRB / 2-3 (horizontal red links) view.",
	groupLabel: { en: "operation", zh: "操作" },
	switch: { key: "view", label: { en: "View", zh: "视图" }, options: [
		{ value: "llrb", label: { en: "LLRB", zh: "LLRB" } },
		{ value: "23", label: { en: "2-3 view (red links flat)", zh: "2-3 视图（红链接放平）" } }
	] },
	params: {
		keys: { type: "string", default: "", desc: "Starting tree: keys put in this order (with the LLRB put), comma-separated, 1–3 characters, distinct, at most 15." },
		tree: { type: "string", default: "", desc: "Starting tree given by heap positions instead (\"C, *A, Y, -, -, H\"): \"-\" = empty, a \"*\" before a key = the link from its parent is red. Not with keys." },
		ops: { type: "string", default: "", desc: "Operations separated by ';': put(k), get(k), check(). At most 12. Empty = just show the tree." },
		view: { type: "enum", values: ["llrb", "23"], default: "llrb", desc: "llrb = ordinary BST drawing; 23 = red children drawn on their parent's level." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code panel." }
	},
	example: { ops: "put(S); put(E); put(A); put(R); put(C); put(H)" }
};

const KEY = "[^\\s,;:()\"*\\-]{1,3}";

function splitItems(text) {
	return String(text).split(/\s*[,，]\s*/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
}

function parseKeys(text) {
	const out = [];
	for (const s of splitItems(text)) {
		if (!new RegExp("^" + KEY + "$").test(s)) return { error: "\"keys\": can't read \"" + s + "\" (use 1–3 character keys)" };
		if (out.indexOf(s) >= 0) return { error: "\"keys\": key " + s + " appears twice" };
		out.push(s);
	}
	if (out.length > MAXN) return { error: "\"keys\" has " + out.length + " keys; at most " + MAXN };
	return { items: out };
}

function parseTree(text) {
	const parts = splitItems(text);
	if (parts.length > 31) return { error: "\"tree\": at most 31 positions (5 levels)" };
	const slots = [null];
	const seen = {};
	let n = 0;
	for (let i = 0; i < parts.length; i++) {
		const s = parts[i];
		if (s === "-") { slots.push(null); continue; }
		const m = new RegExp("^(\\*?)(" + KEY + ")$").exec(s);
		if (!m) return { error: "\"tree\": can't read \"" + s + "\" (a key, *key for a red link, or -)" };
		const pos = i + 1;
		if (pos > 1 && !slots[Math.floor(pos / 2)]) return { error: "\"tree\": " + m[2] + " (position " + pos + ") has no parent" };
		if (pos === 1 && m[1]) return { error: "\"tree\": the root has no parent link, so it can't be red" };
		if (seen[m[2]]) return { error: "\"tree\": key " + m[2] + " appears twice" };
		seen[m[2]] = true;
		slots.push({ key: m[2], red: !!m[1] });
		n++;
	}
	if (n > MAXN) return { error: "\"tree\" has " + n + " keys; at most " + MAXN };
	return { slots: slots };
}

function parseOps(text) {
	const parts = String(text || "").split(";").map(function(s) { return s.trim(); }).filter(Boolean);
	if (parts.length > MAXOPS) return { error: "\"ops\" has " + parts.length + " operations; at most " + MAXOPS };
	const ops = [];
	for (const p of parts) {
		let m;
		if ((m = new RegExp("^put\\(\\s*\"?(" + KEY + ")\"?\\s*\\)$").exec(p))) ops.push({ op: "put", key: m[1] });
		else if ((m = new RegExp("^get\\(\\s*\"?(" + KEY + ")\"?\\s*\\)$").exec(p))) ops.push({ op: "get", key: m[1] });
		else if (/^check\(\s*\)$/.test(p)) ops.push({ op: "check" });
		else return { error: "\"ops\": can't read \"" + p + "\" (use put(k), get(k), check())" };
	}
	return { ops: ops };
}

function isNum(s) { return /^-?\d+$/.test(s); }

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	if (config.keys && config.tree) return ["use either \"keys\" or \"tree\", not both"];
	const k = parseKeys(config.keys || "");
	if (k.error) return [k.error];
	const t = parseTree(config.tree || "");
	if (t.error) return [t.error];
	const o = parseOps(config.ops);
	if (o.error) return [o.error];
	const all = k.items.concat(t.slots.filter(Boolean).map(function(s) { return s.key; }))
		.concat(o.ops.filter(function(x) { return x.key; }).map(function(x) { return x.key; }));
	if (all.some(isNum) && !all.every(isNum)) return ["\"keys\"/\"tree\"/\"ops\": mix of numbers and words; use one kind"];
	const set = {};
	all.forEach(function(x) { set[x] = true; });
	if (Object.keys(set).length > MAXN) return ["the tree would grow past " + MAXN + " keys"];
	return [];
}

const CODE_LINES = [
	"void put(const Key& key, const Value& val) {", // 1
	"    root = put(root, key, val);",               // 2
	"    root->color = BLACK;",                      // 3
	"}",                                             // 4
	"Node* put(Node* h, const Key& key,",            // 5
	"          const Value& val) {",                 // 6
	"    if (h == nullptr)",                         // 7
	"        return new Node(key, val, RED, 1);",    // 8
	"    if (key < h->key)",                         // 9
	"        h->left = put(h->left, key, val);",     // 10
	"    else if (key > h->key)",                    // 11
	"        h->right = put(h->right, key, val);",   // 12
	"    else h->val = val;",                        // 13
	"    if (isRed(h->right) && !isRed(h->left))",   // 14
	"        h = rotateLeft(h);",                    // 15
	"    if (isRed(h->left) && isRed(h->left->left))", // 16
	"        h = rotateRight(h);",                   // 17
	"    if (isRed(h->left) && isRed(h->right))",    // 18
	"        flipColors(h);",                        // 19
	"    h->size = size(h->left)",                   // 20
	"              + size(h->right) + 1;",           // 21
	"    return h;",                                 // 22
	"}",                                             // 23
	"Node* rotateLeft(Node* h) {",                   // 24
	"    Node* x = h->right;",                       // 25
	"    h->right = x->left;",                       // 26
	"    x->left = h;",                              // 27
	"    x->color = h->color;",                      // 28
	"    h->color = RED;",                           // 29
	"    return x;",                                 // 30
	"}",                                             // 31
	"Node* rotateRight(Node* h) {",                  // 32
	"    Node* x = h->left;",                        // 33
	"    h->left = x->right;",                       // 34
	"    x->right = h;",                             // 35
	"    x->color = h->color;",                      // 36
	"    h->color = RED;",                           // 37
	"    return x;",                                 // 38
	"}",                                             // 39
	"void flipColors(Node* h) {",                    // 40
	"    h->color = RED;",                           // 41
	"    h->left->color = BLACK;",                   // 42
	"    h->right->color = BLACK;",                  // 43
	"}",                                             // 44
	"Value get(Node* x, const Key& key) const {",    // 45
	"    while (x != nullptr) {",                    // 46
	"        if (key < x->key) x = x->left;",        // 47
	"        else if (key > x->key) x = x->right;",  // 48
	"        else return x->val;",                   // 49
	"    }",                                         // 50
	"    return Value{};",                           // 51
	"}"                                              // 52
];
const SECTIONS = { put: [1, 44], get: [45, 52] };

function lineMap(config) {
	const r = parseOps(config.ops || "");
	const used = {};
	(r.ops || []).forEach(function(o) { used[o.op] = true; });
	if (!r.ops || !used.get) used.put = true; // check-only / empty demos still show put
	const map = {};
	let shown = 0;
	for (const name of ["put", "get"]) {
		const sec = SECTIONS[name];
		for (let l = sec[0]; l <= sec[1]; l++) map[l] = used[name] ? ++shown : 0;
	}
	return map;
}

export function code(config) {
	const map = lineMap(config);
	return { cpp: CODE_LINES.filter(function(_, i) { return map[i + 1] > 0; }) };
}

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("h (node being compared / fixed)", "h（正在比较 / 修正的节点）") },
		{ cls: "is-swap", label: T("Changed by the last step", "上一步改动的节点") },
		{ cls: "is-sorted", label: T("Search hit / rule holds", "查找命中 / 规则成立") },
		{ cls: "is-min", label: T("Rule broken here", "此处违反规则") }
	];
}

export const input = {
	key: "ops",
	label: { en: "Operations", zh: "操作" },
	format: function(config) { return config.ops; },
	parse: function(text) {
		const r = parseOps(text);
		return r.error ? { error: r.error } : { value: text };
	},
	random: function() {
		const pool = "ACEHLMPRSX".split("");
		for (let i = pool.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [pool[i], pool[k]] = [pool[k], pool[i]]; }
		return pool.slice(0, 7).map(function(k) { return "put(" + k + ")"; }).join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const flat = config.view === "23";
	const startKeys = parseKeys(config.keys || "").items;
	const slots = parseTree(config.tree || "").slots;
	const ops = parseOps(config.ops).ops;
	const allKeys = startKeys.concat(slots.filter(Boolean).map(function(s) { return s.key; })).concat(ops.filter(function(o) { return o.key; }).map(function(o) { return o.key; }));
	const num = allKeys.length > 0 && allKeys.every(isNum);
	const cmp = function(a, b) { if (num) return Number(a) - Number(b); return a < b ? -1 : a > b ? 1 : 0; };
	const isRed = function(x) { return !!x && x.red; };

	let nextId = 1;
	let root = null;
	let rotations = 0, flips = 0;
	let result = "—";
	const frames = [];

	function mk(key) { return { id: "n" + nextId++, key: key, left: null, right: null, red: true }; }

	// ---- silent LLRB put (for "keys") ----
	function rotL(h) { const x = h.right; h.right = x.left; x.left = h; x.red = h.red; h.red = true; return x; }
	function rotR(h) { const x = h.left; h.left = x.right; x.right = h; x.red = h.red; h.red = true; return x; }
	function flip(h) { h.red = true; h.left.red = false; h.right.red = false; }
	function silentPut(h, key) {
		if (!h) return mk(key);
		const c = cmp(key, h.key);
		if (c < 0) h.left = silentPut(h.left, key); else if (c > 0) h.right = silentPut(h.right, key);
		if (isRed(h.right) && !isRed(h.left)) h = rotL(h);
		if (isRed(h.left) && isRed(h.left.left)) h = rotR(h);
		if (isRed(h.left) && isRed(h.right)) flip(h);
		return h;
	}
	if (startKeys.length) {
		startKeys.forEach(function(k) { root = silentPut(root, k); root.red = false; });
	} else if (slots.length > 1) {
		const build = function(i) {
			if (i >= slots.length || !slots[i]) return null;
			const nd = mk(slots[i].key);
			nd.red = slots[i].red;
			nd.left = build(2 * i);
			nd.right = build(2 * i + 1);
			return nd;
		};
		root = build(1);
	}

	function count(x) { return x ? 1 + count(x.left) + count(x.right) : 0; }
	function height(x) { return x ? 1 + Math.max(height(x.left), height(x.right)) : 0; }
	function blackHeight(x) { let b = 0; while (x) { if (!x.red) b++; x = x.left; } return b; }

	function snapshot(marks, edgeMarks) {
		const nodes = [], edges = [];
		let col = 0;
		(function walk(x, d, bd, parent) {
			if (!x) return;
			const myDepth = flat ? (parent && x.red ? bd : bd + (parent ? 1 : 0)) : d;
			walk(x.left, d + 1, myDepth, x);
			nodes.push({ id: x.id, key: x.key, col: col++, depth: myDepth, cls: (marks && marks[x.id]) || "" });
			walk(x.right, d + 1, myDepth, x);
			if (parent) {
				const em = edgeMarks && edgeMarks[x.id];
				edges.push({ from: parent.id, to: x.id, role: x.red ? "red" : (em || "") });
			}
		})(root, 0, 0, null);
		return { nodes: nodes, edges: edges };
	}

	function push(f) {
		const s = snapshot(f.marks, f.edgeMarks);
		frames.push({
			nodes: s.nodes, edges: s.edges,
			lines: f.lines || [], group: f.group, msg: f.msg,
			vars: [
				["key", f.key === undefined ? "—" : String(f.key)],
				["h", f.h ? String(f.h.key) : "—"],
				[T("rotations", "旋转次数"), String(rotations)],
				[T("flips", "颜色翻转"), String(flips)],
				[T("height", "高度"), String(height(root))],
				[T("black height", "黑高"), String(blackHeight(root))],
				[T("returned", "返回值"), result]
			]
		});
	}
	function mark(id, c) { const m = {}; if (id) m[id] = c; return m; }
	function marks2(a, ca, b, cb) { const m = {}; if (a) m[a.id] = ca; if (b) m[b.id] = cb; return m; }

	if (!ops.length || root) {
		push({ group: 0, msg: root
			? (startKeys.length
				? T("LLRB built by putting " + startKeys.join(", ") + " in that order. Red links are drawn red." + (flat ? " Red children sit on their parent's level: each group joined by a red link is one 3-node." : ""),
					"依次 put " + startKeys.join("、") + " 建成的 LLRB，红链接画成红色。" + (flat ? "红色孩子画在父节点同一层：被红链接连起来的一组就是一个 3-节点。" : ""))
				: T("The given tree. Red links are drawn red." + (flat ? " Red children sit on their parent's level." : ""),
					"给定的树，红链接画成红色。" + (flat ? "红色孩子画在父节点同一层。" : "")))
			: T("Empty tree (`root == nullptr`).", "空树（`root == nullptr`）。") });
	}

	ops.forEach(function(o, idx) {
		const g = idx + 1;
		if (o.op === "get") {
			let x = root, c = 0;
			while (x) {
				const r = cmp(o.key, x.key); c++;
				if (r === 0) break;
				push({ key: o.key, h: x, marks: mark(x.id, "is-cmp"), lines: r < 0 ? [47] : [48], group: g,
					msg: T("`" + o.key + "` " + (r < 0 ? "<" : ">") + " `" + x.key + "`: go " + (r < 0 ? "left" : "right") + " (colors are ignored).",
						"`" + o.key + "` " + (r < 0 ? "<" : ">") + " `" + x.key + "`：向" + (r < 0 ? "左" : "右") + "走（不看颜色）。") });
				x = r < 0 ? x.left : x.right;
			}
			if (x) {
				result = "val(" + x.key + ")";
				push({ key: o.key, h: x, marks: mark(x.id, "is-sorted"), lines: [49], group: g,
					msg: T("Search hit after " + c + " compare" + (c === 1 ? "" : "s") + ". Same code as an ordinary BST.", "比较 " + c + " 次后命中。代码与普通 BST 完全相同。") });
			} else {
				result = "Value{}";
				push({ key: o.key, lines: [51], group: g, msg: T("Null link: search miss, return `Value{}`.", "走到空链接：查找未命中，返回 `Value{}`。") });
			}
			return;
		}
		if (o.op === "check") { runCheck(g); return; }

		// ---- put, recursive with frames ----
		const key = o.key;
		result = "—";
		function put(h, parent, pside) {
			if (!h) {
				const nd = mk(key);
				return { node: nd, created: true };
			}
			const c = cmp(key, h.key);
			if (c === 0) {
				push({ key: key, h: h, marks: mark(h.id, "is-sorted"), lines: [13], group: g,
					msg: T("`" + key + "` is already here: update its value. Nothing else changes.", "`" + key + "` 已存在：只更新值，其余不变。") });
				return { node: h };
			}
			push({ key: key, h: h, marks: mark(h.id, "is-cmp"), lines: c < 0 ? [9, 10] : [11, 12], group: g,
				msg: T("`" + key + "` " + (c < 0 ? "<" : ">") + " `" + h.key + "`: recurse " + (c < 0 ? "left" : "right") + ", like a BST.",
					"`" + key + "` " + (c < 0 ? "<" : ">") + " `" + h.key + "`：像 BST 一样递归到" + (c < 0 ? "左" : "右") + "子树。") });
			const side = c < 0 ? "left" : "right";
			const r = put(h[side], h, side);
			h[side] = r.node;
			if (r.created) {
				push({ key: key, h: r.node, marks: mark(r.node.id, "is-swap"), lines: [7, 8], group: g,
					msg: T("Null link: `new Node(" + key + ", val, RED, 1)` becomes " + h.key + "'s " + side + " child, joined by a red link (it joins " + h.key + "'s 2-3 node).",
						"空链接：`new Node(" + key + ", val, RED, 1)` 成为 " + h.key + " 的" + (side === "left" ? "左" : "右") + "孩子，用红链接相连（并入 " + h.key + " 所在的 2-3 节点）。") });
			}
			return { node: fixUp(h, parent, pside) };
		}
		function fixUp(h, parent, pside) {
			// Re-link the new subtree root right away, so every frame shows the whole tree.
			const relink = function(x) { if (parent) parent[pside] = x; else root = x; };
			let fixed = false;
			if (isRed(h.right) && !isRed(h.left)) {
				push({ key: key, h: h, marks: marks2(h, "is-cmp", h.right, "is-min"), lines: [14], group: g,
					msg: T("Back at `" + h.key + "`: its right link is red and its left link is black → rotate left.",
						"回到 `" + h.key + "`：右链接是红的、左链接是黑的 → 左旋。") });
				const x = rotL(h); rotations++; h = x; relink(h); fixed = true;
				push({ key: key, h: h, marks: marks2(h, "is-swap", h.left, "is-swap"), lines: [15, 24, 25, 26, 27, 28, 29, 30], group: g,
					msg: T("`rotateLeft`: `" + h.key + "` moves up, `" + h.left.key + "` becomes its red left child. Same keys, same 2-3 node, now leaning left.",
						"`rotateLeft`：`" + h.key + "` 上移，`" + h.left.key + "` 成为它的红色左孩子。键相同、2-3 节点相同，只是改为左倾。") });
			}
			if (isRed(h.left) && isRed(h.left.left)) {
				push({ key: key, h: h, marks: marks2(h, "is-cmp", h.left, "is-min"), lines: [16], group: g,
					msg: T("At `" + h.key + "`: two left red links in a row (`" + h.left.key + "`, `" + h.left.left.key + "`), a temporary 4-node → rotate right.",
						"在 `" + h.key + "`：连续两条左红链接（`" + h.left.key + "`、`" + h.left.left.key + "`），是临时 4-节点 → 右旋。") });
				const x = rotR(h); rotations++; h = x; relink(h); fixed = true;
				push({ key: key, h: h, marks: marks2(h, "is-swap", h.right, "is-swap"), lines: [17, 32, 33, 34, 35, 36, 37, 38], group: g,
					msg: T("`rotateRight`: `" + h.key + "` moves up with two red children — the 4-node is now balanced, ready to split.",
						"`rotateRight`：`" + h.key + "` 上移，有两个红孩子——4-节点现在是平衡的，可以分裂了。") });
			}
			if (isRed(h.left) && isRed(h.right)) {
				push({ key: key, h: h, marks: mark(h.id, "is-cmp"), lines: [18], group: g,
					msg: T("At `" + h.key + "`: both children red → flip colors (split the temporary 4-node).",
						"在 `" + h.key + "`：两个孩子都是红的 → 颜色翻转（分裂临时 4-节点）。") });
				flip(h); flips++; fixed = true;
				push({ key: key, h: h, marks: marks2(h, "is-swap", null, ""), lines: [19, 40, 41, 42, 43], group: g,
					msg: T("`flipColors`: children `" + h.left.key + "`, `" + h.right.key + "` become black, `" + h.key + "`'s own link becomes red — the middle key moves up into the parent's 2-3 node.",
						"`flipColors`：孩子 `" + h.left.key + "`、`" + h.right.key + "` 变黑，`" + h.key + "` 自己的链接变红——中间键上移并入父节点的 2-3 节点。") });
			}
			void fixed;
			return h;
		}
		if (!root) {
			root = mk(key);
			push({ key: key, h: root, marks: mark(root.id, "is-swap"), lines: [7, 8], group: g,
				msg: T("Empty tree: `new Node(" + key + ", val, RED, 1)` becomes the root.", "空树：`new Node(" + key + ", val, RED, 1)` 成为根。") });
		} else {
			root = put(root, null, null).node;
		}
		if (root.red) {
			root.red = false;
			push({ key: key, h: root, marks: mark(root.id, "is-swap"), lines: [2, 3], group: g,
				msg: T("`root->color = BLACK`: the root is always black." + (count(root) > 1 && blackHeight(root) > 1 ? " (A root flip like this is how the tree gets taller: black height +1.)" : ""),
					"`root->color = BLACK`：根永远是黑的。" + (count(root) > 1 && blackHeight(root) > 1 ? "（像这样根被翻红再涂黑，就是树长高的方式：黑高 +1。）" : "")) });
		} else {
			push({ key: key, marks: {}, lines: [2, 3], group: g,
				msg: T("Done with put(" + key + "). Every rule holds again: red links lean left, no node touches two red links, perfect black balance.",
					"put(" + key + ") 完成。所有规则重新成立：红链接左倾、没有节点连着两条红链接、完美黑平衡。") });
		}
	});

	function runCheck(g) {
		const inorder = [];
		(function w(x) { if (!x) return; w(x.left); inorder.push(x); w(x.right); })(root);
		let bad = null;
		for (let i = 1; i < inorder.length; i++) if (cmp(inorder[i - 1].key, inorder[i].key) > 0) { bad = [inorder[i - 1], inorder[i]]; break; }
		push({ group: g, marks: bad ? marks2(bad[0], "is-min", bad[1], "is-min") : {}, lines: [],
			msg: bad
				? T("Rule 0, symmetric order: in-order is " + inorder.map(function(x) { return x.key; }).join(" ") + " — `" + bad[0].key + "` comes before `" + bad[1].key + "`, so this is not even a BST.",
					"规则 0，对称序：中序为 " + inorder.map(function(x) { return x.key; }).join(" ") + "——`" + bad[0].key + "` 排在 `" + bad[1].key + "` 前面，所以它连 BST 都不是。")
				: T("Rule 0, symmetric order: in-order is " + inorder.map(function(x) { return x.key; }).join(" ") + " — sorted. ✓",
					"规则 0，对称序：中序为 " + inorder.map(function(x) { return x.key; }).join(" ") + "——有序。✓") });
		let ok = !bad;
		let rr = null;
		inorder.forEach(function(x) { if (!rr && isRed(x.right)) rr = x; });
		push({ group: g, marks: rr ? marks2(rr, "is-cmp", rr.right, "is-min") : {}, lines: [],
			msg: rr
				? T("Rule 2, left-leaning: the red link from `" + rr.key + "` to `" + rr.right.key + "` leans right. ✗", "规则 2，左倾：`" + rr.key + "` 到 `" + rr.right.key + "` 的红链接右倾。✗")
				: T("Rule 2, left-leaning: every red link is a left link. ✓", "规则 2，左倾：所有红链接都是左链接。✓") });
		if (rr) ok = false;
		let two = null;
		inorder.forEach(function(x) {
			if (two) return;
			const reds = (x.red ? 1 : 0) + (isRed(x.left) ? 1 : 0) + (isRed(x.right) ? 1 : 0);
			if (reds >= 2) two = x;
		});
		push({ group: g, marks: two ? mark(two.id, "is-min") : {}, lines: [],
			msg: two
				? T("Rule 1, no two red links at one node: `" + two.key + "` touches two red links. ✗", "规则 1，一个节点不能连两条红链接：`" + two.key + "` 连着两条红链接。✗")
				: T("Rule 1: no node touches two red links. ✓", "规则 1：没有节点连着两条红链接。✓") });
		if (two) ok = false;
		// black links on each path to a null link
		const counts = [];
		let worst = null, best = null;
		(function w(x, b, path) {
			if (!x) { counts.push(b); return; }
			const nb = b + (x.red ? 0 : 1);
			const p = path.concat([x]);
			if (!x.left || !x.right) {
				if (!worst || nb > worst.b) worst = { b: nb, path: p };
				if (!best || nb < best.b) best = { b: nb, path: p };
			}
			w(x.left, nb, p); w(x.right, nb, p);
		})(root, 0, []);
		const lo = Math.min.apply(null, counts), hi = Math.max.apply(null, counts);
		const bm = {};
		if (lo !== hi && worst && best) {
			best.path.forEach(function(x) { bm[x.id] = "is-min"; });
			worst.path.forEach(function(x) { bm[x.id] = bm[x.id] ? bm[x.id] : "is-cmp"; });
		}
		push({ group: g, marks: bm, lines: [],
			msg: lo === hi
				? T("Rule 3, perfect black balance: every path from the root to a null link has " + lo + " black node" + (lo === 1 ? "" : "s") + " (counting the root). ✓",
					"规则 3，完美黑平衡：从根到每个空链接的路径上都有 " + lo + " 个黑节点（含根）。✓")
				: T("Rule 3, perfect black balance: paths to null links have between " + lo + " and " + hi + " black nodes — not balanced (highlighted: a shortest and a longest one). ✗",
					"规则 3，完美黑平衡：到空链接的路径上的黑节点数从 " + lo + " 到 " + hi + " 不等——不平衡（高亮：最少和最多的一条）。✗") });
		if (lo !== hi) ok = false;
		const allMarks = {};
		if (ok) inorder.forEach(function(x) { allMarks[x.id] = "is-sorted"; });
		result = ok ? T("legal LLRB", "合法 LLRB") : T("not an LLRB", "不是 LLRB");
		push({ group: g, marks: allMarks, lines: [],
			msg: ok ? T("Legal LLRB. Switch to the 2-3 view to see the 2-3 tree it encodes.", "合法的 LLRB。 切到 2-3 视图可以看到它对应的 2-3 树。")
				: T("Not a legal LLRB.", "不是合法的 LLRB。") });
	}

	const map = lineMap(config);
	frames.forEach(function(f) { f.lines = f.lines.map(function(l) { return map[l]; }).filter(Boolean); });
	const cols = frames.reduce(function(m, f) { return Math.max(m, f.nodes.length); }, 1);
	const rows = frames.reduce(function(m, f) { return f.nodes.reduce(function(r, nd) { return Math.max(r, nd.depth + 1); }, m); }, 1);
	frames.forEach(function(f) { f.cols = cols; f.rows = rows; f.empty = T("(empty tree)", "（空树）"); });
	return frames;
}

export function render(stage, frame) {
	treeView(stage).update({
		nodes: frame.nodes.map(function(nd) {
			return { id: nd.id, label: nd.key, col: nd.col, depth: nd.depth, role: nd.cls ? nd.cls.replace(/^is-/, "") : "" };
		}),
		edges: frame.edges,
		cols: frame.cols, rows: frame.rows,
		empty: frame.empty
	});
}

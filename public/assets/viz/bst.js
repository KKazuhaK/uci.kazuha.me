// Binary search tree (key → value), Lecture 12: recursive get / put and
// Hibbard deletion (remove), step by step. The tree is drawn with each node
// in its in-order column and its depth as the row, so symmetric order is
// visible as left-to-right order.
import { checkParams, tr } from "./_core.js";
import { treeView } from "./_tree.js";

const MAXN = 15;
const MAXOPS = 10;

export const meta = {
	name: "bst",
	summary: "Binary search tree: get(k) search hit/miss, put(k, v) insert or update, remove(k) by Hibbard deletion (leaf, one child, two children → successor).",
	groupLabel: { en: "operation", zh: "操作" },
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

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("x (node being compared)", "x（正在比较的节点）") },
		{ cls: "is-min", label: T("Successor", "后继") },
		{ cls: "is-swap", label: T("New / changed", "新建 / 改动") },
		{ cls: "is-sorted", label: T("Search hit", "查找命中") }
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
	const T = tr(config);
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

	// marks: { id: cls }
	function snapshot(marks) {
		const nodes = [], edges = [];
		let col = 0;
		(function walk(x, d, parent) {
			if (!x) return;
			walk(x.left, d + 1, x);
			nodes.push({ id: x.id, key: x.key, val: x.val, col: col++, depth: d, cls: (marks && marks[x.id]) || "" });
			walk(x.right, d + 1, x);
			if (parent) edges.push([parent.id, x.id]);
		})(root, 0, null);
		return { nodes: nodes, edges: edges };
	}

	function push(f) {
		const s = snapshot(f.marks);
		frames.push({
			nodes: s.nodes, edges: s.edges,
			lines: f.lines || [], group: f.group, msg: f.msg,
			vars: [
				["key", f.key === undefined ? "—" : String(f.key)],
				["x", f.x ? String(f.x.key) : (f.xnull ? "nullptr" : "—")],
				[T("compares", "比较次数"), String(compares)],
				["n", String(count(root))],
				[T("height", "高度"), String(height(root))],
				[T("returned", "返回值"), result]
			]
		});
	}

	push({ group: 0, msg: root
		? T("BST built by putting " + start.map(function(s) { return s.key; }).join(", ") + " in that order. Every key is larger than all keys in its left subtree and smaller than all keys in its right subtree.",
			"依次 put " + start.map(function(s) { return s.key; }).join("、") + " 建成的 BST。每个键都大于其左子树中的所有键，小于其右子树中的所有键。")
		: T("Empty BST (`root == nullptr`).", "空 BST（`root == nullptr`）。") });

	function mark(id, c) { const m = {}; if (id) m[id] = c; return m; }

	// Walk down comparing `key`; returns { node, parent, dir } (node null on a miss).
	// verb: [English, Chinese] for "search" / "insert" / "look"
	function descend(key, g, base, verb) {
		let x = root, parent = null, dir = null;
		if (!x) {
			push({ key: key, xnull: true, lines: [base.nil], group: g, msg: T("`x == nullptr`: the tree is empty.", "`x == nullptr`：树是空的。") });
			return { node: null, parent: null, dir: null };
		}
		while (x) {
			compares++;
			const c = cmp(key, x.key);
			if (c === 0) return { node: x, parent: parent, dir: dir };
			const go = c < 0 ? "left" : "right";
			push({ key: key, x: x, marks: mark(x.id, "is-cmp"), lines: c < 0 ? [base.lt, base.lt + 1] : [base.lt + 2, base.lt + 3], group: g,
				msg: T("`" + key + "` " + (c < 0 ? "<" : ">") + " `" + x.key + "`: " + verb[0] + " in the " + go + " subtree.",
					"`" + key + "` " + (c < 0 ? "<" : ">") + " `" + x.key + "`：到" + (c < 0 ? "左" : "右") + "子树中" + verb[1] + "。") });
			parent = x; dir = go;
			x = x[go];
		}
		push({ key: key, xnull: true, marks: mark(parent.id, "is-cmp"), lines: [base.nil], group: g,
			msg: T("`" + parent.key + "`'s " + dir + " link is `nullptr`, so `" + key + "` is not in the tree.",
				"`" + parent.key + "` 的" + (dir === "left" ? "左" : "右") + "链接是 `nullptr`，所以 `" + key + "` 不在树中。") });
		return { node: null, parent: parent, dir: dir };
	}

	ops.forEach(function(o, idx) {
		const g = idx + 1;
		if (o.op === "get") {
			const before = compares;
			const r = descend(o.key, g, { nil: 2, lt: 3 }, ["search", "继续查找"]);
			if (r.node) {
				result = r.node.val === null ? "val(" + r.node.key + ")" : String(r.node.val);
				push({ key: o.key, x: r.node, marks: mark(r.node.id, "is-sorted"), lines: [7], group: g,
					msg: T("`" + o.key + "` == `" + r.node.key + "`: search hit after " + (compares - before) + " compare" + (compares - before === 1 ? "" : "s") + " (depth + 1).",
						"`" + o.key + "` == `" + r.node.key + "`：查找命中，共比较 " + (compares - before) + " 次（深度 + 1）。") });
			} else {
				result = "Value()";
				push({ key: o.key, xnull: true, lines: [2], group: g, msg: T("Search miss: `get` returns `Value()` (a slide variant returns `nullptr` from a node-returning search).",
					"查找未命中：`get` 返回 `Value()`（幻灯片中返回节点的版本会返回 `nullptr`）。") });
			}
		} else if (o.op === "put") {
			const r = descend(o.key, g, { nil: 11, lt: 13 }, ["insert", "继续插入"]);
			const val = o.val === null ? null : o.val;
			if (r.node) {
				const old = r.node.val;
				r.node.val = val;
				result = "—";
				push({ key: o.key, x: r.node, marks: mark(r.node.id, "is-swap"), lines: [17], group: g,
					msg: T("`" + o.key + "` is already in the tree: update its value" + (val !== null ? " to " + val : "") + (old !== null ? " (was " + old + ")" : "") + ". No new node; the shape does not change.",
						"`" + o.key + "` 已在树中：把它的值更新" + (val !== null ? "为 " + val : "") + (old !== null ? "（原为 " + old + "）" : "") + "。不新建节点，树的形状不变。") });
			} else {
				const nd = mk(o.key, val);
				if (!r.parent) root = nd; else r.parent[r.dir] = nd;
				result = "—";
				push({ key: o.key, x: nd, marks: mark(nd.id, "is-swap"), lines: [11, 12], group: g,
					msg: T("`x == nullptr`: return `new Node(" + o.key + ", " + (val === null ? "val" : val) + ", 1)`" + (r.parent ? "; it becomes " + r.parent.key + "'s " + r.dir + " child" : "; it becomes the root") + ".",
						"`x == nullptr`：返回 `new Node(" + o.key + ", " + (val === null ? "val" : val) + ", 1)`，" + (r.parent ? "成为 " + r.parent.key + " 的" + (r.dir === "left" ? "左" : "右") + "孩子" : "成为根节点") + "。") });
				if (r.parent) {
					push({ key: o.key, marks: mark(nd.id, "is-swap"), lines: [18, 19, 20], group: g,
						msg: T("On the way back up, each call resets its link (`x->left = …` / `x->right = …`) and recomputes `size`, then returns `x`.",
							"沿递归返回时，每一层都重设自己的链接（`x->left = …` / `x->right = …`）、重新计算 `size`，再返回 `x`。") });
				}
			}
		} else {
			const r = descend(o.key, g, { nil: 23, lt: 24 }, ["look", "继续查找"]);
			const x = r.node;
			if (!x) {
				result = "—";
				push({ key: o.key, xnull: true, lines: [23], group: g, msg: T("Nothing to remove; the tree is unchanged.", "没有可删除的节点，树保持不变。") });
				return;
			}
			const link = function(child) { if (!r.parent) root = child; else r.parent[r.dir] = child; };
			push({ key: o.key, x: x, marks: mark(x.id, "is-cmp"), lines: [28], group: g,
				msg: T("Found `" + x.key + "`. " + (!x.left && !x.right ? "Case 1: it is a leaf." : (!x.left || !x.right ? "Case 2: it has one child." : "Case 3: it has two children.")),
					"找到 `" + x.key + "`。" + (!x.left && !x.right ? "情况 1：它是叶子。" : (!x.left || !x.right ? "情况 2：它只有一个孩子。" : "情况 3：它有两个孩子。"))) });
			if (!x.left || !x.right) {
				const child = x.left || x.right;
				const lines = !x.right ? [29, 30, 31] : [33, 34, 35];
				link(child);
				result = String(x.key);
				const m = child ? mark(child.id, "is-swap") : {};
				push({ key: o.key, marks: m, lines: lines, group: g,
					msg: child
						? T("Replace `" + x.key + "` with its only child `" + child.key + "` (the parent's link now points at it) and delete the node.",
							"用唯一的孩子 `" + child.key + "` 顶替 `" + x.key + "`（父节点的链接改指向它），然后删除该节点。")
						: T("Return `nullptr` to the parent: the leaf is simply deleted.", "向父节点返回 `nullptr`：叶子直接被删除。") });
				return;
			}
			// Case 3: successor = min of right subtree.
			let s = x.right, sp = x;
			const path = {}; path[x.id] = "is-cmp";
			path[s.id] = "is-min";
			push({ key: o.key, x: x, marks: Object.assign({}, path), lines: [37, 38], group: g,
				msg: T("`t = x`. The successor is the smallest key in the right subtree: go right once to `" + s.key + "`, then left as far as possible.",
					"`t = x`。后继是右子树中最小的键：先向右走一步到 `" + s.key + "`，再一直向左走到底。") });
			while (s.left) {
				sp = s; s = s.left;
				const m = {}; m[x.id] = "is-cmp"; m[s.id] = "is-min";
				push({ key: o.key, x: x, marks: m, lines: [38], group: g, msg: T("Go left to `" + s.key + "`.", "向左走到 `" + s.key + "`。") });
			}
			const sm = {}; sm[x.id] = "is-cmp"; sm[s.id] = "is-min";
			push({ key: o.key, x: x, marks: sm, lines: [38], group: g,
				msg: T("`" + s.key + "` has no left child: it is the successor (next largest key after `" + x.key + "`)." +
					(s.right ? " Its right child `" + s.right.key + "` will move up into its place." : ""),
					"`" + s.key + "` 没有左孩子：它就是后继（`" + x.key + "` 之后的下一个更大的键）。" +
					(s.right ? "它的右孩子 `" + s.right.key + "` 会上移到它的位置。" : "")) });
			// deleteMin(t->right): unlink s.
			if (sp === x) x.right = s.right; else sp.left = s.right;
			s.right = x.right;
			s.left = x.left;
			link(s);
			result = String(x.key);
			const fm = {}; fm[s.id] = "is-swap";
			push({ key: o.key, x: s, marks: fm, lines: [39, 40, 41], group: g,
				msg: T("`x->right = deleteMin(t->right)`, `x->left = t->left`: `" + s.key + "` takes `" + x.key + "`'s place and `" + x.key + "` is deleted. Symmetric order still holds.",
					"`x->right = deleteMin(t->right)`，`x->left = t->left`：`" + s.key + "` 顶替 `" + x.key + "` 的位置，`" + x.key + "` 被删除。对称序仍然成立。") });
		}
	});

	const map = lineMap(config);
	frames.forEach(function(f) { f.lines = f.lines.map(function(l) { return map[l]; }).filter(Boolean); });
	const inorder = (function() { const a = []; (function w(x) { if (!x) return; w(x.left); a.push(x.key); w(x.right); })(root); return a; })();
	push({ group: ops.length, msg: T("Done. In-order: " + (inorder.length ? inorder.join(" ") : "(empty)") +
		". Height " + height(root) + "; every operation walks one root-to-node path, so its cost is O(height).",
		"完成。中序：" + (inorder.length ? inorder.join(" ") : "（空）") +
		"。高度 " + height(root) + "；每次操作只走一条从根到节点的路径，代价为 O(height)。") });
	// One drawing size for the whole demo, so the page doesn't jump between steps.
	const cols = frames.reduce(function(m, f) { return Math.max(m, f.nodes.length); }, 1);
	const rows = frames.reduce(function(m, f) { return f.nodes.reduce(function(r, nd) { return Math.max(r, nd.depth + 1); }, m); }, 1);
	frames.forEach(function(f) { f.cols = cols; f.rows = rows; f.empty = T("(empty tree)", "（空树）"); });
	return frames;
}

// ---------- drawing ----------

// ---------- drawing (shared tree view: nodes glide to their new place) ----------

export function render(stage, frame) {
	treeView(stage).update({
		nodes: frame.nodes.map(function(nd) {
			return { id: nd.id, label: nd.key, val: nd.val, col: nd.col, depth: nd.depth, role: nd.cls ? nd.cls.replace(/^is-/, "") : "" };
		}),
		edges: frame.edges.map(function(e) { return { from: e[0], to: e[1] }; }),
		cols: frame.cols, rows: frame.rows,
		empty: frame.empty
	});
}

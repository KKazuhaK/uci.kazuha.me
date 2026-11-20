// 2-3 search tree (Lecture 14): get(k) compares against every key in a node
// and follows the link for the interval; insert(k) adds the key to the leaf
// the search ends in, and a temporary 4-node is split — middle key up to the
// parent — repeatedly, splitting the root (height + 1) if needed. Every key
// is its own circle; keys of one node are joined by a thick "glue" bar.
import { checkParams, tr } from "./_core.js?v=d245a77e9b";
import { treeView } from "./_tree.js?v=d245a77e9b";

const MAXN = 16;
const MAXOPS = 16;

export const meta = {
	name: "two-three-tree",
	summary: "2-3 search tree: get(k) (interval search) and insert(k) into a 2-node, into a 3-node (temporary 4-node, split, middle key to the parent, repeat), splitting the root.",
	groupLabel: { en: "operation", zh: "操作" },
	params: {
		keys: { type: "string", default: "", desc: "Starting tree: keys inserted in this order, comma-separated, 1–3 characters, distinct." },
		ops: { type: "string", required: true, desc: "Operations separated by ';': insert(k) (put(k) also accepted), get(k). At most 16." }
	},
	example: { ops: "insert(E); insert(A); insert(S); insert(Y)" }
};

const KEY = "[^\\s,;:()\"]{1,3}";

function splitItems(text) {
	return String(text).split(/\s*[,，]\s*/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
}
function parseKeys(text) {
	const out = [];
	for (const s of splitItems(text)) {
		if (!new RegExp("^" + KEY + "$").test(s)) return { error: "\"keys\": can't read \"" + s + "\"" };
		if (out.indexOf(s) >= 0) return { error: "\"keys\": key " + s + " appears twice" };
		out.push(s);
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
		if ((m = new RegExp("^(?:insert|put)\\(\\s*\"?(" + KEY + ")\"?\\s*\\)$").exec(p))) ops.push({ op: "insert", key: m[1] });
		else if ((m = new RegExp("^get\\(\\s*\"?(" + KEY + ")\"?\\s*\\)$").exec(p))) ops.push({ op: "get", key: m[1] });
		else return { error: "\"ops\": can't read \"" + p + "\" (use insert(k), get(k))" };
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
	const all = k.items.concat(o.ops.map(function(x) { return x.key; }));
	if (all.some(isNum) && !all.every(isNum)) return ["\"keys\"/\"ops\": mix of numbers and words; use one kind"];
	const set = {};
	all.forEach(function(x) { set[x] = true; });
	if (Object.keys(set).length > MAXN) return ["the tree would hold more than " + MAXN + " keys"];
	return [];
}

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("Node being compared", "正在比较的节点") },
		{ cls: "is-min", label: T("Temporary 4-node", "临时 4-节点") },
		{ cls: "is-swap", label: T("New / moved key", "新键 / 移动的键") },
		{ cls: "is-sorted", label: T("Search hit", "查找命中") }
	];
}

export const input = {
	key: "ops",
	label: { en: "Operations", zh: "操作" },
	format: function(config) { return config.ops; },
	parse: function(text) { const r = parseOps(text); return r.error ? { error: r.error } : { value: text }; },
	random: function() {
		const pool = "ACEHLMPRSXYZ".split("");
		for (let i = pool.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [pool[i], pool[k]] = [pool[k], pool[i]]; }
		return pool.slice(0, 8).map(function(k) { return "insert(" + k + ")"; }).join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const start = parseKeys(config.keys || "").items;
	const ops = parseOps(config.ops).ops;
	const all = start.concat(ops.map(function(o) { return o.key; }));
	const num = all.length > 0 && all.every(isNum);
	const cmp = function(a, b) { if (num) return Number(a) - Number(b); return a < b ? -1 : a > b ? 1 : 0; };
	const frames = [];
	let root = null; // node: { keys: [], kids: [], parent }
	let splits = 0, result = "—";

	function leaf(keys) { return { keys: keys, kids: [], parent: null }; }
	function addKey(n, k) { let i = 0; while (i < n.keys.length && cmp(n.keys[i], k) < 0) i++; n.keys.splice(i, 0, k); return i; }
	function childIndex(n, k) { let i = 0; while (i < n.keys.length && cmp(k, n.keys[i]) > 0) i++; return i; }
	function height(n) { let h = 0; while (n) { h++; n = n.kids[0]; } return h; }
	function size(n) { return n ? n.keys.length + n.kids.reduce(function(s, c) { return s + size(c); }, 0) : 0; }

	// split a temporary 4-node; returns the node the middle key went into
	function split(n) {
		const [a, b, c] = n.keys;
		const L = { keys: [a], kids: n.kids.slice(0, 2), parent: null };
		const R = { keys: [c], kids: n.kids.slice(2, 4), parent: null };
		L.kids.forEach(function(x) { x.parent = L; });
		R.kids.forEach(function(x) { x.parent = R; });
		const p = n.parent;
		if (!p) {
			root = { keys: [b], kids: [L, R], parent: null };
			L.parent = R.parent = root;
			return root;
		}
		const i = p.kids.indexOf(n);
		p.kids.splice(i, 1, L, R);
		addKey(p, b);
		L.parent = R.parent = p;
		return p;
	}
	function silentInsert(k) {
		if (!root) { root = leaf([k]); return; }
		let n = root;
		while (n.kids.length) { if (n.keys.indexOf(k) >= 0) return; n = n.kids[childIndex(n, k)]; }
		if (n.keys.indexOf(k) >= 0) return;
		addKey(n, k);
		while (n && n.keys.length === 3) n = split(n);
	}
	start.forEach(silentInsert);

	function snapshot(marks) {
		const nodes = [], edges = [];
		let col = 0;
		const firstCol = new Map();
		(function walk(n, d) {
			if (!n) return;
			const ids = [];
			for (let i = 0; i < n.keys.length; i++) {
				walk(n.kids[i], d + 1);
				const k = n.keys[i];
				const m = marks.keys && marks.keys[k] ? marks.keys[k] : (marks.node === n ? marks.nodeCls : "");
				nodes.push({ id: "k" + k, key: k, col: col++, depth: d, cls: m });
				ids.push("k" + k);
			}
			walk(n.kids[n.keys.length], d + 1);
			for (let i = 1; i < ids.length; i++) edges.push({ from: ids[i - 1], to: ids[i], role: "glue" });
			n.kids.forEach(function(c, i) {
				const from = ids[i === 0 ? 0 : Math.min(i - 1, ids.length - 1)];
				const to = "k" + c.keys[Math.floor((c.keys.length - 1) / 2)];
				edges.push({ from: from, to: to, role: marks.path && marks.path.indexOf(c) >= 0 ? "path" : "" });
			});
			firstCol.set(n, ids[0]);
		})(root, 0);
		return { nodes: nodes, edges: edges };
	}
	function push(f) {
		const s = snapshot(f.marks || {});
		frames.push({ nodes: s.nodes, edges: s.edges, group: f.group, msg: f.msg, lines: [],
			vars: [["key", f.key === undefined ? "—" : String(f.key)], [T("keys", "键数"), String(size(root))], [T("height", "高度"), String(height(root))], [T("splits", "分裂次数"), String(splits)], [T("returned", "返回值"), result]] });
	}
	const list = function(n) { return n.keys.join(" "); };
	const kind = function(n) { return n.keys.length === 1 ? T("2-node", "2-节点") : n.keys.length === 2 ? T("3-node", "3-节点") : T("temporary 4-node", "临时 4-节点"); };
	function interval(n, i, k) {
		if (n.keys.length === 1) return i === 0 ? T("`" + k + "` < `" + n.keys[0] + "`: take the left link", "`" + k + "` < `" + n.keys[0] + "`：走左链接") : T("`" + k + "` > `" + n.keys[0] + "`: take the right link", "`" + k + "` > `" + n.keys[0] + "`：走右链接");
		if (i === 0) return T("`" + k + "` < `" + n.keys[0] + "`: take the left link", "`" + k + "` < `" + n.keys[0] + "`：走左链接");
		if (i === 1) return T("`" + k + "` is between `" + n.keys[0] + "` and `" + n.keys[1] + "`: take the middle link", "`" + k + "` 在 `" + n.keys[0] + "` 和 `" + n.keys[1] + "` 之间：走中间链接");
		return T("`" + k + "` > `" + n.keys[1] + "`: take the right link", "`" + k + "` > `" + n.keys[1] + "`：走右链接");
	}

	push({ group: 0, msg: root ? T("2-3 tree built by inserting " + start.join(", ") + ". All null links are the same distance from the root (perfect balance).", "依次插入 " + start.join("、") + " 建成的 2-3 树。所有空链接到根的距离都相同（完美平衡）。") : T("Empty 2-3 tree.", "空的 2-3 树。") });

	ops.forEach(function(o, idx) {
		const g = idx + 1, k = o.key;
		if (!root) {
			if (o.op === "get") { result = T("miss", "未命中"); push({ key: k, group: g, msg: T("Empty tree: search miss.", "空树：未命中。") }); return; }
			root = leaf([k]);
			const mk = {}; mk[k] = "is-swap";
			result = "—";
			push({ key: k, group: g, marks: { keys: mk }, msg: T("Empty tree: `" + k + "` becomes a 2-node root.", "空树：`" + k + "` 成为根，是一个 2-节点。") });
			return;
		}
		let n = root;
		const path = [];
		for (;;) {
			if (n.keys.indexOf(k) >= 0) {
				const mk = {}; mk[k] = "is-sorted";
				result = o.op === "get" ? "val(" + k + ")" : "—";
				push({ key: k, group: g, marks: { keys: mk, path: path }, msg: o.op === "get"
					? T("`" + k + "` matches a key in this node: search hit.", "`" + k + "` 与本节点的一个键相等：查找命中。")
					: T("`" + k + "` is already in the tree: just update its value.", "`" + k + "` 已在树中：只更新值。") });
				return;
			}
			const i = childIndex(n, k);
			if (!n.kids.length) {
				if (o.op === "get") result = T("miss", "未命中");
				push({ key: k, group: g, marks: { node: n, nodeCls: "is-cmp", path: path }, msg: T("Compare `" + k + "` with " + list(n) + ": not here, and this " + kind(n) + " is at the bottom (its links are null).", "把 `" + k + "` 与 " + list(n) + " 比较：不在这里，且这个" + kind(n) + "在最底层（链接为空）。") +
					(o.op === "get" ? T(" Search miss.", " 查找未命中。") : "") });
				break;
			}
			push({ key: k, group: g, marks: { node: n, nodeCls: "is-cmp", path: path }, msg: T("Compare with the " + kind(n) + " " + list(n) + ": ", "与" + kind(n) + " " + list(n) + " 比较：") + interval(n, i, k) + T(".", "。") });
			path.push(n.kids[i]);
			n = n.kids[i];
		}
		if (o.op === "get") { result = T("miss", "未命中"); return; }
		result = "—";
		const was2 = n.keys.length === 1;
		addKey(n, k);
		const mk = {}; mk[k] = "is-swap";
		if (was2) {
			push({ key: k, group: g, marks: { keys: mk }, msg: T("Insert into a 2-node: add `" + k + "` to it, making the 3-node " + list(n) + ". Done — perfect balance kept, height unchanged.", "插入 2-节点：把 `" + k + "` 加进去，成为 3-节点 " + list(n) + "。完成——完美平衡保持，高度不变。") });
			return;
		}
		push({ key: k, group: g, marks: { node: n, nodeCls: "is-min", keys: mk }, msg: T("Insert into a 3-node: no room, so make a temporary 4-node " + list(n) + ".", "插入 3-节点：没有空位，于是形成临时 4-节点 " + list(n) + "。") });
		while (n && n.keys.length === 3) {
			const mid = n.keys[1];
			const wasRoot = !n.parent;
			const p = split(n);
			splits++;
			const m2 = {}; m2[mid] = "is-swap";
			if (wasRoot) {
				push({ key: k, group: g, marks: { keys: m2 }, msg: T("The temporary 4-node is the root: split it into three 2-nodes — `" + mid + "` is the new root. Height + 1, perfect balance kept.", "临时 4-节点是根：把它分裂成三个 2-节点——`" + mid + "` 成为新根。高度 + 1，完美平衡保持。") });
				n = null;
			} else if (p.keys.length === 2) {
				push({ key: k, group: g, marks: { keys: m2 }, msg: T("Split the 4-node into two 2-nodes and pass the middle key `" + mid + "` to the parent, which was a 2-node and is now the 3-node " + list(p) + ". Done.", "把 4-节点分裂成两个 2-节点，中间键 `" + mid + "` 上移到父节点；父节点原是 2-节点，现在是 3-节点 " + list(p) + "。完成。") });
				n = null;
			} else {
				push({ key: k, group: g, marks: { keys: m2, node: p, nodeCls: "is-min" }, msg: T("Split the 4-node and pass `" + mid + "` up — but the parent was a 3-node, so it becomes the temporary 4-node " + list(p) + ". Repeat one level up.", "分裂 4-节点并把 `" + mid + "` 上移——但父节点原是 3-节点，于是变成临时 4-节点 " + list(p) + "。在上一层重复。") });
				n = p;
			}
		}
	});

	const inorder = [];
	(function w(n) { if (!n) return; n.keys.forEach(function(kk, i) { w(n.kids[i]); inorder.push(kk); }); w(n.kids[n.keys.length]); })(root);
	push({ group: ops.length, msg: T("Done. In-order: " + inorder.join(" ") + ". Height " + height(root) + " (levels); every path from the root to a null link has the same length.", "完成。中序：" + inorder.join(" ") + "。高度 " + height(root) + "（层）；从根到任一空链接的路径长度都相同。") });
	const cols = frames.reduce(function(m, f) { return Math.max(m, f.nodes.length); }, 1);
	const rows = frames.reduce(function(m, f) { return f.nodes.reduce(function(r, nd) { return Math.max(r, nd.depth + 1); }, m); }, 1);
	frames.forEach(function(f) { f.cols = cols; f.rows = rows; f.empty = T("(empty tree)", "（空树）"); });
	return frames;
}

export function render(stage, frame) {
	treeView(stage).update({
		nodes: frame.nodes.map(function(nd) { return { id: nd.id, label: nd.key, col: nd.col, depth: nd.depth, role: nd.cls ? nd.cls.replace(/^is-/, "") : "" }; }),
		edges: frame.edges,
		cols: frame.cols, rows: frame.rows, empty: frame.empty
	});
}

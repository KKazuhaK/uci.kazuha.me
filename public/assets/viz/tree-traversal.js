// Binary tree traversals, step by step: pre-order, in-order and post-order
// (recursive, with the call stack shown) and level order (with a queue).
// The tree is given in heap positions: position 1 is the root, the children
// of position p are 2p and 2p + 1, "-" marks an empty position.
import { checkParams, tr } from "./_core.js";
import { treeView, heapPlace } from "./_tree.js";
import { arrayView } from "./_array.js";

const MAXPOS = 31;

export const meta = {
	name: "tree-traversal",
	summary: "Pre-order, in-order, post-order (recursive, call stack shown) or level-order (queue) traversal of a binary tree.",
	groupLabel: { en: "visit", zh: "访问" },
	params: {
		tree: { type: "string", required: true, desc: "Nodes by heap position, comma-separated: root first, children of p at 2p and 2p+1, \"-\", \"_\" or \"null\" = empty (so those can't be labels). Labels 1–3 chars, at most 31 positions (depth ≤ 4)." },
		order: { type: "enum", values: ["pre", "in", "post", "level"], default: "pre", desc: "Which traversal to run." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code shown beside the demo, with the running line highlighted." }
	},
	example: { tree: "K, C, N, A, F, M, V, -, B, D, H, -, -, U", order: "in" },
	// One-click switch in the player between the four traversals on the same tree.
	switch: { key: "order", label: { en: "Order", zh: "顺序" }, options: [
		{ value: "pre", label: { en: "Pre-order", zh: "前序" } },
		{ value: "in", label: { en: "In-order", zh: "中序" } },
		{ value: "post", label: { en: "Post-order", zh: "后序" } },
		{ value: "level", label: { en: "Level order", zh: "层序" } }
	] }
};

// Parse the position list into an array indexed 1..len (null = empty).
function parseTree(text) {
	const parts = String(text).trim().split(/\s*[,，]\s*|\s+/).map(function(s) { return s.trim(); });
	if (parts.some(function(s) { return s === ""; })) return { error: "\"tree\" has an empty item (two commas in a row?); write \"-\" for an empty position" };
	if (parts.length === 0) return { error: "\"tree\" is empty" };
	if (parts.length > MAXPOS) return { error: "\"tree\" has " + parts.length + " positions; at most " + MAXPOS + " (depth ≤ 4)" };
	const pos = [null];
	const seen = {};
	for (let i = 0; i < parts.length; i++) {
		const s = parts[i];
		if (s === "-" || s === "_" || s.toLowerCase() === "null") { pos.push(null); continue; }
		if (s.length > 3) return { error: "\"tree\": label \"" + s + "\" is longer than 3 characters" };
		if (seen[s]) return { error: "\"tree\": label \"" + s + "\" appears twice; labels must be unique" };
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
	return { pos: pos };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const r = parseTree(config.tree);
	return r.error ? [r.error] : [];
}

const CODE = {
	pre: [
		"void preorder(Node* t) {",
		"    if (t == nullptr) return;",
		"    visit(t->item);",
		"    preorder(t->left);",
		"    preorder(t->right);",
		"}"
	],
	in: [
		"void inorder(Node* t) {",
		"    if (t == nullptr) return;",
		"    inorder(t->left);",
		"    visit(t->item);",
		"    inorder(t->right);",
		"}"
	],
	post: [
		"void postorder(Node* t) {",
		"    if (t == nullptr) return;",
		"    postorder(t->left);",
		"    postorder(t->right);",
		"    visit(t->item);",
		"}"
	],
	level: [
		"std::queue<Node*> q;",
		"if (root) q.push(root);",
		"while (!q.empty()) {",
		"    Node* t = q.front(); q.pop();",
		"    visit(t->item);",
		"    if (t->left)  q.push(t->left);",
		"    if (t->right) q.push(t->right);",
		"}"
	]
};

export function code(config) {
	return { cpp: CODE[config.order || "pre"] };
}

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("Current node t", "当前节点 t") },
		{ cls: "is-min", label: T("On the call stack / in the queue", "在调用栈 / 队列中") },
		{ cls: "is-sorted", label: T("Visited", "已访问") }
	];
}

export const input = {
	key: "tree",
	label: { en: "Tree (heap positions)", zh: "树（按堆位置）" },
	format: function(config) { return config.tree; },
	parse: function(text) {
		const r = parseTree(text);
		return r.error ? { error: r.error } : { value: text };
	},
	random: function() {
		const labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
		const pos = [null, labels.shift()];
		for (let p = 2; p <= 15; p++) {
			pos.push(pos[p >> 1] !== null && Math.random() < 0.72 ? labels.shift() : null);
		}
		while (pos.length > 2 && pos[pos.length - 1] === null) pos.pop();
		return pos.slice(1).map(function(v) { return v === null ? "-" : v; }).join(", ");
	}
};

function left(pos, p) { const c = 2 * p; return c < pos.length && pos[c] !== null ? c : 0; }
function right(pos, p) { const c = 2 * p + 1; return c < pos.length && pos[c] !== null ? c : 0; }

function orderName(T, order) {
	return { pre: T("Pre-order", "前序"), in: T("In-order", "中序"), post: T("Post-order", "后序"), level: T("Level order", "层序") }[order];
}

export function steps(config) {
	const T = tr(config);
	const NAME = orderName(T, config.order || "pre");
	const order = config.order || "pre";
	const pos = parseTree(config.tree).pos;
	const frames = [];
	const caption = T("output (visit order)", "输出（访问顺序）");
	const out = [];
	const stack = [];
	let queue = [];

	function push(cur, lines, msg) {
		frames.push({
			step: frames.length,
			pos: pos,
			cur: cur,
			order: order,
			caption: caption,
			active: order === "level" ? queue.slice() : stack.slice(),
			visited: out.slice(),
			lines: lines,
			group: out.length,
			msg: msg,
			vars: [
				[T("order", "遍历顺序"), NAME],
				["t", cur ? pos[cur] : "—"],
				[order === "level" ? T("queue (front→rear)", "队列（队首→队尾）") : T("call stack (bottom→top)", "调用栈（栈底→栈顶）"),
					(order === "level" ? queue : stack).map(function(p) { return pos[p]; }).join(" ") || "(empty)"],
				[T("output", "输出"), out.map(function(p) { return pos[p]; }).join(" ") || "—"]
			]
		});
	}

	const counts = { n: 0 };
	for (let p = 1; p < pos.length; p++) if (pos[p] !== null) counts.n++;

	if (order === "level") {
		push(0, [], T("Level order (breadth-first): visit level 0, then level 1 left to right, then level 2, … A FIFO queue keeps the order.", "层序（广度优先）：先访问第 0 层，再从左到右访问第 1 层，然后第 2 层，……用一个先进先出的队列来保持顺序。"));
		queue.push(1);
		push(0, [1, 2], T("Push the root `" + pos[1] + "` into the queue.", "把根 `" + pos[1] + "` 入队。"));
		while (queue.length) {
			const t = queue.shift();
			push(t, [3, 4], T("Take `" + pos[t] + "` from the front of the queue.", "从队首取出 `" + pos[t] + "`。"));
			out.push(t);
			push(t, [5], T("Visit `" + pos[t] + "`. Output so far: " + out.map(function(p) { return pos[p]; }).join(" ") + ".", "访问 `" + pos[t] + "`。目前的输出：" + out.map(function(p) { return pos[p]; }).join(" ") + "。"));
			const l = left(pos, t), r = right(pos, t);
			if (l || r) {
				if (l) queue.push(l);
				if (r) queue.push(r);
				push(t, [6, 7], T("Push its children" + (l ? " `" + pos[l] + "`" : "") + (l && r ? " and" : "") + (r ? " `" + pos[r] + "`" : "") +
					" to the rear — they come out after everything already waiting on this level.",
					"把它的孩子" + (l ? " `" + pos[l] + "`" : "") + (l && r ? " 和" : "") + (r ? " `" + pos[r] + "`" : "") +
					" 入队到队尾——它们要等本层已在排队的节点都出队之后才轮到。"));
			} else {
				push(t, [6, 7], T("`" + pos[t] + "` is a leaf: nothing to push.", "`" + pos[t] + "` 是叶子：没有可入队的孩子。"));
			}
		}
		push(0, [], T("Done: " + out.map(function(p) { return pos[p]; }).join(" ") + ". Each of the " + counts.n + " nodes is pushed and popped once: O(n).", "完成：" + out.map(function(p) { return pos[p]; }).join(" ") + "。" + counts.n + " 个节点各入队、出队一次：O(n)。"));
		return frames;
	}

	const NAME_EN = { pre: "Pre-order", in: "In-order", post: "Post-order" };
	const fn = { pre: "preorder", in: "inorder", post: "postorder" }[order];
	// Line numbers (1-based) of each statement in CODE[order].
	const LN = order === "pre" ? { visit: 3, goL: 4, goR: 5 } : order === "in" ? { goL: 3, visit: 4, goR: 5 } : { goL: 3, goR: 4, visit: 5 };
	const when = { pre: T("before both subtrees", "在两棵子树之前"), in: T("between the subtrees", "在两棵子树之间"), post: T("after both subtrees", "在两棵子树之后") }[order];
	push(0, [], T(NAME_EN[order] + ": each call marks its node visited " + when + ". Null children return at once and are not drawn as steps.", NAME + "：每次调用都" + when + "访问自己的节点。空孩子直接返回，不单独画成一步。"));

	function visit(t) {
		out.push(t);
		push(t, [LN.visit], T("Visit `" + pos[t] + "`. Output so far: " + out.map(function(p) { return pos[p]; }).join(" ") + ".", "访问 `" + pos[t] + "`。目前的输出：" + out.map(function(p) { return pos[p]; }).join(" ") + "。"));
	}
	const sideZh = { left: "左", right: "右" };
	function go(t, side) {
		const c = side === "left" ? left(pos, t) : right(pos, t);
		if (!c) {
			push(t, [side === "left" ? LN.goL : LN.goR, 2], T("`" + fn + "(t->" + side + ")`: `" + pos[t] + "` has no " + side + " child, so that call returns immediately.",
				"`" + fn + "(t->" + side + ")`：`" + pos[t] + "` 没有" + sideZh[side] + "孩子，这次调用立即返回。"));
			return;
		}
		rec(c, T("`" + fn + "(t->" + side + ")`: go to `" + pos[t] + "`'s " + side + " child `" + pos[c] + "`.", "`" + fn + "(t->" + side + ")`：走到 `" + pos[t] + "` 的" + sideZh[side] + "孩子 `" + pos[c] + "`。"), side === "left" ? LN.goL : LN.goR);
		push(t, [side === "left" ? LN.goL : LN.goR], T("Back in `" + pos[t] + "`: its " + side + " subtree is finished.", "回到 `" + pos[t] + "`：它的" + sideZh[side] + "子树已处理完。"));
	}
	function rec(t, why, line) {
		stack.push(t);
		push(t, [line || 1], why);
		if (order === "pre") visit(t);
		go(t, "left");
		if (order === "in") visit(t);
		go(t, "right");
		if (order === "post") visit(t);
		stack.pop();
	}
	rec(1, T("`" + fn + "(root)`: start at the root `" + pos[1] + "`.", "`" + fn + "(root)`：从根 `" + pos[1] + "` 开始。"), 1);
	push(0, [], T("Done: " + out.map(function(p) { return pos[p]; }).join(" ") + ". One call per node (plus one per null link): O(n).", "完成：" + out.map(function(p) { return pos[p]; }).join(" ") + "。每个节点一次调用（每条空链接再多一次）：O(n)。"));
	return frames;
}

// ---------- drawing (shared tree and array views) ----------
// Tree: ids are heap positions, so a step only changes colours (they fade).
// Output: one cell per node, id = node id; the newest visited node pops in.

function depthOf(p) { return Math.floor(Math.log2(p)); }

export function render(stage, frame) {
	const pos = frame.pos;
	const D = depthOf(pos.length - 1);
	const rankOf = {};
	frame.visited.forEach(function(p, k) { rankOf[p] = k + 1; });
	const nodes = [], edges = [];
	let total = 0;
	for (let p = 1; p < pos.length; p++) {
		if (pos[p] === null) continue;
		total++;
		const at = heapPlace(p, D);
		const role = p === frame.cur ? "cmp" : rankOf[p] ? "sorted" : frame.active.indexOf(p) >= 0 ? "min" : "";
		nodes.push({ id: p, label: pos[p], col: at.col, depth: at.depth, role: role, badge: rankOf[p] });
		if (p > 1) {
			// Edges along the current call stack (DFS only).
			const on = frame.order !== "level" && frame.active.indexOf(p) >= 0 && frame.active.indexOf(p >> 1) >= 0;
			edges.push({ from: p >> 1, to: p, role: on ? "active" : "" });
		}
	}
	treeView(stage).update({ nodes: nodes, edges: edges, cols: Math.pow(2, D), rows: D + 1 });

	// Output row: visited nodes in order, then empty slots so the row keeps its width.
	const cells = frame.visited.map(function(p) { return { id: p, label: pos[p], role: "sorted" }; });
	for (let k = frame.visited.length; k < total; k++) cells.push({ id: "slot" + k, label: "", role: "unused" });
	const index = [];
	for (let k = 1; k <= total; k++) index.push(k);
	arrayView(stage, "out").update({ cells: cells, index: index, caption: frame.caption });
}

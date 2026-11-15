// Binary heap (array-backed, pq[0] unused): insert + swim, sink, swim, and
// delMax, plus heap sort's sortdown, step by step, drawn both as the tree
// and as the array.
import { checkParams, tr } from "./_core.js";
import { treeView, heapPlace } from "./_tree.js";
import { arrayView } from "./_array.js";

const MAXN = 15;

export const meta = {
	name: "binary-heap",
	summary: "Array-backed binary heap: insert (swim up), swim(k), sink(k), delMax(), bottom-up construction heapify(), heap sort's sortdown(), and the whole heapsort(), shown as tree and array.",
	groupLabel: { en: "operation", zh: "操作" },
	params: {
		heap: { type: "string", default: "", desc: "Starting keys pq[1..n] in level order, comma-separated (ints or 1–3 char words; at most 15). Need not be heap-ordered when the first op is swim/sink." },
		ops: { type: "string", required: true, desc: "Operations separated by ';': insert(x), swim(k), sink(k), delMax(). delMin() on a min-heap. heapify() = bottom-up construction (for k = n/2 down to 1: sink(k)). sortdown() (heap sort's second phase) keeps each removed max in the array, sorted. heapsort() = heapify + sortdown as one function. sortdown() and heapsort() must be the last op. At most 16." },
		order: { type: "enum", values: ["max", "min"], default: "max", desc: "Max-heap (parent ≥ children) or min-heap (parent ≤ children; less() is flipped, use delMin())." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code shown beside the demo, with the running line highlighted." }
	},
	example: { heap: "100, 19, 36, 17, 3, 25, 1, 2, 7", ops: "insert(47)" }
};

function splitItems(text) {
	return String(text).split(/\s*[,，]\s*/).map(function(s) { return s.trim(); }).filter(function(s) { return s !== ""; });
}

function parseHeap(text) {
	const items = splitItems(text);
	if (items.length > MAXN) return { error: "\"heap\" has " + items.length + " keys; at most " + MAXN };
	for (const s of items) {
		if (s.length > 3) return { error: "\"heap\": key \"" + s + "\" is longer than 3 characters" };
	}
	return { items: items };
}

function parseOps(text) {
	const parts = String(text).split(";").map(function(s) { return s.trim(); }).filter(Boolean);
	if (parts.length === 0) return { error: "\"ops\" is empty" };
	if (parts.length > 16) return { error: "\"ops\" has " + parts.length + " operations; at most 16" };
	const ops = [];
	for (const p of parts) {
		let m;
		if ((m = /^insert\(\s*"?([^"),\s]{1,3})"?\s*\)$/.exec(p))) ops.push({ op: "insert", x: m[1] });
		else if ((m = /^(swim|sink)\(\s*(\d+)\s*\)$/.exec(p))) ops.push({ op: m[1], k: Number(m[2]) });
		else if ((m = /^del(Max|Min)\(\s*\)$/.exec(p))) ops.push({ op: "delMax", name: "del" + m[1] });
		else if ((m = /^(sortdown|heapify|heapsort)\(\s*\)$/i.exec(p))) ops.push({ op: m[1].toLowerCase() === "heapsort" ? "heapsort" : m[1].toLowerCase() });
		else return { error: "\"ops\": can't read \"" + p + "\" (use insert(x), swim(k), sink(k), delMax(), heapify(), sortdown(), heapsort())" };
	}
	return { ops: ops };
}

function numeric(items) {
	return items.length > 0 && items.every(function(s) { return /^-?\d+$/.test(s); });
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const h = parseHeap(config.heap || "");
	if (h.error) return [h.error];
	const o = parseOps(config.ops);
	if (o.error) return [o.error];
	const all = h.items.concat(o.ops.filter(function(x) { return x.op === "insert"; }).map(function(x) { return x.x; }));
	if (all.length && !numeric(all) && all.some(function(s) { return /^-?\d+$/.test(s); })) {
		return ["\"heap\"/\"ops\": mix of numbers and words; use one kind so keys compare sensibly"];
	}
	const want = config.order === "min" ? "delMin" : "delMax";
	for (const x of o.ops) {
		if (x.name && x.name !== want) return ["\"ops\": " + x.name + "() doesn't match a " + (config.order === "min" ? "min" : "max") + "-heap; use " + want + "()"];
	}
	let n = h.items.length;
	for (let i = 0; i < o.ops.length; i++) {
		const x = o.ops[i];
		if (x.op === "sortdown" || x.op === "heapsort") {
			if (i !== o.ops.length - 1) return ["\"ops\": " + x.op + "() must be the last operation"];
			if (n < 1) return ["\"ops\": " + x.op + "() on an empty heap"];
			continue;
		}
		if (x.op === "heapify") { if (n < 1) return ["\"ops\": heapify() on an empty heap"]; continue; }
		if (x.op === "insert") { n++; if (n > MAXN) return ["\"ops\": insert would make the heap bigger than " + MAXN]; }
		else if (x.op === "delMax") { if (n === 0) return ["\"ops\": delMax() on an empty heap"]; n--; }
		else if (x.k < 1 || x.k > n) return ["\"ops\": " + x.op + "(" + x.k + ") is out of range (heap has n = " + n + ")"];
	}
	return [];
}

// Line numbers below are 1-based into this array.
const CODE_LINES = [
	"void insert(const Key& x) {",       // 1
	"    pq[++n] = x;",                   // 2
	"    swim(n);",                       // 3
	"}",                                  // 4
	"void swim(size_t k) {",              // 5
	"    while (k > 1 && less(k/2, k)) {",// 6
	"        exch(k, k/2);",              // 7
	"        k = k/2;",                   // 8
	"    }",                              // 9
	"}",                                  // 10
	"void sink(int k) {",                 // 11
	"    while (2*k <= n) {",             // 12
	"        int j = 2*k;",               // 13
	"        if (j < n && less(j, j+1))", // 14
	"            j++;",                   // 15
	"        if (!less(k, j)) break;",    // 16
	"        exch(k, j);",                // 17
	"        k = j;",                     // 18
	"    }",                              // 19
	"}",                                  // 20
	"Key delMax() {",                     // 21
	"    Key max = pq[1];",               // 22
	"    exch(1, n--);",                  // 23
	"    sink(1);",                       // 24
	"    return max;",                    // 25
	"}",                                  // 26
	"void sortdown() {",                  // 27
	"    while (n > 1) {",                // 28
	"        exch(1, n--);",              // 29
	"        sink(1);",                   // 30
	"    }",                              // 31
	"}",                                  // 32
	"void heapify() {",                   // 33
	"    for (int k = n/2; k >= 1; k--)", // 34
	"        sink(k);",                   // 35
	"}",                                  // 36
	"void heapSort() {",                  // 37
	"    for (int k = n/2; k >= 1; k--)", // 38
	"        sink(k);       // 1: heapify",// 39
	"    while (n > 1) {   // 2: sortdown",// 40
	"        exch(1, n--);",              // 41
	"        sink(1);",                   // 42
	"    }",                              // 43
	"}"                                   // 44
];

// Sections of CODE_LINES (1-based, inclusive); show only the ones the ops use.
const SECTIONS = { insert: [1, 4], swim: [5, 10], sink: [11, 20], delMax: [21, 26], sortdown: [27, 32], heapify: [33, 36], heapsort: [37, 44] };
const ORDER = ["insert", "swim", "sink", "delMax", "heapify", "sortdown", "heapsort"];

function usedSections(config) {
	const r = parseOps(config.ops || "");
	const used = { insert: false, swim: false, sink: false, delMax: false, sortdown: false, heapify: false, heapsort: false };
	(r.ops || []).forEach(function(o) {
		used[o.op] = true;
		if (o.op === "insert") used.swim = true;
		if (o.op !== "insert" && o.op !== "swim") used.sink = true;
	});
	if (!r.ops) for (const k in used) used[k] = true;
	return used;
}

// old line number -> shown line number (0 = hidden)
function lineMap(config) {
	const used = usedSections(config);
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
	const lines = CODE_LINES.map(function(l) {
		return config.order === "min" ? l.replace("delMax()", "delMin()").replace("Key max", "Key min").replace("return max", "return min") : l;
	});
	return { cpp: lines.filter(function(_, i) { return map[i + 1] > 0; }) };
}

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("k (the key moving)", "k（正在移动的键）") },
		{ cls: "is-min", label: T("Compared with", "与之比较的键") },
		{ cls: "is-swap", label: T("Just exchanged", "刚交换过") },
		{ cls: "is-sorted", label: T("Settled / returned", "已就位 / 已返回") }
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
		const heap = splitItems((config && config.heap) || "");
		const words = heap.length > 0 && !numeric(heap);
		const ops = [];
		for (let i = 0; i < 3; i++) {
			ops.push("insert(" + (words ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)] : Math.floor(Math.random() * 99 + 1)) + ")");
		}
		ops.push(config && config.order === "min" ? "delMin()" : "delMax()");
		return ops.join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const isMin = config.order === "min";
	const raw = parseHeap(config.heap || "").items;
	const ops = parseOps(config.ops).ops;
	const allKeys = raw.concat(ops.filter(function(x) { return x.op === "insert"; }).map(function(x) { return x.x; }));
	const num = numeric(allKeys);
	const val = function(s) { return num ? Number(s) : s; };
	const pq = [null].concat(raw);
	// A stable id per key, parallel to pq, so an exchange is drawn as two keys trading places.
	const ids = [null].concat(raw.map(function(_, k) { return k + 1; }));
	let nextId = raw.length + 1;
	let n = raw.length;
	let compares = 0, exchanges = 0;
	let returned = "—";
	const frames = [];
	const parentWord = isMin ? "smaller" : "larger";
	const parentWordZh = isMin ? "更小" : "更大";
	const oppWord = isMin ? "larger" : "smaller";
	const oppWordZh = isMin ? "更大" : "更小";

	// less(i, j) in the slides' sense: for a min-heap the comparison flips.
	function less(i, j) {
		compares++;
		const a = val(pq[i]), b = val(pq[j]);
		return isMin ? a > b : a < b;
	}
	function exch(i, j) { exchanges++; const t = pq[i]; pq[i] = pq[j]; pq[j] = t; const u = ids[i]; ids[i] = ids[j]; ids[j] = u; }

	function push(f) {
		frames.push({
			pq: pq.slice(0, n + 1),
			sorted: pq.slice(n + 1),
			ids: ids.slice(0, n + 1),
			sortedIds: ids.slice(n + 1),
			ghost: f.ghost || null,
			k: f.k || 0, j: f.j || 0,
			swapped: f.swapped || null,
			swap: f.swapped && f.swapped.length === 2 ? f.swapped.slice() : null,
			step: frames.length,
			settled: f.settled || 0,
			lines: f.lines || [],
			group: f.group,
			msg: f.msg,
			vars: [
				["n", String(n)],
				["k", f.k ? String(f.k) : "—"],
				["j", f.j ? String(f.j) : "—"],
				[T("compares", "比较次数"), String(compares)],
				[T("exchanges", "交换次数"), String(exchanges)],
				[T("returned", "返回值"), returned]
			]
		});
	}

	push({ group: 0, msg: T((isMin ? "Min" : "Max") + "-heap in an array: `pq[0]` unused, root at `pq[1]`, the children of `pq[k]` are `pq[2k]` and `pq[2k+1]`, its parent is `pq[k/2]`." +
		(n ? " n = " + n + "." : " Empty heap."),
		"数组里的" + (isMin ? "最小堆" : "最大堆") + "：`pq[0]` 不用，根在 `pq[1]`，`pq[k]` 的孩子是 `pq[2k]` 和 `pq[2k+1]`，它的父节点是 `pq[k/2]`。" +
		(n ? "n = " + n + "。" : "堆是空的。")) });

	function swim(k, g, base) {
		// base = line offset: swim's lines 5..10.
		while (true) {
			if (k <= 1) {
				push({ k: k, settled: k, lines: [6], group: g, msg: T("k = 1: `" + pq[k] + "` reached the root, so the loop stops.", "k = 1：`" + pq[k] + "` 已到达根，循环结束。") });
				return;
			}
			const p = Math.floor(k / 2);
			const lt = less(p, k);
			push({ k: k, j: p, lines: [6], group: g,
				msg: T("Parent of k = " + k + " is k/2 = " + p + ". `less(" + p + ", " + k + ")`: is `" + pq[p] + "` " + oppWord + " than `" + pq[k] + "`? " +
					(lt ? "Yes — heap order is violated." : "No — `" + pq[k] + "` is in place."),
					"k = " + k + " 的父节点是 k/2 = " + p + "。`less(" + p + ", " + k + ")`：`" + pq[p] + "` 比 `" + pq[k] + "` " + oppWordZh + "吗？" +
					(lt ? "是——堆序被破坏了。" : "否——`" + pq[k] + "` 已在正确位置。")) });
			if (!lt) { push({ k: k, settled: k, lines: [9, 10], group: g, msg: T("Heap order holds again; swim stops at k = " + k + ".", "堆序恢复，上浮在 k = " + k + " 处停止。") }); return; }
			exch(k, p);
			push({ k: p, swapped: [k, p], lines: [7, 8], group: g,
				msg: T("`exch(" + k + ", " + p + ")`: the " + parentWord + " key `" + pq[p] + "` moves up; `k = k/2 = " + p + "`.",
					"`exch(" + k + ", " + p + ")`：" + parentWordZh + "的键 `" + pq[p] + "` 上移；`k = k/2 = " + p + "`。") });
			k = p;
		}
	}

	function sink(k, g) {
		while (true) {
			if (2 * k > n) {
				push({ k: k, settled: k, lines: [12], group: g, msg: T("2k = " + (2 * k) + " > n = " + n + ": `" + pq[k] + "` is a leaf now, so sink stops.", "2k = " + (2 * k) + " > n = " + n + "：`" + pq[k] + "` 现在是叶子，下沉结束。") });
				return;
			}
			let j = 2 * k;
			push({ k: k, j: j, lines: [12, 13], group: g, msg: T("2k = " + j + " ≤ n: `" + pq[k] + "` has a child. Start with the left child, j = " + j + " (`" + pq[j] + "`).", "2k = " + j + " ≤ n：`" + pq[k] + "` 有孩子。先取左孩子，j = " + j + "（`" + pq[j] + "`）。") });
			if (j < n) {
				const pick = less(j, j + 1);
				if (pick) j++;
				push({ k: k, j: j, lines: pick ? [14, 15] : [14], group: g,
					msg: T("Compare the two children `" + pq[2 * k] + "` and `" + pq[2 * k + 1] + "`: " +
						(String(pq[2 * k]) === String(pq[2 * k + 1]) ? "they tie, so j stays at the left child " + j + "." : "the " + parentWord + " one is `" + pq[j] + "` at j = " + j + "."),
						"比较两个孩子 `" + pq[2 * k] + "` 和 `" + pq[2 * k + 1] + "`：" +
						(String(pq[2 * k]) === String(pq[2 * k + 1]) ? "它们相等，所以 j 仍指向左孩子 " + j + "。" : parentWordZh + "的是 `" + pq[j] + "`，j = " + j + "。")) });
			}
			const ok = !less(k, j);
			if (ok) {
				push({ k: k, j: j, settled: k, lines: [16], group: g,
					msg: T("`less(" + k + ", " + j + ")` is false: `" + pq[k] + "` is not " + oppWord + " than `" + pq[j] + "`. Heap order holds; break.",
						"`less(" + k + ", " + j + ")` 为假：`" + pq[k] + "` 不比 `" + pq[j] + "` " + oppWordZh + "。堆序成立，`break`。") });
				return;
			}
			exch(k, j);
			push({ k: j, swapped: [k, j], lines: [17, 18], group: g,
				msg: T("`exch(" + k + ", " + j + ")`: `" + pq[k] + "` moves up, `" + pq[j] + "` moves down; `k = j = " + j + "`.",
				"`exch(" + k + ", " + j + ")`：`" + pq[k] + "` 上移，`" + pq[j] + "` 下移；`k = j = " + j + "`。") });
			k = j;
		}
	}

	// Bottom-up construction: sink every internal node, right to left.
	function heapify(g, L) {
		const start = Math.floor(n / 2);
		if (start === 0) {
			push({ k: 0, lines: L.head, group: g + ":intro", msg: T("n = 1: n/2 = 0, so the loop doesn't run; one key is already a heap.", "n = 1：n/2 = 0，循环一次也不执行；一个键本身就是堆。") });
			return;
		}
		push({ k: 0, lines: L.head, group: g + ":intro",
			msg: T("Bottom-up construction: a[" + (start + 1) + ".." + n + "] are leaves, already one-key heaps, so skip them. Sink each internal node from k = n/2 = " + start + " down to 1; when k is sunk, both of its subtrees are already heaps.",
				"自底向上建堆：a[" + (start + 1) + ".." + n + "] 是叶子，本身就是只有一个键的堆，跳过它们。从 k = n/2 = " + start + " 递减到 1，逐个下沉内部节点；下沉 k 时，它的两棵子树都已经是堆。") });
		for (let k = start; k >= 1; k--) {
			const gk = g + ":k" + k;
			push({ k: k, lines: L.loop, group: gk, msg: T("k = " + k + ": `sink(" + k + ")`, `" + pq[k] + "` may be " + oppWord + " than a child.", "k = " + k + "：`sink(" + k + ")`，`" + pq[k] + "` 可能比某个孩子" + oppWordZh + "。") });
			push({ k: k, lines: L.sink, group: gk, msg: T("`sink(" + k + ")` on the subtree rooted at " + k + ".", "对以 " + k + " 为根的子树执行 `sink(" + k + ")`。") });
			sink(k, gk);
		}
	}

	// Phase 2 of heap sort: the maximum to the back, shrink the heap, sink the new root.
	function sortdown(g, L) {
		let round = 0;
		while (n > 1) {
			const gr = g + ":r" + (++round);
			const top = pq[1];
			exch(1, n);
			n--;
			push({ k: 1, swapped: n + 1 !== 1 ? [1, n + 1] : null, lines: L.exch, group: gr,
				msg: T("`exch(1, n--)`: max `" + top + "` goes to a[" + (n + 1) + "], its final place; n is now " + n + ". The array is a heap a[1.." + n + "] followed by the sorted part a[" + (n + 1) + ".." + (pq.length - 1) + "].",
				"`exch(1, n--)`：最大值 `" + top + "` 换到 a[" + (n + 1) + "]，这是它的最终位置；n 现在是 " + n + "。数组由堆 a[1.." + n + "] 和后面的有序部分 a[" + (n + 1) + ".." + (pq.length - 1) + "] 组成。") });
			if (n > 1) {
				push({ k: 1, lines: L.sink, group: gr, msg: T("`sink(1)`: restore heap order on a[1.." + n + "].", "`sink(1)`：恢复 a[1.." + n + "] 上的堆序。") });
				sink(1, gr);
			}
		}
		push({ k: 1, settled: 1, lines: L.loop, group: g + ":end", msg: T("n = 1: a single key is already in place, so the loop stops. Sorted: " + pq.slice(1).join(" ") + ".", "n = 1：只剩一个键，已在正确位置，循环结束。排序结果：" + pq.slice(1).join(" ") + "。") });
	}

	ops.forEach(function(o, idx) {
		const g = idx + 1;
		if (o.op === "insert") {
			pq[++n] = o.x;
			pq.length = n + 1;
			ids[n] = nextId++;
			ids.length = n + 1;
			push({ k: n, lines: [1, 2], group: g, msg: T("`insert(" + o.x + ")`: put it at the end of the bottom level, `pq[" + n + "]` (n is now " + n + ").", "`insert(" + o.x + ")`：把它放在最底层的末尾，即 `pq[" + n + "]`（n 现在是 " + n + "）。") });
			push({ k: n, lines: [3, 5], group: g, msg: T("`swim(" + n + ")`: move it up while it is " + parentWord + " than its parent.", "`swim(" + n + ")`：只要它比父节点" + parentWordZh + "，就把它上移。") });
			swim(n, g);
		} else if (o.op === "swim") {
			push({ k: o.k, lines: [5], group: g, msg: T("`swim(" + o.k + ")`: `" + pq[o.k] + "` may be " + parentWord + " than its parent.", "`swim(" + o.k + ")`：`" + pq[o.k] + "` 可能比它的父节点" + parentWordZh + "。") });
			swim(o.k, g);
		} else if (o.op === "sink") {
			push({ k: o.k, lines: [11], group: g, msg: T("`sink(" + o.k + ")`: `" + pq[o.k] + "` may be " + oppWord + " than a child.", "`sink(" + o.k + ")`：`" + pq[o.k] + "` 可能比某个孩子" + oppWordZh + "。") });
			sink(o.k, g);
		} else if (o.op === "heapify") {
			heapify(g, { head: [33, 34], loop: [34], sink: [35, 11] });
			push({ k: 0, lines: [34, 36], group: g + ":end", msg: T("k = 0: the loop ends. Every subtree is a heap, so the whole array is one: " + pq.slice(1, n + 1).join(" ") + ".", "k = 0：循环结束。每棵子树都是堆，所以整个数组就是一个堆：" + pq.slice(1, n + 1).join(" ") + "。") });
		} else if (o.op === "heapsort") {
			push({ lines: [37], group: g + ":intro", msg: T("`heapSort()`: phase 1 builds a heap bottom-up (O(n)), phase 2 (sortdown) moves the maximum to the back n − 1 times (O(n log n)).", "`heapSort()`：第一阶段自底向上建堆（O(n)），第二阶段（sortdown）把最大值换到后面，共 n − 1 次（O(n log n)）。") });
			heapify(g, { head: [38], loop: [38], sink: [39, 11] });
			push({ k: 0, lines: [38], group: g + ":p1", msg: T("Phase 1 done: the array is a heap, " + pq.slice(1, n + 1).join(" ") + ". Now phase 2.", "第一阶段完成：数组已是堆，" + pq.slice(1, n + 1).join(" ") + "。接下来是第二阶段。") });
			sortdown(g, { loop: [40], exch: [41], sink: [42, 11] });
		} else if (o.op === "sortdown") {
			push({ lines: [27, 28], group: g, msg: T("`sortdown()`: repeatedly move the maximum to the end of the heap and shrink n; the removed keys stay in the array, sorted.", "`sortdown()`：反复把最大值换到堆的末尾并缩小 n；被移出的键留在数组里，保持有序。") });
			sortdown(g, { loop: [28], exch: [29], sink: [30, 11] });
		} else {
			const top = pq[1];
			push({ k: 1, lines: [21, 22], group: g, msg: T("`" + (isMin ? "delMin" : "delMax") + "()`: the " + (isMin ? "minimum" : "maximum") + " is at the root, `max = pq[1] = " + top + "`.", "`" + (isMin ? "delMin" : "delMax") + "()`：" + (isMin ? "最小值" : "最大值") + "在根上，`max = pq[1] = " + top + "`。") });
			const last = n;
			exch(1, n);
			const removed = pq[n];
			const removedId = ids[n];
			n--;
			pq.length = n + 1;
			ids.length = n + 1;
			returned = String(removed);
			push({ k: 1, ghost: { idx: last, key: removed, id: removedId }, swapped: last !== 1 ? [1, last] : null, lines: [23], group: g,
				msg: n >= 1
					? T("`exch(1, n--)`: the last key `" + pq[1] + "` goes to the root and `" + removed + "` leaves the heap (n is now " + n + ").", "`exch(1, n--)`：最后一个键 `" + pq[1] + "` 换到根，`" + removed + "` 离开堆（n 现在是 " + n + "）。")
					: T("`exch(1, n--)`: `" + removed + "` was the only key; it leaves and the heap is empty.", "`exch(1, n--)`：`" + removed + "` 是唯一的键；它离开后堆变空。") });
			if (n >= 1) {
				push({ k: 1, lines: [24, 11], group: g, msg: T("`sink(1)`: the new root is probably too " + (isMin ? "large" : "small") + "; sink it.", "`sink(1)`：新的根多半太" + (isMin ? "大" : "小") + "了，让它下沉。") });
				sink(1, g);
			}
			push({ lines: [25], group: g, msg: T("Return `" + removed + "`.", "返回 `" + removed + "`。") });
		}
	});

	const map = lineMap(config);
	frames.forEach(function(f) { f.lines = f.lines.map(function(l) { return map[l]; }).filter(Boolean); });
	const lastOp = ops[ops.length - 1].op;
	if (lastOp === "heapsort") {
		push({ k: 1, settled: 1, group: ops.length, msg: T("Done. Sorted in place: " + pq.slice(1).join(" ") + ". " + compares + " compares, " + exchanges + " exchanges. Phase 1 is O(n), phase 2 is O(n log n), so heap sort is O(n log n), with no extra array.", "完成。原地排序的结果：" + pq.slice(1).join(" ") + "。共 " + compares + " 次比较、" + exchanges + " 次交换。第一阶段 O(n)，第二阶段 O(n log n)，所以堆排序是 O(n log n)，且不需要额外数组。") });
	} else if (lastOp === "sortdown") {
		push({ k: 1, settled: 1, group: ops.length, msg: T("Done. Sorted in place: " + pq.slice(1).join(" ") + ". n − 1 exchanges and sinks, each O(log n): O(n log n) overall.", "完成。原地排序的结果：" + pq.slice(1).join(" ") + "。n − 1 次交换和下沉，每次 O(log n)：总共 O(n log n)。") });
	} else if (lastOp === "heapify" && ops.every(function(x) { return x.op === "heapify"; })) {
		push({ group: ops.length, msg: T("Done. Heap: " + pq.slice(1, n + 1).join(" ") + ". " + compares + " compares, " + exchanges + " exchanges: bottom-up construction is O(n), because most nodes are near the bottom and sink only a little.", "完成。堆：" + pq.slice(1, n + 1).join(" ") + "。共 " + compares + " 次比较、" + exchanges + " 次交换：自底向上建堆是 O(n)，因为大多数节点靠近底部，只下沉一小段。") });
	} else {
		push({ group: ops.length, msg: T("Done. Heap: " + (n ? pq.slice(1, n + 1).join(" ") : "(empty)") + ". Each swim/sink walks one root-to-leaf path: O(log n).", "完成。堆：" + (n ? pq.slice(1, n + 1).join(" ") : "（空）") + "。每次上浮 / 下沉只走一条从根到叶子的路径：O(log n)。") });
	}
	// One drawing size for the whole demo, so the page doesn't jump between steps.
	const maxTotal = frames.reduce(function(m, f) {
		f.total = Math.max(f.pq.length - 1 + f.sorted.length, f.ghost ? f.ghost.idx : 0);
		return Math.max(m, f.total);
	}, 1);
	frames.forEach(function(f) { f.maxTotal = maxTotal; });
	return frames;
}

// ---------- drawing (shared tree + array views: an exchange is two keys trading places) ----------

function role(frame, i) {
	return cls(frame, i).replace(/^is-/, "");
}

function cls(frame, i) {
	if (frame.swapped && frame.swapped.indexOf(i) >= 0) return "is-swap";
	if (i === frame.k && i === frame.settled) return "is-sorted";
	if (i === frame.k) return "is-cmp";
	if (i === frame.j) return "is-min";
	return "";
}

export function render(stage, frame) {
	const pq = frame.pq;
	const n = pq.length - 1;
	const sorted = frame.sorted || [];
	const total = frame.total;
	const depth = Math.floor(Math.log2(Math.max(1, frame.maxTotal)));
	const isSwapped = function(i) { return !!frame.swapped && frame.swapped.indexOf(i) >= 0; };

	// One entry per slot 1..total: the key, its id and how it is drawn.
	const slots = [null];
	for (let i = 1; i <= total; i++) {
		if (i <= n) slots.push({ id: frame.ids[i], label: pq[i], role: role(frame, i), out: false });
		else if (i - n - 1 < sorted.length) slots.push({ id: frame.sortedIds[i - n - 1], label: sorted[i - n - 1], role: isSwapped(i) ? "swap" : "sorted", out: true });
		else if (frame.ghost && frame.ghost.idx === i) slots.push({ id: frame.ghost.id, label: frame.ghost.key, role: "ghost", out: false });
		else slots.push(null);
	}

	const nodes = [], edges = [];
	for (let i = 1; i <= total; i++) {
		const s = slots[i];
		if (!s) continue;
		const at = heapPlace(i, depth);
		nodes.push({ id: s.id, label: s.label, col: at.col, depth: at.depth, role: s.role, badge: i, dashed: s.out });
		if (i >= 2 && slots[i >> 1]) {
			const onPath = !!frame.swapped && frame.swapped.length === 2 && isSwapped(i) && isSwapped(i >> 1);
			// Heap links belong to the slots (i/2 → i), not to the keys: fixed lines, so an
			// exchange shows the two keys gliding along a still edge.
			const p = heapPlace(i >> 1, depth);
			edges.push({ key: i, at: [p.col, p.depth, at.col, at.depth], role: onPath ? "path" : "", dashed: i > n });
		}
	}
	treeView(stage).update({ nodes: nodes, edges: edges, cols: Math.pow(2, depth), rows: depth + 1 });

	const cells = [{ id: "slot0", label: "–", role: "unused" }];
	const index = [0];
	for (let i = 1; i <= total; i++) {
		const s = slots[i];
		cells.push({ id: s.id, label: s.label, role: s.role });
		index.push(i);
	}
	arrayView(stage, "arr").update({ cells: cells, index: index });
}

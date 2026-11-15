// Binary heap (array-backed, pq[0] unused): insert + swim, sink, swim, and
// delMax, plus heap sort's sortdown, step by step, drawn both as the tree
// and as the array.
import { checkParams } from "./_core.js";
import { treeView, heapPlace } from "./_tree.js";
import { arrayView } from "./_array.js";

const MAXN = 15;

export const meta = {
	name: "binary-heap",
	summary: "Array-backed binary heap: insert (swim up), swim(k), sink(k), delMax(), and heap sort's sortdown(), shown as tree and array.",
	groupLabel: "operation",
	params: {
		heap: { type: "string", default: "", desc: "Starting keys pq[1..n] in level order, comma-separated (ints or 1–3 char words; at most 15). Need not be heap-ordered when the first op is swim/sink." },
		ops: { type: "string", required: true, desc: "Operations separated by ';': insert(x), swim(k), sink(k), delMax(). delMin() on a min-heap. sortdown() (heap sort's second phase; must be the last op) keeps each removed max in the array, sorted. At most 16." },
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
		else if (/^sortdown\(\s*\)$/.test(p)) ops.push({ op: "sortdown" });
		else return { error: "\"ops\": can't read \"" + p + "\" (use insert(x), swim(k), sink(k), delMax(), sortdown())" };
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
		if (x.op === "sortdown") {
			if (i !== o.ops.length - 1) return ["\"ops\": sortdown() must be the last operation"];
			if (n < 1) return ["\"ops\": sortdown() on an empty heap"];
			continue;
		}
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
	"}"                                   // 32
];

// Sections of CODE_LINES (1-based, inclusive); show only the ones the ops use.
const SECTIONS = { insert: [1, 4], swim: [5, 10], sink: [11, 20], delMax: [21, 26], sortdown: [27, 32] };

function usedSections(config) {
	const r = parseOps(config.ops || "");
	const used = { insert: false, swim: false, sink: false, delMax: false, sortdown: false };
	(r.ops || []).forEach(function(o) {
		used[o.op] = true;
		if (o.op === "insert") used.swim = true;
		if (o.op === "delMax" || o.op === "sortdown") used.sink = true;
	});
	if (!r.ops) for (const k in used) used[k] = true;
	return used;
}

// old line number -> shown line number (0 = hidden)
function lineMap(config) {
	const used = usedSections(config);
	const map = {};
	let shown = 0;
	for (const name of ["insert", "swim", "sink", "delMax", "sortdown"]) {
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

export const legend = [
	{ cls: "is-cmp", label: "k (the key moving)" },
	{ cls: "is-min", label: "Compared with" },
	{ cls: "is-swap", label: "Just exchanged" },
	{ cls: "is-sorted", label: "Settled / returned" }
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
				["compares", String(compares)],
				["exchanges", String(exchanges)],
				["returned", returned]
			]
		});
	}

	push({ group: 0, msg: (isMin ? "Min" : "Max") + "-heap in an array: `pq[0]` unused, root at `pq[1]`, the children of `pq[k]` are `pq[2k]` and `pq[2k+1]`, its parent is `pq[k/2]`." +
		(n ? " n = " + n + "." : " Empty heap.") });

	function swim(k, g, base) {
		// base = line offset: swim's lines 5..10.
		while (true) {
			if (k <= 1) {
				push({ k: k, settled: k, lines: [6], group: g, msg: "k = 1: `" + pq[k] + "` reached the root, so the loop stops." });
				return;
			}
			const p = Math.floor(k / 2);
			const lt = less(p, k);
			push({ k: k, j: p, lines: [6], group: g,
				msg: "Parent of k = " + k + " is k/2 = " + p + ". `less(" + p + ", " + k + ")`: is `" + pq[p] + "` " + (isMin ? "larger" : "smaller") + " than `" + pq[k] + "`? " +
					(lt ? "Yes — heap order is violated." : "No — `" + pq[k] + "` is in place.") });
			if (!lt) { push({ k: k, settled: k, lines: [9, 10], group: g, msg: "Heap order holds again; swim stops at k = " + k + "." }); return; }
			exch(k, p);
			push({ k: p, swapped: [k, p], lines: [7, 8], group: g,
				msg: "`exch(" + k + ", " + p + ")`: the " + parentWord + " key `" + pq[p] + "` moves up; `k = k/2 = " + p + "`." });
			k = p;
		}
	}

	function sink(k, g) {
		while (true) {
			if (2 * k > n) {
				push({ k: k, settled: k, lines: [12], group: g, msg: "2k = " + (2 * k) + " > n = " + n + ": `" + pq[k] + "` is a leaf now, so sink stops." });
				return;
			}
			let j = 2 * k;
			push({ k: k, j: j, lines: [12, 13], group: g, msg: "2k = " + j + " ≤ n: `" + pq[k] + "` has a child. Start with the left child, j = " + j + " (`" + pq[j] + "`)." });
			if (j < n) {
				const pick = less(j, j + 1);
				if (pick) j++;
				push({ k: k, j: j, lines: pick ? [14, 15] : [14], group: g,
					msg: "Compare the two children `" + pq[2 * k] + "` and `" + pq[2 * k + 1] + "`: " +
						(String(pq[2 * k]) === String(pq[2 * k + 1]) ? "they tie, so j stays at the left child " + j + "." : "the " + parentWord + " one is `" + pq[j] + "` at j = " + j + ".") });
			}
			const ok = !less(k, j);
			if (ok) {
				push({ k: k, j: j, settled: k, lines: [16], group: g,
					msg: "`less(" + k + ", " + j + ")` is false: `" + pq[k] + "` is not " + (isMin ? "larger" : "smaller") + " than `" + pq[j] + "`. Heap order holds; break." });
				return;
			}
			exch(k, j);
			push({ k: j, swapped: [k, j], lines: [17, 18], group: g,
				msg: "`exch(" + k + ", " + j + ")`: `" + pq[k] + "` moves up, `" + pq[j] + "` moves down; `k = j = " + j + "`." });
			k = j;
		}
	}

	ops.forEach(function(o, idx) {
		const g = idx + 1;
		if (o.op === "insert") {
			pq[++n] = o.x;
			pq.length = n + 1;
			ids[n] = nextId++;
			ids.length = n + 1;
			push({ k: n, lines: [1, 2], group: g, msg: "`insert(" + o.x + ")`: put it at the end of the bottom level, `pq[" + n + "]` (n is now " + n + ")." });
			push({ k: n, lines: [3, 5], group: g, msg: "`swim(" + n + ")`: move it up while it is " + parentWord + " than its parent." });
			swim(n, g);
		} else if (o.op === "swim") {
			push({ k: o.k, lines: [5], group: g, msg: "`swim(" + o.k + ")`: `" + pq[o.k] + "` may be " + parentWord + " than its parent." });
			swim(o.k, g);
		} else if (o.op === "sink") {
			push({ k: o.k, lines: [11], group: g, msg: "`sink(" + o.k + ")`: `" + pq[o.k] + "` may be " + (isMin ? "larger" : "smaller") + " than a child." });
			sink(o.k, g);
		} else if (o.op === "sortdown") {
			push({ lines: [27, 28], group: g, msg: "`sortdown()`: repeatedly move the maximum to the end of the heap and shrink n; the removed keys stay in the array, sorted." });
			while (n > 1) {
				const top = pq[1];
				exch(1, n);
				n--;
				push({ k: 1, swapped: n + 1 !== 1 ? [1, n + 1] : null, lines: [29], group: g,
					msg: "`exch(1, n--)`: max `" + top + "` goes to a[" + (n + 1) + "], its final place; n is now " + n + ". The array is a heap a[1.." + n + "] followed by the sorted part a[" + (n + 1) + ".." + (pq.length - 1) + "]." });
				if (n > 1) {
					push({ k: 1, lines: [30, 11], group: g, msg: "`sink(1)`: restore heap order on a[1.." + n + "]." });
					sink(1, g);
				}
			}
			push({ k: 1, settled: 1, lines: [28], group: g, msg: "n = 1: a single key is already in place, so the loop stops. Sorted: " + pq.slice(1).join(" ") + "." });
		} else {
			const top = pq[1];
			push({ k: 1, lines: [21, 22], group: g, msg: "`" + (isMin ? "delMin" : "delMax") + "()`: the " + (isMin ? "minimum" : "maximum") + " is at the root, `max = pq[1] = " + top + "`." });
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
					? "`exch(1, n--)`: the last key `" + pq[1] + "` goes to the root and `" + removed + "` leaves the heap (n is now " + n + ")."
					: "`exch(1, n--)`: `" + removed + "` was the only key; it leaves and the heap is empty." });
			if (n >= 1) {
				push({ k: 1, lines: [24, 11], group: g, msg: "`sink(1)`: the new root is probably too " + (isMin ? "large" : "small") + "; sink it." });
				sink(1, g);
			}
			push({ lines: [25], group: g, msg: "Return `" + removed + "`." });
		}
	});

	const map = lineMap(config);
	frames.forEach(function(f) { f.lines = f.lines.map(function(l) { return map[l]; }).filter(Boolean); });
	if (ops[ops.length - 1].op === "sortdown") {
		push({ k: 1, settled: 1, group: ops.length, msg: "Done. Sorted in place: " + pq.slice(1).join(" ") + ". n − 1 exchanges and sinks, each O(log n): O(n log n) overall." });
	} else {
		push({ group: ops.length, msg: "Done. Heap: " + (n ? pq.slice(1, n + 1).join(" ") : "(empty)") + ". Each swim/sink walks one root-to-leaf path: O(log n)." });
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

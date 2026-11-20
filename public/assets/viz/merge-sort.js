// Top-down merge sort (Lecture 8), step by step: the recursive sort() calls
// with lo/mid/hi, and every merge() with its copy to aux and the k loop
// that picks from the left (i) or right (j) half. mode "merge" shows one
// merge of two already sorted halves (the slides' A G L O R | H I M S T).
import { arrayView } from "./_array.js";
import { checkParams, randomInts, tr } from "./_core.js";

export const meta = {
	name: "merge-sort",
	summary: "Merge sort with an aux array: recursive splits, then merge() picks from aux[i] or aux[j] for each k.",
	groupLabel: { en: "merge", zh: "归并" },
	params: {
		items: { type: "string", required: true, desc: "Values, comma-separated: integers or short words (2–16 items, 1–3 chars each), e.g. \"M, E, R, G, E, S, R, T\"." },
		mode: { type: "enum", values: ["sort", "merge"], default: "sort", desc: "\"sort\" runs the whole recursion; \"merge\" runs one merge(a, aux, 0, mid, n-1)." },
		mid: { type: "int", min: 0, desc: "Only for mode \"merge\": last index of the left half. Both halves must already be sorted." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code shown beside the demo, with the running line highlighted." }
	},
	example: { items: "M, E, R, G, E, S, R, T" }
};

function parseItems(text) {
	const parts = String(text).split(/[\s,，]+/).filter(Boolean);
	if (parts.length < 2) return { error: "needs at least 2 items" };
	if (parts.length > 16) return { error: "can have at most 16 items" };
	for (const p of parts) {
		if (p.length > 3 && !/^-?\d+$/.test(p)) return { error: "\"" + p + "\" is longer than 3 characters" };
		if (/^-?\d+$/.test(p) && (Number(p) < -99 || Number(p) > 999)) return { error: "\"" + p + "\" must be between -99 and 999" };
	}
	const numeric = parts.every(function(p) { return /^-?\d+$/.test(p); });
	return { values: numeric ? parts.map(Number) : parts, numeric: numeric };
}

function less(x, y) { return x < y; }

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const r = parseItems(config.items);
	if (r.error) return ["\"items\" " + r.error];
	const mode = config.mode || "sort";
	if (mode === "merge") {
		const n = r.values.length;
		if (config.mid === undefined) return ["mode \"merge\" needs \"mid\" (last index of the left half)"];
		if (config.mid > n - 2) return ["\"mid\" must be between 0 and " + (n - 2) + " so both halves are non-empty"];
		for (let k = 1; k < n; k++) {
			if (k === config.mid + 1) continue;
			if (less(r.values[k], r.values[k - 1])) {
				return ["for mode \"merge\" both halves must be sorted: \"" + r.values[k - 1] + "\" comes before \"" + r.values[k] + "\""];
			}
		}
	} else if (config.mid !== undefined) {
		return ["\"mid\" is only used with mode \"merge\""];
	}
	return [];
}

// The slide code, compacted to fit the panel (≤ 48 chars per line).
const CODE = {
	cpp: [
		"void sort(T* a, T* aux, int lo, int hi) {",
		"    if (hi <= lo) return;",
		"    int mid = lo + (hi - lo) / 2;",
		"    sort(a, aux, lo, mid);",
		"    sort(a, aux, mid+1, hi);",
		"    merge(a, aux, lo, mid, hi);",
		"}",
		"void merge(T* a, T* aux, int lo, int mid,",
		"           int hi) {",
		"    for (int k = lo; k <= hi; k++)",
		"        aux[k] = a[k];",
		"    int i = lo, j = mid + 1;",
		"    for (int k = lo; k <= hi; k++) {",
		"        if (i > mid) a[k] = aux[j++];",
		"        else if (j > hi) a[k] = aux[i++];",
		"        else if (aux[j] < aux[i])",
		"            a[k] = aux[j++];",
		"        else a[k] = aux[i++];",
		"    }",
		"}"
	]
};

// Mode "merge" only runs merge(), so it shows just that function (lines 8–20,
// renumbered 1–13 in steps()) to keep the demo short.
const MERGE_FROM = 8;
export function code(config) {
	if ((config.mode || "sort") === "sort") return CODE;
	return { cpp: CODE.cpp.slice(MERGE_FROM - 1) };
}

// Sort mode (recursion tree) and merge mode (aux + a rows) colour different things.
export function legend(config) {
	const T = tr(config);
	if ((config.mode || "sort") === "sort") {
		return [
			{ cls: "is-cur", label: T("Current call", "当前调用") },
			{ cls: "is-cmp", label: T("Being compared · aux[i] vs aux[j]", "正在比较 · aux[i] 与 aux[j]") },
			{ cls: "is-swap", label: T("Just written · a[k]", "刚写入 · a[k]") },
			{ cls: "is-sorted", label: T("Sorted (merge result)", "已有序（归并结果）") },
			{ cls: "is-used", label: T("Already taken by the merge", "已被归并取走") }
		];
	}
	return [
		{ cls: "is-cmp", label: T("Being compared · aux[i] vs aux[j]", "正在比较 · aux[i] 与 aux[j]") },
		{ cls: "is-swap", label: T("Just written · a[k]", "刚写入 · a[k]") },
		{ cls: "is-sorted", label: T("Sorted subarray (merge result)", "有序子数组（归并结果）") },
		{ cls: "is-out", label: T("Outside lo..hi", "lo..hi 之外") }
	];
}

export const input = {
	key: "items",
	label: { en: "Items", zh: "元素" },
	format: function(config) { return config.items; },
	parse: function(text) {
		const r = parseItems(text);
		return r.error ? { error: r.error } : { value: r.values.join(", ") };
	},
	random: function() { return randomInts(8, 1, 99).join(", "); }
};

export function steps(config) {
	const T = tr(config);
	const parsed = parseItems(config.items);
	const a = parsed.values.slice();
	const n = a.length;
	const aux = new Array(n).fill(null);
	// Cell ids for the two rows. A slot of `a` gets a fresh id each time merge()
	// writes it, and a slot of `aux` each time it is copied from `a`, so those
	// values appear as new cells; an empty aux slot has an id of its own.
	const aId = a.map(function(_, k) { return "a" + k + ".0"; });
	const auxId = new Array(n).fill(null);
	const gen = new Array(n).fill(0);
	const frames = [];
	const stack = [];
	let comparisons = 0;
	let group = 0;
	let sortedRanges = [];
	const mergeOnly = (config.mode || "sort") === "merge";

	function push(f) {
		frames.push({
			a: a.slice(),
			aux: aux.slice(),
			aIds: aId.slice(),
			auxIds: auxId.map(function(id, k) { return id === null ? "empty:" + k : id; }),
			lo: f.lo, mid: f.mid, hi: f.hi,
			i: f.i, j: f.j, k: f.k,
			cmp: f.cmp || null,
			wrote: f.wrote === undefined ? null : f.wrote,
			sorted: sortedRanges.map(function(r) { return r.slice(); }),
			lines: f.lines || [],
			msg: f.msg,
			group: group,
			vars: [
				...(mergeOnly ? [] : [[T("call stack", "调用栈"), stack.length ? stack.join(" › ") : "—"]]),
				["lo, mid, hi", f.lo === undefined ? "—" : f.lo + ", " + (f.mid === undefined ? "?" : f.mid) + ", " + f.hi],
				["i, j, k", f.i === undefined ? "—" : f.i + ", " + f.j + ", " + (f.k === undefined ? "—" : f.k)],
				[T("comparisons", "比较次数"), String(comparisons)]
			]
		});
	}

	function addSorted(lo, hi) {
		sortedRanges = sortedRanges.filter(function(r) { return r[1] < lo || r[0] > hi; });
		sortedRanges.push([lo, hi]);
	}

	function copyToAux(k) {
		aux[k] = a[k];
		auxId[k] = "x" + k + "." + (++gen[k]);
	}

	function wrote(k) {
		aId[k] = "a" + k + "." + (++gen[k]);
	}

	function merge(lo, mid, hi) {
		const show2 = function(x) { return "`" + x + "`"; };
		for (let k = lo; k <= hi; k++) copyToAux(k);
		push({ lo: lo, mid: mid, hi: hi, lines: [10, 11],
			msg: T("`merge(a, aux, " + lo + ", " + mid + ", " + hi + ")`: copy `a[" + lo + ".." + hi + "]` into `aux`. Left half is `aux[" + lo + ".." + mid + "]`, right half is `aux[" + (mid + 1) + ".." + hi + "]`, both sorted.",
				"`merge(a, aux, " + lo + ", " + mid + ", " + hi + ")`：把 `a[" + lo + ".." + hi + "]` 复制到 `aux`。左半部分是 `aux[" + lo + ".." + mid + "]`，右半部分是 `aux[" + (mid + 1) + ".." + hi + "]`，两部分都已有序。") });
		let i = lo, j = mid + 1;
		push({ lo: lo, mid: mid, hi: hi, i: i, j: j, lines: [12],
			msg: T("`i = " + i + "` starts the left half, `j = " + j + "` starts the right half.", "`i = " + i + "` 指向左半部分的起点，`j = " + j + "` 指向右半部分的起点。") });
		for (let k = lo; k <= hi; k++) {
			let line, why;
			let cmp = null;
			if (i > mid) {
				line = [14]; why = ["`i > mid` (left half used up): take " + show2(aux[j]) + " from the right, `j++`.", "`i > mid`（左半部分已用完）：从右半部分取 " + show2(aux[j]) + "，`j++`。"];
				a[k] = aux[j++];
			} else if (j > hi) {
				line = [15]; why = ["`j > hi` (right half used up): take " + show2(aux[i]) + " from the left, `i++`.", "`j > hi`（右半部分已用完）：从左半部分取 " + show2(aux[i]) + "，`i++`。"];
				a[k] = aux[i++];
			} else {
				comparisons++;
				cmp = [i, j];
				if (less(aux[j], aux[i])) {
					line = [16, 17]; why = ["`aux[j] < aux[i]` (" + aux[j] + " < " + aux[i] + "): take " + show2(aux[j]) + " from the right, `j++`.", "`aux[j] < aux[i]`（" + aux[j] + " < " + aux[i] + "）：从右半部分取 " + show2(aux[j]) + "，`j++`。"];
					a[k] = aux[j++];
				} else {
					line = [18]; why = ["`aux[j] < aux[i]` is false (" + aux[j] + " vs " + aux[i] + (aux[i] === aux[j] ? ", equal, so the left one wins: stable" : "") + "): take " + show2(aux[i]) + " from the left, `i++`.", "`aux[j] < aux[i]` 为假（" + aux[j] + " 对 " + aux[i] + (aux[i] === aux[j] ? "，相等，所以左边的优先：稳定" : "") + "）：从左半部分取 " + show2(aux[i]) + "，`i++`。"];
					a[k] = aux[i++];
				}
			}
			wrote(k);
			push({ lo: lo, mid: mid, hi: hi, i: i, j: j, k: k, cmp: cmp, wrote: k, lines: line,
				msg: T("k = " + k + ": " + why[0] + " `a[" + k + "] = " + a[k] + "`.", "k = " + k + "：" + why[1] + " `a[" + k + "] = " + a[k] + "`。") });
		}
		addSorted(lo, hi);
		push({ lo: lo, mid: mid, hi: hi, lines: [20],
			msg: T("Merge done: `a[" + lo + ".." + hi + "]` = " + a.slice(lo, hi + 1).join(" ") + " is sorted.", "归并完成：`a[" + lo + ".." + hi + "]` = " + a.slice(lo, hi + 1).join(" ") + " 已有序。") });
		group++;
	}

	// Sort mode draws the recursion tree: one node per sort(lo, hi) call,
	// showing its values when called, then filled in slot by slot by merge().
	const nodes = [];
	const nodeAt = {};
	(function build(lo, hi, d) {
		const node = { lo: lo, hi: hi, d: d, state: "hidden", vals: null };
		nodes.push(node);
		nodeAt[lo + "-" + hi] = node;
		if (hi > lo) {
			const mid = lo + Math.floor((hi - lo) / 2);
			build(lo, mid, d + 1);
			build(mid + 1, hi, d + 1);
		}
	})(0, n - 1, 0);
	let current = null;
	let merging = null;

	function pushTree(f) {
		push(f);
		frames[frames.length - 1].tree = {
			n: n,
			nodes: nodes.map(function(x) { return { lo: x.lo, hi: x.hi, d: x.d, state: x.state, vals: x.vals ? x.vals.slice() : null }; }),
			cur: current,
			merge: merging ? { lo: merging[0], mid: merging[1], hi: merging[2], i: f.i, j: f.j, k: f.k } : null,
			cmp: f.cmp || null,
			wrote: f.wrote === undefined ? null : f.wrote
		};
	}

	function treeMerge(lo, mid, hi) {
		const node = nodeAt[lo + "-" + hi];
		for (let k = lo; k <= hi; k++) copyToAux(k);
		merging = [lo, mid, hi];
		node.state = "merge";
		node.vals = new Array(hi - lo + 1).fill(null);
		let i = lo, j = mid + 1;
		pushTree({ lo: lo, mid: mid, hi: hi, i: i, j: j, lines: [10, 11, 12],
			msg: T("Both halves of `sort(" + lo + "," + hi + ")` are sorted. `merge()` copies `a[" + lo + ".." + hi + "]` to `aux` (the two halves below) and refills `a[" + lo + ".." + hi + "]` from the front: `i = " + i + "` on the left half, `j = " + j + "` on the right.",
				"`sort(" + lo + "," + hi + ")` 的两半都已有序。`merge()` 把 `a[" + lo + ".." + hi + "]` 复制到 `aux`（下方的两半），再从头重新填写 `a[" + lo + ".." + hi + "]`：`i = " + i + "` 在左半部分，`j = " + j + "` 在右半部分。") });
		for (let k = lo; k <= hi; k++) {
			let line, why;
			let cmp = null;
			if (i > mid) {
				line = [14]; why = ["left half used up: take `" + aux[j] + "` from the right", "左半部分已用完：从右半部分取 `" + aux[j] + "`"];
				a[k] = aux[j++];
			} else if (j > hi) {
				line = [15]; why = ["right half used up: take `" + aux[i] + "` from the left", "右半部分已用完：从左半部分取 `" + aux[i] + "`"];
				a[k] = aux[i++];
			} else {
				comparisons++;
				cmp = [i, j];
				if (less(aux[j], aux[i])) {
					line = [16, 17]; why = ["`" + aux[j] + " < " + aux[i] + "`: take `" + aux[j] + "` from the right", "`" + aux[j] + " < " + aux[i] + "`：从右半部分取 `" + aux[j] + "`"];
					a[k] = aux[j++];
				} else {
					line = [18]; why = [(aux[i] === aux[j] ? "`" + aux[i] + "` = `" + aux[j] + "`, the left one wins (stable)" : "`" + aux[i] + " ≤ " + aux[j] + "`") + ": take `" + aux[i] + "` from the left",
						(aux[i] === aux[j] ? "`" + aux[i] + "` = `" + aux[j] + "`，左边的优先（稳定）" : "`" + aux[i] + " ≤ " + aux[j] + "`") + "：从左半部分取 `" + aux[i] + "`"];
					a[k] = aux[i++];
				}
			}
			wrote(k);
			node.vals[k - lo] = a[k];
			pushTree({ lo: lo, mid: mid, hi: hi, i: i, j: j, k: k, cmp: cmp, wrote: k, lines: line,
				msg: T("k = " + k + ": " + why[0] + ", `a[" + k + "] = " + a[k] + "`.", "k = " + k + "：" + why[1] + "，`a[" + k + "] = " + a[k] + "`。") });
		}
		merging = null;
		node.state = "done";
		nodeAt[lo + "-" + mid].state = "used";
		nodeAt[(mid + 1) + "-" + hi].state = "used";
		addSorted(lo, hi);
		pushTree({ lo: lo, mid: mid, hi: hi, lines: [20],
			msg: T("Merge done: `a[" + lo + ".." + hi + "]` = " + a.slice(lo, hi + 1).join(" ") + " is sorted.", "归并完成：`a[" + lo + ".." + hi + "]` = " + a.slice(lo, hi + 1).join(" ") + " 已有序。") });
		group++;
	}

	function sort(lo, hi, side) {
		const node = nodeAt[lo + "-" + hi];
		const where = side ? T("The " + side + " half: ", (side === "left" ? "左" : "右") + "半部分：") : "";
		stack.push("sort(" + lo + "," + hi + ")");
		current = lo + "-" + hi;
		node.vals = a.slice(lo, hi + 1);
		if (hi <= lo) {
			node.state = "done";
			addSorted(lo, lo);
			pushTree({ lo: lo, hi: hi, lines: [2], msg: where + T("`sort(" + lo + "," + hi + ")` has one element (`" + a[lo] + "`): already sorted, return.", "`sort(" + lo + "," + hi + ")` 只有一个元素（`" + a[lo] + "`）：已有序，返回。") });
			stack.pop();
			return;
		}
		node.state = "open";
		const mid = lo + Math.floor((hi - lo) / 2);
		pushTree({ lo: lo, mid: mid, hi: hi, lines: [3],
			msg: where + T("`sort(" + lo + "," + hi + ")`: `mid = " + mid + "`, split into " + lo + ".." + mid + " and " + (mid + 1) + ".." + hi + ", then sort each half.", "`sort(" + lo + "," + hi + ")`：`mid = " + mid + "`，拆成 " + lo + ".." + mid + " 和 " + (mid + 1) + ".." + hi + " 两半，再分别排序。") });
		sort(lo, mid, "left");
		current = lo + "-" + hi;
		sort(mid + 1, hi, "right");
		current = lo + "-" + hi;
		treeMerge(lo, mid, hi);
		stack.pop();
		current = stack.length ? current : null;
	}

	if ((config.mode || "sort") === "merge") {
		addSorted(0, config.mid);
		addSorted(config.mid + 1, n - 1);
		push({ lo: 0, mid: config.mid, hi: n - 1, lines: [8, 9],
			msg: T("Start: `a[0.." + config.mid + "]` and `a[" + (config.mid + 1) + ".." + (n - 1) + "]` are each sorted. `merge()` combines them into one sorted array.", "开始：`a[0.." + config.mid + "]` 和 `a[" + (config.mid + 1) + ".." + (n - 1) + "]` 各自已有序。`merge()` 把它们合并成一个有序数组。") });
		merge(0, config.mid, n - 1);
		push({ lines: [], msg: T("Done: " + a.join(" ") + ". " + comparisons + " comparisons for n = " + n + " (between n/2 and n − 1).", "完成：" + a.join(" ") + "。n = " + n + " 时共比较 " + comparisons + " 次（介于 n/2 和 n − 1 之间）。") });
		frames.forEach(function(f) { f.lines = f.lines.map(function(l) { return l - MERGE_FROM + 1; }); });
	} else {
		sort(0, n - 1, null);
		current = null;
		pushTree({ lines: [], msg: T("Done: " + a.join(" ") + ". " + comparisons + " comparisons; every level of the tree costs at most n, and there are lg n levels: ~n lg n.", "完成：" + a.join(" ") + "。共比较 " + comparisons + " 次；树的每一层最多花费 n，共有 lg n 层：约 n lg n。") });
	}
	return frames;
}

const STYLE = `
.vz-ms { display: flex; flex-direction: column; }
.vz-ms .vz-row { flex: 0 1 auto; min-width: 0; gap: 0.3rem; }
.vz-ms .vz-col { flex: 0 1 auto; width: 2.9rem; }
.vz-ms .vz-cell { width: 100%; aspect-ratio: auto; height: 2.5rem; font-size: 1.05rem; border-radius: 0.5rem; }
.vz-ms .vz-idx { margin-top: 0.15rem; }
.vz-ms .vz-arr { align-items: stretch; } /* rows take the full width, so their cells shrink to fit instead of overflowing */
.vz-cell.is-out, .viz-legend .vz-swatch.is-out { opacity: 0.4; border-style: dashed; }
.vz-cell.is-empty { color: transparent; border-style: dashed; }
.vz-mt { display: grid; gap: 0.55rem 0; justify-content: center; justify-content: safe center; overflow-x: auto; }
.vz-mt-idx { text-align: center; color: var(--vz-muted); font-size: 0.72rem; font-variant-numeric: tabular-nums; }
.vz-mt-node { display: flex; gap: 0.2rem; padding: 0.2rem; margin: 0 0.15rem; border: 1.5px solid transparent; border-radius: 0.7rem; transition: opacity 0.25s, border-color 0.25s; }
.vz-mt-node.is-hidden { visibility: hidden; }
.vz-mt-node.is-cur { border-color: var(--vz-min-bd); background: var(--vz-min-bg); }
.vz-mt-node.is-faded { opacity: 0.45; }
.vz-mt .vz-cell { flex: 1 1 0; min-width: 0; aspect-ratio: auto; height: 2.3rem; font-size: 1rem; border-radius: 0.5rem; }
.vz-mt .vz-cell.is-used { opacity: 0.35; }
.vz-mt .vz-cell[data-ptr]::after { content: attr(data-ptr); position: absolute; top: -0.55rem; right: -0.2rem; padding: 0 0.25rem; border-radius: 0.4rem; background: var(--vz-surface); color: var(--vz-blue); font: 600 0.68rem/1.3 "Consolas", "Menlo", monospace; }
.viz-legend .vz-swatch.is-cur { background: var(--vz-min-bg); border-color: var(--vz-min-bd); }
.viz-legend .vz-swatch.is-used { background: var(--vz-sorted-bg); border-color: var(--vz-sorted-bd); opacity: 0.35; }
@media (max-width: 736px) { .vz-mt .vz-cell { height: 1.9rem; font-size: 0.85rem; } .vz-mt-node { gap: 0.12rem; padding: 0.12rem; margin: 0 0.08rem; } }
`;

function ensureStyle() {
	if (document.getElementById("viz-merge-sort-style")) return;
	const s = document.createElement("style");
	s.id = "viz-merge-sort-style";
	s.textContent = STYLE;
	document.head.appendChild(s);
}

function renderTree(stage, t) {
	let box = stage.querySelector(".vz-mt");
	if (!box || box.dataset.n !== String(t.n)) {
		stage.textContent = "";
		box = document.createElement("div");
		box.className = "vz-mt";
		box.dataset.n = String(t.n);
		box.style.gridTemplateColumns = "repeat(" + t.n + ", minmax(0, 3.2rem))";
		let html = "";
		for (let k = 0; k < t.n; k++) html += '<div class="vz-mt-idx" style="grid-row:1;grid-column:' + (k + 1) + '">' + k + "</div>";
		t.nodes.forEach(function(x) {
			let cells = "";
			for (let k = x.lo; k <= x.hi; k++) cells += '<div class="vz-cell"></div>';
			html += '<div class="vz-mt-node" data-key="' + x.lo + "-" + x.hi + '" style="grid-row:' + (x.d + 2) + ";grid-column:" + (x.lo + 1) + " / " + (x.hi + 2) + '">' + cells + "</div>";
		});
		box.innerHTML = html;
		stage.appendChild(box);
	}
	const m = t.merge;
	t.nodes.forEach(function(x) {
		const key = x.lo + "-" + x.hi;
		const el = box.querySelector('[data-key="' + key + '"]');
		el.classList.toggle("is-hidden", x.state === "hidden");
		el.classList.toggle("is-cur", t.cur === key && x.state !== "done");
		el.classList.toggle("is-faded", x.state === "used");
		// Which half of the running merge this node is, if any.
		const half = !m ? null : (x.lo === m.lo && x.hi === m.mid) ? "left" : (x.lo === m.mid + 1 && x.hi === m.hi) ? "right" : null;
		Array.from(el.children).forEach(function(cell, t2) {
			const k = x.lo + t2;
			const v = x.vals ? x.vals[t2] : null;
			cell.textContent = v === null || v === undefined ? "" : String(v);
			const empty = x.state === "merge" && v === null;
			const wrote = x.state === "merge" && t.wrote === k;
			cell.classList.toggle("is-empty", empty);
			cell.classList.toggle("is-swap", wrote);
			cell.classList.toggle("is-sorted", !wrote && !empty && (x.state === "done" || x.state === "used" || x.state === "merge"));
			let used = false, ptr = null;
			if (half === "left") { used = m.i !== undefined && k < m.i; if (k === m.i) ptr = "i"; }
			if (half === "right") { used = m.j !== undefined && k < m.j; if (k === m.j) ptr = "j"; }
			if (x.state === "merge" && m && m.k !== undefined && k === m.k) ptr = "k";
			cell.classList.toggle("is-used", used);
			cell.classList.toggle("is-cmp", !!half && !!t.cmp && t.cmp.includes(k));
			if (ptr) cell.dataset.ptr = ptr; else delete cell.dataset.ptr;
		});
	});
}

export function render(stage, frame) {
	ensureStyle();
	if (frame.tree) return renderTree(stage, frame.tree);
	let box = stage.firstElementChild;
	if (!box || !box.classList.contains("vz-ms")) {
		stage.textContent = "";
		box = document.createElement("div");
		box.className = "vz-ms";
		stage.appendChild(box);
	}
	const n = frame.a.length;
	const inRange = function(k) { return frame.lo === undefined || (k >= frame.lo && k <= frame.hi); };
	// Inside a running merge, only the slots already written (lo..k) are a
	// sorted result; the old halves still in a[] are about to be overwritten.
	const merging = frame.i !== undefined && frame.lo !== undefined;
	const isSorted = function(k) {
		if (merging && k >= frame.lo && k <= frame.hi) return frame.k !== undefined && k <= frame.k;
		return frame.sorted.some(function(r) { return k >= r[0] && k <= r[1] && r[1] > r[0]; });
	};
	const slots = function() { return Array.from({ length: n }, function() { return []; }); };
	// i / j run one past their half when it is used up: no slot to mark then.
	const mark = function(list, k, p) { if (k !== undefined && k >= 0 && k < n) list[k].push(p); };

	const auxPtrs = slots();
	mark(auxPtrs, frame.lo, { name: "lo" });
	mark(auxPtrs, frame.mid, { name: "mid" });
	mark(auxPtrs, frame.hi, { name: "hi" });
	mark(auxPtrs, frame.i, { name: "i", role: "cmp" });
	mark(auxPtrs, frame.j, { name: "j", role: "min" });
	arrayView(box, "aux").update({
		caption: "aux",
		index: true,
		ptrs: auxPtrs,
		cells: frame.aux.map(function(v, k) {
			const role = frame.cmp && frame.cmp.includes(k) ? "cmp" : v === null ? "unused" : !inRange(k) ? "out" : "";
			return { id: frame.auxIds[k], label: v === null ? "" : v, role: role };
		})
	});

	const aPtrs = slots();
	mark(aPtrs, frame.k, { name: "k" });
	arrayView(box, "a").update({
		caption: "a",
		index: true,
		ptrs: aPtrs,
		cells: frame.a.map(function(v, k) {
			const role = frame.wrote === k ? "swap" : isSorted(k) ? "sorted" : !inRange(k) ? "out" : "";
			return { id: frame.aIds[k], label: v, role: role };
		})
	});
}

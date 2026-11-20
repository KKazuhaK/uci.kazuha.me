// Quicksort (Lecture 8) with Sedgewick's partition, exactly as on the
// slides: pivot v = a[lo], i scans right while a[i] < v, j scans left while
// v < a[j], swap when both stop, stop when they cross, then swap a[lo] with
// a[j]. mode "partition" runs one partition(a, 0, n-1); mode "sort" runs the
// whole recursion. The input is taken as already shuffled.
import { arrayView } from "./_array.js?v=d245a77e9b";
import { checkParams, randomInts, tr } from "./_core.js?v=d245a77e9b";

export const meta = {
	name: "quick-sort",
	summary: "Quicksort with the slides' partition(): i and j scan toward each other, swap, then the pivot drops into a[j].",
	groupLabel: { en: "partition", zh: "划分" },
	params: {
		items: { type: "string", required: true, desc: "Values after the shuffle, comma-separated: integers or short words (2–16 items, 1–3 chars each), e.g. \"K, R, A, T, E\"." },
		mode: { type: "enum", values: ["sort", "partition"], default: "sort", desc: "\"sort\" runs the whole recursion; \"partition\" runs only partition(a, 0, n-1)." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code shown beside the demo, with the running line highlighted." }
	},
	example: { items: "3, 7, 8, 5, 2, 1, 9, 5, 4" }
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
	return { values: numeric ? parts.map(Number) : parts };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const r = parseItems(config.items);
	if (r.error) return ["\"items\" " + r.error];
	return [];
}

// The slide code (sort + partition), lines ≤ 48 chars.
export const code = {
	cpp: [
		"void sort(T* a, int lo, int hi) {",
		"    if (hi <= lo) return;",
		"    int j = partition(a, lo, hi);",
		"    sort(a, lo, j-1);",
		"    sort(a, j+1, hi);",
		"}",
		"int partition(T* a, int lo, int hi) {",
		"    int i = lo;",
		"    int j = hi + 1;",
		"    T v = a[lo];",
		"    while (true) {",
		"        while (i < hi && a[++i] < v) {",
		"            if (i == hi) break;",
		"        }",
		"        while (v < a[--j]) {",
		"            if (j == lo) break;",
		"        }",
		"        if (i >= j) break;",
		"        std::swap(a[i], a[j]);",
		"    }",
		"    std::swap(a[lo], a[j]);",
		"    return j;",
		"}"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-min", label: T("Pivot v", "枢轴 v") },
		{ cls: "is-cmp", label: T("Being compared with v", "正在与 v 比较") },
		{ cls: "is-swap", label: T("Just swapped", "刚交换") },
		{ cls: "is-sorted", label: T("In its final place", "已在最终位置") },
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
	random: function() { return randomInts(9, 1, 99).join(", "); }
};

export function steps(config) {
	const T = tr(config);
	const a = parseItems(config.items).values.slice();
	const n = a.length;
	const done = new Array(n).fill(false);
	// Which original element sits in each slot, so a swap is drawn as two cells moving.
	const ids = a.map(function(_, k) { return k; });
	const frames = [];
	const stack = [];
	let comparisons = 0;
	let swaps = 0;
	let group = 0;

	function push(f) {
		frames.push({
			a: a.slice(),
			ids: ids.slice(),
			done: done.slice(),
			lo: f.lo, hi: f.hi,
			i: f.i, j: f.j,
			pivot: f.pivot === undefined ? null : f.pivot,
			cmp: f.cmp === undefined ? null : f.cmp,
			swap: f.swap || null,
			lines: f.lines || [],
			msg: f.msg,
			group: group,
			endLabel: T("end", "末尾"),
			vars: [
				[T("call stack", "调用栈"), stack.length ? stack.join(" › ") : "—"],
				["lo, hi", f.lo === undefined ? "—" : f.lo + ", " + f.hi],
				["v", f.v === undefined ? "—" : String(f.v)],
				["i, j", f.i === undefined ? "—" : f.i + ", " + f.j],
				[T("comparisons", "比较次数"), String(comparisons)],
				[T("swaps", "交换次数"), String(swaps)]
			]
		});
	}

	function partition(lo, hi) {
		stack.push("partition(" + lo + "," + hi + ")");
		let i = lo;
		let j = hi + 1;
		const v = a[lo];
		const base = function() { return { lo: lo, hi: hi, i: i, j: j, v: v, pivot: lo }; };
		const at = function(f) { return Object.assign(base(), f); };
		push(at({ lines: [8, 9, 10], msg: T("`partition(a, " + lo + ", " + hi + ")`: `i = " + lo + "`, `j = hi + 1 = " + (hi + 1) + "`, pivot `v = a[" + lo + "] = " + v + "`.",
			"`partition(a, " + lo + ", " + hi + ")`：`i = " + lo + "`，`j = hi + 1 = " + (hi + 1) + "`，枢轴 `v = a[" + lo + "] = " + v + "`。") }));
		while (true) {
			// i scans right: while (i < hi && a[++i] < v) { if (i == hi) break; }
			while (true) {
				if (!(i < hi)) {
					push(at({ lines: [12], msg: T("`i < hi` is false (i = " + i + "), so `a[++i]` is not evaluated: i stays at " + i + ".", "`i < hi` 为假（i = " + i + "），所以不会计算 `a[++i]`：i 停在 " + i + "。") }));
					break;
				}
				i++;
				comparisons++;
				const lt = a[i] < v;
				push(at({ cmp: i, lines: [12], msg: T("`++i` → i = " + i + ". `a[" + i + "] < v`? " + a[i] + " < " + v + (lt ? " is true: it belongs on the left, keep going." : " is false: i stops on " + a[i] + " (≥ v, it should not stay on the left)."),
					"`++i` → i = " + i + "。`a[" + i + "] < v`？" + a[i] + " < " + v + (lt ? " 为真：它应该留在左边，继续向右。" : " 为假：i 停在 " + a[i] + " 上（≥ v，它不该留在左边）。")) }));
				if (!lt) break;
				if (i === hi) {
					push(at({ lines: [13], msg: T("`i == hi`: break, i stops at the right end.", "`i == hi`：break，i 停在右端。") }));
					break;
				}
			}
			// j scans left: while (v < a[--j]) { if (j == lo) break; }
			while (true) {
				j--;
				comparisons++;
				const gt = v < a[j];
				push(at({ cmp: j, lines: [15], msg: T("`--j` → j = " + j + ". `v < a[" + j + "]`? " + v + " < " + a[j] + (gt ? " is true: it belongs on the right, keep going." : " is false: j stops on " + a[j] + " (≤ v, it should not stay on the right)."),
					"`--j` → j = " + j + "。`v < a[" + j + "]`？" + v + " < " + a[j] + (gt ? " 为真：它应该留在右边，继续向左。" : " 为假：j 停在 " + a[j] + " 上（≤ v，它不该留在右边）。")) }));
				if (!gt) break;
				if (j === lo) {
					push(at({ lines: [16], msg: T("`j == lo`: break, j stops at the left end.", "`j == lo`：break，j 停在左端。") }));
					break;
				}
			}
			if (i >= j) {
				push(at({ lines: [18], msg: T("`i >= j` (" + i + " ≥ " + j + "): the pointers met or crossed, leave the loop.", "`i >= j`（" + i + " ≥ " + j + "）：两个指针相遇或交错，退出循环。") }));
				break;
			}
			const x = a[i], y = a[j];
			[a[i], a[j]] = [a[j], a[i]];
			[ids[i], ids[j]] = [ids[j], ids[i]];
			swaps++;
			push(at({ swap: [i, j], lines: [19], msg: T("`i < j`, so swap `a[" + i + "]` and `a[" + j + "]`: " + x + " goes right, " + y + " comes left. Back to the top of `while (true)`.",
			"`i < j`，所以交换 `a[" + i + "]` 和 `a[" + j + "]`：" + x + " 去右边，" + y + " 来到左边。回到 `while (true)` 的开头。") }));
		}
		const y = a[j];
		[a[lo], a[j]] = [a[j], a[lo]];
		[ids[lo], ids[j]] = [ids[j], ids[lo]];
		if (lo !== j) swaps++;
		done[j] = true;
		push(at({ pivot: j, swap: lo === j ? null : [lo, j], lines: [21], msg: lo === j
			? T("`swap(a[lo], a[j])` with j = lo: the pivot " + v + " was already the smallest, it stays at " + j + ".",
				"`swap(a[lo], a[j])`，其中 j = lo：枢轴 " + v + " 本来就是最小的，仍留在下标 " + j + "。")
			: T("`swap(a[lo], a[j])`: pivot " + v + " moves to index " + j + " (and " + y + ", which is ≤ v, moves to the front). Now " + v + " is in its final place.",
				"`swap(a[lo], a[j])`：枢轴 " + v + " 移到下标 " + j + "（而 " + y + " ≤ v，被换到最前面）。现在 " + v + " 已在最终位置。") }));
		push(at({ pivot: j, lines: [22], msg: T("`return " + j + "`: everything in " + lo + ".." + (j - 1) + " is ≤ " + v + ", everything in " + (j + 1) + ".." + hi + " is ≥ " + v + ".",
			"`return " + j + "`：" + lo + ".." + (j - 1) + " 中的所有元素都 ≤ " + v + "，" + (j + 1) + ".." + hi + " 中的所有元素都 ≥ " + v + "。") }));
		stack.pop();
		group++;
		return j;
	}

	function sort(lo, hi) {
		stack.push("sort(" + lo + "," + hi + ")");
		push({ lo: lo, hi: hi, lines: [1], msg: T("Call `sort(a, " + lo + ", " + hi + ")`.", "调用 `sort(a, " + lo + ", " + hi + ")`。") });
		if (hi <= lo) {
			if (hi === lo) done[lo] = true;
			push({ lo: lo, hi: hi, lines: [2], msg: hi === lo ? T("`hi <= lo`: one element (" + a[lo] + ") is already in its final place, return.", "`hi <= lo`：只有一个元素（" + a[lo] + "），已在最终位置，返回。") : T("`hi <= lo` (" + hi + " < " + lo + "): empty range, return.", "`hi <= lo`（" + hi + " < " + lo + "）：范围为空，返回。") });
			stack.pop();
			return;
		}
		push({ lo: lo, hi: hi, lines: [3], msg: T("Partition `a[" + lo + ".." + hi + "]`.", "对 `a[" + lo + ".." + hi + "]` 做划分。") });
		const j = partition(lo, hi);
		push({ lo: lo, hi: hi, lines: [4], msg: T("Back in `sort(" + lo + "," + hi + ")` with j = " + j + ". Sort the left part: `sort(a, " + lo + ", " + (j - 1) + ")`.", "回到 `sort(" + lo + "," + hi + ")`，j = " + j + "。排序左半部分：`sort(a, " + lo + ", " + (j - 1) + ")`。") });
		sort(lo, j - 1);
		push({ lo: lo, hi: hi, lines: [5], msg: T("Back in `sort(" + lo + "," + hi + ")`. Sort the right part: `sort(a, " + (j + 1) + ", " + hi + ")`.", "回到 `sort(" + lo + "," + hi + ")`。排序右半部分：`sort(a, " + (j + 1) + ", " + hi + ")`。") });
		sort(j + 1, hi);
		stack.pop();
	}

	if ((config.mode || "sort") === "partition") {
		push({ lines: [], msg: T("One `partition(a, 0, " + (n - 1) + ")` on the shuffled array.", "对已洗牌的数组做一次 `partition(a, 0, " + (n - 1) + ")`。") });
		const j = partition(0, n - 1);
		push({ lines: [], msg: T("Done: " + a.join(" ") + ", j = " + j + ".", "完成：" + a.join(" ") + "，j = " + j + "。") });
	} else {
		push({ lines: [], msg: T("Start (array already shuffled): `sort(a, 0, " + (n - 1) + ")`.", "开始（数组已洗牌）：`sort(a, 0, " + (n - 1) + ")`。") });
		sort(0, n - 1);
		push({ lines: [], msg: T("Done: " + a.join(" ") + ". " + comparisons + " comparisons, " + swaps + " swaps.", "完成：" + a.join(" ") + "。比较 " + comparisons + " 次，交换 " + swaps + " 次。") });
	}
	return frames;
}

const STYLE = `
.vz-cell.is-out, .viz-legend .vz-swatch.is-out { opacity: 0.4; border-style: dashed; }
`;

function ensureStyle() {
	if (document.getElementById("viz-quick-sort-style")) return;
	const s = document.createElement("style");
	s.id = "viz-quick-sort-style";
	s.textContent = STYLE;
	document.head.appendChild(s);
}

// Draw one frame with the shared array view: the partition swaps and the final
// pivot swap are cells moving. The extra "end" slot is where j starts (hi + 1).
// A cell can carry several highlights at once (e.g. compared and pivot): the classes combine.
export function render(stage, frame) {
	ensureStyle();
	const n = frame.a.length;
	const cells = frame.a.map(function(v, k) {
		const inRange = frame.lo === undefined || (k >= frame.lo && k <= frame.hi);
		const isSwap = !!frame.swap && frame.swap.includes(k);
		const roles = [];
		if (isSwap) roles.push("swap");
		if (!isSwap && k === frame.pivot && !frame.done[k]) roles.push("min");
		if (!isSwap && frame.done[k]) roles.push("sorted");
		if (k === frame.cmp) roles.push("cmp");
		if (!inRange && !frame.done[k]) roles.push("out");
		return { id: frame.ids[k], label: v, role: roles };
	});
	// The "end" slot (where j starts, hi + 1) only shows while j is on it, as before.
	cells.push({ id: "end", label: frame.endLabel, role: "ghost", hidden: frame.j !== n });
	arrayView(stage).update({
		cells: cells,
		index: true,
		ptrs: cells.map(function(_, k) {
			const p = [];
			if (frame.i !== undefined && k === frame.i) p.push({ name: "i ↓", role: "cmp" });
			if (frame.j !== undefined && k === frame.j) p.push({ name: "j ↓", role: "min" });
			return p;
		})
	});
}

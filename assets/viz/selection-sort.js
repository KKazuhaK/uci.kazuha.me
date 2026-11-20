// Selection sort, step by step: each pass scans the unsorted part for the
// minimum, then swaps it to the front of that part.
import { arrayView } from "./_array.js?v=d245a77e9b";
import { checkParams, parseIntList, randomInts, tr } from "./_core.js?v=d245a77e9b";

export const meta = {
	name: "selection-sort",
	summary: "Selection sort on an array: scan for minIdx, swap into place, one pass at a time.",
	groupLabel: { en: "pass", zh: "趟" },
	params: {
		array: { type: "int[]", required: true, minLength: 2, maxLength: 12, minValue: -99, maxValue: 999, desc: "Values to sort (2–12 integers, -99…999)." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code shown beside the demo, with the running line highlighted." }
	},
	example: { array: [38, 3, 5, 47, 44, 36, 26, 1] }
};

export function validate(config) {
	return checkParams(meta.params, config);
}

export const code = {
	cpp: [
		"for (int i = 0; i < n - 1; i++) {",
		"    int minIdx = i;",
		"    for (int j = i + 1; j < n; j++) {",
		"        if (a[j] < a[minIdx])",
		"            minIdx = j;",
		"    }",
		"    swap(a[i], a[minIdx]);",
		"}"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-sorted", label: T("Sorted (left part)", "已有序（左侧部分）") },
		{ cls: "is-min", label: T("Current minimum · minIdx", "当前最小值 · minIdx") },
		{ cls: "is-cmp", label: T("Being compared · j", "正在比较 · j") },
		{ cls: "is-swap", label: T("Just swapped", "刚交换") }
	];
}

export const input = {
	key: "array",
	label: { en: "Array", zh: "数组" },
	format: function(config) { return config.array.join(", "); },
	parse: function(text) {
		const r = parseIntList(text);
		return r.error ? { error: r.error } : { value: r.values };
	},
	random: function() { return randomInts(8, 1, 99); }
};

// Build the full list of frames. Each frame is a snapshot the player can show
// on its own: array contents, markers, highlighted code lines, message, vars.
export function steps(config) {
	const T = tr(config);
	const a = config.array.slice();
	const n = a.length;
	// Which original element sits in each slot, so a swap is drawn as two cells moving.
	const ids = a.map(function(_, k) { return k; });
	const frames = [];
	let comparisons = 0;
	let swaps = 0;

	function push(f) {
		const minIdx = f.minIdx;
		frames.push({
			arr: a.slice(),
			ids: ids.slice(),
			sorted: f.sorted,
			i: f.i,
			j: f.j,
			minIdx: minIdx,
			swap: f.swap || null,
			lines: f.lines || [],
			msg: f.msg,
			group: f.group,
			vars: [
				[T("pass", "趟"), f.i === undefined ? "—" : (f.i + 1) + " / " + (n - 1)],
				["i", f.i === undefined ? "—" : String(f.i)],
				["j", f.j === undefined ? "—" : String(f.j)],
				["minIdx", minIdx === undefined ? "—" : T(minIdx + " (value " + a[minIdx] + ")", minIdx + "（值 " + a[minIdx] + "）")],
				[T("comparisons", "比较次数"), String(comparisons)],
				[T("swaps", "交换次数"), String(swaps)]
			]
		});
	}

	push({
		sorted: 0,
		group: 0,
		msg: T("Start: n = " + n + ". Each pass finds the smallest value in the unsorted part and swaps it to the front of that part.",
			"开始：n = " + n + "。每一趟在未排序部分中找出最小值，并把它交换到该部分的最前面。")
	});

	for (let i = 0; i < n - 1; i++) {
		let minIdx = i;
		push({
			sorted: i, i: i, minIdx: minIdx, lines: [1, 2], group: i,
			msg: T("Pass " + (i + 1) + ": i = " + i + ". Assume `a[" + i + "] = " + a[i] + "` is the smallest so far, so `minIdx = " + i + "`.",
				"第 " + (i + 1) + " 趟：i = " + i + "。先假设 `a[" + i + "] = " + a[i] + "` 是目前最小的，所以 `minIdx = " + i + "`。")
		});

		for (let j = i + 1; j < n; j++) {
			comparisons++;
			const smaller = a[j] < a[minIdx];
			push({
				sorted: i, i: i, j: j, minIdx: minIdx, lines: [3, 4], group: i,
				msg: T("Compare `a[" + j + "] = " + a[j] + "` with the current min `a[" + minIdx + "] = " + a[minIdx] + "`: " +
					(smaller ? a[j] + " is smaller." : a[j] + " is not smaller, so `minIdx` stays " + minIdx + "."),
					"比较 `a[" + j + "] = " + a[j] + "` 与当前最小值 `a[" + minIdx + "] = " + a[minIdx] + "`：" +
					(smaller ? a[j] + " 更小。" : a[j] + " 不更小，所以 `minIdx` 保持为 " + minIdx + "。"))
			});
			if (smaller) {
				minIdx = j;
				push({
					sorted: i, i: i, j: j, minIdx: minIdx, lines: [5], group: i,
					msg: T("New minimum found: `minIdx = " + j + "` (value " + a[j] + ").", "找到新的最小值：`minIdx = " + j + "`（值 " + a[j] + "）。")
				});
			}
		}

		if (minIdx !== i) {
			const before = [a[i], a[minIdx]];
			[a[i], a[minIdx]] = [a[minIdx], a[i]];
			[ids[i], ids[minIdx]] = [ids[minIdx], ids[i]];
			swaps++;
			push({
				sorted: i + 1, i: i, minIdx: minIdx, swap: [i, minIdx], lines: [7], group: i,
				msg: T("`swap(a[" + i + "], a[" + minIdx + "])`: " + before[0] + " ↔ " + before[1] + ". Now `a[" + i + "] = " + a[i] + "` is in its final place.",
					"`swap(a[" + i + "], a[" + minIdx + "])`：" + before[0] + " ↔ " + before[1] + "。现在 `a[" + i + "] = " + a[i] + "` 已在最终位置。")
			});
		} else {
			push({
				sorted: i + 1, i: i, minIdx: i, lines: [7], group: i,
				msg: T("`minIdx == i`, so `a[" + i + "] = " + a[i] + "` was already the smallest; the swap changes nothing. It is in its final place.",
					"`minIdx == i`，所以 `a[" + i + "] = " + a[i] + "` 本来就是最小的；交换不改变任何东西。它已在最终位置。")
			});
		}
	}

	push({
		sorted: n, group: n - 1,
		msg: T("Done. After n − 1 = " + (n - 1) + " passes the last element is in place automatically. Comparisons = n(n − 1)/2 = " +
			comparisons + " no matter the input; swaps = " + swaps + " (at most n − 1).",
			"完成。经过 n − 1 = " + (n - 1) + " 趟后，最后一个元素自动就位。无论输入如何，比较次数 = n(n − 1)/2 = " +
			comparisons + "；交换次数 = " + swaps + "（至多 n − 1）。")
	});
	return frames;
}

// Draw one frame with the shared array view: a swap is the two cells moving.
export function render(stage, frame) {
	arrayView(stage).update({
		cells: frame.arr.map(function(v, k) {
			const isSwap = !!frame.swap && frame.swap.includes(k);
			const role = isSwap ? "swap" : k < frame.sorted ? "sorted" : k === frame.minIdx ? "min" : k === frame.j ? "cmp" : "";
			return { id: frame.ids[k], label: v, role: role };
		}),
		index: true,
		ptrs: frame.arr.map(function(_, k) {
			const p = [];
			if (k === frame.i) p.push({ name: "i" });
			if (k === frame.minIdx && !frame.swap) p.push({ name: "minIdx", role: "min" });
			if (k === frame.j) p.push({ name: "j", role: "cmp" });
			return p;
		})
	});
}

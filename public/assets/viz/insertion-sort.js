// Insertion sort, step by step (swap version from the ICS 46 slides): each
// pass takes the next element and swaps it left past every larger neighbour,
// stopping (break) at the first neighbour that is not larger.
import { arrayView } from "./_array.js";
import { checkParams, parseIntList, randomInts } from "./_core.js";

export const meta = {
  name: "insertion-sort",
  summary: "Insertion sort on an array: swap a[j] left while a[j] < a[j-1], break at the first in-order pair.",
  groupLabel: "pass",
  params: {
    array: { type: "int[]", required: true, minLength: 2, maxLength: 12, minValue: -99, maxValue: 999, desc: "Values to sort (2–12 integers, -99…999)." },
    code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code shown beside the demo, with the running line highlighted." }
  },
  example: { array: [3, 44, 38, 5, 47, 1, 36, 26] }
};

export function validate(config) {
  return checkParams(meta.params, config);
}

export const code = {
  cpp: [
    "for (int i = 0; i < size; i++) {",
    "    for (int j = i; j > 0; j--) {",
    "        if (arr[j] < arr[j-1]) {",
    "            std::swap(arr[j], arr[j-1]);",
    "        }",
    "        else break;",
    "    }",
    "}"
  ]
};

export const legend = [
  { cls: "is-sorted", label: "Sorted part a[0…i−1]" },
  { cls: "is-min", label: "Element being inserted · j" },
  { cls: "is-cmp", label: "Compared with · j − 1" },
  { cls: "is-swap", label: "Just swapped" }
];

export const input = {
  key: "array",
  label: "Array",
  format: function(config) { return config.array.join(", "); },
  parse: function(text) {
    const r = parseIntList(text);
    return r.error ? { error: r.error } : { value: r.values };
  },
  random: function() { return randomInts(8, 1, 99); }
};

export function steps(config) {
  const a = config.array.slice();
  const n = a.length;
  // Which original element sits in each slot, so a swap is drawn as two cells moving.
  const ids = a.map(function(_, k) { return k; });
  const frames = [];
  let comparisons = 0;
  let swaps = 0;

  function push(f) {
    frames.push({
      arr: a.slice(),
      ids: ids.slice(),
      sorted: f.sorted,
      i: f.i,
      j: f.j,
      key: f.key,
      cmp: f.cmp,
      swap: f.swap || null,
      lines: f.lines || [],
      msg: f.msg,
      group: f.group,
      vars: [
        ["pass", f.i === undefined ? "—" : "i = " + f.i + " of " + (n - 1)],
        ["j", f.j === undefined ? "—" : String(f.j)],
        ["inserting", f.val === undefined ? "—" : String(f.val)],
        ["comparisons", String(comparisons)],
        ["swaps", String(swaps)]
      ]
    });
  }

  push({
    sorted: 0, group: 0,
    msg: "Start: n = " + n + ". Pass i inserts `arr[i]` into the sorted part `arr[0…i−1]` by swapping it left past every larger neighbour."
  });

  for (let i = 0; i < n; i++) {
    const val = a[i];
    if (i === 0) {
      push({
        sorted: 1, i: 0, j: 0, val: val, lines: [1, 2], group: 0,
        msg: "Pass i = 0: `j = 0`, so `j > 0` is false and the inner loop never runs. A single element is already sorted."
      });
      continue;
    }
    push({
      sorted: i, i: i, j: i, key: i, val: val, lines: [1, 2], group: i,
      msg: "Pass i = " + i + ": insert `arr[" + i + "] = " + val + "` into the sorted part `arr[0…" + (i - 1) + "]`. Start with `j = " + i + "`."
    });
    let j = i;
    let stopped = false;
    for (; j > 0; j--) {
      comparisons++;
      const less = a[j] < a[j - 1];
      push({
        sorted: i, i: i, j: j, key: j, cmp: j - 1, val: val, lines: [3], group: i,
        msg: "Compare `arr[" + j + "] = " + a[j] + "` < `arr[" + (j - 1) + "] = " + a[j - 1] + "`? " + (less ? "Yes." : "No.")
      });
      if (less) {
        [a[j], a[j - 1]] = [a[j - 1], a[j]];
        [ids[j], ids[j - 1]] = [ids[j - 1], ids[j]];
        swaps++;
        push({
          sorted: i, i: i, j: j, key: j - 1, swap: [j - 1, j], val: val, lines: [4], group: i,
          msg: "`std::swap(arr[" + j + "], arr[" + (j - 1) + "])`: " + val + " moves one slot left. Then `j--`."
        });
      } else {
        push({
          sorted: i + 1, i: i, j: j, key: j, val: val, lines: [6], group: i,
          msg: "`else break;` — " + val + " is not smaller than its left neighbour, so it is in place. Everything further left is even smaller: stop early."
        });
        stopped = true;
        break;
      }
    }
    if (!stopped) {
      push({
        sorted: i + 1, i: i, j: 0, key: 0, val: val, lines: [2], group: i,
        msg: "`j` reached 0: " + val + " is the smallest so far and now sits at the front. Pass " + i + " made " + i + " comparisons and " + i + " swaps (the worst a pass can do)."
      });
    }
  }

  const worst = n * (n - 1) / 2;
  push({
    sorted: n, group: n - 1,
    msg: "Done: " + comparisons + " comparisons, " + swaps + " swaps. Swaps = number of out-of-order pairs (inversions) in the input. " +
      "Best case (already sorted): n − 1 = " + (n - 1) + " comparisons, 0 swaps. Worst case (reverse sorted): n(n − 1)/2 = " + worst + " of each."
  });
  return frames;
}

// Draw one frame with the shared array view: each swap is the two cells moving.
// A cell can be both compared and sorted: the classes combine, as before.
export function render(stage, frame) {
  arrayView(stage).update({
    cells: frame.arr.map(function(v, k) {
      const isSwap = !!frame.swap && frame.swap.includes(k);
      const isKey = !isSwap && frame.key === k && frame.sorted <= (frame.i === undefined ? -1 : frame.i);
      const isSorted = !isSwap && !isKey && (k < frame.sorted || (frame.i !== undefined && k <= frame.i && frame.sorted <= frame.i));
      const roles = [];
      if (isSwap) roles.push("swap");
      if (isKey) roles.push("min");
      if (isSorted) roles.push("sorted");
      if (k === frame.cmp) roles.push("cmp");
      return { id: frame.ids[k], label: v, role: roles };
    }),
    index: true,
    ptrs: frame.arr.map(function(_, k) {
      const p = [];
      if (k === frame.i) p.push({ name: "i" });
      const jAt = frame.key !== undefined ? frame.key : frame.j;
      if (frame.i !== undefined && frame.i > 0 && k === jAt) p.push({ name: "j", role: "min" });
      if (k === frame.cmp) p.push({ name: "j−1", role: "cmp" });
      return p;
    })
  });
}

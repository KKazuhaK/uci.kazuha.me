// ArrayList (dynamic array), step by step: add / insert with shifting,
// remove with shifting, resize by doubling (or +1) and halving at 1/4 full.
// Matches the Lecture 3 ArrayList: initial capacity 2, add(item) appends,
// remove() removes the last item.
import { arrayView } from "./_array.js?v=d245a77e9b";
import { checkParams, tr } from "./_core.js?v=d245a77e9b";

const MAX_OPS = 14;
const MAX_SIZE = 16;
const MAX_CAP = 32;

export const meta = {
	name: "arraylist",
	summary: "ArrayList operations on a fixed-capacity buffer: shifting, doubling when full, halving at 1/4 full.",
	groupLabel: { en: "operation", zh: "操作" },
	params: {
		ops: { type: "string", required: true, desc: "Calls separated by ; — add(x), add(i, x), remove(), remove(i), get(i). Items: words or \"quoted\"." },
		capacity: { type: "int", default: 2, min: 1, max: 8, desc: "Initial capacity (Lecture 3: 2)." },
		growth: { type: "enum", values: ["double", "plus1"], default: "double", desc: "How resize grows a full buffer: 2 × capacity, or capacity + 1." },
		shrink: { type: "bool", default: true, desc: "Halve the capacity when size ≤ capacity / 4 after a remove." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code beside the demo." }
	},
	example: { ops: "add(ICS46); add(Rocks); add(!); add(1, Throws); add(3, ?); remove(); remove(); remove()" }
};

// ---- ops parsing (same helper in linked-list / stack / queue) ----
function splitArgs(text) {
	const out = [];
	let cur = "", quote = null, quoted = false;
	for (const ch of text) {
		if (quote) {
			if (ch === quote) quote = null; else cur += ch;
		} else if (ch === '"' || ch === "'") {
			quote = ch; quoted = true;
		} else if (ch === ",") {
			out.push({ raw: quoted ? cur : cur.trim(), quoted: quoted }); cur = ""; quoted = false;
		} else cur += ch;
	}
	if (quote) return null;
	if (cur.trim() || quoted || out.length) out.push({ raw: quoted ? cur : cur.trim(), quoted: quoted });
	return out;
}

function parseCalls(text) {
	const calls = [];
	const parts = String(text).split(/[;\n]+/).map(function(s) { return s.trim(); }).filter(Boolean);
	for (const part of parts) {
		const m = /^([A-Za-z]+)\s*\((.*)\)$/.exec(part);
		if (!m) return { error: "can't read \"" + part + "\" — write calls like add(x); remove()" };
		const pieces = m[2].trim() ? splitArgs(m[2]) : [];
		if (pieces === null) return { error: "unclosed quote in \"" + part + "\"" };
		const args = pieces.map(function(a) {
			return !a.quoted && /^-?\d+$/.test(a.raw) ? { int: Number(a.raw), text: a.raw } : { text: a.raw };
		});
		calls.push({ name: m[1], args: args, src: part });
	}
	return { calls: calls };
}

function itemOk(text) {
	return text.length >= 1 && text.length <= 8;
}

// Turn calls into a normalised op list, simulating sizes to catch bad indices.
function plan(config) {
	const p = parseCalls(config.ops);
	if (p.error) return { errors: ["\"ops\": " + p.error] };
	if (!p.calls.length) return { errors: ["\"ops\" needs at least one call"] };
	if (p.calls.length > MAX_OPS) return { errors: ["\"ops\" can have at most " + MAX_OPS + " calls"] };
	const errors = [];
	const ops = [];
	let n = 0;
	let cap = config.capacity;
	for (const c of p.calls) {
		const where = "\"ops\": " + c.src + " — ";
		const a = c.args;
		if (c.name === "add" && a.length === 1) {
			if (!itemOk(a[0].text)) { errors.push(where + "items must be 1–8 characters"); continue; }
			ops.push({ kind: "add", index: n, item: a[0].text, append: true, src: c.src });
		} else if (c.name === "add" && a.length === 2) {
			if (a[0].int === undefined) { errors.push(where + "index must be an integer"); continue; }
			if (a[0].int < 0 || a[0].int > n) { errors.push(where + "index must be 0…" + n + " (size is " + n + ")"); continue; }
			if (!itemOk(a[1].text)) { errors.push(where + "items must be 1–8 characters"); continue; }
			ops.push({ kind: "add", index: a[0].int, item: a[1].text, append: false, src: c.src });
		} else if (c.name === "remove" && a.length <= 1) {
			if (n === 0) { errors.push(where + "the list is empty"); continue; }
			let index = n - 1;
			if (a.length === 1) {
				if (a[0].int === undefined || a[0].int < 0 || a[0].int >= n) { errors.push(where + "index must be 0…" + (n - 1)); continue; }
				index = a[0].int;
			}
			ops.push({ kind: "remove", index: index, last: a.length === 0, src: c.src });
		} else if (c.name === "get" && a.length === 1) {
			if (a[0].int === undefined || a[0].int < 0 || a[0].int >= n) { errors.push(where + "index must be 0…" + Math.max(0, n - 1)); continue; }
			ops.push({ kind: "get", index: a[0].int, src: c.src });
		} else {
			errors.push(where + "unknown call (use add(x), add(i, x), remove(), remove(i), get(i))");
			continue;
		}
		const last = ops[ops.length - 1];
		if (last.kind === "add") {
			if (n === cap) cap = config.growth === "double" ? cap * 2 : cap + 1;
			n++;
		} else if (last.kind === "remove") {
			n--;
			if (config.shrink && cap > 1 && n <= Math.floor(cap / 4)) cap = Math.floor(cap / 2);
		}
		if (n > MAX_SIZE) { errors.push("\"ops\": the list grows past " + MAX_SIZE + " items — keep the demo smaller"); break; }
		if (cap > MAX_CAP) { errors.push("\"ops\": capacity would exceed " + MAX_CAP + " — keep the demo smaller"); break; }
	}
	return errors.length ? { errors: errors } : { ops: ops };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const c = Object.assign({ capacity: 2, growth: "double", shrink: true }, config);
	return plan(c).errors || [];
}

export const code = {
	cpp: [
		"void add(size_t index, const T& item) {",
		"    if (n_ == capacity_) resize(2 * capacity_);",
		"    for (size_t i = n_; i > index; --i)",
		"        data_[i] = data_[i - 1];",
		"    data_[index] = item;",
		"    ++n_;",
		"}",
		"T remove(size_t index) {",
		"    T item = data_[index];",
		"    for (size_t i = index; i + 1 < n_; ++i)",
		"        data_[i] = data_[i + 1];",
		"    --n_;",
		"    if (capacity_ > 1 && n_ <= capacity_ / 4)",
		"        resize(capacity_ / 2);",
		"    return item;",
		"}",
		"void resize(size_t newCapacity) {",
		"    T* bigger = new T[newCapacity];",
		"    for (size_t i = 0; i < n_; ++i)",
		"        bigger[i] = data_[i];",
		"    delete[] data_;",
		"    data_ = bigger;",
		"    capacity_ = newCapacity;",
		"}"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-sorted", label: T("Just written", "刚写入") },
		{ cls: "is-min", label: T("Being moved / read", "正在移动 / 读取") },
		{ cls: "is-swap", label: T("Copied into the new buffer", "已复制到新缓冲区") },
		{ cls: "is-unused", label: T("Allocated, unused", "已分配，未使用") }
	];
}

export const input = {
	key: "ops",
	label: { en: "Operations", zh: "操作" },
	format: function(config) { return config.ops; },
	parse: function(text) {
		return String(text).trim() ? { value: String(text).trim() } : { error: "type some calls, e.g. add(A); add(B); add(0, C)" };
	},
	random: function() {
		const words = ["A", "B", "C", "D", "E", "F", "G", "H"];
		const out = [];
		let n = 0;
		for (let k = 0; k < 8; k++) {
			const r = Math.random();
			if (n > 0 && r < 0.25) { out.push("remove()"); n--; }
			else if (n > 0 && r < 0.45) { out.push("add(" + Math.floor(Math.random() * (n + 1)) + ", " + words[k] + ")"); n++; }
			else { out.push("add(" + words[k] + ")"); n++; }
		}
		return out.join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const ops = plan(config).ops;
	let cap = config.capacity;
	let data = new Array(cap).fill(null);
	// Element ids, parallel to data: an element keeps its id wherever it moves (a
	// shift, a copy into the new buffer). null = empty slot; "stale:k" = the
	// leftover copy a shift leaves behind in slot k.
	let ids = new Array(cap).fill(null);
	let nextId = 0;
	let n = 0;
	let copies = 0;
	let moves = 0;
	const frames = [];
	let lastResult = "—";
	// Widest item, so the columns keep one width through the whole demo.
	const width = ops.reduce(function(w, o) { return o.item ? Math.max(w, o.item.length) : w; }, 1);

	// Slot ids for drawing: an empty slot gets an id of its own, so it never glides.
	function slotIds(list) {
		return list.map(function(id, k) { return id === null ? "empty:" + k : id; });
	}

	function push(f) {
		frames.push({
			data: data.slice(),
			ids: slotIds(ids),
			newIds: f.newIds ? slotIds(f.newIds) : null,
			width: width,
			caption: T("data_ — size " + n + " / capacity " + cap, "data_ — 大小 " + n + " / 容量 " + cap),
			newCaption: f.newBuf ? T("bigger — new buffer, capacity " + f.newBuf.length, "bigger — 新缓冲区，容量 " + f.newBuf.length) : null,
			cap: cap,
			n: n,
			newBuf: f.newBuf ? f.newBuf.slice() : null,
			hi: f.hi || {},
			newHi: f.newHi || {},
			lines: f.lines || [],
			msg: f.msg,
			group: f.group,
			vars: [
				[T("op", "操作"), f.op || "—"],
				[T("n_ (size)", "n_（大小）"), String(n)],
				[T("capacity_", "capacity_（容量）"), String(cap)],
				[T("copies (resizes)", "复制次数（扩容）"), String(copies)],
				[T("shifts", "移位次数"), String(moves)],
				[T("returned", "返回值"), lastResult]
			]
		});
	}

	push({ group: -1, msg: T("Start: an empty ArrayList with capacity " + cap + "." + (config.growth === "plus1" ? " This demo grows a full buffer by +1 instead of doubling." : ""),
		"开始：一个空的 ArrayList，容量为 " + cap + "。" + (config.growth === "plus1" ? "本演示在缓冲区已满时只增加 1，而不是翻倍。" : "")) });

	function resize(newCap, g, op, why) {
		const bigger = new Array(newCap).fill(null);
		const biggerIds = new Array(newCap).fill(null);
		push({ group: g, op: op, newBuf: bigger, newIds: biggerIds, lines: why === "grow" ? [2, 18] : [13, 14, 18],
			msg: why === "grow"
				? T("Full (n_ == capacity_ == " + cap + "), so resize to " + newCap + (config.growth === "plus1" ? " (this demo grows by +1 instead of the code's 2 × capacity_)" : "") + ": allocate a new buffer.",
					"已满（n_ == capacity_ == " + cap + "），所以扩容（resize）到 " + newCap + (config.growth === "plus1" ? "（本演示每次只增加 1，而不是代码中的 2 × capacity_）" : "") + "：分配一个新缓冲区。")
				: T("n_ = " + n + " ≤ capacity_/4 = " + Math.floor(cap / 4) + ", so shrink: allocate a buffer of capacity " + newCap + ".",
					"n_ = " + n + " ≤ capacity_/4 = " + Math.floor(cap / 4) + "，所以缩容：分配一个容量为 " + newCap + " 的缓冲区。") });
		for (let i = 0; i < n; i++) {
			bigger[i] = data[i];
			biggerIds[i] = ids[i];
			copies++;
			const hi = {}; hi[i] = "is-min";
			const nh = {}; nh[i] = "is-swap";
			push({ group: g, op: op, newBuf: bigger, newIds: biggerIds, hi: hi, newHi: nh, lines: [19, 20],
				msg: T("Copy `data_[" + i + "]` = " + data[i] + " into the new buffer (copy " + copies + " so far).",
					"把 `data_[" + i + "]` = " + data[i] + " 复制到新缓冲区（目前共复制 " + copies + " 次）。") });
		}
		push({ group: g, op: op, newBuf: bigger, newIds: biggerIds, lines: [21, 22, 23],
			msg: T("`delete[]` the old buffer and point `data_` at the new one. That resize cost " + n + " copies.",
				"`delete[]` 释放旧缓冲区，并让 `data_` 指向新缓冲区。这次扩容共复制了 " + n + " 个元素。") });
		data = bigger;
		ids = biggerIds;
		cap = newCap;
	}

	ops.forEach(function(o, g) {
		if (o.kind === "get") {
			const hi = {}; hi[o.index] = "is-min";
			lastResult = String(data[o.index]);
			push({ group: g, op: o.src, hi: hi, msg: T("`" + o.src + "`: read `data_[" + o.index + "]` = " + data[o.index] + " directly — O(1), no walking.",
				"`" + o.src + "`：直接读取 `data_[" + o.index + "]` = " + data[o.index] + "——O(1)，无需遍历。") });
			return;
		}
		if (o.kind === "add") {
			lastResult = "—";
			push({ group: g, op: o.src, lines: [1],
				msg: T("`" + o.src + "`" + (o.append ? ": append, i.e. insert at index n_ = " + n + "." : ": insert at index " + o.index + "."),
					"`" + o.src + "`" + (o.append ? "：追加，即插入到下标 n_ = " + n + " 处。" : "：插入到下标 " + o.index + " 处。")) });
			if (n === cap) resize(config.growth === "double" ? cap * 2 : cap + 1, g, o.src, "grow");
			for (let i = n; i > o.index; i--) {
				data[i] = data[i - 1];
				ids[i] = ids[i - 1];
				ids[i - 1] = "stale:" + (i - 1);
				moves++;
				const hi = {}; hi[i] = "is-min";
				push({ group: g, op: o.src, hi: hi, lines: [3, 4], msg: T("Shift right: `data_[" + i + "] = data_[" + (i - 1) + "]` (" + data[i] + "). Back to front, so nothing is overwritten.",
					"右移：`data_[" + i + "] = data_[" + (i - 1) + "]`（" + data[i] + "）。从后往前移，所以不会覆盖任何元素。") });
			}
			data[o.index] = o.item;
			ids[o.index] = "e" + nextId++;
			n++;
			const hi = {}; hi[o.index] = "is-sorted";
			push({ group: g, op: o.src, hi: hi, lines: [5, 6], msg: T("Write " + o.item + " into `data_[" + o.index + "]` and `++n_` → size " + n + ".", "把 " + o.item + " 写入 `data_[" + o.index + "]`，并执行 `++n_` → 大小为 " + n + "。") });
			return;
		}
		// remove
		const item = data[o.index];
		lastResult = String(item);
		const hr = {}; hr[o.index] = "is-min";
		push({ group: g, op: o.src, hi: hr, lines: [9], msg: T("`" + o.src + "`: save `item = data_[" + o.index + "]` = " + item + ".", "`" + o.src + "`：先保存 `item = data_[" + o.index + "]` = " + item + "。") });
		for (let i = o.index; i + 1 < n; i++) {
			data[i] = data[i + 1];
			ids[i] = ids[i + 1];
			ids[i + 1] = "stale:" + (i + 1);
			moves++;
			const hi = {}; hi[i] = "is-min";
			push({ group: g, op: o.src, hi: hi, lines: [10, 11], msg: T("Shift left: `data_[" + i + "] = data_[" + (i + 1) + "]` (" + data[i] + "). Front to back.", "左移：`data_[" + i + "] = data_[" + (i + 1) + "]`（" + data[i] + "）。从前往后移。") });
		}
		data[n - 1] = null;
		n--;
		push({ group: g, op: o.src, lines: [12], msg: T("`--n_` → size " + n + ". The old last slot is now unused.", "`--n_` → 大小为 " + n + "。原来的最后一个槽位现在不再使用。") });
		if (config.shrink && cap > 1 && n <= Math.floor(cap / 4)) resize(Math.floor(cap / 2), g, o.src, "shrink");
		push({ group: g, op: o.src, lines: [15], msg: T("Return " + item + ".", "返回 " + item + "。") });
	});

	push({ group: ops.length, msg: T("Done: size " + n + ", capacity " + cap + ". Resizing copied " + copies + " element(s) in total; shifting moved " + moves + ".",
		"完成：大小 " + n + "，容量 " + cap + "。扩容共复制了 " + copies + " 个元素；移位共移动了 " + moves + " 个元素。") });
	return frames;
}

const STYLE = `
.vz-al { display: flex; flex-direction: column; align-items: center; align-items: safe center; overflow-x: auto; }
.vz-al .vz-row { flex-wrap: nowrap; }
/* Items are strings ("ROCKS", "Throws"): every column is as wide as the widest item. */
.vz-al .vz-col { flex: 0 0 var(--al-col, 2.9rem); }
.vz-al .vz-cell { width: 100%; aspect-ratio: auto; height: 3.35rem; padding: 0 0.2rem; white-space: nowrap; }
@media (max-width: 736px) { .vz-al .vz-col { flex-basis: calc(var(--al-col, 2.9rem) * 0.8); } .vz-al .vz-cell { height: 2.5rem; } }
.vz-al .vz-arr.is-old { opacity: 0.55; }
.viz-legend .vz-swatch.is-unused { border-style: dashed; color: var(--vz-muted); background: transparent; }
`;

function ensureStyle() {
	if (document.getElementById("viz-arraylist-style")) return;
	const s = document.createElement("style");
	s.id = "viz-arraylist-style";
	s.textContent = STYLE;
	document.head.appendChild(s);
}

// One buffer as cells: an element's hi class ("is-min" …) becomes its role; a
// slot holding nothing is "unused", and the stale copy a shift leaves is dim.
function cellsOf(buf, ids, hi) {
	return buf.map(function(v, k) {
		const mark = hi && hi[k] ? hi[k].replace(/^is-/, "") : "";
		const role = mark || (v === null ? "unused" : String(ids[k]).indexOf("stale:") === 0 ? "dim" : "");
		return { id: ids[k], label: v === null ? "" : v, role: role, title: v === null ? undefined : v };
	});
}

export function render(stage, frame) {
	ensureStyle();
	let box = stage.firstElementChild;
	if (!box || !box.classList.contains("vz-al")) {
		stage.textContent = "";
		box = document.createElement("div");
		box.className = "vz-al";
		stage.appendChild(box);
	}
	box.style.setProperty("--al-col", Math.max(2.9, frame.width * 0.85 + 1.2) + "rem");

	const ptrs = frame.data.map(function() { return []; });
	if (!frame.newBuf && frame.n < frame.cap) ptrs[frame.n] = [{ name: "n_" }];
	const cur = arrayView(box, "a");
	cur.update({
		cells: cellsOf(frame.data, frame.ids, frame.hi),
		index: true,
		ptrs: ptrs,
		caption: frame.caption
	});
	cur.el.classList.toggle("is-old", !!frame.newBuf);

	if (frame.newBuf) {
		arrayView(box, "new").update({
			cells: cellsOf(frame.newBuf, frame.newIds, frame.newHi),
			index: true,
			caption: frame.newCaption
		});
	} else if (box.querySelector(".vz-arr + .vz-arr")) {
		arrayView(box, "new").el.remove(); // the old buffer is gone after the copy
	}
}

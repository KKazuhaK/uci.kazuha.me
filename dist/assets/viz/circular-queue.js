// Queue on a circular array, step by step: front index and size n, rear =
// (front + n) % capacity, indices wrap around instead of shifting.
import { arrayView } from "./_array.js?v=f4afb4f310";
import { checkParams, tr } from "./_core.js?v=f4afb4f310";

const MAX_OPS = 24;

export const meta = {
	name: "circular-queue",
	summary: "Queue on a fixed-capacity circular array: enqueue at (front + n) % capacity, dequeue at front, both O(1).",
	groupLabel: { en: "operation", zh: "操作" },
	params: {
		ops: { type: "string", required: true, desc: "enqueue(x); dequeue(); peek() — or shorthand \"a b - c\" (word = enqueue, - = dequeue)." },
		capacity: { type: "int", default: 5, min: 2, max: 10, desc: "Array capacity (fixed; enqueue on a full queue is an error)." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code beside the demo." }
	},
	example: { ops: "A B C - - D E F - G", capacity: 5 }
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

function plan(config) {
	const text = String(config.ops).trim();
	if (!text) return { errors: ["\"ops\" needs at least one operation"] };
	let ops = [];
	if (/\(/.test(text)) {
		const p = parseCalls(text);
		if (p.error) return { errors: ["\"ops\": " + p.error] };
		for (const c of p.calls) {
			if (c.name === "enqueue" && c.args.length === 1) ops.push({ kind: "enqueue", item: c.args[0].text, src: c.src });
			else if ((c.name === "dequeue" || c.name === "peek") && c.args.length === 0) ops.push({ kind: c.name, src: c.src });
			else return { errors: ["\"ops\": " + c.src + " — use enqueue(x), dequeue(), peek()"] };
		}
	} else {
		ops = text.split(/\s+/).map(function(w) {
			return w === "-" ? { kind: "dequeue", src: "-  (dequeue)" } : { kind: "enqueue", item: w, src: w + "  (enqueue)" };
		});
	}
	if (ops.length > MAX_OPS) return { errors: ["\"ops\" can have at most " + MAX_OPS + " operations"] };
	const cap = config.capacity === undefined ? 5 : config.capacity;
	let n = 0;
	for (const o of ops) {
		if (o.kind === "enqueue") {
			if (o.item.length < 1 || o.item.length > 6) return { errors: ["\"ops\": items must be 1–6 characters (" + o.item + ")"] };
			if (n === cap) return { errors: ["\"ops\": " + o.src.trim() + " on a full queue (capacity " + cap + ") — that would throw"] };
			n++;
		} else if (n === 0) {
			return { errors: ["\"ops\": " + o.src.trim() + " on an empty queue — that would throw"] };
		} else if (o.kind === "dequeue") n--;
	}
	return { ops: ops };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	return plan(config).errors || [];
}

export const code = {
	cpp: [
		"void enqueue(const T& item) {",
		"    if (n == capacity) throw overflow_error();",
		"    data[(front + n) % capacity] = item;",
		"    n++;",
		"}",
		"T dequeue() {",
		"    if (n == 0) throw underflow_error();",
		"    T item = data[front];",
		"    front = (front + 1) % capacity;",
		"    n--;",
		"    return item;",
		"}"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-sorted", label: T("Just enqueued", "刚入队") },
		{ cls: "is-swap", label: T("Just dequeued (slot now free)", "刚出队（槽位已空闲）") },
		{ cls: "is-min", label: T("In the queue", "在队列中") }
	];
}

export const input = {
	key: "ops",
	label: { en: "Operations", zh: "操作" },
	format: function(config) { return config.ops; },
	parse: function(text) {
		return String(text).trim() ? { value: String(text).trim() } : { error: "type e.g. A B - C - D" };
	},
	random: function() {
		const out = [];
		let n = 0;
		for (let k = 0; k < 12; k++) {
			if (n > 0 && (n >= 4 || Math.random() < 0.4)) { out.push("-"); n--; }
			else { out.push(String.fromCharCode(65 + k)); n++; }
		}
		return out.join(" ");
	}
};

export function steps(config) {
	const T = tr(config);
	const ops = plan(config).ops;
	const cap = config.capacity;
	const data = new Array(cap).fill(null);
	// Each enqueued element gets a fresh id, so it pops in; a slot keeps its id until overwritten.
	const ids = new Array(cap).fill(null);
	let nextId = 0;
	let front = 0;
	let n = 0;
	const out = [];
	const frames = [];

	const capText = T("data — capacity ", "data —— 容量 ") + cap;
	const rearName = T("rear slot", "队尾槽位");

	function push(f) {
		frames.push({
			capText: capText, rearName: rearName,
			data: data.slice(), ids: ids.slice(), cap: cap, front: front, n: n,
			hi: f.hi === undefined ? -1 : f.hi, hiCls: f.hiCls || "",
			lines: f.lines || [], msg: f.msg, group: f.group,
			vars: [
				["op", f.op || "—"],
				["front", String(front)],
				["n", String(n)],
				[T("rear slot (front + n) % cap", "队尾槽位 (front + n) % cap"), String((front + n) % cap)],
				[T("dequeued so far", "已出队"), out.length ? out.join(" ") : "—"]
			]
		});
	}

	push({ group: -1, msg: T("Start: capacity " + cap + ", front = 0, n = 0. The queue is the n slots starting at front, wrapping past the end.",
		"开始：容量 " + cap + "，front = 0，n = 0。队列就是从 front 开始的 n 个槽位，越过数组末尾后绕回开头。") });
	ops.forEach(function(o, g) {
		if (o.kind === "enqueue") {
			const slot = (front + n) % cap;
			data[slot] = o.item;
			ids[slot] = nextId++;
			n++;
			push({ group: g, op: o.src, hi: slot, hiCls: "is-sorted", lines: [3, 4],
				msg: T("enqueue " + o.item + ": write it at (front + n) % capacity = (" + front + " + " + (n - 1) + ") % " + cap + " = " + slot + "." + (slot < front ? " That wrapped around to the start of the array." : "") + " O(1).",
					"入队 " + o.item + "：写入 (front + n) % capacity = (" + front + " + " + (n - 1) + ") % " + cap + " = " + slot + " 号槽位。" + (slot < front ? "这里已绕回到数组开头。" : "") + "O(1)。") });
		} else if (o.kind === "peek") {
			push({ group: g, op: o.src, hi: front, hiCls: "is-min", lines: [8], msg: T("peek(): the front item is data[" + front + "] = " + data[front] + ".", "peek()：队首元素是 data[" + front + "] = " + data[front] + "。") });
		} else {
			const slot = front;
			const item = data[slot];
			out.push(item);
			front = (front + 1) % cap;
			n--;
			push({ group: g, op: o.src, hi: slot, hiCls: "is-swap", lines: [8, 9, 10, 11],
				msg: T("dequeue(): return data[" + slot + "] = " + item + ", then front = (" + slot + " + 1) % " + cap + " = " + front + ". Nothing shifts — O(1). The old value stays in the slot but is no longer part of the queue.",
					"出队 dequeue()：返回 data[" + slot + "] = " + item + "，然后 front = (" + slot + " + 1) % " + cap + " = " + front + "。没有任何元素移动——O(1)。旧值仍留在槽位里，但已不属于队列。") });
		}
	});
	push({ group: ops.length, msg: T("Done: front = " + front + ", n = " + n + ". Dequeued in order: " + (out.join(" ") || "nothing") + ".",
		"完成：front = " + front + "，n = " + n + "。按顺序出队的元素：" + (out.join(" ") || "无") + "。") });
	return frames;
}

// Draw one frame with the shared array view. The slots are fixed; an enqueued
// element pops in, a free slot is drawn dashed (a dequeued one keeps its stale value).
export function render(stage, frame) {
	const inQueue = new Set();
	for (let k = 0; k < frame.n; k++) inQueue.add((frame.front + k) % frame.cap);
	const rear = (frame.front + frame.n) % frame.cap;
	arrayView(stage).update({
		caption: frame.capText,
		cells: frame.data.map(function(v, k) {
			const role = k === frame.hi && frame.hiCls ? frame.hiCls.replace("is-", "") : inQueue.has(k) ? "min" : "unused";
			// A never-used slot has no element: its id is the slot. A dequeued slot keeps its stale value.
			return { id: frame.ids[k] === null ? "free" + k : "e" + frame.ids[k], label: v === null ? "" : v, role: role };
		}),
		index: true,
		ptrs: frame.data.map(function(_, k) {
			const p = [];
			if (frame.n > 0 && k === frame.front) p.push({ name: "front", role: "min" });
			if (frame.n < frame.cap && k === rear) p.push({ name: frame.rearName, role: "cmp" });
			return p;
		})
	});
}

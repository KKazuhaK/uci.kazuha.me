// Singly linked list, step by step: get / add / remove at the head or at an
// index, with the finger and previous pointers walking the list. Matches the
// Lecture 4 SinglyLinkedList: add(item) and remove() work at the HEAD.
import { checkParams, tr } from "./_core.js?v=d245a77e9b";

const MAX_OPS = 10;
const MAX_LEN = 8;

export const meta = {
	name: "linked-list",
	summary: "Singly linked list: walk with finger/previous, splice a node in, bypass and delete a node.",
	groupLabel: { en: "operation", zh: "操作" },
	params: {
		items: { type: "string", default: "", desc: "Starting list, head first, comma-separated, e.g. \"!, ?, ROCKS, ICS46\" (built without animation)." },
		ops: { type: "string", required: true, desc: "Calls separated by ; — add(x) (at head), add(i, x), remove() (head), remove(i), get(i)." },
		tail: { type: "bool", default: false, desc: "Also keep and show a tail pointer." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code beside the demo." }
	},
	example: { ops: "add(ICS 46); add(ROCKS); add(!); add(1, ?); remove(); remove(1)" }
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

function parseItems(text) {
	if (!String(text).trim()) return [];
	return splitArgs(String(text)).map(function(a) { return a.raw; });
}

function plan(config) {
	const errors = [];
	const items = parseItems(config.items || "");
	if (items === null || items.some(function(t) { return !itemOk(t); })) return { errors: ["\"items\": each item must be 1–8 characters"] };
	if (items.length > MAX_LEN) return { errors: ["\"items\" can have at most " + MAX_LEN + " items"] };
	const p = parseCalls(config.ops);
	if (p.error) return { errors: ["\"ops\": " + p.error] };
	if (!p.calls.length) return { errors: ["\"ops\" needs at least one call"] };
	if (p.calls.length > MAX_OPS) return { errors: ["\"ops\" can have at most " + MAX_OPS + " calls"] };
	const ops = [];
	let n = items.length;
	for (const c of p.calls) {
		const where = "\"ops\": " + c.src + " — ";
		const a = c.args;
		if (c.name === "add" && a.length === 1) {
			if (!itemOk(a[0].text)) { errors.push(where + "items must be 1–8 characters"); continue; }
			ops.push({ kind: "add", index: 0, item: a[0].text, head: true, src: c.src }); n++;
		} else if (c.name === "add" && a.length === 2) {
			if (a[0].int === undefined || a[0].int < 0 || a[0].int > n) { errors.push(where + "index must be 0…" + n); continue; }
			if (!itemOk(a[1].text)) { errors.push(where + "items must be 1–8 characters"); continue; }
			ops.push({ kind: "add", index: a[0].int, item: a[1].text, head: false, src: c.src }); n++;
		} else if (c.name === "remove" && a.length <= 1) {
			if (n === 0) { errors.push(where + "the list is empty"); continue; }
			let index = 0;
			if (a.length === 1) {
				if (a[0].int === undefined || a[0].int < 0 || a[0].int >= n) { errors.push(where + "index must be 0…" + (n - 1)); continue; }
				index = a[0].int;
			}
			ops.push({ kind: "remove", index: index, head: a.length === 0, src: c.src }); n--;
		} else if (c.name === "get" && a.length === 1) {
			if (a[0].int === undefined || a[0].int < 0 || a[0].int >= n) { errors.push(where + "index must be 0…" + Math.max(0, n - 1)); continue; }
			ops.push({ kind: "get", index: a[0].int, src: c.src });
		} else {
			errors.push(where + "unknown call (use add(x), add(i, x), remove(), remove(i), get(i))");
			continue;
		}
		if (n > MAX_LEN) { errors.push("\"ops\": the list grows past " + MAX_LEN + " nodes — keep the demo smaller"); break; }
	}
	return errors.length ? { errors: errors } : { items: items, ops: ops };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	return plan(config).errors || [];
}

export const code = {
	cpp: [
		"T get(size_t index) const {",
		"    Node* finger = head;",
		"    while (index > 0) {",
		"        finger = finger->next;  index--;",
		"    }",
		"    return finger->item;",
		"}",
		"void add(size_t index, const T& item) {",
		"    if (index == 0) {        // = add(item)",
		"        head = new Node(item, head);",
		"        n++;  return;",
		"    }",
		"    Node* previous = nullptr;",
		"    Node* finger = head;",
		"    while (index > 0) {",
		"        previous = finger;",
		"        finger = finger->next;  index--;",
		"    }",
		"    Node* current = new Node(item);",
		"    current->next = finger;",
		"    previous->next = current;",
		"    n++;",
		"}",
		"T remove(size_t index) {     // 0 = remove()",
		"    Node* previous = nullptr;",
		"    Node* finger = head;",
		"    while (index > 0) {",
		"        previous = finger;",
		"        finger = finger->next;  index--;",
		"    }",
		"    if (previous == nullptr)",
		"        head = finger->next;",
		"    else previous->next = finger->next;",
		"    T item = finger->item;",
		"    delete finger;  n--;",
		"    return item;",
		"}"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-sorted", label: T("New node", "新节点") },
		{ cls: "is-min", label: "finger" },
		{ cls: "is-cmp", label: "previous" },
		{ cls: "is-swap", label: T("Removed / deleted", "已移除 / 已删除") }
	];
}

export const input = {
	key: "ops",
	label: { en: "Operations", zh: "操作" },
	format: function(config) { return config.ops; },
	parse: function(text) {
		return String(text).trim() ? { value: String(text).trim() } : { error: "type some calls, e.g. add(A); add(1, B); remove(0)" };
	},
	random: function() {
		const words = ["A", "B", "C", "D", "E", "F", "G"];
		const out = [];
		let n = 0;
		for (let k = 0; k < 6; k++) {
			const r = Math.random();
			if (n > 1 && r < 0.3) { out.push("remove(" + Math.floor(Math.random() * n) + ")"); n--; }
			else if (n > 0 && r < 0.65) { out.push("add(" + Math.floor(Math.random() * (n + 1)) + ", " + words[k] + ")"); n++; }
			else { out.push("add(" + words[k] + ")"); n++; }
		}
		return out.join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const pl = plan(config);
	const ui = { loose: T("not in the list", "不在链表中"), deleted: T("deleted", "已删除"), next: T("next → ", "next → ") };
	// Node graph: id -> { item, next }.
	const nodes = new Map();
	let nextId = 1;
	let head = null;
	let tail = null;
	let n = 0;
	const frames = [];
	let walks = 0;
	let lastResult = "—";

	function newNode(item, next) {
		const id = nextId++;
		nodes.set(id, { item: item, next: next === undefined ? null : next });
		return id;
	}
	for (let k = pl.items.length - 1; k >= 0; k--) {
		head = newNode(pl.items[k], head);
		if (tail === null) tail = head;
		n++;
	}

	function itemOf(id) { return id === null || id === undefined ? "nullptr" : "\"" + nodes.get(id).item + "\""; }

	function snapshot(f) {
		const chain = [];
		const seen = new Set();
		for (let id = head; id !== null && !seen.has(id); id = nodes.get(id).next) {
			seen.add(id);
			chain.push({ id: id, item: nodes.get(id).item });
		}
		const loose = [];
		(f.loose || []).forEach(function(id) {
			if (id !== null && !seen.has(id) && nodes.has(id)) {
				const nx = nodes.get(id).next;
				loose.push({ id: id, item: nodes.get(id).item, next: nx === null ? "nullptr" : nodes.has(nx) ? nodes.get(nx).item : "?", deleted: !!(f.deleted && f.deleted.includes(id)) });
			}
		});
		(f.deletedGhost || []).forEach(function(g) { loose.push(g); });
		const ptrs = {};
		function addPtr(id, name, cls) {
			if (id === null || id === undefined) return;
			(ptrs[id] = ptrs[id] || []).push({ name: name, cls: cls || "" });
		}
		addPtr(head, "head");
		if (config.tail) addPtr(tail, "tail");
		Object.entries(f.ptr || {}).forEach(function(e) { addPtr(e[1], e[0], e[0] === "finger" ? "is-min" : e[0] === "previous" ? "is-cmp" : e[0] === "current" ? "is-sorted" : ""); });
		frames.push({
			ui: ui,
			chain: chain,
			loose: loose,
			ptrs: ptrs,
			marks: f.marks || {},
			nullPtrs: f.nullPtrs || [],
			lines: f.lines || [],
			msg: f.msg,
			group: f.group,
			vars: [
				["op", f.op || "—"],
				["n", String(n)],
				["index", f.index === undefined ? "—" : String(f.index)],
				["previous", f.ptr && "previous" in f.ptr ? itemOf(f.ptr.previous) : "—"],
				["finger", f.ptr && "finger" in f.ptr ? itemOf(f.ptr.finger) : "—"],
				[T("steps walked", "已走步数"), String(walks)],
				[T("returned", "返回值"), lastResult]
			]
		});
	}

	snapshot({ group: -1, msg: n ? T("Start: " + n + " node(s), head first. Only `head` is reachable directly; everything else needs a walk.", "开始：" + n + " 个节点，头节点在前。只有 `head` 能直接到达，其余节点都要沿链表走过去。") : T("Start: an empty list (`head == nullptr`, n = 0).", "开始：空链表（`head == nullptr`，n = 0）。") });

	pl.ops.forEach(function(o, g) {
		const base = { group: g, op: o.src };
		if (o.kind === "add" && o.index === 0) {
			lastResult = "—";
			const id = newNode(o.item, head);
			const old = head;
			snapshot(Object.assign({}, base, { loose: [id], ptr: { current: id }, marks: { [id]: "is-sorted" }, lines: [9, 10],
				msg: T("`" + o.src + "`: index 0 — allocate a node for " + o.item + " whose `next` is the current head (" + itemOf(old) + "). No walking.",
					"`" + o.src + "`：下标 0——为 " + o.item + " 分配一个节点，让它的 `next` 指向当前的头（" + itemOf(old) + "）。不需要遍历。") }));
			head = id;
			if (tail === null) tail = id;
			n++;
			snapshot(Object.assign({}, base, { marks: { [id]: "is-sorted" }, lines: [10, 11],
				msg: T("Move `head` to the new node and `n++` → " + n + ". O(1)." + (config.tail && n === 1 ? " The list was empty, so `tail` points at it too." : ""),
					"把 `head` 移到新节点，`n++` → " + n + "。O(1)。" + (config.tail && n === 1 ? "链表原本为空，所以 `tail` 也指向它。" : "")) }));
			return;
		}
		if (o.kind === "add" || o.kind === "remove" || o.kind === "get") {
			const isGet = o.kind === "get";
			let index = o.index;
			let previous = null;
			let finger = head;
			const ptr = function() { return isGet ? { finger: finger } : { previous: previous, finger: finger }; };
			const start = isGet ? [2] : o.kind === "add" ? [13, 14] : [25, 26];
			const loop = isGet ? [3, 4] : o.kind === "add" ? [15, 16, 17] : [27, 28, 29];
			if (o.kind === "remove") lastResult = "—";
			snapshot(Object.assign({}, base, { index: index, ptr: ptr(), lines: start,
				msg: T("`" + o.src + "`" + (o.kind === "remove" && o.head ? " (= remove(0))" : "") + ": start the walk with " + (isGet ? "`finger = head`." : "`previous = nullptr`, `finger = head`."),
					"`" + o.src + "`" + (o.kind === "remove" && o.head ? "（= remove(0)）" : "") + "：开始遍历，" + (isGet ? "令 `finger = head`。" : "令 `previous = nullptr`、`finger = head`。")) }));
			while (index > 0) {
				previous = finger;
				finger = nodes.get(finger).next;
				index--;
				walks++;
				snapshot(Object.assign({}, base, { index: index, ptr: ptr(), lines: loop,
					msg: T((isGet ? "" : "`previous` = " + itemOf(previous) + ", ") + "`finger` moves to " + itemOf(finger) + "; index → " + index + ".",
						(isGet ? "" : "`previous` = " + itemOf(previous) + "，") + "`finger` 移到 " + itemOf(finger) + "；index → " + index + "。") }));
			}
			if (isGet) {
				lastResult = "\"" + nodes.get(finger).item + "\"";
				snapshot(Object.assign({}, base, { index: 0, ptr: ptr(), lines: [6], msg: T("index is 0: return `finger->item` = " + itemOf(finger) + ". Took " + o.index + " step(s) — O(n) in the worst case.",
					"index 为 0：返回 `finger->item` = " + itemOf(finger) + "。共走了 " + o.index + " 步——最坏情况 O(n)。") }));
				return;
			}
			if (o.kind === "add") {
				const id = newNode(o.item, null);
				snapshot(Object.assign({}, base, { index: 0, loose: [id], ptr: { previous: previous, finger: finger, current: id }, marks: { [id]: "is-sorted" }, lines: [19],
					msg: T("Stop: `finger` is on the node now at position " + o.index + ", `previous` is the one before. Allocate `current` for " + o.item + ".",
						"停下：`finger` 指向当前位于位置 " + o.index + " 的节点，`previous` 指向它前面的那个。为 " + o.item + " 分配 `current`。") }));
				nodes.get(id).next = finger;
				snapshot(Object.assign({}, base, { index: 0, loose: [id], ptr: { previous: previous, finger: finger, current: id }, marks: { [id]: "is-sorted" }, lines: [20],
					msg: T("`current->next = finger` — the new node points at " + itemOf(finger) + ". It is not in the list yet.",
						"`current->next = finger`——新节点指向 " + itemOf(finger) + "。它还不在链表中。") }));
				nodes.get(previous).next = id;
				if (config.tail && finger === null) tail = id;
				n++;
				snapshot(Object.assign({}, base, { index: 0, ptr: { previous: previous, finger: finger, current: id }, marks: { [id]: "is-sorted" }, lines: [21, 22],
					msg: T("`previous->next = current` splices it in after " + itemOf(previous) + "; `n++` → " + n + "." + (config.tail && finger === null ? " It's the new last node, so `tail` moves too." : ""),
						"`previous->next = current` 把它拼接到 " + itemOf(previous) + " 之后；`n++` → " + n + "。" + (config.tail && finger === null ? "它是新的最后一个节点，所以 `tail` 也要移动。" : "")) }));
				return;
			}
			// remove
			const victim = finger;
			const item = nodes.get(victim).item;
			if (previous === null) head = nodes.get(victim).next;
			else nodes.get(previous).next = nodes.get(victim).next;
			if (config.tail && tail === victim) tail = previous;
			snapshot(Object.assign({}, base, { index: 0, loose: [victim], ptr: { previous: previous, finger: victim }, marks: { [victim]: "is-swap" }, lines: previous === null ? [31, 32] : [33],
				msg: previous === null ? T("`previous` is still nullptr (index 0), so `head = finger->next`: head skips over " + itemOf(victim) + ".",
						"`previous` 仍是 nullptr（下标 0），所以 `head = finger->next`：head 绕过 " + itemOf(victim) + "。") :
					T("`previous->next = finger->next`: " + itemOf(previous) + " now skips over " + itemOf(victim) + "." + (config.tail && tail === previous ? " It was the last node, so `tail = previous`." : ""),
						"`previous->next = finger->next`：" + itemOf(previous) + " 现在绕过 " + itemOf(victim) + "。" + (config.tail && tail === previous ? "它原本是最后一个节点，所以 `tail = previous`。" : "")) }));
			nodes.delete(victim);
			n--;
			lastResult = "\"" + item + "\"";
			snapshot(Object.assign({}, base, { index: 0, ptr: { previous: previous }, deletedGhost: [{ id: victim, item: item, next: "", deleted: true }], lines: [34, 35, 36],
				msg: T("Copy `item` = \"" + item + "\" out, then `delete finger` and `n--` → " + n + ". Return \"" + item + "\". (Copy before delete — after it, `finger` dangles.)",
					"先把 `item` = \"" + item + "\" 复制出来，再 `delete finger` 并 `n--` → " + n + "。返回 \"" + item + "\"。（先复制再 delete——delete 之后 `finger` 就悬空了。）") }));
		}
	});

	snapshot({ group: pl.ops.length, msg: T("Done: " + n + " node(s). The walks took " + walks + " step(s) in total; head operations take none.",
		"完成：" + n + " 个节点。遍历总共走了 " + walks + " 步；头部操作一步都不用走。") });
	return frames;
}

const STYLE = `
.vz-ll { display: flex; flex-direction: column; align-items: center; align-items: safe center; gap: 0.9rem; overflow-x: auto; padding-bottom: 0.2rem; }
.vz-ll-row { display: flex; align-items: flex-start; gap: 0.15rem; }
.vz-ll-node { display: flex; flex-direction: column; align-items: center; }
.vz-ll-box { display: flex; border: 1.5px solid var(--vz-border); border-radius: 0.55rem; background: var(--vz-surface); overflow: hidden;
	transition: background-color 0.25s, border-color 0.25s, color 0.25s, box-shadow 0.25s; }
.vz-ll-item { padding: 0.45rem 0.6rem; font-weight: 600; white-space: nowrap; min-width: 2.2rem; text-align: center; }
.vz-ll-next { padding: 0.45rem 0.4rem; border-left: 1.5px solid var(--vz-border); color: var(--vz-muted); font-size: 0.8rem; display: grid; place-items: center; }
.vz-ll-arrow { align-self: flex-start; margin-top: 0.55rem; color: var(--vz-muted); font-size: 1.05rem; padding: 0 0.1rem; }
.vz-ll-null { align-self: flex-start; margin-top: 0.5rem; color: var(--vz-muted); font: 0.8rem "Consolas", "Menlo", monospace; }
.vz-ll-box.is-sorted { background: var(--vz-sorted-bg); color: var(--vz-sorted-fg); border-color: var(--vz-sorted-bd); }
.vz-ll-box.is-swap { background: var(--vz-swap-bg); color: var(--vz-swap-fg); border-color: var(--vz-swap-bd); }
.vz-ll-box.is-min { border-color: var(--vz-min-bd); box-shadow: 0 0 0 2px var(--vz-min-bd); }
.vz-ll-box.is-cmp { border-color: var(--vz-cmp-bd); box-shadow: 0 0 0 2px var(--vz-cmp-bd); }
.vz-ll-box.is-deleted { border-style: dashed; opacity: 0.6; text-decoration: line-through; }
.vz-ll-ptrs { min-height: 1.4em; margin-top: 0.3rem; display: flex; flex-direction: column; align-items: center; font: 0.76rem/1.25 "Consolas", "Menlo", monospace; }
.vz-ll-ptr { white-space: nowrap; }
.vz-ll-ptr.is-min { color: var(--vz-min-fg); }
.vz-ll-ptr.is-cmp { color: var(--vz-blue); }
.vz-ll-ptr.is-sorted { color: var(--vz-sorted-fg); }
.vz-ll-loose { display: flex; gap: 1.2rem; align-items: flex-start; }
.vz-ll-caption { color: var(--vz-muted); font-size: 0.78rem; text-align: center; margin-bottom: 0.3rem; }
.vz-ll-empty { color: var(--vz-muted); font: 0.85rem "Consolas", "Menlo", monospace; }
`;

function ensureStyle() {
	if (document.getElementById("viz-linked-list-style")) return;
	const s = document.createElement("style");
	s.id = "viz-linked-list-style";
	s.textContent = STYLE;
	document.head.appendChild(s);
}

function escapeHtml(t) {
	return String(t).replace(/[&<>"']/g, function(ch) {
		return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
	});
}

function ptrHtml(list) {
	return (list || []).map(function(p) { return '<span class="vz-ll-ptr ' + p.cls + '">' + escapeHtml(p.name) + " ↑</span>"; }).join("");
}

function boxClass(frame, id) {
	const cls = ["vz-ll-box"];
	if (frame.marks[id]) cls.push(frame.marks[id]);
	(frame.ptrs[id] || []).forEach(function(p) {
		if (p.cls === "is-min" || p.cls === "is-cmp") cls.push(p.cls);
	});
	return cls.join(" ");
}

export function render(stage, frame) {
	ensureStyle();
	let html = '<div class="vz-ll">';
	if (!frame.chain.length) {
		html += '<div class="vz-ll-empty">head → nullptr</div>';
	} else {
		html += '<div class="vz-ll-row">';
		frame.chain.forEach(function(nd, k) {
			html += '<div class="vz-ll-node"><div class="' + boxClass(frame, nd.id) + '"><span class="vz-ll-item">' + escapeHtml(nd.item) +
				'</span><span class="vz-ll-next">' + (k === frame.chain.length - 1 ? "∅" : "●") + "</span></div>" +
				'<div class="vz-ll-ptrs">' + ptrHtml(frame.ptrs[nd.id]) + "</div></div>";
			if (k < frame.chain.length - 1) html += '<span class="vz-ll-arrow">→</span>';
		});
		html += '<span class="vz-ll-null">→ nullptr</span></div>';
	}
	if (frame.loose.length) {
		html += '<div><div class="vz-ll-caption">' + frame.ui.loose + '</div><div class="vz-ll-loose">';
		frame.loose.forEach(function(nd) {
			const cls = nd.deleted ? "vz-ll-box is-swap is-deleted" : boxClass(frame, nd.id);
			html += '<div class="vz-ll-node"><div class="' + cls + '"><span class="vz-ll-item">' + escapeHtml(nd.item) +
				'</span><span class="vz-ll-next">' + (nd.deleted ? frame.ui.deleted : frame.ui.next + escapeHtml(nd.next)) + "</span></div>" +
				'<div class="vz-ll-ptrs">' + (nd.deleted ? "" : ptrHtml(frame.ptrs[nd.id])) + "</div></div>";
		});
		html += "</div></div>";
	}
	stage.innerHTML = html + "</div>";
}

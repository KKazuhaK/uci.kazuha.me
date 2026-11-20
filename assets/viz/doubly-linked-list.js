// Doubly linked list with head and tail, step by step: addFirst / addLast /
// removeFirst / removeLast, each O(1) because both ends are reachable and
// every node knows its prev (Lecture 4, slides 42–45).
import { checkParams, tr } from "./_core.js?v=d245a77e9b";

const MAX_OPS = 12;
const MAX_LEN = 7;

export const meta = {
	name: "doubly-linked-list",
	summary: "Doubly linked list with head and tail: add and remove at either end in O(1).",
	groupLabel: { en: "operation", zh: "操作" },
	params: {
		items: { type: "string", default: "", desc: "Starting list, head first, comma-separated (built without animation)." },
		ops: { type: "string", required: true, desc: "Calls separated by ; — addFirst(x), addLast(x), removeFirst(), removeLast()." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code beside the demo." }
	},
	example: { ops: "addLast(ICS 46); addFirst(ROCKS); addLast(!); removeLast(); removeFirst()" }
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

function parseItems(text) {
	if (!String(text).trim()) return [];
	const a = splitArgs(String(text));
	return a === null ? null : a.map(function(x) { return x.raw; });
}

function plan(config) {
	const items = parseItems(config.items || "");
	if (items === null || items.some(function(t) { return t.length < 1 || t.length > 8; })) return { errors: ["\"items\": each item must be 1–8 characters"] };
	if (items.length > MAX_LEN) return { errors: ["\"items\" can have at most " + MAX_LEN + " items"] };
	const p = parseCalls(config.ops);
	if (p.error) return { errors: ["\"ops\": " + p.error] };
	if (!p.calls.length) return { errors: ["\"ops\" needs at least one call"] };
	if (p.calls.length > MAX_OPS) return { errors: ["\"ops\" can have at most " + MAX_OPS + " calls"] };
	const ops = [];
	let n = items.length;
	for (const c of p.calls) {
		const where = "\"ops\": " + c.src + " — ";
		if ((c.name === "addFirst" || c.name === "addLast") && c.args.length === 1) {
			if (c.args[0].text.length < 1 || c.args[0].text.length > 8) return { errors: [where + "items must be 1–8 characters"] };
			ops.push({ kind: c.name, item: c.args[0].text, src: c.src }); n++;
			if (n > MAX_LEN) return { errors: ["\"ops\": the list grows past " + MAX_LEN + " nodes — keep the demo smaller"] };
		} else if ((c.name === "removeFirst" || c.name === "removeLast") && c.args.length === 0) {
			if (n === 0) return { errors: [where + "the list is empty"] };
			ops.push({ kind: c.name, src: c.src }); n--;
		} else return { errors: [where + "use addFirst(x), addLast(x), removeFirst(), removeLast()"] };
	}
	return { items: items, ops: ops };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	return plan(config).errors || [];
}

export const code = {
	cpp: [
		"void addFirst(const T& item) {",
		"    Node* node = new Node(item, nullptr, head);",
		"    if (head == nullptr) tail = node;",
		"    else head->prev = node;",
		"    head = node;  n++;",
		"}",
		"void addLast(const T& item) {",
		"    Node* node = new Node(item, tail, nullptr);",
		"    if (tail == nullptr) head = node;",
		"    else tail->next = node;",
		"    tail = node;  n++;",
		"}",
		"T removeFirst() {",
		"    Node* temp = head;  head = head->next;",
		"    if (head == nullptr) tail = nullptr;",
		"    else head->prev = nullptr;",
		"    T item = temp->item;  delete temp;  n--;",
		"    return item;",
		"}",
		"T removeLast() {",
		"    Node* temp = tail;  tail = tail->prev;",
		"    if (tail == nullptr) head = nullptr;",
		"    else tail->next = nullptr;",
		"    T item = temp->item;  delete temp;  n--;",
		"    return item;",
		"}"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-sorted", label: T("New node", "新节点") },
		{ cls: "is-swap", label: T("Removed", "已移除") }
	];
}

export const input = {
	key: "ops",
	label: { en: "Operations", zh: "操作" },
	format: function(config) { return config.ops; },
	parse: function(text) { return String(text).trim() ? { value: String(text).trim() } : { error: "type e.g. addFirst(A); addLast(B); removeLast()" }; },
	random: function() {
		const out = [];
		let n = 0;
		for (let k = 0; k < 7; k++) {
			const r = Math.random();
			if (n > 0 && r < 0.35) { out.push(Math.random() < 0.5 ? "removeFirst()" : "removeLast()"); n--; }
			else { out.push((Math.random() < 0.5 ? "addFirst(" : "addLast(") + String.fromCharCode(65 + k) + ")"); n++; }
		}
		return out.join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const pl = plan(config);
	const ui = { gone: T("removed (deleted)", "已移除（已删除）") };
	const list = pl.items.slice();
	const frames = [];
	let last = "—";

	function push(f) {
		frames.push({
			ui: ui,
			items: list.slice(), mark: f.mark || null, gone: f.gone === undefined ? null : f.gone,
			lines: f.lines || [], msg: f.msg, group: f.group,
			vars: [
				["op", f.op || "—"],
				["n", String(list.length)],
				["head", list.length ? "\"" + list[0] + "\"" : "nullptr"],
				["tail", list.length ? "\"" + list[list.length - 1] + "\"" : "nullptr"],
				[T("returned", "返回值"), last]
			]
		});
	}

	push({ group: -1, msg: list.length ? T("Start: " + list.length + " node(s). `head` and `tail` give O(1) access to both ends.", "开始：" + list.length + " 个节点。`head` 和 `tail` 让两端都能在 O(1) 内访问。") : T("Start: an empty list (`head == tail == nullptr`).", "开始：空链表（`head == tail == nullptr`）。") });
	pl.ops.forEach(function(o, g) {
		const was = list.length;
		if (o.kind === "addFirst") {
			list.unshift(o.item); last = "—";
			push({ group: g, op: o.src, mark: 0, lines: [2, was ? 4 : 3, 5], msg: T("addFirst(" + o.item + "): new node with `next = head`; " + (was ? "the old first node's `prev` points back at it; " : "the list was empty, so `tail` points at it too; ") + "`head` moves to it. O(1).",
				"addFirst(" + o.item + ")：新建节点，令 `next = head`；" + (was ? "原来第一个节点的 `prev` 指回它；" : "链表原本为空，所以 `tail` 也指向它；") + "`head` 移到它上面。O(1)。") });
		} else if (o.kind === "addLast") {
			list.push(o.item); last = "—";
			push({ group: g, op: o.src, mark: list.length - 1, lines: [8, was ? 10 : 9, 11], msg: T("addLast(" + o.item + "): new node with `prev = tail`; " + (was ? "the old last node's `next` points at it; " : "the list was empty, so `head` points at it too; ") + "`tail` moves to it. O(1).",
				"addLast(" + o.item + ")：新建节点，令 `prev = tail`；" + (was ? "原来最后一个节点的 `next` 指向它；" : "链表原本为空，所以 `head` 也指向它；") + "`tail` 移到它上面。O(1)。") });
		} else if (o.kind === "removeFirst") {
			const item = list.shift(); last = "\"" + item + "\"";
			push({ group: g, op: o.src, gone: item, lines: [14, list.length ? 16 : 15, 17, 18], msg: T("removeFirst(): `head` moves to the second node and its `prev` is cleared" + (list.length ? "" : " — now empty, so `tail = nullptr` too") + ". Returns \"" + item + "\". O(1).",
				"removeFirst()：`head` 移到第二个节点，并清空它的 `prev`" + (list.length ? "" : "——链表现在空了，所以 `tail = nullptr`") + "。返回 \"" + item + "\"。O(1)。") });
		} else {
			const item = list.pop(); last = "\"" + item + "\"";
			push({ group: g, op: o.src, gone: item, lines: [21, list.length ? 23 : 22, 24, 25], msg: T("removeLast(): `tail = tail->prev` — the step a singly linked list can't do without walking — then the new last node's `next` is cleared" + (list.length ? "" : " (now empty: `head = nullptr`)") + ". Returns \"" + item + "\". O(1).",
				"removeLast()：`tail = tail->prev`——单向链表不遍历就做不到这一步——然后清空新的最后一个节点的 `next`" + (list.length ? "" : "（链表现在空了：`head = nullptr`）") + "。返回 \"" + item + "\"。O(1)。") });
		}
	});
	push({ group: pl.ops.length, msg: T("Done: " + list.length + " node(s). Every operation here touched a constant number of pointers.",
		"完成：" + list.length + " 个节点。这里每个操作都只改动了常数个指针。") });
	return frames;
}

const STYLE = `
.vz-dll { display: flex; flex-direction: column; align-items: center; align-items: safe center; gap: 0.8rem; overflow-x: auto; padding-bottom: 0.2rem; }
.vz-dll-row { display: flex; align-items: flex-start; gap: 0.1rem; }
.vz-dll-node { display: flex; flex-direction: column; align-items: center; }
.vz-dll-box { display: flex; border: 1.5px solid var(--vz-border); border-radius: 0.55rem; background: var(--vz-surface); overflow: hidden;
	transition: background-color 0.25s, border-color 0.25s, color 0.25s; }
.vz-dll-box span { padding: 0.45rem 0.4rem; display: grid; place-items: center; }
.vz-dll-box .vz-dll-item { padding: 0.45rem 0.6rem; font-weight: 600; white-space: nowrap; border-left: 1.5px solid var(--vz-border); border-right: 1.5px solid var(--vz-border); }
.vz-dll-box .vz-dll-p { color: var(--vz-muted); font-size: 0.8rem; }
.vz-dll-box.is-sorted { background: var(--vz-sorted-bg); color: var(--vz-sorted-fg); border-color: var(--vz-sorted-bd); }
.vz-dll-box.is-swap { background: var(--vz-swap-bg); color: var(--vz-swap-fg); border-color: var(--vz-swap-bd); border-style: dashed; }
.vz-dll-arrow { margin-top: 0.5rem; color: var(--vz-muted); padding: 0 0.1rem; }
.vz-dll-ptrs { min-height: 1.4em; margin-top: 0.3rem; display: flex; flex-direction: column; align-items: center; font: 0.76rem/1.25 "Consolas", "Menlo", monospace; color: var(--vz-muted); }
.vz-dll-gone { display: flex; flex-direction: column; align-items: center; }
.vz-dll-cap { color: var(--vz-muted); font-size: 0.78rem; text-align: center; margin-bottom: 0.3rem; }
.vz-dll-empty { color: var(--vz-muted); font: 0.85rem "Consolas", "Menlo", monospace; }
`;

function ensureStyle() {
	if (document.getElementById("viz-dll-style")) return;
	const s = document.createElement("style");
	s.id = "viz-dll-style";
	s.textContent = STYLE;
	document.head.appendChild(s);
}

function escapeHtml(t) {
	return String(t).replace(/[&<>"']/g, function(ch) {
		return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
	});
}

export function render(stage, frame) {
	ensureStyle();
	const L = frame.items;
	let html = '<div class="vz-dll">';
	if (!L.length) html += '<div class="vz-dll-empty">head → nullptr ← tail</div>';
	else {
		html += '<div class="vz-dll-row">';
		L.forEach(function(it, k) {
			const ptrs = [];
			if (k === 0) ptrs.push("head ↑");
			if (k === L.length - 1) ptrs.push("tail ↑");
			html += '<div class="vz-dll-node"><div class="vz-dll-box' + (frame.mark === k ? " is-sorted" : "") + '"><span class="vz-dll-p">' + (k === 0 ? "∅" : "●") +
				'</span><span class="vz-dll-item">' + escapeHtml(it) + '</span><span class="vz-dll-p">' + (k === L.length - 1 ? "∅" : "●") + "</span></div>" +
				'<div class="vz-dll-ptrs">' + ptrs.map(function(p) { return "<span>" + p + "</span>"; }).join("") + "</div></div>";
			if (k < L.length - 1) html += '<span class="vz-dll-arrow">⇄</span>';
		});
		html += "</div>";
	}
	if (frame.gone !== null) html += '<div class="vz-dll-gone"><div class="vz-dll-cap">' + frame.ui.gone + '</div><div class="vz-dll-box is-swap"><span class="vz-dll-item">' + escapeHtml(frame.gone) + "</span></div></div>";
	stage.innerHTML = html + "</div>";
}

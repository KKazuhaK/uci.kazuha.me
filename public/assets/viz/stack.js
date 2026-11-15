// Stack (LIFO), step by step: push / pop / peek with the top at the head of a
// singly linked list (Lectures 4–5). Accepts calls — push(x); pop() — or the
// algs4 shorthand used on the slides: "to be or not to - be - -", where a
// word pushes it and "-" pops.
import { checkParams, tr } from "./_core.js";

const MAX_OPS = 24;
const MAX_LEN = 10;

export const meta = {
	name: "stack",
	summary: "Stack on a singly linked list: push and pop at the head (the top), O(1) each.",
	groupLabel: { en: "operation", zh: "操作" },
	params: {
		ops: { type: "string", required: true, desc: "push(x); pop(); peek() — or shorthand \"to be or - not\" (word = push, - = pop)." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code beside the demo." }
	},
	example: { ops: "to be or not to - be - - that - - - is" }
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
			if (c.name === "push" && c.args.length === 1) ops.push({ kind: "push", item: c.args[0].text, src: c.src });
			else if ((c.name === "pop" || c.name === "peek") && c.args.length === 0) ops.push({ kind: c.name, src: c.src });
			else return { errors: ["\"ops\": " + c.src + " — use push(x), pop(), peek()"] };
		}
	} else {
		ops = text.split(/\s+/).map(function(w) {
			return w === "-" ? { kind: "pop", src: "-  (pop)" } : { kind: "push", item: w, src: w + "  (push)" };
		});
	}
	if (ops.length > MAX_OPS) return { errors: ["\"ops\" can have at most " + MAX_OPS + " operations"] };
	let n = 0;
	for (const o of ops) {
		if (o.kind === "push") {
			if (o.item.length < 1 || o.item.length > 8) return { errors: ["\"ops\": items must be 1–8 characters (" + o.item + ")"] };
			n++;
			if (n > MAX_LEN) return { errors: ["\"ops\": the stack grows past " + MAX_LEN + " items — keep the demo smaller"] };
		} else if (n === 0) {
			return { errors: ["\"ops\": " + o.src.trim() + " on an empty stack — that would throw (underflow)"] };
		} else if (o.kind === "pop") n--;
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
		"void push(const T& item) {",
		"    head = new Node(item, head);  // new top",
		"    n++;",
		"}",
		"T pop() {",
		"    Node* temp = head;",
		"    head = head->next;",
		"    T item = temp->item;",
		"    delete temp;  n--;",
		"    return item;",
		"}",
		"const T& peek() const {",
		"    return head->item;",
		"}"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-sorted", label: T("Just pushed", "刚压入") },
		{ cls: "is-min", label: T("Top (peek)", "栈顶（peek）") },
		{ cls: "is-swap", label: T("Popped", "已弹出") }
	];
}

export const input = {
	key: "ops",
	label: { en: "Operations", zh: "操作" },
	format: function(config) { return config.ops; },
	parse: function(text) {
		return String(text).trim() ? { value: String(text).trim() } : { error: "type e.g. a b - c - -" };
	},
	random: function() {
		const words = ["to", "be", "or", "not", "that", "is", "the", "question"];
		const out = [];
		let n = 0;
		for (let k = 0; k < 12; k++) {
			if (n > 0 && Math.random() < 0.4) { out.push("-"); n--; }
			else { out.push(words[Math.floor(Math.random() * words.length)]); n++; }
		}
		return out.join(" ");
	}
};

export function steps(config) {
	const T = tr(config);
	const ops = plan(config).ops;
	const st = [];
	const popped = [];
	const frames = [];

	const ui = {
		cap: T("stack (top first)", "栈（栈顶在上）"),
		top: T("← head (top)", "← head（栈顶）"),
		ret: T("returned", "返回"),
		bottom: T("bottom", "栈底"),
		empty: T("empty: head → nullptr", "空：head → nullptr"),
		out: T("popped", "已弹出")
	};

	function push(f) {
		frames.push({
			ui: ui,
			items: st.slice(),
			gone: f.gone === undefined ? null : f.gone,
			mark: f.mark || "",
			lines: f.lines || [],
			msg: f.msg,
			group: f.group,
			vars: [
				["op", f.op || "—"],
				[T("n (size)", "n（大小）"), String(st.length)],
				[T("top", "栈顶"), st.length ? "\"" + st[st.length - 1] + "\"" : "nullptr"],
				[T("popped so far", "已弹出"), popped.length ? popped.join(" ") : "—"]
			]
		});
	}

	push({ group: -1, msg: T("Start: an empty stack (`head == nullptr`). The top of the stack is the head of the list.",
		"开始：空栈（`head == nullptr`）。栈顶就是链表的头。") });
	ops.forEach(function(o, g) {
		if (o.kind === "push") {
			st.push(o.item);
			push({ group: g, op: o.src, mark: "is-sorted", lines: [2, 3], msg: T("push " + o.item + ": new node at the head; it is the new top. Nothing else moves — O(1).",
				"压入 " + o.item + "：在头部新建一个节点，它成为新的栈顶。其他节点都不动——O(1)。") });
		} else if (o.kind === "peek") {
			push({ group: g, op: o.src, mark: "is-min", lines: [12], msg: T("peek(): return the top item \"" + st[st.length - 1] + "\" without removing it.", "peek()：返回栈顶元素 \"" + st[st.length - 1] + "\"，但不删除它。") });
		} else {
			const item = st.pop();
			popped.push(item);
			push({ group: g, op: o.src, gone: item, lines: [6, 7, 8, 9, 10], msg: T("pop(): the top \"" + item + "\" comes off (last in, first out); `head` moves to the node below. O(1).",
				"弹出 pop()：栈顶 \"" + item + "\" 被取下（后进先出）；`head` 移到下面的节点。O(1)。") });
		}
	});
	push({ group: ops.length, msg: T("Done. Left on the stack (top first): " + (st.length ? st.slice().reverse().join(", ") : "nothing") + ". Popped in order: " + (popped.join(" ") || "nothing") + ".",
		"完成。栈中剩下（栈顶在前）：" + (st.length ? st.slice().reverse().join("、") : "无") + "。按顺序弹出的元素：" + (popped.join(" ") || "无") + "。") });
	return frames;
}

const STYLE = `
.vz-st { display: flex; justify-content: center; align-items: flex-end; gap: 1.6rem; flex-wrap: wrap; }
.vz-st-col { display: flex; flex-direction: column; align-items: stretch; min-width: 6rem; }
.vz-st-cap { color: var(--vz-muted); font-size: 0.78rem; text-align: center; margin-bottom: 0.3rem; }
.vz-st-cell { display: flex; justify-content: space-between; gap: 0.6rem; align-items: center; padding: 0.38rem 0.7rem; margin-top: 0.3rem;
	border: 1.5px solid var(--vz-border); border-radius: 0.5rem; background: var(--vz-surface); font-weight: 600;
	transition: background-color 0.25s, border-color 0.25s, color 0.25s; }
.vz-st-cell small { color: var(--vz-muted); font-weight: 400; font: 0.72rem "Consolas", "Menlo", monospace; }
.vz-st-cell.is-sorted { background: var(--vz-sorted-bg); color: var(--vz-sorted-fg); border-color: var(--vz-sorted-bd); }
.vz-st-cell.is-min { background: var(--vz-min-bg); color: var(--vz-min-fg); border-color: var(--vz-min-bd); }
.vz-st-cell.is-swap { background: var(--vz-swap-bg); color: var(--vz-swap-fg); border-color: var(--vz-swap-bd); border-style: dashed; }
.vz-st-base { margin-top: 0.3rem; border-top: 2px solid var(--vz-muted); color: var(--vz-muted); font: 0.72rem "Consolas", "Menlo", monospace; text-align: center; padding-top: 0.15rem; }
.vz-st-out { min-width: 6rem; }
`;

function ensureStyle() {
	if (document.getElementById("viz-stack-style")) return;
	const s = document.createElement("style");
	s.id = "viz-stack-style";
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
	let html = '<div class="vz-st"><div class="vz-st-col"><div class="vz-st-cap">' + frame.ui.cap + '</div>';
	for (let k = frame.items.length - 1; k >= 0; k--) {
		const isTop = k === frame.items.length - 1;
		const cls = ["vz-st-cell"];
		if (isTop && frame.mark) cls.push(frame.mark);
		html += '<div class="' + cls.join(" ") + '"><span>' + escapeHtml(frame.items[k]) + "</span><small>" + (isTop ? frame.ui.top : "") + "</small></div>";
	}
	html += '<div class="vz-st-base">' + (frame.items.length ? frame.ui.bottom : frame.ui.empty) + "</div></div>";
	html += '<div class="vz-st-col vz-st-out"><div class="vz-st-cap">' + frame.ui.out + '</div>' +
		(frame.gone !== null ? '<div class="vz-st-cell is-swap"><span>' + escapeHtml(frame.gone) + "</span><small>" + frame.ui.ret + "</small></div>" : "") + "</div>";
	stage.innerHTML = html + "</div>";
}

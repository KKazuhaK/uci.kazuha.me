// Dijkstra's two-stack algorithm for a fully parenthesized infix expression
// (Lecture 5, slide 15): values → value stack, operators → operator stack,
// "(" ignored, ")" pops an operator and two values and pushes the result.
import { checkParams, tr } from "./_core.js?v=d245a77e9b";

const MAX_TOKENS = 31;

export const meta = {
	name: "two-stack-eval",
	summary: "Dijkstra's two-stack evaluation of a fully parenthesized infix expression.",
	groupLabel: { en: "token", zh: "词元" },
	params: {
		expression: { type: "string", required: true, desc: "Fully parenthesized infix, e.g. \"( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )\". Integers 0–9999 and + - * /." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code beside the demo." }
	},
	example: { expression: "( 1 + ( ( 2 + 3 ) * ( 4 * 5 ) ) )" }
};

function tokenize(text) {
	const toks = String(text).match(/\d+|[-+*/()]|\S/g) || [];
	for (const t of toks) {
		if (!/^(\d+|[-+*/()])$/.test(t)) return { error: "unexpected character \"" + t + "\" (use integers, + - * / and parentheses)" };
		if (/^\d+$/.test(t) && Number(t) > 9999) return { error: "numbers must be 0–9999 (" + t + ")" };
	}
	return { tokens: toks };
}

function applyOp(op, left, right) {
	if (op === "+") return left + right;
	if (op === "-") return left - right;
	if (op === "*") return left * right;
	return Math.trunc(left / right);
}

// Dry run: returns { errors } or { tokens }.
function plan(config) {
	const t = tokenize(config.expression);
	if (t.error) return { errors: ["\"expression\": " + t.error] };
	if (!t.tokens.length) return { errors: ["\"expression\" is empty"] };
	if (t.tokens.length > MAX_TOKENS) return { errors: ["\"expression\" can have at most " + MAX_TOKENS + " tokens"] };
	const vals = [];
	const ops = [];
	let depth = 0;
	for (const tok of t.tokens) {
		if (tok === "(") depth++;
		else if (tok === ")") {
			depth--;
			if (depth < 0) return { errors: ["\"expression\": unmatched \")\""] };
			if (!ops.length || vals.length < 2) return { errors: ["\"expression\": a \")\" needs an operator and two values — is every operation wrapped in its own parentheses?"] };
			const op = ops.pop();
			const v1 = vals.pop();
			const v2 = vals.pop();
			if (op === "/" && v1 === 0) return { errors: ["\"expression\": division by zero"] };
			vals.push(applyOp(op, v2, v1));
		} else if ("+-*/".includes(tok)) ops.push(tok);
		else vals.push(Number(tok));
	}
	if (depth !== 0) return { errors: ["\"expression\": unmatched \"(\""] };
	if (vals.length !== 1 || ops.length) return { errors: ["\"expression\" must be fully parenthesized — e.g. ( 1 + 2 ), not 1 + 2"] };
	return { tokens: t.tokens };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	return plan(config).errors || [];
}

export const code = {
	cpp: [
		"for (const std::string& tok : tokens) {",
		"    if (tok == \"(\") continue;",
		"    else if (isOperator(tok)) ops.push(tok);",
		"    else if (tok == \")\") {",
		"        std::string op = ops.pop();",
		"        long v1 = vals.pop();",
		"        long v2 = vals.pop();",
		"        vals.push(apply(op, v2, v1));",
		"    }",
		"    else vals.push(std::stol(tok));   // a value",
		"}",
		"return vals.pop();"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("Current token", "当前词元") },
		{ cls: "is-sorted", label: T("Just pushed", "刚压入") },
		{ cls: "is-swap", label: T("Popped", "已弹出") }
	];
}

export const input = {
	key: "expression",
	label: { en: "Expression", zh: "表达式" },
	format: function(config) { return config.expression; },
	parse: function(text) { return String(text).trim() ? { value: String(text).trim() } : { error: "type an expression like ( ( 2 + 3 ) * 4 )" }; },
	random: function() {
		function gen(d) {
			if (d === 0 || Math.random() < 0.3) return String(1 + Math.floor(Math.random() * 9));
			return "( " + gen(d - 1) + " " + "+-*"[Math.floor(Math.random() * 3)] + " " + gen(d - 1) + " )";
		}
		return "( " + gen(2) + " " + "+*"[Math.floor(Math.random() * 2)] + " " + gen(2) + " )";
	}
};

export function steps(config) {
	const T = tr(config);
	const tokens = plan(config).tokens;
	const vals = [];
	const ops = [];
	const frames = [];

	function push(f) {
		frames.push({
			tokens: tokens, pos: f.pos === undefined ? -1 : f.pos,
			vals: vals.slice(), ops: ops.slice(),
			newVal: !!f.newVal, newOp: !!f.newOp, popped: f.popped || null,
			lines: f.lines || [], msg: f.msg, group: f.group,
			capVals: T("value stack", "值栈"), capOps: T("operator stack", "运算符栈"),
			bottom: T("bottom", "栈底"), empty: T("empty", "空"),
			vars: [
				["tok", f.pos === undefined || f.pos < 0 || f.pos >= tokens.length ? "—" : "\"" + tokens[f.pos] + "\""],
				[T("value stack (top last)", "值栈（栈顶在最后）"), vals.length ? vals.join(", ") : T("empty", "空")],
				[T("operator stack (top last)", "运算符栈（栈顶在最后）"), ops.length ? ops.join(" ") : T("empty", "空")]
			]
		});
	}

	push({ group: -1, msg: T("Start: read the expression left to right with an empty value stack and an empty operator stack.", "开始：从左到右读表达式，值栈和运算符栈都为空。") });
	tokens.forEach(function(tok, k) {
		if (tok === "(") push({ group: k, pos: k, lines: [2], msg: T("\"(\": ignore it.", "`(`：忽略。") });
		else if ("+-*/".includes(tok)) { ops.push(tok); push({ group: k, pos: k, newOp: true, lines: [3], msg: T("Operator " + tok + ": push it onto the operator stack.", "运算符 `" + tok + "`：压入运算符栈。") }); }
		else if (tok === ")") {
			const op = ops.pop();
			const v1 = vals.pop();
			const v2 = vals.pop();
			const r = applyOp(op, v2, v1);
			push({ group: k, pos: k, popped: { op: op, v1: v1, v2: v2 }, lines: [4, 5, 6, 7],
				msg: T("\")\": pop operator " + op + ", then v1 = " + v1 + " (right operand, popped first) and v2 = " + v2 + " (left operand).",
					"`)`：弹出运算符 `" + op + "`，再弹出 `v1 = " + v1 + "`（右操作数，先弹出）和 `v2 = " + v2 + "`（左操作数）。") });
			vals.push(r);
			push({ group: k, pos: k, newVal: true, lines: [8], msg: T("Push v2 " + op + " v1 = " + v2 + " " + op + " " + v1 + " = " + r + " onto the value stack.", "把 `v2 " + op + " v1 = " + v2 + " " + op + " " + v1 + " = " + r + "` 压入值栈。") });
		} else { vals.push(Number(tok)); push({ group: k, pos: k, newVal: true, lines: [10], msg: T("Value " + tok + ": push it onto the value stack.", "值 " + tok + "：压入值栈。") }); }
	});
	push({ group: tokens.length, pos: tokens.length, lines: [12], msg: T("End of input: the value stack holds just the result, " + vals[0] + ".", "输入结束：值栈中只剩结果 " + vals[0] + "。") });
	return frames;
}

const STYLE = `
.vz-ev { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.vz-ev-toks { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.25rem; font: 0.95rem "Consolas", "Menlo", monospace; }
.vz-ev-tok { min-width: 1.6rem; padding: 0.25rem 0.35rem; text-align: center; border: 1.5px solid var(--vz-border); border-radius: 0.4rem; background: var(--vz-surface); }
.vz-ev-tok.is-done { opacity: 0.45; }
.vz-ev-tok.is-cmp { border-color: var(--vz-cmp-bd); box-shadow: 0 0 0 2px var(--vz-cmp-bd); background: var(--vz-cmp-bg); }
.vz-ev-stacks { display: flex; gap: 2rem; justify-content: center; align-items: flex-end; flex-wrap: wrap; }
.vz-ev-col { display: flex; flex-direction: column; align-items: stretch; min-width: 5rem; }
.vz-ev-cap { color: var(--vz-muted); font-size: 0.78rem; text-align: center; margin-bottom: 0.3rem; }
.vz-ev-cell { margin-top: 0.3rem; padding: 0.35rem 0.6rem; text-align: center; border: 1.5px solid var(--vz-border); border-radius: 0.5rem; background: var(--vz-surface); font-weight: 600;
	transition: background-color 0.25s, border-color 0.25s, color 0.25s; }
.vz-ev-cell.is-sorted { background: var(--vz-sorted-bg); color: var(--vz-sorted-fg); border-color: var(--vz-sorted-bd); }
.vz-ev-cell.is-swap { background: var(--vz-swap-bg); color: var(--vz-swap-fg); border-color: var(--vz-swap-bd); border-style: dashed; }
.vz-ev-base { margin-top: 0.3rem; border-top: 2px solid var(--vz-muted); color: var(--vz-muted); font: 0.72rem "Consolas", "Menlo", monospace; text-align: center; padding-top: 0.15rem; }
`;

function ensureStyle() {
	if (document.getElementById("viz-eval-style")) return;
	const s = document.createElement("style");
	s.id = "viz-eval-style";
	s.textContent = STYLE;
	document.head.appendChild(s);
}

function escapeHtml(t) {
	return String(t).replace(/[&<>"']/g, function(ch) {
		return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
	});
}

function stackCol(caption, items, newTop, poppedItems, frame) {
	let html = '<div class="vz-ev-col"><div class="vz-ev-cap">' + caption + "</div>";
	(poppedItems || []).forEach(function(p) { html += '<div class="vz-ev-cell is-swap">' + escapeHtml(p) + "</div>"; });
	for (let k = items.length - 1; k >= 0; k--) {
		html += '<div class="vz-ev-cell' + (k === items.length - 1 && newTop ? " is-sorted" : "") + '">' + escapeHtml(items[k]) + "</div>";
	}
	return html + '<div class="vz-ev-base">' + (items.length ? frame.bottom : frame.empty) + "</div></div>";
}

export function render(stage, frame) {
	ensureStyle();
	let html = '<div class="vz-ev"><div class="vz-ev-toks">';
	frame.tokens.forEach(function(t, k) {
		const cls = ["vz-ev-tok"];
		if (k === frame.pos) cls.push("is-cmp");
		else if (k < frame.pos) cls.push("is-done");
		html += '<span class="' + cls.join(" ") + '">' + escapeHtml(t) + "</span>";
	});
	html += '</div><div class="vz-ev-stacks">' +
		stackCol(frame.capVals, frame.vals, frame.newVal, frame.popped ? [frame.popped.v1 + " (v1)", frame.popped.v2 + " (v2)"] : null, frame) +
		stackCol(frame.capOps, frame.ops, frame.newOp, frame.popped ? [frame.popped.op] : null, frame) +
		"</div></div>";
	stage.innerHTML = html;
}

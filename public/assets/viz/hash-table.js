// Hash table (Lecture 15): separate chaining (array of linked lists, new
// nodes at the head of the chain, as in the slides' SeparateChaining), linear
// probing and quadratic probing (open addressing, deletion by tombstones).
// Integer keys hash with h(k) = k % m; word keys take their hash values from
// the `hashes` param (the slides' "S:2, E:0, …" tables).
import { checkParams, tr } from "./_core.js";
import { arrayView } from "./_array.js";

const MAXOPS = 16;

export const meta = {
	name: "hash-table",
	summary: "Hash table with separate chaining (insert at the head of the chain), linear probing or quadratic probing (h(k, i) = (h(k) + i²) % m), with put / get / remove (tombstones for open addressing).",
	groupLabel: { en: "operation", zh: "操作" },
	switch: { key: "mode", label: { en: "Collision handling", zh: "冲突处理" }, options: [
		{ value: "chaining", label: { en: "Separate chaining", zh: "拉链法" } },
		{ value: "linear", label: { en: "Linear probing", zh: "线性探测" } },
		{ value: "quadratic", label: { en: "Quadratic probing", zh: "二次探测" } }
	] },
	params: {
		mode: { type: "enum", values: ["chaining", "linear", "quadratic"], default: "chaining", desc: "Collision handling." },
		m: { type: "int", min: 2, max: 16, required: true, desc: "Table size (number of buckets / slots)." },
		ops: { type: "string", required: true, desc: "put(k) or put(k, v), get(k), remove(k) (delete(k) also), separated by ';'. At most 16. put(k) without a value stores the number of puts so far (0, 1, 2, …)." },
		hashes: { type: "string", default: "", desc: "For word keys: \"S:2, E:0, A:0\" gives h(k) for each key (0 … m-1). Integer keys use k % m when not listed." },
		code: { type: "enum", values: ["cpp", "none"], default: "cpp", desc: "Code panel." }
	},
	example: { m: 7, ops: "put(47, 0); put(3, 1); put(28, 2); put(14, 3); get(28)" }
};

const KEY = "[^\\s,;:()\"]{1,4}";

function parseHashes(text) {
	const map = {};
	const parts = String(text || "").split(/\s*[,，]\s*/).map(function(s) { return s.trim(); }).filter(Boolean);
	for (const p of parts) {
		const m = new RegExp("^(" + KEY + ")\\s*:\\s*(\\d+)$").exec(p);
		if (!m) return { error: "\"hashes\": can't read \"" + p + "\" (use key:hash)" };
		map[m[1]] = Number(m[2]);
	}
	return { map: map };
}
function parseOps(text) {
	const parts = String(text).split(";").map(function(s) { return s.trim(); }).filter(Boolean);
	if (parts.length === 0) return { error: "\"ops\" is empty" };
	if (parts.length > MAXOPS) return { error: "\"ops\" has " + parts.length + " operations; at most " + MAXOPS };
	const ops = [];
	let puts = 0;
	for (const p of parts) {
		let m;
		if ((m = new RegExp("^put\\(\\s*\"?(" + KEY + ")\"?\\s*(?:,\\s*\"?(" + KEY + ")\"?\\s*)?\\)$").exec(p))) {
			ops.push({ op: "put", key: norm(m[1]), val: m[2] === undefined ? String(puts) : m[2] });
			puts++;
		} else if ((m = new RegExp("^get\\(\\s*\"?(" + KEY + ")\"?\\s*\\)$").exec(p))) ops.push({ op: "get", key: norm(m[1]) });
		else if ((m = new RegExp("^(?:remove|delete)\\(\\s*\"?(" + KEY + ")\"?\\s*\\)$").exec(p))) ops.push({ op: "remove", key: norm(m[1]) });
		else return { error: "\"ops\": can't read \"" + p + "\" (use put(k, v), get(k), remove(k))" };
	}
	return { ops: ops };
}
function isNum(s) { return /^\d+$/.test(s); }
function norm(k) { return isNum(k) ? String(Number(k)) : k; }

function hashOf(key, m, map) {
	if (map[key] !== undefined) return map[key];
	return Number(key) % m;
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const h = parseHashes(config.hashes);
	if (h.error) return [h.error];
	const o = parseOps(config.ops);
	if (o.error) return [o.error];
	for (const k in h.map) if (h.map[k] >= config.m) return ["\"hashes\": h(" + k + ") = " + h.map[k] + " is not below m = " + config.m];
	for (const x of o.ops) if (!isNum(x.key) && h.map[x.key] === undefined) return ["\"ops\": key " + x.key + " is not an integer, so \"hashes\" must give its hash value"];
	return [];
}

const CHAIN_CODE = [
	"Value get(const Key& key) const {",               // 1
	"    int i = hashFunction(key);",                  // 2
	"    for (Node* x = dict[i]; x != nullptr;",       // 3
	"         x = x->next)",                           // 4
	"        if (x->key == key) return x->val;",       // 5
	"    return Value();",                             // 6
	"}",                                               // 7
	"void put(const Key& key, const Value& val) {",    // 8
	"    int i = hashFunction(key);",                  // 9
	"    for (Node* x = dict[i]; x != nullptr;",       // 10
	"         x = x->next)",                           // 11
	"        if (x->key == key) {",                    // 12
	"            x->val = val; return; }",             // 13
	"    dict[i] = new Node{key, val, dict[i]};",      // 14
	"}",                                               // 15
	"void remove(const Key& key) {",                   // 16
	"    int i = hashFunction(key);",                  // 17
	"    Node p = &dict[i];  // link to fix",        // 18
	"    while (*p && (*p)->key != key)",              // 19
	"        p = &(*p)->next;",                        // 20
	"    if (*p) { Node* x = *p;",                     // 21
	"        *p = x->next; delete x; }",               // 22
	"}"                                                // 23
];
const PROBE_CODE = [
	"// slot s(i) = (h + i) % m       (linear)",       // 1
	"// slot s(i) = (h + i*i) % m     (quadratic)",    // 2
	"Value get(const Key& key) const {",               // 3
	"    int h = hashFunction(key);",                  // 4
	"    for (int i = 0; i < m; i++) {",               // 5
	"        int s = slot(h, i);",                     // 6
	"        if (empty[s]) break;  // miss",           // 7
	"        if (!deleted[s] && keys[s] == key)",      // 8
	"            return vals[s];",                     // 9
	"    }   // tombstone: keep going",                // 10
	"    return Value();",                             // 11
	"}",                                               // 12
	"void put(const Key& key, const Value& val) {",    // 13
	"    // probe like get; update if found, else",    // 14
	"    // use the first tombstone or empty slot",    // 15
	"    keys[s] = key; vals[s] = val;",               // 16
	"    empty[s] = deleted[s] = false;",              // 17
	"}",                                               // 18
	"void remove(const Key& key) {",                   // 19
	"    // probe like get; when found:",              // 20
	"    deleted[s] = true;    // tombstone",          // 21
	"}"                                                // 22
];

export function code(config) {
	if (config.mode === "linear" || config.mode === "quadratic") return { cpp: PROBE_CODE };
	return { cpp: CHAIN_CODE };
}

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("Probed / compared", "探测 / 比较") },
		{ cls: "is-swap", label: T("Inserted / updated", "插入 / 更新") },
		{ cls: "is-sorted", label: T("Search hit", "查找命中") },
		{ cls: "is-ghost", label: T("Tombstone / removed", "墓碑 / 已删除") }
	];
}

export const input = {
	key: "ops",
	label: { en: "Operations", zh: "操作" },
	format: function(config) { return config.ops; },
	parse: function(text) { const r = parseOps(text); return r.error ? { error: r.error } : { value: text }; },
	random: function(config) {
		const m = (config && config.m) || 7;
		const ks = [];
		while (ks.length < Math.min(m - 2, 7)) { const k = Math.floor(Math.random() * 50); if (ks.indexOf(k) < 0) ks.push(k); }
		return ks.map(function(k, i) { return "put(" + k + ", " + i + ")"; }).concat(["get(" + ks[1] + ")", "remove(" + ks[0] + ")"]).join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const m = config.m;
	const map = parseHashes(config.hashes).map;
	const ops = parseOps(config.ops).ops;
	const mode = config.mode || "chaining";
	const frames = [];
	let n = 0, probes = 0, result = "—";
	let nextId = 1;
	const hashMsg = function(k, h) { return map[k] !== undefined ? "h(" + k + ") = " + h : "h(" + k + ") = " + k + " % " + m + " = " + h; };

	if (mode === "chaining") {
		const chains = []; for (let i = 0; i < m; i++) chains.push([]);
		const push = function(f) {
			frames.push({ kind: "chain", group: f.group, msg: f.msg, lines: f.lines || [],
				buckets: chains.map(function(c, i) { return { idx: i, role: f.bucket === i ? "cmp" : "", items: c.map(function(x) { return { id: x.id, label: x.key + "," + x.val, role: (f.marks && f.marks[x.id]) || "" }; }) }; }),
				vars: [["key", f.key === undefined ? "—" : String(f.key)], ["i", f.bucket === undefined ? "—" : String(f.bucket)], ["n", String(n)], ["m", String(m)], ["n / m", (n / m).toFixed(2)], [T("compares", "比较次数"), String(probes)], [T("returned", "返回值"), result]] });
		};
		push({ group: 0, msg: T("Empty table: an array of " + m + " chains (linked lists), all `nullptr`.", "空表：" + m + " 条链（链表）组成的数组，全是 `nullptr`。") });
		ops.forEach(function(o, idx) {
			const g = idx + 1, h = hashOf(o.key, m, map);
			const base = o.op === "get" ? 2 : o.op === "put" ? 9 : 17;
			const startProbes = probes;
			push({ key: o.key, bucket: h, group: g, lines: [base], msg: T(hashMsg(o.key, h) + ": look only in chain " + h + ".", hashMsg(o.key, h) + "：只看第 " + h + " 条链。") });
			const c = chains[h];
			let at = -1;
			for (let j = 0; j < c.length; j++) {
				probes++;
				const mk = {}; mk[c[j].id] = "cmp";
				if (c[j].key === o.key) { at = j; break; }
				push({ key: o.key, bucket: h, group: g, marks: mk, lines: o.op === "remove" ? [19, 20] : (o.op === "get" ? [3, 4, 5] : [10, 11, 12]), msg: T("Compare with `" + c[j].key + "`: not equal, next node.", "与 `" + c[j].key + "` 比较：不相等，看下一个节点。") });
			}
			const used = probes - startProbes;
			if (o.op === "get") {
				if (at >= 0) {
					result = c[at].val;
					const mk = {}; mk[c[at].id] = "sorted";
					push({ key: o.key, bucket: h, group: g, marks: mk, lines: [5], msg: T("`" + o.key + "` found: return " + c[at].val + " (" + used + " compare" + (used === 1 ? "" : "s") + ").", "找到 `" + o.key + "`：返回 " + c[at].val + "（比较 " + used + " 次）。") });
				} else {
					result = "Value()";
					push({ key: o.key, bucket: h, group: g, lines: [6], msg: T("End of chain: search miss after " + used + " compare" + (used === 1 ? "" : "s") + ".", "到链尾：比较 " + used + " 次后未命中。") });
				}
			} else if (o.op === "put") {
				result = "—";
				if (at >= 0) {
					const old = c[at].val; c[at].val = o.val;
					const mk = {}; mk[c[at].id] = "swap";
					push({ key: o.key, bucket: h, group: g, marks: mk, lines: [12, 13], msg: T("`" + o.key + "` is already in chain " + h + ": update its value " + old + " → " + o.val + ". No new node.", "`" + o.key + "` 已在第 " + h + " 条链中：值 " + old + " → " + o.val + "，不新建节点。") });
				} else {
					const nd = { id: "c" + nextId++, key: o.key, val: o.val };
					c.unshift(nd); n++;
					const mk = {}; mk[nd.id] = "swap";
					push({ key: o.key, bucket: h, group: g, marks: mk, lines: [14], msg: T("Not in the chain: `dict[" + h + "] = new Node{" + o.key + ", " + o.val + ", dict[" + h + "]}` — the new node goes at the head of chain " + h + ".", "链中没有：`dict[" + h + "] = new Node{" + o.key + ", " + o.val + ", dict[" + h + "]}`——新节点插在第 " + h + " 条链的头部。") });
				}
			} else {
				if (at >= 0) {
					const x = c[at];
					const mk = {}; mk[x.id] = "ghost";
					push({ key: o.key, bucket: h, group: g, marks: mk, lines: [21], msg: T("Found `" + o.key + "`: unlink it from the chain …", "找到 `" + o.key + "`：把它从链中摘下……") });
					c.splice(at, 1); n--;
					result = x.val;
					push({ key: o.key, bucket: h, group: g, lines: [22], msg: T("… and delete the node. Nothing else moves — deletion is easy with chaining.", "……再删除节点。其他都不动——拉链法删除很简单。") });
				} else {
					result = "—";
					push({ key: o.key, bucket: h, group: g, lines: [19], msg: T("Not found: nothing to remove.", "没找到：无需删除。") });
				}
			}
		});
		push({ group: ops.length, msg: T("Done: n = " + n + " keys in m = " + m + " chains, load factor n/m = " + (n / m).toFixed(2) + ". Longest chain: " + Math.max.apply(null, chains.map(function(c) { return c.length; })) + ".", "完成：m = " + m + " 条链中共 n = " + n + " 个键，负载因子 n/m = " + (n / m).toFixed(2) + "。最长链：" + Math.max.apply(null, chains.map(function(c) { return c.length; })) + "。") });
		return frames;
	}

	// ---- open addressing ----
	const slots = []; for (let i = 0; i < m; i++) slots.push(null); // null | { id, key, val, dead }
	const slotOf = function(h, i) { return mode === "linear" ? (h + i) % m : (h + i * i) % m; };
	const formula = function(h, i) { return mode === "linear" ? "(" + h + " + " + i + ") % " + m : "(" + h + " + " + i + "²) % " + m; };
	const push = function(f) {
		frames.push({ kind: "probe", group: f.group, msg: f.msg, lines: f.lines || [],
			cells: slots.map(function(s, i) {
				if (!s) return { id: "e" + i, label: "", role: f.marks && f.marks[i] ? f.marks[i] : "" };
				if (s.dead) return { id: s.id, label: "†", role: "ghost" + (f.marks && f.marks[i] ? " " + f.marks[i] : "") };
				return { id: s.id, label: s.key, role: (f.marks && f.marks[i]) || "" };
			}),
			ptr: f.ptr,
			vars: [["key", f.key === undefined ? "—" : String(f.key)], ["i", f.i === undefined ? "—" : String(f.i)], ["s", f.ptr === undefined ? "—" : String(f.ptr)], ["n", String(n)], ["n / m", (n / m).toFixed(2)], [T("probes", "探测次数"), String(probes)], [T("returned", "返回值"), result]] });
	};
	push({ group: 0, msg: T("Empty table of m = " + m + " slots. " + (mode === "linear" ? "Linear probing: on a collision try the next slot, (h + i) % m, wrapping around." : "Quadratic probing: the i-th try is (h + i²) % m."), "m = " + m + " 个槽的空表。" + (mode === "linear" ? "线性探测：冲突时试下一个槽 (h + i) % m，到末尾绕回开头。" : "二次探测：第 i 次尝试 (h + i²) % m。")) });
	ops.forEach(function(o, idx) {
		const g = idx + 1, h = hashOf(o.key, m, map);
		const lineSet = o.op === "get" ? { probe: [5, 6], hit: [8, 9], miss: [7, 11] } : o.op === "put" ? { probe: [14], hit: [14], miss: [15, 16, 17] } : { probe: [20], hit: [21], miss: [20] };
		const startProbes = probes;
		let free = -1, found = -1, endEmpty = -1;
		for (let i = 0; i < m; i++) {
			const s = slotOf(h, i);
			probes++;
			const mk = {}; mk[s] = "cmp";
			const cell = slots[s];
			const head = i === 0 ? T(hashMsg(o.key, h) + ". ", hashMsg(o.key, h) + "。") : "";
			const where = i === 0 ? T("slot " + s, "槽 " + s) : T("try " + formula(h, i) + " = slot " + s, "尝试 " + formula(h, i) + " = 槽 " + s);
			if (!cell) {
				endEmpty = s;
				if (o.op === "get") result = "Value()";
				if (free < 0) free = s;
				push({ key: o.key, i: i, ptr: s, group: g, marks: mk, lines: o.op === "get" ? [7] : lineSet.probe, msg: head + T(where[0].toUpperCase() + where.slice(1) + " is empty" + (o.op === "put" ? "." : ": stop — `" + o.key + "` is not in the table."), where + " 是空的" + (o.op === "put" ? "。" : "：停止——`" + o.key + "` 不在表中。")) });
				break;
			}
			if (cell.dead) {
				if (free < 0) free = s;
				push({ key: o.key, i: i, ptr: s, group: g, marks: mk, lines: [10], msg: head + T(where[0].toUpperCase() + where.slice(1) + " holds a tombstone: don't stop, keep probing" + (o.op === "put" && free === s ? " (remember it as a free spot)" : "") + ".", where + " 是墓碑：不能停，继续探测" + (o.op === "put" && free === s ? "（记下它可以复用）" : "") + "。") });
				continue;
			}
			if (cell.key === o.key) {
				found = s;
				if (o.op === "get") result = cell.val;
				const mk2 = {}; mk2[s] = "sorted";
				push({ key: o.key, i: i, ptr: s, group: g, marks: mk2, lines: lineSet.hit, msg: head + T(where[0].toUpperCase() + where.slice(1) + " holds `" + o.key + "`: found after " + (probes - startProbes) + " probe" + (probes - startProbes === 1 ? "" : "s") + ".", where + " 存的就是 `" + o.key + "`：探测 " + (probes - startProbes) + " 次后找到。") });
				break;
			}
			push({ key: o.key, i: i, ptr: s, group: g, marks: mk, lines: lineSet.probe, msg: head + T(where[0].toUpperCase() + where.slice(1) + " holds `" + cell.key + "` ≠ `" + o.key + "`: collision, probe again.", where + " 存的是 `" + cell.key + "` ≠ `" + o.key + "`：冲突，继续探测。") });
		}
		void endEmpty;
		if (o.op === "get") {
			result = found >= 0 ? slots[found].val : "Value()";
			if (found < 0 && probes - startProbes >= m) push({ key: o.key, group: g, lines: [11], msg: T("Probed " + m + " times without finding it: miss.", "探测了 " + m + " 次都没找到：未命中。") });
		} else if (o.op === "put") {
			result = "—";
			if (found >= 0) {
				const old = slots[found].val; slots[found].val = o.val;
				const mk = {}; mk[found] = "swap";
				push({ key: o.key, ptr: found, group: g, marks: mk, lines: [16], msg: T("Update the value of `" + o.key + "`: " + old + " → " + o.val + ".", "更新 `" + o.key + "` 的值：" + old + " → " + o.val + "。") });
			} else if (free < 0) {
				push({ key: o.key, group: g, lines: [15], msg: T("No free slot on the probe sequence after " + m + " probes" + (mode === "quadratic" ? " (quadratic probing doesn't visit every slot)" : " — the table is full") + ": the insert fails. A real table resizes long before this (keep n/m ≤ ½).",
					"探测 " + m + " 次都没有空位" + (mode === "quadratic" ? "（二次探测不会访问所有槽）" : "——表已满") + "：插入失败。真正的哈希表会远在此之前扩容（保持 n/m ≤ ½）。") });
			} else {
				const reuse = slots[free] && slots[free].dead;
				slots[free] = { id: "v" + nextId++, key: o.key, val: o.val, dead: false };
				n++;
				const mk = {}; mk[free] = "swap";
				push({ key: o.key, ptr: free, group: g, marks: mk, lines: [15, 16, 17], msg: T("Store (" + o.key + ", " + o.val + ") in slot " + free + (reuse ? ", replacing the tombstone there" : "") + ".", "把 (" + o.key + ", " + o.val + ") 存进槽 " + free + (reuse ? "，复用那里的墓碑" : "") + "。") });
			}
		} else {
			if (found >= 0) {
				result = slots[found].val;
				slots[found].dead = true; n--;
				const mk = {}; mk[found] = "swap";
				push({ key: o.key, ptr: found, group: g, marks: mk, lines: [21], msg: T("Mark slot " + found + " as a tombstone (deleted, not empty), so later searches still probe past it.", "把槽 " + found + " 标成墓碑（已删除，而不是空），后面的查找仍会越过它继续探测。") });
			} else {
				result = "—";
				push({ key: o.key, group: g, lines: [20], msg: T("Not found: nothing to remove.", "没找到：无需删除。") });
			}
		}
	});
	push({ group: ops.length, msg: T("Done: n = " + n + " keys in m = " + m + " slots (load factor " + (n / m).toFixed(2) + "). † = tombstone.", "完成：m = " + m + " 个槽中有 n = " + n + " 个键（负载因子 " + (n / m).toFixed(2) + "）。† = 墓碑。") });
	return frames;
}

const CSS = `
.vz-ht-chains { display: flex; flex-direction: column; gap: 0.35rem; align-items: flex-start; margin: 0 auto; width: max-content; max-width: 100%; overflow-x: auto; }
.vz-ht-row { display: flex; align-items: center; gap: 0.35rem; min-height: 2.3rem; }
.vz-ht-idx { width: 2.2rem; height: 2.1rem; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--vz-border); border-radius: 0.4rem; background: var(--vz-soft); font-variant-numeric: tabular-nums; color: var(--vz-muted); font-size: 0.85rem; }
.vz-ht-idx.is-cmp { border-color: var(--vz-cmp-bd); box-shadow: 0 0 0 2px var(--vz-cmp-bd); color: var(--vz-ink); }
.vz-ht-arrow { color: var(--vz-muted); font-size: 0.9rem; }
.vz-ht-null { color: var(--vz-muted); font-size: 0.75rem; }
.vz-ht-node { min-width: 2.9rem; height: 2.1rem; padding: 0 0.4rem; display: flex; align-items: center; justify-content: center; border: 1.5px solid var(--vz-border); border-radius: 0.4rem; background: var(--vz-surface); font-weight: 600; font-size: 0.85rem; white-space: nowrap; transition: background .3s, border-color .3s; }
.vz-ht-node.is-cmp { border-color: var(--vz-cmp-bd); box-shadow: 0 0 0 2px var(--vz-cmp-bd); background: var(--vz-cmp-bg); }
.vz-ht-node.is-swap { background: var(--vz-swap-bg); color: var(--vz-swap-fg); border-color: var(--vz-swap-bd); }
.vz-ht-node.is-sorted { background: var(--vz-sorted-bg); color: var(--vz-sorted-fg); border-color: var(--vz-sorted-bd); }
.vz-ht-node.is-ghost { border-style: dashed; color: var(--vz-muted); background: none; text-decoration: line-through; }
`;

function ensureCss() {
	if (document.getElementById("viz-hash-table-style")) return;
	const st = document.createElement("style");
	st.id = "viz-hash-table-style";
	st.textContent = CSS;
	document.head.appendChild(st);
}

export function render(stage, frame) {
	if (frame.kind === "probe") {
		const ptrs = frame.cells.map(function(_, i) { return i === frame.ptr ? [{ name: "s", role: "cmp" }] : []; });
		arrayView(stage).update({ cells: frame.cells, index: true, ptrs: ptrs });
		return;
	}
	ensureCss();
	let box = stage.querySelector(".vz-ht-chains");
	if (!box) { stage.innerHTML = ""; box = document.createElement("div"); box.className = "vz-ht-chains"; stage.appendChild(box); }
	box.innerHTML = frame.buckets.map(function(b) {
		return '<div class="vz-ht-row"><div class="vz-ht-idx' + (b.role ? " is-" + b.role : "") + '">' + b.idx + '</div>' +
			b.items.map(function(x) { return '<span class="vz-ht-arrow">→</span><div class="vz-ht-node' + (x.role ? " is-" + x.role : "") + '">' + String(x.label).replace(/[&<>]/g, function(c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }) + '</div>'; }).join("") +
			'<span class="vz-ht-arrow">→</span><span class="vz-ht-null">null</span></div>';
	}).join("");
}

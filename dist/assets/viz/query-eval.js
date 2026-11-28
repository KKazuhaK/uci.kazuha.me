// Query evaluation over postings with counts, step by step
// (CS 121 Lecture 19 p26–48): document-at-a-time vs term-at-a-time
// scoring, and their conjunctive (AND) versions. Score of a document =
// sum over query terms of the term's count in it (g_i(Q) = 1, f_i = count),
// as in the slides' "salt water tropical" example.
import { checkParams, tr } from "./_core.js?v=f4afb4f310";

const MAX_TERMS = 5;
const MAX_DOCS = 12;

export const meta = {
	name: "query-eval",
	summary: "Document-at-a-time vs term-at-a-time query evaluation over postings (doc:count); score = sum of counts; optional conjunctive (AND) processing with skipping.",
	groupLabel: { en: "step", zh: "步" },
	params: {
		postings: { type: "string", required: true, desc: "One inverted list per term, separated by ;: \"salt: 1:1 4:1; water: 1:1 2:1 4:1\" (docID:count, docIDs increasing; at most 5 terms, 12 distinct docs)." },
		mode: { type: "enum", values: ["doc", "term"], default: "doc", desc: "doc = document-at-a-time, term = term-at-a-time." },
		conjunctive: { type: "bool", default: false, desc: "Return only documents that contain every query term (AND), skipping postings that can't match." },
		code: { type: "enum", values: ["python", "none"], default: "python", desc: "Python code beside the demo." }
	},
	switch: {
		key: "mode",
		label: { en: "Order", zh: "顺序" },
		options: [
			{ value: "doc", label: { en: "Document-at-a-time", zh: "按文档" } },
			{ value: "term", label: { en: "Term-at-a-time", zh: "按词项" } }
		]
	},
	example: {
		postings: "salt: 1:1 4:1; water: 1:1 2:1 4:1; tropical: 1:2 2:2 3:1",
		mode: "doc"
	}
};

function parse(text) {
	const parts = String(text).split(";").map(function(s) { return s.trim(); }).filter(Boolean);
	if (!parts.length) return { error: "\"postings\" is empty" };
	if (parts.length > MAX_TERMS) return { error: "\"postings\": at most " + MAX_TERMS + " terms" };
	const terms = [];
	const all = new Set();
	for (const p of parts) {
		const m = /^([^:\s]+)\s*:\s*(.*)$/.exec(p);
		if (!m) return { error: "\"postings\": \"" + p + "\" should look like term: 1:2 4:1" };
		const list = [];
		const toks = m[2].split(/[\s,]+/).filter(Boolean);
		if (!toks.length) return { error: "\"postings\": the list of \"" + m[1] + "\" is empty" };
		for (const t of toks) {
			const q = /^(\d+):(\d+)$/.exec(t);
			if (!q) return { error: "\"postings\": \"" + t + "\" (in " + m[1] + ") is not docID:count" };
			const d = Number(q[1]), c = Number(q[2]);
			if (c < 1) return { error: "\"postings\": count must be ≥ 1 (" + t + ")" };
			if (list.length && d <= list[list.length - 1][0]) return { error: "\"postings\": the list of \"" + m[1] + "\" must be sorted by docID with no repeats" };
			list.push([d, c]);
			all.add(d);
		}
		if (terms.some(function(x) { return x.name === m[1]; })) return { error: "\"postings\": term \"" + m[1] + "\" appears twice" };
		terms.push({ name: m[1], list: list });
	}
	if (all.size > MAX_DOCS) return { error: "\"postings\": at most " + MAX_DOCS + " distinct docIDs (got " + all.size + ")" };
	return { terms: terms, docs: Array.from(all).sort(function(a, b) { return a - b; }) };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const p = parse(config.postings);
	return p.error ? [p.error] : [];
}

const CODE = {
	doc: [
		"def doc_at_a_time(lists):",
		"    scores = {}",
		"    docs = sorted(set().union(*lists))",
		"    for d in docs:",
		"        s = 0",
		"        for l in lists:",
		"            if d in l:  # current doc == d",
		"                s += l[d]   # g(Q) * f = count",
		"        scores[d] = s",
		"    return top_k(scores)"
	],
	term: [
		"def term_at_a_time(lists):",
		"    acc = {}  # accumulators A_d",
		"    for l in lists:",
		"        for d, count in l.items():",
		"            acc[d] = acc.get(d, 0) + count",
		"    return top_k(acc)"
	],
	docAnd: [
		"def conj_doc_at_a_time(lists):",
		"    scores = {}",
		"    while all lists are unfinished:",
		"        d = max(l.current() for l in lists)",
		"        for l in lists:",
		"            l.skip_forward_to(d)",
		"            if l.current() != d:",
		"                break  # some list lacks d",
		"        else:",
		"            scores[d] = sum(l.count()",
		"                            for l in lists)",
		"            for l in lists: l.move_past(d)",
		"    return top_k(scores)"
	],
	termAnd: [
		"def conj_term_at_a_time(lists):",
		"    acc = dict(lists[0])  # first list",
		"    for l in lists[1:]:",
		"        new = {}",
		"        for d, count in l.items():",
		"            if d in acc:  # else skip d",
		"                new[d] = acc[d] + count",
		"        acc = new  # drop docs l lacks",
		"    return top_k(acc)"
	]
};

function variant(config) {
	const m = config.mode || "doc";
	return config.conjunctive ? (m === "doc" ? "docAnd" : "termAnd") : m;
}

export function code(config) {
	return { python: CODE[variant(config)] };
}

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("Being read", "正在读") },
		{ cls: "is-sorted", label: T("Added to a score", "计入得分") },
		{ cls: "is-min", label: T("Skipped / dropped", "跳过 / 丢弃") }
	];
}

export const input = {
	key: "postings",
	label: { en: "Postings", zh: "Postings" },
	format: function(config) { return config.postings; },
	parse: function(text) {
		const p = parse(text);
		if (p.error) return { error: p.error.replace("\"postings\"", "the postings") };
		return { value: p.terms.map(function(t) { return t.name + ": " + t.list.map(function(x) { return x[0] + ":" + x[1]; }).join(" "); }).join("; ") };
	},
	random: function() {
		const names = ["salt", "water", "tropical", "fish"];
		const n = 2 + Math.floor(Math.random() * 3);
		return names.slice(0, n).map(function(name) {
			const s = new Set();
			const k = 2 + Math.floor(Math.random() * 4);
			while (s.size < k) s.add(1 + Math.floor(Math.random() * 8));
			return name + ": " + Array.from(s).sort(function(a, b) { return a - b; }).map(function(d) { return d + ":" + (1 + Math.floor(Math.random() * 3)); }).join(" ");
		}).join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const { terms, docs } = parse(config.postings);
	const mode = config.mode || "doc";
	const v = variant(config);
	const frames = [];
	// cell state per "ti:doc": "read" | "used" | "skip"
	const cell = {};
	const score = {};      // doc -> score (final for DAAT, accumulator for TAAT)
	const dropped = new Set();
	let group = 0;
	const ui = {
		terms: terms.map(function(t) { return t.name; }),
		scoreLabel: mode === "doc" ? T("score", "得分") : T("accumulator", "累加器"),
		docLabel: T("doc", "文档")
	};

	function snapshot(f) {
		const ranking = Object.keys(score).filter(function(d) { return !dropped.has(Number(d)); })
			.map(Number).sort(function(a, b) { return score[b] - score[a] || a - b; });
		frames.push({
			group: f.group, lines: f.lines.map(function(x) { return x + 1; }), msg: f.msg, final: !!f.final,
			ui: ui, docs: docs,
			grid: terms.map(function(t, ti) {
				const m = {};
				t.list.forEach(function(x) { m[x[0]] = { c: x[1], st: cell[ti + ":" + x[0]] || "" }; });
				return m;
			}),
			score: Object.assign({}, score),
			dropped: Array.from(dropped),
			activeDoc: f.doc == null ? null : f.doc,
			activeTerm: f.term == null ? null : f.term,
			vars: [
				[T("current", "当前"), f.doc != null ? T("doc ", "文档 ") + f.doc : (f.term != null ? terms[f.term].name : "—")],
				[T("ranking", "排名"), ranking.length ? ranking.map(function(d) { return d + ":" + score[d]; }).join("  ") : "—"]
			]
		});
	}

	const names = terms.map(function(t) { return t.name; }).join(" ");
	snapshot({ group: 0, lines: [0], msg: T(
		"Query: " + names + ". Each posting x:y is document x with the term's count y; a document's score is the sum of its counts. " +
		(mode === "doc" ? "Document-at-a-time: finish one document (all lists) before moving to the next." : "Term-at-a-time: read one whole list, adding into accumulators, then the next list.") +
		(config.conjunctive ? " Conjunctive: only documents with every term count." : ""),
		"查询：" + names + "。每个 posting x:y 表示文档 x 中该词出现 y 次；文档得分为这些次数之和。" +
		(mode === "doc" ? "按文档处理：先在所有列表里把一个文档算完，再处理下一个。" : "按词项处理：先读完一整个列表、把分数加到累加器里，再读下一个列表。") +
		(config.conjunctive ? "合取（AND）：只有包含全部查询词的文档才算。" : "")
	) });

	if (v === "doc") {
		for (const d of docs) {
			group++;
			score[d] = 0;
			const parts = [];
			terms.forEach(function(t, ti) {
				const hit = t.list.find(function(x) { return x[0] === d; });
				if (hit) { cell[ti + ":" + d] = "used"; score[d] += hit[1]; parts.push(String(hit[1])); }
			});
			snapshot({ group: group, lines: [3, 4, 5, 6, 7, 8], doc: d, msg: T(
				"Document " + d + ": every list whose current posting is " + d + " adds its count: " + parts.join(" + ") + " = " + score[d] + ". Its score is complete; move all those lists past " + d + ".",
				"文档 " + d + "：当前 posting 是 " + d + " 的每个列表加上它的次数：" + parts.join(" + ") + " = " + score[d] + "。这个文档的得分算完了；把这些列表都移过 " + d + "。"
			) });
		}
	} else if (v === "term") {
		terms.forEach(function(t, ti) {
			group++;
			t.list.forEach(function(x) {
				const d = x[0];
				cell[ti + ":" + d] = "read";
				const before = score[d] || 0;
				score[d] = before + x[1];
				snapshot({ group: group, lines: [3, 4], term: ti, doc: d, msg: T(
					t.name + " → " + d + ":" + x[1] + ". A_" + d + " = " + before + " + " + x[1] + " = " + score[d] + (before ? "." : " (new accumulator)."),
					t.name + " → " + d + ":" + x[1] + "。A_" + d + " = " + before + " + " + x[1] + " = " + score[d] + (before ? "。" : "（新建累加器）。")
				) });
				cell[ti + ":" + d] = "used";
			});
			snapshot({ group: group, lines: [2], term: ti, msg: T(
				"Finished the " + t.name + " list. The accumulators hold partial scores; no document is final until every list is read.",
				t.name + " 的列表读完了。累加器里是部分得分；所有列表读完之前，没有文档的得分是最终的。"
			) });
		});
	} else if (v === "docAnd") {
		const ptr = terms.map(function() { return 0; });
		const done = function() { return terms.some(function(t, ti) { return ptr[ti] >= t.list.length; }); };
		while (!done()) {
			group++;
			let d = -1;
			terms.forEach(function(t, ti) { d = Math.max(d, t.list[ptr[ti]][0]); });
			snapshot({ group: group, lines: [3], doc: d, msg: T(
				"The largest current document among the lists is " + d + ": no smaller document can be in all of them.",
				"各列表当前文档中最大的是 " + d + "：比它小的文档不可能出现在所有列表里。"
			) });
			let ok = true;
			for (let ti = 0; ti < terms.length; ti++) {
				const t = terms[ti];
				const skipped = [];
				while (ptr[ti] < t.list.length && t.list[ptr[ti]][0] < d) { cell[ti + ":" + t.list[ptr[ti]][0]] = "skip"; skipped.push(t.list[ptr[ti]][0]); ptr[ti]++; }
				if (ptr[ti] >= t.list.length || t.list[ptr[ti]][0] !== d) {
					ok = false;
					snapshot({ group: group, lines: [5, 6, 7], doc: d, term: ti, msg: T(
						t.name + (skipped.length ? " skips " + skipped.join(", ") + " and" : "") + " has no posting for " + d + " → " + d + " can't match; break and look for the next candidate.",
						t.name + (skipped.length ? " 跳过 " + skipped.join(", ") + "，" : "") + "没有文档 " + d + " 的 posting → " + d + " 不可能匹配；break，找下一个候选。"
					) });
					break;
				}
				if (skipped.length) snapshot({ group: group, lines: [5], doc: d, term: ti, msg: T(
					t.name + " skips forward over " + skipped.join(", ") + " to " + d + " (those documents are never scored).",
					t.name + " 向前跳过 " + skipped.join(", ") + "，停在 " + d + "（这些文档从不计分）。"
				) });
			}
			if (ok) {
				score[d] = 0;
				const parts = [];
				terms.forEach(function(t, ti) { const c = t.list[ptr[ti]][1]; parts.push(String(c)); score[d] += c; cell[ti + ":" + d] = "used"; ptr[ti]++; });
				snapshot({ group: group, lines: [9, 10, 11], doc: d, msg: T(
					"Every list points at " + d + ": score = " + parts.join(" + ") + " = " + score[d] + "; move all lists past " + d + ".",
					"所有列表都指向 " + d + "：得分 = " + parts.join(" + ") + " = " + score[d] + "；把所有列表移过 " + d + "。"
				) });
			}
		}
		terms.forEach(function(t, ti) { for (let k = ptr[ti]; k < t.list.length; k++) if (!cell[ti + ":" + t.list[k][0]]) cell[ti + ":" + t.list[k][0]] = "skip"; });
		snapshot({ group: group + 1, lines: [2], msg: T(
			"A list is finished, so no further document can contain every term — stop (the rest is never read).",
			"有一个列表已经读完，后面不可能再有文档包含全部查询词——停止（剩下的不再读取）。"
		) });
		group++;
	} else {
		terms.forEach(function(t, ti) {
			group++;
			if (ti === 0) {
				t.list.forEach(function(x) { cell["0:" + x[0]] = "used"; score[x[0]] = x[1]; });
				snapshot({ group: group, lines: [1], term: 0, msg: T(
					"The first list (" + t.name + ") creates the candidate accumulators: " + t.list.map(function(x) { return "A_" + x[0] + " = " + x[1]; }).join(", ") + ". A document missing from it can never contain every term.",
					"第一个列表（" + t.name + "）建立候选累加器：" + t.list.map(function(x) { return "A_" + x[0] + " = " + x[1]; }).join("，") + "。不在其中的文档不可能包含全部查询词。"
				) });
				return;
			}
			const seen = new Set();
			t.list.forEach(function(x) {
				const d = x[0];
				if (score[d] !== undefined && !dropped.has(d)) {
					score[d] += x[1]; seen.add(d); cell[ti + ":" + d] = "used";
					snapshot({ group: group, lines: [5, 6], term: ti, doc: d, msg: T(
						t.name + " → " + d + ":" + x[1] + ": A_" + d + " exists → A_" + d + " = " + score[d] + ".",
						t.name + " → " + d + ":" + x[1] + "：A_" + d + " 存在 → A_" + d + " = " + score[d] + "。"
					) });
				} else {
					cell[ti + ":" + d] = "skip";
					snapshot({ group: group, lines: [5], term: ti, doc: d, msg: T(
						t.name + " → " + d + ":" + x[1] + ": no accumulator for " + d + " → skip to the next document that has one.",
						t.name + " → " + d + ":" + x[1] + "：文档 " + d + " 没有累加器 → 跳到下一个有累加器的文档。"
					) });
				}
			});
			const gone = Object.keys(score).map(Number).filter(function(d) { return !dropped.has(d) && !seen.has(d); });
			gone.forEach(function(d) { dropped.add(d); });
			snapshot({ group: group, lines: [7], term: ti, msg: gone.length ? T(
				"Remove the accumulators " + t.name + " never reached: " + gone.join(", ") + " (they lack " + t.name + ").",
				"删除 " + t.name + " 没有命中的累加器：" + gone.join(", ") + "（它们不含 " + t.name + "）。"
			) : T("Every remaining accumulator also contains " + t.name + ".", "剩下的累加器都包含 " + t.name + "。") });
		});
	}

	const ranking = Object.keys(score).map(Number).filter(function(d) { return !dropped.has(d); })
		.sort(function(a, b) { return score[b] - score[a] || a - b; });
	snapshot({ group: group + 1, final: true, lines: [v === "doc" ? 9 : v === "term" ? 5 : v === "docAnd" ? 12 : 8], msg: ranking.length ? T(
		"Final scores, best first: " + ranking.map(function(d) { return "doc " + d + " = " + score[d]; }).join(", ") + ".",
		"最终得分（从高到低）：" + ranking.map(function(d) { return "文档 " + d + " = " + score[d]; }).join("，") + "。"
	) : T("No document contains every query term.", "没有文档包含全部查询词。") });
	return frames;
}

const STYLE = `
.vz-qe { overflow-x: auto; }
.vz-qe table { border-collapse: separate; border-spacing: 0.3rem; font: 0.85rem/1.2 "Consolas", "Menlo", monospace; }
.vz-qe th { font: 600 0.8rem/1.2 system-ui, sans-serif; padding: 0 0.3rem; color: var(--vz-muted); }
.vz-qe th.vz-qe-term { text-align: right; color: inherit; }
.vz-qe th.is-active { color: inherit; text-decoration: underline; }
.vz-qe td { min-width: 2.4rem; height: 1.8rem; text-align: center; border-radius: 0.25rem; }
.vz-qe td.has { border: 1px solid var(--vz-border); background: var(--vz-surface); }
.vz-qe td.is-cmp { background: var(--vz-cmp-bg); border: 2px solid var(--vz-cmp-bd); font-weight: 700; }
.vz-qe td.is-used { background: var(--vz-sorted-bg); border-color: var(--vz-sorted-bd); color: var(--vz-sorted-fg); }
.vz-qe td.is-skip { background: var(--vz-min-bg); border-color: var(--vz-min-bd); color: var(--vz-muted); text-decoration: line-through; }
.vz-qe td.col-active { box-shadow: inset 0 0 0 2px var(--vz-cmp-bd); }
.vz-qe tr.vz-qe-score td.has { font-weight: 700; border-style: dashed; }
.vz-qe tr.vz-qe-score td.is-skip { font-weight: 400; }
`;

function ensureStyle() {
	if (document.getElementById("viz-query-eval-style")) return;
	const s = document.createElement("style");
	s.id = "viz-query-eval-style";
	s.textContent = STYLE;
	document.head.appendChild(s);
}

function esc(x) {
	return String(x).replace(/[&<>"']/g, function(ch) {
		return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
	});
}

export function render(stage, frame) {
	ensureStyle();
	let html = '<div class="vz-qe"><table><tr><th></th>';
	frame.docs.forEach(function(d) {
		html += '<th class="' + (frame.activeDoc === d ? "is-active" : "") + '">' + esc(frame.ui.docLabel) + " " + d + "</th>";
	});
	html += "</tr>";
	frame.grid.forEach(function(m, ti) {
		html += '<tr><th class="vz-qe-term' + (frame.activeTerm === ti ? " is-active" : "") + '">' + esc(frame.ui.terms[ti]) + "</th>";
		frame.docs.forEach(function(d) {
			const c = m[d];
			let cls = c ? "has" : "";
			if (c) {
				if (frame.activeTerm === ti && frame.activeDoc === d) cls += " is-cmp";
				else if (c.st === "used") cls += " is-used";
				else if (c.st === "skip") cls += " is-skip";
				else if (c.st === "read") cls += " is-cmp";
			}
			if (frame.activeDoc === d && frame.activeTerm == null) cls += " col-active";
			html += '<td class="' + cls + '">' + (c ? d + ":" + c.c : "") + "</td>";
		});
		html += "</tr>";
	});
	html += '<tr class="vz-qe-score"><th class="vz-qe-term">' + esc(frame.ui.scoreLabel) + "</th>";
	frame.docs.forEach(function(d) {
		const s = frame.score[d];
		const gone = frame.dropped.indexOf(d) >= 0;
		html += '<td class="' + (s !== undefined ? "has" + (gone ? " is-skip" : " is-used") : "") + '">' + (s !== undefined ? d + ":" + s : "") + "</td>";
	});
	stage.innerHTML = html + "</tr></table></div>";
}

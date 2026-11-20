// Vector space scoring step by step (CS 121 Week 8, Lecture 21 p34–53):
// raw counts → tf weight (n / l / b) → idf (t) → cosine length
// normalization (c) → dot product. With a query: SMART "ddd.qqq" scheme
// (default lnc.ltc, the slides' "best car insurance" example) and one score
// per document; without one: pairwise cosine between the documents (the
// slides' Sense and Sensibility / Pride and Prejudice / Wuthering Heights).
import { checkParams, tr } from "./_core.js?v=d245a77e9b";

const MAX_DOCS = 4;
const MAX_TERMS = 8;

export const meta = {
	name: "tfidf-cosine",
	summary: "Vector space scoring: tf weighting, idf, length normalization and dot product (cosine), with SMART ddd.qqq schemes such as lnc.ltc; query vs documents or pairwise documents.",
	groupLabel: { en: "stage", zh: "阶段" },
	params: {
		docs: { type: "string", required: true, desc: "Documents separated by ;, each \"name: text\" (\"d: car insurance auto insurance\") or \"name: term:count …\" (\"SaS: affection:115 jealous:10\"). At most 4 documents and 8 distinct terms." },
		query: { type: "string", desc: "Query text (\"best car insurance\") or term:count pairs. Without it, every pair of documents is compared." },
		scheme: { type: "string", default: "lnc.ltc", desc: "SMART letters: tf n|l|b, df n|t, norm n|c. \"ddd.qqq\" with a query, \"ddd\" (or the ddd part) without one." },
		df: { type: "string", desc: "Document frequencies \"auto:5000 best:50000 …\" for every term (needed when the scheme uses t); their order is the table's row order." },
		N: { type: "int", min: 1, desc: "Number of documents in the collection (needed with t)." },
		code: { type: "enum", values: ["python", "none"], default: "python", desc: "Python code beside the demo." }
	},
	example: {
		docs: "d: car insurance auto insurance",
		query: "best car insurance",
		scheme: "lnc.ltc",
		df: "auto:5000 best:50000 car:10000 insurance:1000",
		N: 1000000
	}
};

function parseBag(text, where) {
	const toks = String(text).trim().split(/[\s,]+/).filter(Boolean);
	if (!toks.length) return { error: where + " is empty" };
	const counted = toks.filter(function(t) { return /^[^:\s]+:\d+$/.test(t); }).length;
	if (counted && counted !== toks.length) return { error: where + ": use either plain words or term:count pairs, not both" };
	const bag = new Map();
	for (const t of toks) {
		if (counted) {
			const i = t.lastIndexOf(":");
			const term = t.slice(0, i).toLowerCase(), c = Number(t.slice(i + 1));
			if (c > 100000) return { error: where + ": count of \"" + term + "\" is too large (max 100000)" };
			if (bag.has(term)) return { error: where + ": term \"" + term + "\" appears twice" };
			bag.set(term, c);
		} else {
			const term = t.toLowerCase();
			bag.set(term, (bag.get(term) || 0) + 1);
		}
	}
	return { bag: bag };
}

function parseScheme(s, hasQuery) {
	const parts = String(s).split(".");
	const ok = function(x) { return /^[nlb][nt][nc]$/.test(x); };
	if (hasQuery) {
		if (parts.length !== 2 || !ok(parts[0]) || !ok(parts[1])) return { error: "\"scheme\" must look like \"lnc.ltc\" (tf n|l|b, df n|t, norm n|c) when there is a query" };
		return { doc: parts[0], query: parts[1] };
	}
	if (!ok(parts[0]) || parts.length > 2) return { error: "\"scheme\" must look like \"lnc\" (tf n|l|b, df n|t, norm n|c)" };
	return { doc: parts[0], query: null };
}

function parseAll(config) {
	const hasQuery = config.query !== undefined;
	const sc = parseScheme(config.scheme === undefined ? "lnc.ltc" : config.scheme, hasQuery);
	if (sc.error) return sc;
	const parts = String(config.docs).split(";").map(function(x) { return x.trim(); }).filter(Boolean);
	if (!parts.length) return { error: "\"docs\" is empty" };
	if (parts.length > MAX_DOCS) return { error: "\"docs\": at most " + MAX_DOCS + " documents" };
	if (!hasQuery && parts.length < 2) return { error: "\"docs\": without a query, give at least 2 documents to compare" };
	const docs = [];
	for (const p of parts) {
		const m = /^([^:\s]+)\s*:\s*(.*)$/.exec(p);
		if (!m) return { error: "\"docs\": \"" + p + "\" should look like name: text" };
		if (docs.some(function(d) { return d.name === m[1]; })) return { error: "\"docs\": name \"" + m[1] + "\" appears twice" };
		const b = parseBag(m[2], "\"docs\" (" + m[1] + ")");
		if (b.error) return b;
		docs.push({ name: m[1], bag: b.bag });
	}
	let query = null;
	if (hasQuery) {
		const b = parseBag(config.query, "\"query\"");
		if (b.error) return b;
		query = { name: "q", bag: b.bag };
	}
	// term order: df order, else first appearance (query first)
	const order = [];
	const add = function(t) { if (order.indexOf(t) < 0) order.push(t); };
	let df = null;
	const usesIdf = sc.doc[1] === "t" || (sc.query && sc.query[1] === "t");
	if (config.df !== undefined) {
		df = new Map();
		for (const tok of String(config.df).trim().split(/[\s,]+/).filter(Boolean)) {
			const q = /^([^:\s]+):(\d+)$/.exec(tok);
			if (!q) return { error: "\"df\": \"" + tok + "\" is not term:count" };
			const v = Number(q[2]);
			if (v < 1) return { error: "\"df\": df of \"" + q[1] + "\" must be ≥ 1" };
			df.set(q[1].toLowerCase(), v);
			add(q[1].toLowerCase());
		}
	}
	if (query) query.bag.forEach(function(_, t) { add(t); });
	docs.forEach(function(d) { d.bag.forEach(function(_, t) { add(t); }); });
	if (order.length > MAX_TERMS) return { error: "at most " + MAX_TERMS + " distinct terms (got " + order.length + ")" };
	if (usesIdf) {
		if (!df) return { error: "\"df\" is required when the scheme uses idf (t)" };
		if (config.N === undefined) return { error: "\"N\" is required when the scheme uses idf (t)" };
		for (const t of order) {
			if (!df.has(t)) return { error: "\"df\": missing a document frequency for \"" + t + "\"" };
			if (df.get(t) > config.N) return { error: "\"df\": df of \"" + t + "\" is larger than N" };
		}
	}
	return { scheme: sc, docs: docs, query: query, terms: order, df: df, N: config.N };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const p = parseAll(config);
	return p.error ? [p.error] : [];
}

const CODE = [
	"import math",
	"",
	"def tf_wt(c, letter):",
	"    if c == 0: return 0",
	"    if letter == \"l\": return 1 + math.log10(c)",
	"    if letter == \"b\": return 1",
	"    return c  # \"n\": natural",
	"",
	"def vector(tf, s, df=None, N=None):",
	"    w = {}  # s = 3 SMART letters, e.g. \"ltc\"",
	"    for t, c in tf.items():",
	"        w[t] = tf_wt(c, s[0])",
	"    if s[1] == \"t\":  # idf",
	"        for t in w:",
	"            w[t] *= math.log10(N / df[t])",
	"    if s[2] == \"c\":  # cosine normalization",
	"        sq = sum(x * x for x in w.values())",
	"        L = math.sqrt(sq)",
	"        w = {t: x / L for t, x in w.items()}",
	"    return w",
	"",
	"def score(q, d):  # dot product",
	"    return sum(q[t] * d.get(t, 0) for t in q)"
];

export const code = { python: CODE };

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("Computed in this step", "本步计算") },
		{ cls: "is-sorted", label: T("Contributes to the score", "计入得分") }
	];
}

export const input = {
	key: "docs",
	label: { en: "Documents", zh: "文档" },
	format: function(config) { return config.docs; },
	parse: function(text) {
		const parts = String(text).split(";").map(function(x) { return x.trim(); }).filter(Boolean);
		if (!parts.length) return { error: "the documents are empty" };
		for (const p of parts) if (!/^[^:\s]+\s*:\s*\S/.test(p)) return { error: "\"" + p + "\" should look like name: text" };
		return { value: parts.join("; ") };
	},
	random: function() {
		const words = ["car", "insurance", "auto", "best"];
		const one = function() {
			const n = 2 + Math.floor(Math.random() * 4);
			const out = [];
			for (let i = 0; i < n; i++) out.push(words[Math.floor(Math.random() * words.length)]);
			return out.join(" ");
		};
		return "d1: " + one() + "; d2: " + one();
	}
};

function fmt(x, digits) {
	if (x === null || x === undefined) return "";
	if (Number.isInteger(x)) return String(x);
	return x.toFixed(digits);
}

function tfWt(c, letter) {
	if (c === 0) return 0;
	if (letter === "l") return 1 + Math.log10(c);
	if (letter === "b") return 1;
	return c;
}

export function steps(config) {
	const T = tr(config);
	const P = parseAll(config);
	const terms = P.terms;
	const withQuery = !!P.query;
	const vecs = (withQuery ? [P.query] : []).concat(P.docs).map(function(v, i) {
		return { name: v.name, bag: v.bag, s: withQuery && i === 0 ? P.scheme.query : P.scheme.doc, isQuery: withQuery && i === 0 };
	});
	const frames = [];

	// Column model: per vector [tf-raw, tf-wt, (idf, wt)?, (n'lize)?]; then products.
	const cols = [];
	vecs.forEach(function(v, vi) {
		v.col = {};
		const push = function(key, label) { v.col[key] = cols.length; cols.push({ vec: vi, key: key, label: label }); };
		push("raw", "tf-raw");
		push("tfw", "tf-wt");
		if (v.s[1] === "t") { push("df", "df"); push("idf", "idf"); push("wt", "wt"); }
		if (v.s[2] === "c") push("norm", "n'lize");
	});
	const pairs = [];
	if (withQuery) vecs.slice(1).forEach(function(_, k) { pairs.push([0, k + 1]); });
	else for (let a = 0; a < vecs.length; a++) for (let b = a + 1; b < vecs.length; b++) pairs.push([a, b]);
	pairs.forEach(function(pr) {
		pr.col = cols.length;
		cols.push({ vec: -1, key: "prod", label: withQuery ? T("q×" + vecs[pr[1]].name, "q×" + vecs[pr[1]].name) : vecs[pr[0]].name + "×" + vecs[pr[1]].name });
	});

	const grid = terms.map(function() { return cols.map(function() { return ""; }); });
	const foot = cols.map(function() { return ""; });
	const footLabel = { len: T("length", "长度"), score: withQuery ? T("score", "得分") : "cos" };
	const footRows = { len: cols.map(function() { return ""; }), score: cols.map(function() { return ""; }) };
	let group = 0;
	const finals = [];   // [label, value]

	function snap(f) {
		frames.push({
			group: f.group, lines: f.lines, msg: f.msg, final: !!f.final,
			head: cols.map(function(c) { return { vec: c.vec, label: c.label }; }),
			vecNames: vecs.map(function(v) { return v.isQuery ? T("Query", "查询") : T("Document ", "文档 ") + v.name; }),
			prodLabel: withQuery ? T("Product", "乘积") : T("Products", "乘积"),
			terms: terms.slice(),
			grid: grid.map(function(r) { return r.slice(); }),
			footLabel: footLabel,
			foot: { len: footRows.len.slice(), score: footRows.score.slice() },
			hl: f.hl || [],
			good: f.good || [],
			vars: f.vars || []
		});
	}

	const qtext = withQuery ? Array.from(P.query.bag.keys()).join(" ") : "";
	snap({ group: 0, lines: [], msg: withQuery
		? T("Scheme " + P.scheme.doc + "." + P.scheme.query + " (ddd.qqq): documents use " + P.scheme.doc + ", the query uses " + P.scheme.query + ". tf-raw = how often each term occurs.",
			"方案 " + P.scheme.doc + "." + P.scheme.query + "（ddd.qqq）：文档用 " + P.scheme.doc + "，查询用 " + P.scheme.query + "。tf-raw = 每个词出现的次数。")
		: T("Compare the documents pairwise with scheme " + P.scheme.doc + ". tf-raw = how often each term occurs.",
			"用方案 " + P.scheme.doc + " 两两比较文档。tf-raw = 每个词出现的次数。"),
		vars: withQuery ? [[T("query", "查询"), qtext]] : [] });

	// 1. raw counts
	group++;
	vecs.forEach(function(v) {
		terms.forEach(function(t, ti) { grid[ti][v.col.raw] = String(v.bag.get(t) || 0); });
	});
	snap({ group: group, lines: [], hl: vecs.map(function(v) { return v.col.raw; }), msg: T(
		"Term counts (the bag of words): one column per vector, one row per term.",
		"词频计数（词袋）：每个向量一列，每个词一行。") });

	// 2. tf weight
	group++;
	vecs.forEach(function(v) {
		v.w = {};
		terms.forEach(function(t, ti) { v.w[t] = tfWt(v.bag.get(t) || 0, v.s[0]); grid[ti][v.col.tfw] = fmt(v.w[t], 2); });
	});
	const tfDesc = function(l) { return l === "l" ? T("1 + log10(tf) if tf > 0, else 0", "tf > 0 时为 1 + log10(tf)，否则为 0") : l === "b" ? T("1 if tf > 0, else 0", "tf > 0 时为 1，否则为 0") : T("tf itself", "tf 本身"); };
	snap({ group: group, lines: [3, 4, 5, 6, 7, 10, 11, 12], hl: vecs.map(function(v) { return v.col.tfw; }), msg: (withQuery ? [T("Query", "查询") + " (" + P.scheme.query[0] + "): " + tfDesc(P.scheme.query[0])] : [])
		.concat([T("Documents", "文档") + " (" + P.scheme.doc[0] + "): " + tfDesc(P.scheme.doc[0])]).join(" · ") + "." });

	// 3. idf
	const idfVecs = vecs.filter(function(v) { return v.s[1] === "t"; });
	if (idfVecs.length) {
		group++;
		const hl = [];
		idfVecs.forEach(function(v) {
			terms.forEach(function(t, ti) {
				const d = P.df.get(t);
				const idf = Math.log10(P.N / d);
				v.w[t] = v.w[t] * idf;
				grid[ti][v.col.df] = String(d);
				grid[ti][v.col.idf] = fmt(idf, 2);
				grid[ti][v.col.wt] = fmt(v.w[t], 2);
			});
			hl.push(v.col.df, v.col.idf, v.col.wt);
		});
		snap({ group: group, lines: [13, 14, 15], hl: hl, vars: [["N", String(P.N)]], msg: T(
			"idf = log10(N / df) with N = " + P.N + "; wt = tf-wt × idf. Rare terms get the big weights.",
			"idf = log10(N / df)，N = " + P.N + "；wt = tf-wt × idf。罕见词得到大权重。") });
	} else if (vecs.some(function(v) { return v.s[1] === "n"; })) {
		// nothing to show: "n" = no idf
	}

	// 4. normalization
	const normVecs = vecs.filter(function(v) { return v.s[2] === "c"; });
	if (normVecs.length) {
		group++;
		normVecs.forEach(function(v) {
			const before = terms.map(function(t) { return v.w[t]; });
			const L = Math.sqrt(before.reduce(function(s, x) { return s + x * x; }, 0));
			v.len = L;
			footRows.len[v.col.norm] = fmt(L, 3);
			snap({ group: group, lines: [16, 17, 18], hl: [v.col.norm], vars: [[T("length ", "长度 ") + (v.isQuery ? "q" : v.name), fmt(L, 3)]], msg: T(
				(v.isQuery ? "Query" : v.name) + " length = √(" + before.map(function(x) { return fmt(x, 2) + "²"; }).join(" + ") + ") = " + fmt(L, 3) + ".",
				(v.isQuery ? "查询" : v.name) + " 的长度 = √(" + before.map(function(x) { return fmt(x, 2) + "²"; }).join(" + ") + ") = " + fmt(L, 3) + "。") });
			terms.forEach(function(t, ti) { v.w[t] = L > 0 ? v.w[t] / L : 0; grid[ti][v.col.norm] = fmt(v.w[t], 3); });
			snap({ group: group, lines: [19], hl: [v.col.norm], vars: [[T("length ", "长度 ") + (v.isQuery ? "q" : v.name), fmt(L, 3)]], msg: T(
				"Divide every weight by " + fmt(L, 3) + ": " + (v.isQuery ? "the query" : v.name) + " is now a unit vector (its new length is 1).",
				"每个权重都除以 " + fmt(L, 3) + "：" + (v.isQuery ? "查询" : v.name) + " 现在是单位向量（长度为 1）。") });
		});
	}

	// 5. dot products
	group++;
	pairs.forEach(function(pr) {
		const a = vecs[pr[0]], b = vecs[pr[1]];
		let s = 0;
		const parts = [];
		const good = [];
		terms.forEach(function(t, ti) {
			const x = a.w[t] * b.w[t];
			s += x;
			grid[ti][pr.col] = fmt(x === 0 ? 0 : x, 3);
			parts.push(fmt(x === 0 ? 0 : x, 3));
			if (x !== 0) good.push([ti, pr.col]);
		});
		footRows.score[pr.col] = fmt(s, 3);
		const label = withQuery ? T("score(" + b.name + ")", "score(" + b.name + ")") : "cos(" + a.name + ", " + b.name + ")";
		finals.push([label, s]);
		const cosine = a.s[2] === "c" && b.s[2] === "c";
		snap({ group: group, lines: [22, 23], hl: [pr.col], good: good, vars: [[label, fmt(s, 3)]], msg: T(
			label + " = " + parts.join(" + ") + " = " + fmt(s, 3) + (withQuery
				? (cosine ? " (both vectors are unit length, so the dot product is the cosine)." : ".")
				: (cosine ? " — unit vectors, so the dot product is the cosine." : ".")),
			label + " = " + parts.join(" + ") + " = " + fmt(s, 3) + (cosine ? "（两个都是单位向量，点积就是余弦）。" : "。")) });
	});

	const ranked = finals.slice().sort(function(x, y) { return y[1] - x[1]; });
	snap({ group: group + 1, final: true, lines: [], vars: ranked.map(function(f) { return [f[0], fmt(f[1], 3)]; }), msg: T(
		(withQuery ? "Ranking: " : "Most similar first: ") + ranked.map(function(f) { return f[0] + " = " + fmt(f[1], 3); }).join(" > ") + ".",
		(withQuery ? "排名：" : "从最相似开始：") + ranked.map(function(f) { return f[0] + " = " + fmt(f[1], 3); }).join(" > ") + "。") });
	return frames;
}

const STYLE = `
.vz-tc { overflow-x: auto; }
.vz-tc table { border-collapse: separate; border-spacing: 0.2rem; font: 0.82rem/1.2 "Consolas", "Menlo", monospace; margin: 0 auto; }
.vz-tc th { font: 600 0.78rem/1.2 system-ui, sans-serif; padding: 0.1rem 0.3rem; color: var(--vz-muted); white-space: nowrap; }
.vz-tc th.vz-tc-group { color: inherit; border-bottom: 2px solid var(--vz-border); }
.vz-tc th.vz-tc-term { text-align: right; color: inherit; }
.vz-tc td { min-width: 2.6rem; height: 1.6rem; padding: 0 0.3rem; text-align: right; border-radius: 0.25rem; border: 1px solid var(--vz-border); background: var(--vz-surface); }
.vz-tc td.is-empty { background: transparent; border-style: dashed; }
.vz-tc td.is-cmp { background: var(--vz-cmp-bg); border: 2px solid var(--vz-cmp-bd); font-weight: 700; }
.vz-tc td.is-good { background: var(--vz-sorted-bg); border-color: var(--vz-sorted-bd); color: var(--vz-sorted-fg); font-weight: 700; }
.vz-tc tr.vz-tc-foot td { border-style: dashed; font-weight: 700; }
.vz-tc tr.vz-tc-foot td.is-blank { border: none; background: transparent; }
`;

function ensureStyle() {
	if (document.getElementById("viz-tfidf-cosine-style")) return;
	const s = document.createElement("style");
	s.id = "viz-tfidf-cosine-style";
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
	// group header row: consecutive columns of the same vector
	let html = '<div class="vz-tc"><table><tr><th></th>';
	let i = 0;
	while (i < frame.head.length) {
		const v = frame.head[i].vec;
		let j = i;
		while (j < frame.head.length && frame.head[j].vec === v) j++;
		html += '<th class="vz-tc-group" colspan="' + (j - i) + '">' + esc(v >= 0 ? frame.vecNames[v] : frame.prodLabel) + "</th>";
		i = j;
	}
	html += "</tr><tr><th></th>" + frame.head.map(function(h) { return "<th>" + esc(h.label) + "</th>"; }).join("") + "</tr>";
	const isGood = function(ti, ci) { return frame.good.some(function(g) { return g[0] === ti && g[1] === ci; }); };
	frame.terms.forEach(function(t, ti) {
		html += '<tr><th class="vz-tc-term">' + esc(t) + "</th>";
		frame.grid[ti].forEach(function(cell, ci) {
			let cls = cell === "" ? "is-empty" : "";
			if (cell !== "" && isGood(ti, ci)) cls = "is-good";
			else if (cell !== "" && frame.hl.indexOf(ci) >= 0) cls = "is-cmp";
			html += '<td class="' + cls + '">' + esc(cell) + "</td>";
		});
		html += "</tr>";
	});
	["len", "score"].forEach(function(k) {
		const row = frame.foot[k];
		if (!row.some(function(x) { return x !== ""; })) return;
		html += '<tr class="vz-tc-foot"><th class="vz-tc-term">' + esc(frame.footLabel[k]) + "</th>" +
			row.map(function(x) { return '<td class="' + (x === "" ? "is-blank" : "") + '">' + esc(x) + "</td>"; }).join("") + "</tr>";
	});
	stage.innerHTML = html + "</table></div>";
}

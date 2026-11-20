// PageRank by iteration (CS 121 Lecture 24 p52–56): the Google paper's
// PR(A) = (1 - d) + d * sum(PR(Ti) / C(Ti)), every page starting at 1,
// all pages updated at once from the previous iteration's values (as in
// the slides' A, B, C example). A dead end (no out-links) jumps to a
// random page (L24 p38): it is treated as linking to every page.
import { checkParams, tr } from "./_core.js";

const MAX_PAGES = 8;
const TOL = 0.0001;

export const meta = {
	name: "pagerank",
	summary: "PageRank by iteration over a small link graph: PR(A) = (1 - d) + d * sum(PR(T)/C(T)), all pages start at 1, one page update per step for the first iterations, then one step per iteration until it converges.",
	groupLabel: { en: "iteration", zh: "迭代" },
	params: {
		graph: { type: "string", required: true, desc: "Links, one page per clause: \"A -> B; B -> C; C -> A, B\" (page names: letters/digits, at most 8 pages; a page that is only a target has no out-links = dead end)." },
		damping: { type: "int", default: 85, min: 1, max: 99, desc: "Damping factor d in percent (85 = d 0.85)." },
		iterations: { type: "int", default: 40, min: 1, max: 60, desc: "Most iterations to run; stops earlier once no value changes by more than 0.0001." },
		detail: { type: "int", default: 2, min: 0, max: 10, desc: "Number of iterations shown page by page (the rest one step each)." },
		code: { type: "enum", values: ["python", "none"], default: "python", desc: "Python code beside the demo." }
	},
	example: { graph: "A -> B; B -> C; C -> A, B" }
};

function parse(text) {
	const clauses = String(text).split(";").map(function(s) { return s.trim(); }).filter(Boolean);
	if (!clauses.length) return { error: "\"graph\" is empty" };
	const pages = [];
	const out = {};
	function add(p) {
		if (!/^[A-Za-z0-9_]{1,8}$/.test(p)) return "\"graph\": page name \"" + p + "\" must be 1–8 letters/digits";
		if (!(p in out)) { pages.push(p); out[p] = []; }
		return null;
	}
	for (const c of clauses) {
		const m = /^([^\s\->]+)\s*->\s*(.+)$/.exec(c);
		if (!m) return { error: "\"graph\": \"" + c + "\" should look like A -> B, C" };
		let e = add(m[1]); if (e) return { error: e };
		const targets = m[2].split(/[\s,]+/).filter(Boolean);
		for (const t of targets) {
			e = add(t); if (e) return { error: e };
			if (t === m[1]) return { error: "\"graph\": " + t + " links to itself" };
			if (out[m[1]].indexOf(t) >= 0) return { error: "\"graph\": " + m[1] + " -> " + t + " is listed twice" };
			out[m[1]].push(t);
		}
	}
	if (pages.length > MAX_PAGES) return { error: "\"graph\": at most " + MAX_PAGES + " pages (got " + pages.length + ")" };
	if (pages.length < 2) return { error: "\"graph\": needs at least 2 pages" };
	return { pages: pages, out: out };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const p = parse(config.graph);
	return p.error ? [p.error] : [];
}

function dstr(config) {
	return fmt((config.damping || 85) / 100);
}

export function code(config) {
	return { python: [
		"def pagerank(links, d=" + dstr(config) + ", iters=40):",
		"    pages = list(links)",
		"    # dead end: jump to a random page",
		"    out = {t: links[t] or pages for t in pages}",
		"    pr = {p: 1.0 for p in pages}  # guess 1",
		"    for it in range(iters):",
		"        new = {}",
		"        for a in pages:",
		"            s = 0.0",
		"            for t in pages:  # T1..Tn -> a",
		"                if a in out[t]:",
		"                    s += pr[t] / len(out[t])",
		"            new[a] = (1 - d) + d * s",
		"        pr = new  # all pages at once",
		"    return pr"
	] };
}

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-cmp", label: T("Page being updated", "正在更新的页面") },
		{ cls: "is-swap", label: T("Links into it (its T1…Tn)", "指向它的链接（T1…Tn）") },
		{ cls: "is-sorted", label: T("Converged", "已收敛") }
	];
}

export const input = {
	key: "graph",
	label: { en: "Links", zh: "链接" },
	format: function(config) { return config.graph; },
	parse: function(text) {
		const p = parse(text);
		if (p.error) return { error: p.error.replace("\"graph\"", "the links") };
		return { value: p.pages.filter(function(x) { return p.out[x].length; }).map(function(x) { return x + " -> " + p.out[x].join(", "); }).join("; ") };
	},
	random: function() {
		const names = ["A", "B", "C", "D", "E"];
		const n = 3 + Math.floor(Math.random() * 3);
		const ps = names.slice(0, n);
		return ps.map(function(a) {
			const others = ps.filter(function(b) { return b !== a; });
			const k = 1 + Math.floor(Math.random() * 2);
			const pick = [];
			while (pick.length < k) { const b = others[Math.floor(Math.random() * others.length)]; if (pick.indexOf(b) < 0) pick.push(b); }
			return a + " -> " + pick.join(", ");
		}).join("; ");
	}
};

function fmt(x) {
	return String(parseFloat(x.toFixed(6)));
}

export function steps(config) {
	const T = tr(config);
	const { pages, out: links } = parse(config.graph);
	const d = (config.damping || 85) / 100;
	const maxIt = config.iterations || 40;
	const detail = config.detail === undefined ? 2 : config.detail;
	const N = pages.length;
	const out = {};
	pages.forEach(function(p) { out[p] = links[p].length ? links[p] : pages.slice(); });
	const dead = pages.filter(function(p) { return !links[p].length; });
	const inl = {};
	pages.forEach(function(a) { inl[a] = pages.filter(function(t) { return out[t].indexOf(a) >= 0; }); });
	const one = fmt(1 - d);
	const ds = fmt(d);

	// The equation for each page, written like the slides.
	const eq = {};
	pages.forEach(function(a) {
		const terms = inl[a].map(function(t) { return "PR(" + t + ")/" + out[t].length; });
		eq[a] = "PR(" + a + ") = " + one + " + " + ds + " * " + (terms.length > 1 ? "(" + terms.join(" + ") + ")" : (terms[0] || "0"));
	});

	const ui = { iterLabel: T("iter", "迭代"), sumLabel: T("sum", "总和") };
	const frames = [];
	let pr = {};
	pages.forEach(function(p) { pr[p] = 1; });
	const history = [Object.assign({}, pr)];

	function snap(f) {
		frames.push({
			group: f.group, lines: f.lines, msg: f.msg, final: !!f.final,
			ui: ui, pages: pages, links: links, dead: dead,
			pr: Object.assign({}, f.pr || pr),
			history: history.map(function(h) { return Object.assign({}, h); }),
			partial: f.partial || null,
			active: f.active || null,
			from: f.active ? inl[f.active] : [],
			converged: !!f.converged,
			vars: [
				[T("iteration", "迭代"), String(f.iter)],
				["d", ds],
				[T("sum of PR", "PR 总和"), fmt(pages.reduce(function(s, p) { return s + (f.pr || pr)[p]; }, 0))]
			]
		});
	}

	snap({ group: 0, iter: 0, lines: [1, 2, 3, 4, 5], msg: T(
		"One equation per page, from its in-links: " + pages.map(function(a) { return eq[a]; }).join("; ") + ". " +
		(dead.length ? "Dead end " + dead.join(", ") + ": treated as linking to every page (jump to a random page). " : "") +
		"How do we start? Guess PR = 1 for every page, then iterate.",
		"每个页面一个方程，由指向它的链接得出：" + pages.map(function(a) { return eq[a]; }).join("；") + "。" +
		(dead.length ? "死胡同 " + dead.join("、") + "：当作链接到所有页面（随机跳转）。" : "") +
		"从哪里开始？先猜每个页面 PR = 1，然后迭代。"
	) });

	let converged = false;
	let it = 0;
	while (it < maxIt && !converged) {
		it++;
		const prev = pr;
		const next = {};
		const exprs = [];
		pages.forEach(function(a) {
			const s = inl[a].reduce(function(acc, t) { return acc + prev[t] / out[t].length; }, 0);
			next[a] = (1 - d) + d * s;
			const nums = inl[a].map(function(t) { return fmt(prev[t]) + "/" + out[t].length; });
			const body = nums.length > 1 ? "(" + nums.join(" + ") + ")" : (nums[0] || "0");
			const expr = "PR(" + a + ") = " + one + " + " + ds + " * " + body + " = " + fmt(next[a]);
			exprs.push(expr);
			if (it <= detail) {
				const partial = Object.assign({}, next);
				snap({ group: it, iter: it, lines: [8, 9, 10, 11, 12, 13], active: a, pr: prev, partial: partial, msg: T(
					expr + (inl[a].length ? " — using the previous iteration's values of " + inl[a].join(", ") + "." : " — no page links to " + a + ", so only the 1 - d part."),
					expr + (inl[a].length ? " ——用的是上一轮 " + inl[a].join("、") + " 的值。" : " ——没有页面链接到 " + a + "，只剩 1 - d 这一项。")
				) });
			}
		});
		const change = Math.max.apply(null, pages.map(function(p) { return Math.abs(next[p] - prev[p]); }));
		pr = next;
		history.push(Object.assign({}, pr));
		converged = change < TOL;
		const vals = pages.map(function(p) { return p + " = " + fmt(pr[p]); }).join(", ");
		snap({ group: it, iter: it, lines: [14], converged: converged, msg: it <= detail ? T(
			"Iteration " + it + " done, all pages replaced at once: " + vals + ". Largest change: " + fmt(change) + ".",
			"第 " + it + " 轮完成，所有页面同时替换：" + vals + "。最大变化：" + fmt(change) + "。"
		) : T(
			"Iteration " + it + ": " + exprs.join("; ") + ". Largest change: " + fmt(change) + ".",
			"第 " + it + " 轮：" + exprs.join("；") + "。最大变化：" + fmt(change) + "。"
		) });
	}
	const total = pages.reduce(function(s, p) { return s + pr[p]; }, 0);
	const order = pages.slice().sort(function(a, b) { return pr[b] - pr[a]; });
	snap({ group: it + 1, iter: it, final: true, converged: converged, lines: [15], msg: converged ? T(
		"Converged after " + it + " iterations (no value moved by 0.0001 or more): " + order.map(function(p) { return p + " = " + pr[p].toFixed(4); }).join(", ") + ". Average PageRank = " + fmt(total / N) + ".",
		"迭代 " + it + " 轮后收敛（没有值的变化达到 0.0001）：" + order.map(function(p) { return p + " = " + pr[p].toFixed(4); }).join("，") + "。平均 PageRank = " + fmt(total / N) + "。"
	) : T(
		"Stopped after " + it + " iterations (not yet converged): " + order.map(function(p) { return p + " = " + pr[p].toFixed(4); }).join(", ") + ".",
		"跑了 " + it + " 轮后停止（尚未收敛）：" + order.map(function(p) { return p + " = " + pr[p].toFixed(4); }).join("，") + "。"
	) });
	return frames;
}

const STYLE = `
.vz-pr { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-start; justify-content: center; }
.vz-pr svg { width: 260px; max-width: 100%; height: auto; }
.vz-pr .pr-node circle { fill: var(--vz-surface); stroke: var(--vz-ink); stroke-width: 1.5; }
.vz-pr .pr-node.is-cmp circle { fill: var(--vz-cmp-bg); stroke: var(--vz-cmp-bd); stroke-width: 3; }
.vz-pr .pr-node.is-from circle { fill: var(--vz-swap-bg); stroke: var(--vz-swap-bd); stroke-width: 2.5; }
.vz-pr .pr-node.is-done circle { fill: var(--vz-sorted-bg); stroke: var(--vz-sorted-bd); }
.vz-pr .pr-node text { fill: var(--vz-ink); font: 700 15px system-ui, sans-serif; text-anchor: middle; }
.vz-pr .pr-node text.pr-val { font: 500 11px "Consolas", "Menlo", monospace; fill: var(--vz-muted); }
.vz-pr .pr-edge { stroke: var(--vz-muted); stroke-width: 1.5; fill: none; }
.vz-pr .pr-edge.is-in { stroke: var(--vz-swap-fg); stroke-width: 2.5; }
.vz-pr .pr-dead { stroke: var(--vz-muted); stroke-dasharray: 3 3; fill: none; }
.vz-pr table { border-collapse: collapse; font: 0.8rem/1.3 "Consolas", "Menlo", monospace; }
.vz-pr th { font: 600 0.78rem/1.2 system-ui, sans-serif; color: var(--vz-muted); padding: 0.15rem 0.5rem; position: sticky; top: 0; background: var(--vz-surface); }
.vz-pr td { padding: 0.15rem 0.5rem; text-align: right; border-top: 1px solid var(--vz-border); }
.vz-pr td.is-cmp { background: var(--vz-cmp-bg); font-weight: 700; }
.vz-pr td.is-new { color: var(--vz-blue); }
.vz-pr tr.is-last td { font-weight: 600; }
.vz-pr tr.is-done td { background: var(--vz-sorted-bg); color: var(--vz-sorted-fg); }
`;

function ensureStyle() {
	if (document.getElementById("viz-pagerank-style")) return;
	const s = document.createElement("style");
	s.id = "viz-pagerank-style";
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
	const pages = frame.pages;
	const N = pages.length;
	const W = 260, H = 240, cx = 130, cy = 120, R = 82, r = 22;
	const pos = {};
	pages.forEach(function(p, i) {
		// First page at the top left, then clockwise (3 pages: A top left, B top right, C bottom).
		const ang = (-150 + i * 360 / N) * Math.PI / 180;
		pos[p] = [cx + R * Math.cos(ang), cy + R * Math.sin(ang)];
	});
	let svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img"><defs>' +
		'<marker id="pr-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0L10 5L0 10z" style="fill: var(--vz-muted)"/></marker>' +
		'<marker id="pr-arrow-in" viewBox="0 0 10 10" refX="9" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0 0L10 5L0 10z" style="fill: var(--vz-swap-fg)"/></marker></defs>';
	pages.forEach(function(t) {
		frame.links[t].forEach(function(a) {
			const [x1, y1] = pos[t], [x2, y2] = pos[a];
			const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
			const ux = dx / len, uy = dy / len;
			const both = frame.links[a].indexOf(t) >= 0;
			const off = both ? 9 : 0; // two-way pair: bend each arrow to its own side
			const sx = x1 + ux * r, sy = y1 + uy * r, ex = x2 - ux * (r + 2), ey = y2 - uy * (r + 2);
			const mx = (sx + ex) / 2 - uy * off * 2, my = (sy + ey) / 2 + ux * off * 2;
			const isIn = frame.active === a && frame.from.indexOf(t) >= 0;
			svg += '<path class="pr-edge' + (isIn ? " is-in" : "") + '" marker-end="url(#' + (isIn ? "pr-arrow-in" : "pr-arrow") + ')" d="M' + sx.toFixed(1) + " " + sy.toFixed(1) + " Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + ex.toFixed(1) + " " + ey.toFixed(1) + '"/>';
		});
	});
	pages.forEach(function(p) {
		const [x, y] = pos[p];
		let cls = "pr-node";
		if (frame.active === p) cls += " is-cmp";
		else if (frame.active && frame.from.indexOf(p) >= 0) cls += " is-from";
		else if (frame.converged) cls += " is-done";
		// While an iteration runs, nodes show the previous values (the inputs); the page being updated shows its new value.
		const v = frame.partial && frame.active === p ? frame.partial[p] : frame.pr[p];
		svg += '<g class="' + cls + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r + '"/>' +
			'<text x="' + x.toFixed(1) + '" y="' + (y + 1).toFixed(1) + '">' + esc(p) + "</text>" +
			'<text class="pr-val" x="' + x.toFixed(1) + '" y="' + (y + 14).toFixed(1) + '">' + esc(String(parseFloat(v.toFixed(3)))) + "</text></g>";
		if (frame.dead.indexOf(p) >= 0) svg += '<circle class="pr-dead" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (r + 5) + '"/>';
	});
	svg += "</svg>";

	let tab = '<div class="pr-tab"><table><tr><th>' + esc(frame.ui.iterLabel) + "</th>";
	pages.forEach(function(p) { tab += "<th>PR(" + esc(p) + ")</th>"; });
	tab += "<th>" + esc(frame.ui.sumLabel) + "</th></tr>";
	const h = frame.history;
	// Long runs: first 3 rows, a gap, then the last 4.
	const shownRows = h.length > 8 ? [0, 1, 2, -1].concat([h.length - 4, h.length - 3, h.length - 2, h.length - 1]) : h.map(function(_, k) { return k; });
	shownRows.forEach(function(k) {
		if (k < 0) { tab += '<tr><td>…</td>' + pages.map(function() { return "<td>…</td>"; }).join("") + "<td></td></tr>"; return; }
		const row = h[k];
		const last = k === h.length - 1 && !frame.partial;
		tab += '<tr class="' + (last ? "is-last" + (frame.converged ? " is-done" : "") : "") + '"><td>' + k + "</td>";
		let sum = 0;
		pages.forEach(function(p) { sum += row[p]; tab += "<td>" + parseFloat(row[p].toFixed(6)) + "</td>"; });
		tab += "<td>" + parseFloat(sum.toFixed(6)) + "</td></tr>";
	});
	if (frame.partial) {
		tab += "<tr><td>" + h.length + "</td>";
		pages.forEach(function(p) {
			const v = frame.partial[p];
			const cls = frame.active === p ? "is-cmp" : (v !== undefined ? "is-new" : "");
			tab += '<td class="' + cls + '">' + (v !== undefined ? parseFloat(v.toFixed(6)) : "…") + "</td>";
		});
		tab += "<td></td></tr>";
	}
	tab += "</table></div>";
	stage.innerHTML = '<div class="vz-pr">' + svg + tab + "</div>";
}

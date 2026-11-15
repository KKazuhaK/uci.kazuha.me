// Basic web crawl, step by step (CS 121 Lectures 7 and 9): seeds go into the
// URL frontier; the crawler thread takes a URL, checks permission, fetches
// and stores the page, extracts its links and adds the unseen ones to the
// frontier. Optional per-host politeness delay (frontier.nextSite() skips a
// host that was visited too recently) and an optional crawler trap (a page
// that links to a brand-new URL every time it is fetched).
import { checkParams, tr } from "./_core.js";

const MAX_PAGES = 30;
const MAX_HOSTS = 6;
const MAX_FRAMES = 400;

export const meta = {
	name: "crawl-frontier",
	summary: "Basic crawl over a small link graph: seeds → frontier queue → fetch / store / extract, with optional per-host politeness delay and a crawler trap.",
	groupLabel: { en: "fetch", zh: "获取" },
	params: {
		web: { type: "string", required: true, desc: "Link graph: \"host/path -> host/path, host/path; …\" — one page per ';'. Links to pages not listed are pages without links." },
		seeds: { type: "string", required: true, desc: "Seed URLs, comma-separated (must be pages of the graph)." },
		disallow: { type: "string", default: "", desc: "robots.txt-style blocked prefixes, comma-separated, e.g. \"www.cnn.com/2003/\"." },
		politeness: { type: "int", default: 0, min: 0, max: 4, desc: "Ticks a host must rest between two fetches (0 = plain FIFO, L7 p4)." },
		trap: { type: "string", default: "", desc: "URL prefix of a crawler trap: every fetch of it links to a new URL (?n=1, ?n=2 …)." },
		maxFetches: { type: "int", default: 30, min: 1, max: 40, desc: "Stop after this many fetches (a crawl budget)." },
		code: { type: "enum", values: ["python", "none"], default: "python", desc: "Code beside the demo." }
	},
	example: {
		web: "www.cs.umass.edu/index.html -> www.cs.umass.edu/courses, www.cs.umass.edu/news; www.cs.umass.edu/news -> www.bbc.co.uk/index.html, www.cnn.com/2006/09/story.html; www.bbc.co.uk/index.html -> www.bbc.co.uk/today, www.bbc.co.uk/2005/story.html; www.bbc.co.uk/2005/story.html -> www.whitehouse.gov/index.html; www.whitehouse.gov/index.html -> www.whitehouse.gov/news.html, www.whitehouse.gov/about.html; www.cnn.com/index.html -> www.cnn.com/2006/09/story.html, www.cnn.com/2003/04/story.html",
		seeds: "www.cs.umass.edu/index.html, www.cnn.com/index.html"
	}
};

const URL_RE = /^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(\/[A-Za-z0-9._~\/%?=&+-]*)?$/;

function hostOf(url) { const k = url.indexOf("/"); return k < 0 ? url : url.slice(0, k); }
function splitList(text) { return String(text).split(/[,\s]+/).map(function(s) { return s.trim(); }).filter(Boolean); }

// Parse the graph. Returns { pages: Map url -> [links], order: [urls] } or { error }.
function parseWeb(text) {
	const pages = new Map();
	const order = [];
	function add(u) { if (!pages.has(u)) { pages.set(u, []); order.push(u); } }
	const parts = String(text).split(/[;\n]+/).map(function(s) { return s.trim(); }).filter(Boolean);
	if (!parts.length) return { error: "\"web\" is empty — write \"a.com/x -> a.com/y, b.com/z; …\"" };
	for (const part of parts) {
		const m = /^(\S+)\s*(?:->\s*(.*))?$/.exec(part);
		if (!m) return { error: "\"web\": can't read \"" + part + "\" — write \"host/path -> link, link\"" };
		const from = m[1];
		if (!URL_RE.test(from)) return { error: "\"web\": \"" + from + "\" is not a host/path URL like www.cnn.com/index.html" };
		add(from);
		const links = m[2] ? splitList(m[2]) : [];
		for (const l of links) {
			if (!URL_RE.test(l)) return { error: "\"web\": link \"" + l + "\" is not a host/path URL" };
			add(l);
			pages.get(from).push(l);
		}
	}
	return { pages: pages, order: order };
}

export function validate(config) {
	const errors = checkParams(meta.params, config);
	if (errors.length) return errors;
	const w = parseWeb(config.web);
	if (w.error) return [w.error];
	if (w.order.length > MAX_PAGES) errors.push("\"web\" has " + w.order.length + " pages; at most " + MAX_PAGES);
	const hosts = new Set(w.order.map(hostOf));
	if (hosts.size > MAX_HOSTS) errors.push("\"web\" has " + hosts.size + " hosts; at most " + MAX_HOSTS);
	const seeds = splitList(config.seeds);
	if (!seeds.length) errors.push("\"seeds\" needs at least one URL");
	for (const s of seeds) if (!w.pages.has(s)) errors.push("\"seeds\": \"" + s + "\" is not a page of \"web\"");
	if (config.trap !== undefined && config.trap !== "" && !w.order.some(function(u) { return u.indexOf(config.trap) === 0; })) {
		errors.push("\"trap\": no page of \"web\" starts with \"" + config.trap + "\"");
	}
	for (const d of splitList(config.disallow || "")) {
		if (!/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}\//.test(d)) errors.push("\"disallow\": \"" + d + "\" must look like host/path-prefix, e.g. www.cnn.com/2003/");
	}
	return errors;
}

export const code = {
	python: [
		"def crawler_thread(frontier):",
		"    while not frontier.done():",
		"        website = frontier.next_site()",
		"        url = website.next_url()",
		"        if website.permits_crawl(url):",
		"            text = retrieve_url(url)",
		"            store_document(url, text)",
		"            for link in parse(text):",
		"                frontier.add_url(link)",
		"        frontier.release_site(website)"
	]
};

export function legend(config) {
	const T = tr(config);
	return [
		{ cls: "is-min", label: T("Being fetched", "正在获取") },
		{ cls: "is-cmp", label: T("In the frontier", "在待爬队列中") },
		{ cls: "is-sorted", label: T("Crawled (stored)", "已爬取（已存储）") },
		{ cls: "is-swap", label: T("Blocked by robots.txt", "被 robots.txt 禁止") }
	];
}

export const input = {
	key: "web",
	label: { en: "Link graph", zh: "链接图" },
	format: function(config) { return config.web; },
	parse: function(text) {
		const t = String(text).trim();
		const w = parseWeb(t);
		return w.error ? { error: w.error } : { value: t };
	},
	random: function() {
		const hosts = ["a.com", "b.org", "c.net"];
		const paths = ["/", "/x", "/y", "/z"];
		const all = [];
		hosts.forEach(function(h) { paths.forEach(function(p) { all.push(h + p); }); });
		const parts = [];
		all.forEach(function(u) {
			const links = all.filter(function(v) { return v !== u && Math.random() < 0.18; });
			if (links.length) parts.push(u + " -> " + links.join(", "));
		});
		parts.unshift("a.com/ -> a.com/x, b.org/");
		return parts.join("; ");
	}
};

export function steps(config) {
	const T = tr(config);
	const w = parseWeb(config.web);
	const pages = w.pages;
	const order = w.order.slice();
	const seeds = splitList(config.seeds);
	const blocked = splitList(config.disallow || "");
	const delay = config.politeness || 0;
	const trap = config.trap || "";
	const budget = config.maxFetches || 30;

	const state = new Map(); // url -> "rest" | "frontier" | "crawled" | "blocked"
	order.forEach(function(u) { state.set(u, "rest"); });
	const frontier = [];
	const crawled = [];
	const lastVisit = new Map();
	let clock = 0, fetches = 0, waits = 0, trapN = 0;
	const frames = [];

	function push(f) {
		const hostList = [];
		order.forEach(function(u) { const h = hostOf(u); if (!hostList.includes(h)) hostList.push(h); });
		frames.push({
			hosts: hostList.map(function(h) {
				return { host: h, rest: delay ? Math.max(0, (lastVisit.has(h) ? lastVisit.get(h) + delay : -1) - clock + 1) : 0,
					pages: order.filter(function(u) { return hostOf(u) === h; }).map(function(u) {
						return { url: u, path: u.slice(h.length) || "/", st: state.get(u) };
					}) };
			}),
			frontier: frontier.slice(),
			current: f.current || null,
			added: f.added || [],
			lines: f.lines || [],
			msg: f.msg,
			group: f.group,
			ui: { resting: T("resting ", "休息 "), cap: T("Frontier (FIFO, front →)", "待爬队列（FIFO，队首 →）"), empty: T("empty", "空") },
			vars: [
				[T("clock", "时钟"), T(clock + " tick(s)", clock + " 个 tick")],
				[T("fetched", "已获取"), T(fetches + " / budget " + budget, fetches + " / 预算 " + budget)],
				[T("frontier", "待爬队列"), T(frontier.length + " URL(s)", frontier.length + " 个 URL")],
				[T("politeness", "礼貌性"), delay ? T(delay + " tick(s)/host", delay + " 个 tick/主机") : T("off (FIFO)", "关闭（FIFO）")],
				[T("waits", "等待次数"), String(waits)]
			]
		});
	}

	seeds.forEach(function(s) { if (state.get(s) === "rest") { state.set(s, "frontier"); frontier.push(s); } });
	push({ group: 0, msg: T("Initialize the frontier with the seed URL(s): " + seeds.join(", ") + ". Everything else is still \"the rest of the web\".",
		"用种子 URL 初始化待爬队列（frontier）：" + seeds.join(", ") + "。其余所有页面仍属于“网络的其余部分”。") });

	function permitted(u) { return !blocked.some(function(p) { return u.indexOf(p) === 0; }); }
	function ready(h) { return !delay || !lastVisit.has(h) || clock - lastVisit.get(h) > delay; }

	while (frontier.length && fetches < budget && frames.length < MAX_FRAMES) {
		// frontier.next_site(): first URL whose host may be visited now
		let k = frontier.findIndex(function(u) { return ready(hostOf(u)); });
		if (k < 0) {
			waits++;
			const hs = Array.from(new Set(frontier.map(hostOf)));
			push({ group: fetches, lines: [3], msg: T("Every host in the frontier (" + hs.join(", ") + ") was visited less than " + delay + " tick(s) ago, so `next_site()` waits one tick. The thread idles: politeness costs time.",
				"待爬队列中的每个主机（" + hs.join(", ") + "）距上次访问都不足 " + delay + " 个 tick，所以 `next_site()` 等待一个 tick。线程空闲：礼貌性（politeness）是要花时间的。") });
			clock++;
			continue;
		}
		const url = frontier.splice(k, 1)[0];
		const host = hostOf(url);
		const skipped = k > 0 ? T(" (skipped " + k + " URL(s) whose host is still resting)", "（跳过了 " + k + " 个主机仍在休息的 URL）") : "";
		state.set(url, "frontier");
		push({ group: fetches + 1, current: url, lines: [3, 4], msg: T("`next_site()` / `next_url()` → `" + url + "`" + skipped + ".", "`next_site()` / `next_url()` → `" + url + "`" + skipped + "。") });

		if (!permitted(url)) {
			state.set(url, "blocked");
			push({ group: fetches + 1, current: url, lines: [5, 10], msg: T("`permits_crawl()` is False: robots.txt disallows `" + url + "`. Not fetched; release the site.", "`permits_crawl()` 为 False：robots.txt 禁止 `" + url + "`。不获取；释放该站点。") });
			continue;
		}
		fetches++;
		lastVisit.set(host, clock);
		let links = (pages.get(url) || []).slice();
		if (trap && url.indexOf(trap) === 0) {
			trapN++;
			const base = trap.split("?")[0];
			const next = base + "?n=" + trapN;
			links = links.concat([next]);
			if (!pages.has(next)) {
				if (order.length < MAX_PAGES + 20) { pages.set(next, []); order.push(next); state.set(next, "rest"); }
			}
		}
		state.set(url, "crawled");
		crawled.push(url);
		const added = [];
		const old = [];
		links.forEach(function(l) {
			if (!pages.has(l)) return;
			if (state.get(l) === "rest") { state.set(l, "frontier"); frontier.push(l); added.push(l); }
			else old.push(l);
		});
		push({ group: fetches, current: url, added: added, lines: [6, 7, 8, 9],
			msg: T("Fetch and store `" + url + "`; parse finds " + links.length + " link(s)." +
				(added.length ? " New → frontier: " + added.join(", ") + "." : " Nothing new.") +
				(old.length ? " Already seen (skipped): " + old.join(", ") + "." : "") +
				(trap && url.indexOf(trap) === 0 ? " ⚠️ Trap: this page always links to a URL nobody has seen before." : ""),
				"获取并存储 `" + url + "`；解析发现 " + links.length + " 个链接。" +
				(added.length ? "新的 → 加入待爬队列：" + added.join(", ") + "。" : "没有新链接。") +
				(old.length ? "已见过（跳过）：" + old.join(", ") + "。" : "") +
				(trap && url.indexOf(trap) === 0 ? "⚠️ 陷阱：这个页面总会链接到一个从未见过的 URL。" : "")) });
		clock++;
		push({ group: fetches, lines: [10], msg: T("`release_site(" + host + ")`" + (delay ? ": " + host + " must now rest " + delay + " tick(s)." : "."),
			"`release_site(" + host + ")`" + (delay ? "：" + host + " 现在必须休息 " + delay + " 个 tick。" : "。")) });
	}

	let end, endZh;
	if (!frontier.length) {
		end = "Done: the frontier is empty. Crawled " + crawled.length + " page(s) in " + clock + " tick(s)" + (waits ? ", " + waits + " of them waiting for politeness" : "") + ".";
		endZh = "完成：待爬队列已空。共爬取 " + crawled.length + " 个页面，用了 " + clock + " 个 tick" + (waits ? "，其中 " + waits + " 个 tick 在等待礼貌性" : "") + "。";
	} else {
		end = "Stopped: the budget of " + budget + " fetches is used up, but the frontier still holds " + frontier.length + " URL(s)" + (trap ? " — the trap would keep the crawler busy forever." : ".");
		endZh = "停止：" + budget + " 次获取的预算已用完，但待爬队列中仍有 " + frontier.length + " 个 URL" + (trap ? "——这个陷阱会让爬虫永远忙下去。" : "。");
	}
	const unreached = order.filter(function(u) { return state.get(u) === "rest"; });
	if (unreached.length && !frontier.length) {
		end += " Never reached (no path from the seeds): " + unreached.join(", ") + ".";
		endZh += "从未到达（从种子出发没有路径）：" + unreached.join(", ") + "。";
	}
	push({ group: fetches + 1, lines: [2], msg: T(end, endZh) });
	return frames;
}

const STYLE = `
.vz-cf { display: flex; flex-direction: column; gap: 0.7rem; }
.vz-cf-hosts { display: grid; grid-template-columns: repeat(auto-fill, minmax(11.5rem, 1fr)); gap: 0.55rem; }
.vz-cf-host { border: 1.5px solid var(--vz-border); border-radius: 0.6rem; padding: 0.45rem 0.5rem; background: var(--vz-surface); min-width: 0; }
.vz-cf-hname { font: 600 0.8rem/1.3 "Consolas", "Menlo", monospace; margin-bottom: 0.35rem; display: flex; justify-content: space-between; gap: 0.3rem; overflow-wrap: anywhere; }
.vz-cf-rest { color: var(--vz-min-fg); font-weight: 400; white-space: nowrap; }
.vz-cf-pages { display: flex; flex-wrap: wrap; gap: 0.25rem; }
.vz-cf-page { font: 0.76rem/1.2 "Consolas", "Menlo", monospace; padding: 0.18rem 0.4rem; border: 1px dashed var(--vz-border); border-radius: 0.4rem; color: var(--vz-muted); overflow-wrap: anywhere;
	transition: background-color 0.25s, border-color 0.25s, color 0.25s; }
.vz-cf-page.is-cmp { border: 1.5px solid var(--vz-cmp-bd); background: var(--vz-cmp-bg); color: var(--vz-ink); }
.vz-cf-page.is-sorted { border: 1px solid var(--vz-sorted-bd); background: var(--vz-sorted-bg); color: var(--vz-sorted-fg); }
.vz-cf-page.is-swap { border: 1px dashed var(--vz-swap-bd); background: var(--vz-swap-bg); color: var(--vz-swap-fg); text-decoration: line-through; }
.vz-cf-page.is-min { border: 1.5px solid var(--vz-min-bd); background: var(--vz-min-bg); color: var(--vz-min-fg); font-weight: 600; }
.vz-cf-page.is-new { box-shadow: 0 0 0 2px var(--vz-cmp-bd); }
.vz-cf-q { display: flex; flex-wrap: wrap; align-items: center; gap: 0.25rem; font: 0.76rem/1.2 "Consolas", "Menlo", monospace; }
.vz-cf-qcap { color: var(--vz-muted); font-size: 0.78rem; margin-right: 0.3rem; font-family: inherit; }
.vz-cf-qitem { padding: 0.18rem 0.4rem; border: 1.5px solid var(--vz-cmp-bd); background: var(--vz-cmp-bg); border-radius: 0.4rem; overflow-wrap: anywhere; }
.vz-cf-empty { color: var(--vz-muted); }
`;

function ensureStyle() {
	if (document.getElementById("viz-crawl-frontier-style")) return;
	const s = document.createElement("style");
	s.id = "viz-crawl-frontier-style";
	s.textContent = STYLE;
	document.head.appendChild(s);
}

function esc(t) {
	return String(t).replace(/[&<>"']/g, function(ch) {
		return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
	});
}

export function render(stage, frame) {
	ensureStyle();
	const cls = { rest: "", frontier: "is-cmp", crawled: "is-sorted", blocked: "is-swap" };
	let html = '<div class="vz-cf"><div class="vz-cf-hosts">';
	frame.hosts.forEach(function(h) {
		html += '<div class="vz-cf-host"><div class="vz-cf-hname"><span>' + esc(h.host) + "</span>" +
			(h.rest > 0 ? '<span class="vz-cf-rest">' + frame.ui.resting + h.rest + "</span>" : "") + '</div><div class="vz-cf-pages">';
		h.pages.forEach(function(p) {
			const c = ["vz-cf-page"];
			if (p.url === frame.current) c.push("is-min"); else if (cls[p.st]) c.push(cls[p.st]);
			if (frame.added.includes(p.url)) c.push("is-new");
			html += '<span class="' + c.join(" ") + '" title="' + esc(p.url) + '">' + esc(p.path) + "</span>";
		});
		html += "</div></div>";
	});
	html += '</div><div class="vz-cf-q"><span class="vz-cf-qcap">' + frame.ui.cap + "</span>";
	if (!frame.frontier.length) html += '<span class="vz-cf-empty">' + frame.ui.empty + "</span>";
	frame.frontier.forEach(function(u) { html += '<span class="vz-cf-qitem">' + esc(u) + "</span>"; });
	stage.innerHTML = html + "</div></div>";
}

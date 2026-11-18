import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const USER_AGENT = "Mozilla/5.0 (cfp-tracker canvas; personal use)";
const FETCH_TIMEOUT_MS = 25_000;
const CONFS_TECH_TOPICS = [
    "accessibility", "android", "api", "data", "devops", "dotnet", "general", "golang", "ios", "iot", "java",
    "javascript", "kotlin", "leadership", "networking", "opensource", "php", "product", "python", "security",
    "sre", "tech-comm", "testing", "typescript", "ux",
];
export const STATUSES = ["new", "saved", "submitted", "accepted", "rejected", "dismissed"];

export function dataPaths(root = process.cwd()) {
    return {
        profile: join(root, "cfp-tracker", "profile.json"),
        tracking: join(root, "cfp-tracker", "tracking.json"),
    };
}

async function fetchText(url) {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return response.text();
}

async function fetchJson(url) {
    return JSON.parse(await fetchText(url));
}

function decodeEntities(text) {
    return String(text ?? "")
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
        .replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"')
        .replaceAll("&#039;", "'").replaceAll("&nbsp;", " ").replaceAll("&mdash;", "—").replaceAll("&ndash;", "–");
}

function stripTags(html) {
    return decodeEntities(String(html ?? "").replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function toIsoDate(value) {
    if (value === undefined || value === null || value === "") return null;
    const date = typeof value === "number" ? new Date(value) : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function toIsoDateInZone(value, timeZone) {
    const date = new Date(String(value ?? ""));
    if (!value || Number.isNaN(date.getTime())) return null;
    try {
        return new Intl.DateTimeFormat("en-CA", { timeZone: timeZone || "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
    } catch {
        return date.toISOString().slice(0, 10);
    }
}

function dmyToIso(value) {
    const match = /(\d{1,2})-(\d{1,2})-(\d{4})/.exec(value ?? "");
    return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : null;
}

export function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function record(fields) {
    return {
        name: fields.name?.trim() || "(untitled)",
        cfpUrl: fields.cfpUrl || null,
        eventUrl: fields.eventUrl || null,
        cfpEnd: fields.cfpEnd || null,
        cfpStart: fields.cfpStart || null,
        eventStart: fields.eventStart || null,
        eventEnd: fields.eventEnd || null,
        location: fields.location?.trim() || null,
        description: fields.description?.trim() || "",
        tags: (fields.tags ?? []).filter(Boolean),
        source: fields.source,
        sourceUpdated: fields.sourceUpdated || null,
    };
}

const SOURCES = [
    {
        id: "callingallpapers",
        name: "Calling All Papers",
        homepage: "https://callingallpapers.com/",
        async load() {
            const data = await fetchJson("https://api.callingallpapers.com/v1/cfp");
            return (data.cfps ?? []).map((cfp) => record({
                name: cfp.name, cfpUrl: cfp.uri, eventUrl: cfp.eventUri, cfpStart: toIsoDateInZone(cfp.dateCfpStart, cfp.timezone),
                cfpEnd: toIsoDateInZone(cfp.dateCfpEnd, cfp.timezone), eventStart: toIsoDateInZone(cfp.dateEventStart, cfp.timezone),
                eventEnd: toIsoDateInZone(cfp.dateEventEnd, cfp.timezone),
                location: cfp.location, description: cfp.description, tags: [...(cfp.tags ?? []), ...(cfp.sources ?? []).map((s) => `via ${s}`)],
                source: "callingallpapers", sourceUpdated: toIsoDate(cfp.lastChange),
            }));
        },
    },
    {
        id: "developers-events",
        name: "developers.events",
        homepage: "https://developers.events/",
        async load() {
            const data = await fetchJson("https://developers.events/all-cfps.json");
            return data.map((cfp) => record({
                name: cfp.conf?.name, cfpUrl: cfp.link, eventUrl: cfp.conf?.hyperlink, cfpEnd: toIsoDate(cfp.untilDate),
                eventStart: toIsoDate(cfp.conf?.date?.[0]), eventEnd: toIsoDate(cfp.conf?.date?.[1] ?? cfp.conf?.date?.[0]),
                location: cfp.conf?.location, source: "developers-events",
            }));
        },
    },
    {
        id: "confs-tech",
        name: "confs.tech",
        homepage: "https://confs.tech/",
        async load() {
            const year = new Date().getUTCFullYear();
            const requests = [year, year + 1].flatMap((y) => CONFS_TECH_TOPICS.map((topic) => ({ y, topic })));
            const results = await Promise.allSettled(requests.map(({ y, topic }) =>
                fetchJson(`https://raw.githubusercontent.com/tech-conferences/conference-data/main/conferences/${y}/${topic}.json`)
                    .then((items) => items.map((item) => ({ ...item, topic })))));
            const fulfilled = results.filter((r) => r.status === "fulfilled");
            if (fulfilled.length === 0) throw new Error("No confs.tech topic files could be loaded");
            return fulfilled.flatMap((r) => r.value).filter((conf) => conf.cfpUrl || conf.cfpEndDate).map((conf) => record({
                name: conf.name, cfpUrl: conf.cfpUrl, eventUrl: conf.url, cfpEnd: toIsoDate(conf.cfpEndDate),
                eventStart: toIsoDate(conf.startDate), eventEnd: toIsoDate(conf.endDate),
                location: [conf.city, conf.country].filter(Boolean).join(", ") || (conf.online ? "Online" : null),
                tags: [`topic:${conf.topic}`, conf.online ? "online" : null], source: "confs-tech",
            }));
        },
    },
    {
        id: "adato",
        name: "Leon Adato's CFP tracker",
        homepage: "https://adatosystems.com/cfp-tracker/",
        async load() {
            const html = await fetchText("https://adatosystems.com/cfp-tracker/");
            const body = /<tbody>([\s\S]*?)<\/tbody>/i.exec(html)?.[1] ?? "";
            const rows = [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/gi)].map((m) => [...m[1].matchAll(/<td>([\s\S]*?)<\/td>/gi)].map((c) => c[1]));
            if (rows.length === 0) throw new Error("CFP table not found (page layout may have changed)");
            const href = (cell) => /href="([^"]+)"/i.exec(cell ?? "")?.[1] ?? null;
            return rows.filter((cells) => cells.length >= 8).map((cells) => record({
                name: stripTags(cells[0]), location: [stripTags(cells[1]), stripTags(cells[2])].filter(Boolean).join(", "),
                eventStart: toIsoDate(stripTags(cells[3])), eventEnd: toIsoDate(stripTags(cells[4])), cfpEnd: toIsoDate(stripTags(cells[5])),
                eventUrl: href(cells[6]), cfpUrl: href(cells[7]), source: "adato",
            }));
        },
    },
    {
        id: "cfp-watch",
        name: "CFP Watch",
        homepage: "https://cfp.watch/",
        async load() {
            const html = await fetchText("https://cfp.watch/");
            const cards = [...html.matchAll(/<article class="card">([\s\S]*?)<\/article>/gi)].map((m) => m[1]);
            return cards.map((card) => {
                const rows = [...card.matchAll(/<div class="row"[^>]*>([\s\S]*?)<\/div>/gi)].map((m) => stripTags(m[1].replace(/<svg[\s\S]*?<\/svg>/gi, "")));
                const eventDates = rows[0]?.match(/\d{1,2}-\d{1,2}-\d{4}/g) ?? [];
                const detail = /href="(\/cfps\/[^"?]+)"/i.exec(card)?.[1];
                return record({
                    name: stripTags(/<h3>([\s\S]*?)<\/h3>/i.exec(card)?.[1]), location: stripTags(/<div class="location">([\s\S]*?)<\/div>/i.exec(card)?.[1]),
                    eventStart: dmyToIso(eventDates[0]), eventEnd: dmyToIso(eventDates[1] ?? eventDates[0]), cfpEnd: dmyToIso(rows[1]),
                    cfpUrl: detail ? `https://cfp.watch${detail}` : null, source: "cfp-watch",
                    sourceUpdated: dmyToIso(rows.find((row) => row.startsWith("Last update"))),
                });
            });
        },
    },
];

export const SOURCE_INFO = SOURCES.map(({ id, name, homepage }) => ({ id, name, homepage }));

function normalizeUrl(url) {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return `${parsed.hostname.replace(/^www\./, "")}${parsed.pathname.replace(/\/+$/, "")}`.toLowerCase();
    } catch {
        return null;
    }
}

function normalizeName(name) {
    return name.toLowerCase().replace(/\b(19|20)\d{2}\b/g, "").replace(/[^a-z0-9]+/g, "");
}

function dedupeKey(item) {
    const year = (item.eventStart ?? item.cfpEnd ?? "").slice(0, 4);
    return `${normalizeName(item.name)}|${year}`;
}

function mergeRecords(items) {
    const byKey = new Map();
    const urlIndex = new Map();
    for (const item of items) {
        const urlKey = item.cfpUrl && !item.cfpUrl.includes("cfp.watch") ? normalizeUrl(item.cfpUrl) : null;
        const nameKey = dedupeKey(item);
        const key = (urlKey && urlIndex.get(urlKey)) ?? (byKey.has(nameKey) ? nameKey : null) ?? nameKey;
        const existing = byKey.get(key);
        if (urlKey) urlIndex.set(urlKey, key);
        if (!existing) {
            byKey.set(key, { ...item, sources: [item.source], deadlines: item.cfpEnd ? { [item.source]: item.cfpEnd } : {} });
            continue;
        }
        existing.sources = [...new Set([...existing.sources, item.source])];
        if (item.cfpEnd) existing.deadlines[item.source] = item.cfpEnd;
        for (const field of ["cfpStart", "eventStart", "eventEnd", "location", "eventUrl", "description", "sourceUpdated"]) {
            if (!existing[field] && item[field]) existing[field] = item[field];
        }
        // Prefer a direct submission link over an aggregator detail page.
        if (item.cfpUrl && (!existing.cfpUrl || existing.cfpUrl.includes("cfp.watch"))) existing.cfpUrl = item.cfpUrl;
        existing.tags = [...new Set([...existing.tags, ...item.tags])];
    }
    return [...byKey.entries()].map(([key, item]) => {
        const deadlines = [...new Set(Object.values(item.deadlines))].sort();
        const spreadDays = deadlines.length > 1 ? (Date.parse(deadlines.at(-1)) - Date.parse(deadlines[0])) / 86_400_000 : 0;
        return {
            ...item,
            id: createHash("sha1").update(key).digest("hex").slice(0, 12),
            // Earliest reported deadline is the safe one to plan around.
            cfpEnd: deadlines[0] ?? item.cfpEnd,
            deadlineConflict: spreadDays > 1,
        };
    });
}

function keywordRegex(keyword) {
    const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
}

export function scoreItem(item, profile) {
    const haystack = [item.name, item.description, item.cfpUrl, item.eventUrl, ...item.tags].filter(Boolean).join(" ").toLowerCase();
    const reasons = [];
    let score = 0;
    for (const interest of profile.interests ?? []) {
        const hits = interest.keywords.filter((keyword) => keywordRegex(keyword).test(haystack));
        if (hits.length) {
            score += interest.weight;
            reasons.push(`${interest.name}: ${hits.slice(0, 3).join(", ")}`);
        }
    }
    const topics = item.tags.filter((tag) => tag.startsWith("topic:")).map((tag) => tag.slice(6));
    const preferredTopics = topics.filter((topic) => (profile.preferredTopics ?? []).includes(topic));
    if (preferredTopics.length) {
        score += profile.topicWeight ?? 20;
        reasons.push(`confs.tech topic: ${preferredTopics.join(", ")}`);
    }
    const location = (item.location ?? "").toLowerCase();
    if ((profile.preferredLocations ?? []).some((place) => location.includes(place.toLowerCase()))) {
        score += profile.locationBonus ?? 0;
        reasons.push(`Location: ${item.location}`);
    }
    const excluded = (profile.excludeKeywords ?? []).filter((keyword) => keywordRegex(keyword).test(haystack));
    if (excluded.length) {
        score = 0;
        reasons.length = 0;
        reasons.push(`Excluded: ${excluded.join(", ")}`);
    }
    const fit = score >= 40 ? "strong" : score >= 20 ? "good" : score > 0 ? "possible" : "other";
    return { score, fit, reasons };
}

export async function loadProfile(root) {
    return JSON.parse(await readFile(dataPaths(root).profile, "utf8"));
}

export async function loadTracking(root) {
    try {
        const tracking = JSON.parse(await readFile(dataPaths(root).tracking, "utf8"));
        return { statuses: tracking.statuses ?? {}, manual: tracking.manual ?? [] };
    } catch (error) {
        if (error.code === "ENOENT") return { statuses: {}, manual: [] };
        throw error;
    }
}

export async function saveTracking(tracking, root) {
    await writeFile(dataPaths(root).tracking, `${JSON.stringify(tracking, null, 2)}\n`, "utf8");
}

export async function fetchAllSources() {
    const fetchedAt = new Date().toISOString();
    const results = await Promise.allSettled(SOURCES.map((source) => source.load()));
    const sourceStatus = SOURCES.map((source, index) => {
        const result = results[index];
        return {
            id: source.id, name: source.name, homepage: source.homepage, fetchedAt,
            ok: result.status === "fulfilled",
            count: result.status === "fulfilled" ? result.value.length : 0,
            error: result.status === "rejected" ? String(result.reason?.message ?? result.reason) : null,
        };
    });
    const records = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
    return { fetchedAt, sourceStatus, records };
}

export function buildListing(snapshot, profile, tracking, today = todayIso()) {
    const manual = tracking.manual.map((entry) => record({ ...entry, source: "manual", tags: entry.tags ?? [] }));
    const merged = mergeRecords([...snapshot.records, ...manual]);
    const items = merged
        .filter((item) => !item.cfpEnd || item.cfpEnd >= today || tracking.statuses[item.id])
        .map((item) => {
            const tracked = tracking.statuses[item.id] ?? {};
            const daysLeft = item.cfpEnd ? Math.round((Date.parse(item.cfpEnd) - Date.parse(today)) / 86_400_000) : null;
            return {
                ...item, ...scoreItem(item, profile), daysLeft,
                closed: daysLeft !== null && daysLeft < 0,
                status: tracked.status ?? "new", note: tracked.note ?? "",
                verification: item.sources.length > 1 ? "corroborated" : item.cfpEnd ? "single-source" : "no-deadline",
            };
        })
        .sort((a, b) => (a.cfpEnd ?? "9999").localeCompare(b.cfpEnd ?? "9999") || b.score - a.score);
    return { fetchedAt: snapshot.fetchedAt, today, sources: snapshot.sourceStatus, items };
}

export function manualEntryFrom(input) {
    const name = String(input?.name ?? "").trim();
    if (!name) throw new Error("A name is required");
    const cfpUrl = String(input?.cfpUrl ?? "").trim();
    if (cfpUrl && !/^https?:\/\//i.test(cfpUrl)) throw new Error("cfpUrl must be an http(s) URL");
    const date = (value) => {
        const text = String(value ?? "").trim();
        if (text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`Dates must use YYYY-MM-DD: ${text}`);
        return text || null;
    };
    return {
        name, cfpUrl: cfpUrl || null, eventUrl: String(input?.eventUrl ?? "").trim() || null,
        cfpEnd: date(input?.cfpEnd), eventStart: date(input?.eventStart), eventEnd: date(input?.eventEnd),
        location: String(input?.location ?? "").trim() || null, description: String(input?.description ?? "").trim(),
        addedAt: todayIso(),
    };
}

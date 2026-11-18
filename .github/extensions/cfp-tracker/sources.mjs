import { createHash, randomUUID } from "node:crypto";
import { readFile, rename, unlink, writeFile } from "node:fs/promises";
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

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

function monthNumber(name) {
    const text = String(name ?? "").toLowerCase();
    const index = text.length >= 3 ? MONTHS.findIndex((month) => month.startsWith(text.slice(0, 3))) : -1;
    return index < 0 ? null : String(index + 1).padStart(2, "0");
}

// "28 October 2026" -> "2026-10-28"
function parseDayMonthYear(value) {
    const match = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/i.exec(value ?? "");
    const month = match && monthNumber(match[2]);
    return month ? `${match[3]}-${month}-${match[1].padStart(2, "0")}` : null;
}

// "21-26 January 2027", "31 March - 1 April 2027", "19 February 2027"
function parseDateRange(value) {
    const text = String(value ?? "");
    const year = /(\d{4})\s*$/.exec(text)?.[1];
    if (!year) return [null, null];
    const tokens = text.slice(0, text.lastIndexOf(year)).match(/\d{1,2}|[a-z]+/gi) ?? [];
    const dates = [];
    let pendingDays = [];
    for (const token of tokens) {
        if (/^\d+$/.test(token)) pendingDays.push(token.padStart(2, "0"));
        else if (monthNumber(token) && pendingDays.length) {
            dates.push(...pendingDays.map((day) => `${year}-${monthNumber(token)}-${day}`));
            pendingDays = [];
        }
    }
    return dates.length ? [dates[0], dates.at(-1)] : [null, null];
}

// Converts a UTC instant to the calendar date in a "(UTC+05:30)"-style zone label.
function utcToLocalDate(value, zoneLabel) {
    const instant = Date.parse(value ?? "");
    if (Number.isNaN(instant)) return null;
    const match = /UTC([+-])(\d{2}):(\d{2})/.exec(zoneLabel ?? "");
    const offsetMs = match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3])) * 60_000 : 0;
    return new Date(instant + offsetMs).toISOString().slice(0, 10);
}

function perkTags(perks) {
    if (!perks || typeof perks !== "object") return [];
    return Object.entries(perks).filter(([, value]) => value === true || (typeof value === "string" && value))
        .map(([key, value]) => (value === true ? key : `${key}: ${value}`).replaceAll("_", " "));
}

// Minimal parser for a top-level YAML list of flat "key: value" maps; nested structures are ignored.
function parseYamlList(text) {
    const items = [];
    let current = null;
    for (const line of String(text).split(/\r?\n/)) {
        const start = /^- (\w+):\s*(.*)$/.exec(line);
        const field = /^  (\w+):\s*(.*)$/.exec(line);
        const match = start ?? field;
        if (start) items.push((current = {}));
        if (!match || !current) continue;
        const raw = match[2].trim();
        current[match[1]] = raw === "" ? null : raw.replace(/^(['"])(.*)\1$/, "$2");
    }
    return items;
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
        languages: [...new Set((fields.languages ?? []).filter(Boolean).map((language) => String(language).trim().toLowerCase()))],
        source: fields.source,
        sourceUpdated: fields.sourceUpdated || null,
    };
}

const SOURCES = [
    {
        id: "open-tech-cfps",
        name: "Open Tech CFPs (CC BY 4.0)",
        homepage: "https://github.com/1kevgriff/OpenTechCFPs",
        async load() {
            const data = await fetchJson("https://1kevgriff.github.io/OpenTechCFPs/api/open.json");
            return (data.cfps ?? []).map((cfp) => record({
                name: cfp.name, cfpUrl: cfp.url, eventUrl: cfp.website, cfpStart: toIsoDate(cfp.cfp_open),
                cfpEnd: utcToLocalDate(cfp.cfp_close_utc, cfp.cfp_timezone), eventStart: toIsoDate(cfp.event_start),
                eventEnd: toIsoDate(cfp.event_end ?? cfp.event_start),
                location: cfp.online && !/online|virtual|remote/i.test(cfp.location ?? "") ? ["Online", cfp.location].filter(Boolean).join(" / ") : cfp.location, description: cfp.summary,
                tags: [...(cfp.tags ?? []).map((tag) => `category:${tag}`), cfp.online ? "online" : null, ...perkTags(cfp.perks), cfp.source ? `via ${cfp.source}` : null],
                source: "open-tech-cfps", sourceUpdated: toIsoDate(cfp.updated),
            }));
        },
    },
    {
        id: "cfp-ninja",
        name: "cfp.ninja",
        homepage: "https://cfp.ninja/",
        async load() {
            const events = [];
            for (let page = 1, pages = 1; page <= pages && page <= 20; page++) {
                const data = await fetchJson(`https://cfp.ninja/api/v0/events?per_page=100&page=${page}`);
                events.push(...(data.data ?? []));
                pages = data.pagination?.total_pages ?? 1;
            }
            return events.filter((event) => event.cfp_close_at && event.cfp_status !== "closed").map((event) => record({
                name: event.name, cfpUrl: event.slug ? `https://cfp.ninja/e/${event.slug}` : null, eventUrl: event.website,
                cfpStart: toIsoDate(event.cfp_open_at), cfpEnd: toIsoDateInZone(event.cfp_close_at, event.timezone),
                eventStart: toIsoDate(event.start_date), eventEnd: toIsoDate(event.end_date ?? event.start_date),
                location: [event.location, event.country].filter(Boolean).join(", ") || (event.is_online ? "Online" : null),
                description: event.description?.slice(0, 600),
                tags: [...String(event.tags ?? "").split(",").map((tag) => tag.trim()), event.is_online ? "online" : null,
                    event.travel_covered ? "travel covered" : null, event.hotel_covered ? "hotel covered" : null,
                    event.honorarium_provided ? "honorarium" : null, event.cfp_requires_payment ? "submission fee" : null],
                source: "cfp-ninja", sourceUpdated: toIsoDate(event.UpdatedAt),
            }));
        },
    },
    {
        id: "javaconferences",
        name: "JavaConferences",
        homepage: "https://javaconferences.org/",
        async load() {
            const data = await fetchJson("https://javaconferences.org/conferences.json");
            return data.filter((conf) => conf.cfpLink || conf.cfpEndDate).map((conf) => {
                const [eventStart, eventEnd] = parseDateRange(conf.date);
                return record({
                    name: conf.name, cfpUrl: conf.cfpLink, eventUrl: conf.link, cfpEnd: parseDayMonthYear(conf.cfpEndDate),
                    eventStart, eventEnd, location: conf.locationName, tags: ["java", conf.hybrid ? "hybrid" : null],
                    source: "javaconferences",
                });
            });
        },
    },
    {
        id: "python-deadlines",
        name: "PythonDeadlin.es",
        homepage: "https://pythondeadlin.es/",
        async load() {
            const yaml = await fetchText("https://raw.githubusercontent.com/jesperdramsch/python-deadlines/main/_data/conferences.yml");
            return parseYamlList(yaml).filter((conf) => conf.cfp_link || conf.cfp).map((conf) => {
                const deadline = /^\d{4}-\d{2}-\d{2}/.test(conf.cfp_ext ?? "") ? conf.cfp_ext : conf.cfp;
                return record({
                    name: [conf.conference, conf.year].filter(Boolean).join(" "), cfpUrl: conf.cfp_link, eventUrl: conf.link,
                    cfpEnd: /^\d{4}-\d{2}-\d{2}/.test(deadline ?? "") ? deadline.slice(0, 10) : null,
                    eventStart: toIsoDate(conf.start), eventEnd: toIsoDate(conf.end ?? conf.start), location: conf.place,
                    tags: ["python", ...String(conf.sub ?? "").split(",").map((sub) => sub.trim().toLowerCase())],
                    source: "python-deadlines",
                });
            });
        },
    },
    {
        id: "developers-events",
        name: "developers.events",
        homepage: "https://developers.events/",
        async load() {
            // all-events.json carries the same CFP data as all-cfps.json plus language tags.
            const data = await fetchJson("https://developers.events/all-events.json");
            return data.filter((event) => event.cfp?.link || event.cfp?.untilDate).map((event) => record({
                name: event.name, cfpUrl: event.cfp.link, eventUrl: event.hyperlink, cfpEnd: toIsoDate(event.cfp.untilDate),
                eventStart: toIsoDate(event.date?.[0]), eventEnd: toIsoDate(event.date?.[1] ?? event.date?.[0]),
                location: event.location, source: "developers-events",
                languages: (event.tags ?? []).filter((tag) => tag.key === "language").map((tag) => tag.value),
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

function editionYear(item) {
    return item.identityYear || item.eventStart?.slice(0, 4) || null;
}

function aliasFor(item) {
    return { name: normalizeName(item.name), url: normalizeUrl(item.cfpUrl) };
}

function aliasesMatch(a, b) {
    return Boolean((a.url && a.url === b.url) || (a.name && a.name === b.name));
}

function compatibleYears(a, b) {
    return !a || !b || a === b;
}

function hashKey(key) {
    return createHash("sha1").update(key).digest("hex").slice(0, 12);
}

function mergeRecords(items) {
    const groups = [];
    // Resolve dated editions first so an undated record cannot silently select one of several editions.
    const ordered = [...items.filter((item) => editionYear(item)), ...items.filter((item) => !editionYear(item))];
    for (const item of ordered) {
        const alias = aliasFor(item);
        const year = editionYear(item);
        const candidates = groups.filter((group) => compatibleYears(year, group.year) && group.aliases.some((other) => aliasesMatch(alias, other)));
        const urlMatches = alias.url ? candidates.filter((group) => group.aliases.some((other) => other.url === alias.url)) : [];
        const matches = urlMatches.length ? urlMatches : candidates;
        const existing = matches.length === 1 ? matches[0] : null;
        if (!existing) {
            groups.push({
                ...item, key: dedupeKey(item), year, aliases: [alias], legacyIds: [hashKey(dedupeKey(item))],
                sources: [item.source], deadlines: item.cfpEnd ? { [item.source]: item.cfpEnd } : {},
            });
            continue;
        }
        existing.aliases.push(alias);
        existing.legacyIds.push(hashKey(dedupeKey(item)));
        existing.sources = [...new Set([...existing.sources, item.source])];
        if (item.cfpEnd) existing.deadlines[item.source] = item.cfpEnd;
        for (const field of ["cfpStart", "eventStart", "eventEnd", "location", "eventUrl", "description", "sourceUpdated"]) {
            if (!existing[field] && item[field]) existing[field] = item[field];
        }
        // Prefer a direct submission link over an aggregator detail page.
        if (item.cfpUrl && (!existing.cfpUrl || existing.cfpUrl.includes("cfp.watch"))) existing.cfpUrl = item.cfpUrl;
        existing.tags = [...new Set([...existing.tags, ...item.tags])];
        existing.languages = [...new Set([...existing.languages, ...item.languages])];
    }
    const usedIds = new Set();
    return groups.map(({ key, year, legacyIds, ...item }) => {
        const deadlines = [...new Set(Object.values(item.deadlines))].sort();
        let id = hashKey(key);
        if (usedIds.has(id)) id = hashKey(`${key}|${year ?? "unknown"}|${usedIds.size}`);
        usedIds.add(id);
        return {
            ...item,
            id, legacyIds: [...new Set(legacyIds)],
            aliases: [...new Map(item.aliases.map((alias) => [JSON.stringify(alias), alias])).values()],
            // Earliest reported deadline is the safe one to plan around.
            cfpEnd: deadlines[0] ?? item.cfpEnd,
            deadlineConflict: deadlines.length > 1,
        };
    });
}

function keywordRegex(keyword) {
    const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i");
}

export function scoreItem(item, profile) {
    const isCategory = (tag) => tag.startsWith("category:");
    const haystack = [item.name, item.description, item.cfpUrl, item.eventUrl, ...item.tags.filter((tag) => !isCategory(tag))].filter(Boolean).join(" ").toLowerCase();
    // Aggregator-inferred categories (e.g. Sessionize's broad "ai"/"cloud") are a weaker signal than the event's own text.
    const categories = item.tags.filter(isCategory).map((tag) => tag.slice(9).replaceAll("-", " ")).join(" ; ");
    const reasons = [];
    let score = 0;
    for (const interest of profile.interests ?? []) {
        const hits = interest.keywords.filter((keyword) => keywordRegex(keyword).test(haystack));
        const categoryHits = hits.length ? [] : interest.keywords.filter((keyword) => keywordRegex(keyword).test(categories));
        if (hits.length) {
            score += interest.weight;
            reasons.push(`${interest.name}: ${hits.slice(0, 3).join(", ")}`);
        } else if (categoryHits.length) {
            score += Math.round(interest.weight / 2);
            reasons.push(`${interest.name} (category): ${categoryHits.slice(0, 3).join(", ")}`);
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
    const path = dataPaths(root).tracking;
    const temp = `${path}.${randomUUID()}.tmp`;
    try {
        await writeFile(temp, `${JSON.stringify(tracking, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
        await rename(temp, path);
    } finally {
        await unlink(temp).catch((error) => { if (error.code !== "ENOENT") throw error; });
    }
}

const trackingUpdates = new Map();

export async function updateTracking(root, update) {
    const path = dataPaths(root).tracking;
    const previous = trackingUpdates.get(path) ?? Promise.resolve();
    const operation = previous.catch(() => {}).then(async () => {
        const tracking = await loadTracking(root);
        const before = JSON.stringify(tracking);
        const result = await update(tracking);
        const changed = JSON.stringify(tracking) !== before;
        if (changed) await saveTracking(tracking, root);
        return { result, changed };
    });
    trackingUpdates.set(path, operation);
    try {
        return await operation;
    } finally {
        if (trackingUpdates.get(path) === operation) trackingUpdates.delete(path);
    }
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
    const trackedEntries = Object.entries(tracking.statuses);
    const matches = trackedEntries.map(([id, tracked]) => {
        const event = tracked.event;
        const candidates = event
            ? merged.filter((item) => compatibleYears(editionYear(event), editionYear(item))
                && (event.aliases ?? [aliasFor(event)]).some((alias) => item.aliases.some((other) => aliasesMatch(alias, other))))
            : merged.filter((item) => item.id === id || item.legacyIds.includes(id));
        return { id, tracked, candidates };
    });
    const assigned = new Set();
    const assignedItems = new Set();
    for (const match of matches) {
        if (match.candidates.length !== 1) continue;
        const item = match.candidates[0];
        if (matches.filter((other) => other.candidates.includes(item)).length !== 1) continue;
        item.id = match.id;
        item.identityYear = editionYear(match.tracked.event ?? {}) ?? editionYear(item);
        item.aliases = [...new Map([...(match.tracked.event?.aliases ?? []), ...item.aliases].map((alias) => [JSON.stringify(alias), alias])).values()];
        assigned.add(match.id);
        assignedItems.add(item);
    }
    const reservedIds = new Set(trackedEntries.map(([id]) => id));
    const usedIds = new Set(reservedIds);
    for (const [index, item] of merged.entries()) {
        if (assignedItems.has(item)) continue;
        if (usedIds.has(item.id)) item.id = hashKey(`${item.id}|untracked|${index}`);
        usedIds.add(item.id);
    }
    for (const [id, tracked] of trackedEntries) {
        if (!assigned.has(id) && tracked.event) merged.push({ ...tracked.event, id, retained: true });
    }
    const spoken = (profile.languages ?? ["english"]).map((language) => language.toLowerCase());
    const items = merged
        .filter((item) => !item.cfpEnd || Object.values(item.deadlines).some((deadline) => deadline >= today) || tracking.statuses[item.id])
        .map((item) => {
            const tracked = tracking.statuses[item.id] ?? {};
            const daysLeft = item.cfpEnd ? Math.round((Date.parse(item.cfpEnd) - Date.parse(today)) / 86_400_000) : null;
            return {
                ...item, ...scoreItem(item, profile), daysLeft,
                closed: daysLeft !== null && daysLeft < 0 && !Object.values(item.deadlines).some((deadline) => deadline >= today),
                // Only a known language list with none of the speaker's languages counts as a mismatch; unknown stays visible.
                languageMismatch: item.languages.length > 0 && !item.languages.some((language) => spoken.includes(language)),
                status: tracked.status ?? "new", note: tracked.note ?? "",
                verification: item.sources.length > 1 ? "corroborated" : item.cfpEnd ? "single-source" : "no-deadline",
            };
        })
        .sort((a, b) => (a.cfpEnd ?? "9999").localeCompare(b.cfpEnd ?? "9999") || b.score - a.score);
    return { fetchedAt: snapshot.fetchedAt, today, sources: snapshot.sourceStatus, items };
}

export function trackingEvent(item) {
    const fields = ["name", "cfpUrl", "eventUrl", "cfpEnd", "cfpStart", "eventStart", "eventEnd", "location",
        "description", "tags", "languages", "source", "sourceUpdated", "sources", "deadlines", "deadlineConflict", "aliases", "identityYear"];
    const saved = Object.fromEntries(fields.filter((field) => item[field] !== undefined).map((field) => [field, item[field]]));
    saved.identityYear = editionYear(item);
    return saved;
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

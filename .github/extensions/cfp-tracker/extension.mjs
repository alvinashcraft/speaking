import { fileURLToPath } from "node:url";
import { createCanvas, joinSession } from "@github/copilot-sdk/extension";
import {
    STATUSES, buildListing, fetchAllSources, loadProfile, manualEntryFrom, trackingEvent, updateTracking,
} from "./sources.mjs";
import { startServer } from "./server.mjs";

const SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000;
const PAGE_PATH = fileURLToPath(new URL("./index.html", import.meta.url));
const servers = new Map();
let snapshot = null;
let inflight = null;
let version = 0;

async function getSnapshot(force = false) {
    if (!force && snapshot && Date.now() - Date.parse(snapshot.fetchedAt) < SNAPSHOT_TTL_MS) return snapshot;
    inflight ??= fetchAllSources().then((result) => {
        snapshot = result;
        version++;
        return result;
    }).finally(() => { inflight = null; });
    return inflight;
}

async function getListing({ force = false } = {}) {
    const [snap, profile] = await Promise.all([getSnapshot(force), loadProfile()]);
    const { result, changed } = await updateTracking(undefined, (tracking) => {
        const listing = buildListing(snap, profile, tracking);
        for (const item of listing.items) {
            if (tracking.statuses[item.id] && !item.retained) tracking.statuses[item.id].event = trackingEvent(item);
        }
        return listing;
    });
    if (changed) version++;
    return { ...result, version };
}

async function setStatus({ id, status, note }) {
    if (!id || typeof id !== "string") throw new Error("id is required");
    if (!STATUSES.includes(status)) throw new Error(`status must be one of: ${STATUSES.join(", ")}`);
    const [snap, profile] = await Promise.all([getSnapshot(), loadProfile()]);
    const { result } = await updateTracking(undefined, (tracking) => {
        const item = buildListing(snap, profile, tracking).items.find((entry) => entry.id === id);
        if (!item) throw new Error("CFP not found; refresh the listing and try again");
        if (status === "new" && !note) delete tracking.statuses[id];
        else tracking.statuses[id] = {
            status, note: String(note ?? tracking.statuses[id]?.note ?? ""), updated: new Date().toISOString().slice(0, 10),
            event: trackingEvent(item),
        };
        return tracking.statuses[id] ?? { status: "new" };
    });
    version++;
    return result;
}

async function addManual(input) {
    const entry = manualEntryFrom(input);
    await updateTracking(undefined, (tracking) => { tracking.manual.push(entry); });
    version++;
    return entry;
}

function filterItems(items, input = {}) {
    const query = String(input.query ?? "").toLowerCase();
    const fits = { strong: ["strong"], good: ["strong", "good"], possible: ["strong", "good", "possible"] }[input.minFit] ?? null;
    return items
        .filter((item) => !fits || fits.includes(item.fit))
        .filter((item) => !input.status || item.status === input.status)
        .filter((item) => input.status === "dismissed" || item.status !== "dismissed")
        .filter((item) => input.withinDays === undefined || (item.daysLeft !== null && item.daysLeft <= input.withinDays))
        .filter((item) => input.includeOtherLanguages || !item.languageMismatch || item.status !== "new")
        .filter((item) => !query || `${item.name} ${item.location ?? ""}`.toLowerCase().includes(query))
        .slice(0, input.limit ?? 50)
        .map(({ id, name, cfpUrl, eventUrl, cfpEnd, daysLeft, eventStart, eventEnd, location, languages, fit, score, reasons, sources, deadlines, deadlineConflict, retained, status, note }) =>
            ({ id, name, cfpUrl, eventUrl, cfpEnd, daysLeft, eventStart, eventEnd, location, languages, fit, score, reasons, sources, deadlines, deadlineConflict, retained, status, note }));
}

const filterSchema = {
    type: "object",
    properties: {
        minFit: { type: "string", enum: ["strong", "good", "possible"], description: "Minimum interest fit to include." },
        status: { type: "string", enum: STATUSES, description: "Only include CFPs with this tracking status." },
        withinDays: { type: "number", description: "Only include CFPs closing within this many days." },
        query: { type: "string", description: "Case-insensitive text filter on name and location." },
        includeOtherLanguages: { type: "boolean", description: "Include CFPs whose known languages exclude the profile's languages (hidden by default). CFPs with unknown language are always included." },
        limit: { type: "number", description: "Maximum results (default 50)." },
    },
};

await joinSession({ canvases: [createCanvas({
    id: "cfp-tracker",
    displayName: "CFP tracker",
    description: "Tracks open calls for speakers from Open Tech CFPs (Sessionize), developers.events, cfp.ninja, confs.tech, JavaConferences, PythonDeadlin.es, Leon Adato's tracker, and CFP Watch, ranked against the speaking interest profile.",
    inputSchema: { type: "object", properties: {} },
    actions: [
        {
            name: "list_cfps",
            description: "Returns open CFPs (sorted by closing date) with fit score, reasons, sources, and tracking status.",
            inputSchema: filterSchema,
            handler: async (ctx) => {
                const listing = await getListing();
                return { fetchedAt: listing.fetchedAt, sources: listing.sources, items: filterItems(listing.items, ctx.input ?? {}) };
            },
        },
        {
            name: "refresh_sources",
            description: "Re-fetches every CFP source and reports per-source success, counts, and errors.",
            inputSchema: { type: "object", properties: {} },
            handler: async () => {
                const listing = await getListing({ force: true });
                return { fetchedAt: listing.fetchedAt, sources: listing.sources, openCount: listing.items.length };
            },
        },
        {
            name: "set_cfp_status",
            description: "Sets the tracking status (and optional note) for a CFP by id. Persisted to cfp-tracker/tracking.json.",
            inputSchema: {
                type: "object",
                required: ["id", "status"],
                properties: { id: { type: "string" }, status: { type: "string", enum: STATUSES }, note: { type: "string" } },
            },
            handler: async (ctx) => setStatus(ctx.input ?? {}),
        },
        {
            name: "add_cfp",
            description: "Adds a CFP manually (for example one found on Sessionize's logged-in discover page). Dates use YYYY-MM-DD.",
            inputSchema: {
                type: "object",
                required: ["name"],
                properties: {
                    name: { type: "string" }, cfpUrl: { type: "string" }, eventUrl: { type: "string" }, cfpEnd: { type: "string" },
                    eventStart: { type: "string" }, eventEnd: { type: "string" }, location: { type: "string" }, description: { type: "string" },
                },
            },
            handler: async (ctx) => addManual(ctx.input ?? {}),
        },
    ],
    open: async (ctx) => {
        let entry = servers.get(ctx.instanceId);
        if (!entry) {
            entry = await startServer(PAGE_PATH, { listing: getListing, setStatus, addManual, version: () => version });
            servers.set(ctx.instanceId, entry);
        }
        getSnapshot().catch(() => {});
        return { title: "CFP tracker", url: entry.url };
    },
    onClose: async (ctx) => {
        const entry = servers.get(ctx.instanceId);
        if (entry) {
            servers.delete(ctx.instanceId);
            await new Promise((resolve) => entry.server.close(resolve));
        }
    },
})] });

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createCanvas, joinSession } from "@github/copilot-sdk/extension";
import {
    STATUSES, buildListing, fetchAllSources, loadProfile, loadTracking, manualEntryFrom, saveTracking,
} from "./sources.mjs";

const SNAPSHOT_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 64 * 1024;
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
    const [snap, profile, tracking] = await Promise.all([getSnapshot(force), loadProfile(), loadTracking()]);
    return { ...buildListing(snap, profile, tracking), version };
}

async function setStatus({ id, status, note }) {
    if (!id || typeof id !== "string") throw new Error("id is required");
    if (!STATUSES.includes(status)) throw new Error(`status must be one of: ${STATUSES.join(", ")}`);
    const tracking = await loadTracking();
    if (status === "new" && !note) delete tracking.statuses[id];
    else tracking.statuses[id] = { status, note: String(note ?? tracking.statuses[id]?.note ?? ""), updated: new Date().toISOString().slice(0, 10) };
    await saveTracking(tracking);
    version++;
    return tracking.statuses[id] ?? { status: "new" };
}

async function addManual(input) {
    const entry = manualEntryFrom(input);
    const tracking = await loadTracking();
    tracking.manual.push(entry);
    await saveTracking(tracking);
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
        .filter((item) => !query || `${item.name} ${item.location ?? ""}`.toLowerCase().includes(query))
        .slice(0, input.limit ?? 50)
        .map(({ id, name, cfpUrl, eventUrl, cfpEnd, daysLeft, eventStart, eventEnd, location, fit, score, reasons, sources, deadlineConflict, status, note }) =>
            ({ id, name, cfpUrl, eventUrl, cfpEnd, daysLeft, eventStart, eventEnd, location, fit, score, reasons, sources, deadlineConflict, status, note }));
}

async function readBody(request) {
    let size = 0;
    const chunks = [];
    for await (const chunk of request) {
        size += chunk.length;
        if (size > MAX_BODY_BYTES) throw new Error("Request body too large");
        chunks.push(chunk);
    }
    return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

function sendJson(response, status, value) {
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(value));
}

async function handle(request, response) {
    const { pathname } = new URL(request.url, "http://localhost");
    try {
        if (request.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(await readFile(PAGE_PATH, "utf8"));
        } else if (request.method === "GET" && pathname === "/api/version") {
            sendJson(response, 200, { version });
        } else if (request.method === "GET" && pathname === "/api/listing") {
            sendJson(response, 200, await getListing());
        } else if (request.method === "POST" && pathname === "/api/refresh") {
            sendJson(response, 200, await getListing({ force: true }));
        } else if (request.method === "POST" && pathname === "/api/status") {
            sendJson(response, 200, await setStatus(await readBody(request)));
        } else if (request.method === "POST" && pathname === "/api/manual") {
            sendJson(response, 200, await addManual(await readBody(request)));
        } else {
            sendJson(response, 404, { error: "Not found" });
        }
    } catch (error) {
        sendJson(response, 400, { error: String(error?.message ?? error) });
    }
}

async function startServer() {
    const server = createServer((request, response) => { handle(request, response); });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    return { server, url: `http://127.0.0.1:${typeof address === "object" && address ? address.port : 0}/` };
}

const filterSchema = {
    type: "object",
    properties: {
        minFit: { type: "string", enum: ["strong", "good", "possible"], description: "Minimum interest fit to include." },
        status: { type: "string", enum: STATUSES, description: "Only include CFPs with this tracking status." },
        withinDays: { type: "number", description: "Only include CFPs closing within this many days." },
        query: { type: "string", description: "Case-insensitive text filter on name and location." },
        limit: { type: "number", description: "Maximum results (default 50)." },
    },
};

await joinSession({ canvases: [createCanvas({
    id: "cfp-tracker",
    displayName: "CFP tracker",
    description: "Tracks open calls for speakers from Calling All Papers, developers.events, confs.tech, Leon Adato's tracker, and CFP Watch, ranked against the speaking interest profile.",
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
            entry = await startServer();
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

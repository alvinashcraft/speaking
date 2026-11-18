import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildListing, loadTracking, trackingEvent, updateTracking } from "./sources.mjs";
import { startServer } from "./server.mjs";

const today = "2026-11-18";
const profile = { interests: [] };
const emptyTracking = () => ({ statuses: {}, manual: [] });
const event = (fields = {}) => ({
    name: "ExampleConf", cfpUrl: "https://example.com/cfp", eventUrl: null, cfpEnd: "2026-12-01",
    cfpStart: null, eventStart: "2027-05-01", eventEnd: null, location: null, description: "",
    tags: [], languages: [], source: "first", sourceUpdated: null, ...fields,
});
const listing = (records, tracking = emptyTracking()) =>
    buildListing({ records, sourceStatus: [], fetchedAt: "2026-11-18T00:00:00Z" }, profile, tracking, today).items;

test("separates editions sharing a URL and leaves ambiguous undated records separate", () => {
    const records = [
        event({ eventStart: null, source: "undated" }),
        event({ eventStart: "2027-05-01" }),
        event({ eventStart: "2028-05-01", source: "next" }),
    ];
    const items = listing(records);
    assert.equal(items.length, 3);
    assert.equal(new Set(items.map((item) => item.id)).size, 3);
    assert.deepEqual(items.map((item) => item.sources.length), [1, 1, 1]);
    assert.equal(listing(records.slice(0, 2)).length, 1);
});

test("retains tracked identity across source and name changes, and retains missing events", () => {
    const first = event();
    const second = event({ name: "Example Conference", source: "second" });
    const original = listing([first, second])[0];
    const tracking = { statuses: { [original.id]: { status: "submitted", note: "My talk", event: trackingEvent(original) } }, manual: [] };
    const changed = listing([second], tracking)[0];
    assert.equal(changed.id, original.id);
    assert.equal(changed.status, "submitted");
    assert.equal(changed.note, "My talk");
    assert.equal(changed.retained, undefined);
    tracking.statuses[original.id].event = trackingEvent(changed);
    const missing = listing([], tracking)[0];
    assert.equal(missing.id, original.id);
    assert.equal(missing.name, "Example Conference");
    assert.equal(missing.retained, true);
    assert.equal(missing.note, "My talk");
    const later = listing([event({ eventStart: "2028-05-01" })], tracking);
    assert.equal(later.length, 2);
    assert.equal(later.find((item) => item.eventStart.startsWith("2028")).status, "new");
});

test("does not apply an ambiguous undated tracked identity to an arbitrary edition", () => {
    const original = listing([event({ eventStart: null })])[0];
    const tracking = { statuses: { [original.id]: { status: "saved", event: trackingEvent(original) } }, manual: [] };
    const items = listing([event(), event({ eventStart: "2028-05-01", source: "next" })], tracking);
    assert.equal(items.length, 3);
    assert.equal(new Set(items.map((item) => item.id)).size, 3);
    assert.equal(items.filter((item) => item.status === "saved").length, 1);
    assert.equal(items.find((item) => item.status === "saved").retained, true);
});

test("keeps the tracked edition year when a remaining source has no event date", () => {
    const original = listing([event()])[0];
    const tracking = { statuses: { [original.id]: { status: "saved", event: trackingEvent(original) } }, manual: [] };
    const undated = listing([event({ eventStart: null, source: "second" })], tracking)[0];
    tracking.statuses[original.id].event = trackingEvent(undated);
    assert.equal(tracking.statuses[original.id].event.identityYear, "2027");
    const items = listing([event({ eventStart: "2028-05-01" })], tracking);
    assert.equal(items.length, 2);
    assert.equal(items.find((item) => item.eventStart?.startsWith("2028")).status, "new");
    assert.equal(items.find((item) => item.status === "saved").retained, true);
});

test("migrates a legacy ID generated from an undated source merged before a dated one", () => {
    const oldId = createHash("sha1").update("exampleconf|2026").digest("hex").slice(0, 12);
    const tracking = { statuses: { [oldId]: { status: "saved", note: "Legacy" } }, manual: [] };
    const items = listing([event({ eventStart: null }), event({ source: "second" })], tracking);
    assert.equal(items.length, 1);
    assert.equal(items[0].id, oldId);
    assert.equal(items[0].note, "Legacy");
});

test("flags consecutive deadlines and keeps a disputed CFP visible until all deadlines pass", () => {
    const records = [event({ cfpEnd: "2026-11-17" }), event({ cfpEnd: "2026-11-18", source: "second" })];
    const item = listing(records)[0];
    assert.equal(item.cfpEnd, "2026-11-17");
    assert.equal(item.deadlineConflict, true);
    assert.equal(item.closed, false);
    assert.equal(listing(records.map((record) => ({ ...record, cfpEnd: "2026-11-17" }))).length, 0);
});

test("serializes tracking transactions and atomically replaces JSON", async () => {
    const root = await mkdtemp(join(tmpdir(), "cfp-tracker-test-"));
    try {
        await mkdir(join(root, "cfp-tracker"));
        await writeFile(join(root, "cfp-tracker", "tracking.json"), JSON.stringify(emptyTracking()));
        await Promise.all(Array.from({ length: 30 }, (_, index) => updateTracking(root, async (tracking) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            if (index % 2) tracking.manual.push({ name: `Event ${index}` });
            else tracking.statuses[index] = { status: "saved", note: `Note ${index}` };
            JSON.parse(await readFile(join(root, "cfp-tracker", "tracking.json"), "utf8"));
        })));
        const tracking = await loadTracking(root);
        assert.equal(Object.keys(tracking.statuses).length, 15);
        assert.equal(tracking.manual.length, 15);
        await assert.rejects(updateTracking(root, () => { throw new Error("failed"); }), /failed/);
        await updateTracking(root, (data) => { data.statuses.after = { status: "saved" }; });
        assert.equal((await loadTracking(root)).statuses.after.status, "saved");
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});

function send(url, { method = "POST", headers = {}, body = "{}" } = {}) {
    return new Promise((resolve, reject) => {
        const req = request(new URL("/api/status", url), { method, headers }, (res) => {
            res.resume();
            res.on("end", () => resolve(res.statusCode));
        });
        req.on("error", reject);
        req.end(body);
    });
}

test("server rejects invalid hosts, origins and non-JSON mutations", async () => {
    let updates = 0;
    const { server, url } = await startServer("", {
        setStatus: async () => { updates++; return {}; },
        listing: async () => ({}), addManual: async () => ({}), version: () => 0,
    });
    const origin = new URL(url).origin;
    try {
        assert.equal(await send(url, { headers: { origin, host: "evil.example", "content-type": "application/json" } }), 403);
        assert.equal(await send(url, { headers: { origin: "https://evil.example", "content-type": "application/json" } }), 403);
        assert.equal(await send(url, { headers: { "content-type": "application/json" } }), 403);
        assert.equal(await send(url, { headers: { origin, "content-type": "text/plain" } }), 415);
        assert.equal(await send(url, { headers: { origin, "content-type": "application/json; charset=utf-8" } }), 200);
        assert.equal(updates, 1);
    } finally {
        await new Promise((resolve) => server.close(resolve));
    }
});

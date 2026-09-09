import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createCanvas, joinSession } from "@github/copilot-sdk/extension";

const servers = new Map();
const DEFAULT_SESSION_ID = "2026-0825-net-day-switzerland";
const SESSION_MANIFESTS = new Map([
    [DEFAULT_SESSION_ID, "2026/0825_NetDaySwitzerland/session-flow.json"],
]);

function parseElapsedMinutes(time) {
    const [minutes, seconds] = time.split(":").map(Number);
    return minutes + (seconds || 0) / 60;
}

function formatClockTime(startTime, elapsedMinutes) {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const total = startHour * 60 + startMinute + Math.round(elapsedMinutes);
    const hour = Math.floor(total / 60) % 24;
    const minute = total % 60;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

async function loadSession(sessionId = DEFAULT_SESSION_ID) {
    const manifestPath = SESSION_MANIFESTS.get(sessionId);
    if (!manifestPath) throw new Error(`Unknown session manifest: ${sessionId}`);
    const manifest = JSON.parse(await readFile(join(process.cwd(), manifestPath), "utf8"));
    return {
        ...manifest,
        flow: manifest.flow.map((item) => ({
            ...item,
            clockTime: formatClockTime(manifest.startTime, parseElapsedMinutes(item.time)),
        })),
    };
}

function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function renderFlow(session) {
    return session.flow.map((item) => `
        <article class="flow-item ${item.kind.startsWith("Demo") ? "demo" : ""}">
          <div class="time"><strong>${item.clockTime}</strong><span>+${item.time}</span><span>${item.duration}</span></div>
          <div class="flow-content"><div class="eyebrow">${item.kind} · Slides ${item.slides}</div><h3>${item.title}</h3><p>${item.detail}</p></div>
        </article>`).join("");
}

function renderDemos(session) {
    return session.demos.map((demo) => `
        <details id="${demo.id}" class="demo-card" open><summary><span>${demo.title}</span><span class="chevron">⌄</span></summary>
        <div class="demo-content"><p class="goal">${demo.goal}</p><div class="prompt"><span>Prepared prompt</span><code>${escapeHtml(demo.prompt)}</code></div>
        <ol>${demo.steps.map((step) => `<li>${step}</li>`).join("")}</ol><p class="fallback"><strong>Recovery:</strong> ${demo.fallback}</p></div></details>`).join("");
}

function renderChecklist(session) {
    return session.checklist.map((item, index) => `<label class="check"><input type="checkbox" data-check="${index}" /><span>${item}</span></label>`).join("");
}

function renderHtml(session) {
    const endTime = formatClockTime(session.startTime, session.targetMinutes);
    return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${session.title}</title>
<style>
:root { color-scheme: light dark; } * { box-sizing: border-box; } body { margin: 0; padding: 24px; background: var(--background-color-default, #fff); color: var(--text-color-default, #1f2328); font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif); font-size: var(--text-body-medium, 14px); line-height: var(--leading-body-medium, 1.45); } main { max-width: 1080px; margin: 0 auto; } header { display: flex; justify-content: space-between; gap: 20px; align-items: start; margin-bottom: 24px; } h1 { margin: 4px 0 6px; font-size: var(--text-title-large, 26px); line-height: 1.2; } h2 { margin: 0 0 12px; font-size: 18px; } h3 { margin: 3px 0 5px; font-size: 16px; } p { margin: 0; color: var(--text-color-muted, #59636e); } .eyebrow { color: var(--text-color-muted, #59636e); font-size: 12px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; } .event { color: var(--text-color-muted, #59636e); } .clock { min-width: 130px; padding: 12px 14px; border: 1px solid var(--border-color-default, #d0d7de); border-radius: 10px; text-align: right; } .clock strong { display: block; font-size: 22px; } .clock span { color: var(--text-color-muted, #59636e); font-size: 12px; } .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--border-color-default, #d0d7de); margin-bottom: 18px; } button { border: 0; background: transparent; color: var(--text-color-muted, #59636e); cursor: pointer; font: inherit; padding: 10px 12px; border-bottom: 2px solid transparent; } button.active { color: var(--text-color-default, #1f2328); border-bottom-color: var(--color-focus-outline, #0969da); font-weight: 600; } .panel[hidden] { display: none; } .flow { border-left: 2px solid var(--border-color-default, #d0d7de); margin-left: 92px; } .flow-item { display: grid; grid-template-columns: 94px 1fr; gap: 16px; position: relative; padding: 0 0 18px 18px; } .flow-item::before { content: ""; background: var(--background-color-default, #fff); border: 2px solid var(--border-color-default, #d0d7de); border-radius: 50%; height: 10px; left: -6px; position: absolute; top: 7px; width: 10px; } .flow-item.demo::before { background: var(--color-focus-outline, #0969da); border-color: var(--color-focus-outline, #0969da); } .time { margin-left: -134px; text-align: right; } .time strong, .time span { display: block; } .time strong { font-size: 15px; } .time span { color: var(--text-color-muted, #59636e); font-size: 12px; } .flow-content { margin-top: -2px; } .demo-card { border: 1px solid var(--border-color-default, #d0d7de); border-radius: 10px; margin-bottom: 12px; overflow: hidden; } summary { cursor: pointer; display: flex; justify-content: space-between; font-weight: 600; padding: 14px 16px; } .demo-card[open] .chevron { transform: rotate(180deg); } .chevron { transition: transform .15s; } .demo-content { border-top: 1px solid var(--border-color-default, #d0d7de); padding: 16px; } .goal { margin-bottom: 14px; } .prompt { background: var(--background-color-default, #fff); border: 1px solid var(--border-color-default, #d0d7de); border-radius: 8px; color: var(--text-color-default, #1f2328); margin-bottom: 14px; padding: 10px 12px; } .prompt span { display: block; color: var(--text-color-muted, #59636e); font-size: 12px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; } code { color: var(--text-color-default, #1f2328); font-family: var(--font-mono, SFMono-Regular, Consolas, monospace); font-size: 12px; white-space: normal; } ol { margin: 0 0 14px; padding-left: 22px; } li { margin: 7px 0; } .fallback { border-left: 3px solid var(--true-color-yellow, #9a6700); padding-left: 10px; } .check { align-items: flex-start; display: flex; gap: 10px; margin: 11px 0; } .check input { margin-top: 3px; } .sources { margin-top: 24px; color: var(--text-color-muted, #59636e); font-size: 12px; } @media (max-width: 600px) { body { padding: 16px; } header { display: block; } .clock { margin-top: 14px; text-align: left; } .flow { margin-left: 0; } .flow-item { grid-template-columns: 1fr; } .time { margin-left: 0; text-align: left; } }
</style></head><body><main><header><div><div class="eyebrow">${session.event} · ${session.date} · ${session.location}</div><h1>${session.title}</h1><p class="event">${session.subtitle} · ${session.targetMinutes}-minute session</p></div><div class="clock"><strong>${session.startTime}–${endTime}</strong><span>local start–end</span></div></header><nav class="tabs"><button class="active" data-tab="flow">Session flow</button><button data-tab="demos">Demo runbooks</button><button data-tab="ready">Presenter readiness</button></nav><section id="flow" class="panel">${renderFlow(session)}</section><section id="demos" class="panel" hidden>${renderDemos(session)}</section><section id="ready" class="panel" hidden><h2>Before the session</h2><p>Track the rehearsal and environment items that protect the live demos.</p><div>${renderChecklist(session)}</div></section><p class="sources">Manifest: <code>${session.id}</code> · Sources: ${session.sourceFiles.map((file) => `<code>${file}</code>`).join(", ")}</p></main><script>const stateKey = "session-flow:${session.id}"; const buttons = [...document.querySelectorAll("[data-tab]")]; const panels = [...document.querySelectorAll(".panel")]; buttons.forEach((button) => button.addEventListener("click", () => { buttons.forEach((item) => item.classList.toggle("active", item === button)); panels.forEach((panel) => panel.hidden = panel.id !== button.dataset.tab); })); const saved = JSON.parse(localStorage.getItem(stateKey) || "{}"); document.querySelectorAll("[data-check]").forEach((checkbox) => { checkbox.checked = Boolean(saved[checkbox.dataset.check]); checkbox.addEventListener("change", () => { saved[checkbox.dataset.check] = checkbox.checked; localStorage.setItem(stateKey, JSON.stringify(saved)); }); });</script></body></html>`;
}

async function startServer(instanceId, session) {
    const server = createServer((request, response) => { if (request.url !== "/" && request.url !== "/index.html") { response.statusCode = 404; response.end("Not found"); return; } response.setHeader("Content-Type", "text/html; charset=utf-8"); response.end(renderHtml(session)); });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return { server, url: `http://127.0.0.1:${port}/` };
}

await joinSession({ canvases: [createCanvas({
    id: "session-flow", displayName: "Session flow", description: "Visualizes a conference session timeline, demo runbooks, and presenter readiness from a session manifest.",
    inputSchema: { type: "object", properties: { sessionId: { type: "string" } } },
    actions: [
        { name: "get_session_flow", description: "Returns the timed run of show for a manifest-backed conference session.", inputSchema: { type: "object", properties: { sessionId: { type: "string" } } }, handler: async (ctx) => { const data = await loadSession(ctx.input?.sessionId); const { demos, checklist, ...flow } = data; return flow; } },
        { name: "get_demo_runbooks", description: "Returns demo goals, live steps, prepared prompts, and recovery paths for a manifest-backed session.", inputSchema: { type: "object", properties: { sessionId: { type: "string" } } }, handler: async (ctx) => (await loadSession(ctx.input?.sessionId)).demos },
    ],
    open: async (ctx) => { const data = await loadSession(ctx.input?.sessionId); let entry = servers.get(ctx.instanceId); if (!entry) { entry = await startServer(ctx.instanceId, data); servers.set(ctx.instanceId, entry); } return { title: `${data.event} session flow`, url: entry.url }; },
    onClose: async (ctx) => { const entry = servers.get(ctx.instanceId); if (entry) { servers.delete(ctx.instanceId); await new Promise((resolve) => entry.server.close(resolve)); } },
})] });

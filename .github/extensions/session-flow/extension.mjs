import { createServer } from "node:http";
import { createCanvas, joinSession } from "@github/copilot-sdk/extension";

const servers = new Map();

// Local talk start time, 24-hour "HH:MM". Update if the slot changes.
const SESSION_START_TIME = "13:45";

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

const sessionFlow = [
    { time: "0:00", duration: "10 min", kind: "Talk", slides: "1-8", title: "Welcome and the agent landscape", detail: "Frame Foundry, compare prompt and hosted agents, and establish the code-versus-platform boundary." },
    { time: "10:00", duration: "10 min", kind: "Demo 1", slides: "9", title: "Create and deploy a hosted agent", detail: "Show the local loop, deployment, managed endpoint, versioning, and one trace." },
    { time: "20:00", duration: "5 min", kind: "Talk", slides: "10-11", title: "Extend agents with tools and MCP", detail: "Explain function tools, MCP, and the toolbox as a reusable operational boundary." },
    { time: "25:00", duration: "10 min", kind: "Demo 2", slides: "12", title: "Use the prepared Microsoft Learn toolbox", detail: "Attach the toolbox, ask a current question, inspect the tool call and citations, then ask a follow-up." },
    { time: "35:00", duration: "3 min", kind: "Portal tour", slides: "13", title: "Manage agents at scale", detail: "Open inventory and a trace; call out tool calls, latency, usage, and sensitive-data handling." },
    { time: "38:00", duration: "2 min", kind: "Talk", slides: "14-15", title: "Resources and close", detail: "Point to the links, reinforce the hosting and tool-selection rules, and invite questions." },
    { time: "40:00", duration: "5 min", kind: "Buffer", slides: "15", title: "Questions and deployment buffer", detail: "Use for questions, deployment latency, or a fallback walkthrough." },
];

const demos = [
    {
        id: "demo-1",
        title: "Demo 1: Hosted agent",
        goal: "Show that a developer-owned agent can keep its application code while Foundry supplies managed hosting, identity, versioning, scaling, and telemetry.",
        prompt: "Explain the difference between a prompt agent and a hosted agent in two sentences.",
        steps: [
            "Open the .NET agent project; show instructions, model configuration, tool registration, and hosting manifest.",
            "Run the agent locally and send the prepared prompt.",
            "Explain the boundary: local code works, but it is not yet a managed Foundry endpoint.",
            "Deploy with azd deploy; mention provisioning only when using a fresh environment.",
            "Show the active agent version in Foundry and invoke the deployed endpoint.",
            "Compare local and hosted responses, then open a trace.",
        ],
        fallback: "Use Foundry Toolkit: Deploy Hosted Agent from VS Code. If deployment is pending, switch to the pre-deployed version and explain the lifecycle.",
    },
    {
        id: "demo-2",
        title: "Demo 2: Microsoft Learn toolbox",
        goal: "Show that a toolbox exposes reusable MCP capabilities without rewriting the agent's orchestration code.",
        prompt: "What is the current Microsoft guidance for connecting a .NET agent to an MCP server? Cite Microsoft Learn sources and separate Foundry Agent Service guidance from Agent Framework guidance.",
        steps: [
            "Show the prepared toolbox version and its Web Search and Microsoft Learn MCP capabilities.",
            "Attach or select the toolbox for the demo agent using its MCP endpoint.",
            "Ask the prepared documentation question.",
            "Show tool selection, the Microsoft Learn result, and citations.",
            "Ask the prepared five-step local-demo checklist follow-up.",
            "If time permits, show the version list or prepared screenshot of a second version.",
        ],
        fallback: "If the MCP server does not load, verify endpoint, connection, project, and network access. If citations are absent, explicitly request Microsoft Learn citations.",
    },
];

const checklist = [
    "Confirm the Foundry project, model deployment, region, and RBAC roles.",
    "Deploy and invoke Demo 1 before attendees arrive.",
    "Create and test the Microsoft Learn MCP connection and toolbox.",
    "Record the toolbox name, version, endpoint, and agent configuration.",
    "Have a pre-recorded deployment or provisioning screen capture available.",
    "Remove secrets, tokens, personal data, and attendee information from prompts and traces.",
    "Verify preview features and the presentation-machine setup shortly before the session.",
];

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderFlow() {
    return sessionFlow.map((item) => {
        const clockTime = formatClockTime(SESSION_START_TIME, parseElapsedMinutes(item.time));
        return `
        <article class="flow-item ${item.kind.startsWith("Demo") ? "demo" : ""}">
          <div class="time"><strong>${clockTime}</strong><span>+${item.time}</span><span>${item.duration}</span></div>
          <div class="flow-content">
            <div class="eyebrow">${item.kind} · Slides ${item.slides}</div>
            <h3>${item.title}</h3>
            <p>${item.detail}</p>
          </div>
        </article>`;
    }).join("");
}

function renderDemos() {
    return demos.map((demo) => `
        <details id="${demo.id}" class="demo-card" open>
          <summary><span>${demo.title}</span><span class="chevron">⌄</span></summary>
          <div class="demo-content">
            <p class="goal">${demo.goal}</p>
            <div class="prompt"><span>Prepared prompt</span><code>${escapeHtml(demo.prompt)}</code></div>
            <ol>${demo.steps.map((step) => `<li>${step}</li>`).join("")}</ol>
            <p class="fallback"><strong>Recovery:</strong> ${demo.fallback}</p>
          </div>
        </details>`).join("");
}

function renderChecklist() {
    return checklist.map((item, index) => `
        <label class="check">
          <input type="checkbox" data-check="${index}" />
          <span>${item}</span>
        </label>`).join("");
}

function renderHtml() {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>.NET Day Switzerland session flow</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 24px; background: var(--background-color-default, #fff);
      color: var(--text-color-default, #1f2328);
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: var(--text-body-medium, 14px); line-height: var(--leading-body-medium, 1.45);
    }
    main { max-width: 1080px; margin: 0 auto; }
    header { display: flex; justify-content: space-between; gap: 20px; align-items: start; margin-bottom: 24px; }
    h1 { margin: 4px 0 6px; font-size: var(--text-title-large, 26px); line-height: 1.2; }
    h2 { margin: 0 0 12px; font-size: 18px; }
    h3 { margin: 3px 0 5px; font-size: 16px; }
    p { margin: 0; color: var(--text-color-muted, #59636e); }
    .eyebrow { color: var(--text-color-muted, #59636e); font-size: 12px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; }
    .event { color: var(--text-color-muted, #59636e); }
    .clock { min-width: 130px; padding: 12px 14px; border: 1px solid var(--border-color-default, #d0d7de); border-radius: 10px; text-align: right; }
    .clock strong { display: block; font-size: 22px; }
    .clock span { color: var(--text-color-muted, #59636e); font-size: 12px; }
    .tabs { display: flex; gap: 8px; border-bottom: 1px solid var(--border-color-default, #d0d7de); margin-bottom: 18px; }
    button { border: 0; background: transparent; color: var(--text-color-muted, #59636e); cursor: pointer; font: inherit; padding: 10px 12px; border-bottom: 2px solid transparent; }
    button.active { color: var(--text-color-default, #1f2328); border-bottom-color: var(--color-focus-outline, #0969da); font-weight: 600; }
    .panel[hidden] { display: none; }
    .flow { border-left: 2px solid var(--border-color-default, #d0d7de); margin-left: 92px; }
    .flow-item { display: grid; grid-template-columns: 94px 1fr; gap: 16px; position: relative; padding: 0 0 18px 18px; }
    .flow-item::before { content: ""; background: var(--background-color-default, #fff); border: 2px solid var(--border-color-default, #d0d7de); border-radius: 50%; height: 10px; left: -6px; position: absolute; top: 7px; width: 10px; }
    .flow-item.demo::before { background: var(--color-focus-outline, #0969da); border-color: var(--color-focus-outline, #0969da); }
    .time { margin-left: -134px; text-align: right; }
    .time strong, .time span { display: block; } .time strong { font-size: 15px; } .time span { color: var(--text-color-muted, #59636e); font-size: 12px; }
    .flow-content { margin-top: -2px; }
    .demo-card { border: 1px solid var(--border-color-default, #d0d7de); border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
    summary { cursor: pointer; display: flex; justify-content: space-between; font-weight: 600; padding: 14px 16px; }
    .demo-card[open] .chevron { transform: rotate(180deg); } .chevron { transition: transform .15s; }
    .demo-content { border-top: 1px solid var(--border-color-default, #d0d7de); padding: 16px; }
    .goal { margin-bottom: 14px; }
    .prompt { background: var(--color-neutral-muted, #f6f8fa); border-radius: 8px; margin-bottom: 14px; padding: 10px 12px; }
    .prompt span { display: block; color: var(--text-color-muted, #59636e); font-size: 12px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase; }
    code { font-family: var(--font-mono, SFMono-Regular, Consolas, monospace); font-size: 12px; white-space: normal; }
    ol { margin: 0 0 14px; padding-left: 22px; } li { margin: 7px 0; }
    .fallback { border-left: 3px solid var(--true-color-yellow, #9a6700); padding-left: 10px; }
    .check { align-items: flex-start; display: flex; gap: 10px; margin: 11px 0; } .check input { margin-top: 3px; }
    .sources { margin-top: 24px; color: var(--text-color-muted, #59636e); font-size: 12px; }
    @media (max-width: 600px) { body { padding: 16px; } header { display: block; } .clock { margin-top: 14px; text-align: left; } .flow { margin-left: 0; } .flow-item { grid-template-columns: 1fr; } .time { margin-left: 0; text-align: left; } }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <div class="eyebrow">.NET Day Switzerland 2026 · August 25 · Zurich</div>
        <h1>Supercharge Your Agents</h1>
        <p class="event">Custom Tools, MCP, and Microsoft Foundry · 45-minute session</p>
      </div>
      <div class="clock"><strong id="clock">${SESSION_START_TIME}\u2013${formatClockTime(SESSION_START_TIME, 45)}</strong><span>local start\u2013end</span></div>
    </header>
    <nav class="tabs" aria-label="Canvas views">
      <button class="active" data-tab="flow">Session flow</button>
      <button data-tab="demos">Demo runbooks</button>
      <button data-tab="ready">Presenter readiness</button>
    </nav>
    <section id="flow" class="panel">${renderFlow()}</section>
    <section id="demos" class="panel" hidden>${renderDemos()}</section>
    <section id="ready" class="panel" hidden>
      <h2>Before the session</h2>
      <p>Track the rehearsal and environment items that protect the live demos.</p>
      <div id="checks">${renderChecklist()}</div>
    </section>
    <p class="sources">Source materials: <code>presentation-outline.md</code>, <code>demo-steps-and-talking-points.md</code>, <code>slide-notes.md</code>, and <code>links.md</code>.</p>
  </main>
  <script>
    const stateKey = "net-day-switzerland-readiness";
    const buttons = [...document.querySelectorAll("[data-tab]")];
    const panels = [...document.querySelectorAll(".panel")];
    buttons.forEach((button) => button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.toggle("active", item === button));
      panels.forEach((panel) => panel.hidden = panel.id !== button.dataset.tab);
    }));
    const saved = JSON.parse(localStorage.getItem(stateKey) || "{}");
    document.querySelectorAll("[data-check]").forEach((checkbox) => {
      checkbox.checked = Boolean(saved[checkbox.dataset.check]);
      checkbox.addEventListener("change", () => {
        saved[checkbox.dataset.check] = checkbox.checked;
        localStorage.setItem(stateKey, JSON.stringify(saved));
      });
    });
  </script>
</body>
</html>`;
}

async function startServer(instanceId) {
    const server = createServer((request, response) => {
        if (request.url !== "/" && request.url !== "/index.html") {
            response.statusCode = 404;
            response.end("Not found");
            return;
        }

        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(renderHtml());
    });

    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    return { server, url: `http://127.0.0.1:${port}/` };
}

await joinSession({
    canvases: [
        createCanvas({
            id: "session-flow",
            displayName: "Session flow",
            description: "Visualizes the .NET Day Switzerland session timeline, demo runbooks, and presenter readiness.",
            actions: [
                {
                    name: "get_session_flow",
                    description: "Returns the timed run of show and session metadata for .NET Day Switzerland.",
                    handler: () => ({
                        event: ".NET Day Switzerland 2026",
                        date: "August 25, 2026",
                        location: "Arena Cinemas, Sihlcity, Zurich",
                        session: "Supercharge Your Agents: Custom Tools, MCP, and Microsoft Foundry",
                        targetMinutes: 45,
                        startTime: SESSION_START_TIME,
                        flow: sessionFlow.map((item) => ({
                            ...item,
                            clockTime: formatClockTime(SESSION_START_TIME, parseElapsedMinutes(item.time)),
                        })),
                    }),
                },
                {
                    name: "get_demo_runbooks",
                    description: "Returns the demo goals, live steps, prepared prompts, and recovery paths.",
                    handler: () => demos,
                },
            ],
            open: async (ctx) => {
                let entry = servers.get(ctx.instanceId);
                if (!entry) {
                    entry = await startServer(ctx.instanceId);
                    servers.set(ctx.instanceId, entry);
                }
                return { title: ".NET Day Switzerland session flow", url: entry.url };
            },
            onClose: async (ctx) => {
                const entry = servers.get(ctx.instanceId);
                if (entry) {
                    servers.delete(ctx.instanceId);
                    await new Promise((resolve) => entry.server.close(resolve));
                }
            },
        }),
    ],
});

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const MAX_BODY_BYTES = 64 * 1024;

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

export async function startServer(pagePath, handlers) {
    const server = createServer(async (request, response) => {
        const host = `127.0.0.1:${server.address().port}`;
        if (request.headers.host !== host) return sendJson(response, 403, { error: "Invalid Host" });
        if (request.method === "POST") {
            if (request.headers.origin !== `http://${host}`) return sendJson(response, 403, { error: "Invalid Origin" });
            if (!/^application\/json(?:\s*;|$)/i.test(request.headers["content-type"] ?? "")) {
                return sendJson(response, 415, { error: "Content-Type must be application/json" });
            }
        }
        try {
            const { pathname } = new URL(request.url, `http://${host}`);
            if (request.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
                response.setHeader("Content-Type", "text/html; charset=utf-8");
                response.end(await readFile(pagePath, "utf8"));
            } else if (request.method === "GET" && pathname === "/api/version") {
                sendJson(response, 200, { version: handlers.version() });
            } else if (request.method === "GET" && pathname === "/api/listing") {
                sendJson(response, 200, await handlers.listing());
            } else if (request.method === "POST" && pathname === "/api/refresh") {
                sendJson(response, 200, await handlers.listing({ force: true }));
            } else if (request.method === "POST" && pathname === "/api/status") {
                sendJson(response, 200, await handlers.setStatus(await readBody(request)));
            } else if (request.method === "POST" && pathname === "/api/manual") {
                sendJson(response, 200, await handlers.addManual(await readBody(request)));
            } else {
                sendJson(response, 404, { error: "Not found" });
            }
        } catch (error) {
            sendJson(response, 400, { error: String(error?.message ?? error) });
        }
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

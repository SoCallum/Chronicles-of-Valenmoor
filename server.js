/**
 * Chronicles of Valenmoor — Lightweight Zero-Dependency Node HTTP Server.
 * - Serves static frontend & ES modules with strict path-traversal protection
 * - Exposes GET /api/leaderboard and POST /api/runs
 * - Re-computes scores authoritatively using shared src/engine/scoring.js
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeChronicleScore } from "./src/engine/scoring.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3080;
const HOST = process.env.HOST || "127.0.0.1";
const STORE_PATH = path.resolve(__dirname, process.env.DATA_STORE_PATH || "storage/runs.json");
const MAX_BODY_BYTES = 32 * 1024;
const MAX_STORED_RUNS = 200;

const VALID_CLASSES = new Map([
  ["paladin", "Paladin of the Dawn"],
  ["scholar", "Arcane Scholar"],
  ["shadowblade", "Shadowblade"],
  ["warden", "Fey Warden"]
]);

const VALID_PORTRAITS = new Set([
  "portrait_paladin",
  "portrait_scholar",
  "portrait_shadowblade",
  "portrait_warden"
]);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8"
};

const SEED_RUNS = [
  {
    id: "seed-1",
    heroName: "Seren Starweaver",
    classId: "scholar",
    className: "Arcane Scholar",
    portraitKey: "portrait_scholar",
    legendTitle: "Mythic Sovereign",
    legendStyle: "mythic",
    chaptersCleared: 4,
    overallEnding: "legendary",
    score: 3685,
    createdAt: "2026-11-18T18:00:00.000Z"
  },
  {
    id: "seed-2",
    heroName: "Aldric Dawnblade",
    classId: "paladin",
    className: "Paladin of the Dawn",
    portraitKey: "portrait_paladin",
    legendTitle: "Ironclad Vanguard",
    legendStyle: "heroic",
    chaptersCleared: 4,
    overallEnding: "triumph",
    score: 3140,
    createdAt: "2026-11-19T14:20:00.000Z"
  },
  {
    id: "seed-3",
    heroName: "Lyra Nighthollow",
    classId: "shadowblade",
    className: "Shadowblade",
    portraitKey: "portrait_shadowblade",
    legendTitle: "Silver-Tongued Bard",
    legendStyle: "witty",
    chaptersCleared: 3,
    overallEnding: "legendary",
    score: 2560,
    createdAt: "2026-11-20T09:45:00.000Z"
  },
  {
    id: "seed-4",
    heroName: "Rowan Thornbrook",
    classId: "warden",
    className: "Fey Warden",
    portraitKey: "portrait_warden",
    legendTitle: "Ghost of the Reach",
    legendStyle: "cunning",
    chaptersCleared: 2,
    overallEnding: "triumph",
    score: 1840,
    createdAt: "2026-11-21T16:10:00.000Z"
  }
];

function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
}

function sendJson(res, statusCode, payload) {
  applySecurityHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readStore() {
  try {
    const raw = await fsp.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch {
    // initialize store lazily
  }
  return [...SEED_RUNS];
}

async function writeStore(runs) {
  await fsp.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const trimmed = runs.slice(0, MAX_STORED_RUNS);
  await fsp.writeFile(STORE_PATH, JSON.stringify(trimmed, null, 2), "utf-8");
}

function sanitizeText(raw, fallback, maxLen = 32) {
  const clean = String(raw || "")
    .replace(/[\u0000-\u001F\u007F<>]/g, "")
    .trim()
    .slice(0, maxLen);
  return clean || fallback;
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const text = Buffer.concat(chunks).toString("utf-8");
        resolve(JSON.parse(text || "{}"));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

async function handleApi(req, res, urlObj) {
  if (req.method === "GET" && urlObj.pathname === "/api/leaderboard") {
    const runs = await readStore();
    return sendJson(res, 200, { runs });
  }

  if (req.method === "POST" && urlObj.pathname === "/api/runs") {
    let body;
    try {
      body = await readRequestBody(req);
    } catch (err) {
      return sendJson(res, 400, { error: err.message });
    }

    const classId = VALID_CLASSES.has(body.classId) ? body.classId : "paladin";
    const portraitKey = VALID_PORTRAITS.has(body.portraitKey)
      ? body.portraitKey
      : `portrait_${classId}`;

    // Authoritatively re-compute score on server
    const computed = computeChronicleScore(body.scoringInput || {});
    const entry = {
      id: sanitizeText(body.runId, `VM-${Date.now().toString(36).toUpperCase()}`, 24),
      heroName: sanitizeText(body.heroName, "Unnamed Wayfarer", 32),
      classId,
      className: VALID_CLASSES.get(classId),
      portraitKey,
      legendTitle: computed.legendTitle,
      legendStyle: computed.legendStyle,
      chaptersCleared: computed.chaptersCleared,
      overallEnding: computed.overallEnding,
      score: computed.total,
      createdAt: new Date().toISOString()
    };

    const runs = await readStore();
    const merged = [entry, ...runs.filter((r) => r.id !== entry.id)];
    await writeStore(merged);
    return sendJson(res, 201, { run: entry, scoreBreakdown: computed.breakdown });
  }

  return sendJson(res, 404, { error: "API route not found" });
}

function isBlockedPath(relPath) {
  const parts = relPath.split(path.sep);
  return parts.some(
    (part) =>
      part.startsWith(".") ||
      part === "storage" ||
      part === "tests" ||
      part === "server.js" ||
      part === "node_modules"
  );
}

async function handleStatic(req, res, urlObj) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    applySecurityHeaders(res);
    res.writeHead(405);
    res.end("Method Not Allowed");
    return;
  }

  const reqPath = urlObj.pathname === "/" ? "/index.html" : decodeURIComponent(urlObj.pathname);
  const resolved = path.resolve(__dirname, `.${reqPath}`);
  const relative = path.relative(__dirname, resolved);

  if (relative.startsWith("..") || path.isAbsolute(relative) || isBlockedPath(relative)) {
    applySecurityHeaders(res);
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fsp.stat(resolved);
    if (!stat.isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(resolved).toLowerCase();
    applySecurityHeaders(res);
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(resolved).pipe(res);
  } catch {
    applySecurityHeaders(res);
    res.writeHead(404);
    res.end("Not Found");
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    try {
      if (urlObj.pathname.startsWith("/api/")) {
        await handleApi(req, res, urlObj);
      } else {
        await handleStatic(req, res, urlObj);
      }
    } catch (err) {
      sendJson(res, 500, { error: "Internal server error" });
      console.error(err);
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(`Chronicles of Valenmoor running at http://${HOST}:${PORT}`);
  });
}

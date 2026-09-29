"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = __dirname;
const DATA_DIR = process.env.CREATOR_DATA_DIR ? path.resolve(process.env.CREATOR_DATA_DIR) : path.join(ROOT, ".creator-data");
const DATA_FILE = path.join(DATA_DIR, "stats.json");
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || "127.0.0.1";
const ADMIN_PASSWORD = process.env.CREATOR_PASSWORD || "";
const SESSION_SECRET = process.env.CREATOR_SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const DEVICE_SALT = process.env.DEVICE_HASH_SALT || SESSION_SECRET;
const SESSION_COOKIE = "myf_creator_session";
const SESSION_AGE_SECONDS = 8 * 60 * 60;
const VALID_KEYWORDS = new Set([
    "海洋馆溺亡美人鱼案", "泊然海洋馆", "安伯然", "泊然集团", "安仲斌", "安永德", "贾剑明",
    "明通集团", "杏仁网", "mt集团", "蔚蓝传媒", "钱宏达", "海洋馆保安拾金不昧", "劳而得",
    "临时工溺亡", "b2025jd0718", "b2025jd0717"
]);

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
    ".mp3": "audio/mpeg",
    ".mp4": "video/mp4",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
};

function emptyState() {
    return { schemaVersion: 1, players: {}, shares: [] };
}

function loadState() {
    try {
        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
        return {
            schemaVersion: 1,
            players: parsed.players && typeof parsed.players === "object" ? parsed.players : {},
            shares: Array.isArray(parsed.shares) ? parsed.shares : []
        };
    } catch (error) {
        if (error.code !== "ENOENT") console.error("Unable to read stats file:", error.message);
        return emptyState();
    }
}

let state = loadState();
let saveQueue = Promise.resolve();

function saveState() {
    const snapshot = JSON.stringify(state, null, 2);
    saveQueue = saveQueue.then(async function () {
        await fs.promises.mkdir(DATA_DIR, { recursive: true });
        const temp = DATA_FILE + ".tmp";
        await fs.promises.writeFile(temp, snapshot, { encoding: "utf8", mode: 0o600 });
        await fs.promises.rename(temp, DATA_FILE);
    }).catch(function (error) {
        console.error("Unable to save stats:", error.message);
    });
    return saveQueue;
}

function hash(value, salt) {
    return crypto.createHmac("sha256", salt).update(String(value)).digest("hex");
}

function normalizeKeyword(value) {
    return String(value || "").toLowerCase().replace(/[\s\p{P}]/gu, "");
}

function safeEqual(left, right) {
    const a = Buffer.from(String(left));
    const b = Buffer.from(String(right));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function json(res, status, data, extraHeaders) {
    const body = JSON.stringify(data);
    res.writeHead(status, Object.assign({
        "Content-Type": "application/json; charset=utf-8",
        "Content-Length": Buffer.byteLength(body),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer"
    }, extraHeaders || {}));
    res.end(body);
}

function readJson(req) {
    return new Promise(function (resolve, reject) {
        let body = "";
        req.setEncoding("utf8");
        req.on("data", function (chunk) {
            body += chunk;
            if (body.length > 32 * 1024) {
                reject(new Error("request too large"));
                req.destroy();
            }
        });
        req.on("end", function () {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch (error) { reject(new Error("invalid json")); }
        });
        req.on("error", reject);
    });
}

function parseCookies(req) {
    return Object.fromEntries(String(req.headers.cookie || "").split(";").map(function (part) {
        const index = part.indexOf("=");
        if (index < 0) return ["", ""];
        return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    }).filter(function (pair) { return pair[0]; }));
}

function isSecure(req) {
    return Boolean(req.socket.encrypted) || req.headers["x-forwarded-proto"] === "https";
}

function cookie(name, value, maxAge, req) {
    return name + "=" + encodeURIComponent(value) + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + maxAge + (isSecure(req) ? "; Secure" : "");
}

function signSession(payload) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return encoded + "." + hash(encoded, SESSION_SECRET);
}

function readSession(req) {
    const token = parseCookies(req)[SESSION_COOKIE];
    if (!token || !token.includes(".")) return null;
    const dot = token.lastIndexOf(".");
    const encoded = token.slice(0, dot);
    if (!safeEqual(token.slice(dot + 1), hash(encoded, SESSION_SECRET))) return null;
    try {
        const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
        return payload.role === "creator" && payload.exp > Date.now() ? payload : null;
    } catch (error) {
        return null;
    }
}

function requireAdmin(req, res) {
    if (!readSession(req)) {
        json(res, 401, { ok: false, error: "请先登录创作者后台" });
        return false;
    }
    return true;
}

function statsSummary() {
    const times = Object.values(state.players).map(function (player) { return player.qualifiedAt; }).filter(Boolean).sort();
    const daily = {};
    times.forEach(function (stamp) {
        const day = stamp.slice(0, 10);
        daily[day] = (daily[day] || 0) + 1;
    });
    return {
        totalPlayers: times.length,
        firstQualifiedAt: times[0] || null,
        lastQualifiedAt: times[times.length - 1] || null,
        updatedAt: new Date().toISOString(),
        daily: Object.keys(daily).sort().slice(-30).map(function (date) {
            return { date: date, count: daily[date] };
        })
    };
}

function validShare(rawToken) {
    if (!rawToken || !/^[a-f0-9]{64}$/.test(rawToken)) return null;
    const tokenHash = hash(rawToken, SESSION_SECRET);
    const now = Date.now();
    return state.shares.find(function (share) {
        return safeEqual(share.tokenHash, tokenHash) && !share.revokedAt && (!share.expiresAt || Date.parse(share.expiresAt) > now);
    }) || null;
}

async function handleApi(req, res, url) {
    if (req.method === "POST" && url.pathname === "/api/plays/qualify") {
        try {
            const body = await readJson(req);
            const deviceId = String(body.deviceId || "");
            if (!/^[a-zA-Z0-9-]{16,100}$/.test(deviceId) || !VALID_KEYWORDS.has(normalizeKeyword(body.keyword))) {
                json(res, 400, { ok: false, error: "invalid qualification" });
                return true;
            }
            const deviceHash = hash(deviceId, DEVICE_SALT);
            const counted = !state.players[deviceHash];
            if (counted) {
                state.players[deviceHash] = { qualifiedAt: new Date().toISOString() };
                await saveState();
            }
            json(res, 200, { ok: true, counted: counted });
        } catch (error) {
            json(res, 400, { ok: false, error: error.message });
        }
        return true;
    }

    if (req.method === "GET" && url.pathname === "/api/creator/session") {
        json(res, 200, { ok: true, authenticated: Boolean(readSession(req)), configured: Boolean(ADMIN_PASSWORD) });
        return true;
    }

    if (req.method === "POST" && url.pathname === "/api/creator/login") {
        if (!ADMIN_PASSWORD) {
            json(res, 503, { ok: false, error: "服务器尚未设置 CREATOR_PASSWORD" });
            return true;
        }
        try {
            const body = await readJson(req);
            if (!safeEqual(hash(body.password || "", SESSION_SECRET), hash(ADMIN_PASSWORD, SESSION_SECRET))) {
                json(res, 401, { ok: false, error: "密码不正确" });
                return true;
            }
            const token = signSession({ role: "creator", exp: Date.now() + SESSION_AGE_SECONDS * 1000 });
            json(res, 200, { ok: true }, { "Set-Cookie": cookie(SESSION_COOKIE, token, SESSION_AGE_SECONDS, req) });
        } catch (error) {
            json(res, 400, { ok: false, error: "请求格式不正确" });
        }
        return true;
    }

    if (req.method === "POST" && url.pathname === "/api/creator/logout") {
        json(res, 200, { ok: true }, { "Set-Cookie": cookie(SESSION_COOKIE, "", 0, req) });
        return true;
    }

    if (req.method === "GET" && url.pathname === "/api/creator/stats") {
        if (!requireAdmin(req, res)) return true;
        json(res, 200, { ok: true, stats: statsSummary() });
        return true;
    }

    if (req.method === "GET" && url.pathname === "/api/creator/shares") {
        if (!requireAdmin(req, res)) return true;
        json(res, 200, { ok: true, shares: state.shares.map(function (share) {
            return {
                id: share.id,
                label: share.label,
                createdAt: share.createdAt,
                expiresAt: share.expiresAt,
                revokedAt: share.revokedAt,
                active: !share.revokedAt && (!share.expiresAt || Date.parse(share.expiresAt) > Date.now())
            };
        }) });
        return true;
    }

    if (req.method === "POST" && url.pathname === "/api/creator/shares") {
        if (!requireAdmin(req, res)) return true;
        try {
            const body = await readJson(req);
            const label = String(body.label || "").trim().slice(0, 60);
            const days = Math.min(365, Math.max(1, Number(body.expiresInDays || 7)));
            if (!label) {
                json(res, 400, { ok: false, error: "请填写分享对象备注" });
                return true;
            }
            const rawToken = crypto.randomBytes(32).toString("hex");
            const share = {
                id: crypto.randomUUID(),
                label: label,
                tokenHash: hash(rawToken, SESSION_SECRET),
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + days * 86400000).toISOString(),
                revokedAt: null
            };
            state.shares.unshift(share);
            await saveState();
            json(res, 201, { ok: true, share: {
                id: share.id,
                label: share.label,
                expiresAt: share.expiresAt,
                url: "/shared-stats.html?token=" + rawToken
            } });
        } catch (error) {
            json(res, 400, { ok: false, error: error.message });
        }
        return true;
    }

    const revokeMatch = url.pathname.match(/^\/api\/creator\/shares\/([a-f0-9-]+)$/i);
    if (req.method === "DELETE" && revokeMatch) {
        if (!requireAdmin(req, res)) return true;
        const share = state.shares.find(function (item) { return item.id === revokeMatch[1]; });
        if (!share) {
            json(res, 404, { ok: false, error: "分享记录不存在" });
            return true;
        }
        share.revokedAt = share.revokedAt || new Date().toISOString();
        await saveState();
        json(res, 200, { ok: true });
        return true;
    }

    if (req.method === "GET" && url.pathname === "/api/shared/stats") {
        const share = validShare(url.searchParams.get("token"));
        if (!share) {
            json(res, 403, { ok: false, error: "分享链接无效、已过期或已被撤销" });
            return true;
        }
        json(res, 200, { ok: true, stats: statsSummary(), share: { label: share.label, expiresAt: share.expiresAt } });
        return true;
    }

    return false;
}

function serveStatic(req, res, url) {
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch (error) { res.writeHead(400); res.end("Bad request"); return; }

    if (pathname === "/") pathname = "/foundation-letter.html";
    if (pathname.includes("\0") || pathname.split("/").some(function (part) { return part.startsWith("."); })) {
        res.writeHead(404); res.end("Not found"); return;
    }
    const filePath = path.resolve(ROOT, "." + pathname);
    if (!filePath.startsWith(ROOT + path.sep)) {
        res.writeHead(404); res.end("Not found"); return;
    }
    fs.stat(filePath, function (error, stat) {
        if (error || !stat.isFile()) {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not found");
            return;
        }
        const headers = {
            "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "same-origin"
        };
        if (pathname === "/creator-stats.html" || pathname === "/shared-stats.html") {
            headers["Cache-Control"] = "no-store";
            headers["X-Frame-Options"] = "DENY";
        }
        res.writeHead(200, headers);
        fs.createReadStream(filePath).pipe(res);
    });
}

const server = http.createServer(async function (req, res) {
    const url = new URL(req.url, "http://localhost");
    try {
        if (url.pathname.startsWith("/api/") && await handleApi(req, res, url)) return;
        if (url.pathname.startsWith("/api/")) {
            json(res, 404, { ok: false, error: "Not found" });
            return;
        }
        if (req.method !== "GET" && req.method !== "HEAD") {
            res.writeHead(405, { Allow: "GET, HEAD" }); res.end(); return;
        }
        serveStatic(req, res, url);
    } catch (error) {
        console.error(error);
        if (!res.headersSent) json(res, 500, { ok: false, error: "服务器内部错误" });
        else res.end();
    }
});

server.listen(PORT, HOST, function () {
    console.log("Maiying game server: http://" + HOST + ":" + PORT);
    if (!ADMIN_PASSWORD) console.warn("Creator dashboard login is disabled until CREATOR_PASSWORD is set.");
    if (!process.env.CREATOR_SESSION_SECRET) console.warn("Set CREATOR_SESSION_SECRET in production so sessions and share links survive restarts.");
});

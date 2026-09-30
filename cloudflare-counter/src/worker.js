import { CREATOR_PAGE, SHARED_PAGE } from "./pages.js";

const SESSION_COOKIE = "myf_creator_session";
const SESSION_AGE_SECONDS = 8 * 60 * 60;
const VALID_KEYWORDS = new Set([
  "海洋馆溺亡美人鱼案", "泊然海洋馆", "安伯然", "泊然集团", "安仲斌", "安永德", "贾剑明",
  "明通集团", "杏仁网", "mt集团", "蔚蓝传媒", "钱宏达", "海洋馆保安拾金不昧", "劳而得",
  "临时工溺亡", "b2025jd0718", "b2025jd0717"
]);

const encoder = new TextEncoder();

function normalizeKeyword(value) {
  return String(value || "").toLowerCase().replace(/[\s\p{P}]/gu, "");
}

function securityHeaders(contentType) {
  return {
    "Content-Type": contentType,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
  };
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...securityHeaders("application/json; charset=utf-8"), ...extraHeaders }
  });
}

function html(content) {
  return new Response(content, {
    headers: {
      ...securityHeaders("text/html; charset=utf-8"),
      "Content-Security-Policy": "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:"
    }
  });
}

function encodeBase64Url(value) {
  const bytes = encoder.encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(String(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return bytesToHex(await crypto.subtle.sign("HMAC", key, encoder.encode(String(value))));
}

function safeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  let different = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    different |= (a.charCodeAt(index % Math.max(a.length, 1)) || 0) ^ (b.charCodeAt(index % Math.max(b.length, 1)) || 0);
  }
  return different === 0;
}

function parseCookies(request) {
  return Object.fromEntries(
    String(request.headers.get("Cookie") || "")
      .split(";")
      .map((part) => {
        const index = part.indexOf("=");
        return index < 0 ? ["", ""] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
      })
      .filter(([name]) => name)
  );
}

function sessionCookie(value, maxAge, request) {
  const hostname = new URL(request.url).hostname;
  const secure = hostname !== "127.0.0.1" && hostname !== "localhost" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

async function signSession(env) {
  const payload = encodeBase64Url(JSON.stringify({ role: "creator", exp: Date.now() + SESSION_AGE_SECONDS * 1000 }));
  return `${payload}.${await hmacHex(env.CREATOR_SESSION_SECRET, payload)}`;
}

async function readSession(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token || !token.includes(".")) return null;
  const dot = token.lastIndexOf(".");
  const payload = token.slice(0, dot);
  const expected = await hmacHex(env.CREATOR_SESSION_SECRET, payload);
  if (!safeEqual(token.slice(dot + 1), expected)) return null;
  try {
    const parsed = JSON.parse(decodeBase64Url(payload));
    return parsed.role === "creator" && parsed.exp > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

async function requireAdmin(request, env) {
  return Boolean(await readSession(request, env));
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (origin !== env.GAME_ORIGIN) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

async function readJson(request) {
  if (Number(request.headers.get("Content-Length") || 0) > 32768) throw new Error("request too large");
  try { return await request.json(); }
  catch { throw new Error("invalid json"); }
}

async function statsSummary(env) {
  const summary = await env.DB.prepare(
    "SELECT total_players, first_qualified_at, last_qualified_at, updated_at FROM stats WHERE id = 1"
  ).first();
  const daily = await env.DB.prepare(
    "SELECT day AS date, count FROM daily_counts ORDER BY day DESC LIMIT 30"
  ).all();
  return {
    totalPlayers: Number(summary?.total_players || 0),
    firstQualifiedAt: summary?.first_qualified_at || null,
    lastQualifiedAt: summary?.last_qualified_at || null,
    updatedAt: summary?.updated_at || new Date().toISOString(),
    daily: (daily.results || []).reverse()
  };
}

async function handleQualify(request, env) {
  const cors = corsHeaders(request, env);
  if (!cors) return json({ ok: false, error: "origin not allowed" }, 403);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return json({ ok: false, error: "method not allowed" }, 405, { ...cors, Allow: "POST, OPTIONS" });

  try {
    const body = await readJson(request);
    const deviceId = String(body.deviceId || "");
    if (!/^[a-zA-Z0-9-]{16,100}$/.test(deviceId) || !VALID_KEYWORDS.has(normalizeKeyword(body.keyword))) {
      return json({ ok: false, error: "invalid qualification" }, 400, cors);
    }

    const deviceHash = await hmacHex(env.DEVICE_HASH_SALT, deviceId);
    const now = new Date().toISOString();
    const day = now.slice(0, 10);
    const insertion = await env.DB.prepare(
      "INSERT OR IGNORE INTO players(device_hash, qualified_at, qualified_day) VALUES (?1, ?2, ?3)"
    ).bind(deviceHash, now, day).run();
    const counted = Number(insertion.meta?.changes || 0) > 0;

    if (counted) {
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE stats SET total_players = total_players + 1, first_qualified_at = COALESCE(first_qualified_at, ?1), last_qualified_at = ?1, updated_at = ?1 WHERE id = 1"
        ).bind(now),
        env.DB.prepare(
          "INSERT INTO daily_counts(day, count) VALUES (?1, 1) ON CONFLICT(day) DO UPDATE SET count = count + 1"
        ).bind(day)
      ]);
    }
    return json({ ok: true, counted }, 200, cors);
  } catch (error) {
    return json({ ok: false, error: error.message || "invalid request" }, 400, cors);
  }
}

async function handleApi(request, env, url) {
  if (url.pathname === "/api/plays/qualify") return handleQualify(request, env);

  if (request.method === "GET" && url.pathname === "/api/creator/session") {
    return json({ ok: true, authenticated: await requireAdmin(request, env), configured: Boolean(env.CREATOR_PASSWORD) });
  }

  if (request.method === "POST" && url.pathname === "/api/creator/login") {
    try {
      const body = await readJson(request);
      const supplied = await hmacHex(env.CREATOR_SESSION_SECRET, body.password || "");
      const expected = await hmacHex(env.CREATOR_SESSION_SECRET, env.CREATOR_PASSWORD || "");
      if (!safeEqual(supplied, expected)) return json({ ok: false, error: "密码不正确" }, 401);
      const token = await signSession(env);
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token, SESSION_AGE_SECONDS, request) });
    } catch {
      return json({ ok: false, error: "请求格式不正确" }, 400);
    }
  }

  if (request.method === "POST" && url.pathname === "/api/creator/logout") {
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("", 0, request) });
  }

  if (request.method === "GET" && url.pathname === "/api/creator/stats") {
    if (!(await requireAdmin(request, env))) return json({ ok: false, error: "请先登录创作者后台" }, 401);
    return json({ ok: true, stats: await statsSummary(env) });
  }

  if (request.method === "GET" && url.pathname === "/api/creator/shares") {
    if (!(await requireAdmin(request, env))) return json({ ok: false, error: "请先登录创作者后台" }, 401);
    const rows = await env.DB.prepare(
      "SELECT id, label, created_at, expires_at, revoked_at FROM shares ORDER BY created_at DESC"
    ).all();
    const now = Date.now();
    return json({ ok: true, shares: (rows.results || []).map((share) => ({
      id: share.id,
      label: share.label,
      createdAt: share.created_at,
      expiresAt: share.expires_at,
      revokedAt: share.revoked_at,
      active: !share.revoked_at && Date.parse(share.expires_at) > now
    })) });
  }

  if (request.method === "POST" && url.pathname === "/api/creator/shares") {
    if (!(await requireAdmin(request, env))) return json({ ok: false, error: "请先登录创作者后台" }, 401);
    const body = await readJson(request);
    const label = String(body.label || "").trim().slice(0, 60);
    const days = Math.min(365, Math.max(1, Number(body.expiresInDays || 7)));
    if (!label) return json({ ok: false, error: "请填写分享对象备注" }, 400);
    const rawToken = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
    const tokenHash = await hmacHex(env.CREATOR_SESSION_SECRET, rawToken);
    const share = {
      id: crypto.randomUUID(),
      label,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + days * 86400000).toISOString()
    };
    await env.DB.prepare(
      "INSERT INTO shares(id, label, token_hash, created_at, expires_at, revoked_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL)"
    ).bind(share.id, share.label, tokenHash, share.createdAt, share.expiresAt).run();
    return json({ ok: true, share: { ...share, url: `/shared-stats.html?token=${rawToken}` } }, 201);
  }

  const revoke = url.pathname.match(/^\/api\/creator\/shares\/([a-f0-9-]+)$/i);
  if (request.method === "DELETE" && revoke) {
    if (!(await requireAdmin(request, env))) return json({ ok: false, error: "请先登录创作者后台" }, 401);
    const result = await env.DB.prepare(
      "UPDATE shares SET revoked_at = COALESCE(revoked_at, ?1) WHERE id = ?2"
    ).bind(new Date().toISOString(), revoke[1]).run();
    if (!Number(result.meta?.changes || 0)) return json({ ok: false, error: "分享记录不存在" }, 404);
    return json({ ok: true });
  }

  if (request.method === "GET" && url.pathname === "/api/shared/stats") {
    const token = String(url.searchParams.get("token") || "");
    if (!/^[a-f0-9]{64}$/.test(token)) return json({ ok: false, error: "分享链接无效、已过期或已被撤销" }, 403);
    const tokenHash = await hmacHex(env.CREATOR_SESSION_SECRET, token);
    const share = await env.DB.prepare(
      "SELECT label, expires_at, revoked_at FROM shares WHERE token_hash = ?1"
    ).bind(tokenHash).first();
    if (!share || share.revoked_at || Date.parse(share.expires_at) <= Date.now()) {
      return json({ ok: false, error: "分享链接无效、已过期或已被撤销" }, 403);
    }
    return json({ ok: true, stats: await statsSummary(env), share: { label: share.label, expiresAt: share.expires_at } });
  }

  return json({ ok: false, error: "Not found" }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    if (url.pathname === "/" || url.pathname === "/creator-stats.html") return html(CREATOR_PAGE);
    if (url.pathname === "/shared-stats.html") return html(SHARED_PAGE);
    return new Response("Not found", { status: 404, headers: securityHeaders("text/plain; charset=utf-8") });
  }
};

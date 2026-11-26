import type { Env } from "./env";

const COOKIE = "hb_admin";
const SESSION_HOURS = 12;
const enc = new TextEncoder();

const b64url = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

async function hmac(secret: string, data: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Compare two strings without leaking where they differ. */
export async function safeEqual(a: string, b: string) {
  const [ha, hb] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

const secretOf = (env: Env) => env.SESSION_SECRET || `derived:${env.ADMIN_PASSWORD}`;

export async function makeSessionCookie(env: Env, secure: boolean) {
  const exp = Date.now() + SESSION_HOURS * 3600_000;
  const payload = b64url(enc.encode(JSON.stringify({ exp })));
  const sig = await hmac(secretOf(env), payload);
  return `${COOKIE}=${payload}.${sig}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}${secure ? "; Secure" : ""}`;
}

export const clearCookie = (secure: boolean) => `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? "; Secure" : ""}`;

export async function isLoggedIn(request: Request, env: Env) {
  const raw = request.headers.get("Cookie") ?? "";
  const token = raw.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  if (!(await safeEqual(sig, await hmac(secretOf(env), payload)))) return false;
  try {
    const { exp } = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

// --- brute-force protection (per Worker instance, best effort) ---
const fails = new Map<string, { n: number; until: number }>();
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;

export function lockedFor(ip: string) {
  const f = fails.get(ip);
  return f && f.n >= MAX_FAILS && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 60_000) : 0;
}
export function recordFail(ip: string) {
  const f = fails.get(ip);
  const n = f && f.until > Date.now() ? f.n + 1 : 1;
  fails.set(ip, { n, until: Date.now() + LOCK_MS });
}
export const clearFails = (ip: string) => fails.delete(ip);

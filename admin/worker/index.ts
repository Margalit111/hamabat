import { clearCookie, clearFails, isLoggedIn, lockedFor, makeSessionCookie, recordFail, safeEqual } from "./auth";
import type { Env } from "./env";
import { GitHubError, github, type GitHub } from "./github";
import { validateContent } from "../shared/validate";
import type { SiteContent } from "../shared/types";

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers } });
const fail = (message: string, status = 400, extra: Record<string, unknown> = {}) => json({ error: message, ...extra }, status);

class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

async function repoState(env: Env, gh: GitHub) {
  const mainSha = await gh.branchSha(env.MAIN_BRANCH);
  if (!mainSha) throw new HttpError(500, "הענף הראשי לא נמצא בריפו");
  const draftSha = await gh.branchSha(env.DRAFT_BRANCH);
  let hasChanges = false;
  let files: string[] = [];
  if (draftSha) {
    const cmp = await gh.compare(env.MAIN_BRANCH, env.DRAFT_BRANCH);
    hasChanges = cmp.ahead > 0;
    files = cmp.files;
    // nothing pending and main moved on (e.g. the nightly rebuild): start the draft from the latest main
    if (!hasChanges && cmp.behind > 0) await gh.resetBranch(env.DRAFT_BRANCH, mainSha);
  }
  return { mainSha, draftExists: !!draftSha, hasChanges, files };
}

async function ensureDraft(env: Env, gh: GitHub) {
  const st = await repoState(env, gh);
  if (!st.draftExists) await gh.createBranch(env.DRAFT_BRANCH, st.mainSha);
  return st;
}

const links = (env: Env) => ({ siteUrl: env.SITE_URL || "", previewUrl: env.PREVIEW_URL || "" });

async function readBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "הבקשה אינה תקינה");
  }
}

async function route(request: Request, env: Env, url: URL): Promise<Response> {
  const { pathname } = url;
  const method = request.method;
  const secure = url.protocol === "https:";
  const ip = request.headers.get("cf-connecting-ip") || "local";

  if (!env.ADMIN_PASSWORD || !env.GITHUB_TOKEN) throw new HttpError(500, "המערכת עדיין לא הוגדרה: חסרים הסיסמה או אסימון GitHub (סודות ב־Cloudflare)");

  // --- login / logout (no session needed) ---
  if (pathname === "/api/login" && method === "POST") {
    const wait = lockedFor(ip);
    if (wait) throw new HttpError(429, `יותר מדי ניסיונות. אפשר לנסות שוב בעוד ${wait} דקות`);
    const { password } = await readBody<{ password?: string }>(request);
    if (!password || !(await safeEqual(password, env.ADMIN_PASSWORD))) {
      recordFail(ip);
      await new Promise((r) => setTimeout(r, 700));
      throw new HttpError(401, "הסיסמה שגויה");
    }
    clearFails(ip);
    return json({ ok: true }, 200, { "Set-Cookie": await makeSessionCookie(env, secure) });
  }
  if (pathname === "/api/logout" && method === "POST") return json({ ok: true }, 200, { "Set-Cookie": clearCookie(secure) });

  // --- everything else needs a session ---
  if (!(await isLoggedIn(request, env))) throw new HttpError(401, "צריך להתחבר");
  if (method !== "GET" && request.headers.get("X-Requested-With") !== "hamabat") throw new HttpError(403, "בקשה לא מורשית");

  if (pathname === "/api/session" && method === "GET") return json({ ok: true });

  const gh = github(env);

  if (pathname === "/api/status" && method === "GET") {
    const st = await repoState(env, gh);
    return json({ hasChanges: st.hasChanges, files: st.files, ...links(env) });
  }

  if (pathname === "/api/content" && method === "GET") {
    const st = await repoState(env, gh);
    const file = await gh.getFile(env.CONTENT_PATH, st.draftExists ? env.DRAFT_BRANCH : env.MAIN_BRANCH);
    if (!file) throw new HttpError(500, "קובץ התוכן לא נמצא בריפו");
    return json({ content: JSON.parse(file.text), sha: file.sha, hasChanges: st.hasChanges, ...links(env) });
  }

  if (pathname === "/api/content" && method === "PUT") {
    const { content, sha } = await readBody<{ content?: SiteContent; sha?: string }>(request);
    if (!content || !sha) throw new HttpError(400, "חסר תוכן לשמירה");
    const v = validateContent(content);
    if (v.errors.length) throw new HttpError(422, "יש שדות שצריך לתקן לפני השמירה", { errors: v.errors });
    await ensureDraft(env, gh);
    const current = await gh.getFile(env.CONTENT_PATH, env.DRAFT_BRANCH);
    if (!current) throw new HttpError(500, "קובץ התוכן לא נמצא");
    if (current.sha !== sha) throw new HttpError(409, "התוכן שונה בינתיים ממקום אחר. יש לטעון מחדש את הדף לפני שממשיכים");
    const text = JSON.stringify(content, null, 2) + "\n";
    if (text === current.text) return json({ sha: current.sha, saved: false, warnings: v.warnings });
    const r = await gh.putFile(env.CONTENT_PATH, text, "עדכון תוכן מהמערכת", env.DRAFT_BRANCH, current.sha);
    return json({ sha: r.sha, saved: true, warnings: v.warnings });
  }

  if (pathname === "/api/images" && method === "POST") {
    const { name, data } = await readBody<{ name?: string; data?: string }>(request);
    if (!name || !data) throw new HttpError(400, "חסרה תמונה");
    const ext = /\.(jpe?g|png)$/i.exec(name)?.[1]?.toLowerCase();
    if (!ext) throw new HttpError(400, "אפשר להעלות רק קבצי JPG או PNG");
    if (data.length > 6_500_000) throw new HttpError(413, "התמונה גדולה מדי (עד 4MB)");
    const head = atob(data.slice(0, 16));
    const isJpg = head.charCodeAt(0) === 0xff && head.charCodeAt(1) === 0xd8;
    const isPng = head.slice(1, 4) === "PNG";
    if (!isJpg && !isPng) throw new HttpError(400, "הקובץ אינו תמונת JPG או PNG תקינה");
    const base = name.replace(/\.[^.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "poster";
    const file = `${base}-${Date.now().toString(36)}.${isPng ? "png" : "jpg"}`;
    await ensureDraft(env, gh);
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    await gh.putFile(`${env.UPLOAD_DIR}/${file}`, bytes, `העלאת תמונה ${file}`, env.DRAFT_BRANCH);
    return json({ path: `assets/uploads/${file}` });
  }

  if (pathname === "/api/publish" && method === "POST") {
    const st = await repoState(env, gh);
    if (!st.hasChanges) throw new HttpError(400, "אין שינויים לפרסום");
    const file = await gh.getFile(env.CONTENT_PATH, env.DRAFT_BRANCH);
    if (file) {
      const v = validateContent(JSON.parse(file.text));
      if (v.errors.length) throw new HttpError(422, "אי אפשר לפרסם: יש שדות שצריך לתקן", { errors: v.errors });
    }
    try {
      await gh.merge(env.MAIN_BRANCH, env.DRAFT_BRANCH, "פרסום שינויים מהמערכת");
    } catch (e) {
      if (e instanceof GitHubError && e.status === 409) throw new HttpError(409, "יש התנגשות עם שינוי שנעשה ישירות באתר. אפשר ללחוץ על ביטול שינויים ולבצע אותם מחדש");
      throw e;
    }
    const mainSha = await gh.branchSha(env.MAIN_BRANCH);
    if (mainSha) await gh.resetBranch(env.DRAFT_BRANCH, mainSha);
    return json({ ok: true });
  }

  if (pathname === "/api/discard" && method === "POST") {
    await gh.deleteBranch(env.DRAFT_BRANCH);
    return json({ ok: true });
  }

  if (pathname === "/api/history" && method === "GET") {
    return json({ commits: await gh.commits(env.CONTENT_PATH, env.MAIN_BRANCH) });
  }

  if (pathname === "/api/restore" && method === "POST") {
    const { sha } = await readBody<{ sha?: string }>(request);
    if (!sha || !/^[0-9a-f]{7,40}$/.test(sha)) throw new HttpError(400, "גרסה לא תקינה");
    const old = await gh.getFile(env.CONTENT_PATH, sha);
    if (!old) throw new HttpError(404, "הגרסה לא נמצאה");
    await ensureDraft(env, gh);
    const current = await gh.getFile(env.CONTENT_PATH, env.DRAFT_BRANCH);
    if (!current) throw new HttpError(500, "קובץ התוכן לא נמצא");
    if (old.text !== current.text) await gh.putFile(env.CONTENT_PATH, old.text, "שחזור גרסה קודמת", env.DRAFT_BRANCH, current.sha);
    return json({ ok: true });
  }

  throw new HttpError(404, "לא נמצא");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await route(request, env, new URL(request.url));
    } catch (e) {
      if (e instanceof HttpError) return fail(e.message, e.status, e.extra);
      if (e instanceof GitHubError) {
        const msg = e.status === 401 || e.status === 403 ? "אין הרשאה ל־GitHub. צריך לבדוק את האסימון של המערכת" : `שגיאה בתקשורת עם GitHub (${e.message})`;
        return fail(msg, 502);
      }
      console.error(e);
      return fail("אירעה שגיאה לא צפויה", 500);
    }
  },
} satisfies ExportedHandler<Env>;

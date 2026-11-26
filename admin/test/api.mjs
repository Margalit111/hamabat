// API test: the real Worker (wrangler dev, local) against a fake GitHub. Run: node test/api.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
import { startFakeGithub } from "./fake-github.mjs";

const site = JSON.parse(fs.readFileSync(new URL("../../website/content/site.json", import.meta.url), "utf8"));
const PORT = 8790;
const gh = await startFakeGithub(site);
fs.writeFileSync(new URL("../.dev.vars", import.meta.url), "ADMIN_PASSWORD=correct-horse\nGITHUB_TOKEN=test-token\nSESSION_SECRET=test-secret\n");
const wr = spawn("npx", ["wrangler", "dev", "--local", "--port", String(PORT), "--var", "GITHUB_API_BASE:http://localhost:8799", "--var", "PREVIEW_URL:https://preview.example"], { cwd: new URL("..", import.meta.url).pathname, stdio: ["ignore", "pipe", "pipe"] });
let out = "";
wr.stdout.on("data", (d) => (out += d)); wr.stderr.on("data", (d) => (out += d));
for (let i = 0; i < 90 && !out.includes("Ready on"); i++) await new Promise((r) => setTimeout(r, 500));
if (!out.includes("Ready on")) { console.log(out); process.exit(1); }

let cookie = "";
const H = { "Content-Type": "application/json", "X-Requested-With": "hamabat" };
const call = async (method, path, body, opts = {}) => {
  const res = await fetch(`http://localhost:${PORT}${path}`, { method, headers: { ...(opts.noHeader ? {} : H), ...(cookie ? { Cookie: cookie } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const sc = res.headers.get("set-cookie"); if (sc) cookie = sc.split(";")[0];
  return { status: res.status, data: await res.json().catch(() => null) };
};
let fails = 0;
const ok = (name, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + extra}`); if (!cond) fails++; };

try {
  let r = await call("GET", "/api/content"); ok("no session -> 401", r.status === 401);
  r = await call("POST", "/api/login", { password: "wrong" }); ok("wrong password -> 401", r.status === 401, JSON.stringify(r));
  r = await call("POST", "/api/login", { password: "correct-horse" }); ok("login ok + cookie", r.status === 200 && cookie.startsWith("hb_admin="), JSON.stringify(r));
  r = await call("GET", "/api/content"); ok("read content (no changes yet)", r.status === 200 && r.data.hasChanges === false && r.data.content.courses.length === 4, JSON.stringify(r).slice(0, 200));
  let sha = r.data.sha; const content = r.data.content;
  r = await call("PUT", "/api/content", { content, sha }, { noHeader: true }); ok("PUT without CSRF header -> 401/403", r.status === 403 || r.status === 401, r.status);
  const edited = structuredClone(content); edited.courses[2].title = "קורס לפני לידה (עודכן)"; edited.courses[2].startDate = "2027-02-14";
  r = await call("PUT", "/api/content", { content: edited, sha }); ok("save draft", r.status === 200 && r.data.saved === true, JSON.stringify(r));
  const sha2 = r.data.sha;
  ok("draft branch created from main", !!gh.branches.draft && gh.branches.main.files["website/content/site.json"].sha === sha);
  r = await call("PUT", "/api/content", { content: edited, sha }); ok("stale sha -> 409", r.status === 409, JSON.stringify(r));
  const bad = structuredClone(edited); bad.courses[2].startDate = "2027-02-30";
  r = await call("PUT", "/api/content", { content: bad, sha: sha2 }); ok("invalid date -> 422 with message", r.status === 422 && r.data.errors.some((e) => e.includes("תאריך")), JSON.stringify(r));
  const dup = structuredClone(edited); dup.courses[3].id = "prep";
  r = await call("PUT", "/api/content", { content: dup, sha: sha2 }); ok("duplicate id -> 422", r.status === 422);
  r = await call("PUT", "/api/content", { content: edited, sha: sha2 }); ok("saving identical content makes no commit", r.status === 200 && r.data.saved === false);
  r = await call("GET", "/api/status"); ok("status: has changes + preview link", r.data.hasChanges === true && r.data.previewUrl === "https://preview.example" && r.data.files.includes("website/content/site.json"), JSON.stringify(r));
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(40, 1)]).toString("base64");
  r = await call("POST", "/api/images", { name: "My Poster (1).PNG", data: png }); ok("image upload -> safe file name", r.status === 200 && /^assets\/uploads\/my-poster-1-[a-z0-9]+\.png$/.test(r.data.path), JSON.stringify(r));
  ok("image committed to draft", Object.keys(gh.branches.draft.files).some((f) => f.startsWith("website/public/assets/uploads/my-poster")));
  r = await call("POST", "/api/images", { name: "evil.png", data: Buffer.from("<script>alert(1)</script>").toString("base64") }); ok("fake image rejected", r.status === 400);
  r = await call("POST", "/api/images", { name: "doc.pdf", data: png }); ok("wrong extension rejected", r.status === 400);
  r = await call("POST", "/api/publish"); ok("publish", r.status === 200, JSON.stringify(r));
  ok("main now has the edit", JSON.parse(Buffer.from(gh.branches.main.files["website/content/site.json"].content, "base64").toString()).courses[2].title.includes("עודכן"));
  r = await call("GET", "/api/status"); ok("after publish: no pending changes", r.data.hasChanges === false);
  r = await call("POST", "/api/publish"); ok("publish with nothing -> 400", r.status === 400);
  r = await call("GET", "/api/content"); sha = r.data.sha; const c2 = structuredClone(r.data.content); c2.contact.phone = "050-1112233";
  await call("PUT", "/api/content", { content: c2, sha });
  r = await call("POST", "/api/discard"); ok("discard", r.status === 200);
  r = await call("GET", "/api/content"); ok("after discard: back to published content", r.data.hasChanges === false && r.data.content.contact.phone !== "050-1112233");
  r = await call("GET", "/api/history"); ok("history lists versions", r.data.commits.length >= 2, JSON.stringify(r).slice(0, 200));
  const first = r.data.commits.at(-1).sha;
  r = await call("POST", "/api/restore", { sha: first }); ok("restore old version into draft", r.status === 200, JSON.stringify(r));
  r = await call("GET", "/api/content"); ok("restored content is the old one, pending", r.data.hasChanges === true && !r.data.content.courses[2].title.includes("עודכן"));
  gh.branches.main.__conflict = true;
  r = await call("POST", "/api/publish"); ok("merge conflict -> clear message (409)", r.status === 409 && r.data.error.includes("התנגשות"), JSON.stringify(r));
  r = await call("POST", "/api/logout"); cookie = "";
  for (let i = 0; i < 5; i++) await call("POST", "/api/login", { password: "x" + i });
  r = await call("POST", "/api/login", { password: "correct-horse" }); ok("brute force lock after 5 failures -> 429", r.status === 429, JSON.stringify(r));
} finally {
  wr.kill("SIGTERM"); gh.close(); fs.rmSync(new URL("../.dev.vars", import.meta.url), { force: true });
}
console.log(fails ? `\n${fails} FAILED` : "\nALL API TESTS PASSED");
process.exit(fails ? 1 : 0);

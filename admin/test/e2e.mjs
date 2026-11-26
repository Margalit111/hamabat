// End-to-end test of the admin UI: real Worker (wrangler dev) + real built React app + fake GitHub + Chromium.
import { spawn } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // global Playwright (NODE_PATH); not a project dependency
import { startFakeGithub } from "./fake-github.mjs";

const site = JSON.parse(fs.readFileSync(new URL("../../website/content/site.json", import.meta.url), "utf8"));
const PORT = 8791;
const gh = await startFakeGithub(site);
fs.writeFileSync(new URL("../.dev.vars", import.meta.url), "ADMIN_PASSWORD=correct-horse\nGITHUB_TOKEN=test-token\nSESSION_SECRET=s\n");
const wr = spawn("npx", ["wrangler", "dev", "--local", "--port", String(PORT), "--var", "GITHUB_API_BASE:http://localhost:8799", "--var", "PREVIEW_URL:https://preview.example/"], { cwd: new URL("..", import.meta.url).pathname, stdio: ["ignore", "pipe", "pipe"] });
let out = "";
wr.stdout.on("data", (d) => (out += d)); wr.stderr.on("data", (d) => (out += d));
for (let i = 0; i < 90 && !out.includes("Ready on"); i++) await new Promise((r) => setTimeout(r, 500));
if (!out.includes("Ready on")) { console.log(out); process.exit(1); }

let fails = 0;
const ok = (name, cond, extra = "") => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond ? "" : "  -> " + extra}`); if (!cond) fails++; };
const browser = await chromium.launch();
const errs = [];
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/status of (401|422)/.test(m.text())) errs.push("console: " + m.text()); });
  page.on("dialog", (d) => d.accept());
  await page.goto(`http://localhost:${PORT}/`);
  ok("login screen shown first", await page.getByRole("heading", { name: "מערכת הניהול של מבט" }).isVisible());
  await page.getByLabel("סיסמה").fill("wrong"); await page.getByRole("button", { name: "כניסה" }).click();
  await page.getByText("הסיסמה שגויה").waitFor(); ok("wrong password shows an error", true);
  await page.getByLabel("סיסמה").fill("correct-horse"); await page.getByRole("button", { name: "כניסה" }).click();
  await page.getByRole("heading", { name: "האתר מעודכן" }).waitFor();
  ok("after login: site is up to date", true);

  await page.getByRole("button", { name: "קורסים", exact: true }).click();
  ok("courses list shows all 4 courses", (await page.locator(".card h3").count()) === 4);
  await page.locator(".card", { hasText: "קורס לפני לידה" }).getByRole("button", { name: "עריכה" }).click();
  await page.getByLabel("שם הקורס").fill("קורס לפני לידה - חדש");
  await page.getByLabel("תאריך התחלה").fill("2027-02-14");
  await page.getByLabel("מקום", { exact: true }).fill("ירושלים");
  ok("save bar appears with unsaved changes", await page.getByRole("button", { name: "שמירה כטיוטה" }).isVisible());
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByText("נשמר כטיוטה").first().waitFor();
  ok("saved as draft on the draft branch", !!gh.branches.draft && JSON.parse(Buffer.from(gh.branches.draft.files["website/content/site.json"].content, "base64").toString()).courses[2].startDate === "2027-02-14");
  ok("live (main) content untouched", JSON.parse(Buffer.from(gh.branches.main.files["website/content/site.json"].content, "base64").toString()).courses[2].title === "קורס לפני לידה");

  // validation error shown in Hebrew
  await page.getByLabel("תאריך התחלה").fill("2027-02-14");
  await page.getByLabel("טלפון להרשמה").fill("abc");
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByRole("alert").waitFor();
  ok("invalid phone is explained in Hebrew and not saved", (await page.getByRole("alert").innerText()).includes("טלפון ההרשמה"));
  await page.getByLabel("טלפון להרשמה").fill("052-7159907");
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByText("נשמר כטיוטה").first().waitFor();

  // poster upload
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");
  const up = page.waitForResponse((r) => r.url().endsWith("/api/images"));
  await page.locator('input[type=file]').setInputFiles({ name: "Poster Test.png", mimeType: "image/png", buffer: png });
  const upRes = await up; if (upRes.status() !== 200) console.log("upload status", upRes.status(), await upRes.text());
  await page.getByLabel("תיאור הפוסטר (חובה)").waitFor();
  ok("poster uploaded to the draft branch", Object.keys(gh.branches.draft.files).some((f) => /uploads\/poster-test-/.test(f)));
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByRole("alert").waitFor();
  ok("poster without a description is refused", (await page.getByRole("alert").innerText()).includes("תיאור קצר לפוסטר"));
  await page.getByLabel("תיאור הפוסטר (חובה)").fill("פוסטר בדיקה");
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByText("נשמר כטיוטה").first().waitFor();

  // meeting + team + contact
  await page.getByRole("button", { name: "מפגש ייעוץ", exact: true }).click();
  await page.getByLabel("נושא המפגש").fill("נושא חדש");
  await page.getByRole("button", { name: "צוות", exact: true }).click();
  await page.getByRole("button", { name: "הוספת איש צוות" }).click();
  await page.getByRole("button", { name: "פרטי קשר", exact: true }).click();
  await page.getByLabel("טלפון", { exact: true }).fill("050-1234567");
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByRole("alert").waitFor();
  ok("team member without name/role is refused", (await page.getByRole("alert").innerText()).includes("איש הצוות"));
  await page.getByRole("button", { name: "צוות", exact: true }).click();
  await page.getByRole("button", { name: "מחיקה" }).last().click();
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByText("נשמר כטיוטה").first().waitFor();

  // publish
  await page.getByRole("button", { name: "בית", exact: true }).click();
  await page.getByRole("heading", { name: "יש שינויים שמחכים לפרסום" }).waitFor();
  ok("home shows pending changes + preview link", (await page.getByRole("link", { name: "תצוגה מקדימה" }).getAttribute("href")) === "https://preview.example/");
  await page.getByRole("button", { name: "פרסום באתר" }).click();
  await page.getByText("השינויים פורסמו").waitFor();
  const main = JSON.parse(Buffer.from(gh.branches.main.files["website/content/site.json"].content, "base64").toString());
  ok("publish merged everything into main", main.courses[2].title === "קורס לפני לידה - חדש" && main.contact.phone === "050-1234567" && main.meeting.topic === "נושא חדש" && main.experts.length === 6);
  ok("poster file reached main", Object.keys(gh.branches.main.files).some((f) => /uploads\/poster-test-/.test(f)));
  await page.getByRole("heading", { name: "האתר מעודכן" }).waitFor();

  // new course, duplicate, hide
  await page.getByRole("button", { name: "קורסים", exact: true }).click();
  await page.getByRole("button", { name: "קורס חדש" }).click();
  await page.getByLabel("שם הקורס").fill("קורס שנוסף עכשיו");
  await page.getByLabel("תקציר (משפט אחד)").fill("תקציר");
  await page.getByLabel("תיאור", { exact: true }).first().fill("תיאור קצר");
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByText("נשמר כטיוטה").first().waitFor();
  await page.getByRole("button", { name: "→ חזרה לרשימת הקורסים" }).click();
  ok("new course in the list", await page.getByRole("heading", { name: "קורס שנוסף עכשיו" }).isVisible());
  await page.locator(".card", { hasText: "קורס שנוסף עכשיו" }).getByRole("button", { name: "הסתרה מהאתר" }).click();
  await page.getByRole("button", { name: "שמירה כטיוטה" }).click();
  await page.getByText("נשמר כטיוטה").first().waitFor();
  ok("hide button works", await page.locator(".card", { hasText: "קורס שנוסף עכשיו" }).locator(".tag.hidden").isVisible());

  // discard
  await page.getByRole("button", { name: "בית", exact: true }).click();
  await page.getByRole("button", { name: "ביטול השינויים" }).click();
  await page.getByText("השינויים בוטלו").waitFor();
  await page.getByRole("button", { name: "קורסים", exact: true }).click();
  ok("discard removed the unpublished course", (await page.locator(".card h3").count()) === 4);

  // history
  await page.getByRole("button", { name: "גרסאות", exact: true }).click();
  await page.getByText("הגרסה הנוכחית").waitFor();
  ok("history shows several versions", (await page.getByRole("button", { name: "שחזור" }).count()) >= 1);

  // logout
  await page.getByRole("button", { name: "יציאה" }).click();
  await page.getByRole("heading", { name: "מערכת הניהול של מבט" }).waitFor(); ok("logout returns to the login screen", true);
  ok("no JavaScript errors in the browser", errs.length === 0, errs.join("; "));
  await page.setViewportSize({ width: 390, height: 800 });
  await page.getByLabel("סיסמה").fill("correct-horse"); await page.getByRole("button", { name: "כניסה" }).click();
  await page.waitForTimeout(2000);
  console.log("after mobile login:", (await page.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 300));
  await page.screenshot({ path: process.argv[2] || "/tmp/admin-mobile.png" });
  await page.getByRole("heading", { name: "האתר מעודכן" }).waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  ok("mobile width: no horizontal scrolling", !overflow);
  await page.screenshot({ path: process.argv[2] || "/tmp/admin-mobile.png" });
} finally {
  await browser.close(); wr.kill("SIGTERM"); gh.close(); fs.rmSync(new URL("../.dev.vars", import.meta.url), { force: true });
}
console.log(fails ? `\n${fails} FAILED` : "\nALL UI TESTS PASSED");
process.exit(fails ? 1 : 0);

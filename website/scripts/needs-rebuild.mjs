// Used by the nightly GitHub Action. Decides whether the site must be rebuilt tonight.
//
// The site is static: things that depend on the date (the upcoming consultation meeting after its
// date / `meeting.hideAfter`, a course after its `hideAfter`) only change when the site is built again.
// This script says "rebuild" when such a date passed since the last night.
//
//   FORCE=true      rebuild no matter what (manual run)
//   TODAY=YYYY-MM-DD  override today's date (for testing)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "content/site.json"), "utf8"));

const today =
  process.env.TODAY ||
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());

const yesterday = new Date(`${today}T12:00:00Z`);
yesterday.setUTCDate(yesterday.getUTCDate() - 1);
const y = yesterday.toISOString().slice(0, 10);

const reasons = [];
if (process.env.FORCE === "true") reasons.push("manual run (force)");
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const m = data.meeting;
const meetingLastDay = m?.hideAfter || (ISO.test(m?.date ?? "") ? m.date : undefined);
if (m?.show && meetingLastDay === y) reasons.push(`the meeting ended yesterday (${y})`);
for (const c of data.courses ?? []) {
  if (c.status !== "hidden" && c.hideAfter === y) reasons.push(`course "${c.id}" expired yesterday (${y})`);
}

const rebuild = reasons.length > 0;
console.log(`today (Israel): ${today}`);
console.log(rebuild ? `rebuild needed: ${reasons.join(", ")}` : "nothing expired - no rebuild needed");
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `rebuild=${rebuild}\n`);

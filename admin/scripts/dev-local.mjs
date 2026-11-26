// Runs the admin panel locally in a SAFE sandbox: the real Worker + the built UI, but a fake GitHub
// (in memory) instead of your real repository. Nothing you do here touches GitHub or the live site.
//   cd admin && npm run dev:local     ->   http://localhost:8787   (password: demo)
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { startFakeGithub } from "../test/fake-github.mjs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const shell = process.platform === "win32";
const site = JSON.parse(fs.readFileSync(new URL("../../website/content/site.json", import.meta.url), "utf8"));

console.log("1/3 building the admin UI...");
const b = spawnSync("npx", ["vite", "build"], { cwd: root, stdio: "inherit", shell });
if (b.status !== 0) process.exit(1);

console.log("2/3 starting a fake GitHub (in memory)...");
const gh = await startFakeGithub(site);
fs.writeFileSync(new URL("../.dev.vars", import.meta.url), "ADMIN_PASSWORD=demo\nGITHUB_TOKEN=test-token\nSESSION_SECRET=local-demo\n");

console.log("3/3 starting the admin panel...\n");
const wr = spawn("npx", ["wrangler", "dev", "--local", "--port", "8787", "--var", "GITHUB_API_BASE:http://localhost:8799", "--var", "SITE_URL:http://localhost:3000", "--var", "PREVIEW_URL:http://localhost:3000"], { cwd: root, stdio: "inherit", shell });
const stop = () => { wr.kill(); gh.close(); fs.rmSync(new URL("../.dev.vars", import.meta.url), { force: true }); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
wr.on("exit", stop);
console.log("\n>>> Admin panel: http://localhost:8787   password: demo   (changes stay in memory only; Ctrl+C to stop)");

// A tiny fake of the GitHub REST API (only what the admin uses), for local tests.
// Branches are simple snapshots {files: {path: {content(base64), sha}}, commits: [...]}.
import http from "node:http";
import crypto from "node:crypto";

export function startFakeGithub(initialSite, port = 8799) {
  const sha = (s) => crypto.createHash("sha1").update(s).digest("hex");
  let n = 0;
  const mkCommit = (message, parent) => ({ sha: sha(`c${n++}${message}`), message, parent, date: new Date().toISOString() });
  const base = mkCommit("initial", null);
  const snap = (files, commits) => ({ files: { ...files }, commits: [...commits] });
  const mainFiles = { "website/content/site.json": { content: Buffer.from(JSON.stringify(initialSite, null, 2) + "\n").toString("base64") } };
  mainFiles["website/content/site.json"].sha = sha(mainFiles["website/content/site.json"].content);
  base.files = { ...mainFiles };
  const branches = { main: snap(mainFiles, [base]) };
  const log = [];

  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      const url = new URL(req.url, "http://x");
      const p = url.pathname.replace(/^\/repos\/[^/]+\/[^/]+/, "");
      const send = (status, data) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(data === undefined ? "" : JSON.stringify(data)); };
      const b = body ? JSON.parse(body) : {};
      log.push(`${req.method} ${p}`);
      if (req.headers.authorization !== "Bearer test-token") return send(401, { message: "Bad credentials" });
      let m;
      if ((m = p.match(/^\/git\/ref\/heads\/(.+)$/)) && req.method === "GET") {
        const br = branches[decodeURIComponent(m[1])];
        return br ? send(200, { object: { sha: br.commits.at(-1).sha } }) : send(404, { message: "Not Found" });
      }
      if (p === "/git/refs" && req.method === "POST") {
        const name = b.ref.replace("refs/heads/", "");
        const src = Object.values(branches).find((x) => x.commits.at(-1).sha === b.sha);
        branches[name] = snap(src.files, src.commits);
        return send(201, {});
      }
      if ((m = p.match(/^\/git\/refs\/heads\/(.+)$/))) {
        const name = decodeURIComponent(m[1]);
        if (req.method === "PATCH") {
          const src = Object.values(branches).find((x) => x.commits.at(-1).sha === b.sha);
          branches[name] = snap(src.files, src.commits);
          return send(200, {});
        }
        if (req.method === "DELETE") { delete branches[name]; return send(204); }
      }
      if ((m = p.match(/^\/contents\/(.+)$/))) {
        const path = decodeURIComponent(m[1]);
        if (req.method === "GET") {
          const ref = url.searchParams.get("ref");
          let br = branches[ref];
          if (!br) br = Object.values(branches).find((x) => x.commits.some((c) => c.sha === ref));
          const f = br?.files[path];
          if (!f) return send(404, { message: "Not Found" });
          const atCommit = br.commits.find((c) => c.sha === ref)?.files?.[path];
          return send(200, { type: "file", content: (atCommit ?? f).content, sha: (atCommit ?? f).sha });
        }
        if (req.method === "PUT") {
          const br = branches[b.branch];
          if (!br) return send(404, { message: "Branch not found" });
          const cur = br.files[path];
          if (cur && cur.sha !== b.sha) return send(409, { message: `${path} does not match ${cur.sha}` });
          const file = { content: b.content, sha: sha(b.content) };
          br.files[path] = file;
          const c = mkCommit(b.message, br.commits.at(-1).sha);
          c.files = { ...Object.fromEntries(Object.entries(br.files)) };
          br.commits.push(c);
          return send(200, { content: { sha: file.sha }, commit: { sha: c.sha } });
        }
      }
      if ((m = p.match(/^\/compare\/(.+)\.\.\.(.+)$/))) {
        const A = branches[decodeURIComponent(m[1])], B = branches[decodeURIComponent(m[2])];
        const aSet = new Set(A.commits.map((c) => c.sha)), bSet = new Set(B.commits.map((c) => c.sha));
        const ahead = B.commits.filter((c) => !aSet.has(c.sha)).length;
        const behind = A.commits.filter((c) => !bSet.has(c.sha)).length;
        const files = Object.keys(B.files).filter((f) => A.files[f]?.sha !== B.files[f].sha).map((filename) => ({ filename }));
        return send(200, { ahead_by: ahead, behind_by: behind, files });
      }
      if (p === "/merges" && req.method === "POST") {
        const A = branches[b.base], B = branches[b.head];
        if (A.__conflict) return send(409, { message: "Merge conflict" });
        A.files = { ...A.files, ...B.files };
        const c = mkCommit(b.commit_message, A.commits.at(-1).sha);
        c.files = { ...A.files };
        A.commits.push(c, ...B.commits.filter((x) => !A.commits.some((y) => y.sha === x.sha)));
        return send(201, { sha: c.sha });
      }
      if (p === "/commits" && req.method === "GET") {
        const br = branches[url.searchParams.get("sha")];
        return send(200, br.commits.slice().reverse().map((c) => ({ sha: c.sha, commit: { message: c.message, author: { name: "x", date: c.date } } })));
      }
      send(404, { message: `unhandled ${req.method} ${p}` });
    });
  });
  return new Promise((resolve) => server.listen(port, () => resolve({ server, branches, log, close: () => server.close() })));
}

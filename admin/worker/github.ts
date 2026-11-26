import type { Env } from "./env";

export class GitHubError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const utf8 = new TextEncoder();
export function toBase64(text: string | Uint8Array) {
  const bytes = typeof text === "string" ? utf8.encode(text) : text;
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export function fromBase64(b64: string) {
  const bin = atob(b64.replace(/\s/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function github(env: Env) {
  const base = env.GITHUB_API_BASE || "https://api.github.com";
  const repo = env.GITHUB_REPO;
  const author = { name: "מערכת הניהול של מבט", email: "admin@users.noreply.github.com" };

  async function call(method: string, path: string, body?: unknown, okStatuses: number[] = []) {
    const res = await fetch(`${base}/repos/${repo}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "hamabat-admin",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok || okStatuses.includes(res.status)) {
      return res.status === 204 ? null : ((await res.json().catch(() => null)) as any);
    }
    let msg = res.statusText;
    try {
      msg = ((await res.json()) as any).message ?? msg;
    } catch {
      /* ignore */
    }
    throw new GitHubError(res.status, msg);
  }

  const encPath = (p: string) => p.split("/").map(encodeURIComponent).join("/");

  return {
    /** Commit sha of a branch, or null if it does not exist. */
    async branchSha(branch: string): Promise<string | null> {
      const r = await call("GET", `/git/ref/heads/${encodeURIComponent(branch)}`, undefined, [404]);
      return r?.object?.sha ?? null;
    },
    async createBranch(branch: string, sha: string) {
      await call("POST", "/git/refs", { ref: `refs/heads/${branch}`, sha });
    },
    async resetBranch(branch: string, sha: string) {
      await call("PATCH", `/git/refs/heads/${encodeURIComponent(branch)}`, { sha, force: true });
    },
    async deleteBranch(branch: string) {
      await call("DELETE", `/git/refs/heads/${encodeURIComponent(branch)}`, undefined, [404, 422]);
    },
    async getFile(path: string, ref: string): Promise<{ text: string; sha: string } | null> {
      const r = await call("GET", `/contents/${encPath(path)}?ref=${encodeURIComponent(ref)}`, undefined, [404]);
      if (!r || Array.isArray(r)) return null;
      return { text: fromBase64(r.content), sha: r.sha };
    },
    async putFile(path: string, content: string | Uint8Array, message: string, branch: string, sha?: string) {
      const r = await call("PUT", `/contents/${encPath(path)}`, {
        message, branch, sha, content: toBase64(content), committer: author, author,
      });
      return { sha: r.content.sha as string, commit: r.commit.sha as string };
    },
    /** How far `head` is ahead of / behind `base`, and which files differ. */
    async compare(base: string, head: string) {
      const r = await call("GET", `/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`);
      return { ahead: r.ahead_by as number, behind: r.behind_by as number, files: (r.files ?? []).map((f: any) => f.filename as string) };
    },
    async merge(base: string, head: string, message: string) {
      return call("POST", "/merges", { base, head, commit_message: message }, [204]);
    },
    async commits(path: string, branch: string, perPage = 20) {
      const r = await call("GET", `/commits?sha=${encodeURIComponent(branch)}&path=${encodeURIComponent(path)}&per_page=${perPage}`);
      return (r as any[]).map((c) => ({
        sha: c.sha as string,
        date: c.commit.author.date as string,
        message: (c.commit.message as string).split("\n")[0],
        author: c.commit.author.name as string,
      }));
    },
  };
}
export type GitHub = ReturnType<typeof github>;

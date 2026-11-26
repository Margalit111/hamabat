import type { SiteContent } from "../shared/types";

export class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: string[]) {
    super(message);
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Requested-With": "hamabat" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "אירעה שגיאה", data.errors);
  return data as T;
}

export interface Links { siteUrl: string; previewUrl: string }
export interface ContentResponse extends Links { content: SiteContent; sha: string; hasChanges: boolean }
export interface StatusResponse extends Links { hasChanges: boolean; files: string[] }
export interface Commit { sha: string; date: string; message: string; author: string }

export const api = {
  session: () => req<{ ok: true }>("GET", "/api/session"),
  login: (password: string) => req<{ ok: true }>("POST", "/api/login", { password }),
  logout: () => req<{ ok: true }>("POST", "/api/logout"),
  content: () => req<ContentResponse>("GET", "/api/content"),
  save: (content: SiteContent, sha: string) => req<{ sha: string; saved: boolean; warnings: string[] }>("PUT", "/api/content", { content, sha }),
  status: () => req<StatusResponse>("GET", "/api/status"),
  publish: () => req<{ ok: true }>("POST", "/api/publish"),
  discard: () => req<{ ok: true }>("POST", "/api/discard"),
  history: () => req<{ commits: Commit[] }>("GET", "/api/history"),
  restore: (sha: string) => req<{ ok: true }>("POST", "/api/restore", { sha }),
  uploadImage: (name: string, data: string) => req<{ path: string }>("POST", "/api/images", { name, data }),
};

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("לא הצלחנו לקרוא את הקובץ"));
    r.readAsDataURL(file);
  });
}

export function imageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => reject(new Error("הקובץ אינו תמונה תקינה"));
    img.src = url;
  });
}

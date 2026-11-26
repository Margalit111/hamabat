export interface Env {
  ASSETS: Fetcher;
  // secrets
  ADMIN_PASSWORD: string;
  GITHUB_TOKEN: string;
  SESSION_SECRET?: string;
  // plain variables (wrangler.jsonc)
  GITHUB_REPO: string;
  MAIN_BRANCH: string;
  DRAFT_BRANCH: string;
  CONTENT_PATH: string;
  UPLOAD_DIR: string;
  SITE_URL?: string;
  PREVIEW_URL?: string;
  /** Only for tests: point the GitHub client at a fake server. */
  GITHUB_API_BASE?: string;
}

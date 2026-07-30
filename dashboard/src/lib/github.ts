import { withTenant } from "@/lib/db";

// GitHub 레포 fetch 공유 모듈 (sync-repo + sync-wiki 공용).

export class RepoTokenDecryptionError extends Error {
  constructor() {
    super("Stored GitHub token could not be decrypted");
    this.name = "RepoTokenDecryptionError";
  }
}

function encodePathSegments(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}

function githubHeaders(token: string | null, accept = "application/vnd.github+json"): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "osmu-sync",
    Accept: accept,
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// 비공개 레포 토큰 resolve (integrations kind='repo_token', label='github', pgcrypto 복호화=L2 재사용)
export async function getRepoToken(tenantId: string): Promise<string | null> {
  const key = process.env.OSMU_SECRET_KEY;
  if (!key) {
    console.warn("[github] OSMU_SECRET_KEY is not configured; stored repository tokens are unavailable");
    return null;
  }
  try {
    const [row] = await withTenant(tenantId, (sql) => sql<{ token: string | null }[]>`
      SELECT CASE WHEN secret_enc <> '' THEN pgp_sym_decrypt(dearmor(secret_enc), ${key}) ELSE NULL END AS token
      FROM integrations WHERE tenant_id = ${tenantId} AND kind = 'repo_token' AND label = 'github'`);
    return row?.token || null;
  } catch (error) {
    console.error("[github] stored repository token decryption failed", {
      tenantId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    throw new RepoTokenDecryptionError();
  }
}

export async function getRepoInfo(
  repo: string,
  token: string | null,
): Promise<{ ok: boolean; status: number; defaultBranch?: string; private?: boolean }> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: githubHeaders(token),
    });
    if (!response.ok) return { ok: false, status: response.status };
    const data = (await response.json()) as { default_branch?: string; private?: boolean };
    return {
      ok: true,
      status: 200,
      defaultBranch: data.default_branch,
      private: data.private,
    };
  } catch {
    return { ok: false, status: 0 };
  }
}

// 파일 1개 fetch: GitHub Contents API로 공개·비공개를 통일. 한글/공백 경로와 slash ref 인코딩.
export async function fetchRepoFile(repo: string, path: string, ref: string, token: string | null): Promise<{ ok: boolean; text?: string; status: number }> {
  const encPath = encodePathSegments(path);
  try {
    const url = `https://api.github.com/repos/${repo}/contents/${encPath}?ref=${encodeURIComponent(ref)}`;
    const resp = await fetch(url, {
      headers: githubHeaders(token, "application/vnd.github.raw"),
    });
    return resp.ok ? { ok: true, text: await resp.text(), status: 200 } : { ok: false, status: resp.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// 폴더 아래 .md 전부 재귀 나열 (GitHub Trees API recursive). folder 빈값이면 레포 전체.
// 반환: { paths, truncated } — truncated면 레포가 너무 커서 트리 일부만(드묾, 위키엔 거의 없음).
export async function listWikiFiles(
  repo: string, folder: string, ref: string, token: string | null,
): Promise<{ paths: string[]; truncated: boolean; status: number; markdownCount: number }> {
  const url = `https://api.github.com/repos/${repo}/git/trees/${encodePathSegments(ref)}?recursive=1`;
  let resp: Response;
  try {
    resp = await fetch(url, { headers: githubHeaders(token) });
  } catch {
    return { paths: [], truncated: false, status: 0, markdownCount: 0 };
  }
  if (!resp.ok) return { paths: [], truncated: false, status: resp.status, markdownCount: 0 };
  const data = (await resp.json()) as { tree?: { path: string; type: string }[]; truncated?: boolean };
  const prefix = folder ? folder.replace(/^\/+|\/+$/g, "") + "/" : "";
  const markdownPaths = (data.tree || [])
    .filter((node) => node.type === "blob" && node.path.toLowerCase().endsWith(".md"))
    .map((node) => node.path);
  const paths = markdownPaths.filter((path) => !prefix || path.startsWith(prefix));
  return { paths, truncated: !!data.truncated, status: 200, markdownCount: markdownPaths.length };
}

// 첫 H1(# ) 또는 파일명에서 제목 추출.
export function extractTitle(md: string, path: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  const t = m ? m[1].trim() : (path.split("/").pop() || path).replace(/\.md$/, "");
  return t.slice(0, 200);
}

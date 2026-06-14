import { withTenant } from "@/lib/db";

// GitHub 레포 fetch 공유 모듈 (sync-repo + sync-wiki 공용).

// 비공개 레포 토큰 resolve (integrations kind='repo_token', label='github', pgcrypto 복호화=L2 재사용)
export async function getRepoToken(tenantId: string): Promise<string | null> {
  const key = process.env.OSMU_SECRET_KEY;
  if (!key) return null;
  const [row] = await withTenant(tenantId, (sql) => sql<{ token: string | null }[]>`
    SELECT CASE WHEN secret_enc <> '' THEN pgp_sym_decrypt(dearmor(secret_enc), ${key}) ELSE NULL END AS token
    FROM integrations WHERE tenant_id = ${tenantId} AND kind = 'repo_token' AND label = 'github'`);
  return row?.token || null;
}

// 파일 1개 fetch: 토큰 있으면 GitHub API(공개+비공개), 없으면 public raw. 한글/공백 경로 인코딩.
export async function fetchRepoFile(repo: string, path: string, ref: string, token: string | null): Promise<{ ok: boolean; text?: string; status: number }> {
  const encPath = path.split("/").map(encodeURIComponent).join("/");
  try {
    if (token) {
      const url = `https://api.github.com/repos/${repo}/contents/${encPath}?ref=${encodeURIComponent(ref)}`;
      const resp = await fetch(url, { headers: { "User-Agent": "osmu-sync", Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw" } });
      return resp.ok ? { ok: true, text: await resp.text(), status: 200 } : { ok: false, status: resp.status };
    }
    const url = `https://raw.githubusercontent.com/${repo}/${ref}/${encPath}`;
    const resp = await fetch(url, { headers: { "User-Agent": "osmu-sync" } });
    return resp.ok ? { ok: true, text: await resp.text(), status: 200 } : { ok: false, status: resp.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// 폴더 아래 .md 전부 재귀 나열 (GitHub Trees API recursive). folder 빈값이면 레포 전체.
// 반환: { paths, truncated } — truncated면 레포가 너무 커서 트리 일부만(드묾, 위키엔 거의 없음).
export async function listWikiFiles(
  repo: string, folder: string, ref: string, token: string | null,
): Promise<{ paths: string[]; truncated: boolean; status: number }> {
  const url = `https://api.github.com/repos/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
  const headers: Record<string, string> = { "User-Agent": "osmu-sync", Accept: "application/vnd.github+json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  let resp: Response;
  try {
    resp = await fetch(url, { headers });
  } catch {
    return { paths: [], truncated: false, status: 0 };
  }
  if (!resp.ok) return { paths: [], truncated: false, status: resp.status };
  const data = (await resp.json()) as { tree?: { path: string; type: string }[]; truncated?: boolean };
  const prefix = folder ? folder.replace(/^\/+|\/+$/g, "") + "/" : "";
  const paths = (data.tree || [])
    .filter((n) => n.type === "blob" && n.path.endsWith(".md") && (!prefix || n.path.startsWith(prefix)))
    .map((n) => n.path);
  return { paths, truncated: !!data.truncated, status: 200 };
}

// 첫 H1(# ) 또는 파일명에서 제목 추출.
export function extractTitle(md: string, path: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  const t = m ? m[1].trim() : (path.split("/").pop() || path).replace(/\.md$/, "");
  return t.slice(0, 200);
}

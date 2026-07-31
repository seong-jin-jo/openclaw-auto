import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const H = vi.hoisted(() => ({
  repoToken: null as string | null,
  decryptError: null as Error | null,
}));

function sqlMock(strings: TemplateStringsArray, ..._values: unknown[]) {
  const query = strings.join("?");
  if (query.includes("pgp_sym_decrypt")) {
    if (H.decryptError) throw H.decryptError;
    return Promise.resolve(H.repoToken ? [{ token: H.repoToken }] : []);
  }
  return Promise.resolve([]);
}

vi.mock("@/lib/db", () => ({
  withTenant: vi.fn(async (_tenantId: string, callback: (sql: unknown) => unknown) => {
    const sql = Object.assign(sqlMock, { json: (value: unknown) => value });
    return callback(sql);
  }),
}));

vi.mock("@/lib/tenant-auth", () => ({
  effectiveTenantId: vi.fn(async (_request: Request, fallback?: string | null) => fallback ?? null),
}));

vi.mock("@/lib/anthropic", () => ({
  generateText: vi.fn(async () => JSON.stringify({
    prompt_guide: "친근하고 정확한 한국어",
    visual_rules: { colors: [], typography: "", forbidden: [] },
  })),
  sharedGenerationQuotaErrorResponse: vi.fn(() => null),
  sharedAiApprovalErrorResponse: vi.fn(() => null),
}));

vi.mock("@/lib/wiki-retrieve", () => ({
  getWikiContext: vi.fn(async () => ({ text: "", mode: "none", docs: 0 })),
}));

function postWiki(body: Record<string, unknown>) {
  return new Request("http://localhost/api/brand/sync-wiki", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function syncWiki(body: Record<string, unknown>) {
  const { POST } = await import("@/app/api/brand/sync-wiki/route");
  const response = await POST(postWiki({ tenant_id: "tenant-a", repo: "owner/repo", ...body }));
  return { response, body: await response.json() as Record<string, unknown> };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GitHub wiki sync diagnostics and branch handling", () => {
  const originalSecretKey = process.env.OSMU_SECRET_KEY;

  beforeEach(() => {
    vi.resetModules();
    H.repoToken = null;
    H.decryptError = null;
    process.env.OSMU_SECRET_KEY = "test-encryption-key";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalSecretKey === undefined) delete process.env.OSMU_SECRET_KEY;
    else process.env.OSMU_SECRET_KEY = originalSecretKey;
  });

  it("preserves slashes in a feature/x ref when building the Trees API URL", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ tree: [], truncated: false }));
    vi.stubGlobal("fetch", fetchMock);
    const { listWikiFiles } = await import("@/lib/github");

    await listWikiFiles("owner/repo", "", "feature/x", null);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/repo/git/trees/feature/x?recursive=1",
      expect.any(Object),
    );
  });

  it("uses a repository's master default branch when ref is omitted", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === "https://api.github.com/repos/owner/repo") {
        return jsonResponse({ default_branch: "master", private: false });
      }
      if (url.includes("/git/trees/master?recursive=1")) {
        return jsonResponse({
          tree: [{ path: "wiki/guide.md", type: "blob" }],
          truncated: false,
        });
      }
      if (url.includes("/master/wiki/guide.md") || url.includes("/contents/wiki/guide.md?ref=master")) {
        return new Response("# 가이드\n충분히 긴 위키 문서 본문입니다.");
      }
      return jsonResponse({ message: "Not Found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { response, body } = await syncWiki({ folder: "wiki" });

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/git/trees/master?recursive=1"))).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/git/trees/main?recursive=1"))).toBe(false);
  });

  it("returns the server encryption-key reason instead of a public-repository hint when the key is unset", async () => {
    delete process.env.OSMU_SECRET_KEY;
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "Not Found" }, 404)));

    const { response, body } = await syncWiki({});

    expect(response.status).toBe(400);
    expect(body.error).toContain("서버 암호화 키");
    expect(body.error).toContain("OSMU_SECRET_KEY");
    expect(body.error).not.toContain("공개여부");
  });

  it("distinguishes a valid tree with markdown outside the requested folder from a 404", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/git/trees/main?recursive=1")) {
        return jsonResponse({
          tree: [{ path: "wiki/guide.md", type: "blob" }],
          truncated: false,
        });
      }
      return jsonResponse({ message: "Not Found" }, 404);
    }));

    const { response, body } = await syncWiki({ folder: "docs", ref: "main" });

    expect(response.status).toBe(400);
    expect(body.error).toContain("폴더 경로");
    expect(body.error).toContain("docs");
    expect(body.error).not.toContain("트리 status 404");
  });

  it("distinguishes a valid tree with no markdown files from a folder mismatch", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("/git/trees/main?recursive=1")) {
        return jsonResponse({
          tree: [{ path: "src/index.ts", type: "blob" }],
          truncated: false,
        });
      }
      return jsonResponse({ message: "Not Found" }, 404);
    }));

    const { response, body } = await syncWiki({ folder: "docs", ref: "main" });

    expect(response.status).toBe(400);
    expect(body.error).toContain(".md 파일");
    expect(body.error).not.toContain("폴더 경로");
  });

  it("uses the Contents API with Bearer auth for Studio private-repository context", async () => {
    const fetchMock = vi.fn(async () => new Response("비공개 레포 컨텍스트"));
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("@/app/api/studio/text/route");

    const response = await POST(new Request("http://localhost/api/studio/text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: "tenant-a",
        idea: "신제품 소개",
        context_sources: [{
          type: "github",
          owner: "owner",
          repo: "private-repo",
          path: "docs/brand guide.md",
          ref: "feature/x",
          token: "github_pat_test",
        }],
      }),
    }));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.github.com/repos/owner/private-repo/contents/docs/brand%20guide.md?ref=feature%2Fx",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer github_pat_test",
          Accept: "application/vnd.github.raw",
        }),
      }),
    );
  });

  it("returns an actionable permission error when a stored token still receives 404", async () => {
    H.repoToken = "github_pat_invalid";
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "Not Found" }, 404)));

    const { response, body } = await syncWiki({ ref: "main" });

    expect(response.status).toBe(400);
    expect(body.error).toContain("권한");
    expect(body.error).toContain("Contents: read");
  });

  it("returns a branch-specific error when the repository exists but the requested ref does not", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === "https://api.github.com/repos/owner/repo") {
        return jsonResponse({ default_branch: "main", private: false });
      }
      return jsonResponse({ message: "Not Found" }, 404);
    }));

    const { response, body } = await syncWiki({ ref: "missing/ref" });

    expect(response.status).toBe(400);
    expect(body.error).toContain("브랜치");
    expect(body.error).toContain("missing/ref");
  });

  it("rejects GitHub Wiki clone repositories with the supported migration action", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { POST } = await import("@/app/api/brand/sync-wiki/route");
    const response = await POST(postWiki({
      tenant_id: "tenant-a",
      repo: "owner/repo.wiki.git",
    }));
    const body = await response.json() as { error: string };

    expect(response.status).toBe(400);
    expect(body.error).toContain("GitHub Wiki");
    expect(body.error).toContain("일반 레포의 .md 폴더");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes a pasted GitHub tree URL and uses its detected branch and folder", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === "https://api.github.com/repos/owner/repo") {
        return jsonResponse({ default_branch: "master", private: false });
      }
      if (url.includes("/git/trees/main?recursive=1")) {
        return jsonResponse({
          tree: [
            { path: "wiki/guide.md", type: "blob" },
            { path: "docs/outside.md", type: "blob" },
          ],
          truncated: false,
        });
      }
      if (url.includes("/contents/wiki/guide.md?ref=main")) {
        return new Response("# 가이드\n충분히 긴 위키 문서 본문입니다.");
      }
      return jsonResponse({ message: "Not Found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const { response, body } = await syncWiki({
      repo: "https://user:github_pat_secret@github.com/owner/repo/tree/main/wiki",
    });

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.ref).toBe("main");
    expect(fetchMock.mock.calls.some(([url]) => String(url) === "https://api.github.com/repos/owner/repo")).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/git/trees/main?recursive=1"))).toBe(true);
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain("github_pat_secret");
  });

  it("rejects a non-GitHub repository URL before any network request", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { response, body } = await syncWiki({
      repo: "https://gitlab.com/owner/repo",
    });

    expect(response.status).toBe(400);
    expect(body.error).toContain("현재 GitHub");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps repository-token decryption rotation failures to a safe 400 without logging the secret", async () => {
    H.decryptError = new Error("decrypt failed with hidden database detail");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { response, body } = await syncWiki({});

    expect(response.status).toBe(400);
    expect(body.error).toContain("토큰을 다시 저장");
    expect(errorSpy).toHaveBeenCalledWith(
      "[github] stored repository token decryption failed",
      { tenantId: "tenant-a", errorName: "Error" },
    );
    expect(JSON.stringify(errorSpy.mock.calls)).not.toContain("github_pat");
  });

  it("keeps both legacy context routes on the shared Contents API helper", () => {
    for (const file of [
      "src/app/api/sourcing/route.ts",
      "src/app/api/studio/text/route.ts",
    ]) {
      const source = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
      expect(source).toContain("fetchRepoFile");
      expect(source).not.toContain("raw.githubusercontent.com");
      expect(source).not.toMatch(/Authorization\s*=\s*`token /);
    }
  });
});

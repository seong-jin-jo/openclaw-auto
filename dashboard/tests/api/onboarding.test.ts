import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createTempDir, setupTestEnv, cleanupTestEnv, readTempJson } from '../helpers';

// OAuth로 연결한 채널은 openclaw.json(파일)이 아니라 DB integrations(kind='channel')에 저장된다.
// hasConnectedChannel()의 파일 전용 판정과의 드리프트를 막기 위해 effectiveTenantId/withTenant를
// mock해 "tenant 없음"(기존 테스트, 파일 신호만) / "tenant + integrations 존재"(신규 테스트) 둘 다 검증.
const H = vi.hoisted(() => ({
  tenantId: null as string | null,
  integrationsCount: 0,
  dbThrows: false,
}));

vi.mock('@/lib/tenant-auth', () => ({
  effectiveTenantId: vi.fn(async (_req: Request, fallback?: string | null) => H.tenantId ?? fallback ?? null),
}));

vi.mock('@/lib/db', () => ({
  withTenant: vi.fn(async (_tenantId: string, fn: (sql: unknown) => unknown) => {
    if (H.dbThrows) throw new Error('connection refused');
    const sql = (strings: TemplateStringsArray) => {
      const q = strings.join('?');
      if (q.includes('wiki_docs')) return Promise.resolve([{ c: 0 }]);
      if (q.includes('published_posts')) return Promise.resolve([{ c: 0 }]);
      if (q.includes('integrations')) return Promise.resolve([{ c: H.integrationsCount }]);
      return Promise.resolve([{ c: 0 }]);
    };
    return fn(sql as never);
  }),
}));

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
  H.tenantId = null;
  H.integrationsCount = 0;
  H.dbThrows = false;
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
});

describe('GET /api/onboarding', () => {
  it('returns completed: false when no settings exist', async () => {
    const { GET } = await import('@/app/api/onboarding/route');
    const res = await GET(new Request('http://localhost/api/onboarding'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.completed).toBe(false);
  });

  it('returns completed: true when onboarding is done', async () => {
    fs.writeFileSync(
      path.join(tmpDir, 'settings.json'),
      JSON.stringify({ onboardingComplete: true, industry: 'cafe' })
    );
    const { GET } = await import('@/app/api/onboarding/route');
    const res = await GET(new Request('http://localhost/api/onboarding'));
    const body = await res.json();
    expect(body.completed).toBe(true);
    expect(body.industry).toBe('cafe');
  });

  // 온보딩 채널감지 드리프트 수정 회귀 테스트: OAuth 연결(DB integrations)만 있고 파일(openclaw.json)
  // 쪽 publish 플러그인은 미설정인 tenant도 channelConnected=true여야 한다.
  it('DB integrations(kind=channel) 존재 tenant → channelConnected/checklist.channel = true', async () => {
    H.tenantId = 'tenant-oauth-1';
    H.integrationsCount = 1;
    const { GET } = await import('@/app/api/onboarding/route');
    const res = await GET(new Request('http://localhost/api/onboarding'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.channelConnected).toBe(true);
    expect(body.checklist.channel).toBe(true);
  });

  it('tenant는 있으나 integrations=0, 파일 신호도 없음 → channelConnected = false', async () => {
    H.tenantId = 'tenant-no-channel';
    H.integrationsCount = 0;
    const { GET } = await import('@/app/api/onboarding/route');
    const res = await GET(new Request('http://localhost/api/onboarding'));
    const body = await res.json();
    expect(body.channelConnected).toBe(false);
    expect(body.checklist.channel).toBe(false);
  });

  it('DB 조회 실패 → 500 없이 파일 신호로 폴백(온보딩이 깨지지 않음)', async () => {
    H.tenantId = 'tenant-db-down';
    H.dbThrows = true;
    const { GET } = await import('@/app/api/onboarding/route');
    const res = await GET(new Request('http://localhost/api/onboarding'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.channelConnected).toBe(false);
    expect(body.wikiCount).toBe(0);
    expect(body.publishCount).toBe(0);
  });
});

describe('POST /api/onboarding', () => {
  it('copies templates and sets completed', async () => {
    // Create templates directory with industry templates
    const templatesDir = path.join(tmpDir, 'templates');
    fs.mkdirSync(templatesDir, { recursive: true });
    fs.writeFileSync(path.join(templatesDir, 'cafe.prompt-guide.txt'), 'Cafe guide template');
    fs.writeFileSync(path.join(templatesDir, 'cafe.search-keywords.txt'), 'coffee\nlatte\n');

    const { POST } = await import('@/app/api/onboarding/route');
    const res = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'cafe', channels: ['threads'] }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);

    // Check settings.json was updated
    const settings = readTempJson<Record<string, unknown>>(tmpDir, 'settings.json');
    expect(settings!.onboardingComplete).toBe(true);
    expect(settings!.industry).toBe('cafe');

    // Check templates were copied
    const guide = fs.readFileSync(path.join(tmpDir, 'prompt-guide.txt'), 'utf-8');
    expect(guide).toBe('Cafe guide template');
  });

  it('rejects invalid industry', async () => {
    const { POST } = await import('@/app/api/onboarding/route');
    const res = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'invalid', channels: ['threads'] }),
      })
    );
    expect(res.status).toBe(400);
  });

  it('rejects empty channels', async () => {
    const { POST } = await import('@/app/api/onboarding/route');
    const res = await POST(
      new Request('http://localhost/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: 'cafe', channels: [] }),
      })
    );
    expect(res.status).toBe(400);
  });
});

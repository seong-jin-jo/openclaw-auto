import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createTempDir, setupTestEnv, cleanupTestEnv } from '../helpers';

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
  fs.writeFileSync(path.join(tmpDir, 'search-keywords.txt'), '# Common keywords\nmarketing\nAI\nautomation\n');
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
});

describe('GET /api/keywords', () => {
  it('returns keyword list', async () => {
    const { GET } = await import('@/app/api/keywords/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keywords).toEqual(['marketing', 'AI', 'automation']);
  });
});

describe('GET /api/keywords/[channel]', () => {
  it('returns common keywords when no channel-specific keywords exist', async () => {
    const { GET } = await import('@/app/api/keywords/[channel]/route');
    const res = await GET(
      new Request('http://localhost/api/keywords/x'),
      { params: Promise.resolve({ channel: 'x' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keywords).toEqual(['marketing', 'AI', 'automation']);
    expect(body.channelKeywords).toBe(false);
    expect(body.channel).toBe('x');
  });

  it('returns channel-specific keywords when they exist', async () => {
    fs.writeFileSync(path.join(tmpDir, 'search-keywords.x.txt'), '# X keywords\ntwitter\ntrending\n');
    const { GET } = await import('@/app/api/keywords/[channel]/route');
    const res = await GET(
      new Request('http://localhost/api/keywords/x'),
      { params: Promise.resolve({ channel: 'x' }) }
    );
    const body = await res.json();
    expect(body.keywords).toEqual(['twitter', 'trending']);
    expect(body.channelKeywords).toBe(true);
  });
});

describe('POST /api/keywords/[channel]', () => {
  it('saves channel-specific keywords', async () => {
    const { POST } = await import('@/app/api/keywords/[channel]/route');
    const res = await POST(
      new Request('http://localhost/api/keywords/x', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: ['seo', 'growth'] }),
      }),
      { params: Promise.resolve({ channel: 'x' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.count).toBe(2);
    expect(body.channel).toBe('x');

    const content = fs.readFileSync(path.join(tmpDir, 'search-keywords.x.txt'), 'utf-8');
    expect(content).toContain('seo');
    expect(content).toContain('growth');
  });
});

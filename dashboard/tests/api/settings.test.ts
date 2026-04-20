import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTempDir, setupTestEnv, cleanupTestEnv, copyFixture, readTempJson } from '../helpers';

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
});

describe('GET /api/settings', () => {
  it('returns settings with defaults when no file exists', async () => {
    const { GET } = await import('@/app/api/settings/route');
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.viralThreshold).toBe(500);
    expect(body.draftsPerBatch).toBe(5);
    expect(body.publishIntervalHours).toBe(2);
  });

  it('merges saved settings with defaults', async () => {
    copyFixture(tmpDir, 'settings.json');
    const { GET } = await import('@/app/api/settings/route');
    const res = await GET();
    const body = await res.json();
    expect(body.viralThreshold).toBe(500);
    expect(body.minLikes).toBe(10);
  });
});

describe('POST /api/settings', () => {
  it('saves valid settings', async () => {
    const { POST } = await import('@/app/api/settings/route');
    const res = await POST(
      new Request('http://localhost/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viralThreshold: 1000, draftsPerBatch: 10 }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.settings.viralThreshold).toBe(1000);
    expect(body.settings.draftsPerBatch).toBe(10);

    const saved = readTempJson<Record<string, number>>(tmpDir, 'settings.json');
    expect(saved!.viralThreshold).toBe(1000);
  });
});

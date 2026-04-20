import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTempDir, setupTestEnv, cleanupTestEnv, copyFixture, readTempJson } from '../helpers';

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
  copyFixture(tmpDir, 'channel-settings.json');
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
});

describe('GET /api/channel-settings/[channel]', () => {
  it('returns feature toggles with defaults for threads', async () => {
    const { GET } = await import('@/app/api/channel-settings/[channel]/route');
    const res = await GET(
      new Request('http://localhost/api/channel-settings/threads'),
      { params: Promise.resolve({ channel: 'threads' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content_generation).toBe(true);
    expect(body.auto_publish).toBe(true);
    // Default values should be filled in for missing keys
    expect(typeof body.auto_reply).toBe('boolean');
  });
});

describe('POST /api/channel-settings/[channel]', () => {
  it('toggles features', async () => {
    const { POST } = await import('@/app/api/channel-settings/[channel]/route');
    const res = await POST(
      new Request('http://localhost/api/channel-settings/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_publish: false }),
      }),
      { params: Promise.resolve({ channel: 'threads' }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.settings.auto_publish).toBe(false);

    const saved = readTempJson<Record<string, Record<string, boolean>>>(tmpDir, 'channel-settings.json');
    expect(saved!.threads.auto_publish).toBe(false);
  });
});

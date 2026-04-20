import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createTempDir, setupTestEnv, cleanupTestEnv, readTempJson } from '../helpers';

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = createTempDir();
  setupTestEnv(tmpDir);
});

afterEach(() => {
  cleanupTestEnv(tmpDir);
});

describe('GET /api/onboarding', () => {
  it('returns completed: false when no settings exist', async () => {
    const { GET } = await import('@/app/api/onboarding/route');
    const res = await GET();
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
    const res = await GET();
    const body = await res.json();
    expect(body.completed).toBe(true);
    expect(body.industry).toBe('cafe');
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

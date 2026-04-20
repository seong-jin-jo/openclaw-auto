import fs from 'fs';
import path from 'path';
import os from 'os';

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures');

export function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'openclaw-test-'));
}

export function setupTestEnv(tmpDir: string) {
  process.env.DATA_DIR = tmpDir;
  process.env.CONFIG_DIR = tmpDir;
}

export function cleanupTestEnv(tmpDir: string) {
  delete process.env.DATA_DIR;
  delete process.env.CONFIG_DIR;
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

export function copyFixture(tmpDir: string, filename: string) {
  const src = path.join(FIXTURES_DIR, filename);
  const dest = path.join(tmpDir, filename);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

export function readTempJson<T = unknown>(tmpDir: string, filename: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(tmpDir, filename), 'utf-8'));
  } catch {
    return null;
  }
}

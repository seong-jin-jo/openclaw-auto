import fs from "fs";
import path from "path";
import crypto from "crypto";
import lockfile from "proper-lockfile";
import { currentTenantId } from "./tenant-context";

export const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "../data");
export const CONFIG_DIR = process.env.CONFIG_DIR || path.resolve(process.cwd(), "../config");

// 현재 테넌트 컨텍스트가 있으면 tenants/{id}/ 접두(파일 격리). 없으면 공유 루트(운영자/레거시).
// 안전 tenant id만(영숫자·-·_) — path traversal 차단.
function tenantSeg(): string {
  const t = currentTenantId();
  if (t && /^[A-Za-z0-9_-]+$/.test(t)) return path.join("tenants", t);
  return "";
}

export function readJson<T = unknown>(filePath: string): T | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// 크래시 안전 쓰기: 같은 디렉터리에 temp 파일로 쓴 뒤 atomic rename(같은 fs면 원자적).
// 중간 크래시 시 원본은 truncate되지 않고 그대로 남는다.
function atomicWrite(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(filePath)}.${crypto.randomBytes(6).toString("hex")}.tmp`);
  try {
    fs.writeFileSync(tmp, content, "utf-8");
    fs.renameSync(tmp, filePath);
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch { /* ignore */ }
    throw e;
  }
}

export function writeJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // 파일이 없으면 먼저 생성 (lockfile이 존재하는 파일만 잠금 가능)
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}", "utf-8");
  let release: (() => void) | null = null;
  try {
    release = lockfile.lockSync(filePath);
    atomicWrite(filePath, JSON.stringify(data, null, 2));
  } finally {
    if (release) release();
  }
}

// path별 in-process 직렬화 체인(단일 Node 프로세스가 한 테넌트를 서빙하므로 실제 경합원).
const _mutexChains = new Map<string, Promise<void>>();

// read→modify→write를 원자적으로 수행. lost update 방지의 핵심.
//   ① path별 async mutex로 프로세스 내 동시 호출 직렬화
//   ② proper-lockfile.lock(async, retries 가능)으로 멀티프로세스/컨테이너 대비
//   ③ fresh read → fn → atomic write. fn은 새 값을 반환(불변/가변 모두 허용).
// 느린 외부 I/O(claude/figma)는 호출 "전"에 끝내고, in-memory merge+write만 fn 안에서 할 것.
export async function mutateJson<T>(filePath: string, fn: (cur: T) => T, fallback: T): Promise<T> {
  const key = path.resolve(filePath);
  const prev = _mutexChains.get(key) ?? Promise.resolve();
  let releaseChain!: () => void;
  const chained = prev.then(() => new Promise<void>((r) => { releaseChain = r; }));
  _mutexChains.set(key, chained);
  await prev.catch(() => {}); // 내 차례까지 대기(앞선 에러는 무시)

  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // lockfile은 존재하는 파일만 잠금 가능. 없으면 fallback 내용으로 생성(빈 {} 아님 — 그래야 첫 read가 올바른 shape).
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2), "utf-8");
    const release = await lockfile.lock(filePath, {
      retries: { retries: 5, factor: 2, minTimeout: 50, maxTimeout: 1000 },
    });
    try {
      const cur = readJson<T>(filePath) ?? fallback;
      const next = fn(cur);
      atomicWrite(filePath, JSON.stringify(next, null, 2));
      return next;
    } finally {
      await release();
    }
  } finally {
    releaseChain();
    if (_mutexChains.get(key) === chained) _mutexChains.delete(key);
  }
}

export function readText(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

export function writeText(filePath: string, text: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, text, "utf-8");
}

/** Queue path helper — 테넌트 컨텍스트면 data/tenants/{id}/ 아래로 격리 */
export function dataPath(name: string): string {
  return path.join(DATA_DIR, tenantSeg(), name);
}

/** Config path helper — 테넌트 컨텍스트면 config/tenants/{id}/ 아래로 격리 */
export function configPath(...parts: string[]): string {
  return path.join(CONFIG_DIR, tenantSeg(), ...parts);
}

/** 공유 데이터 경로 — 테넌트 컨텍스트 무시하고 항상 공유 루트. 공유 템플릿/에셋 읽기용. */
export function sharedDataPath(name: string): string {
  return path.join(DATA_DIR, name);
}

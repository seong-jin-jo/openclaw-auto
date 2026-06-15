import fs from "fs";
import path from "path";
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

export function writeJson(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // 파일이 없으면 먼저 생성 (lockfile이 존재하는 파일만 잠금 가능)
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}", "utf-8");
  let release: (() => void) | null = null;
  try {
    release = lockfile.lockSync(filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } finally {
    if (release) release();
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

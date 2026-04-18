import fs from "fs";
import path from "path";
import lockfile from "proper-lockfile";

export const DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), "../data");
export const CONFIG_DIR = process.env.CONFIG_DIR || path.resolve(process.cwd(), "../config");

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
    release = lockfile.lockSync(filePath, { retries: { retries: 3, minTimeout: 100, maxTimeout: 1000 } });
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

/** Queue path helper */
export function dataPath(name: string): string {
  return path.join(DATA_DIR, name);
}

/** Config path helper */
export function configPath(...parts: string[]): string {
  return path.join(CONFIG_DIR, ...parts);
}

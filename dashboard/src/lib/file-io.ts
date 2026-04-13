import fs from "fs";
import path from "path";

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
  const fd = fs.openSync(filePath, "w");
  try {
    fs.writeSync(fd, JSON.stringify(data, null, 2));
  } finally {
    fs.closeSync(fd);
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

// 격리 라이브 테스트용 DATABASE_URL 로더.
// 우선순위: process.env.DATABASE_URL → .env.local 파싱. 없으면 null(테스트가 skip 처리).
// 테스트 글롭(*.test.ts)에 안 걸리는 _ prefix 헬퍼 — 단독 실행 안 됨.
import { readFileSync } from "fs";
import path from "path";

export function getDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const envPath = path.resolve(__dirname, "../../.env.local");
    const raw = readFileSync(envPath, "utf8");
    const m = raw.match(/^DATABASE_URL=(.*)$/m);
    return m ? m[1].trim() : null;
  } catch {
    return null;
  }
}

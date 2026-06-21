import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { mutateJson, readJson } from "@/lib/file-io";

// mutateJson이 동시 read-modify-write에서 lost update를 막는지 검증.
// tests/setup.ts가 proper-lockfile을 no-op으로 mock하므로, 직렬화는 순수히 in-process mutex가 담당 → 그걸 검증.

describe("mutateJson 동시성", () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "mutatejson-"));
    file = path.join(dir, "queue.json");
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("N개 동시 append → 최종 길이 N (누락 0)", async () => {
    const N = 50;
    const fallback = { posts: [] as number[] };
    await Promise.all(
      Array.from({ length: N }, (_, i) =>
        mutateJson<typeof fallback>(file, (cur) => { cur.posts.push(i); return cur; }, fallback),
      ),
    );
    const final = readJson<typeof fallback>(file);
    expect(final?.posts.length).toBe(N);
    // 0..N-1 모두 존재(중복/누락 없음)
    expect([...(final?.posts ?? [])].sort((a, b) => a - b)).toEqual(Array.from({ length: N }, (_, i) => i));
  });

  it("쓰기는 원자적 — 항상 valid JSON (truncate 없음)", async () => {
    const fallback = { posts: [] as number[] };
    await Promise.all(
      Array.from({ length: 20 }, (_, i) =>
        mutateJson<typeof fallback>(file, (cur) => { cur.posts.push(i); return cur; }, fallback),
      ),
    );
    // 매 시점 파일은 파싱 가능해야 함(temp+rename 보장)
    const raw = fs.readFileSync(file, "utf-8");
    expect(() => JSON.parse(raw)).not.toThrow();
  });
});

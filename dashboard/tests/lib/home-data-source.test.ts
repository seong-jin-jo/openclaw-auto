import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("홈 데이터 expand-contract 소스 선택", () => {
  it("기본은 DB 컷오버이고 파일 롤백은 명시적 플래그에서만 동작한다", async () => {
    const { homeDataSource } = await import("@/lib/home-data-source");
    expect(homeDataSource({ ...process.env, HOME_DATA_SOURCE: undefined })).toBe("db");
    expect(homeDataSource({ ...process.env, HOME_DATA_SOURCE: "file" })).toBe("file");
    expect(homeDataSource({ ...process.env, HOME_DATA_SOURCE: "db" })).toBe("db");
  });

  it("FDD의 SHADOW_HOME_DB=1은 파일 응답 관찰 모드를 우선한다", async () => {
    const { homeDataSource } = await import("@/lib/home-data-source");
    expect(homeDataSource({ ...process.env, SHADOW_HOME_DB: "1", HOME_DATA_SOURCE: "db" })).toBe("shadow");
  });

  it("섀도우 비교는 키 순서와 무관하고 불일치를 구조화 로그로 남긴다", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const { logHomeShadowDiff } = await import("@/lib/home-data-source");
    expect(logHomeShadowDiff("overview", "tenant-1", { b: 2, a: 1 }, { a: 1, b: 2 })).toBe(true);
    expect(logHomeShadowDiff("overview", "tenant-1", { a: 1 }, { a: 2 })).toBe(false);
    expect(info).toHaveBeenLastCalledWith(
      "[home-data-shadow]",
      expect.stringContaining('"matches":false'),
    );
  });
});

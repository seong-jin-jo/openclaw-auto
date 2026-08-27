import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { deferredOverviewKey } from "@/hooks/useOverview";
import { resolveStudioRoomFromSearch, shouldLoadPublishResources } from "@/lib/studio/room-routing";

describe("FE9 주요 화면 초기 표시 계약", () => {
  it("FE9-ROOM-01 정상: 주소의 생성실을 저장된 발행실보다 먼저 고른다", () => {
    expect(resolveStudioRoomFromSearch("?room=create", "publish")).toBe("create");
    expect(shouldLoadPublishResources("publish")).toBe(true);
  });

  it("FE9-ROOM-02 거절: 알 수 없는 방과 생성실은 발행 전용 요청을 시작하지 않는다", () => {
    expect(resolveStudioRoomFromSearch("?room=unknown", "edit")).toBe("edit");
    expect(shouldLoadPublishResources("create")).toBe(false);
  });

  it("FE9-HOME-01 정상: 첫 그림 뒤에는 하단 자료 요청을 연다", () => {
    expect(deferredOverviewKey("/api/activity", true)).toBe("/api/activity");
  });

  it("FE9-HOME-02 거절: 첫 그림 전에는 하단 자료 요청을 만들지 않는다", () => {
    expect(deferredOverviewKey("/api/activity", false)).toBeNull();
  });

  it("FE9-A11Y-01 정상: 공통 초점 링과 보정된 보조 글자 토큰이 있다", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("outline: 3px solid var(--focus)");
    expect(css).toContain("--text-subtle:rgb(102 102 110)");
  });

  it("FE9-A11Y-02 거절: 라이트 테마에 기존 저대비 보조 글자 토큰을 허용하지 않는다", () => {
    const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    const lightTheme = css.slice(css.indexOf(":root"), css.indexOf("[data-theme=\"dark\"]"));
    expect(lightTheme).not.toContain("--text-subtle:rgb(161 161 170)");
  });
});

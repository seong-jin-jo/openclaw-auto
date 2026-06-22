import { describe, it, expect } from "vitest";
import { parseDrafts } from "@/lib/seed-parse";

describe("parseDrafts (LLM 출력 견고 파싱)", () => {
  it("순수 JSON 배열을 파싱한다", () => {
    const r = parseDrafts('[{"text":"안녕","hashtags":["a"],"topic":"info"}]');
    expect(r).toHaveLength(1);
    expect(r[0]).toEqual({ text: "안녕", hashtags: ["a"], topic: "info" });
  });

  it("코드펜스/설명문에 둘러싸여도 배열만 추출한다", () => {
    const raw = '여기 있어요:\n```json\n[{"text":"글1"},{"text":"글2"}]\n```\n끝';
    const r = parseDrafts(raw);
    expect(r).toHaveLength(2);
    expect(r[0].topic).toBe("ai-seed"); // 기본값
    expect(r[0].hashtags).toEqual([]);
  });

  it("빈 text 항목과 비문자 hashtag를 거른다", () => {
    const r = parseDrafts('[{"text":"  "},{"text":"좋은 글","hashtags":["ok",1,null,"good"]}]');
    expect(r).toHaveLength(1);
    expect(r[0].text).toBe("좋은 글");
    expect(r[0].hashtags).toEqual(["ok", "good"]);
  });

  it("배열 없음/깨진 JSON/비문자열 입력은 빈 배열", () => {
    expect(parseDrafts("배열이 전혀 없음")).toEqual([]);
    expect(parseDrafts("[깨진 json,,,")).toEqual([]);
    expect(parseDrafts("{\"text\":\"객체는 배열아님\"}")).toEqual([]);
    // @ts-expect-error 런타임 방어 확인
    expect(parseDrafts(null)).toEqual([]);
  });
});

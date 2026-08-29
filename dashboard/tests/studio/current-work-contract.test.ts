import { describe, expect, it } from "vitest";
import { resolveCurrentWork } from "@/lib/studio/current-work";

describe("Studio 현재 작업 단일 계약", () => {
  it("BE-CURRENT-01 정상: 가장 최근 편집 초안을 편집실 현재 작업으로 판정한다", () => {
    const current = resolveCurrentWork([
      {
        id: "draft-edit",
        idea: "고객 사례 카드뉴스",
        text: { instagram: { caption: "본문" } },
        editorHandoff: { status: "editing" },
        status: "draft",
        savedAt: "2026-08-29T08:10:00.000Z",
      },
      {
        id: "draft-old",
        idea: "지난 작업",
        text: null,
        status: "draft",
        savedAt: "2026-08-28T08:10:00.000Z",
      },
    ]);

    expect(current).toEqual({
      draftId: "draft-edit",
      idea: "고객 사례 카드뉴스",
      stage: "edit",
      stageLabel: "편집실",
      status: "draft",
      savedAt: "2026-08-29T08:10:00.000Z",
    });
  });

  it("BE-CURRENT-02 거절: 식별자나 저장 시각이 없는 행은 현재 작업으로 노출하지 않는다", () => {
    expect(resolveCurrentWork([
      { id: "", idea: "식별자 없음", status: "draft", savedAt: "2026-08-29T08:10:00.000Z" },
      { id: "draft-no-time", idea: "저장 시각 없음", status: "draft", savedAt: "" },
    ])).toBeNull();
  });

  it("BE-CURRENT-03 경계: 발행 완료 작업은 성과실, 복구 필요 작업은 발행실로 판정한다", () => {
    expect(resolveCurrentWork([{
      id: "draft-published",
      idea: "발행 완료",
      status: "published",
      savedAt: "2026-08-29T08:20:00.000Z",
    }])?.stage).toBe("performance");

    expect(resolveCurrentWork([{
      id: "draft-partial",
      idea: "기록 복구 필요",
      status: "partial",
      savedAt: "2026-08-29T08:21:00.000Z",
    }])?.stage).toBe("publish");
  });

  it("BE-CURRENT-04 통합: 데이터베이스 드라이버의 Date 저장 시각도 현재 작업으로 판정한다", () => {
    expect(resolveCurrentWork([{
      id: "draft-db-date",
      idea: "실제 데이터베이스 초안",
      text: { threads: "본문" },
      status: "draft",
      savedAt: new Date("2026-08-29T08:22:00.000Z"),
    }])).toEqual(expect.objectContaining({
      draftId: "draft-db-date",
      stage: "edit",
      savedAt: "2026-08-29T08:22:00.000Z",
    }));
  });
});

import { describe, expect, it } from "vitest";
import {
  applyEditorOperation,
  createEditorHandoff,
  EditorContractError,
  handoffQueueInput,
} from "@/lib/studio/editor-handoff";

function videoHandoff() {
  return createEditorHandoff({
    kind: "video",
    summary: "작은 팀의 콘텐츠 운영 과정을 설명하는 원본 영상",
    source: { generation_id: "generation-1", candidate_id: "candidate-b" },
    payload: {
      asset_url: "/media/source-video.mp4",
      scenes: [
        { id: "scene-1", order: 0, title: "문제", lines: [{ id: "line-1", order: 0, text: "반복 작업이 쌓입니다" }] },
        { id: "scene-2", order: 1, title: "해결", lines: [{ id: "line-2", order: 0, text: "한 흐름으로 정리합니다" }] },
      ],
    },
  }, new Date("2026-08-28T01:00:00.000Z"));
}

describe("BE-V63-31 편집실 인계 계약", () => {
  it("BE-V63-31 정상 경로: 영상 kind와 장면 및 문장 규격을 한 봉투로 만든다", () => {
    const handoff = videoHandoff();
    expect(handoff).toEqual(expect.objectContaining({
      contract_version: "1.0",
      kind: "video",
      revision: 0,
      status: "editing",
      source: { generation_id: "generation-1", candidate_id: "candidate-b" },
    }));
    expect(handoff.payload).toEqual(expect.objectContaining({ kind: "video", scenes: expect.any(Array) }));
  });

  it("BE-V63-31 거절 경로: 장면 없는 영상 인계는 받지 않는다", () => {
    expect(() => createEditorHandoff({
      kind: "video",
      summary: "빈 영상",
      payload: { asset_url: "/media/empty.mp4", scenes: [] },
    })).toThrow(EditorContractError);
  });
});

describe("BE-V63-32 장면 순서와 문장 삭제 및 복원", () => {
  it("BE-V63-32 정상 경로: 장면 순서를 바꾸고 revision을 올린다", () => {
    const reordered = applyEditorOperation(videoHandoff(), 0, {
      operation: "reorder_scenes",
      ordered_ids: ["scene-2", "scene-1"],
    });
    expect(reordered.revision).toBe(1);
    expect(reordered.payload.kind === "video" && reordered.payload.scenes.map((scene) => scene.id)).toEqual(["scene-2", "scene-1"]);
  });

  it("BE-V63-32 정상 경로: 문장을 지운 뒤 같은 id로 복원한다", () => {
    const deleted = applyEditorOperation(videoHandoff(), 0, { operation: "delete_line", line_id: "line-1" });
    const restored = applyEditorOperation(deleted, 1, { operation: "restore_line", line_id: "line-1" });
    const scene = restored.payload.kind === "video" ? restored.payload.scenes.find((entry) => entry.id === "scene-1") : null;
    expect(scene?.lines[0]).toEqual(expect.objectContaining({ visible: true, deleted_at: null }));
    expect(restored.history.map((entry) => entry.operation)).toEqual(["delete_line", "restore_line"]);
  });

  it("BE-V63-32 거절 경로: 현재 revision과 다른 동시 편집은 409 충돌로 거절한다", () => {
    expect(() => applyEditorOperation(videoHandoff(), 3, { operation: "delete_line", line_id: "line-1" }))
      .toThrow(expect.objectContaining({ code: "EDITOR_REVISION_CONFLICT", status: 409 }));
  });
});

describe("BE-V63-33 Studio 결과를 OpenClaw 큐로 인계", () => {
  it("BE-V63-33 정상 경로: ready 인계는 출처와 revision 멱등키를 보존한다", () => {
    const ready = applyEditorOperation(videoHandoff(), 0, { operation: "mark_ready" });
    const input = handoffQueueInput(ready, "draft-1");
    expect(input).toEqual(expect.objectContaining({
      text: "작은 팀의 콘텐츠 운영 과정을 설명하는 원본 영상",
      videoUrl: "/media/source-video.mp4",
      idempotencyKey: expect.stringContaining(":revision:1"),
      sourceContext: expect.objectContaining({ type: "studio_handoff", draftId: "draft-1", kind: "video" }),
    }));
  });

  it("BE-V63-33 거절 경로: 편집 중인 결과는 큐로 넘기지 않는다", () => {
    expect(() => handoffQueueInput(videoHandoff(), "draft-1"))
      .toThrow(expect.objectContaining({ code: "EDITOR_HANDOFF_NOT_READY", status: 409 }));
  });
});

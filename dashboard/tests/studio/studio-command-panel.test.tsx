// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StudioCommandPanel } from "@/components/studio/StudioCommandPanel";
import { createEditorHandoff } from "@/lib/studio/editor-handoff";

const mocks = vi.hoisted(() => ({ apiPost: vi.fn() }));

vi.mock("@/lib/api", () => ({
  apiPost: (...args: unknown[]) => mocks.apiPost(...args),
}));

const videoHandoff = createEditorHandoff({
  kind: "video",
  summary: "제품 설명 영상",
  payload: {
    asset_url: "/media/video.mp4",
    scenes: [
      { id: "scene-1", order: 0, title: "시작", lines: [{ id: "line-1", order: 0, text: "첫 문장" }] },
      { id: "scene-2", order: 1, title: "마무리", lines: [{ id: "line-2", order: 0, text: "끝 문장" }] },
    ],
  },
});

beforeEach(() => mocks.apiPost.mockReset());
afterEach(cleanup);

describe("FE-V63-31 Studio 담당 대화 명령 연결", () => {
  it("FE-V63-31 정상 경로: 영상 칩 선택과 편집실 인계 버튼이 command API를 실제 호출한다", async () => {
    mocks.apiPost.mockResolvedValue({ draft_id: "draft-1", handoff: videoHandoff });
    const onDraftId = vi.fn();
    const onHandoff = vi.fn();
    render(<StudioCommandPanel
      workspaceId="tenant-1"
      draftId={null}
      idea="제품 설명"
      text={{ shorts: { hook: "첫 문장", body: "본문", cta: "끝 문장" } }}
      imageUrl={null}
      videoUrl="/media/video.mp4"
      editorLines={["고친 첫 문장", "고친 마지막 문장"]}
      source={{ generationId: "generation-1", candidateId: "candidate-a" }}
      initialHandoff={null}
      onDraftId={onDraftId}
      onHandoff={onHandoff}
      onQueueChanged={vi.fn()}
    />);

    expect(screen.getByRole("button", { name: "영상" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "편집실로 넘기기" }));
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/studio/commands",
      expect.objectContaining({
        tenant_id: "tenant-1",
        action: "handoff_to_editor",
        handoff: expect.objectContaining({
          kind: "video",
          source: { generation_id: "generation-1", candidate_id: "candidate-a" },
          payload: expect.objectContaining({
            scenes: expect.arrayContaining([
              expect.objectContaining({ lines: [expect.objectContaining({ text: "고친 첫 문장" })] }),
            ]),
          }),
        }),
      }),
    ));
    expect(onDraftId).toHaveBeenCalledWith("draft-1");
    expect(await screen.findByText("편집실 작업물에 추가했습니다. 원본은 덮어쓰지 않았어요.")).toBeInTheDocument();
  });

  it("FE-V63-31 정상 경로: 장면 순서 버튼은 revision과 전체 scene id를 보낸다", async () => {
    mocks.apiPost.mockResolvedValue({ handoff: { ...videoHandoff, revision: 1 } });
    render(<StudioCommandPanel
      workspaceId="tenant-1"
      draftId="draft-1"
      idea="제품 설명"
      text={{ shorts: { hook: "첫 문장", body: "본문", cta: "끝 문장" } }}
      imageUrl={null}
      videoUrl="/media/video.mp4"
      initialHandoff={videoHandoff}
      onDraftId={vi.fn()}
      onHandoff={vi.fn()}
      onQueueChanged={vi.fn()}
    />);

    fireEvent.click(screen.getByRole("button", { name: "장면 순서 뒤집기" }));
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/studio/commands",
      expect.objectContaining({
        action: "reorder_scenes",
        draft_id: "draft-1",
        expected_revision: 0,
        ordered_ids: ["scene-2", "scene-1"],
      }),
    ));
  });

  it("FE-V63-31 거절 경로: 넘길 결과가 없으면 편집실 버튼은 비활성이고 API를 부르지 않는다", () => {
    render(<StudioCommandPanel
      workspaceId="tenant-1"
      draftId={null}
      idea=""
      text={null}
      imageUrl={null}
      videoUrl={null}
      initialHandoff={null}
      onDraftId={vi.fn()}
      onHandoff={vi.fn()}
      onQueueChanged={vi.fn()}
    />);
    const button = screen.getByRole("button", { name: "편집실로 넘기기" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(mocks.apiPost).not.toHaveBeenCalled();
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudioPage from "@/app/studio/page";
import { CreateRoom } from "@/components/studio/StudioRooms";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
  apiPost: vi.fn(),
  showToast: vi.fn(),
  room: "publish",
  workspace: { id: "tenant-empty", name: "빈 작업 공간" },
}));

vi.mock("swr", () => ({ default: (...args: unknown[]) => mocks.swr(...args) }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
}));
vi.mock("@/lib/api", () => ({
  fetcher: vi.fn(),
  apiPost: (...args: unknown[]) => mocks.apiPost(...args),
  isExternalPublishPersistenceError: () => false,
  ApiResponseError: class ApiResponseError extends Error { payload: unknown = null; },
}));
vi.mock("@/components/layout/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/store/ui-store", () => ({
  useUIStore: () => ({ activeWorkspace: mocks.workspace, studioRoom: mocks.room, setStudioRoom: vi.fn() }),
}));
vi.mock("@/components/studio/PlatformPreview", () => ({
  PREVIEW_PLATFORMS: ["threads", "x", "facebook", "instagram", "shorts", "reels", "tiktok"].map((key) => ({ key, label: key })),
  PlatformPreview: ({ platform }: { platform: string }) => <div data-room-preview={platform}>{platform}</div>,
}));
vi.mock("@/components/shared/BrandSetupWizard", () => ({ BrandSetupWizard: () => null }));
vi.mock("@/components/studio/RepoConnect", () => ({ RepoConnect: () => null }));
vi.mock("@/components/studio/SchedulePanel", () => ({ SchedulePanel: () => null }));
vi.mock("@/lib/analytics/events", () => ({ trackEvent: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authHeaders: () => ({}) }));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/studio");
  mocks.room = "publish";
  mocks.apiPost.mockReset();
  mocks.swr.mockReset();
  mocks.swr.mockImplementation((key: string | null) => {
    if (key === "/api/me") return { data: { isOperator: false }, mutate: vi.fn() };
    if (key === "/api/studio/drafts?tenant_id=tenant-empty") return { data: { drafts: [] }, mutate: vi.fn() };
    if (key === "/api/studio/brand-setup?tenant_id=tenant-empty") return { data: { guide: null }, mutate: vi.fn() };
    if (key === "/api/publish/first-comment-capabilities") return { data: { capabilities: [] }, mutate: vi.fn() };
    return { data: undefined, mutate: vi.fn() };
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ accounts: [] })));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("OSMU-FLOW-UI-02 발행실 빈 상태 계약", () => {
  it("OSMU-FLOW-UI-02 정상 경로: 작업물이 없으면 다음 행동 한 줄과 생성실 단추를 보인다", async () => {
    render(<StudioPage />);

    expect(document.querySelector('[data-empty-next="publish"]')).toHaveTextContent("발행할 작업물을 먼저 가져와 주세요.");
    expect(screen.getByRole("button", { name: "생성실 열기" })).toBeInTheDocument();
  });

  it("OSMU-FLOW-UI-02 거절 조건: 빈 상태 단추는 죽은 단추가 아니라 생성실 경로를 연다", async () => {
    render(<StudioPage />);

    fireEvent.click(screen.getByRole("button", { name: "생성실 열기" }));
    await waitFor(() => expect(window.location.pathname + window.location.search).toBe("/studio?room=create"));
  });
});

describe("OSMU-FLOW-UI-03 생성실 첫 행동 계약", () => {
  it("OSMU-FLOW-UI-03 정상 경로: 첫 화면에 적을 칸이 아니라 고를 카드를 보인다", () => {
    render(<CreateRoom workspaceId="tenant-empty" workspaceName="빈 작업 공간" guide="" topic="" onTopicChange={vi.fn()} onOpenLearning={vi.fn()} onCandidateSelect={vi.fn()} />);

    expect(document.querySelector('[data-empty-next="create"]')).toHaveTextContent("한 번에 하나씩 묻겠습니다. 선택한 답은 다음 질문에 반영됩니다.");
    // 회장 지적("주관식이면 나라도 뭘 입력해야할 지를 모르겠는데")의 계약.
    // 기본 경로에는 자유 입력 칸이 한 칸도 없다.
    expect(document.querySelectorAll('[data-create-topic-picker] input')).toHaveLength(0);
    expect(screen.getByRole("button", { name: "영상" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "카드뉴스" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "글" })).toBeInTheDocument();
  });

  it("OSMU-FLOW-UI-03 거절 조건: 카드에 없는 주제는 직접 적는 칸으로 빠져나갈 수 있다", () => {
    render(<CreateRoom workspaceId="tenant-empty" workspaceName="빈 작업 공간" guide="" topic="" onTopicChange={vi.fn()} onOpenLearning={vi.fn()} onCandidateSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "영상" }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("button", { name: "브랜드 알리기" }));
    fireEvent.click(screen.getByRole("button", { name: "처음 해 보는 사람" }));
    fireEvent.click(screen.getByRole("button", { name: "직접 입력" }));
    expect(screen.getByLabelText("직접 입력한 주제")).toBeInTheDocument();
  });
});

describe("V75-CREATE-NETWORK 생성실 직접 생성 계약", () => {
  it("V75-CREATE-NETWORK-01 정상: 주제와 선택 구조를 text API에 보내고 결과를 화면에 표시한다", async () => {
    mocks.room = "create";
    window.history.replaceState(null, "", "/studio?room=create");
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/studio/text") {
        return { ok: true, threads: "네트워크 요청으로 생성된 한국어 본문입니다." };
      }
      return { ok: true };
    });

    render(<StudioPage />);
    fireEvent.change(await screen.findByLabelText("초안 주제"), { target: { value: "고객 질문 답변" } });
    fireEvent.click(screen.getByRole("button", { name: "A 구조 사용" }));
    fireEvent.click(screen.getByRole("button", { name: "초안 만들기" }));

    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/studio/text",
      expect.objectContaining({
        idea: "고객 질문 답변",
        tenant_id: "tenant-empty",
        structure: expect.objectContaining({ label: "A", title: "문제 제시형" }),
      }),
    ));
    expect(await screen.findByText("네트워크 요청으로 생성된 한국어 본문입니다.")).toBeInTheDocument();
  });

  it("V75-CREATE-NETWORK-02 거절: 주제가 비어 있으면 text API를 호출하지 않는다", async () => {
    mocks.room = "create";
    window.history.replaceState(null, "", "/studio?room=create");

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "A 구조 사용" }));

    const generate = screen.getByRole("button", { name: "초안 만들기" });
    expect(generate).toBeDisabled();
    fireEvent.click(generate);
    expect(mocks.apiPost).not.toHaveBeenCalledWith("/api/studio/text", expect.anything());
  });
});

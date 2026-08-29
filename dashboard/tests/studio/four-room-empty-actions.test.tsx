// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudioPage from "@/app/studio/page";
import { CreateRoom } from "@/components/studio/StudioRooms";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
  showToast: vi.fn(),
  workspace: { id: "tenant-empty", name: "빈 작업 공간" },
}));

vi.mock("swr", () => ({ default: (...args: unknown[]) => mocks.swr(...args) }));
vi.mock("@/lib/api", () => ({
  fetcher: vi.fn(),
  apiPost: vi.fn(),
  isExternalPublishPersistenceError: () => false,
  ApiResponseError: class ApiResponseError extends Error { payload: unknown = null; },
}));
vi.mock("@/components/layout/Toast", () => ({ useToast: () => ({ showToast: mocks.showToast }) }));
vi.mock("@/store/ui-store", () => ({
  useUIStore: () => ({ activeWorkspace: mocks.workspace, studioRoom: "publish", setStudioRoom: vi.fn() }),
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

    expect(document.querySelector('[data-empty-next="create"]')).toHaveTextContent("고르기만 하시면 됩니다. 적을 것은 없습니다.");
    // 회장 지적("주관식이면 나라도 뭘 입력해야할 지를 모르겠는데")의 계약.
    // 기본 경로에는 자유 입력 칸이 한 칸도 없다.
    expect(document.querySelectorAll('[data-create-topic-picker] input')).toHaveLength(0);
    expect(screen.getByRole("button", { name: "영상" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "카드뉴스" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "글" })).toBeInTheDocument();
  });

  it("OSMU-FLOW-UI-03 거절 조건: 카드에 없는 주제는 직접 적는 칸으로 빠져나갈 수 있다", () => {
    render(<CreateRoom workspaceId="tenant-empty" workspaceName="빈 작업 공간" guide="" topic="" onTopicChange={vi.fn()} onOpenLearning={vi.fn()} onCandidateSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "여기 없습니다. 직접 적겠습니다" }));
    expect(screen.getByLabelText("이번 주제")).toBeInTheDocument();
  });
});

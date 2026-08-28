// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudioPage from "@/app/studio/page";

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  fetcher: vi.fn(),
  showToast: vi.fn(),
  trackEvent: vi.fn(),
  swr: vi.fn(),
  swrKeys: [] as Array<string | null>,
  isOperator: true,
  workspace: { id: "tenant-a", name: "Tenant A" },
  drafts: [] as Array<Record<string, unknown>>,
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
}));

vi.mock("@/lib/api", () => ({
  fetcher: mocks.fetcher,
  apiPost: (...args: unknown[]) => mocks.apiPost(...args),
  isExternalPublishPersistenceError: () => false,
  ApiResponseError: class ApiResponseError extends Error {
    payload: unknown = null;
  },
}));

vi.mock("@/components/layout/Toast", () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

vi.mock("@/store/ui-store", () => ({
  useUIStore: () => ({
    activeWorkspace: mocks.workspace,
    studioRoom: "publish",
    setStudioRoom: vi.fn(),
  }),
}));

vi.mock("@/components/studio/PlatformPreview", () => ({
  PREVIEW_PLATFORMS: [
    "threads",
    "x",
    "facebook",
    "instagram",
    "shorts",
    "reels",
    "tiktok",
  ].map((key) => ({ key, label: key })),
  PlatformPreview: ({ platform, headerRight, editor }: { platform: string; headerRight?: React.ReactNode; editor?: { firstCommentSupported: boolean; firstCommentReason?: string; firstComment: string; onFirstCommentChange: (value: string) => void } }) => (
    <div data-testid={`preview-${platform}`}>
      {headerRight}
      {editor?.firstCommentSupported ? <textarea aria-label={`${platform} 첫 댓글`} value={editor.firstComment} onChange={(event) => editor.onFirstCommentChange(event.target.value)} /> : <span>{editor?.firstCommentReason}</span>}
    </div>
  ),
}));

vi.mock("@/components/shared/BrandSetupWizard", () => ({
  BrandSetupWizard: () => null,
}));

vi.mock("@/components/studio/RepoConnect", () => ({
  RepoConnect: () => null,
}));

vi.mock("@/components/studio/SchedulePanel", () => ({
  SchedulePanel: () => null,
}));

vi.mock("@/lib/analytics/events", () => ({
  trackEvent: mocks.trackEvent,
}));

vi.mock("@/lib/auth", () => ({
  authHeaders: () => ({}),
}));

function restoreStudio(platforms: string[]) {
  localStorage.setItem("studio_work", JSON.stringify({
    idea: "부분 성공 테스트",
    text: {
      threads: "Threads 본문",
      x: "X 본문",
      instagram: { caption: "Instagram 본문" },
      shorts: { hook: "hook", body: "body", cta: "cta" },
    },
    includes: Object.fromEntries(
      ["threads", "x", "facebook", "instagram", "shorts", "reels", "tiktok"]
        .map((platform) => [platform, platforms.includes(platform)]),
    ),
  }));
}

function draftSaveStatuses() {
  return mocks.apiPost.mock.calls
    .filter(([path]) => path === "/api/studio/drafts")
    .map(([, body]) => (body as { status: string }).status);
}

describe("Studio publish result integrity", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.apiPost.mockReset();
    mocks.fetcher.mockReset();
    mocks.showToast.mockReset();
    mocks.trackEvent.mockReset();
    mocks.swr.mockReset();
    mocks.swrKeys.length = 0;
    mocks.isOperator = true;
    mocks.drafts = [];
    mocks.swr.mockImplementation((key: string | null) => {
      mocks.swrKeys.push(key);
      if (key === "/api/me") {
        return { data: { isOperator: mocks.isOperator }, mutate: vi.fn() };
      }
      if (key === "/api/studio/drafts?tenant_id=tenant-a") {
        return { data: { drafts: mocks.drafts }, mutate: vi.fn() };
      }
      if (key === "/api/studio/brand-setup?tenant_id=tenant-a") {
        return { data: { guide: null }, mutate: vi.fn() };
      }
      if (key === "/api/publish/first-comment-capabilities") {
        return { data: { capabilities: [
          { platform: "threads", supported: true, reason: null },
          { platform: "x", supported: true, reason: null },
          { platform: "instagram", supported: true, reason: null },
          { platform: "facebook", supported: true, reason: null },
          { platform: "shorts", supported: false, reason: "YouTube 영상 발행 route에 첫 댓글 후속 호출이 아직 연결되지 않았습니다." },
          { platform: "reels", supported: false, reason: "Reels 영상 발행 route에 첫 댓글 후속 호출이 아직 연결되지 않았습니다." },
          { platform: "tiktok", supported: false, reason: "현재 TikTok provider adapter는 댓글 생성 계약을 제공하지 않습니다." },
        ] }, mutate: vi.fn() };
      }
      return { data: undefined, mutate: vi.fn() };
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ accounts: [] })));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("does not report 100% or completed, and never stores published, when every channel returns ok:false", async () => {
    restoreStudio(["threads", "x"]);
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/studio/drafts") return { id: "draft-1" };
      if (path === "/api/publish") return { ok: false, error: "채널 미연결" };
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "2곳에 올리기" }));

    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledTimes(4));
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.queryByText("발행 완료")).not.toBeInTheDocument();
    expect(draftSaveStatuses()).toEqual(["draft", "partial"]);
  });

  it("stores partial and counts only successful channels when results are mixed", async () => {
    restoreStudio(["threads", "x"]);
    mocks.apiPost.mockImplementation(async (path: string, body: { platform?: string }) => {
      if (path === "/api/studio/drafts") return { id: "draft-1" };
      if (path === "/api/publish" && body.platform === "threads") {
        return { ok: true, permalink: "https://www.threads.net/@example/post/1" };
      }
      if (path === "/api/publish" && body.platform === "x") {
        return { ok: false, error: "X 계정 미연결" };
      }
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "2곳에 올리기" }));

    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledTimes(4));
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("일부 발행 실패")).toBeInTheDocument();
    expect(screen.getByText("X 계정 미연결")).toBeInTheDocument();
    expect(draftSaveStatuses()).toEqual(["draft", "partial"]);
  });

  it("발행-부분-03 거절: 본문 성공 뒤 첫 댓글 실패를 전체 성공과 publish_success로 세지 않는다", async () => {
    restoreStudio(["x"]);
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/studio/drafts") return { id: "draft-first-comment" };
      if (path === "/api/publish") return {
        ok: true,
        partial: true,
        permalink: "https://x.com/example/status/1",
        firstComment: { ok: false, error: "첫 댓글 공급자 거절" },
      };
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "1곳에 올리기" }));

    await waitFor(() => expect(screen.getByText("0%")).toBeInTheDocument());
    expect(screen.getByText("첫 댓글 공급자 거절")).toBeInTheDocument();
    expect(draftSaveStatuses()).toEqual(["draft", "partial"]);
    expect(mocks.trackEvent.mock.calls.filter(([event]) => event.name === "publish_success")).toHaveLength(0);
  });

  it("발행-병렬-04 경합: 느린 첫 채널이 끝나기 전에 둘째 채널 요청을 시작한다", async () => {
    restoreStudio(["threads", "x"]);
    let releaseThreads: () => void = () => {};
    const threadsPending = new Promise<void>((resolve) => { releaseThreads = resolve; });
    mocks.apiPost.mockImplementation(async (path: string, body: { platform?: string }) => {
      if (path === "/api/studio/drafts") return { id: "draft-parallel" };
      if (path === "/api/publish" && body.platform === "threads") {
        await threadsPending;
        return { ok: true, permalink: "https://threads.net/p/1" };
      }
      if (path === "/api/publish" && body.platform === "x") return { ok: true, permalink: "https://x.com/p/2" };
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "2곳에 올리기" }));

    await waitFor(() => expect(mocks.apiPost.mock.calls.some(([, body]) => (body as { platform?: string })?.platform === "x")).toBe(true));
    expect(mocks.apiPost.mock.calls.some(([, body]) => (body as { platform?: string })?.platform === "threads")).toBe(true);
    releaseThreads();
    await waitFor(() => expect(screen.getByText("100%")).toBeInTheDocument());
  });

  it("defaults publish targets to supported channels and labels generation-only video channels", async () => {
    localStorage.setItem("studio_work", JSON.stringify({
      idea: "기본 발행 대상 테스트",
      text: {
        threads: "Threads 본문",
        x: "X 본문",
        instagram: { caption: "Instagram 본문" },
        shorts: { hook: "hook", body: "body", cta: "cta" },
      },
    }));
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/studio/drafts") return { id: "draft-defaults" };
      if (path === "/api/publish") return { ok: false, error: "테스트 중단" };
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    const publishButton = await screen.findByRole("button", { name: "3곳에 올리기" });
    for (const [platform, label] of [["shorts", "Shorts"], ["reels", "Reels"], ["tiktok", "TikTok"]]) {
      expect(within(screen.getByTestId(`preview-${platform}`)).getByRole(
        "checkbox",
        { name: `${label} 발행 미지원` },
      )).toBeDisabled();
    }

    fireEvent.click(publishButton);
    await waitFor(() => {
      expect(mocks.apiPost.mock.calls.filter(([path]) => path === "/api/publish")).toHaveLength(3);
    });
    expect(mocks.apiPost.mock.calls
      .filter(([path]) => path === "/api/publish")
      .map(([, body]) => (body as { platform: string }).platform))
      .toEqual(["threads", "x", "instagram"]);
  });

  it("FE3-PUBLISH-03 거절: 발행 이력은 발행실에 다시 노출하지 않는다", async () => {
    mocks.drafts = [{
      id: "draft-history",
      idea: "불러올 초안",
      text: { threads: "불러온 Threads 본문" },
      includes: { threads: true, x: false, facebook: false, instagram: false },
      status: "draft",
      savedAt: "2026-08-12T00:00:00Z",
    }];

    render(<StudioPage />);
    expect(screen.queryByText("발행 이력")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "불러오기" })).not.toBeInTheDocument();
  });

  it("FE3-PUBLISH-04 거절: 본문이 없으면 실행 단추를 노출하지 않는다", async () => {
    mocks.drafts = [{ id: "draft-empty", idea: "빈 초안", text: null, status: "draft", savedAt: "2026-08-12T00:00:00Z" }];
    render(<StudioPage />);
    expect(screen.queryByText("본문 없음 · 재생성 필요")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Publish/ })).not.toBeInTheDocument();
  });

  it("FE3-PUBLISH-05 거절: 발행실은 생성 명령과 설정 단추 목록을 노출하지 않는다", async () => {
    render(<StudioPage />);
    expect(screen.queryByPlaceholderText("글감 / 콘텐츠 주제 입력")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "OSMU 생성" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /AI 자동초안/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /브랜드 설정/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /위키/ })).not.toBeInTheDocument();
  });

  it("TC-F2: 발행 성공은 permalink 링크와 published 저장으로 닫힌다", async () => {
    restoreStudio(["threads"]);
    mocks.apiPost.mockImplementation(async (path: string, body: { status?: string }) => {
      if (path === "/api/studio/drafts") return { id: "draft-1", status: body.status };
      if (path === "/api/publish") return { ok: true, permalink: "https://www.threads.net/@example/post/ok" };
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "1곳에 올리기" }));

    const link = await screen.findByTitle("게시물 보기");
    expect(link).toHaveAttribute("href", "https://www.threads.net/@example/post/ok");
    expect(draftSaveStatuses()).toEqual(["draft", "published"]);
    expect(mocks.showToast).toHaveBeenCalledWith("발행 완료 ✓", "success");
  });

  it("FE2-PUB-01 정상: 지원 채널 첫 댓글은 미리보기에서 편집되고 발행 API에 전달된다", async () => {
    restoreStudio(["threads"]);
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/studio/drafts") return { id: "draft-first-comment" };
      if (path === "/api/publish") return { ok: true, permalink: "https://www.threads.net/@example/post/comment" };
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.change(await screen.findByLabelText("threads 첫 댓글"), { target: { value: "첫 댓글 본문" } });
    fireEvent.click(screen.getByRole("button", { name: "1곳에 올리기" }));

    await waitFor(() => expect(mocks.apiPost.mock.calls.some(([path, body]) => path === "/api/publish" && (body as { first_comment?: string }).first_comment === "첫 댓글 본문")).toBe(true));
  });

  it("FE2-PUB-02 거절: 미지원 채널은 첫 댓글 입력 대신 백엔드 사유를 표시한다", async () => {
    render(<StudioPage />);
    expect(await within(screen.getByTestId("preview-tiktok")).findByText("현재 TikTok provider adapter는 댓글 생성 계약을 제공하지 않습니다.")).toBeInTheDocument();
    expect(within(screen.getByTestId("preview-tiktok")).queryByRole("textbox", { name: "tiktok 첫 댓글" })).not.toBeInTheDocument();
  });

  it("FE3-PUBLISH-01 정상: 발행 체크와 계정 선택은 각 미리보기 칸 머리에 있다", async () => {
    render(<StudioPage />);
    const threads = within(await screen.findByTestId("preview-threads"));
    expect(threads.getByRole("checkbox", { name: "Threads 발행" })).toBeChecked();
    expect(screen.queryByText("발행 채널")).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "발행 담당 대화창" })).toBeInTheDocument();
  });

  it("FE3-PUBLISH-02 거절: 미지원 영상 채널은 미리보기 안에서 발행 체크를 잠근다", async () => {
    render(<StudioPage />);
    const tiktok = within(await screen.findByTestId("preview-tiktok"));
    expect(tiktok.getByRole("checkbox", { name: "TikTok 발행 미지원" })).toBeDisabled();
  });

  it("FE3-REVIEW-01 정상: 검토 요청은 큐 생성 뒤 기존 검토 API를 호출한다", async () => {
    restoreStudio(["threads"]);
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/queue/add") return { post: { id: "queue-review" } };
      if (path === "/api/queue/queue-review/request-review") return { reused: false };
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "검토 요청" }));

    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/queue/queue-review/request-review",
      expect.objectContaining({ tenant_id: "tenant-a" }),
    ));
    expect(mocks.showToast).toHaveBeenCalledWith("승인 인박스로 검토 요청을 보냈습니다", "success");
  });

  it("FE3-REVIEW-02 거절: 큐 생성 실패 시 검토 API를 호출하지 않는다", async () => {
    restoreStudio(["threads"]);
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/queue/add") throw new Error("큐 저장 실패");
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "검토 요청" }));

    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledWith("큐 저장 실패", "error"));
    expect(mocks.apiPost.mock.calls.some(([path]) => String(path).includes("request-review"))).toBe(false);
  });
});

describe("Studio Higgsfield operator boundary", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.apiPost.mockReset();
    mocks.fetcher.mockReset();
    mocks.showToast.mockReset();
    mocks.swr.mockReset();
    mocks.swrKeys.length = 0;
    mocks.isOperator = false;
    mocks.swr.mockImplementation((key: string | null) => {
      mocks.swrKeys.push(key);
      if (key === "/api/me") {
        return { data: { isOperator: false }, mutate: vi.fn() };
      }
      if (key === "/api/studio/drafts?tenant_id=tenant-a") {
        return { data: { drafts: [] }, mutate: vi.fn() };
      }
      if (key === "/api/studio/brand-setup?tenant_id=tenant-a") {
        return { data: { guide: null }, mutate: vi.fn() };
      }
      return { data: undefined, mutate: vi.fn() };
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ accounts: [] })));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("FE3-OPERATOR-01 거절: 발행실은 운영자 전용 생성 API와 제어를 노출하지 않는다", async () => {
    render(<StudioPage />);
    expect(mocks.swrKeys.filter((key) => key?.startsWith("/api/higgsfield/"))).toEqual([]);
    expect(mocks.apiPost.mock.calls.map(([path]) => path).filter((path) => (
      String(path).startsWith("/api/higgsfield/")
    ))).toEqual([]);
    expect(screen.queryByRole("button", { name: "OSMU 생성" })).not.toBeInTheDocument();
    expect(screen.queryByTitle("사용 이력 보기")).not.toBeInTheDocument();
  });
});

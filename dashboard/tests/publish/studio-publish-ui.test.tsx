// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudioPage from "@/app/studio/page";

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  fetcher: vi.fn(),
  showToast: vi.fn(),
  swr: vi.fn(),
  swrKeys: [] as Array<string | null>,
  isOperator: true,
  workspace: { id: "tenant-a", name: "Tenant A" },
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
}));

vi.mock("@/lib/api", () => ({
  fetcher: mocks.fetcher,
  apiPost: (...args: unknown[]) => mocks.apiPost(...args),
  isExternalPublishPersistenceError: () => false,
}));

vi.mock("@/components/layout/Toast", () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

vi.mock("@/store/ui-store", () => ({
  useUIStore: () => ({
    activeWorkspace: mocks.workspace,
  }),
}));

vi.mock("@/components/studio/PlatformPreview", () => ({
  PlatformPreview: ({ platform, headerRight }: { platform: string; headerRight?: React.ReactNode }) => (
    <div data-testid={`preview-${platform}`}>{headerRight}</div>
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
  trackEvent: vi.fn(),
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
    mocks.swr.mockReset();
    mocks.swrKeys.length = 0;
    mocks.isOperator = true;
    mocks.swr.mockImplementation((key: string | null) => {
      mocks.swrKeys.push(key);
      if (key === "/api/me") {
        return { data: { isOperator: mocks.isOperator }, mutate: vi.fn() };
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

  it("does not report 100% or completed, and never stores published, when every channel returns ok:false", async () => {
    restoreStudio(["threads", "x"]);
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/studio/drafts") return { id: "draft-1" };
      if (path === "/api/publish") return { ok: false, error: "채널 미연결" };
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.click(await screen.findByRole("button", { name: "🚀 Publish (2)" }));

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
    fireEvent.click(await screen.findByRole("button", { name: "🚀 Publish (2)" }));

    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledTimes(4));
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("일부 발행 실패")).toBeInTheDocument();
    expect(screen.getByText("X 계정 미연결")).toBeInTheDocument();
    expect(draftSaveStatuses()).toEqual(["draft", "partial"]);
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

  it("uses null SWR keys, hides Higgsfield controls, and never requests Higgsfield for a non-operator", async () => {
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/studio/text") {
        return {
          ok: true,
          threads: "Threads 본문",
          x: "X 본문",
          instagram: { caption: "Instagram 본문" },
          shorts: { hook: "hook", body: "body", cta: "cta" },
          image_prompt: "이미지 프롬프트",
        };
      }
      if (path.startsWith("/api/higgsfield/")) {
        return { ok: false, error: "운영자 전용" };
      }
      throw new Error(`unexpected path: ${path}`);
    });

    render(<StudioPage />);
    fireEvent.change(screen.getByPlaceholderText("글감 / 콘텐츠 주제 입력"), {
      target: { value: "고객용 텍스트 생성" },
    });
    fireEvent.click(screen.getByRole("button", { name: "OSMU 생성" }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith("/api/studio/text", expect.any(Object));
    });
    expect(mocks.swrKeys.filter((key) => key?.startsWith("/api/higgsfield/"))).toEqual([]);
    expect(mocks.apiPost.mock.calls.map(([path]) => path).filter((path) => (
      String(path).startsWith("/api/higgsfield/")
    ))).toEqual([]);
    expect(screen.getByText("이미지·영상 생성과 Higgsfield 크레딧은 운영자 전용 기능입니다.")).toBeInTheDocument();
    expect(screen.queryByTitle("사용 이력 보기")).not.toBeInTheDocument();
  });
});

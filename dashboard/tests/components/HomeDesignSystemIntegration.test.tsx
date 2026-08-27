// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  mutateMetrics: vi.fn(),
  posts: [] as Array<Record<string, unknown>>,
}));

vi.mock("swr", () => ({
  default: () => ({ data: { posts: mocks.posts }, mutate: mocks.mutateMetrics }),
}));

vi.mock("@/lib/api", () => ({
  fetcher: vi.fn(),
  apiPost: (...args: unknown[]) => mocks.apiPost(...args),
}));

vi.mock("@/components/studio/PlatformPreview", () => ({
  Logo: () => <span aria-hidden>◎</span>,
  PREVIEW_PLATFORMS: [{ key: "threads", label: "Threads" }],
}));

vi.mock("@/hooks/useOverview", () => ({
  useOverview: () => ({ data: { statusCounts: {}, channelCounts: {}, followers: 0, viralPosts: [] } }),
  useActivity: () => ({ data: { events: [] } }),
  useAlerts: () => ({ data: { alerts: [] } }),
  useWeeklySummary: () => ({ data: undefined }),
  useAgentLogs: () => ({ data: { logs: [] } }),
  useUsage: () => ({ data: undefined }),
  useErrors: () => ({ data: { last24h: 0 } }),
}));

vi.mock("@/hooks/useChannelConfig", () => ({ useChannelConfig: () => ({ data: {} }) }));
vi.mock("@/hooks/useOnboarding", () => ({ useOnboardingStatus: () => ({ data: { completed: true }, mutate: vi.fn() }) }));
vi.mock("@/store/ui-store", () => ({
  useUIStore: () => ({
    dismissedOnboarding: true,
    dismissOnboarding: vi.fn(),
    activeWorkspace: { id: "tenant-a", name: "Tenant A" },
  }),
}));
vi.mock("@/components/shared/OnboardingWizard", () => ({ OnboardingWizard: () => null }));
vi.mock("@/components/shared/ChannelConnectBanner", () => ({ ChannelConnectBanner: () => null }));
vi.mock("@/components/shared/OnboardingChecklist", () => ({ OnboardingChecklist: () => null }));
vi.mock("@/components/home/PipelineTimeline", () => ({ PipelineTimeline: () => null }));
vi.mock("@/lib/analytics/events", () => ({ trackEvent: vi.fn() }));

describe("Home design-system migration interactions", () => {
  beforeEach(() => {
    mocks.apiPost.mockReset();
    mocks.mutateMetrics.mockReset();
    mocks.posts = [];
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/suggestions") {
        return {
          suggestions: [{
            id: "hyp-1",
            text: "문제와 해결 전후를 비교하는 콘텐츠",
            basis: "hypothesis",
            label: "가설 · 우리 검증 기록 아님",
            verified: false,
            evidence: {
              postIds: [], signalIds: [], sampleCount: 0, sampleThreshold: 5,
              sampleThresholdMet: false, brandContextAvailable: true, marketTrendAvailable: false,
            },
          }],
          sampleAssessment: { count: 0, threshold: 5, thresholdMet: false },
        };
      }
      if (path === "/api/suggestions/enqueue") return { ok: true, reused: false };
      return { ok: true };
    });
  });

  afterEach(cleanup);

  it("FE-V63-01 정상 경로: 표본 0건은 미수집과 5건 문턱을 표시한다", async () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: "아직 판정할 표본이 없습니다" })).toBeInTheDocument();
    expect(screen.getAllByText("미수집").length).toBeGreaterThanOrEqual(10);
    expect(screen.getByText("성과 표본 0건입니다. 5건부터 판정합니다.")).toBeInTheDocument();
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/suggestions",
      { tenant_id: "tenant-a" },
    ));
    expect(await screen.findByText("가설 · 우리 검증 기록 아님")).toBeInTheDocument();
  });

  it("FE-V63-02 정상 경로: 제안 카드를 생성 큐 API로 인계한다", async () => {
    render(<HomePage />);

    const queueButton = await screen.findByRole("button", { name: "이 제안을 생성 큐에 넣기" });
    fireEvent.click(queueButton);
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/suggestions/enqueue",
      expect.objectContaining({
        tenant_id: "tenant-a",
        suggestion: expect.objectContaining({ id: "hyp-1", label: "가설 · 우리 검증 기록 아님" }),
      }),
    ));
    expect(await screen.findByRole("button", { name: "생성 큐에 넣었어요" })).toBeDisabled();
  });

  it("FE-V63-02 거절 경로: 큐 인계 실패는 다음 행동과 재시도를 남긴다", async () => {
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/suggestions") {
        return {
          suggestions: [{
            id: "hyp-reject",
            text: "거절 경로 제안",
            basis: "hypothesis",
            label: "가설 · 우리 검증 기록 아님",
            verified: false,
            evidence: {
              postIds: [], signalIds: [], sampleCount: 0, sampleThreshold: 5,
              sampleThresholdMet: false, brandContextAvailable: false, marketTrendAvailable: false,
            },
          }],
          sampleAssessment: { count: 0, threshold: 5, thresholdMet: false },
        };
      }
      if (path === "/api/suggestions/enqueue") throw new Error("rejected");
      return { ok: true };
    });
    render(<HomePage />);

    fireEvent.click(await screen.findByRole("button", { name: "이 제안을 생성 큐에 넣기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("생성 큐에 넣지 못했어요. 잠시 후 다시 눌러 주세요.");
    expect(screen.getByRole("button", { name: "이 제안을 생성 큐에 넣기" })).toBeEnabled();
  });

  it("FE-V63-03 경계값: 성과 표본 5건이면 실제 조회값으로 판정 막대를 만든다", async () => {
    mocks.posts = [1000, 800, 300, 200, 100].map((views, index) => ({
      id: `post-${index}`,
      platform: "threads",
      text: `성과 글 ${index + 1}`,
      status: "published",
      published_at: "2026-08-27T10:00:00.000Z",
      views,
      likes: index,
      replies: index,
    }));
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1, name: "조회 상위 2편이 나머지보다 4.5배 멀리 갔습니다" })).toBeInTheDocument();
    expect(screen.getByLabelText("조회 상위 2편 평균 900")).toHaveAttribute("value", "900");
    expect(screen.getByText("성과 표본 5건입니다. 5건부터 판정합니다.")).toBeInTheDocument();
  });

  it("FE-V63-04 정상 경로: 플랫폼 집중과 성과 재수집 버튼이 실제 API에 연결된다", async () => {
    render(<HomePage />);

    const threads = screen.getByRole("button", { name: "Threads" });
    fireEvent.click(threads);
    expect(threads).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByText("올린 글별 성적"));
    fireEvent.click(screen.getByRole("button", { name: "성과 다시 수집하기" }));
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/metrics",
      { tenant_id: "tenant-a" },
    ));
    expect(mocks.mutateMetrics).toHaveBeenCalled();
  });

  it("FE5-PERF-01 정상 경로: 통한 글에서 성과 제안을 실제 API로 불러온다", async () => {
    mocks.posts = [1200, 900, 500, 300, 100].map((views, index) => ({
      id: `post-${index}`,
      platform: "threads",
      text: `성과 글 ${index + 1}`,
      status: "published",
      published_at: "2026-08-27T10:00:00.000Z",
      views,
      likes: index,
      replies: index,
    }));
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "이 결로 한 편 더" }));

    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/suggestions",
      { tenant_id: "tenant-a" },
    ));
    expect(await screen.findByText("문제와 해결 전후를 비교하는 콘텐츠")).toBeInTheDocument();
  });

  it("FE5-PERF-02 거절 경로: 성과 제안 호출 실패는 오류와 재시도 동작을 남긴다", async () => {
    mocks.posts = [1200, 900, 500, 300, 100].map((views, index) => ({
      id: `post-${index}`,
      platform: "threads",
      text: `성과 글 ${index + 1}`,
      status: "published",
      published_at: "2026-08-27T10:00:00.000Z",
      views,
      likes: index,
      replies: index,
    }));
    mocks.apiPost.mockImplementation(async (path: string) => {
      if (path === "/api/suggestions") throw new Error("suggestions unavailable");
      return { ok: true };
    });
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "이 결로 한 편 더" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("제안을 불러오지 못했어요. 잠시 후 다시 받아 주세요.");
    expect(screen.getByRole("button", { name: "이 결로 한 편 더" })).toBeEnabled();
  });

  it("FE5-PERF-03 정상 경로: 댓글 수와 원문 링크는 보여 주되 준비 안 된 답글 기능은 만들지 않는다", () => {
    mocks.posts = [{
      id: "post-with-replies",
      platform: "threads",
      text: "반응이 달린 글",
      status: "published",
      published_at: "2026-08-27T10:00:00.000Z",
      views: 100,
      likes: 12,
      replies: 3,
      permalink: "https://example.com/posts/1",
    }];
    render(<HomePage />);

    expect(screen.getByText("댓글 본문 읽기와 답글 보내기는 준비 중입니다.")).toBeInTheDocument();
    expect(screen.getByText("Threads · 답글 3개")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "게시물에서 확인하기" })).toHaveAttribute("href", "https://example.com/posts/1");
    expect(screen.queryByRole("textbox", { name: /답글/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /답글.*보내기/ })).not.toBeInTheDocument();
  });

  it("FE5-PERF-04 거절 경로: 원문 링크가 없는 반응은 죽은 단추 대신 준비 상태만 표시한다", () => {
    mocks.posts = [{
      id: "post-without-link",
      platform: "threads",
      text: "원문 링크가 없는 글",
      status: "published",
      published_at: "2026-08-27T10:00:00.000Z",
      views: 100,
      likes: 12,
      replies: 3,
    }];
    render(<HomePage />);

    expect(screen.getByText("원문 연동 준비 중")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "게시물에서 확인하기" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /답글/ })).not.toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  mutateMetrics: vi.fn(),
}));

vi.mock("swr", () => ({
  default: () => ({ data: { posts: [] }, mutate: mocks.mutateMetrics }),
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
    mocks.apiPost.mockImplementation(async (path: string) => (
      path === "/api/suggestions" ? { ideas: ["추천 아이디어"] } : { ok: true }
    ));
  });

  afterEach(cleanup);

  it("keeps platform focus and both action buttons wired after migration", async () => {
    render(<HomePage />);

    const threads = screen.getByRole("button", { name: "Threads" });
    fireEvent.click(threads);
    expect(threads).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "💡 성과 기반 다음 아이디어" }));
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith("/api/suggestions"));

    fireEvent.click(screen.getByRole("button", { name: "🔄 성과 수집" }));
    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith(
      "/api/metrics",
      { tenant_id: "tenant-a" },
    ));
    expect(mocks.mutateMetrics).toHaveBeenCalled();
  });
});

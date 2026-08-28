// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

const mocks = vi.hoisted(() => ({
  onboardingCompleted: false,
  dismissedOnboarding: false,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("swr", () => ({
  default: () => ({ data: { posts: [] }, mutate: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  fetcher: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/hooks/useOverview", () => ({
  useOverview: () => ({ data: { statusCounts: {}, summary: {}, followers: 0, viralPosts: [] } }),
  useActivity: () => ({ data: { events: [] } }),
  useAlerts: () => ({ data: { alerts: [] } }),
  useAgentLogs: () => ({ data: { logs: [] } }),
  useUsage: () => ({ data: undefined }),
  useErrors: () => ({ data: { last24h: 0 } }),
}));

vi.mock("@/hooks/useChannelConfig", () => ({
  useChannelConfig: () => ({ data: {} }),
}));

vi.mock("@/hooks/useOnboarding", () => ({
  useOnboardingStatus: () => ({
    data: { completed: mocks.onboardingCompleted },
    mutate: vi.fn(),
  }),
}));

vi.mock("@/store/ui-store", () => ({
  useUIStore: () => ({
    dismissedOnboarding: mocks.dismissedOnboarding,
    dismissOnboarding: vi.fn(),
    activeWorkspace: { id: "tenant-first", name: "첫 작업 공간" },
  }),
}));

vi.mock("@/components/shared/ChannelConnectBanner", () => ({ ChannelConnectBanner: () => null }));
vi.mock("@/components/shared/OnboardingChecklist", () => ({ OnboardingChecklist: () => null }));
vi.mock("@/components/home/PipelineTimeline", () => ({ PipelineTimeline: () => null }));
vi.mock("@/components/home/PerformanceRoom", () => ({
  PerformanceRoom: () => <section data-room="performance"><h1>성과실 빈 상태</h1></section>,
}));

afterEach(() => {
  cleanup();
  mocks.onboardingCompleted = false;
  mocks.dismissedOnboarding = false;
});

describe("OSMU-FLOW-UI-01 첫 사용자 성과실 도달 계약", () => {
  it("OSMU-FLOW-UI-01 정상 경로: 채널과 성과가 없어도 성과실과 인라인 온보딩을 함께 그린다", () => {
    render(<HomePage />);

    expect(document.querySelector('[data-room="performance"]')).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "성과실 빈 상태" })).toBeInTheDocument();
    expect(document.querySelector('[data-onboarding-mode="inline"]')).toBeInTheDocument();
  });

  it("OSMU-FLOW-UI-01 거절 조건: 자동 온보딩이 전체 화면 모달로 성과실을 덮지 않는다", () => {
    render(<HomePage />);

    expect(document.querySelector('[data-onboarding-mode="modal"]')).not.toBeInTheDocument();
    expect(document.querySelector(".fixed.inset-0.z-50")).not.toBeInTheDocument();
    expect(document.querySelector('[data-room="performance"]')).toBeInTheDocument();
  });
});

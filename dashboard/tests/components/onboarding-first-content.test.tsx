// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingChecklist } from "@/components/shared/OnboardingChecklist";
import { OnboardingWizard, STUDIO_CONTENT_BRANCH_KEY } from "@/components/shared/OnboardingWizard";
import { CreateRoom } from "@/components/studio/StudioRooms";

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  push: vi.fn(),
  checklist: { created: false, channel: false, published: false, analytics: false },
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/api", () => ({ apiPost: (...args: unknown[]) => mocks.apiPost(...args) }));
vi.mock("@/hooks/useOnboarding", () => ({ useOnboardingStatus: () => ({ data: { checklist: mocks.checklist } }) }));

beforeEach(() => {
  mocks.apiPost.mockReset();
  mocks.apiPost.mockResolvedValue({ ok: true });
  mocks.push.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(cleanup);

describe("FE7 첫 콘텐츠 온보딩 계약", () => {
  it("FE7-ONBOARD-01 정상: 채널 없이 업종과 영상 갈래만 정해 생성실로 이동한다", async () => {
    const onComplete = vi.fn();
    render(<OnboardingWizard onComplete={onComplete} onDismiss={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /테크/ }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("button", { name: /영상/ }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    await waitFor(() => expect(mocks.apiPost).toHaveBeenCalledWith("/api/onboarding", {
      industry: "tech",
      contentBranch: "video",
      channels: [],
    }));
    expect(screen.queryByText("첫 번째 채널을 연결하세요")).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole("button", { name: "생성실 열기" }));

    expect(sessionStorage.getItem(STUDIO_CONTENT_BRANCH_KEY)).toBe("video");
    expect(onComplete).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith("/studio?room=create");
  });

  it("FE7-ONBOARD-02 거절: 업종이나 갈래를 고르기 전에는 다음 단계로 가지 않는다", () => {
    render(<OnboardingWizard onComplete={vi.fn()} onDismiss={vi.fn()} />);

    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /카페/ }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
    expect(mocks.apiPost).not.toHaveBeenCalled();
  });

  it("FE7-ONBOARD-03 거절: 저장 실패는 생성실 이동 대신 재시도 가능한 오류를 남긴다", async () => {
    mocks.apiPost.mockRejectedValue(new Error("저장 실패"));
    render(<OnboardingWizard onComplete={vi.fn()} onDismiss={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /교육/ }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));
    fireEvent.click(screen.getByRole("button", { name: /글과 카드뉴스/ }));
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("저장 실패");
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("FE7-ONBOARD-04 정상: 빈 상태 체크리스트는 채널 연결보다 첫 콘텐츠를 먼저 안내한다", () => {
    render(<OnboardingChecklist />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveTextContent("첫 콘텐츠 만들기");
    expect(links[0]).toHaveAttribute("href", "/studio");
    expect(screen.getByText(/발행할 때 왼쪽 채널에서 연결/).closest("a")).toBeNull();
    expect(document.querySelector('a[href="/settings?tab=channels"]')).toBeNull();
  });

  it("FE7-ONBOARD-05 정상: 온보딩에서 고른 갈래를 생성실이 이어받는다", async () => {
    sessionStorage.setItem(STUDIO_CONTENT_BRANCH_KEY, "video");
    const onContentBranchChange = vi.fn();
    render(<CreateRoom workspaceId="workspace" workspaceName="작업 공간" guide="" topic="" onContentBranchChange={onContentBranchChange} onTopicChange={vi.fn()} onOpenLearning={vi.fn()} onCandidateSelect={vi.fn()} />);

    await waitFor(() => expect(onContentBranchChange).toHaveBeenCalledWith("video"));
    expect(sessionStorage.getItem(STUDIO_CONTENT_BRANCH_KEY)).toBeNull();
    expect(screen.getByText(/비어 있음:/)).toHaveTextContent("주제, 목적, 대상, 사용 권리 확인");
    expect(screen.getByText(/비어 있음:/)).not.toHaveTextContent("브랜드 가이드");
  });
});

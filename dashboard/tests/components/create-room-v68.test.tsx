// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateRoom } from "@/components/studio/StudioRooms";

const props = {
  workspaceId: "workspace-v68",
  workspaceName: "작업 공간",
  guide: "",
  topic: "",
  onTopicChange: vi.fn(),
  onOpenLearning: vi.fn(),
  onCandidateSelect: vi.fn(),
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(cleanup);

describe("V68 생성실 계약", () => {
  it("V68-CREATE-01 정상: 형식, 학습 정보, 구조 초안 세 축과 A/B/C를 함께 보여준다", () => {
    render(<CreateRoom {...props} />);

    expect(screen.getByRole("heading", { level: 1, name: "생성실" })).toBeInTheDocument();
    expect(screen.getByLabelText("생성실 요약")).toHaveTextContent("선택한 형식");
    expect(screen.getByLabelText("생성실 요약")).toHaveTextContent("반영한 학습 정보");
    expect(screen.getByLabelText("생성실 요약")).toHaveTextContent("구조 초안");
    expect(document.querySelectorAll("[data-create-candidate]")).toHaveLength(3);
    expect(screen.getByText("이번에 반영한 학습 정보")).toBeInTheDocument();
    expect(screen.getByLabelText("생성 담당 대화창")).toBeInTheDocument();
  });

  it("V68-CREATE-02 거절: 형식을 고르기 전에는 다음 질문으로 진행하지 않는다", () => {
    render(<CreateRoom {...props} />);

    const next = screen.getByRole("button", { name: "다음" });
    expect(next).toBeDisabled();
    fireEvent.click(next);
    expect(document.querySelector('[data-create-question="kind"]')).toBeInTheDocument();
    expect(document.querySelector("[data-create-purpose-picker]")).toBeNull();
  });

  it("V75-CREATE-DIRECT-01 정상: A 구조를 고르면 본문이 바뀌고 주제와 구조로 직접 생성한다", () => {
    const onTopicChange = vi.fn();
    const onQuickDraftGenerate = vi.fn().mockResolvedValue(undefined);
    const { rerender } = render(<CreateRoom {...props} topic="고객이 자주 묻는 질문" onTopicChange={onTopicChange} onQuickDraftGenerate={onQuickDraftGenerate} />);
    const before = document.body.textContent?.length ?? 0;

    fireEvent.click(screen.getByRole("button", { name: "A 구조 사용" }));

    expect(document.body.textContent?.length ?? 0).not.toBe(before);
    expect(document.querySelector('[data-quick-structure="A"]')).toHaveTextContent("고객이 겪는 문제");
    fireEvent.click(screen.getByRole("button", { name: "초안 만들기" }));
    expect(onQuickDraftGenerate).toHaveBeenCalledWith(expect.objectContaining({ label: "A", title: "문제 제시형" }));

    rerender(<CreateRoom {...props} topic="고객이 자주 묻는 질문" onTopicChange={onTopicChange} onQuickDraftGenerate={onQuickDraftGenerate} quickDraft={{ threads: "실제로 생성된 한국어 본문입니다." }} />);
    expect(document.querySelector("[data-quick-draft-result]")).toHaveTextContent("실제로 생성된 한국어 본문");
  });

  it("V75-CREATE-DIRECT-02 거절: 주제나 구조가 비면 직접 생성 요청을 보내지 않는다", () => {
    const onQuickDraftGenerate = vi.fn();
    render(<CreateRoom {...props} topic="" onQuickDraftGenerate={onQuickDraftGenerate} />);

    const generate = screen.getByRole("button", { name: "초안 만들기" });
    expect(generate).toBeDisabled();
    fireEvent.click(generate);
    expect(onQuickDraftGenerate).not.toHaveBeenCalled();
  });
});

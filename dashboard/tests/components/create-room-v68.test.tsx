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
});

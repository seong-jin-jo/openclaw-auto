// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import InboxPage from "@/app/inbox/page";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
  apiPost: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("swr", () => ({ default: (...args: unknown[]) => mocks.swr(...args) }));
vi.mock("@/lib/api", () => ({
  fetcher: vi.fn(),
  apiPost: (...args: unknown[]) => mocks.apiPost(...args),
}));
vi.mock("@/components/layout/Toast", () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

function queue(posts: Array<{ id: string; text?: string; topic?: string }>) {
  mocks.swr.mockImplementation((key: string) => key === "/api/queue?status=draft&returnTo=inbox"
    ? { data: { posts }, mutate: vi.fn(), isLoading: false }
    : { data: undefined, mutate: vi.fn(), isLoading: false });
}

describe("V70-INBOX 승인 인박스 안전 계약", () => {
  beforeEach(() => {
    mocks.swr.mockReset();
    mocks.apiPost.mockReset();
    mocks.showToast.mockReset();
  });

  afterEach(cleanup);

  it("V70-INBOX-01 정상: 본문이 있으면 내용을 보여 주고 승인할 수 있다", () => {
    queue([{ id: "draft-1", text: "고객이 실제로 검토할 본문", topic: "일반 콘텐츠" }]);

    render(<InboxPage />);

    expect(screen.getByText("고객이 실제로 검토할 본문")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "승인" })).toBeEnabled();
  });

  it("V70-INBOX-02 거절: 본문이 없으면 승인 단추와 단축키 모두 승인 요청을 보내지 않는다", () => {
    queue([{ id: "draft-empty", text: "   ", topic: "studio-handoff" }]);

    render(<InboxPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("본문을 불러오지 못했습니다");
    expect(screen.getByRole("button", { name: "승인" })).toBeDisabled();
    fireEvent.keyDown(window, { key: "A" });
    expect(mocks.apiPost).not.toHaveBeenCalled();
  });

  it("V70-INBOX-03 정상: 내부 식별자와 중복 단축키를 고객 화면에 노출하지 않는다", () => {
    queue([{ id: "draft-2", text: "검토 본문", topic: "studio-handoff" }]);

    render(<InboxPage />);

    expect(screen.getByText("콘텐츠 작업실에서 보냄")).toBeInTheDocument();
    expect(screen.queryByText("studio-handoff")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "승인" })).toHaveTextContent(/^승인$/);
    expect(screen.getByText(/단축키: A 승인/)).toBeInTheDocument();
  });

  it("V70-INBOX-04 정상: 제품 연결 제목을 고객이 이해할 수 있는 말로 표시한다", () => {
    queue([]);

    render(<InboxPage />);

    expect(screen.getByRole("button", { name: /제품 내용 연결/ })).toBeInTheDocument();
    expect(screen.queryByText(/저장소 기반 생성/)).not.toBeInTheDocument();
  });
});

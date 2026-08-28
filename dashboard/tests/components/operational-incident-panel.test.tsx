// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OperationalIncidentPanel } from "@/components/operator/OperationalIncidentPanel";

const swrMock = vi.hoisted(() => vi.fn());
vi.mock("swr", () => ({ default: swrMock }));

describe("운영 장애 패널 계약", () => {
  afterEach(() => {
    cleanup();
    swrMock.mockReset();
  });

  it("관측-04 정상: 작업 공간과 사람 개입 여부를 장애에 붙여 보여준다", () => {
    swrMock.mockReturnValue({
      data: {
        summary: { humanOpen: 1, automaticOpen: 1, recovered: 0 },
        incidents: [
          {
            id: "11111111-1111-1111-1111-111111111111",
            workspaceId: "cd1d0a40-540d-4524-9b49-bf2445d82182",
            workspaceName: "해낼게",
            workspaceSlug: "haenaelge",
            category: "token_expired",
            source: "threads",
            reasonCode: "token_expired",
            severity: "error",
            intervention: "human",
            status: "open",
            occurrences: 2,
            lastSeenAt: "2026-08-28T06:00:00.000Z",
          },
        ],
      },
      error: undefined,
      isLoading: false,
    });

    render(<OperationalIncidentPanel />);

    expect(screen.getAllByText("사람 확인 필요").length).toBeGreaterThan(0);
    expect(screen.getByText("토큰 만료")).toBeTruthy();
    expect(screen.getByText("해낼게 (haenaelge)")).toBeTruthy();
    expect(screen.getByText("발생 2회")).toBeTruthy();
  });

  it("관측-05 거절: 조회 실패를 정상 상태로 위장하지 않고 오류를 표시한다", () => {
    swrMock.mockReturnValue({ data: undefined, error: new Error("API error: 500"), isLoading: false });

    render(<OperationalIncidentPanel />);

    expect(screen.getByRole("alert").textContent).toContain("불러오지 못했습니다");
  });
});

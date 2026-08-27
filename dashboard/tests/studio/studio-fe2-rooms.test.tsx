// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateRoom, EditRoom } from "@/components/studio/StudioRooms";
import {
  buildStudioGenerationRequest,
  requestStudioCandidates,
  type StudioLearningInput,
} from "@/lib/studio/generation/client";

const VALID_INPUT: StudioLearningInput = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  topic: "작은 팀의 콘텐츠 운영",
  purpose: "운영 시간을 줄인다",
  audience: "1인 사업가",
  workspaceFacts: ["매주 세 편을 발행한다"],
  forbiddenPhrases: [],
  materialRightsConfirmed: true,
  skillVersionId: "22222222-2222-4222-8222-222222222222",
  contentBranch: "text_image",
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("화면 2차 생성실 계약", () => {
  it("FE2-CREATE-01 정상: 일곱 층 요청을 보내고 Studio 후보 세 장을 받는다", async () => {
    const candidates = ["A", "B", "C"].map((label, index) => ({
      candidate_id: `candidate-${label}`,
      ordinal: index + 1,
      label,
      angle: "problem_first",
      title: `${label} 제목`,
      rationale: `${label} 근거`,
      format: { content_branch: "text_image", preview_kind: "structured_storyboard", quality: "draft", outline: ["첫 장면"] },
    }));
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { job_id: "job-1", candidates } }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestStudioCandidates(VALID_INPUT, "studio-token");

    expect(result.map((candidate) => candidate.label)).toEqual(["A", "B", "C"]);
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(request.body));
    expect(Object.keys(body.learning_context)).toEqual(["s0", "s1", "u2", "u3", "x4", "l5", "r6"]);
    expect(request.headers).toMatchObject({ Authorization: "Bearer studio-token" });
  });

  it("FE3-CREATE-01 정상: 생성실은 상단 한 줄과 대화창을 함께 노출한다", () => {
    render(<CreateRoom workspaceId="workspace" workspaceName="작업 공간" guide="브랜드 사실" topic="주제" onTopicChange={vi.fn()} onOpenLearning={vi.fn()} onCandidateSelect={vi.fn()} />);
    expect(document.querySelector('[data-room-top="create"]')).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "생성 담당 대화창" })).toBeInTheDocument();
  });

  it("FE6-CREATE-01 정상: 디스플레이는 읽기 전용이고 선택 단추는 대화창에만 둔다", () => {
    render(<CreateRoom workspaceId="workspace" workspaceName="작업 공간" guide="브랜드 사실" topic="주제" onTopicChange={vi.fn()} onOpenLearning={vi.fn()} onCandidateSelect={vi.fn()} />);

    const display = document.querySelector('[data-display-readonly="create"]');
    expect(display).toBeInTheDocument();
    expect(display?.querySelectorAll("button")).toHaveLength(0);
    expect(screen.getByRole("complementary", { name: "생성 담당 대화창" })).toHaveTextContent("만들 종류");
  });

  it("FE6-CREATE-02 정상: 영상 선택은 대화창에서 생성 계약으로 전달한다", async () => {
    sessionStorage.setItem("studio_generation_token", "studio-token");
    sessionStorage.setItem("studio_skill_version_id", "22222222-2222-4222-8222-222222222222");
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { job_id: "job-1", candidates: [] } }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);
    const onBranchChange = vi.fn();
    render(<CreateRoom workspaceId="workspace" workspaceName="작업 공간" guide="브랜드 사실" topic="주제" contentBranch="video" onContentBranchChange={onBranchChange} onTopicChange={vi.fn()} onOpenLearning={vi.fn()} onCandidateSelect={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("목적"), { target: { value: "운영 시간을 줄인다" } });
    fireEvent.change(screen.getByLabelText("대상"), { target: { value: "1인 사업가" } });
    fireEvent.click(screen.getByLabelText("소재 권리를 확인했습니다"));
    fireEvent.click(screen.getByRole("button", { name: "후보 세 장 만들기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body)).learning_context.u3.content_branch).toBe("video");
  });

  it("FE2-CREATE-02 거절: 소재 권리 미확인 입력은 네트워크 호출 전에 막는다", () => {
    expect(() => buildStudioGenerationRequest({ ...VALID_INPUT, materialRightsConfirmed: false })).toThrow("소재 권리 확인이 필요합니다");
  });

  it("FE2-CREATE-03 인증 경계: 대시보드 tenant와 분리된 Studio workspace로 생성한다", async () => {
    sessionStorage.setItem("studio_generation_token", "studio-token");
    sessionStorage.setItem("studio_skill_version_id", "22222222-2222-4222-8222-222222222222");
    sessionStorage.setItem("studio_workspace_id", "11111111-1111-4111-8111-111111111111");
    const candidates = ["A", "B", "C"].map((label, index) => ({
      candidate_id: `candidate-${label}`,
      ordinal: index + 1,
      label,
      angle: "problem_first",
      title: `${label} 제목`,
      rationale: `${label} 근거`,
      format: { content_branch: "text_image", preview_kind: "structured_storyboard", quality: "draft", outline: ["첫 장면"] },
    }));
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ data: { job_id: "job-1", candidates } }, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<CreateRoom
      workspaceId="dashboard-tenant"
      workspaceName="대시보드 작업 공간"
      guide="브랜드 사실"
      topic="작은 팀의 콘텐츠 운영"
      onTopicChange={vi.fn()}
      onOpenLearning={vi.fn()}
      onCandidateSelect={vi.fn()}
    />);
    fireEvent.change(screen.getByLabelText("목적"), { target: { value: "운영 시간을 줄인다" } });
    fireEvent.change(screen.getByLabelText("대상"), { target: { value: "1인 사업가" } });
    fireEvent.click(screen.getByLabelText("소재 권리를 확인했습니다"));
    fireEvent.click(screen.getByRole("button", { name: "후보 세 장 만들기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(request.body)).workspace_id).toBe("11111111-1111-4111-8111-111111111111");
  });
});

describe("화면 2차 편집실 계약", () => {
  it("FE2-EDIT-01 정상: 목차에서 고른 대사 줄만 수정한다", async () => {
    const onLinesChange = vi.fn();
    render(<EditRoom lines={["첫 줄", "둘째 줄", "셋째 줄"]} onLinesChange={onLinesChange} />);

    fireEvent.click(screen.getByRole("button", { name: "2. 둘째 줄" }));
    fireEvent.change(screen.getByRole("textbox", { name: "대사 2" }), { target: { value: "고친 둘째 줄" } });

    await waitFor(() => expect(onLinesChange).toHaveBeenCalledWith(["첫 줄", "고친 둘째 줄", "셋째 줄"]));
  });

  it("FE2-EDIT-02 거절: 선택하지 않은 대사 줄은 변경하지 않는다", () => {
    const onLinesChange = vi.fn();
    render(<EditRoom lines={["첫 줄", "둘째 줄"]} onLinesChange={onLinesChange} />);

    fireEvent.change(screen.getByRole("textbox", { name: "대사 1" }), { target: { value: "고친 첫 줄" } });

    expect(onLinesChange).toHaveBeenCalledWith(["고친 첫 줄", "둘째 줄"]);
  });

  it("FE3-EDIT-03 정상: 편집실 상단 한 줄은 현재 장면 수를 표시한다", () => {
    render(<EditRoom lines={["첫 줄", "둘째 줄"]} onLinesChange={vi.fn()} />);
    const top = document.querySelector('[data-room-top="edit"]');
    expect(top).toHaveTextContent("2개 장면");
  });

  it("FE6-EDIT-01 정상: 영상 목차와 아이콘 도구 뒤에 대사를 항상 배치한다", () => {
    render(<EditRoom lines={["첫 줄", "둘째 줄"]} onLinesChange={vi.fn()} kind="video" />);
    const outline = document.querySelector("[data-edit-outline]");
    const stage = document.querySelector("[data-edit-stage]");
    const tools = document.querySelector("[data-edit-tools]");
    const script = document.querySelector("[data-edit-script]");

    expect(outline).toHaveAttribute("aria-label", "영상 목차");
    expect(screen.getAllByRole("button", { name: /도구$/ })).toHaveLength(4);
    expect(stage!.compareDocumentPosition(script as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(tools!.compareDocumentPosition(script as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("FE6-EDIT-02 정상: 대사를 빼거나 되살리면 장면 수와 길이가 함께 바뀐다", () => {
    render(<EditRoom lines={["첫 줄", "둘째 줄", "셋째 줄"]} onLinesChange={vi.fn()} kind="video" />);
    expect(document.querySelector("[data-edit-duration]")).toHaveTextContent("12초");

    fireEvent.click(screen.getAllByRole("button", { name: "빼기" })[0]);
    expect(document.querySelector('[data-room-top="edit"]')).toHaveTextContent("2개 장면");
    expect(document.querySelector("[data-edit-duration]")).toHaveTextContent("8초");

    fireEvent.click(screen.getByRole("button", { name: "되살리기" }));
    expect(document.querySelector('[data-room-top="edit"]')).toHaveTextContent("3개 장면");
  });

  it("FE6-EDIT-03 정상: 무음 표식이 있는 줄만 한 번에 줄인다", () => {
    render(<EditRoom lines={["첫 줄", "...", "둘째 줄"]} onLinesChange={vi.fn()} kind="video" />);
    fireEvent.click(screen.getByRole("button", { name: "무음 구간 1개 줄이기" }));
    expect(document.querySelector('[data-room-top="edit"]')).toHaveTextContent("2개 장면");
    expect(document.querySelector("[data-edit-duration]")).toHaveTextContent("8초");
  });

  it("FE6-EDIT-04 거절: 무음 표식이 없으면 무음 줄이기 조작을 비활성화한다", () => {
    render(<EditRoom lines={["첫 줄", "둘째 줄"]} onLinesChange={vi.fn()} kind="video" />);
    expect(screen.getByRole("button", { name: "무음 구간 0개 줄이기" })).toBeDisabled();
  });

  it("FE6-EDIT-05 거절: 음악 백엔드가 없을 때 파일이나 파형을 완성된 것처럼 표시하지 않는다", () => {
    render(<EditRoom lines={["나레이션"]} onLinesChange={vi.fn()} kind="audio" />);
    expect(screen.getByText("음악 생성 백엔드는 준비 중입니다")).toBeInTheDocument();
    expect(document.querySelector("[data-edit-stage]")).not.toBeInTheDocument();
    expect(document.querySelector("[data-edit-tools]")).not.toBeInTheDocument();
  });
});

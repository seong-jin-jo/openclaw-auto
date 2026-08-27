"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/shared/Button";
import { Field } from "@/components/shared/Field";
import { Stack } from "@/components/shared/Stack";
import {
  requestStudioCandidates,
  type StudioGenerationCandidate,
} from "@/lib/studio/generation/client";

function AssistantPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="card h-fit overflow-hidden lg:sticky lg:top-pad-inset" aria-label={`${title} 대화창`} data-chat-dock="persistent">
      <div className="flex items-center gap-stack-tight border-b border-border p-stack">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-body font-bold text-accent-fg">O</div>
        <div><b className="block text-body text-text">{title}</b><span className="text-caption text-success">지금 대기 중</span></div>
      </div>
      <div className="bg-surface-2 p-stack">{children}</div>
    </aside>
  );
}

interface CreateRoomProps {
  workspaceId?: string;
  workspaceName?: string;
  guide: string;
  topic: string;
  onTopicChange: (value: string) => void;
  onOpenLearning: () => void;
  onCandidateSelect: (candidate: StudioGenerationCandidate) => void;
}

export function CreateRoom({
  workspaceId,
  workspaceName,
  guide,
  topic,
  onTopicChange,
  onOpenLearning,
  onCandidateSelect,
}: CreateRoomProps) {
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [candidates, setCandidates] = useState<StudioGenerationCandidate[]>([]);
  const [selected, setSelected] = useState<"A" | "B" | "C" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const facts = useMemo(() => guide.trim() ? [guide.trim()] : [], [guide]);
  const learnedCount = [workspaceName, guide, purpose, audience].filter((value) => value?.trim()).length;
  const missing = [
    !workspaceName && "작업 공간 이름",
    !guide.trim() && "브랜드 가이드",
    !purpose.trim() && "목적",
    !audience.trim() && "대상",
  ].filter(Boolean) as string[];

  async function generate() {
    setError(null);
    if (!workspaceId) { setError("작업 공간을 먼저 선택하세요"); return; }
    const token = sessionStorage.getItem("studio_generation_token") || "";
    const skillVersionId = sessionStorage.getItem("studio_skill_version_id") || "";
    const studioWorkspaceId = sessionStorage.getItem("studio_workspace_id") || workspaceId;
    setLoading(true);
    try {
      const next = await requestStudioCandidates({
        workspaceId: studioWorkspaceId,
        topic,
        purpose,
        audience,
        workspaceFacts: facts,
        forbiddenPhrases: [],
        materialRightsConfirmed: rightsConfirmed,
        skillVersionId,
        contentBranch: "text_image",
      }, token);
      setCandidates(next);
      setSelected(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "후보 생성에 실패했습니다");
    } finally {
      setLoading(false);
    }
  }

  function choose(candidate: StudioGenerationCandidate) {
    setSelected(candidate.label);
    onCandidateSelect(candidate);
  }

  return (
    <section data-room="create" className="space-y-region">
      <section data-room-top="create" aria-label="이 방에서 지금 알아야 할 것" className="flex min-h-control-touch items-center justify-between rounded-xl border border-border bg-surface px-pad-inset py-stack">
        <b className="text-lead text-accent">{candidates.length ? `후보 ${candidates.length}장` : "1 / 3"}</b>
        <span className="text-caption text-subtle">{selected ? `${selected}안 선택` : candidates.length ? "후보 고르기" : "주제 받는 중"}</span>
      </section>
      <div className="grid gap-stack-section lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-stack-section md:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)]">
          <div className="card min-w-0 p-pad-inset">
            <div className="mb-stack flex items-center justify-between border-b border-border pb-stack">
              <b className="text-body text-text">후보</b>
              <span className="text-caption text-subtle">{candidates.length ? "3장" : "첫 손님"}</span>
            </div>
            <div className="grid gap-stack">
              {(candidates.length ? candidates : [
                { label: "A", title: "문제부터", rationale: "", format: { outline: ["문제", "이유", "다음 행동"] } },
                { label: "B", title: "증거부터", rationale: "", format: { outline: ["결과", "원리", "적용 조건"] } },
                { label: "C", title: "과정부터", rationale: "", format: { outline: ["시작", "과정", "확인"] } },
              ]).map((candidate) => (
                <article key={candidate.label} className={`grid gap-stack rounded-xl border p-pad-inset md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] ${selected === candidate.label ? "border-accent bg-accent-soft" : "border-border bg-surface-2"}`}>
                  <div>
                    <div className="mb-stack flex items-start gap-stack-tight">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent text-caption font-bold">{candidate.label}</span>
                      <b className="break-keep text-body-sm text-text">{candidate.title}</b>
                    </div>
                    {candidate.rationale ? <p className="line-clamp-3 break-keep text-caption text-muted">{candidate.rationale}</p> : null}
                  </div>
                  <ol className="space-y-stack-tight border-l border-border pl-stack">
                    {candidate.format.outline.map((item, index) => (
                      <li key={item} className="flex gap-stack-tight text-caption text-muted">
                        <span className="text-accent">{index + 1}</span><span className="break-keep">{item}</span>
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </div>

          <div className="card p-pad-inset">
            <div className="mb-stack flex items-center justify-between border-b border-border pb-stack">
              <b className="text-body text-text">학습 정보</b>
              <span className="text-caption text-subtle">{learnedCount}/4</span>
            </div>
            <dl className="space-y-stack">
              <div><dt className="text-caption text-subtle">작업 공간</dt><dd className="text-body text-text">{workspaceName || "미수집"}</dd></div>
              <div><dt className="text-caption text-subtle">브랜드</dt><dd className="line-clamp-4 text-body-sm text-muted">{guide || "미수집"}</dd></div>
              <div><dt className="text-caption text-subtle">목적</dt><dd className="text-body-sm text-muted">{purpose || "미수집"}</dd></div>
              <div><dt className="text-caption text-subtle">대상</dt><dd className="text-body-sm text-muted">{audience || "미수집"}</dd></div>
            </dl>
          </div>
        </div>

        <AssistantPanel title="생성 담당">
          <Stack gap={16}>
            <div className="max-w-[90%] rounded-xl rounded-tl-lg border border-border bg-surface p-stack text-body-sm text-text">
              이번에 만들 주제와 대상부터 알려 주세요.
            </div>
            {missing.length ? (
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-stack text-caption text-warning">
                비어 있음: {missing.join(", ")}
              </div>
            ) : null}
            <div className="space-y-stack rounded-xl border border-border bg-surface p-stack">
              <Field label="이번 주제" htmlFor="studio-topic">
                <input id="studio-topic" value={topic} onChange={(event) => onTopicChange(event.target.value)} placeholder="글감 / 콘텐츠 주제 입력" className="w-full rounded-lg border border-border bg-surface-2 px-stack text-body text-text" />
              </Field>
              <Field label="목적" htmlFor="studio-purpose">
                <input id="studio-purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} className="w-full rounded-lg border border-border bg-surface-2 px-stack text-body text-text" />
              </Field>
              <Field label="대상" htmlFor="studio-audience">
                <input id="studio-audience" value={audience} onChange={(event) => setAudience(event.target.value)} className="w-full rounded-lg border border-border bg-surface-2 px-stack text-body text-text" />
              </Field>
              <label className="flex items-start gap-stack-tight text-caption text-muted">
                <input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} />
                소재 권리를 확인했습니다
              </label>
            </div>
            {!guide.trim() ? <Button onClick={onOpenLearning}>학습 정보 채우기</Button> : null}
            <Button variant="primary" onClick={generate} disabled={loading}>{loading ? "후보 만드는 중" : "후보 세 장 만들기"}</Button>
            {candidates.map((candidate) => (
              <Button key={candidate.label} variant={selected === candidate.label ? "primary" : "secondary"} onClick={() => choose(candidate)}>
                {candidate.label}안 선택
              </Button>
            ))}
            {error ? <p role="alert" className="text-caption text-danger">{error}</p> : null}
          </Stack>
        </AssistantPanel>
      </div>
    </section>
  );
}

interface EditRoomProps {
  lines: string[];
  onLinesChange: (lines: string[]) => void;
  commandPanel?: React.ReactNode;
}

const EDIT_TOOLS = ["비율", "배경", "목소리", "속도", "자막"] as const;

export function EditRoom({ lines, onLinesChange, commandPanel }: EditRoomProps) {
  const [activeLine, setActiveLine] = useState(0);
  const [activeTool, setActiveTool] = useState<(typeof EDIT_TOOLS)[number]>("비율");
  const selectedLine = lines[activeLine] ?? "";
  const updateLine = (value: string) => onLinesChange(lines.map((line, index) => index === activeLine ? value : line));

  return (
    <section data-room="edit" className="space-y-region">
      <section data-room-top="edit" aria-label="이 방에서 지금 알아야 할 것" className="flex min-h-control-touch items-center justify-between rounded-xl border border-border bg-surface px-pad-inset py-stack">
        <b className="text-lead text-accent">{lines.length}개 장면</b>
        <span className="text-caption text-subtle">대사를 다듬는 중</span>
      </section>
      <div className="grid gap-stack-section lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="card grid min-h-screen min-w-0 md:grid-cols-[15rem_minmax(0,1fr)]">
          <nav className="border-b border-border p-pad-inset md:border-b-0 md:border-r" aria-label="편집 목차">
            <b className="text-body text-text">목차</b>
            <ol className="mt-stack space-y-stack-tight">
              {lines.map((line, index) => (
                <li key={`${index}-${line.slice(0, 16)}`}>
                  <Button size="sm" variant={activeLine === index ? "primary" : "secondary"} onClick={() => setActiveLine(index)} className="w-full justify-start">
                    {index + 1}. {line || "빈 대사"}
                  </Button>
                </li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0 p-pad-inset">
            <div className="aspect-video rounded-xl border border-border bg-surface-2 p-stack-section">
              <div className="grid h-full place-items-center rounded-lg bg-accent-soft p-region text-center">
                <span className="max-w-xl text-heading font-bold text-text">{selectedLine || "대사를 입력하세요"}</span>
              </div>
            </div>
            <div className="mt-stack flex flex-wrap gap-stack-tight border-b border-border pb-stack">
              {EDIT_TOOLS.map((tool) => (
                <Button key={tool} size="sm" variant={activeTool === tool ? "primary" : "secondary"} onClick={() => setActiveTool(tool)} aria-pressed={activeTool === tool}>
                  {tool}
                </Button>
              ))}
            </div>
            <label className="mt-pad-inset block text-caption text-muted">
              대사 {activeLine + 1}
              <textarea value={selectedLine} onChange={(event) => updateLine(event.target.value)} rows={5} className="mt-micro w-full rounded-lg border border-border bg-surface-2 p-stack text-body text-text" />
            </label>
          </div>
        </div>
        {commandPanel ?? <AssistantPanel title="편집 담당">
          <Stack gap={12}>
            <div className="rounded-lg border border-border bg-surface-2 p-stack">
              <span className="text-caption text-subtle">현재 줄</span>
              <p className="mt-micro text-body text-text">{activeLine + 1} / {lines.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-stack">
              <span className="text-caption text-subtle">조작</span>
              <p className="mt-micro text-body text-text">{activeTool}</p>
            </div>
          </Stack>
        </AssistantPanel>}
      </div>
    </section>
  );
}

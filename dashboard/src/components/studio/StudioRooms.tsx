"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { Field } from "@/components/shared/Field";
import { Stack } from "@/components/shared/Stack";
import { regenerateStudioCandidates, requestStudioCandidates, type StudioGenerationCandidate } from "@/lib/studio/generation/client";
import { getAuthToken } from "@/lib/auth";
import {
  CARD_ASPECT_RATIOS,
  EDIT_BACKGROUNDS,
  EDIT_MUSIC_TRACKS,
  EDIT_MUSIC_VOLUMES,
  EDIT_VOICES,
  PLAYBACK_SPEEDS,
  SUBTITLE_SIZES,
  VIDEO_ASPECT_RATIOS,
  defaultContentEditFormat,
  validateContentEditFormat,
  type ContentEditFormat,
} from "@/lib/studio/content-edit-format";

export type CreateContentBranch = "text_image" | "video";
export type EditContentKind = "video" | "card" | "audio" | "text";
const ONBOARDING_CONTENT_BRANCH_KEY = "studio_content_branch";
const createInputStorageKey = (workspaceId: string) => `studio_create_input:${workspaceId}`;

function AssistantPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="card h-fit min-w-0 overflow-hidden lg:sticky lg:top-pad-inset" aria-label={`${title} 대화창`} data-chat-dock="persistent" data-chat-always="true">
      <div className="flex items-center gap-stack-tight border-b border-border p-stack">
        <div className="grid h-10 w-10 place-items-center rounded-pill bg-accent text-body font-bold text-accent-fg" aria-hidden="true">O</div>
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
  contentBranch?: CreateContentBranch;
  onContentBranchChange?: (branch: CreateContentBranch) => void;
  onTopicChange: (value: string) => void;
  onOpenLearning: () => void;
  onCandidateSelect: (candidate: StudioGenerationCandidate) => void;
  onOpenEditor?: () => void;
}

const CREATE_EXAMPLES = [
  { label: "A", title: "문제부터 시작하는 영상", outline: ["지금 겪는 문제", "놓치기 쉬운 이유", "바로 할 한 가지"] },
  { label: "B", title: "결과부터 보여 주는 카드뉴스", outline: ["바뀐 결과", "따라 한 과정", "적용할 조건"] },
  { label: "C", title: "과정을 따라가는 글", outline: ["처음 상태", "바꾼 순서", "확인한 변화"] },
] as const;

export function CreateRoom({ workspaceId, workspaceName, guide, topic, contentBranch = "text_image", onContentBranchChange, onTopicChange, onOpenLearning, onCandidateSelect, onOpenEditor }: CreateRoomProps) {
  const topicInputRef = useRef<HTMLInputElement>(null);
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [candidates, setCandidates] = useState<StudioGenerationCandidate[]>([]);
  const [selected, setSelected] = useState<"A" | "B" | "C" | null>(null);
  const [loading, setLoading] = useState(false);
  const generationInFlight = useRef(false);
  const [inputHydratedFor, setInputHydratedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const facts = useMemo(() => guide.trim() ? [guide.trim()] : [], [guide]);
  const learnedCount = [workspaceName, guide, purpose, audience].filter((value) => value?.trim()).length;
  const missing = [!topic.trim() && "주제", !purpose.trim() && "목적", !audience.trim() && "대상", !rightsConfirmed && "소재 권리 확인"].filter(Boolean) as string[];
  const selectedCandidate = candidates.find((candidate) => candidate.label === selected) ?? null;
  const displayCandidates = candidates.length ? candidates : CREATE_EXAMPLES;
  const stage = selected ? { count: "3 / 3", label: "완성 확인" } : candidates.length ? { count: "2 / 3", label: "후보 고르기" } : { count: "1 / 3", label: "주제 받는 중" };

  useEffect(() => {
    const savedBranch = sessionStorage.getItem(ONBOARDING_CONTENT_BRANCH_KEY);
    if (savedBranch !== "text_image" && savedBranch !== "video") return;
    onContentBranchChange?.(savedBranch);
    sessionStorage.removeItem(ONBOARDING_CONTENT_BRANCH_KEY);
  }, [onContentBranchChange]);

  useEffect(() => {
    setInputHydratedFor(null);
    setPurpose("");
    setAudience("");
    setRightsConfirmed(false);
    if (!workspaceId) return;
    try {
      const saved = JSON.parse(localStorage.getItem(createInputStorageKey(workspaceId)) || "null") as {
        purpose?: string;
        audience?: string;
        rightsConfirmed?: boolean;
      } | null;
      setPurpose(saved?.purpose || "");
      setAudience(saved?.audience || "");
      setRightsConfirmed(saved?.rightsConfirmed === true);
    } catch {
      setPurpose("");
      setAudience("");
      setRightsConfirmed(false);
    }
    setInputHydratedFor(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || inputHydratedFor !== workspaceId) return;
    try {
      localStorage.setItem(createInputStorageKey(workspaceId), JSON.stringify({ purpose, audience, rightsConfirmed }));
    } catch { /* 저장소 제한이면 현재 화면 상태만 유지 */ }
  }, [audience, inputHydratedFor, purpose, rightsConfirmed, workspaceId]);

  async function generate() {
    if (generationInFlight.current) return;
    setError(null);
    if (!workspaceId) { setError("작업 공간을 먼저 선택하세요"); return; }
    const token = getAuthToken();
    generationInFlight.current = true;
    setLoading(true);
    try {
      const next = await requestStudioCandidates({ workspaceId, topic, purpose, audience, workspaceFacts: facts, forbiddenPhrases: [], materialRightsConfirmed: rightsConfirmed, contentBranch }, token);
      setCandidates(next);
      setSelected(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "후보 생성에 실패했습니다");
    } finally {
      generationInFlight.current = false;
      setLoading(false);
    }
  }

  async function regenerateAll() {
    if (generationInFlight.current) return;
    const jobId = candidates[0]?.generation_id;
    if (!jobId) { setError("다시 만들 기존 후보를 찾지 못했습니다"); return; }
    generationInFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      setCandidates(await regenerateStudioCandidates(jobId, getAuthToken()));
      setSelected(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "무료 재생성에 실패했습니다");
    } finally {
      generationInFlight.current = false;
      setLoading(false);
    }
  }

  function choose(candidate: StudioGenerationCandidate) {
    setSelected(candidate.label);
    onCandidateSelect(candidate);
  }

  return (
    <section data-room="create" className="space-y-region">
      <section data-room-top="create" data-create-stage={stage.count} aria-label="이 방에서 지금 알아야 할 것" className="flex min-h-control-touch items-center justify-between rounded-surface border border-border bg-surface px-pad-inset py-stack">
        <b className="text-lead text-accent">{stage.count}</b><span className="text-caption text-subtle">{stage.label}</span>
      </section>
      <div className="grid gap-stack-section lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-stack-section xl:grid-cols-3" data-display-readonly="create">
          <section className="card min-w-0 p-pad-inset xl:col-span-2" aria-labelledby="create-display-title">
            <div className="mb-stack flex items-center justify-between border-b border-border pb-stack">
              <b id="create-display-title" className="text-body text-text">{selectedCandidate ? "선택한 초안" : candidates.length ? "같은 주제의 다른 각도" : "오늘 만들 수 있는 것"}</b>
              <span className="text-caption text-subtle">{selectedCandidate ? `${selectedCandidate.label}안` : candidates.length ? "세 가지" : "예시"}</span>
            </div>
            <div className="grid gap-stack" data-create-candidate-deck>
              {displayCandidates.filter((candidate) => !selectedCandidate || candidate.label === selectedCandidate.label).map((candidate) => {
                const outline = "format" in candidate ? candidate.format.outline : candidate.outline;
                return (
                  <article key={candidate.label} data-create-candidate={candidate.label} className={`grid gap-stack rounded-surface border p-pad-inset md:grid-cols-5 ${selected === candidate.label ? "border-accent bg-accent-soft" : "border-border bg-surface-2"}`}>
                    <div className="md:col-span-3">
                      <div className="mb-stack flex items-start gap-stack-tight"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-accent text-caption font-bold text-accent-fg">{candidate.label}</span><b className="break-keep text-body-sm text-text">{candidate.title}</b></div>
                      <p className="break-keep text-caption text-muted">{contentBranch === "video" ? "영상 장면 구성" : "글과 카드뉴스 구성"}</p>
                    </div>
                    <ol className="space-y-stack-tight border-l border-border pl-stack md:col-span-2">
                      {outline.map((item, index) => <li key={`${candidate.label}-${index}`} className="flex gap-stack-tight text-caption text-muted"><span className="text-accent">{index + 1}</span><span className="break-keep">{item}</span></li>)}
                    </ol>
                  </article>
                );
              })}
            </div>
          </section>
          <section className="card p-pad-inset" aria-labelledby="create-learning-title">
            <div className="mb-stack flex items-center justify-between border-b border-border pb-stack"><b id="create-learning-title" className="text-body text-text">회원님께 쌓인 것</b><span className="text-caption text-subtle">{learnedCount} / 4</span></div>
            <progress className="progress-semantic mb-pad-inset w-full" max={4} value={learnedCount} aria-label="학습 정보 수집 정도" />
            <dl className="space-y-stack">
              <div><dt className="text-caption text-subtle">작업 공간</dt><dd className="text-body text-text">{workspaceName || "아직 없음"}</dd></div>
              <div><dt className="text-caption text-subtle">브랜드</dt><dd className="line-clamp-4 break-keep text-body-sm text-muted">{guide || "아직 없음"}</dd></div>
              <div><dt className="text-caption text-subtle">목적</dt><dd className="break-keep text-body-sm text-muted">{purpose || "아직 없음"}</dd></div>
              <div><dt className="text-caption text-subtle">대상</dt><dd className="break-keep text-body-sm text-muted">{audience || "아직 없음"}</dd></div>
              <div className="border-t border-border pt-stack"><dt className="text-caption text-subtle">성과에서 배운 규칙</dt><dd className="text-body-sm text-muted">아직 없음</dd></div>
            </dl>
          </section>
        </div>
        <AssistantPanel title="생성 담당">
          <Stack gap={16}>
            <div className="max-w-[90%] rounded-surface rounded-tl-control border border-border bg-surface p-stack text-body-sm text-text" data-empty-next={!candidates.length ? "create" : undefined}>{selectedCandidate ? "선택한 구조 초안을 편집실로 옮길 수 있습니다. 실제 미디어 생성은 준비 중입니다." : candidates.length ? "A, B, C 중 마음에 드는 방향을 골라 주세요." : "먼저 주제를 적고 후보 세 장을 만드세요."}</div>
            {!candidates.length ? <>
              <Button variant="primary" onClick={() => topicInputRef.current?.focus()}>주제부터 적기</Button>
              <div className="space-y-stack rounded-surface border border-border bg-surface p-stack">
                <fieldset><legend className="mb-stack-tight text-caption font-semibold text-text">만들 종류</legend><div className="flex flex-wrap gap-stack-tight">
                  <Button size="sm" variant={contentBranch === "video" ? "primary" : "secondary"} aria-pressed={contentBranch === "video"} onClick={() => onContentBranchChange?.("video")}>영상</Button>
                  <Button size="sm" variant={contentBranch === "text_image" ? "primary" : "secondary"} aria-pressed={contentBranch === "text_image"} onClick={() => onContentBranchChange?.("text_image")}>글·카드뉴스</Button>
                </div><p className="mt-stack-tight break-keep text-caption text-subtle">음악 생성은 준비 중입니다.</p></fieldset>
                <Field label="이번 주제" htmlFor="studio-topic"><input ref={topicInputRef} id="studio-topic" value={topic} onChange={(event) => onTopicChange(event.target.value)} placeholder="콘텐츠 주제 입력" className="w-full rounded-control border border-border bg-surface-2 px-stack text-body text-text" /></Field>
                <Field label="목적" htmlFor="studio-purpose"><input id="studio-purpose" value={purpose} onChange={(event) => setPurpose(event.target.value)} className="w-full rounded-control border border-border bg-surface-2 px-stack text-body text-text" /></Field>
                <Field label="대상" htmlFor="studio-audience"><input id="studio-audience" value={audience} onChange={(event) => setAudience(event.target.value)} className="w-full rounded-control border border-border bg-surface-2 px-stack text-body text-text" /></Field>
                <label className="flex items-start gap-stack-tight text-caption text-muted"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => setRightsConfirmed(event.target.checked)} />소재 권리를 확인했습니다</label>
              </div>
              {missing.length ? <div className="rounded-control border border-warning/30 bg-warning/10 p-stack text-caption text-warning">비어 있음: {missing.join(", ")}</div> : null}
              {!guide.trim() ? <Button onClick={onOpenLearning}>학습 정보 채우기</Button> : null}
              <Button variant="primary" onClick={generate} disabled={loading}>{loading ? "후보 만드는 중" : "후보 세 장 만들기"}</Button>
            </> : null}
            {candidates.length && !selectedCandidate ? <>
              {candidates.map((candidate) => <Button key={candidate.label} variant="secondary" onClick={() => choose(candidate)}>{candidate.label}안 선택</Button>)}
              <Button onClick={regenerateAll} disabled={loading}>{loading ? "다시 만드는 중" : "모두 거절하고 무료로 다시 만들기"}</Button>
            </> : null}
            {selectedCandidate ? <Stack gap={8}><Button variant="primary" onClick={onOpenEditor}>편집실로 이동</Button><Button onClick={() => setSelected(null)}>후보 다시 보기</Button></Stack> : null}
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
  kind?: EditContentKind;
  previewReady?: boolean;
  commandPanel?: ReactNode;
  initialFormat?: ContentEditFormat;
  onFormatChange?: (format: ContentEditFormat) => void;
}
type ToolName = "비율" | "배경" | "목소리" | "속도" | "자막" | "음악" | "음량";
const VIDEO_TOOLS: ToolName[] = ["비율", "목소리", "속도", "자막"];
const CARD_TOOLS: ToolName[] = ["비율", "배경", "자막"];
const AUDIO_TOOLS: ToolName[] = ["목소리", "음악", "음량"];

type ToolValues = Record<ToolName, string>;

function toolOptions(kind: EditContentKind, tool: ToolName): string[] {
  if (tool === "비율") return [...(kind === "card" ? CARD_ASPECT_RATIOS : VIDEO_ASPECT_RATIOS)];
  if (tool === "배경") return [...EDIT_BACKGROUNDS];
  if (tool === "목소리") return [...EDIT_VOICES];
  if (tool === "속도") return PLAYBACK_SPEEDS.map((value) => `${value}배`);
  if (tool === "자막") return [...SUBTITLE_SIZES];
  if (tool === "음악") return [...EDIT_MUSIC_TRACKS];
  return EDIT_MUSIC_VOLUMES.map((value) => `${value}%`);
}

function toolValuesFromFormat(format: ContentEditFormat): ToolValues {
  const defaults: ToolValues = {
    비율: "9:16",
    배경: "작업실 책상",
    목소리: "차분한 남성",
    속도: "1배",
    자막: "보통",
    음악: "없음",
    음량: "20%",
  };
  if (format.kind === "video") {
    return { ...defaults, 비율: format.aspectRatio, 목소리: format.voice, 속도: `${format.playbackSpeed}배`, 자막: format.subtitleSize };
  }
  if (format.kind === "card") {
    return { ...defaults, 비율: format.aspectRatio, 배경: format.background, 자막: format.subtitleSize };
  }
  return { ...defaults, 목소리: format.voice, 음악: format.musicTrack, 음량: `${format.musicVolume}%` };
}

function formatFromToolValues(kind: ContentEditFormat["kind"], values: ToolValues): ContentEditFormat {
  const candidate = kind === "video"
    ? { kind, aspectRatio: values.비율, subtitleSize: values.자막, playbackSpeed: Number.parseFloat(values.속도), voice: values.목소리 }
    : kind === "card"
      ? { kind, aspectRatio: values.비율, subtitleSize: values.자막, background: values.배경 }
      : { kind, voice: values.목소리, musicTrack: values.음악, musicVolume: Number.parseInt(values.음량, 10) };
  const validation = validateContentEditFormat(candidate);
  return validation.valid ? validation.value : defaultContentEditFormat(kind);
}

function ToolIcon({ tool }: { tool: ToolName }) {
  const paths: Record<ToolName, ReactNode> = {
    비율: <><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M9 6v12" /></>,
    배경: <><circle cx="12" cy="12" r="8" /><path d="M12 4a8 8 0 0 0 0 16" /></>,
    목소리: <><path d="M5 10v4h3l4 3V7L8 10H5Z" /><path d="M16 9c1 1 1 5 0 6" /></>,
    속도: <><circle cx="12" cy="12" r="8" /><path d="m12 12 4-3" /></>,
    자막: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 10h10M7 14h7" /></>,
    음악: <><path d="M9 18V6l10-2v12" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></>,
    음량: <><path d="M5 10v4h3l4 3V7L8 10H5Z" /><path d="M16 9c1 1 1 5 0 6" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[tool]}</svg>;
}

export function EditRoom({ lines, onLinesChange, kind = "video", previewReady = false, commandPanel, initialFormat, onFormatChange }: EditRoomProps) {
  const formatKind = kind === "text" ? "card" : kind;
  const safeLines = lines.length ? lines : ["대사를 입력하세요"];
  const [activeLine, setActiveLine] = useState(0);
  const [activeTool, setActiveTool] = useState<ToolName>("비율");
  const [toolValues, setToolValues] = useState<ToolValues>(() => toolValuesFromFormat(
    initialFormat?.kind === formatKind ? initialFormat : defaultContentEditFormat(formatKind),
  ));
  const [visibleLines, setVisibleLines] = useState<boolean[]>(() => safeLines.map(() => true));
  const selectedFormat = useMemo(() => formatFromToolValues(formatKind, toolValues), [formatKind, toolValues]);
  const lastEmittedFormat = useRef("");
  useEffect(() => { setVisibleLines((current) => safeLines.map((_, index) => current[index] ?? true)); setActiveLine((current) => Math.min(current, safeLines.length - 1)); }, [safeLines.length]);
  useEffect(() => {
    const nextFormat = initialFormat?.kind === formatKind ? initialFormat : defaultContentEditFormat(formatKind);
    if (JSON.stringify(nextFormat) !== lastEmittedFormat.current) {
      setToolValues(toolValuesFromFormat(nextFormat));
    }
    setActiveTool(kind === "audio" ? "목소리" : "비율");
  }, [formatKind, initialFormat, kind]);
  useEffect(() => {
    lastEmittedFormat.current = JSON.stringify(selectedFormat);
    onFormatChange?.(selectedFormat);
  }, [onFormatChange, selectedFormat]);
  const visibleCount = visibleLines.filter(Boolean).length;
  const secondsPerLine = kind === "video" && selectedFormat.kind === "video" ? 4 / selectedFormat.playbackSpeed : 4;
  const duration = visibleCount * secondsPerLine;
  const durationLabel = Number.isInteger(duration) ? String(duration) : duration.toFixed(1);
  const selectedLine = safeLines[activeLine] ?? "";
  const silenceIndexes = safeLines.map((line, index) => (/…|\.{3}|^\s*$/.test(line) ? index : -1)).filter((index) => index >= 0);
  const visibleSilences = silenceIndexes.filter((index) => visibleLines[index]).length;
  const tools = kind === "card" || kind === "text" ? CARD_TOOLS : kind === "audio" ? AUDIO_TOOLS : VIDEO_TOOLS;
  const outlineTitle = kind === "text" ? "글 목차" : kind === "card" ? "장 목차" : kind === "audio" ? "곡 목차" : "영상 목차";
  const unit = kind === "card" ? "장" : kind === "text" ? "문단" : "장면";
  const updateLine = (value: string) => onLinesChange(safeLines.map((line, index) => index === activeLine ? value : line));
  const toggleLine = (index: number) => setVisibleLines((current) => current.map((visible, lineIndex) => lineIndex === index ? !visible : visible));
  const trimSilences = () => setVisibleLines((current) => current.map((visible, index) => silenceIndexes.includes(index) ? false : visible));
  return (
    <section data-room="edit" data-edit-kind={kind} className="space-y-region">
      <section data-room-top="edit" aria-label="이 방에서 지금 알아야 할 것" className="flex min-h-control-touch items-center justify-between rounded-surface border border-border bg-surface px-pad-inset py-stack"><b className="text-lead text-accent">{visibleCount}개 {unit}</b><span className="text-caption text-subtle" data-edit-duration>{kind === "audio" ? "음악 생성 준비 중" : `${durationLabel}초 · 대사를 다듬는 중`}</span></section>
      <div className="grid gap-stack-section lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="card grid min-w-0 overflow-hidden md:grid-cols-[15rem_minmax(0,1fr)]" data-edit-workspace>
          <nav className="max-h-72 overflow-y-auto border-b border-border p-pad-inset md:max-h-none md:border-b-0 md:border-r" aria-label={outlineTitle} data-edit-outline>
            <b className="text-body text-text">{outlineTitle}</b>
            <ol className="mt-stack space-y-stack-tight">{safeLines.map((line, index) => <li key={`${index}-${line.slice(0, 16)}`}><Button size="sm" variant={activeLine === index ? "primary" : "secondary"} onClick={() => setActiveLine(index)} className={`w-full justify-start overflow-hidden text-left ${visibleLines[index] ? "" : "line-through opacity-60"}`}><span className="truncate">{index + 1}. {line || "빈 대사"}</span></Button></li>)}</ol>
          </nav>
          <div className="min-w-0 p-pad-inset">
            {kind === "audio" ? <section className="grid min-h-80 place-items-center rounded-surface border border-dashed border-border bg-surface-2 p-region text-center" data-edit-readiness><div className="max-w-xl"><b className="text-subheading text-text">음악 생성 백엔드는 준비 중입니다</b><p className="mt-stack break-keep text-body-sm text-muted">현재는 나레이션 대사만 확인할 수 있습니다. 음악 파일이나 파형은 아직 표시하지 않습니다.</p></div></section> : <>
              <section className={`grid place-items-center rounded-surface border border-border bg-surface-2 p-stack-section ${kind === "card" ? "aspect-[4/5] max-h-96" : kind === "text" ? "min-h-80" : "aspect-video"}`} aria-label={kind === "card" ? "카드뉴스 미리보기" : kind === "text" ? "글 미리보기" : "영상 미리보기"} data-edit-stage>
                <div className="grid h-full w-full place-items-center rounded-control bg-accent-soft p-region text-center"><div><span className="text-caption font-semibold text-accent">{previewReady ? "미리보기" : "구조 초안"}</span><p className="mt-stack max-w-xl break-keep text-heading font-bold text-text">{visibleLines[activeLine] ? selectedLine : "이 대사는 빠진 상태입니다"}</p>{!previewReady && kind === "video" ? <p className="mt-stack text-caption text-muted">실제 영상 렌더는 준비 중입니다.</p> : null}</div></div>
              </section>
              <section className="mt-stack border-b border-border pb-stack" aria-label="간편 편집 도구" data-edit-tools>
                <div className="flex flex-wrap gap-stack-tight">{tools.map((tool) => <Button key={tool} size="sm" variant={activeTool === tool ? "primary" : "secondary"} onClick={() => setActiveTool(tool)} aria-pressed={activeTool === tool} aria-label={`${tool} 도구`}><ToolIcon tool={tool} /><span>{toolValues[tool]}</span></Button>)}
                  {kind === "video" ? <Button size="sm" onClick={trimSilences} disabled={visibleSilences === 0}>무음 구간 {visibleSilences}개 줄이기</Button> : null}
                </div>
                <div className="mt-stack flex flex-wrap gap-stack-tight" aria-label={`${activeTool} 선택지`}>{toolOptions(formatKind, activeTool).map((option) => <Button key={option} size="sm" variant={toolValues[activeTool] === option ? "primary" : "secondary"} aria-pressed={toolValues[activeTool] === option} onClick={() => setToolValues((current) => ({ ...current, [activeTool]: option }))}>{option}</Button>)}</div>
              </section>
            </>}
            <section className="mt-pad-inset" aria-labelledby="edit-script-title" data-edit-script>
              <div className="mb-stack flex flex-wrap items-center justify-between gap-stack-tight"><b id="edit-script-title" className="text-body text-text">{kind === "card" ? "장 문구" : kind === "text" ? "문단" : "대사"}</b><span className="text-caption text-subtle">화면 아래에서 바로 고칩니다</span></div>
              <ol className="space-y-stack-tight">{safeLines.map((line, index) => <li key={`script-${index}`} className={`grid gap-stack-tight rounded-control border border-border bg-surface-2 p-stack md:grid-cols-[4rem_minmax(0,1fr)_auto] ${visibleLines[index] ? "" : "opacity-60"}`} data-script-line={index + 1}>
                <span className="text-caption text-subtle">{index * secondsPerLine}초부터</span>
                {activeLine === index ? <input aria-label={`${kind === "card" ? "문구" : kind === "text" ? "문단" : "대사"} ${index + 1}`} value={line} onChange={(event) => updateLine(event.target.value)} className={`min-h-control-touch min-w-0 rounded-control border border-border bg-surface px-stack text-body-sm text-text ${visibleLines[index] ? "" : "line-through"}`} /> : <button type="button" onClick={() => setActiveLine(index)} className={`min-h-control-touch min-w-0 break-keep rounded-control px-stack text-left text-body-sm text-text hover:bg-surface ${visibleLines[index] ? "" : "line-through"}`}>{line || "빈 대사"}</button>}
                <Button size="sm" onClick={() => toggleLine(index)}>{visibleLines[index] ? "빼기" : "되살리기"}</Button>
              </li>)}</ol>
            </section>
          </div>
        </div>
        {commandPanel ?? <AssistantPanel title="편집 담당"><Stack gap={12}><div className="rounded-control border border-border bg-surface p-stack"><span className="text-caption text-subtle">현재 위치</span><p className="mt-micro text-body text-text">{activeLine + 1} / {safeLines.length}</p></div><div className="rounded-control border border-border bg-surface p-stack"><span className="text-caption text-subtle">지금 고치는 것</span><p className="mt-micro text-body text-text">{kind === "card" ? "카드뉴스" : kind === "text" ? "글" : kind === "audio" ? "음악" : "영상"}</p></div></Stack></AssistantPanel>}
      </div>
    </section>
  );
}

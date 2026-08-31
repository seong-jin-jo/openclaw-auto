"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/shared/Button";
import { EditPreview, type CardTextPosition } from "./EditPreview";
import { Field } from "@/components/shared/Field";
import { Stack } from "@/components/shared/Stack";
import {
  discardStudioDerivations,
  quoteStudioDerivations,
  regenerateStudioCandidates,
  requestStudioCandidates,
  requestStudioDerivations,
  type StudioDerivationBatch,
  type StudioDerivationQuote,
  type StudioGenerationCandidate,
} from "@/lib/studio/generation/client";
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
import {
  AUDIENCE_CARDS,
  INDUSTRY_CARDS,
  LEARNING_SLOT_TOTAL,
  PURPOSE_CARDS,
  countFilledLearningSlots,
  readLearningInfo,
  writeLearningInfo,
  type LearningInfo,
} from "./learning-info";

export type CreateContentBranch = "text_image" | "video";
export type EditContentKind = "video" | "card" | "audio" | "text";
/** 화면에서 고르는 갈래. 글과 카드뉴스는 만드는 방식이 달라 따로 고른다. */
export type CreateKind = "video" | "card" | "text";
const ONBOARDING_CONTENT_BRANCH_KEY = "studio_content_branch";

const CREATE_KIND_LABELS: Record<CreateKind, string> = { video: "영상", card: "카드뉴스", text: "글" };
const CREATE_KIND_ORDER: CreateKind[] = ["video", "card", "text"];
const kindToBranch = (kind: CreateKind): CreateContentBranch => (kind === "video" ? "video" : "text_image");

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
  /** 생성실에서 첫 형식을 고르기 전 헤더가 특정 형식을 추측하지 않게 현재 선택을 전달한다. */
  onPrimaryKindChange?: (kind: CreateKind | null) => void;
  /** 같이 만들 갈래가 바뀌면 헤더 상태판이 따라 바뀐다 */
  onAlsoKindsChange?: (kinds: CreateKind[]) => void;
  /** 학습 정보가 문답에서 갱신되면 이 값이 올라가고 생성실이 다시 읽는다 */
  learningVersion?: number;
  /** 만들던 것 이어서 하기. 0이면 줄이 아예 안 뜬다 */
  resumeCount?: number;
  onResume?: () => void;
}

const CREATE_EXAMPLES = [
  { label: "A", title: "문제 제시형", outline: ["고객이 겪는 문제", "문제가 생기는 이유", "바로 적용할 방법"] },
  { label: "B", title: "결과 제시형", outline: ["먼저 보여 줄 결과", "결과를 만든 과정", "적용할 조건"] },
  { label: "C", title: "과정 설명형", outline: ["시작 상태", "진행 순서", "확인할 변화"] },
] as const;

// 주제도 빈칸으로 주지 않는다. 학습 정보에서 고른 하는 일과 목적으로 후보를 지어 카드로 준다.
// 카드에 없을 때만 "직접 적겠습니다"로 입력창이 열린다.
const TOPIC_TEMPLATES: Record<string, string[]> = {
  "브랜드 알리기": ["{{일}}을 처음 접하는 고객이 가장 많이 묻는 질문", "{{일}}을 시작하기 전에 알아둘 점", "우리가 {{일}}을 하는 이유"],
  "신뢰 높이기": ["{{일}}을 하며 실제로 해결한 고객 문제", "직접 겪은 실패와 바꾼 방법", "고객이 선택 전에 확인할 기준"],
  "문의 늘리기": ["이런 상황이라면 상담이 필요한 이유", "{{일}} 상담 전에 준비할 것", "고객이 자주 헷갈리는 조건"],
  "방문·예약 늘리기": ["처음 방문하는 고객을 위한 안내", "{{일}} 예약 전에 확인할 것", "방문하면 받을 수 있는 서비스"],
  "구매 늘리기": ["{{일}}을 고를 때 비교할 기준", "가격에 포함된 항목", "구매 전에 가장 많이 묻는 질문"],
  "재방문 늘리기": ["기존 고객이 다시 찾는 이유", "두 번째 이용에서 달라지는 점", "이용 후 관리 방법"],
};

function topicCandidates(industryTitle: string, purposeTitle: string): string[] {
  const work = industryTitle || "우리 일";
  const templates = TOPIC_TEMPLATES[purposeTitle] || TOPIC_TEMPLATES["브랜드 알리기"];
  return templates.map((template) => template.replaceAll("{{일}}", work));
}

type CreateQuestion = "kind" | "purpose" | "audience" | "topic" | "rights" | "review";
const CREATE_QUESTIONS: readonly CreateQuestion[] = ["kind", "purpose", "audience", "topic", "rights", "review"];

export function generationErrorMessage(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : "";
  if (/저장소|무결성|constraint|database|relation|schema/i.test(message)) {
    return "구조 초안을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
  if (/인증|로그인|unauthorized|forbidden/i.test(message)) return "로그인이 만료됐습니다. 다시 로그인해 주세요.";
  return message || "구조 초안을 만들지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

export function CreateRoom({ workspaceId, workspaceName, guide, topic, contentBranch = "text_image", onContentBranchChange, onTopicChange, onCandidateSelect, onOpenEditor, onPrimaryKindChange, onAlsoKindsChange, learningVersion = 0, resumeCount = 0, onResume }: CreateRoomProps) {
  const topicInputRef = useRef<HTMLInputElement>(null);
  const previousWorkspaceId = useRef(workspaceId);
  const [primaryKind, setPrimaryKind] = useState<CreateKind | null>(null);
  const [alsoKinds, setAlsoKinds] = useState<CreateKind[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [purpose, setPurpose] = useState("");
  const [audience, setAudience] = useState("");
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [learning, setLearning] = useState<LearningInfo>({});
  const [candidates, setCandidates] = useState<StudioGenerationCandidate[]>([]);
  const [selected, setSelected] = useState<"A" | "B" | "C" | null>(null);
  const [loading, setLoading] = useState(false);
  const [alsoQuote, setAlsoQuote] = useState<StudioDerivationQuote | null>(null);
  const [alsoBatch, setAlsoBatch] = useState<StudioDerivationBatch | null>(null);
  const [alsoBusy, setAlsoBusy] = useState(false);
  const generationInFlight = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const facts = useMemo(() => guide.trim() ? [guide.trim()] : [], [guide]);
  const learnedCount = countFilledLearningSlots(learning, { guide });
  const missing = [!primaryKind && "만들 형식", !topic.trim() && "주제", !purpose.trim() && "목표", !audience.trim() && "고객", !rightsConfirmed && "사용 권리 확인"].filter(Boolean) as string[];
  const selectedCandidate = candidates.find((candidate) => candidate.label === selected) ?? null;
  const displayCandidates = candidates.length ? candidates : CREATE_EXAMPLES;
  const question = CREATE_QUESTIONS[questionIndex];
  const stage = selected ? { count: "3 / 3", label: "선택한 구조 확인" } : candidates.length ? { count: "2 / 3", label: "구조 초안 고르기" } : { count: "1 / 3", label: `만들 조건 확인 ${Math.min(questionIndex + 1, 6)} / 6` };
  const industryTitle = useMemo(() => INDUSTRY_CARDS.find((card) => card.sample === learning.industry)?.title || "", [learning.industry]);
  const purposeTitle = useMemo(() => PURPOSE_CARDS.find((card) => card.sample === purpose)?.title || "", [purpose]);
  const topicCards = useMemo(() => topicCandidates(industryTitle, purposeTitle), [industryTitle, purposeTitle]);

  useEffect(() => {
    const savedBranch = sessionStorage.getItem(ONBOARDING_CONTENT_BRANCH_KEY);
    if (savedBranch !== "text_image" && savedBranch !== "video") return;
    onContentBranchChange?.(savedBranch);
    const savedKind: CreateKind = savedBranch === "video" ? "video" : "card";
    setPrimaryKind(savedKind);
    onPrimaryKindChange?.(savedKind);
    sessionStorage.removeItem(ONBOARDING_CONTENT_BRANCH_KEY);
  }, [onContentBranchChange, onPrimaryKindChange]);

  // 생성실은 언제나 새로 시작 상태로 열린다(질문6 확정). 이전 작업물은 지우지 않고
  // 헤더 작업물함에 그대로 있고, 위쪽 "이어서 하기" 한 줄로 부른다.
  // 브랜드에 매달린 값(대상, 소재 권리)만 학습 정보에서 되살린다.
  useEffect(() => {
    if (!workspaceId) return;
    const saved = readLearningInfo(workspaceId);
    setLearning(saved);
    setAudience(saved.audience || "");
    setRightsConfirmed(Boolean(saved.rights));
    setPurpose("");
    setTopicOpen(false);
    if (previousWorkspaceId.current !== workspaceId) {
      previousWorkspaceId.current = workspaceId;
      setPrimaryKind(null);
      setAlsoKinds([]);
      setQuestionIndex(0);
      onPrimaryKindChange?.(null);
      onAlsoKindsChange?.([]);
    }
  }, [workspaceId, learningVersion, onAlsoKindsChange, onPrimaryKindChange]);

  const rememberLearning = (patch: LearningInfo) => {
    setLearning((current) => {
      const next = { ...current, ...patch };
      if (workspaceId) writeLearningInfo(workspaceId, next);
      return next;
    });
  };

  const choosePrimary = (kind: CreateKind) => {
    if (!primaryKind) {
      setPrimaryKind(kind);
      onPrimaryKindChange?.(kind);
      onContentBranchChange?.(kindToBranch(kind));
      return;
    }
    if (primaryKind === kind) {
      if (alsoKinds.length) {
        const [nextPrimary, ...rest] = alsoKinds;
        setPrimaryKind(nextPrimary);
        setAlsoKinds(rest);
        onPrimaryKindChange?.(nextPrimary);
        onAlsoKindsChange?.(rest);
        onContentBranchChange?.(kindToBranch(nextPrimary));
      } else {
        setPrimaryKind(null);
        onPrimaryKindChange?.(null);
      }
      return;
    }
    const next = alsoKinds.includes(kind) ? alsoKinds.filter((one) => one !== kind) : [...alsoKinds, kind];
    setAlsoKinds(next);
    onAlsoKindsChange?.(next);
  };

  const chooseAudience = (value: string) => {
    setAudience(value);
    rememberLearning({ audience: value });
    setQuestionIndex(3);
  };

  const confirmRights = (value: boolean) => {
    setRightsConfirmed(value);
    rememberLearning({ rights: value ? "직접 만든 자료 또는 콘텐츠 제작·게시 허가를 받은 자료만 사용합니다." : "" });
  };

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
      setError(generationErrorMessage(cause));
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
      setError(generationErrorMessage(cause));
    } finally {
      generationInFlight.current = false;
      setLoading(false);
    }
  }

  function choose(candidate: StudioGenerationCandidate) {
    setSelected(candidate.label);
    onCandidateSelect(candidate);
  }

  // 같이 만들 갈래를 고른 채로 후보를 고르면, 확정을 누르기 전에 값을 먼저 보여 준다.
  // 값을 못 본 상태에서는 확정 단추가 뜨지 않으므로 조용히 나가는 경로가 없다.
  useEffect(() => {
    const jobId = candidates[0]?.generation_id;
    if (!selectedCandidate || !jobId || alsoKinds.length === 0) { setAlsoQuote(null); return; }
    let live = true;
    quoteStudioDerivations(jobId, alsoKinds, getAuthToken())
      .then((quote) => { if (live) setAlsoQuote(quote); })
      .catch(() => { if (live) setAlsoQuote(null); });
    return () => { live = false; };
  }, [selectedCandidate, alsoKinds, candidates]);

  async function confirmAlsoKinds() {
    const jobId = candidates[0]?.generation_id;
    if (!jobId || !selectedCandidate || !alsoQuote) return;
    setAlsoBusy(true);
    setError(null);
    try {
      setAlsoBatch(await requestStudioDerivations({
        jobId,
        candidateId: selectedCandidate.candidate_id,
        kinds: alsoKinds,
        acknowledgedCost: { currency: alsoQuote.currency, totalMinor: alsoQuote.total_minor },
        token: getAuthToken(),
      }));
    } catch (cause) {
      setError(generationErrorMessage(cause));
    } finally {
      setAlsoBusy(false);
    }
  }

  async function discardAlso() {
    if (!alsoBatch) return;
    setAlsoBusy(true);
    try {
      setAlsoBatch(await discardStudioDerivations(alsoBatch.batch_id, getAuthToken()));
    } catch (cause) {
      setError(generationErrorMessage(cause));
    } finally {
      setAlsoBusy(false);
    }
  }

  const kindHeading = primaryKind ? `${CREATE_KIND_LABELS[primaryKind]} 구성 초안 예시` : "콘텐츠 구성 초안 예시";

  return (
    <section data-room="create" className="space-y-region">
      {resumeCount > 0 ? (
        <section data-create-resume={resumeCount} className="flex min-h-control-touch flex-wrap items-center gap-stack rounded-surface border border-border bg-surface-2 px-pad-inset py-stack">
          <span className="mr-auto break-keep text-body-sm text-muted">만들던 것 {resumeCount}건이 그대로 있습니다. 지금 화면은 새로 시작하는 자리입니다</span>
          <Button size="sm" onClick={onResume}>이어서 하기</Button>
        </section>
      ) : null}
      <section data-room-top="create" data-create-stage={stage.count} aria-label="이 방에서 지금 알아야 할 것" className="flex min-h-control-touch items-center justify-between rounded-surface border border-border bg-surface px-pad-inset py-stack">
        <b className="text-lead text-accent">{stage.count}</b><span className="text-caption text-subtle">{stage.label}</span>
      </section>
      <div className="grid gap-stack-section lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="grid min-w-0 gap-stack-section xl:grid-cols-3" data-display-readonly="create">
          <section className="card min-w-0 p-pad-inset xl:col-span-2" aria-labelledby="create-display-title">
            <div className="mb-stack flex items-center justify-between border-b border-border pb-stack">
              <b id="create-display-title" className="text-body text-text">{selectedCandidate ? "선택한 구조 초안" : candidates.length ? "주제별 구조 초안 3개" : kindHeading}</b>
              <span className="text-caption text-subtle">{selectedCandidate ? `${selectedCandidate.label} 구조` : candidates.length ? "학습 정보 기반 초안" : "구성 방식 예시"}</span>
            </div>
            <div className="grid gap-stack" data-create-candidate-deck>
              {displayCandidates.filter((candidate) => !selectedCandidate || candidate.label === selectedCandidate.label).map((candidate) => {
                const outline = "format" in candidate ? candidate.format.outline : candidate.outline;
                return (
                  <article key={candidate.label} data-create-candidate={candidate.label} className={`grid gap-stack rounded-surface border p-pad-inset md:grid-cols-5 ${selected === candidate.label ? "border-accent bg-accent-soft" : "border-border bg-surface-2"}`}>
                    <div className="md:col-span-3">
                      <div className="mb-stack flex items-start gap-stack-tight"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-pill bg-accent text-caption font-bold text-accent-fg">{candidate.label}</span><b className="break-keep text-body-sm text-text">{candidate.title}</b></div>
                      <p className="break-keep text-caption text-muted">{primaryKind ? `${CREATE_KIND_LABELS[primaryKind]}에 적용할 이야기 순서` : "형식을 고른 뒤 주제에 맞춰 바뀌는 이야기 순서"}</p>
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
            <div className="mb-stack flex items-center justify-between border-b border-border pb-stack"><b id="create-learning-title" className="text-body text-text">회원님께 쌓인 것</b><span className="text-caption text-subtle">{learnedCount} / {LEARNING_SLOT_TOTAL}</span></div>
            <progress className="progress-semantic mb-pad-inset w-full" max={LEARNING_SLOT_TOTAL} value={learnedCount} aria-label="학습 정보 수집 정도" />
            <dl className="space-y-stack">
              <div><dt className="text-caption text-subtle">작업 공간</dt><dd className="text-body text-text">{workspaceName || "아직 없음"}</dd></div>
              <div><dt className="text-caption text-subtle">업종</dt><dd className="line-clamp-4 break-keep text-body-sm text-muted">{learning.industry || guide || "아직 없음"}</dd></div>
              <div><dt className="text-caption text-subtle">말투</dt><dd className="break-keep text-body-sm text-muted">{learning.voice || "아직 없음"}</dd></div>
              <div><dt className="text-caption text-subtle">콘텐츠 목표</dt><dd className="break-keep text-body-sm text-muted">{purpose || "아직 없음"}</dd></div>
              <div><dt className="text-caption text-subtle">주요 고객</dt><dd className="break-keep text-body-sm text-muted">{audience || "아직 없음"}</dd></div>
              <div className="border-t border-border pt-stack"><dt className="text-caption text-subtle">성과에서 배운 규칙</dt><dd className="text-body-sm text-muted">{learning.learnedRules || "아직 없음"}</dd></div>
            </dl>
          </section>
        </div>
        <AssistantPanel title="생성 담당">
          <Stack gap={16}>
            <div className="max-w-[90%] rounded-surface rounded-tl-control border border-border bg-surface p-stack text-body-sm text-text" data-empty-next={!candidates.length ? "create" : undefined}>
              {selectedCandidate ? "구조 초안이 준비됐습니다. 영상은 대본과 장면 구성까지만 제공하며 렌더링은 아직 지원하지 않습니다." : candidates.length ? "A, B, C 구조 중 편집할 초안을 하나 골라 주세요." : "한 번에 하나씩 묻겠습니다. 선택한 답은 다음 질문에 반영됩니다."}
            </div>
            <div className="rounded-control border border-border bg-surface-2 p-stack text-caption text-muted" data-generation-capability>
              <b className="block text-text">현재 제공</b>
              <span className="block">일곱 칸 학습 정보를 반영한 구성 초안 3개</span>
              <b className="mt-stack-tight block text-text">준비 중</b>
              <span className="block">영상 렌더링, 카드뉴스 이미지 생성</span>
            </div>
            {!candidates.length ? <>
              <div className="space-y-stack rounded-surface border border-border bg-surface p-stack" data-create-question={question}>
                {question === "kind" ? <fieldset data-create-kind-picker><legend className="mb-stack-tight text-caption font-semibold text-text">무엇을 만들까요?</legend>
                  <p className="mb-stack break-keep text-caption text-subtle">여러 형식을 고를 수 있습니다. 처음 고른 형식의 구조 초안 3개를 먼저 보여 드립니다.</p>
                  <div className="flex flex-wrap gap-stack-tight">
                    {CREATE_KIND_ORDER.map((kind) => (
                      <Button key={kind} size="sm" variant={primaryKind === kind || alsoKinds.includes(kind) ? "primary" : "secondary"} aria-pressed={primaryKind === kind || alsoKinds.includes(kind)} onClick={() => choosePrimary(kind)}>{CREATE_KIND_LABELS[kind]}</Button>
                    ))}
                  </div>
                  {primaryKind ? <p className="mt-stack-tight break-keep text-caption text-subtle">{CREATE_KIND_LABELS[primaryKind]} 구조를 먼저 확인합니다.{alsoKinds.length ? ` 추가 선택: ${alsoKinds.map((kind) => CREATE_KIND_LABELS[kind]).join(", ")}` : ""}</p> : null}
                  <div className="mt-stack flex justify-end"><Button variant="primary" onClick={() => setQuestionIndex(1)} disabled={!primaryKind}>다음</Button></div>
                </fieldset> : null}

                {question === "purpose" ? <fieldset data-create-purpose-picker><legend className="mb-stack-tight text-caption font-semibold text-text">이번 콘텐츠로 원하는 결과는 무엇인가요?</legend>
                  <div className="flex flex-wrap gap-stack-tight">
                    {PURPOSE_CARDS.map((card) => (
                      <Button key={card.id} size="sm" variant={purpose === card.sample ? "primary" : "secondary"} aria-pressed={purpose === card.sample} title={card.sample} onClick={() => { setPurpose(card.sample); setQuestionIndex(2); }}>{card.title}</Button>
                    ))}
                  </div>
                  {purpose ? <p className="mt-stack-tight break-keep text-caption text-subtle">{purpose}</p> : null}
                </fieldset> : null}

                {question === "audience" ? <fieldset data-create-audience-picker><legend className="mb-stack-tight text-caption font-semibold text-text">누가 이 콘텐츠를 보나요?</legend>
                  <p className="mb-stack break-keep text-caption text-subtle">우리 서비스를 이용하거나 구매할 고객을 기준으로 고르세요.</p>
                  <div className="flex flex-wrap gap-stack-tight">
                    {AUDIENCE_CARDS.map((card) => (
                      <Button key={card.id} size="sm" variant={audience === card.sample ? "primary" : "secondary"} aria-pressed={audience === card.sample} title={card.sample} onClick={() => chooseAudience(card.sample)}>{card.title}</Button>
                    ))}
                  </div>
                  {audience ? <p className="mt-stack-tight break-keep text-caption text-subtle">{audience}</p> : null}
                </fieldset> : null}

                {question === "topic" ? <fieldset data-create-topic-picker><legend className="mb-stack-tight text-caption font-semibold text-text">어떤 주제로 만들까요?</legend>
                  <p className="mb-stack break-keep text-caption text-subtle">학습 정보의 업종과 방금 고른 목표를 기준으로 제안했습니다.</p>
                  <div className="space-y-stack-tight">
                    {topicCards.map((suggestion) => (
                      <Button key={suggestion} size="sm" variant={topic === suggestion ? "primary" : "secondary"} aria-pressed={topic === suggestion} onClick={() => { onTopicChange(suggestion); setTopicOpen(false); setQuestionIndex(4); }} className="ds-label-fill w-full min-w-0 justify-start text-left"><span className="min-w-0 truncate">{suggestion}</span></Button>
                    ))}
                    {topicOpen ? (
                      <><Field label="직접 입력한 주제" htmlFor="studio-topic"><input ref={topicInputRef} id="studio-topic" value={topic} onChange={(event) => onTopicChange(event.target.value)} placeholder="고객에게 전할 주제를 입력하세요" className="w-full rounded-control border border-border bg-surface-2 px-stack text-body text-text" /></Field><Button variant="primary" onClick={() => setQuestionIndex(4)} disabled={!topic.trim()}>이 주제로 계속</Button></>
                    ) : (
                      <Button size="sm" onClick={() => { setTopicOpen(true); setTimeout(() => topicInputRef.current?.focus(), 0); }}>직접 입력</Button>
                    )}
                  </div>
                </fieldset> : null}

                {question === "rights" ? <fieldset data-create-rights-picker><legend className="mb-stack-tight text-caption font-semibold text-text">사용할 자료의 권리를 확인해 주세요.</legend>
                  <p className="mb-stack break-keep text-caption text-subtle">직접 만든 자료이거나, 저작권자에게 콘텐츠 제작과 게시 허가를 받은 사진·영상·글만 사용할 수 있습니다.</p>
                  <label className="flex items-start gap-stack-tight text-caption text-muted"><input type="checkbox" checked={rightsConfirmed} onChange={(event) => confirmRights(event.target.checked)} />위 조건을 확인했습니다.</label>
                  <div className="mt-stack flex justify-end"><Button variant="primary" onClick={() => setQuestionIndex(5)} disabled={!rightsConfirmed}>입력 내용 확인</Button></div>
                </fieldset> : null}

                {question === "review" ? <section data-create-review>
                  <b className="text-caption font-semibold text-text">입력 내용을 확인해 주세요.</b>
                  <dl className="mt-stack space-y-stack-tight text-caption text-muted">
                    <div><dt className="text-subtle">형식</dt><dd>{primaryKind ? [primaryKind, ...alsoKinds].map((kind) => CREATE_KIND_LABELS[kind]).join(", ") : "미입력"}</dd></div>
                    <div><dt className="text-subtle">목표</dt><dd>{purpose || "미입력"}</dd></div>
                    <div><dt className="text-subtle">고객</dt><dd>{audience || "미입력"}</dd></div>
                    <div><dt className="text-subtle">주제</dt><dd>{topic || "미입력"}</dd></div>
                    <div><dt className="text-subtle">사용 권리</dt><dd>{rightsConfirmed ? "확인됨" : "미확인"}</dd></div>
                  </dl>
                </section> : null}
              </div>
              {questionIndex > 0 && question !== "review" ? <Button onClick={() => setQuestionIndex((current) => Math.max(0, current - 1))}>이전 질문</Button> : null}
              {question === "review" && missing.length ? <div className="rounded-control border border-warning/30 bg-warning/10 p-stack text-caption text-warning">확인 필요: {missing.join(", ")}</div> : null}
              {question === "review" ? <><Button onClick={() => setQuestionIndex(0)}>입력 내용 수정</Button><Button variant="primary" onClick={generate} disabled={loading || missing.length > 0}>{loading ? "구조 초안 만드는 중" : "구조 초안 3개 보기"}</Button></> : null}
            </> : null}
            {candidates.length && !selectedCandidate ? <>
              {candidates.map((candidate) => <Button key={candidate.label} variant="secondary" onClick={() => choose(candidate)}>{candidate.label} 구조 초안 선택</Button>)}
              <Button onClick={regenerateAll} disabled={loading}>{loading ? "다시 만드는 중" : "3개 모두 바꾸기"}</Button>
            </> : null}
            {selectedCandidate && alsoQuote && !alsoBatch ? (
              <div className="space-y-stack rounded-surface border border-border bg-surface p-stack" data-create-also-confirm>
                <b className="block text-caption font-semibold text-text">추가 형식의 구성 초안 비용</b>
                <ul className="space-y-stack-tight">
                  {alsoQuote.lines.map((line) => (
                    <li key={line.kind} className="flex justify-between text-caption text-muted">
                      <span>{line.label}</span>
                      <span>{line.unit_minor.toLocaleString("ko-KR")}원</span>
                    </li>
                  ))}
                </ul>
                <p className="flex justify-between border-t border-border pt-stack-tight text-caption font-semibold text-text" data-also-total-minor={alsoQuote.total_minor}>
                  <span>구성 초안 생성 비용</span>
                  <span>{alsoQuote.total_minor.toLocaleString("ko-KR")}원</span>
                </p>
                <p className="break-keep text-caption text-subtle">완성 미디어가 아니라 선택한 구조를 다른 형식에 맞춘 구성 초안입니다. 실패한 형식은 청구하지 않습니다.</p>
                <Button variant="primary" onClick={confirmAlsoKinds} disabled={alsoBusy}>{alsoBusy ? "구성 초안 만드는 중" : "선택한 형식의 구성 초안 만들기"}</Button>
              </div>
            ) : null}
            {alsoBatch ? (
              <div className="space-y-stack rounded-surface border border-border bg-surface p-stack" data-create-also-result={alsoBatch.status}>
                <b className="block text-caption font-semibold text-text">{alsoBatch.discarded_at ? "추가 구성 초안을 버렸습니다" : "추가 형식의 구성 초안"}</b>
                <ul className="space-y-stack-tight">
                  {alsoBatch.items.map((item) => (
                    <li key={item.kind} className="break-keep text-caption text-muted" data-also-item={item.kind} data-also-item-status={item.status}>
                      {item.label}: {item.status === "succeeded" ? (item.kind === "video" ? "대본과 장면 구성을 준비했습니다. 영상 렌더링은 아직 제공하지 않습니다" : "구성 초안을 준비했습니다") : `구성 초안을 만들지 못했습니다. ${item.failure_reason ?? ""}`}
                    </li>
                  ))}
                </ul>
                <p className="text-caption text-subtle">나간 값 {alsoBatch.cost.charged_minor.toLocaleString("ko-KR")}원</p>
                {alsoBatch.discarded_at ? null : <Button onClick={discardAlso} disabled={alsoBusy}>추가 구성 초안 버리기</Button>}
              </div>
            ) : null}
            {selectedCandidate && (alsoKinds.length === 0 || Boolean(alsoBatch)) ? <Stack gap={8}><Button variant="primary" onClick={onOpenEditor}>선택한 구조 초안을 편집실에서 보기</Button><Button onClick={() => setSelected(null)}>구조 초안 다시 고르기</Button></Stack> : null}
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
  onKindChange?: (kind: EditContentKind) => void;
  previewReady?: boolean;
  commandPanel?: ReactNode;
  initialFormat?: ContentEditFormat;
  onFormatChange?: (format: ContentEditFormat) => void;
  cardTextPositions?: CardTextPosition[];
  onCardTextPositionsChange?: (positions: CardTextPosition[]) => void;
}
type ToolName = "비율" | "배경" | "목소리" | "속도" | "자막" | "음악" | "음량";
const VIDEO_TOOLS: ToolName[] = ["비율", "목소리", "속도", "자막"];
const CARD_TOOLS: ToolName[] = ["비율", "배경", "자막"];
const AUDIO_TOOLS: ToolName[] = ["목소리", "음악", "음량"];

type ToolValues = Record<ToolName, string>;

const EDIT_KIND_LABELS: Record<EditContentKind, string> = {
  text: "글",
  card: "카드뉴스",
  video: "영상",
  audio: "소리",
};
const EDIT_KIND_ORDER: EditContentKind[] = ["text", "card", "video", "audio"];
const SUBTITLE_SIZE_LABELS: Record<string, string> = {
  작게: "작은 글자",
  보통: "기본 글자",
  크게: "큰 글자",
};
const BACKGROUND_LABELS: Record<string, string> = {
  "작업실 책상": "책상 위 제품 사진",
  "삭제 커밋 화면": "프로그램 작업 화면",
  "창밖 새벽": "새벽 창가 사진",
};

function visibleToolName(kind: EditContentKind, tool: ToolName): string {
  if (tool === "비율") return kind === "card" ? "카드 크기" : "영상 크기";
  if (tool === "배경") return "배경 이미지";
  if (tool === "자막") return kind === "card" ? "카드 글자 크기" : "자막 크기";
  if (tool === "속도") return "영상 재생 속도";
  if (tool === "음량") return "배경음악 음량";
  return tool;
}

function visibleToolValue(tool: ToolName, value: string): string {
  if (tool === "자막") return SUBTITLE_SIZE_LABELS[value] ?? value;
  if (tool === "배경") return BACKGROUND_LABELS[value] ?? value;
  return value;
}

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

export function EditRoom({ lines, onLinesChange, kind = "video", onKindChange, previewReady = false, commandPanel, initialFormat, onFormatChange, cardTextPositions = [], onCardTextPositionsChange }: EditRoomProps) {
  const formatKind = kind === "text" ? "card" : kind;
  const safeLines = lines.length ? lines : [""];
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
  const visibleCount = visibleLines.filter((visible, index) => visible && Boolean(safeLines[index]?.trim())).length;
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
      <section data-room-top="edit" aria-label="편집실 현재 작업" className="space-y-stack rounded-surface border border-border bg-surface px-pad-inset py-stack">
        <div className="flex flex-wrap items-center justify-between gap-stack">
          <b className="text-lead text-accent">{`${visibleCount}개 ${unit}`}</b>
          <span className="text-caption text-subtle" data-edit-duration>
            {kind === "text"
              ? `${safeLines.join("\n\n").length}자 · 문단을 다듬는 중`
              : kind === "audio" ? "음악 생성 준비 중" : kind === "card" ? "카드 안 글자를 다듬는 중" : `${durationLabel}초 · 대사를 다듬는 중`}
          </span>
        </div>
        <div role="group" aria-label="편집할 콘텐츠 형식" className="flex flex-wrap gap-stack-tight">
          {EDIT_KIND_ORDER.map((editKind) => (
            <Button
              key={editKind}
              size="sm"
              aria-label={EDIT_KIND_LABELS[editKind]}
              aria-pressed={kind === editKind}
              variant={kind === editKind ? "primary" : "secondary"}
              onClick={() => onKindChange?.(editKind)}
            >
              {EDIT_KIND_LABELS[editKind]}
            </Button>
          ))}
        </div>
        <p className="break-keep text-caption text-subtle">
          {kind === "text"
            ? "글은 아래 문단 편집기에서 고칩니다. 발행 채널별 표현은 발행실에서 따로 맞춥니다."
            : kind === "card"
              ? "카드 안 글자를 직접 고치고, 글자 위치 옮기기를 잡아 원하는 자리로 끌어 놓습니다."
              : kind === "video"
                ? "영상은 장면별 대사를 고치고 순서를 다듬습니다. 완성 영상 파일이 없어도 대본 편집은 할 수 있습니다."
                : "소리는 목소리와 배경음악을 다듬습니다. 음악 파일 생성은 아직 준비 중입니다."}
        </p>
      </section>
      <div className="grid gap-stack-section lg:grid-cols-[minmax(0,1fr)_20rem]">
        {kind === "text" ? (
          // 글은 자막 줄이 아니라 문단이다(회장 2026-08-30 "글 선택했을때 자막고치듯이 저렇게 한 이유").
          // 왼쪽은 문단 목차, 가운데는 전체 본문, 오른쪽 아래는 고른 문단만 고치는 칸이다.
          <div className="card grid min-w-0 overflow-hidden md:grid-cols-[15rem_minmax(0,1fr)]" data-edit-workspace data-text-document-editor>
            <nav className="min-w-0 max-h-[40vh] overflow-y-auto border-b border-border p-pad-inset md:border-b-0 md:border-r" aria-label={outlineTitle} data-edit-outline>
              <b className="text-body text-text">{outlineTitle}</b>
              <ol className="mt-stack space-y-stack-tight">{safeLines.map((line, index) => <li key={`${index}-${line.slice(0, 16)}`}><Button size="sm" variant={activeLine === index ? "primary" : "secondary"} onClick={() => setActiveLine(index)} className="ds-label-fill w-full min-w-0 justify-start overflow-hidden text-left"><span className="min-w-0 truncate">{index + 1}. {line || "빈 문단"}</span></Button></li>)}</ol>
            </nav>
            <div className="min-w-0 p-pad-inset">
              <section aria-label="글 미리보기" data-edit-stage>
                <div className="rounded-surface border border-border bg-surface-2 p-pad-inset">
                  <b className="text-subheading text-text">글 본문</b>
                  <span className="ml-stack-tight text-caption text-subtle">문단 사이에는 빈 줄을 둡니다</span>
                  <textarea
                    aria-label="글 본문"
                    value={safeLines.join("\n\n")}
                    rows={14}
                    onChange={(event) => onLinesChange(event.target.value.split(/\n\s*\n/))}
                    className="mt-stack min-h-80 w-full resize-y rounded-control border border-border bg-surface p-pad-inset text-body leading-relaxed text-text"
                  />
                </div>
              </section>
              <section className="mt-stack" aria-label="문단 고치기">
                <b id="edit-paragraph-title" className="text-body text-text">문단</b>
                <ol className="mt-stack space-y-stack-tight" aria-labelledby="edit-paragraph-title">{safeLines.map((line, index) => <li key={`p-${index}`} className="flex min-w-0 items-center gap-stack-tight">
                  <span className="w-6 shrink-0 text-caption text-subtle">{index + 1}</span>
                  <input
                    aria-label={`문단 ${index + 1}`}
                    value={line}
                    onFocus={() => setActiveLine(index)}
                    onChange={(event) => onLinesChange(safeLines.map((current, i) => (i === index ? event.target.value : current)))}
                    className="min-h-control-touch min-w-0 flex-1 rounded-control border border-border bg-surface px-stack text-body-sm text-text"
                  />
                </li>)}</ol>
              </section>
            </div>
          </div>
        ) : <div className="card grid min-w-0 overflow-hidden md:grid-cols-[15rem_minmax(0,1fr)]" data-edit-workspace>
          <nav className="min-w-0 max-h-[40vh] overflow-y-auto border-b border-border p-pad-inset md:border-b-0 md:border-r" aria-label={outlineTitle} data-edit-outline>
            <b className="text-body text-text">{outlineTitle}</b>
            <ol className="mt-stack space-y-stack-tight">{safeLines.map((line, index) => <li key={`${index}-${line.slice(0, 16)}`}><Button size="sm" variant={activeLine === index ? "primary" : "secondary"} onClick={() => setActiveLine(index)} className={`ds-label-fill w-full min-w-0 justify-start overflow-hidden text-left ${visibleLines[index] ? "" : "line-through opacity-60"}`}><span className="min-w-0 truncate">{index + 1}. {line || "빈 대사"}</span></Button></li>)}</ol>
          </nav>
          <div className="min-w-0 p-pad-inset">
            {kind === "audio" ? <section className="grid min-h-80 place-items-center rounded-surface border border-dashed border-border bg-surface-2 p-region text-center" data-edit-readiness><div className="max-w-xl"><b className="text-subheading text-text">음악 생성 백엔드는 준비 중입니다</b><p className="mt-stack break-keep text-body-sm text-muted">현재는 나레이션 대사만 확인할 수 있습니다. 음악 파일이나 파형은 아직 표시하지 않습니다.</p></div></section> : <>
              <section aria-label={kind === "card" ? "카드뉴스 미리보기" : "영상 미리보기"} data-edit-stage>
                <EditPreview
                  kind={kind}
                  lines={safeLines.map((line, index) => (visibleLines[index] ? line : ""))}
                  activeLine={activeLine}
                  onActiveLine={setActiveLine}
                  subtitleSize={toolValues.자막}
                  renderReady={previewReady}
                  onLinesChange={onLinesChange}
                  cardTextPositions={cardTextPositions}
                  onCardTextPositionsChange={onCardTextPositionsChange}
                />
              </section>
              <section className="mt-stack border-b border-border pb-stack" aria-label="간편 편집 도구" data-edit-tools>
                <div className="flex flex-wrap gap-stack-tight">{tools.map((tool) => <Button key={tool} size="sm" variant={activeTool === tool ? "primary" : "secondary"} onClick={() => setActiveTool(tool)} aria-pressed={activeTool === tool} aria-label={`${visibleToolName(kind, tool)} 도구`}><ToolIcon tool={tool} /><span>{visibleToolName(kind, tool)}: {visibleToolValue(tool, toolValues[tool])}</span></Button>)}
                  {kind === "video" ? <Button size="sm" onClick={trimSilences} disabled={visibleSilences === 0}>무음 구간 {visibleSilences}개 줄이기</Button> : null}
                </div>
                <div className="mt-stack flex flex-wrap gap-stack-tight" aria-label={`${visibleToolName(kind, activeTool)} 선택지`}>{toolOptions(formatKind, activeTool).map((option) => <Button key={option} size="sm" variant={toolValues[activeTool] === option ? "primary" : "secondary"} aria-pressed={toolValues[activeTool] === option} onClick={() => setToolValues((current) => ({ ...current, [activeTool]: option }))}>{visibleToolValue(activeTool, option)}</Button>)}</div>
              </section>
            </>}
            <section className="mt-pad-inset" aria-labelledby="edit-script-title" data-edit-script>
              <div className="mb-stack flex flex-wrap items-center justify-between gap-stack-tight"><b id="edit-script-title" className="text-body text-text">{kind === "card" ? "장 문구" : "대사"}</b><span className="text-caption text-subtle">화면 아래에서 바로 고칩니다</span></div>
              <ol className="space-y-stack-tight">{safeLines.map((line, index) => <li key={`script-${index}`} className={`grid gap-stack-tight rounded-control border border-border bg-surface-2 p-stack md:grid-cols-[4rem_minmax(0,1fr)_auto] ${visibleLines[index] ? "" : "opacity-60"}`} data-script-line={index + 1}>
                <span className="text-caption text-subtle">{index * secondsPerLine}초부터</span>
                {activeLine === index ? <input aria-label={`${kind === "card" ? "문구" : "대사"} ${index + 1}`} value={line} onChange={(event) => updateLine(event.target.value)} className={`min-h-control-touch min-w-0 rounded-control border border-border bg-surface px-stack text-body-sm text-text ${visibleLines[index] ? "" : "line-through"}`} /> : <button type="button" onClick={() => setActiveLine(index)} className={`min-h-control-touch min-w-0 break-keep rounded-control px-stack text-left text-body-sm text-text hover:bg-surface ${visibleLines[index] ? "" : "line-through"}`}>{line || "빈 대사"}</button>}
                <Button size="sm" onClick={() => toggleLine(index)}>{visibleLines[index] ? "빼기" : "되살리기"}</Button>
              </li>)}</ol>
            </section>
          </div>
        </div>}
        {commandPanel ?? <AssistantPanel title="편집 담당"><Stack gap={12}><div className="rounded-control border border-border bg-surface p-stack"><span className="text-caption text-subtle">현재 위치</span><p className="mt-micro text-body text-text">{activeLine + 1} / {safeLines.length}</p></div><div className="rounded-control border border-border bg-surface p-stack"><span className="text-caption text-subtle">지금 고치는 것</span><p className="mt-micro text-body text-text">{kind === "card" ? "카드뉴스" : kind === "text" ? "글" : kind === "audio" ? "음악" : "영상"}</p></div></Stack></AssistantPanel>}
      </div>
    </section>
  );
}

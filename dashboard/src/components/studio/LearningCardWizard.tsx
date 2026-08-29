"use client";

import { useMemo, useState } from "react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/shared/Button";
import {
  AUDIENCE_CARDS,
  INDUSTRY_CARDS,
  VOICE_CARDS,
  learningToBrandAnswers,
  readLearningInfo,
  writeLearningInfo,
  type LearningCard,
  type LearningInfo,
  type LearningSlotKey,
} from "./learning-info";

// 첫 방문 세 걸음 카드 문답.
//
// 회장 지적: "주관식이면 나라도 뭘 입력해야할 지를 모르겠는데."
// 그래서 이 문답에는 기본 경로에 입력창이 한 칸도 없다. 전부 카드를 누른다.
// 걸음마다 "잘 모르겠습니다. 골라 주십시오."가 있어 세 번 눌러도 끝난다.
// 카드에 없는 경우에만 "여기 없습니다"로 대화 한 줄이 열린다. 그것이 유일한 탈출구다.

interface Step {
  key: LearningSlotKey;
  question: string;
  cards: readonly LearningCard[];
  /** 카드에 없을 때 담당이 되묻는 말 */
  escapePrompt: string;
}

const STEPS: readonly Step[] = [
  { key: "industry", question: "무엇을 하는 곳입니까", cards: INDUSTRY_CARDS, escapePrompt: "어떤 일을 하시는지 한 줄로 알려 주시면 그대로 배우겠습니다" },
  { key: "audience", question: "누구에게 말합니까", cards: AUDIENCE_CARDS, escapePrompt: "어떤 분들이 보시는지 한 줄로 알려 주십시오" },
  { key: "voice", question: "어떤 결로 말합니까", cards: VOICE_CARDS, escapePrompt: "어떤 말투가 우리 같은지 한 줄로 알려 주십시오" },
] as const;

export function LearningCardWizard({
  workspaceId,
  workspaceName,
  onSaved,
  onClose,
}: {
  workspaceId: string;
  workspaceName?: string;
  /** 다 채우고 닫으면 completed=true. 덜 채우고 닫으면 false(헤더가 한 번 깜빡인다) */
  onSaved: (info: LearningInfo, completed: boolean) => void;
  onClose: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [info, setInfo] = useState<LearningInfo>(() => readLearningInfo(workspaceId));
  const [escapeOpen, setEscapeOpen] = useState(false);
  const [escapeDraft, setEscapeDraft] = useState("");
  const [distilling, setDistilling] = useState(false);

  const step = STEPS[stepIndex];
  const answered = useMemo(() => STEPS.filter((one) => (info[one.key] || "").trim()).length, [info]);

  const persist = (next: LearningInfo) => {
    setInfo(next);
    writeLearningInfo(workspaceId, next);
    return next;
  };

  const finish = async (next: LearningInfo) => {
    const completed = STEPS.every((one) => (next[one.key] || "").trim());
    // 브랜드 가이드 증류는 배경에서 시도한다. 실패해도 고른 답은 이미 저장돼 있다.
    if (completed) {
      setDistilling(true);
      try {
        await apiPost("/api/studio/brand-setup", { tenant_id: workspaceId, answers: learningToBrandAnswers(next) });
      } catch {
        /* 증류가 실패해도 고른 답은 남는다. 다음 생성에서 이 값을 그대로 싣는다 */
      } finally {
        setDistilling(false);
      }
    }
    onSaved(next, completed);
  };

  const advance = async (value: string) => {
    const next = persist({ ...info, [step.key]: value });
    setEscapeOpen(false);
    setEscapeDraft("");
    if (stepIndex < STEPS.length - 1) setStepIndex(stepIndex + 1);
    else await finish(next);
  };

  /** 잘 모르겠습니다. 앞 걸음 답에서 가장 그럴듯한 것을 담당이 고른다. */
  const pickForMe = async () => {
    const pickedIndustry = INDUSTRY_CARDS.findIndex((card) => card.sample === info.industry);
    const seed = pickedIndustry >= 0 ? pickedIndustry : 0;
    const card = step.cards[seed % step.cards.length];
    await advance(card.sample);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-player-surface/70 p-pad-inset" role="dialog" aria-modal="true" aria-label="학습 정보 문답">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-surface border border-border bg-surface p-stack-section shadow-floating" data-learning-wizard={step.key}>
        <div className="flex flex-wrap items-center gap-stack border-b border-border pb-stack">
          <div className="mr-auto min-w-0">
            <b className="block text-lead text-text">{workspaceName || "작업 공간"} 학습 정보</b>
            <span className="text-caption text-subtle">고르기만 하시면 됩니다. 적을 것은 없습니다</span>
          </div>
          <span className="rounded-pill bg-accent-soft px-stack py-stack-tight text-caption font-semibold text-accent" data-learning-step={`${stepIndex + 1}/${STEPS.length}`}>
            {stepIndex + 1} / {STEPS.length} · 약 40초
          </span>
        </div>

        <p className="mt-pad-inset text-subheading font-bold text-text">{step.question}</p>

        <div className="mt-stack grid gap-stack-tight sm:grid-cols-2" aria-label={`${step.question} 선택 카드`}>
          {step.cards.map((card) => {
            const chosen = info[step.key] === card.sample;
            return (
              <button
                key={card.id}
                type="button"
                data-learning-card={card.id}
                aria-pressed={chosen}
                onClick={() => void advance(card.sample)}
                className={`min-h-control-touch rounded-surface border p-stack text-left ${chosen ? "border-accent bg-accent-soft" : "border-border bg-surface-2 hover:bg-surface"}`}
              >
                <b className="block text-body-sm text-text">{card.title}</b>
                <span className="mt-micro block break-keep text-caption text-muted">{card.sample}</span>
              </button>
            );
          })}
        </div>

        {escapeOpen ? (
          <div className="mt-stack rounded-surface border border-border bg-surface-2 p-stack">
            <p className="break-keep text-body-sm text-text">{step.escapePrompt}</p>
            <div className="mt-stack flex flex-wrap gap-stack-tight">
              <input
                aria-label="담당에게 직접 말하기"
                value={escapeDraft}
                onChange={(event) => setEscapeDraft(event.target.value)}
                className="min-h-control-touch min-w-0 flex-1 rounded-control border border-border bg-surface px-stack text-body-sm text-text"
              />
              <Button variant="primary" onClick={() => escapeDraft.trim() && void advance(escapeDraft.trim())}>
                이대로 배우기
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-pad-inset flex flex-wrap items-center gap-stack-tight border-t border-border pt-stack">
          {stepIndex > 0 ? <Button onClick={() => setStepIndex(stepIndex - 1)}>앞 걸음으로</Button> : null}
          <Button onClick={() => void pickForMe()} disabled={distilling}>잘 모르겠습니다. 골라 주십시오</Button>
          <Button onClick={() => setEscapeOpen(true)} disabled={escapeOpen}>여기 없습니다</Button>
          <button
            type="button"
            onClick={() => {
              onSaved(info, answered >= STEPS.length);
              onClose();
            }}
            className="ml-auto min-h-control-touch rounded-control px-stack text-caption text-subtle hover:text-muted"
          >
            {distilling ? "배우는 중" : "나중에 하기. 헤더 학습 정보에서 이어 채웁니다"}
          </button>
        </div>
      </div>
    </div>
  );
}

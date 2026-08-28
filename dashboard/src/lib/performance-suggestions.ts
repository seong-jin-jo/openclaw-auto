import crypto from "node:crypto";

export const HYPOTHESIS_LABEL = "가설 · 우리 검증 기록 아님";
export const PERFORMANCE_SAMPLE_THRESHOLD = 5;

export interface PerformanceSampleAssessment {
  count: number;
  threshold: number;
  thresholdMet: boolean;
}

export function assessPerformanceSample(count: number): PerformanceSampleAssessment {
  const safeCount = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
  return {
    count: safeCount,
    threshold: PERFORMANCE_SAMPLE_THRESHOLD,
    thresholdMet: safeCount >= PERFORMANCE_SAMPLE_THRESHOLD,
  };
}

export interface SuggestionEvidence {
  postIds: string[];
  signalIds: string[];
  sampleCount: number;
  sampleThreshold: number;
  sampleThresholdMet: boolean;
  brandContextAvailable: boolean;
  marketTrendAvailable: boolean;
}

export interface PerformanceSuggestion {
  id: string;
  text: string;
  basis: "hypothesis" | "performance" | "trend";
  label: string;
  verified: boolean;
  evidence: SuggestionEvidence;
}

interface HypothesisInput {
  tenantId: string;
  brandPrompt: string | null;
  signals: Array<{ id: string; content: string | null }>;
}

function compact(value: string | null | undefined, fallback: string, limit: number): string {
  const oneLine = (value || "").replace(/\s+/g, " ").replace(/^[-#*\s]+/, "").trim();
  return (oneLine || fallback).slice(0, limit);
}

function suggestionId(tenantId: string, index: number, text: string): string {
  return `hyp_${crypto.createHash("sha256").update(`${tenantId}:${index}:${text}`).digest("hex").slice(0, 16)}`;
}

export function buildZeroPerformanceSuggestions(input: HypothesisInput): PerformanceSuggestion[] {
  const brand = compact(input.brandPrompt, "이 브랜드가 해결하는 핵심 문제", 72);
  const signal = compact(input.signals[0]?.content, "수집된 시장 신호가 없어 넓은 형식부터 비교", 80);
  const texts = [
    `브랜드 맥락 "${brand}"에서 고객이 겪는 문제와 해결 전후를 짧은 비교형 콘텐츠로 검증해 보세요.`,
    `시장 신호 "${signal}"에서 보이는 패턴을 그대로 복제하지 말고, 고객이 저장할 세 단계 체크리스트로 바꿔 검증해 보세요.`,
    `"${brand}"와 관련해 업계의 익숙한 주장 하나를 반대로 묻고, 의견형 콘텐츠로 반응을 비교해 보세요.`,
  ];
  const sample = assessPerformanceSample(0);
  const evidence: SuggestionEvidence = {
    postIds: [],
    signalIds: input.signals.map((item) => item.id),
    sampleCount: 0,
    sampleThreshold: sample.threshold,
    sampleThresholdMet: sample.thresholdMet,
    brandContextAvailable: Boolean(input.brandPrompt?.trim()),
    marketTrendAvailable: input.signals.length > 0,
  };

  return texts.map((text, index) => ({
    id: suggestionId(input.tenantId, index, text),
    text,
    basis: "hypothesis",
    label: HYPOTHESIS_LABEL,
    verified: false,
    evidence,
  }));
}

import crypto from "node:crypto";
import { StudioApiError } from "./errors";
import type { GenerationCandidate } from "./service";

// 주 갈래 하나를 확정하면 같이 고른 갈래로 옮겨 만든다(구조질문 2, 확정안 나3).
// 옮긴다는 말이 핵심이다. 갈래마다 따로 생성하면 같은 주제라는 보장이 없어서
// 주 갈래 결과(제목, 각도, 뼈대)를 재료로 삼아 갈래별 모양으로 개작한다.
export const DERIVATION_KINDS = ["text", "card", "video"] as const;
export type DerivationKind = typeof DERIVATION_KINDS[number];

export const DERIVATION_KIND_LABELS: Record<DerivationKind, string> = {
  text: "글",
  card: "카드뉴스",
  video: "영상",
};

export type DerivationQuoteLine = {
  kind: DerivationKind;
  unitMinor: number;
};

export type DerivationQuote = {
  currency: string;
  totalMinor: number;
  lines: DerivationQuoteLine[];
  assumptions: string[];
};

export type DerivationPayload =
  | { kind: "text"; body: string }
  | { kind: "card"; slides: { id: string; order: number; text: string; image_url: null }[] }
  | {
      kind: "video";
      asset_url: string;
      scenes: { id: string; order: number; title: string; lines: { id: string; order: number; text: string; visible: true; deleted_at: null }[] }[];
    };

export type DerivationItem = {
  kind: DerivationKind;
  status: "succeeded" | "failed";
  draftId: string | null;
  handoffId: string | null;
  summary: string;
  chargedMinor: number;
  failureReason: string | null;
};

export type DerivationBatch = {
  batchId: string;
  jobId: string;
  candidateId: string;
  status: "succeeded" | "partially_succeeded" | "failed";
  currency: string;
  quotedMinor: number;
  chargedMinor: number;
  items: DerivationItem[];
  createdAt: string;
  discardedAt: string | null;
};

// 파생 단가. 갈래마다 실제로 부르는 바깥 일감이 다르므로 한 값으로 뭉치지 않는다.
// 글 파생은 주 갈래 결과를 다시 엮는 것뿐이라 바깥 호출이 없어 0원이다.
// 카드뉴스는 장면 나누기와 장별 문안, 영상은 장면과 대사까지 만들어야 해서 더 든다.
// 배포 환경에서 env 로 덮어쓸 수 있게 두되, 값이 없어도 언제나 견적이 나와야 한다.
// 견적이 안 나오는 상태에서 생성을 시작하면 그것이 곧 조용한 과금이다.
const DEFAULT_UNIT_MINOR: Record<DerivationKind, number> = {
  text: 0,
  card: 300,
  video: 1200,
};

function envNonNegativeInt(name: string): number | null {
  const raw = process.env[name];
  if (!raw || !/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function derivationCurrency(): string {
  return process.env.STUDIO_COST_CURRENCY || "KRW";
}

export function derivationUnitMinor(kind: DerivationKind): number {
  return envNonNegativeInt(`STUDIO_DERIVATION_COST_${kind.toUpperCase()}_MINOR`) ?? DEFAULT_UNIT_MINOR[kind];
}

export function derivationQuote(kinds: readonly DerivationKind[]): DerivationQuote {
  const lines = kinds.map((kind) => ({ kind, unitMinor: derivationUnitMinor(kind) }));
  return {
    currency: derivationCurrency(),
    totalMinor: lines.reduce((sum, line) => sum + line.unitMinor, 0),
    lines,
    assumptions: [
      "고르신 주 갈래 결과를 재료로 옮겨 만드는 값입니다",
      "무료 재생성 몫과 별개로 셉니다",
      "만들지 못한 갈래는 값을 매기지 않습니다",
    ],
  };
}

export function parseDerivationKinds(value: unknown): DerivationKind[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new StudioApiError({
      status: 422,
      code: "DERIVATION_KINDS_REQUIRED",
      message: "같이 만들 갈래를 하나 이상 골라야 합니다",
    });
  }
  const kinds: DerivationKind[] = [];
  for (const entry of value) {
    if (!DERIVATION_KINDS.includes(entry as DerivationKind)) {
      throw new StudioApiError({
        status: 422,
        code: "DERIVATION_KIND_UNKNOWN",
        message: "만들 수 있는 갈래는 글, 카드뉴스, 영상입니다",
        fieldErrors: [{ field: "kinds", reason: `${String(entry)} 는 만들 수 없는 갈래입니다` }],
      });
    }
    const kind = entry as DerivationKind;
    if (!kinds.includes(kind)) kinds.push(kind);
  }
  return kinds;
}

// 회원이 확정 화면에서 본 금액과 서버가 지금 매기는 금액이 같을 때만 시작한다.
// 다르면 새 견적을 돌려주고 멈춘다. 예상 못 한 돈이 나가는 경로를 여기서 끊는다.
export function assertAcknowledgedCost(quote: DerivationQuote, value: unknown): void {
  const input = value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
  const currency = typeof input?.currency === "string" ? input.currency : null;
  const totalMinor = Number.isSafeInteger(input?.total_minor) ? Number(input?.total_minor) : null;
  if (currency === null || totalMinor === null) {
    throw new StudioApiError({
      status: 422,
      code: "DERIVATION_COST_ACKNOWLEDGEMENT_REQUIRED",
      message: "확정 전에 보신 값을 함께 보내야 파생을 시작합니다",
      details: { quote: publicQuote(quote) },
    });
  }
  if (currency !== quote.currency || totalMinor !== quote.totalMinor) {
    throw new StudioApiError({
      status: 409,
      code: "DERIVATION_QUOTE_CHANGED",
      message: "값이 바뀌어 파생을 시작하지 않았습니다. 바뀐 값을 확인해 주세요",
      details: { quote: publicQuote(quote) },
    });
  }
}

export function publicQuote(quote: DerivationQuote) {
  return {
    currency: quote.currency,
    total_minor: quote.totalMinor,
    lines: quote.lines.map((line) => ({
      kind: line.kind,
      label: DERIVATION_KIND_LABELS[line.kind],
      unit_minor: line.unitMinor,
    })),
    assumptions: quote.assumptions,
  };
}

export class DerivationBuildError extends Error {}

function outlineOf(candidate: GenerationCandidate): string[] {
  return candidate.format.outline.filter((entry) => entry.trim().length > 0);
}

// 갈래를 옮길 때 문장을 그대로 복사하지 않는다. 글은 이어지는 본문, 카드뉴스는 장별 한 문장,
// 영상은 장면 제목과 대사다. 마지막 칸은 갈래마다 마무리 모양으로 바꾼다.
export function buildDerivationPayload(candidate: GenerationCandidate, kind: DerivationKind): DerivationPayload {
  const outline = outlineOf(candidate);
  if (outline.length < 2) {
    throw new DerivationBuildError("옮길 뼈대가 두 칸이 안 되어 이 갈래로는 만들지 못했습니다");
  }
  if (kind === "text") {
    const body = [
      candidate.title,
      "",
      candidate.rationale,
      "",
      ...outline.map((entry, index) => `${index + 1}. ${entry}`),
    ].join("\n");
    return { kind, body };
  }
  if (kind === "card") {
    const slides = [
      { id: crypto.randomUUID(), order: 0, text: candidate.title, image_url: null as null },
      ...outline.map((entry, index) => ({
        id: crypto.randomUUID(),
        order: index + 1,
        text: entry,
        image_url: null as null,
      })),
      {
        id: crypto.randomUUID(),
        order: outline.length + 1,
        text: "여기까지 보셨다면 다음 장에서 이어 보세요",
        image_url: null as null,
      },
    ];
    return { kind, slides };
  }
  const scenes = outline.map((entry, index) => ({
    id: crypto.randomUUID(),
    order: index,
    title: `${index + 1}번 장면`,
    lines: [
      { id: crypto.randomUUID(), order: 0, text: entry, visible: true as const, deleted_at: null },
      {
        id: crypto.randomUUID(),
        order: 1,
        text: index === outline.length - 1 ? "여기까지 보시고 한 가지만 해 보세요" : "이어서 보겠습니다",
        visible: true as const,
        deleted_at: null,
      },
    ],
  }));
  // 아직 렌더한 영상 파일이 없다. 없는 것을 있는 것처럼 주소로 꾸미지 않고
  // 아직 만들지 않았다는 표시를 그대로 남긴다.
  return { kind, asset_url: "pending:render", scenes };
}

export function derivationSummary(candidate: GenerationCandidate, kind: DerivationKind): string {
  return `${candidate.title} (${DERIVATION_KIND_LABELS[kind]}으로 옮김)`;
}

export function batchStatus(items: readonly DerivationItem[]): DerivationBatch["status"] {
  const succeeded = items.filter((item) => item.status === "succeeded").length;
  if (succeeded === 0) return "failed";
  return succeeded === items.length ? "succeeded" : "partially_succeeded";
}

export function publicBatch(batch: DerivationBatch) {
  return {
    batch_id: batch.batchId,
    job_id: batch.jobId,
    candidate_id: batch.candidateId,
    status: batch.status,
    cost: {
      currency: batch.currency,
      quoted_minor: batch.quotedMinor,
      charged_minor: batch.chargedMinor,
      free_regeneration_consumed: false,
    },
    items: batch.items.map((item) => ({
      kind: item.kind,
      label: DERIVATION_KIND_LABELS[item.kind],
      status: item.status,
      draft_id: item.draftId,
      handoff_id: item.handoffId,
      summary: item.summary,
      charged_minor: item.chargedMinor,
      failure_reason: item.failureReason,
    })),
    created_at: batch.createdAt,
    discarded_at: batch.discardedAt,
  };
}

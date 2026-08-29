import crypto from "node:crypto";
import type { GenerationRequest, RequestedTarget } from "./contracts";
import { StudioApiError } from "./errors";

export type CostEstimate = {
  status: "quoted" | "unavailable";
  currency: string;
  minMinor: number | null;
  maxMinor: number | null;
  assumptions: string[];
};

export type GenerationCandidate = {
  candidateId: string;
  ordinal: 1 | 2 | 3;
  label: "A" | "B" | "C";
  angle: "problem_first" | "proof_first" | "process_first";
  title: string;
  rationale: string;
  format: {
    contentBranch: "text_image" | "video";
    previewKind: "structured_storyboard";
    quality: "draft";
    outline: string[];
  };
  estimatedCost: CostEstimate;
  channels: RequestedTarget[];
};

export type GenerationJob = {
  jobId: string;
  memberId: string;
  workspaceId: string;
  status: "succeeded";
  candidates: GenerationCandidate[];
  layerRevisions: Record<"s0" | "s1" | "u2" | "u3" | "x4" | "l5", number>;
  platformSpecReceipt: null | { reference: string; version: string; digest: string };
  timeZone: string;
  request: GenerationRequest;
  createdAt: string;
};

export type GenerationResponse = Omit<GenerationJob, "memberId" | "request" | "timeZone"> & {
  regeneration: {
    freeRetriesPerDay: 1;
    scope: "member";
    timeZone: string;
  };
};

export type IdempotencyRecord = {
  requestHash: string;
  response: GenerationResponse;
};

export type PersistCreationInput = {
  job: GenerationJob;
  operation: "generation.create";
  idempotencyKey: string;
  requestHash: string;
  response: GenerationResponse;
};

export type PersistedCreation = IdempotencyRecord & { created: boolean };

// 무료 재생성이 나가지 않은 사유를 호출부가 구분할 수 있어야 한다.
// quota_exhausted 는 오늘 몫을 이미 쓴 것이고, candidates_not_rejected 는 후보 셋을
// 다 거절하지 않은 것이다(요구 대장 R27). 둘을 뭉뚱그리면 안내가 거짓말이 된다.
export type FreeRegenerationRefusal = "quota_exhausted" | "candidates_not_rejected";
export type PersistedFreeRegeneration =
  | { consumed: true; response: GenerationResponse; refusal?: undefined; pendingCandidateIds?: undefined }
  | { consumed: false; response: null; refusal: FreeRegenerationRefusal; pendingCandidateIds?: string[] };

export type PersistFreeRegenerationInput = {
  originalJobId: string;
  replacement: GenerationJob;
  localDate: string;
  operation: "generation.regenerate";
  idempotencyKey: string;
  requestHash: string;
  response: GenerationResponse;
  // 이 작업의 후보 전체. 저장소는 몫 차감과 같은 transaction 안에서
  // 이 후보들이 모두 거절 장부에 있는지 확인한다.
  requiredRejections: readonly string[];
};

export type RecordRejectionInput = {
  workspaceId: string;
  memberId: string;
  jobId: string;
  candidateId: string;
};

export interface GenerationRepository {
  persistCreation(input: PersistCreationInput): Promise<PersistedCreation>;
  findJob(memberId: string, jobId: string, allowedWorkspaceIds: readonly string[]): Promise<GenerationJob | null>;
  recordCandidateRejection(input: RecordRejectionInput): Promise<{ rejectedCandidateIds: string[] }>;
  persistFreeRegeneration(input: PersistFreeRegenerationInput): Promise<PersistedFreeRegeneration>;
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hashRequest(value: unknown): string {
  return crypto.createHash("sha256").update(stableJson(value)).digest("hex");
}

function dateInZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function quotaDate(now: Date): string {
  return dateInZone(now, "UTC");
}

// 몫 키가 협정시 날짜이므로 복구 안내도 협정시 자정이어야 한다.
// 원본 작업의 시간대 자정을 알리면 서울 23:30 사용자에게 "00:00 복구"라고 말하고
// 실제로는 09:00 까지 잠기는 거짓 안내가 된다.
// 몫 키를 클라이언트 시간대로 만들지 않는 이유는 시간대를 바꿔가며 하루 몫을
// 두세 번 받는 우회를 막기 위해서다(scripts/verify-free-quota-timezone-attack.mjs).
function nextQuotaBoundary(now: Date): string {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return new Date(next).toISOString();
}

function envPositiveInt(name: string): number | null {
  const raw = process.env[name];
  if (!raw || !/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function configuredCostEstimate(): CostEstimate {
  const minMinor = envPositiveInt("STUDIO_PREVIEW_COST_MIN_MINOR");
  const maxMinor = envPositiveInt("STUDIO_PREVIEW_COST_MAX_MINOR");
  if (minMinor === null || maxMinor === null || minMinor > maxMinor) {
    return {
      status: "unavailable",
      currency: process.env.STUDIO_COST_CURRENCY || "KRW",
      minMinor: null,
      maxMinor: null,
      assumptions: ["비용 견적 어댑터가 설정되지 않았습니다"],
    };
  }
  return {
    status: "quoted",
    currency: process.env.STUDIO_COST_CURRENCY || "KRW",
    minMinor,
    maxMinor,
    assumptions: ["후보 한 장의 draft 생성 기준", "외부 공급자 최종 응답 전 예상값"],
  };
}

function requestedTargets(request: GenerationRequest): RequestedTarget[] {
  return request.platformSpec?.targets ?? [{
    targetId: "studio_original",
    format: request.learningContext.u3.contentBranch === "video" ? "source_video" : "source_asset",
    aspectRatio: null,
    maxDurationSeconds: null,
  }];
}

function buildCandidates(request: GenerationRequest): GenerationCandidate[] {
  const { topic } = request.learningContext.r6;
  const { audience, purpose, contentBranch } = request.learningContext.u3;
  const cost = configuredCostEstimate();
  const channels = requestedTargets(request);
  const specs = [
    {
      label: "A" as const,
      ordinal: 1 as const,
      angle: "problem_first" as const,
      title: `${topic}: 문제부터 여는 안`,
      rationale: `${audience}가 겪는 문제를 첫 장면에 놓고 목표인 "${purpose}"를 빠르게 이해시키는 구성입니다.`,
      outline: ["사용자가 겪는 문제", "문제가 생기는 이유", "바로 적용할 다음 행동"],
    },
    {
      label: "B" as const,
      ordinal: 2 as const,
      angle: "proof_first" as const,
      title: `${topic}: 증거부터 보여주는 안`,
      rationale: `결론이나 관찰 가능한 증거를 먼저 보여 준 뒤 ${audience}에게 필요한 맥락을 붙이는 구성입니다.`,
      outline: ["확인 가능한 결과", "결과를 만든 핵심 원리", "같이 적용할 조건"],
    },
    {
      label: "C" as const,
      ordinal: 3 as const,
      angle: "process_first" as const,
      title: `${topic}: 과정을 따라가는 안`,
      rationale: `"${purpose}"에 도달하는 과정을 순서대로 보여 주어 처음 보는 사람도 따라오게 하는 구성입니다.`,
      outline: ["시작 조건", "핵심 과정", "완료 뒤 확인할 것"],
    },
  ];
  return specs.map((spec) => ({
    candidateId: crypto.randomUUID(),
    ordinal: spec.ordinal,
    label: spec.label,
    angle: spec.angle,
    title: spec.title,
    rationale: spec.rationale,
    format: { contentBranch, previewKind: "structured_storyboard", quality: "draft", outline: spec.outline },
    estimatedCost: cost,
    channels,
  }));
}

function publicResponse(job: GenerationJob): GenerationResponse {
  const { memberId: _memberId, request: _request, timeZone, ...visible } = job;
  return {
    ...visible,
    regeneration: { freeRetriesPerDay: 1, scope: "member", timeZone },
  };
}

function buildJob(memberId: string, request: GenerationRequest, now: Date): GenerationJob {
  const context = request.learningContext;
  return {
    jobId: crypto.randomUUID(),
    memberId,
    workspaceId: request.workspaceId,
    status: "succeeded",
    candidates: buildCandidates(request),
    layerRevisions: {
      s0: context.s0.revision,
      s1: context.s1.revision,
      u2: context.u2.revision,
      u3: context.u3.revision,
      x4: context.x4.revision,
      l5: context.l5.revision,
    },
    platformSpecReceipt: request.platformSpec ? {
      reference: request.platformSpec.reference,
      version: request.platformSpec.version,
      digest: request.platformSpec.digest,
    } : null,
    timeZone: context.u2.timeZone,
    request: {
      ...request,
      platformSpec: request.platformSpec ? { ...request.platformSpec, body: {} } : null,
    },
    createdAt: now.toISOString(),
  };
}

function candidatesNotRejected(pending: readonly string[]): StudioApiError {
  return new StudioApiError({
    status: 409,
    code: "CANDIDATES_NOT_REJECTED",
    message: "후보 세 장을 모두 거절해야 무료 재생성을 쓸 수 있습니다",
    details: { pending_candidate_ids: [...pending] },
  });
}

function paidRegenerationApprovalRequired(now: Date): StudioApiError {
  return new StudioApiError({
    status: 409,
    code: "PAID_REGENERATION_APPROVAL_REQUIRED",
    message: "오늘의 무료 재생성을 이미 사용했습니다",
    details: {
      free_retry_resets_at: nextQuotaBoundary(now),
      paid_retry_quote: envPositiveInt("STUDIO_PAID_REGENERATION_MINOR") === null ? null : {
        currency: process.env.STUDIO_COST_CURRENCY || "KRW",
        amount_minor: envPositiveInt("STUDIO_PAID_REGENERATION_MINOR"),
      },
    },
  });
}

export class GenerationService {
  constructor(private readonly repository: GenerationRepository) {}

  async create(memberId: string, idempotencyKey: string, request: GenerationRequest, now = new Date()): Promise<GenerationResponse> {
    if (!idempotencyKey || idempotencyKey.length > 255) {
      throw new StudioApiError({
        status: 400,
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Idempotency-Key 머리말이 필요합니다",
      });
    }
    const requestHash = hashRequest(request);
    const job = buildJob(memberId, request, now);
    const response = publicResponse(job);
    const persisted = await this.repository.persistCreation({
      job,
      operation: "generation.create",
      idempotencyKey,
      requestHash,
      response,
    });
    if (persisted.requestHash !== requestHash) {
      throw new StudioApiError({
        status: 409,
        code: "IDEMPOTENCY_CONFLICT",
        message: "같은 Idempotency-Key에 다른 요청 본문을 보낼 수 없습니다",
      });
    }
    return persisted.response;
  }

  async get(memberId: string, jobId: string, allowedWorkspaceIds: readonly string[]): Promise<GenerationResponse> {
    const job = await this.repository.findJob(memberId, jobId, allowedWorkspaceIds);
    if (!job) {
      throw new StudioApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "생성 작업을 찾을 수 없습니다" });
    }
    return publicResponse(job);
  }

  // 후보 한 장 거절을 서버 장부에 남긴다. 무료 재생성 판정의 유일한 근거다.
  async rejectCandidate(
    memberId: string,
    jobId: string,
    candidateId: string,
    allowedWorkspaceIds: readonly string[],
  ): Promise<{ jobId: string; rejectedCandidateIds: string[]; pendingCandidateIds: string[]; allRejected: boolean }> {
    const job = await this.repository.findJob(memberId, jobId, allowedWorkspaceIds);
    if (!job) {
      throw new StudioApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "생성 작업을 찾을 수 없습니다" });
    }
    if (!job.candidates.some((candidate) => candidate.candidateId === candidateId)) {
      throw new StudioApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "이 작업의 후보가 아닙니다" });
    }
    const { rejectedCandidateIds } = await this.repository.recordCandidateRejection({
      workspaceId: job.workspaceId,
      memberId,
      jobId,
      candidateId,
    });
    const rejected = new Set(rejectedCandidateIds);
    const pendingCandidateIds = job.candidates
      .map((candidate) => candidate.candidateId)
      .filter((id) => !rejected.has(id));
    return {
      jobId,
      rejectedCandidateIds,
      pendingCandidateIds,
      allRejected: pendingCandidateIds.length === 0,
    };
  }

  async regenerate(memberId: string, jobId: string, allowedWorkspaceIds: readonly string[], now = new Date()): Promise<{
    freeRetryConsumed: true;
    replacement: GenerationResponse;
    freeRetryResetsAt: string;
  }> {
    const original = await this.repository.findJob(memberId, jobId, allowedWorkspaceIds);
    if (!original) {
      throw new StudioApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "생성 작업을 찾을 수 없습니다" });
    }
    const requiredRejections = original.candidates.map((candidate) => candidate.candidateId);
    const localDate = quotaDate(now);
    const idempotencyKey = `free-regeneration:${jobId}:${localDate}`;
    const replacementJob = buildJob(memberId, original.request, now);
    const replacement = publicResponse(replacementJob);
    const persisted = await this.repository.persistFreeRegeneration({
      originalJobId: jobId,
      replacement: replacementJob,
      localDate,
      operation: "generation.regenerate",
      idempotencyKey,
      requestHash: hashRequest(original.request),
      response: replacement,
      requiredRejections,
    });
    if (!persisted.consumed) {
      if (persisted.refusal === "candidates_not_rejected") {
        throw candidatesNotRejected(persisted.pendingCandidateIds ?? requiredRejections);
      }
      throw paidRegenerationApprovalRequired(now);
    }
    return {
      freeRetryConsumed: true,
      replacement: persisted.response,
      freeRetryResetsAt: nextQuotaBoundary(now),
    };
  }
}

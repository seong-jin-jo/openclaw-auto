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

type IdempotencyRecord = {
  requestHash: string;
  response: GenerationResponse;
};

type FreeRetryUse = {
  originalJobId: string;
  replacementJobId: string;
};

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

function nextLocalDateBoundary(now: Date, timeZone: string): string {
  const current = dateInZone(now, timeZone);
  let low = now.getTime();
  let high = low + 36 * 60 * 60 * 1000;
  while (high - low > 1000) {
    const middle = Math.floor((low + high) / 2);
    if (dateInZone(new Date(middle), timeZone) === current) low = middle;
    else high = middle;
  }
  return new Date(Math.floor(high / 1000) * 1000).toISOString();
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

export class InMemoryGenerationService {
  private readonly jobs = new Map<string, GenerationJob>();
  private readonly idempotency = new Map<string, IdempotencyRecord>();
  private readonly freeRetryUses = new Map<string, FreeRetryUse>();

  create(memberId: string, idempotencyKey: string, request: GenerationRequest, now = new Date()): GenerationResponse {
    if (!idempotencyKey || idempotencyKey.length > 255) {
      throw new StudioApiError({
        status: 400,
        code: "IDEMPOTENCY_KEY_REQUIRED",
        message: "Idempotency-Key 머리말이 필요합니다",
      });
    }
    const scope = `${memberId}:generation.create:${idempotencyKey}`;
    const requestHash = hashRequest(request);
    const existing = this.idempotency.get(scope);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new StudioApiError({
          status: 409,
          code: "IDEMPOTENCY_CONFLICT",
          message: "같은 Idempotency-Key에 다른 요청 본문을 보낼 수 없습니다",
        });
      }
      return existing.response;
    }

    const context = request.learningContext;
    const job: GenerationJob = {
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
    const response = publicResponse(job);
    this.jobs.set(job.jobId, job);
    this.idempotency.set(scope, { requestHash, response });
    return response;
  }

  get(memberId: string, jobId: string): GenerationResponse {
    const job = this.jobs.get(jobId);
    if (!job || job.memberId !== memberId) {
      throw new StudioApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "생성 작업을 찾을 수 없습니다" });
    }
    return publicResponse(job);
  }

  regenerate(memberId: string, jobId: string, now = new Date()): {
    freeRetryConsumed: true;
    replacement: GenerationResponse;
    freeRetryResetsAt: string;
  } {
    const original = this.jobs.get(jobId);
    if (!original || original.memberId !== memberId) {
      throw new StudioApiError({ status: 404, code: "RESOURCE_NOT_FOUND", message: "생성 작업을 찾을 수 없습니다" });
    }
    const localDate = dateInZone(now, original.timeZone);
    const useKey = `${memberId}:${localDate}:all_rejected`;
    if (this.freeRetryUses.has(useKey)) {
      throw new StudioApiError({
        status: 409,
        code: "PAID_REGENERATION_APPROVAL_REQUIRED",
        message: "오늘의 무료 재생성을 이미 사용했습니다",
        details: {
          free_retry_resets_at: nextLocalDateBoundary(now, original.timeZone),
          paid_retry_quote: envPositiveInt("STUDIO_PAID_REGENERATION_MINOR") === null ? null : {
            currency: process.env.STUDIO_COST_CURRENCY || "KRW",
            amount_minor: envPositiveInt("STUDIO_PAID_REGENERATION_MINOR"),
          },
        },
      });
    }

    const replacement = this.create(
      memberId,
      `free-regeneration:${jobId}:${localDate}`,
      original.request,
      now,
    );
    this.freeRetryUses.set(useKey, { originalJobId: jobId, replacementJobId: replacement.jobId });
    return {
      freeRetryConsumed: true,
      replacement,
      freeRetryResetsAt: nextLocalDateBoundary(now, original.timeZone),
    };
  }
}

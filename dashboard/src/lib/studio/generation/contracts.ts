import { StudioApiError, type StudioFieldError } from "./errors";

export const STUDIO_GENERATION_CONTRACT_VERSION = "1.0";

export type LayerRevision = {
  revision: number;
};

export type GenerationLearningContext = {
  s0: LayerRevision & {
    safetyRules: string[];
  };
  s1: LayerRevision & {
    marketContext: string;
  };
  u2: LayerRevision & {
    locale: string;
    timeZone: string;
    accessibilityRequirements: string[];
  };
  u3: LayerRevision & {
    purpose: string;
    audience: string;
    contentBranch: "text_image" | "video";
    workspaceFacts: string[];
    workspaceFactsConfirmedEmpty: boolean;
    forbiddenPhrases: string[];
    forbiddenPhrasesConfirmedEmpty: boolean;
    materialRightsConfirmed: boolean;
    tone: string | null;
  };
  x4: LayerRevision & {
    skillVersionId: string;
    structureRules: string[];
  };
  l5: LayerRevision & {
    acceptedRules: string[];
  };
  r6: {
    topic: string;
    outputLanguage: string;
    adjustments: Record<string, unknown>;
  };
};

export type RequestedTarget = {
  targetId: string;
  format: string;
  aspectRatio: string | null;
  maxDurationSeconds: number | null;
};

export type PlatformSpec = {
  reference: string;
  version: string;
  digest: string;
  targets: RequestedTarget[];
  body: Record<string, unknown>;
};

export type GenerationRequest = {
  workspaceId: string;
  learningContext: GenerationLearningContext;
  platformSpec: PlatformSpec | null;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const LOCALE_PATTERN = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function textList(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const normalized = value.map(text);
  return normalized.every((item): item is string => item !== null) ? normalized : null;
}

function revision(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : null;
}

function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function addFieldError(errors: StudioFieldError[], field: string, reason: string): void {
  errors.push({ field, reason });
}

function parseRequiredLayer(
  layers: Record<string, unknown>,
  code: "s0" | "s1" | "u2" | "u3" | "x4" | "r6",
  errors: StudioFieldError[],
): Record<string, unknown> {
  const layer = record(layers[code]);
  if (!layer) addFieldError(errors, `learning_context.${code}`, "필수 층입니다");
  return layer ?? {};
}

function parsePlatformSpec(value: unknown, errors: StudioFieldError[]): PlatformSpec | null {
  if (value === undefined || value === null) return null;
  const spec = record(value);
  if (!spec) {
    addFieldError(errors, "platform_spec", "객체여야 합니다");
    return null;
  }
  const reference = text(spec.reference);
  const version = text(spec.version);
  const digest = text(spec.digest);
  if (!reference) addFieldError(errors, "platform_spec.reference", "필수 문자열입니다");
  if (!version) addFieldError(errors, "platform_spec.version", "필수 문자열입니다");
  if (!digest || !SHA256_PATTERN.test(digest)) {
    addFieldError(errors, "platform_spec.digest", "SHA-256 64자리 16진수여야 합니다");
  }
  const body = record(spec.body);
  if (!body) addFieldError(errors, "platform_spec.body", "요청 시점에만 쓰는 규격 객체가 필요합니다");
  const targetsRaw = Array.isArray(spec.targets) ? spec.targets : null;
  if (!targetsRaw || targetsRaw.length === 0) {
    addFieldError(errors, "platform_spec.targets", "대상 규격이 하나 이상 필요합니다");
  }
  const targets: RequestedTarget[] = [];
  for (const [index, rawTarget] of (targetsRaw ?? []).entries()) {
    const target = record(rawTarget);
    const targetId = text(target?.target_id);
    const format = text(target?.format);
    const aspectRatio = target?.aspect_ratio === null || target?.aspect_ratio === undefined
      ? null
      : text(target.aspect_ratio);
    const maxDurationSeconds = target?.max_duration_seconds === null || target?.max_duration_seconds === undefined
      ? null
      : positiveNumber(target.max_duration_seconds);
    if (!targetId) addFieldError(errors, `platform_spec.targets.${index}.target_id`, "필수 문자열입니다");
    if (!format) addFieldError(errors, `platform_spec.targets.${index}.format`, "필수 문자열입니다");
    if (target?.aspect_ratio !== null && target?.aspect_ratio !== undefined && !aspectRatio) {
      addFieldError(errors, `platform_spec.targets.${index}.aspect_ratio`, "문자열 또는 null이어야 합니다");
    }
    if (target?.max_duration_seconds !== null && target?.max_duration_seconds !== undefined && !maxDurationSeconds) {
      addFieldError(errors, `platform_spec.targets.${index}.max_duration_seconds`, "0보다 큰 수 또는 null이어야 합니다");
    }
    if (targetId && format) targets.push({ targetId, format, aspectRatio, maxDurationSeconds });
  }
  return reference && version && digest && body && targets.length > 0
    ? { reference, version, digest, targets, body }
    : null;
}

export function parseGenerationRequest(value: unknown): GenerationRequest {
  const input = record(value);
  if (!input) {
    throw new StudioApiError({
      status: 400,
      code: "INVALID_JSON_BODY",
      message: "JSON 객체 본문이 필요합니다",
    });
  }

  for (const forbidden of ["credential", "credentials", "channel_account_id", "channel_accounts"]) {
    if (forbidden in input) {
      throw new StudioApiError({
        status: 422,
        code: "PLATFORM_CREDENTIAL_NOT_ALLOWED",
        message: "Studio 생성 요청은 채널 자격증명을 받지 않습니다",
        fieldErrors: [{ field: forbidden, reason: "openclaw 소유 값입니다" }],
      });
    }
  }

  const errors: StudioFieldError[] = [];
  const workspaceId = text(input.workspace_id);
  if (!workspaceId || !UUID_PATTERN.test(workspaceId)) {
    addFieldError(errors, "workspace_id", "UUID 형식의 필수 값입니다");
  }

  const layers = record(input.learning_context);
  if (!layers) addFieldError(errors, "learning_context", "일곱 층 조립 입력이 필요합니다");
  const source = layers ?? {};
  const s0 = parseRequiredLayer(source, "s0", errors);
  const s1 = parseRequiredLayer(source, "s1", errors);
  const u2 = parseRequiredLayer(source, "u2", errors);
  const u3 = parseRequiredLayer(source, "u3", errors);
  const x4 = parseRequiredLayer(source, "x4", errors);
  const r6 = parseRequiredLayer(source, "r6", errors);
  const l5 = record(source.l5) ?? { revision: 0, accepted_rules: [] };

  const safetyRules = textList(s0.safety_rules);
  const marketContext = text(s1.market_context);
  const locale = text(u2.locale);
  const timeZone = text(u2.time_zone);
  const accessibilityRequirements = u2.accessibility_requirements === undefined
    ? []
    : textList(u2.accessibility_requirements);
  const purpose = text(u3.purpose);
  const audience = text(u3.audience);
  const contentBranch = u3.content_branch === "text_image" || u3.content_branch === "video"
    ? u3.content_branch
    : null;
  const workspaceFacts = textList(u3.workspace_facts);
  const forbiddenPhrases = textList(u3.forbidden_phrases);
  const structureRules = textList(x4.structure_rules);
  const acceptedRules = textList(l5.accepted_rules);
  const topic = text(r6.topic);
  const outputLanguage = text(r6.output_language);
  const adjustments = r6.adjustments === undefined ? {} : record(r6.adjustments);

  for (const [code, layer] of [["s0", s0], ["s1", s1], ["u2", u2], ["u3", u3], ["x4", x4], ["l5", l5]] as const) {
    if (revision(layer.revision) === null) addFieldError(errors, `learning_context.${code}.revision`, "0 이상의 정수여야 합니다");
  }
  if (!safetyRules || safetyRules.length === 0) addFieldError(errors, "learning_context.s0.safety_rules", "하나 이상 필요합니다");
  if (!marketContext) addFieldError(errors, "learning_context.s1.market_context", "필수 문자열입니다");
  if (!locale || !LOCALE_PATTERN.test(locale)) addFieldError(errors, "learning_context.u2.locale", "ko 또는 ko-KR 같은 형식이어야 합니다");
  if (!timeZone || !isTimeZone(timeZone)) addFieldError(errors, "learning_context.u2.time_zone", "유효한 IANA 시간대가 필요합니다");
  if (!accessibilityRequirements) addFieldError(errors, "learning_context.u2.accessibility_requirements", "문자열 배열이어야 합니다");
  if (!purpose) addFieldError(errors, "learning_context.u3.purpose", "필수 문자열입니다");
  if (!audience) addFieldError(errors, "learning_context.u3.audience", "필수 문자열입니다");
  if (!contentBranch) addFieldError(errors, "learning_context.u3.content_branch", "text_image 또는 video여야 합니다");
  if (!workspaceFacts) addFieldError(errors, "learning_context.u3.workspace_facts", "문자열 배열이어야 합니다");
  if (workspaceFacts?.length === 0 && u3.workspace_facts_confirmed_empty !== true) {
    addFieldError(errors, "learning_context.u3.workspace_facts_confirmed_empty", "사실이 없으면 true로 확인해야 합니다");
  }
  if (!forbiddenPhrases) addFieldError(errors, "learning_context.u3.forbidden_phrases", "문자열 배열이어야 합니다");
  if (forbiddenPhrases?.length === 0 && u3.forbidden_phrases_confirmed_empty !== true) {
    addFieldError(errors, "learning_context.u3.forbidden_phrases_confirmed_empty", "금지 표현이 없으면 true로 확인해야 합니다");
  }
  if (u3.material_rights_confirmed !== true) {
    addFieldError(errors, "learning_context.u3.material_rights_confirmed", "소재 권리 확인이 필요합니다");
  }
  const skillVersionId = text(x4.skill_version_id);
  if (!skillVersionId || !UUID_PATTERN.test(skillVersionId)) addFieldError(errors, "learning_context.x4.skill_version_id", "UUID 형식이 필요합니다");
  if (!structureRules || structureRules.length === 0) addFieldError(errors, "learning_context.x4.structure_rules", "하나 이상 필요합니다");
  if (!acceptedRules) addFieldError(errors, "learning_context.l5.accepted_rules", "문자열 배열이어야 합니다");
  if (!topic) addFieldError(errors, "learning_context.r6.topic", "이번 생성 주제가 필요합니다");
  if (!outputLanguage || !LOCALE_PATTERN.test(outputLanguage)) addFieldError(errors, "learning_context.r6.output_language", "ko 또는 ko-KR 같은 형식이어야 합니다");
  if (!adjustments) addFieldError(errors, "learning_context.r6.adjustments", "객체여야 합니다");

  const platformSpec = parsePlatformSpec(input.platform_spec, errors);
  if (errors.length > 0) {
    const rightsError = errors.some((error) => error.field.endsWith("material_rights_confirmed"));
    throw new StudioApiError({
      status: 422,
      code: rightsError ? "OUTPUT_RIGHTS_BLOCKED" : "LEARNING_CONTEXT_INCOMPLETE",
      message: rightsError ? "소재 권리가 확인되지 않아 생성을 시작할 수 없습니다" : "생성에 필요한 학습 정보가 덜 채워졌습니다",
      fieldErrors: errors,
    });
  }

  return {
    workspaceId: workspaceId!,
    learningContext: {
      s0: { revision: revision(s0.revision)!, safetyRules: safetyRules! },
      s1: { revision: revision(s1.revision)!, marketContext: marketContext! },
      u2: {
        revision: revision(u2.revision)!,
        locale: locale!,
        timeZone: timeZone!,
        accessibilityRequirements: accessibilityRequirements!,
      },
      u3: {
        revision: revision(u3.revision)!,
        purpose: purpose!,
        audience: audience!,
        contentBranch: contentBranch!,
        workspaceFacts: workspaceFacts!,
        workspaceFactsConfirmedEmpty: u3.workspace_facts_confirmed_empty === true,
        forbiddenPhrases: forbiddenPhrases!,
        forbiddenPhrasesConfirmedEmpty: u3.forbidden_phrases_confirmed_empty === true,
        materialRightsConfirmed: true,
        tone: u3.tone === undefined || u3.tone === null ? null : text(u3.tone),
      },
      x4: {
        revision: revision(x4.revision)!,
        skillVersionId: skillVersionId!,
        structureRules: structureRules!,
      },
      l5: { revision: revision(l5.revision)!, acceptedRules: acceptedRules! },
      r6: { topic: topic!, outputLanguage: outputLanguage!, adjustments: adjustments! },
    },
    platformSpec,
  };
}

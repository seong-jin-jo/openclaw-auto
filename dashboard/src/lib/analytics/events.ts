import { sendGaHit } from "./ga";

// Closed, typed event allowlist. Only these 7 events, only these params, may ever reach GA4.
// Forbidden (never send, even indirectly): email, user id, tenant id, auth tokens, prompt/content
// text, channel credentials, URLs with query strings/tokens, raw error messages/stack traces.
//
// 2026-07-14 Codex review hardening: every param value is now a *closed enum*, not `string`.
// A free-form `string` type only constrains the compiler — at runtime (or via `as any`) any
// value up to MAX_VALUE_LENGTH could reach sendGaHit. Enums + a runtime membership check close
// that gap: an unrecognized value drops the entire event rather than being partially redacted.

export const CTA_IDS = ["generate_ideas"] as const;
export type CtaId = (typeof CTA_IDS)[number];

export const AUTH_METHODS = ["email", "oauth"] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

// Matches the content-generation surfaces this dashboard actually has (studio text/image/video,
// card_generator). Adding a new kind requires a code change here — that's the point of "closed".
export const CONTENT_KINDS = ["text", "image", "video", "card"] as const;
export type ContentKind = (typeof CONTENT_KINDS)[number];

export const ANALYTICS_CHANNELS = [
  "threads", "x", "instagram", "facebook", "bluesky", "linkedin",
  "tiktok", "youtube", "telegram", "discord", "slack", "pinterest",
  "shorts", "reels",
] as const;
export type AnalyticsChannel = (typeof ANALYTICS_CHANNELS)[number];

// Finite page-path template allowlist mirrored from dashboard/src/app/**/page.tsx routes
// (contract-tested against the filesystem in tests/analytics/deploy-wiring.contract.test.ts
// equivalents — see page-path-allowlist.contract.test.ts). Dynamic segments collapse to a
// template (":channel"), never the raw value — the raw route param is never forwarded, even
// though channel names themselves aren't PII, per Codex review 2026-07-14 #3.
export const KNOWN_PAGE_PATHS = [
  "/", "/blog", "/blog-performance", "/calendar", "/channels/:channel",
  "/google-analytics", "/google-trends", "/images", "/inbox", "/keyword-planner",
  "/login", "/naver-trends", "/operator", "/operator/customers", "/performance",
  "/search-advisor", "/search-console", "/services", "/settings", "/signup",
  "/studio", "/videos",
] as const;
export type KnownPagePath = (typeof KNOWN_PAGE_PATHS)[number] | "/other";

/**
 * Normalizes an arbitrary pathname (which may be attacker/user-controlled — window.location,
 * a malicious deep link, a future dynamic route we forgot to allowlist) to a finite known
 * template. Strips query string/hash first (may carry tokens/codes). Any path not in the
 * static allowlist and not matching the one known dynamic template maps to "/other" — never
 * forwards arbitrary path text to GA.
 */
export function normalizePagePath(raw: string): KnownPagePath {
  let path: string;
  try {
    path = String(raw).split("?")[0].split("#")[0];
  } catch {
    return "/other";
  }
  if (path.length > 1) path = path.replace(/\/+$/, "");
  if (!path) path = "/";
  if ((KNOWN_PAGE_PATHS as readonly string[]).includes(path)) return path as KnownPagePath;
  if (/^\/channels\/[^/]+$/.test(path)) return "/channels/:channel";
  return "/other";
}

export type AnalyticsEvent =
  | { name: "cta_click"; params: { cta_id: CtaId } }
  | { name: "sign_up"; params: { method: AuthMethod } }
  | { name: "login"; params: { method: AuthMethod } }
  | { name: "content_generate"; params: { kind: ContentKind } }
  | { name: "publish_attempt"; params: { channel: AnalyticsChannel } }
  | { name: "publish_success"; params: { channel: AnalyticsChannel } }
  | { name: "page_view"; params: { page_path: KnownPagePath } };

type EventName = AnalyticsEvent["name"];

function isMember<T extends string>(value: unknown, set: readonly T[]): value is T {
  return typeof value === "string" && (set as readonly string[]).includes(value);
}

// Belt-and-suspenders key blocklist: protects against a future param rename mistake even though
// every event above already has a hand-picked, closed key set.
const FORBIDDEN_KEY_PATTERN = /email|user_?id|tenant|token|password|secret|credential|prompt|content_?text|stack|error_?message|raw/i;

/**
 * Runtime validator per event. Returns a safe, GA-ready param object, or `null` if the event
 * (name OR any param value) fails validation — callers MUST drop the event entirely on `null`,
 * never send a partial/best-effort payload. This is what actually closes the schema at runtime:
 * type-level closure alone doesn't stop `trackEvent(x as any)`.
 */
const VALIDATORS: Record<EventName, (params: Record<string, unknown>) => Record<string, string> | null> = {
  cta_click: (p) => (isMember(p.cta_id, CTA_IDS) ? { cta_id: p.cta_id } : null),
  sign_up: (p) => (isMember(p.method, AUTH_METHODS) ? { method: p.method } : null),
  login: (p) => (isMember(p.method, AUTH_METHODS) ? { method: p.method } : null),
  content_generate: (p) => (isMember(p.kind, CONTENT_KINDS) ? { kind: p.kind } : null),
  publish_attempt: (p) => (isMember(p.channel, ANALYTICS_CHANNELS) ? { channel: p.channel } : null),
  publish_success: (p) => (isMember(p.channel, ANALYTICS_CHANNELS) ? { channel: p.channel } : null),
  page_view: (p) => {
    // page_view is the one event whose value space is normalized rather than exact-matched —
    // normalizePagePath() itself only ever returns a KNOWN_PAGE_PATHS member or "/other", so
    // this can never leak raw path text either.
    if (typeof p.page_path !== "string") return null;
    return { page_path: normalizePagePath(p.page_path) };
  },
};

/**
 * Legacy redaction helper — retained for the existing key-stripping/value-shape defense-in-depth
 * unit tests (forbidden key names, embedded emails, URL query strings, oversized free text, non-
 * primitive values). Still used as an extra pass inside trackEvent() after enum validation so
 * both layers are exercised. Only ever called with an event name's own validated/allowlisted keys.
 */
function redactParams(name: EventName, params: Record<string, unknown>): Record<string, string> {
  const allowedKeys = ALLOWED_PARAM_KEYS[name] || [];
  const out: Record<string, string> = {};
  for (const key of allowedKeys) {
    if (!(key in params)) continue;
    if (FORBIDDEN_KEY_PATTERN.test(key)) continue;
    const raw = params[key];
    if (typeof raw !== "string" && typeof raw !== "number" && typeof raw !== "boolean") continue;
    let value = String(raw);
    if (/^[a-z]+:\/\//i.test(value) && value.includes("?")) value = value.split("?")[0];
    if (value.includes("@")) continue; // looks like an email — drop the whole param
    out[key] = value.slice(0, 100);
  }
  return out;
}

const ALLOWED_PARAM_KEYS: Record<EventName, readonly string[]> = {
  cta_click: ["cta_id"],
  sign_up: ["method"],
  login: ["method"],
  content_generate: ["kind"],
  publish_attempt: ["channel"],
  publish_success: ["channel"],
  page_view: ["page_path"],
};

/**
 * Send a typed, closed-enum event. Extra/mistyped keys are a compile error at the call site;
 * at runtime, an unknown event name OR any param value that isn't a member of its enum causes
 * the WHOLE event to be dropped (never partially sent) before it reaches sendGaHit. No-op if
 * GA disabled/no consent (enforced downstream in ga.ts).
 */
export function trackEvent(event: AnalyticsEvent) {
  const validator = VALIDATORS[event.name as EventName];
  if (!validator) return; // unknown event name — dropped completely
  const validated = validator(event.params as unknown as Record<string, unknown>);
  if (!validated) return; // invalid/unknown enum value — dropped completely, nothing sent
  const safeParams = redactParams(event.name, validated);
  sendGaHit(event.name, safeParams);
}

// Exported for tests only (redaction boundary unit tests call these directly with forbidden
// keys / bypassed types).
export const __internal = { redactParams, VALIDATORS, ALLOWED_PARAM_KEYS };

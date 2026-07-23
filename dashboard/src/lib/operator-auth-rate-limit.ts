import { isIP } from "node:net";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_IDENTITIES = 2_048;

type AttemptBucket = {
  attempts: number;
  expiresAt: number;
};

export type OperatorAuthRateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

type OperatorAuthAttemptLimiterOptions = {
  maxAttempts?: number;
  windowMs?: number;
  maxIdentities?: number;
};

/**
 * Small, process-local fixed-window limiter for the operator-token validation
 * boundary. It intentionally stores client identities only, never bearer values.
 */
export class OperatorAuthAttemptLimiter {
  private readonly attemptsByIdentity = new Map<string, AttemptBucket>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;
  private readonly maxIdentities: number;

  constructor(options: OperatorAuthAttemptLimiterOptions = {}) {
    this.maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS));
    this.windowMs = Math.max(1_000, Math.floor(options.windowMs ?? DEFAULT_WINDOW_MS));
    this.maxIdentities = Math.max(1, Math.floor(options.maxIdentities ?? DEFAULT_MAX_IDENTITIES));
  }

  recordFailure(identity: string, now: number = Date.now()): OperatorAuthRateLimitResult {
    let bucket = this.attemptsByIdentity.get(identity);
    if (bucket && bucket.expiresAt <= now) {
      this.attemptsByIdentity.delete(identity);
      bucket = undefined;
    }

    if (!bucket) {
      this.makeRoom(now);
      bucket = { attempts: 0, expiresAt: now + this.windowMs };
      this.attemptsByIdentity.set(identity, bucket);
    }

    bucket.attempts += 1;
    if (bucket.attempts < this.maxAttempts) return { limited: false };

    return {
      limited: true,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.expiresAt - now) / 1_000)),
    };
  }

  clear(identity: string): void {
    this.attemptsByIdentity.delete(identity);
  }

  reset(): void {
    this.attemptsByIdentity.clear();
  }

  get entryCount(): number {
    return this.attemptsByIdentity.size;
  }

  private makeRoom(now: number): void {
    if (this.attemptsByIdentity.size < this.maxIdentities) return;

    for (const [identity, bucket] of this.attemptsByIdentity) {
      if (bucket.expiresAt <= now) this.attemptsByIdentity.delete(identity);
    }
    if (this.attemptsByIdentity.size < this.maxIdentities) return;

    const oldestIdentity = this.attemptsByIdentity.keys().next().value;
    if (oldestIdentity !== undefined) this.attemptsByIdentity.delete(oldestIdentity);
  }
}

const operatorAuthAttemptLimiter = new OperatorAuthAttemptLimiter();

/**
 * The production ingress is a Cloudflare Tunnel, so only Cloudflare's
 * single-value visitor header is trusted. X-Forwarded-For is deliberately
 * ignored because a client can supply/extend it. Direct requests share one
 * conservative bucket instead of accepting a spoofable identity.
 */
export function operatorAuthClientIdentity(request: Request): string {
  const cloudflareIp = request.headers.get("cf-connecting-ip")?.trim() ?? "";
  return isIP(cloudflareIp) ? `cf:${cloudflareIp}` : "direct";
}

export function recordInvalidOperatorBearer(
  request: Request,
  now: number = Date.now(),
): OperatorAuthRateLimitResult {
  return operatorAuthAttemptLimiter.recordFailure(operatorAuthClientIdentity(request), now);
}

export function clearOperatorAuthFailures(request: Request): void {
  operatorAuthAttemptLimiter.clear(operatorAuthClientIdentity(request));
}

export function resetOperatorAuthRateLimitForTests(): void {
  operatorAuthAttemptLimiter.reset();
}

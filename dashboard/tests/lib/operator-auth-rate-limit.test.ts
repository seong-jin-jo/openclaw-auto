import { afterEach, describe, expect, it } from "vitest";
import {
  OperatorAuthAttemptLimiter,
  operatorAuthClientIdentity,
  recordInvalidOperatorBearer,
  resetOperatorAuthRateLimitForTests,
} from "@/lib/operator-auth-rate-limit";

afterEach(() => {
  resetOperatorAuthRateLimitForTests();
});

describe("OperatorAuthAttemptLimiter", () => {
  it("limits the configured failure threshold and returns deterministic retry seconds", () => {
    const limiter = new OperatorAuthAttemptLimiter({ maxAttempts: 3, windowMs: 10_000 });

    expect(limiter.recordFailure("client-a", 1_000)).toEqual({ limited: false });
    expect(limiter.recordFailure("client-a", 2_000)).toEqual({ limited: false });
    expect(limiter.recordFailure("client-a", 2_500)).toEqual({
      limited: true,
      retryAfterSeconds: 9,
    });
  });

  it("isolates clients and forgets an expired window", () => {
    const limiter = new OperatorAuthAttemptLimiter({ maxAttempts: 2, windowMs: 5_000 });

    expect(limiter.recordFailure("client-a", 10_000)).toEqual({ limited: false });
    expect(limiter.recordFailure("client-b", 10_001)).toEqual({ limited: false });
    expect(limiter.recordFailure("client-a", 10_002)).toEqual({
      limited: true,
      retryAfterSeconds: 5,
    });
    expect(limiter.recordFailure("client-a", 15_000)).toEqual({ limited: false });
  });

  it("clears failures after successful operator authentication", () => {
    const limiter = new OperatorAuthAttemptLimiter({ maxAttempts: 2, windowMs: 5_000 });

    limiter.recordFailure("client-a", 1_000);
    limiter.clear("client-a");

    expect(limiter.recordFailure("client-a", 1_001)).toEqual({ limited: false });
  });

  it("keeps memory bounded and evicts the oldest live identity deterministically", () => {
    const limiter = new OperatorAuthAttemptLimiter({
      maxAttempts: 2,
      windowMs: 60_000,
      maxIdentities: 2,
    });

    limiter.recordFailure("client-a", 1_000);
    limiter.recordFailure("client-b", 1_001);
    limiter.recordFailure("client-c", 1_002);

    expect(limiter.entryCount).toBe(2);
    expect(limiter.recordFailure("client-a", 1_003)).toEqual({ limited: false });
    expect(limiter.entryCount).toBe(2);
  });
});

describe("operatorAuthClientIdentity", () => {
  it("uses a valid Cloudflare visitor IP and ignores X-Forwarded-For", () => {
    const cloudflareRequest = new Request("https://app.example/api/me", {
      headers: {
        "cf-connecting-ip": "203.0.113.8",
        "x-forwarded-for": "198.51.100.99",
      },
    });
    const forwardedOnlyRequest = new Request("https://app.example/api/me", {
      headers: { "x-forwarded-for": "198.51.100.99" },
    });

    expect(operatorAuthClientIdentity(cloudflareRequest)).toBe("cf:203.0.113.8");
    expect(operatorAuthClientIdentity(forwardedOnlyRequest)).toBe("direct");
  });

  it("puts malformed Cloudflare headers in the bounded direct bucket", () => {
    const request = new Request("https://app.example/api/me", {
      headers: { "cf-connecting-ip": "not-an-ip" },
    });

    expect(operatorAuthClientIdentity(request)).toBe("direct");
  });

  it("keeps the singleton path deterministic when a clock is supplied", () => {
    const request = new Request("https://app.example/api/me", {
      headers: { "cf-connecting-ip": "2001:db8::8" },
    });

    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect(recordInvalidOperatorBearer(request, 1_000 + attempt)).toEqual({ limited: false });
    }
    expect(recordInvalidOperatorBearer(request, 2_000)).toEqual({
      limited: true,
      retryAfterSeconds: 59,
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// lib/observability.ts — OSMU v1.0.0 모니터링 알림 헬퍼 단위 계약.
// 2026-07-14 Codex 2nd-pass 반려 반영: blacklist(금지키+값휴리스틱) 방식을 폐기하고 닫힌세계
// allowlist(고정 이벤트명 4개 + 이벤트별 고정 enum/httpStatus 스키마)로 재설계했다. 검증 대상:
// (1) 스키마 밖 이벤트/키/값은 전부 드롭되거나 안정 코드로 치환 — 임의 외부 텍스트(API 키, GitHub
//     토큰, URL, 전화번호/주소, 유니코드 프롬프트, 악의적 이벤트명/reason)가 값 패턴과 무관하게
//     구조적으로 통과 불가능함을 적대적 입력으로 검증(값 매칭에 의존하지 않는 방어라는 게 핵심).
// (2) best-effort — Slack 발송 실패/webhook 미설정/non-2xx 응답이어도 절대 throw하지 않음.
// (3) stderr 구조적 JSON 로그는 네트워크 성패와 무관하게 항상 남음.
// (4) classify*/normalize* 헬퍼가 원본 텍스트를 고정 코드로만 변환함.

describe("lib/observability — reportFailure (allowlist 경계)", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    delete process.env.OSMU_ALERT_SLACK_WEBHOOK_URL;
  });

  afterEach(() => {
    errSpy.mockRestore();
    vi.unstubAllGlobals();
    delete process.env.OSMU_ALERT_SLACK_WEBHOOK_URL;
  });

  function lastLog(): Record<string, unknown> {
    return JSON.parse(errSpy.mock.calls[errSpy.mock.calls.length - 1][0] as string);
  }

  it("허용된 이벤트+유효 enum context는 그대로 stderr JSON에 기록된다(webhook 미설정 시 fetch 미호출)", async () => {
    const { reportFailure } = await import("@/lib/observability");
    await reportFailure({ event: "auth_service_unavailable", severity: "critical", context: { reason: "supabase_jwt_verify_unreachable" } });
    const logged = lastLog();
    expect(logged.kind).toBe("osmu_alert");
    expect(logged.event).toBe("auth_service_unavailable");
    expect(logged.severity).toBe("critical");
    expect(logged.context).toEqual({ reason: "supabase_jwt_verify_unreachable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("OSMU_ALERT_SLACK_WEBHOOK_URL 설정 시에만 Slack로 POST하고, 고객 webhook 설정은 참조하지 않는다", async () => {
    process.env.OSMU_ALERT_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/OPERATOR/ALERT/HOOK";
    const { reportFailure } = await import("@/lib/observability");
    await reportFailure({ event: "publish_failed", severity: "warning", context: { platform: "threads", reason: "http_error", httpStatus: 500 } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://hooks.slack.com/services/OPERATOR/ALERT/HOOK");
    expect(init.method).toBe("POST");
    expect(init.signal).toBeInstanceOf(AbortSignal);
    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.text).toMatch(/publish_failed/);
    expect(sentBody.text).toMatch(/platform: threads/);
    expect(sentBody.text).toMatch(/httpStatus: 500/);
  });

  describe("적대적 입력 — 임의 외부 텍스트는 구조적으로 통과 불가능(값 패턴 매칭 아님, 스키마 자체가 닫힌 세계)", () => {
    const ADVERSARIAL_VALUES = [
      ["Anthropic API 키", "sk-ant-api03-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
      ["GitHub 토큰", "ghp_1234567890abcdefghijklmnopqrstuvwxyz12"],
      ["임의 URL", "https://attacker.example.com/exfil?data=leak"],
      ["전화번호형 문자열", "010-1234-5678"],
      ["주소형 문자열", "서울특별시 강남구 테헤란로 123 어딘가빌딩 501호"],
      ["유니코드 프롬프트 원문", "이 사용자의 은밀한 프롬프트 내용입니다 🔐 secret plan"],
      ["악의적 reason 값(신규 이벤트명 위장 시도)", "'; DROP TABLE tenants; --"],
      ["JWT형", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"],
    ] as const;

    it.each(ADVERSARIAL_VALUES)("%s는 reason enum 밖이라 드롭된다(auth_service_unavailable)", async (_label, value) => {
      const { reportFailure } = await import("@/lib/observability");
      await reportFailure({ event: "auth_service_unavailable", severity: "critical", context: { reason: value } });
      const logged = lastLog();
      expect(logged.context).toEqual({}); // enum 밖 값은 키 자체가 드롭됨
    });

    it.each(ADVERSARIAL_VALUES)("%s는 platform enum 밖이라 드롭된다(publish_failed)", async (_label, value) => {
      const { reportFailure } = await import("@/lib/observability");
      await reportFailure({ event: "publish_failed", severity: "warning", context: { platform: value, reason: "unknown" } });
      const logged = lastLog();
      expect(logged.context).toEqual({ reason: "unknown" }); // platform만 드롭, reason은 유효값이라 유지
      expect(JSON.stringify(logged)).not.toContain(value);
    });

    it("악의적 이벤트명(임의 문자열)은 unknown_event로 치환되고 context가 통째로 버려진다", async () => {
      const { reportFailure } = await import("@/lib/observability");
      await reportFailure({
        event: "arbitrary_attacker_event <script>alert(1)</script>",
        severity: "critical",
        context: { reason: "sk-ant-api03-leaked-key-value", tenant_id: "t-123" },
      });
      const logged = lastLog();
      expect(logged.event).toBe("unknown_event");
      expect(logged.context).toEqual({});
      expect(JSON.stringify(logged)).not.toMatch(/sk-ant|attacker_event|script/);
    });

    it("악의적 severity 값은 'error'로 강제된다", async () => {
      const { reportFailure } = await import("@/lib/observability");
      await reportFailure({ event: "operator_mutation_failed", severity: "CRITICAL!!!" as never, context: { action: "pause_user" } });
      const logged = lastLog();
      expect(logged.severity).toBe("error");
    });

    it("httpStatus에 범위 밖 숫자/문자열/거대 숫자를 넣어도 드롭된다(publish_failed)", async () => {
      const { reportFailure } = await import("@/lib/observability");
      await reportFailure({ event: "publish_failed", severity: "warning", context: { platform: "threads", reason: "http_error", httpStatus: 99999 } });
      expect(lastLog().context).toEqual({ platform: "threads", reason: "http_error" });

      await reportFailure({ event: "publish_failed", severity: "warning", context: { platform: "threads", reason: "http_error", httpStatus: "500; DROP TABLE" as never } });
      expect(lastLog().context).toEqual({ platform: "threads", reason: "http_error" });
    });

    it("스키마에 없는 임의 키(user_id/email/prompt/stack 등)를 추가로 넣어도 전부 드롭된다", async () => {
      const { reportFailure } = await import("@/lib/observability");
      await reportFailure({
        event: "operator_mutation_failed",
        severity: "error",
        context: {
          action: "pause_user",
          user_id: "11111111-1111-1111-1111-111111111111",
          email: "victim@example.com",
          prompt: "raw prompt text",
          stack: "Error: x\n  at foo",
          apiKey: "sk-ant-leak",
        },
      });
      expect(lastLog().context).toEqual({ action: "pause_user" });
    });
  });

  it("Slack fetch가 실패해도(network error) reportFailure는 절대 throw/reject하지 않고, 실패 로그는 webhook URL/에러 디테일을 담지 않는다", async () => {
    process.env.OSMU_ALERT_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/X/Y/Z";
    fetchMock.mockRejectedValue(new Error("network down: connect ECONNREFUSED to hooks.slack.com/services/X/Y/Z"));
    const { reportFailure } = await import("@/lib/observability");
    await expect(reportFailure({ event: "operator_mutation_failed", severity: "error", context: { action: "pause_user" } })).resolves.toBeUndefined();
    const deliveryFailLog = errSpy.mock.calls.map((c) => JSON.parse(c[0] as string)).find((l) => l.kind === "osmu_alert_delivery_failed");
    expect(deliveryFailLog).toBeTruthy();
    expect(JSON.stringify(deliveryFailLog)).not.toMatch(/hooks\.slack\.com|ECONNREFUSED/);
  });

  it("Slack이 non-2xx를 반환해도 best-effort 실패로 취급하고 응답 본문/상태코드를 로그하지 않는다", async () => {
    process.env.OSMU_ALERT_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/X/Y/Z";
    fetchMock.mockResolvedValue(new Response("invalid_payload internal detail xyz", { status: 400 }));
    const { reportFailure } = await import("@/lib/observability");
    await expect(reportFailure({ event: "operator_mutation_failed", severity: "error", context: { action: "pause_user" } })).resolves.toBeUndefined();
    const deliveryFailLog = errSpy.mock.calls.map((c) => JSON.parse(c[0] as string)).find((l) => l.kind === "osmu_alert_delivery_failed");
    expect(deliveryFailLog).toBeTruthy();
    expect(deliveryFailLog).toMatchObject({
      kind: "osmu_alert_delivery_failed",
      event: "operator_mutation_failed",
    });
    expect(deliveryFailLog).not.toHaveProperty("body");
    expect(deliveryFailLog).not.toHaveProperty("status");
    expect(JSON.stringify(deliveryFailLog)).not.toContain("invalid_payload");
  });

  it("Slack fetch가 타임아웃 시그널을 부착한다(무한 대기 방지)", async () => {
    process.env.OSMU_ALERT_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/X/Y/Z";
    const { reportFailure } = await import("@/lib/observability");
    await reportFailure({ event: "operator_mutation_failed", severity: "error", context: { action: "pause_user" } });
    const init = fetchMock.mock.calls[0][1];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("lib/observability — classify*/normalize* 헬퍼 (원본 텍스트 → 고정 코드)", () => {
  it("normalizePlatform: 허용 플랫폼만 통과, 그 외(임의 문자열)는 unknown_platform", async () => {
    const { normalizePlatform } = await import("@/lib/observability");
    expect(normalizePlatform("threads")).toBe("threads");
    expect(normalizePlatform("<script>alert(1)</script>")).toBe("unknown_platform");
    expect(normalizePlatform("sk-ant-api03-fake")).toBe("unknown_platform");
    expect(normalizePlatform(12345)).toBe("unknown_platform");
    expect(normalizePlatform(undefined)).toBe("unknown_platform");
  });

  it("normalizeOperatorAction: 허용 action만 통과, 그 외는 unknown", async () => {
    const { normalizeOperatorAction } = await import("@/lib/observability");
    expect(normalizeOperatorAction("pause_user")).toBe("pause_user");
    expect(normalizeOperatorAction("delete_all_tenants")).toBe("unknown");
    expect(normalizeOperatorAction({ toString: () => "pause_user" })).toBe("unknown"); // 객체는 문자열 강제변환 안 함
  });

  it("classifyPublishFailure: 임의 플랫폼 API 에러 본문에서 원문을 절대 포함하지 않고 코드/상태코드만 추출", async () => {
    const { classifyPublishFailure } = await import("@/lib/observability");
    expect(classifyPublishFailure("container 실패(500): {\"error\":{\"message\":\"Invalid OAuth access token - sk-ant-leaked\"}}")).toEqual({
      reason: "http_error",
      httpStatus: 500,
    });
    expect(classifyPublishFailure("threads 미지원")).toEqual({ reason: "unsupported_platform" });
    expect(classifyPublishFailure("Bluesky 요청 실패: fetch failed")).toEqual({ reason: "network_error" });
    expect(classifyPublishFailure("전혀 알 수 없는 임의 텍스트")).toEqual({ reason: "unknown" });
    expect(classifyPublishFailure(null)).toEqual({ reason: "unknown" });
  });

  it("classifySharedAiFailure: e.message를 절대 그대로 반환하지 않고 고정 reason 코드만 반환", async () => {
    const { classifySharedAiFailure } = await import("@/lib/observability");
    expect(classifySharedAiFailure(new Error("claude CLI timeout(120000ms)"))).toBe("timeout");
    expect(classifySharedAiFailure(new Error("claude CLI output exceeded 8388608 bytes"))).toBe("output_limit");
    expect(classifySharedAiFailure(new Error("claude CLI spawn 실패: ENOENT"))).toBe("spawn_failed");
    expect(classifySharedAiFailure(new Error("claude CLI exited with code 1"))).toBe("exit_nonzero");
    expect(classifySharedAiFailure(new Error("claude CLI stdin 오류"))).toBe("stdin_failed");
    expect(classifySharedAiFailure(new Error("이 사용자의 은밀한 프롬프트 내용 그대로"))).toBe("unknown");
  });
});

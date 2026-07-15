import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// .github/workflows/osmu-health-monitor.yml — 소스 텍스트 기반 계약 테스트(다른 계약 테스트들과
// 동일하게 yaml 파서 의존성 추가 없이 정규식으로 고정 — 예: tests/isolation/authgate-contract.test.ts).
// 요구사항 고정: GitHub-hosted 러너(self-hosted marketing_runner 금지) + 5분 스케줄(GitHub 공식
// 최소 간격) + workflow_dispatch + 최소 권한(permissions:{}, 캐시 삭제 API 불필요) + concurrency +
// 공식 문서가 명시하는 "고유 key + restore-keys" 캐시 갱신 패턴(delete+save 아님) +
// 상태전이(failure/recovery)에서만 알림 + webhook 미설정에도 정상 동작 + 시크릿 원문 미노출 +
// Slack non-2xx도 best-effort 실패로 처리.

const WORKFLOW_PATH = resolve(__dirname, "../../../.github/workflows/osmu-health-monitor.yml");
const SRC = readFileSync(WORKFLOW_PATH, "utf-8");

describe(".github/workflows/osmu-health-monitor.yml — 구조 계약", () => {
  it("5분 cron 스케줄(GitHub 공식 최소 간격) + workflow_dispatch 둘 다 갖는다", () => {
    expect(SRC).toMatch(/on:\s*\n\s*schedule:\s*\n\s*-\s*cron:\s*'?\*\/5 \* \* \* \*'?/);
    expect(SRC).toMatch(/workflow_dispatch:\s*\{\}/);
  });

  it("GitHub-hosted 러너(ubuntu-latest)를 쓰고, self-hosted/marketing_runner는 절대 참조하지 않는다", () => {
    expect(SRC).toMatch(/runs-on:\s*ubuntu-latest/);
    expect(SRC).not.toMatch(/self-hosted/);
    expect(SRC).not.toMatch(/marketing_runner/);
  });

  it("permissions가 전부 none(빈 객체)이다 — 이 job은 GITHUB_TOKEN을 어떤 API에도 쓰지 않는다", () => {
    expect(SRC).toMatch(/permissions:\s*\{\}/);
  });

  it("실제 스텝(uses/run)은 gh cache delete/REST 캐시삭제 API/GITHUB_TOKEN을 쓰지 않는다(공식 권장 patchless 패턴 — 고유 key로 대체). 상단 설계노트 주석은 '왜 안 쓰는지' 설명하려 그 문자열을 언급할 수 있으므로 주석을 제외한 실행부만 검사한다.", () => {
    const stepsBlock = SRC.slice(SRC.indexOf("\njobs:"));
    expect(stepsBlock).not.toMatch(/gh cache delete/);
    expect(stepsBlock).not.toMatch(/actions\/caches/);
    expect(stepsBlock).not.toMatch(/GH_TOKEN/);
    expect(stepsBlock).not.toMatch(/github\.token/);
  });

  it("캐시 key가 매 실행 고유(run_id-run_attempt)하고 restore-keys로 prefix 복원한다(공식 unique-key 패턴)", () => {
    expect(SRC).toMatch(/key:\s*\$\{\{ env\.STATE_KEY_PREFIX \}\}\$\{\{ github\.run_id \}\}-\$\{\{ github\.run_attempt \}\}/);
    expect(SRC).toMatch(/restore-keys:\s*\|\s*\n\s*\$\{\{ env\.STATE_KEY_PREFIX \}\}/);
  });

  it("concurrency 그룹으로 동시 실행을 직렬화한다(cancel-in-progress:false)", () => {
    expect(SRC).toMatch(/concurrency:\n\s*group:\s*\S+/);
    expect(SRC).toMatch(/cancel-in-progress:\s*false/);
  });

  it("헬스체크 대상 URL이 스펙 그대로 고정돼 있다", () => {
    expect(SRC).toMatch(/OSMU_HEALTH_URL:\s*https:\/\/openclaw\.sj-onpremise-cloudflare-tunnel\.cloud\/api\/health/);
  });

  it("GitHub-native 캐시(actions/cache)로 상태를 저장/복원한다(restore + save)", () => {
    expect(SRC).toMatch(/actions\/cache\/restore@v4/);
    expect(SRC).toMatch(/actions\/cache\/save@v4/);
  });

  it("상태 전이(failure/recovery/none) 판정 로직이 존재하고, 전이 없음(none)에는 알림 스텝을 스킵한다", () => {
    expect(SRC).toMatch(/kind=failure/);
    expect(SRC).toMatch(/kind=recovery/);
    expect(SRC).toMatch(/kind=none/);
    expect(SRC).toMatch(/if:\s*\$\{\{\s*steps\.transition\.outputs\.kind\s*!=\s*'none'\s*\}\}/);
  });

  it("webhook 시크릿은 step env로만 전달되고(커맨드라인 인터폴레이션 X), 미설정 시 조용히 skip한다", () => {
    expect(SRC).toMatch(/SLACK_WEBHOOK:\s*\$\{\{\s*secrets\.OSMU_ALERT_SLACK_WEBHOOK_URL\s*\}\}/);
    expect(SRC).toMatch(/if \[ -z "\$SLACK_WEBHOOK" \]/);
    const slackStepIdx = SRC.indexOf("Slack 알림");
    const slackRunBlock = SRC.slice(slackStepIdx, SRC.indexOf("새 상태 파일 기록", slackStepIdx));
    expect(slackRunBlock).not.toMatch(/curl[^\n]*secrets\.OSMU_ALERT_SLACK_WEBHOOK_URL/);
  });

  it("Slack 발송은 curl -f(non-2xx를 실패로 처리)로 best-effort — 응답 본문/URL을 로그하지 않는다", () => {
    const slackStepIdx = SRC.indexOf("Slack 알림");
    const slackRunBlock = SRC.slice(slackStepIdx, SRC.indexOf("새 상태 파일 기록", slackStepIdx));
    expect(slackRunBlock).toMatch(/curl -fsS/); // -f: HTTP 에러 상태코드를 실패로 처리(비2xx 무시 안 함)
    expect(slackRunBlock).not.toMatch(/echo.*\$BODY/);
    expect(slackRunBlock).not.toMatch(/echo.*\$SLACK_WEBHOOK/);
  });

  it("체크 스텝은 --max-time으로 바운드돼 무한 대기하지 않는다", () => {
    const checkStepIdx = SRC.indexOf("헬스체크 실행");
    const checkBlock = SRC.slice(checkStepIdx, SRC.indexOf("상태 전이 판정", checkStepIdx));
    expect(checkBlock).toMatch(/curl -fsS -o \/dev\/null -w '%\{http_code\}' --max-time \d+/);
  });
});

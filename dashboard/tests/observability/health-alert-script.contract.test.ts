import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.join(process.cwd(), "scripts/health-alert.sh"), "utf8");

describe("운영 건강 알림 스크립트 계약", () => {
  it("알림-보안-01 거절: 작업 공간 문자열을 제어문자 제거, 길이 제한, mrkdwn 이스케이프 뒤 전송한다", () => {
    expect(source).toContain("sanitize_slack_text");
    expect(source).toContain("split())[:160]");
    expect(source).toContain("html.escape(value, quote=False)");
    expect(source).toContain("workspace=$(printf '%s' \"$workspace\" | sanitize_slack_text)");
  });

  it("알림-재시도-02 경계: 임계 이상에서 성공 표식이 없으면 재시도하고 성공 뒤에만 표식을 쓴다", () => {
    expect(source).toContain('[ "$fails" -ge "$THRESHOLD" ]');
    expect(source).toContain('[ "$alerted" != "1" ]');
    expect(source).toMatch(/if slack[\s\S]*echo 1 > "\$ALERT_STATE_FILE"/);
  });
});

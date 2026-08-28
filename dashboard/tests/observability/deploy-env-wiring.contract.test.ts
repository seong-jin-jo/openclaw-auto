import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// .github/workflows/deploy-marketing.yml — OSMU_ALERT_SLACK_WEBHOOK_URL이 .env.osmu 렌더 블록에
// 배선돼 런타임(docker-compose env_file 경유)에 도달하는지 소스 계약으로 고정. 실제 값은 여기서도
// echo/출력하지 않는다(렌더 스텝은 EOF heredoc 안에 `${{ secrets.X }}` 표현식만 두고, 완료 로그는
// 줄 수만 세지 원문을 남기지 않는 기존 패턴을 그대로 따른다).

const DEPLOY_PATH = resolve(__dirname, "../../../.github/workflows/deploy-marketing.yml");
const SRC = readFileSync(DEPLOY_PATH, "utf-8");

const COMPOSE_PATH = resolve(__dirname, "../../../docker-compose.postagi-4tenants.yml");
const COMPOSE_SRC = readFileSync(COMPOSE_PATH, "utf-8");
const RELEASE_VERSION = readFileSync(resolve(__dirname, "../../../VERSION"), "utf-8").trim();

describe("deploy-marketing.yml — OSMU_ALERT_SLACK_WEBHOOK_URL 배선 계약", () => {
  it(".env.osmu 렌더 블록에 새 시크릿이 있다(다른 OSMU 시크릿과 같은 EOF heredoc 안)", () => {
    const heredocOpen = "cat > .env.osmu <<EOF";
    const envBlockStart = SRC.indexOf(heredocOpen);
    // 여는 히어독의 "<<EOF" 자체에 "EOF"가 포함돼 있으므로, 닫는 EOF는 그 뒤부터 찾는다.
    const envBlockEnd = SRC.indexOf("EOF", envBlockStart + heredocOpen.length);
    const envBlock = SRC.slice(envBlockStart, envBlockEnd);
    expect(envBlock).toMatch(/OSMU_ALERT_SLACK_WEBHOOK_URL=\$\{\{ secrets\.OSMU_ALERT_SLACK_WEBHOOK_URL \}\}/);
  });

  it("렌더 완료 로그는 줄 수만 세고 .env.osmu 원문(시크릿 값)을 echo하지 않는다(기존 패턴 유지)", () => {
    expect(SRC).toMatch(/echo "\.env\.osmu rendered \(\$\(grep -c \. \.env\.osmu\) lines\)"/);
    expect(SRC).not.toMatch(/cat \.env\.osmu/);
  });

  it("Studio 개발용 신원 설정이 운영 환경 파일에 들어가면 배포를 차단한다", () => {
    expect(SRC).toContain("^STUDIO_IDENTITY_MODE=development$|^STUDIO_DEV_|^STUDIO_ALLOW_DEV_IDENTITY_IN_PROD=");
    expect(SRC).toContain("Studio 개발용 신원 설정은 운영 환경에 넣을 수 없음");
  });

  it("앱 기동 전에 schema, 이름순 migration, RLS를 오류 즉시 중단으로 적용한다", () => {
    expect(SRC).toContain('psql "$OSMU_DATABASE_URL" -q -v ON_ERROR_STOP=1 -f /db/schema.sql');
    expect(SRC).toContain("for migration in /db/migrations/*.sql");
    expect(SRC).toContain('psql "$OSMU_DATABASE_URL" -q -v ON_ERROR_STOP=1 -f "$migration"');
    expect(SRC).toContain('psql "$OSMU_DATABASE_URL" -q -v ON_ERROR_STOP=1 -f /db/rls.sql');
  });

  it("openclaw-dashboard-osmu 컨테이너는 env_file: .env.osmu 를 그대로 쓴다(런타임 env 자동 전달, 별도 배선 불필요)", () => {
    const svcIdx = COMPOSE_SRC.indexOf("openclaw-dashboard-osmu:");
    const svcBlock = COMPOSE_SRC.slice(svcIdx, COMPOSE_SRC.indexOf("healthcheck:", svcIdx));
    expect(svcBlock).toMatch(/env_file:\s*\.env\.osmu/);
    expect(svcBlock).toContain(`image: openclaw-auto/dashboard:${RELEASE_VERSION}`);
  });
});

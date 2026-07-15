import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

// ── next.config.ts turbopack.root 계약 ──────────────────────────────────
// 직접 관찰된 결함: 이 레포에는 /Users/sj/package-lock.json,
// dashboard/package-lock.json, openclaw/pnpm-lock.yaml 등 여러 lockfile이
// 있어 Next.js 16.2.2의 workspace root 자동추론이 /Users/sj를 root로 오인,
// `PORT=3460 npm run dev` 후 `/` 요청 시 tailwindcss를 잘못된 root
// (/Users/sj/sj_code_master/openclaw-auto)에서 resolve하려다 실패했다.
// (env PORT=3460 npm run dev → GET / → Turbopack이 tailwindcss를 repo root
// 기준으로 찾다 실패 / next build도 "multiple lockfiles" 경고 발생, 직접 관찰)
// 고정: next.config.ts가 turbopack.root를 import.meta.url 기반 절대경로로
// 명시(공식 문서 권고, https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
// "Root directory" 섹션). 이 계약은 그 고정이 되돌아가지 않게 지킨다 —
// (1) process.cwd() 의존 없이 (2) 파일 자신의 위치(dashboard/) 절대경로를
// turbopack.root로 설정하고 (3) 기존 output/serverExternalPackages를
// 보존하는지 소스 계약 + 런타임 계약 양쪽으로 검증한다.

const DASHBOARD_ROOT = path.resolve(__dirname, "../..");
const CONFIG_PATH = path.resolve(DASHBOARD_ROOT, "next.config.ts");
const CONFIG_SOURCE = readFileSync(CONFIG_PATH, "utf8");

// 설명용 주석(`//`)에는 "process.cwd()를 쓰지 않는다"는 문구가 나올 수 있으므로,
// 실제 코드 라인만 남기고 주석을 제거한 뒤 process.cwd( 호출 여부를 검사한다.
const CONFIG_CODE_ONLY = CONFIG_SOURCE.split("\n")
  .map((line) => line.replace(/\/\/.*$/, ""))
  .join("\n");

describe("next.config.ts turbopack.root 계약", () => {
  it("실행 코드가 process.cwd()에 의존하지 않고, import.meta.url 기반으로 root를 계산한다", () => {
    expect(CONFIG_CODE_ONLY).not.toMatch(/process\.cwd\(/);
    expect(CONFIG_SOURCE).toMatch(/import\.meta\.url/);
    expect(CONFIG_SOURCE).toMatch(/fileURLToPath/);
  });

  it("turbopack.root 필드가 존재한다", () => {
    expect(CONFIG_SOURCE).toMatch(/turbopack\s*:\s*{[\s\S]*?root\s*:/);
  });

  it("빌드된 nextConfig.turbopack.root가 dashboard 절대경로와 정확히 일치한다 (process.cwd 무관)", async () => {
    const { default: nextConfig } = await import(CONFIG_PATH);
    const root = nextConfig.turbopack?.root as string | undefined;

    expect(typeof root).toBe("string");
    expect(path.isAbsolute(root as string)).toBe(true);
    // fileURLToPath(new URL(".", import.meta.url))는 trailing slash를 남길 수
    // 있으므로 path.resolve로 정규화한 뒤 비교한다.
    expect(path.resolve(root as string)).toBe(DASHBOARD_ROOT);
    // 이 검증 자체가 test-runner의 process.cwd()가 아니라 CONFIG_PATH(파일
    // 자신의 절대경로)에서 유도된 DASHBOARD_ROOT와 비교하므로, next.config.ts가
    // 실행 시점 cwd에 따라 값이 흔들리는 회귀를 잡아낸다.
    expect(root).not.toBe(process.cwd());
  });

  it("기존 output: standalone / serverExternalPackages 동작을 보존한다 (회귀 없음)", async () => {
    const { default: nextConfig } = await import(CONFIG_PATH);
    expect(nextConfig.output).toBe("standalone");
    expect(nextConfig.serverExternalPackages).toContain("proper-lockfile");
  });
});

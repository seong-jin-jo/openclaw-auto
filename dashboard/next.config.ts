import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Next.js 16 인식 오류 대응: 이 repo에는 /Users/sj/package-lock.json,
// dashboard/package-lock.json, openclaw/pnpm-lock.yaml 등 여러 lockfile이
// 존재해 Next.js의 workspace root 자동추론(가장 가까운 lockfile 탐색)이
// 상위 디렉터리(/Users/sj)를 root로 오인한다. 그 결과 `next dev`/`next build`가
// tailwindcss 등 dashboard 전용 의존성을 잘못된 root에서 resolve하려다 실패한다.
// (공식 문서: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack
//  "Root directory" 섹션 — 이런 경우 turbopack.root를 절대경로로 직접 지정하라고 권고)
// process.cwd()는 실행 위치(예: 레포 루트에서 --prefix로 실행)에 따라 흔들리므로
// 절대 쓰지 않는다. 대신 ESM 표준 방식(import.meta.url → fileURLToPath)으로 이
// next.config.ts 파일 자신의 디렉터리(= dashboard/ 절대경로)를 고정한다.
const dashboardRoot = fileURLToPath(new URL(".", import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["proper-lockfile"],
  turbopack: {
    root: dashboardRoot,
  },
};

export default nextConfig;

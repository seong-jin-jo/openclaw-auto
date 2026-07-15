import { NextRequest, NextResponse } from "next/server";
import { resolveTenantToken, ensureTenantForUser, getTenantStatus } from "@/lib/tenant-auth";
import { verifySupabaseJwt } from "@/lib/supabase";

// Next 16: middleware.ts → proxy.ts(Node.js 런타임 기본, Edge 아님). 그래서 여기서 DB(resolveTenantToken)·
// Supabase(verifySupabaseJwt) 실검증이 가능해졌다 — 구버전은 Edge라 "형태만 보고 통과"였고, 그게
// 위조 JWT/osmu 접두사만 있으면 라우트까지 도달하는 구멍이었다.

// 고객/osmu 토큰이 접근 가능한 명시적 테넌트인지 라우트만. 여기 없는 API는 전부 레거시(운영자 전용) —
// tenant-auth를 아직 안 쓰는 구코드라 osmu_/JWT를 통과시키면 테넌트 스코프 없이 데이터가 샌다.
const TENANT_AWARE_PATHS = [
  "/api/activity",
  "/api/agent-logs",
  "/api/alerts",
  "/api/analytics",
  "/api/blog-guide",
  "/api/blog-keywords",
  "/api/blog-queue/[postId]/approve",
  "/api/blog-queue/[postId]/delete",
  "/api/blog-queue/[postId]/update",
  "/api/blog-queue/approve",
  "/api/blog-queue/delete",
  "/api/blog-queue",
  "/api/blog-queue/update",
  "/api/blog-stats",
  "/api/blog-upload-image",
  "/api/brand/sync-repo",
  "/api/brand/sync-wiki",
  "/api/channel-config/[channel]",
  "/api/channel-config",
  "/api/channel-settings/[channel]",
  "/api/channel-settings",
  "/api/connect/[provider]",
  "/api/errors",
  "/api/figma/export-to-queue",
  "/api/growth",
  "/api/guide/[channel]",
  "/api/guide",
  "/api/integrations",
  "/api/isolation-proof",
  "/api/keyword-bank/add",
  "/api/keyword-bank/mark-used",
  "/api/keyword-bank/remove",
  "/api/keyword-bank",
  "/api/keywords/[channel]",
  "/api/keywords",
  "/api/me",
  "/api/metrics",
  "/api/notification-log",
  "/api/onboarding",
  "/api/overview",
  "/api/popular/add",
  "/api/popular/delete",
  "/api/popular",
  "/api/product-source",
  "/api/provision",
  "/api/publish",
  "/api/queue/[postId]/add-image",
  "/api/queue/[postId]/approve",
  "/api/queue/[postId]/delete",
  "/api/queue/[postId]/update",
  "/api/queue/[postId]/variants",
  "/api/queue/add",
  "/api/queue/backfill",
  "/api/queue/bulk-approve",
  "/api/queue/bulk-delete",
  "/api/queue",
  "/api/queue/seed",
  "/api/schedule/publish-due",
  "/api/schedule",
  "/api/settings",
  "/api/sourcing/import-to-queue",
  "/api/sourcing",
  "/api/studio/brand-setup",
  "/api/studio/drafts",
  "/api/studio/engine-status",
  "/api/studio/text",
  "/api/suggestions",
  "/api/threads-username",
  "/api/trend-report",
  "/api/usage/record",
  "/api/usage",
  "/api/video/refine-clip",
  "/api/video/repurpose",
  "/api/voice-tone",
  "/api/weekly-report",
  "/api/weekly-summary",
];

const TENANT_AWARE_MATCHERS = TENANT_AWARE_PATHS.map((pattern) => {
  const escaped = pattern
    .split("/")
    .map((seg) => (seg.startsWith("[") && seg.endsWith("]") ? "[^/]+" : seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("/");
  return new RegExp(`^${escaped}$`);
});

function isTenantAwarePath(pathname: string): boolean {
  return TENANT_AWARE_MATCHERS.some((re) => re.test(pathname));
}

// 계정 게이트: paused(정지)/unavailable(알수없는 상태)면 /api/me를 제외한 모든 tenant-aware 경로를
// 403으로 막는다. OSMU v1.0.0부터 신규 가입은 즉시 'active'로 생성되므로(ensureTenantForUser)
// pending(승인대기) 분기는 제거됐다 — 공개 대시보드는 active 상태를 계정 접근 자체로는 막지 않는다.
// 공유 AI(claude -p) 사용 승인은 별도 entitlement(tenants.shared_cli_approved_at)로,
// lib/anthropic.ts generateText가 quota reserve 전에 개별 게이트한다.
// /api/me는 이 상태 자체를 조회해 accessPaused로 화면분기해야 하므로 통과시킨다
// (라우트 핸들러가 effectiveTenantId(..., {allowInactive:true})로 재확인).
async function checkTenantAccess(tenantId: string): Promise<NextResponse | null> {
  let status: string | null;
  try {
    status = await getTenantStatus(tenantId);
  } catch {
    return NextResponse.json({ error: "테넌트 상태 확인 실패(DB 연결 불가)" }, { status: 503 });
  }
  if (status === "active") return null;
  if (status === "paused") {
    return NextResponse.json({ error: "계정 이용이 중지되었습니다", code: "account_paused" }, { status: 403 });
  }
  // fail-closed: 레거시 pending/null/미존재/알수없는 status는 통과시키지 않는다(assertTenantActive와 동일 정책).
  return NextResponse.json({ error: "테넌트 상태를 확인할 수 없습니다", code: "account_unavailable" }, { status: 403 });
}

export async function proxy(request: NextRequest) {
  const authToken = process.env.DASHBOARD_AUTH_TOKEN;
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  // /api/health — 무인증 공개(컨테이너 healthcheck + 외부 업타임 모니터). 부작용 0, 이 인스턴스 직접 체크.
  if (request.nextUrl.pathname === "/api/health") return NextResponse.next();

  // 페이지(HTML) 문서 요청: 항상 최신 HTML을 받게 no-store.
  // 재배포 후 브라우저가 옛 HTML(이전 빌드의 죽은 JS 청크명)을 캐시 → 청크 404 →
  // "This page couldn't load"(ChunkLoadError) 나는 것을 차단. 해시된 _next 정적 청크는
  // matcher에서 제외되어 그대로 영구 캐시(불변). API는 아래 기존 로직.
  if (!isApi) {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  }

  // 프록시 모드(포크 셀프호스트, Phase 1): OSMU_API_BASE 설정 시 모든 /api를 중앙 인스턴스로
  // 토큰 붙여 그대로 전달(얇은 프록시). 토큰(OSMU_TENANT_TOKEN)은 서버 env에만 — 브라우저 노출 0.
  // DB·로직 없음. 중앙이 resolveTenantToken으로 검증 + RLS 스코프.
  const apiBase = process.env.OSMU_API_BASE;
  if (apiBase && isApi) {
    const dest = new URL(request.nextUrl.pathname + request.nextUrl.search, apiBase);
    const headers = new Headers(request.headers);
    const tok = process.env.OSMU_TENANT_TOKEN;
    if (tok) headers.set("Authorization", `Bearer ${tok}`);
    return NextResponse.rewrite(dest, { request: { headers } });
  }

  // L0-1: AUTH_TOKEN 미설정 시 전 API 공개 = 격리 근본구멍. prod는 fail-closed(503).
  // dev(NODE_ENV!=production) 또는 명시적 OSMU_AUTH_OPTIONAL=1 일 때만 무인증 허용.
  if (!authToken) {
    const devOptOut = process.env.NODE_ENV !== "production" || process.env.OSMU_AUTH_OPTIONAL === "1";
    if (isApi && !devOptOut) {
      return NextResponse.json(
        { error: "DASHBOARD_AUTH_TOKEN 미설정 — prod 무인증 차단. dev는 OSMU_AUTH_OPTIONAL=1로 우회." },
        { status: 503 },
      );
    }
    return NextResponse.next();
  }

  // Allow OPTIONS (CORS preflight)
  if (request.method === "OPTIONS") return NextResponse.next();

  // Allow Figma OAuth callback without auth
  if (request.nextUrl.pathname === "/api/figma-mcp/callback") return NextResponse.next();

  // 고객 로그인 진입점. Google OAuth는 provider disabled raw JSON을 막기 위해 앱 서버에서 preflight한다.
  if (request.nextUrl.pathname === "/api/auth/google") return NextResponse.next();

  // 소셜 OAuth 연결 콜백(provider 리다이렉트 — 인증 헤더 없음). state(tenantId)로 스코프.
  if (request.nextUrl.pathname.startsWith("/api/connect/") && request.nextUrl.pathname.endsWith("/callback")) {
    return NextResponse.next();
  }

  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";

  // 운영자 토큰 = 전체 접근(대시보드)
  if (token === authToken) return NextResponse.next();

  const path = request.nextUrl.pathname;
  const tenantAware = isTenantAwarePath(path);

  // Authenticate-before-authorize(Codex 2nd-pass 반려 수정): 레거시(비-테넌트-aware) 경로라고
  // 해서 토큰 실검증을 건너뛰고 403부터 반환하면, 위조/폐기 토큰 소지자가 "이 토큰이 어떤 경로에서
  // 막히는지"로 경로 존재·분류를 정찰할 수 있고 무효 자격증명이 유효한 것처럼 취급받는 순서가 된다.
  // 그래서 먼저 실제 principal을 검증(unknown/revoked/fake=401, verifier/DB 장애=503)하고,
  // 그 결과가 valid일 때만 "그 경로 접근 권한이 있는가"(legacy=운영자 전용 403)를 따진다.
  if (token.startsWith("osmu_")) {
    let tenantId: string | null;
    try {
      tenantId = await resolveTenantToken(token);
    } catch {
      return NextResponse.json({ error: "테넌트 토큰 검증 실패(DB 연결 불가)" }, { status: 503 });
    }
    if (!tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!tenantAware) {
      return NextResponse.json({ error: "이 API는 운영자 전용입니다" }, { status: 403 });
    }
    if (path !== "/api/me") {
      const gate = await checkTenantAccess(tenantId);
      if (gate) return gate;
    }
    return NextResponse.next();
  }

  // 고객 로그인 세션(Supabase JWT) — 서명검증까지 실행(구버전은 헤더.페이로드.서명 형태만 보고 통과).
  const looksLikeJwt = token.split(".").length === 3 && token.length > 40;
  if (looksLikeJwt) {
    const verified = await verifySupabaseJwt(token);
    if (verified.status === "unavailable") {
      return NextResponse.json({ error: "세션 토큰 검증 불가(Supabase 연결 실패)" }, { status: 503 });
    }
    if (verified.status === "invalid") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!tenantAware) {
      return NextResponse.json({ error: "이 API는 운영자 전용입니다" }, { status: 403 });
    }
    if (path !== "/api/me") {
      let tenantId: string;
      try {
        tenantId = await ensureTenantForUser(verified.user.id, verified.user.email ?? null);
      } catch {
        return NextResponse.json({ error: "테넌트 확인 실패(DB 연결 불가)" }, { status: 503 });
      }
      const gate = await checkTenantAccess(tenantId);
      if (gate) return gate;
    }
    return NextResponse.next();
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  // 페이지 + API 모두 통과(정적 자산·이미지·favicon 제외 → 청크는 영구캐시 유지).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

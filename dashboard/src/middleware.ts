import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const authToken = process.env.DASHBOARD_AUTH_TOKEN;
  const isApi = request.nextUrl.pathname.startsWith("/api/");

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

  // Only protect API routes
  if (!isApi) return NextResponse.next();

  // Allow OPTIONS (CORS preflight)
  if (request.method === "OPTIONS") return NextResponse.next();

  // Allow Figma OAuth callback without auth
  if (request.nextUrl.pathname === "/api/figma-mcp/callback") return NextResponse.next();

  const token = request.headers.get("Authorization")?.replace("Bearer ", "") || "";

  // 운영자 토큰 = 전체 접근(대시보드)
  if (token === authToken) return NextResponse.next();

  // 인증모델 b: 테넌트 토큰(osmu_ prefix)은 데이터 라우트만 통과 → 라우트가 resolveTenantToken으로
  // 실제 검증·tenant 스코프(effectiveTenantId). Edge라 DB 조회 불가 → 여기선 형태만 보고 통과.
  // 운영자 전용 라우트(토큰 발급·워크스페이스 목록)는 테넌트 토큰 차단.
  const path = request.nextUrl.pathname;
  const OPERATOR_PATHS = ["/api/tenant-tokens", "/api/workspaces"];
  const isOperatorPath = OPERATOR_PATHS.some((p) => path.startsWith(p));
  if (token.startsWith("osmu_") && !isOperatorPath) return NextResponse.next();

  // 고객 로그인 세션(Supabase JWT, 헤더.페이로드.서명) — 데이터 라우트만 통과.
  // Edge라 서명검증 불가 → 형태만 보고 통과, 라우트가 resolveTenantBySession으로 실제 검증·스코프.
  const looksLikeJwt = token.split(".").length === 3 && token.length > 40;
  if (looksLikeJwt && !isOperatorPath) return NextResponse.next();

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  // 페이지 + API 모두 통과(정적 자산·이미지·favicon 제외 → 청크는 영구캐시 유지).
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

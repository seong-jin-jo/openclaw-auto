import { effectiveTenantId } from "@/lib/tenant-auth";
import { PROVIDERS, FACEBOOK } from "@/lib/social-connect";
import { resolveOAuthCredentialSets } from "@/lib/oauth-app-credentials";

const CREDENTIAL_STORE_UNAVAILABLE_REASON =
  "OAuth 자격증명 저장소에 일시적으로 연결할 수 없습니다. 관리자 복구 후 다시 시도해주세요.";

// GET /api/connect/readiness?tenant_id=... — 고객 UI가 "연결" 버튼을 그리기 전에 먼저 물어보는
// 서버 준비상태 계약(SNS-001/SNS-003/SNS-004). 서버 credential(OAuth 앱 ID/Secret)이 없는
// provider를 클릭 가능한 버튼으로 보여주면 고객이 누른 뒤에야 500/raw JSON을 보게 된다 —
// 그 전에 disabled + 조치 가능한 한국어 사유를 내려준다. 비밀값 자체는 절대 반환하지 않고
// env 존재 여부(boolean)만 판정한다.
//
// 이 라우트는 인증 컨텍스트(effectiveTenantId)를 거친다 — 로그인 세션/토큰 없이 tenant_id
// 쿼리만으로는 운영자 fallback 경로로만 동작(다른 라우트와 동일 패턴).
export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, new URL(request.url).searchParams.get("tenant_id"));
  if (!tenantId) return Response.json({ error: "tenant_id required" }, { status: 400 });

  const result: Record<string, { available: boolean; reason?: string }> = {};
  const credentialsByProvider = await resolveOAuthCredentialSets([
    ...Object.keys(PROVIDERS),
    "facebook",
  ]);

  for (const [name, cfg] of Object.entries(PROVIDERS)) {
    const credentials = credentialsByProvider[name];
    result[name] = credentials?.reason === "credential_store_unavailable"
      ? { available: false, reason: CREDENTIAL_STORE_UNAVAILABLE_REASON }
      : credentials?.complete
      ? { available: true }
      : { available: false, reason: `서버에 ${name} OAuth 앱 자격증명(${cfg.appIdEnv}/${cfg.appSecretEnv})이 아직 설정되지 않았습니다. 관리자에게 문의해주세요.` };
  }

  // Facebook은 config_id 모델(비즈니스용 로그인) — FB_APP_ID/SECRET 외에 FB_CONFIG_ID도 필요.
  const facebook = credentialsByProvider.facebook;
  if (facebook?.reason === "credential_store_unavailable") {
    result.facebook = { available: false, reason: CREDENTIAL_STORE_UNAVAILABLE_REASON };
  } else if (!facebook?.complete) {
    result.facebook = {
      available: false,
      reason: `서버에 Facebook OAuth 앱 자격증명(${FACEBOOK.appIdEnv}/${FACEBOOK.appSecretEnv}/${FACEBOOK.configIdEnv})이 아직 설정되지 않았거나 일부만 설정됐습니다. 관리자에게 문의해주세요.`,
    };
  } else {
    // App Dashboard에서 앱이 Development/제한 모드거나 역할이 없는 사용자는 서버에서 미리 알 수
    // 없다(SNS-004) — credential은 갖췄으나 실제 접근 가능 여부는 "확인 불가"로 정직하게 표시한다.
    result.facebook = { available: true, reason: "Meta 앱의 Development/Live 모드나 테스터 등록 여부는 서버가 미리 알 수 없습니다. 연결 시도 후 오류가 나면 Meta App Dashboard 역할/모드를 확인하세요." };
  }

  return Response.json({ providers: result });
}

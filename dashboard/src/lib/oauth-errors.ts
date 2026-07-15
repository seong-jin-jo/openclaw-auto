export function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseMaybeJsonMessage(raw: string): string {
  const text = String(raw || "").trim();
  if (!text) return "";
  try {
    const data = JSON.parse(text) as { msg?: string; message?: string; error?: string; error_description?: string };
    return data.msg || data.message || data.error_description || data.error || text;
  } catch {
    return text;
  }
}

export function oauthErrorMessage(raw: string, provider?: string): string {
  const msg = parseMaybeJsonMessage(raw);
  const p = provider ? `${provider} ` : "";

  if (/provider is not enabled|Unsupported provider/i.test(msg)) {
    if (provider && !/google/i.test(provider)) {
      return `${p}OAuth provider가 현재 서버/프로젝트에서 활성화되지 않았습니다. 앱 콘솔과 서버 설정에서 해당 provider를 켜야 합니다.`;
    }
    return "Google 로그인이 아직 설정되지 않았습니다. 관리자에게 Supabase Google provider 활성화를 요청하세요.";
  }
  if (/supabaseUrl is required|supabase.*required|auth.*url.*required/i.test(msg)) {
    return `${p}로그인 설정이 서버/환경변수에 아직 없습니다. Google 로그인이 안 되면 관리자에게 Supabase 설정을 확인해달라고 요청하세요.`;
  }
  if (/has not accepted the invite to test the app|1349245/i.test(msg)) {
    return `${p}테스트 사용자 초대를 아직 수락하지 않았습니다. Meta App Dashboard에서 테스터 초대 수락 후 다시 연결하세요.`;
  }
  if (/developer role|role.*permission|permission.*role|권한.*부족|개발자 역할/i.test(msg)) {
    return `${p}앱 권한이 부족합니다. Meta App Dashboard에서 이 계정을 개발자/테스터/관리자로 추가하고 초대를 수락해야 합니다.`;
  }
  if (/redirect_uri|redirect uri|callback/i.test(msg)) {
    return `${p}OAuth callback URL이 앱 콘솔 등록값과 다릅니다. 배포 공개 URL과 redirect URI를 같은 문자열로 맞춰야 합니다.`;
  }
  if (/permission|scope|not approved|review/i.test(msg)) {
    return `${p}필요 권한이 승인되지 않았습니다. 앱 권한, 로그인 구성, 앱 리뷰 상태를 확인하세요.`;
  }
  if (/client.*not configured|미설정|자격증명 필요/i.test(msg)) {
    return `${p}OAuth 앱 자격증명이 서버에 설정되지 않았습니다. Client ID와 Secret 환경변수를 등록해야 합니다.`;
  }
  return msg || "OAuth 연결에 실패했습니다.";
}

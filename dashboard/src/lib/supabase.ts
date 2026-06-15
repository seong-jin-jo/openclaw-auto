import { createClient, type User } from "@supabase/supabase-js";

// 고객 셀프서브 인증(Supabase Auth). 하드코딩 금지 — env(공개키라 NEXT_PUBLIC_).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// 브라우저용 — 로그인/가입. 세션은 클라가 보관하고 API 호출 시 access token을 Bearer로 첨부.
export function createBrowserSupabase() {
  return createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } });
}

// 서버용 — 클라가 보낸 access token(JWT) 검증 → 유저. anon 키로 getUser(jwt) 가능(서명 검증).
let _verifier: ReturnType<typeof createClient> | null = null;
export async function getUserFromToken(accessToken: string): Promise<User | null> {
  if (!URL || !ANON || !accessToken) return null;
  if (!_verifier) _verifier = createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await _verifier.auth.getUser(accessToken);
  if (error || !data?.user) return null;
  return data.user;
}

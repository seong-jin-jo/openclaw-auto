import { withTenant } from "@/lib/db";

// 텍스트 생성용 위키 컨텍스트 — 위키가 상한 이하면 "전체 탐색"(홀리스틱, 톤 놓침 없음),
// 초과하면 "관련 top-K 검색"으로 자동 폴백. claude -p(Max플랜 정액)라 전체주입에 돈 추가 없음.
// (이미지/영상은 이 결과로 claude가 비주얼 프롬프트를 증류 — 별도 검색 불필요)
export async function getWikiContext(
  tenantId: string, query: string, capChars = 100000,
): Promise<{ mode: "none" | "full" | "retrieval"; text: string; docs: number }> {
  if (!tenantId) return { mode: "none", text: "", docs: 0 };
  try {
    const rows = await withTenant(tenantId, (sql) => sql<{ path: string; title: string; content: string; len: number }[]>`
      SELECT path, title, content, length(content) AS len
      FROM wiki_docs WHERE tenant_id = ${tenantId} ORDER BY path`);
    if (rows.length === 0) return { mode: "none", text: "", docs: 0 };
    const total = rows.reduce((a, r) => a + Number(r.len || 0), 0);
    if (total <= capChars) {
      const text = rows.map((r) => `### ${r.title} (${r.path})\n${r.content}`).join("\n\n").slice(0, capChars);
      return { mode: "full", text, docs: rows.length };
    }
    // 위키가 상한 초과 → 글감 관련 top-K만 (대형 위키 폴백)
    const text = await retrieveWikiContext(tenantId, query, 6);
    return { mode: "retrieval", text, docs: rows.length };
  } catch {
    return { mode: "none", text: "", docs: 0 };
  }
}

// 위키 문서에서 글감과 관련된 top-K를 pg_trgm word_similarity로 검색 → 발췌 반환.
// 생성 프롬프트에 "사실 근거"로 주입. 매칭 약해도 top-K는 반환(하드컷 없음).
// (대량/시맨틱 필요 시 pgvector 코사인으로 교체 — 스키마 호환)
export async function retrieveWikiContext(tenantId: string, query: string, k = 4): Promise<string> {
  const q = (query || "").trim();
  if (!tenantId || !q) return "";
  try {
    const rows = await withTenant(tenantId, (sql) => sql<{ path: string; title: string; content: string }[]>`
      SELECT path, title, content
      FROM wiki_docs
      WHERE tenant_id = ${tenantId}
      ORDER BY word_similarity(${q}, content) DESC, updated_at DESC
      LIMIT ${k}`);
    if (rows.length === 0) return "";
    // 문서별 발췌(제목 + 본문 앞부분), 전체 길이 캡.
    return rows.map((r) => `### ${r.title} (${r.path})\n${r.content.slice(0, 1200)}`).join("\n\n").slice(0, 8000);
  } catch {
    return ""; // 위키 미연동/테이블 없음 등 → 조용히 무시(생성은 계속)
  }
}

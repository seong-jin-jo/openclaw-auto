import { withTenant } from "@/lib/db";

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

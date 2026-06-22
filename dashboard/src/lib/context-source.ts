// 외부 컨텍스트 소스(github raw / local) 본문 fetch. studio/text·sourcing의 중복 로직 통합.
// 제품-grounded 생성: 운영자(바이브코더)의 repo changelog/README/docs를 근거로 글 생성.
export interface ContextSource {
  type: "github" | "local";
  owner?: string;
  repo?: string;
  path?: string;
  ref?: string;
  token?: string;
}

export async function fetchSourceText(
  src: ContextSource,
  maxChars = 1500,
): Promise<{ text: string; error?: string }> {
  try {
    if (src.type === "github" && src.owner && src.repo && src.path) {
      const ref = src.ref || "main";
      const url = `https://raw.githubusercontent.com/${src.owner}/${src.repo}/${ref}/${src.path}`;
      const headers: Record<string, string> = {};
      if (src.token) headers.Authorization = `token ${src.token}`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        return { text: "", error: `HTTP ${res.status} — repo 접근/path/ref 확인(비공개면 token 필요)` };
      }
      return { text: (await res.text()).slice(0, maxChars) };
    }
    if (src.type === "local" && src.path) {
      const fs = await import("fs");
      const path = await import("path");
      return { text: fs.readFileSync(path.resolve(process.cwd(), src.path), "utf8").slice(0, maxChars) };
    }
    return { text: "", error: "유효하지 않은 소스(필수 필드 누락)" };
  } catch (e) {
    return { text: "", error: (e as Error).message };
  }
}

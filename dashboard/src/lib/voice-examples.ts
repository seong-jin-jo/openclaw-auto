import { readJson, dataPath } from "./file-io";

// 자기개선 보이스: 내 계정에서 실제 반응 좋았던 글을 few-shot 예시로 추출 →
// 생성 프롬프트에 주입하면 "당신처럼 말하는" 톤이 엔게이지먼트 피드백으로 매주 개선됨.
// (insights 수집이 queue.json post.engagement.views를 채운다 — overview의 viral 판정과 동일 소스)
// runWithTenant 컨텍스트 안에서 호출해야 테넌트별 queue.json을 읽는다.
interface QP {
  text?: string;
  engagement?: { views?: number; likes?: number } | null;
}

export interface VoiceExample {
  text: string;
  views: number;
  likes: number;
}

export function getTopPostExamples(limit = 3): VoiceExample[] {
  const q = readJson<{ posts: QP[] }>(dataPath("queue.json")) || { posts: [] };
  return (q.posts || [])
    .filter((p) => typeof p.text === "string" && p.text.trim().length > 0 && (p.engagement?.views ?? 0) > 0)
    .sort((a, b) => (b.engagement?.views ?? 0) - (a.engagement?.views ?? 0))
    .slice(0, Math.max(1, limit))
    .map((p) => ({
      text: (p.text as string).trim(),
      views: p.engagement?.views ?? 0,
      likes: p.engagement?.likes ?? 0,
    }));
}

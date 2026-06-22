// 브랜드 보이스 슬라이더 → 생성 프롬프트용 톤 지침 컴파일.
// 슬라이더가 불투명 프롬프트보다 신뢰받음(보이고 조절 가능). 0~100, 50=중립.
export interface VoiceTone {
  formal: number; // 격식 ↔ 구어
  humor: number; // 진지 ↔ 유머
  energy: number; // 담백 ↔ 열정
  length: number; // 짧게 ↔ 길게
}

export const DEFAULT_TONE: VoiceTone = { formal: 70, humor: 40, energy: 50, length: 40 };

export function normalizeTone(raw: unknown): VoiceTone {
  const o = (raw ?? {}) as Record<string, unknown>;
  const clamp = (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : d;
  };
  return {
    formal: clamp(o.formal, DEFAULT_TONE.formal),
    humor: clamp(o.humor, DEFAULT_TONE.humor),
    energy: clamp(o.energy, DEFAULT_TONE.energy),
    length: clamp(o.length, DEFAULT_TONE.length),
  };
}

const band = (v: number, low: string, mid: string, high: string) => (v < 34 ? low : v < 67 ? mid : high);

export function compileToneGuide(t: VoiceTone): string {
  return [
    `문체: ${band(t.formal, "정중한 존댓말", "편한 해요체", "친구에게 말하듯 구어체(가벼운 반말 톤 OK)")}`,
    `유머: ${band(t.humor, "진지하고 담담하게", "가벼운 위트 살짝", "유머·드립 적극적으로")}`,
    `에너지: ${band(t.energy, "차분하고 담백하게", "적당한 생동감", "열정적이고 강한 첫 훅")}`,
    `길이: ${band(t.length, "짧고 간결하게(2~3문장)", "보통 길이", "충분히 풀어서 설명")}`,
  ].join("\n");
}

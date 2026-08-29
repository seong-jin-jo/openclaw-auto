// 학습 정보. 여덟 칸의 정의와 저장. (docs/학습정보-층계-계약-v2.1.md §4 U3·U4·L5)
//
// 회장 지적: "왜 헤더에 학습 정보가 사라짐?" 그리고 "주관식이면 나라도 뭘 입력해야할 지를 모르겠는데".
// 그래서 이 파일은 두 가지를 한다.
//   1. 여덟 칸이 얼마나 찼는지를 한 숫자로 만든다. 헤더가 그 숫자를 항상 보여준다.
//   2. 각 칸을 카드로 고를 수 있게 후보를 미리 갖고 있는다. 빈칸을 주지 않는다.
//
// 저장은 작업 공간별 localStorage 다. 브랜드 가이드 증류(POST /api/studio/brand-setup)는
// 이 값에서 파생해 따로 보내고, 화면 진행 상태는 이 파일이 소유한다.

export type LearningSlotKey =
  | "industry"
  | "voice"
  | "audience"
  | "purpose"
  | "forbidden"
  | "palette"
  | "rights"
  | "learnedRules";

export interface LearningSlot {
  key: LearningSlotKey;
  label: string;
  layer: "U3" | "U4" | "L5";
}

// 여덟 칸. 순서가 곧 화면에 쌓이는 순서다.
export const LEARNING_SLOTS: readonly LearningSlot[] = [
  { key: "industry", label: "하는 일", layer: "U3" },
  { key: "audience", label: "말 거는 대상", layer: "U4" },
  { key: "voice", label: "말투", layer: "U3" },
  { key: "purpose", label: "이번에 노리는 것", layer: "U4" },
  { key: "forbidden", label: "쓰지 않을 표현", layer: "U3" },
  { key: "palette", label: "브랜드 색", layer: "U3" },
  { key: "rights", label: "소재 권리", layer: "U3" },
  { key: "learnedRules", label: "성과에서 배운 규칙", layer: "L5" },
] as const;

export const LEARNING_SLOT_TOTAL = LEARNING_SLOTS.length;

export type LearningInfo = Partial<Record<LearningSlotKey, string>>;

export interface LearningCard {
  id: string;
  title: string;
  /** 카드 본문. 설명이 아니라 그 선택이 만들어 낼 실제 문장 한 줄이다. */
  sample: string;
}

/** 걸음 1. 무엇을 하는 곳입니까. */
export const INDUSTRY_CARDS: readonly LearningCard[] = [
  { id: "education", title: "교육·강의", sample: "배우고 싶은 사람에게 강의와 배움을 파는 곳" },
  { id: "app", title: "앱·서비스", sample: "앱이나 웹 서비스를 만들어 쓰게 하는 곳" },
  { id: "food", title: "식음료·카페", sample: "먹고 마시는 것을 직접 만들어 파는 곳" },
  { id: "beauty", title: "뷰티·미용", sample: "얼굴과 몸을 다듬어 주는 곳" },
  { id: "commerce", title: "쇼핑몰·커머스", sample: "물건을 골라 담아 파는 곳" },
  { id: "estate", title: "부동산·인테리어", sample: "사는 공간을 찾아 주고 고쳐 주는 곳" },
  { id: "health", title: "운동·건강", sample: "몸을 움직여 건강해지게 돕는 곳" },
  { id: "finance", title: "금융·재테크", sample: "돈을 굴리고 지키는 법을 다루는 곳" },
  { id: "travel", title: "여행·숙박", sample: "떠나고 머무는 일을 준비해 주는 곳" },
  { id: "pet", title: "반려동물", sample: "같이 사는 동물을 위한 것을 다루는 곳" },
  { id: "local", title: "동네 가게", sample: "가까운 손님이 걸어와 이용하는 곳" },
  { id: "b2b", title: "기업 상대 일", sample: "회사를 손님으로 두고 일하는 곳" },
] as const;

/** 걸음 2. 누구에게 말합니까. 카드 본문이 그 대상에게 실제로 쓴 문장이다. */
export const AUDIENCE_CARDS: readonly LearningCard[] = [
  { id: "starter", title: "처음 해 보는 사람", sample: "뭐부터 해야 할지 모르겠다면, 오늘은 이거 하나만 하세요." },
  { id: "solo", title: "혼자 일하는 사장", sample: "사람 더 못 뽑는 상황에서, 하루를 두 시간 줄이는 방법입니다." },
  { id: "veteran", title: "이미 잘하는 사람", sample: "아시는 내용은 건너뛰고, 놓치기 쉬운 한 지점만 짚습니다." },
  { id: "parent", title: "아이를 키우는 사람", sample: "아이 재우고 나서 십 분이면 됩니다." },
  { id: "youth", title: "이십 대", sample: "지금 시작해도 안 늦었습니다. 오늘 첫 칸만 채워요." },
  { id: "company", title: "회사 담당자", sample: "결재 올리실 때 근거로 쓰실 수 있게 숫자부터 적었습니다." },
] as const;

/** 걸음 3. 어떤 결로 말합니까. 같은 내용을 그 말투로 쓴 견본이다. */
export const VOICE_CARDS: readonly LearningCard[] = [
  { id: "calm", title: "차분하게", sample: "천천히 보셔도 됩니다. 순서대로 하면 됩니다." },
  { id: "friendly", title: "친하게", sample: "이거 진짜 편해요. 한 번만 해 보면 아실 거예요." },
  { id: "crisp", title: "짧고 단단하게", sample: "세 줄로 끝냅니다. 첫째, 오늘 하나만 바꿉니다." },
  { id: "expert", title: "전문가처럼", sample: "결론부터 말씀드리면, 이 방식이 평균 대비 이십 퍼센트 빠릅니다." },
  { id: "warm", title: "따뜻하게", sample: "오늘 하루도 고생하셨습니다. 잠깐 쉬면서 보세요." },
  { id: "playful", title: "가볍고 재밌게", sample: "이거 모르면 손해예요. 진짜로요." },
] as const;

/** 걸음 4. 이번에 노리는 것. */
export const PURPOSE_CARDS: readonly LearningCard[] = [
  { id: "awareness", title: "알리기", sample: "우리를 모르던 사람이 이름을 기억하게 한다" },
  { id: "trust", title: "믿게 하기", sample: "이미 아는 사람이 믿을 만하다고 느끼게 한다" },
  { id: "inquiry", title: "문의 받기", sample: "궁금한 사람이 말을 걸어오게 한다" },
  { id: "visit", title: "찾아오게 하기", sample: "직접 방문하거나 예약하게 한다" },
  { id: "sale", title: "사게 하기", sample: "지금 결제까지 가게 한다" },
  { id: "retain", title: "다시 오게 하기", sample: "이미 산 사람이 한 번 더 오게 한다" },
] as const;

export const LEARNING_CARDS: Partial<Record<LearningSlotKey, readonly LearningCard[]>> = {
  industry: INDUSTRY_CARDS,
  audience: AUDIENCE_CARDS,
  voice: VOICE_CARDS,
  purpose: PURPOSE_CARDS,
};

export function learningStorageKey(workspaceId: string): string {
  return `studio_learning:${workspaceId}`;
}

export function readLearningInfo(workspaceId: string): LearningInfo {
  if (!workspaceId) return {};
  try {
    const raw = localStorage.getItem(learningStorageKey(workspaceId));
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([key, value]) => typeof value === "string" && value.trim() && LEARNING_SLOTS.some((slot) => slot.key === key)),
    ) as LearningInfo;
  } catch {
    return {};
  }
}

export function writeLearningInfo(workspaceId: string, info: LearningInfo): void {
  if (!workspaceId) return;
  try {
    localStorage.setItem(learningStorageKey(workspaceId), JSON.stringify(info));
  } catch {
    /* 저장소가 막혀 있으면 이번 화면 상태만 유지한다 */
  }
}

/** 채워진 칸 수. 헤더가 보여 주는 그 숫자다. */
export function countFilledLearningSlots(info: LearningInfo, extras: { guide?: string } = {}): number {
  const filled = LEARNING_SLOTS.filter((slot) => (info[slot.key] || "").trim()).length;
  // 저장소가 비어 있어도 브랜드 가이드가 이미 증류돼 있으면 "하는 일" 한 칸은 찬 것으로 센다.
  if (!filled && extras.guide?.trim()) return 1;
  return filled;
}

export function missingLearningSlots(info: LearningInfo): LearningSlot[] {
  return LEARNING_SLOTS.filter((slot) => !(info[slot.key] || "").trim());
}

export function cardById(cards: readonly LearningCard[], id: string | undefined): LearningCard | null {
  return cards.find((card) => card.id === id) ?? null;
}

/** 고른 카드에서 브랜드 가이드 증류에 보낼 답변을 만든다. 고객은 이 문장을 직접 쓰지 않는다. */
export function learningToBrandAnswers(info: LearningInfo): Record<string, string> {
  return {
    service: info.industry || "",
    target: info.audience || "",
    tone: info.voice || "",
    banned: info.forbidden || "",
    hooks: info.purpose || "",
    visual: info.palette || "",
  };
}

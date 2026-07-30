import { CHANNEL_TEXT_LIMITS, countTextCharacters } from "@/lib/channel-text-limits";

export async function POST(request: Request) {
  const data = await request.json();
  const text = (data.text || "") as string;
  const channels = (data.channels || []) as string[];
  const imageUrl = data.imageUrl as string | undefined;
  const hashtags = (data.hashtags || []) as string[];

  const warnings: Array<{ type: string; message: string }> = [];
  const suggestions: string[] = [];

  // 텍스트 길이
  if (!text || text.length < 30) {
    warnings.push({ type: "too_short", message: "글이 너무 짧습니다 (30자 미만)" });
  } else if (text.length < 80) {
    suggestions.push("80자 이상이면 참여율이 높아집니다");
  }

  // 채널별 글자수
  const textLength = countTextCharacters(text);
  for (const ch of channels) {
    const limit = CHANNEL_TEXT_LIMITS[ch as keyof typeof CHANNEL_TEXT_LIMITS];
    if (limit && textLength > limit) {
      warnings.push({ type: "over_limit", message: `${ch} 글자수 초과 (${textLength}/${limit})` });
    }
  }

  // 해시태그
  if (hashtags.length === 0) {
    suggestions.push("해시태그 3~5개 추가를 권장합니다");
  } else if (hashtags.length > 15) {
    suggestions.push("해시태그가 너무 많습니다 (10개 이하 권장)");
  }

  // 비주얼 채널 이미지
  const VISUAL = ["instagram", "pinterest", "tiktok", "youtube"];
  for (const ch of channels) {
    if (VISUAL.includes(ch) && !imageUrl) {
      warnings.push({ type: "no_image", message: `${ch}은(는) 이미지가 필수입니다` });
    }
  }

  // 톤 체크
  if (text === text.toUpperCase() && text.length > 20) {
    suggestions.push("전체 대문자는 공격적으로 보일 수 있습니다");
  }
  if ((text.match(/[!]{2,}/g) || []).length > 0) {
    suggestions.push("느낌표 중복 사용은 자제해주세요");
  }

  return Response.json({
    valid: warnings.length === 0,
    warnings,
    suggestions,
  });
}

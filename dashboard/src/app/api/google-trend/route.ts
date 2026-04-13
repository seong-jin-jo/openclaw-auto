export async function POST() {
  return Response.json({
    error: "Google Trends API는 Alpha 단계입니다. trends.google.com/trends/explore?geo=KR 에서 직접 확인하세요.",
    results: [],
    webUrl: "https://trends.google.com/trends/explore?geo=KR&cat=958",
  });
}

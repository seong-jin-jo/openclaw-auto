export async function POST(request: Request) {
  const clientId = process.env.NAVER_CLIENT_ID || "";
  const clientSecret = process.env.NAVER_CLIENT_SECRET || "";
  if (!clientId || !clientSecret) {
    return Response.json({
      error: "네이버 개발자센터 API 키 필요: NAVER_CLIENT_ID, NAVER_CLIENT_SECRET (.env에 추가)",
      results: [],
    });
  }

  const data = await request.json();
  const keywords: string[] = data.keywords || [];
  if (!keywords.length) {
    return Response.json({ error: "keywords required", results: [] });
  }

  try {
    const endDate = new Date().toISOString().split("T")[0];
    const startDate = new Date(Date.now() - 90 * 86400000).toISOString().split("T")[0];

    const res = await fetch("https://openapi.naver.com/v1/datalab/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
      body: JSON.stringify({
        startDate,
        endDate,
        timeUnit: "week",
        keywordGroups: keywords.slice(0, 5).map((kw) => ({ groupName: kw, keywords: [kw] })),
      }),
      signal: AbortSignal.timeout(10000),
    });
    const result = await res.json();

    const results: Record<string, unknown>[] = [];
    for (const group of result.results || []) {
      results.push({
        title: group.title || "",
        data: (group.data || []).map((d: { period?: string; ratio?: number }) => ({
          period: d.period || "",
          ratio: d.ratio || 0,
        })),
      });
    }
    return Response.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg, results: [] });
  }
}

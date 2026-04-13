import crypto from "crypto";
import { readJson, configPath } from "@/lib/file-io";

interface OpenClawConfig {
  plugins?: {
    entries?: Record<string, { config?: Record<string, string> }>;
  };
}

export async function POST(request: Request) {
  const config = readJson<OpenClawConfig>(configPath("openclaw.json")) || {};
  const seoCfg = config.plugins?.entries?.["seo-keywords"]?.config || {};
  const clientId = seoCfg.naverClientId || process.env.NAVER_SEARCHAD_CLIENT_ID || "";
  const clientSecret = seoCfg.naverClientSecret || process.env.NAVER_SEARCHAD_CLIENT_SECRET || "";
  const customerId = seoCfg.naverCustomerId || process.env.NAVER_SEARCHAD_CUSTOMER_ID || "";

  if (!clientId || !clientSecret || !customerId) {
    return Response.json({
      error: "네이버 검색광고 API 키가 설정되지 않았습니다. Settings에서 설정하거나 .env에 NAVER_SEARCHAD_* 환경변수를 추가하세요.",
      results: [],
    });
  }

  const data = await request.json();
  const keywords: string[] = data.keywords || [];
  if (!keywords.length) {
    return Response.json({ error: "keywords required", results: [] });
  }

  try {
    const timestamp = String(Date.now());
    const method = "GET";
    const uri = "/keywordstool";
    const message = `${timestamp}.${method}.${uri}`;
    const signature = crypto.createHmac("sha256", clientSecret).update(message).digest("base64");

    const params = new URLSearchParams({
      hintKeywords: keywords.slice(0, 5).join(","),
      showDetail: "1",
    });

    const res = await fetch(`https://api.searchad.naver.com${uri}?${params}`, {
      headers: {
        "X-Timestamp": timestamp,
        "X-API-KEY": clientId,
        "X-Customer": customerId,
        "X-Signature": signature,
      },
      signal: AbortSignal.timeout(10000),
    });
    const result = await res.json();

    const results: Record<string, unknown>[] = [];
    for (const kw of result.keywordList || []) {
      const pc = typeof kw.monthlyPcQcCnt === "number" ? kw.monthlyPcQcCnt : 0;
      const mobile = typeof kw.monthlyMobileQcCnt === "number" ? kw.monthlyMobileQcCnt : 0;
      results.push({
        keyword: kw.relKeyword || "",
        pcSearches: pc,
        mobileSearches: mobile,
        totalSearches: pc + mobile,
        competition: kw.compIdx || "",
      });
    }
    results.sort((a, b) => (b.totalSearches as number) - (a.totalSearches as number));

    return Response.json({ results, total: results.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg, results: [] });
  }
}

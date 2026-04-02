import crypto from "node:crypto";
import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import { optionalStringEnum } from "openclaw/plugin-sdk/core";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const NAVER_SEARCHAD_API = "https://api.searchad.naver.com";

type SeoConfig = {
  naverClientId?: string;
  naverClientSecret?: string;
  naverCustomerId?: string;
};

function resolveConfig(api: OpenClawPluginApi): {
  clientId: string;
  clientSecret: string;
  customerId: string;
} {
  const pluginCfg = (api.pluginConfig ?? {}) as SeoConfig;
  const clientId =
    (typeof pluginCfg.naverClientId === "string" && pluginCfg.naverClientId.trim()) ||
    process.env.NAVER_SEARCHAD_CLIENT_ID ||
    "";
  const clientSecret =
    (typeof pluginCfg.naverClientSecret === "string" && pluginCfg.naverClientSecret.trim()) ||
    process.env.NAVER_SEARCHAD_CLIENT_SECRET ||
    "";
  const customerId =
    (typeof pluginCfg.naverCustomerId === "string" && pluginCfg.naverCustomerId.trim()) ||
    process.env.NAVER_SEARCHAD_CUSTOMER_ID ||
    "";
  if (!clientId || !clientSecret || !customerId) {
    throw new Error(
      "Naver Search Ad API credentials not configured. Set NAVER_SEARCHAD_CLIENT_ID, NAVER_SEARCHAD_CLIENT_SECRET, NAVER_SEARCHAD_CUSTOMER_ID env vars or configure in plugin settings.",
    );
  }
  return { clientId, clientSecret, customerId };
}

function generateSignature(timestamp: string, method: string, uri: string, secretKey: string): string {
  const message = `${timestamp}.${method}.${uri}`;
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  return hmac.digest("base64");
}

type KeywordResult = {
  keyword: string;
  monthlyPcQcCnt: number;
  monthlyMobileQcCnt: number;
  totalSearchCount: number;
  compIdx: string;
};

async function fetchKeywordStats(
  keywords: string[],
  config: { clientId: string; clientSecret: string; customerId: string },
): Promise<KeywordResult[]> {
  const timestamp = String(Date.now());
  const method = "GET";
  const uri = "/keywordstool";
  const signature = generateSignature(timestamp, method, uri, config.clientSecret);

  const params = new URLSearchParams({
    hintKeywords: keywords.join(","),
    showDetail: "1",
  });

  const resp = await fetch(`${NAVER_SEARCHAD_API}${uri}?${params}`, {
    method: "GET",
    headers: {
      "X-Timestamp": timestamp,
      "X-API-KEY": config.clientId,
      "X-Customer": config.customerId,
      "X-Signature": signature,
    },
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Naver Search Ad API failed (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as {
    keywordList: Array<{
      relKeyword: string;
      monthlyPcQcCnt: number | string;
      monthlyMobileQcCnt: number | string;
      compIdx: string;
    }>;
  };

  return data.keywordList.map((kw) => {
    const pc = typeof kw.monthlyPcQcCnt === "number" ? kw.monthlyPcQcCnt : parseInt(String(kw.monthlyPcQcCnt)) || 0;
    const mobile = typeof kw.monthlyMobileQcCnt === "number" ? kw.monthlyMobileQcCnt : parseInt(String(kw.monthlyMobileQcCnt)) || 0;
    return {
      keyword: kw.relKeyword,
      monthlyPcQcCnt: pc,
      monthlyMobileQcCnt: mobile,
      totalSearchCount: pc + mobile,
      compIdx: kw.compIdx || "low",
    };
  });
}

const SeoKeywordsToolSchema = Type.Object(
  {
    action: optionalStringEnum(["analyze"] as const, {
      description: '"analyze": Analyze keyword search volume and competition via Naver Search Ad API.',
    }),
    keywords: Type.Array(Type.String(), {
      description: "Keywords to analyze (max 5 at a time).",
    }),
  },
  { additionalProperties: false },
);

export function createSeoKeywordsTool(api: OpenClawPluginApi) {
  return {
    name: "seo_keywords",
    label: "SEO Keywords",
    description:
      "Analyze keyword search volume and competition using Naver Search Ad API. Returns monthly search counts (PC + mobile) and competition index for each keyword and related keywords.",
    parameters: SeoKeywordsToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action", { required: true });
      const keywordsParam = rawParams.keywords;
      if (!Array.isArray(keywordsParam) || keywordsParam.length === 0) {
        throw new Error("keywords must be a non-empty array of strings.");
      }
      const keywords = keywordsParam.map(String).slice(0, 5);

      switch (action) {
        case "analyze": {
          const config = resolveConfig(api);
          const results = await fetchKeywordStats(keywords, config);

          // Sort by total search count descending
          results.sort((a, b) => b.totalSearchCount - a.totalSearchCount);

          // Top keywords for SEO recommendation
          const topKeywords = results.slice(0, 10);
          const lowCompetition = results
            .filter((r) => r.compIdx === "low" || r.compIdx === "낮음")
            .slice(0, 5);

          return jsonResult({
            totalResults: results.length,
            topBySearchVolume: topKeywords,
            lowCompetitionKeywords: lowCompetition,
            allResults: results,
            recommendation:
              lowCompetition.length > 0
                ? `Low competition keywords with search volume: ${lowCompetition.map((k) => k.keyword).join(", ")}`
                : "Consider using long-tail keywords for lower competition.",
          });
        }

        default:
          throw new Error(`Unknown action: ${action}. Use "analyze".`);
      }
    },
  };
}

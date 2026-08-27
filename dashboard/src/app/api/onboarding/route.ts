import { readJson, writeJson, readText, writeText, dataPath, configPath, sharedDataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { withTenant } from "@/lib/db";
import path from "path";

type ContentBranch = "text_image" | "video";

interface SettingsJson {
  onboardingComplete?: boolean;
  industry?: string;
  contentBranch?: ContentBranch;
  analyticsViewed?: boolean;
  [key: string]: unknown;
}

interface OpenClawCfg {
  plugins?: { entries?: Record<string, { enabled?: boolean }> };
}

// openclaw.json에서 enabled된 publish 플러그인이 하나라도 있으면 채널 연결됨으로 간주.
function hasConnectedChannel(): boolean {
  const cfg = readJson<OpenClawCfg>(configPath("openclaw.json"));
  const entries = cfg?.plugins?.entries || {};
  return Object.entries(entries).some(([name, p]) => name.endsWith("-publish") && p?.enabled === true);
}

const VALID_INDUSTRIES = [
  "cafe",
  "beauty",
  "restaurant",
  "fitness",
  "shopping",
  "tech",
  "education",
  "general",
];
const VALID_CONTENT_BRANCHES: ContentBranch[] = ["text_image", "video"];

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  // 파일 기반 신호(설정·채널)는 runWithTenant 안에서 읽는다.
  const fileSignals = runWithTenant(tenantId, () => {
    const settings = readJson<SettingsJson>(dataPath("settings.json"));
    return {
      completed: settings?.onboardingComplete === true,
      industry: settings?.industry,
      contentBranch: settings?.contentBranch,
      channelConnected: hasConnectedChannel(),
      analyticsViewed: settings?.analyticsViewed === true,
    };
  });

  // DB 카운트(위키·발행·OAuth 연결 채널)는 withTenant. 폴링되므로 실패 시 파일 신호로 폴백.
  let wikiCount = 0;
  let publishCount = 0;
  let generationCount = 0;
  let dbChannelConnected = false;
  if (tenantId) {
    try {
      const counts = await withTenant(tenantId, async (sql) => {
        const [w] = await sql<{ c: number }[]>`SELECT count(*)::int AS c FROM wiki_docs`;
        const [p] = await sql<{ c: number }[]>`SELECT count(*)::int AS c FROM published_posts`;
        const [g] = await sql<{ c: number }[]>`SELECT count(*)::int AS c FROM studio_generation_jobs`;
        // OAuth로 연결한 채널은 openclaw.json이 아니라 integrations(kind='channel')에 저장된다.
        // 파일 기반 hasConnectedChannel()만 보면 OAuth 연결 고객의 온보딩 체크리스트가 영원히 미완으로 표시됨.
        const [i] = await sql<{ c: number }[]>`SELECT count(*)::int AS c FROM integrations WHERE kind = 'channel'`;
        return { wiki: w.c, pub: p.c, generations: g.c, integrations: i.c };
      });
      wikiCount = counts.wiki;
      publishCount = counts.pub;
      generationCount = counts.generations;
      dbChannelConnected = counts.integrations > 0;
    } catch { /* DB 미연결: 파일 신호로 폴백(온보딩 자체는 깨지지 않게) */ }
  }

  const channelConnected = fileSignals.channelConnected || dbChannelConnected;

  return Response.json({
    ...fileSignals,
    channelConnected,
    wikiCount,
    publishCount,
    generationCount,
    checklist: {
      created: generationCount > 0,
      channel: channelConnected,
      published: publishCount > 0,
      analytics: fileSignals.analyticsViewed,
    },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { industry, channels, contentBranch } = body as {
    industry?: string;
    channels?: string[];
    contentBranch?: ContentBranch;
  };

  if (!industry || !VALID_INDUSTRIES.includes(industry)) {
    return Response.json(
      { error: "Invalid industry. Must be one of: " + VALID_INDUSTRIES.join(", ") },
      { status: 400 }
    );
  }

  if (contentBranch !== undefined && !VALID_CONTENT_BRANCHES.includes(contentBranch)) {
    return Response.json(
      { error: "Invalid content branch" },
      { status: 400 }
    );
  }

  const hasLegacyChannelSelection = Array.isArray(channels) && channels.length > 0;
  if (!hasLegacyChannelSelection && !contentBranch) {
    return Response.json(
      { error: "At least one channel must be selected" },
      { status: 400 }
    );
  }

  // 업종 템플릿은 공유(sharedDataPath), 복사 결과물은 테넌트별(dataPath, runWithTenant 안).
  const templatesDir = path.resolve(sharedDataPath("templates"));
  const promptGuide = readText(path.join(templatesDir, `${industry}.prompt-guide.txt`));
  const searchKeywords = readText(path.join(templatesDir, `${industry}.search-keywords.txt`));

  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => {
    if (promptGuide) writeText(dataPath("prompt-guide.txt"), promptGuide);
    if (searchKeywords) writeText(dataPath("search-keywords.txt"), searchKeywords);

    const existing = readJson<SettingsJson>(dataPath("settings.json")) || {};
    existing.onboardingComplete = true;
    existing.industry = industry;
    existing.contentBranch = contentBranch;
    existing.channels = channels ?? [];
    writeJson(dataPath("settings.json"), existing);

    return Response.json({ ok: true });
  });
}

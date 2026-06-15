import { readJson, writeJson, readText, writeText, dataPath, sharedDataPath } from "@/lib/file-io";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import path from "path";

interface SettingsJson {
  onboardingComplete?: boolean;
  industry?: string;
  [key: string]: unknown;
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

export async function GET(request: Request) {
  const tenantId = await effectiveTenantId(request, null);
  return runWithTenant(tenantId, () => {
    const settings = readJson<SettingsJson>(dataPath("settings.json"));
    return Response.json({
      completed: settings?.onboardingComplete === true,
      industry: settings?.industry,
    });
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { industry, channels } = body as {
    industry?: string;
    channels?: string[];
  };

  if (!industry || !VALID_INDUSTRIES.includes(industry)) {
    return Response.json(
      { error: "Invalid industry. Must be one of: " + VALID_INDUSTRIES.join(", ") },
      { status: 400 }
    );
  }

  if (!channels || !Array.isArray(channels) || channels.length === 0) {
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
    existing.channels = channels;
    writeJson(dataPath("settings.json"), existing);

    return Response.json({ ok: true });
  });
}

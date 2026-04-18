import { readJson, writeJson, readText, writeText, dataPath } from "@/lib/file-io";
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

export async function GET() {
  const settings = readJson<SettingsJson>(dataPath("settings.json"));
  return Response.json({
    completed: settings?.onboardingComplete === true,
    industry: settings?.industry,
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

  // Copy template files to data/
  const templatesDir = path.resolve(dataPath("templates"));
  const promptGuide = readText(path.join(templatesDir, `${industry}.prompt-guide.txt`));
  const searchKeywords = readText(path.join(templatesDir, `${industry}.search-keywords.txt`));

  if (promptGuide) {
    writeText(dataPath("prompt-guide.txt"), promptGuide);
  }
  if (searchKeywords) {
    writeText(dataPath("search-keywords.txt"), searchKeywords);
  }

  // Update settings.json
  const existing = readJson<SettingsJson>(dataPath("settings.json")) || {};
  existing.onboardingComplete = true;
  existing.industry = industry;
  existing.channels = channels;
  writeJson(dataPath("settings.json"), existing);

  return Response.json({ ok: true });
}

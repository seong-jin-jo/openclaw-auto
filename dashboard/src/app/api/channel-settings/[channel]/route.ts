import { readJson, writeJson, dataPath, configPath } from "@/lib/file-io";
import { AUTOMATION_FEATURES } from "@/lib/constants";

interface ChannelSettingsData {
  [channel: string]: Record<string, boolean>;
}

// feature key → cron job name 매핑
const FEATURE_TO_CRON: Record<string, Record<string, string>> = {
  threads: {
    content_generation: "threads-generate-drafts",
    auto_publish: "threads-auto-publish",
    insights_collection: "threads-collect-insights",
    auto_like_replies: "threads-collect-insights",
    low_engagement_cleanup: "threads-collect-insights",
    trending_collection: "threads-fetch-trending",
    follower_tracking: "threads-track-growth",
    trending_rewrite: "threads-rewrite-trending",
  },
  instagram: {
    content_generation: "instagram-generate-drafts",
    auto_publish: "instagram-auto-publish",
  },
};

function readChannelSettings(): ChannelSettingsData {
  const data: ChannelSettingsData = readJson<ChannelSettingsData>(dataPath("channel-settings.json")) || {};
  for (const ch of ["threads", "x", "instagram"]) {
    if (!data[ch]) data[ch] = {};
    for (const f of AUTOMATION_FEATURES) {
      if (!(f.key in data[ch])) {
        data[ch][f.key] = f.default;
      }
    }
  }
  return data;
}

export async function GET(_request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const data = readChannelSettings();
  return Response.json(data[channel] || {});
}

export async function POST(request: Request, { params }: { params: Promise<{ channel: string }> }) {
  const { channel } = await params;
  const body = await request.json();
  const data = readChannelSettings();
  const validKeys = new Set(AUTOMATION_FEATURES.map((f) => f.key));

  if (!data[channel]) data[channel] = {};
  for (const [k, v] of Object.entries(body)) {
    if (validKeys.has(k) && typeof v === "boolean") {
      data[channel][k] = v;
    }
  }

  writeJson(dataPath("channel-settings.json"), data);

  // jobs.json의 해당 크론잡 enabled도 동기화
  const cronMap = FEATURE_TO_CRON[channel] || {};
  const jobsPath = configPath("cron", "jobs.json");
  const jobsData = readJson<{ jobs: Array<Record<string, unknown>> }>(jobsPath);
  if (jobsData?.jobs) {
    const updatedCrons = new Set<string>();
    for (const [featureKey, cronName] of Object.entries(cronMap)) {
      if (featureKey in body && !updatedCrons.has(cronName)) {
        // 같은 크론을 공유하는 feature가 여러 개면, 하나라도 ON이면 크론 유지
        const sharingFeatures = Object.entries(cronMap).filter(([, cn]) => cn === cronName).map(([fk]) => fk);
        const anyEnabled = sharingFeatures.some((fk) => data[channel][fk]);

        for (const job of jobsData.jobs) {
          if (job.name === cronName) {
            job.enabled = anyEnabled;
          }
        }
        updatedCrons.add(cronName);
      }
    }
    writeJson(jobsPath, jobsData);
  }

  return Response.json({ ok: true, settings: data[channel] });
}

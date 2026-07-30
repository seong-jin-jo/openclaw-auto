import { readJson, writeJson, dataPath } from "@/lib/file-io";
import path from "path";
import { effectiveTenantId } from "@/lib/tenant-auth";
import { runWithTenant } from "@/lib/tenant-context";
import { withTenant } from "@/lib/db";

interface DailyUsage {
  aiGenerations: number;
  publications: number;
  cronRuns: number;
  apiCalls: number;
}

interface UsageFile {
  daily: Record<string, DailyUsage>;
}

const VALID_EVENTS = ["aiGeneration", "publication", "cronRun", "apiCall", "shortsGeneration", "shortsVideoMinute"] as const;
type EventType = (typeof VALID_EVENTS)[number];

const EVENT_TO_FIELD: Record<EventType, keyof DailyUsage> = {
  aiGeneration: "aiGenerations",
  publication: "publications",
  cronRun: "cronRuns",
  apiCall: "apiCalls",
  shortsGeneration: "aiGenerations",  // treat as generation for now
  shortsVideoMinute: "publications",   // reuse or extend later; for hybrid usage
};

function emptyDay(): DailyUsage {
  return { aiGenerations: 0, publications: 0, cronRuns: 0, apiCalls: 0 };
}

export async function POST(req: Request) {
  // 테넌트 컨텍스트로 감싸 파일 격리 (본문 로직 불변)
  const __t = await effectiveTenantId(req, null);
  return runWithTenant(__t, async () => {
  let body: { event?: string; count?: number };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = body.event as EventType;
  if (!event || !VALID_EVENTS.includes(event)) {
    return Response.json(
      { error: `Invalid event. Must be one of: ${VALID_EVENTS.join(", ")}` },
      { status: 400 },
    );
  }

  const count = typeof body.count === "number" && body.count > 0 ? body.count : 1;

  // usage_events가 테넌트 사용량의 정본이다. 아래 usage.json은 기존 cron/로컬 도구 하위호환용
  // legacy mirror로 당분간 유지하며, 대시보드 GET은 이 파일을 읽지 않는다.
  if (__t) {
    try {
      await withTenant(__t, (sql) => sql`
        INSERT INTO usage_events (tenant_id, event_type, quantity, meta)
        VALUES (${__t}, ${event}, ${count}, ${sql.json({ source: "usage-record-api" })})`);
    } catch {
      return Response.json(
        { error: "사용량 DB 원장 기록에 실패했습니다.", source: "usage_events" },
        { status: 503 },
      );
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const field = EVENT_TO_FIELD[event];
  let legacyValue: number | null = null;
  try {
    const filePath = path.join(dataPath(""), "usage.json");
    const data = readJson<UsageFile>(filePath) || { daily: {} };
    if (!data.daily) data.daily = {};
    if (!data.daily[todayStr]) {
      data.daily[todayStr] = emptyDay();
    }
    data.daily[todayStr][field] += count;
    legacyValue = data.daily[todayStr][field];

    // Prune entries older than 90 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    for (const dateStr of Object.keys(data.daily)) {
      if (dateStr < cutoffStr) {
        delete data.daily[dateStr];
      }
    }
    writeJson(filePath, data);
  } catch {
    // legacy mirror 실패는 DB 정본 기록을 뒤집지 않는다. 재시도로 같은 usage_event가 이중 기록되는
    // 것보다 오래된 파일 mirror 한 건이 비는 편이 안전하며, GET 화면은 DB만 읽는다.
  }

  return Response.json({
    ok: true,
    source: __t ? "usage_events" : "legacy-only",
    date: todayStr,
    field,
    newValue: legacyValue,
  });
  });
}

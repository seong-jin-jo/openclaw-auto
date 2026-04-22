import { readJson, writeJson, dataPath } from "@/lib/file-io";

interface ErrorEntry {
  id: string;
  source: "cron" | "api" | "ui";
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

interface ErrorLog {
  errors: ErrorEntry[];
}

const MAX_ENTRIES = 200;

function getErrorLog(): ErrorLog {
  return readJson<ErrorLog>(dataPath("error-log.json")) || { errors: [] };
}

export async function GET() {
  const log = getErrorLog();
  const now = Date.now();
  const last24h = log.errors.filter(
    (e) => now - new Date(e.timestamp).getTime() < 24 * 60 * 60 * 1000
  ).length;

  return Response.json({
    errors: log.errors,
    total: log.errors.length,
    last24h,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { source, message, stack, context } = body as {
    source?: string;
    message?: string;
    stack?: string;
    context?: Record<string, unknown>;
  };

  if (!source || !message) {
    return Response.json({ error: "source and message required" }, { status: 400 });
  }

  const log = getErrorLog();
  const entry: ErrorEntry = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    source: source as ErrorEntry["source"],
    message,
    stack,
    context,
    timestamp: new Date().toISOString(),
  };

  log.errors.unshift(entry);
  if (log.errors.length > MAX_ENTRIES) {
    log.errors = log.errors.slice(0, MAX_ENTRIES);
  }

  writeJson(dataPath("error-log.json"), log);

  return Response.json({ ok: true, id: entry.id });
}

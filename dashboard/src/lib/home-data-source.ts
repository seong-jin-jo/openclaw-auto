export type HomeDataSource = "db" | "file" | "shadow";

// DB is the cutover default. HOME_DATA_SOURCE=file is the explicit, reversible
// rollback switch. SHADOW_HOME_DB=1 preserves the FDD's observation mode and
// serves the legacy response while logging a field-level comparison.
export function homeDataSource(env: NodeJS.ProcessEnv = process.env): HomeDataSource {
  if (env.SHADOW_HOME_DB === "1") return "shadow";
  return env.HOME_DATA_SOURCE === "file" ? "file" : "db";
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, child]) => [key, stable(child)]),
  );
}

export function logHomeShadowDiff(
  route: string,
  tenantId: string,
  fileValue: unknown,
  dbValue: unknown,
): boolean {
  const file = stable(fileValue);
  const db = stable(dbValue);
  const matches = JSON.stringify(file) === JSON.stringify(db);
  console.info("[home-data-shadow]", JSON.stringify({ route, tenantId, matches, file, db }));
  return matches;
}

export function homeDbUnavailable(error: unknown): Response {
  console.error("[home-data-db]", error instanceof Error ? error.message : String(error));
  return Response.json(
    {
      error: "홈 데이터베이스를 읽지 못했습니다.",
      code: "home_db_unavailable",
      retryable: true,
    },
    { status: 503 },
  );
}

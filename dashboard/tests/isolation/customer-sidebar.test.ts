import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const sidebar = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/layout/Sidebar.tsx"),
  "utf8",
);
const overviewHook = fs.readFileSync(
  path.resolve(process.cwd(), "src/hooks/useOverview.ts"),
  "utf8",
);

describe("customer sidebar isolation", () => {
  it("fetches and renders operator cron status only for operators", () => {
    expect(sidebar).toContain('const isOperator = me?.isOperator === true;');
    expect(sidebar).toContain("useCronStatus(isOperator)");
    expect(sidebar).toContain("{isOperator && (");
    expect(overviewHook).toContain('enabled ? "/api/cron-status" : null');
  });
});

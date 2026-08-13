import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const sidebar = fs.readFileSync(
  path.resolve(process.cwd(), "src/components/layout/Sidebar.tsx"),
  "utf8",
);
describe("customer sidebar isolation", () => {
  it("routes resolved identities into separate operator and customer shells", () => {
    expect(sidebar).toContain("function OperatorSidebar()");
    expect(sidebar).toContain("function CustomerSidebar(");
    expect(sidebar).toContain("if (me.isOperator) return <OperatorSidebar />");
    expect(sidebar).not.toContain("useCronStatus");
  });

  it("keeps video publishing separate from text scheduling and links each provider to its own channel page", () => {
    expect(sidebar).toContain("CHANNEL_GROUPS.map");
    expect(sidebar).toContain("g.channels.map");
    expect(sidebar).toContain("`/channels/${i.key}`");
    expect(sidebar).not.toContain('href: `/videos#${provider}-connect`');
  });
});

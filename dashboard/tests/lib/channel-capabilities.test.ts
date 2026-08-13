import { describe, expect, it } from "vitest";
import {
  BASE_CHANNEL_TABS,
  CHANNEL_GROUPS,
  PUBLISH_CHANNEL_GROUPS,
  getChannelCapability,
  getChannelTabs,
} from "@/lib/channel-capabilities";

describe("R-09 channel capability SSOT", () => {
  it("keeps the five base tabs in the approved order", () => {
    expect(BASE_CHANNEL_TABS).toEqual(["queue", "analytics", "growth", "popular", "settings"]);
  });

  it("keeps Threads Growth and Popular enabled", () => {
    expect(getChannelTabs("threads").map(({ id, disabled }) => [id, disabled])).toEqual([
      ["queue", false],
      ["analytics", false],
      ["growth", false],
      ["popular", false],
      ["settings", false],
    ]);
  });

  it("adds Instagram Editor and keeps unimplemented Growth and Popular discoverable", () => {
    expect(getChannelTabs("instagram").map(({ id, disabled }) => [id, disabled])).toEqual([
      ["queue", false],
      ["editor", false],
      ["analytics", false],
      ["growth", true],
      ["popular", true],
      ["settings", false],
    ]);
  });

  it("removes only structurally impossible messaging tabs", () => {
    expect(getChannelCapability("telegram").removedTabs).toEqual([
      "queue",
      "analytics",
      "growth",
      "popular",
    ]);
    expect(getChannelTabs("telegram").map((tab) => tab.id)).toEqual(["settings"]);
  });

  it("shows video channels consistently without adding them to the existing eight-channel Studio publish set", () => {
    expect(CHANNEL_GROUPS.flatMap((group) => [...group.channels])).toContain("youtube");
    expect(CHANNEL_GROUPS.flatMap((group) => [...group.channels])).toContain("tiktok");
    expect(PUBLISH_CHANNEL_GROUPS.flatMap((group) => [...group.channels])).toHaveLength(8);
    expect(PUBLISH_CHANNEL_GROUPS.flatMap((group) => [...group.channels])).not.toContain("youtube");
    expect(PUBLISH_CHANNEL_GROUPS.flatMap((group) => [...group.channels])).not.toContain("tiktok");
  });
});

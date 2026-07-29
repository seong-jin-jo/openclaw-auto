// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChannelPage } from "@/components/channel/ChannelPage";
import { InstagramPage } from "@/components/channel/InstagramPage";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
  apiPost: vi.fn(),
  mutateConfig: vi.fn(),
  setSubTab: vi.fn(),
  setExpandedFeature: vi.fn(),
  setExpandedPopular: vi.fn(),
  subTab: "settings",
  channelConfigData: {} as Record<string, unknown>,
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
}));

vi.mock("@/hooks/useChannelConfig", () => ({
  useChannelConfig: () => ({
    data: mocks.channelConfigData,
    mutate: mocks.mutateConfig,
  }),
  useDesignTools: () => mocks.swr("/api/design-tools"),
}));

vi.mock("@/lib/api", () => ({
  fetcher: vi.fn(),
  apiPost: (...args: unknown[]) => mocks.apiPost(...args),
  handleUnauthorizedResponse: vi.fn(),
}));

vi.mock("@/store/ui-store", () => ({
  useUIStore: () => ({
    subTab: mocks.subTab,
    setSubTab: mocks.setSubTab,
    expandedFeature: null,
    setExpandedFeature: mocks.setExpandedFeature,
    expandedPopular: null,
    setExpandedPopular: mocks.setExpandedPopular,
  }),
}));

vi.mock("@/components/layout/Toast", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("@/components/shared/CredentialForm", () => ({ CredentialForm: () => null }));
vi.mock("@/components/channel/SocialConnectButton", () => ({ SocialConnectButton: () => null }));
vi.mock("@/components/channel/AccountManager", () => ({ AccountManager: () => null }));
vi.mock("@/components/shared/SetupGuide", () => ({ SetupGuide: () => null }));
vi.mock("@/components/channel/ContentGuide", () => ({ ContentGuide: () => null }));
vi.mock("@/components/channel/KeywordsEditor", () => ({ KeywordsEditor: () => null }));
vi.mock("@/components/queue/QueueList", () => ({ QueueList: () => null }));
vi.mock("@/components/shared/BackButton", () => ({ BackButton: () => null }));

describe("ChannelPage customer/operator API boundary", () => {
  beforeEach(() => {
    mocks.swr.mockReset();
    mocks.swr.mockImplementation((key: string | null) => ({
      data: key?.startsWith("/api/channel-settings/")
        ? { content_generation: true, auto_publish: true }
        : undefined,
      mutate: vi.fn(),
    }));
    mocks.apiPost.mockReset();
    mocks.apiPost.mockResolvedValue({ ok: true });
    mocks.subTab = "settings";
    mocks.channelConfigData = {};
  });

  afterEach(() => {
    cleanup();
  });

  it.each(["youtube", "tiktok"])(
    "does not request operator-only cron data on the %s customer channel",
    (channel) => {
      render(<ChannelPage channel={channel} variant="video" />);

      const keys = mocks.swr.mock.calls.map(([key]) => key);
      expect(keys).toContain(`/api/channel-settings/${channel}`);
      expect(keys).not.toContain("/api/cron-status");
      expect(keys).not.toContain("/api/cron-runs");
    },
  );

  it.each([
    ["threads", "/api/growth", "/api/threads-username"],
    ["instagram", null, null],
  ])(
    "keeps tenant-safe %s data without requesting operator-only cron APIs",
    (channel, growthKey, usernameKey) => {
      render(<ChannelPage channel={channel} />);

      const keys = mocks.swr.mock.calls.map(([key]) => key);
      expect(keys).toContain(growthKey);
      expect(keys).toContain(usernameKey);
      expect(keys).toContain(`/api/channel-settings/${channel}`);
      expect(keys).not.toContain("/api/cron-status");
      expect(keys).not.toContain("/api/cron-runs");
      if (channel === "threads") expect(keys).toContain("/api/settings");
    },
  );

  it("updates the tenant channel setting without requesting global cron data", async () => {
    render(<ChannelPage channel="youtube" variant="video" />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Auto Publish" }));

    await vi.waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith(
        "/api/channel-settings/youtube",
        { auto_publish: false },
      );
    });
    const keys = mocks.swr.mock.calls.map(([key]) => key);
    expect(keys).not.toContain("/api/cron-status");
    expect(keys).not.toContain("/api/cron-runs");
  });

  it("keeps the connected Instagram editor without requesting global design tools", () => {
    mocks.subTab = "editor";
    mocks.channelConfigData = { instagram: { connected: true } };

    render(<InstagramPage />);

    const keys = mocks.swr.mock.calls.map(([key]) => key);
    expect(keys).toContain("/api/queue");
    expect(keys).not.toContain("/api/design-tools");
  });

  it("restores Instagram tenant automation settings without global cron requests", async () => {
    mocks.channelConfigData = { instagram: { connected: true } };

    render(<InstagramPage />);

    expect(mocks.swr.mock.calls.map(([key]) => key)).toContain("/api/channel-settings/instagram");
    fireEvent.click(screen.getByRole("checkbox", { name: "Auto Publish" }));
    await vi.waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith(
        "/api/channel-settings/instagram",
        { auto_publish: false },
      );
    });
    const keys = mocks.swr.mock.calls.map(([key]) => key);
    expect(keys).not.toContain("/api/cron-status");
    expect(keys).not.toContain("/api/cron-runs");
  });
});

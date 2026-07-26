// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChannelPage } from "@/components/channel/ChannelPage";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
  mutateConfig: vi.fn(),
  setSubTab: vi.fn(),
  setExpandedFeature: vi.fn(),
  setExpandedPopular: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
}));

vi.mock("@/hooks/useChannelConfig", () => ({
  useChannelConfig: () => ({
    data: {},
    mutate: mocks.mutateConfig,
  }),
}));

vi.mock("@/store/ui-store", () => ({
  useUIStore: () => ({
    subTab: "settings",
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

describe("ChannelPage AutomationSection cron request contract", () => {
  beforeEach(() => {
    mocks.swr.mockReset();
    mocks.swr.mockReturnValue({ data: undefined, mutate: vi.fn() });
  });

  afterEach(() => {
    cleanup();
  });

  it.each(["youtube", "tiktok"])(
    "uses null SWR keys for operator-only cron data on the %s channel",
    (channel) => {
      render(<ChannelPage channel={channel} variant="video" />);

      expect(mocks.swr.mock.calls.map(([key]) => key)).toEqual([
        null,
        null,
        `/api/channel-settings/${channel}`,
        null,
        null,
      ]);
    },
  );

  it.each([
    ["threads", "/api/growth", "/api/threads-username"],
    ["instagram", null, null],
  ])(
    "preserves cron-status and cron-runs SWR keys for mapped %s automation",
    (channel, growthKey, usernameKey) => {
      render(<ChannelPage channel={channel} />);

      expect(mocks.swr.mock.calls.map(([key]) => key).slice(0, 5)).toEqual([
        growthKey,
        usernameKey,
        `/api/channel-settings/${channel}`,
        "/api/cron-status",
        "/api/cron-runs",
      ]);
    },
  );
});

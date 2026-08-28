import { describe, expect, it } from "vitest";
import { resolveConnectReadiness } from "@/lib/connect-readiness";

describe("R-05 connect readiness state resolver", () => {
  it.each([
    ["connected", { credentialsComplete: true, connectionState: "connected" as const }],
    ["not_connected", { credentialsComplete: true, connectionState: "disconnected" as const }],
    ["opening_soon", { credentialsComplete: false, connectionState: "disconnected" as const }],
    ["publish_pending", { credentialsComplete: true, connectionState: "connected" as const, externalReviewPending: true }],
    ["error", { credentialsComplete: false, connectionState: "disconnected" as const, credentialStoreError: true }],
  ])("resolves %s from the approved source precedence", (status, input) => {
    expect(resolveConnectReadiness(input).status).toBe(status);
  });

  it("keeps not_connected actionable and opening_soon non-actionable", () => {
    expect(resolveConnectReadiness({
      credentialsComplete: true,
      connectionState: "disconnected",
    }).available).toBe(true);
    expect(resolveConnectReadiness({
      credentialsComplete: false,
      connectionState: "disconnected",
    }).available).toBe(false);
  });
});

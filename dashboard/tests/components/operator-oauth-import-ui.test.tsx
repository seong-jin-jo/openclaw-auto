// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OperatorCustomersPage from "@/app/operator/customers/page";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
}));

const envProvider = {
  provider: "x",
  label: "X",
  complete: true,
  credentialsConfigured: true,
  missing: [],
  requiredSecrets: ["X_CLIENT_ID", "X_CLIENT_SECRET"],
  fields: [
    {
      key: "clientId",
      env: "X_CLIENT_ID",
      label: "Client ID",
      secret: false,
      configured: true,
      maskedValue: "••••••••",
    },
    {
      key: "clientSecret",
      env: "X_CLIENT_SECRET",
      label: "Client Secret",
      secret: true,
      configured: true,
      maskedValue: "••••••••",
    },
  ],
  source: "env" as "env" | "db",
  updatedAt: null as string | null,
  callbackUrl: "https://app.example/api/connect/x/callback",
  consoleUrl: "https://console.x.com/",
  docsUrl: "https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code",
  setupSteps: ["OAuth 2.0 활성화"],
  setupSource: "official",
  externalReview: "unknown",
} as const;

function swrResult(provider = envProvider) {
  return {
    data: {
      customers: [],
      authUsers: [],
      oauthProviders: [provider],
    },
    error: undefined,
    isLoading: false,
    mutate: vi.fn().mockResolvedValue(undefined),
  };
}

describe("operator OAuth env import UI lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("dashboard_auth_token", "operator-token");
    mocks.swr.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("requires confirmation, posts only provider/action, refreshes metadata, then exposes DB-only reveal", async () => {
    const initial = swrResult();
    mocks.swr.mockReturnValue(initial);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      ok: true,
      provider: "x",
      source: "db",
      updatedAt: "2026-07-29T00:00:00.000Z",
    }));
    vi.stubGlobal("fetch", fetchMock);

    const view = render(<OperatorCustomersPage />);
    expect(screen.getByText(/환경변수로 보호/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "원문 확인" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "암호화 DB로 가져오기" }));
    await waitFor(() => expect(initial.mutate).toHaveBeenCalledTimes(1));
    expect(window.confirm).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/operator/oauth-credentials", expect.objectContaining({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer operator-token",
      },
      body: JSON.stringify({ action: "import-env", provider: "x" }),
      cache: "no-store",
    }));

    mocks.swr.mockReturnValue(swrResult({
      ...envProvider,
      source: "db",
      updatedAt: "2026-07-29T00:00:00.000Z",
    }));
    view.rerender(<OperatorCustomersPage />);
    expect(screen.queryByRole("button", { name: "암호화 DB로 가져오기" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "원문 확인" })).toBeInTheDocument();
  });

  it("does not import when the operator cancels confirmation", () => {
    mocks.swr.mockReturnValue(swrResult());
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<OperatorCustomersPage />);
    fireEvent.click(screen.getByRole("button", { name: "암호화 DB로 가져오기" }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

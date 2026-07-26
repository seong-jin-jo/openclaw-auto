// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OperatorCustomersPage from "@/app/operator/customers/page";
import { fetcher } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
}));

describe("operator GET authentication handling", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.swr.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("GET 401 clears the stale token, dispatches auth:required, and throws a typed auth error", async () => {
    localStorage.setItem("dashboard_auth_token", "expired-operator-token");
    const onAuthRequired = vi.fn();
    window.addEventListener("auth:required", onAuthRequired);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(fetcher("/api/operator/customers")).rejects.toMatchObject({
      name: "AuthRequiredError",
    });
    expect(localStorage.getItem("dashboard_auth_token")).toBeNull();
    expect(onAuthRequired).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:required", onAuthRequired);
  });

  it("does not render raw Unauthorized when SWR receives an authentication-required error", () => {
    const authError = Object.assign(new Error("Unauthorized"), { name: "AuthRequiredError" });
    mocks.swr.mockReturnValue({
      data: undefined,
      error: authError,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<OperatorCustomersPage />);

    expect(screen.queryByText("Unauthorized")).not.toBeInTheDocument();
    expect(screen.queryByText("조회 실패")).not.toBeInTheDocument();
  });
});

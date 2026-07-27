// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGate } from "@/components/shared/AuthGate";
import { useUIStore } from "@/store/ui-store";

const mocks = vi.hoisted(() => ({
  pathname: vi.fn(() => "/"),
  replace: vi.fn(),
  router: null as { replace: ReturnType<typeof vi.fn> } | null,
}));
mocks.router = { replace: mocks.replace };

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname(),
  useRouter: () => mocks.router,
}));

vi.mock("@/components/layout/Sidebar", () => ({
  Sidebar: () => <nav data-testid="sidebar">sidebar</nav>,
}));

vi.mock("@/components/shared/ErrorBoundary", () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/lib/supabase", () => ({
  createBrowserSupabase: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  }),
}));

describe("AuthGate operator route separation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("dashboard_auth_token", "operator-token");
    mocks.pathname.mockReturnValue("/");
    mocks.replace.mockReset();
    useUIStore.setState({
      activeWorkspace: { id: "customer-1", slug: "customer", name: "Customer" },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it.each(["/", "/videos", "/channels/youtube"])(
    "redirects an operator on protected customer path %s before children mount",
    async (pathname) => {
      mocks.pathname.mockReturnValue(pathname);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(Response.json({ isOperator: true, tenant: null })),
      );

      render(<AuthGate><div>customer child</div></AuthGate>);

      await waitFor(() => {
        expect(mocks.replace).toHaveBeenCalledWith("/operator/customers");
      });
      expect(screen.queryByText("customer child")).not.toBeInTheDocument();
      expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    },
  );

  it("keeps /operator/customers valid for the operator and mounts only after identity resolves", async () => {
    mocks.pathname.mockReturnValue("/operator/customers");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ isOperator: true, tenant: null })),
    );

    render(<AuthGate><div>operator child</div></AuthGate>);

    expect(screen.queryByText("operator child")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("operator child")).toBeInTheDocument();
    });
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });

  it("preserves the customer Marketing Hub path for a customer identity", async () => {
    mocks.pathname.mockReturnValue("/videos");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          isOperator: false,
          tenant: { id: "customer-1", slug: "customer", name: "Customer" },
        }),
      ),
    );

    render(<AuthGate><div>customer child</div></AuthGate>);

    await waitFor(() => {
      expect(screen.getByText("customer child")).toBeInTheDocument();
    });
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
  });
});

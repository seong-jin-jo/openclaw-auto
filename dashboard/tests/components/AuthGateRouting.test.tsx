// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthGate } from "@/components/shared/AuthGate";
import { useUIStore } from "@/store/ui-store";

const mocks = vi.hoisted(() => ({
  pathname: vi.fn(() => "/"),
  replace: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
  sessionToken: null as string | null,
  authStateCallback: null as null | ((event: string, session: { access_token?: string } | null) => void),
  authStateCallbacks: [] as Array<(event: string, session: { access_token?: string } | null) => void>,
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
      getSession: mocks.getSession,
      signOut: mocks.signOut,
      onAuthStateChange: vi.fn((callback) => {
        mocks.authStateCallback = callback;
        mocks.authStateCallbacks.push(callback);
        return {
        data: { subscription: { unsubscribe: vi.fn() } },
        };
      }),
    },
  }),
}));

describe("AuthGate operator route separation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("dashboard_auth_token", "operator-token");
    mocks.pathname.mockReturnValue("/");
    mocks.replace.mockReset();
    mocks.signOut.mockReset();
    mocks.signOut.mockResolvedValue({ error: null });
    mocks.getSession.mockReset();
    mocks.getSession.mockImplementation(async () => ({
      data: {
        session: mocks.sessionToken ? { access_token: mocks.sessionToken } : null,
      },
    }));
    mocks.sessionToken = null;
    mocks.authStateCallback = null;
    mocks.authStateCallbacks = [];
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

  it("preserves an operator-only browser session through null Supabase initial and sign-out events", async () => {
    mocks.pathname.mockReturnValue("/operator/customers");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ isOperator: true, tenant: null })),
    );

    render(<AuthGate><div>operator console</div></AuthGate>);

    await waitFor(() => {
      expect(screen.getByText("operator console")).toBeInTheDocument();
      expect(mocks.authStateCallback).not.toBeNull();
    });

    act(() => {
      mocks.authStateCallback?.("INITIAL_SESSION", null);
      mocks.authStateCallback?.("SIGNED_OUT", null);
    });

    expect(localStorage.getItem("dashboard_auth_token")).toBe("operator-token");
    expect(screen.getByText("operator console")).toBeInTheDocument();
    expect(screen.queryByText("베타 신청하기")).not.toBeInTheDocument();
  });

  it("keeps the operator token when pre-operator Supabase initialization resolves after navigation", async () => {
    const customerJwt = `${"d".repeat(24)}.${"e".repeat(24)}.${"f".repeat(24)}`;
    let resolvePreOperatorSession!: (value: {
      data: { session: { access_token: string } | null };
    }) => void;
    mocks.pathname.mockReturnValue("/login");
    mocks.getSession
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolvePreOperatorSession = resolve;
      }))
      .mockResolvedValueOnce({ data: { session: null } });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ isOperator: true, tenant: null })),
    );

    const view = render(<AuthGate><div>operator console</div></AuthGate>);
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalledTimes(1));

    mocks.pathname.mockReturnValue("/operator/customers");
    view.rerender(<AuthGate><div>operator console</div></AuthGate>);
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalledTimes(2));

    await act(async () => {
      resolvePreOperatorSession({ data: { session: { access_token: customerJwt } } });
      await Promise.resolve();
    });
    await waitFor(() => expect(mocks.authStateCallbacks).toHaveLength(2));

    act(() => {
      mocks.authStateCallbacks[0]?.("SIGNED_OUT", null);
    });

    expect(localStorage.getItem("dashboard_auth_token")).toBe("operator-token");
    expect(screen.getByText("operator console")).toBeInTheDocument();
    expect(screen.queryByText("베타 신청하기")).not.toBeInTheDocument();
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

  it("promotes an established customer Supabase session over a residual operator token outside the operator console", async () => {
    const customerJwt = `${"d".repeat(24)}.${"e".repeat(24)}.${"f".repeat(24)}`;
    mocks.pathname.mockReturnValue("/login");
    mocks.sessionToken = customerJwt;

    render(<AuthGate><div>login child</div></AuthGate>);

    await waitFor(() => {
      expect(localStorage.getItem("dashboard_auth_token")).toBe(customerJwt);
    });
    expect(localStorage.getItem("active_workspace")).toBeNull();
    expect(useUIStore.getState().activeWorkspace).toBeNull();
  });

  it("preserves an intentional operator token while the operator console is active", async () => {
    const customerJwt = `${"d".repeat(24)}.${"e".repeat(24)}.${"f".repeat(24)}`;
    mocks.pathname.mockReturnValue("/operator");
    mocks.sessionToken = customerJwt;

    render(<AuthGate><div>operator login child</div></AuthGate>);

    await waitFor(() => expect(mocks.authStateCallback).not.toBeNull());
    expect(localStorage.getItem("dashboard_auth_token")).toBe("operator-token");
  });

  it("routes a rejected customer JWT through Supabase sign-out and /login", async () => {
    const jwt = `${"a".repeat(24)}.${"b".repeat(24)}.${"c".repeat(24)}`;
    localStorage.setItem("dashboard_auth_token", jwt);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    render(<AuthGate><div>customer child</div></AuthGate>);

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(mocks.replace).toHaveBeenCalledWith("/login");
    });
    expect(localStorage.getItem("dashboard_auth_token")).toBeNull();
    expect(screen.queryByText("customer child")).not.toBeInTheDocument();
  });

  it("ignores a stale /api/me 401 after the request token has been replaced", async () => {
    const oldJwt = `${"a".repeat(24)}.${"b".repeat(24)}.${"c".repeat(24)}`;
    const newJwt = `${"d".repeat(24)}.${"e".repeat(24)}.${"f".repeat(24)}`;
    localStorage.setItem("dashboard_auth_token", oldJwt);
    let resolvePoll!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise<Response>((resolve) => {
        resolvePoll = resolve;
      })),
    );

    render(<AuthGate><div>customer child</div></AuthGate>);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith(
      "/api/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${oldJwt}` }),
      }),
    ));

    localStorage.setItem("dashboard_auth_token", newJwt);
    resolvePoll(new Response(null, { status: 401 }));

    await waitFor(() => expect(localStorage.getItem("dashboard_auth_token")).toBe(newJwt));
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("preserves a new session when an old 401 sign-out emits SIGNED_OUT after replacement", async () => {
    const oldJwt = `${"a".repeat(24)}.${"b".repeat(24)}.${"c".repeat(24)}`;
    const newJwt = `${"d".repeat(24)}.${"e".repeat(24)}.${"f".repeat(24)}`;
    localStorage.setItem("dashboard_auth_token", oldJwt);
    let resolveSignOut!: (value: { error: null }) => void;
    mocks.signOut.mockImplementationOnce(
      () => new Promise<{ error: null }>((resolve) => {
        resolveSignOut = resolve;
      }),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    render(<AuthGate><div>customer child</div></AuthGate>);
    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
      expect(mocks.authStateCallback).not.toBeNull();
    });

    act(() => {
      mocks.authStateCallback?.("SIGNED_IN", { access_token: newJwt });
      mocks.authStateCallback?.("SIGNED_OUT", null);
    });
    await act(async () => {
      resolveSignOut({ error: null });
      await Promise.resolve();
    });

    expect(localStorage.getItem("dashboard_auth_token")).toBe(newJwt);
    expect(mocks.replace).not.toHaveBeenCalled();
    expect(screen.queryByText("베타 신청하기")).not.toBeInTheDocument();
  });

  it("still clears a legitimate Supabase SIGNED_OUT event with no reauth owner", async () => {
    const jwt = `${"a".repeat(24)}.${"b".repeat(24)}.${"c".repeat(24)}`;
    localStorage.setItem("dashboard_auth_token", jwt);
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
    await waitFor(() => expect(mocks.authStateCallback).not.toBeNull());
    act(() => {
      mocks.authStateCallback?.("SIGNED_OUT", null);
    });

    await waitFor(() => expect(screen.getAllByText("베타 신청하기").length).toBeGreaterThan(0));
    expect(localStorage.getItem("dashboard_auth_token")).toBeNull();
    expect(localStorage.getItem("active_workspace")).toBeNull();
    expect(useUIStore.getState().activeWorkspace).toBeNull();
  });
});

// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUIStore } from "@/store/ui-store";

const mocks = vi.hoisted(() => ({
  swr: vi.fn(),
  pathname: vi.fn(() => "/operator/customers"),
}));

vi.mock("swr", () => ({
  default: (...args: unknown[]) => mocks.swr(...args),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("@/hooks/useChannelConfig", () => ({
  useChannelConfig: () => ({ data: {} }),
}));

vi.mock("@/hooks/useOverview", () => ({
  useCronStatus: () => ({ data: { jobs: [] } }),
}));

vi.mock("@/components/layout/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">테마</button>,
}));

describe("Sidebar operator/customer shell separation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      "active_workspace",
      JSON.stringify({ id: "persisted-customer", slug: "romeo", name: "Romeo-n-cupid" }),
    );
    useUIStore.setState({
      activeWorkspace: { id: "persisted-customer", slug: "romeo", name: "Romeo-n-cupid" },
      sidebarCollapsed: {},
    });
    mocks.pathname.mockReturnValue("/operator/customers");
  });

  afterEach(() => {
    cleanup();
    mocks.swr.mockReset();
  });

  it("renders operator identity and operator navigation only, then clears persisted customer workspace", async () => {
    mocks.swr.mockImplementation((key: string | null) => {
      if (key === "/api/me") return { data: { isOperator: true, tenant: null } };
      return { data: undefined };
    });

    render(<Sidebar />);

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "고객 관리" })).toHaveAttribute(
      "href",
      "/operator/customers",
    );
    expect(screen.queryByText("Marketing Hub")).not.toBeInTheDocument();
    expect(screen.queryByText("Romeo-n-cupid")).not.toBeInTheDocument();
    expect(screen.queryByText("OSMU Studio")).not.toBeInTheDocument();
    expect(screen.queryByText("Social")).not.toBeInTheDocument();
    expect(screen.queryByText("Keyword Research")).not.toBeInTheDocument();

    await waitFor(() => expect(useUIStore.getState().activeWorkspace).toBeNull());
    expect(localStorage.getItem("active_workspace")).toBeNull();
  });

  it("preserves the customer marketing shell and exposes independent YouTube and TikTok management links", () => {
    mocks.pathname.mockReturnValue("/");
    mocks.swr.mockImplementation((key: string | null) => {
      if (key === "/api/me") {
        return {
          data: {
            isOperator: false,
            tenant: { id: "customer-1", slug: "customer", name: "고객 워크스페이스" },
          },
          mutate: vi.fn(),
        };
      }
      if (key === "/api/images") return { data: [] };
      return { data: undefined };
    });

    render(<Sidebar />);

    expect(screen.getByText("Marketing Hub")).toBeInTheDocument();
    expect(screen.getByText("고객 워크스페이스")).toBeInTheDocument();
    expect(screen.getByText("OSMU Studio")).toBeInTheDocument();
    expect(screen.getByText("Video")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "YouTube" })).toHaveAttribute(
      "href",
      "/channels/youtube",
    );
    expect(screen.getByRole("link", { name: "TikTok" })).toHaveAttribute(
      "href",
      "/channels/tiktok",
    );
  });
});

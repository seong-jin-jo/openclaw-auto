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
  signOut: vi.fn(),
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

vi.mock("@/lib/supabase", () => ({
  createBrowserSupabase: () => ({
    auth: { signOut: mocks.signOut },
  }),
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
      studioRoom: "publish",
    });
    mocks.pathname.mockReturnValue("/operator/customers");
    mocks.signOut.mockReset();
    mocks.signOut.mockResolvedValue({ error: null });
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

  it("FE3-SIDEBAR-01 정상: 고객 셸 맨 위에 네 방 흐름과 그 아래 채널 링크를 노출한다", () => {
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

    expect(screen.getByText("고객 워크스페이스")).toBeInTheDocument();
    expect(screen.getByText("한 편의 제작 순서")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /생성실/ })).toHaveAttribute("href", "/studio?room=create");
    expect(screen.getByRole("link", { name: /편집실/ })).toHaveAttribute("href", "/studio?room=edit");
    expect(screen.getByRole("link", { name: /발행실/ })).toHaveAttribute("href", "/studio?room=publish");
    expect(screen.getByRole("link", { name: /성과실/ })).toHaveAttribute("href", "/");
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

  it("FE3-SIDEBAR-02 거절: 기존 Overview와 OSMU Studio 중복 진입로를 다시 노출하지 않는다", () => {
    mocks.pathname.mockReturnValue("/studio");
    mocks.swr.mockImplementation((key: string | null) => {
      if (key === "/api/me") return { data: { isOperator: false, tenant: { id: "customer-1", slug: "customer", name: "고객 워크스페이스" } }, mutate: vi.fn() };
      if (key === "/api/images") return { data: [] };
      return { data: undefined };
    });

    render(<Sidebar />);

    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
    expect(screen.queryByText("OSMU Studio")).not.toBeInTheDocument();
  });

  it("clears the persisted active workspace when a customer logs out", async () => {
    mocks.pathname.mockReturnValue("/");
    localStorage.setItem("dashboard_auth_token", `${"a".repeat(24)}.${"b".repeat(24)}.${"c".repeat(24)}`);
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
    screen.getByRole("button", { name: /로그아웃/ }).click();

    await waitFor(() => {
      expect(mocks.signOut).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem("dashboard_auth_token")).toBeNull();
      expect(localStorage.getItem("active_workspace")).toBeNull();
      expect(useUIStore.getState().activeWorkspace).toBeNull();
    });
  });
});

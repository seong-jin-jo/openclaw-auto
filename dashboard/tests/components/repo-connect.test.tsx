// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RepoConnect } from "@/components/studio/RepoConnect";
import { ApiResponseError } from "@/lib/api";

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  mutateSource: vi.fn(),
  mutateWiki: vi.fn(),
}));

vi.mock("swr", () => ({
  default: (key: string) => ({
    data: key.startsWith("/api/brand/sync-wiki") ? { count: 0 } : { source: undefined },
    mutate: key.startsWith("/api/brand/sync-wiki") ? mocks.mutateWiki : mocks.mutateSource,
  }),
}));

vi.mock("@/lib/api", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/api")>();
  return {
    ...actual,
    fetcher: vi.fn(),
    apiPost: (...args: unknown[]) => mocks.apiPost(...args),
  };
});

const workspace = { id: "tenant-a", slug: "tenant-a", name: "Tenant A" };

describe("RepoConnect wiki sync error banner", () => {
  beforeEach(() => {
    mocks.apiPost.mockReset();
    mocks.mutateSource.mockReset();
    mocks.mutateWiki.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  async function submitWikiSync() {
    render(<RepoConnect workspace={workspace} onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("https://github.com/owner/repo"), {
      target: { value: "owner/repo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "📚 위키 폴더 전체 동기화" }));
  }

  it("shows the server error string with the danger semantic token when sync returns 400", async () => {
    mocks.apiPost.mockRejectedValueOnce(new ApiResponseError(
      400,
      { error: "서버 암호화 키가 설정되지 않았습니다. 관리자에게 OSMU_SECRET_KEY 설정을 요청하세요." },
      "서버 암호화 키가 설정되지 않았습니다. 관리자에게 OSMU_SECRET_KEY 설정을 요청하세요.",
    ));

    await submitWikiSync();

    const banner = await screen.findByText(
      "서버 암호화 키가 설정되지 않았습니다. 관리자에게 OSMU_SECRET_KEY 설정을 요청하세요.",
    );
    expect(banner).toHaveClass("text-danger");
    expect(banner).not.toHaveClass("text-success");
  });

  it("distinguishes a network exception from a server response", async () => {
    mocks.apiPost.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await submitWikiSync();

    await waitFor(() => {
      expect(screen.getByText(
        "네트워크 연결에 실패했습니다. 인터넷 연결을 확인한 뒤 다시 시도하세요.",
      )).toHaveClass("text-danger");
    });
  });

  it("shows the normalized repository, branch, and folder immediately and submits only sanitized values", async () => {
    mocks.apiPost.mockResolvedValueOnce({
      ok: true,
      count: 1,
      changed: 1,
      removed: 0,
    });
    render(<RepoConnect workspace={workspace} onClose={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("https://github.com/owner/repo"), {
      target: {
        value: "https://user:github_pat_secret@GitHub.com/owner/repo/tree/main/wiki/brand",
      },
    });

    expect(screen.getByText("owner/repo")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("wiki/brand")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "📚 위키 폴더 전체 동기화" }));

    await waitFor(() => {
      expect(mocks.apiPost).toHaveBeenCalledWith("/api/brand/sync-wiki", {
        tenant_id: "tenant-a",
        repo: "owner/repo",
        folder: "wiki/brand",
        ref: "main",
      });
    });
    expect(JSON.stringify(mocks.apiPost.mock.calls)).not.toContain("github_pat_secret");
  });
});

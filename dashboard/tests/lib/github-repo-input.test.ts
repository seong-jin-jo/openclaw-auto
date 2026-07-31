import { describe, expect, it } from "vitest";
import { normalizeGitHubRepoInput } from "@/lib/github-repo-input";

describe("normalizeGitHubRepoInput", () => {
  it.each([
    ["https://github.com/owner/name", { repo: "owner/name" }],
    ["https://github.com/owner/name/", { repo: "owner/name" }],
    ["https://github.com/owner/name.git", { repo: "owner/name" }],
    ["git@github.com:owner/name.git", { repo: "owner/name" }],
    ["owner/name", { repo: "owner/name" }],
    ["  HTTPS://WWW.GitHub.com/Owner/Name.git  ", { repo: "Owner/Name" }],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeGitHubRepoInput(input)).toMatchObject({ ok: true, ...expected });
  });

  it("extracts the branch and folder from a tree URL", () => {
    expect(normalizeGitHubRepoInput(
      "https://github.com/owner/name/tree/main/wiki/marketing",
    )).toEqual({
      ok: true,
      repo: "owner/name",
      ref: "main",
      folder: "wiki/marketing",
    });
  });

  it("extracts the branch, file path, and containing folder from a blob URL", () => {
    expect(normalizeGitHubRepoInput(
      "https://github.com/owner/name/blob/main/wiki/brand/voice.md",
    )).toEqual({
      ok: true,
      repo: "owner/name",
      ref: "main",
      folder: "wiki/brand",
      filePath: "wiki/brand/voice.md",
    });
  });

  it("rejects non-GitHub hosts with a clear Korean reason", () => {
    expect(normalizeGitHubRepoInput("https://gitlab.com/owner/name")).toEqual({
      ok: false,
      error: "현재 GitHub(github.com) 레포만 지원합니다. GitLab, Bitbucket, 사내 Git 주소는 연결할 수 없습니다.",
    });
  });

  it("drops URL credentials from the normalized result", () => {
    const result = normalizeGitHubRepoInput(
      "https://user:github_pat_secret@github.com/owner/name/tree/main/wiki",
    );

    expect(result).toEqual({
      ok: true,
      repo: "owner/name",
      ref: "main",
      folder: "wiki",
    });
    expect(JSON.stringify(result)).not.toContain("user");
    expect(JSON.stringify(result)).not.toContain("github_pat_secret");
  });

  it.each([
    ["https://github.com/owner/name/tree/main/wiki/../secret", ".. 경로는 사용할 수 없습니다."],
    ["owner/name\nattacker/repo", "레포 주소에 개행 또는 널 문자를 사용할 수 없습니다."],
    ["owner/name\u0000", "레포 주소에 개행 또는 널 문자를 사용할 수 없습니다."],
    ["a".repeat(4097), "레포 주소는 4096자를 초과할 수 없습니다."],
  ])("rejects unsafe input %#", (input, error) => {
    expect(normalizeGitHubRepoInput(input)).toEqual({ ok: false, error });
  });
});

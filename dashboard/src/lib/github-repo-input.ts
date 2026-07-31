const MAX_REPO_INPUT_LENGTH = 4096;
const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const REPO_PART = /^[\w.-]+$/;
const NON_GITHUB_HOST_ERROR =
  "현재 GitHub(github.com) 레포만 지원합니다. GitLab, Bitbucket, 사내 Git 주소는 연결할 수 없습니다.";

export type NormalizedGitHubRepoInput =
  | {
      ok: true;
      repo: string;
      ref?: string;
      folder?: string;
      filePath?: string;
    }
  | {
      ok: false;
      error: string;
    };

function invalid(error: string): NormalizedGitHubRepoInput {
  return { ok: false, error };
}

function decodePathPart(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value);
    if (/[\r\n\0]/.test(decoded) || decoded.includes("\\") || decoded.includes("/")) return null;
    return decoded;
  } catch {
    return null;
  }
}

function hasPathTraversal(value: string): boolean {
  const candidates = [value];
  try {
    candidates.push(decodeURIComponent(value));
  } catch {
    // 잘못된 percent-encoding은 아래 형식 검증에서 거부한다.
  }
  return candidates.some((candidate) => /(?:^|[/:\\])\.\.(?:[/?#\\:]|$)/.test(candidate));
}

function validRepo(owner: string, name: string): string | null {
  const repoName = name.replace(/\.git$/i, "");
  if (!REPO_PART.test(owner) || !REPO_PART.test(repoName) || !owner || !repoName) return null;
  return `${owner}/${repoName}`;
}

function normalizeUrl(input: string): NormalizedGitHubRepoInput {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return invalid("GitHub 레포 주소 형식을 확인하세요. https://github.com/owner/repo 형식을 지원합니다.");
  }

  if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) return invalid(NON_GITHUB_HOST_ERROR);
  if (!["http:", "https:"].includes(url.protocol.toLowerCase())) {
    return invalid("GitHub 레포 주소는 http 또는 https 형식만 지원합니다.");
  }

  const encodedParts = url.pathname.split("/").filter(Boolean);
  const parts = encodedParts.map(decodePathPart);
  if (parts.some((part) => part === null)) {
    return invalid("GitHub 레포 주소의 경로 형식을 확인하세요.");
  }
  const decoded = parts as string[];
  if (decoded.length < 2) {
    return invalid("GitHub 레포 주소에 owner와 repo 이름이 모두 필요합니다.");
  }

  const repo = validRepo(decoded[0], decoded[1]);
  if (!repo) return invalid("레포 형식이 올바르지 않습니다. owner/name 또는 GitHub 레포 주소를 입력하세요.");

  const view = decoded[2]?.toLowerCase();
  if (view !== "tree" && view !== "blob") return { ok: true, repo };
  const ref = decoded[3];
  if (!ref) return invalid(`GitHub ${view} 주소에 브랜치 이름이 없습니다.`);

  const path = decoded.slice(4).join("/");
  if (view === "tree") {
    return path ? { ok: true, repo, ref, folder: path } : { ok: true, repo, ref };
  }

  if (!path) return { ok: true, repo, ref };
  const lastSlash = path.lastIndexOf("/");
  const folder = lastSlash >= 0 ? path.slice(0, lastSlash) : "";
  return folder
    ? { ok: true, repo, ref, folder, filePath: path }
    : { ok: true, repo, ref, filePath: path };
}

export function normalizeGitHubRepoInput(rawInput: string): NormalizedGitHubRepoInput {
  const input = rawInput.trim();
  if (!input) return invalid("GitHub 레포 주소를 입력하세요.");
  if (input.length > MAX_REPO_INPUT_LENGTH) return invalid("레포 주소는 4096자를 초과할 수 없습니다.");
  if (/[\r\n\0]/.test(input)) return invalid("레포 주소에 개행 또는 널 문자를 사용할 수 없습니다.");
  if (hasPathTraversal(input)) return invalid(".. 경로는 사용할 수 없습니다.");

  const scpLike = input.match(/^git@([^:]+):(.+)$/i);
  if (scpLike) {
    if (scpLike[1].toLowerCase() !== "github.com") return invalid(NON_GITHUB_HOST_ERROR);
    const repoParts = scpLike[2].replace(/\/+$/, "").split("/");
    if (repoParts.length !== 2) {
      return invalid("SSH 레포 주소 형식이 올바르지 않습니다. git@github.com:owner/repo.git 형식을 지원합니다.");
    }
    const repo = validRepo(repoParts[0], repoParts[1]);
    return repo
      ? { ok: true, repo }
      : invalid("레포 형식이 올바르지 않습니다. owner/name 또는 GitHub 레포 주소를 입력하세요.");
  }

  if (/^[a-z][a-z\d+.-]*:\/\//i.test(input)) return normalizeUrl(input);

  const bareParts = input.replace(/\/+$/, "").split("/");
  if (bareParts.length === 2) {
    const repo = validRepo(bareParts[0], bareParts[1]);
    if (repo) return { ok: true, repo };
  }

  if (/^(?:www\.)?(?:gitlab|bitbucket)\.[^/]+\//i.test(input)) return invalid(NON_GITHUB_HOST_ERROR);
  return invalid("레포 형식이 올바르지 않습니다. owner/name 또는 GitHub 레포 주소를 입력하세요.");
}

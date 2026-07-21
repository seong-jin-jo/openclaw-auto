import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { signImageToken } from "@/lib/image-token";
import { signMediaToken } from "@/lib/media-token";

// GET /api/images/deliver/[token] — SNS-016 서명 이미지 배달.
const SECRET = "test-media-signing-secret-0123456789";
let dataDir: string;

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "osmu-images-deliver-test-"));
  process.env.DATA_DIR = dataDir;
  process.env.MEDIA_SIGNING_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.DATA_DIR;
  delete process.env.MEDIA_SIGNING_SECRET;
  fs.rmSync(dataDir, { recursive: true, force: true });
});

function seed(tenant: string, filename: string, content = "pixel-data") {
  const dir = path.join(dataDir, "tenants", tenant, "images");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), content);
}

async function deliver(token: string) {
  const { GET } = await import("@/app/api/images/deliver/[token]/route");
  const res = await GET(new Request(`http://localhost/api/images/deliver/${token}`), {
    params: Promise.resolve({ token }),
  });
  return res;
}

describe("GET /api/images/deliver/[token]", () => {
  it("유효한 토큰이면 파일을 스트리밍하고 올바른 content-type을 준다", async () => {
    seed("tenant-a", "photo.png");
    const token = signImageToken("tenant-a", "photo.png")!;
    const res = await deliver(token);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.toString()).toBe("pixel-data");
  });

  it("변조/무효 토큰은 404", async () => {
    seed("tenant-a", "photo.png");
    const res = await deliver("garbage.token");
    expect(res.status).toBe(404);
  });

  it("만료된 토큰은 404", async () => {
    seed("tenant-a", "photo.png");
    vi.useFakeTimers();
    vi.setSystemTime(1_000_000);
    const token = signImageToken("tenant-a", "photo.png", 1000)!;
    vi.setSystemTime(1_002_000); // TTL 1s 지남
    const res = await deliver(token);
    vi.useRealTimers();
    expect(res.status).toBe(404);
  });

  it("파일이 없는 테넌트/파일명 조합은 404", async () => {
    const token = signImageToken("tenant-a", "missing.png")!;
    const res = await deliver(token);
    expect(res.status).toBe(404);
  });

  it("cross-tenant: 다른 테넌트의 파일명을 알아도 자기 토큰으로는 못 연다", async () => {
    seed("tenant-b", "victim.png");
    // tenant-a 명의로 서명된 토큰이 tenant-b 파일을 가리킬 수 없다 — 토큰이 곧 테넌트를 못박는다.
    const forged = signImageToken("tenant-a", "victim.png")!;
    const res = await deliver(forged);
    expect(res.status).toBe(404);
  });

  it("영상 토큰(media-token)으로는 이미지 배달을 열 수 없다(purpose 분리)", async () => {
    seed("tenant-a", "photo.png");
    const videoToken = signMediaToken("tenant-a", "photo.png")!;
    const res = await deliver(videoToken);
    expect(res.status).toBe(404);
  });

  it("허용되지 않은 확장자는 404", async () => {
    seed("tenant-a", "script.svg");
    const token = signImageToken("tenant-a", "script.svg")!;
    const res = await deliver(token);
    expect(res.status).toBe(404);
  });
});

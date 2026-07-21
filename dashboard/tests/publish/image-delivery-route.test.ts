import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { signImageToken } from "@/lib/image-token";

const SECRET = "test-image-delivery-secret-0123456789";
let dataDir: string;

beforeEach(() => {
  dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "osmu-image-delivery-"));
  process.env.DATA_DIR = dataDir;
  process.env.MEDIA_SIGNING_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.DATA_DIR;
  delete process.env.MEDIA_SIGNING_SECRET;
  fs.rmSync(dataDir, { recursive: true, force: true });
  vi.resetModules();
});

function seed(tenantId: string, filename: string, body: Buffer) {
  const dir = path.join(dataDir, "tenants", tenantId, "images");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, filename), body);
}

async function deliver(token: string) {
  const { GET } = await import("@/app/api/images/deliver/[token]/route");
  return GET(new Request(`https://app.example.com/api/images/deliver/${encodeURIComponent(token)}`), {
    params: Promise.resolve({ token }),
  });
}

describe("GET /api/images/deliver/[token]", () => {
  it("유효 토큰의 현재 테넌트 이미지를 정확한 타입으로 스트리밍한다", async () => {
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    seed("tenant-a", "photo.png", bytes);
    const token = signImageToken("tenant-a", "photo.png")!;

    const response = await deliver(token);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
  });

  it("다른 테넌트에만 같은 파일이 있으면 404로 숨긴다", async () => {
    seed("tenant-b", "photo.png", Buffer.from("victim"));
    const token = signImageToken("tenant-a", "photo.png")!;
    expect((await deliver(token)).status).toBe(404);
  });

  it("변조·만료·허용 외 확장자·잘못된 URL 인코딩은 모두 404다", async () => {
    seed("tenant-a", "photo.png", Buffer.from("ok"));
    seed("tenant-a", "secret.txt", Buffer.from("secret"));
    const valid = signImageToken("tenant-a", "photo.png")!;
    const expired = signImageToken("tenant-a", "photo.png", 1000, 1)!;
    const text = signImageToken("tenant-a", "secret.txt")!;

    expect((await deliver(`${valid.slice(0, -1)}x`)).status).toBe(404);
    expect((await deliver(expired)).status).toBe(404);
    expect((await deliver(text)).status).toBe(404);

    const { GET } = await import("@/app/api/images/deliver/[token]/route");
    const malformed = await GET(new Request("https://app.example.com/api/images/deliver/bad"), {
      params: Promise.resolve({ token: "%E0%A4%A" }),
    });
    expect(malformed.status).toBe(404);
  });

  it("파일 삭제 뒤 같은 서명 URL은 즉시 404다", async () => {
    seed("tenant-a", "photo.webp", Buffer.from("webp"));
    const token = signImageToken("tenant-a", "photo.webp")!;
    expect((await deliver(token)).status).toBe(200);
    fs.unlinkSync(path.join(dataDir, "tenants", "tenant-a", "images", "photo.webp"));
    expect((await deliver(token)).status).toBe(404);
  });
});

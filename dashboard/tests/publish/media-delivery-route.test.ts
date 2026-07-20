import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { signMediaToken } from "@/lib/media-token";

// SNS-015: /api/media/<token> — 서명 미디어 배달의 만료·변조·cross-tenant·형식 제한 계약.
const TENANT_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

let tmpRoot: string;

async function get(token: string, headers: Record<string, string> = {}) {
  const { GET } = await import("@/app/api/media/[token]/route");
  return GET(new Request(`http://internal.local/api/media/${token}`, { headers }), {
    params: Promise.resolve({ token }),
  });
}

function writeVideo(tenant: string, name: string, bytes: Buffer) {
  const dir = path.join(tmpRoot, "tenants", tenant, "videos");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), bytes);
}

describe("/api/media/<token>", () => {
  beforeEach(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "osmu-media-"));
    process.env.DATA_DIR = tmpRoot;
    process.env.MEDIA_SIGNING_SECRET = "test-media-signing-secret-0123456789";
    writeVideo(TENANT_A, "clip.mp4", Buffer.alloc(1024, 7));
    writeVideo(TENANT_B, "secret.mp4", Buffer.alloc(512, 9));
    writeVideo(TENANT_A, "notes.txt", Buffer.from("private"));
    vi.resetModules(); // file-io의 DATA_DIR은 모듈 로드 시 고정 — 테스트마다 새 tmp 루트를 반영시킨다
  });
  afterEach(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
    delete process.env.MEDIA_SIGNING_SECRET;
  });

  it("유효 토큰은 해당 테넌트 영상을 배달한다", async () => {
    const ok = await get(signMediaToken(TENANT_A, "clip.mp4")!);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("Content-Type")).toBe("video/mp4");
    expect((await ok.arrayBuffer()).byteLength).toBe(1024);
  });

  it("Range 요청은 206 부분 응답", async () => {
    const res = await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "bytes=0-99" });
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 0-99/1024");
    expect((await res.arrayBuffer()).byteLength).toBe(100);
  });

  it("만료된 토큰은 404", async () => {
    const expired = signMediaToken(TENANT_A, "clip.mp4", 1000, Date.now() - 60_000)!;
    expect((await get(expired)).status).toBe(404);
  });

  it("변조된 토큰은 404", async () => {
    const t = signMediaToken(TENANT_A, "clip.mp4")!;
    const [body, sig] = t.split(".");
    expect((await get(`${body}.${sig.slice(0, -3)}AAA`)).status).toBe(404);
    expect((await get("garbage")).status).toBe(404);
  });

  it("cross-tenant 접근 불가 — A 토큰으로 B 파일을 못 읽는다", async () => {
    // A 테넌트로 서명하되 파일명은 B의 것 → A 디렉토리에 없으므로 404(존재 여부도 노출 안 함)
    expect((await get(signMediaToken(TENANT_A, "secret.mp4")!)).status).toBe(404);
    // 반대로 B 토큰 + B 파일은 정상 → 격리가 토큰의 테넌트로만 결정됨을 확인
    expect((await get(signMediaToken(TENANT_B, "secret.mp4")!)).status).toBe(200);
  });

  it("영상 확장자가 아니면 배달하지 않는다", async () => {
    expect((await get(signMediaToken(TENANT_A, "notes.txt")!)).status).toBe(404);
  });

  it("suffix-range(bytes=-N, RFC 9110 §14.1.2)는 파일 끝에서 N바이트를 돌려준다", async () => {
    const res = await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "bytes=-100" });
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 924-1023/1024");
    expect((await res.arrayBuffer()).byteLength).toBe(100);
  });

  it("suffix-range 길이가 0/음수면 416", async () => {
    expect((await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "bytes=-0" })).status).toBe(416);
  });

  it("multi-range(콤마로 여러 range-spec)는 구현하지 않으므로 416", async () => {
    const res = await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "bytes=0-99,200-299" });
    expect(res.status).toBe(416);
  });

  it("형식이 무효한 Range(bytes= 접두 없음, 비숫자)는 416", async () => {
    expect((await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "items=0-99" })).status).toBe(416);
    expect((await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "bytes=abc-def" })).status).toBe(416);
    expect((await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "bytes=" })).status).toBe(416);
  });

  it("범위 초과/역전(start>end, start>=size)은 416", async () => {
    expect((await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "bytes=2000-2100" })).status).toBe(416);
    expect((await get(signMediaToken(TENANT_A, "clip.mp4")!, { range: "bytes=500-100" })).status).toBe(416);
  });

  it("응답에 내부 경로/서명 비밀을 노출하지 않는다", async () => {
    const res = await get("garbage");
    const text = await res.text();
    expect(text).not.toContain(tmpRoot);
    expect(text).not.toContain("test-media-signing-secret");
  });
});

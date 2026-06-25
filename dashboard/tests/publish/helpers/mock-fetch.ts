import { vi } from "vitest";

// URL 키워드/정규식으로 응답을 라우팅하는 fetch 목. publish.ts의 실 발행 함수(fetch 사용)를
// 네트워크 없이 happy/실패 경로로 구동한다. 매칭 안 되는 URL은 throw → 미모킹 호출을 즉시 노출.
export interface MockRoute {
  match: string | RegExp; // URL substring 또는 정규식
  status?: number; // 기본 200
  json?: unknown; // 응답 JSON
  text?: string; // 응답 text (기본 JSON.stringify(json))
}

export interface FetchCall {
  url: string;
  method: string;
  body: string | null;
}

export function installFetch(routes: MockRoute[]): { calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method || "GET").toUpperCase();
    let body: string | null = null;
    if (init?.body) {
      body = init.body instanceof URLSearchParams ? init.body.toString() : String(init.body);
    }
    calls.push({ url, method, body });
    const r = routes.find((rt) =>
      typeof rt.match === "string" ? url.includes(rt.match) : rt.match.test(url),
    );
    if (!r) throw new Error(`unmocked fetch: ${method} ${url}`);
    const status = r.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => r.json ?? {},
      text: async () => r.text ?? JSON.stringify(r.json ?? {}),
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fn);
  return { calls };
}

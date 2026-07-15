import { vi } from "vitest";

// URL 키워드/정규식으로 응답을 라우팅하는 fetch 목. publish.ts의 실 발행 함수(fetch 사용)를
// 네트워크 없이 happy/실패 경로로 구동한다. 매칭 안 되는 URL은 throw → 미모킹 호출을 즉시 노출.
export interface MockRoute {
  match: string | RegExp; // URL substring 또는 정규식
  status?: number; // 기본 200
  json?: unknown; // 응답 JSON
  text?: string; // 응답 text (기본 JSON.stringify(json))
  arrayBuffer?: ArrayBuffer; // 응답 바이너리(레거시 전체읽기 경로 — 신규 스트리밍 테스트는 bodyChunks 사용)
  bodyChunks?: Uint8Array[]; // response.body(ReadableStream)를 이 청크들로 순차 스트리밍(실 reader.getReader()/cancel() 구동)
  headers?: Record<string, string>; // 응답 헤더(예: content-type, content-length) — .headers.get()으로 조회
}

export interface FetchCall {
  url: string;
  method: string;
  body: string | null;
  redirect?: RequestRedirect; // fetch init.redirect (SSRF 가드 — 이미지 fetch가 manual인지 관찰)
  hasSignal?: boolean; // AbortSignal(타임아웃) 부착 여부 관찰
  bodyCancelled?: boolean; // response.body reader.cancel() 호출 여부(1MB 초과 조기 중단 관찰) — fetch 완료 후 갱신됨
}

export function installFetch(routes: MockRoute[]): { calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  const fn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method || "GET").toUpperCase();
    let reqBody: string | null = null;
    if (init?.body) {
      reqBody = init.body instanceof URLSearchParams ? init.body.toString() : String(init.body);
    }
    const call: FetchCall = { url, method, body: reqBody, redirect: init?.redirect, hasSignal: !!init?.signal };
    calls.push(call);
    const r = routes.find((rt) =>
      typeof rt.match === "string" ? url.includes(rt.match) : rt.match.test(url),
    );
    if (!r) throw new Error(`unmocked fetch: ${method} ${url}`);
    const status = r.status ?? 200;
    const headerMap = new Map(Object.entries(r.headers ?? {}));
    // bodyChunks(신규 스트리밍 테스트) 우선, 없으면 arrayBuffer(레거시)를 단일 청크로, 둘 다 없으면 빈 스트림.
    const chunks: Uint8Array[] = r.bodyChunks ?? (r.arrayBuffer ? [new Uint8Array(r.arrayBuffer)] : []);
    // 실 ReadableStream — reader.getReader()/read()/cancel()이 프로덕션 코드와 동일하게 동작.
    // pull()로 한 번에 한 청크만 enqueue(=start()에서 전부 밀어넣고 즉시 close하지 않음) — 그래야
    // 프로덕션의 "누적 초과 시 reader.cancel()"이 아직 열려있는 스트림에 실제로 도달해 관찰 가능하다
    // (전부 미리 enqueue+close된 스트림은 이미 "closed" 상태라 cancel()이 사실상 no-op이 된다 — WHATWG
    // Streams: closed 스트림의 cancel()은 producer가 이미 끝났으므로 취소할 것이 없다).
    // cancel() 호출 여부를 call 객체에 기록해 "1MB 초과 시 조기 cancel" 테스트가 fetch 완료 후 관찰 가능.
    let idx = 0;
    const respBody: ReadableStream<Uint8Array> = new ReadableStream<Uint8Array>({
      // pull()을 macrotask(setTimeout)로 한 틱 늦춘다 — 실 네트워크는 청크 사이에 진짜 지연이 있어
      // 소비측(readBodyWithLimit)이 "누적 초과 시 cancel" 판단을 낼 시간이 있다. 지연 없이 전부
      // 동기 enqueue+close하면 컨트롤러가 소비 로직보다 먼저 다 밀어넣고 닫혀버려("closed" 상태),
      // reader.cancel()이 실제로는 취소할 것이 없는 no-op이 되어 조기중단을 검증할 수 없다.
      pull(controller) {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            if (idx < chunks.length) {
              controller.enqueue(chunks[idx++]);
            } else {
              controller.close();
            }
            resolve();
          }, 0);
        });
      },
      cancel() {
        call.bodyCancelled = true;
      },
    });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => r.json ?? {},
      text: async () => r.text ?? JSON.stringify(r.json ?? {}),
      arrayBuffer: async () => r.arrayBuffer ?? new ArrayBuffer(0),
      headers: { get: (name: string) => headerMap.get(name.toLowerCase()) ?? null },
      body: respBody,
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fn);
  return { calls };
}

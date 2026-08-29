"use client";

import { useCallback, useEffect, useRef } from "react";

// 인증 응답 경쟁 방지 공용 장치.
//
// 왜 필요한가: 로그인 화면(고객)과 운영자 콘솔은 각각 `/api/me`로 신원을 확인한다. 확인이
// 끝나기 전에 화면을 떠나면 늦게 도착한 성공 응답이 그 사이에 확정된 다른 신원을 덮어쓴다.
// 고객 토큰이 운영자 토큰을 덮거나 그 반대가 되어, 화면과 저장된 토큰이 어긋난다.
//
// 해결: 시도마다 번호(nonce)를 매기고 AbortController를 붙인다. 새 시도가 시작되면 이전
// 시도는 즉시 무효가 되고, 화면을 벗어나면 정리 단계에서 남은 시도를 전부 무효로 만든다.
// 토큰 저장, 화면 이동, 오류 표시는 owns()가 참일 때만 한다.

export interface AuthAttempt {
  signal: AbortSignal;
  /** 이 시도가 아직 최신이고 취소되지 않았는지. 결과를 반영하기 직전에 확인한다. */
  owns: () => boolean;
}

export function useAuthAttempt() {
  const generation = useRef(0);
  const controller = useRef<AbortController | null>(null);

  const invalidate = useCallback(() => {
    generation.current += 1;
    controller.current?.abort();
    controller.current = null;
  }, []);

  const begin = useCallback((): AuthAttempt => {
    const current = ++generation.current;
    controller.current?.abort();
    const next = new AbortController();
    controller.current = next;
    return {
      signal: next.signal,
      owns: () => current === generation.current && !next.signal.aborted,
    };
  }, []);

  useEffect(() => () => {
    generation.current += 1;
    controller.current?.abort();
    controller.current = null;
  }, []);

  return { begin, invalidate };
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

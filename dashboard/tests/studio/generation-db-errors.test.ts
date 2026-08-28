import { describe, expect, it } from "vitest";
import { mapGenerationDatabaseError } from "@/lib/studio/generation/repository";

function postgresError(code: string): Error & { code: string } {
  return Object.assign(new Error(code), { code });
}

describe("Studio generation DB 오류 계약", () => {
  it.each(["40001", "40P01"])(
    "GEN-DB-ERR-01 거절: 재시도 소진 SQLSTATE %s는 retryable 503 busy로 매핑한다",
    (code) => {
      expect(mapGenerationDatabaseError(postgresError(code))).toEqual(
        expect.objectContaining({ status: 503, code: "GENERATION_DB_BUSY", retryable: true }),
      );
    },
  );

  it("GEN-DB-ERR-02 거절: 알 수 없는 DB 오류는 retryable로 가장하지 않는다", () => {
    expect(mapGenerationDatabaseError(postgresError("XX000"))).toEqual(
      expect.objectContaining({ status: 500, code: "GENERATION_DB_INVARIANT_VIOLATION" }),
    );
  });
});

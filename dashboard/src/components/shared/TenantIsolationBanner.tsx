"use client";

import { useState } from "react";
import { fetcher } from "@/lib/api";

interface ProofResult {
  own: number;
  crossTenant: number;
  otherTenants: number;
}

// "내 테넌트 데이터만 보입니다" 신뢰 배지 + 실제 RLS 증명 버튼.
// 버튼은 /api/isolation-proof를 호출 — crossTenant 수는 서버의 RLS-스코프 쿼리 결과(위조 불가).
export function TenantIsolationBanner() {
  const [proof, setProof] = useState<ProofResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const verify = async () => {
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetcher<ProofResult>("/api/isolation-proof");
      setProof(r);
    } catch {
      setErr("증명 조회를 사용할 수 없습니다 (DB 미연결).");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl border border-emerald-700/40 bg-emerald-900/15">
      <div className="text-sm text-emerald-200">
        🔒 내 테넌트 데이터만 보입니다
        {proof ? (
          <span className="text-emerald-400/80 text-xs ml-2">
            — 다른 테넌트 <b>{proof.otherTenants}개</b> 존재, 그 데이터 <b>{proof.crossTenant}개</b> 조회됨 (내 항목 {proof.own}개)
          </span>
        ) : (
          <span className="text-emerald-400/60 text-xs ml-2">행 단위 격리(RLS)로 다른 사용자 데이터는 절대 노출되지 않아요</span>
        )}
        {err && <span className="text-amber-400 text-xs ml-2">{err}</span>}
      </div>
      <button
        onClick={verify}
        disabled={busy}
        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white whitespace-nowrap disabled:opacity-50"
      >
        {busy ? "확인 중…" : proof ? "다시 확인" : "격리 증명 보기"}
      </button>
    </div>
  );
}

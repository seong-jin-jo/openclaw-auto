"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 성과는 메인 대시보드(/)로 통합됨 — 이 라우트는 구 링크 호환용 리다이렉트.
export default function PerformanceRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/"); }, [router]);
  return <div className="px-region py-stack-section"><p className="text-subtle">성과는 홈으로 통합되었습니다…</p></div>;
}

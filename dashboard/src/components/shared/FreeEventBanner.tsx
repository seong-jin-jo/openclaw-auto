"use client";

// 무료 서비스 이벤트 라벨 (회장 결정 2026-06-28) — 무료 유저는 자기 키 없이 쓰고 생성 비용은
// 운영자가 부담한다. 그 사실을 화면에 반드시 명시. 키를 등록하면(고급) 자기 과금으로 전환.
// 시맨틱 토큰만 사용(라이트/다크 양립).
export function FreeEventBanner({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2">
      <p className={compact ? "text-caption text-muted" : "text-xs text-muted"}>
        🎁 <b className="text-text">무료 서비스 이벤트</b>. 지금은 콘텐츠 생성 비용을{" "}
        <b className="text-text">저희가 부담</b>합니다. 키 등록 없이 바로 시작하세요.
        {!compact && (
          <span className="text-subtle"> (한시적 이벤트 · 이후 내 Anthropic 키 등록 시 내 과금으로 전환)</span>
        )}
      </p>
    </div>
  );
}

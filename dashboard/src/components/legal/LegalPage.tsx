import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-stack-section py-pad-inset">
          <Link href="/" className="text-body-sm font-semibold text-text">OSMU 마케팅 자동화</Link>
          <Link href="/login" className="text-body-sm text-accent hover:text-accent-hover">로그인</Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-stack-section py-wide">
        <p className="mb-stack text-caption text-subtle">최종 수정일: 2026년 8월 31일</p>
        <h1 className="mb-pad-inset text-display font-bold">{title}</h1>
        <p className="mb-wide text-body-sm leading-7 text-muted">{summary}</p>
        <div className="space-y-region text-body-sm leading-7 text-muted">{children}</div>
      </article>
      <footer className="border-t border-border py-region">
        <nav className="mx-auto flex max-w-3xl flex-wrap gap-stack-section px-stack-section text-caption text-subtle">
          <Link href="/privacy">개인정보처리방침</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/data-deletion">데이터 삭제 안내</Link>
          <a href="mailto:code0to1@gmail.com">문의</a>
        </nav>
      </footer>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-stack-tight text-lead font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

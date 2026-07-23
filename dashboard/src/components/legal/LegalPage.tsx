import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({ title, summary, children }: { title: string; summary: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold text-text">OSMU 마케팅 자동화</Link>
          <Link href="/login" className="text-sm text-accent hover:text-accent-hover">로그인</Link>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-12">
        <p className="mb-3 text-xs text-subtle">최종 수정일: 2026년 7월 23일</p>
        <h1 className="mb-4 text-3xl font-bold">{title}</h1>
        <p className="mb-10 text-sm leading-7 text-muted">{summary}</p>
        <div className="space-y-9 text-sm leading-7 text-muted">{children}</div>
      </article>
      <footer className="border-t border-border py-8">
        <nav className="mx-auto flex max-w-3xl flex-wrap gap-5 px-6 text-xs text-subtle">
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
      <h2 className="mb-2 text-lg font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

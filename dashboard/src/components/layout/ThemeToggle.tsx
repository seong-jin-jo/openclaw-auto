"use client";

import { useEffect, useState } from "react";

// 라이트(기본)/다크 토글. <html data-theme> + localStorage 'theme'. FOUC 방지는 layout의 인라인 스크립트가 담당.
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);
  const toggle = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch { /* ignore */ }
    setDark(!dark);
  };
  return (
    <button
      onClick={toggle}
      className="w-full flex items-center gap-2 px-1 py-1 text-xs text-subtle hover:text-muted transition-colors"
      title="테마 전환"
    >
      <span>{dark ? "☀️" : "🌙"}</span>
      {dark ? "라이트 모드" : "다크 모드"}
    </button>
  );
}

"use client";

import Link from "next/link";

// 발행 왕복 띠 (DESIGN.md `.tr59` · `[data-publish-trip]` · v59 · R193)
//
// 발행실 · 승인 인박스 · 발행 캘린더 셋이 서로 무엇을 하는 자리인지 화면이 한 번도 말하지 않아서
// "승인 인박스는 뭐고 발행 캘린더는 뭐냐"는 물음이 계속 나왔다. 셋을 한 줄로 세우고 각 자리가
// 하는 일을 낱말로 적는다. 세 자리 어디에 있든 같은 자리에 같은 모양으로 선다.
// 색만으로 지금 자리를 말하지 않고 낱말을 함께 둔다.

export type PublishTripStop = "publish" | "inbox" | "calendar";

const STOPS: { key: PublishTripStop; label: string; role: string; href: string }[] = [
  { key: "publish", label: "발행실", role: "정하는 자리", href: "/studio?room=publish" },
  { key: "inbox", label: "승인 인박스", role: "검토를 기다리는 자리", href: "/inbox" },
  { key: "calendar", label: "발행 캘린더", role: "언제 나갈지 잡는 자리", href: "/calendar" },
];

export function PublishTrip({ current }: { current: PublishTripStop }) {
  return (
    <nav
      data-publish-trip={current}
      aria-label="발행 왕복 띠"
      className="mb-stack-section flex flex-wrap items-stretch gap-stack-tight"
    >
      {STOPS.map((stop) => {
        const here = stop.key === current;
        const body = (
          <>
            <b className="block text-body-sm text-text">{stop.label}</b>
            <span className="block text-caption text-subtle">{stop.role}</span>
          </>
        );
        const shell = `min-w-0 flex-1 rounded-control border px-stack py-stack-tight ${
          here ? "border-accent bg-accent-soft" : "border-border bg-surface-2 hover:bg-surface"
        }`;
        return here ? (
          <span key={stop.key} data-publish-trip-here="true" aria-current="page" className={shell}>
            {body}
            <span className="block text-caption font-semibold text-accent">지금 여기</span>
          </span>
        ) : (
          <Link key={stop.key} href={stop.href} className={shell}>
            {body}
          </Link>
        );
      })}
    </nav>
  );
}

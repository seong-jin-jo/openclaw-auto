"use client";

import Link from "next/link";
import type { ReactNode } from "react";

// 네 방이 함께 쓰는 머리줄. 생성실, 편집실, 발행실에만 있고 성과실에서는 사라져 있어서
// 같은 서비스 안인데도 방을 옮기면 길잡이가 없어지는 문제가 있었다. 한 곳에서 만들어 네 방이
// 같은 자리, 같은 순서로 쓴다.

const ROOM_LINK_CLASS =
  "inline-flex min-h-control-touch items-center gap-micro rounded-control border border-border bg-surface-2 px-stack text-body-sm font-semibold text-muted hover:bg-surface";

export function RoomShortcutLinks() {
  return (
    <>
      <Link href="/inbox" title="발행 전에 검토를 기다리는 작업물 목록" className={ROOM_LINK_CLASS}>
        승인 인박스<span className="text-caption font-normal text-subtle">검토 대기</span>
      </Link>
      <Link href="/calendar" title="예약해 둔 발행 일정을 날짜별로 보는 곳" className={ROOM_LINK_CLASS}>
        발행 캘린더<span className="text-caption font-normal text-subtle">예약 일정</span>
      </Link>
    </>
  );
}

export function RoomBadge({ label }: { label: string }) {
  return (
    <span className="rounded-pill bg-accent-soft px-stack py-stack-tight text-caption font-semibold text-accent">
      {label}
    </span>
  );
}

export function RoomHeader({
  workspaceName,
  subtitle,
  roomLabel,
  leading,
  trailing,
  children,
}: {
  workspaceName?: string;
  subtitle: string;
  roomLabel: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header
      data-room-header={roomLabel}
      className="relative mb-stack-section flex flex-wrap items-center gap-stack border-b border-border pb-pad-inset"
    >
      <div className="mr-auto min-w-0">
        <b className="block truncate text-lead text-text">{workspaceName || "작업 공간"}</b>
        <span className="text-caption text-subtle">{subtitle}</span>
      </div>
      {leading}
      <RoomShortcutLinks />
      <RoomBadge label={roomLabel} />
      {trailing}
      {children}
    </header>
  );
}

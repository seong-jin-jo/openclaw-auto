"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { workspaceDisplayName } from "@/lib/workspace-display-name";

export type ProductRoom = "create" | "edit" | "publish" | "performance";

const ROOM_FLOW: ReadonlyArray<{ key: ProductRoom; number: string; label: string; href: string }> = [
  { key: "create", number: "01", label: "생성실", href: "/studio?room=create" },
  { key: "edit", number: "02", label: "편집실", href: "/studio?room=edit" },
  { key: "publish", number: "03", label: "발행실", href: "/studio?room=publish" },
  { key: "performance", number: "04", label: "성과실", href: "/performance" },
];

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

export function RoomFlowHeader({ currentRoom }: { currentRoom: ProductRoom }) {
  const activeIndex = ROOM_FLOW.findIndex((room) => room.key === currentRoom);

  return (
    <nav className="order-last grid w-full grid-cols-4 gap-stack-tight" aria-label="작업 단계" data-room-flow={currentRoom}>
      {ROOM_FLOW.map((room, index) => {
        const active = room.key === currentRoom;
        const done = index < activeIndex;
        return (
          <Link
            key={room.key}
            href={room.href}
            aria-current={active ? "step" : undefined}
            data-room-step={room.key}
            className={`flex min-h-control-touch min-w-0 items-center justify-center gap-micro rounded-control border px-stack-tight text-caption font-semibold transition-colors ${
              active
                ? "border-accent bg-accent-soft text-accent"
                : done
                  ? "border-border bg-surface-2 text-muted"
                  : "border-transparent text-subtle hover:border-border hover:bg-surface-2"
            }`}
          >
            <span className="tabular-nums">{room.number}</span>
            <span className="truncate">{room.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function RoomHeader({
  workspaceName,
  subtitle,
  roomLabel,
  currentRoom,
  leading,
  trailing,
  children,
}: {
  workspaceName?: string;
  subtitle: string;
  roomLabel: string;
  currentRoom?: ProductRoom;
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
        <b className="block truncate text-lead text-text">{workspaceDisplayName(workspaceName)}</b>
        <span className="text-caption text-subtle">{subtitle}</span>
      </div>
      {leading}
      <RoomShortcutLinks />
      <RoomBadge label={roomLabel} />
      {trailing}
      {children}
      {currentRoom ? <RoomFlowHeader currentRoom={currentRoom} /> : null}
    </header>
  );
}

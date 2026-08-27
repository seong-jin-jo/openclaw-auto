"use client";

import { useEffect, useMemo, useState } from "react";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/shared/Button";
import { Stack } from "@/components/shared/Stack";
import type { EditorHandoff, EditorHandoffKind } from "@/lib/studio/editor-handoff";

type TextVariants = {
  threads?: string;
  facebook?: string;
  x?: string;
  instagram?: { caption?: string; slides?: string[] };
  shorts?: { hook?: string; body?: string; cta?: string };
};

type StudioCommandPanelProps = {
  workspaceId: string;
  draftId: string | null;
  idea: string;
  text: TextVariants | null;
  imageUrl: string | null;
  videoUrl: string | null;
  initialHandoff: EditorHandoff | null;
  onDraftId: (draftId: string) => void;
  onHandoff: (handoff: EditorHandoff) => void;
  onQueueChanged: () => void;
};

type CommandResponse = {
  draft_id?: string;
  handoff?: EditorHandoff;
  reused?: boolean;
  error?: string;
};

function nonEmpty(values: Array<string | null | undefined>): string[] {
  return values.map((value) => value?.trim() || "").filter(Boolean);
}

export function StudioCommandPanel({
  workspaceId,
  draftId,
  idea,
  text,
  imageUrl,
  videoUrl,
  initialHandoff,
  onDraftId,
  onHandoff,
  onQueueChanged,
}: StudioCommandPanelProps) {
  const [handoff, setHandoff] = useState<EditorHandoff | null>(initialHandoff);
  const [selectedKind, setSelectedKind] = useState<EditorHandoffKind | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("만든 결과를 편집실로 넘기거나 발행 준비 큐로 이어 드릴게요.");
  const [error, setError] = useState("");

  useEffect(() => setHandoff(initialHandoff), [initialHandoff]);

  const availableKinds = useMemo(() => {
    const kinds: EditorHandoffKind[] = [];
    if (nonEmpty([text?.threads, text?.facebook, text?.x]).length > 0) kinds.push("text");
    if (imageUrl) kinds.push("image");
    if ((text?.instagram?.slides?.length ?? 0) > 0) kinds.push("card");
    if (videoUrl && nonEmpty([text?.shorts?.hook, text?.shorts?.body, text?.shorts?.cta]).length > 0) kinds.push("video");
    return kinds;
  }, [imageUrl, text, videoUrl]);

  useEffect(() => {
    if (!selectedKind || !availableKinds.includes(selectedKind)) setSelectedKind(availableKinds[0] ?? null);
  }, [availableKinds, selectedKind]);

  const updateHandoff = (next: EditorHandoff) => {
    setHandoff(next);
    onHandoff(next);
  };

  const command = async (body: Record<string, unknown>, progress: string, done: (response: CommandResponse) => string) => {
    setBusy(progress);
    setError("");
    try {
      const response = await apiPost<CommandResponse>("/api/studio/commands", { tenant_id: workspaceId, ...body });
      if (response.draft_id) onDraftId(response.draft_id);
      if (response.handoff) updateHandoff(response.handoff);
      setMessage(done(response));
      return response;
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : "명령을 실행하지 못했습니다";
      setError(reason);
      return null;
    } finally {
      setBusy("");
    }
  };

  const buildHandoff = () => {
    const summary = idea.trim() || nonEmpty([text?.threads, text?.facebook, text?.x])[0] || "Studio 원본 콘텐츠";
    if (selectedKind === "text") {
      return { kind: "text", summary, payload: { body: nonEmpty([text?.threads, text?.facebook, text?.x]).join("\n\n") } };
    }
    if (selectedKind === "image") {
      return { kind: "image", summary, payload: { asset_url: imageUrl, alt_text: summary } };
    }
    if (selectedKind === "card") {
      return {
        kind: "card",
        summary,
        payload: {
          slides: (text?.instagram?.slides ?? []).map((slide, order) => ({
            id: `slide-${order + 1}`,
            order,
            text: slide,
            image_url: order === 0 ? imageUrl : null,
          })),
        },
      };
    }
    const videoLines = nonEmpty([text?.shorts?.hook, text?.shorts?.body, text?.shorts?.cta]);
    return {
      kind: "video",
      summary,
      payload: {
        asset_url: videoUrl,
        scenes: videoLines.map((line, order) => ({
          id: `scene-${order + 1}`,
          order,
          title: order === 0 ? "시작" : order === videoLines.length - 1 ? "마무리" : "본문",
          lines: [{ id: `line-${order + 1}`, order: 0, text: line }],
        })),
      },
    };
  };

  const handoffToEditor = () => command({
    action: "handoff_to_editor",
    draft_id: draftId,
    idea,
    handoff: buildHandoff(),
  }, "편집실 인계 중", () => "편집실 작업물에 추가했습니다. 원본은 덮어쓰지 않았어요.");

  const reverseScenes = () => {
    if (!handoff || handoff.payload.kind !== "video") return;
    return command({
      action: "reorder_scenes",
      draft_id: draftId,
      expected_revision: handoff.revision,
      ordered_ids: [...handoff.payload.scenes].reverse().map((scene) => scene.id),
    }, "장면 순서 변경 중", () => "장면 순서를 바꾸고 revision을 올렸습니다.");
  };

  const firstLine = handoff?.payload.kind === "video" ? handoff.payload.scenes[0]?.lines[0] : null;
  const toggleFirstLine = () => {
    if (!handoff || !firstLine) return;
    const action = firstLine.visible ? "delete_line" : "restore_line";
    return command({
      action,
      draft_id: draftId,
      expected_revision: handoff.revision,
      line_id: firstLine.id,
    }, firstLine.visible ? "문장 삭제 중" : "문장 복원 중", () => firstLine.visible ? "첫 문장을 숨겼습니다. 복원할 수 있어요." : "첫 문장을 복원했습니다.");
  };

  const markReady = () => {
    if (!handoff) return;
    return command({
      action: "mark_ready",
      draft_id: draftId,
      expected_revision: handoff.revision,
    }, "발행 준비 확인 중", () => "OpenClaw가 받을 수 있는 상태로 표시했습니다.");
  };

  const enqueue = async () => {
    const response = await command({
      action: "enqueue_openclaw",
      draft_id: draftId,
    }, "OpenClaw 큐 인계 중", (result) => result.reused ? "이미 같은 revision을 넘겼습니다." : "OpenClaw 발행 준비 큐에 넣었습니다.");
    if (response) onQueueChanged();
  };

  return (
    <aside className="card min-w-0 p-pad-inset" aria-label="Studio 담당 대화" data-chat-dock="persistent">
      <Stack gap={16}>
        <Stack gap={4}>
          <p className="text-caption font-semibold text-subtle">Studio 담당</p>
          <p className="text-body-sm text-text break-keep" aria-live="polite">{busy || message}</p>
          {error ? <p className="text-caption text-danger break-keep" role="alert">{error}</p> : null}
        </Stack>

        {!handoff ? (
          <Stack gap={8}>
            <p className="text-caption text-muted">어떤 원본을 편집실로 넘길까요?</p>
            <Stack direction="horizontal" gap={8} wrap>
              {availableKinds.map((kind) => (
                <Button
                  key={kind}
                  size="sm"
                  variant={selectedKind === kind ? "primary" : "secondary"}
                  aria-pressed={selectedKind === kind}
                  onClick={() => setSelectedKind(kind)}
                >
                  {{ text: "글", image: "이미지", video: "영상", card: "카드뉴스", audio: "소리" }[kind]}
                </Button>
              ))}
            </Stack>
            <Button variant="primary" onClick={handoffToEditor} disabled={!selectedKind || Boolean(busy)}>
              편집실로 넘기기
            </Button>
          </Stack>
        ) : (
          <Stack gap={8}>
            <div className="rounded-lg border border-border bg-surface-2 p-stack">
              <p className="text-caption font-semibold text-text">{handoff.kind} · revision {handoff.revision}</p>
              <p className="text-caption text-subtle break-keep">{handoff.summary}</p>
            </div>
            {handoff.payload.kind === "video" ? (
              <Stack direction="horizontal" gap={8} wrap>
                <Button size="sm" onClick={reverseScenes} disabled={Boolean(busy)}>장면 순서 뒤집기</Button>
                <Button size="sm" onClick={toggleFirstLine} disabled={Boolean(busy)}>
                  {firstLine?.visible ? "첫 문장 삭제" : "첫 문장 복원"}
                </Button>
              </Stack>
            ) : null}
            {handoff.status === "editing" ? (
              <Button variant="primary" onClick={markReady} disabled={Boolean(busy)}>발행 준비 마치기</Button>
            ) : (
              <Button variant="primary" onClick={enqueue} disabled={Boolean(busy)}>OpenClaw 큐로 넘기기</Button>
            )}
          </Stack>
        )}
      </Stack>
    </aside>
  );
}

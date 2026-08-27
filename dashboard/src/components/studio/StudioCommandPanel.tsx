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
  editorLines?: string[];
  source?: { generationId?: string | null; candidateId?: string | null };
  initialHandoff: EditorHandoff | null;
  preferredKind?: EditorHandoffKind;
  onKindSelect?: (kind: EditorHandoffKind) => void;
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
  editorLines = [],
  source,
  initialHandoff,
  preferredKind,
  onKindSelect,
  onDraftId,
  onHandoff,
  onQueueChanged,
}: StudioCommandPanelProps) {
  const [handoff, setHandoff] = useState<EditorHandoff | null>(initialHandoff);
  const [selectedKind, setSelectedKind] = useState<EditorHandoffKind | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("만든 결과를 편집실로 넘기거나 발행 준비 큐로 이어 드릴게요.");
  const [error, setError] = useState("");
  const [chatDraft, setChatDraft] = useState("");

  useEffect(() => setHandoff(initialHandoff), [initialHandoff]);

  const availableKinds = useMemo(() => {
    const kinds: EditorHandoffKind[] = [];
    if (videoUrl && nonEmpty(editorLines.length ? editorLines : [text?.shorts?.hook, text?.shorts?.body, text?.shorts?.cta]).length > 0) kinds.push("video");
    if ((text?.instagram?.slides?.length ?? 0) > 0) kinds.push("card");
    if (imageUrl) kinds.push("image");
    if (nonEmpty([text?.threads, text?.facebook, text?.x]).length > 0) kinds.push("text");
    return kinds;
  }, [editorLines, imageUrl, text, videoUrl]);

  useEffect(() => {
    if (preferredKind && !availableKinds.includes(preferredKind)) {
      setSelectedKind(null);
      return;
    }
    if (preferredKind && availableKinds.includes(preferredKind)) {
      setSelectedKind(preferredKind);
      return;
    }
    if (!selectedKind || !availableKinds.includes(selectedKind)) {
      const next = availableKinds[0] ?? null;
      setSelectedKind(next);
    }
  }, [availableKinds, preferredKind, selectedKind]);

  const updateHandoff = (next: EditorHandoff) => {
    setHandoff(next);
    onHandoff(next);
  };

  const command = async (body: Record<string, unknown>, progress: string, done: (response: CommandResponse) => string) => {
    setBusy(progress);
    setError("");
    try {
      const response = await apiPost<CommandResponse>("/api/studio/commands", { tenant_id: workspaceId, ...body });
      if (!response) {
        setError("인증을 다시 확인해 주세요");
        return null;
      }
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
    const handoffSource = {
      generation_id: source?.generationId ?? null,
      candidate_id: source?.candidateId ?? null,
    };
    if (selectedKind === "text") {
      return { kind: "text", summary, source: handoffSource, payload: { body: nonEmpty([text?.threads, text?.facebook, text?.x]).join("\n\n") } };
    }
    if (selectedKind === "image") {
      return { kind: "image", summary, source: handoffSource, payload: { asset_url: imageUrl, alt_text: summary } };
    }
    if (selectedKind === "card") {
      return {
        kind: "card",
        summary,
        source: handoffSource,
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
    const videoLines = nonEmpty(editorLines.length ? editorLines : [text?.shorts?.hook, text?.shorts?.body, text?.shorts?.cta]);
    return {
      kind: "video",
      summary,
      source: handoffSource,
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

  const submitChat = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = chatDraft.trim();
    if (!value) return;
    setChatDraft("");
    setError("");
    const kind = ({ 글: "text", 이미지: "image", 영상: "video", 카드뉴스: "card", 소리: "audio" } as const)[value as "글" | "이미지" | "영상" | "카드뉴스" | "소리"];
    if (!handoff && kind && availableKinds.includes(kind)) {
      setSelectedKind(kind);
      onKindSelect?.(kind);
      setMessage(`${value} 원본을 고르셨습니다. 편집실로 넘길 수 있어요.`);
      return;
    }
    if (!handoff && /편집/.test(value)) await handoffToEditor();
    else if (handoff?.payload.kind === "video" && /순서/.test(value)) await reverseScenes();
    else if (handoff?.payload.kind === "video" && /첫 문장|삭제|복원/.test(value)) await toggleFirstLine();
    else if (handoff?.status === "editing" && /준비/.test(value)) await markReady();
    else if (handoff?.status !== "editing" && /큐|발행/.test(value)) await enqueue();
    else setError("화면에 보이는 선택지나 편집, 준비, 발행 명령으로 말씀해 주세요.");
  };

  return (
    <aside className="card min-w-0 overflow-hidden" aria-label="Studio 담당 대화" data-chat-dock="persistent">
      <div className="flex items-center gap-stack-tight border-b border-border p-stack">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-accent text-body font-bold text-accent-fg">O</div>
        <div><b className="block text-body text-text">Studio 담당</b><span className="text-caption text-success">지금 대기 중</span></div>
      </div>
      <div className="space-y-stack bg-surface-2 p-stack">
        <div className="max-w-[90%] rounded-xl rounded-tl-lg border border-border bg-surface p-stack">
          <p className="break-keep text-body-sm text-text" aria-live="polite">{busy || message}</p>
        </div>
        {error ? <p className="break-keep text-caption text-danger" role="alert">{error}</p> : null}

        {!handoff ? (
          <Stack gap={8}>
            <div className="max-w-[90%] rounded-xl rounded-tl-lg border border-border bg-surface p-stack text-caption text-muted">
              {preferredKind && !availableKinds.includes(preferredKind)
                ? `${{ video: "영상", card: "카드뉴스", audio: "소리", image: "이미지", text: "글" }[preferredKind]} 원본은 아직 준비 중입니다. 준비된 다른 원본을 고를 수 있습니다.`
                : "어떤 원본을 편집 작업물로 저장할까요?"}
            </div>
            <Stack direction="horizontal" gap={8} wrap aria-label="원본 빠른 답장">
              {availableKinds.map((kind) => (
                <Button
                  key={kind}
                  size="sm"
                  variant={selectedKind === kind ? "primary" : "secondary"}
                  aria-pressed={selectedKind === kind}
                  onClick={() => { setSelectedKind(kind); onKindSelect?.(kind); }}
                >
                  {{ text: "글", image: "이미지", video: "영상", card: "카드뉴스", audio: "소리" }[kind]}
                </Button>
              ))}
            </Stack>
            <Button variant="primary" onClick={handoffToEditor} disabled={!selectedKind || Boolean(busy)}>
              편집 작업물로 저장
            </Button>
          </Stack>
        ) : (
          <Stack gap={8}>
            <div className="rounded-xl border border-border bg-surface p-stack">
              <p className="text-caption font-semibold text-text">{{ text: "글", image: "이미지", video: "영상", card: "카드뉴스", audio: "소리" }[handoff.kind]} · 수정 {handoff.revision}</p>
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
      </div>
      <form onSubmit={submitChat} className="flex gap-stack-tight border-t border-border p-stack">
        <input aria-label="Studio 담당에게 명령" value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder="직접 쓰셔도 됩니다" className="min-h-control-touch min-w-0 flex-1 rounded-lg border border-border bg-surface px-stack text-body-sm text-text" />
        <Button type="submit" variant="primary">보내기</Button>
      </form>
    </aside>
  );
}

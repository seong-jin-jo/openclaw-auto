export type CurrentWorkStage = "create" | "edit" | "publish" | "performance";

export interface StudioDraftForCurrentWork {
  id?: unknown;
  idea?: unknown;
  text?: unknown;
  img?: unknown;
  vid?: unknown;
  editorHandoff?: unknown;
  status?: unknown;
  savedAt?: unknown;
}

export interface CurrentWork {
  draftId: string;
  idea: string;
  stage: CurrentWorkStage;
  stageLabel: "생성실" | "편집실" | "발행실" | "성과실";
  status: string;
  savedAt: string;
}

const STAGE_LABELS: Record<CurrentWorkStage, CurrentWork["stageLabel"]> = {
  create: "생성실",
  edit: "편집실",
  publish: "발행실",
  performance: "성과실",
};

function editorStatus(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const status = (value as { status?: unknown }).status;
  return typeof status === "string" ? status : null;
}

function stageOf(draft: StudioDraftForCurrentWork): CurrentWorkStage {
  const status = typeof draft.status === "string" ? draft.status : "draft";
  if (status === "published") return "performance";
  if (status === "partial" || status === "stopped") return "publish";

  const handoffStatus = editorStatus(draft.editorHandoff);
  if (handoffStatus === "ready_for_openclaw") return "publish";
  if (draft.editorHandoff || draft.text || draft.img || draft.vid) return "edit";
  return "create";
}

function normalizeSavedAt(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.toISOString() : null;
  }
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) {
    return null;
  }
  return value;
}

export function resolveCurrentWork(drafts: StudioDraftForCurrentWork[]): CurrentWork | null {
  const eligible = drafts
    .map((draft) => ({ draft, savedAt: normalizeSavedAt(draft.savedAt) }))
    .filter((candidate): candidate is { draft: StudioDraftForCurrentWork & { id: string }; savedAt: string } => (
      typeof candidate.draft.id === "string"
      && candidate.draft.id.trim().length > 0
      && candidate.savedAt !== null
    ))
    .sort((left, right) => Date.parse(right.savedAt) - Date.parse(left.savedAt));

  const current = eligible[0];
  if (!current) return null;
  const stage = stageOf(current.draft);
  return {
    draftId: current.draft.id,
    idea: typeof current.draft.idea === "string" && current.draft.idea.trim() ? current.draft.idea.trim() : "제목 없는 작업물",
    stage,
    stageLabel: STAGE_LABELS[stage],
    status: typeof current.draft.status === "string" && current.draft.status ? current.draft.status : "draft",
    savedAt: current.savedAt,
  };
}

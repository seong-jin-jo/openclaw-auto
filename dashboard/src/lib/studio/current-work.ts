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

export function resolveCurrentWork(drafts: StudioDraftForCurrentWork[]): CurrentWork | null {
  const eligible = drafts
    .filter((draft): draft is StudioDraftForCurrentWork & { id: string; savedAt: string } => (
      typeof draft.id === "string"
      && draft.id.trim().length > 0
      && typeof draft.savedAt === "string"
      && draft.savedAt.trim().length > 0
      && Number.isFinite(Date.parse(draft.savedAt))
    ))
    .sort((left, right) => Date.parse(right.savedAt) - Date.parse(left.savedAt));

  const current = eligible[0];
  if (!current) return null;
  const stage = stageOf(current);
  return {
    draftId: current.id,
    idea: typeof current.idea === "string" && current.idea.trim() ? current.idea.trim() : "제목 없는 작업물",
    stage,
    stageLabel: STAGE_LABELS[stage],
    status: typeof current.status === "string" && current.status ? current.status : "draft",
    savedAt: current.savedAt,
  };
}

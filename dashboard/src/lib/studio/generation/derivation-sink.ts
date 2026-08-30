import { withTenant } from "@/lib/db";
import { createEditorHandoff } from "@/lib/studio/editor-handoff";
import { saveEditorHandoff } from "@/lib/studio/editor-handoff-store";
import type { DerivationDraftSink } from "./service";

// 파생물은 한 덩어리로 뭉치지 않고 갈래마다 편집실 작업물 하나가 된다.
// 회원이 편집실에서 카드뉴스와 영상을 각각 열어 고칠 수 있어야 하기 때문이다.
export class EditorDerivationSink implements DerivationDraftSink {
  async createDraft(input: {
    workspaceId: string;
    summary: string;
    jobId: string;
    candidateId: string;
    payload: Parameters<DerivationDraftSink["createDraft"]>[0]["payload"];
  }): Promise<{ draftId: string; handoffId: string }> {
    const handoff = createEditorHandoff({
      kind: input.payload.kind,
      summary: input.summary,
      source: { generation_id: input.jobId, candidate_id: input.candidateId },
      payload: input.payload,
    });
    const saved = await saveEditorHandoff(input.workspaceId, {
      draftId: null,
      idea: input.summary,
      handoff,
    });
    return { draftId: saved.draftId, handoffId: saved.handoff.handoff_id };
  }

  async deleteDrafts(workspaceId: string, draftIds: readonly string[]): Promise<void> {
    if (draftIds.length === 0) return;
    await withTenant(workspaceId, async (sql) => {
      await sql`
        DELETE FROM drafts
        WHERE tenant_id = ${workspaceId} AND id = ANY(${sql.array([...draftIds])}::uuid[])`;
    });
  }
}

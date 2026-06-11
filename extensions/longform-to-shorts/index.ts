import { definePluginEntry, type AnyAgentTool } from "openclaw/plugin-sdk/core";
import { createLongformToShortsTool } from "./src/longform-to-shorts-tool.js";

// 롱폼(긴 글/URL) → 숏폼 후보 N개(훅+본문) 추출 익스텐션.
// claude -p 청킹으로 긴 텍스트를 의미 단위로 쪼개 각 청크에서 숏폼 소재를 뽑는다.
export default definePluginEntry({
  id: "longform-to-shorts",
  name: "Longform to Shorts",
  description: "Chunk long text/URL with claude -p and extract N short-form candidates (hook + body)",
  register(api) {
    api.registerTool(createLongformToShortsTool(api) as AnyAgentTool);
  },
});

import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";

const THREADS_API_BASE = "https://graph.threads.net/v1.0";

type ThreadsPublishConfig = {
  accessToken?: string;
  userId?: string;
};

function resolveConfig(api: OpenClawPluginApi): { accessToken: string; userId: string } {
  const pluginCfg = (api.pluginConfig ?? {}) as ThreadsPublishConfig;
  const accessToken =
    (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) ||
    process.env.THREADS_ACCESS_TOKEN ||
    "";
  const userId =
    (typeof pluginCfg.userId === "string" && pluginCfg.userId.trim()) ||
    process.env.THREADS_USER_ID ||
    "";
  if (!accessToken) {
    throw new Error(
      "Threads access token not configured. Set THREADS_ACCESS_TOKEN env var or configure in plugin settings.",
    );
  }
  if (!userId) {
    throw new Error(
      "Threads user ID not configured. Set THREADS_USER_ID env var or configure in plugin settings.",
    );
  }
  return { accessToken, userId };
}

const ThreadsPublishToolSchema = Type.Object(
  {
    text: Type.String({
      description: "The text content to publish on Threads. Max 500 characters.",
    }),
    image_url: Type.Optional(
      Type.String({
        description: "Public URL of an image to attach. When provided, the post becomes an IMAGE type instead of TEXT.",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createThreadsPublishTool(api: OpenClawPluginApi) {
  return {
    name: "threads_publish",
    label: "Threads Publish",
    description:
      "Publish a text or image post to Meta Threads. Uses 2-step flow: create media container, then publish. Pass image_url for image posts.",
    parameters: ThreadsPublishToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const text = readStringParam(rawParams, "text", { required: true });
      if (text.length > 500) {
        throw new Error(`Text exceeds 500 character limit (${text.length} chars).`);
      }

      const imageUrl = readStringParam(rawParams, "image_url");
      const { accessToken, userId } = resolveConfig(api);

      // Step 1: Create media container
      const createUrl = `${THREADS_API_BASE}/${userId}/threads`;
      const containerParams: Record<string, string> = {
        media_type: imageUrl ? "IMAGE" : "TEXT",
        text,
        access_token: accessToken,
      };
      if (imageUrl) {
        containerParams.image_url = imageUrl;
      }
      const createResp = await fetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(containerParams),
      });

      if (!createResp.ok) {
        const err = await createResp.text();
        throw new Error(`Threads container creation failed (${createResp.status}): ${err}`);
      }

      const createData = (await createResp.json()) as { id: string };
      const containerId = createData.id;

      // Step 2: Publish the container
      const publishUrl = `${THREADS_API_BASE}/${userId}/threads_publish`;
      const publishResp = await fetch(publishUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: accessToken,
        }),
      });

      if (!publishResp.ok) {
        const err = await publishResp.text();
        throw new Error(`Threads publish failed (${publishResp.status}): ${err}`);
      }

      const publishData = (await publishResp.json()) as { id: string };

      return jsonResult({
        success: true,
        threadsMediaId: publishData.id,
        containerId,
        textLength: text.length,
        mediaType: imageUrl ? "IMAGE" : "TEXT",
      });
    },
  };
}

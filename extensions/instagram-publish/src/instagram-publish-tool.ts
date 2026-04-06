import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const API_BASE = "https://graph.instagram.com/v21.0";

type Config = { accessToken?: string; userId?: string };

function resolveConfig(api: OpenClawPluginApi) {
  const pluginCfg = (api.pluginConfig ?? {}) as Config;
  const accessToken = (typeof pluginCfg.accessToken === "string" && pluginCfg.accessToken.trim()) || process.env.INSTAGRAM_ACCESSTOKEN || "";
  const userId = (typeof pluginCfg.userId === "string" && pluginCfg.userId.trim()) || process.env.INSTAGRAM_USERID || "";
  if (!accessToken) throw new Error("Instagram access token not configured. Set INSTAGRAM_ACCESSTOKEN env var.");
  if (!userId) throw new Error("Instagram user ID not configured. Set INSTAGRAM_USERID env var.");
  return { accessToken, userId };
}

async function uploadToPublic(localPath: string): Promise<string> {
  const filename = localPath.replace("/images/", "");
  const dataDir = process.env.DATA_DIR || "/home/node/data";
  const filePath = resolve(dataDir, "images", filename);
  const fileBuffer = await readFile(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([fileBuffer]), filename);
  const resp = await fetch("https://tmpfiles.org/api/v1/upload", { method: "POST", body: formData });
  if (!resp.ok) throw new Error(`Image upload failed (${resp.status})`);
  const data = (await resp.json()) as { data?: { url?: string } };
  const tmpUrl = data.data?.url;
  if (!tmpUrl) throw new Error("Image upload returned no URL.");
  return tmpUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");
}

async function resolveImageUrl(url: string): Promise<string> {
  if (url.startsWith("/images/")) return await uploadToPublic(url);
  return url;
}

const ToolSchema = Type.Object({
  caption: Type.String({ description: "Post caption. Max 2200 characters." }),
  image_urls: Type.Array(Type.String(), {
    description: "Array of image URLs (1-10). Local /images/ paths are auto-uploaded. 1 image = single post, 2+ = carousel.",
    minItems: 1,
    maxItems: 10,
  }),
}, { additionalProperties: false });

export function createInstagramPublishTool(api: OpenClawPluginApi) {
  return {
    name: "instagram_publish",
    label: "Instagram Publish",
    description: "Publish single image or carousel to Instagram. Pass image_urls array (1=single, 2+=carousel). Local /images/ paths are auto-uploaded to public URL. Max 2200 char caption.",
    parameters: ToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const caption = readStringParam(rawParams, "caption", { required: true });
      if (caption.length > 2200) throw new Error(`Caption exceeds 2200 char limit (${caption.length} chars).`);

      const imageUrls = rawParams.image_urls as string[];
      if (!imageUrls?.length) throw new Error("At least one image_url is required.");

      const { accessToken, userId } = resolveConfig(api);

      // Resolve all image URLs (upload local paths)
      const publicUrls: string[] = [];
      for (const url of imageUrls) {
        publicUrls.push(await resolveImageUrl(url));
      }

      let mediaId: string;

      if (publicUrls.length === 1) {
        // Single image post
        const createResp = await fetch(`${API_BASE}/${userId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ image_url: publicUrls[0], caption, access_token: accessToken }),
        });
        if (!createResp.ok) throw new Error(`IG container failed: ${await createResp.text()}`);
        const { id: containerId } = (await createResp.json()) as { id: string };

        const pubResp = await fetch(`${API_BASE}/${userId}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ creation_id: containerId, access_token: accessToken }),
        });
        if (!pubResp.ok) throw new Error(`IG publish failed: ${await pubResp.text()}`);
        const pub = (await pubResp.json()) as { id: string };
        mediaId = pub.id;
      } else {
        // Carousel: create children first, then carousel container, then publish
        const childIds: string[] = [];
        for (const url of publicUrls) {
          const childResp = await fetch(`${API_BASE}/${userId}/media`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              image_url: url,
              is_carousel_item: "true",
              access_token: accessToken,
            }),
          });
          if (!childResp.ok) throw new Error(`IG carousel child failed: ${await childResp.text()}`);
          const child = (await childResp.json()) as { id: string };
          childIds.push(child.id);
        }

        // Create carousel container
        const carouselResp = await fetch(`${API_BASE}/${userId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            media_type: "CAROUSEL",
            caption,
            children: childIds.join(","),
            access_token: accessToken,
          }),
        });
        if (!carouselResp.ok) throw new Error(`IG carousel container failed: ${await carouselResp.text()}`);
        const { id: carouselId } = (await carouselResp.json()) as { id: string };

        // Publish carousel
        const pubResp = await fetch(`${API_BASE}/${userId}/media_publish`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ creation_id: carouselId, access_token: accessToken }),
        });
        if (!pubResp.ok) throw new Error(`IG carousel publish failed: ${await pubResp.text()}`);
        const pub = (await pubResp.json()) as { id: string };
        mediaId = pub.id;
      }

      return jsonResult({
        success: true,
        mediaId,
        type: publicUrls.length === 1 ? "SINGLE" : "CAROUSEL",
        imageCount: publicUrls.length,
        captionLength: caption.length,
      });
    },
  };
}

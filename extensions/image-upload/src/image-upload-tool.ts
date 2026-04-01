import { Type } from "@sinclair/typebox";
import { jsonResult, readStringParam } from "openclaw/plugin-sdk/agent-runtime";
import type { OpenClawPluginApi } from "openclaw/plugin-sdk/plugin-runtime";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { randomUUID } from "node:crypto";

type ImageUploadConfig = {
  r2AccessKeyId?: string;
  r2SecretAccessKey?: string;
  r2Bucket?: string;
  r2PublicUrl?: string;
  r2Endpoint?: string;
};

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function resolveConfig(api: OpenClawPluginApi) {
  const cfg = (api.pluginConfig ?? {}) as ImageUploadConfig;

  const accessKeyId =
    (typeof cfg.r2AccessKeyId === "string" && cfg.r2AccessKeyId.trim()) ||
    process.env.R2_ACCESS_KEY_ID ||
    "";
  const secretAccessKey =
    (typeof cfg.r2SecretAccessKey === "string" && cfg.r2SecretAccessKey.trim()) ||
    process.env.R2_SECRET_ACCESS_KEY ||
    "";
  const bucket =
    (typeof cfg.r2Bucket === "string" && cfg.r2Bucket.trim()) ||
    process.env.R2_BUCKET ||
    "";
  const publicUrl =
    (typeof cfg.r2PublicUrl === "string" && cfg.r2PublicUrl.trim()) ||
    process.env.R2_PUBLIC_URL ||
    "";
  const endpoint =
    (typeof cfg.r2Endpoint === "string" && cfg.r2Endpoint.trim()) ||
    process.env.R2_ENDPOINT ||
    "";

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY env vars.",
    );
  }
  if (!bucket) {
    throw new Error("R2 bucket not configured. Set R2_BUCKET env var.");
  }
  if (!publicUrl) {
    throw new Error("R2 public URL not configured. Set R2_PUBLIC_URL env var.");
  }
  if (!endpoint) {
    throw new Error("R2 endpoint not configured. Set R2_ENDPOINT env var.");
  }

  return { accessKeyId, secretAccessKey, bucket, publicUrl: publicUrl.replace(/\/+$/, ""), endpoint };
}

const ImageUploadToolSchema = Type.Object(
  {
    action: Type.String({
      description: "Action: 'upload' to upload a local image file to R2.",
      enum: ["upload"],
    }),
    image_path: Type.String({
      description:
        "Local file path of the image to upload (e.g. data/images/my-image.jpg). Supports jpg, png, gif, webp.",
    }),
    folder: Type.Optional(
      Type.String({
        description:
          "Optional R2 folder/prefix (e.g. 'threads', 'x'). Defaults to 'posts'.",
      }),
    ),
  },
  { additionalProperties: false },
);

export function createImageUploadTool(api: OpenClawPluginApi) {
  return {
    name: "image_upload",
    label: "Image Upload",
    description:
      "Upload a local image to Cloudflare R2 and return its public URL. Use this before publishing image posts to Threads/X.",
    parameters: ImageUploadToolSchema,
    async execute(_toolCallId: string, rawParams: Record<string, unknown>) {
      const action = readStringParam(rawParams, "action", { required: true });
      if (action !== "upload") {
        throw new Error(`Unknown action: ${action}. Use 'upload'.`);
      }

      const imagePath = readStringParam(rawParams, "image_path", { required: true });
      const folder = readStringParam(rawParams, "folder") || "posts";

      const ext = extname(imagePath).toLowerCase();
      const contentType = MIME_TYPES[ext];
      if (!contentType) {
        throw new Error(
          `Unsupported image format: ${ext}. Supported: ${Object.keys(MIME_TYPES).join(", ")}`,
        );
      }

      const fileBuffer = await readFile(imagePath);
      const key = `${folder}/${randomUUID()}${ext}`;

      const config = resolveConfig(api);
      const s3 = new S3Client({
        region: "auto",
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });

      await s3.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        }),
      );

      const publicUrl = `${config.publicUrl}/${key}`;

      return jsonResult({
        success: true,
        publicUrl,
        key,
        size: fileBuffer.length,
        contentType,
      });
    },
  };
}

import fs from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/file-io";

const envPath = path.resolve(DATA_DIR, "../.env");

function readEnv(): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [k, ...rest] = trimmed.split("=");
      result[k] = rest.join("=");
    }
  } catch { /* file doesn't exist */ }
  return result;
}

export async function GET() {
  const env = readEnv();
  const r2: Record<string, string> = {};
  if (env.R2_ACCESS_KEY_ID) r2.accessKeyId = env.R2_ACCESS_KEY_ID;
  if (env.R2_SECRET_ACCESS_KEY) r2.secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  if (env.R2_BUCKET) r2.bucket = env.R2_BUCKET;
  if (env.R2_ENDPOINT) r2.endpoint = env.R2_ENDPOINT;
  if (env.R2_PUBLIC_URL) r2.publicUrl = env.R2_PUBLIC_URL;
  return Response.json(r2);
}

export async function POST(request: Request) {
  const data = await request.json();
  const existing = readEnv();

  const r2Map: Record<string, string> = {
    accessKeyId: "R2_ACCESS_KEY_ID",
    secretAccessKey: "R2_SECRET_ACCESS_KEY",
    bucket: "R2_BUCKET",
    endpoint: "R2_ENDPOINT",
    publicUrl: "R2_PUBLIC_URL",
  };

  for (const [key, envKey] of Object.entries(r2Map)) {
    const val = (data[key] || "").trim();
    if (val) existing[envKey] = val;
  }

  const lines = Object.entries(existing).map(([k, v]) => `${k}=${v}`);
  const dir = path.dirname(envPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(envPath, lines.join("\n") + "\n");
  return Response.json({ ok: true });
}

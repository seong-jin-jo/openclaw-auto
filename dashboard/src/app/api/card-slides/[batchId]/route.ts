import fs from "fs";
import path from "path";
import { DATA_DIR } from "@/lib/file-io";

const IMAGES_DIR = path.join(DATA_DIR, "images");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await params;

  if (!/^[a-f0-9]{8}$/.test(batchId)) {
    return Response.json({ error: "Invalid batch ID" }, { status: 400 });
  }

  if (!fs.existsSync(IMAGES_DIR)) {
    return Response.json({ batchId, slides: [] });
  }

  const prefix = `card-${batchId}-`;
  const slides = fs.readdirSync(IMAGES_DIR)
    .filter(f => f.startsWith(prefix) && f.endsWith(".png"))
    .sort()
    .map(f => ({ filename: f, url: `/images/${f}` }));

  return Response.json({ batchId, slides });
}

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DATA_DIR } from "@/lib/file-io";

const IMAGES_DIR = path.join(DATA_DIR, "images");
const ALLOWED_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof Blob)) {
    return Response.json({ error: "No file" }, { status: 400 });
  }

  const originalName = (file as File).name || "upload";
  const ext = path.extname(originalName).toLowerCase();

  if (!ALLOWED_EXTS.includes(ext)) {
    return Response.json({ error: `Unsupported format: ${ext}` }, { status: 400 });
  }

  const safeName = `${crypto.randomBytes(6).toString("hex")}${ext}`;
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  const savePath = path.join(IMAGES_DIR, safeName);
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(savePath, buf);

  return Response.json({ url: `/images/${safeName}`, filename: safeName });
}

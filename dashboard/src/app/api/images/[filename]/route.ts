import fs from "fs";
import path from "path";
import { dataPath } from "@/lib/file-io";

export async function DELETE(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;
  const filePath = path.join(dataPath("images"), filename);

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return Response.json({ error: "File not found" }, { status: 404 });
  }

  fs.unlinkSync(filePath);
  return Response.json({ success: true });
}

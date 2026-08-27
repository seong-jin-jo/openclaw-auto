import { listFirstCommentCapabilities } from "@/lib/first-comment";

export async function GET() {
  return Response.json({ capabilities: listFirstCommentCapabilities() });
}

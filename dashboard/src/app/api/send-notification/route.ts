import { sendNotification } from "@/lib/send-notification";

export async function POST(request: Request) {
  const { channel, message } = await request.json();

  if (!channel) {
    return Response.json({ error: "channel required" }, { status: 400 });
  }

  const result = await sendNotification(channel, message || "Marketing Hub notification");

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 500 });
  }

  return Response.json({ ok: true });
}

export async function GET() {
  return Response.json({
    id: process.env.TENANT_ID || "default",
    name: process.env.TENANT_NAME || "Marketing Hub",
    plan: "self-hosted",
    createdAt: null,
  });
}

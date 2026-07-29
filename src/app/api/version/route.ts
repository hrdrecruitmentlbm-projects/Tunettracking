import { CURRENT_VERSION } from "@/lib/version";

export async function GET() {
  return Response.json({ version: CURRENT_VERSION });
}

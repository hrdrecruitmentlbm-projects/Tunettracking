import { NextRequest, NextResponse } from "next/server";
import { setWebhook, getWebhookInfo } from "@/lib/telegram";

// POST /api/telegram/setup - Set the webhook URL
// GET  /api/telegram/setup - Get current webhook info
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const appUrl = body.url || process.env.NEXT_PUBLIC_APP_URL || "https://tunettracking.vercel.app";
    const webhookUrl = `${appUrl}/api/telegram/webhook`;

    const success = await setWebhook(webhookUrl);

    if (success) {
      return NextResponse.json({
        ok: true,
        message: "Webhook set successfully",
        webhookUrl,
      });
    }

    return NextResponse.json(
      { ok: false, error: "Failed to set webhook" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  const info = await getWebhookInfo();
  return NextResponse.json({
    ok: true,
    webhook: info,
  });
}

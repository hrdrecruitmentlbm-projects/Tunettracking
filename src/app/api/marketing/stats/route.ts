import { NextResponse } from "next/server";
import { fetchMarketingStats } from "@/lib/db";

export async function GET() {
  try {
    const stats = await fetchMarketingStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("GET /api/marketing/stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

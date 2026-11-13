import { NextRequest, NextResponse } from "next/server";
import { listPublicJobPosts } from "@/lib/server/employer-jobs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || undefined;
    const limitRaw = searchParams.get("limit");
    const limit = limitRaw ? Math.min(50, Math.max(1, Number(limitRaw) || 20)) : undefined;
    const items = await listPublicJobPosts({ query, limit });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("empleos GET:", error);
    return NextResponse.json({ error: "No se pudieron cargar las vacantes" }, { status: 500 });
  }
}

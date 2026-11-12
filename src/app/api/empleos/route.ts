import { NextResponse } from "next/server";
import { listPublicJobPosts } from "@/lib/server/employer-jobs";

export async function GET() {
  try {
    const items = await listPublicJobPosts();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("empleos GET:", error);
    return NextResponse.json({ error: "No se pudieron cargar las vacantes" }, { status: 500 });
  }
}

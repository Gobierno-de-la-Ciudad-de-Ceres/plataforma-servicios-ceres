import { NextResponse } from "next/server";
import { getPublicJobPost } from "@/lib/server/employer-jobs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const item = await getPublicJobPost(id);
    if (!item) {
      return NextResponse.json({ error: "Vacante no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    console.error("empleos/[id] GET:", error);
    return NextResponse.json({ error: "No se pudo cargar la vacante" }, { status: 500 });
  }
}

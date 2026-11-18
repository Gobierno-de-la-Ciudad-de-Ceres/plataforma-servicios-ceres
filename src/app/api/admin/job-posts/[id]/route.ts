import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiKey } from "@/lib/auth-helpers";
import { serializeJobPost } from "@/lib/server/employer-jobs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = requireAdminApiKey(_request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const post = await prisma.jobPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "not_found", message: "Vacante no encontrada" },
        { status: 404 },
      );
    }

    await prisma.jobPost.delete({ where: { id } });
    return NextResponse.json({
      success: true,
      message: "Vacante eliminada",
      data: serializeJobPost(post),
    });
  } catch (error) {
    console.error("admin job-posts DELETE:", error);
    return NextResponse.json(
      { success: false, error: "server_error", message: "No se pudo eliminar la vacante" },
      { status: 500 },
    );
  }
}

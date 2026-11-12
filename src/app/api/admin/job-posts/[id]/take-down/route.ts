import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiKey } from "@/lib/auth-helpers";
import { serializeJobPost } from "@/lib/server/employer-jobs";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = requireAdminApiKey(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const post = await prisma.jobPost.findUnique({ where: { id } });
    if (!post) {
      return NextResponse.json(
        { success: false, error: "not_found", message: "Vacante no encontrada" },
        { status: 404 },
      );
    }

    const updated = await prisma.jobPost.update({
      where: { id },
      data: {
        status: "taken_down",
        takenDownAt: new Date(),
        takenDownReason: body.reason?.trim() || "Dada de baja por administración",
      },
    });

    return NextResponse.json({ success: true, item: serializeJobPost(updated) });
  } catch (error) {
    console.error("admin job-posts take-down:", error);
    return NextResponse.json(
      { success: false, error: "server_error", message: "No se pudo dar de baja la vacante" },
      { status: 500 },
    );
  }
}

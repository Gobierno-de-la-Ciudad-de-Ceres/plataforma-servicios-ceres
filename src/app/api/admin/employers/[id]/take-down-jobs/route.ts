import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApiKey } from "@/lib/auth-helpers";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = requireAdminApiKey(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    const employer = await prisma.employer.findUnique({ where: { id } });
    if (!employer) {
      return NextResponse.json(
        { success: false, error: "not_found", message: "Empresa no encontrada" },
        { status: 404 },
      );
    }

    const reason = body.reason?.trim() || "Vacantes dadas de baja por administración";
    const result = await prisma.jobPost.updateMany({
      where: { employerId: employer.id, status: "active" },
      data: {
        status: "taken_down",
        takenDownAt: new Date(),
        takenDownReason: reason,
      },
    });

    return NextResponse.json({
      success: true,
      data: { updated: result.count },
      message: `${result.count} vacante(s) dadas de baja`,
    });
  } catch (error) {
    console.error("admin employers take-down-jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "server_error",
        message: "No se pudieron dar de baja las vacantes de la empresa",
      },
      { status: 500 },
    );
  }
}

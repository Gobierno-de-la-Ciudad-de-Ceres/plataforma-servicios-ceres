import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { prisma } from "@/lib/prisma";
import {
  EmployerJobsError,
  normalizeJobPostInput,
  requireEmployerForUser,
  serializeJobPost,
  type JobPostInput,
} from "@/lib/server/employer-jobs";

type RouteContext = { params: Promise<{ id: string }> };

async function requireOwnedPost(userId: string, id: string) {
  const employer = await requireEmployerForUser(userId);
  const post = await prisma.jobPost.findFirst({
    where: { id, employerId: employer.id },
  });
  if (!post) {
    throw new EmployerJobsError("Vacante no encontrada", 404, "not_found");
  }
  return { employer, post };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const { post } = await requireOwnedPost(session.user.id, id);
    if (post.status === "taken_down") {
      return NextResponse.json(
        { error: "Esta vacante fue dada de baja por administración y no se puede editar" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as JobPostInput & { status?: "active" | "closed" };
    const data = normalizeJobPostInput(body);
    const nextStatus = body.status === "closed" || body.status === "active" ? body.status : post.status;

    const updated = await prisma.jobPost.update({
      where: { id: post.id },
      data: {
        companyName: data.companyName,
        title: data.title,
        searchStartsAt: data.searchStartsAt,
        searchEndsAt: data.searchEndsAt,
        requirements: data.requirements,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        status: nextStatus,
        takenDownAt: null,
        takenDownReason: null,
      },
    });

    return NextResponse.json({ item: serializeJobPost(updated) });
  } catch (error) {
    if (error instanceof EmployerJobsError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("employer job-posts PATCH:", error);
    return NextResponse.json({ error: "No se pudo actualizar la vacante" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await context.params;
    const { post } = await requireOwnedPost(session.user.id, id);

    const updated = await prisma.jobPost.update({
      where: { id: post.id },
      data: { status: "closed" },
    });

    return NextResponse.json({ item: serializeJobPost(updated) });
  } catch (error) {
    if (error instanceof EmployerJobsError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("employer job-posts DELETE:", error);
    return NextResponse.json({ error: "No se pudo cerrar la vacante" }, { status: 500 });
  }
}

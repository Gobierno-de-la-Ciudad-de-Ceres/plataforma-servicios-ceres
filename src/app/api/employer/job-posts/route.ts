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

async function requireSessionUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new EmployerJobsError("No autorizado", 401, "unauthorized");
  }
  return session.user.id;
}

export async function GET() {
  try {
    const userId = await requireSessionUserId();
    const employer = await requireEmployerForUser(userId);
    const posts = await prisma.jobPost.findMany({
      where: { employerId: employer.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ items: posts.map(serializeJobPost) });
  } catch (error) {
    if (error instanceof EmployerJobsError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("employer job-posts GET:", error);
    return NextResponse.json({ error: "No se pudieron listar las vacantes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireSessionUserId();
    const employer = await requireEmployerForUser(userId);
    const body = (await request.json()) as JobPostInput;
    const data = normalizeJobPostInput(body);

    const post = await prisma.jobPost.create({
      data: {
        employerId: employer.id,
        companyName: data.companyName,
        title: data.title,
        searchStartsAt: data.searchStartsAt,
        searchEndsAt: data.searchEndsAt,
        requirements: data.requirements,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        status: "active",
      },
    });

    return NextResponse.json({ item: serializeJobPost(post) }, { status: 201 });
  } catch (error) {
    if (error instanceof EmployerJobsError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("employer job-posts POST:", error);
    return NextResponse.json({ error: "No se pudo publicar la vacante" }, { status: 500 });
  }
}

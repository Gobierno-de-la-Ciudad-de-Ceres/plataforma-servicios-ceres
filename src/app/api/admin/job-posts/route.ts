import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiKey } from "@/lib/auth-helpers";
import { serializeJobPost } from "@/lib/server/employer-jobs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAdminApiKey(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const status = searchParams.get("status") as "active" | "closed" | "taken_down" | null;
    const search = searchParams.get("search")?.trim() || undefined;

    const where: Prisma.JobPostWhereInput = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { companyName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { location: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { contactEmail: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.jobPost.count({ where }),
      prisma.jobPost.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employer: {
            select: {
              id: true,
              companyName: true,
              logoUrl: true,
              phone: true,
              taxId: true,
              taxIdType: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: posts.map(serializeJobPost),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("admin job-posts GET:", error);
    return NextResponse.json(
      { success: false, error: "server_error", message: "No se pudieron listar las vacantes" },
      { status: 500 },
    );
  }
}

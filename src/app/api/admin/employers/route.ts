import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminApiKey } from "@/lib/auth-helpers";
import { resolvePublicUploadUrl } from "@/lib/public-upload-url";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = requireAdminApiKey(request);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || undefined;

    const where: Prisma.EmployerWhereInput = {};
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { taxId: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { user: { email: { contains: search, mode: Prisma.QueryMode.insensitive } } },
      ];
    }

    const [total, employers] = await Promise.all([
      prisma.employer.count({ where }),
      prisma.employer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              jobPosts: true,
            },
          },
          jobPosts: {
            where: { status: "active" },
            select: { id: true },
          },
        },
      }),
    ]);

    const data = employers.map((employer) => ({
      id: employer.id,
      companyName: employer.companyName,
      taxId: employer.taxId,
      taxIdType: employer.taxIdType,
      phone: employer.phone,
      logoUrl: resolvePublicUploadUrl(employer.logoUrl) || employer.logoUrl,
      createdAt: employer.createdAt.toISOString(),
      updatedAt: employer.updatedAt.toISOString(),
      user: employer.user,
      jobPostsCount: employer._count.jobPosts,
      activeJobPostsCount: employer.jobPosts.length,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("admin employers GET:", error);
    return NextResponse.json(
      { success: false, error: "server_error", message: "No se pudieron listar las empresas" },
      { status: 500 },
    );
  }
}

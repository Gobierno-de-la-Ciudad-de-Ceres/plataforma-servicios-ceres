import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const employer = await prisma.employer.findUnique({
    where: { userId: session.user.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  if (!employer) {
    return NextResponse.json({ error: "Perfil de empresa no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    item: {
      id: employer.id,
      companyName: employer.companyName,
      taxId: employer.taxId,
      taxIdType: employer.taxIdType,
      phone: employer.phone,
      logoUrl: employer.logoUrl,
      user: employer.user,
    },
  });
}

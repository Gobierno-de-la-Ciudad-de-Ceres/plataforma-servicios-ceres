import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/options";
import { prisma } from "@/lib/prisma";
import { resolvePublicUploadUrl } from "@/lib/public-upload-url";

function serializeEmployer(employer: {
  id: string;
  companyName: string;
  taxId: string;
  taxIdType: string;
  phone: string;
  logoUrl: string;
  user?: unknown;
}) {
  return {
    id: employer.id,
    companyName: employer.companyName,
    taxId: employer.taxId,
    taxIdType: employer.taxIdType,
    phone: employer.phone,
    logoUrl: resolvePublicUploadUrl(employer.logoUrl) || employer.logoUrl,
    logoValue: employer.logoUrl,
    user: employer.user,
  };
}

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

  return NextResponse.json({ item: serializeEmployer(employer) });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const employer = await prisma.employer.findUnique({
    where: { userId: session.user.id },
  });
  if (!employer) {
    return NextResponse.json({ error: "Perfil de empresa no encontrado" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      companyName?: string;
      phone?: string;
      logoUrl?: string;
    };

    const companyName =
      body.companyName !== undefined ? body.companyName.trim() : employer.companyName;
    const phone = body.phone !== undefined ? body.phone.trim() : employer.phone;
    const logoUrl = body.logoUrl !== undefined ? body.logoUrl.trim() : employer.logoUrl;

    if (!companyName) {
      return NextResponse.json({ error: "El nombre de la empresa es obligatorio" }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: "El teléfono es obligatorio" }, { status: 400 });
    }
    if (!logoUrl) {
      return NextResponse.json({ error: "El logo de la empresa es obligatorio" }, { status: 400 });
    }

    const updated = await prisma.employer.update({
      where: { id: employer.id },
      data: { companyName, phone, logoUrl },
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

    // Mantener el nombre visible en vacantes activas alineado al perfil.
    await prisma.jobPost.updateMany({
      where: { employerId: employer.id, status: "active" },
      data: { companyName },
    });

    return NextResponse.json({ item: serializeEmployer(updated) });
  } catch (error) {
    console.error("employer me PATCH:", error);
    return NextResponse.json({ error: "No se pudo actualizar el perfil" }, { status: 500 });
  }
}

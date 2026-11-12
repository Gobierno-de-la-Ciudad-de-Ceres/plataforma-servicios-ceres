import type { JobPost, JobPostStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class EmployerJobsError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 400, code = "invalid_request") {
    super(message);
    this.name = "EmployerJobsError";
    this.status = status;
    this.code = code;
  }
}

export type JobPostInput = {
  companyName: string;
  title: string;
  searchStartsAt: string;
  searchEndsAt: string;
  requirements: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
};

function normalizeOptionalContact(value?: string | null) {
  const trimmed = value?.trim() || "";
  return trimmed.length ? trimmed : null;
}

export function validateTaxId(taxIdType: "cuit" | "dni", taxId: string) {
  const digits = taxId.replace(/\D/g, "");
  if (taxIdType === "dni") {
    if (!/^\d{7,8}$/.test(digits)) {
      throw new EmployerJobsError("El DNI debe tener entre 7 y 8 dígitos");
    }
    return digits;
  }

  if (!/^\d{11}$/.test(digits)) {
    throw new EmployerJobsError("El CUIT debe tener 11 dígitos");
  }
  return digits;
}

export function normalizeJobPostInput(input: JobPostInput) {
  const companyName = input.companyName?.trim() || "";
  const title = input.title?.trim() || "";
  const requirements = input.requirements?.trim() || "";
  const contactEmail = normalizeOptionalContact(input.contactEmail);
  const contactPhone = normalizeOptionalContact(input.contactPhone);

  if (!companyName) throw new EmployerJobsError("El nombre de la empresa es obligatorio");
  if (!title) throw new EmployerJobsError("La vacante es obligatoria");
  if (!requirements) throw new EmployerJobsError("Los requisitos son obligatorios");
  if (!input.searchStartsAt || !input.searchEndsAt) {
    throw new EmployerJobsError("El período de búsqueda es obligatorio");
  }

  const toDate = (value: string, endOfDay = false) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T${endOfDay ? "23:59:59" : "00:00:00"}`);
    }
    return new Date(value);
  };
  const searchStartsAt = toDate(input.searchStartsAt, false);
  const searchEndsAt = toDate(input.searchEndsAt, true);
  if (Number.isNaN(searchStartsAt.getTime()) || Number.isNaN(searchEndsAt.getTime())) {
    throw new EmployerJobsError("Fechas de búsqueda inválidas");
  }
  if (searchEndsAt < searchStartsAt) {
    throw new EmployerJobsError("La fecha de fin no puede ser anterior al inicio");
  }
  if (!contactEmail && !contactPhone) {
    throw new EmployerJobsError("Debés indicar al menos un correo o un teléfono de contacto para el CV");
  }
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
    throw new EmployerJobsError("El correo de contacto no es válido");
  }

  return {
    companyName,
    title,
    requirements,
    contactEmail,
    contactPhone,
    searchStartsAt,
    searchEndsAt,
  };
}

export async function getEmployerByUserId(userId: string) {
  return prisma.employer.findUnique({ where: { userId } });
}

export async function requireEmployerForUser(userId: string) {
  const employer = await getEmployerByUserId(userId);
  if (!employer) {
    throw new EmployerJobsError("Tu cuenta no tiene perfil de empresa", 403, "employer_required");
  }
  if (!employer.logoUrl?.trim()) {
    throw new EmployerJobsError("La empresa debe tener foto/logo de perfil", 400, "logo_required");
  }
  return employer;
}

export function publicJobWhere(now = new Date()): Prisma.JobPostWhereInput {
  return {
    status: "active",
    searchStartsAt: { lte: now },
    searchEndsAt: { gte: now },
  };
}

export function serializeJobPost(
  post: JobPost & {
    employer?: {
      id: string;
      companyName: string;
      logoUrl: string;
      phone: string;
    } | null;
  },
) {
  return {
    id: post.id,
    companyName: post.companyName,
    title: post.title,
    searchStartsAt: post.searchStartsAt.toISOString(),
    searchEndsAt: post.searchEndsAt.toISOString(),
    requirements: post.requirements,
    contactEmail: post.contactEmail,
    contactPhone: post.contactPhone,
    status: post.status as JobPostStatus,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    takenDownAt: post.takenDownAt?.toISOString() ?? null,
    takenDownReason: post.takenDownReason,
    employer: post.employer
      ? {
          id: post.employer.id,
          companyName: post.employer.companyName,
          logoUrl: post.employer.logoUrl,
          phone: post.employer.phone,
        }
      : undefined,
  };
}

export async function listPublicJobPosts() {
  const posts = await prisma.jobPost.findMany({
    where: publicJobWhere(),
    include: {
      employer: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return posts.map(serializeJobPost);
}

export async function getPublicJobPost(id: string) {
  const post = await prisma.jobPost.findFirst({
    where: { id, ...publicJobWhere() },
    include: {
      employer: {
        select: {
          id: true,
          companyName: true,
          logoUrl: true,
          phone: true,
        },
      },
    },
  });
  return post ? serializeJobPost(post) : null;
}

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateRandomToken } from "@/lib/utils";
import { enqueueEmailVerify } from "@/jobs/email.producer";
import { buildPersonFullName, normalizePersonNamePart } from "@/lib/person-name";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit-memory";
import { clientIp } from "@/lib/request-helpers";
import { EmployerJobsError, validateTaxId } from "@/lib/server/employer-jobs";

const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000;

type RegisterEmployerPayload = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  taxId: string;
  taxIdType: "cuit" | "dni";
  phone: string;
  logoUrl: string;
};

export async function POST(request: NextRequest) {
  const rl = rateLimit(`auth-register-employer:${clientIp(request)}`, LIMIT, WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta nuevamente mas tarde." },
      { status: 429, headers: rateLimitHeaders(rl) },
    );
  }

  try {
    const body = (await request.json()) as RegisterEmployerPayload;
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";
    const firstName = normalizePersonNamePart(body.firstName || "");
    const lastName = normalizePersonNamePart(body.lastName || "");
    const companyName = body.companyName?.trim() || "";
    const phone = body.phone?.trim() || "";
    const logoUrl = body.logoUrl?.trim() || "";
    const taxIdType = body.taxIdType;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Faltan datos de la cuenta (email, contraseña, nombre y apellido del contacto)" },
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }
    if (!companyName || !phone || !logoUrl || !taxIdType || !body.taxId) {
      return NextResponse.json(
        { error: "Faltan datos de la empresa (nombre, CUIT/DNI, teléfono y foto/logo)" },
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }
    if (taxIdType !== "cuit" && taxIdType !== "dni") {
      return NextResponse.json(
        { error: "Debés indicar si el documento es CUIT o DNI" },
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const taxId = validateTaxId(taxIdType, body.taxId);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400, headers: rateLimitHeaders(rl) },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const skipEmailVerification = process.env.DISABLE_EMAIL_VERIFICATION === "true";

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        name: buildPersonFullName(firstName, lastName),
        phone,
        role: "employer",
        verified: skipEmailVerification,
        emailVerifiedAt: skipEmailVerification ? new Date() : null,
        employer: {
          create: {
            companyName,
            taxId,
            taxIdType,
            phone,
            logoUrl,
          },
        },
      },
      include: { employer: true },
    });

    if (!skipEmailVerification) {
      const token = generateRandomToken(48);
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
      await prisma.verificationToken.create({
        data: { userId: user.id, token, expiresAt },
      });
      await enqueueEmailVerify({
        userId: user.id,
        email,
        token,
        firstName,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
        employerId: user.employer?.id,
        requiresEmailVerification: !skipEmailVerification,
      },
      { status: 201, headers: rateLimitHeaders(rl) },
    );
  } catch (error) {
    if (error instanceof EmployerJobsError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: rateLimitHeaders(rl) },
      );
    }
    console.error("register-employer error:", error);
    return NextResponse.json(
      { error: "No se pudo completar el registro" },
      { status: 500, headers: rateLimitHeaders(rl) },
    );
  }
}

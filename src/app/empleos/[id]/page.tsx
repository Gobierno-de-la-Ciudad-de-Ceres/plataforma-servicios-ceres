import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarRange, Mail, MapPin, Phone, Users } from "lucide-react";
import { EmployerLogo } from "@/components/features/EmployerLogo";
import { getPublicJobPost } from "@/lib/server/employer-jobs";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function EmpleoDetallePage({ params }: PageProps) {
  const { id } = await params;
  const item = await getPublicJobPost(id);
  if (!item) notFound();

  return (
    <div className="min-h-[60vh] bg-[#f8f9fa] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/empleos" className="mb-6 inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Volver a empleos
        </Link>

        <article className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-gray-200">
              <EmployerLogo
                logoUrl={item.employer?.logoUrl}
                alt={item.companyName}
                iconClassName="h-7 w-7"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{item.title}</h1>
              <p className="mt-1 text-base font-medium text-gray-700">{item.companyName}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
              <MapPin className="h-4 w-4 text-primary" />
              {item.location || "Ceres"}
            </p>
            <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
              <Users className="h-4 w-4 text-primary" />
              {item.positionsCount || 1} {(item.positionsCount || 1) === 1 ? "puesto" : "puestos"}
            </p>
            <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
              <CalendarRange className="h-4 w-4" />
              {formatDate(item.searchStartsAt)} — {formatDate(item.searchEndsAt)}
            </p>
          </div>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Descripción del puesto
            </h2>
            <div className="mt-3 whitespace-pre-line leading-7 text-gray-800">
              {item.description || "Sin descripción."}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Requisitos</h2>
            <div className="mt-3 whitespace-pre-line leading-7 text-gray-800">{item.requirements}</div>
          </section>

          <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50/70 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">
              Contacto para enviar CV
            </h2>
            <p className="mt-2 text-sm text-amber-900/80">
              Enviá tu CV directo a la empresa. Ceres en Red no almacena currículums.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {item.contactEmail ? (
                <a
                  href={`mailto:${item.contactEmail}?subject=${encodeURIComponent(`CV - ${item.title}`)}`}
                  className="inline-flex items-center gap-2 font-medium text-amber-950 hover:underline"
                >
                  <Mail className="h-4 w-4" />
                  {item.contactEmail}
                </a>
              ) : null}
              {item.contactPhone ? (
                <a
                  href={`tel:${item.contactPhone.replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-2 font-medium text-amber-950 hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  {item.contactPhone}
                </a>
              ) : null}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

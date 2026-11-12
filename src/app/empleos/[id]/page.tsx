import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, CalendarRange, Mail, Phone } from "lucide-react";
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
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border bg-gray-50">
              {item.employer?.logoUrl ? (
                <Image
                  src={item.employer.logoUrl}
                  alt={item.companyName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <Building2 className="h-7 w-7" />
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{item.title}</h1>
              <p className="mt-1 text-base font-medium text-gray-700">{item.companyName}</p>
            </div>
          </div>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
            <CalendarRange className="h-4 w-4" />
            Período de búsqueda: {formatDate(item.searchStartsAt)} — {formatDate(item.searchEndsAt)}
          </p>

          <section className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Requisitos</h2>
            <div className="mt-3 whitespace-pre-line text-gray-800 leading-7">{item.requirements}</div>
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

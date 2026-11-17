import Link from "next/link";
import { ArrowRight, Briefcase, CalendarRange, MapPin, Users } from "lucide-react";
import { EmployerLogo } from "@/components/features/EmployerLogo";
import { firstRequirement, truncateText } from "@/lib/job-post-text";
import { listPublicJobPosts } from "@/lib/server/employer-jobs";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string }>;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function EmpleosPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = (params.q || "").trim();
  const items = await listPublicJobPosts({ query: q || undefined }).catch((error) => {
    console.error("empleos page:", error);
    return [];
  });

  return (
    <div className="min-h-[60vh] bg-[#f8f9fa] px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Empleos en Ceres y zona</h1>
            <p className="mt-2 max-w-2xl text-gray-600">
              Vacantes publicadas por empresas y privados de la ciudad y la zona. Contactá directo por mail o teléfono
              para enviar tu CV.
              {q ? (
                <>
                  {" "}
                  Filtrado por <span className="font-semibold text-gray-900">&quot;{q}&quot;</span>.
                </>
              ) : null}
            </p>
          </div>
          <Link
            href="/auth/registro-empresa"
            className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Publicar vacante
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            Todavía no hay vacantes activas. Si tenés una empresa, registrate y publicá la primera.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const requirementPreview = firstRequirement(item.requirements);
              const descriptionPreview = truncateText(item.description || "", 160);

              return (
                <Link
                  key={item.id}
                  href={`/empleos/${item.id}`}
                  className="group block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex gap-4">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gray-200">
                      <EmployerLogo logoUrl={item.employer?.logoUrl} alt={item.companyName} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-gray-900">{item.title}</h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <Briefcase className="h-3.5 w-3.5" />
                          Vacante
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-700">{item.companyName}</p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {item.location || "Ceres"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          {item.positionsCount || 1}{" "}
                          {(item.positionsCount || 1) === 1 ? "puesto" : "puestos"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarRange className="h-3.5 w-3.5" />
                          {formatDate(item.searchStartsAt)} — {formatDate(item.searchEndsAt)}
                        </span>
                      </div>

                      {requirementPreview ? (
                        <p className="mt-3 text-sm text-gray-700">
                          <span className="font-medium text-gray-900">Requisito: </span>
                          {truncateText(requirementPreview, 120)}
                        </p>
                      ) : null}

                      {descriptionPreview ? (
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">{descriptionPreview}</p>
                      ) : null}

                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Más información
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

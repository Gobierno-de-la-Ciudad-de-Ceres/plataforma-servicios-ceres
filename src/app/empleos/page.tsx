import Link from "next/link";
import Image from "next/image";
import { Briefcase, Building2, CalendarRange } from "lucide-react";
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
            <h1 className="text-3xl font-bold text-gray-900">Empleos en Ceres</h1>
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
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/empleos/${item.id}`}
                className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border bg-gray-50">
                    {item.employer?.logoUrl ? (
                      <Image
                        src={item.employer.logoUrl}
                        alt={item.companyName}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
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
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">{item.requirements}</p>
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-gray-500">
                      <CalendarRange className="h-3.5 w-3.5" />
                      Búsqueda: {formatDate(item.searchStartsAt)} — {formatDate(item.searchEndsAt)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

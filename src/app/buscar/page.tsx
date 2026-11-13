import Link from "next/link";
import { Briefcase, Wrench } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { listPublicJobPosts } from "@/lib/server/employer-jobs";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function BuscarPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const q = (params.q || "").trim();

  const [services, jobs] = await Promise.all([
    q
      ? prisma.service.findMany({
          where: {
            available: true,
            professional: { status: "active" },
            OR: [
              { title: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
              { category: { name: { contains: q, mode: "insensitive" } } },
              {
                professional: {
                  OR: [
                    { user: { firstName: { contains: q, mode: "insensitive" } } },
                    { user: { lastName: { contains: q, mode: "insensitive" } } },
                    { bio: { contains: q, mode: "insensitive" } },
                  ],
                },
              },
            ],
          },
          include: {
            category: { select: { name: true, slug: true } },
            professional: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
          take: 20,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    listPublicJobPosts({ query: q || undefined, limit: 20 }),
  ]);

  return (
    <div className="min-h-[60vh] bg-[#f8f9fa] px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resultados de búsqueda</h1>
          <p className="mt-2 text-gray-600">
            {q ? (
              <>
                Buscaste <span className="font-semibold text-gray-900">&quot;{q}&quot;</span>
              </>
            ) : (
              "Escribí un servicio o una vacante para buscar."
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={q ? `/servicios?q=${encodeURIComponent(q)}` : "/servicios"} className="text-sm text-primary hover:underline">
              Ver solo servicios
            </Link>
            <Link href={q ? `/empleos?q=${encodeURIComponent(q)}` : "/empleos"} className="text-sm text-primary hover:underline">
              Ver solo empleos
            </Link>
          </div>
        </div>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
            <Wrench className="h-5 w-5 text-primary" />
            Servicios ({services.length})
          </h2>
          {services.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-white px-4 py-6 text-sm text-gray-500">
              No encontramos servicios con esa búsqueda.
            </p>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/profesionales/${service.professional.id}`}
                  className="block rounded-xl border bg-white p-4 shadow-sm transition hover:border-primary/40"
                >
                  <p className="font-semibold text-gray-900">{service.title}</p>
                  <p className="text-sm text-gray-600">
                    {service.professional.user.firstName} {service.professional.user.lastName}
                    {service.category?.name ? ` · ${service.category.name}` : ""}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
            <Briefcase className="h-5 w-5 text-primary" />
            Empleos ({jobs.length})
          </h2>
          {jobs.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-white px-4 py-6 text-sm text-gray-500">
              No encontramos vacantes con esa búsqueda.
            </p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/empleos/${job.id}`}
                  className="block rounded-xl border bg-white p-4 shadow-sm transition hover:border-primary/40"
                >
                  <p className="font-semibold text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-600">{job.companyName}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

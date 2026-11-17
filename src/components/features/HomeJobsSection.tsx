"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, CalendarRange, MapPin } from "lucide-react";
import { EmployerLogo } from "@/components/features/EmployerLogo";
import { truncateText } from "@/lib/job-post-text";
import type { JobPost } from "@/types";

type HomeJobsSectionProps = {
  jobs: JobPost[];
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}

export function HomeJobsSection({ jobs }: HomeJobsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (jobs.length === 0) {
    return (
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">
              Bolsa de trabajo
            </span>
            <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Empleos</h4>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 px-6 py-10 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Todavía no hay vacantes publicadas. Si tenés una empresa, podés publicar la primera.
          </p>
          <Link
            href="/auth/registro-empresa"
            className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Publicar un empleo
          </Link>
        </div>
      </section>
    );
  }

  const scrollByCards = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const amount = container.clientWidth * 0.8;
    container.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <span className="text-primary font-semibold tracking-wider text-sm uppercase mb-2 block">
            Bolsa de trabajo
          </span>
          <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Empleos</h4>
          <p className="mt-1 text-sm text-gray-500">Vacantes publicadas por empresas de Ceres y la zona</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => scrollByCards("left")}
            className="cursor-pointer w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Anterior"
          >
            <ArrowRight className="h-5 w-5 rotate-180" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards("right")}
            className="cursor-pointer w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            aria-label="Siguiente"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pr-12 no-scrollbar"
      >
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/empleos/${job.id}`}
            className="snap-start shrink-0 basis-[240px] sm:basis-[260px] md:basis-[280px] group"
          >
            <div className="relative flex h-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl">
              {/* Título/empresa arriba con fondo oscuro semitransparente: siempre legible sobre cualquier logo */}
              <div className="relative z-10 bg-gradient-to-b from-gray-950/90 via-gray-950/75 to-gray-950/40 px-4 pb-3 pt-4 text-white backdrop-blur-[2px]">
                <h5 className="text-lg font-bold leading-tight drop-shadow-sm">{job.title}</h5>
                <p className="mt-1 text-sm text-white/85 drop-shadow-sm">{job.companyName}</p>
              </div>

              <div className="relative min-h-0 flex-1 bg-white">
                {job.employer?.logoUrl ? (
                  <div className="absolute inset-0 p-8 transition-transform duration-500 group-hover:scale-105">
                    <EmployerLogo logoUrl={job.employer.logoUrl} alt={job.companyName} />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-800" />
                )}
              </div>

              <div className="relative z-10 space-y-2 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
                <p className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{job.location || "Ceres"}</span>
                  <span className="text-gray-300">·</span>
                  <span>
                    {job.positionsCount || 1} {(job.positionsCount || 1) === 1 ? "puesto" : "puestos"}
                  </span>
                </p>
                <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <CalendarRange className="h-3.5 w-3.5 shrink-0" />
                  {formatDate(job.searchStartsAt)} — {formatDate(job.searchEndsAt)}
                </p>
                <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">
                  {truncateText(job.description || job.requirements || "", 110)}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  Más información
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}

        <Link href="/empleos" className="snap-start shrink-0 basis-[240px] sm:basis-[260px] md:basis-[280px] group">
          <div className="relative flex h-[380px] items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-emerald-700 shadow-sm">
            <div className="p-6 text-center">
              <ArrowRight className="mx-auto mb-4 h-12 w-12 text-white transition-transform group-hover:translate-x-2" />
              <h5 className="text-lg font-bold leading-tight text-white">Ver toda la bolsa de trabajo</h5>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link
          href="/empleos"
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Ver todos los empleos
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Briefcase } from "lucide-react";
import type { JobPost } from "@/types";

type HomeJobsSectionProps = {
  jobs: JobPost[];
};

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
            <div className="relative h-[360px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300">
              {job.employer?.logoUrl ? (
                <Image
                  src={job.employer.logoUrl}
                  alt={job.companyName}
                  fill
                  sizes="280px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-800" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex items-end p-6">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    <Briefcase className="h-3.5 w-3.5" />
                    Vacante
                  </div>
                  <h5 className="text-white font-bold text-lg leading-tight">{job.title}</h5>
                  <p className="mt-1 text-sm text-white/80">{job.companyName}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}

        <Link href="/empleos" className="snap-start shrink-0 basis-[240px] sm:basis-[260px] md:basis-[280px] group">
          <div className="relative h-[360px] rounded-2xl overflow-hidden shadow-sm bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center">
            <div className="text-center p-6">
              <ArrowRight className="h-12 w-12 text-white mx-auto mb-4 group-hover:translate-x-2 transition-transform" />
              <h5 className="text-white font-bold text-lg leading-tight">Ver toda la bolsa de trabajo</h5>
            </div>
          </div>
        </Link>
      </div>

      <div className="text-center mt-8">
        <Link
          href="/empleos"
          className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Ver todos los empleos
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

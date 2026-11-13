"use client";

import Link from "next/link";
import { Briefcase, ChevronDown, Wrench } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeroCtaMenus() {
  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-8 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:shadow-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <Wrench className="h-4 w-4" aria-hidden="true" />
            Servicios
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-[240px]">
          <DropdownMenuItem asChild>
            <Link href="/servicios">Ver todos los servicios</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/auth/registro">Ofrecer mis servicios</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-amber-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-700"
          >
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            Empleo
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-[240px]">
          <DropdownMenuItem asChild>
            <Link href="/empleos">Bolsa de trabajo</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/auth/registro-empresa">Publicar un empleo</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

import { Building2 } from "lucide-react";
import { resolvePublicUploadUrl } from "@/lib/public-upload-url";
import { cn } from "@/lib/utils";

type EmployerLogoProps = {
  logoUrl?: string | null;
  alt: string;
  className?: string;
  iconClassName?: string;
};

/** Avatar de empresa: usa <img> + contain para logos con mucho margen (ej. escudos municipales). */
export function EmployerLogo({
  logoUrl,
  alt,
  className,
  iconClassName,
}: EmployerLogoProps) {
  const src = resolvePublicUploadUrl(logoUrl) || logoUrl || "";

  if (!src) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-gray-100 text-gray-400",
          className,
        )}
      >
        <Building2 className={cn("h-6 w-6", iconClassName)} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={cn("h-full w-full bg-black object-contain", className)}
    />
  );
}

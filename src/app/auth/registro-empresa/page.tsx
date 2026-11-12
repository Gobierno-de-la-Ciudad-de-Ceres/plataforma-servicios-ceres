"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { resolveStoredUploadValue, uploadRegistrationFile } from "@/lib/api/uploads";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  taxIdType: "cuit" | "dni" | "";
  taxId: string;
  phone: string;
  logoUrl: string;
};

const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  companyName: "",
  taxIdType: "",
  taxId: "",
  phone: "",
  logoUrl: "",
};

export default function RegistroEmpresaPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onLogoChange(file: File | null) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const uploaded = await uploadRegistrationFile(file, "image");
      patch("logoUrl", resolveStoredUploadValue(uploaded));
      toast.success("Logo subido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (!form.taxIdType) {
      toast.error("Seleccioná si es CUIT o DNI");
      return;
    }
    if (!form.logoUrl) {
      toast.error("La foto/logo de la empresa es obligatoria");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register-employer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          companyName: form.companyName,
          taxIdType: form.taxIdType,
          taxId: form.taxId,
          phone: form.phone,
          logoUrl: form.logoUrl,
        }),
      });
      const json = (await response.json()) as { error?: string; requiresEmailVerification?: boolean };
      if (!response.ok) {
        throw new Error(json.error || "No se pudo registrar la empresa");
      }

      toast.success(
        json.requiresEmailVerification
          ? "Empresa registrada. Revisá tu email para verificar la cuenta."
          : "Empresa registrada. Ya podés ingresar.",
      );
      router.push(json.requiresEmailVerification ? "/auth/login" : "/auth/login?callbackUrl=/dashboard/empleos");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error de registro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-[#f8f9fa] px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Building2 className="h-6 w-6 text-primary" />
              Registro de empresa / privado
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Creá tu cuenta para publicar vacantes en Ceres en Red. Los interesados te escriben por mail o teléfono: no
              subimos CVs a nuestros servidores.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Contacto responsable</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Nombre *</Label>
                    <Input value={form.firstName} onChange={(e) => patch("firstName", e.target.value)} required />
                  </div>
                  <div>
                    <Label>Apellido *</Label>
                    <Input value={form.lastName} onChange={(e) => patch("lastName", e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => patch("email", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Contraseña *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => patch("password", e.target.value)}
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>Confirmar contraseña *</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) => patch("confirmPassword", e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Datos de la empresa</h2>
                <div>
                  <Label>Nombre de la empresa / firma *</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => patch("companyName", e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Tipo de documento *</Label>
                    <Select
                      value={form.taxIdType}
                      onValueChange={(value: "cuit" | "dni") => patch("taxIdType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="CUIT o DNI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cuit">CUIT</SelectItem>
                        <SelectItem value="dni">DNI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{form.taxIdType === "dni" ? "DNI *" : "CUIT *"}</Label>
                    <Input value={form.taxId} onChange={(e) => patch("taxId", e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input value={form.phone} onChange={(e) => patch("phone", e.target.value)} required />
                </div>
                <div>
                  <Label>Foto / logo de la empresa *</Label>
                  <div className="mt-2 flex items-center gap-4">
                    {form.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={form.logoUrl} alt="Logo empresa" className="h-16 w-16 rounded-full object-cover border" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed text-gray-400">
                        <Upload className="h-5 w-5" />
                      </div>
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploadingLogo}
                      onChange={(e) => onLogoChange(e.target.files?.[0] || null)}
                    />
                  </div>
                </div>
              </section>

              <Button type="submit" className="w-full" disabled={loading || uploadingLogo}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Registrar empresa
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tenés cuenta?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Ingresar
                </Link>
                {" · "}
                ¿Ofrecés servicios?{" "}
                <Link href="/auth/registro" className="text-primary hover:underline">
                  Registro profesional
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

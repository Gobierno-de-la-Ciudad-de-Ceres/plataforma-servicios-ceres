"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmployerLogo } from "@/components/features/EmployerLogo";
import { resolveStoredUploadValue, uploadFile } from "@/lib/api/uploads";
import { JOB_DESCRIPTION_MAX } from "@/lib/job-post-text";
import { resolvePublicUploadUrl } from "@/lib/public-upload-url";
import type { JobPost } from "@/types";

type EmployerMe = {
  id: string;
  companyName: string;
  phone: string;
  logoUrl: string;
  logoValue?: string;
};

type FormState = {
  companyName: string;
  title: string;
  location: string;
  positionsCount: string;
  description: string;
  searchStartsAt: string;
  searchEndsAt: string;
  requirements: string;
  contactEmail: string;
  contactPhone: string;
};

const emptyForm: FormState = {
  companyName: "",
  title: "",
  location: "Ceres",
  positionsCount: "1",
  description: "",
  searchStartsAt: "",
  searchEndsAt: "",
  requirements: "",
  contactEmail: "",
  contactPhone: "",
};

function toDateInput(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function statusLabel(status: JobPost["status"]) {
  if (status === "active") return "Activa";
  if (status === "closed") return "Cerrada";
  return "Dada de baja";
}

export default function DashboardEmpleosPage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const [employer, setEmployer] = useState<EmployerMe | null>(null);
  const [items, setItems] = useState<JobPost[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [profileForm, setProfileForm] = useState({
    companyName: "",
    phone: "",
    logoUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [meRes, postsRes] = await Promise.all([
        fetch("/api/employer/me"),
        fetch("/api/employer/job-posts"),
      ]);

      if (meRes.status === 401 || postsRes.status === 401) {
        router.push("/auth/login?callbackUrl=/dashboard/empleos");
        return;
      }
      if (meRes.status === 404) {
        toast.error("Esta cuenta no es de empresa");
        router.push("/dashboard");
        return;
      }

      const meJson = (await meRes.json()) as { item?: EmployerMe; error?: string };
      const postsJson = (await postsRes.json()) as { items?: JobPost[]; error?: string };
      if (!meRes.ok) throw new Error(meJson.error || "No se pudo cargar la empresa");
      if (!postsRes.ok) throw new Error(postsJson.error || "No se pudieron cargar las vacantes");

      const me = meJson.item || null;
      setEmployer(me);
      setItems(postsJson.items || []);
      setProfileForm({
        companyName: me?.companyName || "",
        phone: me?.phone || "",
        logoUrl: me?.logoValue || me?.logoUrl || "",
      });
      setForm((prev) => ({
        ...prev,
        companyName: me?.companyName || prev.companyName,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/dashboard/empleos");
      return;
    }
    if (authStatus === "authenticated") {
      void loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus]);

  async function onLogoChange(file: File | null) {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const uploaded = await uploadFile(file, "image");
      setProfileForm((prev) => ({
        ...prev,
        logoUrl: resolveStoredUploadValue(uploaded),
      }));
      toast.success("Logo subido");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function onSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await fetch("/api/employer/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const json = (await response.json()) as { item?: EmployerMe; error?: string };
      if (!response.ok) throw new Error(json.error || "No se pudo guardar el perfil");
      toast.success("Perfil de empresa actualizado");
      setEmployer(json.item || null);
      setForm((prev) => ({
        ...prev,
        companyName: json.item?.companyName || prev.companyName,
      }));
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  function startEdit(item: JobPost) {
    setEditingId(item.id);
    setForm({
      companyName: item.companyName,
      title: item.title,
      location: item.location || "Ceres",
      positionsCount: String(item.positionsCount || 1),
      description: item.description || "",
      searchStartsAt: toDateInput(item.searchStartsAt),
      searchEndsAt: toDateInput(item.searchEndsAt),
      requirements: item.requirements,
      contactEmail: item.contactEmail || "",
      contactPhone: item.contactPhone || "",
    });
    window.location.hash = "nueva-vacante";
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      companyName: employer?.companyName || "",
    });
  }

  async function onSubmitVacancy(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/employer/job-posts/${editingId}` : "/api/employer/job-posts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const json = (await response.json()) as { item?: JobPost; error?: string };
      if (!response.ok) throw new Error(json.error || "No se pudo guardar");
      toast.success(editingId ? "Vacante actualizada" : "Vacante publicada");
      cancelEdit();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function onClose(id: string) {
    try {
      const response = await fetch(`/api/employer/job-posts/${id}`, { method: "DELETE" });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(json.error || "No se pudo cerrar");
      toast.success("Vacante cerrada");
      if (editingId === id) cancelEdit();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cerrar");
    }
  }

  if (loading || authStatus === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const logoPreview = resolvePublicUploadUrl(profileForm.logoUrl) || profileForm.logoUrl;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-[#006F4B] via-[#008255] to-[#004d35] px-4 py-10 text-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-white/30">
              <EmployerLogo logoUrl={employer?.logoUrl} alt={employer?.companyName || "Empresa"} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
                Espacio empresa
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                {employer?.companyName || "Mis vacantes"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/85">
                Editá el perfil de tu empresa, publicá avisos y actualizá las vacantes cuando haga falta.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="bg-white text-[#006F4B] hover:bg-white/90">
              <Link href="#nueva-vacante">
                <Plus className="mr-1 h-4 w-4" />
                Publicar un empleo
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10">
              <Link href="/empleos">Ver bolsa de trabajo</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <Card id="perfil-empresa">
          <CardHeader>
            <CardTitle className="text-lg">Perfil de la empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSaveProfile} className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-20 w-20 overflow-hidden rounded-full border">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo" className="h-full w-full bg-white object-contain p-1" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <Upload className="h-5 w-5" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label>Logo / foto de perfil *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    className="mt-2"
                    disabled={uploadingLogo || savingProfile}
                    onChange={(e) => void onLogoChange(e.target.files?.[0] || null)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recomendado: logo centrado, fondo simple. Se muestra redondo en la bolsa de trabajo.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nombre de la empresa *</Label>
                  <Input
                    value={profileForm.companyName}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, companyName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={savingProfile || uploadingLogo}>
                {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Guardar perfil
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card id="nueva-vacante">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? "Editar vacante" : "Nueva vacante"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmitVacancy} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Nombre de la empresa *</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Vacante *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                    required
                    placeholder="Ej. Ayudante de cocina"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Ubicación *</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    required
                    placeholder="Ej. Ceres, Santa Fe"
                  />
                </div>
                <div>
                  <Label>Cantidad de puestos *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={form.positionsCount}
                    onChange={(e) => setForm((p) => ({ ...p, positionsCount: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Inicio de la búsqueda *</Label>
                  <Input
                    type="date"
                    value={form.searchStartsAt}
                    onChange={(e) => setForm((p) => ({ ...p, searchStartsAt: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Fin de la búsqueda *</Label>
                  <Input
                    type="date"
                    value={form.searchEndsAt}
                    onChange={(e) => setForm((p) => ({ ...p, searchEndsAt: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <Label>Descripción del puesto * (máx. {JOB_DESCRIPTION_MAX})</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      description: e.target.value.slice(0, JOB_DESCRIPTION_MAX),
                    }))
                  }
                  required
                  rows={4}
                  maxLength={JOB_DESCRIPTION_MAX}
                  placeholder="Breve descripción de tareas, jornada, condiciones, etc."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.description.length}/{JOB_DESCRIPTION_MAX} caracteres
                </p>
              </div>
              <div>
                <Label>Requisitos para el puesto *</Label>
                <Textarea
                  value={form.requirements}
                  onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                  required
                  rows={5}
                  placeholder="Experiencia, horarios, tareas, etc."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Email para enviar CV</Label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Teléfono para enviar CV</Label>
                  <Input
                    value={form.contactPhone}
                    onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Obligatorio al menos un contacto: email o teléfono.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingId ? "Guardar cambios" : "Publicar vacante"}
                </Button>
                {editingId ? (
                  <Button type="button" variant="outline" onClick={cancelEdit}>
                    Cancelar edición
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Publicadas</h2>
          {items.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-sm text-gray-500">
              Todavía no publicaste vacantes.
            </p>
          ) : (
            items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <Badge variant={item.status === "active" ? "default" : "secondary"}>
                        {statusLabel(item.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{item.companyName}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {item.location || "Ceres"} · {item.positionsCount || 1}{" "}
                      {(item.positionsCount || 1) === 1 ? "puesto" : "puestos"} ·{" "}
                      {new Date(item.searchStartsAt).toLocaleDateString("es-AR")} —{" "}
                      {new Date(item.searchEndsAt).toLocaleDateString("es-AR")}
                    </p>
                    {item.status === "taken_down" && item.takenDownReason ? (
                      <p className="mt-2 text-xs text-red-600">{item.takenDownReason}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/empleos/${item.id}`}>Ver</Link>
                    </Button>
                    {item.status !== "taken_down" ? (
                      <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                    ) : null}
                    {item.status === "active" ? (
                      <Button variant="destructive" size="sm" onClick={() => onClose(item.id)}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Cerrar
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

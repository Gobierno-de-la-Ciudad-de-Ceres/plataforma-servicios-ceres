"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { JobPost } from "@/types";

type EmployerMe = {
  id: string;
  companyName: string;
  logoUrl: string;
};

type FormState = {
  companyName: string;
  title: string;
  searchStartsAt: string;
  searchEndsAt: string;
  requirements: string;
  contactEmail: string;
  contactPhone: string;
};

const emptyForm: FormState = {
  companyName: "",
  title: "",
  searchStartsAt: "",
  searchEndsAt: "",
  requirements: "",
  contactEmail: "",
  contactPhone: "",
};

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

      setEmployer(meJson.item || null);
      setItems(postsJson.items || []);
      setForm((prev) => ({
        ...prev,
        companyName: meJson.item?.companyName || prev.companyName,
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

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/employer/job-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await response.json()) as { item?: JobPost; error?: string };
      if (!response.ok) throw new Error(json.error || "No se pudo publicar");
      toast.success("Vacante publicada");
      setForm({
        ...emptyForm,
        companyName: employer?.companyName || "",
      });
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al publicar");
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

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis vacantes</h1>
          <p className="text-sm text-gray-600">
            {employer?.companyName
              ? `Publicá avisos de empleo para ${employer.companyName}.`
              : "Publicá avisos de empleo."}{" "}
            Los interesados te contactan por fuera.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/empleos">Ver cartelera pública</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5" />
            Nueva vacante
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-4">
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
            <p className="text-xs text-muted-foreground">Obligatorio al menos un contacto: email o teléfono.</p>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Publicar vacante
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Publicadas</h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed p-6 text-sm text-gray-500">Todavía no publicaste vacantes.</p>
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
                    {new Date(item.searchStartsAt).toLocaleDateString("es-AR")} —{" "}
                    {new Date(item.searchEndsAt).toLocaleDateString("es-AR")}
                  </p>
                  {item.status === "taken_down" && item.takenDownReason ? (
                    <p className="mt-2 text-xs text-red-600">{item.takenDownReason}</p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {item.status === "active" ? (
                    <>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/empleos/${item.id}`}>Ver</Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => onClose(item.id)}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Cerrar
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

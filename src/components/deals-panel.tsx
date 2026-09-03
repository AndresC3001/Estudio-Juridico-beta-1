import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteDeal, saveDeal, type ClientRow, type DealRow } from "@/lib/crm.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_OPTIONS: { value: DealRow["status"]; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_curso", label: "En curso" },
  { value: "ganado", label: "Ganado" },
  { value: "perdido", label: "Perdido" },
];

const STATUS_STYLES: Record<DealRow["status"], string> = {
  nuevo: "bg-secondary text-secondary-foreground",
  en_curso: "bg-chart-2/20 text-foreground",
  ganado: "bg-primary text-primary-foreground",
  perdido: "bg-muted text-muted-foreground",
};

type DealForm = {
  id?: string;
  title: string;
  value: string;
  status: DealRow["status"];
  client_id: string;
};

const emptyForm: DealForm = { title: "", value: "", status: "nuevo", client_id: "" };

const fmtEUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function DealsPanel({
  deals,
  clients,
  loading,
}: {
  deals: DealRow[];
  clients: ClientRow[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveDeal);
  const remove = useServerFn(deleteDeal);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DealForm>(emptyForm);
  const [busy, setBusy] = useState(false);

  const clientName = (id: string | null) =>
    clients.find((c) => c.id === id)?.name ?? "Sin cliente";

  function openNew() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(deal: DealRow) {
    setForm({
      id: deal.id,
      title: deal.title,
      value: String(deal.value),
      status: deal.status,
      client_id: deal.client_id ?? "",
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setBusy(true);
    try {
      await save({
        id: form.id,
        title: form.title.trim(),
        value: Number(form.value || 0),
        status: form.status,
        client_id: form.client_id || null,
      });
      toast.success(form.id ? "Trato actualizado" : "Trato creado");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el trato");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(deal: DealRow) {
    try {
      await remove({ id: deal.id });
      toast.success("Trato eliminado");
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el trato");
    }
  }

  async function handleStatusChange(deal: DealRow, status: DealRow["status"]) {
    try {
      await save({
        id: deal.id,
        title: deal.title,
        value: Number(deal.value),
        status,
        client_id: deal.client_id,
      });
      toast.success("Estado actualizado");
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-display text-lg font-medium text-foreground">Tratos</h2>
        <Button size="sm" onClick={openNew}>
          Nuevo trato
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2 px-5 pb-5">
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
          <Skeleton className="h-14" />
        </div>
      ) : deals.length === 0 ? (
        <div className="px-5 pb-8 pt-2 text-center text-sm text-muted-foreground">
          Aún no hay tratos. Registra tu primera oportunidad.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {deals.map((deal) => (
            <li key={deal.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium text-foreground">{deal.title}</span>
                  <span
                    className={
                      "rounded-full px-2 py-0.5 text-xs font-medium " +
                      STATUS_STYLES[deal.status]
                    }
                  >
                    {STATUS_OPTIONS.find((s) => s.value === deal.status)?.label}
                  </span>
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {clientName(deal.client_id)} · {fmtEUR.format(Number(deal.value))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={deal.status}
                  onValueChange={(value) => handleStatusChange(deal, value as DealRow["status"])}
                >
                  <SelectTrigger size="sm" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={() => openEdit(deal)}>
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(deal)}
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar trato" : "Nuevo trato"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deal-title">Título *</Label>
              <Input
                id="deal-title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ej. Renovación anual con Acme"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="deal-value">Valor (€)</Label>
                <Input
                  id="deal-value"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  placeholder="1500"
                />
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) =>
                    setForm({ ...form, status: value as DealRow["status"] })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={form.client_id || "none"}
                onValueChange={(value) =>
                  setForm({ ...form, client_id: value === "none" ? "" : value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Guardando…" : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteClient,
  saveClient,
  type ClientRow,
} from "@/lib/crm.functions";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ClientForm = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const emptyForm: ClientForm = { name: "", email: "", phone: "", notes: "" };

export function ClientsPanel({
  clients,
  loading,
}: {
  clients: ClientRow[];
  loading: boolean;
}) {
  const queryClient = useQueryClient();
  const save = useServerFn(saveClient);
  const remove = useServerFn(deleteClient);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [busy, setBusy] = useState(false);

  function openNew() {
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(client: ClientRow) {
    setForm({
      id: client.id,
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      notes: client.notes ?? "",
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setBusy(true);
    try {
      await save({
        id: form.id,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success(form.id ? "Cliente actualizado" : "Cliente creado");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el cliente");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(client: ClientRow) {
    try {
      await remove({ id: client.id });
      toast.success("Cliente eliminado");
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar el cliente");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-display text-lg font-medium text-foreground">Clientes</h2>
        <Button size="sm" onClick={openNew}>
          Nuevo cliente
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2 px-5 pb-5">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : clients.length === 0 ? (
        <div className="px-5 pb-8 pt-2 text-center text-sm text-muted-foreground">
          Aún no hay clientes. Crea el primero con el botón de arriba.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead className="hidden md:table-cell">Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {client.email || "—"}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {client.phone || "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(client)}
                    className="mr-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(client)}
                  >
                    Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client-name">Nombre *</Label>
              <Input
                id="client-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nombre y apellidos o empresa"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Teléfono</Label>
                <Input
                  id="client-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-notes">Notas</Label>
              <Textarea
                id="client-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Observaciones, historial, preferencias…"
              />
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

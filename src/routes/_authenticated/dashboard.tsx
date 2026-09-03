import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDashboardData } from "@/lib/crm.functions";
import { ClientsPanel } from "@/components/clients-panel";
import { DealsPanel } from "@/components/deals-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Panel — Gestión de clientes y ventas" },
      { name: "description", content: "Resumen de clientes, tratos y métricas de tu negocio." },
    ],
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const context = Route.useRouteContext();
  const fetchDashboard = useServerFn(getDashboardData);
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  const fmtEUR = new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              Panel CRM
            </span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {context.user.email}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-medium tracking-tight text-foreground">
          Resumen
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todo lo que mueve tu negocio, de un vistazo.
        </p>

        {error ? (
          <div className="mt-8 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            No se pudieron cargar los datos: {error instanceof Error ? error.message : "error"}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {isLoading ? (
              <>
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
                <Skeleton className="h-28 rounded-xl" />
              </>
            ) : (
              <>
                <MetricCard
                  label="Clientes"
                  value={String(data?.metrics.totalClients ?? 0)}
                  hint="fichas registradas"
                />
                <MetricCard
                  label="Pipeline abierto"
                  value={fmtEUR.format(data?.metrics.pipelineValue ?? 0)}
                  hint="tratos en curso o nuevos"
                  highlight
                />
                <MetricCard
                  label="Ganado"
                  value={fmtEUR.format(data?.metrics.wonValue ?? 0)}
                  hint={`${data?.metrics.wonCount ?? 0} tratos cerrados`}
                />
              </>
            )}
          </div>
        )}

        <Tabs defaultValue="clientes" className="mt-10">
          <TabsList>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
            <TabsTrigger value="tratos">Tratos</TabsTrigger>
          </TabsList>
          <TabsContent value="clientes" className="mt-4">
            <ClientsPanel clients={data?.clients ?? []} loading={isLoading} />
          </TabsContent>
          <TabsContent value="tratos" className="mt-4">
            <DealsPanel deals={data?.deals ?? []} clients={data?.clients ?? []} loading={isLoading} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border p-5 " +
        (highlight
          ? "border-primary/30 bg-primary text-primary-foreground"
          : "border-border bg-card")
      }
    >
      <div className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</div>
      <div className="font-display mt-2 text-3xl font-medium tracking-tight">{value}</div>
      <div className="mt-1 text-xs opacity-70">{hint}</div>
    </div>
  );
}

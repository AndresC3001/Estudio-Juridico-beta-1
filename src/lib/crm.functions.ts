import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type DealRow = {
  id: string;
  title: string;
  value: number;
  status: "nuevo" | "en_curso" | "ganado" | "perdido";
  client_id: string | null;
  created_at: string;
};

export type DashboardData = {
  clients: ClientRow[];
  deals: DealRow[];
  metrics: {
    totalClients: number;
    pipelineValue: number;
    wonValue: number;
    wonCount: number;
  };
};

export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId } = context;
    const [clientsRes, dealsRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, name, email, phone, notes, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("deals")
        .select("id, title, value, status, client_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);
    if (clientsRes.error) throw clientsRes.error;
    if (dealsRes.error) throw dealsRes.error;

    const clients = (clientsRes.data ?? []) as ClientRow[];
    const deals = (dealsRes.data ?? []) as DealRow[];
    const open = deals.filter((d) => d.status === "nuevo" || d.status === "en_curso");
    const won = deals.filter((d) => d.status === "ganado");

    return {
      clients,
      deals,
      metrics: {
        totalClients: clients.length,
        pipelineValue: open.reduce((sum, d) => sum + Number(d.value), 0),
        wonValue: won.reduce((sum, d) => sum + Number(d.value), 0),
        wonCount: won.length,
      },
    };
  });

const clientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Email no válido").nullish(),
  phone: z.string().nullish(),
  notes: z.string().nullish(),
});

export const saveClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => clientSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const values = {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      notes: data.notes || null,
HOLD    };
    if (data.id) {
      const { error } = await supabase
        .from("clients")
        .update(values)
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) throw error;
      return { ok: true };
    }
    const { error } = await supabase.from("clients").insert({ ...values, user_id: userId });
    if (error) throw error;
    return { ok: true };
  });

export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("clients")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

const dealSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "El título es obligatorio"),
  value: z.coerce.number().min(0, "El valor no puede ser negativo"),
  status: z.enum(["nuevo", "en_curso", "ganado", "perdido"]),
  client_id: z.string().uuid().nullish(),
});

export const saveDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => dealSchema.parse(data))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const values = {
      title: data.title,
      value: data.value,
      status: data.status,
      client_id: data.client_id || null,
    };
    if (data.id) {
      const { error } = await supabase
        .from("deals")
        .update(values)
        .eq("id", data.id)
        .eq("user_id", userId);
      if (error) throw error;
      return { ok: true };
    }
    const { error } = await supabase.from("deals").insert({ ...values, user_id: userId });
    if (error) throw error;
    return { ok: true };
  });

export const deleteDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("deals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

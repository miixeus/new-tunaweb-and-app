import { supabase } from "../lib/supabase";

export type Client = {
  id: string;
  contact_name: string;
  business_name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type ClientInsert = {
  contact_name: string;
  business_name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function createClient(data: ClientInsert) {
  const { data: client, error } = await supabase
    .from("clients")
    .insert({ ...data, email: normalizeEmail(data.email) })
    .select("id, contact_name, business_name, email, phone, notes, created_at")
    .single();

  if (error) throw error;
  return client as Client;
}

export async function listClients() {
  const { data, error } = await supabase
    .from("clients")
    .select("id, contact_name, business_name, email, phone, notes, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function getClientById(clientId: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, contact_name, business_name, email, phone, notes, created_at")
    .eq("id", clientId)
    .maybeSingle();

  if (error) throw error;
  return (data as Client | null) ?? null;
}

export async function getClientByEmail(email: string) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, contact_name, business_name, email, phone, notes, created_at")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (error) throw error;
  return (data as Client | null) ?? null;
}

export async function updateClient(clientId: string, data: Partial<ClientInsert>) {
  const payload = {
    ...data,
    email: data.email ? normalizeEmail(data.email) : undefined,
  };

  const { data: updated, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", clientId)
    .select("id, contact_name, business_name, email, phone, notes, created_at")
    .single();

  if (error) throw error;
  return updated as Client;
}

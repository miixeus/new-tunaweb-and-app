import { supabase, toServiceError } from "../lib/supabase";
import type { Client } from "../types/domain";

export type CreateClientInput = {
  contactName: string;
  businessName: string;
  email: string;
  phone?: string;
  notes?: string;
};

export type UpdateClientInput = Partial<CreateClientInput>;

function mapClient(row: any): Client {
  return {
    id: row.id,
    contactName: row.contact_name ?? "",
    businessName: row.business_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at ?? "",
  };
}

export async function listClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw toServiceError(error, "Falha ao listar clientes.");
  return (data ?? []).map(mapClient);
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const payload = {
    contact_name: input.contactName.trim(),
    business_name: input.businessName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim() || null,
    notes: input.notes?.trim() || null,
  };

  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw toServiceError(error, "Falha ao criar cliente.");
  return mapClient(data);
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  const payload = {
    contact_name: input.contactName,
    business_name: input.businessName,
    email: input.email?.toLowerCase(),
    phone: input.phone,
    notes: input.notes,
  };

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw toServiceError(error, "Falha ao editar cliente.");
  return mapClient(data);
}

export async function deleteClient(id: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw toServiceError(error, "Falha ao excluir cliente.");
}

export async function getClientByEmail(email: string): Promise<Client | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) throw toServiceError(error, "Falha ao buscar cliente por email.");
  return data ? mapClient(data) : null;
}

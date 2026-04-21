import { supabase } from '../lib/supabase';

export type ClientInsert = {
  contact_name: string;
  business_name: string;
  email: string;
  phone?: string | null;
  notes?: string | null;
};

export async function createClient(data: ClientInsert) {
  const { data: client, error } = await supabase
    .from('clients')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return client;
}

export async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
import { supabase } from '../lib/supabase';

export type ProjectInsert = {
  client_id: string;
  name: string;
  service_type: string;
  scope?: string | null;
  start_date?: string | null;
  status: string;
  brand_color?: string | null;
  next_action?: string | null;
};

export async function createProject(data: ProjectInsert) {
  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return project;
}

export async function listProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*, clients(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
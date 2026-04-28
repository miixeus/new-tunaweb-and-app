import { supabase } from "../lib/supabase";
import { ensureCurrentUserProfile, getCurrentUser } from "./access";

export type ProjectStatus =
  | "planning"
  | "production"
  | "waiting_client"
  | "approved"
  | "published";

export type Project = {
  id: string;
  client_id: string;
  name: string;
  service_type: string;
  scope: string | null;
  start_date: string | null;
  status: ProjectStatus;
  brand_color: string | null;
  next_action: string | null;
  created_at: string;
  clients?: {
    id: string;
    business_name: string;
    email: string;
  } | null;
};

export type ProjectInsert = {
  client_id: string;
  name: string;
  service_type: string;
  scope?: string | null;
  start_date?: string | null;
  status: ProjectStatus;
  brand_color?: string | null;
  next_action?: string | null;
};

export async function createProject(data: ProjectInsert) {
  const { data: project, error } = await supabase
    .from("projects")
    .insert(data)
    .select("*, clients(id, business_name, email)")
    .single();

  if (error) throw error;
  return project as Project;
}

export async function listProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, business_name, email)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function getProjectById(projectId: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, business_name, email)")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw error;
  return (data as Project | null) ?? null;
}

export async function listProjectsForCurrentUser() {
  const profile = await ensureCurrentUserProfile();

  if (profile.role === "admin") {
    return listProjects();
  }

  const user = await getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado.");

  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, business_name, email), project_members!inner(user_id)")
    .eq("project_members.user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((item) => {
    const { project_members: _members, ...project } = item as Record<string, unknown>;
    return project as Project;
  });
}

export async function listProjectsByClientEmail(clientEmail: string) {
  const normalizedEmail = clientEmail.trim().toLowerCase();

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id")
    .eq("email", normalizedEmail)
    .limit(1);

  if (clientsError) throw clientsError;

  const clientId = clients?.[0]?.id;
  if (!clientId) return [];

  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(id, business_name, email)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Project[];
}

export async function updateProject(projectId: string, data: Partial<ProjectInsert>) {
  const { data: updated, error } = await supabase
    .from("projects")
    .update(data)
    .eq("id", projectId)
    .select("*, clients(id, business_name, email)")
    .single();

  if (error) throw error;
  return updated as Project;
}

export async function updateProjectStatus(projectId: string, status: ProjectStatus) {
  return updateProject(projectId, { status });
}

export async function updateProjectNextAction(projectId: string, nextAction: string) {
  return updateProject(projectId, { next_action: nextAction });
}

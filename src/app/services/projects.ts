import { supabase, toServiceError } from "../lib/supabase";
import type { Project, ProjectStatus, ProjectWithClient } from "../types/domain";

export type CreateProjectInput = {
  clientId: string;
  name: string;
  serviceType: string;
  scope?: string;
  startDate?: string;
  status: ProjectStatus;
  brandColor?: string;
  nextAction?: string;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

function mapProject(row: any): Project {
  return {
    id: row.id,
    clientId: row.client_id,
    name: row.name ?? "",
    serviceType: row.service_type ?? "website",
    scope: row.scope ?? "",
    startDate: row.start_date ?? "",
    status: row.status ?? "planning",
    brandColor: row.brand_color ?? "#5f19ea",
    nextAction: row.next_action ?? "",
    lastActivity: row.last_activity ?? row.created_at ?? "",
    createdAt: row.created_at ?? "",
  };
}

function mapProjectWithClient(row: any): ProjectWithClient {
  return {
    ...mapProject(row),
    client: row.clients
      ? {
          id: row.clients.id,
          contactName: row.clients.contact_name ?? "",
          businessName: row.clients.business_name ?? "",
          email: row.clients.email ?? "",
          phone: row.clients.phone ?? "",
          notes: row.clients.notes ?? "",
          createdAt: row.clients.created_at ?? "",
        }
      : null,
  };
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const payload = {
    client_id: input.clientId,
    name: input.name.trim(),
    service_type: input.serviceType,
    scope: input.scope?.trim() || null,
    start_date: input.startDate || null,
    status: input.status,
    brand_color: input.brandColor || "#5f19ea",
    next_action: input.nextAction || "Definir estratégia inicial e alinhar escopo",
    last_activity: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw toServiceError(error, "Falha ao criar projeto.");
  return mapProject(data);
}

export async function listProjectsWithClient(): Promise<ProjectWithClient[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*)")
    .order("created_at", { ascending: false });

  if (error) throw toServiceError(error, "Falha ao listar projetos.");
  return (data ?? []).map(mapProjectWithClient);
}

export async function getProjectById(projectId: string): Promise<ProjectWithClient | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(*)")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw toServiceError(error, "Falha ao buscar projeto.");
  return data ? mapProjectWithClient(data) : null;
}

export async function listProjectsByClientId(clientId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) throw toServiceError(error, "Falha ao listar projetos do cliente.");
  return (data ?? []).map(mapProject);
}

export async function getLatestProjectByClientId(clientId: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw toServiceError(error, "Falha ao buscar projeto mais recente.");
  return data ? mapProject(data) : null;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
): Promise<Project> {
  const payload = {
    client_id: input.clientId,
    name: input.name,
    service_type: input.serviceType,
    scope: input.scope,
    start_date: input.startDate,
    status: input.status,
    brand_color: input.brandColor,
    next_action: input.nextAction,
    last_activity: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("projects")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw toServiceError(error, "Falha ao atualizar projeto.");
  return mapProject(data);
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update({
      status,
      last_activity: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw toServiceError(error, "Falha ao atualizar status do projeto.");
  return mapProject(data);
}

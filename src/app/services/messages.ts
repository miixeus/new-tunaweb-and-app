import { supabase, toServiceError } from "../lib/supabase";
import type { ProjectMessage, UserRole } from "../types/domain";

export type CreateMessageInput = {
  projectId: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
};

function mapMessage(row: any): ProjectMessage {
  return {
    id: row.id,
    projectId: row.project_id,
    authorName: row.author_name,
    authorRole: row.author_role,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function listMessagesByProjectId(projectId: string): Promise<ProjectMessage[]> {
  const { data, error } = await supabase
    .from("project_messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw toServiceError(error, "Falha ao buscar mensagens.");
  return (data ?? []).map(mapMessage);
}

export async function listRecentMessages(limit = 5): Promise<ProjectMessage[]> {
  const { data, error } = await supabase
    .from("project_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw toServiceError(error, "Falha ao buscar atividades recentes.");
  return (data ?? []).map(mapMessage);
}

export async function createMessage(input: CreateMessageInput): Promise<ProjectMessage> {
  const { data, error } = await supabase
    .from("project_messages")
    .insert({
      project_id: input.projectId,
      author_name: input.authorName,
      author_role: input.authorRole,
      content: input.content.trim(),
    })
    .select("*")
    .single();

  if (error) throw toServiceError(error, "Falha ao enviar mensagem.");

  await supabase
    .from("projects")
    .update({ last_activity: new Date().toISOString() })
    .eq("id", input.projectId);

  return mapMessage(data);
}

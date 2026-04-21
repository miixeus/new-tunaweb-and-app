import { supabase } from "../../lib/supabase";

export type MessageRole = "admin" | "client";

export type ProjectMessage = {
  id: string;
  project_id: string;
  author: string;
  author_role: MessageRole;
  content: string;
  created_at: string;
};

export type CreateProjectMessageInput = {
  project_id: string;
  author: string;
  author_role: MessageRole;
  content: string;
};

export async function listMessagesByProjectId(projectId: string) {
  const { data, error } = await supabase
    .from("project_messages")
    .select("id, project_id, author, author_role, content, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProjectMessage[];
}

export async function createMessage(input: CreateProjectMessageInput) {
  const trimmedContent = input.content.trim();
  if (!trimmedContent) {
    throw new Error("A mensagem não pode estar vazia.");
  }

  const { data, error } = await supabase
    .from("project_messages")
    .insert({
      project_id: input.project_id,
      author: input.author,
      author_role: input.author_role,
      content: trimmedContent,
    })
    .select("id, project_id, author, author_role, content, created_at")
    .single();

  if (error) throw error;
  return data as ProjectMessage;
}

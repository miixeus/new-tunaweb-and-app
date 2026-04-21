import { supabase, toServiceError } from "../lib/supabase";
import type { ApprovalStatus, ProjectApproval } from "../types/domain";

function mapApproval(row: any): ProjectApproval {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title ?? "",
    description: row.description ?? "",
    previewUrl: row.preview_url ?? "",
    status: row.status ?? "pending",
    feedback: row.feedback ?? "",
    createdAt: row.created_at ?? "",
  };
}

export async function listApprovalsByProjectId(projectId: string): Promise<ProjectApproval[]> {
  const { data, error } = await supabase
    .from("project_approvals")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw toServiceError(error, "Falha ao listar aprovações.");
  return (data ?? []).map(mapApproval);
}

export async function countApprovedApprovals(): Promise<number> {
  const { count, error } = await supabase
    .from("project_approvals")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (error) throw toServiceError(error, "Falha ao contar aprovações.");
  return count ?? 0;
}

export async function updateApprovalStatus(
  id: string,
  status: ApprovalStatus,
  feedback = "",
): Promise<ProjectApproval> {
  const { data, error } = await supabase
    .from("project_approvals")
    .update({ status, feedback: feedback || null })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw toServiceError(error, "Falha ao atualizar aprovação.");
  return mapApproval(data);
}

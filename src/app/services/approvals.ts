import { supabase } from "../../lib/supabase";

export type ApprovalStatus = "pending" | "approved" | "revision";

export type ProjectApproval = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  preview_url: string;
  status: ApprovalStatus;
  feedback: string | null;
  created_at: string;
  updated_at: string;
};

export async function listApprovalsByProjectId(projectId: string) {
  const { data, error } = await supabase
    .from("project_approvals")
    .select(
      "id, project_id, title, description, preview_url, status, feedback, created_at, updated_at",
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ProjectApproval[];
}

export async function approveItem(approvalId: string) {
  const { data, error } = await supabase
    .from("project_approvals")
    .update({ status: "approved", feedback: null })
    .eq("id", approvalId)
    .select(
      "id, project_id, title, description, preview_url, status, feedback, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data as ProjectApproval;
}

export async function requestRevision(approvalId: string, feedback: string) {
  const normalizedFeedback = feedback.trim();

  const { data, error } = await supabase
    .from("project_approvals")
    .update({
      status: "revision",
      feedback: normalizedFeedback || null,
    })
    .eq("id", approvalId)
    .select(
      "id, project_id, title, description, preview_url, status, feedback, created_at, updated_at",
    )
    .single();

  if (error) throw error;
  return data as ProjectApproval;
}

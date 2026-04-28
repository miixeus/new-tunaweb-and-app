import { supabase } from "../lib/supabase";
import { ensureCurrentUserProfile, getCurrentUser } from "./access";

export type ProjectInvite = {
  id: string;
  project_id: string;
  email: string;
  role: "client";
  status: "pending" | "accepted" | "expired";
  created_at: string;
  accepted_at: string | null;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function createProjectInvite(projectId: string, email: string) {
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase
    .from("project_invites")
    .upsert(
      {
        project_id: projectId,
        email: normalizedEmail,
        role: "client",
        status: "pending",
        accepted_at: null,
      },
      { onConflict: "project_id,email" },
    )
    .select("id, project_id, email, role, status, created_at, accepted_at")
    .single();

  if (error) throw error;
  return data as ProjectInvite;
}

export async function listPendingInvitesByEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase
    .from("project_invites")
    .select("id, project_id, email, role, status, created_at, accepted_at")
    .eq("email", normalizedEmail)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ProjectInvite[];
}

export async function acceptProjectInvite(inviteId: string) {
  const { data, error } = await supabase
    .from("project_invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("status", "pending")
    .select("id, project_id, email, role, status, created_at, accepted_at")
    .single();

  if (error) throw error;
  return data as ProjectInvite;
}

export async function acceptPendingInvitesForCurrentUser() {
  const user = await getCurrentUser();
  if (!user?.email) {
    throw new Error("Usuário não autenticado.");
  }

  const profile = await ensureCurrentUserProfile();
  const invites = await listPendingInvitesByEmail(user.email);

  if (!invites.length) {
    return { invites: [], linkedProjectIds: [] as string[] };
  }

  const linkedProjectIds: string[] = [];

  for (const invite of invites) {
    const { error: memberError } = await supabase.from("project_members").upsert(
      {
        project_id: invite.project_id,
        user_id: profile.id,
        role: "client",
      },
      { onConflict: "project_id,user_id" },
    );

    if (memberError) throw memberError;

    await acceptProjectInvite(invite.id);
    linkedProjectIds.push(invite.project_id);
  }

  return {
    invites,
    linkedProjectIds,
  };
}

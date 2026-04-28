import { supabase } from "../lib/supabase";
import { signInWithEmailOtp } from "./access";
import { createProjectInvite } from "./invites";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

type EnsureClientProjectAccessInput = {
  projectId: string;
  clientEmail: string;
};

export async function ensureClientProjectAccess({
  projectId,
  clientEmail,
}: EnsureClientProjectAccessInput) {
  const normalizedEmail = normalizeEmail(clientEmail);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (profileError) throw profileError;

  if (profile?.id) {
    const { error: memberError } = await supabase.from("project_members").upsert(
      {
        project_id: projectId,
        user_id: profile.id,
        role: "client",
      },
      { onConflict: "project_id,user_id" },
    );

    if (memberError) throw memberError;

    await signInWithEmailOtp(normalizedEmail);
    return { status: "linked" as const };
  }

  await createProjectInvite(projectId, normalizedEmail);
  await signInWithEmailOtp(normalizedEmail);

  return { status: "invited" as const };
}

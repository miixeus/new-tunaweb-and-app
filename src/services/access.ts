import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type UserRole = "admin" | "client";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

const ADMIN_EMAIL = "tunawebadm@gmail.com";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isAdminEmail(email: string) {
  return normalizeEmail(email) === ADMIN_EMAIL;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signInWithEmailOtp(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      shouldCreateUser: true,
    },
  });

  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function upsertCurrentUserProfile() {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    throw new Error("Sessão inválida. Faça login novamente.");
  }

  const email = normalizeEmail(user.email);

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  let nextRole: UserRole = "client";

  if (isAdminEmail(email)) {
    nextRole = "admin";
  } else if (existing?.role === "admin") {
    nextRole = "admin";
  } else if (existing?.role === "client") {
    nextRole = "client";
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email,
        full_name: existing?.full_name ?? user.user_metadata?.full_name ?? null,
        role: nextRole,
      },
      { onConflict: "id" },
    )
    .select("id, email, full_name, role, created_at")
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function ensureCurrentUserProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return upsertCurrentUserProfile();
  }

  if (isAdminEmail(profile.email) && profile.role !== "admin") {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", profile.id)
      .select("id, email, full_name, role, created_at")
      .single();

    if (error) throw error;
    return data as Profile;
  }

  return profile;
}

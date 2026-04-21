import { supabase, toServiceError } from "../lib/supabase";

export async function sendLoginCode(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw toServiceError(error, "Falha ao enviar código de acesso.");
}

export async function verifyLoginCode(email: string, token: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type: "email",
  });

  if (error) throw toServiceError(error, "Código inválido ou expirado.");
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw toServiceError(error, "Falha ao encerrar sessão.");
}

export async function getSessionEmail(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.email?.toLowerCase() ?? null;
}

export function isAdminEmail(email: string): boolean {
  const configured = String(import.meta.env.VITE_ADMIN_EMAILS || "admin@tunaweb.com.br")
    .split(",")
    .map((item: string) => item.trim().toLowerCase())
    .filter(Boolean);

  return configured.includes(email.trim().toLowerCase());
}

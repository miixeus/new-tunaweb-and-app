import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  ensureCurrentUserProfile,
  getCurrentSession,
  signInWithEmailOtp,
} from "../../services/access";
import { acceptPendingInvitesForCurrentUser } from "../../services/invites";
import { listProjectsForCurrentUser } from "../../services/projects";

export function LoginScreen() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isResolvingSession, setIsResolvingSession] = useState(true);
  const [noProjectMessage, setNoProjectMessage] = useState("");

  const resolvePostLogin = useCallback(async () => {
    setIsResolvingSession(true);
    setErrorMessage("");

    try {
      const session = await getCurrentSession();
      if (!session) {
        return;
      }

      const profile = await ensureCurrentUserProfile();
      const invitesResult = await acceptPendingInvitesForCurrentUser();

      if (profile.role === "admin") {
        navigate("/admin", { replace: true });
        return;
      }

      const invitedProjectId = invitesResult.linkedProjectIds[0];
      if (invitedProjectId) {
        navigate(`/project/${invitedProjectId}`, { replace: true });
        return;
      }

      const projects = await listProjectsForCurrentUser();

      if (projects.length > 0) {
        navigate(`/project/${projects[0].id}`, { replace: true });
        return;
      }

      setNoProjectMessage("Nenhum projeto vinculado a este email.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao validar seu acesso.";
      setErrorMessage(message);
    } finally {
      setIsResolvingSession(false);
    }
  }, [navigate]);

  useEffect(() => {
    resolvePostLogin();
  }, [resolvePostLogin]);

  const handleSendAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Digite um email válido.");
      return;
    }

    try {
      setIsSending(true);
      setErrorMessage("");
      setSuccessMessage("");
      setNoProjectMessage("");

      await signInWithEmailOtp(normalizedEmail);
      setSuccessMessage("Enviamos um link de acesso para seu email.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao enviar acesso por email.";
      setErrorMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5f19ea] to-[#8b5cf6] bg-clip-text text-transparent">
            Tunaweb
          </h1>
        </div>

        <div className="bg-[#0a0a0a] rounded-2xl p-8 border border-[#1a1a1a] shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">Acessar projeto</h2>
          <p className="text-gray-400 mb-8">Acesse seu projeto de forma simples e direta</p>

          <form onSubmit={handleSendAccess} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12"
                required
                disabled={isSending}
              />
            </div>

            <Button
              type="submit"
              disabled={isSending}
              className="w-full h-12 bg-[#5f19ea] hover:bg-[#7c3aed] text-white font-semibold disabled:opacity-60"
            >
              {isSending ? "Enviando..." : "Enviar acesso por email"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={resolvePostLogin}
              disabled={isResolvingSession}
              className="w-full text-gray-400 hover:text-white"
            >
              {isResolvingSession ? "Validando sessão..." : "Já cliquei no link"}
            </Button>
          </form>

          {successMessage && (
            <div className="mt-4 rounded-lg border border-[#00cf40]/20 bg-[#00cf40]/10 px-4 py-3">
              <p className="text-sm text-[#00cf40]">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          )}

          {noProjectMessage && (
            <div className="mt-4 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-3">
              <p className="text-sm text-yellow-200">{noProjectMessage}</p>
            </div>
          )}

          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-gray-500 leading-relaxed">
              Seu acesso é enviado por e-mail para manter segurança e simplicidade.
            </p>
            <p className="text-xs text-gray-600">
              Admin oficial: <span className="text-gray-400">tunawebadm@gmail.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

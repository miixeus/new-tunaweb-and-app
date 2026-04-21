import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getClientByEmail } from "../services/clients";
import { sendLoginCode, verifyLoginCode, isAdminEmail } from "../services/auth";
import { getLatestProjectByClientId } from "../services/projects";

export function LoginScreen() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage("Digite um email válido.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await sendLoginCode(normalizedEmail);
      setCodeSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível enviar o código.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setErrorMessage("Digite o código de acesso recebido por email.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await verifyLoginCode(email, code);

      const normalizedEmail = email.trim().toLowerCase();

      if (isAdminEmail(normalizedEmail)) {
        navigate("/admin");
        return;
      }

      const client = await getClientByEmail(normalizedEmail);

      if (!client) {
        setErrorMessage("Cliente não encontrado para este email.");
        return;
      }

      const project = await getLatestProjectByClientId(client.id);

      if (!project) {
        setErrorMessage("Nenhum projeto encontrado para este cliente.");
        return;
      }

      navigate(`/project/${project.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível concluir o login.");
    } finally {
      setIsSubmitting(false);
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

          <form onSubmit={codeSent ? handleLogin : handleSendCode} className="space-y-6">
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
                disabled={codeSent || isSubmitting}
              />
            </div>

            {!codeSent ? (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#5f19ea] hover:bg-[#7c3aed] text-white font-semibold"
              >
                {isSubmitting ? "Enviando..." : "Enviar código"}
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white">
                    Código de acesso
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12 text-center text-2xl tracking-widest"
                    required
                    maxLength={6}
                    autoFocus
                    disabled={isSubmitting}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#5f19ea] hover:bg-[#7c3aed] text-white font-semibold"
                >
                  {isSubmitting ? "Validando..." : "Entrar"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCodeSent(false);
                    setCode("");
                    setErrorMessage("");
                  }}
                  className="w-full text-gray-400 hover:text-white"
                  disabled={isSubmitting}
                >
                  Voltar
                </Button>
              </>
            )}
          </form>

          {errorMessage && (
            <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          )}

          <div className="mt-6 space-y-2 text-center">
            <p className="text-sm text-gray-500 leading-relaxed">
              Seu acesso é enviado por e-mail para manter segurança e simplicidade.
            </p>
            <p className="text-xs text-gray-600">
              Admins permitidos em <span className="text-gray-400">VITE_ADMIN_EMAILS</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

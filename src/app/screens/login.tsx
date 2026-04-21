import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAppStore } from '../../store/app-store';

<div className="text-center mb-8">
  <h2 className="text-2xl font-bold text-white mb-2">
    Acesse seu projeto
  </h2>
  <p className="text-gray-400">
    Aqui você acompanha tudo que está sendo desenvolvido pela Tunaweb.
  </p>
</div>

export function LoginScreen() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setErrorMessage('Digite um email válido.');
      return;
    }

    setErrorMessage('');
    setCodeSent(true);
  };

const { findClientByEmail, getLatestProjectByClientId } = useAppStore();

const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();

  // Admin
  if (email === 'admin@tunaweb.com.br') {
    navigate('/admin');
    return;
  }

  // Cliente
  const client = findClientByEmail(email);

  if (!client) {
    alert('Cliente não encontrado.');
    return;
  }

  const project = getLatestProjectByClientId(client.id);

  if (!project) {
    alert('Nenhum projeto encontrado para este cliente.');
    return;
  }

  navigate(`/project/${project.id}`);
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
          <p className="text-gray-400 mb-8">
            Acesse seu projeto de forma simples e direta
          </p>

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
                  if (errorMessage) setErrorMessage('');
                }}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12"
                required
                disabled={codeSent}
              />
            </div>

            {!codeSent ? (
              <Button
                type="submit"
                className="w-full h-12 bg-[#5f19ea] hover:bg-[#7c3aed] text-white font-semibold"
              >
                Enviar código
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
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12 text-center text-2xl tracking-widest"
                    required
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-[#5f19ea] hover:bg-[#7c3aed] text-white font-semibold"
                >
                  Entrar
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCodeSent(false);
                    setCode('');
                    setErrorMessage('');
                  }}
                  className="w-full text-gray-400 hover:text-white"
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
              Teste admin: <span className="text-gray-400">admin@tunaweb.com.br</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
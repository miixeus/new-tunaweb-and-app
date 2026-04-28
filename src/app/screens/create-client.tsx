import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { createClient } from "../../services/clients";

export function CreateClientScreen() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.SyntheticEvent, createProject = false) => {
    e.preventDefault();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setFeedbackMessage("");
      setErrorMessage("");

      const createdClient = await createClient({
        contact_name: formData.name.trim(),
        business_name: formData.businessName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        notes: formData.notes.trim() || null,
      });

      if (createProject) {
        navigate("/admin/projects/new", {
          state: {
            preselectedClientId: createdClient.id,
          },
        });
        return;
      }

      setFeedbackMessage("Cliente criado com sucesso.");
      navigate("/admin");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar cliente.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-white">Novo Cliente</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={(e) => void handleSubmit(e, false)} className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Nome do contato
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName" className="text-white">
                Nome da empresa
              </Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Empresa Ltda"
                value={formData.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@empresa.com"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                Telefone <span className="text-gray-500">(opcional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+55 11 98765-4321"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">
                Observações <span className="text-gray-500">(opcional)</span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre o cliente..."
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[120px]"
              />
            </div>
          </div>

          {feedbackMessage && <p className="text-sm text-[#00cf40]">{feedbackMessage}</p>}
          {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a] disabled:opacity-60"
            >
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>

            <Button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => void handleSubmit(e, true)}
              className="flex-1 h-12 bg-[#5f19ea] hover:bg-[#7c3aed] text-white disabled:opacity-60"
            >
              Salvar e criar projeto
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

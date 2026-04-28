import { useEffect, useRef, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { listClients, type Client } from "../../services/clients";
import { createProject, type ProjectStatus } from "../../services/projects";
import { uploadProjectFile } from "../../services/files";
import { createMessage } from "../../services/messages";
import { ensureClientProjectAccess } from "../../services/project-onboarding";

type LocationState = {
  preselectedClientId?: string;
};

export function CreateProjectScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const locationState = (location.state as LocationState | null) ?? null;

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [formData, setFormData] = useState({
    clientId: locationState?.preselectedClientId || "",
    name: "",
    serviceType: "",
    scope: "",
    startDate: "",
    status: "planning" as ProjectStatus,
    brandColor: "#5f19ea",
  });

  const [selectedLogoName, setSelectedLogoName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (locationState?.preselectedClientId) {
      setFormData((prev) => ({
        ...prev,
        clientId: locationState.preselectedClientId || prev.clientId,
      }));
    }
  }, [locationState?.preselectedClientId]);

  useEffect(() => {
    async function loadClients() {
      try {
        setLoadingClients(true);
        const data = await listClients();
        setClients(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar clientes.";
        setErrorMessage(message);
      } finally {
        setLoadingClients(false);
      }
    }

    void loadClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent, sendInvite = false) => {
    e.preventDefault();

    if (isSubmitting || !formData.clientId) return;

    const selectedClient = clients.find((item) => item.id === formData.clientId);

    if (!selectedClient) {
      setErrorMessage("Selecione um cliente válido.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMessage("");
      setErrorMessage("");

      const createdProject = await createProject({
        client_id: formData.clientId,
        name: formData.name.trim(),
        service_type: formData.serviceType,
        scope: formData.scope.trim() || null,
        start_date: formData.startDate || null,
        status: formData.status,
        brand_color: formData.brandColor,
      });

      if (logoFile) {
        await uploadProjectFile({
          projectId: createdProject.id,
          file: logoFile,
          uploadedBy: "Tunaweb",
        });
      }

      if (sendInvite) {
        const onboarding = await ensureClientProjectAccess({
          projectId: createdProject.id,
          clientEmail: selectedClient.email,
        });

        await createMessage({
          project_id: createdProject.id,
          content:
            onboarding.status === "linked"
              ? "Acesso do cliente vinculado e link de entrada enviado por email."
              : "Convite pendente criado e link de acesso enviado por email.",
          author: "Tunaweb",
          author_role: "admin",
        });
      } else {
        await createMessage({
          project_id: createdProject.id,
          content: "Projeto criado com sucesso e pronto para início.",
          author: "Tunaweb",
          author_role: "admin",
        });
      }

      setFeedbackMessage("Projeto criado com sucesso.");
      navigate(`/admin/projects/${createdProject.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar projeto.";
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
          <h1 className="text-3xl font-bold text-white">Novo Projeto</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={(e) => void handleSubmit(e, false)} className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-white">
                Cliente
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
              >
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
                  <SelectValue placeholder={loadingClients ? "Carregando..." : "Selecione um cliente"} />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id} className="text-white">
                      {client.business_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Nome do projeto</Label>
              <Input id="name" type="text" placeholder="Website Institucional" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType" className="text-white">Tipo de serviço</Label>
              <Select value={formData.serviceType} onValueChange={(value) => setFormData((prev) => ({ ...prev, serviceType: value }))}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="website" className="text-white">Website</SelectItem>
                  <SelectItem value="app" className="text-white">Aplicativo</SelectItem>
                  <SelectItem value="branding" className="text-white">Identidade Visual</SelectItem>
                  <SelectItem value="social_media" className="text-white">Social Media</SelectItem>
                  <SelectItem value="seo" className="text-white">SEO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope" className="text-white">Escopo do projeto</Label>
              <Textarea id="scope" placeholder="Descreva o escopo do projeto..." value={formData.scope} onChange={(e) => setFormData((prev) => ({ ...prev, scope: e.target.value }))} className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[120px]" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-white">Data de início</Label>
              <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))} className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-white">Status inicial</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value as ProjectStatus }))}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="planning" className="text-white">Planejamento</SelectItem>
                  <SelectItem value="production" className="text-white">Produção</SelectItem>
                  <SelectItem value="waiting_client" className="text-white">Aguardando Cliente</SelectItem>
                  <SelectItem value="approved" className="text-white">Aprovado</SelectItem>
                  <SelectItem value="published" className="text-white">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandColor" className="text-white">Cor da marca</Label>
              <div className="flex gap-3">
                <Input id="brandColor" type="color" value={formData.brandColor} onChange={(e) => setFormData((prev) => ({ ...prev, brandColor: e.target.value }))} className="w-20 h-12 bg-[#1a1a1a] border-[#2a2a2a] cursor-pointer" />
                <Input type="text" value={formData.brandColor} onChange={(e) => setFormData((prev) => ({ ...prev, brandColor: e.target.value }))} className="flex-1 bg-[#1a1a1a] border-[#2a2a2a] text-white h-12" placeholder="#5f19ea" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Logo do projeto <span className="text-gray-500">(opcional)</span></Label>
              <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.svg" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setLogoFile(file);
                setSelectedLogoName(file?.name || "");
              }} />

              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-[#3a3a3a] transition-colors">
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Clique para fazer upload ou arraste aqui</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG ou SVG (máx. 2MB)</p>
                {selectedLogoName && <p className="text-xs text-[#00cf40] mt-3">Arquivo selecionado: {selectedLogoName}</p>}
              </button>
            </div>
          </div>

          {feedbackMessage && <p className="text-sm text-[#00cf40]">{feedbackMessage}</p>}
          {errorMessage && <p className="text-sm text-red-300">{errorMessage}</p>}

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting} className="flex-1 h-12 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a] disabled:opacity-60">Criar projeto</Button>
            <Button type="button" disabled={isSubmitting} onClick={(e) => void handleSubmit(e, true)} className="flex-1 h-12 bg-[#5f19ea] hover:bg-[#7c3aed] text-white disabled:opacity-60">Criar e enviar convite</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

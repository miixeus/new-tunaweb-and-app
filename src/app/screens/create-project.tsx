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
import { useAppStore } from '../../store/app-store';

type LocationState = {
  preselectedClientId?: string;
};

export function CreateProjectScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { clients, addProject, addFile, addMessage } = useAppStore();

  const locationState = (location.state as LocationState | null) ?? null;

  const [formData, setFormData] = useState({
    clientId: locationState?.preselectedClientId || "",
    name: "",
    serviceType: "",
    scope: "",
    startDate: "",
    status: "planning" as
      | "planning"
      | "production"
      | "waiting_client"
      | "approved"
      | "published",
    brandColor: "#5f19ea",
  });

  const [selectedLogoName, setSelectedLogoName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (locationState?.preselectedClientId) {
      setFormData((prev) => ({
        ...prev,
        clientId: locationState.preselectedClientId || prev.clientId,
      }));
    }
  }, [locationState?.preselectedClientId]);

  const handleSubmit = (e: React.FormEvent, sendInvite = false) => {
    e.preventDefault();

    if (isSubmitting) return;
    if (!formData.clientId) return;

    setIsSubmitting(true);

    const createdProject = addProject({
      clientId: formData.clientId,
      name: formData.name,
      serviceType: formData.serviceType,
      scope: formData.scope,
      startDate: formData.startDate,
      status: formData.status,
      brandColor: formData.brandColor,
    });

    if (logoFile) {
      addFile(
        createdProject.id,
        logoFile.name,
        logoFile.type || "image/*",
        "Tunaweb",
      );
    }

    if (sendInvite) {
      addMessage(
        createdProject.id,
        "Convite de acesso enviado ao cliente para entrada no mural do projeto.",
        "Tunaweb",
        "admin",
      );
    } else {
      addMessage(
        createdProject.id,
        "Projeto criado com sucesso e pronto para início.",
        "Tunaweb",
        "admin",
      );
    }

    navigate(`/admin/projects/${createdProject.id}`);
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
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="client" className="text-white">
                Cliente
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, clientId: value }))
                }
              >
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  {clients.map((client) => (
                    <SelectItem
                      key={client.id}
                      value={client.id}
                      className="text-white"
                    >
                      {client.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Nome do projeto
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Website Institucional"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceType" className="text-white">
                Tipo de serviço
              </Label>
              <Select
                value={formData.serviceType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, serviceType: value }))
                }
              >
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="website" className="text-white">
                    Website
                  </SelectItem>
                  <SelectItem value="app" className="text-white">
                    Aplicativo
                  </SelectItem>
                  <SelectItem value="branding" className="text-white">
                    Identidade Visual
                  </SelectItem>
                  <SelectItem value="social_media" className="text-white">
                    Social Media
                  </SelectItem>
                  <SelectItem value="seo" className="text-white">
                    SEO
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scope" className="text-white">
                Escopo do projeto
              </Label>
              <Textarea
                id="scope"
                placeholder="Descreva o escopo do projeto..."
                value={formData.scope}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, scope: e.target.value }))
                }
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-white">
                Data de início
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-white">
                Status inicial
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as
                      | "planning"
                      | "production"
                      | "waiting_client"
                      | "approved"
                      | "published",
                  }))
                }
              >
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="planning" className="text-white">
                    Planejamento
                  </SelectItem>
                  <SelectItem value="production" className="text-white">
                    Produção
                  </SelectItem>
                  <SelectItem value="waiting_client" className="text-white">
                    Aguardando Cliente
                  </SelectItem>
                  <SelectItem value="approved" className="text-white">
                    Aprovado
                  </SelectItem>
                  <SelectItem value="published" className="text-white">
                    Publicado
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandColor" className="text-white">
                Cor da marca
              </Label>
              <div className="flex gap-3">
                <Input
                  id="brandColor"
                  type="color"
                  value={formData.brandColor}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      brandColor: e.target.value,
                    }))
                  }
                  className="w-20 h-12 bg-[#1a1a1a] border-[#2a2a2a] cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.brandColor}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      brandColor: e.target.value,
                    }))
                  }
                  className="flex-1 bg-[#1a1a1a] border-[#2a2a2a] text-white h-12"
                  placeholder="#5f19ea"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">
                Logo do projeto{" "}
                <span className="text-gray-500">(opcional)</span>
              </Label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setLogoFile(file);
                  setSelectedLogoName(file?.name || "");
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-[#3a3a3a] transition-colors"
              >
                <Upload className="w-8 h-8 text-gray-500 mx-auto mb-3" />
                <p className="text-sm text-gray-400">
                  Clique para fazer upload ou arraste aqui
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG ou SVG (máx. 2MB)
                </p>
                {selectedLogoName && (
                  <p className="text-xs text-[#00cf40] mt-3">
                    Arquivo selecionado: {selectedLogoName}
                  </p>
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a] disabled:opacity-60"
            >
              Criar projeto
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, true)}
              className="flex-1 h-12 bg-[#5f19ea] hover:bg-[#7c3aed] text-white disabled:opacity-60"
            >
              Criar e enviar convite
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

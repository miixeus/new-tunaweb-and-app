import { useRef, useState } from "react";
import { useParams } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Send,
  Upload,
  Check,
  AlertCircle,
  FileText,
  Image,
} from "lucide-react";
import { useProjectWorkspace } from "../hooks/use-project-workspace";
import type { ProjectApproval, ProjectStatus } from "../types/domain";

const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "production",
  "waiting_client",
  "approved",
  "published",
];

export function ProjectClientScreen() {
  const { projectId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    project,
    messages,
    files,
    approvals,
    isLoading,
    isSubmitting,
    errorMessage,
    sendMessage,
    uploadFiles,
    setApproval,
  } = useProjectWorkspace(projectId);

  const [newMessage, setNewMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<ProjectApproval | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  if (isLoading) {
    return <div className="min-h-screen bg-black text-white p-8">Carregando projeto...</div>;
  }

  if (!project || !project.client) {
    return <div className="min-h-screen bg-black text-white p-8">Projeto não encontrado</div>;
  }

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      planning: "Planejamento",
      production: "Produção",
      waiting_client: "Aguardando Cliente",
      approved: "Aprovado",
      published: "Publicado",
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      planning: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      production: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      waiting_client: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      approved: "bg-[#00cf40]/10 text-[#00cf40] border-[#00cf40]/20",
      published: "bg-green-500/10 text-green-400 border-green-500/20",
    };
    return colorMap[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  const showTemporaryFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(newMessage, project.client.businessName, "client");
    setNewMessage("");
    showTemporaryFeedback("Mensagem enviada com sucesso.");
  };

  const handleApprove = async (approvalId: string) => {
    await setApproval(approvalId, "approved");
    setSelectedApproval(null);
    setShowFeedback(false);
    setFeedbackText("");
    showTemporaryFeedback("Aprovação enviada com sucesso.");
  };

  const handleRequestRevision = async () => {
    if (!selectedApproval) return;
    await setApproval(selectedApproval.id, "revision", feedbackText);
    setShowFeedback(false);
    setFeedbackText("");
    setSelectedApproval(null);
    showTemporaryFeedback("Solicitação de ajuste enviada.");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles?.length) return;

    await uploadFiles(
      Array.from(selectedFiles),
      project.client.businessName,
      uploadMessage.trim()
        ? `Enviei novos materiais para o projeto. Observação: ${uploadMessage.trim()}`
        : "Enviei novos materiais para o projeto.",
      "client",
    );

    setUploadMessage("");
    event.target.value = "";
    showTemporaryFeedback("Arquivo(s) enviado(s) com sucesso.");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentStatusIndex = PROJECT_STATUSES.indexOf(project.status as ProjectStatus);

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#5f19ea] to-[#8b5cf6] flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {project.client.businessName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{project.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-400">Powered by</div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#5f19ea] to-[#8b5cf6] bg-clip-text text-transparent">
                Tunaweb
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {(feedbackMessage || errorMessage) && (
            <div
              className={`rounded-xl px-4 py-3 border ${
                errorMessage
                  ? "border-red-500/20 bg-red-500/10"
                  : "border-[#00cf40]/20 bg-[#00cf40]/10"
              }`}
            >
              <p className={`text-sm ${errorMessage ? "text-red-300" : "text-[#00cf40]"}`}>
                {errorMessage || feedbackMessage}
              </p>
            </div>
          )}

          <div className="bg-gradient-to-br from-[#5f19ea]/10 to-[#8b5cf6]/5 border-2 border-[#5f19ea]/30 rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#5f19ea] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm uppercase tracking-wide text-[#5f19ea] font-semibold mb-2">
                  Próxima Ação
                </h2>
                <p className="text-2xl text-white font-medium">
                  {project.nextAction || "Sem próxima ação definida."}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Mural do Projeto</h3>

            {messages.length > 0 ? (
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <div>
                        <span className="font-semibold text-white">{message.authorName}</span>
                        <span
                          className={`ml-2 text-xs px-2 py-1 rounded ${
                            message.authorRole === "admin"
                              ? "bg-[#5f19ea]/20 text-[#5f19ea]"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {message.authorRole === "admin" ? "Tunaweb" : "Você"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-300">{message.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
                <p className="text-white mb-2">Ainda não há mensagens neste projeto.</p>
                <p className="text-sm text-gray-400">Use este espaço para conversar com a Tunaweb.</p>
              </div>
            )}

            <div className="flex gap-2">
              <Textarea
                placeholder="Escrever mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[80px]"
              />
              <Button
                disabled={isSubmitting}
                onClick={() => void handleSendMessage()}
                className="bg-[#5f19ea] hover:bg-[#7c3aed] text-white px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Enviar Material</h3>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  void handleFileSelection(e);
                }}
              />

              <button
                type="button"
                onClick={handleUploadClick}
                className="w-full border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-[#5f19ea]/50 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-white mb-1">Arraste arquivos aqui ou clique para selecionar</p>
                <p className="text-sm text-gray-500">Fotos, vídeos, documentos</p>
              </button>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Mensagem opcional</label>
                <Textarea
                  placeholder="Adicione uma descrição ou observação sobre os arquivos..."
                  value={uploadMessage}
                  onChange={(e) => setUploadMessage(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[80px]"
                />
              </div>

              <Button
                disabled={isSubmitting}
                onClick={handleUploadClick}
                className="w-full bg-[#5f19ea] hover:bg-[#7c3aed] text-white h-12"
              >
                <Upload className="w-4 h-4 mr-2" />
                Selecionar arquivos
              </Button>
            </div>

            {files.length > 0 ? (
              <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
                <h4 className="text-sm font-semibold text-gray-400 mb-3">Arquivos enviados</h4>
                <div className="space-y-3">
                  {files.map((file) => (
                    <a
                      key={file.id}
                      href={file.previewUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a]"
                    >
                      {file.fileType.startsWith("image/") ? (
                        <Image className="w-5 h-5 text-[#5f19ea]" />
                      ) : (
                        <FileText className="w-5 h-5 text-gray-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {file.uploadedBy} • {formatDate(file.createdAt)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
                <p className="text-sm text-gray-500">Nenhum arquivo enviado ainda.</p>
              </div>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Aprovações Pendentes</h3>

            <div className="space-y-4">
              {approvals.length > 0 ? (
                approvals.map((approval) => (
                  <div key={approval.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{approval.title}</h4>
                        <p className="text-sm text-gray-400">{approval.description}</p>
                      </div>
                      <Badge className={getStatusColor(approval.status)}>
                        {approval.status === "pending"
                          ? "Pendente"
                          : approval.status === "approved"
                            ? "Aprovado"
                            : "Revisão"}
                      </Badge>
                    </div>

                    {approval.previewUrl && (
                      <a
                        href={approval.previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block mb-3 text-sm text-[#5f19ea] hover:underline"
                      >
                        Visualizar material
                      </a>
                    )}

                    {approval.feedback && (
                      <p className="text-xs text-orange-300 mb-3">Feedback: {approval.feedback}</p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        disabled={isSubmitting || approval.status === "approved"}
                        onClick={() => {
                          void handleApprove(approval.id);
                        }}
                        className="bg-[#00cf40] hover:bg-[#00b537] text-black flex-1"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        disabled={isSubmitting}
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowFeedback(true);
                        }}
                        className="bg-[#1f2937] hover:bg-[#374151] text-white flex-1"
                      >
                        Solicitar Ajustes
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
                  <p className="text-white mb-2">Nenhum item pendente para aprovação no momento.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Progresso do Projeto</h3>
            <div className="flex items-center gap-2">
              {PROJECT_STATUSES.map((status, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;
                return (
                  <div key={status} className="flex-1">
                    <div
                      className={`h-2 rounded-full transition-colors ${
                        isCompleted ? "bg-[#5f19ea]" : "bg-[#2a2a2a]"
                      }`}
                    />
                    <p
                      className={`text-xs mt-2 text-center ${
                        isCurrent ? "text-[#5f19ea] font-semibold" : "text-gray-500"
                      }`}
                    >
                      {getStatusLabel(status)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="bg-[#0a0a0a] border border-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle>Solicitar Ajustes</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Descreva os ajustes que você deseja..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[120px]"
            />
            <Button
              onClick={() => {
                void handleRequestRevision();
              }}
              disabled={isSubmitting || !feedbackText.trim()}
              className="w-full bg-[#5f19ea] hover:bg-[#7c3aed] text-white"
            >
              Enviar solicitação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

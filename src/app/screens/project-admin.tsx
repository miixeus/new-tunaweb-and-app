import { useRef, useState } from "react";
import { useParams, Link } from "react-router";
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
  ArrowLeft,
  Edit,
  Send,
  Upload,
  FileText,
  Image,
  Check,
  AlertCircle,
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

export function ProjectAdminScreen() {
  const { projectId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    project,
    messages,
    files,
    approvals,
    metrics,
    isLoading,
    isSubmitting,
    errorMessage,
    sendMessage,
    uploadFiles,
    setApproval,
    setProjectStatus,
    updateNextAction,
  } = useProjectWorkspace(projectId);

  const [newMessage, setNewMessage] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<ProjectApproval | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isEditingNextAction, setIsEditingNextAction] = useState(false);
  const [nextActionDraft, setNextActionDraft] = useState("");

  const showTemporaryFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    await sendMessage(newMessage, "Tunaweb", "admin");
    setNewMessage("");
    showTemporaryFeedback("Mensagem enviada com sucesso.");
  };

  const handleApproval = async (approvalId: string) => {
    await setApproval(approvalId, "approved");
    setSelectedApproval(null);
    setShowFeedback(false);
    setFeedbackText("");
    showTemporaryFeedback("Item aprovado com sucesso.");
  };

  const handleRequestRevision = async () => {
    if (!selectedApproval) return;
    await setApproval(selectedApproval.id, "revision", feedbackText);
    setShowFeedback(false);
    setFeedbackText("");
    setSelectedApproval(null);
    showTemporaryFeedback("Solicitação de ajuste enviada.");
  };

  const handleStatusChange = async (status: ProjectStatus) => {
    await setProjectStatus(status);
    showTemporaryFeedback(`Status alterado para ${getStatusLabel(status)}.`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles?.length) return;

    await uploadFiles(
      Array.from(selectedFiles),
      "Tunaweb",
      uploadNote.trim()
        ? `Materiais enviados pela Tunaweb. Observação: ${uploadNote.trim()}`
        : "Materiais enviados pela Tunaweb.",
      "admin",
    );

    setUploadNote("");
    event.target.value = "";
    showTemporaryFeedback("Arquivo(s) enviado(s) com sucesso.");
  };

  const handleSaveNextAction = async () => {
    const trimmed = nextActionDraft.trim();
    if (!trimmed) return;
    await updateNextAction(trimmed);
    setIsEditingNextAction(false);
    showTemporaryFeedback("Próxima ação atualizada.");
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao dashboard
          </Link>

          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#5f19ea] to-[#8b5cf6] flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {project.client.businessName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{project.name}</h1>
                <p className="text-lg text-gray-400">{project.client.businessName}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  <span className="text-sm text-gray-500">{project.serviceType}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => {
                setIsEditingNextAction(true);
                setNextActionDraft(project.nextAction || "");
              }}
              className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar próxima ação
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
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
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">Controle do Projeto</h3>
                <p className="text-sm text-gray-400">
                  Atualize o status geral para refletir o momento atual da entrega.
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {PROJECT_STATUSES.map((status) => {
                  const isActive = project.status === status;
                  return (
                    <Button
                      key={status}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => void handleStatusChange(status)}
                      className={
                        isActive
                          ? "bg-[#5f19ea] hover:bg-[#7c3aed] text-white"
                          : "bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]"
                      }
                    >
                      {getStatusLabel(status)}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
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
                              {message.authorRole === "admin" ? "Tunaweb" : "Cliente"}
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
                    <p className="text-sm text-gray-400">
                      Use este espaço para alinhar entregas e próximos passos.
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escrever novo recado..."
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
                <h3 className="text-xl font-semibold text-white mb-6">Materiais e Arquivos</h3>

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
                  <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
                  <p className="text-white mb-1">Arraste arquivos aqui ou clique para selecionar</p>
                  <p className="text-sm text-gray-500">Imagens, vídeos, PDFs e documentos</p>
                </button>

                <div className="mt-4 space-y-2">
                  <label className="text-sm text-gray-400">Observação opcional</label>
                  <Textarea
                    value={uploadNote}
                    onChange={(e) => setUploadNote(e.target.value)}
                    placeholder="Adicione contexto sobre os arquivos enviados..."
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[80px]"
                  />
                </div>

                {files.length > 0 ? (
                  <div className="mt-6 pt-6 border-t border-[#1a1a1a] space-y-3">
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
                ) : (
                  <p className="text-sm text-gray-500 mt-6">Nenhum arquivo enviado ainda.</p>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Aprovações</h3>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Aprovados</p>
                    <p className="text-xl font-bold text-[#00cf40]">{metrics.approvedCount}</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Pendentes</p>
                    <p className="text-xl font-bold text-yellow-400">{metrics.pendingCount}</p>
                  </div>
                  <div className="bg-[#1a1a1a] rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Revisão</p>
                    <p className="text-xl font-bold text-orange-400">{metrics.revisionCount}</p>
                  </div>
                </div>

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
                            Abrir preview
                          </a>
                        )}

                        {approval.feedback && (
                          <p className="text-xs text-orange-300 mb-3">Feedback: {approval.feedback}</p>
                        )}

                        <div className="flex gap-2">
                          <Button
                            disabled={isSubmitting || approval.status === "approved"}
                            onClick={() => {
                              void handleApproval(approval.id);
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
                            Solicitar revisão
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
                      <p className="text-white mb-2">Sem itens de aprovação para este projeto.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="bg-[#0a0a0a] border border-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle>Solicitar revisão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Descreva os ajustes necessários..."
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

      <Dialog open={isEditingNextAction} onOpenChange={setIsEditingNextAction}>
        <DialogContent className="bg-[#0a0a0a] border border-[#1a1a1a] text-white">
          <DialogHeader>
            <DialogTitle>Editar próxima ação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={nextActionDraft}
              onChange={(e) => setNextActionDraft(e.target.value)}
              placeholder="Digite a próxima ação do projeto"
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[120px]"
            />
            <Button
              onClick={() => {
                void handleSaveNextAction();
              }}
              disabled={isSubmitting || !nextActionDraft.trim()}
              className="w-full bg-[#5f19ea] hover:bg-[#7c3aed] text-white"
            >
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

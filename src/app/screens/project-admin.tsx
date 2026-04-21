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
import { useAppStore } from "../../store/app-store";

const PROJECT_STATUSES = [
  "planning",
  "production",
  "waiting_client",
  "approved",
  "published",
] as const;

type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function ProjectAdminScreen() {
  const { projectId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    projects,
    clients,
    messages,
    files,
    approvals,
    addMessage,
    addFile,
    updateProjectStatus,
    approveItem,
    requestRevision,
  } = useAppStore();

  const [newMessage, setNewMessage] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [uploadNote, setUploadNote] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  const project = projects.find((p) => p.id === projectId);
  const client = clients.find((c) => c.id === project?.clientId);
  const projectMessages = messages.filter((m) => m.projectId === projectId);
  const projectFiles = files.filter((f) => f.projectId === projectId);
  const projectApprovals = approvals.filter((a) => a.projectId === projectId);

  if (!project || !client || !projectId) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        Projeto não encontrado
      </div>
    );
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
    return (
      colorMap[status] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
    );
  };

  const showTemporaryFeedback = (message: string) => {
    setFeedbackMessage(message);
    setTimeout(() => setFeedbackMessage(""), 2500);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    addMessage(projectId, newMessage, "Tunaweb", "admin");
    setNewMessage("");
    showTemporaryFeedback("Mensagem enviada com sucesso.");
  };

  const handleApproval = (approvalId: string) => {
    approveItem(approvalId);
    setSelectedApproval(null);
    setShowFeedback(false);
    setFeedbackText("");
    showTemporaryFeedback("Item aprovado com sucesso.");
  };

  const handleRequestRevision = () => {
    if (!selectedApproval) return;
    requestRevision(selectedApproval.id, feedbackText);
    setShowFeedback(false);
    setFeedbackText("");
    setSelectedApproval(null);
    showTemporaryFeedback("Solicitação de ajuste enviada.");
  };

  const handleStatusChange = (status: ProjectStatus) => {
    updateProjectStatus(projectId, status);
    showTemporaryFeedback(`Status alterado para ${getStatusLabel(status)}.`);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles?.length) return;

    Array.from(selectedFiles).forEach((file) => {
      addFile(projectId, file.name, file.type, "Tunaweb");
    });

    if (uploadNote.trim()) {
      addMessage(
        projectId,
        `Materiais enviados pela Tunaweb. Observação: ${uploadNote.trim()}`,
        "Tunaweb",
        "admin",
      );
    }

    setUploadNote("");
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

  const approvedCount = projectApprovals.filter(
    (item) => item.status === "approved",
  ).length;
  const revisionCount = projectApprovals.filter(
    (item) => item.status === "revision",
  ).length;
  const pendingCount = projectApprovals.filter(
    (item) => item.status === "pending",
  ).length;

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
                  {client.businessName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  {project.name}
                </h1>
                <p className="text-lg text-gray-400">{client.businessName}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {project.serviceType}
                  </span>
                </div>
              </div>
            </div>

            <Button className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]">
              <Edit className="w-4 h-4 mr-2" />
              Editar projeto
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {feedbackMessage && (
            <div className="rounded-xl border border-[#00cf40]/20 bg-[#00cf40]/10 px-4 py-3">
              <p className="text-sm text-[#00cf40]">{feedbackMessage}</p>
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
                  {project.nextAction}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  Controle do Projeto
                </h3>
                <p className="text-sm text-gray-400">
                  Atualize o status geral para refletir o momento atual da
                  entrega.
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                {PROJECT_STATUSES.map((status) => {
                  const isActive = project.status === status;
                  return (
                    <Button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(status)}
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
                <h3 className="text-xl font-semibold text-white mb-6">
                  Mural do Projeto
                </h3>

                {projectMessages.length > 0 ? (
                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    {projectMessages.map((message) => (
                      <div
                        key={message.id}
                        className="bg-[#1a1a1a] rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-2 gap-3">
                          <div>
                            <span className="font-semibold text-white">
                              {message.author}
                            </span>
                            <span
                              className={`ml-2 text-xs px-2 py-1 rounded ${
                                message.authorRole === "admin"
                                  ? "bg-[#5f19ea]/20 text-[#5f19ea]"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {message.authorRole === "admin"
                                ? "Tunaweb"
                                : "Cliente"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-gray-300">{message.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-6 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
                    <p className="text-white mb-2">
                      Ainda não há mensagens neste projeto.
                    </p>
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
                    onClick={handleSendMessage}
                    className="bg-[#5f19ea] hover:bg-[#7c3aed] text-white px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Materiais
                  </h3>
                  <Button
                    onClick={handleUploadClick}
                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Enviar
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileSelection}
                />

                <div className="mb-4">
                  <Textarea
                    placeholder="Observação opcional sobre os arquivos enviados..."
                    value={uploadNote}
                    onChange={(e) => setUploadNote(e.target.value)}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[80px]"
                  />
                </div>

                {projectFiles.length > 0 ? (
                  <div className="space-y-3">
                    {projectFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg"
                      >
                        <div className="w-10 h-10 rounded bg-[#2a2a2a] flex items-center justify-center">
                          {file.type.includes("image") ? (
                            <Image className="w-5 h-5 text-gray-400" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {file.uploadedBy} • {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
                    <p className="text-white mb-2">
                      Nenhum material enviado ainda.
                    </p>
                    <p className="text-sm text-gray-400">
                      Envie arquivos para centralizar referências do projeto.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
                  <h3 className="text-xl font-semibold text-white">
                    Aprovações
                  </h3>
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className="px-2 py-1 rounded bg-gray-500/10 text-gray-300">
                      Pendentes: {pendingCount}
                    </span>
                    <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-300">
                      Revisão: {revisionCount}
                    </span>
                    <span className="px-2 py-1 rounded bg-[#00cf40]/10 text-[#00cf40]">
                      Aprovados: {approvedCount}
                    </span>
                  </div>
                </div>

                {projectApprovals.length > 0 ? (
                  <div className="space-y-4">
                    {projectApprovals.map((approval) => (
                      <div
                        key={approval.id}
                        className="bg-[#1a1a1a] rounded-lg overflow-hidden cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowFeedback(false);
                          setFeedbackText("");
                        }}
                      >
                        <img
                          src={approval.previewUrl}
                          alt={approval.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2 gap-3">
                            <h4 className="font-semibold text-white">
                              {approval.title}
                            </h4>
                            <Badge
                              className={
                                approval.status === "approved"
                                  ? "bg-[#00cf40]/10 text-[#00cf40] border-[#00cf40]/20"
                                  : approval.status === "revision"
                                    ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                    : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                              }
                            >
                              {approval.status === "approved"
                                ? "Aprovado"
                                : approval.status === "revision"
                                  ? "Revisão"
                                  : "Pendente"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400">
                            {approval.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
                    <p className="text-white mb-2">
                      Nenhum item de aprovação disponível.
                    </p>
                    <p className="text-sm text-gray-400">
                      Quando houver uma peça para validação, ela aparecerá aqui.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Status do Projeto
                </h3>

                <div className="space-y-3">
                  {PROJECT_STATUSES.map((status, index) => {
                    const activeStatuses = PROJECT_STATUSES.slice(
                      0,
                      Math.max(
                        PROJECT_STATUSES.indexOf(
                          project.status as ProjectStatus,
                        ) + 1,
                        0,
                      ),
                    );

                    const isActive = activeStatuses.includes(status);
                    const isCurrent = project.status === status;

                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            isActive || isCurrent
                              ? "bg-[#5f19ea] text-white"
                              : "bg-[#1a1a1a] text-gray-600"
                          }`}
                        >
                          {isActive || isCurrent ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <span
                          className={
                            isActive || isCurrent
                              ? "text-white"
                              : "text-gray-500"
                          }
                        >
                          {getStatusLabel(status)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">
                  Notas Internas
                  <span className="ml-2 text-xs text-gray-500">
                    (visível apenas para admins)
                  </span>
                </h3>
                <Textarea
                  placeholder="Adicionar notas internas sobre o projeto..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[100px]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={!!selectedApproval}
        onOpenChange={() => setSelectedApproval(null)}
      >
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-3xl">
          {selectedApproval && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedApproval.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <img
                  src={selectedApproval.previewUrl}
                  alt={selectedApproval.title}
                  className="w-full rounded-lg"
                />

                <p className="text-gray-300">{selectedApproval.description}</p>

                {!showFeedback ? (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApproval(selectedApproval.id)}
                      className="flex-1 bg-[#00cf40] hover:bg-[#00b837] text-white h-12"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={() => setShowFeedback(true)}
                      className="flex-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a] h-12"
                    >
                      Solicitar ajuste
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Descreva os ajustes necessários..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 min-h-[100px]"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={handleRequestRevision}
                        className="flex-1 bg-[#5f19ea] hover:bg-[#7c3aed] text-white h-12"
                      >
                        Enviar feedback
                      </Button>
                      <Button
                        onClick={() => setShowFeedback(false)}
                        variant="ghost"
                        className="text-gray-400 hover:text-white"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
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
import { Send, Upload, Check, AlertCircle, FileText, Image } from "lucide-react";
import {
  createMessage,
  listMessagesByProjectId,
  type ProjectMessage,
} from "../../services/messages";
import {
  listFilesByProjectId,
  uploadProjectFile,
  type ProjectFile,
} from "../../services/files";
import {
  listApprovalsByProjectId,
  approveItem,
  requestRevision,
  type ProjectApproval,
} from "../../services/approvals";
import { getProjectById } from "../../services/projects";

type ProjectStatus =
  | "planning"
  | "production"
  | "waiting_client"
  | "approved"
  | "published";

const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "production",
  "waiting_client",
  "approved",
  "published",
];

type ProjectWithClient = {
  id: string;
  name: string;
  status: ProjectStatus;
  next_action?: string | null;
  clients: {
    business_name: string;
  } | null;
};

export function ProjectClientScreen() {
  const { projectId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<ProjectWithClient | null>(null);
  const [messages, setMessages] = useState<ProjectMessage[]>([]);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [approvals, setApprovals] = useState<ProjectApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const [newMessage, setNewMessage] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedApproval, setSelectedApproval] = useState<ProjectApproval | null>(
    null,
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");

  useEffect(() => {
    if (!projectId) return;

    async function loadData() {
      try {
        setLoading(true);
        const [projectData, projectMessages, projectFiles, projectApprovals] =
          await Promise.all([
            getProjectById(projectId),
            listMessagesByProjectId(projectId),
            listFilesByProjectId(projectId),
            listApprovalsByProjectId(projectId),
          ]);

        setProject(projectData as ProjectWithClient);
        setMessages(projectMessages);
        setFiles(projectFiles);
        setApprovals(projectApprovals);
      } catch (error) {
        console.error(error);
        showTemporaryFeedback("Não foi possível carregar dados do projeto.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

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

  const clientName = project?.clients?.business_name || "Cliente";

  const handleSendMessage = async () => {
    if (!projectId || !newMessage.trim()) return;
    try {
      const created = await createMessage({
        project_id: projectId,
        content: newMessage,
        author: clientName,
        author_role: "client",
      });
      setMessages((prev) => [...prev, created]);
      setNewMessage("");
      showTemporaryFeedback("Mensagem enviada com sucesso.");
    } catch (error) {
      console.error(error);
      showTemporaryFeedback("Erro ao enviar mensagem.");
    }
  };

  const handleApprove = async (approvalId: string) => {
    try {
      const updated = await approveItem(approvalId);
      setApprovals((prev) => prev.map((item) => (item.id === approvalId ? updated : item)));
      setSelectedApproval(updated);
      setShowFeedback(false);
      setFeedbackText("");
      showTemporaryFeedback("Aprovação enviada com sucesso.");
    } catch (error) {
      console.error(error);
      showTemporaryFeedback("Erro ao aprovar item.");
    }
  };

  const handleRequestRevision = async () => {
    if (!selectedApproval) return;
    try {
      const updated = await requestRevision(selectedApproval.id, feedbackText);
      setApprovals((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setShowFeedback(false);
      setFeedbackText("");
      setSelectedApproval(updated);
      showTemporaryFeedback("Solicitação de ajuste enviada.");
    } catch (error) {
      console.error(error);
      showTemporaryFeedback("Erro ao solicitar revisão.");
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles?.length || !projectId) return;

    try {
      const uploaded = await Promise.all(
        Array.from(selectedFiles).map((file) =>
          uploadProjectFile({
            projectId,
            file,
            uploadedBy: clientName,
          }),
        ),
      );
      setFiles((prev) => [...uploaded, ...prev]);

      const note = uploadMessage.trim()
        ? `Enviei novos materiais para o projeto. Observação: ${uploadMessage.trim()}`
        : "Enviei novos materiais para o projeto.";

      const noteMessage = await createMessage({
        project_id: projectId,
        content: note,
        author: clientName,
        author_role: "client",
      });
      setMessages((prev) => [...prev, noteMessage]);

      setUploadMessage("");
      event.target.value = "";
      showTemporaryFeedback("Arquivo(s) enviado(s) com sucesso.");
    } catch (error) {
      console.error(error);
      showTemporaryFeedback("Erro ao enviar arquivo(s).");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-8">Carregando...</div>;
  }

  if (!project) {
    return <div className="min-h-screen bg-black text-white p-8">Projeto não encontrado</div>;
  }

  const currentStatusIndex = PROJECT_STATUSES.indexOf(project.status);

  return (
    <div className="min-h-screen bg-black">
      <div className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#5f19ea] to-[#8b5cf6] flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{clientName.charAt(0)}</span>
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
                <p className="text-2xl text-white font-medium">{project.next_action}</p>
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
                        <span className="font-semibold text-white">{message.author}</span>
                        <span
                          className={`ml-2 text-xs px-2 py-1 rounded ${
                            message.author_role === "admin"
                              ? "bg-[#5f19ea]/20 text-[#5f19ea]"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {message.author_role === "admin" ? "Tunaweb" : "Você"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(message.created_at)}
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
                onClick={handleSendMessage}
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
                onChange={handleFileSelection}
              />

              <button
                type="button"
                onClick={handleUploadClick}
                className="w-full border-2 border-dashed border-[#2a2a2a] rounded-lg p-8 text-center hover:border-[#5f19ea]/50 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-white mb-1">Arraste arquivos aqui ou clique para selecionar</p>
                <p className="text-sm text-gray-500">Fotos, vídeos, documentos (máx. 50MB por arquivo)</p>
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
                      href={file.file_url}
                      target="_blank"
                      rel="noreferrer"
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
                        <p className="text-sm font-medium text-white">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatDate(file.created_at)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
                <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
                  <p className="text-white mb-2">Nenhum arquivo enviado ainda.</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Aprovações</h3>

            {approvals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvals.map((approval) => (
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
                      src={approval.preview_url}
                      alt={approval.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2 gap-3">
                        <h4 className="font-semibold text-white">{approval.title}</h4>
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
                      <p className="text-sm text-gray-400">{approval.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 text-center">
                <p className="text-white mb-2">Nenhuma aprovação disponível.</p>
              </div>
            )}
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Status do Projeto</h3>

            <div className="flex items-center justify-between gap-4 overflow-x-auto">
              {PROJECT_STATUSES.map((status, index) => {
                const isActive = index <= currentStatusIndex;
                const isCurrent = project.status === status;

                return (
                  <div key={status} className="flex flex-col items-center gap-2 min-w-[72px]">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isActive || isCurrent
                          ? "bg-[#5f19ea] text-white"
                          : "bg-[#1a1a1a] text-gray-600"
                      }`}
                    >
                      {isActive || isCurrent ? <Check className="w-5 h-5" /> : index + 1}
                    </div>
                    <span
                      className={`text-xs text-center ${
                        isActive || isCurrent ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {getStatusLabel(status).split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
        <DialogContent className="bg-[#0a0a0a] border-[#1a1a1a] text-white max-w-3xl">
          {selectedApproval && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedApproval.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <img
                  src={selectedApproval.preview_url}
                  alt={selectedApproval.title}
                  className="w-full rounded-lg"
                />

                <p className="text-gray-300">{selectedApproval.description}</p>
                {selectedApproval.feedback && (
                  <p className="text-yellow-300 text-sm">Feedback: {selectedApproval.feedback}</p>
                )}

                {selectedApproval.status === "pending" && (
                  <>
                    {!showFeedback ? (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleApprove(selectedApproval.id)}
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
                          value={feedbackText}
                          onChange={(event) => setFeedbackText(event.target.value)}
                          placeholder="Descreva os ajustes necessários..."
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500"
                        />
                        <div className="flex gap-3">
                          <Button
                            onClick={handleRequestRevision}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black h-12"
                          >
                            Enviar solicitação
                          </Button>
                          <Button
                            onClick={() => {
                              setShowFeedback(false);
                              setFeedbackText("");
                            }}
                            className="flex-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a] h-12"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Search, Plus, User, Clock, AlertCircle } from "lucide-react";
import { countApprovedApprovals } from "../services/approvals";
import { listRecentMessages } from "../services/messages";
import { listProjectsWithClient } from "../services/projects";
import type { ProjectWithClient } from "../types/domain";

function toRelativeLabel(dateIso?: string) {
  if (!dateIso) return "Sem atividade";

  const date = new Date(dateIso);
  const diffMs = Date.now() - date.getTime();

  if (Number.isNaN(diffMs)) return "Sem atividade";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "Agora há pouco";
  if (minutes < 60) return `há ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

export function AdminDashboard() {
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<ProjectWithClient[]>([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<
    { id: string; description: string; user: string; timestamp: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [projectRows, approvedItems, recentMessages] = await Promise.all([
          listProjectsWithClient(),
          countApprovedApprovals(),
          listRecentMessages(5),
        ]);

        setProjects(projectRows);
        setApprovedCount(approvedItems);
        setRecentActivities(
          recentMessages.map((message) => {
            const project = projectRows.find((item) => item.id === message.projectId);
            return {
              id: message.id,
              description: `${message.authorRole === "admin" ? "Tunaweb" : "Cliente"} enviou uma mensagem em ${project?.name || "Projeto"}`,
              user: message.authorName,
              timestamp: message.createdAt,
            };
          }),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Falha ao carregar dashboard.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

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

  const getServiceLabel = (service: string) => {
    const serviceMap: Record<string, string> = {
      website: "Website",
      app: "Aplicativo",
      branding: "Identidade Visual",
      social_media: "Social Media",
      seo: "SEO",
    };
    return serviceMap[service] || service;
  };

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const clientName = project.client?.businessName?.toLowerCase() || "";
        const projectName = project.name.toLowerCase();
        const query = search.trim().toLowerCase();

        if (!query) return true;

        return projectName.includes(query) || clientName.includes(query);
      }),
    [projects, search],
  );

  const pendingActions = projects.filter((p) => p.status === "waiting_client");

  const totalProjects = projects.length;
  const waitingClientCount = projects.filter((project) => project.status === "waiting_client").length;

  return (
    <div className="min-h-screen bg-black">
      <nav className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/admin">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-[#5f19ea] to-[#8b5cf6] bg-clip-text text-transparent">
                Tunaweb
              </h1>
            </Link>

            <div className="flex-1 max-w-xl mx-2 md:mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  placeholder="Buscar projetos ou clientes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 h-11"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link to="/admin/clients/new">
                <Button className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo cliente
                </Button>
              </Link>

              <Link to="/admin/projects/new">
                <Button className="bg-[#5f19ea] hover:bg-[#7c3aed] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo projeto
                </Button>
              </Link>

              <div className="w-10 h-10 rounded-full bg-[#5f19ea] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {errorMessage && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-300">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-2">Projetos ativos</p>
            <p className="text-3xl font-bold text-white">{totalProjects}</p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-2">Aguardando cliente</p>
            <p className="text-3xl font-bold text-yellow-400">{waitingClientCount}</p>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-2">Itens aprovados</p>
            <p className="text-3xl font-bold text-[#00cf40]">{approvedCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Projetos Ativos</h2>

              {isLoading ? (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 text-center">
                  <p className="text-white">Carregando projetos...</p>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 hover:border-[#2a2a2a] transition-all"
                    >
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-1">{project.name}</h3>
                          <p className="text-gray-400">{project.client?.businessName || "Cliente"}</p>
                        </div>

                        <Badge className={getStatusColor(project.status)}>
                          {getStatusLabel(project.status)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-400 mb-4 flex-wrap">
                        <span>{getServiceLabel(project.serviceType)}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {toRelativeLabel(project.lastActivity)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-gray-300">{project.nextAction || "Sem próxima ação definida."}</p>
                        <Link to={`/admin/projects/${project.id}`}>
                          <Button className="bg-[#5f19ea] hover:bg-[#7c3aed] text-white">Abrir</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-8 text-center">
                  <p className="text-lg text-white mb-2">Nenhum projeto encontrado</p>
                  <p className="text-sm text-gray-400 mb-6">Crie um novo projeto ou ajuste sua busca.</p>
                  <Link to="/admin/projects/new">
                    <Button className="bg-[#5f19ea] hover:bg-[#7c3aed] text-white">
                      Criar primeiro projeto
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Ações Pendentes
              </h3>

              <div className="space-y-3">
                {pendingActions.length > 0 ? (
                  pendingActions.map((project) => (
                    <div
                      key={project.id}
                      className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]"
                    >
                      <p className="text-sm font-medium text-white mb-1">{project.name}</p>
                      <p className="text-xs text-gray-400">{project.nextAction || "Sem ação definida"}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                    <p className="text-sm text-gray-400">Nenhuma ação pendente no momento.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Atividade Recente</h3>

              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#5f19ea] mt-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-white mb-1">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.user} • {toRelativeLabel(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Ainda não há atividades recentes.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

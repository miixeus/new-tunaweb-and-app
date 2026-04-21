import { useSyncExternalStore } from "react";
import {
  mockProjects,
  mockClients,
  mockMessages,
  mockFiles,
  mockApprovals,
} from "../app/data/mock-data";

type Project = (typeof mockProjects)[number];
type Client = (typeof mockClients)[number];
type Message = (typeof mockMessages)[number];
type FileItem = (typeof mockFiles)[number];
type Approval = (typeof mockApprovals)[number];

type AppState = {
  projects: Project[];
  clients: Client[];
  messages: Message[];
  files: FileItem[];
  approvals: Approval[];
};

type MessageRole = "admin" | "client";
type ProjectStatus =
  | "planning"
  | "production"
  | "waiting_client"
  | "approved"
  | "published";

type CreateClientInput = {
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  notes?: string;
};

type CreateProjectInput = {
  clientId: string;
  name: string;
  serviceType: string;
  scope?: string;
  startDate?: string;
  status: ProjectStatus;
  brandColor?: string;
};

const STORAGE_KEY = "tunaweb-app-state-v1";

const initialState: AppState = {
  projects: mockProjects,
  clients: mockClients,
  messages: mockMessages,
  files: mockFiles,
  approvals: mockApprovals,
};

function canUseStorage() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function loadState(): AppState {
  if (!canUseStorage()) return initialState;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialState;

    const parsed = JSON.parse(stored) as Partial<AppState>;

    return {
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
        : initialState.projects,
      clients: Array.isArray(parsed.clients)
        ? parsed.clients
        : initialState.clients,
      messages: Array.isArray(parsed.messages)
        ? parsed.messages
        : initialState.messages,
      files: Array.isArray(parsed.files) ? parsed.files : initialState.files,
      approvals: Array.isArray(parsed.approvals)
        ? parsed.approvals
        : initialState.approvals,
    };
  } catch {
    return initialState;
  }
}

function saveState(nextState: AppState) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  } catch {
    // silencia erro de storage cheio / indisponível
  }
}

let state: AppState = loadState();

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function updateState(updater: (prev: AppState) => AppState) {
  state = updater(state);
  saveState(state);
  emitChange();
}

function generateId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const nextActionMap: Record<ProjectStatus, string> = {
  planning: "Definir estratégia inicial e alinhar escopo",
  production: "Produção em andamento",
  waiting_client: "Aguardando retorno do cliente",
  approved: "Aguardando publicação ou etapa final",
  published: "Projeto concluído e publicado",
};

export function useAppStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const addClient = (input: CreateClientInput) => {
    const clientId = generateId("client");

    const newClient: Client = {
      id: clientId,
      name: input.name.trim(),
      businessName: input.businessName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() || "",
      notes: input.notes?.trim() || "",
    };

    updateState((prev) => ({
      ...prev,
      clients: [newClient, ...prev.clients],
    }));

    return newClient;
  };

  const addProject = (input: CreateProjectInput) => {
    const projectId = generateId("project");

    const newProject: Project = {
      id: projectId,
      clientId: input.clientId,
      name: input.name.trim(),
      serviceType: input.serviceType,
      scope: input.scope?.trim() || "",
      startDate: input.startDate || "",
      status: input.status,
      brandColor: input.brandColor || "#5f19ea",
      nextAction: nextActionMap[input.status],
      lastActivity: "Agora há pouco",
    };

    updateState((prev) => ({
      ...prev,
      projects: [newProject, ...prev.projects],
    }));

    return newProject;
  };

  const findClientByEmail = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    return state.clients.find(
      (client) => client.email.trim().toLowerCase() === normalizedEmail,
    );
  };

  const getProjectsByClientId = (clientId: string) => {
    return state.projects.filter((project) => project.clientId === clientId);
  };

  const getLatestProjectByClientId = (clientId: string) => {
    const projects = state.projects.filter(
      (project) => project.clientId === clientId,
    );
    return projects[0] || null;
  };

  const addMessage = (
    projectId: string,
    content: string,
    author: string,
    authorRole: MessageRole,
  ) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const newMessage: Message = {
      id: generateId("msg"),
      projectId,
      content: trimmed,
      author,
      authorRole,
      timestamp: new Date().toISOString(),
    };

    updateState((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              lastActivity: "Agora há pouco",
            }
          : project,
      ),
    }));
  };

  const addFile = (
    projectId: string,
    fileName: string,
    fileType: string,
    uploadedBy: string,
  ) => {
    const newFile: FileItem = {
      id: generateId("file"),
      projectId,
      name: fileName,
      type: fileType || "application/octet-stream",
      uploadedBy,
      uploadedAt: new Date().toISOString(),
    };

    updateState((prev) => ({
      ...prev,
      files: [newFile, ...prev.files],
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              lastActivity: "Agora há pouco",
            }
          : project,
      ),
    }));
  };

  const updateProjectStatus = (projectId: string, status: ProjectStatus) => {
    updateState((prev) => ({
      ...prev,
      projects: prev.projects.map((project) =>
        project.id === projectId
          ? {
              ...project,
              status,
              nextAction: nextActionMap[status],
              lastActivity: "Agora há pouco",
            }
          : project,
      ),
    }));
  };

  const approveItem = (approvalId: string) => {
    let affectedProjectId: string | null = null;

    updateState((prev) => {
      const approvals = prev.approvals.map((approval) => {
        if (approval.id !== approvalId) return approval;
        affectedProjectId = approval.projectId;
        return {
          ...approval,
          status: "approved",
        };
      });

      const projects = affectedProjectId
        ? prev.projects.map((project) =>
            project.id === affectedProjectId
              ? {
                  ...project,
                  status: "approved" as ProjectStatus,
                  nextAction: nextActionMap.approved,
                  lastActivity: "Agora há pouco",
                }
              : project,
          )
        : prev.projects;

      return {
        ...prev,
        approvals,
        projects,
      };
    });
  };

  const requestRevision = (approvalId: string, feedback?: string) => {
    let affectedProjectId: string | null = null;

    updateState((prev) => {
      const approvals = prev.approvals.map((approval) => {
        if (approval.id !== approvalId) return approval;
        affectedProjectId = approval.projectId;
        return {
          ...approval,
          status: "revision",
          description: feedback?.trim()
            ? `${approval.description} • Ajuste solicitado: ${feedback.trim()}`
            : approval.description,
        };
      });

      const projects = affectedProjectId
        ? prev.projects.map((project) =>
            project.id === affectedProjectId
              ? {
                  ...project,
                  status: "waiting_client" as ProjectStatus,
                  nextAction: nextActionMap.waiting_client,
                  lastActivity: "Agora há pouco",
                }
              : project,
          )
        : prev.projects;

      return {
        ...prev,
        approvals,
        projects,
      };
    });
  };

  const resetAppState = () => {
    state = initialState;
    saveState(state);
    emitChange();
  };

  return {
    ...snapshot,
    addClient,
    addProject,
    findClientByEmail,
    getProjectsByClientId,
    getLatestProjectByClientId,
    addMessage,
    addFile,
    updateProjectStatus,
    approveItem,
    requestRevision,
    resetAppState,
  };
}

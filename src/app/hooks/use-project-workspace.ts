import { useCallback, useEffect, useMemo, useState } from "react";
import { listApprovalsByProjectId, updateApprovalStatus } from "../services/approvals";
import { listFilesByProjectId, uploadProjectFile } from "../services/files";
import { createMessage, listMessagesByProjectId } from "../services/messages";
import { getProjectById, updateProject, updateProjectStatus } from "../services/projects";
import type {
  ProjectApproval,
  ProjectFile,
  ProjectMessage,
  ProjectStatus,
  ProjectWithClient,
  UserRole,
} from "../types/domain";

type WorkspaceState = {
  project: ProjectWithClient | null;
  messages: ProjectMessage[];
  files: ProjectFile[];
  approvals: ProjectApproval[];
};

const initialState: WorkspaceState = {
  project: null,
  messages: [],
  files: [],
  approvals: [],
};

export function useProjectWorkspace(projectId?: string) {
  const [state, setState] = useState<WorkspaceState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadWorkspace = useCallback(async () => {
    if (!projectId) {
      setState(initialState);
      setErrorMessage("Projeto não encontrado.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [project, messages, files, approvals] = await Promise.all([
        getProjectById(projectId),
        listMessagesByProjectId(projectId),
        listFilesByProjectId(projectId),
        listApprovalsByProjectId(projectId),
      ]);

      if (!project) {
        setState(initialState);
        setErrorMessage("Projeto não encontrado.");
        return;
      }

      setState({ project, messages, files, approvals });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar projeto.");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const runAction = useCallback(async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await action();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao executar ação.");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string, authorName: string, authorRole: UserRole) => {
      if (!projectId) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      await runAction(async () => {
        const created = await createMessage({
          projectId,
          content: trimmed,
          authorName,
          authorRole,
        });

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, created],
          project: prev.project
            ? {
                ...prev.project,
                lastActivity: created.createdAt,
              }
            : prev.project,
        }));
      });
    },
    [projectId, runAction],
  );

  const uploadFiles = useCallback(
    async (files: File[], uploadedBy: string, message?: string, authorRole?: UserRole) => {
      if (!projectId || !files.length) return;

      await runAction(async () => {
        const uploaded = await Promise.all(
          files.map((file) =>
            uploadProjectFile({
              projectId,
              file,
              uploadedBy,
            }),
          ),
        );

        let createdMessage: ProjectMessage | null = null;

        if (message?.trim() && authorRole) {
          createdMessage = await createMessage({
            projectId,
            content: message.trim(),
            authorName: uploadedBy,
            authorRole,
          });
        }

        setState((prev) => ({
          ...prev,
          files: [...uploaded, ...prev.files],
          messages: createdMessage ? [...prev.messages, createdMessage] : prev.messages,
          project: prev.project
            ? {
                ...prev.project,
                lastActivity: createdMessage?.createdAt || new Date().toISOString(),
              }
            : prev.project,
        }));
      });
    },
    [projectId, runAction],
  );

  const setApproval = useCallback(
    async (approvalId: string, status: "approved" | "revision", feedback = "") => {
      await runAction(async () => {
        const updated = await updateApprovalStatus(approvalId, status, feedback);

        setState((prev) => ({
          ...prev,
          approvals: prev.approvals.map((approval) =>
            approval.id === approvalId ? updated : approval,
          ),
        }));
      });
    },
    [runAction],
  );

  const setProjectStatus = useCallback(
    async (status: ProjectStatus) => {
      if (!projectId) return;

      await runAction(async () => {
        const updated = await updateProjectStatus(projectId, status);
        setState((prev) => ({
          ...prev,
          project: prev.project
            ? {
                ...prev.project,
                status: updated.status,
                lastActivity: updated.lastActivity,
              }
            : prev.project,
        }));
      });
    },
    [projectId, runAction],
  );

  const updateNextAction = useCallback(
    async (nextAction: string) => {
      if (!projectId || !state.project) return;

      await runAction(async () => {
        const updated = await updateProject(projectId, {
          nextAction,
          name: state.project?.name,
          clientId: state.project?.clientId,
          serviceType: state.project?.serviceType,
          scope: state.project?.scope,
          startDate: state.project?.startDate,
          status: state.project?.status,
          brandColor: state.project?.brandColor,
        });

        setState((prev) => ({
          ...prev,
          project: prev.project
            ? {
                ...prev.project,
                nextAction: updated.nextAction,
                lastActivity: updated.lastActivity,
              }
            : prev.project,
        }));
      });
    },
    [projectId, runAction, state.project],
  );

  const metrics = useMemo(() => {
    const approvals = state.approvals;
    return {
      approvedCount: approvals.filter((item) => item.status === "approved").length,
      pendingCount: approvals.filter((item) => item.status === "pending").length,
      revisionCount: approvals.filter((item) => item.status === "revision").length,
    };
  }, [state.approvals]);

  return {
    ...state,
    metrics,
    isLoading,
    isSubmitting,
    errorMessage,
    reload: loadWorkspace,
    sendMessage,
    uploadFiles,
    setApproval,
    setProjectStatus,
    updateNextAction,
  };
}

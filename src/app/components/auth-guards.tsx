import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router";
import { getSessionEmail, isAdminEmail } from "../services/auth";
import { getClientByEmail } from "../services/clients";
import { getProjectById } from "../services/projects";

type GuardState = "checking" | "allowed" | "denied";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    const check = async () => {
      const email = await getSessionEmail();
      if (email && isAdminEmail(email)) {
        setState("allowed");
        return;
      }
      setState("denied");
    };

    void check();
  }, []);

  if (state === "checking") {
    return <div className="min-h-screen bg-black text-white p-8">Validando sessão...</div>;
  }

  if (state === "denied") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function ProjectGuard({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuardState>("checking");
  const { projectId } = useParams();

  useEffect(() => {
    const check = async () => {
      const email = await getSessionEmail();

      if (!email || !projectId) {
        setState("denied");
        return;
      }

      if (isAdminEmail(email)) {
        setState("allowed");
        return;
      }

      const [client, project] = await Promise.all([
        getClientByEmail(email),
        getProjectById(projectId),
      ]);

      if (!client || !project) {
        setState("denied");
        return;
      }

      setState(project.clientId === client.id ? "allowed" : "denied");
    };

    void check();
  }, [projectId]);

  if (state === "checking") {
    return <div className="min-h-screen bg-black text-white p-8">Validando sessão...</div>;
  }

  if (state === "denied") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

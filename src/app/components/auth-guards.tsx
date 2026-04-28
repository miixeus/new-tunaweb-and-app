import { useEffect, useState } from "react";
import { Navigate, useLocation, useParams } from "react-router";
import { ensureCurrentUserProfile, getCurrentSession, getCurrentUser } from "../../services/access";
import { supabase } from "../../lib/supabase";

type GuardState = {
  loading: boolean;
  allowed: boolean;
};

function GuardLoading() {
  return <div className="min-h-screen bg-black text-white p-8">Carregando...</div>;
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GuardState>({ loading: true, allowed: false });

  useEffect(() => {
    let mounted = true;

    async function validate() {
      try {
        const session = await getCurrentSession();
        if (!session) {
          if (mounted) setState({ loading: false, allowed: false });
          return;
        }

        const profile = await ensureCurrentUserProfile();
        if (mounted) {
          setState({ loading: false, allowed: profile.role === "admin" });
        }
      } catch {
        if (mounted) setState({ loading: false, allowed: false });
      }
    }

    validate();
    return () => {
      mounted = false;
    };
  }, []);

  if (state.loading) return <GuardLoading />;
  if (!state.allowed) return <Navigate to="/" replace />;

  return <>{children}</>;
}

export function ClientProjectRoute({ children }: { children: React.ReactNode }) {
  const { projectId } = useParams();
  const location = useLocation();
  const [state, setState] = useState<GuardState>({ loading: true, allowed: false });

  useEffect(() => {
    let mounted = true;

    async function validate() {
      try {
        if (!projectId) {
          if (mounted) setState({ loading: false, allowed: false });
          return;
        }

        const session = await getCurrentSession();
        if (!session) {
          if (mounted) setState({ loading: false, allowed: false });
          return;
        }

        const profile = await ensureCurrentUserProfile();
        if (profile.role === "admin") {
          if (mounted) setState({ loading: false, allowed: true });
          return;
        }

        const user = await getCurrentUser();
        if (!user) {
          if (mounted) setState({ loading: false, allowed: false });
          return;
        }

        const { data, error } = await supabase
          .from("project_members")
          .select("id")
          .eq("project_id", projectId)
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (mounted) {
          setState({ loading: false, allowed: Boolean(data) });
        }
      } catch {
        if (mounted) setState({ loading: false, allowed: false });
      }
    }

    validate();
    return () => {
      mounted = false;
    };
  }, [location.key, projectId]);

  if (state.loading) return <GuardLoading />;
  if (!state.allowed) return <Navigate to="/" replace />;

  return <>{children}</>;
}

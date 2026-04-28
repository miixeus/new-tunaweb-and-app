import { createBrowserRouter } from "react-router";
import { LoginScreen } from "./screens/login";
import { AdminDashboard } from "./screens/admin-dashboard";
import { CreateClientScreen } from "./screens/create-client";
import { CreateProjectScreen } from "./screens/create-project";
import { ProjectAdminScreen } from "./screens/project-admin";
import { ProjectClientScreen } from "./screens/project-client";
import { AdminRoute, ClientProjectRoute } from "./components/auth-guards";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginScreen />,
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminDashboard />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/clients/new",
    element: (
      <AdminRoute>
        <CreateClientScreen />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/projects/new",
    element: (
      <AdminRoute>
        <CreateProjectScreen />
      </AdminRoute>
    ),
  },
  {
    path: "/admin/projects/:projectId",
    element: (
      <AdminRoute>
        <ProjectAdminScreen />
      </AdminRoute>
    ),
  },
  {
    path: "/project/:projectId",
    element: (
      <ClientProjectRoute>
        <ProjectClientScreen />
      </ClientProjectRoute>
    ),
  },
]);

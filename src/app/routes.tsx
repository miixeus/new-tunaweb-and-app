import { createBrowserRouter } from 'react-router';
import { LoginScreen } from './screens/login';
import { AdminDashboard } from './screens/admin-dashboard';
import { CreateClientScreen } from './screens/create-client';
import { CreateProjectScreen } from './screens/create-project';
import { ProjectAdminScreen } from './screens/project-admin';
import { ProjectClientScreen } from './screens/project-client';
import { AdminGuard, ProjectGuard } from './components/auth-guards';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginScreen />,
  },
  {
    path: '/admin',
    element: (
      <AdminGuard>
        <AdminDashboard />
      </AdminGuard>
    ),
  },
  {
    path: '/admin/clients/new',
    element: (
      <AdminGuard>
        <CreateClientScreen />
      </AdminGuard>
    ),
  },
  {
    path: '/admin/projects/new',
    element: (
      <AdminGuard>
        <CreateProjectScreen />
      </AdminGuard>
    ),
  },
  {
    path: '/admin/projects/:projectId',
    element: (
      <AdminGuard>
        <ProjectAdminScreen />
      </AdminGuard>
    ),
  },
  {
    path: '/project/:projectId',
    element: (
      <ProjectGuard>
        <ProjectClientScreen />
      </ProjectGuard>
    ),
  },
]);

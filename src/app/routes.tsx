import { createBrowserRouter } from 'react-router';
import { LoginScreen } from './screens/login';
import { AdminDashboard } from './screens/admin-dashboard';
import { CreateClientScreen } from './screens/create-client';
import { CreateProjectScreen } from './screens/create-project';
import { ProjectAdminScreen } from './screens/project-admin';
import { ProjectClientScreen } from './screens/project-client';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginScreen />,
  },
  {
    path: '/admin',
    element: <AdminDashboard />,
  },
  {
    path: '/admin/clients/new',
    element: <CreateClientScreen />,
  },
  {
    path: '/admin/projects/new',
    element: <CreateProjectScreen />,
  },
  {
    path: '/admin/projects/:projectId',
    element: <ProjectAdminScreen />,
  },
  {
    path: '/project/:projectId',
    element: <ProjectClientScreen />,
  },
]);

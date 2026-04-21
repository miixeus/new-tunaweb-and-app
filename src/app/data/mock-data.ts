// Mock data for Tunaweb platform

export type UserRole = 'admin' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Client {
  id: string;
  name: string;
  businessName: string;
  email: string;
  phone?: string;
  notes?: string;
  logo?: string;
}

export type ProjectStatus = 'planning' | 'production' | 'waiting_client' | 'approved' | 'published';
export type ServiceType = 'website' | 'app' | 'branding' | 'social_media' | 'seo';

export interface Project {
  id: string;
  name: string;
  clientId: string;
  serviceType: ServiceType;
  status: ProjectStatus;
  scope?: string;
  startDate: string;
  brandColor?: string;
  logo?: string;
  nextAction: string;
  lastActivity: string;
}

export interface Message {
  id: string;
  projectId: string;
  author: string;
  authorRole: UserRole;
  content: string;
  timestamp: string;
}

export interface File {
  id: string;
  projectId: string;
  name: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  type: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'revision';

export interface Approval {
  id: string;
  projectId: string;
  title: string;
  description: string;
  previewUrl: string;
  status: ApprovalStatus;
  createdAt: string;
  feedback?: string;
}

export interface Activity {
  id: string;
  projectId: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
}

// Mock data
export const mockUser: User = {
  id: '1',
  name: 'Admin Tunaweb',
  email: 'admin@tunaweb.com',
  role: 'admin',
};

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    businessName: 'Construtora Silva',
    email: 'joao@construtora.com',
    phone: '+55 11 98765-4321',
    notes: 'Cliente recorrente, preferência por comunicação por email',
  },
  {
    id: '2',
    name: 'Maria Santos',
    businessName: 'Café Artesanal',
    email: 'maria@cafeartes.com',
    phone: '+55 11 91234-5678',
  },
  {
    id: '3',
    name: 'Pedro Costa',
    businessName: 'Tech Startup Inc',
    email: 'pedro@techstartup.com',
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Institucional',
    clientId: '1',
    serviceType: 'website',
    status: 'waiting_client',
    scope: 'Desenvolvimento de website institucional com 5 páginas',
    startDate: '2026-03-15',
    brandColor: '#2563eb',
    nextAction: 'Aguardando envio de fotos e vídeos da obra',
    lastActivity: 'há 2 horas',
  },
  {
    id: '2',
    name: 'Identidade Visual',
    clientId: '2',
    serviceType: 'branding',
    status: 'production',
    scope: 'Criação de logo, paleta de cores e manual de marca',
    startDate: '2026-04-01',
    brandColor: '#8b5cf6',
    nextAction: 'Finalizar revisão da paleta de cores',
    lastActivity: 'há 1 dia',
  },
  {
    id: '3',
    name: 'Landing Page',
    clientId: '3',
    serviceType: 'website',
    status: 'approved',
    scope: 'Landing page para captação de leads',
    startDate: '2026-02-20',
    brandColor: '#10b981',
    nextAction: 'Preparar para publicação',
    lastActivity: 'há 3 dias',
  },
];

export const mockMessages: Message[] = [
  {
    id: '1',
    projectId: '1',
    author: 'Admin Tunaweb',
    authorRole: 'admin',
    content: 'Olá! Seguimos com o desenvolvimento do website. Precisamos das fotos e vídeos da última obra para incluir no portfólio.',
    timestamp: '2026-04-15T10:30:00',
  },
  {
    id: '2',
    projectId: '1',
    author: 'João Silva',
    authorRole: 'client',
    content: 'Perfeito! Vou separar o material e envio até amanhã.',
    timestamp: '2026-04-15T14:20:00',
  },
  {
    id: '3',
    projectId: '1',
    author: 'Admin Tunaweb',
    authorRole: 'admin',
    content: 'Excelente! Qualquer dúvida estou à disposição.',
    timestamp: '2026-04-15T14:25:00',
  },
];

export const mockFiles: File[] = [
  {
    id: '1',
    projectId: '1',
    name: 'logo-empresa.png',
    url: '#',
    uploadedBy: 'João Silva',
    uploadedAt: '2026-04-10T09:00:00',
    type: 'image/png',
  },
  {
    id: '2',
    projectId: '1',
    name: 'briefing.pdf',
    url: '#',
    uploadedBy: 'Admin Tunaweb',
    uploadedAt: '2026-04-08T16:30:00',
    type: 'application/pdf',
  },
];

export const mockApprovals: Approval[] = [
  {
    id: '1',
    projectId: '1',
    title: 'Layout da Home Page',
    description: 'Primeira versão do layout da página inicial',
    previewUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    status: 'pending',
    createdAt: '2026-04-14T10:00:00',
  },
  {
    id: '2',
    projectId: '1',
    title: 'Página de Serviços',
    description: 'Layout da página de serviços com galeria',
    previewUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    status: 'approved',
    createdAt: '2026-04-12T15:00:00',
  },
];

export const mockActivities: Activity[] = [
  {
    id: '1',
    projectId: '1',
    type: 'message',
    description: 'Nova mensagem enviada ao cliente',
    timestamp: '2026-04-15T10:30:00',
    user: 'Admin Tunaweb',
  },
  {
    id: '2',
    projectId: '2',
    type: 'file',
    description: 'Logo enviado pelo cliente',
    timestamp: '2026-04-14T16:45:00',
    user: 'Maria Santos',
  },
  {
    id: '3',
    projectId: '3',
    type: 'approval',
    description: 'Layout aprovado pelo cliente',
    timestamp: '2026-04-13T11:20:00',
    user: 'Pedro Costa',
  },
];
